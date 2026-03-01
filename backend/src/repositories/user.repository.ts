import { FilterQuery, UpdateQuery } from 'mongoose';
import { IUserDocument, UserModel } from '../models/User';
import { AppError } from '../utils/AppError';

interface UpsertPayload {
  firebaseUid: string;
  email: string;
  displayName: string;
}

export class UserRepository {
  /**
   * Upsert a user by firebaseUid.  Called on every authenticated request so the
   * user record is created on first login and kept in sync thereafter.
   */
  async upsertByFirebaseUid(payload: UpsertPayload): Promise<IUserDocument> {
    const { firebaseUid, email, displayName } = payload;

    const user = await UserModel.findOneAndUpdate(
      { firebaseUid },
      {
        $set: { email, displayName, lastLoginAt: new Date() },
        $setOnInsert: { firebaseUid, role: 'member', isActive: true },
      },
      { upsert: true, new: true, runValidators: true },
    );

    if (!user) throw AppError.internal('Failed to upsert user');

    // If the user was inserted without a userId link in invitations,
    // link any pending invitations for this email (fire-and-forget).
    void this.linkPendingInvitations(user._id as unknown as string, email);

    return user;
  }

  /**
   * Link any existing invitations (by email) to the newly logged-in user.
   * This is the mechanism that allows "invite by email" to work even before
   * the invitee has an account.
   */
  private async linkPendingInvitations(userId: string, email: string): Promise<void> {
    try {
      const { InvitationModel } = await import('../models/Invitation');
      await InvitationModel.updateMany(
        { email: email.toLowerCase(), inviteeUserId: { $exists: false } },
        { $set: { inviteeUserId: userId } },
      );
    } catch {
      // Non-critical background task – log but don't propagate
    }
  }

  async findById(id: string): Promise<IUserDocument | null> {
    return UserModel.findById(id);
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ email: email.toLowerCase() });
  }

  async findByFirebaseUid(firebaseUid: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ firebaseUid });
  }

  async update(id: string, update: UpdateQuery<IUserDocument>): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  }

  async find(filter: FilterQuery<IUserDocument>): Promise<IUserDocument[]> {
    return UserModel.find(filter);
  }
}
