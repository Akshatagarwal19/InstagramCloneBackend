import { connectToDatabase } from '@/utils/dbConnect';
import Post from '@/models/Post';
import cloudinary from 'cloudinary';
import { NextResponse, NextRequest } from 'next/server';
import formidable from 'formidable';
import { Readable } from 'stream';
import mongoose from 'mongoose';
import { jwtVerify } from 'jose';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your_jwt_secret_key');

async function parseRequest(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await request.json();
    return { fields: body, files: {} };
  }

  const form = formidable({ multiples: true });

  const formData = await new Promise((resolve, reject) => {
    form.parse(request.body as any, (err, fields, files) => {
      if (err) {
        return reject('Error parsing the form');
      }
      resolve({ fields, files });
    });
  });

  return formData as { fields: any; files: any };
}

async function dbConnect() {
  await connectToDatabase();
}

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

export async function GET(request: NextRequest, { params }: { params: { postId: string } }) {
  await dbConnect();

  const { postId } = params;
  console.log(postId);

  try {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }
    
    const post = await Post.findById(postId).exec();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post }, { status: 200 });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

// PATCH: Update a post
export async function PATCH(request: NextRequest, { params }: { params: { postId: string } }) {
  await dbConnect();
  const { postId } = params;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
  }

  try {
    const userId = await decodeJWT(request);
    const { fields, files } = await parseRequest(request);

    const caption = Array.isArray(fields.caption) ? fields.caption[0] : fields.caption;
    const file = files.image && Array.isArray(files.image) ? files.image[0] : files.image;

    if (!caption && !file) {
      return NextResponse.json({ error: 'At least one field (caption or image) must be provided' }, { status: 400 });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (caption) {
      post.caption = caption.trim();
    }

    if (file) {
      const uploadResponse = await cloudinary.v2.uploader.upload(file.filepath, {
        folder: 'instagram-clone',
        use_filename: true,
        unique_filename: false,
      });

      post.imageUrl = uploadResponse.secure_url;
    }

    await post.save();

    return NextResponse.json({ message: 'Post updated successfully', post }, { status: 200 });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { postId: string } }) {
  await dbConnect();
  const { postId } = params;
  console.log(postId);
  
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
  }

  try {
    const userId = await decodeJWT(request);
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const publicId = post.imageUrl.split('/').pop()?.split('.')[0];
    if (publicId) {
      await cloudinary.v2.uploader.destroy(`instagram-clone/${publicId}`);
    }

    await Post.findByIdAndDelete(postId);
    return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete Post' }, { status: 500 });
  }
}
