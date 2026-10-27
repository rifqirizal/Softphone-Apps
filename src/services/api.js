/**
 * API Service for Softphone Authentication and PBX Configuration fetching
 */
import {ENV} from '../config/env';

async function fetchWithTimeout(url, options = {}, timeoutMs = ENV.API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Koneksi ke host timeout (${Math.round(timeoutMs / 1000)} detik). Pastikan VPN aktif atau alamat host benar.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  /**
   * Endpoint 1: Login & Token Generation
   * POST {host}/api-backend/token
   */
  async login(host, username, password) {
    const cleanHost = host.replace(/\/+$/, '');
    const url = `${cleanHost}/api-backend/token`;

    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    }, ENV.API_TIMEOUT_MS);

    if (!response.ok) {
      let errorMsg = `Login gagal (${response.status})`;
      try {
        const errJson = await response.json();
        if (errJson.message) errorMsg = errJson.message;
        else if (errJson.detail) errorMsg = errJson.detail;
        else if (errJson.error) errorMsg = errJson.error;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    const data = await response.json();
    console.log('[API] Auth Response payload:', JSON.stringify(data));

    // Handle case where server responds with 200 OK but body indicates failure
    if (data.success === false || data.status === false || data.status === 'error') {
      throw new Error(data.message || data.error || data.detail || 'Autentikasi ditolak oleh server');
    }

    // Flexible token extraction (token, access_token, accessToken, or wrapped inside data)
    const token =
      data.token ||
      data.access_token ||
      data.accessToken ||
      data.data?.token ||
      data.data?.access_token ||
      data.data?.accessToken;

    const userId =
      data.id ||
      data.userId ||
      data.user_id ||
      data.data?.id ||
      data.data?.userId ||
      data.data?.user_id;

    if (!token) {
      console.warn('[API] Token missing in response:', data);
      const receivedKeys = Object.keys(data).join(', ');
      const fallbackMsg = data.message || data.error || `Token tidak ditemukan dalam respon autentikasi (Keys diterima: [${receivedKeys}])`;
      throw new Error(fallbackMsg);
    }

    return {
      token,
      userId,
    };
  },

  /**
   * Endpoint 2: Fetch PBX Configuration
   * GET {host}/api-backend/users/{id}
   */
  async fetchPBXConfig(host, token, userId) {
    const cleanHost = host.replace(/\/+$/, '');
    const url = `${cleanHost}/api-backend/users/${userId}`;

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }, ENV.API_TIMEOUT_MS);

    if (!response.ok) {
      let errorMsg = `Gagal mengambil konfigurasi PBX (${response.status})`;
      try {
        const errJson = await response.json();
        if (errJson.message) errorMsg = errJson.message;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    const userData = await response.json();
    console.log('[API] User Profile payload:', JSON.stringify(userData));

    // Support both direct object and nested data wrapper
    const profile = userData.data && typeof userData.data === 'object' ? userData.data : userData;

    // Ekstraksi 4 key spesifik sesuai PRD Section 3.2
    const pbx_username = profile.pbx_username || '';
    const pbx_password = profile.pbx_password || '';
    const pbx_wss = profile.pbx_wss || '';
    const sip_server = profile.sip_server || '';

    if (!pbx_username || !pbx_password || !pbx_wss || !sip_server) {
      console.warn('PBX config keys missing in user profile:', {
        pbx_username: !!pbx_username,
        pbx_password: !!pbx_password,
        pbx_wss: !!pbx_wss,
        sip_server: !!sip_server,
      });
      // Fallback atau throw error jika tidak lengkap
      if (!pbx_username || !pbx_wss) {
        throw new Error('Profil user tidak memiliki konfigurasi PBX (ekstensi/WSS kosong)');
      }
    }

    return {
      pbx_username: String(pbx_username),
      pbx_password: String(pbx_password),
      pbx_wss: String(pbx_wss),
      sip_server: String(sip_server),
    };
  },

  /**
   * Endpoint 3: Logout
   * POST {host}/api-backend/users/logout (or fallback /users/logout)
   * Payload: { extension: "..." }
   */
  async logout(host, token, extension) {
    if (!host) return true;
    const cleanHost = host.replace(/\/+$/, '');

    const urls = [
      `${cleanHost}/api-backend/users/logout`,
    ];

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const body = JSON.stringify({
      extension: String(extension || ''),
    });

    for (const url of urls) {
      try {
        console.log('[API] Calling logout endpoint:', url, 'with payload:', body);
        const response = await fetchWithTimeout(
          url,
          {
            method: 'POST',
            headers,
            body,
          },
          5000
        );

        if (response.ok) {
          console.log('[API] Logout success on', url);
          return true;
        }
      } catch (err) {
        console.warn(`[API] Logout attempt failed on ${url}:`, err.message || err);
      }
    }

    return true;
  },
};
