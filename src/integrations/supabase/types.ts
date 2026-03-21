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
      breastfeeding_sessions: {
        Row: {
          amount_ml: number | null
          child_id: string | null
          created_at: string
          duration_minutes: number | null
          end_time: string | null
          feed_type: string
          id: string
          notes: string | null
          side: string
          start_time: string
          user_id: string
        }
        Insert: {
          amount_ml?: number | null
          child_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          feed_type?: string
          id?: string
          notes?: string | null
          side?: string
          start_time?: string
          user_id: string
        }
        Update: {
          amount_ml?: number | null
          child_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          feed_type?: string
          id?: string
          notes?: string | null
          side?: string
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "breastfeeding_sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          ai_summary: string | null
          created_at: string
          escalated_at: string | null
          id: string
          patient_location: string | null
          risk_level: string | null
          status: string
          subject: string | null
          updated_at: string
          user_id: string
          worker_id: string | null
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          escalated_at?: string | null
          id?: string
          patient_location?: string | null
          risk_level?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id: string
          worker_id?: string | null
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          escalated_at?: string | null
          id?: string
          patient_location?: string | null
          risk_level?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
          worker_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          created_at: string
          date_of_birth: string
          gender: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth: string
          gender?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string
          gender?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contraction_sessions: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          notes: string | null
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          start_time?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      contractions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          end_time: string | null
          id: string
          intensity: string | null
          interval_seconds: number | null
          session_id: string
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          intensity?: string | null
          interval_seconds?: number | null
          session_id: string
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          intensity?: string | null
          interval_seconds?: number | null
          session_id?: string
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contraction_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      diaper_logs: {
        Row: {
          change_time: string
          child_id: string | null
          color: string | null
          created_at: string
          diaper_type: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          change_time?: string
          child_id?: string | null
          color?: string | null
          created_at?: string
          diaper_type?: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          change_time?: string
          child_id?: string | null
          color?: string | null
          created_at?: string
          diaper_type?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diaper_logs_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          reply_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          reply_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          reply_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_likes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_likes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          is_anonymous: boolean | null
          likes_count: number | null
          replies_count: number | null
          title: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          likes_count?: number | null
          replies_count?: number | null
          title: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          likes_count?: number | null
          replies_count?: number | null
          title?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          is_anonymous: boolean | null
          likes_count: number | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          likes_count?: number | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          likes_count?: number | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_logs: {
        Row: {
          child_id: string
          created_at: string
          date: string
          head_circumference_cm: number | null
          height_cm: number | null
          id: string
          notes: string | null
          weight_kg: number | null
        }
        Insert: {
          child_id: string
          created_at?: string
          date: string
          head_circumference_cm?: number | null
          height_cm?: number | null
          id?: string
          notes?: string | null
          weight_kg?: number | null
        }
        Update: {
          child_id?: string
          created_at?: string
          date?: string
          head_circumference_cm?: number | null
          height_cm?: number | null
          id?: string
          notes?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_logs_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      health_journal: {
        Row: {
          created_at: string
          date: string
          energy_level: number | null
          id: string
          mood: string
          notes: string | null
          sleep_hours: number | null
          symptoms: string[] | null
          updated_at: string
          user_id: string
          water_glasses: number | null
        }
        Insert: {
          created_at?: string
          date?: string
          energy_level?: number | null
          id?: string
          mood?: string
          notes?: string | null
          sleep_hours?: number | null
          symptoms?: string[] | null
          updated_at?: string
          user_id: string
          water_glasses?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          energy_level?: number | null
          id?: string
          mood?: string
          notes?: string | null
          sleep_hours?: number | null
          symptoms?: string[] | null
          updated_at?: string
          user_id?: string
          water_glasses?: number | null
        }
        Relationships: []
      }
      kick_counter_sessions: {
        Row: {
          child_id: string | null
          created_at: string
          duration_minutes: number | null
          end_time: string | null
          id: string
          kick_count: number
          notes: string | null
          start_time: string
          user_id: string
        }
        Insert: {
          child_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          kick_count?: number
          notes?: string | null
          start_time?: string
          user_id: string
        }
        Update: {
          child_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          kick_count?: number
          notes?: string | null
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kick_counter_sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          achieved_date: string | null
          age_in_months: number
          category: string
          child_id: string | null
          created_at: string
          description: string | null
          id: string
          is_achieved: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          achieved_date?: string | null
          age_in_months: number
          category: string
          child_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_achieved?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          achieved_date?: string | null
          age_in_months?: number
          category?: string
          child_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_achieved?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          child_dob: string | null
          created_at: string
          email: string | null
          id: string
          is_onboarded: boolean | null
          language: string | null
          location: string | null
          name: string
          phone: string | null
          pregnancy_stage: string | null
          pregnancy_week: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          child_dob?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_onboarded?: boolean | null
          language?: string | null
          location?: string | null
          name: string
          phone?: string | null
          pregnancy_stage?: string | null
          pregnancy_week?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          child_dob?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_onboarded?: boolean | null
          language?: string | null
          location?: string | null
          name?: string
          phone?: string | null
          pregnancy_stage?: string | null
          pregnancy_week?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          description: string | null
          due_date: string
          due_time: string | null
          id: string
          is_completed: boolean | null
          is_recurring: boolean | null
          recurring_pattern: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date: string
          due_time?: string | null
          id?: string
          is_completed?: boolean | null
          is_recurring?: boolean | null
          recurring_pattern?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string
          due_time?: string | null
          id?: string
          is_completed?: boolean | null
          is_recurring?: boolean | null
          recurring_pattern?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sleep_logs: {
        Row: {
          child_id: string | null
          created_at: string
          duration_minutes: number | null
          end_time: string | null
          id: string
          notes: string | null
          quality: string | null
          sleep_type: string
          start_time: string
          user_id: string
        }
        Insert: {
          child_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          quality?: string | null
          sleep_type?: string
          start_time?: string
          user_id: string
        }
        Update: {
          child_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          quality?: string | null
          sleep_type?: string
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sleep_logs_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_messages: {
        Row: {
          content: string
          created_at: string
          direction: string
          id: string
          message_type: string
          phone_number: string
          session_id: string | null
          status: string
        }
        Insert: {
          content: string
          created_at?: string
          direction?: string
          id?: string
          message_type?: string
          phone_number: string
          session_id?: string | null
          status?: string
        }
        Update: {
          content?: string
          created_at?: string
          direction?: string
          id?: string
          message_type?: string
          phone_number?: string
          session_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sms_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_sessions: {
        Row: {
          created_at: string
          id: string
          last_activity_at: string
          phone_number: string
          session_data: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_activity_at?: string
          phone_number: string
          session_data?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_activity_at?: string
          phone_number?: string
          session_data?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vaccinations: {
        Row: {
          age_in_weeks: number
          child_id: string | null
          completed_date: string | null
          created_at: string
          description: string | null
          id: string
          is_completed: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age_in_weeks: number
          child_id?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age_in_weeks?: number
          child_id?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccinations_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      forum_posts_safe: {
        Row: {
          content: string | null
          created_at: string | null
          id: string | null
          is_anonymous: boolean | null
          likes_count: number | null
          replies_count: number | null
          title: string | null
          topic: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          is_anonymous?: boolean | null
          likes_count?: number | null
          replies_count?: number | null
          title?: string | null
          topic?: string | null
          updated_at?: string | null
          user_id?: never
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          is_anonymous?: boolean | null
          likes_count?: number | null
          replies_count?: number | null
          title?: string | null
          topic?: string | null
          updated_at?: string | null
          user_id?: never
        }
        Relationships: []
      }
      forum_replies_safe: {
        Row: {
          content: string | null
          created_at: string | null
          id: string | null
          is_anonymous: boolean | null
          likes_count: number | null
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          is_anonymous?: boolean | null
          likes_count?: number | null
          post_id?: string | null
          user_id?: never
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          is_anonymous?: boolean | null
          likes_count?: number | null
          post_id?: string | null
          user_id?: never
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
