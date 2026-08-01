import { NextResponse } from 'next/server';

export function middleware(req) {
  const authHeader = req.headers.get('authorization');

  if (authHeader) {
    const [type, credentials] = authHeader.split(' ');
    if (type.toLowerCase() === 'basic') {
      try {
        const decoded = atob(credentials);
        const [username, password] = decoded.split(':');
        // Username dan password server untuk memprivatkan website Anda
        if (username === 'admin' && password === 'cakelrahasia') {
          return NextResponse.next();
        }
      } catch (e) {}
    }
  }

  return new NextResponse('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  matcher: [
    // Lindungi semua halaman kecuali aset static PWA & service worker
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)',
  ],
};
