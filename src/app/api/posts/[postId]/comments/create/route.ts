import { connectToDatabase } from '@/utils/dbConnect';
import Comment from '@/models/Comment';
import Post from '@/models/Post';
import { NextRequest,NextResponse } from 'next/server';
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

// POST: Add a comment to a post
export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  await dbConnect();

  const { postId } = params;

  try {
    // Parse the request body
    const userId = await decodeJWT(request);
    const { text } = await request.json();

    // Validate required fields
    if (!userId || !text) {
      return NextResponse.json({ error: 'UserId and text are required' }, { status: 400 });
    }

    // Validate postId using mongoose.Types.ObjectId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Create a new comment
    const newComment = new Comment({
      postId,
      userId,
      text,
    });

    // Save the comment
    await newComment.save();

    // Optionally, you could add the comment to the post's `comments` field if you want a reference in the post itself
    post.comments.push(newComment._id);
    await post.save();

    return NextResponse.json({ message: 'Comment added successfully', comment: newComment }, { status: 201 });

  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
