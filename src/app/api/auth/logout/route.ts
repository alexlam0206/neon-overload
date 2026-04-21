import { NextResponse } from 'next/server';

export async function GET() {
  const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
  const cookie = `hc_token=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${secure}SameSite=Lax`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': cookie,
    },
  });
}
