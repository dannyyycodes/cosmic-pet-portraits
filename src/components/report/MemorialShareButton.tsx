/**
 * MemorialShareButton — the quiet "share in remembrance" affordance.
 *
 * Behaviour:
 *   1. On mobile (if `navigator.share` exists) we open the native share sheet
 *      with a reverent pre-filled message. The share URL points at the public
 *      share-token link, whose HTML head carries our memorial OG image so
 *      whatever surface the owner shares into (WhatsApp, IG DM, iMessage,
 *      Twitter) renders a cream-on-gold "In Remembrance" card, not a
 *      generic cosmic purple hero.
 *   2. On desktop we fall back to copying the URL to clipboard with a toast.
 *
 * Copy rule: never write "share your pet's reading!" — memorial sharing is
 * not a CTA, it's an act of holding. The button label and share text are
 * both deliberately quiet.
 */

import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

interface MemorialShareButtonProps {
  petName: string;
  /** Optional years string e.g. "2015 – 2024". */
  years?: string;
  /** Optional public share token. If present, the shared URL includes it so
   *  the recipient doesn't need to enter the owner's email. */
  shareToken?: string;
  reportId?: string;
  /** Optional pull-quote-style line to include in native share text (rare). */
  quote?: string;
}

function buildShareUrl(reportId?: string, shareToken?: string): string {
  const base = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://littlesouls.app';
  if (shareToken) {
    return `${base}/view-report?share=${encodeURIComponent(shareToken)}`;
  }
  if (reportId) {
    return `${base}/view-report?id=${encodeURIComponent(reportId)}`;
  }
  return `${base}/view-report`;
}

export function MemorialShareButton({
  petName,
  years,
  shareToken,
  reportId,
  quote,
}: MemorialShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const url = buildShareUrl(reportId, shareToken);

      // Deliberately quiet share text — no CTA, no ad phrasing. Just the
      // two facts that matter: who, and the frame of remembrance.
      const headline = years
        ? `${petName}, ${years}. A reading held in remembrance.`
        : `${petName}. A reading held in remembrance.`;

      const shareText = quote
        ? `${headline}\n\n“${quote.substring(0, 140)}${quote.length > 140 ? '…' : ''}”`
        : headline;

      // Native share sheet (mobile / any browser that supports it)
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title: `${petName} · In Remembrance`,
            text: shareText,
            url,
          });
          // Successful native share — no toast needed, they chose an app.
          return;
        } catch (err) {
          // User cancelled — silently exit. Do NOT fall through to copy.
          const name = (err as { name?: string })?.name;
          if (name === 'AbortError') return;
          // Anything else — fall through to clipboard.
        }
      }

      // Desktop fallback — copy URL to clipboard.
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied. Share it only where it feels right.');
        return;
      }

      // Last-ditch fallback — textarea select/copy for very old browsers.
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        toast.success('Link copied. Share it only where it feels right.');
      } catch {
        toast.error('Could not copy the link. Please try again.');
      } finally {
        document.body.removeChild(ta);
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      onClick={handleShare}
      disabled={isSharing}
      variant="outline"
      className="gap-2"
      style={{
        borderColor: '#8fa082',
        color: '#2d2428',
        background: 'transparent',
        fontFamily: "'DM Serif Display', Georgia, serif",
        padding: '0.85rem 1.5rem',
        borderRadius: '10px',
      }}
    >
      <span>Share in remembrance</span>
    </Button>
  );
}
