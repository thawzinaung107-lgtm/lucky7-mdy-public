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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      buyer_sessions: {
        Row: {
          buyer_id: number
          created_at: string
          expires_at: string
          revoked_at: string | null
          token_hash: string
        }
        Insert: {
          buyer_id: number
          created_at?: string
          expires_at: string
          revoked_at?: string | null
          token_hash: string
        }
        Update: {
          buyer_id?: number
          created_at?: string
          expires_at?: string
          revoked_at?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_sessions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["telegram_user_id"]
          },
        ]
      }
      buyers: {
        Row: {
          created_at: string
          customer_group: string
          first_name: string | null
          last_name: string | null
          telegram_user_id: number
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          customer_group?: string
          first_name?: string | null
          last_name?: string | null
          telegram_user_id: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          customer_group?: string
          first_name?: string | null
          last_name?: string | null
          telegram_user_id?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_token: string
          payload: Json
          qty: number
          variant_id: string
        }
        Insert: {
          cart_token: string
          payload: Json
          qty: number
          variant_id: string
        }
        Update: {
          cart_token?: string
          payload?: Json
          qty?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_token_fkey"
            columns: ["cart_token"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["token"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name_en: string
          name_my: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name_en: string
          name_my: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name_en?: string
          name_my?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      order_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          order_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          order_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          color_en: string
          color_my: string
          id: string
          name_en: string
          name_my: string
          order_id: string
          original_unit_price_mmk: number
          product_id: string
          qty: number
          returned_qty: number
          size_label: string
          unit_price_mmk: number
          variant_id: string
        }
        Insert: {
          color_en: string
          color_my: string
          id?: string
          name_en: string
          name_my: string
          order_id: string
          original_unit_price_mmk: number
          product_id: string
          qty: number
          returned_qty?: number
          size_label: string
          unit_price_mmk: number
          variant_id: string
        }
        Update: {
          color_en?: string
          color_my?: string
          id?: string
          name_en?: string
          name_my?: string
          order_id?: string
          original_unit_price_mmk?: number
          product_id?: string
          qty?: number
          returned_qty?: number
          size_label?: string
          unit_price_mmk?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          buyer_agreed: boolean
          buyer_name: string
          buyer_notes: string
          cancellation_reason: string | null
          completed_at: string | null
          created_at: string
          delivery_mmk: number
          delivery_service: string
          discount_mmk: number
          final_total_mmk: number
          id: string
          order_number: string
          payment_method: string
          payment_proof: string | null
          payment_status: string
          payment_verified_at: string | null
          payment_verified_by: string | null
          phone: string
          public_notes: string
          receipt_hash: string
          request_key: string
          revision: number
          shipped_at: string | null
          staff_notes: string
          status: string
          subtotal_mmk: number
          tracking_number: string
          updated_at: string
          user_id: string | null
          wholesale_eligible: boolean
        }
        Insert: {
          address: string
          buyer_agreed?: boolean
          buyer_name: string
          buyer_notes?: string
          cancellation_reason?: string | null
          completed_at?: string | null
          created_at?: string
          delivery_mmk?: number
          delivery_service?: string
          discount_mmk?: number
          final_total_mmk?: number
          id?: string
          order_number?: string
          payment_method: string
          payment_proof?: string | null
          payment_status?: string
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          phone: string
          public_notes?: string
          receipt_hash: string
          request_key: string
          revision?: number
          shipped_at?: string | null
          staff_notes?: string
          status?: string
          subtotal_mmk?: number
          tracking_number?: string
          updated_at?: string
          user_id?: string | null
          wholesale_eligible?: boolean
        }
        Update: {
          address?: string
          buyer_agreed?: boolean
          buyer_name?: string
          buyer_notes?: string
          cancellation_reason?: string | null
          completed_at?: string | null
          created_at?: string
          delivery_mmk?: number
          delivery_service?: string
          discount_mmk?: number
          final_total_mmk?: number
          id?: string
          order_number?: string
          payment_method?: string
          payment_proof?: string | null
          payment_status?: string
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          phone?: string
          public_notes?: string
          receipt_hash?: string
          request_key?: string
          revision?: number
          shipped_at?: string | null
          staff_notes?: string
          status?: string
          subtotal_mmk?: number
          tracking_number?: string
          updated_at?: string
          user_id?: string | null
          wholesale_eligible?: boolean
        }
        Relationships: []
      }
      product_price_tiers: {
        Row: {
          created_at: string
          customer_group: string
          id: string
          min_qty: number
          product_id: string
          unit_price_mmk: number
        }
        Insert: {
          created_at?: string
          customer_group: string
          id?: string
          min_qty: number
          product_id: string
          unit_price_mmk: number
        }
        Update: {
          created_at?: string
          customer_group?: string
          id?: string
          min_qty?: number
          product_id?: string
          unit_price_mmk?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_price_tiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          available_qty: number | null
          color_en: string
          color_my: string
          created_at: string
          id: string
          is_active: boolean
          product_id: string
          reserved_qty: number
          size_label: string
          sku: string
          stock_qty: number
        }
        Insert: {
          available_qty?: number | null
          color_en: string
          color_my?: string
          created_at?: string
          id?: string
          is_active?: boolean
          product_id: string
          reserved_qty?: number
          size_label: string
          sku: string
          stock_qty?: number
        }
        Update: {
          available_qty?: number | null
          color_en?: string
          color_my?: string
          created_at?: string
          id?: string
          is_active?: boolean
          product_id?: string
          reserved_qty?: number
          size_label?: string
          sku?: string
          stock_qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          moq: number
          name_en: string
          name_my: string
          order_step: number
          primary_image_url: string | null
          retail_price_mmk: number | null
          slug: string
          status: string
          summary_en: string
          summary_my: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          moq?: number
          name_en?: string
          name_my?: string
          order_step?: number
          primary_image_url?: string | null
          retail_price_mmk?: number | null
          slug: string
          status?: string
          summary_en?: string
          summary_my?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          moq?: number
          name_en?: string
          name_my?: string
          order_step?: number
          primary_image_url?: string | null
          retail_price_mmk?: number | null
          slug?: string
          status?: string
          summary_en?: string
          summary_my?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          telegram_user_id: number
        }
        Insert: {
          created_at?: string
          telegram_user_id: number
        }
        Update: {
          created_at?: string
          telegram_user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "staff_telegram_user_id_fkey"
            columns: ["telegram_user_id"]
            isOneToOne: true
            referencedRelation: "buyers"
            referencedColumns: ["telegram_user_id"]
          },
        ]
      }
      staff_emails: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      telegram_chats: {
        Row: {
          chat_id: number
          first_name: string | null
          is_blocked: boolean
          last_seen_at: string
          opted_in_at: string
          username: string | null
        }
        Insert: {
          chat_id: number
          first_name?: string | null
          is_blocked?: boolean
          last_seen_at?: string
          opted_in_at?: string
          username?: string | null
        }
        Update: {
          chat_id?: number
          first_name?: string | null
          is_blocked?: boolean
          last_seen_at?: string
          opted_in_at?: string
          username?: string | null
        }
        Relationships: []
      }
      telegram_updates: {
        Row: {
          processed_at: string | null
          received_at: string
          update_id: number
        }
        Insert: {
          processed_at?: string | null
          received_at?: string
          update_id: number
        }
        Update: {
          processed_at?: string | null
          received_at?: string
          update_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_pending_order: {
        Args: {
          p_buyer: Json
          p_items: Json
          p_notes: string
          p_receipt: string
          p_request: string
          p_user: string
        }
        Returns: string
      }
      is_order_staff: { Args: never; Returns: boolean }
      manage_order: {
        Args: {
          p_action: string
          p_actor: string
          p_id: string
          p_patch: Json
          p_revision: number
        }
        Returns: undefined
      }
      submit_order_evidence: {
        Args: { p_id: string; p_image: string; p_revision: number }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
