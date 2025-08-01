import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import JSZip from "jszip";

// Database types (you can expand this as needed)
interface Database {
  public: {
    Tables: {
      pages: {
        Row: {
          id: string;
          storage_object: string;
          owner: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          storage_object: string;
          owner: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          storage_object?: string;
          owner?: string;
          created_at?: string;
        };
      };
    };
  };
}

// Enhanced logging utility
class Logger {
  static error(
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>
  ) {
    console.error(`[SupabaseInterface] ${message}`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  static info(message: string, context?: Record<string, unknown>) {
    console.info(`[SupabaseInterface] ${message}`, {
      context,
      timestamp: new Date().toISOString(),
    });
  }

  static warn(message: string, context?: Record<string, unknown>) {
    console.warn(`[SupabaseInterface] ${message}`, {
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

class SupabaseInterface {
  private supabase: SupabaseClient<Database>;
  private currentUser: User | null = null;
  private lastAuthResult: unknown = null;
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = "https://rzbkfewkopmivtyoecsx.supabase.co";
    this.supabaseKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6YmtmZXdrb3BtaXZ0eW9lY3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNTY5MjQsImV4cCI6MjA2OTYzMjkyNH0.uHNlo38Bxg1XE95RPoFBpLYxN2LcNVSuX2hnUb5QZhU";

    if (!this.supabaseUrl || !this.supabaseKey) {
      const error = new Error("Missing Supabase environment variables");
      Logger.error("Constructor failed", error, {
        hasUrl: !!this.supabaseUrl,
        hasKey: !!this.supabaseKey,
      });
      throw error;
    }

    try {
      this.supabase = createClient<Database>(
        this.supabaseUrl,
        this.supabaseKey
      );
      Logger.info("Supabase client initialized successfully");

      // Listen to auth state changes
      this.supabase.auth.onAuthStateChange((_event, session) => {
        const previousUser = this.currentUser;
        this.currentUser = session?.user || null;
        Logger.info("Auth state changed", {
          event: _event,
          previousUserId: previousUser?.id,
          newUserId: this.currentUser?.id,
        });
      });
    } catch (error) {
      Logger.error("Failed to initialize Supabase client", error);
      throw error;
    }
  }

  // Auth Functions
  async signUp(email: string, password: string, name?: string) {
    try {
      Logger.info("Attempting sign up", { email, hasName: !!name });

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
        Logger.error("Sign up failed", error, { email });
        throw new Error(`Sign up failed: ${error.message}`);
      }

      this.lastAuthResult = data;
      this.currentUser = data.user;
      Logger.info("Sign up successful", { userId: data.user?.id });
      // User profile is auto-created by Supabase when auth flow completes
      return data;
    } catch (error) {
      Logger.error("Sign up failed", error, { email });
      throw error;
    }
  }

  async signIn(email: string, password: string) {
    try {
      Logger.info("Attempting sign in", { email });

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Logger.error("Sign in failed", error, { email });
        throw new Error(`Sign in failed: ${error.message}`);
      }

      this.lastAuthResult = data;
      Logger.info("Sign in successful", { email, userId: data.user?.id });
      return data;
    } catch (error) {
      Logger.error("Sign in failed", error, { email });
      throw error;
    }
  }

  async signOut() {
    try {
      Logger.info("Attempting sign out");

      const { error } = await this.supabase.auth.signOut();

      if (error) {
        Logger.error("Sign out failed", error);
        throw new Error(`Sign out failed: ${error.message}`);
      }

      this.currentUser = null;
      this.lastAuthResult = null;
      Logger.info("Sign out successful");
    } catch (error) {
      Logger.error("Sign out failed", error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();

      if (error) {
        Logger.error("Failed to get current user", error);
        return null;
      }

      this.currentUser = user;
      Logger.info("Current user retrieved", { userId: user?.id });
      return user;
    } catch (error) {
      Logger.error("Failed to get current user", error);
      return null;
    }
  }

  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  getLastAuthResult() {
    return this.lastAuthResult;
  }

  // Storage Functions
  async getUserPages() {
    try {
      Logger.info("Fetching user pages from storage");

      const user = await this.getCurrentUser();
      if (!user) {
        const error = new Error("User not authenticated");
        Logger.error("Cannot fetch pages - no user", error);
        throw error;
      }

      // List files in user's folder
      const { data, error } = await this.supabase.storage
        .from("pages-storage")
        .list(user.id, {
          limit: 100,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) {
        Logger.error("Failed to fetch pages from storage", error, {
          userId: user.id,
        });
        throw new Error(`Failed to fetch pages: ${error.message}`);
      }

      // Transform storage objects to page-like format
      const pages = data.map((file) => ({
        id: `${user.id}/${file.name}`, // Use full path as ID
        created_at: file.created_at,
        path: `/${file.name.replace(/\.zip$/, "")}`, // Remove .zip and add leading slash
        name: file.name.replace(/\.zip$/, "").replace(/-\d+$/, ""), // Remove .zip and timestamp
      }));

      Logger.info("User pages fetched successfully from storage", {
        userId: user.id,
        pageCount: pages.length,
      });
      return pages;
    } catch (error) {
      Logger.error("Get user pages failed", error);
      throw error;
    }
  }

  async deletePage(pageId: string): Promise<void> {
    try {
      Logger.info("Starting page deletion", { pageId });

      const user = await this.getCurrentUser();
      if (!user) {
        const error = new Error("User not authenticated");
        Logger.error("Delete failed - no user", error, { pageId });
        throw error;
      }

      // Extract the file path from the pageId
      const filePath = pageId.replace(`${user.id}/`, "");
      
      // Delete from storage
      Logger.info("Deleting from storage", { pageId, filePath });
      const { error: storageError } = await this.supabase.storage
        .from("pages-storage")
        .remove([pageId]);

      if (storageError) {
        Logger.error("Failed to delete storage object", storageError, { pageId });
        throw new Error(`Failed to delete storage object: ${storageError.message}`);
      }

      Logger.info("Page deletion completed successfully", { pageId });
    } catch (error) {
      Logger.error("Page deletion failed", error, { pageId });
      throw error;
    }
  }

  async downloadBundle(filePath: string): Promise<{ blob: Blob; pageName: string }> {
    try {
      Logger.info("Starting bundle download", { filePath });

      const user = await this.getCurrentUser();
      if (!user) {
        const error = new Error("User not authenticated");
        Logger.error("Download failed - no user", error, { filePath });
        throw error;
      }

      // Download the file from storage
      const { data, error } = await this.supabase.storage
        .from("pages-storage")
        .download(filePath);

      if (error) {
        Logger.error("Failed to download bundle", error, { filePath });
        throw new Error(`Failed to download bundle: ${error.message}`);
      }

      if (!data) {
        throw new Error("No data received from download");
      }

      const pageName = filePath.split('/').pop()?.replace(/\.zip$/, "") || "app";
      
      Logger.info("Bundle download completed successfully", { filePath, pageName });
      return { blob: data, pageName };
    } catch (error) {
      Logger.error("Bundle download failed", error, { filePath });
      throw error;
    }
  }

  // Helper method to download zip file directly
  downloadZipFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

// Export singleton instance
export const supabaseInterface = new SupabaseInterface();
export default supabaseInterface;
