import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  HOST: '@softphone_host',
  USERNAME: '@softphone_username',
  AUTH_DATA: '@softphone_auth_data',
  PBX_CONFIG: '@softphone_pbx_config',
};

export const storage = {
  async saveLoginData({host, username, authData, pbxConfig}) {
    try {
      if (host) await AsyncStorage.setItem(STORAGE_KEYS.HOST, host);
      if (username) await AsyncStorage.setItem(STORAGE_KEYS.USERNAME, username);
      if (authData) await AsyncStorage.setItem(STORAGE_KEYS.AUTH_DATA, JSON.stringify(authData));
      if (pbxConfig) await AsyncStorage.setItem(STORAGE_KEYS.PBX_CONFIG, JSON.stringify(pbxConfig));
    } catch (e) {
      console.warn('Error saving to storage:', e);
    }
  },

  async getSavedLogin() {
    try {
      const host = (await AsyncStorage.getItem(STORAGE_KEYS.HOST)) || (await AsyncStorage.getItem('@synergix_host'));
      const username = (await AsyncStorage.getItem(STORAGE_KEYS.USERNAME)) || (await AsyncStorage.getItem('@synergix_username'));
      const authDataStr = (await AsyncStorage.getItem(STORAGE_KEYS.AUTH_DATA)) || (await AsyncStorage.getItem('@synergix_auth_data'));
      const pbxConfigStr = (await AsyncStorage.getItem(STORAGE_KEYS.PBX_CONFIG)) || (await AsyncStorage.getItem('@synergix_pbx_config'));

      return {
        host: host || '',
        username: username || '',
        authData: authDataStr ? JSON.parse(authDataStr) : null,
        pbxConfig: pbxConfigStr ? JSON.parse(pbxConfigStr) : null,
      };
    } catch (e) {
      console.warn('Error getting saved login:', e);
      return {
        host: '',
        username: '',
        authData: null,
        pbxConfig: null,
      };
    }
  },

  async clearAll() {
    try {
      await AsyncStorage.clear();
      console.log('[Storage] All local storage cleared successfully');
    } catch (e) {
      console.warn('Error clearing storage:', e);
    }
  },
};
