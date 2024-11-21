import { connectToDatabase } from '@/utils/dbConnect';
import User from '@/models/User';
import Follow from '@/models/Follow';
import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your_jwt_secret_key');

// Middleware to decode JWT and extract userId
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

// POST: Follow a user
export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  const { userId } = params;
  await dbConnect();

  try {
    const followerId = await decodeJWT(request);

    // Check if the follow relationship already exists
    const existingFollow = await Follow.findOne({ followerId, followingId: userId });
    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 });
    }

    // Create new follow relationship
    const follow = await Follow.create({ followerId, followingId: userId });
    console.log('Follow document created:', follow);

    return NextResponse.json({ message: 'Followed successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error following user:', error);
    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
  }
}

// DELETE: Unfollow a user
export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  const { userId } = params;
  await dbConnect();

  try {
    const followerId = await decodeJWT(request);

    // Delete the follow relationship
    const follow = await Follow.findOneAndDelete({ followerId, followingId: userId });
    if (!follow) {
      return NextResponse.json({ error: 'Follow relationship not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Unfollowed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
  }
}

// GET: Get followers of a user
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  const { userId } = params;
  await dbConnect();

  try {
    mongoose.model('User', User.schema);

    const followers = await Follow.find({ followingId: userId }).populate({
      path: 'followerId',
      model: 'User',
      select: 'name email',
    });

    return NextResponse.json(followers, { status: 200 });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return NextResponse.json({ error: 'Failed to fetch followers' }, { status: 500 });
  }
}
