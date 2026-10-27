import React from 'react';
import {View} from 'react-native';

/**
 * Clean, vector-sharp Eye / Eye-Off icon built with pure React Native geometry.
 * No external SVG or native font dependencies required.
 */
export const EyeIcon = ({visible, color = '#64748B'}) => {
  return (
    <View style={{width: 22, height: 16, alignItems: 'center', justifyContent: 'center'}}>
      {/* Outer Eye Outline */}
      <View
        style={{
          width: 20,
          height: 13,
          borderRadius: 7,
          borderWidth: 1.6,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
        }}>
        {/* Pupil */}
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: color,
          }}
        />
      </View>

      {/* Diagonal Slash for Hidden State */}
      {!visible && (
        <View
          style={{
            position: 'absolute',
            width: 21,
            height: 1.6,
            backgroundColor: color,
            transform: [{rotate: '-42deg'}],
            borderRadius: 1,
          }}
        />
      )}
    </View>
  );
};
