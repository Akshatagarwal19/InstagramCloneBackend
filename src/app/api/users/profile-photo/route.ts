import { connectToDatabase } from '@/utils/dbConnect';
import User from '@/models/User';
import cloudinary from '@/utils/cloudinary';
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

export async function POST(request: NextRequest) {
  await connectToDatabase();

  const formData = await request.formData();
  const imageFile = formData.get('image');

  if (!imageFile || !(imageFile instanceof Blob)) {
    return NextResponse.json({ error: 'Image are required' }, { status: 400 });
  }

  try {
    const userId = await decodeJWT(request);
    // Convert the image Blob to a base64 string
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageFile.type;
    const base64Data = `data:${mimeType};base64,${base64Image}`;

    // Upload image to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(base64Data, {
      folder: 'instagram-clone/profile-photos',
    });

    // Update user's profile photo
    const user = await User.findByIdAndUpdate(
      userId,
      { image: uploadResponse.secure_url },
      { new: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    return NextResponse.json({ error: 'Failed to upload profile photo' }, { status: 500 });
  }
}
