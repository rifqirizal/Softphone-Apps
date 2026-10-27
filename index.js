/**
 * @format
 */
import {registerGlobals} from 'react-native-webrtc';

// Register WebRTC globals (RTCPeerConnection, navigator.mediaDevices, etc.) for sip.js
registerGlobals();

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
if (appName !== 'SynergixSupport') {
  AppRegistry.registerComponent('SynergixSupport', () => App);
}
if (appName !== 'SynergixWebphone') {
  AppRegistry.registerComponent('SynergixWebphone', () => App);
}
