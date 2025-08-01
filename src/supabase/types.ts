// Supabase Database Types

export interface User {
  id: string;
  created_at: string;
  name: string;
  healthie_id: string | null;
}

export interface Page {
  id: string;
  created_at: string;
  owner: string | null;
  storage_object: string;
  path: string;
  name: string;
}

// Database schema for Supabase client
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: User;
        Update: User;
      };
      pages: {
        Row: Page;
        Insert: Page;
        Update: Page;
      };
    };
  };
}