import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const m = cookie.match(/hc_token=([^;\s;]+)/);
  const accessToken = m?.[1];
  if (!accessToken) return new Response('No token', { status: 400 });

  const user = await prisma.user.findFirst({ where: { oauth_token: accessToken } });
  if (!user) return new Response('User not found', { status: 404 });

  const tokenData = (user.raw && (user.raw as any).tokenData) || null;
  const refreshToken = tokenData?.refresh_token;
  if (!refreshToken) return new Response('No refresh token available', { status: 400 });

  const base = process.env.NEXT_PUBLIC_BASE_URL || '';
  const tokenRes = await fetch('https://auth.hackclub.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.HACKCLUB_CLIENT_ID || '',
      client_secret: process.env.HACKCLUB_CLIENT_SECRET || '',
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!tokenRes.ok) {
    const txt = await tokenRes.text();
    return new Response('Refresh failed: ' + txt, { status: 500 });
  }

  const newTokenData = await tokenRes.json();
  try {
    if (newTokenData.expires_in) {
      newTokenData.expires_at = new Date(Date.now() + Number(newTokenData.expires_in) * 1000).toISOString();
    }
  } catch (e) {}

  try {
    const updatedRaw = { ...(user.raw as any), tokenData: newTokenData };
    await prisma.user.update({ where: { id: user.id }, data: { raw: updatedRaw, oauth_token: newTokenData.access_token } });
  } catch (e) {
  }

  const res = NextResponse.json({ ok: true });
  try {
    res.cookies.set('hc_token', newTokenData.access_token, {
      path: '/',
      httpOnly: true,
      maxAge: newTokenData.expires_in ? Number(newTokenData.expires_in) : undefined,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  } catch (e) {
    const cookieValue = encodeURIComponent(newTokenData.access_token);
    const maxAge = newTokenData.expires_in ? `Max-Age=${Number(newTokenData.expires_in)}` : '';
    const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
    res.headers.append('Set-Cookie', `hc_token=${cookieValue}; Path=/; HttpOnly; ${maxAge}; ${secure}SameSite=Lax`);
  }
  return res;
}
