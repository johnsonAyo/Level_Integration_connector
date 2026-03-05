import {
  Controller,
  Post,
  Get,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncSource } from './models/sync.interfaces';

@Controller()
export class SyncController {
  constructor(private readonly syncService: SyncService) { }

  @Post('sync')
  async triggerSync(@Query('source') source: SyncSource | 'all' = 'all') {
    const normalizedSource = source?.toLowerCase();

    if (normalizedSource === SyncSource.File.toLowerCase()) {
      return this.syncService.runFileSync();
    }
    if (normalizedSource === SyncSource.API.toLowerCase()) {
      return this.syncService.runApiSync();
    }

    if (normalizedSource === 'all') {
      const fileResult = await this.syncService.runFileSync();
      const apiResult = await this.syncService.runApiSync();
      return {
        message: 'Unified sync triggered',
        results: [fileResult, apiResult],
      };
    }

    throw new HttpException(
      `Invalid source. Valid sources: ${[...Object.values(SyncSource), 'all'].join(', ')}`,
      HttpStatus.BAD_REQUEST,
    );
  }

  @Get('sync-runs')
  async getSyncRuns() {
    return this.syncService.getSyncRuns();
  }
}
