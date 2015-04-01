/**
 * @module Dashboard
 * @main Dashboard
 */
/// <reference path="dashboardHelpers.ts"/>
module Dashboard {
  
  export var templatePath = 'plugins/dashboard/html/';
  export var pluginName = 'dashboard';
  
  export var _module = angular.module(pluginName, []);

  _module.config(["$routeProvider", "$provide", ($routeProvider, $provide) => {

    $provide.decorator('HawtioDashboard', ['$delegate', ($delegate) => {
      $delegate['hasDashboard'] = true;
      $delegate['getAddLink'] = () => {
        var target = new URI('/dashboard/add');
        var currentUri = new URI();
        currentUri.removeQuery('main-tab');
        currentUri.removeQuery('sub-tab');
        var widgetUri = new URI(currentUri.path());
        widgetUri.query(currentUri.query(true));
        target.query({
          href: widgetUri.toString().escapeURL()
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

  var tab = undefined;

  export function setSubTabs(builder, dashboards:Array<Dashboard>, $rootScope) {
    log.debug("Updating sub-tabs");
    if (!tab.tabs) {
      tab.tabs = [];
    } else {
      tab.tabs.length = 0;
    }
    _.forEach(dashboards, (dashboard) => {
      var child = builder
        .id('dashboard-' + dashboard.id)
        .title(() => dashboard.title || dashboard.id)
        .href(() => {
          var uri = new URI(UrlHelpers.join('/dashboard/id', dashboard.id))
            uri.search({
              'main-tab': pluginName,
              'sub-tab': 'dashboard-' + dashboard.id
            });
          return uri.toString();
        })
      .build();
      tab.tabs.push(child);
    });
    var manage = builder
      .id('dashboard-manage')
      .title(() => '<i class="fa fa-pencil"></i>&nbsp;Manage')
      .href(() => '/dashboard/edit?main-tab=dashboard&sub-tab=dashboard-manage')
      .build();
    tab.tabs.push(manage);
    tab.tabs.forEach((tab) => {
      tab.isSelected = () => {
        var id = tab.id.replace('dashboard-', '');
        var uri = new URI();
        return uri.query(true)['sub-tab'] === tab.id || _.endsWith(uri.path(), id);
      }
    });
    Core.$apply($rootScope);
  }

  _module.run(["HawtioNav", "dashboardRepository", "$rootScope", "HawtioDashboard", "$timeout", (nav:HawtioMainNav.Registry, dashboards:DashboardRepository, $rootScope, dash:DashboardService, $timeout) => {
    // special case here, we don't want to overwrite our stored tab!
    if (!dash.inDashboard) {
      var builder = nav.builder();
      tab = builder.id(pluginName)
        .href(() => '/dashboard/idx/0')
        .title(() => 'Dashboard')
        .build();
      nav.add(tab);
      $timeout(() => {
        dashboards.getDashboards((dashboards) => {
          setSubTabs(builder, dashboards, $rootScope);
        });
      }, 500);
    }
  }]);

  hawtioPluginLoader.addModule(pluginName);
}
