import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  if (!code) return new Response('Missing code', { status: 400 });
  const base = process.env.NEXT_PUBLIC_BASE_URL || url.origin;
  const tokenRes = await fetch('https://auth.hackclub.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.HACKCLUB_CLIENT_ID || '',
      client_secret: process.env.HACKCLUB_CLIENT_SECRET || '',
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${base.replace(/\/$/, '')}/api/auth/callback`,
    }),
  });

  if (!tokenRes.ok) {
    const txt = await tokenRes.text();
    return new Response('Token exchange failed: ' + txt, { status: 500 });
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  if (!accessToken) return new Response('No access token received', { status: 500 });

  // attach expiry timestamp
  try {
    if (tokenData.expires_in) {
      tokenData.expires_at = new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString();
    }
  } catch (e) {

  }

  const meRes = await fetch('https://auth.hackclub.com/api/v1/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!meRes.ok) {
    const txt = await meRes.text();
    return new Response('Failed to fetch user: ' + txt, { status: 500 });
  }
  const user = await meRes.json();

  const uid = user.id ?? user.identity?.id;
  const email = user.email ?? user.primary_email ?? user.identity?.primary_email ?? null;
  const name = user.name ?? user.identity?.name ?? [user.identity?.first_name, user.identity?.last_name].filter(Boolean).join(' ') ?? null;
  const given_name = user.given_name ?? user.identity?.first_name ?? null;
  const family_name = user.family_name ?? user.identity?.last_name ?? null;
  const slack_id = user.slack_id ?? user.identity?.slack_id ?? null;
  const verification_status = user.verification_status ?? user.identity?.verification_status ?? null;

  if (!uid) {
    try { console.error('Missing user id from /api/v1/me response', user); } catch (e) {}
  } else {
    try {
      await prisma.user.upsert({
        where: { id: uid },
        update: {
          email: email ?? undefined,
          name: name ?? undefined,
          given_name: given_name ?? undefined,
          family_name: family_name ?? undefined,
          slack_id: slack_id ?? undefined,
          verification_status: verification_status ?? undefined,
          raw: JSON.stringify({ ...user, tokenData }),
          oauth_token: accessToken,
        },
        create: {
          id: uid,
          email: email ?? undefined,
          name: name ?? undefined,
          given_name: given_name ?? undefined,
          family_name: family_name ?? undefined,
          slack_id: slack_id ?? undefined,
          verification_status: verification_status ?? undefined,
          raw: JSON.stringify({ ...user, tokenData }),
          oauth_token: accessToken,
        },
      });
    } catch (e) {
      try { console.error('Prisma upsert error:', e); } catch (err) {}
    }
  }

  const res = NextResponse.redirect(`${base}/`);
  try {
    res.cookies.set('hc_token', accessToken, {
      path: '/',
      httpOnly: true,
      maxAge: tokenData.expires_in ? Number(tokenData.expires_in) : undefined,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  } catch (e) {
    const cookieValue = encodeURIComponent(accessToken);
    const maxAge = tokenData.expires_in ? `Max-Age=${Number(tokenData.expires_in)}` : '';
    const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
    res.headers.append('Set-Cookie', `hc_token=${cookieValue}; Path=/; HttpOnly; ${maxAge}; ${secure}SameSite=Lax`);
  }
  return res;
}
