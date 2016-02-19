/// Copyright 2014-2015 Red Hat, Inc. and/or its affiliates
/// and other contributors as indicated by the @author tags.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.

/// <reference path="examplePlugin.ts"/>
module DevExample {

  export var Page1Controller = _module.controller("DevExample.Page2Controller", ["$scope", "$routeParams", "$location", "HawtioDashboard", ($scope, $routeParams, $location, dash) => {
    $scope.inDashboard = dash.inDashboard;
    log.debug("$routeParams: ", $routeParams);
    $scope.routeParams = $routeParams;
    $scope.location = $location;
    $scope.target = "World!";

    $scope.addToDashboardLink = () => {
      var href = new URI();
      var target = new URI("/dashboard/add").search({
        'main-tab': 'dashboard',
        'sub-tab': 'dashboard-manage',
        'href': URI.encodeReserved(href.toString())
      });
      return target.toString();
    }
  }]);

}
