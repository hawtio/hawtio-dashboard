## hawtio-dashboard

[![Circle CI](https://circleci.com/gh/hawtio/hawtio-dashboard.svg?style=svg)](https://circleci.com/gh/hawtio/hawtio-dashboard)

<a class="btn btn-primary" href="http://dashboard.hawt.io">View Demo</a>

This module contains the dashboard widget for hawtio v2.

Out of the box the backend used to store dashboards is in browser local storage.  However it's easily possible to override this storage method with any other backend, for example:


```
  var _module = angular.module('MyThing', []);
  _module.config(['$provide', function($provide) {

    // Inject the 'DefaultDashboards' service to get a handle on any default dashboard configs
    // that plugins register
    $provide.decorator('dashboardRepository', ['$delegate', 'DefaultDashboards', function($delegate, defaults) {
      var myDashboard = {
        // implement the DashboardRepository interface here
      }
      return myDashboard

    }]);
  }]);

```

The interface that the `dashboardRepository` service needs to implement is defined [here](https://github.com/hawtio/hawtio-dashboard/blob/master/plugins/dashboard/ts/dashboardInterfaces.ts#L39-47)
