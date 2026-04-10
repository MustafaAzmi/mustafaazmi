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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          anonymous_id: string
          created_at: string
          id: string
          message: string
          profile_id: string
          sender_type: string
        }
        Insert: {
          anonymous_id: string
          created_at?: string
          id?: string
          message: string
          profile_id: string
          sender_type: string
        }
        Update: {
          anonymous_id?: string
          created_at?: string
          id?: string
          message?: string
          profile_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guesses: {
        Row: {
          created_at: string
          guess_text: string
          id: string
          interaction_anonymous_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          guess_text: string
          id?: string
          interaction_anonymous_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          guess_text?: string
          id?: string
          interaction_anonymous_id?: string
          user_id?: string
        }
        Relationships: []
      }
      interactions: {
        Row: {
          anonymous_id: string | null
          city: string | null
          created_at: string
          device_type: string | null
          id: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          message: string | null
          profile_id: string
          session_fingerprint: string | null
        }
        Insert: {
          anonymous_id?: string | null
          city?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          message?: string | null
          profile_id: string
          session_fingerprint?: string | null
        }
        Update: {
          anonymous_id?: string | null
          city?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          interaction_type?: Database["public"]["Enums"]["interaction_type"]
          message?: string | null
          profile_id?: string
          session_fingerprint?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          currency: string
          id: string
          method: string
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          method: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          method?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          is_blocked: boolean
          is_vip: boolean
          user_id: string
          username: string
          vip_until: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_blocked?: boolean
          is_vip?: boolean
          user_id: string
          username: string
          vip_until?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_blocked?: boolean
          is_vip?: boolean
          user_id?: string
          username?: string
          vip_until?: string | null
        }
        Relationships: []
      }
      puzzle_progress: {
        Row: {
          id: string
          interaction_anonymous_id: string
          puzzle_id: string
          solved_at: string
          user_id: string
        }
        Insert: {
          id?: string
          interaction_anonymous_id: string
          puzzle_id: string
          solved_at?: string
          user_id: string
        }
        Update: {
          id?: string
          interaction_anonymous_id?: string
          puzzle_id?: string
          solved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "puzzle_progress_puzzle_id_fkey"
            columns: ["puzzle_id"]
            isOneToOne: false
            referencedRelation: "puzzles"
            referencedColumns: ["id"]
          },
        ]
      }
      puzzles: {
        Row: {
          answer: string
          created_at: string
          difficulty: string
          hint_reward: string
          id: string
          level: number
          question: string
        }
        Insert: {
          answer: string
          created_at?: string
          difficulty?: string
          hint_reward: string
          id?: string
          level: number
          question: string
        }
        Update: {
          answer?: string
          created_at?: string
          difficulty?: string
          hint_reward?: string
          id?: string
          level?: number
          question?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      interaction_type:
        | "interested"
        | "curious"
        | "message"
        | "proximity_close"
        | "proximity_circle"
        | "proximity_often"
        | "time_past"
        | "time_recent"
        | "time_long"
        | "relationship_friend"
        | "relationship_know"
        | "relationship_interested"
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
      interaction_type: [
        "interested",
        "curious",
        "message",
        "proximity_close",
        "proximity_circle",
        "proximity_often",
        "time_past",
        "time_recent",
        "time_long",
        "relationship_friend",
        "relationship_know",
        "relationship_interested",
      ],
    },
  },
} as const
