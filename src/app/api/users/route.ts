import { connectToDatabase } from '@/utils/dbConnect';
import User from '@/models/User';
import { NextResponse } from 'next/server';

async function dbConnect() {
  await connectToDatabase();
}

// GET all users
export async function GET() {
  await dbConnect();

  try {
    const users = await User.find().select('-password');
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
