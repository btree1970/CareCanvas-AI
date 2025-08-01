import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import JSZip from "jszip";
import { Database } from "./types";
import Uppy from "@uppy/core";
import Tus from "@uppy/tus";

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

      // Store auth result
      this.lastAuthResult = data;
      this.currentUser = data.user;
      Logger.info("Sign up successful", { userId: data.user?.id });

      // User profile is auto-created by Supabase when auth flow completes

      return data;
    } catch (error) {
      Logger.error("Sign up process failed", error, { email });
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

      // Store auth result
      this.lastAuthResult = data;
      this.currentUser = data.user;
      Logger.info("Sign in successful", { userId: data.user?.id });

      return data;
    } catch (error) {
      Logger.error("Sign in process failed", error, { email });
      throw error;
    }
  }

  async signOut() {
    try {
      Logger.info("Attempting sign out", { userId: this.currentUser?.id });

      const { error } = await this.supabase.auth.signOut();
      if (error) {
        Logger.error("Sign out failed", error);
        throw new Error(`Sign out failed: ${error.message}`);
      }

      // Clear cached data
      this.currentUser = null;
      this.lastAuthResult = null;
      Logger.info("Sign out successful");
    } catch (error) {
      Logger.error("Sign out process failed", error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // If we have a cached user, return it
      if (this.currentUser) {
        return this.currentUser;
      }

      // Otherwise, fetch from Supabase and cache it
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();

      if (error) {
        Logger.error("Failed to get current user", error);
        throw error;
      }

      this.currentUser = user;
      Logger.info("Retrieved current user", { userId: user?.id });
      return user;
    } catch (error) {
      Logger.error("Get current user failed", error);
      throw error;
    }
  }

  // Method to get auth state change listener
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  // Get last auth result
  getLastAuthResult() {
    return this.lastAuthResult;
  }

  // Healthie Key Retrieval
  async getHealthieKey(): Promise<string | null> {
    try {
      Logger.info("Retrieving Healthie key");

      const user = await this.getCurrentUser();
      if (!user) {
        const error = new Error("User not authenticated");
        Logger.error("Cannot get Healthie key - no user", error);
        throw error;
      }

      const { data, error } = await this.supabase
        .from("users")
        .select("healthie_id")
        .eq("id", user.id)
        .single();

      if (error) {
        Logger.error("Failed to fetch user data", error, { userId: user.id });
        throw new Error(`Failed to fetch user data: ${error.message}`);
      }

      Logger.info("Healthie key retrieved", {
        userId: user.id,
        hasKey: !!data.healthie_id,
      });
      return data.healthie_id;
    } catch (error) {
      Logger.error("Get Healthie key failed", error);
      throw error;
    }
  }

  async hasHealthieKey(): Promise<boolean> {
    try {
      const healthieId = await this.getHealthieKey();
      const hasKey = healthieId !== null;
      Logger.info("Checked Healthie key status", { hasKey });
      return hasKey;
    } catch (error) {
      Logger.error("Has Healthie key check failed", error);
      throw error;
    }
  }

  // HTML Bundle Management with Resumable Upload
  async uploadBundle(
    files: File[],
    pageName: string,
    pagePath: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      Logger.info("Starting bundle upload", {
        fileCount: files.length,
        pageName,
        pagePath,
      });

      const user = await this.getCurrentUser();
      if (!user) {
        const error = new Error("User not authenticated");
        Logger.error("Upload failed - no user", error);
        throw error;
      }

      // Create zip from files
      Logger.info("Creating ZIP archive", { fileCount: files.length });
      const zip = new JSZip();

      for (const file of files) {
        try {
          const content = await file.arrayBuffer();
          // Use webkitRelativePath if available (from directory upload), otherwise use name
          const filePath =
            (file as File & { webkitRelativePath?: string })
              .webkitRelativePath || file.name;
          zip.file(filePath, content);
          Logger.info("Added file to ZIP", {
            fileName: file.name,
            size: file.size,
          });
        } catch (error) {
          Logger.error("Failed to add file to ZIP", error, {
            fileName: file.name,
          });
          throw new Error(
            `Failed to process file ${file.name}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      // Generate zip buffer
      Logger.info("Generating ZIP buffer");
      const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });
      const zipSize = zipBuffer.byteLength;
      Logger.info("ZIP buffer generated", { sizeBytes: zipSize });

      // Use user.id as folder name for bucket security policy
      const fileName = `${user.id}/${pageName.replace(
        /[^a-zA-Z0-9]/g,
        "-"
      )}-${Date.now()}.zip`;

      // Use resumable upload for large files (>6MB) or when explicitly requested
      let uploadData;
      if (zipSize > 6 * 1024 * 1024) {
        Logger.info("Using resumable upload for large file", {
          sizeBytes: zipSize,
        });
        uploadData = await this.uploadWithUppy(zipBuffer, fileName, onProgress);
      } else {
        Logger.info("Using standard upload for small file", {
          sizeBytes: zipSize,
        });
        const { data, error: uploadError } = await this.supabase.storage
          .from("pages-storage")
          .upload(fileName, zipBuffer, {
            contentType: "application/zip",
          });

        if (uploadError) {
          Logger.error("Standard upload failed", uploadError, {
            fileName,
            sizeBytes: zipSize,
          });
          throw new Error(`Failed to upload bundle: ${uploadError.message}`);
        }
        uploadData = data;
      }

      Logger.info("Bundle upload completed successfully", {
        fileName,
        uploadPath: uploadData.path,
        sizeBytes: zipSize,
      });

      // Return the file path as the identifier since page entry is auto-created
      return uploadData.path || fileName;
    } catch (error) {
      Logger.error("Bundle upload failed", error, {
        pageName,
        pagePath,
        fileCount: files.length,
      });
      throw error;
    }
  }

  // Resumable upload using Uppy
  private async uploadWithUppy(
    zipBuffer: ArrayBuffer,
    fileName: string,
    onProgress?: (progress: number) => void
  ): Promise<{ id: string; path: string }> {
    return new Promise((resolve, reject) => {
      try {
        Logger.info("Initializing Uppy for resumable upload", { fileName });

        const uppy = new Uppy({
          restrictions: {
            maxFileSize: 100 * 1024 * 1024, // 100MB max
            maxNumberOfFiles: 1,
          },
        });

        uppy.use(Tus, {
          endpoint: `${this.supabaseUrl}/storage/v1/upload/resumable`,
          headers: {
            authorization: `Bearer ${this.supabaseKey}`,
            "x-upsert": "true",
          },
          chunkSize: 6 * 1024 * 1024, // 6MB chunks
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: "pages-storage",
            objectName: fileName,
            contentType: "application/zip",
          },
        });

        uppy.on("upload-progress", (file, progress) => {
          const percentage = progress.bytesTotal
            ? Math.round((progress.bytesUploaded / progress.bytesTotal) * 100)
            : 0;
          Logger.info("Upload progress", {
            fileName,
            percentage,
            bytesUploaded: progress.bytesUploaded,
          });
          onProgress?.(percentage);
        });

        uppy.on("upload-success", (_file, response) => {
          Logger.info("Uppy upload successful", { fileName, response });
          resolve({
            id: fileName, // Supabase storage uses the file path as ID
            path: fileName,
          });
        });

        uppy.on("upload-error", (_file, error) => {
          Logger.error("Uppy upload failed", error, { fileName });
          reject(new Error(`Resumable upload failed: ${error.message}`));
        });

        // Convert ArrayBuffer to File object for Uppy
        const blob = new Blob([zipBuffer], { type: "application/zip" });
        const file = new File([blob], fileName, { type: "application/zip" });

        uppy.addFile({
          name: fileName,
          type: "application/zip",
          data: file,
        });

        uppy.upload();
      } catch (error) {
        Logger.error("Uppy initialization failed", error, { fileName });
        reject(error);
      }
    });
  }

  async downloadBundle(
    filePath: string
  ): Promise<{ blob: Blob; pageName: string }> {
    try {
      Logger.info("Starting bundle download", { filePath });

      const user = await this.getCurrentUser();
      if (!user) {
        const error = new Error("User not authenticated");
        Logger.error("Download failed - no user", error, { filePath });
        throw error;
      }

      // Verify the file path belongs to the current user
      if (!filePath.startsWith(`${user.id}/`)) {
        const error = new Error("Access denied: File does not belong to user");
        Logger.error("Access denied for file download", error, {
          filePath,
          userId: user.id,
        });
        throw error;
      }

      // Extract page name from file path
      const fileName = filePath.split("/").pop() || "";
      const pageName = fileName.replace(/\.zip$/, "").replace(/-\d+$/, "");

      // Download from storage
      Logger.info("Downloading from storage", {
        filePath,
        fileName,
        pageName,
      });
      const { data: downloadData, error: downloadError } =
        await this.supabase.storage.from("pages-storage").download(filePath);

      if (downloadError) {
        Logger.error("Failed to download bundle", downloadError, {
          filePath,
          fileName,
        });
        throw new Error(`Failed to download bundle: ${downloadError.message}`);
      }

      Logger.info("Bundle download successful", {
        filePath,
        pageName,
        blobSize: downloadData.size,
      });

      return {
        blob: downloadData,
        pageName,
      };
    } catch (error) {
      Logger.error("Bundle download failed", error, { filePath });
      throw error;
    }
  }

  // Helper method to extract zip in browser and trigger downloads
  async extractAndDownloadZip(zipBlob: Blob): Promise<void> {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(zipBlob);

    // Extract all files and create download links
    const promises = Object.keys(zipContent.files).map(async (filename) => {
      const file = zipContent.files[filename];
      if (!file.dir) {
        const content = await file.async("blob");
        this.downloadFile(content, filename);
      }
    });

    await Promise.all(promises);
  }

  // Helper method to download a single file
  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Method to download zip file directly
  downloadZipFile(blob: Blob, filename: string): void {
    this.downloadFile(blob, `${filename}.zip`);
  }

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

      // Get page info first
      Logger.info("Fetching page info for deletion", {
        pageId,
        userId: user.id,
      });
      const { data: pageData, error: pageError } = await this.supabase
        .from("pages")
        .select("storage_object, owner")
        .eq("id", pageId)
        .single();

      if (pageError) {
        Logger.error("Failed to fetch page for deletion", pageError, {
          pageId,
          userId: user.id,
        });
        throw new Error(`Failed to fetch page: ${pageError.message}`);
      }

      // Check ownership
      if (pageData.owner !== user.id) {
        const error = new Error("Access denied: You do not own this page");
        Logger.error("Access denied for page deletion", error, {
          pageId,
          userId: user.id,
          pageOwner: pageData.owner,
        });
        throw error;
      }

      // Delete from storage
      Logger.info("Deleting from storage", {
        pageId,
        storageObject: pageData.storage_object,
      });
      const { error: storageError } = await this.supabase.storage
        .from("pages-storage")
        .remove([pageData.storage_object]);

      if (storageError) {
        Logger.error("Failed to delete storage object", storageError, {
          pageId,
          storageObject: pageData.storage_object,
        });
        throw new Error(
          `Failed to delete storage object: ${storageError.message}`
        );
      }

      // Delete page entry
      Logger.info("Deleting page entry from database", { pageId });
      const { error: deleteError } = await this.supabase
        .from("pages")
        .delete()
        .eq("id", pageId);

      if (deleteError) {
        Logger.error("Failed to delete page entry", deleteError, { pageId });
        throw new Error(`Failed to delete page: ${deleteError.message}`);
      }

      Logger.info("Page deletion completed successfully", { pageId });
    } catch (error) {
      Logger.error("Page deletion failed", error, { pageId });
      throw error;
    }
  }
}

// Export singleton instance
export const supabaseInterface = new SupabaseInterface();
export default supabaseInterface;
