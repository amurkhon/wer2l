import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MemberDocument = HydratedDocument<Member>;

class SocialLinks {
  @Prop() email?: string;
  @Prop() linkedin?: string;
  @Prop() googleScholar?: string;
  @Prop() orcid?: string;
  @Prop() personalSite?: string;
}

@Schema({ timestamps: true, collection: 'members' })
export class Member {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, enum: ['professor', 'researcher', 'student', 'alumni'], index: true })
  role: 'professor' | 'researcher' | 'student' | 'alumni';

  @Prop({ enum: ['active', 'alumni', 'emeritus'], default: 'active', index: true })
  status: 'active' | 'alumni' | 'emeritus';

  @Prop()
  biography?: string;

  @Prop()
  profileImage?: string;

  @Prop({ type: SocialLinks, default: {} })
  socialLinks: SocialLinks;

  @Prop({ required: true })
  joinedDate: Date;

  @Prop()
  leftDate?: Date;
}

export const MemberSchema = SchemaFactory.createForClass(Member);

MemberSchema.index({ fullName: 'text', biography: 'text' });
