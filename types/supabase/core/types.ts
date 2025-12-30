/**
 * @domain integrations
 * @description Supabase core types for database schema and JSON handling
 * @author Corso Development Team
 * @since 2.1.0
 */

/**
 * JSON value type for Supabase database operations
 * Represents valid JSON values that can be stored in Supabase
 */
type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Supabase database schema interface
 * This should be generated from your actual Supabase schema
 * @see https://supabase.com/docs/guides/api/generating-types
 */
export interface Database {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          role: 'user' | 'assistant' | 'system';
          content: string;
          metadata: Json | null;
          created_at?: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          role: 'user' | 'assistant' | 'system';
          content: string;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          session_id: string | null;
          role: 'user' | 'assistant' | 'system';
          content: string;
          metadata: Json | null;
          created_at: string | null;
        }>;
        Relationships: [];
      };
      user_preferences: {
        Row: {
          user_id: string;
          onboarding_completed?: boolean;
          onboarding_progress?: Json;
          onboarding_payload?: Json;
          onboarding_step_order?: Json;
        };
        Insert: {
          user_id: string;
          onboarding_completed?: boolean;
          onboarding_progress?: Json;
          onboarding_payload?: Json;
          onboarding_step_order?: Json;
        };
        Update: {
          user_id?: string;
          onboarding_completed?: boolean;
          onboarding_progress?: Json;
          onboarding_payload?: Json;
          onboarding_step_order?: Json;
        };
        Relationships: [];
      };

      stripe_webhook_events: {
        Row: {
          id: string;
          processed_at: string | null;
        };
        Insert: {
          id: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          processed_at?: string | null;
        };
        Relationships: [];
      };

      clerk_webhook_events: {
        Row: {
          id: string;
          created_at: string | null;
          type: string | null;
          payload: Json | null;
        };
        Insert: {
          id: string;
          created_at?: string | null;
          type?: string | null;
          payload?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          type?: string | null;
          payload?: Json | null;
        };
        Relationships: [];
      };

      org_subscriptions: {
        Row: {
          plan: string | null;
          status: string | null;
          current_period_end: number | null;
          cancel_at_period_end: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          plan?: string | null;
          status?: string | null;
          current_period_end?: number | null;
          cancel_at_period_end?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          plan?: string | null;
          status?: string | null;
          current_period_end?: number | null;
          cancel_at_period_end?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      subscriptions: {
        Row: {
          clerk_id: string;
          stripe_customer: string | null;
          plan: string | null;
          status: string | null;
          current_period_end: number | null;
          cancel_at_period_end: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          clerk_id: string;
          stripe_customer?: string | null;
          plan?: string | null;
          status?: string | null;
          current_period_end?: number | null;
          cancel_at_period_end?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          clerk_id?: string;
          stripe_customer?: string | null;
          plan?: string | null;
          status?: string | null;
          current_period_end?: number | null;
          cancel_at_period_end?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      subscription_trials: {
        Row: {
          stripe_event_id: string;
          subscription_id: string;
          trial_end: number | null;
          created_at: string;
        };
        Insert: {
          stripe_event_id: string;
          subscription_id: string;
          trial_end?: number | null;
          created_at: string;
        };
        Update: {
          stripe_event_id?: string;
          subscription_id?: string;
          trial_end?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };

      checkout_sessions: {
        Row: {
          id: string;
          user_id: string;
          price_id: string;
          checkout_url: string;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          price_id: string;
          checkout_url: string;
          created_at: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          price_id?: string;
          checkout_url?: string;
          created_at?: string;
          expires_at?: string;
        };
        Relationships: [];
      };

      saved_views: {
        Row: { id: string; user_id: string; [k: string]: Json | string | number | boolean | null | undefined };
        Insert: { id?: string; user_id: string } & Record<string, unknown>;
        Update: Partial<{ id: string; user_id: string }> & Record<string, unknown>;
        Relationships: [];
      };
      // NOTE: watchlists table is deprecated - functionality removed from MVP
      watchlists: {
        Row: { id: string; user_id: string; [k: string]: Json | string | number | boolean | null | undefined };
        Insert: { id?: string; user_id: string } & Record<string, unknown>;
        Update: Partial<{ id: string; user_id: string }> & Record<string, unknown>;
        Relationships: [];
      };
      saved_files: {
        Row: { id: string; user_id: string; [k: string]: Json | string | number | boolean | null | undefined };
        Insert: { id?: string; user_id: string } & Record<string, unknown>;
        Update: Partial<{ id: string; user_id: string }> & Record<string, unknown>;
        Relationships: [];
      };
      projects: {
        Row: { id: string } & Record<string, unknown>;
        Insert: { id?: string } & Record<string, unknown>;
        Update: Partial<{ id: string }> & Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, unknown>;
  };
}



