import { connectToDatabase } from '@/utils/dbConnect';
import Post from '@/models/Post';
import Like from '@/models/Like';
import mongoose from 'mongoose';
import { NextResponse, NextRequest } from 'next/server';
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

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  await connectToDatabase();

  try {
    const userId = await decodeJWT(request);
    const { postId } = params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: 'Invalid postId' }, { status: 400 });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const existingLike = await Like.findOne({ postId, userId });

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      post.likes = Math.max(post.likes - 1, 0); // Ensure likes count doesn't go below zero
      await post.save();

      return NextResponse.json({ message: 'Post unliked successfully', likes: post.likes }, { status: 200 });
    }

    // Like the post
    await Like.create({ postId, userId });
    post.likes += 1;
    await post.save();

    return NextResponse.json({ message: 'Post liked successfully', likes: post.likes }, { status: 201 });
  } catch (error) {
    console.error('Error liking/unliking post:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request' }, { status: 500 });
  }
}
