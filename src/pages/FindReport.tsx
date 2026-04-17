import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function FindReport() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await supabase.functions.invoke('send-report-links', {
        body: { email: email.trim() },
      });
    } catch {
      // Still show success — don't reveal if email exists
    }
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFDF5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Cormorant', Georgia, serif",
      }}
    >
      <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: 32 }}>
          <span style={{ fontSize: '2.5rem' }}>🐾</span>
        </div>

        <h1
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(1.6rem, 5vw, 2rem)',
            color: '#2D2926',
            marginBottom: 12,
          }}
        >
          Find My Report
        </h1>

        <p
          style={{
            fontSize: '0.95rem',
            color: '#6B5E54',
            lineHeight: 1.6,
            marginBottom: 32,
            fontStyle: 'italic',
          }}
        >
          Enter the email you used at checkout and we'll send your report links.
        </p>

        {submitted ? (
          <div
            style={{
              background: '#fff',
              border: '1px solid #E8DFD6',
              borderRadius: 16,
              padding: '32px 24px',
            }}
          >
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: 12 }}>✉️</span>
            <p
              style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: '1.2rem',
                color: '#2D2926',
                marginBottom: 8,
              }}
            >
              Saved. Check your email for the link.
            </p>
            <p style={{ fontSize: '0.85rem', color: '#9B8E84', lineHeight: 1.6 }}>
              If that email has readings linked to it, we&rsquo;ll send a secure link so you can return to them inside Little Souls.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{
                width: '100%',
                padding: '14px 18px',
                border: '1.5px solid #E8DFD6',
                borderRadius: 12,
                fontFamily: "'Cormorant', Georgia, serif",
                fontSize: '1.05rem',
                color: '#2D2926',
                background: '#fff',
                outline: 'none',
                marginBottom: 12,
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#bf524a')}
              onBlur={(e) => (e.target.style.borderColor = '#E8DFD6')}
            />
            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                width: '100%',
                padding: '14px',
                background: '#bf524a',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontFamily: "'Cormorant', Georgia, serif",
                fontWeight: 700,
                fontSize: '1.05rem',
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Sending...' : 'Send My Reports'}
            </button>
          </form>
        )}

        <div style={{ marginTop: 32 }}>
          <Link
            to="/"
            style={{
              fontSize: '0.82rem',
              color: '#958779',
              textDecoration: 'none',
            }}
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
