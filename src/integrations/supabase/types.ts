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
      agent_rag_files: {
        Row: {
          agent_id: string
          created_at: string
          file_name: string
          file_size: number | null
          id: string
          storage_path: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          file_name: string
          file_size?: number | null
          id?: string
          storage_path: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          file_name?: string
          file_size?: number | null
          id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_rag_files_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          created_at: string
          id: string
          instructions: string | null
          model_config: Json
          name: string
          persona: string | null
          status: string
          temperature: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructions?: string | null
          model_config?: Json
          name: string
          persona?: string | null
          status?: string
          temperature?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instructions?: string | null
          model_config?: Json
          name?: string
          persona?: string | null
          status?: string
          temperature?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_checklist_items: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          item_key: string
          lead_id: string
          phase: Database["public"]["Enums"]["lead_status"]
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          item_key: string
          lead_id: string
          phase: Database["public"]["Enums"]["lead_status"]
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          item_key?: string
          lead_id?: string
          phase?: Database["public"]["Enums"]["lead_status"]
        }
        Relationships: [
          {
            foreignKeyName: "lead_checklist_items_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          lead_id: string
          name: string
          phone: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          lead_id: string
          name: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          lead_id?: string
          name?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          cnae: string | null
          cnpj: string | null
          company_name: string
          content_consumed: string | null
          context: string | null
          created_at: string
          deal_value: number | null
          engineering_headcount: number | null
          estimated_benefit_max: number | null
          estimated_benefit_min: number | null
          estimated_cac: number | null
          estimated_ltv: number | null
          expected_close_date: string | null
          first_touch_channel: string | null
          fiscal_regime: string | null
          has_authority: boolean
          has_budget: boolean
          has_need: boolean
          has_timeline: boolean
          icp_score: number | null
          id: string
          last_activity_type: string | null
          last_contacted_date: string | null
          last_touch_channel: string | null
          next_action: string | null
          next_action_date: string | null
          next_activity_date: string | null
          objection: string | null
          pain_points: string | null
          probability: number | null
          qualification_method: string | null
          rd_annual_budget: number | null
          revenue_range: string | null
          sector: string | null
          source_medium: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tax_regime: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          cnae?: string | null
          cnpj?: string | null
          company_name: string
          content_consumed?: string | null
          context?: string | null
          created_at?: string
          deal_value?: number | null
          engineering_headcount?: number | null
          estimated_benefit_max?: number | null
          estimated_benefit_min?: number | null
          estimated_cac?: number | null
          estimated_ltv?: number | null
          expected_close_date?: string | null
          first_touch_channel?: string | null
          fiscal_regime?: string | null
          has_authority?: boolean
          has_budget?: boolean
          has_need?: boolean
          has_timeline?: boolean
          icp_score?: number | null
          id?: string
          last_activity_type?: string | null
          last_contacted_date?: string | null
          last_touch_channel?: string | null
          next_action?: string | null
          next_action_date?: string | null
          next_activity_date?: string | null
          objection?: string | null
          pain_points?: string | null
          probability?: number | null
          qualification_method?: string | null
          rd_annual_budget?: number | null
          revenue_range?: string | null
          sector?: string | null
          source_medium?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tax_regime?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          cnae?: string | null
          cnpj?: string | null
          company_name?: string
          content_consumed?: string | null
          context?: string | null
          created_at?: string
          deal_value?: number | null
          engineering_headcount?: number | null
          estimated_benefit_max?: number | null
          estimated_benefit_min?: number | null
          estimated_cac?: number | null
          estimated_ltv?: number | null
          expected_close_date?: string | null
          first_touch_channel?: string | null
          fiscal_regime?: string | null
          has_authority?: boolean
          has_budget?: boolean
          has_need?: boolean
          has_timeline?: boolean
          icp_score?: number | null
          id?: string
          last_activity_type?: string | null
          last_contacted_date?: string | null
          last_touch_channel?: string | null
          next_action?: string | null
          next_action_date?: string | null
          next_activity_date?: string | null
          objection?: string | null
          pain_points?: string | null
          probability?: number | null
          qualification_method?: string | null
          rd_annual_budget?: number | null
          revenue_range?: string | null
          sector?: string | null
          source_medium?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tax_regime?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
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
      is_agent_owner: { Args: { _agent_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "closer" | "consultor" | "cfo" | "user"
      lead_status:
        | "novo"
        | "qualificado"
        | "proposta"
        | "ganho"
        | "prospeccao"
        | "qualificacao"
        | "diagnostico"
        | "fechamento"
        | "perdido"
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
      app_role: ["admin", "closer", "consultor", "cfo", "user"],
      lead_status: [
        "novo",
        "qualificado",
        "proposta",
        "ganho",
        "prospeccao",
        "qualificacao",
        "diagnostico",
        "fechamento",
        "perdido",
      ],
    },
  },
} as const
