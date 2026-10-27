import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import {colors} from '../theme/colors';
import {api} from '../services/api';
import {storage} from '../services/storage';
import {sipService} from '../services/sipService';
import {EyeIcon} from '../components/EyeIcon';
import {ENV} from '../config/env';

export const LoginScreen = ({onLoginSuccess}) => {
  // Step 1: Akun Pengguna, Step 2: Konfigurasi PBX
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 Fields
  const [host, setHost] = useState('https://');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFetchingConfig, setIsFetchingConfig] = useState(false);

  // Step 2 Fields
  const [pbxWss, setPbxWss] = useState('');
  const [sipServer, setSipServer] = useState('');
  const [pbxUsername, setPbxUsername] = useState('');
  const [pbxPassword, setPbxPassword] = useState('');
  const [showPbxPassword, setShowPbxPassword] = useState(false);
  const [isConnectingSip, setIsConnectingSip] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Load previously saved login info
    storage.getSavedLogin().then((saved) => {
      if (saved.host) setHost(saved.host);
      if (saved.username) setUsername(saved.username);
      if (saved.pbxConfig) {
        setPbxWss(saved.pbxConfig.pbx_wss || '');
        setSipServer(saved.pbxConfig.sip_server || '');
        setPbxUsername(saved.pbxConfig.pbx_username || '');
        setPbxPassword(saved.pbxConfig.pbx_password || '');
      }
    });
  }, []);

  // Step 1: Fetch config and advance to Step 2
  const handleProceed = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!host.trim() || host.trim() === 'https://' || host.trim() === 'http://') {
      setErrorMessage('Masukkan alamat Host URL yang valid');
      return;
    }
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Username dan Password wajib diisi');
      return;
    }

    setIsFetchingConfig(true);

    try {
      const authData = await api.login(host.trim(), username.trim(), password.trim());
      const pbxConfig = await api.fetchPBXConfig(host.trim(), authData.token, authData.userId);

      setPbxWss(pbxConfig.pbx_wss || '');
      setSipServer(pbxConfig.sip_server || '');
      setPbxUsername(pbxConfig.pbx_username || '');
      setPbxPassword(pbxConfig.pbx_password || '');

      await storage.saveLoginData({
        host: host.trim(),
        username: username.trim(),
        authData,
        pbxConfig,
      });

      setSuccessMessage('Kredensial PBX berhasil disinkronkan');
      setCurrentStep(2);
    } catch (err) {
      console.warn('Login / Fetch PBX error:', err);
      setErrorMessage(err.message || 'Gagal mengambil konfigurasi dari server');
    } finally {
      setIsFetchingConfig(false);
    }
  };

  // Step 2: Connect to SIP
  const handleConnectPBX = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!pbxWss.trim()) {
      setErrorMessage('WebSocket URL (WSS) tidak boleh kosong');
      return;
    }
    if (!sipServer.trim()) {
      setErrorMessage('SIP Server / Domain tidak boleh kosong');
      return;
    }
    if (!pbxUsername.trim() || !pbxPassword.trim()) {
      setErrorMessage('Ekstensi dan Password PBX tidak boleh kosong');
      return;
    }

    setIsConnectingSip(true);

    const config = {
      pbx_wss: pbxWss.trim(),
      sip_server: sipServer.trim(),
      pbx_username: pbxUsername.trim(),
      pbx_password: pbxPassword.trim(),
    };

    try {
      await storage.saveLoginData({
        host: host.trim(),
        username: username.trim(),
        pbxConfig: config,
      });

      await sipService.initUserAgent(config);

      if (onLoginSuccess) {
        onLoginSuccess({pbxConfig: config});
      }
    } catch (err) {
      console.warn('SIP Connect error:', err);
      setErrorMessage(err.message || 'Gagal terhubung ke WebSocket PBX. Periksa WSS URL atau jaringan.');
    } finally {
      setIsConnectingSip(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 22,
          paddingTop: 36,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled">
        
        {/* Brand App Header */}
        <View className="items-center mb-6">
          <View className="w-16 h-16 rounded-2xl bg-white shadow-md shadow-sky-600/20 p-1 mb-3 items-center justify-center border border-slate-100">
            <Image
              source={require('../assets/logo.png')}
              className="w-full h-full rounded-xl"
              resizeMode="contain"
            />
          </View>
          <Text className="text-2xl font-bold text-slate-900 tracking-tight">
            Softphone Apps
          </Text>
          <Text className="text-[12px] text-slate-500 mt-1 text-center">
            A softphone client for WebRTC and SIP.js call testing
          </Text>
        </View>

        {/* Dribbble-Style Segmented Navigation (Pill Tabs) */}
        <View className="flex-row p-1 bg-slate-200/80 rounded-xl mb-5">
          <TouchableOpacity
            onPress={() => {
              setErrorMessage('');
              setCurrentStep(1);
            }}
            className={`flex-1 py-2.5 rounded-lg items-center ${
              currentStep === 1 ? 'bg-white shadow-sm' : ''
            }`}
            activeOpacity={0.8}>
            <Text
              className={`text-[13px] font-semibold ${
                currentStep === 1 ? 'text-slate-900' : 'text-slate-500'
              }`}>
              1. Akun Pengguna
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (!pbxUsername && !pbxWss) {
                setErrorMessage('Silakan login dengan Akun Pengguna terlebih dahulu');
                return;
              }
              setErrorMessage('');
              setCurrentStep(2);
            }}
            disabled={!pbxUsername && !pbxWss}
            className={`flex-1 py-2.5 rounded-lg items-center ${
              currentStep === 2 ? 'bg-white shadow-sm' : ''
            } ${!pbxUsername && !pbxWss ? 'opacity-40' : ''}`}
            activeOpacity={0.8}>
            <Text
              className={`text-[13px] font-semibold ${
                currentStep === 2 ? 'text-slate-900' : 'text-slate-500'
              }`}>
              2. Konfigurasi SIP
            </Text>
          </TouchableOpacity>
        </View>

        {/* Global Feedback Banner */}
        {errorMessage ? (
          <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <Text className="text-red-600 text-[13px] text-center font-medium leading-5">
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {successMessage ? (
          <View className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4">
            <Text className="text-emerald-700 text-[13px] text-center font-medium leading-5">
              {successMessage}
            </Text>
          </View>
        ) : null}

        {/* Card Form */}
        <View className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm shadow-slate-200/60 mb-5">
          {/* ================= STEP 1: LOGIN HOST & KREDENSIAL ================= */}
          {currentStep === 1 ? (
            <View>
              {/* Host URL */}
              <View className="mb-4">
                <Text className="text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                  Host URL
                </Text>
                <TextInput
                  className="bg-slate-50/80 rounded-xl border border-slate-200 text-slate-900 px-3.5 py-2.5 text-[14px]"
                  placeholder="https://"
                  placeholderTextColor={colors.textMuted}
                  value={host}
                  onChangeText={setHost}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>

              {/* Username */}
              <View className="mb-4">
                <Text className="text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                  Username
                </Text>
                <TextInput
                  className="bg-slate-50/80 rounded-xl border border-slate-200 text-slate-900 px-3.5 py-2.5 text-[14px]"
                  placeholder="agent_username"
                  placeholderTextColor={colors.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password */}
              <View className="mb-5">
                <Text className="text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                  Password
                </Text>
                <View className="flex-row items-center bg-slate-50/80 rounded-xl border border-slate-200 px-3.5">
                  <TextInput
                    className="flex-1 text-slate-900 py-2.5 text-[14px]"
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    className="p-2 -mr-1"
                    activeOpacity={0.6}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <EyeIcon visible={showPassword} color={showPassword ? '#0284C7' : '#94A3B8'} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Button: Lanjutkan */}
              <TouchableOpacity
                className={`bg-sky-600 rounded-xl h-12 items-center justify-center shadow-sm ${
                  isFetchingConfig ? 'opacity-70' : 'active:bg-sky-700'
                }`}
                activeOpacity={0.85}
                onPress={handleProceed}
                disabled={isFetchingConfig}>
                {isFetchingConfig ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text className="text-white text-[14px] font-semibold ml-2">
                      Menghubungi server...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white text-[15px] font-semibold tracking-wide">
                    Lanjutkan
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* ================= STEP 2: KONFIGURASI PBX & SIP ================= */
            <View>
              {/* WebSocket URL */}
              <View className="mb-3.5">
                <Text className="text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                  WebSocket Server (WSS URL)
                </Text>
                <TextInput
                  className="bg-slate-50/80 rounded-xl border border-slate-200 text-slate-900 px-3.5 py-2.5 text-[14px]"
                  placeholder={ENV.DEFAULT_PBX_WSS}
                  placeholderTextColor={colors.textMuted}
                  value={pbxWss}
                  onChangeText={setPbxWss}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* SIP Server / Domain */}
              <View className="mb-3.5">
                <Text className="text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                  SIP Server / Domain
                </Text>
                <TextInput
                  className="bg-slate-50/80 rounded-xl border border-slate-200 text-slate-900 px-3.5 py-2.5 text-[14px]"
                  placeholder={ENV.DEFAULT_SIP_SERVER}
                  placeholderTextColor={colors.textMuted}
                  value={sipServer}
                  onChangeText={setSipServer}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* PBX Username / Extension */}
              <View className="mb-3.5">
                <Text className="text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                  Ekstensi (PBX Username)
                </Text>
                <TextInput
                  className="bg-slate-50/80 rounded-xl border border-slate-200 text-slate-900 px-3.5 py-2.5 text-[14px]"
                  placeholder="1001"
                  placeholderTextColor={colors.textMuted}
                  value={pbxUsername}
                  onChangeText={setPbxUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="numeric"
                />
              </View>

              {/* PBX Password with Eye */}
              <View className="mb-5">
                <Text className="text-[12px] font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                  Password PBX / SIP
                </Text>
                <View className="flex-row items-center bg-slate-50/80 rounded-xl border border-slate-200 px-3.5">
                  <TextInput
                    className="flex-1 text-slate-900 py-2.5 text-[14px]"
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    value={pbxPassword}
                    onChangeText={setPbxPassword}
                    secureTextEntry={!showPbxPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPbxPassword((prev) => !prev)}
                    className="p-2 -mr-1"
                    activeOpacity={0.6}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <EyeIcon visible={showPbxPassword} color={showPbxPassword ? '#0284C7' : '#94A3B8'} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Connect Button: Hubungkan */}
              <TouchableOpacity
                className={`bg-sky-600 rounded-xl h-12 items-center justify-center shadow-sm ${
                  isConnectingSip ? 'opacity-70' : 'active:bg-sky-700'
                }`}
                activeOpacity={0.85}
                onPress={handleConnectPBX}
                disabled={isConnectingSip}>
                {isConnectingSip ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white text-[15px] font-semibold tracking-wide">
                    Hubungkan
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer */}
        <Text className="text-[11px] font-medium text-slate-400 text-center mt-2">
          Softphone Apps
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
