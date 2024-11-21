import mongoose, { Document, Schema } from "mongoose";

interface IComment extends Document {
    postId: mongoose.Schema.Types.ObjectId;
    userId: mongoose.Schema.Types.ObjectId;
    text: string;
    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
    {
        postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;