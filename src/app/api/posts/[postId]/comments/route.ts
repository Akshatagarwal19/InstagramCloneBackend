import { connectToDatabase } from '@/utils/dbConnect';
import Comment from '@/models/Comment';
import User from '@/models/User';  
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import type { NextRequest } from 'next/server';  

async function dbConnect() {
  await connectToDatabase();
}

export async function GET(request: NextRequest, { params }: { params: { postId: string } }) {
  await dbConnect();

  const { postId } = params;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
  }

  try {
    const comments = await Comment.find({ postId: postId })
      .populate('userId', 'username') 
      .sort({ createdAt: -1 }); 
    if (comments.length === 0) {
      return NextResponse.json({ message: 'No comments found for this post' }, { status: 404 });
    }

    return NextResponse.json({ comments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}
