import mongoose, { Document, Schema } from "mongoose";

interface IFollow extends Document {
    followerId: mongoose.Schema.Types.ObjectId;
    followingId: mongoose.Schema.Types.ObjectId;
    createdAt: Date;
}

const FolloweSchema = new Schema<IFollow>(
    {
        followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    {
        timestamps: true,
    }
);

const Follow = mongoose.models.Follow || mongoose.model<IFollow>('Follow', FolloweSchema);
export default Follow;