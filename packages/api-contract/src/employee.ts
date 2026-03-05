export interface Employee {
    id: number;
    externalId: string;
    firstName: string;
    lastName: string;
    email: string | null;
    hourlyRateCents: number;
    active: boolean | null;
    source: string | null;
}

export interface EmployeeWithSummary {
    externalId: string;
    firstName: string;
    lastName: string;
    email: string | null;
    active: boolean | null;
    hourlyRateCents: number;
    lastShiftEndAt: string | null;
    totalEarningsCentsLast7Days: number;
    source: string | null;
}
