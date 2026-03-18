'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { triggerSync } from '../lib/api';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Loader2, RefreshCw, Play, FileText, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface SyncButtonProps {
    onSyncComplete?: () => void;
}

import { SyncRun } from '../../../../packages/api-contract/src';

interface SyncButtonProps {
    onSyncComplete?: () => void;
}

function isSyncRun(result: unknown): result is SyncRun {
    return !!result && typeof (result as SyncRun).status === 'string';
}

function isSyncRunArray(result: unknown): result is { results: SyncRun[] } {
    return !!result && Array.isArray((result as { results: SyncRun[] }).results);
}

export function SyncButton({ onSyncComplete }: SyncButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSync = async (source: 'file' | 'api' | 'all') => {
        setIsLoading(true);

        try {
            const result = await triggerSync(source);

            let isError = false;
            let summary = { read: 0, processed: 0, errored: 0 };

            if (isSyncRunArray(result)) {
                isError = result.results.some((r) => r.status === 'Error');
                summary = result.results.reduce((acc, curr) => ({
                    read: acc.read + (curr.recordsRead || 0),
                    processed: acc.processed + (curr.recordsInserted || 0) + (curr.recordsUpdated || 0),
                    errored: acc.errored + (curr.recordsErrored || 0)
                }), { read: 0, processed: 0, errored: 0 });
            } else if (isSyncRun(result)) {
                isError = result.status === 'Error';
                summary = {
                    read: result.recordsRead || 0,
                    processed: (result.recordsInserted || 0) + (result.recordsUpdated || 0),
                    errored: result.recordsErrored || 0
                };
            }

            if (!isError) {
                toast.success(`Sync Successful: Processed ${summary.processed}/${summary.read} records.`, {
                    description: (
                        <div style={{ color: 'black', fontWeight: 500 }}>
                            All records integrated successfully.
                        </div>
                    )
                });
            } else {
                toast.error(`Sync completed with issues: ${summary.errored} failed.`, {
                    description: (
                        <div style={{ color: 'black', fontWeight: 500 }}>
                            Please check the status card for details.
                        </div>
                    )
                });
            }
            router.refresh();
            onSyncComplete?.();
        } catch (err) {
            console.error(err);
            toast.error(`Failed to trigger sync. Is the backend running?`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button disabled={isLoading} variant="outline" className="gap-2">
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                    Run Sync
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleSync('all')}>
                    Sync All Sources
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSync('file')}>
                    Sync from File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSync('api')}>
                    Sync from Mock API
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
