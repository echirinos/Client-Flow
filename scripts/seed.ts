import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

const BYPASS_AUTH = process.env.BYPASS_AUTH === 'true';
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://placeholder.local';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabaseAdmin = BYPASS_AUTH
  ? null
  : createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('Starting seed...');

  // Create organization
  const org = await prisma.organization.upsert({
    where: { id: 'seed-org-1' },
    update: {},
    create: {
      id: 'seed-org-1',
      name: 'Acme Corporation',
    },
  });

  console.log(`✓ Created organization: ${org.name}`);

  // Create owner user in Supabase Auth
  const ownerEmail = 'owner@acme.com';
  const ownerPassword = 'password123';

  let supabaseUserId: string;

  if (BYPASS_AUTH || !supabaseAdmin) {
    // Bypass mode - skip Supabase user creation
    supabaseUserId = 'bypass-user-id';
    console.log(`✓ Bypass mode enabled - skipping Supabase user creation`);
  } else {
    try {
      const { data: existingUser, error: fetchError } =
        await supabaseAdmin.auth.admin.listUsers();

      const userExists = existingUser?.users.find((u) => u.email === ownerEmail);

      if (userExists) {
        supabaseUserId = userExists.id;
        console.log(`✓ Supabase user already exists: ${ownerEmail}`);
      } else {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: ownerEmail,
          password: ownerPassword,
          email_confirm: true,
        });

        if (error) {
          throw error;
        }

        supabaseUserId = data.user.id;
        console.log(`✓ Created Supabase user: ${ownerEmail}`);
      }
    } catch (error: any) {
      console.error('Supabase user creation error:', error.message);
      console.log('Continuing with database seed...');
      supabaseUserId = 'manual-user-id';
    }
  }

  // Create owner user in database
  const owner = await prisma.user.upsert({
    where: {
      orgId_email: {
        orgId: org.id,
        email: ownerEmail,
      },
    },
    update: {},
    create: {
      id: supabaseUserId,
      orgId: org.id,
      email: ownerEmail,
      role: 'OWNER',
    },
  });

  console.log(`✓ Created database user: ${owner.email}`);

  // Create sample client
  const client = await prisma.client.upsert({
    where: {
      orgId_email: {
        orgId: org.id,
        email: 'john@example.com',
      },
    },
    update: {},
    create: {
      orgId: org.id,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
    },
  });

  console.log(`✓ Created client: ${client.name}`);

  // Create sample job
  const job = await prisma.job.upsert({
    where: { id: 'seed-job-1' },
    update: {},
    create: {
      id: 'seed-job-1',
      orgId: org.id,
      clientId: client.id,
      title: 'Website Redesign Project',
      description: 'Complete redesign of company website with modern UI/UX',
      status: 'IN_PROGRESS',
    },
  });

  console.log(`✓ Created job: ${job.title}`);

  // Create sample message
  await prisma.message.create({
    data: {
      jobId: job.id,
      senderType: 'system',
      body: 'Job created successfully. Welcome to ClientFlow!',
    },
  });

  console.log(`✓ Created sample message`);

  console.log('\n✨ Seed completed successfully!');
  console.log('\nCredentials:');
  console.log(`Email: ${ownerEmail}`);
  console.log(`Password: ${ownerPassword}`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
