# ClientFlow

A production-ready CRM-integrated client portal built with Next.js 15, allowing business owners to manage jobs and communicate with clients seamlessly.

## Features

- **Job Management**: Complete CRUD operations for managing client jobs
- **Real-time Messaging**: Bidirectional communication between owners and clients
- **File Attachments**: Secure image and document uploads via AWS S3
- **Invoicing**: Create invoices with Stripe Payment Links
- **HubSpot Integration**: Automatic contact and deal creation in HubSpot CRM
- **Client Portal**: Magic link access for clients to view job status, communicate, and pay invoices
- **Owner Authentication**: Secure Supabase Auth for business owners

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL (Supabase) with Prisma ORM
- **Authentication**:
  - Supabase Auth for owners
  - JWT magic links for clients
- **File Storage**: AWS S3 with presigned URLs
- **Payments**: Stripe Payment Links
- **CRM**: HubSpot CRM v3 API
- **Validation**: Zod
- **Styling**: Tailwind CSS

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Supabase recommended)
- Supabase account
- AWS account with S3 bucket
- Stripe account
- HubSpot account with Private App token

## Setup Instructions

### 1. Clone and Install

```bash
cd crm-integration
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:

**Supabase:**
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `DATABASE_URL`: PostgreSQL connection string from Supabase

**Application:**
- `APP_ORIGIN`: Your app URL (http://localhost:3000 for local)
- `OWNER_SESSION_SECRET`: Random secret key for owner sessions
- `CLIENT_JWT_SECRET`: Random secret key for client JWT tokens

Generate secrets with:
```bash
openssl rand -base64 32
```

**AWS S3:**
- `S3_REGION`: AWS region (e.g., us-east-1)
- `S3_BUCKET`: Your S3 bucket name
- `S3_ACCESS_KEY_ID`: AWS access key ID
- `S3_SECRET_ACCESS_KEY`: AWS secret access key

**Stripe:**
- `STRIPE_SECRET_KEY`: Your Stripe secret key (sk_test_... for testing)

**HubSpot:**
- `HUBSPOT_PRIVATE_APP_TOKEN`: HubSpot Private App token
- `HUBSPOT_BASE_URL`: https://api.hubapi.com

### 3. Database Setup

Generate Prisma client and push schema to database:

```bash
npm run db:generate
npm run db:push
```

### 4. Seed Database

Create initial organization and owner user:

```bash
npm run db:seed
```

This creates:
- Organization: "Acme Corporation"
- Owner user: owner@acme.com / password123
- Sample client and job

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### Owner Workflow

1. **Login**: Navigate to `/dashboard` and login with owner credentials
2. **Create Job**:
   - Click "Create Job" button
   - Fill in client details and job information
   - HubSpot contact and deal are automatically created
   - Client portal magic link is generated
3. **Manage Job**:
   - View job details at `/jobs/{jobId}`
   - Send messages to client
   - Upload attachments
   - Create invoices
   - Generate Stripe Payment Links
4. **Share Portal Link**: Copy client portal URL and send to client

### Client Workflow

1. **Access Portal**: Open magic link received from owner
2. **View Job**: See job status and description
3. **Communicate**: Send and receive messages
4. **View Files**: See all uploaded attachments
5. **Pay Invoice**: Click "Pay Now" on invoices to open Stripe Payment Link

## API Routes

### Authentication
- `POST /api/auth/owner/login` - Owner login
- `POST /api/auth/owner/logout` - Owner logout

### Jobs
- `GET /api/jobs` - List jobs (with optional ?status filter)
- `POST /api/jobs` - Create new job (creates HubSpot contact & deal)
- `GET /api/jobs/{jobId}` - Get job details
- `PATCH /api/jobs/{jobId}` - Update job (syncs to HubSpot)
- `DELETE /api/jobs/{jobId}` - Delete job (deletes from HubSpot)

### Messages
- `GET /api/jobs/{jobId}/messages` - List messages
- `POST /api/jobs/{jobId}/messages` - Create message

### Attachments
- `POST /api/jobs/{jobId}/attachments/presign` - Get presigned S3 upload URL

### Invoices
- `POST /api/invoices` - Create invoice
- `POST /api/invoices/{invoiceId}/paylink` - Generate Stripe Payment Link

## HubSpot Integration

The HubSpot adapter automatically:

1. **On Job Creation**:
   - Creates a Contact (if email provided)
   - Creates a Deal with job title
   - Associates Deal to Contact

2. **On Job Update**:
   - Updates Deal properties (e.g., status → dealstage)

3. **On Job Deletion**:
   - Deletes Deal from HubSpot

All HubSpot operations are logged in the `AuditLog` table.

### HubSpot Setup

1. Create a Private App in HubSpot:
   - Go to Settings → Integrations → Private Apps
   - Create app with scopes: `crm.objects.contacts`, `crm.objects.deals`
   - Copy the access token to `HUBSPOT_PRIVATE_APP_TOKEN`

## Stripe Payment Links

To test payments locally:

1. Use Stripe test mode keys (sk_test_...)
2. Install Stripe CLI: https://stripe.com/docs/stripe-cli
3. Forward webhooks (optional):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Use test card: 4242 4242 4242 4242

## Security Features

- **Owner Sessions**: HttpOnly cookies with 7-day expiry
- **Client Access**: JWT tokens scoped to jobId and clientEmail
- **File Uploads**: MIME type validation, 10MB size limit
- **Presigned URLs**: Time-limited S3 access
- **Input Validation**: Zod schemas on all API routes
- **Audit Logging**: All HubSpot operations tracked

## Database Schema

Key models:
- **Organization**: Multi-tenant organization
- **User**: Owner/staff with Supabase auth
- **Client**: Customer contact information
- **Job**: Project/service job
- **Message**: Communication thread
- **Attachment**: File uploads
- **Invoice**: Billing with line items
- **AuditLog**: Activity tracking

See `prisma/schema.prisma` for full schema.

## Project Structure

```
src/
├── app/
│   ├── api/              # API route handlers
│   ├── dashboard/        # Owner dashboard
│   ├── jobs/[id]/        # Job detail page
│   └── portal/[id]/      # Client portal
├── components/           # React components
├── server/               # Server utilities
│   ├── hubspot/          # HubSpot integration
│   ├── prisma.ts         # Database client
│   ├── supabase.ts       # Auth client
│   ├── ownerAuth.ts      # Owner session mgmt
│   ├── clientMagicLink.ts # Client JWT
│   ├── s3.ts             # S3 presigned URLs
│   └── stripe.ts         # Payment links
└── lib/
    └── validators.ts     # Zod schemas
```

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Database Migration

For production, use migrations instead of push:

```bash
npm run db:migrate
```

## Troubleshooting

**Database connection issues:**
- Verify `DATABASE_URL` is correct
- Ensure database is accessible from your IP
- Check Supabase connection pooler settings

**HubSpot errors:**
- Verify token has correct scopes
- Check rate limits (150 requests per 10 seconds)
- Review audit logs for detailed errors

**S3 upload failures:**
- Verify bucket CORS configuration
- Check IAM user permissions
- Ensure bucket is in correct region

**Stripe payment link errors:**
- Use test mode keys for development
- Verify line items are correctly formatted
- Check minimum amount requirements

## Contributing

This is a production MVP. To extend:

1. Add user roles (STAFF vs OWNER permissions)
2. Implement webhook handlers for Stripe payment confirmations
3. Add real-time notifications with websockets
4. Expand HubSpot sync to include custom properties
5. Add file preview/download from S3
6. Implement job templates
7. Add analytics dashboard

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
