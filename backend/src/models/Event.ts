import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type EventVisibility = 'private' | 'shared';

export interface IEvent {
  title: string;
  description?: string;
  location?: string;
  startAt: Date;
  endAt: Date;
  createdBy: Types.ObjectId;
  visibility: EventVisibility;
  // Soft-delete fields
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IEventDocument extends IEvent, Document {}

const EventSchema = new Schema<IEventDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    startAt: {
      type: Date,
      required: true,
      index: true,
    },
    endAt: {
      type: Date,
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    visibility: {
      type: String,
      enum: ['private', 'shared'] satisfies EventVisibility[],
      default: 'private',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
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

/**
 * Text index for full-text search across title, description, and location.
 * This supports both keyword search and phrase search.
 */
EventSchema.index(
  { title: 'text', description: 'text', location: 'text' },
  { weights: { title: 10, location: 5, description: 1 } },
);

// Compound index for date-range overlap queries
EventSchema.index({ startAt: 1, endAt: 1 });

// Compound index: owner + soft-delete for the most common query pattern
EventSchema.index({ createdBy: 1, isDeleted: 1 });

// Virtual: computed lifecycle status (no DB persistence needed)
EventSchema.virtual('lifecycle').get(function (this: IEventDocument) {
  const now = new Date();
  if (now < this.startAt) return 'upcoming';
  if (now > this.endAt) return 'past';
  return 'ongoing';
});

export const EventModel: Model<IEventDocument> = mongoose.model<IEventDocument>('Event', EventSchema);
