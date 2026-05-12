import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AttachmentDocument = HydratedDocument<Attachment>;

@Schema({ timestamps: true, collection: 'attachments' })
export class Attachment {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Work', index: true })
  workId: Types.ObjectId;

  @Prop({ required: true, enum: ['pdf', 'image', 'dataset', 'video'] })
  kind: 'pdf' | 'image' | 'dataset' | 'video';

  @Prop({ required: true })
  fileUrl: string;

  @Prop()
  caption?: string;

  @Prop()
  sizeBytes?: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  uploadedBy?: Types.ObjectId;
}

export const AttachmentSchema = SchemaFactory.createForClass(Attachment);
