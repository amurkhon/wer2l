import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { CreateAuthorshipDto } from './dto/create-authorship.dto';
import { ReorderAuthorsDto } from './dto/reorder-authors.dto';
import { UpdateAuthorshipDto } from './dto/update-authorship.dto';
import { Authorship, AuthorshipDocument } from './schemas/authorship.schema';

@Injectable()
export class AuthorshipService {
  constructor(
    @InjectModel(Authorship.name) private readonly authorshipModel: Model<AuthorshipDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /** Adds an author to a work. Fails if the member is already an author. */
  async addAuthor(workId: string, dto: CreateAuthorshipDto): Promise<AuthorshipDocument> {
    const existing = await this.authorshipModel.findOne({
      workId: new Types.ObjectId(workId),
      memberId: new Types.ObjectId(dto.memberId),
    });
    if (existing) throw new ConflictException('This member is already an author of this work');

    return this.authorshipModel.create({
      workId: new Types.ObjectId(workId),
      memberId: new Types.ObjectId(dto.memberId),
      order: dto.order,
      role: dto.role,
      contribution: dto.contribution,
    });
  }

  /** Lists all authorships for a work, sorted by order. */
  async findByWork(workId: string): Promise<AuthorshipDocument[]> {
    return this.authorshipModel
      .find({ workId: new Types.ObjectId(workId) })
      .sort({ order: 1 })
      .populate('memberId', 'fullName profileImage role')
      .lean<AuthorshipDocument[]>();
  }

  /** Updates an authorship's role, order, or contribution statement. */
  async update(
    workId: string,
    authorshipId: string,
    dto: UpdateAuthorshipDto,
  ): Promise<AuthorshipDocument> {
    const authorship = await this.authorshipModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(authorshipId), workId: new Types.ObjectId(workId) },
        dto,
        { new: true, runValidators: true },
      )
      .lean<AuthorshipDocument>();
    if (!authorship) throw new NotFoundException(`Authorship ${authorshipId} not found on work ${workId}`);
    return authorship;
  }

  /** Removes an author from a work. */
  async remove(workId: string, authorshipId: string): Promise<void> {
    const result = await this.authorshipModel.findOneAndDelete({
      _id: new Types.ObjectId(authorshipId),
      workId: new Types.ObjectId(workId),
    });
    if (!result) throw new NotFoundException(`Authorship ${authorshipId} not found on work ${workId}`);
  }

  /**
   * Atomically reorders multiple authors in a single MongoDB transaction.
   * All order updates succeed or none do.
   */
  async reorder(workId: string, dto: ReorderAuthorsDto): Promise<void> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const wId = new Types.ObjectId(workId);
      await Promise.all(
        dto.items.map(({ authorshipId, order }) =>
          this.authorshipModel.findOneAndUpdate(
            { _id: new Types.ObjectId(authorshipId), workId: wId },
            { order },
            { session },
          ),
        ),
      );
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }
}
