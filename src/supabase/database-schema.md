# Supabase Database Schema Documentation

Generated: 2025-08-01

## Project Overview

This document provides a comprehensive index of the Supabase project structure, including tables, storage buckets, authentication schema, and security policies.

## Database Tables

### Users Table (`public.users`)

**Purpose**: Stores user account information with optional Healthie integration

**Schema**:
- `id` (uuid, PK): User identifier - `gen_random_uuid()`
- `created_at` (timestamptz): Account creation timestamp - `now()`
- `name` (text): User display name - defaults to empty string
- `healthie_id` (uuid, nullable): Optional Healthie platform integration ID - This will be null initially, then later be manually populated with a uuid

**Security**:
- Row Level Security (RLS): **Enabled**
- Policies:
  - `Enable users to view their own data only` (SELECT): Users can only access their own records where `auth.uid() = id`

### Pages Table (`public.pages`)

**Purpose**: Stores clinician's custom healthcare forms and pages

**Schema**:
- `id` (uuid, PK): Page identifier - `gen_random_uuid()`
- `created_at` (timestamptz): Page creation timestamp - `now()`
- `owner` (uuid, nullable): Page owner - defaults to `auth.uid()`
- `storage_object` (uuid, unique): Reference to file in storage bucket
- `path` (text): URL/routing path for the page - defaults to empty string
- `name` (text): Display name of the page - defaults to empty string

**Relationships**:
- `storage_object` links to files in the `pages-storage` bucket
- `owner` references authenticated users

**Security**:
- Row Level Security (RLS): **Enabled**
- Policies:
  - `Enable insert for authenticated users only` (INSERT): Only authenticated users can create pages
  - `Enable users to view their own data only` (SELECT): Users can only view pages they own where `auth.uid() = owner`

## Storage Buckets

### pages-storage

**Purpose**: Stores generated healthcare form files and assets

**Configuration**:
- `id`: "pages-storage"
- `name`: "pages-storage"
- `public`: false (private bucket)
- `owner`: null (system-managed)
- `created_at`: 2025-08-01 15:02:03.72019+00
- `file_size_limit`: null (no limit)
- `allowed_mime_types`: null (all types allowed)
- `avif_autodetection`: false

**Security**: Private bucket requiring authentication

## Authentication Schema

The project uses Supabase's built-in authentication system with the following key tables:

### Auth Tables (auth schema)
- `audit_log_entries`: Authentication audit logging
- `flow_state`: OAuth flow state management
- `identities`: User identity providers and data
- Additional standard Supabase auth tables for users, sessions, refresh tokens, etc.

## Extensions

### Installed Extensions
- `uuid-ossp` (v1.1): UUID generation functions
- `pgcrypto` (v1.3): Cryptographic functions
- `pg_stat_statements` (v1.11): SQL query statistics
- `pg_graphql` (v1.5.11): GraphQL support
- `supabase_vault` (v0.3.1): Supabase Vault for secrets management
- `plpgsql` (v1.0): PostgreSQL procedural language

### Available Extensions (not installed)
Notable available extensions include:
- `postgis`: Geospatial data support
- `pgjwt`: JSON Web Token support
- `vector`: Vector/embedding data type support
- `pg_cron`: Job scheduling
- `http`: HTTP client functionality

## Security Policies Summary

### Row Level Security (RLS)
All main tables have RLS enabled:

1. **Users Table**:
   - Users can only view their own profile data
   - Access controlled by `auth.uid() = id`

2. **Pages Table**:
   - Only authenticated users can create pages
   - Users can only view pages they own
   - Access controlled by `auth.uid() = owner`

3. **Storage**:
   - Private bucket requires authentication
   - No specific RLS policies found (likely using default Supabase storage policies)

## Migrations

- **Status**: No custom migrations found
- **Schema**: Uses Supabase's default schema structure

## Edge Functions

- **Status**: No custom Edge Functions deployed
- **Available**: Standard Supabase Edge Function deployment capabilities

## Data Relationships

1. **User → Pages**: One-to-many relationship
   - A user can own multiple pages
   - Pages reference their owner via the `owner` field

2. **Pages → Storage**: One-to-one relationship
   - Each page references a unique storage object
   - Storage objects contain the actual form files

## API Integration Points

### Healthie Integration
- Users table includes optional `healthie_id` for platform integration
- Supports healthcare data synchronization
- GraphQL-based API connection (as noted in project architecture)

### Authentication Flow
- Standard Supabase Auth with JWT tokens
- User sessions managed through auth schema
- RLS policies enforce data isolation per user

## Development Notes

- Database follows healthcare compliance patterns
- All user data is isolated through RLS policies
- Storage bucket is private, requiring authentication
- Schema supports multi-tenant healthcare application architecture
- Ready for HIPAA-compliant data handling