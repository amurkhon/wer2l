import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import slugify from 'slugify';
import { CreateHighlightDto } from './dto/create-highlight.dto';
import { UpdateHighlightDto } from './dto/update-highlight.dto';
import { Highlight, HighlightDocument } from './schemas/highlight.schema';

export interface HighlightListQuery {
  type?: string;
  status?: string;
  featured?: string;
  search?: string;
}

@Injectable()
export class HighlightsService {
  constructor(
    @InjectModel(Highlight.name) private readonly highlightModel: Model<HighlightDocument>,
  ) {}

  async create(dto: CreateHighlightDto): Promise<HighlightDocument> {
    const slug = await this.generateSlug(dto.title);
    const publishedAt =
      dto.status === 'published' ? (dto.publishedAt ?? new Date()) : dto.publishedAt;

    return this.highlightModel.create({ ...dto, slug, publishedAt });
  }

  async findAll(query: HighlightListQuery): Promise<HighlightDocument[]> {
    const filter: FilterQuery<Highlight> = {};

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.featured !== undefined) filter.featured = query.featured === 'true';
    if (query.search) filter.$text = { $search: query.search };

    return this.highlightModel
      .find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean<HighlightDocument[]>();
  }

  async findOne(id: string): Promise<HighlightDocument> {
    const doc = await this.highlightModel.findById(id).lean<HighlightDocument>();
    if (!doc) throw new NotFoundException(`Highlight ${id} not found`);
    return doc;
  }

  async update(id: string, dto: UpdateHighlightDto): Promise<HighlightDocument> {
    const existing = await this.highlightModel.findById(id).lean<HighlightDocument>();
    if (!existing) throw new NotFoundException(`Highlight ${id} not found`);

    const update: Record<string, unknown> = { ...dto };

    if (dto.title && dto.title !== existing.title) {
      update['slug'] = await this.generateSlug(dto.title, id);
    }

    if (dto.status === 'published' && !existing.publishedAt && !dto.publishedAt) {
      update['publishedAt'] = new Date();
    }

    const doc = await this.highlightModel
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .lean<HighlightDocument>();
    if (!doc) throw new NotFoundException(`Highlight ${id} not found`);
    return doc;
  }

  async remove(id: string): Promise<void> {
    const doc = await this.highlightModel.findByIdAndDelete(id);
    if (!doc) throw new NotFoundException(`Highlight ${id} not found`);
  }

  private async generateSlug(title: string, excludeId?: string): Promise<string> {
    const base = slugify(title, { lower: true, strict: true });
    let slug = base;
    let i = 1;

    while (true) {
      const filter: FilterQuery<Highlight> = { slug };
      if (excludeId) filter._id = { $ne: excludeId };
      const exists = await this.highlightModel.exists(filter);
      if (!exists) break;
      slug = `${base}-${i++}`;
    }

    return slug;
  }
}
