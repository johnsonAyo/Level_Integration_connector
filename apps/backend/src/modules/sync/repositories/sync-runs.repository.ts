import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE, Database } from '../../../db/db.module';
import * as schema from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { SyncSource } from '../models/sync.interfaces';

@Injectable()
export class SyncRunsRepository {
  constructor(@Inject(DRIZZLE) private db: Database) {}

  async create(data: { source: SyncSource; status: string; startedAt: Date }) {
    const [run] = await this.db
      .insert(schema.syncRuns)
      .values(data)
      .returning();
    return run;
  }

  async update(id: number, data: Partial<typeof schema.syncRuns.$inferInsert>) {
    const [run] = await this.db
      .update(schema.syncRuns)
      .set(data)
      .where(eq(schema.syncRuns.id, id))
      .returning();
    return run;
  }

  async findAllOrdered() {
    return this.db
      .select()
      .from(schema.syncRuns)
      .orderBy(desc(schema.syncRuns.startedAt));
  }
}
