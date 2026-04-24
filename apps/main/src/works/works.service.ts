import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Attachment, AttachmentDocument } from '../uploads/schemas/attachment.schema';
import { Authorship, AuthorshipDocument } from '../authorship/schemas/authorship.schema';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { Work, WorkDocument } from './schemas/work.schema';

export interface WorkListQuery {
  category?: string;
  type?: string;
  status?: string;
  featured?: string;
  search?: string;
  authorId?: string;
}

export interface PopulatedWork extends Record<string, unknown> {
  authors: AuthorshipDocument[];
  attachments: AttachmentDocument[];
}

@Injectable()
export class WorksService {
  constructor(
    @InjectModel(Work.name) private readonly workModel: Model<WorkDocument>,
    @InjectModel(Authorship.name) private readonly authorshipModel: Model<AuthorshipDocument>,
    @InjectModel(Attachment.name) private readonly attachmentModel: Model<AttachmentDocument>,
  ) {}

  /** Creates a new work entry. */
  async create(dto: CreateWorkDto): Promise<WorkDocument> {
    return this.workModel.create({
      ...dto,
      categoryId: new Types.ObjectId(dto.categoryId),
    });
  }

  /**
   * Lists works with optional filters and populates authors (via Authorship) sorted by order.
   * When authorId is provided, only works authored by that member are returned.
   */
  async findAll(query: WorkListQuery): Promise<PopulatedWork[]> {
    const filter: FilterQuery<Work> = { status: { $ne: 'archived' } };

    if (query.category) filter.categoryId = new Types.ObjectId(query.category);
    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.featured !== undefined) filter.featured = query.featured === 'true';
    if (query.search) filter.$text = { $search: query.search };

    let workIds: Types.ObjectId[] | undefined;
    if (query.authorId) {
      const authorships = await this.authorshipModel
        .find({ memberId: new Types.ObjectId(query.authorId) })
        .lean<AuthorshipDocument[]>();
      workIds = authorships.map((a) => a.workId as Types.ObjectId);
    }

    if (workIds !== undefined) filter._id = { $in: workIds };

    const works = await this.workModel
      .find(filter)
      .populate('categoryId')
      .sort({ createdAt: -1 })
      .lean<WorkDocument[]>();

    return Promise.all(works.map((work) => this.populateWork(work)));
  }

  /** Returns a single work fully populated: authors, category, and attachments. */
  async findOne(id: string): Promise<PopulatedWork> {
    const work = await this.workModel
      .findById(id)
      .populate('categoryId')
      .lean<WorkDocument>();
    if (!work) throw new NotFoundException(`Work ${id} not found`);

    return this.populateWork(work);
  }

  /** Updates a work. Editor+ access only. */
  async update(id: string, dto: UpdateWorkDto): Promise<WorkDocument> {
    const update: Record<string, unknown> = { ...dto };
    if (dto.categoryId) update['categoryId'] = new Types.ObjectId(dto.categoryId);

    const work = await this.workModel
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .lean<WorkDocument>();
    if (!work) throw new NotFoundException(`Work ${id} not found`);
    return work;
  }

  /**
   * Soft-deletes a work by setting status='archived'.
   * Preserves authorship and attachment records.
   */
  async remove(id: string): Promise<WorkDocument> {
    const work = await this.workModel
      .findByIdAndUpdate(id, { status: 'archived' }, { new: true })
      .lean<WorkDocument>();
    if (!work) throw new NotFoundException(`Work ${id} not found`);
    return work;
  }

  /** Attaches authors (Authorship docs) and attachments to a work object. */
  private async populateWork(work: WorkDocument): Promise<PopulatedWork> {
    const [authors, attachments] = await Promise.all([
      this.authorshipModel
        .find({ workId: work._id })
        .sort({ order: 1 })
        .populate('memberId', 'fullName profileImage role')
        .lean<AuthorshipDocument[]>(),
      this.attachmentModel.find({ workId: work._id }).lean<AttachmentDocument[]>(),
    ]);

    return { ...(work as unknown as Record<string, unknown>), authors, attachments };
  }
}
