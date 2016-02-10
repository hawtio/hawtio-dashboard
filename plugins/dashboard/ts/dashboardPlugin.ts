/**
 * @module Dashboard
 * @main Dashboard
 */
/// <reference path="dashboardHelpers.ts"/>
module Dashboard {
  
  export var _module = angular.module(pluginName, []);

  _module.config(["$routeProvider", "$provide", ($routeProvider, $provide) => {

    $provide.decorator('HawtioDashboard', ['$delegate', ($delegate) => {
      $delegate['hasDashboard'] = true;
      $delegate['getAddLink'] = (title?:string, size_x?:number, size_y?:number) => {
        var target = new URI('/dashboard/add');
        var currentUri = new URI();
        /*
        currentUri.removeQuery('main-tab');
        currentUri.removeQuery('sub-tab');
        */
        var widgetUri = new URI(currentUri.path());
        widgetUri.query(currentUri.query(true));
        target.query((query) => {
          query.href = widgetUri.toString().escapeURL()
          if (title) {
            query.title = title.escapeURL();
          }
          if (size_x && size_y) {
            query.size = angular.toJson({size_x: size_x, size_y: size_y}).escapeURL();
          }
        });
        return target.toString();
      }
      return $delegate;
    }]);

    $routeProvider.
            when('/dashboard/add', {templateUrl: Dashboard.templatePath + 'addToDashboard.html'}).
            when('/dashboard/edit', {templateUrl: Dashboard.templatePath + 'editDashboards.html'}).
            when('/dashboard/idx/:dashboardIndex', {templateUrl: Dashboard.templatePath + 'dashboard.html', reloadOnSearch: false }).
            when('/dashboard/id/:dashboardId', {templateUrl: Dashboard.templatePath + 'dashboard.html', reloadOnSearch: false }).
            when('/dashboard/id/:dashboardId/share', {templateUrl: Dashboard.templatePath + 'share.html'}).
            when('/dashboard/import', {templateUrl: Dashboard.templatePath + 'import.html'});
  }]);

  _module.value('ui.config', {
    // The ui-jq directive namespace
    jq: {
      gridster: {
        widget_margins: [10, 10],
        widget_base_dimensions: [140, 140]
      }
    }
  });

  _module.factory('HawtioDashboardTab', ['HawtioNav', 'HawtioDashboard', '$timeout', '$rootScope', 'dashboardRepository', '$location', (nav:HawtioMainNav.Registry, dash:DashboardService, $timeout, $rootScope, dashboards:DashboardRepository, $location) => {
    var tab = <any> {
      embedded: true
    };
    if (dash.inDashboard) {
      log.debug("Embedded in a dashboard, not initializing our navigation tab");
      return tab;
    }
    // special case here, we don't want to overwrite our stored tab!
    var builder = nav.builder();
    tab = builder.id(pluginName)
                  .href(() => '/dashboard/idx/0')
                  .isSelected(() => {
                    return _.startsWith($location.path(), '/dashboard/');
                  })
                  .title(() => 'Dashboard')
                  .build();
    nav.add(tab);
    setTimeout(() => {
      log.debug("Setting up dashboard sub-tabs");
      dashboards.getDashboards((dashboards) => {
        setSubTabs(tab, builder, dashboards, $rootScope);
      });
    }, 500);
    log.debug("Not embedded in a dashboard, returning proper tab");
    return tab;
  }]);

  _module.run(["HawtioDashboardTab", (HawtioDashboardTab) => {
    log.debug("running");
  }]);

  hawtioPluginLoader.addModule(pluginName);
}
