import { FilterQuery, UpdateQuery } from 'mongoose';
import { IUserDocument, UserModel } from '../models/User';
import { InvitationModel } from '../models/Invitation';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

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

    // Await invitation linking so that on first login the user immediately
    // sees events they were invited to by email before registering.
    await this.linkPendingInvitations((user._id as { toString(): string }).toString(), email);

    return user;
  }

  /**
   * Link any existing invitations (by email) to the newly logged-in user.
   * This is the mechanism that allows "invite by email" to work even before
   * the invitee has an account.
   */
  private async linkPendingInvitations(userId: string, email: string): Promise<void> {
    try {
      const result = await InvitationModel.updateMany(
        { email: email.toLowerCase(), inviteeUserId: { $exists: false } },
        { $set: { inviteeUserId: userId } },
      );
      if (result.modifiedCount > 0) {
        logger.info('Linked pending invitations on login', { userId, count: result.modifiedCount });
      }
    } catch (err) {
      // Non-fatal: user login must not fail because of invitation linking errors.
      logger.error('Failed to link pending invitations', { userId, error: (err as Error).message });
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
