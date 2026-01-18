import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtected = path.startsWith('/admin');

  if (isProtected) {
    const cookie = (await cookies()).get('session')?.value;
    if (!cookie) {
      return NextResponse.redirect(new URL('/', req.nextUrl));
    }
    
    try {
        const session = await decrypt(cookie);
        if (session.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', req.nextUrl));
        }
    } catch (e) {
        return NextResponse.redirect(new URL('/', req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
