/**
 * Lightweight stub for @supabase/storage-js.
 *
 * The app never uses Supabase Storage (file uploads, signed URLs, etc.).
 * This stub satisfies the SupabaseClient constructor so the real
 * storage-js (~99 KB) is excluded from the production bundle.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export class StorageClient {
  constructor() {}
}

export class StorageApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}
