import { Types } from 'mongoose';
import { IInvitationDocument, InvitationModel, RsvpStatus } from '../models/Invitation';
import { PaginationOptions } from '../utils/pagination';

export class InvitationRepository {
  async create(payload: {
    eventId: string;
    email: string;
    invitedBy: string;
    inviteeUserId?: string;
  }): Promise<IInvitationDocument> {
    const invitation = new InvitationModel({
      eventId: new Types.ObjectId(payload.eventId),
      email: payload.email.toLowerCase(),
      invitedBy: new Types.ObjectId(payload.invitedBy),
      inviteeUserId: payload.inviteeUserId ? new Types.ObjectId(payload.inviteeUserId) : undefined,
      status: 'invited',
    });
    return invitation.save();
  }

  async findById(id: string): Promise<IInvitationDocument | null> {
    return InvitationModel.findById(id);
  }

  async findByEventAndEmail(eventId: string, email: string): Promise<IInvitationDocument | null> {
    return InvitationModel.findOne({
      eventId: new Types.ObjectId(eventId),
      email: email.toLowerCase(),
    });
  }

  async findByEvent(
    eventId: string,
    pagination?: PaginationOptions,
  ): Promise<{ invitations: IInvitationDocument[]; total: number }> {
    const filter = { eventId: new Types.ObjectId(eventId) };

    if (!pagination) {
      const invitations = await InvitationModel.find(filter)
        .populate('inviteeUserId', 'displayName email')
        .sort({ createdAt: -1 });
      return { invitations, total: invitations.length };
    }

    const [invitations, total] = await Promise.all([
      InvitationModel.find(filter)
        .populate('inviteeUserId', 'displayName email')
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit),
      InvitationModel.countDocuments(filter),
    ]);

    return { invitations, total };
  }

  async findByUserId(
    userId: string,
    pagination: PaginationOptions,
  ): Promise<{ invitations: IInvitationDocument[]; total: number }> {
    const filter = { inviteeUserId: new Types.ObjectId(userId) };

    const [invitations, total] = await Promise.all([
      InvitationModel.find(filter)
        .populate('eventId', 'title startAt endAt location visibility')
        .populate('invitedBy', 'displayName email')
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit),
      InvitationModel.countDocuments(filter),
    ]);

    return { invitations, total };
  }

  async findEventIdsByUser(userId: string): Promise<string[]> {
    const invitations = await InvitationModel.find(
      { inviteeUserId: new Types.ObjectId(userId) },
      { eventId: 1 },
    ).lean();
    return invitations.map((inv) => inv.eventId.toString());
  }

  async updateStatus(
    id: string,
    status: RsvpStatus,
  ): Promise<IInvitationDocument | null> {
    return InvitationModel.findByIdAndUpdate(
      id,
      { $set: { status, respondedAt: new Date() } },
      { new: true, runValidators: true },
    );
  }

  async updateStatusByEventAndUser(
    eventId: string,
    userId: string,
    status: RsvpStatus,
  ): Promise<IInvitationDocument | null> {
    return InvitationModel.findOneAndUpdate(
      { eventId: new Types.ObjectId(eventId), inviteeUserId: new Types.ObjectId(userId) },
      { $set: { status, respondedAt: new Date() } },
      { new: true, runValidators: true },
    );
  }

  async deleteByEvent(eventId: string): Promise<void> {
    await InvitationModel.deleteMany({ eventId: new Types.ObjectId(eventId) });
  }
}
