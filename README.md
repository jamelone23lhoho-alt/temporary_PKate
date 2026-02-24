# Tolun Logistics

Logistics Management System built with Next.js + Supabase

## Setup Instructions

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and run the entire contents of `supabase-schema.sql`
3. Go to **Storage** → Create a new bucket called `images` → Set it to **Public**
4. Go to **Storage** → `images` bucket → **Policies** → Add policy:
   - Name: `Public Access`
   - Target: `SELECT`, `INSERT` for all users (anon)
5. Go to **Settings** → **API** → Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Local Development

```bash
git clone <your-repo>
cd tolun-logistics
npm install
```

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

```bash
npm run dev
```

### 3. Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your GitHub repo
3. Add Environment Variables (same 3 keys from above)
4. Deploy

### 4. Default Login

- Username: `admin@tolun.com`
- Password: `admin123`

(The password in schema is bcrypt hash of `admin123`)

### 5. Supabase Storage Setup for Images

Make sure to:
1. Create bucket `images` in Supabase Storage
2. Set bucket to Public
3. Add RLS policies for INSERT and SELECT

## Role Permissions

| Role | Dashboard | Export | Client | Note | Users |
|---|---|---|---|---|---|
| Software Developer | ✓ | ✓ All | ✓ All | ✓ All | ✓ All |
| CEO Mongolia | ✓ | ✓ All | ✓ All | ✓ All | ✓ All |
| CEO Thailand | ✓ | ✓ View+Add | ✗ | ✓ View+Add | ✗ |
| Customer Service | ✗ | ✓ View | ✓ All | ✓ View | ✗ |
| Origin Officer | ✗ | ✓ View+Add | ✗ | ✓ View | ✗ |
| Admin | ✓ | ✓ All | ✓ All | ✓ All | ✓ All |
| Staff | ✓ | ✓ All | ✓ All | ✓ All | ✗ |

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (for images)
- **Hosting**: Vercel
- **Auth**: bcryptjs password hashing
