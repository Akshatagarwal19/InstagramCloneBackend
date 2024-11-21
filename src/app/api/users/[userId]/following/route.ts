import { connectToDatabase } from '@/utils/dbConnect';
import User from '@/models/User';
import Follow from '@/models/Follow';
import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your_jwt_secret_key');

async function decodeJWT(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: No Token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as string;  // Assuming the payload has userId property
  } catch (err) {
    console.error('Error: Unauthorized Invalid token', err);
    throw new Error('Unauthorized: Invalid token');
  }
}

async function dbConnect() {
  await connectToDatabase();
}

// GET: Get users that a specific user is following
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  await dbConnect();

  try {
    const userId = await decodeJWT(request);
    console.log('User ID:', userId);

    mongoose.model('User', User.schema);

    // Query the Follow collection
    const following = await Follow.find({ followerId: userId }).populate({
      path: 'followingId',
      model: 'User',
      select: 'name email',
    });

    // Check the result of the query
    console.log('Following list:', following);

    // If no data is found
    if (!following || following.length === 0) {
      console.log('No following users found');
      return NextResponse.json({ message: 'No following users found' }, { status: 404 });
    }

    return NextResponse.json(following, { status: 200 });
  } catch (error) {
    console.error('Error fetching following list:', error);
    return NextResponse.json({ error: 'Failed to fetch following list' }, { status: 500 });
  }
}
