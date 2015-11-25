/// <reference path="../../includes.d.ts" />
/// <reference path="dashboardInterfaces.d.ts" />
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
