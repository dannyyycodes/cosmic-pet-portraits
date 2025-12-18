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
      gift_certificates: {
        Row: {
          amount_cents: number
          code: string
          created_at: string
          expires_at: string | null
          gift_message: string | null
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
          breed: string | null
          created_at: string
          email: string
          gender: string | null
          id: string
          occasion_mode: string | null
          payment_status: string | null
          pet_name: string
          report_content: Json | null
          soul_type: string | null
          species: string
          stranger_reaction: string | null
          stripe_session_id: string | null
          superpower: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          birth_location?: string | null
          breed?: string | null
          created_at?: string
          email: string
          gender?: string | null
          id?: string
          occasion_mode?: string | null
          payment_status?: string | null
          pet_name: string
          report_content?: Json | null
          soul_type?: string | null
          species: string
          stranger_reaction?: string | null
          stripe_session_id?: string | null
          superpower?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          birth_location?: string | null
          breed?: string | null
          created_at?: string
          email?: string
          gender?: string | null
          id?: string
          occasion_mode?: string | null
          payment_status?: string | null
          pet_name?: string
          report_content?: Json | null
          soul_type?: string | null
          species?: string
          stranger_reaction?: string | null
          stripe_session_id?: string | null
          superpower?: string | null
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
