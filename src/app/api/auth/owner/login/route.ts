import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { supabaseAdmin } from '@/server/supabase';
import { createOwnerSession, setOwnerSessionCookie } from '@/server/ownerAuth';
import { loginSchema } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // BYPASS MODE: For testing without Supabase
    // Set BYPASS_AUTH=true in .env.local to use hardcoded credentials
    const bypassAuth = process.env.BYPASS_AUTH === 'true';

    if (bypassAuth) {
      // Hardcoded test credentials
      const testCredentials = {
        'owner@acme.com': 'password123',
        'admin@test.com': 'admin123',
      };

      if (testCredentials[email as keyof typeof testCredentials] !== password) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Find or create user in database
      let user = await prisma.user.findFirst({
        where: { email },
      });

      if (!user) {
        // Auto-create user if doesn't exist
        const org = await prisma.organization.findFirst();
        if (!org) {
          return NextResponse.json(
            { error: 'No organization found. Run db:seed first.' },
            { status: 500 }
          );
        }

        user = await prisma.user.create({
          data: {
            orgId: org.id,
            email,
            role: 'OWNER',
          },
        });
      }

      // Create session
      const token = await createOwnerSession(user.id);
      await setOwnerSessionCookie(token);

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          orgId: user.orgId,
          role: user.role,
        },
      });
    }

    // NORMAL MODE: Authenticate with Supabase
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Find user in database
    const user = await prisma.user.findFirst({
      where: {
        email: data.user.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Create session
    const token = await createOwnerSession(user.id);
    await setOwnerSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        orgId: user.orgId,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
