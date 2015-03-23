/// <reference path="dashboardPlugin.d.ts" />
/// <reference path="dashboardRepository.d.ts" />
/// <reference path="rectangleLocation.d.ts" />
declare module Dashboard {
    class GridsterDirective {
        restrict: string;
        replace: boolean;
        controller: (string | (($scope: any, $element: any, $attrs: any, $location: any, $routeParams: any, $templateCache: any, dashboardRepository: DashboardRepository, $compile: any, $templateRequest: any) => void))[];
    }
}
