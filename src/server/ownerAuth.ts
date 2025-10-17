import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './prisma';

const SESSION_SECRET = new TextEncoder().encode(
  process.env.OWNER_SESSION_SECRET || 'fallback-secret-key'
);
const SESSION_COOKIE_NAME = 'owner_session';

export interface OwnerSession {
  userId: string;
  orgId: string;
  email: string;
  role: string;
}

export async function createOwnerSession(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, orgId: true, email: true, role: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const token = await new SignJWT({
    userId: user.id,
    orgId: user.orgId,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(SESSION_SECRET);

  return token;
}

export async function setOwnerSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function getOwnerSession(): Promise<OwnerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return payload as OwnerSession;
  } catch (error) {
    return null;
  }
}

export async function clearOwnerSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireOwnerSession(): Promise<OwnerSession> {
  const session = await getOwnerSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
