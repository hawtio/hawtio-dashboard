/// <reference path="dashboardPlugin.ts"/>
/// <reference path="dashboardInterfaces.ts"/>
/**
 * @module Dashboard
 */
module Dashboard {

  _module.factory('dashboardRepository', ['defaultDashboards', (defaultDashboards:DefaultDashboards) => {
    return new LocalDashboardRepository(defaultDashboards);
  }]);

  _module.factory('defaultDashboards', [() => {
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
   * The default dashboard definition if no saved dashboards are available
   *
   * @property defaultDashboards
   * @for Dashboard
   * @type {any}
   */
  var defaultDashboards = [

    {
      "title": "Monitor",
      "group": "Personal",
      "widgets": [
        {
          "id": "w1",
          "title": "Operating System",
          "row": 1,
          "col": 1,
          "size_x": 3,
          "size_y": 4,
          "path": "/example/page1",
          "include": "test-plugins/example/html/page1.html",
          "search": {
            "nid": "root-java.lang-OperatingSystem"
          },
          "hash": ""
        },
        {
          "id": "w3",
          "title": "Java Heap Memory",
          "row": 1,
          "col": 6,
          "size_x": 2,
          "size_y": 2,
          "path": "jmx/widget/donut",
          "include": "test-plugins/example/html/page1.html",
          "search": {},
          "hash": "",
          "routeParams": "{\"type\":\"donut\",\"title\":\"Java Heap Memory\",\"mbean\":\"java.lang:type=Memory\",\"attribute\":\"HeapMemoryUsage\",\"total\":\"Max\",\"terms\":\"Used\",\"remaining\":\"Free\"}"
        },
        {
          "id": "w4",
          "title": "Java Non Heap Memory",
          "row": 1,
          "col": 8,
          "size_x": 2,
          "size_y": 2,
          "path": "/example/page1",
          "include": "test-plugins/example/html/page1.html",
          "search": {},
          "hash": "",
          "routeParams": "{\"type\":\"donut\",\"title\":\"Java Non Heap Memory\",\"mbean\":\"java.lang:type=Memory\",\"attribute\":\"NonHeapMemoryUsage\",\"total\":\"Max\",\"terms\":\"Used\",\"remaining\":\"Free\"}"
        },
        {
          "id": "w5",
          "title": "",
          "row": 3,
          "col": 4,
          "size_x": 6,
          "size_y": 2,
          "path": "/example/page1",
          "include": "test-plugins/example/html/page1.html",
          "search": {
            "size": "%7B%22size_x%22%3A2%2C%22size_y%22%3A2%7D",
            "title": "Java%20Non%20Heap%20Memory",
            "routeParams": "%7B%22type%22%3A%22donut%22%2C%22title%22%3A%22Java%20Non%20Heap%20Memory%22%2C%22mbean%22%3A%22java.lang%3Atype",
            "nid": "root-java.lang-Threading"
          },
          "hash": ""
        },
        {
          "id": "w6",
          "title": "System CPU Load",
          "row": 1,
          "col": 4,
          "size_x": 2,
          "size_y": 2,
          "path": "/example/page1",
          "include": "test-plugins/example/html/page1.html",
          "search": {},
          "hash": "",
          "routeParams": "{\"type\":\"area\",\"title\":\"System CPU Load\",\"mbean\":\"java.lang:type=OperatingSystem\",\"attribute\":\"SystemCpuLoad\"}"
        }
      ],
      "id": "4e9d116173ca41767e"
    }

  ];

  /**
   * @class LocalDashboardRepository
   * @uses DashboardRepository
   */
  export class LocalDashboardRepository implements DashboardRepository {

    private localStorage:WindowLocalStorage = null;

    constructor(defaults:DefaultDashboards) {
      this.localStorage = Core.getLocalStorage();

      if ('userDashboards' in this.localStorage) {
        // log.info("Found previously saved dashboards");
      } else {
        this.storeDashboards(defaults.getAll());
      }
    }

    private loadDashboards() {
      var answer = angular.fromJson(localStorage['userDashboards']);
      if (answer.length === 0) {
        answer.push(this.createDashboard({}));
      }
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
        var existing = dashboards.findIndex((d) => { return d.id === dash.id; });
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
        dashboards.remove((i) => { return i.id === item.id; });
      });
      fn(this.storeDashboards(dashboards));
    }

    public getDashboards(fn) {
      fn(this.loadDashboards());
    }

    public getDashboard(id:string, fn) {
      var dashboards = this.loadDashboards();
      var dashboard = dashboards.find((dashboard) => { return dashboard.id === id });
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
      var newDashboard = Object.clone(dashboard);
      newDashboard['id'] = Core.getUUID();
      newDashboard['title'] = "Copy of " + dashboard.title;
      return newDashboard;
    }

    public getType() {
      return 'container';
    }
  }

}
