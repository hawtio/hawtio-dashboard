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

  export var Page1Controller = _module.controller("DevExample.Page3Controller", ["$scope", "$routeParams", "$location", "HawtioDashboard", ($scope, $routeParams, $location, dash) => {

    $scope.config = {
      properties: {
        widgetTitle: {
          type: 'string',
          default: 'Embedded Page'
        },
        widgetUrl:  {
          type: 'string',
          default: 'http://localhost:2772/test_example/page3'
        },
        size_x: {
          type: 'number',
          default: 2
        },
        size_y: {
          type: 'number',
          default: 2
        }
      }
    }
    $scope.widgetConfig = {
      url: '',
      title: '',
      size_x: 0,
      size_y: 0
    }

    $scope.addToDashboard = () => {
      $location.url($scope.addToDashboardLink());
    }

    $scope.addToDashboardLink = () => {
      var iframe = $scope.widgetConfig.widgetUrl.escapeURL();
      var size = angular.toJson({
        size_x: $scope.widgetConfig.size_x,
        size_y: $scope.widgetConfig.size_y
      }).escapeURL();
      var target = new URI("/dashboard/add").search(<any>{
        'main-tab': 'dashboard',
        'sub-tab': 'dashboard-manage',
        'iframe': iframe,
        'size': size,
        'title': $scope.widgetConfig.widgetTitle.escapeURL()
      });
      return target.toString();
    }
  }]);

}
