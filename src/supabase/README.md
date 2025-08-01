# Supabase Interface

This module provides a TypeScript interface for interacting with the Supabase backend.

## Setup

1. Install dependencies:
```bash
npm install @supabase/supabase-js jszip
```

2. Set environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Usage

```typescript
import { supabaseInterface } from './supabaseInterface';

// Authentication
await supabaseInterface.signUp('user@example.com', 'password', 'User Name');
await supabaseInterface.signIn('user@example.com', 'password');
const user = await supabaseInterface.getCurrentUser();
await supabaseInterface.signOut();

// Healthie Key Management
const hasKey = await supabaseInterface.hasHealthieKey();
const healthieId = await supabaseInterface.getHealthieKey();

// Bundle Management
const files = Array.from(fileInput.files); // From HTML file input
const pageId = await supabaseInterface.uploadBundle(files, 'My Page', '/my-page');

// Download as zip file or extract individual files
const { blob, pageName } = await supabaseInterface.downloadBundle(pageId);
supabaseInterface.downloadZipFile(blob, pageName); // Downloads zip
// OR
await supabaseInterface.extractAndDownloadZip(blob); // Downloads individual files

const pages = await supabaseInterface.getUserPages();
await supabaseInterface.deletePage(pageId);
```

## Functions

### Authentication
- `signUp(email, password, name?)` - Create new user account
- `signIn(email, password)` - Sign in existing user  
- `signOut()` - Sign out current user
- `getCurrentUser()` - Get current authenticated user

### Healthie Integration
- `getHealthieKey()` - Get user's Healthie ID (null if not set)
- `hasHealthieKey()` - Check if user has Healthie ID configured

### Bundle Management
- `uploadBundle(files, pageName, pagePath)` - Create zip from File objects and upload bundle
- `downloadBundle(pageId)` - Download bundle as blob with page name
- `downloadZipFile(blob, filename)` - Trigger browser download of zip file
- `extractAndDownloadZip(blob)` - Extract zip and download individual files
- `getUserPages()` - Get list of user's pages
- `deletePage(pageId)` - Delete page and associated storage

## Client-Side Usage

This interface is designed to work entirely in the browser:

- **File Upload**: Uses HTML File API and supports both individual files and directory selection
- **File Download**: Uses browser download APIs to save files locally
- **No Server-Side Dependencies**: All file operations happen in the browser

### File Input Examples

```html
<!-- Directory selection -->
<input type="file" webkitdirectory multiple onChange={handleFiles} />

<!-- Multiple file selection -->
<input type="file" multiple onChange={handleFiles} />
```

## Security

**Important**: This interface uses user-based folder isolation for security. See [SECURITY_POLICIES.md](./SECURITY_POLICIES.md) for required Supabase bucket policies.

Files are uploaded to: `pages-storage/{user.id}/filename.zip`

## Database Schema

The interface expects these Supabase tables:
- `users` - User profiles with optional Healthie integration
- `pages` - Page metadata linking to storage objects
- `pages-storage` - Storage bucket for HTML bundles (requires RLS policies)