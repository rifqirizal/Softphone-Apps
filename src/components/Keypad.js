import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';

const KEYPAD_DATA = [
  [{digit: '1', letters: ''}, {digit: '2', letters: 'ABC'}, {digit: '3', letters: 'DEF'}],
  [{digit: '4', letters: 'GHI'}, {digit: '5', letters: 'JKL'}, {digit: '6', letters: 'MNO'}],
  [{digit: '7', letters: 'PQRS'}, {digit: '8', letters: 'TUV'}, {digit: '9', letters: 'WXYZ'}],
  [{digit: '*', letters: ''}, {digit: '0', letters: '+'}, {digit: '#', letters: ''}],
];

export const Keypad = ({onPressDigit, onLongPressZero}) => {
  return (
    <View className="w-full max-w-[340px] px-3 items-center justify-center self-center">
      {KEYPAD_DATA.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} className="flex-row justify-around w-full mb-3.5">
          {row.map((item) => (
            <TouchableOpacity
              key={item.digit}
              className="w-[72px] h-[72px] rounded-full bg-white border border-slate-200 shadow-sm items-center justify-center active:bg-slate-100"
              activeOpacity={0.65}
              onPress={() => onPressDigit(item.digit)}
              onLongPress={() => {
                if (item.digit === '0' && onLongPressZero) {
                  onLongPressZero();
                }
              }}
              delayLongPress={400}>
              <Text className="text-[28px] font-semibold text-slate-900 leading-8">
                {item.digit}
              </Text>
              {item.letters ? (
                <Text className="text-[10px] font-bold text-slate-400 tracking-widest -mt-0.5">
                  {item.letters}
                </Text>
              ) : (
                <View className="h-2.5" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
};
