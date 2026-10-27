import {
  UserAgent,
  Registerer,
  RegistererState,
  Inviter,
  SessionState,
} from 'sip.js';
import InCallManager from 'react-native-incall-manager';
import {PermissionsAndroid, Platform} from 'react-native';
import {storage} from './storage';
import {ENV} from '../config/env';

class SipService {
  constructor() {
    this.userAgent = null;
    this.registerer = null;
    this.currentSession = null;
    this.registrationState = 'Disconnected'; // 'Disconnected' | 'Connecting' | 'Registered' | 'Error'
    this.callState = 'idle'; // 'idle' | 'calling' | 'ringing' | 'connected' | 'incoming'
    this.remoteNumber = '';
    this.listeners = new Set();
    this.isMuted = false;
    this.isOnHold = false;
    this.isSpeaker = false;
    this.currentConfig = null;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.warn('Listener error in SipService:', err);
      }
    });
  }

  getState() {
    return {
      registrationState: this.registrationState,
      callState: this.callState,
      remoteNumber: this.remoteNumber,
      isMuted: this.isMuted,
      isOnHold: this.isOnHold,
      isSpeaker: this.isSpeaker,
      extension: this.currentConfig?.pbx_username || '',
    };
  }

  async requestMicrophonePermission() {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ];
        if (Platform.Version >= 31) {
          permissions.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
        }
        const results = await PermissionsAndroid.requestMultiple(permissions);
        return results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Microphone permission error:', err);
        return false;
      }
    }
    return true;
  }

  /**
   * Initialize SIP UserAgent & Auto Register
   */
  async initUserAgent(config) {
    // Proactively request microphone permission so user is ready for audio calls
    this.requestMicrophonePermission().catch((e) => console.warn('Mic permission error:', e));

    await this.disconnect();

    this.currentConfig = config;
    const {pbx_username, pbx_password, pbx_wss, sip_server} = config;

    this.registrationState = 'Connecting';
    this.notify();

    try {
      const uri = UserAgent.makeURI(`sip:${pbx_username}@${sip_server}`);
      if (!uri) {
        throw new Error(`Format SIP URI tidak valid: sip:${pbx_username}@${sip_server}`);
      }

      this.userAgent = new UserAgent({
        uri,
        transportOptions: {
          server: pbx_wss,
          keepAliveInterval: ENV.SIP_KEEPALIVE_INTERVAL,
        },
        authorizationUsername: pbx_username,
        authorizationPassword: pbx_password,
        delegate: {
          onConnect: () => {
            console.log('[SIP] WebSocket Connected');
          },
          onDisconnect: (error) => {
            console.log('[SIP] WebSocket Disconnected', error);
            this.registrationState = 'Disconnected';
            this.notify();
          },
          onInvite: (invitation) => {
            this.handleIncomingCall(invitation);
          },
        },
        sessionDescriptionHandlerFactoryOptions: {
          peerConnectionConfiguration: {
            iceServers: [
              {urls: ENV.DEFAULT_STUN_SERVER},
              {urls: 'stun:stun1.l.google.com:19302'},
            ],
          },
        },
      });

      await this.userAgent.start();

      // Registerer
      this.registerer = new Registerer(this.userAgent);
      this.registerer.stateChange.addListener((newState) => {
        switch (newState) {
          case RegistererState.Registered:
            this.registrationState = 'Registered';
            break;
          case RegistererState.Unregistered:
          case RegistererState.Terminated:
            this.registrationState = 'Disconnected';
            break;
          default:
            this.registrationState = 'Connecting';
            break;
        }
        this.notify();
      });

      await this.registerer.register();
    } catch (error) {
      console.warn('[SIP] Registration init failed:', error);
      this.registrationState = 'Error';
      this.notify();
      throw error;
    }
  }

  /**
   * Outbound Call
   */
  async makeCall(targetNumber) {
    if (!this.userAgent || this.registrationState !== 'Registered') {
      throw new Error('SIP belum terdaftar ke PBX');
    }

    const hasMic = await this.requestMicrophonePermission();
    if (!hasMic) {
      throw new Error('Izin mikrofon ditolak');
    }

    if (!this.currentConfig) {
      try {
        const saved = await storage.getSavedLogin();
        if (saved?.pbxConfig) {
          this.currentConfig = saved.pbxConfig;
        }
      } catch (_) {}
    }

    const sip_server = this.currentConfig?.sip_server;
    if (!sip_server) {
      throw new Error('SIP Server belum terkonfigurasi');
    }

    const targetURI = UserAgent.makeURI(`sip:${targetNumber}@${sip_server}`);
    if (!targetURI) {
      throw new Error(`Target number URI tidak valid: ${targetNumber}`);
    }

    this.remoteNumber = targetNumber;
    this.callState = 'calling';
    this.isMuted = false;
    this.isOnHold = false;
    this.isSpeaker = false;
    this.notify();

    // Start InCallManager
    InCallManager.start({media: 'audio', ringback: '_BUNDLE_'});

    try {
      const inviter = new Inviter(this.userAgent, targetURI, {
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false,
          },
        },
      });

      this.currentSession = inviter;
      this.attachSessionListeners(inviter);

      await inviter.invite();
    } catch (err) {
      this.endCall();
      throw err;
    }
  }

  /**
   * Handle Inbound Call
   */
  handleIncomingCall(invitation) {
    if (this.currentSession) {
      // Busy
      invitation.reject();
      return;
    }

    this.currentSession = invitation;
    this.remoteNumber = invitation.remoteIdentity.uri.user || 'Unknown Caller';
    this.callState = 'incoming';
    this.notify();

    InCallManager.startRingtone('_DEFAULT_');
    this.attachSessionListeners(invitation);
  }

  /**
   * Answer Incoming Call
   */
  async answerCall() {
    if (!this.currentSession || this.callState !== 'incoming') return;

    const hasMic = await this.requestMicrophonePermission();
    if (!hasMic) {
      this.endCall();
      return;
    }

    InCallManager.stopRingtone();
    InCallManager.start({media: 'audio'});

    try {
      await this.currentSession.accept({
        sessionDescriptionHandlerOptions: {
          constraints: {audio: true, video: false},
        },
      });
    } catch (e) {
      console.warn('Answer call error:', e);
      this.endCall();
    }
  }

  /**
   * Reject / End Call
   */
  async endCall() {
    InCallManager.stopRingback();
    InCallManager.stopRingtone();
    InCallManager.stop();

    if (this.currentSession) {
      try {
        switch (this.currentSession.state) {
          case SessionState.Initial:
          case SessionState.Establishing:
            if (this.currentSession instanceof Inviter) {
              await this.currentSession.cancel();
            } else {
              await this.currentSession.reject();
            }
            break;
          case SessionState.Established:
            await this.currentSession.bye();
            break;
          default:
            break;
        }
      } catch (e) {
        console.warn('Error while ending session:', e);
      }
      this.currentSession = null;
    }

    this.callState = 'idle';
    this.remoteNumber = '';
    this.isMuted = false;
    this.isOnHold = false;
    this.isSpeaker = false;
    this.notify();
  }

  attachSessionListeners(session) {
    session.stateChange.addListener((newState) => {
      console.log('[SIP] Call State Change:', newState);
      switch (newState) {
        case SessionState.Establishing:
          this.callState = 'ringing';
          break;
        case SessionState.Established:
          InCallManager.stopRingback();
          InCallManager.stopRingtone();
          InCallManager.start({media: 'audio'});
          InCallManager.setSpeakerphoneOn(this.isSpeaker);
          this.callState = 'connected';
          break;
        case SessionState.Terminated:
          this.endCall();
          break;
        default:
          break;
      }
      this.notify();
    });
  }

  /**
   * Send DTMF tone (0-9, *, #)
   */
  sendDTMF(tone) {
    if (this.currentSession && this.callState === 'connected') {
      try {
        this.currentSession.sendDTMF(tone);
      } catch (err) {
        console.warn('Send DTMF error:', err);
      }
    }
  }

  /**
   * Toggle Mute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    InCallManager.setMicrophoneMute(this.isMuted);

    try {
      const pc = this.currentSession?.sessionDescriptionHandler?.peerConnection;
      if (pc) {
        pc.getSenders().forEach((sender) => {
          if (sender.track && sender.track.kind === 'audio') {
            sender.track.enabled = !this.isMuted && !this.isOnHold;
          }
        });
      }
    } catch (e) {
      console.warn('Track mute toggle error:', e);
    }

    this.notify();
  }

  /**
   * Toggle Speakerphone
   */
  toggleSpeaker() {
    this.isSpeaker = !this.isSpeaker;
    InCallManager.setSpeakerphoneOn(this.isSpeaker);
    this.notify();
  }

  /**
   * Toggle Hold
   */
  async toggleHold() {
    if (!this.currentSession || this.callState !== 'connected') return;

    this.isOnHold = !this.isOnHold;
    InCallManager.setMicrophoneMute(this.isOnHold || this.isMuted);

    try {
      const pc = this.currentSession?.sessionDescriptionHandler?.peerConnection;
      if (pc) {
        pc.getSenders().forEach((sender) => {
          if (sender.track && sender.track.kind === 'audio') {
            sender.track.enabled = !this.isOnHold && !this.isMuted;
          }
        });
      }
    } catch (e) {
      console.warn('Track hold toggle error:', e);
    }

    this.notify();
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(clearConfig = false) {
    await this.endCall();

    if (this.registerer) {
      try {
        await this.registerer.unregister();
      } catch (_) {}
      this.registerer = null;
    }

    if (this.userAgent) {
      try {
        await this.userAgent.stop();
      } catch (_) {}
      this.userAgent = null;
    }

    this.registrationState = 'Disconnected';
    if (clearConfig) {
      this.currentConfig = null;
    }
    this.notify();
  }
}

export const sipService = new SipService();
