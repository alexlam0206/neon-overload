import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const m = cookie.match(/hc_token=([^;\s;]+)/);
  const token = m?.[1];
  if (!token) return NextResponse.json({ loggedIn: false });

  try {
    const meRes = await fetch('https://auth.hackclub.com/api/v1/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return NextResponse.json({ loggedIn: false });
    
    const data = await meRes.json();

    let user: any = data;
    if (data && data.identity) {
      const id = data.identity.id || data.identity.ident || undefined;
      const email = data.identity.primary_email || data.identity.email || undefined;
      const first = data.identity.first_name || data.identity.given_name || undefined;
      const last = data.identity.last_name || data.identity.family_name || undefined;
      const name = [first, last].filter(Boolean).join(' ') || undefined;
      user = {
        id,
        email,
        name,
        given_name: first,
        family_name: last,
        slack_id: data.identity.slack_id || undefined,
        verification_status: data.identity.verification_status || undefined,
        raw: data,
      };
    }
    // determine whether is him admin from env
    const adminList = (process.env.ADMIN_SLACK_IDS || process.env.NEXT_PUBLIC_ADMIN_SLACK_IDS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const isAdmin = !!(user && (user.slack_id && adminList.includes(user.slack_id)));
    return NextResponse.json({ loggedIn: true, user: { ...user, isAdmin }, adminList });
  } catch (e) {
    return NextResponse.json({ loggedIn: false });
  }
}
