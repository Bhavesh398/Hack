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
      cluster_complaints: {
        Row: {
          cluster_id: string | null
          complaint_id: string | null
          id: string
        }
        Insert: {
          cluster_id?: string | null
          complaint_id?: string | null
          id?: string
        }
        Update: {
          cluster_id?: string | null
          complaint_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cluster_complaints_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "complaint_clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cluster_complaints_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_clusters: {
        Row: {
          category: string
          cluster_name: string
          complaint_count: number | null
          created_at: string
          id: string
          location: string | null
          priority: Database["public"]["Enums"]["priority_level"]
        }
        Insert: {
          category: string
          cluster_name: string
          complaint_count?: number | null
          created_at?: string
          id?: string
          location?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
        }
        Update: {
          category?: string
          cluster_name?: string
          complaint_count?: number | null
          created_at?: string
          id?: string
          location?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
        }
        Relationships: []
      }
      complaints: {
        Row: {
          affected_people: number | null
          assigned_officer: string | null
          category: string
          citizen_email: string | null
          citizen_name: string
          citizen_phone: string | null
          complaint_id: string
          created_at: string
          department_id: string | null
          description: string
          id: string
          impact_prediction: string | null
          location: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          priority_score: number | null
          resolved_at: string | null
          sentiment_score: number | null
          sla_hours: number | null
          status: Database["public"]["Enums"]["complaint_status"]
          sub_category: string | null
          updated_at: string
          urgency_keywords: string[] | null
        }
        Insert: {
          affected_people?: number | null
          assigned_officer?: string | null
          category: string
          citizen_email?: string | null
          citizen_name: string
          citizen_phone?: string | null
          complaint_id: string
          created_at?: string
          department_id?: string | null
          description: string
          id?: string
          impact_prediction?: string | null
          location?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          priority_score?: number | null
          resolved_at?: string | null
          sentiment_score?: number | null
          sla_hours?: number | null
          status?: Database["public"]["Enums"]["complaint_status"]
          sub_category?: string | null
          updated_at?: string
          urgency_keywords?: string[] | null
        }
        Update: {
          affected_people?: number | null
          assigned_officer?: string | null
          category?: string
          citizen_email?: string | null
          citizen_name?: string
          citizen_phone?: string | null
          complaint_id?: string
          created_at?: string
          department_id?: string | null
          description?: string
          id?: string
          impact_prediction?: string | null
          location?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          priority_score?: number | null
          resolved_at?: string | null
          sentiment_score?: number | null
          sla_hours?: number | null
          status?: Database["public"]["Enums"]["complaint_status"]
          sub_category?: string | null
          updated_at?: string
          urgency_keywords?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "complaints_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          avg_resolution_hours: number | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          avg_resolution_hours?: number | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          avg_resolution_hours?: number | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
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
      complaint_status: "received" | "assigned" | "in_progress" | "resolved"
      priority_level: "critical" | "high" | "medium" | "low"
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
      complaint_status: ["received", "assigned", "in_progress", "resolved"],
      priority_level: ["critical", "high", "medium", "low"],
    },
  },
} as const
