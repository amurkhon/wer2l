import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

/**
 * Runs once on application startup.
 * Creates the initial admin account if no users exist in the database.
 * This operation is idempotent — safe to run on every restart.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const hasUsers = await this.usersService.exists();
    if (hasUsers) return;

    const email = this.configService.getOrThrow<string>('ADMIN_EMAIL');
    const password = this.configService.getOrThrow<string>('ADMIN_PASSWORD');

    await this.usersService.createAdmin(email, password);
    this.logger.log(`Initial admin account created: ${email}`);
  }
}
