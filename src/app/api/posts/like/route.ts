import { connectToDatabase } from '@/utils/dbConnect';
import Post from '@/models/Post';
import Like from '@/models/Like';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  await connectToDatabase();

  try {
    const { postId, userId } = await request.json();

    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid postId or userId' }, { status: 400 });
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
