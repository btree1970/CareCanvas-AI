# Supabase Security Policies

This document outlines the required security policies for the CareCanvas AI Supabase project.

## Storage Bucket Policies

### pages-storage Bucket

The `pages-storage` bucket requires Row Level Security (RLS) policies to ensure users can only access their own files.

#### Required Policies:

1. **User Folder Upload Policy**
   ```sql
   CREATE POLICY "Users can upload to their own folder" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'pages-storage' AND 
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

2. **User Folder Select Policy**
   ```sql
   CREATE POLICY "Users can view their own folder" ON storage.objects
   FOR SELECT USING (
     bucket_id = 'pages-storage' AND 
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

3. **User Folder Update Policy**
   ```sql
   CREATE POLICY "Users can update their own folder" ON storage.objects
   FOR UPDATE USING (
     bucket_id = 'pages-storage' AND 
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

4. **User Folder Delete Policy**
   ```sql
   CREATE POLICY "Users can delete from their own folder" ON storage.objects
   FOR DELETE USING (
     bucket_id = 'pages-storage' AND 
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

#### Enable RLS on Storage Objects:
```sql
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

## File Path Structure

All files uploaded to the `pages-storage` bucket follow this structure:
```
pages-storage/
├── {user_id_1}/
│   ├── my-page-1234567890.zip
│   └── another-page-1234567891.zip
├── {user_id_2}/
│   ├── user2-page-1234567892.zip
│   └── user2-other-page-1234567893.zip
```

Where:
- `{user_id}` is the authenticated user's UUID from `auth.uid()`
- File names are sanitized page names with timestamps
- All files are stored as ZIP archives

## Authentication Requirements

- All storage operations require an authenticated user (`auth.uid()` must not be null)
- Users can only access files in folders matching their user ID
- The application automatically creates the correct folder structure

## Implementation Notes

The `SupabaseInterface` class automatically:
1. Uses `user.id` as the folder name in upload paths
2. Stores authentication results for session management
3. Clears cached data on sign out
4. Validates user ownership before download operations

This ensures that:
- Users cannot access other users' files
- File paths are predictable and secure  
- Authentication state is properly managed
- Database and storage policies work together for complete security