export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      patrons: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          contact: string | null;
          assigned_number: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          contact?: string | null;
          assigned_number: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          contact?: string | null;
          assigned_number?: number;
        };
      };
      sign_ins: {
        Row: {
          id: string;
          created_at: string;
          patron_id: string;
          week_number: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          patron_id: string;
          week_number: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          patron_id?: string;
          week_number?: number;
        };
      };
      drawings: {
        Row: {
          id: string;
          created_at: string;
          week_number: number;
          drawn_number: number;
          winner_id: string | null;
          prize_amount: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          week_number: number;
          drawn_number: number;
          winner_id?: string | null;
          prize_amount: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          week_number?: number;
          drawn_number?: number;
          winner_id?: string | null;
          prize_amount?: number;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
