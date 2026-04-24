import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import slugify from 'slugify';
import { Work, WorkDocument } from '../works/schemas/work.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category, CategoryDocument } from './schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Work.name) private readonly workModel: Model<WorkDocument>,
  ) {}

  /** Creates a category and auto-generates its slug from the name. */
  async create(dto: CreateCategoryDto): Promise<CategoryDocument> {
    const slug = slugify(dto.name, { lower: true, strict: true });

    const existing = await this.categoryModel.findOne({ slug }).lean();
    if (existing) throw new ConflictException(`A category with slug '${slug}' already exists`);

    return this.categoryModel.create({ ...dto, slug });
  }

  /** Lists all categories. */
  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel.find().sort({ name: 1 }).lean<CategoryDocument[]>();
  }

  /** Finds a single category by ID. */
  async findOne(id: string): Promise<CategoryDocument> {
    const cat = await this.categoryModel.findById(id).lean<CategoryDocument>();
    if (!cat) throw new NotFoundException(`Category ${id} not found`);
    return cat;
  }

  /** Updates a category, regenerating the slug if the name changes. */
  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryDocument> {
    const update: Partial<Category> = { ...dto };
    if (dto.name) update.slug = slugify(dto.name, { lower: true, strict: true });

    const cat = await this.categoryModel
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .lean<CategoryDocument>();
    if (!cat) throw new NotFoundException(`Category ${id} not found`);
    return cat;
  }

  /**
   * Deletes a category only if no Works reference it.
   * Prevents orphaned work records.
   */
  async remove(id: string): Promise<void> {
    const cat = await this.categoryModel.findById(id).lean();
    if (!cat) throw new NotFoundException(`Category ${id} not found`);

    const usedBy = await this.workModel.exists({ categoryId: id });
    if (usedBy) {
      throw new BadRequestException('Cannot delete a category that has associated works');
    }

    await this.categoryModel.findByIdAndDelete(id);
  }
}
