import mongoose, { Document, Schema, Model } from 'mongoose';

export type UserRole = 'member' | 'admin';

export interface IUser {
  firebaseUid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {}

const UserSchema = new Schema<IUserDocument>(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['member', 'admin'] satisfies UserRole[],
      default: 'member',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (ret as Record<string, unknown>)['__v'];
        return ret;
      },
    },
  },
);

// Compound index for filtering active users by role
UserSchema.index({ role: 1, isActive: 1 });

export const UserModel: Model<IUserDocument> = mongoose.model<IUserDocument>('User', UserSchema);
