import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  StatusBar,
  ActivityIndicator,
} from 'react-native';

export const SplashScreen = ({onFinish}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // 1. Entrance animation (fade in & subtle scale up)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Minimum splash display duration (1.6s) before transitioning smoothly
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 1600);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, onFinish]);

  return (
    <View className="flex-1 bg-slate-50 justify-between items-center py-12 px-6">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top spacer */}
      <View className="h-6" />

      {/* Center Brand & Logo Area */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{scale: scaleAnim}],
          alignItems: 'center',
        }}>
        {/* Softphone App Icon */}
        <View className="w-28 h-28 rounded-3xl shadow-lg shadow-sky-600/25 bg-white p-1 mb-5 items-center justify-center">
          <Image
            source={require('../assets/logo.png')}
            className="w-full h-full rounded-2xl"
            resizeMode="contain"
          />
        </View>

        {/* Brand Title */}
        <View className="bg-sky-50 border border-sky-200 px-3 py-1 rounded-full mb-2">
          <Text className="text-sky-700 font-bold text-xs tracking-wider">
            SOFTPHONE APPS
          </Text>
        </View>
        <Text className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Softphone Apps
        </Text>
        <Text className="text-xs text-slate-500 mt-1 tracking-wide text-center">
          A softphone client for WebRTC and SIP.js call testing
        </Text>

        <View className="mt-8">
          <ActivityIndicator size="small" color="#0284C7" />
        </View>
      </Animated.View>

      {/* Bottom Footer Credit */}
      <Animated.View style={{opacity: fadeAnim}} className="items-center">
        <Text className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
          Softphone Apps
        </Text>
        <Text className="text-[10px] text-slate-400 mt-0.5">
          Version 1.0.0 · WebRTC & SIP Client
        </Text>
      </Animated.View>
    </View>
  );
};
