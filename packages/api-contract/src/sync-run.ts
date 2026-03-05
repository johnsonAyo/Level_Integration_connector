export type SyncStatus = 'Processing' | 'Success' | 'Error';
export type SyncSource = 'File' | 'Api';

export interface SyncRun {
    id: number;
    startedAt: string | null;
    finishedAt: string | null;
    status: SyncStatus | null;
    source: SyncSource | null;
    recordsRead: number | null;
    recordsInserted: number | null;
    recordsUpdated: number | null;
    recordsErrored: number | null;
    errors: string[] | null;
}
