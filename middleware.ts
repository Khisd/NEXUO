// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // 1. Create Response Object
  const res = NextResponse.next();

  // 2. Set Headers
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    res.headers.set('x-supabase-url', process.env.NEXT_PUBLIC_SUPABASE_URL);
  }
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.headers.set('x-supabase-key', process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
  if (process.env.EMAIL_USER) {
    res.headers.set('x-email-user', process.env.EMAIL_USER);
  }
  if (process.env.EMAIL_PASS) {
    res.headers.set('x-email-pass', process.env.EMAIL_PASS);
  }
  if (process.env.CASHIFY_API_KEY) {
    res.headers.set('x-cashify-api-key', process.env.CASHIFY_API_KEY);
  }
  if (process.env.CASHIFY_MERCHANT_CODE) {
    res.headers.set('x-cashify-merchant-code', process.env.CASHIFY_MERCHANT_CODE || 'nexuo');
  }

  return res;
}