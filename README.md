# JohnnyEdge AI Business OS — Stage 1

Foundation package for the JohnnyEdge AI Business OS.

## What Stage 1 includes

- Landing page
- Supabase email/password authentication
- Email confirmation callback
- Business onboarding
- Business creation RPC
- Business members and roles
- PostgreSQL Row Level Security foundation
- Protected dashboard
- Sidebar/navigation placeholders
- Secure environment-variable setup

## Stack

Next.js + TypeScript + Tailwind CSS + Supabase + GitHub + Vercel.

## 1. Create the app

If you are starting from an empty directory, you can also bootstrap with the Supabase Next.js template:

```bash
npx create-next-app@latest johnnyedge-business-os -e with-supabase
```

Then replace/add the files in this package.

## 2. Install dependencies

```bash
npm install
```

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase Project URL and Publishable Key.

Never commit `.env.local`.

## 4. Supabase

Open Supabase → SQL Editor → New query.

Paste and run:

`supabase/database.sql`

Then enable Email authentication under Authentication → Providers.

For local development, configure:

- Site URL: `http://localhost:3000`
- Redirect URL: `http://localhost:3000/auth/callback`

## 5. Run locally

```bash
npm run dev
```

Open:

`http://localhost:3000`

Test:

Landing → Sign Up → email confirmation → Onboarding → Create business → Dashboard.

## 6. GitHub

```bash
git init
git add .
git commit -m "Build JohnnyEdge AI Business OS Stage 1"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY
git push -u origin main
```

## 7. Vercel

Import the GitHub repository into Vercel.

Add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Enable them for Production, Preview and Development.

After deployment, add your Vercel URL and `/auth/callback` to Supabase Authentication → URL Configuration.

## Stage order

Stage 1: Foundation  
Stage 2: Customers + CRM  
Stage 3: Products + Inventory  
Stage 4: Sales + Orders  
Stage 5: Invoices + Expenses + Cashflow  
Stage 6: AI Business Assistant  
Stage 7: Paystack  
Stage 8: WhatsApp AI  
Stage 9: AI Agents + Automation
