import React from 'react';
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

export const IncomingCallModal = ({visible, remoteNumber}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <SafeAreaView className="flex-1 bg-slate-900 justify-between py-12 px-8">
        <View className="items-center mt-10">
          <Text className="text-sm text-sky-400 font-semibold tracking-wider mb-6 uppercase">
            Panggilan Masuk
          </Text>
          <View className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 items-center justify-center mb-5">
            <Text className="text-4xl">📞</Text>
          </View>
          <Text className="text-3xl font-bold text-slate-50 mb-2">
            {remoteNumber || 'Unknown Caller'}
          </Text>
          <Text className="text-base text-slate-400">Ringing...</Text>
        </View>

        <View className="flex-row justify-around w-full mb-8">
          {/* Reject */}
          <View className="items-center">
            <TouchableOpacity
              className="w-[72px] h-[72px] rounded-full bg-red-500 items-center justify-center active:bg-red-600"
              activeOpacity={0.8}
              onPress={() => sipService.endCall()}>
              <Text className="text-3xl">📵</Text>
            </TouchableOpacity>
            <Text className="mt-2 text-xs text-slate-50 font-medium">Tolak</Text>
          </View>

          {/* Answer */}
          <View className="items-center">
            <TouchableOpacity
              className="w-[72px] h-[72px] rounded-full bg-emerald-500 items-center justify-center active:bg-emerald-600"
              activeOpacity={0.8}
              onPress={() => sipService.answerCall()}>
              <Text className="text-3xl">📞</Text>
            </TouchableOpacity>
            <Text className="mt-2 text-xs text-slate-50 font-medium">Jawab</Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};
