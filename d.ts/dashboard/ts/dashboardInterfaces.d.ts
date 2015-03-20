declare module Dashboard {
    interface DashboardRepository {
        putDashboards: (array: any[], commitMessage: string, fn) => any;
        deleteDashboards: (array: any[], fn) => any;
        getDashboards: (fn) => any;
        getDashboard: (id: string, fn) => any;
        createDashboard: (options: any) => any;
        cloneDashboard: (dashboard: any) => any;
        getType: () => string;
    }
}
