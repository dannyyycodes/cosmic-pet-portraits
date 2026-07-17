/* Funnel measurement spine (CRO synth 2026-07-16, built 2026-07-17).
 *
 * ANALYTICS ONLY. This module observes the funnel and never changes its
 * behaviour: every call is fire-and-forget, every failure is swallowed.
 *
 * Events ride the same rail every existing event already uses: an insert into
 * the Supabase `page_analytics` table (see usePageAnalytics + InlineCheckout's
 * trackFunnelEvent). No new backend, no third-party dependency.
 *
 * Spine events (all snake_case):
 *   page_view        — sent by usePageAnalytics (enriched there with the same
 *                      register/viewport props this module attaches)
 *   register_set     — { value, via: "default" | "url_param" | "user_tap" }
 *   form_start       — { first_field } (once per page load)
 *   form_error       — { field, error_type }
 *   form_submit      — {}
 *   chart_computed   — { latency_ms, ok }
 *   card_advance     — { index, dwell_ms, direction } (deck cards, 1-based)
 *   sell_view        — {} (sell section first enters the viewport)
 *   checkout_view    — {} (checkout section first enters the viewport)
 *   checkout_submit  — { price, currency, pet_count, ... }
 *
 * Every event automatically carries: register (discovery | memorial),
 * viewport class (mobile | tablet | desktop), source (utm_source or referrer
 * host or "direct"), full UTM set, session id, and the active variant map
 * (ab_variant / funnel_v2_variant / checkout_variant) so per-arm funnels
 * split cleanly.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getUtm } from "@/lib/utm";
import { getIntent } from "@/lib/intent";

/* Captured at module-import time, BEFORE any component render calls
 * getIntent() (which strips the memorial params from the address bar).
 * Lets register_set report via: "url_param" truthfully. */
const urlCarriedMemorial: boolean = (() => {
  try {
    const p = new URLSearchParams(window.location.search);
    return p.get("r") === "memorial" || p.get("memorial") === "1" || p.get("occasion") === "memorial";
  } catch {
    return false;
  }
})();

export function registerSetVia(): "url_param" | "default" {
  return urlCarriedMemorial ? "url_param" : "default";
}

function sessionId(): string {
  try {
    let id = sessionStorage.getItem("analytics_session_id");
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("analytics_session_id", id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

export function viewportClass(): "mobile" | "tablet" | "desktop" {
  try {
    const w = window.innerWidth;
    return w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
  } catch {
    return "desktop";
  }
}

export function currentRegister(): "memorial" | "discovery" {
  return getIntent() === "memorial" ? "memorial" : "discovery";
}

export function trafficSource(): string {
  try {
    const utm = getUtm() as Record<string, string>;
    if (utm.utm_source) return utm.utm_source;
    if (document.referrer) return new URL(document.referrer).hostname;
    return "direct";
  } catch {
    return "direct";
  }
}

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Fire one spine event. Never throws, never blocks, never changes behaviour. */
export function trackSpine(event: string, props: Record<string, unknown> = {}): void {
  try {
    const funnelV2Variant = readLocal("funnel_v2_variant");
    const checkoutVariant = readLocal("ls_checkout_variant");
    const payload = {
      ...props,
      register: currentRegister(),
      viewport: viewportClass(),
      source: trafficSource(),
      ...getUtm(),
      ab_variant: readLocal("ab_test_variant") || "A",
      ...(funnelV2Variant ? { funnel_v2_variant: funnelV2Variant } : {}),
      ...(checkoutVariant ? { checkout_variant: checkoutVariant } : {}),
    };
    void supabase
      .from("page_analytics")
      .insert([
        {
          session_id: sessionId(),
          event_type: event,
          page_path: window.location.pathname,
          event_data: payload as Json,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        },
      ])
      .then(({ error }) => {
        if (error) console.warn("[funnel spine]", event, error.message);
      });
  } catch (e) {
    console.warn("[funnel spine]", event, e);
  }
}

/* Once-per-page-load latches (form_start, sell_view, checkout_view, the
 * load-time register_set). Keyed separately from the event name so a latched
 * load-time event never blocks a later user-driven event of the same name. */
const fired = new Set<string>();

export function trackSpineOnce(key: string, event: string, props: Record<string, unknown> = {}): void {
  if (fired.has(key)) return;
  fired.add(key);
  trackSpine(event, props);
}
