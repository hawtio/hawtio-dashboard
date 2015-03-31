/// <reference path="../defs.d.ts"/>

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
/// <reference path="../../includes.ts"/>
var DevExample;
(function (DevExample) {
    DevExample.pluginName = "hawtio-test-plugin";
    DevExample.log = Logger.get(DevExample.pluginName);
    DevExample.templatePath = "test-plugins/example/html";
})(DevExample || (DevExample = {}));

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
/// <reference path="../../includes.ts"/>
/// <reference path="exampleGlobals.ts"/>
var DevExample;
(function (DevExample) {
    DevExample._module = angular.module(DevExample.pluginName, []);
    var tab = undefined;
    var testDashboards = '[{"title":"Test Dashboard One","group":"Personal","widgets":[{"id":"w1","title":"","row":1,"col":1,"size_x":2,"size_y":2,"path":"/test_example/page1","include":"test-plugins/example/html/page1.html","search":{"main-tab":"hawtio-test-plugin"},"hash":""},{"id":"w2","title":"","row":1,"col":3,"size_x":2,"size_y":2,"path":"/test_example/page2","include":"test-plugins/example/html/page2.html","search":{"main-tab":"hawtio-test-plugin","sub-tab":"hawtio-test-plugin-page2"},"hash":""}],"id":"5120d5d69a0cf19ae6","hash":"?main-tab=dashboard&sub-tab=dashboard-5120d5d69a0cf19ae6"},{"title":"Test Dashboard Two","group":"Personal","widgets":[{"id":"w1","title":"A thing.  With a name.","row":1,"col":1,"size_x":2,"size_y":2,"path":"/test_example/page1","include":"test-plugins/example/html/page1.html","search":{"main-tab":"hawtio-test-plugin"},"hash":""},{"id":"w2","title":"Some Instance of Something","row":1,"col":3,"size_x":2,"size_y":2,"path":"/test_example/page1","include":"test-plugins/example/html/page1.html","search":{"main-tab":"hawtio-test-plugin"},"hash":""},{"id":"w3","title":"","row":1,"col":5,"size_x":2,"size_y":2,"path":"/test_example/page1","include":"test-plugins/example/html/page1.html","search":{"main-tab":"hawtio-test-plugin"},"hash":""},{"id":"w4","title":"","row":3,"col":3,"size_x":2,"size_y":2,"path":"/test_example/page1","include":"test-plugins/example/html/page1.html","search":{"main-tab":"hawtio-test-plugin"},"hash":""},{"id":"w5","title":"","row":1,"col":7,"size_x":2,"size_y":2,"path":"/test_example/page2","include":"test-plugins/example/html/page2.html","search":{"main-tab":"hawtio-test-plugin","sub-tab":"hawtio-test-plugin-page2"},"hash":""}],"id":"5120d5ef26e661afe4","hash":"?main-tab=dashboard&sub-tab=dashboard-5120d5ef26e661afe4"},{"title":"Test Dashboard Three","group":"Personal","widgets":[{"id":"w1","title":"I have a name!","row":1,"col":1,"size_x":2,"size_y":2,"path":"/test_example/page1","include":"test-plugins/example/html/page1.html","search":{"main-tab":"hawtio-test-plugin"},"hash":""},{"id":"w2","title":"","row":1,"col":3,"size_x":2,"size_y":2,"path":"/test_example/page1","include":"test-plugins/example/html/page1.html","search":{"main-tab":"hawtio-test-plugin"},"hash":""},{"id":"w3","title":"This is my title","row":1,"col":5,"size_x":2,"size_y":2,"path":"/test_example/page2","include":"test-plugins/example/html/page2.html","search":{"main-tab":"hawtio-test-plugin","sub-tab":"hawtio-test-plugin-page2"},"hash":""}],"id":"5120d5fa6488911695","hash":"?main-tab=dashboard&sub-tab=dashboard-5120d5fa6488911695"}]';
    DevExample._module.config(["$locationProvider", "$routeProvider", "HawtioNavBuilderProvider", function ($locationProvider, $routeProvider, builder) {
        tab = builder.create().id(DevExample.pluginName).title(function () { return "Example Controllers"; }).href(function () { return "/test_example"; }).subPath("Page 1", "page1", builder.join(DevExample.templatePath, "page1.html")).subPath("Page 2", "page2", builder.join(DevExample.templatePath, "page2.html")).subPath("Embed IFrame", "page3", builder.join(DevExample.templatePath, "page3.html")).build();
        builder.configureRouting($routeProvider, tab);
    }]);
    DevExample._module.run(["HawtioNav", 'DefaultDashboards', function (HawtioNav, defaults) {
        var myDefaults = angular.fromJson(testDashboards);
        myDefaults.forEach(function (dashboard) {
            defaults.add(dashboard);
        });
        HawtioNav.add(tab);
        HawtioNav.add({
            id: 'project-link',
            isSelected: function () { return false; },
            title: function () { return 'github'; },
            attributes: {
                class: 'pull-right'
            },
            linkAttributes: {
                target: '_blank'
            },
            href: function () { return 'https://github.com/hawtio/hawtio-dashboard'; }
        });
        HawtioNav.add({
            id: 'hawtio-link',
            isSelected: function () { return false; },
            title: function () { return 'hawtio'; },
            attributes: {
                class: 'pull-right'
            },
            linkAttributes: {
                target: '_blank'
            },
            href: function () { return 'http://hawt.io'; }
        });
        DevExample.log.debug("loaded");
    }]);
    hawtioPluginLoader.addModule(DevExample.pluginName);
})(DevExample || (DevExample = {}));

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
var DevExample;
(function (DevExample) {
    DevExample.Page1Controller = DevExample._module.controller("DevExample.Page1Controller", ["$scope", "$routeParams", "$location", "HawtioDashboard", function ($scope, $routeParams, $location, dash) {
        $scope.inDashboard = dash.inDashboard;
        DevExample.log.debug("$routeParams: ", $routeParams);
        $scope.routeParams = $routeParams;
        $scope.location = $location;
        $scope.target = "World!";
        $scope.addToDashboardLink = function () {
            var href = new URI();
            var target = new URI("/dashboard/add").search({
                'main-tab': 'dashboard',
                'sub-tab': 'dashboard-manage',
                'href': href.toString().escapeURL(true)
            });
            return target.toString();
        };
    }]);
})(DevExample || (DevExample = {}));

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
var DevExample;
(function (DevExample) {
    DevExample.Page1Controller = DevExample._module.controller("DevExample.Page2Controller", ["$scope", "$routeParams", "$location", "HawtioDashboard", function ($scope, $routeParams, $location, dash) {
        $scope.inDashboard = dash.inDashboard;
        DevExample.log.debug("$routeParams: ", $routeParams);
        $scope.routeParams = $routeParams;
        $scope.location = $location;
        $scope.target = "World!";
        $scope.addToDashboardLink = function () {
            var href = new URI();
            var target = new URI("/dashboard/add").search({
                'main-tab': 'dashboard',
                'sub-tab': 'dashboard-manage',
                'href': href.toString().escapeURL(true)
            });
            return target.toString();
        };
    }]);
})(DevExample || (DevExample = {}));

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
var DevExample;
(function (DevExample) {
    DevExample.Page1Controller = DevExample._module.controller("DevExample.Page3Controller", ["$scope", "$routeParams", "$location", "HawtioDashboard", function ($scope, $routeParams, $location, dash) {
        $scope.config = {
            properties: {
                widgetTitle: {
                    type: 'string',
                    default: 'Embedded Page'
                },
                widgetUrl: {
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
        };
        $scope.widgetConfig = {
            url: '',
            title: '',
            size_x: 0,
            size_y: 0
        };
        $scope.addToDashboard = function () {
            $location.url($scope.addToDashboardLink());
        };
        $scope.addToDashboardLink = function () {
            var iframe = $scope.widgetConfig.widgetUrl.escapeURL();
            var size = angular.toJson({
                size_x: $scope.widgetConfig.size_x,
                size_y: $scope.widgetConfig.size_y
            }).escapeURL();
            var target = new URI("/dashboard/add").search({
                'main-tab': 'dashboard',
                'sub-tab': 'dashboard-manage',
                'iframe': iframe,
                'size': size,
                'title': $scope.widgetConfig.widgetTitle.escapeURL()
            });
            return target.toString();
        };
    }]);
})(DevExample || (DevExample = {}));

angular.module("hawtio-dashboard-test-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("test-plugins/example/html/page1.html","<div class=\"row\">\n  <div class=\"col-md-12\" ng-controller=\"DevExample.Page1Controller\">\n    <h1>Some Controller (1)</h1>\n    <div ng-hide=\"inDashboard\">\n      <p><a ng-href=\"{{addToDashboardLink()}}\">Add this view to a dashboard</a></p>\n    </div>\n    <p>Path: {{location.path()}}</p>\n    <p>Search: {{location.search()}}</p>\n    <p>Route Params:\n      <pre>{{routeParams}}</pre>\n    </p>\n  </div>\n</div>\n");
$templateCache.put("test-plugins/example/html/page2.html","<div class=\"row\">\n  <div class=\"col-md-12\" ng-controller=\"DevExample.Page2Controller\">\n    <h1>Some Controller(2)</h1>\n    <div ng-hide=\"inDashboard\">\n      <p><a ng-href=\"{{addToDashboardLink()}}\">Add this view to a dashboard</a></p>\n    </div>\n    <p>Path: {{location.path()}}</p>\n    <p>Search: {{location.search()}}</p>\n    <p>Route Params:\n      <pre>{{routeParams}}</pre>\n    </p>\n  </div>\n</div>\n");
$templateCache.put("test-plugins/example/html/page3.html","<div class=\"row\">\n  <div class=\"col-md-4\" ng-controller=\"DevExample.Page3Controller\">\n    <h1>Embed existing page into dashboard</h1>\n    <div hawtio-form-2=\"config\" entity=\"widgetConfig\"></div>\n    <button class=\"btn btn-primary pull-right\" ng-click=\"addToDashboard()\">Go</button>\n  </div>\n</div>\n");}]); hawtioPluginLoader.addModule("hawtio-dashboard-test-templates");