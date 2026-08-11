# AppForge Frontend - Supabase Setup Guide

## Overview

You want to track builds in Supabase instead of Base44's database. This guide will help you set up the `builds` table.

## Step 1: Run the SQL Migration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `sitrzxcqssbniyhrvtug`
3. Go to **SQL Editor** → **New Query**
4. Copy and paste the contents of `../migrations/001_create_builds_table.sql`
5. Click **Run**

## Step 2: Update Environment Variables

Add your Supabase anon key to `.env.local`:

```env
VITE_SUPABASE_URL=https://sitrzxcqssbniyhrvtug.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

**To get your anon key:**
1. Supabase Dashboard → **Project Settings** → **API**
2. Copy the **anon public** key
3. Paste it in `.env.local`

## Step 3: How It Works

### Frontend Changes Made:
- ✅ `src/api/supabaseClient.js` - Supabase client initialization
- ✅ `src/lib/buildService.js` - Build tracking functions
- ✅ `src/pages/BuildProgress.jsx` - Now records builds to Supabase instead of Base44
- ✅ `src/pages/PublicAppPage.jsx` - Can read builds from Supabase (fallback to Base44)

### Build Flow:
1. User starts a build → Backend creates APK → Frontend records build in Supabase
2. Build tracking now uses `user_email` from Base44 auth + Supabase `builds` table
3. Download URLs still come from the backend (R2 or local)
4. Public build pages can read from Supabase

## Database Schema

```sql
CREATE TABLE builds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  website_url TEXT NOT NULL,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  r2_file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);
```

## Notes

- **Base44 auth is still used** for user login/signup
- **Base44 entities still work** for Projects, Billing, etc.
- **Only BuildHistory is replaced** by Supabase `builds` table
- **R2 lifecycle rules** (7-day expiry) are already configured in Cloudflare
- **Old builds** (if any in Base44) will still be readable as fallback

## Testing

1. Start the backend: `cd AppForge Backend && npm run dev`
2. Start the frontend: `cd AppForge Frontend && npm run dev`
3. Create a build and check the Supabase dashboard for the new record
