import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
  const redirectUri = `${base.replace(/\/$/, '')}/api/auth/callback`;
  const params = new URLSearchParams({
    client_id: process.env.HACKCLUB_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email name slack_id verification_status',
  });

  const authUrl = `https://auth.hackclub.com/oauth/authorize?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}
