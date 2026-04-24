import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuthorshipDocument = HydratedDocument<Authorship>;

@Schema({ collection: 'authorships', timestamps: false })
export class Authorship {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Work', index: true })
  workId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Member', index: true })
  memberId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  order: number;

  @Prop({
    required: true,
    enum: ['first', 'corresponding', 'co_author', 'advisor', 'contributor'],
  })
  role: 'first' | 'corresponding' | 'co_author' | 'advisor' | 'contributor';

  @Prop()
  contribution?: string;
}

export const AuthorshipSchema = SchemaFactory.createForClass(Authorship);

AuthorshipSchema.index({ workId: 1, memberId: 1 }, { unique: true });
