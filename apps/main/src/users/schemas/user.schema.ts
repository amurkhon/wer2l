import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  collection: 'users',
  toJSON: {
    transform(_doc, ret: Record<string, unknown>) {
      delete ret['passwordHash'];
      delete ret['__v'];
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  /** Never returned in API responses — select: false ensures queries exclude it by default. */
  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ type: Types.ObjectId, ref: 'Member', default: null })
  memberId: Types.ObjectId | null;

  @Prop({ required: true, enum: ['admin', 'editor'] })
  accessLevel: 'admin' | 'editor';

  @Prop()
  lastLogin?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
