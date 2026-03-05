export interface Shift {
    id: number;
    externalId: string;
    employeeExternalId: string;
    startAt: string;
    endAt: string;
    breakMinutes: number | null;
    workMinutes: number;
    earningsCents: number;
}

export interface EmployeeShiftsResponse {
    employee: {
        externalId: string;
        firstName: string;
        lastName: string;
    };
    shifts: Shift[];
    totals: {
        shiftCount: number;
        totalWorkMinutes: number;
        totalEarningsCents: number;
    };
}
