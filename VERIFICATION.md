# ClientFlow - Verification Checklist

Use this checklist to verify all features are working correctly.

## ✅ Setup Verification

### Environment & Database
- [ ] All environment variables set in `.env.local`
- [ ] `npm install` completed successfully
- [ ] `npm run db:generate` generated Prisma Client
- [ ] `npm run db:push` created database tables
- [ ] `npm run db:seed` created initial data
- [ ] `npm run dev` starts development server

### External Services
- [ ] Supabase project created and accessible
- [ ] AWS S3 bucket created with CORS configured
- [ ] Stripe account in test mode with API keys
- [ ] HubSpot Private App created with correct scopes

## ✅ Feature Testing

### 1. Owner Authentication
- [ ] Navigate to http://localhost:3000/login
- [ ] Login with `owner@acme.com` / `password123`
- [ ] Redirected to `/dashboard`
- [ ] Session persists on page refresh
- [ ] Logout works and redirects to login

### 2. Dashboard
- [ ] Dashboard shows "Website Redesign Project" (from seed)
- [ ] Status filter buttons work (All, NEW, IN_PROGRESS, etc.)
- [ ] Job counts display correctly
- [ ] Clicking job card navigates to job detail page

### 3. Job Creation (API Test)

Use curl or Postman:

```bash
# First, login to get session cookie
curl -X POST http://localhost:3000/api/auth/owner/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@acme.com",
    "password": "password123"
  }' \
  -c cookies.txt

# Create a job
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "orgId": "seed-org-1",
    "clientName": "Jane Smith",
    "clientEmail": "jane@example.com",
    "title": "Mobile App Development",
    "description": "Build iOS and Android app"
  }'
```

Expected response:
```json
{
  "job": { "id": "...", "title": "Mobile App Development", ... },
  "clientPortalUrl": "http://localhost:3000/portal/{jobId}?t={token}"
}
```

Verify:
- [ ] Job created in database
- [ ] Client created/updated in database
- [ ] HubSpot contact created (check HubSpot dashboard)
- [ ] HubSpot deal created (check HubSpot dashboard)
- [ ] Deal associated with contact
- [ ] Client portal URL returned
- [ ] Job appears in dashboard

### 4. Job Detail Page (Owner View)
- [ ] Click into "Website Redesign Project"
- [ ] Job title and status display correctly
- [ ] Client information shows
- [ ] Client portal link displays in blue box
- [ ] Messages section shows system message
- [ ] Attachments section shows (empty)
- [ ] Invoices section shows (empty)

### 5. Messaging (Owner)
- [ ] Type message in composer: "Hello, how can I help?"
- [ ] Click "Send Message"
- [ ] Message appears in message list
- [ ] Labeled as "You" with green background
- [ ] Timestamp shows correctly

### 6. Client Portal Access
- [ ] Copy client portal URL from job detail page
- [ ] Open in incognito/private browser window
- [ ] Portal loads successfully
- [ ] Job title and status display
- [ ] Messages section shows owner's message
- [ ] Client can see message composer

### 7. Messaging (Client)
- [ ] In client portal, type message: "Thanks! I have a question..."
- [ ] Click "Send Message"
- [ ] Message appears with "Client" label and blue background
- [ ] Go back to owner view (refresh page)
- [ ] Client message now visible to owner

### 8. File Upload (Presigned URL Test)

```bash
# Request presigned URL
curl -X POST http://localhost:3000/api/jobs/{jobId}/attachments/presign \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "contentType": "image/jpeg"
  }'
```

Expected response:
```json
{
  "uploadUrl": "https://your-bucket.s3.amazonaws.com/jobs/...",
  "fileKey": "jobs/{jobId}/{uuid}.jpeg",
  "attachmentId": "..."
}
```

Then upload file:
```bash
curl -X PUT "{uploadUrl}" \
  -H "Content-Type: image/jpeg" \
  --upload-file your-image.jpg
```

Verify:
- [ ] Presigned URL generated
- [ ] File uploaded to S3 successfully
- [ ] Attachment record created in database
- [ ] Attachment appears in gallery on job page
- [ ] Thumbnail displays (for images)

### 9. Invoice Creation

```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "jobId": "{jobId}",
    "items": [
      {
        "description": "Website Design",
        "qty": 1,
        "unitAmount": 250000
      },
      {
        "description": "Development Hours",
        "qty": 40,
        "unitAmount": 10000
      }
    ]
  }'
```

Expected response:
```json
{
  "invoice": {
    "id": "...",
    "number": "INV-0001",
    "subtotal": 650000,
    "total": 650000,
    "status": "DRAFT",
    "items": [...]
  }
}
```

Verify:
- [ ] Invoice created with correct number
- [ ] Subtotal calculated correctly ($2,500 + $400 = $6,500)
- [ ] Total matches subtotal
- [ ] Status is "DRAFT"
- [ ] Invoice appears on job detail page

### 10. Stripe Payment Link

```bash
curl -X POST http://localhost:3000/api/invoices/{invoiceId}/paylink \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

Expected response:
```json
{
  "url": "https://buy.stripe.com/test_..."
}
```

Verify:
- [ ] Payment link generated
- [ ] Invoice status changed to "SENT"
- [ ] "View Payment Link" button appears on job page
- [ ] Click button opens Stripe payment page
- [ ] Payment page shows correct amount and items
- [ ] Client portal shows "Pay Now" button
- [ ] Client can click "Pay Now" to access payment page

### 11. Job Status Update

```bash
curl -X PATCH http://localhost:3000/api/jobs/{jobId} \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "status": "COMPLETED"
  }'
```

Verify:
- [ ] Job status updated in database
- [ ] System message created: "Job status changed from IN_PROGRESS to COMPLETED"
- [ ] HubSpot deal updated with new dealstage
- [ ] Check HubSpot dashboard to confirm deal stage changed
- [ ] Dashboard reflects new status
- [ ] Status badge updates on job page

### 12. Job Deletion

```bash
curl -X DELETE http://localhost:3000/api/jobs/{jobId} \
  -b cookies.txt
```

Verify:
- [ ] Job deleted from database
- [ ] Related messages deleted (cascade)
- [ ] Related attachments deleted (cascade)
- [ ] Related invoices deleted (cascade)
- [ ] HubSpot deal deleted
- [ ] Check HubSpot dashboard - deal should be gone
- [ ] Job no longer appears in dashboard

### 13. HubSpot Audit Logs

Check database:
```sql
SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC;
```

Verify:
- [ ] Logs exist for create_contact
- [ ] Logs exist for create_deal
- [ ] Logs exist for associate_deal_contact
- [ ] Logs exist for update_deal (if status changed)
- [ ] Logs exist for delete_deal (if job deleted)
- [ ] Meta field contains request/response data

### 14. Security Verification

**Owner Session:**
- [ ] Dashboard inaccessible without login (redirects to /login)
- [ ] API routes return 401/403 without valid session
- [ ] Logout clears session cookie
- [ ] Session expires after 7 days

**Client Token:**
- [ ] Client portal without token shows "Access Denied"
- [ ] Client portal with invalid token shows "Access Denied"
- [ ] Client can only access their own job
- [ ] Client cannot access owner API routes
- [ ] Token expires after 7 days

**Data Isolation:**
- [ ] Owners can only see jobs from their organization
- [ ] Clients can only see their assigned job
- [ ] Cross-organization access blocked

### 15. Error Handling

Test these scenarios:
- [ ] Invalid email format in login → validation error
- [ ] Wrong password in login → 401 error
- [ ] Create job with missing fields → validation error
- [ ] Upload file with invalid MIME type → 400 error
- [ ] Create invoice with invalid jobId → 403 error
- [ ] Access non-existent job → 404 error

## 🎯 Integration Tests

### Full Owner Workflow
1. Login as owner
2. Create new job (verify HubSpot sync)
3. View job detail page
4. Send message to client
5. Upload attachment
6. Create invoice
7. Generate payment link
8. Update job status (verify HubSpot sync)
9. Logout

### Full Client Workflow
1. Access client portal with magic link
2. View job details
3. Read messages from owner
4. Send reply message
5. View attachments
6. View invoice
7. Click "Pay Now" (don't complete payment)

## 📊 Performance Checks

- [ ] Dashboard loads in < 2 seconds
- [ ] Job detail page loads in < 2 seconds
- [ ] Message send completes in < 500ms
- [ ] Presigned URL generation in < 200ms
- [ ] HubSpot API calls complete in < 3 seconds

## 🔍 Code Quality Checks

- [ ] No TypeScript errors: `npm run build`
- [ ] Prisma schema valid: `npm run db:generate`
- [ ] All environment variables documented in `.env.example`
- [ ] README covers all setup steps
- [ ] API routes use Zod validation
- [ ] All database queries use proper indexes

## 🚀 Pre-Production Checklist

Before deploying to production:
- [ ] Change all secrets to production values
- [ ] Use production Supabase project
- [ ] Use production AWS S3 bucket
- [ ] Use production Stripe keys (sk_live_...)
- [ ] Use production HubSpot token
- [ ] Enable database migrations (not push)
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS for S3
- [ ] Set up monitoring/logging
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Set up database backups
- [ ] Test in production-like environment first

## ✨ Success Criteria

Your ClientFlow MVP is ready when:
- ✅ All features tested and working
- ✅ HubSpot integration creating/updating records
- ✅ Client portal accessible via magic links
- ✅ File uploads working to S3
- ✅ Stripe payment links generating correctly
- ✅ Security measures in place and tested
- ✅ Documentation complete and accurate

## 🐛 Common Issues & Solutions

**Database connection fails:**
- Check DATABASE_URL format
- Verify Supabase project is running
- Test connection with `npx prisma db push`

**HubSpot 401 errors:**
- Verify HUBSPOT_PRIVATE_APP_TOKEN is correct
- Check token hasn't been revoked
- Verify scopes include crm.objects.contacts and crm.objects.deals

**S3 upload fails:**
- Check bucket name and region are correct
- Verify IAM credentials have PutObject permission
- Ensure bucket CORS allows PUT from your domain

**Stripe payment link error:**
- Verify STRIPE_SECRET_KEY is set
- Check you're using correct API version
- Ensure amounts are in cents (not dollars)

**Client portal "Access Denied":**
- Verify token is in URL query parameter ?t=...
- Check token hasn't expired (7 days)
- Ensure jobId in URL matches token payload

---

🎉 If all items are checked, your ClientFlow MVP is production-ready!
