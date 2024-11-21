import { NextRequest, NextResponse } from 'next/server';
import Cors from 'cors';
import { runMiddleware } from "@/utils/cors";
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your_jwt_secret_key');

interface ExtendedNextRequest extends NextRequest {
    user?: any;
}

const cors = Cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*", // Allowed origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

// Middleware to protect API routes
export async function middleware(req: ExtendedNextRequest) {
    const path = req.nextUrl.pathname;

    // Allow unauthenticated access to login and register endpoints
    if (path === '/api/users/login' || path === '/api/users/register') {
        return NextResponse.next();
    }

    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized: No Token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET); req.user = payload;
        return NextResponse.next();
    } catch (err) {
        console.error('Error: Unauthorized Invalid token', err);
        return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
}

// Middleware configuration
export const config = {
    matcher: ['/api/:path*'], // Protect all /api routes
};
