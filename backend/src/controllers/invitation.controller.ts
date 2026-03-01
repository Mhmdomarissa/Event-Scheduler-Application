import { Request, Response } from 'express';
import { InvitationService } from '../services/invitation.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { AppError } from '../utils/AppError';
import { RsvpStatus } from '../models/Invitation';

const invitationService = new InvitationService();

export class InvitationController {
  /**
   * POST /api/events/:id/invite
   */
  async inviteToEvent(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();

    const { emails } = req.body as { emails: string[] };

    const results = await invitationService.inviteToEvent(
      req.params['id'] as string,
      emails,
      req.user.id,
      req.user.role,
    );

    sendCreated(res, results, 'Invitations processed');
  }

  /**
   * GET /api/events/:id/attendees
   */
  async getAttendees(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();

    const { invitations, meta } = await invitationService.getAttendees(
      req.params['id'] as string,
      req.user.id,
      req.query,
    );

    sendSuccess(res, invitations, 'Attendees retrieved', 200, meta);
  }

  /**
   * GET /api/invitations
   */
  async getMyInvitations(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();

    const { invitations, meta } = await invitationService.getMyInvitations(
      req.user.id,
      req.query,
    );

    sendSuccess(res, invitations, 'Invitations retrieved', 200, meta);
  }

  /**
   * POST /api/invitations/:id/respond
   */
  async respondToInvitation(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();

    const { status } = req.body as { status: RsvpStatus };

    const updated = await invitationService.respondToInvitation(
      req.params['id'] as string,
      status,
      req.user.id,
    );

    sendSuccess(res, updated, 'RSVP updated successfully');
  }
}
