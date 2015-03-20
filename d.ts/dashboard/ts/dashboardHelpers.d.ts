/// <reference path="../../includes.d.ts" />
/// <reference path="dashboardInterfaces.d.ts" />
declare module Dashboard {
    var log: Logging.Logger;
    function cleanDashboardData(item: any): {};
    function decodeURIComponentProperties(hash: any): any;
    function onOperationComplete(result: any): void;
}
