import mongoose, { Document, Schema } from "mongoose";

interface IPost extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    imageUrl: string;
    caption: string;
    likes: number;
    comments: mongoose.Schema.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        imageUrl: { type: String, required: true },
        caption: { type: String, required: true },
        likes: { type: Number, required: true },
        comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    },
    {
        timestamps: true,
    }
);

const Post = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
export default Post;