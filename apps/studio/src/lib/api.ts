import { createLumiClient, type LumiClient } from '@lumibase/sdk';

/**
 * Studio API client. In Phase 0/A we run against the Vite dev proxy so the
 * Worker URL is empty (same-origin). Token + site come from localStorage in
 * dev; production wires Logto's access token and the site switcher.
 */

const STORAGE_KEY = {
  token: 'lumibase.dev.token',
  site: 'lumibase.dev.site',
};

const DEFAULT_DEV_TOKEN = 'dev:studio';
const DEFAULT_DEV_SITE = 'site_demo';

export function getActiveSite(): string {
  return localStorage.getItem(STORAGE_KEY.site) || DEFAULT_DEV_SITE;
}

export function setActiveSite(siteId: string): void {
  localStorage.setItem(STORAGE_KEY.site, siteId);
}

export function getActiveToken(): string {
  return localStorage.getItem(STORAGE_KEY.token) || DEFAULT_DEV_TOKEN;
}

let cached: { client: LumiClient; site: string; token: string } | null = null;

export function getApiClient(): LumiClient {
  const site = getActiveSite();
  const token = getActiveToken();
  if (!cached || cached.site !== site || cached.token !== token) {
    cached = {
      site,
      token,
      client: createLumiClient({ url: '', token, siteId: site }),
    };
  }
  return cached.client;
}
