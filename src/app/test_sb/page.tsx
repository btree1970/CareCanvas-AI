'use client';

import { useState, useEffect } from 'react';
import { supabaseInterface } from '@/supabase/supabaseInterface';
import { User } from '@supabase/supabase-js';
import { Page } from '@/supabase/types';

export default function TestSupabasePage() {
  const [user, setUser] = useState<User | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  
  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Upload form state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [pageName, setPageName] = useState('');
  const [pageRoute, setPageRoute] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Download form state
  const [downloadPageId, setDownloadPageId] = useState('');
  const [downloadAsZip, setDownloadAsZip] = useState(true);
  
  // Error logging
  const [errorLogs, setErrorLogs] = useState<Array<{ timestamp: string; message: string; error?: unknown }>>([]);

  const logError = (message: string, error?: unknown) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      error
    };
    console.error(`[TestPage] ${message}`, error);
    setErrorLogs(prev => [logEntry, ...prev.slice(0, 9)]); // Keep last 10 errors
    setMessage(`Error: ${message}`);
  };

  const logInfo = (message: string, context?: Record<string, unknown>) => {
    console.info(`[TestPage] ${message}`, context);
  };

  const checkUser = async () => {
    try {
      logInfo('Checking current user');
      const currentUser = await supabaseInterface.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        logInfo('User found, loading pages', { userId: currentUser.id });
        await loadPages(false); // Don't show loading for initial check
      } else {
        logInfo('No current user found');
      }
    } catch (error) {
      logError('Error checking user', error);
    }
  };

  useEffect(() => {
    checkUser();
    
    // Listen to auth state changes
    const { data: { subscription } } = supabaseInterface.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        await loadPages(false); // Don't show loading for auto-refresh
      } else {
        setPages([]);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPages = async (showLoading: boolean = false) => {
    try {
      if (showLoading) {
        setLoading(true);
        logInfo('Loading pages with loading indicator');
      }
      const userPages = await supabaseInterface.getUserPages();
      // Cast to Page[] since getUserPages returns a subset of Page fields
      setPages(userPages as Page[]);
      logInfo('Pages loaded successfully', { pageCount: userPages.length });
    } catch (error) {
      logError('Error loading pages', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        logInfo('Attempting sign up', { email });
        await supabaseInterface.signUp(email, password, name);
        setMessage('Sign up successful! Please check your email to verify your account.');
        logInfo('Sign up successful', { email });
      } else {
        logInfo('Attempting sign in', { email });
        await supabaseInterface.signIn(email, password);
        setMessage('Sign in successful!');
        logInfo('Sign in successful', { email });
        await checkUser();
      }
    } catch (error) {
      logError(`Auth error: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      logInfo('Attempting sign out');
      await supabaseInterface.signOut();
      setUser(null);
      setPages([]);
      setMessage('Signed out successfully');
      logInfo('Sign out successful');
    } catch (error) {
      logError('Sign out error', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setUploadProgress(0);

    try {
      if (selectedFiles.length === 0) {
        throw new Error('Please select files to upload');
      }
      
      logInfo('Starting upload', {
        fileCount: selectedFiles.length,
        pageName,
        pagePath: pageRoute,
        totalSize: selectedFiles.reduce((acc, file) => acc + file.size, 0)
      });
      
      const pageId = await supabaseInterface.uploadBundle(
        selectedFiles, 
        pageName, 
        pageRoute,
        (progress) => {
          setUploadProgress(progress);
          logInfo('Upload progress', { progress });
        }
      );
      
      setMessage(`Upload successful! Page ID: ${pageId}`);
      logInfo('Upload completed successfully', { pageId });
      
      await loadPages(false); // Don't show loading since parent already manages it
      setSelectedFiles([]);
      setPageName('');
      setPageRoute('');
      setUploadProgress(0);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      logError('Upload error', error);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      logInfo('Starting download', { pageId: downloadPageId, downloadAsZip });
      
      const { blob, pageName: downloadedPageName } = await supabaseInterface.downloadBundle(downloadPageId);
      
      if (downloadAsZip) {
        // Download as single zip file
        supabaseInterface.downloadZipFile(blob, downloadedPageName);
        setMessage(`Zip file download started: ${downloadedPageName}.zip`);
        logInfo('Zip download initiated', { pageName: downloadedPageName, blobSize: blob.size });
      } else {
        // Extract and download individual files
        await supabaseInterface.extractAndDownloadZip(blob);
        setMessage(`Individual files download started for: ${downloadedPageName}`);
        logInfo('Individual files download initiated', { pageName: downloadedPageName });
      }
      
      setDownloadPageId('');
    } catch (error) {
      logError('Download error', error);
    } finally {
      setLoading(false);
    }
  };

  const checkHealthieKey = async () => {
    try {
      logInfo('Checking Healthie key');
      const hasKey = await supabaseInterface.hasHealthieKey();
      const key = await supabaseInterface.getHealthieKey();
      setMessage(`Healthie Key: ${hasKey ? key : 'Not set'}`);
      logInfo('Healthie key checked', { hasKey });
    } catch (error) {
      logError('Healthie key error', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Supabase Interface Test Page</h1>
      
      {message && (
        <div className={`p-4 rounded ${message.includes('error') || message.includes('Error') 
          ? 'bg-red-100 text-red-700' 
          : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {!user ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Authentication</h2>
          <form onSubmit={handleAuth} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                {isSignUp ? 'Switch to Sign In' : 'Switch to Sign Up'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Welcome, {user.email}</h2>
              <p className="text-gray-600">User ID: {user.id}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={checkHealthieKey}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Check Healthie Key
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Your Pages</h3>
            <button
              onClick={() => loadPages(true)}
              disabled={loading}
              className="mb-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh Pages'}
            </button>
            {pages.length === 0 ? (
              <p className="text-gray-600">No pages found</p>
            ) : (
              <div className="grid gap-4">
                {pages.map((page) => (
                  <div key={page.id} className="p-4 border border-gray-300 rounded-md">
                    <h4 className="font-semibold">{page.name}</h4>
                    <p className="text-sm text-gray-600">Path: {page.path}</p>
                    <p className="text-sm text-gray-600">Created: {new Date(page.created_at).toLocaleString()}</p>
                    <p className="text-sm text-gray-600">ID: {page.id}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Upload New Bundle</h3>
            <form onSubmit={handleUpload} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-1">Select Files</label>
                <input
                  type="file"
                  multiple
                  // @ts-expect-error - webkitdirectory is not in standard types
                  webkitdirectory=""
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select a folder to upload all files within it
                </p>
                {selectedFiles.length > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    {selectedFiles.length} files selected
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alternative: Select Individual Files</label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Or select multiple individual files
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Page Name</label>
                <input
                  type="text"
                  value={pageName}
                  onChange={(e) => setPageName(e.target.value)}
                  required
                  placeholder="My Awesome Page"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Page Route</label>
                <input
                  type="text"
                  value={pageRoute}
                  onChange={(e) => setPageRoute(e.target.value)}
                  required
                  placeholder="/my-page"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Upload Progress</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={loading || selectedFiles.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Uploading...') : 'Upload Bundle'}
              </button>
            </form>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Download Bundle</h3>
            <form onSubmit={handleDownload} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-1">Select Page</label>
                <select
                  value={downloadPageId}
                  onChange={(e) => setDownloadPageId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a page...</option>
                  {pages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.name} ({page.path})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Download Options</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="downloadType"
                      checked={downloadAsZip}
                      onChange={() => setDownloadAsZip(true)}
                      className="mr-2"
                    />
                    Download as ZIP file
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="downloadType"
                      checked={!downloadAsZip}
                      onChange={() => setDownloadAsZip(false)}
                      className="mr-2"
                    />
                    Extract and download individual files
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !downloadPageId}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Downloading...' : 'Download Bundle'}
              </button>
            </form>
          </div>

          {errorLogs.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Error Logs</h3>
              <div className="bg-red-50 border border-red-200 rounded-md p-4 max-h-64 overflow-y-auto">
                {errorLogs.map((log, index) => (
                  <div key={index} className="mb-2 last:mb-0">
                    <div className="text-xs text-red-600 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-sm text-red-800">{log.message}</div>
                    {log.error && (
                      <div className="text-xs text-red-600 font-mono mt-1">
                        {typeof log.error === 'object' && log.error !== null
                          ? JSON.stringify(log.error, null, 2) 
                          : String(log.error)
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setErrorLogs([])}
                className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Clear Logs
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}