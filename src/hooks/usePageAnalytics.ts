import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

// Generate or retrieve session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Get A/B test variant from localStorage
const getABVariant = () => {
  return localStorage.getItem('ab_test_variant') || 'A';
};

interface TrackEventParams {
  eventType: string;
  eventData?: Json;
}

export const usePageAnalytics = (pagePath: string) => {
  const sessionId = useRef(getSessionId());
  const trackedScrollDepths = useRef<Set<number>>(new Set());
  const trackedSections = useRef<Set<string>>(new Set());
  const hasTrackedPageView = useRef(false);

  const trackEvent = useCallback(async ({ eventType, eventData }: TrackEventParams) => {
    try {
      const abVariant = getABVariant();
      const enrichedEventData = {
        ...(eventData as Record<string, unknown> || {}),
        ab_variant: abVariant,
      };
      
      await supabase.from('page_analytics').insert([{
        session_id: sessionId.current,
        event_type: eventType,
        page_path: pagePath,
        event_data: enrichedEventData as Json,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      }]);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }, [pagePath]);

  // Track page view on mount
  useEffect(() => {
    if (!hasTrackedPageView.current) {
      hasTrackedPageView.current = true;
      trackEvent({ 
        eventType: 'page_view',
        eventData: { 
          url: window.location.href,
          referrer: document.referrer,
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
        }
      });
    }
  }, [trackEvent]);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      // Track at 25%, 50%, 75%, 100% milestones
      const milestones = [25, 50, 75, 100];
      for (const milestone of milestones) {
        if (scrollPercent >= milestone && !trackedScrollDepths.current.has(milestone)) {
          trackedScrollDepths.current.add(milestone);
          trackEvent({
            eventType: 'scroll_depth',
            eventData: { depth: milestone }
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [trackEvent]);

  // Track section visibility
  const trackSectionView = useCallback((sectionName: string) => {
    if (!trackedSections.current.has(sectionName)) {
      trackedSections.current.add(sectionName);
      trackEvent({
        eventType: 'section_view',
        eventData: { section: sectionName }
      });
    }
  }, [trackEvent]);

  // Track CTA clicks
  const trackCTAClick = useCallback((ctaName: string, ctaLocation: string) => {
    trackEvent({
      eventType: 'cta_click',
      eventData: { cta: ctaName, location: ctaLocation }
    });
  }, [trackEvent]);

  // Track errors
  const trackError = useCallback((errorMessage: string, errorLocation: string) => {
    trackEvent({
      eventType: 'error',
      eventData: { message: errorMessage, location: errorLocation }
    });
  }, [trackEvent]);

  return { trackSectionView, trackCTAClick, trackError, sessionId: sessionId.current };
};
