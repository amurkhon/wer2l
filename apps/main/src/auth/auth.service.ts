import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { JwtPayload } from './strategies/jwt.strategy';

export interface TokenPair {
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /** Validates credentials and returns token pair + refresh token string. */
  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .lean<UserDocument & { passwordHash: string }>();

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.userModel.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const payload: JwtPayload = {
      sub: String(user._id),
      email: user.email,
      accessLevel: user.accessLevel,
    };

    const accessToken = this.signAccess(payload);
    const refreshToken = this.signRefresh(payload);

    return { accessToken, refreshToken };
  }

  /**
   * Validates a refresh token (from httpOnly cookie) and issues a new access token.
   * This is intentionally stateless — clearing the cookie is sufficient for logout.
   */
  async refresh(refreshToken: string): Promise<string> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userModel.findById(payload.sub).lean<UserDocument>();
    if (!user) throw new NotFoundException('User not found');

    return this.signAccess({
      sub: String(user._id),
      email: user.email,
      accessLevel: user.accessLevel,
    });
  }

  /** Returns the current user with memberId populated. */
  async me(userId: string): Promise<UserDocument> {
    const user = await this.userModel
      .findById(userId)
      .populate('memberId')
      .lean<UserDocument>();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private signAccess(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY', '15m'),
    });
  }

  private signRefresh(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d'),
    });
  }
}
