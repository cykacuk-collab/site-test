export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name_fr: string
          name_en: string
          description_fr: string | null
          description_en: string | null
          price_cents: number
          stock: number
          image_url: string | null
          category: 'sweet' | 'savory'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          stripe_session_id: string
          customer_email: string
          customer_name: string | null
          amount_total_cents: number
          status: 'pending' | 'paid' | 'expired' | 'fulfilled' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price_at_purchase_cents: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
      }
      webhook_events: {
        Row: {
          stripe_event_id: string
          type: string
          status: string | null
          processed_at: string
        }
        Insert: Omit<Database['public']['Tables']['webhook_events']['Row'], 'processed_at'>
        Update: Partial<Database['public']['Tables']['webhook_events']['Insert']>
      }
      completed_carts: {
        Row: {
          cart_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['completed_carts']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['completed_carts']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      process_cart_lock: {
        Args: { cart_items: Json }
        Returns: void
      }
      release_cart_lock: {
        Args: { cart_items: Json }
        Returns: void
      }
      process_order_transaction: {
        Args: {
          p_session_id: string
          p_email: string
          p_name: string
          p_amount: number
          p_cart_id: string
          p_items: Json
          p_stripe_event_id: string
        }
        Returns: void
      }
      increment_stock: {
        Args: { p_id: string; p_amount: number }
        Returns: void
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
