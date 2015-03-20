/**
 * @module Dashboard
 * @main Dashboard
 */
/// <reference path="dashboardHelpers.ts"/>
module Dashboard {
  
  export var templatePath = 'plugins/dashboard/html/';
  export var pluginName = 'dashboard';
  
  export var _module = angular.module(pluginName, []);

  _module.config(["$routeProvider", ($routeProvider) => {
    $routeProvider.
            when('/dashboard/add', {templateUrl: Dashboard.templatePath + 'addToDashboard.html'}).
            when('/dashboard/edit', {templateUrl: Dashboard.templatePath + 'editDashboards.html'}).
            when('/dashboard/idx/:dashboardIndex', {templateUrl: Dashboard.templatePath + 'dashboard.html'}).
            when('/dashboard/id/:dashboardId', {templateUrl: Dashboard.templatePath + 'dashboard.html'}).
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

  _module.run(["HawtioNav", "viewRegistry", (nav:HawtioMainNav.Registry, viewRegistry) => {
    var builder = nav.builder();
    var tab = builder.id(pluginName)
                .href(() => '/dashboard/idx/0')
                .title(() => 'Dashboard')
                .build();
    nav.add(tab);
    viewRegistry['dashboard'] = UrlHelpers.join(templatePath, 'layoutDashboard.html');
  }]);

  hawtioPluginLoader.addModule(pluginName);
}
