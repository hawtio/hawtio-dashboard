/// <reference path="dashboardPlugin.d.ts" />
/// <reference path="dashboardInterfaces.d.ts" />
declare module Dashboard {
    class LocalDashboardRepository implements DashboardRepository {
        private localStorage;
        constructor(defaults: DefaultDashboards);
        private loadDashboards();
        private storeDashboards(dashboards);
        putDashboards(array: any[], commitMessage: string, fn: any): void;
        deleteDashboards(array: any[], fn: any): void;
        getDashboards(fn: any): void;
        getDashboard(id: string, fn: any): void;
        createDashboard(options: any): {
            title: string;
            group: string;
            widgets: any[];
        };
        cloneDashboard(dashboard: any): any;
        getType(): string;
    }
}
