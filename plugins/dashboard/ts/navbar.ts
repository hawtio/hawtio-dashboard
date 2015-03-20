/// <reference path="dashboardPlugin.ts"/>
/**
 * @module Dashboard
 */
module Dashboard {
  _module.controller("Dashboard.NavBarController", ["$scope", "$routeParams", "$rootScope", "dashboardRepository", ($scope, $routeParams, $rootScope, dashboardRepository:DashboardRepository) => {

    $scope._dashboards = [];

    $scope.activeDashboard = $routeParams['dashboardId'];

    $scope.$on('loadDashboards', loadDashboards);

    $scope.$on('dashboardsUpdated', dashboardLoaded);

    $scope.dashboards = () => {
      return $scope._dashboards
    };

    $scope.onTabRenamed = function(dash) {
      dashboardRepository.putDashboards([dash], "Renamed dashboard", (dashboards) => {
        dashboardLoaded(null, dashboards);
      });
    };

    function dashboardLoaded(event, dashboards) {
      log.debug("navbar dashboardLoaded: ", dashboards);
      $scope._dashboards = dashboards;
      if (event === null) {
        $rootScope.$broadcast('dashboardsUpdated', dashboards);
        Core.$apply($scope);
      }
    }

    function loadDashboards(event) {
      dashboardRepository.getDashboards((dashboards) => {
        // prevent the broadcast from happening...
        dashboardLoaded(null, dashboards);
        Core.$apply($scope);
      });
    }
  }]);
}
