export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          check_in_time: string
          check_out_time: string | null
          created_at: string
          date: string
          id: string
          user_id: string
        }
        Insert: {
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string
          date?: string
          id?: string
          user_id: string
        }
        Update: {
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_bookings: {
        Row: {
          booking_date: string
          class_id: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_date?: string
          class_id: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          class_id?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_bookings_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          current_bookings: number
          date: string
          description: string | null
          end_time: string
          id: string
          max_capacity: number
          name: string
          room_location: string | null
          start_time: string
          status: Database["public"]["Enums"]["class_status"]
          trainer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_bookings?: number
          date: string
          description?: string | null
          end_time: string
          id?: string
          max_capacity?: number
          name: string
          room_location?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["class_status"]
          trainer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_bookings?: number
          date?: string
          description?: string | null
          end_time?: string
          id?: string
          max_capacity?: number
          name?: string
          room_location?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["class_status"]
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          location: string | null
          maintenance_schedule: string | null
          model: string | null
          name: string
          purchase_date: string | null
          status: string
          type: string | null
          updated_at: string
          warranty_end_date: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          location?: string | null
          maintenance_schedule?: string | null
          model?: string | null
          name: string
          purchase_date?: string | null
          status?: string
          type?: string | null
          updated_at?: string
          warranty_end_date?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
          location?: string | null
          maintenance_schedule?: string | null
          model?: string | null
          name?: string
          purchase_date?: string | null
          status?: string
          type?: string | null
          updated_at?: string
          warranty_end_date?: string | null
        }
        Relationships: []
      }
      equipment_usage: {
        Row: {
          created_at: string
          end_time: string | null
          equipment_id: string
          id: string
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          equipment_id: string
          id?: string
          start_time?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          equipment_id?: string
          id?: string
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_usage_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          created_at: string
          description: string | null
          duration_months: number
          features: string[] | null
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_months: number
          features?: string[] | null
          id?: string
          is_active?: boolean
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_months?: number
          features?: string[] | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string
          end_date: string
          id: string
          plan_id: string
          start_date: string
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          plan_id: string
          start_date: string
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          plan_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          sent_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          sent_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          sent_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          membership_id: string | null
          payment_date: string | null
          payment_method: string
          status: Database["public"]["Enums"]["payment_status"]
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          membership_id?: string | null
          payment_date?: string | null
          payment_method: string
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          membership_id?: string | null
          payment_date?: string | null
          payment_method?: string
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          phone: string | null
          profile_image_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          gender?: string | null
          id: string
          last_name: string
          phone?: string | null
          profile_image_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          profile_image_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      workout_schedules: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          notes: string | null
          scheduled_date: string
          scheduled_time: string
          trainer_id: string | null
          updated_at: string
          user_id: string
          workout_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_date: string
          scheduled_time: string
          trainer_id?: string | null
          updated_at?: string
          user_id: string
          workout_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_date?: string
          scheduled_time?: string
          trainer_id?: string | null
          updated_at?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_schedules_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_schedules_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          duration_minutes: number | null
          equipment_needed: string[] | null
          id: string
          instructions: string | null
          muscle_groups: string[] | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          equipment_needed?: string[] | null
          id?: string
          instructions?: string | null
          muscle_groups?: string[] | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          equipment_needed?: string[] | null
          id?: string
          instructions?: string | null
          muscle_groups?: string[] | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      booking_status: "confirmed" | "cancelled" | "waitlist"
      class_status: "scheduled" | "ongoing" | "completed" | "cancelled"
      membership_status: "active" | "expired" | "suspended" | "cancelled"
      notification_type: "email" | "sms" | "in_app"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      user_role: "admin" | "trainer" | "member"
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
      booking_status: ["confirmed", "cancelled", "waitlist"],
      class_status: ["scheduled", "ongoing", "completed", "cancelled"],
      membership_status: ["active", "expired", "suspended", "cancelled"],
      notification_type: ["email", "sms", "in_app"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      user_role: ["admin", "trainer", "member"],
    },
  },
} as const
