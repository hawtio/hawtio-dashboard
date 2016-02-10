/// <reference path="../../includes.ts"/>
/// <reference path="dashboardInterfaces.ts"/>
/**
 * @module Dashboard
 */
module Dashboard {
  
  export var templatePath = 'plugins/dashboard/html/';
  export var pluginName = 'dashboard';

  export var log:Logging.Logger = Logger.get('hawtio-dashboard');

  /**
   * Returns the cleaned up version of the dashboard data without any UI selection state
   * @method cleanDashboardData
   * @static
   * @for Dashboard
   * @param {any} item
   * @return {any}
   */
  export function cleanDashboardData(item) {
    var cleanItem = {};
    angular.forEach(item, (value, key) => {
      if (!angular.isString(key) || (!key.startsWith("$") && !key.startsWith("_"))) {
        cleanItem[key] = value;
      }
    });
    return cleanItem;
  }

  /**
   * Runs decodeURIComponent() on each value in the object
   * @method decodeURIComponentProperties
   * @static
   * @for Dashboard
   * @param {any} hash
   * @return {any}
   */
  export function decodeURIComponentProperties(hash) {
    if (!hash) {
      return hash;
    }
    var decodeHash = {};
    angular.forEach(hash, (value, key) => {
      decodeHash[key] = value ? decodeURIComponent(value) : value;
    });
    return decodeHash;
  }

  export function onOperationComplete(result) {
    console.log("Completed adding the dashboard with response " + JSON.stringify(result));
  }

  export function setSubTabs(tab:any, builder, dashboards:Array<Dashboard>, $rootScope) {
    if (!tab || tab.embedded) {
      return;
    } 
    log.debug("Updating sub-tabs");
    if (!tab.tabs) {
      tab.tabs = [];
    } else {
      tab.tabs.length = 0;
    }
    log.debug("tab: ", tab);
    log.debug("dashboards: ", dashboards);
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
    log.debug("Updated main tab to: ", tab);
    //$rootScope.$broadcast('hawtio-nav-redraw');
    $rootScope.$broadcast('hawtio-nav-subtab-redraw');
    Core.$apply($rootScope);
  }


  export function getDummyBuilder() {
    var self = {
      id: () => self,
      defaultPage: () => self,
      rank: () => self,
      reload: () => self,
      page: () => self,
      title: () => self,
      tooltip: () => self,
      context: () => self,
      attributes: () => self,
      linkAttributes: () => self,
      href: () => self,
      click: () => self,
      isValid: () => self,
      show: () => self,
      isSelected: () => self,
      template: () => self,
      tabs: () => self,
      subPath: () => self,
      build: () => {}
    }
    return self;
  }

  export function getDummyBuilderFactory() {
    return {
      create: () => getDummyBuilder(),
      join: () => '',
      configureRouting: () => {}
    }
  }

  export function getDummyHawtioNav() {
    var nav = {
      builder: () => getDummyBuilder(),
      add: () => {},
      remove: () => [],
      iterate: () => null,
      on: () => undefined,
      selected: () => undefined
    }
    return nav;
  }
}
