export default function middleware(req) {
  const authHeader = req.headers.get('authorization');

  if (authHeader) {
    const [type, credentials] = authHeader.split(' ');
    if (type.toLowerCase() === 'basic') {
      try {
        const decoded = atob(credentials);
        const [username, password] = decoded.split(':');
        
        // Ganti username & password server sesuai keinginan Anda
        if (username === 'admin' && password === 'cakelrahasia') {
          // Lanjutkan ke halaman web asli (Header khusus Vercel untuk meneruskan request)
          return new Response(null, {
            headers: {
              'x-middleware-next': '1'
            }
          });
        }
      } catch (e) {}
    }
  }

  // Hadang dengan prompt login Basic Auth jika kredensial salah atau tidak ada
  return new Response('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  matcher: [
    // Jalankan middleware untuk seluruh halaman kecuali static assets utama
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)',
  ],
};
