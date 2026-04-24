import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LikeDocument = HydratedDocument<Like>;

@Schema({ collection: 'likes', timestamps: { createdAt: true, updatedAt: false } })
export class Like {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Work', index: true })
  workId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  anonymousId: string;
}

export const LikeSchema = SchemaFactory.createForClass(Like);

LikeSchema.index({ workId: 1, anonymousId: 1 }, { unique: true });
