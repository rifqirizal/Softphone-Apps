import './global.css';
import React, {useState, useEffect} from 'react';
import {View, ActivityIndicator, StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {colors} from './src/theme/colors';
import {LoginScreen} from './src/screens/LoginScreen';
import {DialerScreen} from './src/screens/DialerScreen';
import {InCallModal} from './src/screens/InCallModal';
import {IncomingCallModal} from './src/screens/IncomingCallModal';
import {sipService} from './src/services/sipService';
import {storage} from './src/services/storage';
import {SplashScreen} from './src/components/SplashScreen';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sipState, setSipState] = useState(sipService.getState());

  useEffect(() => {
    // Subscribe to SIP events (registration, calls, mute, hold, etc.)
    const unsubscribe = sipService.subscribe((newState) => {
      setSipState(newState);
    });

    return () => {
      unsubscribe();
      sipService.disconnect();
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (isInitializing) {
    return (
      <SafeAreaProvider>
        <SplashScreen onFinish={() => setIsInitializing(false)} />
      </SafeAreaProvider>
    );
  }

  const isCallActive =
    sipState.callState === 'calling' ||
    sipState.callState === 'ringing' ||
    sipState.callState === 'connected';

  const isIncoming = sipState.callState === 'incoming';

  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-slate-900">
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />

        {isAuthenticated ? (
          <DialerScreen
            sipState={sipState}
            onLogout={handleLogout}
          />
        ) : (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        )}

        {/* In-Call Active Sheet / Modal */}
        <InCallModal
          visible={isCallActive}
          callState={sipState.callState}
          remoteNumber={sipState.remoteNumber}
          isMuted={sipState.isMuted}
          isOnHold={sipState.isOnHold}
          isSpeaker={sipState.isSpeaker}
        />

        {/* Incoming Call Overlay */}
        <IncomingCallModal
          visible={isIncoming}
          remoteNumber={sipState.remoteNumber}
        />
      </View>
    </SafeAreaProvider>
  );
}
