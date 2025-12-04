export declare function getDashboardSummary(customerId: string): Promise<{
    totalVehicles: number;
    problematicVehicles: number;
    healthyVehicles: number;
    appointmentsBooked: number;
    dtcVehicles: {
        vehicleId: string;
    }[];
}>;
//# sourceMappingURL=dashboardService.d.ts.map