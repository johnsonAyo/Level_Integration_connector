import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { type SyncRun } from '@level/api-contract';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Tooltip } from '@/components/ui/tooltip';
import { useSyncStats } from "@/hooks/use-sync-stats";
import { SyncRunsTooltipContent } from "@/components/sync-runs-tooltip";

interface SyncStatusCardProps {
    syncRuns?: SyncRun[];
}

export function SyncStatusCard({ syncRuns = [] }: SyncStatusCardProps) {
    const stats = useSyncStats(syncRuns);

    return (
        <Card className="overflow-hidden border-none shadow-sm bg-white font-sans">
            <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className={cn(
                            "rounded-full p-1",
                            stats?.isSuccess ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                        )}>
                            {stats?.isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        </div>
                        <span className="text-sm font-semibold text-neutral-600 tracking-tight ml-2">Sync Summary</span>
                        {syncRuns.length > 0 && (
                            <Tooltip content={<SyncRunsTooltipContent syncRuns={syncRuns} />}>
                                <Badge variant="outline" className="ml-2 h-5 px-1.5 text-[0.75rem] font-bold bg-neutral-50/50 text-neutral-500 border-neutral-200 cursor-default">
                                    {syncRuns.length} {syncRuns.length === 1 ? 'RUN' : 'RUNS'}
                                </Badge>
                            </Tooltip>
                        )}
                    </div>
                    {stats && (
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-[0.625rem] uppercase font-bold text-neutral-400 leading-none mb-1">Last Updated</span>
                                <span className="text-sm font-bold text-neutral-900 tabular-nums">
                                    {stats.finishedDate.toLocaleString(undefined, {
                                        dateStyle: 'medium',
                                        timeStyle: 'medium'
                                    })}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {!stats ? (
                    <div className="flex flex-col items-center justify-center py-10 text-neutral-500">
                        <Clock className="h-10 w-10 mb-2 opacity-20" />
                        <p>No synchronization history found.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 divide-x">
                            {/* Records Read */}
                            <div className="p-2.5 px-4 flex flex-col gap-1">
                                <span className="text-[0.8125rem] uppercase tracking-wider text-neutral-400 font-bold">Total to Process</span>
                                <div className="flex flex-col">
                                    <div className="flex items-baseline gap-1.5 leading-tight">
                                        <span className="text-xl font-black text-neutral-900">{stats.totalRead}</span>
                                        <span className="text-[0.625rem] text-neutral-500 font-bold">RECORDS</span>
                                    </div>
                                    {stats.sourceBreakdown.length > 1 && (
                                        <div className="flex gap-2 mt-0.5">
                                            {stats.sourceBreakdown.map((s, i) => (
                                                <span key={i} className="text-[0.75rem] font-bold text-neutral-400">
                                                    {s.read} from {s.source}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Processed Count */}
                            <div className="p-2.5 px-4 flex flex-col gap-1 bg-neutral-50/30">
                                <div className="flex items-center justify-between">
                                    <span className="text-[0.8125rem] uppercase tracking-wider text-neutral-400 font-bold">Successfully Processed</span>
                                    {stats.totalErrored > 0 && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="lg" className="h-6 text-[0.625rem] font-bold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 gap-1 bg-white px-2">
                                                    <AlertTriangle className="h-3 w-3 " />
                                                    <span className="text-[0.9375rem] font-bold text-red-600">ISSUES ({stats.totalErrored})</span>
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                                                <DialogHeader>
                                                    <DialogTitle className="flex items-center gap-2 text-red-600">
                                                        <AlertTriangle className="h-5 w-5" />
                                                        Sync Ingestion Failures
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        Details for {stats.totalErrored} records that failed across recent sync runs.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="flex-1 overflow-y-auto mt-4 pr-1">
                                                    <div className="space-y-6">
                                                        {stats.relevantRuns.sort((a) => (a.source === 'File' ? -1 : 1)).map((run) => (
                                                            <div key={run.id} className="space-y-3">
                                                                <div className="flex items-center gap-2 border-b pb-2">
                                                                    <Badge variant="outline" className="uppercase font-bold tracking-widest text-[0.625rem]">
                                                                        {run.source} SOURCE
                                                                    </Badge>
                                                                    <span className="text-xs text-neutral-400 font-medium">
                                                                        {run.recordsErrored} errors
                                                                    </span>
                                                                </div>
                                                                <div className="grid gap-2">
                                                                    {run.errors?.map((error, idx) => (
                                                                        <div key={idx} className="p-3 rounded-md border border-red-100 bg-red-50/50 flex flex-col gap-1">
                                                                            <p className="text-sm font-medium text-neutral-700 leading-relaxed">
                                                                                {error}
                                                                            </p>
                                                                        </div>
                                                                    )) || (
                                                                            <p className="text-xs text-neutral-400 italic">No specific error details recorded.</p>
                                                                        )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-baseline gap-1.5 leading-tight">
                                        <span className="text-xl font-black text-emerald-600">{stats.totalProcessed}</span>
                                        <span className="text-[0.625rem] text-emerald-600/70 font-bold">COMPLETED</span>
                                    </div>
                                    {stats.sourceBreakdown.length > 1 && (
                                        <div className="flex gap-2 mt-0.5">
                                            {stats.sourceBreakdown.map((s, i) => (
                                                <span key={i} className="text-[0.75rem] font-bold text-emerald-600/60">
                                                    {s.processed} from {s.source}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Efficiency Bar */}
                        <div className="h-1 w-full bg-neutral-100 overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-1000",
                                    stats.isSuccess ? "bg-emerald-500" : "bg-amber-500"
                                )}
                                style={{ width: `${stats.successRate}%` }}
                            />
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
