#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "========================================"
echo "  ClientFlow - Local Testing Script"
echo "========================================"
echo ""

# Check if server is running
echo -e "${BLUE}Checking if dev server is running...${NC}"
if lsof -i :3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Dev server is running on port 3000${NC}"
else
    echo -e "${RED}✗ Dev server is NOT running${NC}"
    echo -e "${YELLOW}Please run: npm run dev${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Testing Database Connection...${NC}"
export DATABASE_URL="postgresql://estebanchirinos@localhost:5432/clientflow"
if psql -d clientflow -c "SELECT COUNT(*) FROM \"Organization\";" > /dev/null 2>&1; then
    ORG_COUNT=$(psql -d clientflow -t -c "SELECT COUNT(*) FROM \"Organization\";")
    echo -e "${GREEN}✓ Database connected (${ORG_COUNT} organizations)${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Testing API Endpoints...${NC}"
echo ""

# Test 1: Login
echo -e "${YELLOW}Test 1: Owner Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/owner/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@acme.com","password":"password123"}' \
  -c /tmp/clientflow-cookies.txt)

if echo "$LOGIN_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Login successful${NC}"
    USER_EMAIL=$(echo "$LOGIN_RESPONSE" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
    echo "  Logged in as: $USER_EMAIL"
else
    echo -e "${RED}✗ Login failed${NC}"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo ""
echo -e "${YELLOW}Test 2: Get Jobs List${NC}"
JOBS_RESPONSE=$(curl -s -X GET http://localhost:3000/api/jobs \
  -b /tmp/clientflow-cookies.txt)

if echo "$JOBS_RESPONSE" | grep -q "jobs"; then
    JOB_COUNT=$(echo "$JOBS_RESPONSE" | grep -o '"id"' | wc -l)
    echo -e "${GREEN}✓ Jobs endpoint working (${JOB_COUNT} jobs found)${NC}"
else
    echo -e "${RED}✗ Jobs endpoint failed${NC}"
    echo "$JOBS_RESPONSE"
fi

echo ""
echo -e "${YELLOW}Test 3: Create New Job${NC}"
CREATE_JOB=$(curl -s -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -b /tmp/clientflow-cookies.txt \
  -d '{
    "orgId": "seed-org-1",
    "clientName": "Jane Smith",
    "clientEmail": "jane@example.com",
    "title": "Mobile App Development",
    "description": "Build iOS and Android mobile application"
  }')

if echo "$CREATE_JOB" | grep -q "clientPortalUrl"; then
    echo -e "${GREEN}✓ Job created successfully${NC}"
    JOB_ID=$(echo "$CREATE_JOB" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    PORTAL_URL=$(echo "$CREATE_JOB" | grep -o '"clientPortalUrl":"[^"]*"' | cut -d'"' -f4)
    echo "  Job ID: $JOB_ID"
    echo "  Portal URL: $PORTAL_URL"

    # Extract token from portal URL
    CLIENT_TOKEN=$(echo "$PORTAL_URL" | grep -o 't=[^&]*' | cut -d'=' -f2)

    # Save for later tests
    echo "$JOB_ID" > /tmp/clientflow-test-job-id.txt
    echo "$CLIENT_TOKEN" > /tmp/clientflow-test-token.txt
else
    echo -e "${RED}✗ Job creation failed${NC}"
    echo "$CREATE_JOB"
fi

echo ""
echo -e "${YELLOW}Test 4: Get Job Details${NC}"
if [ -f /tmp/clientflow-test-job-id.txt ]; then
    TEST_JOB_ID=$(cat /tmp/clientflow-test-job-id.txt)
    JOB_DETAILS=$(curl -s -X GET "http://localhost:3000/api/jobs/${TEST_JOB_ID}" \
      -b /tmp/clientflow-cookies.txt)

    if echo "$JOB_DETAILS" | grep -q "Mobile App Development"; then
        echo -e "${GREEN}✓ Job details retrieved${NC}"
    else
        echo -e "${RED}✗ Could not get job details${NC}"
    fi
fi

echo ""
echo -e "${YELLOW}Test 5: Send Message (Owner)${NC}"
if [ -f /tmp/clientflow-test-job-id.txt ]; then
    TEST_JOB_ID=$(cat /tmp/clientflow-test-job-id.txt)
    MESSAGE=$(curl -s -X POST "http://localhost:3000/api/jobs/${TEST_JOB_ID}/messages" \
      -H "Content-Type: application/json" \
      -b /tmp/clientflow-cookies.txt \
      -d '{"senderType":"owner","body":"Hello! We will start working on your app soon."}')

    if echo "$MESSAGE" | grep -q "message"; then
        echo -e "${GREEN}✓ Owner message sent${NC}"
    else
        echo -e "${RED}✗ Message sending failed${NC}"
    fi
fi

echo ""
echo -e "${YELLOW}Test 6: Client Portal Access (with token)${NC}"
if [ -f /tmp/clientflow-test-job-id.txt ] && [ -f /tmp/clientflow-test-token.txt ]; then
    TEST_JOB_ID=$(cat /tmp/clientflow-test-job-id.txt)
    TEST_TOKEN=$(cat /tmp/clientflow-test-token.txt)

    CLIENT_MESSAGES=$(curl -s -X GET "http://localhost:3000/api/jobs/${TEST_JOB_ID}/messages?t=${TEST_TOKEN}")

    if echo "$CLIENT_MESSAGES" | grep -q "messages"; then
        echo -e "${GREEN}✓ Client portal access working${NC}"
        MSG_COUNT=$(echo "$CLIENT_MESSAGES" | grep -o '"id"' | wc -l)
        echo "  Messages visible to client: $MSG_COUNT"
    else
        echo -e "${RED}✗ Client portal access failed${NC}"
    fi
fi

echo ""
echo -e "${YELLOW}Test 7: Send Message (Client)${NC}"
if [ -f /tmp/clientflow-test-job-id.txt ] && [ -f /tmp/clientflow-test-token.txt ]; then
    TEST_JOB_ID=$(cat /tmp/clientflow-test-job-id.txt)
    TEST_TOKEN=$(cat /tmp/clientflow-test-token.txt)

    CLIENT_MSG=$(curl -s -X POST "http://localhost:3000/api/jobs/${TEST_JOB_ID}/messages?t=${TEST_TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{"senderType":"client","body":"Thank you! Looking forward to it."}')

    if echo "$CLIENT_MSG" | grep -q "message"; then
        echo -e "${GREEN}✓ Client message sent${NC}"
    else
        echo -e "${RED}✗ Client message sending failed${NC}"
    fi
fi

echo ""
echo -e "${YELLOW}Test 8: Create Invoice${NC}"
if [ -f /tmp/clientflow-test-job-id.txt ]; then
    TEST_JOB_ID=$(cat /tmp/clientflow-test-job-id.txt)

    INVOICE=$(curl -s -X POST http://localhost:3000/api/invoices \
      -H "Content-Type: application/json" \
      -b /tmp/clientflow-cookies.txt \
      -d "{
        \"jobId\": \"${TEST_JOB_ID}\",
        \"items\": [
          {\"description\": \"App Design\", \"qty\": 1, \"unitAmount\": 500000},
          {\"description\": \"Development Hours\", \"qty\": 100, \"unitAmount\": 15000}
        ]
      }")

    if echo "$INVOICE" | grep -q "invoice"; then
        echo -e "${GREEN}✓ Invoice created${NC}"
        INVOICE_ID=$(echo "$INVOICE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        INVOICE_NUM=$(echo "$INVOICE" | grep -o '"number":"[^"]*"' | cut -d'"' -f4)
        TOTAL=$(echo "$INVOICE" | grep -o '"total":[0-9]*' | cut -d':' -f2)
        echo "  Invoice: $INVOICE_NUM"
        echo "  Total: \$$(echo "scale=2; $TOTAL / 100" | bc)"
        echo "$INVOICE_ID" > /tmp/clientflow-test-invoice-id.txt
    else
        echo -e "${RED}✗ Invoice creation failed${NC}"
        echo "$INVOICE"
    fi
fi

echo ""
echo -e "${YELLOW}Test 9: Update Job Status${NC}"
if [ -f /tmp/clientflow-test-job-id.txt ]; then
    TEST_JOB_ID=$(cat /tmp/clientflow-test-job-id.txt)

    UPDATE=$(curl -s -X PATCH "http://localhost:3000/api/jobs/${TEST_JOB_ID}" \
      -H "Content-Type: application/json" \
      -b /tmp/clientflow-cookies.txt \
      -d '{"status":"IN_PROGRESS"}')

    if echo "$UPDATE" | grep -q "IN_PROGRESS"; then
        echo -e "${GREEN}✓ Job status updated${NC}"
        echo "  New status: IN_PROGRESS"
    else
        echo -e "${RED}✗ Status update failed${NC}"
    fi
fi

echo ""
echo "========================================"
echo -e "${GREEN}  Testing Complete!${NC}"
echo "========================================"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Open browser and test the UI:"
echo "   http://localhost:3000/login"
echo ""
echo "2. Login with:"
echo "   Email: owner@acme.com"
echo "   Password: password123"
echo ""
echo "3. View the job you just created:"
echo "   Mobile App Development"
echo ""
if [ -f /tmp/clientflow-test-token.txt ] && [ -f /tmp/clientflow-test-job-id.txt ]; then
    TEST_JOB_ID=$(cat /tmp/clientflow-test-job-id.txt)
    TEST_TOKEN=$(cat /tmp/clientflow-test-token.txt)
    echo "4. Test client portal (open in incognito):"
    echo "   http://localhost:3000/portal/${TEST_JOB_ID}?t=${TEST_TOKEN}"
fi
echo ""
echo "========================================"
echo ""
