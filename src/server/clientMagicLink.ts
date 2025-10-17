import { SignJWT, jwtVerify } from 'jose';

const CLIENT_JWT_SECRET = new TextEncoder().encode(
  process.env.CLIENT_JWT_SECRET || 'fallback-client-secret'
);

export interface ClientTokenPayload {
  jobId: string;
  clientEmail: string;
}

export async function generateClientMagicLink(
  jobId: string,
  clientEmail: string,
  appOrigin: string
): Promise<string> {
  const token = await new SignJWT({
    jobId,
    clientEmail,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(CLIENT_JWT_SECRET);

  return `${appOrigin}/portal/${jobId}?t=${token}`;
}

export async function verifyClientToken(
  token: string
): Promise<ClientTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, CLIENT_JWT_SECRET);
    return payload as ClientTokenPayload;
  } catch (error) {
    return null;
  }
}

export async function validateClientAccess(
  token: string | undefined,
  jobId: string
): Promise<boolean> {
  if (!token) {
    return false;
  }

  const payload = await verifyClientToken(token);
  if (!payload) {
    return false;
  }

  return payload.jobId === jobId;
}
