export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          business_context: string | null
          changed_fields: string[] | null
          correlation_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          operation_type: string
          processing_time_ms: number | null
          record_id: string | null
          session_id: string | null
          source_component: string | null
          success: boolean | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          business_context?: string | null
          changed_fields?: string[] | null
          correlation_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          operation_type: string
          processing_time_ms?: number | null
          record_id?: string | null
          session_id?: string | null
          source_component?: string | null
          success?: boolean | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          business_context?: string | null
          changed_fields?: string[] | null
          correlation_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          operation_type?: string
          processing_time_ms?: number | null
          record_id?: string | null
          session_id?: string | null
          source_component?: string | null
          success?: boolean | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cycle_entries: {
        Row: {
          created_at: string | null
          entry_date: string
          flow_level: number
          id: string
          notes: string | null
          symptoms: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entry_date: string
          flow_level?: number
          id?: string
          notes?: string | null
          symptoms?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          entry_date?: string
          flow_level?: number
          id?: string
          notes?: string | null
          symptoms?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      data_quality_metrics: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          measured_at: string | null
          metric_type: string
          metric_value: number
          resolved_at: string | null
          status: string
          table_name: string
          threshold_value: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          measured_at?: string | null
          metric_type: string
          metric_value: number
          resolved_at?: string | null
          status?: string
          table_name: string
          threshold_value?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          measured_at?: string | null
          metric_type?: string
          metric_value?: number
          resolved_at?: string | null
          status?: string
          table_name?: string
          threshold_value?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      meal_entries: {
        Row: {
          created_at: string | null
          description: string | null
          entry_date: string
          estimated_calories: number | null
          id: string
          image_url: string | null
          meal_name: string
          meal_type: string
          pcos_friendly_rating: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          entry_date: string
          estimated_calories?: number | null
          id?: string
          image_url?: string | null
          meal_name: string
          meal_type: string
          pcos_friendly_rating?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          entry_date?: string
          estimated_calories?: number | null
          id?: string
          image_url?: string | null
          meal_name?: string
          meal_type?: string
          pcos_friendly_rating?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meal_plan_recipes: {
        Row: {
          created_at: string | null
          id: string
          is_completed: boolean | null
          meal_plan_id: string
          meal_type: string
          planned_date: string
          recipe_id: string
          servings: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          meal_plan_id: string
          meal_type: string
          planned_date: string
          recipe_id: string
          servings?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          meal_plan_id?: string
          meal_type?: string
          planned_date?: string
          recipe_id?: string
          servings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_recipes_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          meals_per_day: number | null
          name: string
          start_date: string
          target_calories_per_day: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          meals_per_day?: number | null
          name: string
          start_date: string
          target_calories_per_day?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          meals_per_day?: number | null
          name?: string
          start_date?: string
          target_calories_per_day?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          id: string
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_responses: {
        Row: {
          completed_at: string
          id: string
          responses: Json
          step_number: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          responses?: Json
          step_number: number
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          responses?: Json
          step_number?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          diagnosis_date: string | null
          first_name: string | null
          id: string
          last_name: string | null
          pcos_type: Database["public"]["Enums"]["pcos_type"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          diagnosis_date?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          pcos_type?: Database["public"]["Enums"]["pcos_type"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          diagnosis_date?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          pcos_type?: Database["public"]["Enums"]["pcos_type"] | null
          updated_at?: string
        }
        Relationships: []
      }
      recipe_ratings: {
        Row: {
          created_at: string | null
          id: string
          rating: number
          recipe_id: string
          review_text: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating: number
          recipe_id: string
          review_text?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number
          recipe_id?: string
          review_text?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ratings_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          calories_per_serving: number | null
          carbs_per_serving_g: number | null
          cook_time_minutes: number | null
          created_at: string | null
          created_by: string | null
          cuisine_type: string | null
          description: string | null
          dietary_tags: string[] | null
          difficulty_level: string | null
          fat_per_serving_g: number | null
          id: string
          image_url: string | null
          ingredients: Json
          instructions: string
          is_anti_inflammatory: boolean | null
          is_approved: boolean | null
          is_low_glycemic: boolean | null
          meal_types: string[] | null
          prep_time_minutes: number | null
          protein_per_serving_g: number | null
          servings: number | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          calories_per_serving?: number | null
          carbs_per_serving_g?: number | null
          cook_time_minutes?: number | null
          created_at?: string | null
          created_by?: string | null
          cuisine_type?: string | null
          description?: string | null
          dietary_tags?: string[] | null
          difficulty_level?: string | null
          fat_per_serving_g?: number | null
          id?: string
          image_url?: string | null
          ingredients: Json
          instructions: string
          is_anti_inflammatory?: boolean | null
          is_approved?: boolean | null
          is_low_glycemic?: boolean | null
          meal_types?: string[] | null
          prep_time_minutes?: number | null
          protein_per_serving_g?: number | null
          servings?: number | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          calories_per_serving?: number | null
          carbs_per_serving_g?: number | null
          cook_time_minutes?: number | null
          created_at?: string | null
          created_by?: string | null
          cuisine_type?: string | null
          description?: string | null
          dietary_tags?: string[] | null
          difficulty_level?: string | null
          fat_per_serving_g?: number | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: string
          is_anti_inflammatory?: boolean | null
          is_approved?: boolean | null
          is_low_glycemic?: boolean | null
          meal_types?: string[] | null
          prep_time_minutes?: number | null
          protein_per_serving_g?: number | null
          servings?: number | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      sleep_entries: {
        Row: {
          bedtime: string
          created_at: string
          entry_date: string
          id: string
          notes: string | null
          sleep_duration_hours: number
          sleep_factors: string[] | null
          sleep_quality: number
          updated_at: string
          user_id: string
          wake_time: string
        }
        Insert: {
          bedtime: string
          created_at?: string
          entry_date: string
          id?: string
          notes?: string | null
          sleep_duration_hours: number
          sleep_factors?: string[] | null
          sleep_quality: number
          updated_at?: string
          user_id: string
          wake_time: string
        }
        Update: {
          bedtime?: string
          created_at?: string
          entry_date?: string
          id?: string
          notes?: string | null
          sleep_duration_hours?: number
          sleep_factors?: string[] | null
          sleep_quality?: number
          updated_at?: string
          user_id?: string
          wake_time?: string
        }
        Relationships: []
      }
      smart_notifications: {
        Row: {
          actionable: boolean
          actions: Json | null
          category: string
          context: Json | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_personalized: boolean
          is_read: boolean
          message: string
          priority: string
          scheduled_for: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actionable?: boolean
          actions?: Json | null
          category: string
          context?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_personalized?: boolean
          is_read?: boolean
          message: string
          priority: string
          scheduled_for: string
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actionable?: boolean
          actions?: Json | null
          category?: string
          context?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_personalized?: boolean
          is_read?: boolean
          message?: string
          priority?: string
          scheduled_for?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      symptom_entries: {
        Row: {
          created_at: string | null
          entry_date: string
          id: string
          notes: string | null
          symptoms: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entry_date: string
          id?: string
          notes?: string | null
          symptoms?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          entry_date?: string
          id?: string
          notes?: string | null
          symptoms?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_health_log: {
        Row: {
          alerts_triggered: string[] | null
          checked_at: string | null
          dependencies_status: Json | null
          error_rate: number | null
          health_status: string
          id: string
          metadata: Json | null
          resource_usage: Json | null
          response_time_ms: number | null
          service_name: string
          throughput_per_minute: number | null
        }
        Insert: {
          alerts_triggered?: string[] | null
          checked_at?: string | null
          dependencies_status?: Json | null
          error_rate?: number | null
          health_status: string
          id?: string
          metadata?: Json | null
          resource_usage?: Json | null
          response_time_ms?: number | null
          service_name: string
          throughput_per_minute?: number | null
        }
        Update: {
          alerts_triggered?: string[] | null
          checked_at?: string | null
          dependencies_status?: Json | null
          error_rate?: number | null
          health_status?: string
          id?: string
          metadata?: Json | null
          resource_usage?: Json | null
          response_time_ms?: number | null
          service_name?: string
          throughput_per_minute?: number | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          category: string
          color: string
          created_at: string | null
          description: string
          icon: string
          id: string
          is_unlocked: boolean
          progress: number
          rarity: string
          requirements: Json
          reward: Json | null
          title: string
          type: string
          unlocked_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          category: string
          color: string
          created_at?: string | null
          description: string
          icon: string
          id?: string
          is_unlocked?: boolean
          progress?: number
          rarity: string
          requirements: Json
          reward?: Json | null
          title: string
          type: string
          unlocked_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          category?: string
          color?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          is_unlocked?: boolean
          progress?: number
          rarity?: string
          requirements?: Json
          reward?: Json | null
          title?: string
          type?: string
          unlocked_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          action_details: Json | null
          activity_type: string
          correlation_id: string | null
          created_at: string | null
          device_info: Json | null
          duration_ms: number | null
          feature_name: string | null
          id: string
          ip_address: unknown | null
          page_route: string | null
          performance_metrics: Json | null
          session_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_details?: Json | null
          activity_type: string
          correlation_id?: string | null
          created_at?: string | null
          device_info?: Json | null
          duration_ms?: number | null
          feature_name?: string | null
          id?: string
          ip_address?: unknown | null
          page_route?: string | null
          performance_metrics?: Json | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_details?: Json | null
          activity_type?: string
          correlation_id?: string | null
          created_at?: string | null
          device_info?: Json | null
          duration_ms?: number | null
          feature_name?: string | null
          id?: string
          ip_address?: unknown | null
          page_route?: string | null
          performance_metrics?: Json | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          id: string
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          birth_date: string | null
          cooking_experience: string | null
          created_at: string | null
          current_medications: string[] | null
          diagnosis_date: string | null
          dietary_preferences: string[] | null
          first_name: string | null
          fitness_goals: string | null
          id: string
          last_name: string | null
          pcos_type: Database["public"]["Enums"]["pcos_type"] | null
          preferred_meal_types: string[] | null
          primary_symptoms: string[] | null
          time_availability: number | null
          updated_at: string | null
          user_id: string
          weight_goals: string | null
        }
        Insert: {
          birth_date?: string | null
          cooking_experience?: string | null
          created_at?: string | null
          current_medications?: string[] | null
          diagnosis_date?: string | null
          dietary_preferences?: string[] | null
          first_name?: string | null
          fitness_goals?: string | null
          id?: string
          last_name?: string | null
          pcos_type?: Database["public"]["Enums"]["pcos_type"] | null
          preferred_meal_types?: string[] | null
          primary_symptoms?: string[] | null
          time_availability?: number | null
          updated_at?: string | null
          user_id: string
          weight_goals?: string | null
        }
        Update: {
          birth_date?: string | null
          cooking_experience?: string | null
          created_at?: string | null
          current_medications?: string[] | null
          diagnosis_date?: string | null
          dietary_preferences?: string[] | null
          first_name?: string | null
          fitness_goals?: string | null
          id?: string
          last_name?: string | null
          pcos_type?: Database["public"]["Enums"]["pcos_type"] | null
          preferred_meal_types?: string[] | null
          primary_symptoms?: string[] | null
          time_availability?: number | null
          updated_at?: string | null
          user_id?: string
          weight_goals?: string | null
        }
        Relationships: []
      }
      water_entries: {
        Row: {
          amount_ml: number
          created_at: string
          entry_date: string
          entry_time: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string
          entry_date: string
          entry_time: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          entry_date?: string
          entry_time?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_entries: {
        Row: {
          body_fat_percentage: number | null
          created_at: string
          entry_date: string
          id: string
          muscle_mass_lbs: number | null
          notes: string | null
          updated_at: string
          user_id: string
          weight_lbs: number
        }
        Insert: {
          body_fat_percentage?: number | null
          created_at?: string
          entry_date: string
          id?: string
          muscle_mass_lbs?: number | null
          notes?: string | null
          updated_at?: string
          user_id: string
          weight_lbs: number
        }
        Update: {
          body_fat_percentage?: number | null
          created_at?: string
          entry_date?: string
          id?: string
          muscle_mass_lbs?: number | null
          notes?: string | null
          updated_at?: string
          user_id?: string
          weight_lbs?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_data_quality: {
        Args: { p_user_id: string; p_table_name: string }
        Returns: undefined
      }
    }
    Enums: {
      pcos_type: "INSULIN_RESISTANT" | "POST_PILL" | "INFLAMMATORY" | "ADRENAL"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      pcos_type: ["INSULIN_RESISTANT", "POST_PILL", "INFLAMMATORY", "ADRENAL"],
    },
  },
} as const
