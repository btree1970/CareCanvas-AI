import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { Database } from "./types";

class SupabaseClientInterface {
  private supabase: SupabaseClient<Database>;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  // Auth Functions
  async signUp(email: string, password: string, name?: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || "",
        },
      },
    });

    if (error) {
      throw new Error(`Sign up failed: ${error.message}`);
    }

    // Create user profile in users table
    if (data.user) {
      const { error: profileError } = await this.supabase.from("users").insert({
        id: data.user.id,
        name: name || "",
      });

      if (profileError) {
        throw new Error(
          `Failed to create user profile: ${profileError.message}`
        );
      }
    }

    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Sign in failed: ${error.message}`);
    }

    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    return user;
  }

  // Healthie Key Retrieval
  async getHealthieKey(): Promise<string | null> {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await this.supabase
      .from("users")
      .select("healthie_id")
      .eq("id", user.id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user data: ${error.message}`);
    }

    return data.healthie_id;
  }

  async hasHealthieKey(): Promise<boolean> {
    const healthieId = await this.getHealthieKey();
    return healthieId !== null;
  }

  // Page Management (client-side only operations)
  async getUserPages() {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await this.supabase
      .from("pages")
      .select("id, created_at, path, name")
      .eq("owner", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch pages: ${error.message}`);
    }

    return data;
  }

  async deletePage(pageId: string): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get page info first
    const { data: pageData, error: pageError } = await this.supabase
      .from("pages")
      .select("storage_object, owner")
      .eq("id", pageId)
      .single();

    if (pageError) {
      throw new Error(`Failed to fetch page: ${pageError.message}`);
    }

    // Check ownership
    if (pageData.owner !== user.id) {
      throw new Error("Access denied: You do not own this page");
    }

    // Delete from storage
    const { error: storageError } = await this.supabase.storage
      .from("pages-storage")
      .remove([pageData.storage_object]);

    if (storageError) {
      throw new Error(
        `Failed to delete storage object: ${storageError.message}`
      );
    }

    // Delete page entry
    const { error: deleteError } = await this.supabase
      .from("pages")
      .delete()
      .eq("id", pageId);

    if (deleteError) {
      throw new Error(`Failed to delete page: ${deleteError.message}`);
    }
  }
}

// Export singleton instance
export const supabaseClient = new SupabaseClientInterface();
export default supabaseClient;
