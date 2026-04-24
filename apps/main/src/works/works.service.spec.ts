import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Attachment } from '../uploads/schemas/attachment.schema';
import { Authorship } from '../authorship/schemas/authorship.schema';
import { Work } from './schemas/work.schema';
import { WorksService } from './works.service';

const workId = new Types.ObjectId().toString();
const memberId = new Types.ObjectId().toString();

const mockWork = {
  _id: new Types.ObjectId(workId),
  title: 'Seismic Analysis',
  type: 'paper',
  status: 'published',
  likeCount: 3,
  featured: false,
};

const mockAuthorship = {
  _id: new Types.ObjectId(),
  workId: new Types.ObjectId(workId),
  memberId: { _id: new Types.ObjectId(memberId), fullName: 'Dr. Smith', role: 'professor' },
  order: 1,
  role: 'first',
};

const mockAttachment = {
  _id: new Types.ObjectId(),
  workId: new Types.ObjectId(workId),
  kind: 'pdf',
  fileUrl: '/uploads/2024/01/paper.pdf',
};

const buildModelMock = (findOneLean: unknown, findLean: unknown) => ({
  findById: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(findOneLean),
  }),
  find: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(findLean),
  }),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  exists: jest.fn(),
});

describe('WorksService', () => {
  let service: WorksService;
  let workModelMock: ReturnType<typeof buildModelMock>;
  let authorshipModelMock: ReturnType<typeof buildModelMock>;
  let attachmentModelMock: ReturnType<typeof buildModelMock>;

  beforeEach(async () => {
    workModelMock = buildModelMock(mockWork, [mockWork]);
    authorshipModelMock = {
      ...buildModelMock(mockAuthorship, [mockAuthorship]),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockAuthorship]),
      }),
    };
    attachmentModelMock = {
      ...buildModelMock(mockAttachment, [mockAttachment]),
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockAttachment]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorksService,
        { provide: getModelToken(Work.name), useValue: workModelMock },
        { provide: getModelToken(Authorship.name), useValue: authorshipModelMock },
        { provide: getModelToken(Attachment.name), useValue: attachmentModelMock },
      ],
    }).compile();

    service = module.get<WorksService>(WorksService);
  });

  describe('findOne', () => {
    it('returns a work with populated authors and attachments', async () => {
      const result = await service.findOne(workId);

      expect(result).toMatchObject({ title: 'Seismic Analysis' });
      expect(Array.isArray(result.authors)).toBe(true);
      expect(result.authors).toHaveLength(1);
      expect(Array.isArray(result.attachments)).toBe(true);
      expect(result.attachments).toHaveLength(1);
    });

    it('sorts authors by order field', async () => {
      const result = await service.findOne(workId);
      // authorshipModel.find was called with sort({order:1})
      expect(authorshipModelMock.find).toHaveBeenCalledWith({ workId: new Types.ObjectId(workId) });
    });

    it('throws NotFoundException for an unknown id', async () => {
      workModelMock.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(new Types.ObjectId().toString())).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('returns works with authors and attachments populated', async () => {
      workModelMock.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockWork]),
      });

      const results = await service.findAll({});

      expect(Array.isArray(results)).toBe(true);
      expect(results[0]).toHaveProperty('authors');
      expect(results[0]).toHaveProperty('attachments');
    });
  });
});
