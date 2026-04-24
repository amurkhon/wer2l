import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WorkDocument = HydratedDocument<Work>;

@Schema({ timestamps: true, collection: 'works' })
export class Work {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, enum: ['paper', 'project', 'patent', 'thesis'] })
  type: 'paper' | 'project' | 'patent' | 'thesis';

  @Prop({ required: true, type: Types.ObjectId, ref: 'Category', index: true })
  categoryId: Types.ObjectId;

  @Prop()
  description?: string;

  @Prop()
  coverImage?: string;

  @Prop({
    enum: ['in_progress', 'published', 'archived'],
    default: 'in_progress',
    index: true,
  })
  status: 'in_progress' | 'published' | 'archived';

  @Prop({ index: -1 })
  completionDate?: Date;

  @Prop({ default: false, index: true })
  featured: boolean;

  @Prop({ default: 0 })
  likeCount: number;
}

export const WorkSchema = SchemaFactory.createForClass(Work);

WorkSchema.index({ title: 'text', description: 'text' });
