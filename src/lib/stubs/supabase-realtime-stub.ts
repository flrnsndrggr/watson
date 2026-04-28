/**
 * Lightweight stub for @supabase/realtime-js.
 *
 * The app never uses Supabase Realtime (channels, presence, broadcast).
 * This stub satisfies the SupabaseClient constructor so the real
 * realtime-js + phoenix (~300 KB) are excluded from the production bundle.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export class RealtimeClient {
  constructor() {}
  setAuth() {}
  channel(): any { return {}; }
  getChannels(): any[] { return []; }
  removeChannel(): Promise<string> { return Promise.resolve('ok'); }
  removeAllChannels(): Promise<any[]> { return Promise.resolve([]); }
}

export type RealtimeChannel = any;
export type RealtimeChannelOptions = any;
export type RealtimeClientOptions = any;
