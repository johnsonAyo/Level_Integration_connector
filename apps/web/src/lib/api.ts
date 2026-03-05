import type { EmployeeWithSummary, SyncRun, EmployeeShiftsResponse } from '@level/api-contract';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchEmployees(days?: number): Promise<EmployeeWithSummary[]> {
    const url = new URL(`${API_BASE}/employees`);
    if (days) url.searchParams.append('days', days.toString());

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch employees');
    return res.json();
}

export async function fetchSyncRuns(): Promise<SyncRun[]> {
    const res = await fetch(`${API_BASE}/sync-runs`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch sync runs');
    return res.json();
}

export async function fetchEmployeeShifts(
    externalId: string,
    from?: string,
    to?: string
): Promise<EmployeeShiftsResponse> {
    const url = new URL(`${API_BASE}/employees/${externalId}/shifts`);
    if (from) url.searchParams.append('from', from);
    if (to) url.searchParams.append('to', to);

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch employee shifts');
    return res.json();
}

export async function triggerSync(source: string = 'all'): Promise<SyncRun> {
    const res = await fetch(`${API_BASE}/sync?source=${source}`, {
        method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to trigger sync');
    return res.json();
}
