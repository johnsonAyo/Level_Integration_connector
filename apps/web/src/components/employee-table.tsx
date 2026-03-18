'use client';

import type { EmployeeWithSummary } from '../../../../packages/api-contract/src';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { useState } from 'react';
import { EmployeeModal } from './employee-modal';

interface EmployeeTableProps {
    employees: EmployeeWithSummary[];
    onPeriodChange: (days: 3 | 7 | 30) => void;
    earningsDays: 3 | 7 | 30;
    isLoading?: boolean;
}

export function EmployeeTable({
    employees,
    onPeriodChange,
    earningsDays,
    isLoading = false
}: EmployeeTableProps) {
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithSummary | null>(null);
    const [filterSource, setFilterSource] = useState<'All' | 'File' | 'API'>('All');

    const filteredEmployees = employees.filter(emp => {
        if (filterSource === 'All') return true;
        const source = emp.source || 'File';
        return source.toLowerCase() === filterSource.toLowerCase();
    });

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
        }).format(cents / 100);
    };

    const periodLabel = earningsDays === 30 ? 'Month' : `${earningsDays} Days`;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-500">Filter by Source:</span>
                    <div className="flex bg-neutral-100 p-1 rounded-md">
                        {(['All', 'File', 'API'] as const).map((source) => (
                            <button
                                key={source}
                                onClick={() => setFilterSource(source)}
                                className={`px-3 py-1 text-sm rounded-sm transition-all ${filterSource === source
                                    ? 'bg-white shadow-sm text-neutral-900 border border-neutral-200'
                                    : 'text-neutral-500 hover:text-neutral-700'
                                    }`}
                            >
                                {source}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-500">Earnings Period:</span>
                    <div className="flex bg-neutral-100 p-1 rounded-md">
                        {([3, 7, 30] as const).map((days) => (
                            <button
                                key={days}
                                onClick={() => onPeriodChange(days)}
                                className={`px-3 py-1 text-sm rounded-sm transition-all ${earningsDays === days
                                    ? 'bg-white shadow-sm text-neutral-900 border border-neutral-200'
                                    : 'text-neutral-500 hover:text-neutral-700'
                                    }`}
                            >
                                {days === 30 ? '1m' : `${days}d`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className={`rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm transition-opacity ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                <Table>
                    <TableHeader className="bg-neutral-50/50">
                        <TableRow>
                            <TableHead className="font-semibold">Employee</TableHead>
                            <TableHead className="font-semibold">Email</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Last Shift</TableHead>
                            <TableHead className="font-semibold">Source</TableHead>
                            <TableHead className="text-right font-semibold">Last {periodLabel} Earnings</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredEmployees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-neutral-500">
                                    No employees found for this source.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredEmployees.map((emp) => (
                                <TableRow
                                    key={emp.externalId}
                                    className="hover:bg-neutral-50/50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedEmployee(emp)}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 font-bold border border-neutral-200 uppercase">
                                                {emp.firstName[0]}{emp.lastName[0]}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-neutral-900">{emp.firstName} {emp.lastName}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-neutral-600">{emp.email || '—'}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={emp.active ? 'default' : 'secondary'}
                                            className={cn(
                                                "uppercase font-bold text-[10px]",
                                                emp.active
                                                    ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200'
                                                    : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200'
                                            )}
                                        >
                                            {emp.active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-neutral-600">
                                        {emp.lastShiftEndAt ? new Date(emp.lastShiftEndAt).toLocaleDateString('en-GB') : '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize text-[12px]">
                                            {emp.source?.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-neutral-900">
                                        {formatCurrency(emp.totalEarningsCentsLast7Days)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <EmployeeModal
                employee={selectedEmployee}
                onClose={() => setSelectedEmployee(null)}
                days={earningsDays}
            />
        </div>
    );
}
