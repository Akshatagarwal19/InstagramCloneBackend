import { connectToDatabase } from '@/utils/dbConnect';
import User from '@/models/User';
import { NextResponse } from 'next/server';

async function dbConnect() {
  await connectToDatabase();
}

export async function GET(request: Request, context: { params: { userId: string } }) {
  const { userId } = await context.params;
  await dbConnect();

  try {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}


// PATCH (Update) user by ID
export async function PATCH(request: Request, context: { params: { userId: string } }) {
  const { userId } = await context.params;
  await dbConnect();

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const updates = await request.json();
    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}


// DELETE user by ID
export async function DELETE(request: Request, context: { params: { userId: string } }) {
  const { userId } = await context.params;
  await dbConnect();

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

