/// <reference path="libs/hawtio-utilities/defs.d.ts" />
declare module Dashboard {
    interface DashboardService {
        hasDashboard: boolean;
        inDashboard: boolean;
        getAddLink(title?: string, width?: number, height?: number): string;
    }
    interface SearchMap {
        [name: string]: string;
    }
    interface DashboardWidget {
        id: string;
        title: string;
        row?: number;
        col?: number;
        size_x?: number;
        size_y?: number;
        path?: string;
        url?: string;
        include?: string;
        search?: SearchMap;
        routeParams?: string;
    }
    interface Dashboard {
        id: string;
        title: string;
        group: string;
        widgets: Array<DashboardWidget>;
    }
    interface DefaultDashboards {
        add: (dashbard: Dashboard) => void;
        remove: (id: string) => Dashboard;
        getAll: () => Array<Dashboard>;
    }
    interface DashboardRepository {
        putDashboards: (array: any[], commitMessage: string, fn) => any;
        deleteDashboards: (array: Array<Dashboard>, fn) => any;
        getDashboards: (fn: (dashboards: Array<Dashboard>) => void) => void;
        getDashboard: (id: string, fn: (dashboard: Dashboard) => void) => any;
        createDashboard: (options: any) => any;
        cloneDashboard: (dashboard: any) => any;
        getType: () => string;
    }
}
declare module Dashboard {
    var templatePath: string;
    var pluginName: string;
    var log: Logging.Logger;
    function cleanDashboardData(item: any): {};
    function decodeURIComponentProperties(hash: any): any;
    function onOperationComplete(result: any): void;
    function setSubTabs(tab: any, builder: any, dashboards: Array<Dashboard>, $rootScope: any): void;
    function getDummyBuilder(): {
        id: () => any;
        defaultPage: () => any;
        rank: () => any;
        reload: () => any;
        page: () => any;
        title: () => any;
        tooltip: () => any;
        context: () => any;
        attributes: () => any;
        linkAttributes: () => any;
        href: () => any;
        click: () => any;
        isValid: () => any;
        show: () => any;
        isSelected: () => any;
        template: () => any;
        tabs: () => any;
        subPath: () => any;
        build: () => void;
    };
    function getDummyBuilderFactory(): {
        create: () => {
            id: () => any;
            defaultPage: () => any;
            rank: () => any;
            reload: () => any;
            page: () => any;
            title: () => any;
            tooltip: () => any;
            context: () => any;
            attributes: () => any;
            linkAttributes: () => any;
            href: () => any;
            click: () => any;
            isValid: () => any;
            show: () => any;
            isSelected: () => any;
            template: () => any;
            tabs: () => any;
            subPath: () => any;
            build: () => void;
        };
        join: () => string;
        configureRouting: () => void;
    };
    function getDummyHawtioNav(): {
        builder: () => {
            id: () => any;
            defaultPage: () => any;
            rank: () => any;
            reload: () => any;
            page: () => any;
            title: () => any;
            tooltip: () => any;
            context: () => any;
            attributes: () => any;
            linkAttributes: () => any;
            href: () => any;
            click: () => any;
            isValid: () => any;
            show: () => any;
            isSelected: () => any;
            template: () => any;
            tabs: () => any;
            subPath: () => any;
            build: () => void;
        };
        add: () => void;
        remove: () => any[];
        iterate: () => any;
        on: () => any;
        selected: () => any;
    };
}
declare module Dashboard {
    var _module: ng.IModule;
}
declare module Dashboard {
    class LocalDashboardRepository implements DashboardRepository {
        private defaults;
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
declare module Dashboard {
}
declare module Dashboard {
    class RectangleLocation {
        delegate: ng.ILocationService;
        private _path;
        private _hash;
        private _search;
        private uri;
        constructor(delegate: ng.ILocationService, path: string, search: any, hash: string);
        absUrl(): string;
        hash(newHash?: string): any;
        host(): string;
        path(newPath?: string): any;
        port(): number;
        protocol(): number;
        replace(): this;
        search(parametersMap?: any): any;
        url(newValue?: string): any;
    }
}
declare module Dashboard {
    class GridsterDirective {
        restrict: string;
        replace: boolean;
        controller: (string | (($scope: any, $element: any, $attrs: any, $location: any, $routeParams: any, $templateCache: any, dashboardRepository: DashboardRepository, $compile: any, $templateRequest: any, $interpolate: any, $modal: any, $sce: any, $timeout: any) => void))[];
    }
}
declare module Dashboard {
}
declare module Dashboard {
}
declare module Dashboard {
    var ShareController: ng.IModule;
}
