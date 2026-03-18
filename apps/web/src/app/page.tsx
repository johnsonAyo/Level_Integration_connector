'use client';

import { fetchEmployees, fetchSyncRuns } from '../lib/api';
import { SyncButton } from '../components/sync-button';
import { SyncStatusCard } from '../components/sync-status-card';
import { EmployeeTable } from '../components/employee-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useEffect, useState } from 'react';
import type { EmployeeWithSummary, SyncRun } from '../../../../packages/api-contract/src';

export default function Home() {
  const [employees, setEmployees] = useState<EmployeeWithSummary[]>([]);
  const [syncRuns, setSyncRuns] = useState<SyncRun[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [earningsDays, setEarningsDays] = useState<3 | 7 | 30>(7);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async (days: number) => {
    setIsLoading(true);
    try {
      const [emps, syncs] = await Promise.all([
        fetchEmployees(days),
        fetchSyncRuns()
      ]);
      setEmployees(emps);
      setSyncRuns(syncs);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(earningsDays);
  }, [refreshKey, earningsDays]);

  return (
    <main className="min-h-screen bg-neutral-50 p-8 pt-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-2">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-neutral-900">Workforce Dashboard</h1>
            <p className="text-neutral-500 mt-1 font-medium">External employee synchronization monitor</p>
          </div>
          <SyncButton onSyncComplete={() => setRefreshKey(prev => prev + 1)} />
        </div>

        {/* Sync Summary Section */}
        <SyncStatusCard syncRuns={syncRuns} />

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Employees</CardTitle>
            <CardDescription>View all synchronized employees and their recent earnings.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmployeeTable
              employees={employees}
              earningsDays={earningsDays}
              onPeriodChange={(days) => setEarningsDays(days)}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
