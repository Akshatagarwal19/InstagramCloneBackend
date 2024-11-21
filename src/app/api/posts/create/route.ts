import { connectToDatabase } from '@/utils/dbConnect';
import Post from '@/models/Post';
import cloudinary from 'cloudinary';
import { NextResponse, NextRequest } from 'next/server';
import formidable from 'formidable';
import { Readable } from 'stream';
import { jwtVerify } from 'jose';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your_jwt_secret_key');

// Convert the Next.js request to a Node.js Readable stream
function convertRequestToStream(request: NextRequest): Readable {
  return Readable.from(request.body as any);
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

export async function POST(request: NextRequest) {
  try {
    // Decode JWT and extract userId
    const userId = await decodeJWT(request);

    // Connect to the database
    await connectToDatabase();

    // Initialize formidable form
    const form = formidable({ multiples: true });

    // Convert request to stream and add headers
    const nodeRequestStream = Object.assign(convertRequestToStream(request), {
      headers: {
        'content-type': request.headers.get('content-type') || '',
        'content-length': request.headers.get('content-length') || '',
      },
    });

    // Parse form data
    const formData = await new Promise((resolve, reject) => {
      form.parse(nodeRequestStream as any, (err, fields, files) => {
        if (err) {
          return reject('Error parsing the form');
        }
        resolve({ fields, files });
      });
    });

    const { fields, files } = formData as { fields: any; files: any };

    // Extract and validate fields
    const caption = Array.isArray(fields.caption) ? fields.caption[0] : fields.caption;
    const file = files.image && Array.isArray(files.image) ? files.image[0] : files.image;

    if (!caption || !file) {
      return NextResponse.json({ error: 'Caption and image are required' }, { status: 400 });
    }

    // Upload image to Cloudinary
    const uploadResponse = await cloudinary.v2.uploader.upload(file.filepath, {
      folder: 'instagram-clone',
      use_filename: true,
      unique_filename: false,
    });

    // Create a new post document with the uploaded image URL
    const newPost = new Post({
      userId,
      imageUrl: uploadResponse.secure_url,
      caption,
      likes: 0,
      comments: [],
    });

    // Save the post to the database
    await newPost.save();

    // Return success response
    return NextResponse.json({ message: 'Post created successfully', post: newPost }, { status: 201 });
  } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json({ error: 'Failed to upload image or create post' }, { status: 500 });
  }
}
