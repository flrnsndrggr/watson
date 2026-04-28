/**
 * Lightweight stub for @supabase/functions-js.
 *
 * The app never uses Supabase Edge Functions.
 * This stub satisfies the SupabaseClient lazy getter so the real
 * functions-js (~13 KB) is excluded from the production bundle.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export class FunctionsClient {
  constructor() {}
}

export class FunctionsError extends Error {}
export class FunctionsFetchError extends FunctionsError {}
export class FunctionsHttpError extends FunctionsError {}
export class FunctionsRelayError extends FunctionsError {}

export const FunctionRegion = { Any: 'any' } as const;
