import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type HighlightDocument = HydratedDocument<Highlight>;

@Schema({ timestamps: true, collection: 'highlights' })
export class Highlight {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true })
  summary: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  coverImage?: string;

  @Prop({ required: true, enum: ['news', 'award', 'publication', 'event'], index: true })
  type: 'news' | 'award' | 'publication' | 'event';

  @Prop({ enum: ['draft', 'published'], default: 'draft', index: true })
  status: 'draft' | 'published';

  @Prop({ default: false, index: true })
  featured: boolean;

  @Prop({ index: -1 })
  publishedAt?: Date;
}

export const HighlightSchema = SchemaFactory.createForClass(Highlight);

HighlightSchema.index({ title: 'text', summary: 'text', content: 'text' });
