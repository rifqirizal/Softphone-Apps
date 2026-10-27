import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from '../theme/colors';
import {sipService} from '../services/sipService';
import {Keypad} from '../components/Keypad';

export const InCallModal = ({visible, callState, remoteNumber, isMuted, isOnHold, isSpeaker}) => {
  const [duration, setDuration] = useState(0);
  const [showDtmfKeypad, setShowDtmfKeypad] = useState(false);

  useEffect(() => {
    let interval = null;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
      setShowDtmfKeypad(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState]);

  const formatDuration = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const getStatusText = () => {
    switch (callState) {
      case 'calling':
        return 'Calling...';
      case 'ringing':
        return 'Ringing...';
      case 'connected':
        return isOnHold ? 'Call On Hold' : formatDuration(duration);
      default:
        return 'Call Ending...';
    }
  };

  const handleDtmfPress = (tone) => {
    sipService.sendDTMF(tone);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <SafeAreaView className="flex-1 bg-slate-900 justify-between py-6">
        {/* Contact info header */}
        <View className="items-center mt-9">
          <View className="w-[84px] h-[84px] rounded-full bg-slate-800 border-2 border-slate-700 items-center justify-center mb-4">
            <Text className="text-2xl font-bold text-sky-400">
              {remoteNumber ? remoteNumber.slice(0, 2).toUpperCase() : '📞'}
            </Text>
          </View>
          <Text className="text-2xl font-bold text-slate-50 mb-1.5">
            {remoteNumber || 'Panggilan'}
          </Text>
          <Text
            className={`text-base ${
              isOnHold ? 'text-amber-400 font-semibold' : 'text-slate-400'
            }`}>
            {getStatusText()}
          </Text>
        </View>

        {/* DTMF Keypad Overlay or Control Grid */}
        <View className="flex-1 justify-center items-center px-6">
          {showDtmfKeypad ? (
            <View className="w-full items-center">
              <Keypad onPressDigit={handleDtmfPress} />
              <TouchableOpacity
                className="mt-3 py-2 px-4 bg-slate-800 rounded-lg active:bg-slate-700"
                onPress={() => setShowDtmfKeypad(false)}>
                <Text className="text-sky-400 text-[13px] font-semibold">
                  Sembunyikan Keypad
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-around w-full max-w-[320px]">
              {/* Mute */}
              <TouchableOpacity
                className={`w-[72px] h-[72px] rounded-full border items-center justify-center m-3.5 ${
                  isMuted
                    ? 'bg-sky-500 border-sky-500'
                    : 'bg-slate-800 border-slate-700'
                }`}
                onPress={() => sipService.toggleMute()}>
                <Text className="text-[22px] mb-0.5">{isMuted ? '🔇' : '🎙️'}</Text>
                <Text className="text-[11px] text-slate-400 font-medium">
                  {isMuted ? 'Unmute' : 'Mute'}
                </Text>
              </TouchableOpacity>

              {/* Keypad / DTMF */}
              <TouchableOpacity
                className="w-[72px] h-[72px] rounded-full bg-slate-800 border border-slate-700 items-center justify-center m-3.5"
                onPress={() => setShowDtmfKeypad(true)}>
                <Text className="text-[22px] mb-0.5">🔢</Text>
                <Text className="text-[11px] text-slate-400 font-medium">Keypad</Text>
              </TouchableOpacity>

              {/* Speaker */}
              <TouchableOpacity
                className={`w-[72px] h-[72px] rounded-full border items-center justify-center m-3.5 ${
                  isSpeaker
                    ? 'bg-sky-500 border-sky-500'
                    : 'bg-slate-800 border-slate-700'
                }`}
                onPress={() => sipService.toggleSpeaker()}>
                <Text className="text-[22px] mb-0.5">{isSpeaker ? '🔊' : '🔈'}</Text>
                <Text className="text-[11px] text-slate-400 font-medium">Speaker</Text>
              </TouchableOpacity>

              {/* Hold */}
              <TouchableOpacity
                className={`w-[72px] h-[72px] rounded-full border items-center justify-center m-3.5 ${
                  isOnHold
                    ? 'bg-sky-500 border-sky-500'
                    : 'bg-slate-800 border-slate-700'
                }`}
                onPress={() => sipService.toggleHold()}>
                <Text className="text-[22px] mb-0.5">{isOnHold ? '▶️' : '⏸️'}</Text>
                <Text className="text-[11px] text-slate-400 font-medium">
                  {isOnHold ? 'Resume' : 'Hold'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* End Call Button */}
        <View className="items-center mb-6">
          <TouchableOpacity
            className="w-[72px] h-[72px] rounded-full bg-red-500 items-center justify-center shadow-lg active:bg-red-600"
            activeOpacity={0.8}
            onPress={() => sipService.endCall()}>
            <Text className="text-3xl">📵</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};
