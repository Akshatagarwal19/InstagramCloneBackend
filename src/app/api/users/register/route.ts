import { connectToDatabase } from "@/utils/dbConnect";
import User from "@/models/User";
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    await connectToDatabase();
    const { name, email, password } = await request.json();
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return Response.json({ error: 'User Already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userWithoutPassword = new User({ name, email, password: hashedPassword });
    await userWithoutPassword.save();

    // const { _id, name: userName, email: userEmail } = userWithoutPassword;

    return Response.json(userWithoutPassword, {status: 201});
}
