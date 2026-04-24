import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true, collection: 'categories' })
export class Category {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({
    required: true,
    enum: ['structural', 'geotechnical', 'transportation', 'hydraulic', 'materials', 'other'],
  })
  domain: 'structural' | 'geotechnical' | 'transportation' | 'hydraulic' | 'materials' | 'other';

  @Prop()
  description?: string;

  @Prop({ unique: true, index: true })
  slug: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
