# ClientFlow - Complete Testing Guide

## 🎯 Your App is READY to Test!

**Dev Server:** http://localhost:3000
**Status:** ✅ Running and functional

---

## 🔐 Login Credentials

```
Email: owner@acme.com
Password: password123
```

Or alternatively:
```
Email: admin@test.com
Password: admin123
```

---

## 📋 Step-by-Step Testing

### 1. Test Owner Login & Dashboard

1. Open browser: **http://localhost:3000**
2. You'll be redirected to `/login`
3. Enter credentials: `owner@acme.com` / `password123`
4. Click "Sign in"
5. ✅ You should see the Dashboard with "Website Redesign Project" (from seed data)

**What to check:**
- ✅ Login form appears
- ✅ Login succeeds without errors
- ✅ Redirects to dashboard
- ✅ Shows at least 1 job (from seed)
- ✅ Status filter buttons work
- ✅ User email shows in top right
- ✅ Logout button present

---

### 2. Test Job Detail Page

1. From dashboard, click on "Website Redesign Project"
2. ✅ Should navigate to `/jobs/[id]`

**What to check:**
- ✅ Job title and status display
- ✅ Client information shows ("John Doe")
- ✅ Client portal link displays in blue box
- ✅ Messages tab shows system message
- ✅ Attachments section visible (empty)
- ✅ Invoices section visible (empty)

---

### 3. Test Messaging (Owner Side)

1. On job detail page, scroll to Messages section
2. Type a message: "Hello! How can I help you today?"
3. Click "Send Message"
4. ✅ Message should appear immediately

**What to check:**
- ✅ Message composer works
- ✅ Message sends without error
- ✅ Message appears in list
- ✅ Labeled as "You" with green background
- ✅ Timestamp shows

---

### 4. Test Client Portal Access

1. Copy the "Client Portal Link" from the job page
2. Open in **incognito/private window** (or different browser)
3. Paste the URL (should look like: `http://localhost:3000/portal/[id]?t=...`)
4. ✅ Client portal should load

**What to check:**
- ✅ Portal loads without login
- ✅ Job title and status display
- ✅ Client sees owner's message
- ✅ Message composer available
- ✅ No owner-only features visible

---

### 5. Test Client Messaging

1. In the client portal window, type: "Thanks! I have a question..."
2. Click "Send Message"
3. ✅ Message appears with "Client" label and blue background
4. Go back to owner window and refresh
5. ✅ Client message now visible to owner

**What to check:**
- ✅ Client can send messages
- ✅ Messages labeled correctly
- ✅ Owner sees client messages
- ✅ Bidirectional communication works

---

### 6. Create a New Job (via UI - when implemented)

Since UI for creating jobs isn't built yet, use the API:

```bash
curl -X POST http://localhost:3000/api/auth/owner/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@acme.com","password":"password123"}' \
  -c /tmp/cookies.txt

curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -b /tmp/cookies.txt \
  -d '{
    "orgId": "seed-org-1",
    "clientName": "Jane Smith",
    "clientEmail": "jane@example.com",
    "title": "E-commerce Website",
    "description": "Build online store with payment integration"
  }'
```

Then refresh dashboard to see new job!

---

### 7. Test Job Status Update

Use API to update status:

```bash
# Get job ID from dashboard or previous response
curl -X PATCH http://localhost:3000/api/jobs/[JOB_ID] \
  -H "Content-Type: application/json" \
  -b /tmp/cookies.txt \
  -d '{"status":"IN_PROGRESS"}'
```

Then refresh to see:
- ✅ Status badge updated
- ✅ System message added: "Job status changed from NEW to IN_PROGRESS"

---

### 8. Create Invoice

```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -b /tmp/cookies.txt \
  -d '{
    "jobId": "[JOB_ID]",
    "items": [
      {"description": "Website Design", "qty": 1, "unitAmount": 250000},
      {"description": "Development", "qty": 1, "unitAmount": 500000}
    ]
  }'
```

✅ Invoice created with number "INV-0001"
✅ Total: $7,500.00

Refresh job page to see invoice in Invoices section!

---

### 9. Test Logout

1. Click "Logout" button in top right
2. ✅ Should redirect to login page
3. ✅ Can't access dashboard anymore (redirects to login)
4. ✅ Can login again successfully

---

## 🚀 Quick API Tests

All these work right now:

### Login
```bash
curl -X POST http://localhost:3000/api/auth/owner/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@acme.com","password":"password123"}' \
  -c cookies.txt
```

### Get Jobs
```bash
curl -X GET http://localhost:3000/api/jobs -b cookies.txt
```

### Create Job
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "orgId": "seed-org-1",
    "clientName": "Test Client",
    "clientEmail": "test@example.com",
    "title": "Test Job"
  }'
```

### Send Message (Owner)
```bash
curl -X POST http://localhost:3000/api/jobs/[JOB_ID]/messages \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"senderType":"owner","body":"Test message"}'
```

### Send Message (Client with token)
```bash
curl -X POST http://localhost:3000/api/jobs/[JOB_ID]/messages?t=[TOKEN] \
  -H "Content-Type: application/json" \
  -d '{"senderType":"client","body":"Client reply"}'
```

---

## ✅ Features Working NOW

- ✅ Owner login/logout
- ✅ Dashboard with job listing
- ✅ Job detail view
- ✅ Messaging (owner → client)
- ✅ Messaging (client → owner)
- ✅ Client portal with magic links
- ✅ Invoice creation
- ✅ Job status updates
- ✅ Database persistence

---

## ⏳ Features that Need External Services

These features need credentials configured in `.env.local`:

### File Uploads (Needs AWS S3)
```bash
# Won't work until you add:
S3_REGION=...
S3_BUCKET=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

### Payment Links (Needs Stripe)
```bash
# Won't work until you add:
STRIPE_SECRET_KEY=sk_test_...
```

### HubSpot Sync (Needs HubSpot)
```bash
# Won't work until you add:
HUBSPOT_PRIVATE_APP_TOKEN=pat-na1-...
```

---

## 🐛 Troubleshooting

### "Unauthorized" error
- Make sure you're logged in
- Check cookies are enabled
- Try logging in again

### "Can't connect to database"
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in .env.local
- Run: `npm run db:push`

### Dev server not responding
- Check if running: `lsof -i :3000`
- Restart: `npm run dev`
- Check logs: `tail -f /tmp/clientflow-dev.log`

### Client portal shows "Access Denied"
- Make sure you copy the FULL URL with ?t=... token
- Token might be expired (7 days)
- Create a new job to get fresh token

---

## 🎉 What Works Right Now (Without External Services)

You can fully test:
1. ✅ Complete authentication flow
2. ✅ Job management (create, read, update, delete via API)
3. ✅ Dashboard navigation
4. ✅ Messaging system (bidirectional)
5. ✅ Client portal access
6. ✅ Invoice creation (without payment processing)
7. ✅ Status updates
8. ✅ UI and styling

---

## 📝 Next Steps to Add

If you want to extend the app, consider adding:

1. **Job Creation Form** - UI to create jobs from dashboard
2. **File Upload UI** - Drag & drop interface
3. **Invoice Payment UI** - Better integration with Stripe
4. **Real-time Updates** - WebSocket or polling for new messages
5. **Email Notifications** - Send portal links via email
6. **Search/Filter** - Find jobs quickly
7. **User Management** - Add more team members

---

## 💡 Pro Tips

- Use incognito window for client portal (avoids cookie conflicts)
- Keep browser dev console open (F12) to see any errors
- Check `/tmp/clientflow-dev.log` for server-side errors
- Use `psql -d clientflow` to inspect database directly

---

**🎊 Your app is fully functional for local testing!**

Start here: **http://localhost:3000/login**
