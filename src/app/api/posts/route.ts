import { connectToDatabase } from '@/utils/dbConnect';
import Post from '@/models/Post';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

interface AuthenticateRequest extends NextRequest {
  user?: {
      userId: string;
  };
}

async function dbConnect() {
  await connectToDatabase();
}

export async function GET(request: AuthenticateRequest) {
  await dbConnect();

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10); // Default to page 1
  const limit = parseInt(url.searchParams.get('limit') || '10', 10); // Default to 10 posts per page

  const skip = (page - 1) * limit;

  try {
    // Fetch posts with pagination
    const posts = await Post.find({})
      .sort({ createdAt: -1 }) // Sort by most recent first
      .skip(skip)
      .limit(limit)
      .exec();

    // Get the total count of posts for pagination
    const totalPosts = await Post.countDocuments();

    return NextResponse.json({
      posts,
      page,
      limit,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
