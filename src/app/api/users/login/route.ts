import { connectToDatabase } from "@/utils/dbConnect";
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
    await connectToDatabase();
    const { email, password } = await request.json();
    
    const user = await User.findOne({ email });
    if (!user) {
        return Response.json({ error: 'Invalid email or password'}, { status: 401});
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return Response.json({ error: 'Invalid email or password'}, { status: 401});
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, {
        expiresIn: '7d',
    });

    return Response.json({message: 'Login Successfull',token,});
}