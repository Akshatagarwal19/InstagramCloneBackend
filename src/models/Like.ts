import mongoose, { Document, Schema } from "mongoose";

interface ILike extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    postId: mongoose.Schema.Types.ObjectId;
    createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        postId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    {
        timestamps: true,
    }
);

const Like = mongoose.models.Like || mongoose.model<ILike>('Like', LikeSchema);

export default Like;