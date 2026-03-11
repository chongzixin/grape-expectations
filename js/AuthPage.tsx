import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (err) setError(err.message);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="auth-page">
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🍷</div>
        <h1 style={{ color: 'var(--gold)', fontSize: 28, fontWeight: 700, margin: 0 }}>
          Grape Expectations
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 11, letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 300 }}>
          Your Singaporean Sommelier
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '32px 28px',
        width: '100%',
        maxWidth: 380,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {!sent ? (
          <>
            {/* Google OAuth */}
            <button
              onClick={handleGoogle}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                background: '#fff',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: '11px 16px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.174 0 7.548 0 9s.348 2.826.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Magic Link */}
            <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ color: 'var(--parch)', fontSize: 13, fontWeight: 500 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--parch)',
                  fontSize: 14,
                  padding: '10px 12px',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="submit"
                disabled={loading}
                className="ge-btn btn-o"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? 'Sending…' : 'Send Magic Link'}
              </button>
            </form>

            {error && (
              <p style={{ color: '#f87171', fontSize: 13, margin: 0, textAlign: 'center' }}>
                {error}
              </p>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>✉️</div>
            <h3 style={{ color: 'var(--gold)', margin: '0 0 8px' }}>Check your email</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
              We sent a magic link to <strong style={{ color: 'var(--parch)' }}>{email}</strong>.
              Click the link to sign in — no password needed.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              style={{
                marginTop: 20,
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
