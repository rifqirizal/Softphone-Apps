import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from '../theme/colors';
import {Keypad} from '../components/Keypad';
import {sipService} from '../services/sipService';
import {storage} from '../services/storage';
import {api} from '../services/api';

export const DialerScreen = ({sipState, onLogout}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const {registrationState, extension} = sipState;

  const handleDigitPress = (digit) => {
    setPhoneNumber((prev) => prev + digit);
  };

  const handleLongPressZero = () => {
    setPhoneNumber((prev) => prev + '+');
  };

  const handleBackspace = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleClearAll = () => {
    setPhoneNumber('');
  };

  const handleCall = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Perhatian', 'Masukkan nomor tujuan terlebih dahulu.');
      return;
    }

    try {
      await sipService.makeCall(phoneNumber.trim());
    } catch (err) {
      Alert.alert('Panggilan Gagal', err.message || 'Tidak dapat melakukan panggilan');
    }
  };

  const handleLogoutPress = () => {
    Alert.alert('Konfirmasi Logout', 'Apakah Anda yakin ingin logout dan menghapus sesi dari aplikasi?', [
      {text: 'Batal', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            const saved = await storage.getSavedLogin();
            const host = saved?.host || '';
            const token = saved?.authData?.token || '';
            const ext = extension || saved?.pbxConfig?.pbx_username || '';

            // Panggil API logout dengan payload extension
            await api.logout(host, token, ext);
          } catch (err) {
            console.warn('[Logout] API error:', err);
          } finally {
            // Putuskan koneksi SIP WebRTC
            await sipService.disconnect(true);

            // Hapus semua data localstorage di aplikasi
            await storage.clearAll();

            setIsLoggingOut(false);
            if (onLogout) onLogout();
          }
        },
      },
    ]);
  };

  const getStatusBadge = () => {
    switch (registrationState) {
      case 'Registered':
        return {
          text: `Ready (Ext: ${extension || 'PBX'})`,
          badgeClass: 'bg-emerald-50 border-emerald-300',
          dotClass: 'bg-emerald-500',
          textClass: 'text-emerald-700',
        };
      case 'Connecting':
        return {
          text: 'Connecting...',
          badgeClass: 'bg-amber-50 border-amber-300',
          dotClass: 'bg-amber-500',
          textClass: 'text-amber-700',
        };
      default:
        return {
          text: 'Disconnected',
          badgeClass: 'bg-red-50 border-red-200',
          dotClass: 'bg-red-500',
          textClass: 'text-red-700',
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <SafeAreaView className="flex-1 bg-slate-50 justify-between py-3">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Bar with Registration Status Chip & Logout */}
      <View className="flex-row justify-between items-center px-5 pt-2">
        <View className={`flex-row items-center px-3.5 py-1.5 rounded-full border shadow-sm ${badge.badgeClass}`}>
          <View className={`w-2 h-2 rounded-full mr-2 ${badge.dotClass}`} />
          <Text className={`text-xs font-bold ${badge.textClass}`}>
            {badge.text}
          </Text>
        </View>

        <TouchableOpacity
          className="flex-row items-center px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 active:bg-red-100"
          activeOpacity={0.7}
          disabled={isLoggingOut}
          onPress={handleLogoutPress}>
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <Text className="text-red-600 text-[12px] font-bold">Logout</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Phone Number Display Area */}
      <View className="flex-row items-center justify-center px-7 min-h-[64px]">
        <Text
          className={`flex-1 font-bold text-slate-900 text-center tracking-widest ${
            phoneNumber.length > 12 ? 'text-2xl' : 'text-3xl'
          }`}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {phoneNumber || ' '}
        </Text>
        {phoneNumber ? (
          <TouchableOpacity
            className="p-2 absolute right-5"
            onPress={handleBackspace}
            onLongPress={handleClearAll}
            activeOpacity={0.6}>
            <Text className="text-2xl text-slate-400">⌫</Text>
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
      </View>

      {/* Keypad Grid 3x4 */}
      <View className="flex-1 justify-center">
        <Keypad
          onPressDigit={handleDigitPress}
          onLongPressZero={handleLongPressZero}
        />
      </View>

      {/* Bottom Action Bar (Call Button) */}
      <View className="flex-row items-center justify-around px-8 mb-5">
        <View className="w-[72px]" />
        <TouchableOpacity
          className="w-[72px] h-[72px] rounded-full bg-emerald-500 items-center justify-center shadow-md active:bg-emerald-600"
          activeOpacity={0.8}
          onPress={handleCall}>
          <Text className="text-3xl">📞</Text>
        </TouchableOpacity>
        <View className="w-[72px]" />
      </View>
    </SafeAreaView>
  );
};
