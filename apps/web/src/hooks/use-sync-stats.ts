import { useMemo } from 'react';
import { type SyncRun } from '@level/api-contract';

/**
 * Custom hook to calculate synchronization statistics
 */
export function useSyncStats(syncRuns: SyncRun[]) {
    return useMemo(() => {
        if (!syncRuns || syncRuns.length === 0) return null;

        const latestRunsBySource = new Map<string, SyncRun>();
        for (const run of syncRuns) {
            if (run.source && !latestRunsBySource.has(run.source)) {
                latestRunsBySource.set(run.source, run);
            }
            if (latestRunsBySource.size >= 2) break;
        }

        const relevantRuns = Array.from(latestRunsBySource.values());
        const latestRun = syncRuns[0];
        const isSuccess = relevantRuns.every(run => run.status === "Success");
        const finishedDate = new Date(latestRun.finishedAt || latestRun.startedAt || "");

        const totalRead = relevantRuns.reduce((acc, curr) => acc + (curr.recordsRead ?? 0), 0);
        const totalInserted = relevantRuns.reduce((acc, curr) => acc + (curr.recordsInserted ?? 0), 0);
        const totalUpdated = relevantRuns.reduce((acc, curr) => acc + (curr.recordsUpdated ?? 0), 0);
        const totalErrored = relevantRuns.reduce((acc, curr) => acc + (curr.recordsErrored ?? 0), 0);

        const sourceMap = new Map<string, { read: number; processed: number }>();
        relevantRuns.forEach(run => {
            if (!run.recordsRead || run.recordsRead === 0) return;
            const sourceName = run.source || 'Unknown';
            const existing = sourceMap.get(sourceName) || { read: 0, processed: 0 };
            sourceMap.set(sourceName, {
                read: existing.read + (run.recordsRead ?? 0),
                processed: existing.processed + ((run.recordsInserted ?? 0) + (run.recordsUpdated ?? 0))
            });
        });

        const sourceBreakdown = Array.from(sourceMap.entries())
            .map(([source, data]) => ({ source, ...data }))
            .sort((a, b) => a.source.localeCompare(b.source));

        const totalProcessed = totalInserted + totalUpdated;
        const successRate = totalRead > 0 ? Math.round((totalProcessed / totalRead) * 100) : 0;

        return {
            isSuccess,
            finishedDate,
            totalRead,
            totalProcessed,
            totalErrored,
            sourceBreakdown,
            successRate,
            relevantRuns,
            latestRun
        };
    }, [syncRuns]);
}
