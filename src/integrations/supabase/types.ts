export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_sessions: {
        Row: {
          admin_id: string
          created_at: string | null
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          password_hash: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          password_hash: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          password_hash?: string
        }
        Relationships: []
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          amount_cents: number
          commission_cents: number
          created_at: string
          id: string
          paid_at: string | null
          status: string
          stripe_session_id: string
        }
        Insert: {
          affiliate_id: string
          amount_cents: number
          commission_cents: number
          created_at?: string
          id?: string
          paid_at?: string | null
          status?: string
          stripe_session_id: string
        }
        Update: {
          affiliate_id?: string
          amount_cents?: number
          commission_cents?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          status?: string
          stripe_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_sessions: {
        Row: {
          affiliate_id: string
          created_at: string
          expires_at: string
          id: string
          session_token: string | null
          verification_code: string | null
          verified: boolean
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          expires_at: string
          id?: string
          session_token?: string | null
          verification_code?: string | null
          verified?: boolean
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          session_token?: string | null
          verification_code?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_sessions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          commission_rate: number
          created_at: string
          email: string
          id: string
          name: string
          pending_balance_cents: number
          referral_code: string
          status: string
          stripe_account_id: string
          total_earnings_cents: number
          total_referrals: number
          updated_at: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          email: string
          id?: string
          name: string
          pending_balance_cents?: number
          referral_code: string
          status?: string
          stripe_account_id: string
          total_earnings_cents?: number
          total_referrals?: number
          updated_at?: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          email?: string
          id?: string
          name?: string
          pending_balance_cents?: number
          referral_code?: string
          status?: string
          stripe_account_id?: string
          total_earnings_cents?: number
          total_referrals?: number
          updated_at?: string
        }
        Relationships: []
      }
      authors: {
        Row: {
          created_at: string
          description: string
          image_url: string | null
          job_title: string
          knows_about: string[]
          long_bio: string
          name: string
          never_writes_clusters: string[]
          primary_clusters: string[]
          same_as: string[]
          secondary_clusters: string[]
          short_name: string
          slug: string
          updated_at: string
          voice_donts: string[]
          voice_dos: string[]
          voice_profile: string
        }
        Insert: {
          created_at?: string
          description: string
          image_url?: string | null
          job_title: string
          knows_about?: string[]
          long_bio: string
          name: string
          never_writes_clusters?: string[]
          primary_clusters?: string[]
          same_as?: string[]
          secondary_clusters?: string[]
          short_name: string
          slug: string
          updated_at?: string
          voice_donts?: string[]
          voice_dos?: string[]
          voice_profile: string
        }
        Update: {
          created_at?: string
          description?: string
          image_url?: string | null
          job_title?: string
          knows_about?: string[]
          long_bio?: string
          name?: string
          never_writes_clusters?: string[]
          primary_clusters?: string[]
          same_as?: string[]
          secondary_clusters?: string[]
          short_name?: string
          slug?: string
          updated_at?: string
          voice_donts?: string[]
          voice_dos?: string[]
          voice_profile?: string
        }
        Relationships: []
      }
      blog_analytics: {
        Row: {
          blog_post_id: string | null
          created_at: string
          event_type: string
          id: string
          referrer: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          blog_post_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          blog_post_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_analytics_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          anchor_variants: string[] | null
          author_slug: string | null
          category: string | null
          cluster: string | null
          content: string
          conversions: number | null
          created_at: string
          cta_clicks: number | null
          cta_end_url: string | null
          cta_middle_url: string | null
          date_modified: string | null
          excerpt: string | null
          faq: Json | null
          featured_image_url: string | null
          hero_alt: string | null
          id: string
          is_pillar: boolean | null
          is_published: boolean | null
          meta_description: string
          published_at: string | null
          reading_time_minutes: number | null
          secondary_keywords: string[] | null
          slug: string
          sources: Json | null
          species: string | null
          tags: string[] | null
          target_keyword: string
          target_query: string | null
          title: string
          tldr: string | null
          updated_at: string
          views: number | null
          word_count: number | null
        }
        Insert: {
          anchor_variants?: string[] | null
          author_slug?: string | null
          category?: string | null
          cluster?: string | null
          content: string
          conversions?: number | null
          created_at?: string
          cta_clicks?: number | null
          cta_end_url?: string | null
          cta_middle_url?: string | null
          date_modified?: string | null
          excerpt?: string | null
          faq?: Json | null
          featured_image_url?: string | null
          hero_alt?: string | null
          id?: string
          is_pillar?: boolean | null
          is_published?: boolean | null
          meta_description: string
          published_at?: string | null
          reading_time_minutes?: number | null
          secondary_keywords?: string[] | null
          slug: string
          sources?: Json | null
          species?: string | null
          tags?: string[] | null
          target_keyword: string
          target_query?: string | null
          title: string
          tldr?: string | null
          updated_at?: string
          views?: number | null
          word_count?: number | null
        }
        Update: {
          anchor_variants?: string[] | null
          author_slug?: string | null
          category?: string | null
          cluster?: string | null
          content?: string
          conversions?: number | null
          created_at?: string
          cta_clicks?: number | null
          cta_end_url?: string | null
          cta_middle_url?: string | null
          date_modified?: string | null
          excerpt?: string | null
          faq?: Json | null
          featured_image_url?: string | null
          hero_alt?: string | null
          id?: string
          is_pillar?: boolean | null
          is_published?: boolean | null
          meta_description?: string
          published_at?: string | null
          reading_time_minutes?: number | null
          secondary_keywords?: string[] | null
          slug?: string
          sources?: Json | null
          species?: string | null
          tags?: string[] | null
          target_keyword?: string
          target_query?: string | null
          title?: string
          tldr?: string | null
          updated_at?: string
          views?: number | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_slug_fkey"
            columns: ["author_slug"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["slug"]
          },
        ]
      }
      blog_topics: {
        Row: {
          author_slug: string | null
          category: string
          cluster: string | null
          created_at: string
          cta_url: string | null
          id: string
          is_pillar: boolean | null
          is_used: boolean | null
          priority: number | null
          scheduled_for: string | null
          species: string
          tags: string[] | null
          target_keyword: string | null
          topic: string
          used_at: string | null
          working_title: string | null
        }
        Insert: {
          author_slug?: string | null
          category?: string
          cluster?: string | null
          created_at?: string
          cta_url?: string | null
          id?: string
          is_pillar?: boolean | null
          is_used?: boolean | null
          priority?: number | null
          scheduled_for?: string | null
          species?: string
          tags?: string[] | null
          target_keyword?: string | null
          topic: string
          used_at?: string | null
          working_title?: string | null
        }
        Update: {
          author_slug?: string | null
          category?: string
          cluster?: string | null
          created_at?: string
          cta_url?: string | null
          id?: string
          is_pillar?: boolean | null
          is_used?: boolean | null
          priority?: number | null
          scheduled_for?: string | null
          species?: string
          tags?: string[] | null
          target_keyword?: string | null
          topic?: string
          used_at?: string | null
          working_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_topics_author_slug_fkey"
            columns: ["author_slug"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["slug"]
          },
        ]
      }
      breed_photo_review: {
        Row: {
          animal_type: string
          breed_slug: string
          created_at: string | null
          expected_breed: string
          gemini_breed: string | null
          gemini_confidence: number | null
          id: string
          pexels_alt: string | null
          pexels_id: number | null
          photo_url: string
          reviewed_at: string | null
          status: string
          storage_path: string | null
          verified: boolean | null
        }
        Insert: {
          animal_type?: string
          breed_slug: string
          created_at?: string | null
          expected_breed: string
          gemini_breed?: string | null
          gemini_confidence?: number | null
          id?: string
          pexels_alt?: string | null
          pexels_id?: number | null
          photo_url: string
          reviewed_at?: string | null
          status?: string
          storage_path?: string | null
          verified?: boolean | null
        }
        Update: {
          animal_type?: string
          breed_slug?: string
          created_at?: string | null
          expected_breed?: string
          gemini_breed?: string | null
          gemini_confidence?: number | null
          id?: string
          pexels_alt?: string | null
          pexels_id?: number | null
          photo_url?: string
          reviewed_at?: string | null
          status?: string
          storage_path?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      breed_photos: {
        Row: {
          animal_type: string
          breed: string
          breed_slug: string
          created_at: string | null
          height: number | null
          id: string
          photo_url: string
          source: string | null
          storage_path: string
          width: number | null
        }
        Insert: {
          animal_type?: string
          breed: string
          breed_slug: string
          created_at?: string | null
          height?: number | null
          id?: string
          photo_url: string
          source?: string | null
          storage_path: string
          width?: number | null
        }
        Update: {
          animal_type?: string
          breed?: string
          breed_slug?: string
          created_at?: string | null
          height?: number | null
          id?: string
          photo_url?: string
          source?: string | null
          storage_path?: string
          width?: number | null
        }
        Relationships: []
      }
      calendar_orders: {
        Row: {
          created_at: string | null
          gelato_order_id: string | null
          id: string
          month_photos: Json
          order_token: string
          report_id: string
          shipping_address: Json | null
          status: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          gelato_order_id?: string | null
          id?: string
          month_photos?: Json
          order_token?: string
          report_id: string
          shipping_address?: Json | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          gelato_order_id?: string | null
          id?: string
          month_photos?: Json
          order_token?: string
          report_id?: string
          shipping_address?: Json | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_orders_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "pet_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_credits: {
        Row: {
          created_at: string | null
          credits_remaining: number
          credits_total_purchased: number
          email: string | null
          id: string
          is_unlimited: boolean
          next_credit_refresh: string | null
          order_id: string | null
          plan: string | null
          report_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          weekly_credits: number | null
        }
        Insert: {
          created_at?: string | null
          credits_remaining?: number
          credits_total_purchased?: number
          email?: string | null
          id?: string
          is_unlimited?: boolean
          next_credit_refresh?: string | null
          order_id?: string | null
          plan?: string | null
          report_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          weekly_credits?: number | null
        }
        Update: {
          created_at?: string | null
          credits_remaining?: number
          credits_total_purchased?: number
          email?: string | null
          id?: string
          is_unlimited?: boolean
          next_credit_refresh?: string | null
          order_id?: string | null
          plan?: string | null
          report_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          weekly_credits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_credits_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "pet_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_credits_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "pet_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          order_id: string | null
          role: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          order_id?: string | null
          role: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          order_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pet_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_form_rate_limits: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      contact_history: {
        Row: {
          created_at: string
          email: string
          id: string
          is_refund_request: boolean | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_refund_request?: boolean | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_refund_request?: boolean | null
          subject?: string
        }
        Relationships: []
      }
      content_log: {
        Row: {
          account: string
          animal: string | null
          awareness_level: number | null
          blotato_post_id: string | null
          caption: string | null
          composed_storage_path: string | null
          composed_video_url: string | null
          content_ratio_slot: string | null
          content_type: string
          created_at: string
          hashtags: string | null
          hook_text: string | null
          id: string
          is_recycled: boolean | null
          original_post_id: string | null
          platform: string
          platform_post_id: string | null
          post_status: string | null
          series: string | null
          style_variant: string | null
          video_library_id: string | null
          workflow_id: string | null
        }
        Insert: {
          account: string
          animal?: string | null
          awareness_level?: number | null
          blotato_post_id?: string | null
          caption?: string | null
          composed_storage_path?: string | null
          composed_video_url?: string | null
          content_ratio_slot?: string | null
          content_type: string
          created_at?: string
          hashtags?: string | null
          hook_text?: string | null
          id?: string
          is_recycled?: boolean | null
          original_post_id?: string | null
          platform: string
          platform_post_id?: string | null
          post_status?: string | null
          series?: string | null
          style_variant?: string | null
          video_library_id?: string | null
          workflow_id?: string | null
        }
        Update: {
          account?: string
          animal?: string | null
          awareness_level?: number | null
          blotato_post_id?: string | null
          caption?: string | null
          composed_storage_path?: string | null
          composed_video_url?: string | null
          content_ratio_slot?: string | null
          content_type?: string
          created_at?: string
          hashtags?: string | null
          hook_text?: string | null
          id?: string
          is_recycled?: boolean | null
          original_post_id?: string | null
          platform?: string
          platform_post_id?: string | null
          post_status?: string | null
          series?: string | null
          style_variant?: string | null
          video_library_id?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_log_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "content_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_log_video_library_id_fkey"
            columns: ["video_library_id"]
            isOneToOne: false
            referencedRelation: "recyclable_clips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_log_video_library_id_fkey"
            columns: ["video_library_id"]
            isOneToOne: false
            referencedRelation: "video_library"
            referencedColumns: ["id"]
          },
        ]
      }
      content_performance: {
        Row: {
          comments: number | null
          completion_rate: number | null
          content_log_id: string
          engagement_rate: number | null
          id: string
          likes: number | null
          measured_at: string
          save_rate: number | null
          saves: number | null
          shares: number | null
          views: number | null
          virality_score: number | null
          watch_time_seconds: number | null
        }
        Insert: {
          comments?: number | null
          completion_rate?: number | null
          content_log_id: string
          engagement_rate?: number | null
          id?: string
          likes?: number | null
          measured_at?: string
          save_rate?: number | null
          saves?: number | null
          shares?: number | null
          views?: number | null
          virality_score?: number | null
          watch_time_seconds?: number | null
        }
        Update: {
          comments?: number | null
          completion_rate?: number | null
          content_log_id?: string
          engagement_rate?: number | null
          id?: string
          likes?: number | null
          measured_at?: string
          save_rate?: number | null
          saves?: number | null
          shares?: number | null
          views?: number | null
          virality_score?: number | null
          watch_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_performance_content_log_id_fkey"
            columns: ["content_log_id"]
            isOneToOne: false
            referencedRelation: "content_log"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmic_households: {
        Row: {
          cancelled_at: string | null
          created_at: string
          digest_day: number
          display_name: string | null
          email: string
          id: string
          last_digest_sent_at: string | null
          monthly_cents: number | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          weekly_digest_enabled: boolean
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          digest_day?: number
          display_name?: string | null
          email: string
          id?: string
          last_digest_sent_at?: string | null
          monthly_cents?: number | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          weekly_digest_enabled?: boolean
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          digest_day?: number
          display_name?: string | null
          email?: string
          id?: string
          last_digest_sent_at?: string | null
          monthly_cents?: number | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          weekly_digest_enabled?: boolean
        }
        Relationships: []
      }
      coupons: {
        Row: {
          bonus_type: string | null
          bonus_value: number | null
          code: string
          created_at: string
          current_uses: number
          discount_type: string
          discount_value: number
          expires_at: string | null
          gift_only: boolean
          id: string
          is_active: boolean
          max_uses: number | null
          min_purchase_cents: number | null
          tier_upgrade_target: string | null
          wheel_email: string | null
          wheel_prize_label: string | null
        }
        Insert: {
          bonus_type?: string | null
          bonus_value?: number | null
          code: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          gift_only?: boolean
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_purchase_cents?: number | null
          tier_upgrade_target?: string | null
          wheel_email?: string | null
          wheel_prize_label?: string | null
        }
        Update: {
          bonus_type?: string | null
          bonus_value?: number | null
          code?: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          gift_only?: boolean
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_purchase_cents?: number | null
          tier_upgrade_target?: string | null
          wheel_email?: string | null
          wheel_prize_label?: string | null
        }
        Relationships: []
      }
      customer_referrals: {
        Row: {
          created_at: string
          id: string
          referred_email: string
          referred_report_id: string | null
          referred_rewarded: boolean
          referrer_code: string
          referrer_email: string
          referrer_rewarded: boolean
          reward_type: string
          reward_value: number
        }
        Insert: {
          created_at?: string
          id?: string
          referred_email: string
          referred_report_id?: string | null
          referred_rewarded?: boolean
          referrer_code: string
          referrer_email: string
          referrer_rewarded?: boolean
          reward_type?: string
          reward_value?: number
        }
        Update: {
          created_at?: string
          id?: string
          referred_email?: string
          referred_report_id?: string | null
          referred_rewarded?: boolean
          referrer_code?: string
          referrer_email?: string
          referrer_rewarded?: boolean
          reward_type?: string
          reward_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_referrals_referred_report_id_fkey"
            columns: ["referred_report_id"]
            isOneToOne: false
            referencedRelation: "pet_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          ai_generated: boolean
          campaign_type: string
          content_preview: string | null
          id: string
          sent_at: string
          subject: string
          subscriber_id: string | null
        }
        Insert: {
          ai_generated?: boolean
          campaign_type: string
          content_preview?: string | null
          id?: string
          sent_at?: string
          subject: string
          subscriber_id?: string | null
        }
        Update: {
          ai_generated?: boolean
          campaign_type?: string
          content_preview?: string | null
          id?: string
          sent_at?: string
          subject?: string
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "email_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscribers: {
        Row: {
          created_at: string
          email: string
          emails_sent: number
          id: string
          intake_started_at: string | null
          is_subscribed: boolean
          journey_stage: string
          last_email_sent_at: string | null
          last_email_type: string | null
          pet_name: string | null
          pet_report_id: string | null
          purchase_completed_at: string | null
          referral_code: string | null
          source: string | null
          tier_purchased: string | null
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          emails_sent?: number
          id?: string
          intake_started_at?: string | null
          is_subscribed?: boolean
          journey_stage?: string
          last_email_sent_at?: string | null
          last_email_type?: string | null
          pet_name?: string | null
          pet_report_id?: string | null
          purchase_completed_at?: string | null
          referral_code?: string | null
          source?: string | null
          tier_purchased?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          emails_sent?: number
          id?: string
          intake_started_at?: string | null
          is_subscribed?: boolean
          journey_stage?: string
          last_email_sent_at?: string | null
          last_email_type?: string | null
          pet_name?: string | null
          pet_report_id?: string | null
          purchase_completed_at?: string | null
          referral_code?: string | null
          source?: string | null
          tier_purchased?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_subscribers_pet_report_id_fkey"
            columns: ["pet_report_id"]
            isOneToOne: false
            referencedRelation: "pet_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_certificates: {
        Row: {
          amount_cents: number
          code: string
          created_at: string
          expires_at: string | null
          gift_message: string | null
          gift_pets_json: Json | null
          gift_tier: string | null
          id: string
          is_redeemed: boolean
          pet_count: number
          purchaser_email: string
          recipient_email: string | null
          recipient_name: string | null
          redeemed_at: string | null
          redeemed_by_report_id: string | null
          stripe_session_id: string | null
        }
        Insert: {
          amount_cents: number
          code: string
          created_at?: string
          expires_at?: string | null
          gift_message?: string | null
          gift_pets_json?: Json | null
          gift_tier?: string | null
          id?: string
          is_redeemed?: boolean
          pet_count?: number
          purchaser_email: string
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by_report_id?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          amount_cents?: number
          code?: string
          created_at?: string
          expires_at?: string | null
          gift_message?: string | null
          gift_pets_json?: Json | null
          gift_tier?: string | null
          id?: string
          is_redeemed?: boolean
          pet_count?: number
          purchaser_email?: string
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by_report_id?: string | null
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_certificates_redeemed_by_report_id_fkey"
            columns: ["redeemed_by_report_id"]
            isOneToOne: false
            referencedRelation: "pet_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      horoscope_subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          email: string
          household_id: string | null
          id: string
          next_send_at: string
          occasion_mode: string | null
          pet_name: string
          pet_report_id: string | null
          plan: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          email: string
          household_id?: string | null
          id?: string
          next_send_at?: string
          occasion_mode?: string | null
          pet_name: string
          pet_report_id?: string | null
          plan?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          email?: string
          household_id?: string | null
          id?: string
          next_send_at?: string
          occasion_mode?: string | null
          pet_name?: string
          pet_report_id?: string | null
          plan?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "horoscope_subscriptions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "cosmic_households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horoscope_subscriptions_pet_report_id_fkey"
            columns: ["pet_report_id"]
            isOneToOne: false
            referencedRelation: "pet_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_prospects: {
        Row: {
          content_summary: string | null
          created_at: string
          email: string | null
          follower_estimate: string | null
          id: string
          instagram: string | null
          name: string
          niche: string | null
          notes: string | null
          pitch_content: string | null
          pitch_sent_at: string | null
          priority: number | null
          source: string | null
          status: string
          tiktok: string | null
          updated_at: string
          website: string | null
          youtube: string | null
        }
        Insert: {
          content_summary?: string | null
          created_at?: string
          email?: string | null
          follower_estimate?: string | null
          id?: string
          instagram?: string | null
          name: string
          niche?: string | null
          notes?: string | null
          pitch_content?: string | null
          pitch_sent_at?: string | null
          priority?: number | null
          source?: string | null
          status?: string
          tiktok?: string | null
          updated_at?: string
          website?: string | null
          youtube?: string | null
        }
        Update: {
          content_summary?: string | null
          created_at?: string
          email?: string | null
          follower_estimate?: string | null
          id?: string
          instagram?: string | null
          name?: string
          niche?: string | null
          notes?: string | null
          pitch_content?: string | null
          pitch_sent_at?: string | null
          priority?: number | null
          source?: string | null
          status?: string
          tiktok?: string | null
          updated_at?: string
          website?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      memorial_touchpoints: {
        Row: {
          created_at: string
          email: string | null
          id: string
          metadata: Json | null
          pet_birth_date: string | null
          pet_name: string | null
          pet_passed_date: string | null
          pronoun_subject: string | null
          report_id: string
          scheduled_for: string
          sent_at: string | null
          touchpoint_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          pet_birth_date?: string | null
          pet_name?: string | null
          pet_passed_date?: string | null
          pronoun_subject?: string | null
          report_id: string
          scheduled_for: string
          sent_at?: string | null
          touchpoint_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          pet_birth_date?: string | null
          pet_name?: string | null
          pet_passed_date?: string | null
          pronoun_subject?: string | null
          report_id?: string
          scheduled_for?: string
          sent_at?: string | null
          touchpoint_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memorial_touchpoints_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "pet_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          coupon_id: string | null
          created_at: string
          discount_cents: number
          gift_certificate_id: string | null
          id: string
          price_cents: number
          product_id: string | null
          report_id: string | null
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string
          discount_cents?: number
          gift_certificate_id?: string | null
          id?: string
          price_cents: number
          product_id?: string | null
          report_id?: string | null
        }
        Update: {
          coupon_id?: string | null
          created_at?: string
          discount_cents?: number
          gift_certificate_id?: string | null
          id?: string
          price_cents?: number
          product_id?: string | null
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_gift_certificate_id_fkey"
            columns: ["gift_certificate_id"]
            isOneToOne: false
            referencedRelation: "gift_certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "pet_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      page_analytics: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          page_path: string
          referrer: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          page_path: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          page_path?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      pet_compatibilities: {
        Row: {
          created_at: string
          email: string
          error_message: string | null
          id: string
          is_complimentary: boolean
          payment_status: string
          pet_report_a_id: string
          pet_report_b_id: string
          reading_content: Json | null
          share_token: string | null
          status: string
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          is_complimentary?: boolean
          payment_status?: string
          pet_report_a_id: string
          pet_report_b_id: string
          reading_content?: Json | null
          share_token?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          is_complimentary?: boolean
          payment_status?: string
          pet_report_a_id?: string
          pet_report_b_id?: string
          reading_content?: Json | null
          share_token?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_compatibilities_pet_report_a_id_fkey"
            columns: ["pet_report_a_id"]
            isOneToOne: false
            referencedRelation: "pet_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_compatibilities_pet_report_b_id_fkey"
            columns: ["pet_report_b_id"]
            isOneToOne: false
            referencedRelation: "pet_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_reports: {
        Row: {
          birth_date: string | null
          birth_location: string | null
          birth_time: string | null
          breed: string | null
          created_at: string
          email: string
          favorite_memory: string | null
          fulfillment_status: string | null
          gelato_order_id: string | null
          gender: string | null
          id: string
          includes_book: boolean
          includes_portrait: boolean | null
          language: string | null
          lulu_order_id: string | null
          occasion_mode: string | null
          owner_birth_date: string | null
          owner_birth_location: string | null
          owner_birth_time: string | null
          owner_compatibility_insights: Json | null
          owner_compatibility_score: number | null
          owner_memory: string | null
          owner_name: string | null
          passed_date: string | null
          payment_status: string | null
          pet_memory: Json | null
          pet_name: string
          pet_photo_url: string | null
          photo_description: string | null
          portrait_url: string | null
          redeem_code: string | null
          remembered_by: string | null
          report_content: Json | null
          share_token: string | null
          shipping_address: Json | null
          soul_type: string | null
          species: string
          stranger_reaction: string | null
          stripe_session_id: string | null
          superpower: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          birth_date?: string | null
          birth_location?: string | null
          birth_time?: string | null
          breed?: string | null
          created_at?: string
          email: string
          favorite_memory?: string | null
          fulfillment_status?: string | null
          gelato_order_id?: string | null
          gender?: string | null
          id?: string
          includes_book?: boolean
          includes_portrait?: boolean | null
          language?: string | null
          lulu_order_id?: string | null
          occasion_mode?: string | null
          owner_birth_date?: string | null
          owner_birth_location?: string | null
          owner_birth_time?: string | null
          owner_compatibility_insights?: Json | null
          owner_compatibility_score?: number | null
          owner_memory?: string | null
          owner_name?: string | null
          passed_date?: string | null
          payment_status?: string | null
          pet_memory?: Json | null
          pet_name: string
          pet_photo_url?: string | null
          photo_description?: string | null
          portrait_url?: string | null
          redeem_code?: string | null
          remembered_by?: string | null
          report_content?: Json | null
          share_token?: string | null
          shipping_address?: Json | null
          soul_type?: string | null
          species: string
          stranger_reaction?: string | null
          stripe_session_id?: string | null
          superpower?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          birth_date?: string | null
          birth_location?: string | null
          birth_time?: string | null
          breed?: string | null
          created_at?: string
          email?: string
          favorite_memory?: string | null
          fulfillment_status?: string | null
          gelato_order_id?: string | null
          gender?: string | null
          id?: string
          includes_book?: boolean
          includes_portrait?: boolean | null
          language?: string | null
          lulu_order_id?: string | null
          occasion_mode?: string | null
          owner_birth_date?: string | null
          owner_birth_location?: string | null
          owner_birth_time?: string | null
          owner_compatibility_insights?: Json | null
          owner_compatibility_score?: number | null
          owner_memory?: string | null
          owner_name?: string | null
          passed_date?: string | null
          payment_status?: string | null
          pet_memory?: Json | null
          pet_name?: string
          pet_photo_url?: string | null
          photo_description?: string | null
          portrait_url?: string | null
          redeem_code?: string | null
          remembered_by?: string | null
          report_content?: Json | null
          share_token?: string | null
          shipping_address?: Json | null
          soul_type?: string | null
          species?: string
          stranger_reaction?: string | null
          stripe_session_id?: string | null
          superpower?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean
          name: string
          price_cents: number
          product_type: string
          stripe_price_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          name: string
          price_cents: number
          product_type: string
          stripe_price_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          product_type?: string
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
        }
        Relationships: []
      }
      redeem_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          note: string | null
          tier: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          note?: string | null
          tier?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          note?: string | null
          tier?: string
        }
        Relationships: []
      }
      scheduled_emails: {
        Row: {
          ai_response: string
          created_at: string
          email: string
          id: string
          name: string
          original_message: string
          send_at: string
          sent_at: string | null
          subject: string
        }
        Insert: {
          ai_response: string
          created_at?: string
          email: string
          id?: string
          name: string
          original_message: string
          send_at: string
          sent_at?: string | null
          subject: string
        }
        Update: {
          ai_response?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          original_message?: string
          send_at?: string
          sent_at?: string | null
          subject?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          email: string
          favorite_feature: string | null
          id: string
          improvement_feedback: string | null
          is_approved: boolean | null
          is_featured: boolean | null
          pet_name: string
          photo_consent: boolean | null
          rating: number
          report_id: string | null
          review_text: string | null
          species: string | null
          would_recommend: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          favorite_feature?: string | null
          id?: string
          improvement_feedback?: string | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          pet_name: string
          photo_consent?: boolean | null
          rating: number
          report_id?: string | null
          review_text?: string | null
          species?: string | null
          would_recommend?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          favorite_feature?: string | null
          id?: string
          improvement_feedback?: string | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          pet_name?: string
          photo_consent?: boolean | null
          rating?: number
          report_id?: string | null
          review_text?: string | null
          species?: string | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "pet_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_cache: {
        Row: {
          created_at: string
          id: string
          source_text: string
          target_language: string
          translated_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          source_text: string
          target_language: string
          translated_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          source_text?: string
          target_language?: string
          translated_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      video_library: {
        Row: {
          animal: string
          aspect_ratio: string | null
          avg_save_rate: number | null
          created_at: string
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string
          is_archived: boolean | null
          is_raw: boolean | null
          last_used_account: string | null
          last_used_at: string | null
          public_url: string
          quality_score: number | null
          scene_description: string | null
          scene_slug: string
          sora_prompt: string | null
          source: string
          storage_path: string
          tags: string[] | null
          times_used: number | null
        }
        Insert: {
          animal: string
          aspect_ratio?: string | null
          avg_save_rate?: number | null
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          is_archived?: boolean | null
          is_raw?: boolean | null
          last_used_account?: string | null
          last_used_at?: string | null
          public_url: string
          quality_score?: number | null
          scene_description?: string | null
          scene_slug: string
          sora_prompt?: string | null
          source: string
          storage_path: string
          tags?: string[] | null
          times_used?: number | null
        }
        Update: {
          animal?: string
          aspect_ratio?: string | null
          avg_save_rate?: number | null
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          is_archived?: boolean | null
          is_raw?: boolean | null
          last_used_account?: string | null
          last_used_at?: string | null
          public_url?: string
          quality_score?: number | null
          scene_description?: string | null
          scene_slug?: string
          sora_prompt?: string | null
          source?: string
          storage_path?: string
          tags?: string[] | null
          times_used?: number | null
        }
        Relationships: []
      }
      webhook_failures: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string | null
          id: string
          order_id: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_note: string | null
          source: string
          stripe_session_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type?: string | null
          id?: string
          order_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_note?: string | null
          source: string
          stripe_session_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string | null
          id?: string
          order_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_note?: string | null
          source?: string
          stripe_session_id?: string | null
        }
        Relationships: []
      }
      weekly_horoscopes: {
        Row: {
          content: Json
          created_at: string
          id: string
          sent_at: string | null
          subscription_id: string
          week_start: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          sent_at?: string | null
          subscription_id: string
          week_start: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          sent_at?: string | null
          subscription_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_horoscopes_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "horoscope_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      wheel_spins: {
        Row: {
          coupon_id: string | null
          created_at: string
          email: string
          id: string
          ip_hash: string
          prize_label: string
          prize_slice: number
          redeemed_at: string | null
          source: string
          user_agent: string | null
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string
          email: string
          id?: string
          ip_hash: string
          prize_label: string
          prize_slice: number
          redeemed_at?: string | null
          source?: string
          user_agent?: string | null
        }
        Update: {
          coupon_id?: string | null
          created_at?: string
          email?: string
          id?: string
          ip_hash?: string
          prize_label?: string
          prize_slice?: number
          redeemed_at?: string | null
          source?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wheel_spins_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      breed_photo_library: {
        Row: {
          breed_slug: string | null
          expected_breed: string | null
          id: string | null
          photo_url: string | null
          storage_path: string | null
        }
        Insert: {
          breed_slug?: string | null
          expected_breed?: string | null
          id?: string | null
          photo_url?: string | null
          storage_path?: string | null
        }
        Update: {
          breed_slug?: string | null
          expected_breed?: string | null
          id?: string | null
          photo_url?: string | null
          storage_path?: string | null
        }
        Relationships: []
      }
      daily_post_summary: {
        Row: {
          account: string | null
          content_type: string | null
          failed: number | null
          platform: string | null
          post_date: string | null
          posts: number | null
          recycled: number | null
          successful: number | null
        }
        Relationships: []
      }
      recyclable_clips: {
        Row: {
          animal: string | null
          aspect_ratio: string | null
          avg_save_rate: number | null
          calc_save_rate: number | null
          created_at: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string | null
          is_archived: boolean | null
          is_raw: boolean | null
          last_used_account: string | null
          last_used_at: string | null
          public_url: string | null
          quality_score: number | null
          scene_description: string | null
          scene_slug: string | null
          sora_prompt: string | null
          source: string | null
          storage_path: string | null
          tags: string[] | null
          times_used: number | null
          total_uses: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_affiliate_sessions: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      decrement_affiliate_balance: {
        Args: { p_affiliate_id: string; p_amount_cents: number }
        Returns: undefined
      }
      decrement_chat_credits: {
        Args: { p_amount: number; p_order_id: string }
        Returns: number
      }
      increment_affiliate_stats: {
        Args: { p_affiliate_id: string; p_commission_cents: number }
        Returns: undefined
      }
      increment_chat_credits: {
        Args: { p_amount: number; p_order_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
