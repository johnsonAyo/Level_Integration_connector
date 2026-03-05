'use client';

import type { EmployeeWithSummary, EmployeeShiftsResponse } from '@level/api-contract';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { fetchEmployeeShifts } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDuration } from '@/lib/utils';

interface EmployeeModalProps {
    employee: EmployeeWithSummary | null;
    onClose: () => void;
    days: number;
}

export function EmployeeModal({ employee, onClose, days }: EmployeeModalProps) {
    const [data, setData] = useState<EmployeeShiftsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!employee) {
            setData(null);
            return;
        }

        async function loadShifts() {
            setIsLoading(true);
            setError(null);
            try {
                const to = new Date();
                const from = new Date();
                from.setDate(to.getDate() - days);

                const result = await fetchEmployeeShifts(
                    employee!.externalId,
                    from.toISOString(),
                    to.toISOString()
                );
                setData(result);
            } catch {
                setError('Failed to load shift details.');
            } finally {
                setIsLoading(false);
            }
        }

        loadShifts();
    }, [employee, days]);





    if (!employee) return null;

    const periodLabel = days === 30 ? 'Month' : `${days} Days`;

    return (
        <Dialog open={!!employee} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <DialogTitle className="text-xl">
                            {employee.firstName} {employee.lastName}
                        </DialogTitle>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${employee.active
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-amber-50 text-amber-600 border-amber-200'
                            }`}>
                            {employee.active ? 'Active' : 'Inactive'}
                        </div>
                    </div>
                    <DialogDescription>
                        Shift activity for the last {periodLabel.toLowerCase()}
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    {isLoading && (
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    )}
                    {error && <div className="text-red-500 text-sm">{error}</div>}
                    {!isLoading && !error && data && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-4 gap-4">

                                <div className="rounded-lg border bg-neutral-50 p-4">
                                    <div className="text-sm text-neutral-500">Total Shifts</div>
                                    <div className="text-xl font-semibold mt-1">{data.totals.shiftCount}</div>
                                </div>
                                <div className="rounded-lg border bg-neutral-50 p-4">
                                    <div className="text-sm text-neutral-500">Hourly Rate</div>
                                    <div className="text-xl font-semibold mt-1">
                                        {formatCurrency(employee.hourlyRateCents)}
                                    </div>
                                </div>
                                <div className="rounded-lg border bg-neutral-50 p-4">
                                    <div className="text-sm text-neutral-500">Total Hours</div>
                                    <div className="text-xl font-semibold mt-1">
                                        {(data.totals.totalWorkMinutes / 60).toFixed(1)}h
                                    </div>
                                </div>
                                <div className="rounded-lg border bg-neutral-50 p-4 font-bold">
                                    <div className="text-sm text-neutral-500">Total Earnings</div>
                                    <div className="text-xl mt-1 text-emerald-600">
                                        {formatCurrency(data.totals.totalEarningsCents)}
                                    </div>
                                </div>
                            </div>

                            {/* Shifts Table */}
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-neutral-50">
                                        <TableRow>
                                            <TableHead>Start Time</TableHead>
                                            <TableHead>End Time</TableHead>
                                            <TableHead className="text-right">Duration</TableHead>
                                            <TableHead className="text-right">Break (min)</TableHead>
                                            <TableHead className="text-right">Earnings</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.shifts.map((shift) => {
                                            return (
                                                <TableRow key={shift.externalId}>
                                                    <TableCell>{new Date(shift.startAt).toLocaleString()}</TableCell>
                                                    <TableCell>{new Date(shift.endAt).toLocaleString()}</TableCell>
                                                    <TableCell className="text-right text-neutral-500 font-medium">
                                                        {formatDuration(
                                                            Math.floor(
                                                                (new Date(shift.endAt).getTime() - new Date(shift.startAt).getTime()) / 60000
                                                            )
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">{shift.breakMinutes || 0}</TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatCurrency(shift.earningsCents)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {data.shifts.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center text-neutral-500">
                                                    No shifts found in the last {periodLabel.toLowerCase()}.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
