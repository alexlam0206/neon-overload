import React from 'react';
import prisma from '../../../lib/prisma';
import { cookies } from 'next/headers';

async function getCurrentUserFromCookie() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('hc_token')?.value;
    if (!token) return null;
    const meRes = await fetch('https://auth.hackclub.com/api/v1/me', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!meRes.ok) return null;
    const data = await meRes.json();
    if (data && data.identity) {
      const slack = data.identity.slack_id || undefined;
      return { slack_id: slack, raw: data };
    }
    return null;
  } catch (e) {
    return null;
  }
}

export default async function AdminUsersPage() {
  const current = await getCurrentUserFromCookie();
  const adminList = (process.env.ADMIN_SLACK_IDS || process.env.NEXT_PUBLIC_ADMIN_SLACK_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const isAdmin = current && current.slack_id && adminList.includes(current.slack_id);

  if (!isAdmin) {
    return (
      <div style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
        <h2>Admin</h2>
        <p>Access denied.</p>
        {current ? (
          <div style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
            <div>Detected Slack ID: <strong>{current.slack_id || 'none'}</strong></div>
            <div>Configured admins: <strong>{adminList.length ? adminList.join(', ') : '(none)'}</strong></div>
            <div style={{ marginTop: 8 }}>If your Slack ID isn't listed, add it to `ADMIN_SLACK_IDS` in your `.env`</div>
          </div>
        ) : (
          <div style={{ marginTop: 12, fontSize: 13, color: '#555' }}>Please sign in to verify admin status.</div>
        )}
      </div>
    );
  }

  // fetch user from DB
  const users = await prisma.user.findMany();

  return (
    <div style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <h2>Admin — Users</h2>
      <p>{users.length} users</p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>ID</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Email</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Name</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Slack ID</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>YSWS eligibility</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Role</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>First Seen</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u: any) => (
            <tr key={u.id}>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f1f1' }}>{u.id}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f1f1' }}>{u.email}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f1f1' }}>{u.name}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f1f1' }}>{u.slack_id}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f1f1' }}>
                {u.verification_status === 'verified' ? (
                  <strong style={{ color: '#085' }}>YES</strong>
                ) : (
                  <strong style={{ color: '#ff0000' }}>NO</strong>
                )}
              </td>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f1f1' }}>
                {u.slack_id && adminList.includes(u.slack_id) ? (
                  <strong style={{ color: 'rgb(0, 119, 255)' }}>admin</strong>
                ) : u.verification_status === 'reviewer' ? (
                  <span style={{ color: '#085' }}>reviewer</span>
                ) : (
                  <span>user</span>
                )}
              </td>
              <td style={{ padding: 8, borderBottom: '1px solid #f1f1f1' }}>{u.firstSeen ? new Date(u.firstSeen).toLocaleString() : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
