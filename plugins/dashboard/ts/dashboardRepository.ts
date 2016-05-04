/// <reference path="dashboardPlugin.ts"/>
/// <reference path="dashboardInterfaces.ts"/>
/**
 * @module Dashboard
 */
module Dashboard {

  _module.factory('dashboardRepository', ['DefaultDashboards', (defaults:DefaultDashboards) => {
    return new LocalDashboardRepository(defaults);
  }]);

  _module.factory('DefaultDashboards', [() => {
    var defaults = <Array<Dashboard>>[];
    var answer = {
      add: (dashboard:Dashboard) => {
        defaults.push(dashboard);
      },
      remove: (id:string) => {
        return _.remove(defaults, (dashboard) => dashboard.id === id);
      },
      getAll: () => defaults
    }
    return answer;
  }]);

  /**
   * @class LocalDashboardRepository
   * @uses DashboardRepository
   */
  export class LocalDashboardRepository implements DashboardRepository {

    private localStorage:WindowLocalStorage = null;

    constructor(private defaults:DefaultDashboards) {
      this.localStorage = Core.getLocalStorage();
      if ('userDashboards' in this.localStorage) {
        log.debug("Found previously saved dashboards");
      } else {
        log.debug("Storing pre-defined dashboards");
        this.storeDashboards(defaults.getAll());
      }
    }

    private loadDashboards() {
      var answer = angular.fromJson(localStorage['userDashboards']);
      log.debug("returning dashboards: ", answer);
      return answer;
    }

    private storeDashboards(dashboards:any[]) {
      log.debug("storing dashboards: ", dashboards);
      localStorage['userDashboards'] = angular.toJson(dashboards);
      return this.loadDashboards();
    }

    public putDashboards(array:any[], commitMessage:string, fn) {
      var dashboards = this.loadDashboards();
      array.forEach((dash) => {
        var existing = _.findIndex(dashboards, (d:any) => { return d.id === dash.id; });
        if (existing >= 0) {
          dashboards[existing] = dash;
        } else {
          dashboards.push(dash);
        }
      });
      fn(this.storeDashboards(dashboards));
    }

    public deleteDashboards(array:any[], fn) {
      var dashboards = this.loadDashboards();
      angular.forEach(array, (item) => {
        _.remove(dashboards, (i:any) => { return i.id === item.id; });
      });
      fn(this.storeDashboards(dashboards));
    }

    public getDashboards(fn) {
      fn(this.loadDashboards());
    }

    public getDashboard(id:string, fn) {
      var dashboards = this.loadDashboards();
      var dashboard = _.find(dashboards, (dashboard:any) => { return dashboard.id === id });
      fn(dashboard);
    }

    public createDashboard(options:any) {
      var answer ={
        title: "New Dashboard",
        group: "Personal",
        widgets: []
      };
      answer = angular.extend(answer, options);
      answer['id'] = Core.getUUID();
      return answer;
    }

    public cloneDashboard(dashboard:any) {
      var newDashboard = _.clone(dashboard);
      newDashboard['id'] = Core.getUUID();
      newDashboard['title'] = "Copy of " + dashboard.title;
      return newDashboard;
    }

    public getType() {
      return 'container';
    }
  }

}
