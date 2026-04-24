import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { AuthService } from './auth.service';

const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  email: 'admin@lab.edu',
  passwordHash: '',
  accessLevel: 'admin' as const,
};

describe('AuthService', () => {
  let service: AuthService;
  let userModel: jest.Mocked<Model<typeof User>>;
  let jwtService: jest.Mocked<JwtService>;

  beforeAll(async () => {
    mockUser.passwordHash = await bcrypt.hash('secret123', 10);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findOne: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('signed-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              const cfg: Record<string, string> = {
                JWT_ACCESS_SECRET: 'access-secret',
                JWT_REFRESH_SECRET: 'refresh-secret',
              };
              return cfg[key] ?? '';
            }),
            get: jest.fn().mockReturnValue('15m'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken(User.name));
    jwtService = module.get(JwtService);
  });

  describe('login', () => {
    it('returns access and refresh tokens on valid credentials', async () => {
      const chainMock = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...mockUser }),
      };
      userModel.findOne.mockReturnValue(chainMock as never);
      userModel.findByIdAndUpdate.mockResolvedValue(null as never);

      const result = await service.login('admin@lab.edu', 'secret123');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('throws UnauthorizedException for unknown email', async () => {
      const chainMock = { select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(null) };
      userModel.findOne.mockReturnValue(chainMock as never);

      await expect(service.login('unknown@lab.edu', 'secret123')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const chainMock = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...mockUser }),
      };
      userModel.findOne.mockReturnValue(chainMock as never);

      await expect(service.login('admin@lab.edu', 'wrong-password')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('returns a new access token for a valid refresh token', async () => {
      jwtService.verify.mockReturnValue({
        sub: mockUser._id,
        email: mockUser.email,
        accessLevel: mockUser.accessLevel,
      } as never);
      const chainMock = { lean: jest.fn().mockResolvedValue({ ...mockUser }) };
      userModel.findById.mockReturnValue(chainMock as never);

      const result = await service.refresh('valid-refresh-token');

      expect(typeof result).toBe('string');
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
    });

    it('throws UnauthorizedException for an invalid refresh token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refresh('bad-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws NotFoundException when user in token payload no longer exists', async () => {
      jwtService.verify.mockReturnValue({ sub: mockUser._id } as never);
      const chainMock = { lean: jest.fn().mockResolvedValue(null) };
      userModel.findById.mockReturnValue(chainMock as never);

      await expect(service.refresh('valid-token-deleted-user')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
