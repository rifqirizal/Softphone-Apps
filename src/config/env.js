import {
  DEFAULT_HOST,
  API_TIMEOUT_MS,
  SIP_KEEPALIVE_INTERVAL,
  DEFAULT_STUN_SERVER,
  DEFAULT_PBX_WSS,
  DEFAULT_SIP_SERVER,
} from '@env';

/**
 * Centralized Environment Configuration
 * Values are injected during bundling (both debug & release builds).
 * Fallback values ensure stability if .env is missing or partial.
 */
export const ENV = {
  DEFAULT_HOST: DEFAULT_HOST || '',
  API_TIMEOUT_MS: Number(API_TIMEOUT_MS) || 10000,
  SIP_KEEPALIVE_INTERVAL: Number(SIP_KEEPALIVE_INTERVAL) || 30,
  DEFAULT_STUN_SERVER: DEFAULT_STUN_SERVER || '',
  DEFAULT_PBX_WSS: DEFAULT_PBX_WSS || '',
  DEFAULT_SIP_SERVER: DEFAULT_SIP_SERVER || '',
};
