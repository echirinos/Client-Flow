import { NextResponse } from 'next/server';
import { clearOwnerSession } from '@/server/ownerAuth';

export async function POST() {
  try {
    await clearOwnerSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
