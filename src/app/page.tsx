"use client";
import React, { useEffect, useState } from 'react';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!mounted) return;
        if (data.loggedIn) setUser(data.user);
      } catch (e) {

      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'GET', credentials: 'same-origin' });
    } catch (e) {

    }
    try {
      if (typeof window !== 'undefined') {
        try { localStorage.clear(); } catch (e) {}
        try { sessionStorage.clear(); } catch (e) {}
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
      }
    } catch (e) {}
    setUser(null);
    window.location.href = '/api/auth/logout';
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center', padding: '24px' }}>
      <header style={{ borderBottom: '1px solid #e6e6e6', paddingBottom: 12, marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Neon Overload</h1>
      </header>
      <main>
        <p style={{ color: '#333', fontSize: 16, maxWidth: 680, margin: '0 auto' }}>
          RSVP for Neon Overload!
        </p>
        <div style={{ marginTop: 24 }}>
          {!loading && user ? (
            <>
              <div style={{ marginBottom: 12 }}>Signed in as {user.email ?? user.name ?? user.id}</div>
              <button onClick={handleLogout} style={{ padding: '10px 16px', borderRadius: 6, background: '#c33', color: '#fff', border: 'none' }}>
                Sign out
              </button>
            </>
          ) : (
            <a
              href="/api/auth/login"
              style={{ display: 'inline-block', padding: '10px 16px', background: '#111', color: '#fff', borderRadius: 6, textDecoration: 'none' }}
            >
              Sign in with Hack Club
            </a>
          )}
        </div>
      </main>
      
      <footer>
        <p>For teens, by teens.</p>
      </footer>
    </div>
  );
}
