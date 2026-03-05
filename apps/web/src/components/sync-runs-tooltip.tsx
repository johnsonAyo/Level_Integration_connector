import { type SyncRun } from '@level/api-contract';

interface SyncRunsTooltipContentProps {
    syncRuns: SyncRun[];
}

export function SyncRunsTooltipContent({ syncRuns }: SyncRunsTooltipContentProps) {
    const RECENT_LIMIT = 5;
    const recentRuns = syncRuns.slice(0, RECENT_LIMIT);
    const successCount = recentRuns.filter(r => r.status === 'Success').length;
    const errorCount = recentRuns.filter(r => r.status !== 'Success').length;

    return (
        <div className="min-w-[23.75rem] space-y-2">
            <p className="text-xs font-bold text-neutral-300 uppercase tracking-wider border-b border-neutral-600 pb-1.5">
                Latest Run Summaries
            </p>
            <div className="flex gap-3 text-[0.6875rem] text-neutral-400 pb-1">
                <span>{successCount} succeeded</span>
                <span>{errorCount} failed</span>
                <span>📊 {recentRuns.length} of {syncRuns.length} shown</span>
            </div>
            <div className="space-y-1.5">
                {recentRuns.map((run) => {
                    const runDate = new Date(run.finishedAt || run.startedAt || '');
                    const isSuccess = run.status === 'Success';
                    const completed = (run.recordsInserted ?? 0) + (run.recordsUpdated ?? 0);
                    return (
                        <div key={run.id} className="flex items-center justify-between gap-3 text-xs border-b border-neutral-700/50 pb-1.5 last:border-0">
                            <div className="flex items-center gap-1.5">
                                <span>{isSuccess ? '✅' : '❌'}</span>
                                <span className="font-semibold text-neutral-100">{run.source?.toUpperCase()}</span>
                                <span className="text-neutral-500">·</span>
                                <span className="text-neutral-400">
                                    {runDate.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="flex gap-2 text-[0.6875rem] tabular-nums">
                                <span className="text-neutral-400">{run.recordsRead ?? 0} records</span>
                                <span className="text-emerald-400">{completed} completed</span>
                                {(run.recordsErrored ?? 0) > 0 && (
                                    <span className="text-red-400">{run.recordsErrored} failed</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
