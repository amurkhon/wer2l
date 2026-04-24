import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  /** Creates a new user account. Only admins may call this. */
  async create(dto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() }).lean();
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.userModel.create({
      email: dto.email,
      passwordHash,
      accessLevel: dto.accessLevel,
      memberId: dto.memberId ? new Types.ObjectId(dto.memberId) : null,
    });

    return user;
  }

  /** Lists all user accounts (admin only). */
  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().lean<UserDocument[]>();
  }

  /** Finds a single user by ID. */
  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).lean<UserDocument>();
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  /** Finds a user by email, optionally selecting the password hash. */
  async findByEmail(email: string, withHash = false): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ email: email.toLowerCase() });
    if (withHash) query.select('+passwordHash');
    return query.lean<UserDocument>();
  }

  /** Updates a user account. Admin only. */
  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    const { password, memberId, ...rest } = dto as CreateUserDto & { password?: string };
    const update: Record<string, unknown> = { ...rest };

    if (memberId !== undefined) {
      update['memberId'] = memberId ? new Types.ObjectId(memberId) : null;
    }

    if (password) {
      update['passwordHash'] = await bcrypt.hash(password, BCRYPT_ROUNDS);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, update, { new: true })
      .lean<UserDocument>();
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  /** Permanently deletes a user account. Admin only. */
  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException(`User ${id} not found`);
  }

  /** Checks whether any User document exists in the database. Used by the seed service. */
  async exists(): Promise<boolean> {
    return !!(await this.userModel.exists({}));
  }

  /** Creates the initial admin account from env vars. Used by SeedService only. */
  async createAdmin(email: string, password: string): Promise<UserDocument> {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    return this.userModel.create({ email, passwordHash, accessLevel: 'admin' });
  }
}
