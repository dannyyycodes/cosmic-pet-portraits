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
      coupons: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_purchase_cents: number | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_purchase_cents?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_purchase_cents?: number | null
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
          gift_tier: string | null
          id: string
          is_redeemed: boolean
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
          gift_tier?: string | null
          id?: string
          is_redeemed?: boolean
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
          gift_tier?: string | null
          id?: string
          is_redeemed?: boolean
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
          id: string
          next_send_at: string
          pet_name: string
          pet_report_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          email: string
          id?: string
          next_send_at?: string
          pet_name: string
          pet_report_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          email?: string
          id?: string
          next_send_at?: string
          pet_name?: string
          pet_report_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "horoscope_subscriptions_pet_report_id_fkey"
            columns: ["pet_report_id"]
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
      pet_reports: {
        Row: {
          birth_date: string | null
          birth_location: string | null
          birth_time: string | null
          breed: string | null
          created_at: string
          email: string
          gender: string | null
          id: string
          language: string | null
          occasion_mode: string | null
          payment_status: string | null
          pet_name: string
          pet_photo_url: string | null
          portrait_url: string | null
          report_content: Json | null
          share_token: string | null
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
          gender?: string | null
          id?: string
          language?: string | null
          occasion_mode?: string | null
          payment_status?: string | null
          pet_name: string
          pet_photo_url?: string | null
          portrait_url?: string | null
          report_content?: Json | null
          share_token?: string | null
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
          gender?: string | null
          id?: string
          language?: string | null
          occasion_mode?: string | null
          payment_status?: string | null
          pet_name?: string
          pet_photo_url?: string | null
          portrait_url?: string | null
          report_content?: Json | null
          share_token?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      increment_affiliate_stats: {
        Args: { p_affiliate_id: string; p_commission_cents: number }
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
