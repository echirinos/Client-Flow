# ClientFlow - Quick Start Guide

## Fastest Way to Get Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials. **Minimum required**:
- Supabase URL, keys, and DATABASE_URL
- Random secrets for OWNER_SESSION_SECRET and CLIENT_JWT_SECRET
- APP_ORIGIN=http://localhost:3000

**Generate secrets:**
```bash
openssl rand -base64 32
```

### 3. Set Up Database
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

## Test Credentials

After seeding:
- **Email**: owner@acme.com
- **Password**: password123

## Test the Application

### Owner Flow:
1. Login at `/dashboard`
2. View the sample job
3. Click into job details
4. Send a message
5. Create an invoice

### Client Flow:
1. Copy the client portal link from job detail page
2. Open in incognito/private window
3. View job status
4. Send a message as client
5. View invoices

## Key API Endpoints

### Jobs
```bash
# Create job with HubSpot integration
POST /api/jobs
{
  "orgId": "seed-org-1",
  "clientName": "Jane Smith",
  "clientEmail": "jane@example.com",
  "title": "New Website",
  "description": "Build a new website"
}

# List jobs
GET /api/jobs

# Get job details
GET /api/jobs/{jobId}

# Update job
PATCH /api/jobs/{jobId}
{
  "status": "IN_PROGRESS"
}
```

### Messages
```bash
# List messages
GET /api/jobs/{jobId}/messages

# Send message (owner)
POST /api/jobs/{jobId}/messages
{
  "senderType": "owner",
  "body": "Hello client!"
}

# Send message (client with token)
POST /api/jobs/{jobId}/messages?t={clientToken}
{
  "senderType": "client",
  "body": "Thank you!"
}
```

### Attachments
```bash
# Get presigned upload URL
POST /api/jobs/{jobId}/attachments/presign
{
  "contentType": "image/jpeg"
}

# Returns: { uploadUrl, fileKey, attachmentId }
# Upload file with PUT to uploadUrl
```

### Invoices
```bash
# Create invoice
POST /api/invoices
{
  "jobId": "job-id",
  "items": [
    {
      "description": "Web Development",
      "qty": 1,
      "unitAmount": 500000
    }
  ]
}

# Generate payment link
POST /api/invoices/{invoiceId}/paylink
# Returns: { url: "https://buy.stripe.com/..." }
```

## Environment Setup Checklist

### Supabase
- [ ] Create project at supabase.com
- [ ] Get database URL from Settings → Database
- [ ] Get API keys from Settings → API
- [ ] Run `db:push` to create tables

### AWS S3
- [ ] Create S3 bucket
- [ ] Enable CORS for web uploads
- [ ] Create IAM user with PutObject permission
- [ ] Get access key and secret

### Stripe
- [ ] Get API keys from dashboard
- [ ] Use test mode (sk_test_...) for development
- [ ] Test with card: 4242 4242 4242 4242

### HubSpot
- [ ] Go to Settings → Integrations → Private Apps
- [ ] Create app with scopes: crm.objects.contacts, crm.objects.deals
- [ ] Copy access token

## Common Commands

```bash
# Development
npm run dev

# Database
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Create migration
npm run db:seed        # Seed initial data

# Production
npm run build
npm start
```

## Troubleshooting

### "Unauthorized" on dashboard
- Check if you're logged in
- Verify session cookie is set
- Try logging in again

### HubSpot integration not working
- Verify HUBSPOT_PRIVATE_APP_TOKEN is set
- Check token has required scopes
- Review audit logs in database

### Client portal shows "Access Denied"
- Ensure you're using the full URL with ?t=token
- Check token hasn't expired (7 days)
- Verify jobId matches

### File uploads failing
- Check S3 credentials are correct
- Verify bucket CORS configuration
- Ensure file type is allowed (see validators.ts)

## Next Steps

1. Configure your real service credentials
2. Customize status mappings for HubSpot
3. Add your branding/styling
4. Set up Stripe webhooks for payment confirmations
5. Configure email notifications
6. Deploy to Vercel or your preferred platform

## Architecture Overview

```
┌─────────────┐
│   Owner     │
│  Dashboard  │
└─────┬───────┘
      │
      ├─→ Create Job ─────→ HubSpot (Contact + Deal)
      │                          │
      ├─→ Manage Job             │
      │   • Messages             │
      │   • Attachments ─→ S3    │
      │   • Invoices             │
      │       └─→ Stripe Payment Link
      │
      └─→ Generate Magic Link ──→ Client Portal
                                       │
                                       ├─→ View Job
                                       ├─→ Send Messages
                                       ├─→ View Files
                                       └─→ Pay Invoices
```

## Support

Need help? Check:
1. README.md for detailed documentation
2. .env.example for required variables
3. prisma/schema.prisma for data model
4. GitHub issues for common problems
