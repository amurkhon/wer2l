import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Work, WorkDocument } from '../works/schemas/work.schema';
import { Like, LikeDocument } from './schemas/like.schema';

@Injectable()
export class LikesService {
  constructor(
    @InjectModel(Like.name) private readonly likeModel: Model<LikeDocument>,
    @InjectModel(Work.name) private readonly workModel: Model<WorkDocument>,
  ) {}

  /**
   * Idempotent like operation.
   * If the (workId, anonymousId) pair already exists, returns the existing record without error.
   * On a new like, atomically increments Work.likeCount.
   */
  async like(workId: string, anonymousId: string): Promise<LikeDocument> {
    const wId = new Types.ObjectId(workId);

    const existing = await this.likeModel.findOne({ workId: wId, anonymousId }).lean<LikeDocument>();
    if (existing) return existing;

    const work = await this.workModel.exists({ _id: wId });
    if (!work) throw new NotFoundException(`Work ${workId} not found`);

    const like = await this.likeModel.create({ workId: wId, anonymousId });
    await this.workModel.findByIdAndUpdate(wId, { $inc: { likeCount: 1 } });

    return like;
  }

  /**
   * Removes a like and atomically decrements Work.likeCount.
   * Silently succeeds if the like doesn't exist (idempotent).
   */
  async unlike(workId: string, anonymousId: string): Promise<void> {
    const wId = new Types.ObjectId(workId);
    const deleted = await this.likeModel.findOneAndDelete({ workId: wId, anonymousId });

    if (deleted) {
      await this.workModel.findByIdAndUpdate(wId, {
        $inc: { likeCount: -1 },
        $max: { likeCount: 0 }, // guard against going negative
      });
    }
  }

  /** Returns the like count for a work from the denormalized Work.likeCount field. */
  async getCount(workId: string): Promise<{ workId: string; likeCount: number }> {
    const work = await this.workModel.findById(workId).select('likeCount').lean<WorkDocument>();
    if (!work) throw new NotFoundException(`Work ${workId} not found`);
    return { workId, likeCount: work.likeCount };
  }
}
