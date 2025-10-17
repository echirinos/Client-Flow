# Authentication Bypass Mode

## Quick Testing Without Supabase

If you want to test ClientFlow without setting up Supabase, you can use the authentication bypass mode.

## How to Enable

1. Open `.env.local`
2. Add or set: `BYPASS_AUTH=true`
3. Restart your dev server: `npm run dev`

## Test Credentials

When bypass mode is enabled, you can login with these hardcoded credentials:

### Option 1 (Default)
- **Email:** `owner@acme.com`
- **Password:** `password123`

### Option 2 (Alternative)
- **Email:** `admin@test.com`
- **Password:** `admin123`

## How It Works

When `BYPASS_AUTH=true`:
1. The login endpoint skips Supabase authentication
2. It checks credentials against hardcoded values
3. If the user doesn't exist in the database, it auto-creates them
4. It creates a valid session just like normal authentication

## What You Need

For bypass mode to work, you only need:
- ✅ A working database connection (`DATABASE_URL`)
- ✅ At least one Organization in the database (run `npm run db:seed`)
- ✅ Session secrets configured (`OWNER_SESSION_SECRET`, `CLIENT_JWT_SECRET`)

You **don't** need:
- ❌ Supabase account
- ❌ Supabase Auth configured
- ❌ User pre-created in database (auto-created on first login)

## Setup Steps

```bash
# 1. Make sure you have a database connection
# Edit .env.local and set your DATABASE_URL

# 2. Enable bypass mode
# Add to .env.local:
BYPASS_AUTH=true

# 3. Generate Prisma client
npm run db:generate

# 4. Push database schema
npm run db:push

# 5. Seed initial data (creates organization)
npm run db:seed

# 6. Start dev server
npm run dev

# 7. Login at http://localhost:3000/login
# Use: owner@acme.com / password123
```

## Testing Full Features

With bypass mode, you can test all features **except**:
- Supabase Auth user management
- Email verification flows
- Password reset flows

You **can** test:
- ✅ Job creation and management
- ✅ Messaging (owner and client)
- ✅ Dashboard and UI
- ✅ Client portal (magic links still work)
- ✅ File upload API (if S3 configured)
- ✅ Invoice creation
- ✅ Stripe Payment Links (if Stripe configured)
- ✅ HubSpot integration (if HubSpot configured)

## Disabling Bypass Mode

To switch to normal Supabase authentication:

1. Set `BYPASS_AUTH=false` (or remove the line)
2. Configure Supabase credentials in `.env.local`
3. Restart your dev server

## Security Warning

⚠️ **IMPORTANT:** Never enable bypass mode in production!

- Set `BYPASS_AUTH=false` or remove it entirely for production
- The bypass mode uses simple string comparison (not secure)
- Credentials are hardcoded in the source code
- Only use this for local development and testing

## Troubleshooting

**"No organization found" error:**
- Run `npm run db:seed` to create the organization
- Or manually create an organization in your database

**"Invalid credentials" error:**
- Make sure `BYPASS_AUTH=true` is set in `.env.local`
- Restart your dev server after changing environment variables
- Use exact credentials: `owner@acme.com` / `password123`

**Session not persisting:**
- Check that `OWNER_SESSION_SECRET` is set in `.env.local`
- Clear browser cookies and try again
- Check browser console for errors

## Adding More Test Users

To add more test credentials, edit [src/app/api/auth/owner/login/route.ts](src/app/api/auth/owner/login/route.ts:18):

```typescript
const testCredentials = {
  'owner@acme.com': 'password123',
  'admin@test.com': 'admin123',
  'yourname@test.com': 'yourpassword', // Add here
};
```

Users will be auto-created in the database on first login.

## When to Use Bypass Mode

✅ **Use bypass mode when:**
- Quick local testing
- Demo or presentation
- Don't have Supabase account yet
- Developing offline
- CI/CD testing

❌ **Don't use bypass mode when:**
- Production deployment
- Staging environment
- Testing auth-specific features
- Security auditing
- Public demos with real user data

---

Happy testing! Once you're ready for production, follow the [README.md](README.md) to set up Supabase properly.
