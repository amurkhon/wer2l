import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Work } from '../works/schemas/work.schema';
import { Like } from './schemas/like.schema';
import { LikesService } from './likes.service';

const workId = new Types.ObjectId().toString();
const anonId = '550e8400-e29b-41d4-a716-446655440000';

const mockLike = {
  _id: new Types.ObjectId(),
  workId: new Types.ObjectId(workId),
  anonymousId: anonId,
};

const mockWork = {
  _id: new Types.ObjectId(workId),
  likeCount: 5,
};

describe('LikesService', () => {
  let service: LikesService;
  let likeModelMock: {
    findOne: jest.Mock;
    create: jest.Mock;
    findOneAndDelete: jest.Mock;
  };
  let workModelMock: {
    exists: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
  };

  beforeEach(async () => {
    likeModelMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      findOneAndDelete: jest.fn(),
    };
    workModelMock = {
      exists: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikesService,
        { provide: getModelToken(Like.name), useValue: likeModelMock },
        { provide: getModelToken(Work.name), useValue: workModelMock },
      ],
    }).compile();

    service = module.get<LikesService>(LikesService);
  });

  describe('like', () => {
    it('creates a new like and increments likeCount on first like', async () => {
      likeModelMock.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      workModelMock.exists.mockResolvedValue({ _id: new Types.ObjectId(workId) });
      likeModelMock.create.mockResolvedValue(mockLike);

      const result = await service.like(workId, anonId);

      expect(result).toMatchObject({ anonymousId: anonId });
      expect(likeModelMock.create).toHaveBeenCalledTimes(1);
      expect(workModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        expect.any(Types.ObjectId),
        { $inc: { likeCount: 1 } },
      );
    });

    it('returns existing like without creating a duplicate (idempotency)', async () => {
      likeModelMock.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockLike) });

      const result = await service.like(workId, anonId);

      expect(result).toEqual(mockLike);
      expect(likeModelMock.create).not.toHaveBeenCalled();
      expect(workModelMock.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when work does not exist', async () => {
      likeModelMock.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      workModelMock.exists.mockResolvedValue(null);

      await expect(service.like(workId, anonId)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('unlike', () => {
    it('deletes the like and decrements likeCount', async () => {
      likeModelMock.findOneAndDelete.mockResolvedValue(mockLike);

      await service.unlike(workId, anonId);

      expect(likeModelMock.findOneAndDelete).toHaveBeenCalledTimes(1);
      expect(workModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        expect.any(Types.ObjectId),
        { $inc: { likeCount: -1 }, $max: { likeCount: 0 } },
      );
    });

    it('silently succeeds if the like does not exist (idempotent unlike)', async () => {
      likeModelMock.findOneAndDelete.mockResolvedValue(null);

      await service.unlike(workId, anonId);

      expect(workModelMock.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('getCount', () => {
    it('returns likeCount from the Work document', async () => {
      workModelMock.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockWork),
      });

      const result = await service.getCount(workId);

      expect(result).toEqual({ workId, likeCount: 5 });
    });

    it('throws NotFoundException for an unknown workId', async () => {
      workModelMock.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getCount(new Types.ObjectId().toString())).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
