import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HighlightsService } from '../highlights/highlights.service';
import { UsersService } from '../users/users.service';

/**
 * Runs once on application startup.
 * Creates the initial admin account and seed data if none exist.
 * All operations are idempotent — safe to run on every restart.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly highlightsService: HighlightsService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedAdmin();
    await this.seedHighlights();
  }

  private async seedAdmin(): Promise<void> {
    const hasUsers = await this.usersService.exists();
    if (hasUsers) return;

    const email = this.configService.getOrThrow<string>('ADMIN_EMAIL');
    const password = this.configService.getOrThrow<string>('ADMIN_PASSWORD');

    await this.usersService.createAdmin(email, password);
    this.logger.log(`Initial admin account created: ${email}`);
  }

  private async seedHighlights(): Promise<void> {
    const existing = await this.highlightsService.findAll({});
    if (existing.length > 0) return;

    await this.highlightsService.create({
      title: 'WER²L Laboratory Opens Its Doors',
      summary:
        'The Water Environment & Resource Recovery Lab officially launches, welcoming its first cohort of graduate researchers and establishing its core research agenda.',
      content:
        'We are thrilled to announce the official launch of the Water Environment & Resource Recovery Lab (WER²L) at the Department of Civil Engineering, Dong-A University.\n\nThe laboratory is dedicated to developing innovative engineering technologies that address real-world environmental challenges, with a particular focus on water quality, wastewater treatment, and sustainable resource recovery.\n\nOur inaugural research team brings together graduate students from diverse engineering backgrounds, united by a shared commitment to producing impactful, practice-oriented research.\n\nThe lab will pursue publication in top-tier international journals while fostering close collaboration with industry partners and government agencies. We look forward to contributing meaningful solutions to the global challenges of clean water access and environmental sustainability.\n\nWelcome to WER²L.',
      type: 'news',
      status: 'published',
      featured: true,
      publishedAt: new Date(),
    });

    this.logger.log('Seed highlight created: WER²L Laboratory Opens Its Doors');
  }
}
