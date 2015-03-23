/// <reference path="dashboardHelpers.d.ts" />
declare module Dashboard {
    var templatePath: string;
    var pluginName: string;
    var _module: ng.IModule;
    function setSubTabs(builder: any, dashboards: Array<Dashboard>, $rootScope: any): void;
}
