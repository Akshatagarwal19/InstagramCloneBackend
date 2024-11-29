import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your_jwt_secret_key');

interface ExtendedNextRequest extends NextRequest {
  user?: any;
}

export async function middleware(req: ExtendedNextRequest) {
  const origin = req.headers.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'];

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    if (allowedOrigins.includes(origin || '*')) {
      const response = new NextResponse(null, { status: 204 });
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return response;
    }
    return new NextResponse('CORS Error: Origin Not Allowed', { status: 403 });
  }

  // Add CORS headers to all other requests
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', origin || '');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const path = req.nextUrl.pathname;

  // Skip JWT check for login/register
  if (path === '/api/users/login' || path === '/api/users/register') {
    return response;
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new NextResponse('Unauthorized: No Token provided', { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    req.user = payload;
    return response;
  } catch (err) {
    console.error('Error: Unauthorized Invalid token', err);
    return new NextResponse('Unauthorized: Invalid token', { status: 401 });
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
