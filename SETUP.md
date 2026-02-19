# Muley SE AI Squid Games – Setup Guide

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account).
2. Click **New project**.
3. Choose your **Organization** (or create one).
4. Set:
   - **Name:** e.g. `muleyai-squidgames`
   - **Database password:** choose a strong password and store it safely (you need it for direct DB access).
   - **Region:** pick one close to you or your users.
5. Click **Create new project** and wait until the project is ready (1–2 minutes).

---

## 2. Run the database schema

1. In the Supabase dashboard, open your project.
2. In the left sidebar, go to **SQL Editor**.
3. Click **New query**.
4. Open the file `supabase-schema.sql` in this repo and copy its full contents.
5. Paste the SQL into the Supabase SQL Editor.
6. Click **Run** (or press Cmd/Ctrl + Enter).

You should see a success message. This creates:

- `sessions` – bi-weekly How We AI sessions
- `participants` – the 4 players per session
- `votes` – anonymous votes (one per device per session)
- Row Level Security (RLS) policies so only valid votes are accepted when voting is open
- Realtime enabled on `sessions` and `participants`

**If you get an error on the `ALTER PUBLICATION supabase_realtime ADD TABLE` lines:**  
Go to **Database → Replication** in the sidebar, find the `supabase_realtime` publication, and add the `sessions` and `participants` tables to it manually.

---

## 3. Get your API keys and URL

1. In the Supabase dashboard, go to **Project Settings** (gear icon in the sidebar).
2. Open the **API** section.
3. Copy:
   - **Project URL** → use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → use for `SUPABASE_SERVICE_ROLE_KEY`  
     (Keep this secret; it bypasses RLS. Never expose it in the browser or commit it to git.)

---

## 4. Configure the app

1. In the project root, copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```
2. Edit `.env.local` and set:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-step-3
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-step-3

   ADMIN_PASSWORD=your-secure-admin-password
   ADMIN_TOKEN=any-long-random-string-for-cookie
   ```

   Replace the placeholders with the values from Step 3. For `ADMIN_TOKEN`, use a long random string (e.g. from a password manager or `openssl rand -hex 24`).

3. Save the file.  
   `.env.local` is gitignored and will not be committed.

---

## 5. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the Muley SE AI Squid Games landing page.

- **Audience:** Share the voting link `/vote/[sessionId]` (you get the session ID after creating a session in the host dashboard).
- **Host/Admin:** Go to `/host`, log in with `ADMIN_PASSWORD`, then create a session and add 4 participants in the dashboard.

---

## Quick checklist

- [ ] Supabase project created  
- [ ] `supabase-schema.sql` run in SQL Editor  
- [ ] `.env.local` filled with Supabase URL and keys  
- [ ] `ADMIN_PASSWORD` and `ADMIN_TOKEN` set in `.env.local`  
- [ ] `npm run dev` works and you can open the app and host dashboard  
