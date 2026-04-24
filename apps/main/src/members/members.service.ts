import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Member, MemberDocument } from './schemas/member.schema';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Authorship, AuthorshipDocument } from '../authorship/schemas/authorship.schema';
import { Work, WorkDocument } from '../works/schemas/work.schema';

export interface MemberListQuery {
  role?: string;
  status?: string;
  search?: string;
}

@Injectable()
export class MembersService {
  constructor(
    @InjectModel(Member.name) private readonly memberModel: Model<MemberDocument>,
    @InjectModel(Authorship.name) private readonly authorshipModel: Model<AuthorshipDocument>,
    @InjectModel(Work.name) private readonly workModel: Model<WorkDocument>,
  ) {}

  /** Creates a new lab member profile. */
  async create(dto: CreateMemberDto): Promise<MemberDocument> {
    return this.memberModel.create(dto);
  }

  /** Lists members with optional filters and full-text search. */
  async findAll(query: MemberListQuery): Promise<MemberDocument[]> {
    const filter: FilterQuery<Member> = {};

    if (query.role) filter.role = query.role;
    if (query.status) filter.status = query.status;
    if (query.search) filter.$text = { $search: query.search };

    return this.memberModel.find(filter).sort({ createdAt: -1 }).lean<MemberDocument[]>();
  }

  /**
   * Returns a single member with their authored works populated,
   * sorted by authorship order.
   */
  async findOne(id: string): Promise<Record<string, unknown>> {
    const member = await this.memberModel.findById(id).lean<MemberDocument>();
    if (!member) throw new NotFoundException(`Member ${id} not found`);

    const authorships = await this.authorshipModel
      .find({ memberId: member._id })
      .sort({ order: 1 })
      .populate({ path: 'workId', model: this.workModel.modelName })
      .lean<AuthorshipDocument[]>();

    const works = authorships.map((a) => ({
      ...a,
      work: a.workId,
    }));

    return { ...member, works };
  }

  /** Updates a member profile. Admin or the member themselves (self-update enforced in controller). */
  async update(id: string, dto: UpdateMemberDto): Promise<MemberDocument> {
    const member = await this.memberModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .lean<MemberDocument>();
    if (!member) throw new NotFoundException(`Member ${id} not found`);
    return member;
  }

  /**
   * Soft-deletes a member by setting status='alumni'.
   * Hard deletion is never performed to preserve authorship history.
   */
  async remove(id: string): Promise<MemberDocument> {
    const member = await this.memberModel
      .findByIdAndUpdate(id, { status: 'alumni', leftDate: new Date() }, { new: true })
      .lean<MemberDocument>();
    if (!member) throw new NotFoundException(`Member ${id} not found`);
    return member;
  }
}
