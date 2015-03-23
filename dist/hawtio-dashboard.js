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




var Dashboard;
(function (Dashboard) {
    Dashboard.log = Logger.get('Dashboard');
    function cleanDashboardData(item) {
        var cleanItem = {};
        angular.forEach(item, function (value, key) {
            if (!angular.isString(key) || (!key.startsWith("$") && !key.startsWith("_"))) {
                cleanItem[key] = value;
            }
        });
        return cleanItem;
    }
    Dashboard.cleanDashboardData = cleanDashboardData;
    function decodeURIComponentProperties(hash) {
        if (!hash) {
            return hash;
        }
        var decodeHash = {};
        angular.forEach(hash, function (value, key) {
            decodeHash[key] = value ? decodeURIComponent(value) : value;
        });
        return decodeHash;
    }
    Dashboard.decodeURIComponentProperties = decodeURIComponentProperties;
    function onOperationComplete(result) {
        console.log("Completed adding the dashboard with response " + JSON.stringify(result));
    }
    Dashboard.onOperationComplete = onOperationComplete;
})(Dashboard || (Dashboard = {}));

var Dashboard;
(function (Dashboard) {
    Dashboard.templatePath = 'plugins/dashboard/html/';
    Dashboard.pluginName = 'dashboard';
    Dashboard._module = angular.module(Dashboard.pluginName, []);
    Dashboard._module.config(["$routeProvider", function ($routeProvider) {
        $routeProvider.when('/dashboard/add', { templateUrl: Dashboard.templatePath + 'addToDashboard.html' }).when('/dashboard/edit', { templateUrl: Dashboard.templatePath + 'editDashboards.html' }).when('/dashboard/idx/:dashboardIndex', { templateUrl: Dashboard.templatePath + 'dashboard.html' }).when('/dashboard/id/:dashboardId', { templateUrl: Dashboard.templatePath + 'dashboard.html' }).when('/dashboard/id/:dashboardId/share', { templateUrl: Dashboard.templatePath + 'share.html' }).when('/dashboard/import', { templateUrl: Dashboard.templatePath + 'import.html' });
    }]);
    Dashboard._module.value('ui.config', {
        jq: {
            gridster: {
                widget_margins: [10, 10],
                widget_base_dimensions: [140, 140]
            }
        }
    });
    Dashboard._module.run(["HawtioNav", "viewRegistry", function (nav, viewRegistry) {
        var builder = nav.builder();
        var tab = builder.id(Dashboard.pluginName).href(function () { return '/dashboard/idx/0'; }).title(function () { return 'Dashboard'; }).build();
        nav.add(tab);
        viewRegistry['dashboard'] = UrlHelpers.join(Dashboard.templatePath, 'layoutDashboard.html');
    }]);
    hawtioPluginLoader.addModule(Dashboard.pluginName);
})(Dashboard || (Dashboard = {}));

var Dashboard;
(function (Dashboard) {
    Dashboard._module.factory('dashboardRepository', [function () {
        return new LocalDashboardRepository();
    }]);
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
    var LocalDashboardRepository = (function () {
        function LocalDashboardRepository() {
            this.localStorage = null;
            this.localStorage = Core.getLocalStorage();
            delete this.localStorage['userDashboards'];
            if ('userDashboards' in this.localStorage) {
            }
            else {
                this.storeDashboards(defaultDashboards);
            }
        }
        LocalDashboardRepository.prototype.loadDashboards = function () {
            var answer = angular.fromJson(localStorage['userDashboards']);
            if (answer.length === 0) {
                answer.push(this.createDashboard({}));
            }
            Dashboard.log.debug("returning dashboards: ", answer);
            return answer;
        };
        LocalDashboardRepository.prototype.storeDashboards = function (dashboards) {
            Dashboard.log.debug("storing dashboards: ", dashboards);
            localStorage['userDashboards'] = angular.toJson(dashboards);
            return this.loadDashboards();
        };
        LocalDashboardRepository.prototype.putDashboards = function (array, commitMessage, fn) {
            var dashboards = this.loadDashboards();
            array.forEach(function (dash) {
                var existing = dashboards.findIndex(function (d) {
                    return d.id === dash.id;
                });
                if (existing >= 0) {
                    dashboards[existing] = dash;
                }
                else {
                    dashboards.push(dash);
                }
            });
            fn(this.storeDashboards(dashboards));
        };
        LocalDashboardRepository.prototype.deleteDashboards = function (array, fn) {
            var dashboards = this.loadDashboards();
            angular.forEach(array, function (item) {
                dashboards.remove(function (i) {
                    return i.id === item.id;
                });
            });
            fn(this.storeDashboards(dashboards));
        };
        LocalDashboardRepository.prototype.getDashboards = function (fn) {
            fn(this.loadDashboards());
        };
        LocalDashboardRepository.prototype.getDashboard = function (id, fn) {
            var dashboards = this.loadDashboards();
            var dashboard = dashboards.find(function (dashboard) {
                return dashboard.id === id;
            });
            fn(dashboard);
        };
        LocalDashboardRepository.prototype.createDashboard = function (options) {
            var answer = {
                title: "New Dashboard",
                group: "Personal",
                widgets: []
            };
            answer = angular.extend(answer, options);
            answer['id'] = Core.getUUID();
            return answer;
        };
        LocalDashboardRepository.prototype.cloneDashboard = function (dashboard) {
            var newDashboard = Object.clone(dashboard);
            newDashboard['id'] = Core.getUUID();
            newDashboard['title'] = "Copy of " + dashboard.title;
            return newDashboard;
        };
        LocalDashboardRepository.prototype.getType = function () {
            return 'container';
        };
        return LocalDashboardRepository;
    })();
    Dashboard.LocalDashboardRepository = LocalDashboardRepository;
})(Dashboard || (Dashboard = {}));

var Dashboard;
(function (Dashboard) {
    Dashboard._module.controller("Dashboard.EditDashboardsController", ["$scope", "$routeParams", "$route", "$location", "$rootScope", "dashboardRepository", function ($scope, $routeParams, $route, $location, $rootScope, dashboardRepository) {
        $scope.selectedItems = [];
        $scope.repository = dashboardRepository;
        $scope.selectedProfilesDialog = [];
        $scope._dashboards = [];
        $rootScope.$on('dashboardsUpdated', dashboardLoaded);
        $scope.hasUrl = function () {
            return ($scope.url) ? true : false;
        };
        $scope.hasSelection = function () {
            return $scope.selectedItems.length !== 0;
        };
        $scope.gridOptions = {
            selectedItems: $scope.selectedItems,
            showFilter: false,
            showColumnMenu: false,
            filterOptions: {
                filterText: ''
            },
            data: '_dashboards',
            selectWithCheckboxOnly: true,
            showSelectionCheckbox: true,
            columnDefs: [
                {
                    field: 'title',
                    displayName: 'Dashboard',
                    cellTemplate: '<div class="ngCellText"><a ng-href="#/dashboard/id/{{row.getProperty(' + "'id'" + ')}}{{hash}}"><editable-property class="inline-block" on-save="onDashRenamed(row.entity)" property="title" ng-model="row.entity"></editable-property></a></div>'
                },
                {
                    field: 'group',
                    displayName: 'Group'
                }
            ],
            afterSelectionChange: afterSelectionChange
        };
        $scope.onDashRenamed = function (dash) {
            dashboardRepository.putDashboards([dash], "Renamed dashboard", function (dashboards) {
                dashboardLoaded(null, dashboards);
            });
        };
        $scope.usingGit = function () {
            return dashboardRepository.getType() === 'git';
        };
        $scope.usingFabric = function () {
            return dashboardRepository.getType() === 'fabric';
        };
        $scope.usingLocal = function () {
            return dashboardRepository.getType() === 'container';
        };
        if ($scope.usingFabric()) {
            $scope.gridOptions.columnDefs.add([{
                field: 'versionId',
                displayName: 'Version'
            }, {
                field: 'profileId',
                displayName: 'Profile'
            }, {
                field: 'fileName',
                displayName: 'File Name'
            }]);
        }
        $scope.$on("$routeChangeSuccess", function (event, current, previous) {
            setTimeout(updateData, 100);
        });
        $scope.goBack = function () {
            var href = Core.trimLeading($scope.url, "#");
            if (href) {
                $location.url(href);
            }
        };
        $scope.duplicateToProfiles = function () {
            if ($scope.hasSelection()) {
                $scope.duplicateDashboards.open();
            }
        };
        $scope.doDuplicateToProfiles = function () {
            $scope.duplicateDashboards.close();
            var newDashboards = [];
            $scope.selectedItems.forEach(function (dashboard) {
                $scope.selectedProfilesDialog.forEach(function (profile) {
                    var newDash = dashboardRepository.cloneDashboard(dashboard);
                    newDash['profileId'] = profile.id;
                    newDash['title'] = dashboard.title;
                    newDashboards.push(newDash);
                });
            });
            var commitMessage = "Duplicating " + $scope.selectedItems.length + " dashboards to " + $scope.selectedProfilesDialog.length + " profiles";
            dashboardRepository.putDashboards(newDashboards, commitMessage, function (dashboards) {
                deselectAll();
                dashboardLoaded(null, dashboards);
            });
        };
        $scope.addViewToDashboard = function () {
            var nextHref = null;
            angular.forEach($scope.selectedItems, function (selectedItem) {
                var text = $scope.url;
                var query = null;
                if (text) {
                    var idx = text.indexOf('?');
                    if (idx && idx > 0) {
                        query = text.substring(idx + 1);
                        text = text.substring(0, idx);
                    }
                    text = Core.trimLeading(text, "#");
                }
                var search = {};
                if (query) {
                    var expressions = query.split("&");
                    angular.forEach(expressions, function (expression) {
                        if (expression) {
                            var names = expression.split("=");
                            var key = names[0];
                            var value = names.length > 1 ? names[1] : null;
                            if (value) {
                                value = encodeURIComponent(value);
                            }
                            var old = search[key];
                            if (old) {
                                if (!angular.isArray(old)) {
                                    old = [old];
                                    search[key] = old;
                                }
                                old.push(value);
                            }
                            else {
                                search[key] = value;
                            }
                        }
                    });
                }
                if ($route && $route.routes) {
                    var value = $route.routes[text];
                    if (value) {
                        var templateUrl = value["templateUrl"];
                        if (templateUrl) {
                            if (!selectedItem.widgets) {
                                selectedItem.widgets = [];
                            }
                            var nextNumber = selectedItem.widgets.length + 1;
                            var widget = {
                                id: "w" + nextNumber,
                                title: "",
                                row: 1,
                                col: 1,
                                size_x: 1,
                                size_y: 1,
                                path: Core.trimLeading(text, "/"),
                                include: templateUrl,
                                search: search,
                                hash: ""
                            };
                            if ($scope.widgetTitle) {
                                widget.title = $scope.widgetTitle;
                            }
                            var gridWidth = 0;
                            selectedItem.widgets.forEach(function (w) {
                                var rightSide = w.col + w.size_x;
                                if (rightSide > gridWidth) {
                                    gridWidth = rightSide;
                                }
                            });
                            if ($scope.preferredSize) {
                                widget.size_x = parseInt($scope.preferredSize['size_x']);
                                widget.size_y = parseInt($scope.preferredSize['size_y']);
                            }
                            var found = false;
                            var left = function (w) {
                                return w.col;
                            };
                            var right = function (w) {
                                return w.col + w.size_x - 1;
                            };
                            var top = function (w) {
                                return w.row;
                            };
                            var bottom = function (w) {
                                return w.row + w.size_y - 1;
                            };
                            var collision = function (w1, w2) {
                                return !(left(w2) > right(w1) || right(w2) < left(w1) || top(w2) > bottom(w1) || bottom(w2) < top(w1));
                            };
                            if (selectedItem.widgets.isEmpty()) {
                                found = true;
                            }
                            while (!found) {
                                widget.col = 1;
                                if (widget.col + widget.size_x > gridWidth) {
                                    selectedItem.widgets.forEach(function (w, idx) {
                                        if (widget.row <= w.row) {
                                            widget.row++;
                                        }
                                    });
                                    found = true;
                                }
                                for (; (widget.col + widget.size_x) <= gridWidth; widget.col++) {
                                    if (!selectedItem.widgets.any(function (w) {
                                        var c = collision(w, widget);
                                        return c;
                                    })) {
                                        found = true;
                                        break;
                                    }
                                }
                                if (!found) {
                                    widget.row = widget.row + 1;
                                }
                                if (widget.row > 50) {
                                    found = true;
                                }
                            }
                            if ($scope.routeParams) {
                                widget['routeParams'] = $scope.routeParams;
                            }
                            selectedItem.widgets.push(widget);
                            if (!nextHref && selectedItem.id) {
                                nextHref = "/dashboard/id/" + selectedItem.id;
                            }
                        }
                    }
                    else {
                    }
                }
            });
            var commitMessage = "Add widget";
            dashboardRepository.putDashboards($scope.selectedItems, commitMessage, function (dashboards) {
                if (nextHref) {
                    delete $location.search()["href"];
                    $location.path(nextHref);
                    Core.$apply($scope);
                }
            });
        };
        $scope.create = function () {
            var counter = dashboards().length + 1;
            var title = "Untitled" + counter;
            var newDash = dashboardRepository.createDashboard({ title: title });
            dashboardRepository.putDashboards([newDash], "Created new dashboard: " + title, function (dashboards) {
                deselectAll();
                dashboardLoaded(null, dashboards);
            });
        };
        $scope.duplicate = function () {
            var newDashboards = [];
            var commitMessage = "Duplicated dashboard(s) ";
            angular.forEach($scope.selectedItems, function (item, idx) {
                var commitMessage = "Duplicated dashboard " + item.title;
                var newDash = dashboardRepository.cloneDashboard(item);
                newDashboards.push(newDash);
            });
            deselectAll();
            commitMessage = commitMessage + newDashboards.map(function (d) {
                return d.title;
            }).join(',');
            dashboardRepository.putDashboards(newDashboards, commitMessage, function (dashboards) {
                dashboardLoaded(null, dashboards);
            });
        };
        $scope.deleteDashboard = function () {
            if ($scope.hasSelection()) {
                dashboardRepository.deleteDashboards($scope.selectedItems, function (dashboards) {
                    deselectAll();
                    dashboardLoaded(null, dashboards);
                });
            }
        };
        $scope.gist = function () {
            if ($scope.selectedItems.length > 0) {
                var id = $scope.selectedItems[0].id;
                $location.path("/dashboard/id/" + id + "/share");
            }
        };
        function updateData() {
            var url = $routeParams["href"];
            if (url) {
                $scope.url = decodeURIComponent(url);
            }
            var routeParams = $routeParams["routeParams"];
            if (routeParams) {
                $scope.routeParams = decodeURIComponent(routeParams);
            }
            var size = $routeParams["size"];
            if (size) {
                size = decodeURIComponent(size);
                $scope.preferredSize = angular.fromJson(size);
            }
            var title = $routeParams["title"];
            if (title) {
                title = decodeURIComponent(title);
                $scope.widgetTitle = title;
            }
            dashboardRepository.getDashboards(function (dashboards) {
                dashboardLoaded(null, dashboards);
            });
        }
        function dashboardLoaded(event, dashboards) {
            $scope._dashboards = dashboards;
            if (event === null) {
                $scope.$emit('dashboardsUpdated', dashboards);
            }
            Core.$apply($scope);
        }
        function dashboards() {
            return $scope._dashboards;
        }
        function afterSelectionChange(rowItem, checkAll) {
            if (checkAll === void 0) {
                $scope.gridOptions['$gridScope'].allSelected = rowItem.config.selectedItems.length == $scope._dashboards.length;
            }
            else {
                $scope.gridOptions['$gridScope'].allSelected = checkAll;
            }
        }
        function deselectAll() {
            $scope.selectedItems.splice(0);
            $scope.gridOptions['$gridScope'].allSelected = false;
        }
        updateData();
    }]);
})(Dashboard || (Dashboard = {}));

var Dashboard;
(function (Dashboard) {
    var RectangleLocation = (function () {
        function RectangleLocation(delegate, path, search, hash) {
            this.delegate = delegate;
            this._path = path;
            this._search = search;
            this._hash = hash;
        }
        RectangleLocation.prototype.absUrl = function () {
            return this.protocol() + this.host() + ":" + this.port() + this.path() + this.search();
        };
        RectangleLocation.prototype.hash = function (newHash) {
            if (newHash === void 0) { newHash = null; }
            if (newHash) {
                return this.delegate.hash(newHash).search('tab', null);
            }
            return this._hash;
        };
        RectangleLocation.prototype.host = function () {
            return this.delegate.host();
        };
        RectangleLocation.prototype.path = function (newPath) {
            if (newPath === void 0) { newPath = null; }
            if (newPath) {
                return this.delegate.path(newPath).search('tab', null);
            }
            return this._path;
        };
        RectangleLocation.prototype.port = function () {
            return this.delegate.port();
        };
        RectangleLocation.prototype.protocol = function () {
            return this.delegate.port();
        };
        RectangleLocation.prototype.replace = function () {
            return this;
        };
        RectangleLocation.prototype.search = function (parametersMap) {
            if (parametersMap === void 0) { parametersMap = null; }
            if (parametersMap) {
                return this.delegate.search(parametersMap);
            }
            return this._search;
        };
        RectangleLocation.prototype.url = function (newValue) {
            if (newValue === void 0) { newValue = null; }
            if (newValue) {
                return this.delegate.url(newValue).search('tab', null);
            }
            return this.absUrl();
        };
        return RectangleLocation;
    })();
    Dashboard.RectangleLocation = RectangleLocation;
})(Dashboard || (Dashboard = {}));

var Dashboard;
(function (Dashboard) {
    var modules = undefined;
    Dashboard._module.directive('hawtioDashboard', function () {
        modules = hawtioPluginLoader['modules'].filter(function (name) {
            return _.isString(name) && name !== 'ng';
        });
        Dashboard.log.debug("Modules: ", modules);
        return new Dashboard.GridsterDirective();
    });
    var GridsterDirective = (function () {
        function GridsterDirective() {
            this.restrict = 'A';
            this.replace = true;
            this.controller = ["$scope", "$element", "$attrs", "$location", "$routeParams", "$injector", "$route", "$templateCache", "dashboardRepository", "$compile", "$templateRequest", function ($scope, $element, $attrs, $location, $routeParams, $injector, $route, $templateCache, dashboardRepository, $compile, $templateRequest) {
                $scope.route = $route;
                $scope.injector = $injector;
                var gridSize = 150;
                var gridMargin = 6;
                var gridHeight;
                $scope.gridX = gridSize;
                $scope.gridY = gridSize;
                $scope.widgetMap = {};
                $scope.$on('$destroy', function () {
                    angular.forEach($scope.widgetMap, function (value, key) {
                        if ('scope' in value) {
                            var scope = value['scope'];
                            scope.$destroy();
                        }
                    });
                });
                updateWidgets();
                $scope.removeWidget = function (widget) {
                    var gridster = getGridster();
                    var widgetElem = null;
                    var widgetData = $scope.widgetMap[widget.id];
                    if (widgetData) {
                        delete $scope.widgetMap[widget.id];
                        var scope = widgetData.scope;
                        widgetElem = widgetData.widget;
                        if (scope) {
                            scope.$destroy();
                        }
                    }
                    if (!widgetElem) {
                        widgetElem = $("div").find("[data-widgetId='" + widget.id + "']").parent();
                    }
                    if (gridster && widgetElem) {
                        gridster.remove_widget(widgetElem);
                    }
                    if ($scope.dashboard) {
                        var widgets = $scope.dashboard.widgets;
                        if (widgets) {
                            widgets.remove(widget);
                        }
                    }
                    updateDashboardRepository("Removed widget " + widget.title);
                };
                function changeWidgetSize(widget, sizefunc, savefunc) {
                    var gridster = getGridster();
                    var entry = $scope.widgetMap[widget.id];
                    var w = entry.widget;
                    var scope = entry.scope;
                    sizefunc(entry);
                    gridster.resize_widget(w, entry.size_x, entry.size_y);
                    gridster.set_dom_grid_height();
                    setTimeout(function () {
                        var template = $templateCache.get("widgetTemplate");
                        var div = $('<div></div>');
                        div.html(template);
                        w.html($compile(div.contents())(scope));
                        makeResizable();
                        Core.$apply($scope);
                        setTimeout(function () {
                            savefunc(widget);
                        }, 50);
                    }, 30);
                }
                $scope.onWidgetRenamed = function (widget) {
                    updateDashboardRepository("Renamed widget to " + widget.title);
                };
                function updateWidgets() {
                    $scope.id = $routeParams["dashboardId"];
                    $scope.idx = $routeParams["dashboardIndex"];
                    if ($scope.id) {
                        $scope.$emit('loadDashboards');
                        dashboardRepository.getDashboard($scope.id, onDashboardLoad);
                    }
                    else {
                        dashboardRepository.getDashboards(function (dashboards) {
                            $scope.$emit('dashboardsUpdated', dashboards);
                            var idx = $scope.idx ? parseInt($scope.idx) : 0;
                            var id = null;
                            if (dashboards.length > 0) {
                                var dashboard = dashboards.length > idx ? dashboards[idx] : dashboard[0];
                                id = dashboard.id;
                            }
                            if (id) {
                                $location.path("/dashboard/id/" + id);
                            }
                            else {
                                $location.path("/dashboard/edit?tab=dashboard");
                            }
                            Core.$apply($scope);
                        });
                    }
                }
                function onDashboardLoad(dashboard) {
                    $scope.dashboard = dashboard;
                    var widgets = ((dashboard) ? dashboard.widgets : null) || [];
                    var minHeight = 10;
                    var minWidth = 6;
                    angular.forEach(widgets, function (widget) {
                        if (angular.isDefined(widget.row) && minHeight < widget.row) {
                            minHeight = widget.row + 1;
                        }
                        if (angular.isDefined(widget.size_x && angular.isDefined(widget.col))) {
                            var rightEdge = widget.col + widget.size_x;
                            if (rightEdge > minWidth) {
                                minWidth = rightEdge + 1;
                            }
                        }
                    });
                    var gridster = $element.gridster({
                        widget_margins: [gridMargin, gridMargin],
                        widget_base_dimensions: [$scope.gridX, $scope.gridY],
                        extra_rows: minHeight,
                        extra_cols: minWidth,
                        max_size_x: minWidth,
                        max_size_y: minHeight,
                        draggable: {
                            stop: function (event, ui) {
                                if (serializeDashboard()) {
                                    updateDashboardRepository("Changing dashboard layout");
                                }
                            }
                        }
                    }).data('gridster');
                    var template = $templateCache.get("widgetTemplate");
                    var remaining = widgets.length;
                    function maybeFinishUp() {
                        remaining = remaining - 1;
                        if (remaining === 0) {
                            makeResizable();
                            getGridster().enable();
                            Core.$apply($scope);
                        }
                    }
                    angular.forEach(widgets, function (widget) {
                        var path = widget.path;
                        var search = null;
                        if (widget.search) {
                            search = Dashboard.decodeURIComponentProperties(widget.search);
                        }
                        if (widget.routeParams) {
                            _.extend(search, angular.fromJson(widget.routeParams));
                        }
                        var hash = widget.hash;
                        var location = new Dashboard.RectangleLocation($location, path, search, hash);
                        var tmpModuleName = 'dashboard-' + widget.id;
                        var tmpModule = angular.module(tmpModuleName, modules);
                        tmpModule.config(['$provide', function ($provide) {
                            $provide.decorator('$location', ['$delegate', function ($delegate) {
                                return location;
                            }]);
                            $provide.decorator('$route', ['$delegate', function ($delegate) {
                                return $delegate;
                            }]);
                            $provide.decorator('$routeParams', ['$delegate', function ($delegate) {
                                return search;
                            }]);
                        }]);
                        if (!widget.size_x || widget.size_x < 1) {
                            widget.size_x = 1;
                        }
                        if (!widget.size_y || widget.size_y < 1) {
                            widget.size_y = 1;
                        }
                        var div = $('<div></div>');
                        div.html(template);
                        var body = div.find('.widget-body');
                        var widgetBody = $templateRequest(widget.include);
                        widgetBody.then(function (widgetBody) {
                            var outerDiv = angular.element($templateCache.get('widgetBlockTemplate.html'));
                            body.html(widgetBody);
                            outerDiv.html(body);
                            angular.bootstrap(body, [tmpModuleName]);
                            var w = gridster.add_widget(outerDiv, widget.size_x, widget.size_y, widget.col, widget.row);
                            $scope.widgetMap[widget.id] = {
                                widget: w
                            };
                            maybeFinishUp();
                        });
                    });
                }
                function serializeDashboard() {
                    var gridster = getGridster();
                    if (gridster) {
                        var data = gridster.serialize();
                        var widgets = $scope.dashboard.widgets || [];
                        angular.forEach(widgets, function (widget, idx) {
                            var value = data[idx];
                            if (value && widget) {
                                angular.forEach(value, function (attr, key) { return widget[key] = attr; });
                            }
                        });
                        return true;
                    }
                    return false;
                }
                function makeResizable() {
                }
                function resizeBlock(elmObj) {
                    var area = elmObj.find('.widget-area');
                    var w = elmObj.width() - gridSize;
                    var h = elmObj.height() - gridSize;
                    for (var grid_w = 1; w > 0; w -= (gridSize + (gridMargin * 2))) {
                        grid_w++;
                    }
                    for (var grid_h = 1; h > 0; h -= (gridSize + (gridMargin * 2))) {
                        grid_h++;
                    }
                    var widget = {
                        id: area.attr('data-widgetId')
                    };
                    changeWidgetSize(widget, function (widget) {
                        widget.size_x = grid_w;
                        widget.size_y = grid_h;
                    }, function (widget) {
                        if (serializeDashboard()) {
                            updateDashboardRepository("Changed size of widget: " + widget.id);
                        }
                    });
                }
                function updateDashboardRepository(message) {
                    if ($scope.dashboard) {
                        var commitMessage = message;
                        if ($scope.dashboard && $scope.dashboard.title) {
                            commitMessage += " on dashboard " + $scope.dashboard.title;
                        }
                        dashboardRepository.putDashboards([$scope.dashboard], commitMessage, Dashboard.onOperationComplete);
                    }
                }
                function getGridster() {
                    return $element.gridster().data('gridster');
                }
            }];
        }
        return GridsterDirective;
    })();
    Dashboard.GridsterDirective = GridsterDirective;
})(Dashboard || (Dashboard = {}));

var Dashboard;
(function (Dashboard) {
    Dashboard._module.controller("Dashboard.ImportController", ["$scope", "$location", "$routeParams", "dashboardRepository", function ($scope, $location, $routeParams, dashboardRepository) {
        $scope.placeholder = "Paste the JSON here for the dashboard configuration to import...";
        $scope.source = $scope.placeholder;
        var options = {
            mode: {
                name: "javascript"
            }
        };
        $scope.isValid = function () { return $scope.source && $scope.source !== $scope.placeholder; };
        $scope.importJSON = function () {
            var json = [];
            try {
                json = JSON.parse($scope.source);
            }
            catch (e) {
                json = [];
            }
            var array = [];
            if (angular.isArray(json)) {
                array = json;
            }
            else if (angular.isObject(json)) {
                array.push(json);
            }
            if (array.length) {
                angular.forEach(array, function (dash, index) {
                    angular.copy(dash, dashboardRepository.createDashboard(dash));
                });
                dashboardRepository.putDashboards(array, "Imported dashboard JSON", Dashboard.onOperationComplete);
                $location.path("/dashboard/edit");
            }
        };
    }]);
})(Dashboard || (Dashboard = {}));

var Dashboard;
(function (Dashboard) {
    Dashboard._module.controller("Dashboard.NavBarController", ["$scope", "$routeParams", "$rootScope", "dashboardRepository", function ($scope, $routeParams, $rootScope, dashboardRepository) {
        $scope._dashboards = [];
        $scope.activeDashboard = $routeParams['dashboardId'];
        $scope.$on('loadDashboards', loadDashboards);
        $scope.$on('dashboardsUpdated', dashboardLoaded);
        $scope.dashboards = function () {
            return $scope._dashboards;
        };
        $scope.onTabRenamed = function (dash) {
            dashboardRepository.putDashboards([dash], "Renamed dashboard", function (dashboards) {
                dashboardLoaded(null, dashboards);
            });
        };
        function dashboardLoaded(event, dashboards) {
            Dashboard.log.debug("navbar dashboardLoaded: ", dashboards);
            $scope._dashboards = dashboards;
            if (event === null) {
                $rootScope.$broadcast('dashboardsUpdated', dashboards);
                Core.$apply($scope);
            }
        }
        function loadDashboards(event) {
            dashboardRepository.getDashboards(function (dashboards) {
                dashboardLoaded(null, dashboards);
                Core.$apply($scope);
            });
        }
    }]);
})(Dashboard || (Dashboard = {}));

var Dashboard;
(function (Dashboard) {
    Dashboard.ShareController = Dashboard._module.controller("Dashboard.ShareController", ["$scope", "$location", "$routeParams", "dashboardRepository", function ($scope, $location, $routeParams, dashboardRepository) {
        var id = $routeParams["dashboardId"];
        dashboardRepository.getDashboard(id, onDashboardLoad);
        var options = {
            mode: {
                name: "javascript"
            }
        };
        function onDashboardLoad(dashboard) {
            $scope.dashboard = Dashboard.cleanDashboardData(dashboard);
            $scope.json = {
                "description": "hawtio dashboards",
                "public": true,
                "files": {
                    "dashboards.json": {
                        "content": JSON.stringify($scope.dashboard, null, "  ")
                    }
                }
            };
            $scope.source = JSON.stringify($scope.dashboard, null, "  ");
            Core.$applyNowOrLater($scope);
        }
    }]);
})(Dashboard || (Dashboard = {}));

var Example;
(function (Example) {
    Example.pluginName = "hawtio-assembly";
    Example.log = Logger.get(Example.pluginName);
    Example.templatePath = "plugins/example/html";
})(Example || (Example = {}));

var Example;
(function (Example) {
    Example._module = angular.module(Example.pluginName, []);
    var tab = undefined;
    Example._module.config(["$locationProvider", "$routeProvider", "HawtioNavBuilderProvider", function ($locationProvider, $routeProvider, builder) {
        tab = builder.create().id(Example.pluginName).title(function () { return "Example"; }).href(function () { return "/example"; }).subPath("Page 1", "page1", builder.join(Example.templatePath, "page1.html")).build();
        builder.configureRouting($routeProvider, tab);
        $locationProvider.html5Mode(true);
    }]);
    Example._module.run(["HawtioNav", function (HawtioNav) {
        HawtioNav.add(tab);
        Example.log.debug("loaded");
    }]);
    hawtioPluginLoader.addModule(Example.pluginName);
})(Example || (Example = {}));

var Example;
(function (Example) {
    Example.Page1Controller = Example._module.controller("Example.Page1Controller", ["$scope", function ($scope) {
        $scope.target = "World!";
    }]);
})(Example || (Example = {}));

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluY2x1ZGVzLmpzIiwiL2hvbWUvZ2FzaGNydW1iL1dvcmsvU291cmNlL2hhd3Rpby1kYXNoYm9hcmQvZGFzaGJvYXJkL3RzL2Rhc2hib2FyZEludGVyZmFjZXMudHMiLCIvaG9tZS9nYXNoY3J1bWIvV29yay9Tb3VyY2UvaGF3dGlvLWRhc2hib2FyZC9kYXNoYm9hcmQvdHMvZGFzaGJvYXJkSGVscGVycy50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9kYXNoYm9hcmRQbHVnaW4udHMiLCIvaG9tZS9nYXNoY3J1bWIvV29yay9Tb3VyY2UvaGF3dGlvLWRhc2hib2FyZC9kYXNoYm9hcmQvdHMvZGFzaGJvYXJkUmVwb3NpdG9yeS50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9lZGl0RGFzaGJvYXJkcy50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9yZWN0YW5nbGVMb2NhdGlvbi50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9ncmlkc3RlckRpcmVjdGl2ZS50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9pbXBvcnQudHMiLCIvaG9tZS9nYXNoY3J1bWIvV29yay9Tb3VyY2UvaGF3dGlvLWRhc2hib2FyZC9kYXNoYm9hcmQvdHMvbmF2YmFyLnRzIiwiL2hvbWUvZ2FzaGNydW1iL1dvcmsvU291cmNlL2hhd3Rpby1kYXNoYm9hcmQvZGFzaGJvYXJkL3RzL3NoYXJlLnRzIiwiL2hvbWUvZ2FzaGNydW1iL1dvcmsvU291cmNlL2hhd3Rpby1kYXNoYm9hcmQvZXhhbXBsZS90cy9leGFtcGxlR2xvYmFscy50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2V4YW1wbGUvdHMvZXhhbXBsZVBsdWdpbi50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2V4YW1wbGUvdHMvcGFnZTEudHMiXSwibmFtZXMiOlsiRGFzaGJvYXJkIiwiRGFzaGJvYXJkLmNsZWFuRGFzaGJvYXJkRGF0YSIsIkRhc2hib2FyZC5kZWNvZGVVUklDb21wb25lbnRQcm9wZXJ0aWVzIiwiRGFzaGJvYXJkLm9uT3BlcmF0aW9uQ29tcGxldGUiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5IiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5jb25zdHJ1Y3RvciIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkubG9hZERhc2hib2FyZHMiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5LnN0b3JlRGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZGVsZXRlRGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkIiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5jcmVhdGVEYXNoYm9hcmQiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5LmNsb25lRGFzaGJvYXJkIiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlIiwiRGFzaGJvYXJkLnVwZGF0ZURhdGEiLCJEYXNoYm9hcmQuZGFzaGJvYXJkTG9hZGVkIiwiRGFzaGJvYXJkLmRhc2hib2FyZHMiLCJEYXNoYm9hcmQuYWZ0ZXJTZWxlY3Rpb25DaGFuZ2UiLCJEYXNoYm9hcmQuZGVzZWxlY3RBbGwiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24iLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uY29uc3RydWN0b3IiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uYWJzVXJsIiwiRGFzaGJvYXJkLlJlY3RhbmdsZUxvY2F0aW9uLmhhc2giLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uaG9zdCIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbi5wYXRoIiwiRGFzaGJvYXJkLlJlY3RhbmdsZUxvY2F0aW9uLnBvcnQiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24ucHJvdG9jb2wiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24ucmVwbGFjZSIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbi5zZWFyY2giLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24udXJsIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLmNoYW5nZVdpZGdldFNpemUiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3IudXBkYXRlV2lkZ2V0cyIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5vbkRhc2hib2FyZExvYWQiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3Iub25EYXNoYm9hcmRMb2FkLm1heWJlRmluaXNoVXAiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3Iuc2VyaWFsaXplRGFzaGJvYXJkIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLm1ha2VSZXNpemFibGUiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3IucmVzaXplQmxvY2siLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3IudXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeSIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5nZXRHcmlkc3RlciIsIkRhc2hib2FyZC5sb2FkRGFzaGJvYXJkcyIsIkRhc2hib2FyZC5vbkRhc2hib2FyZExvYWQiLCJFeGFtcGxlIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FDd0JDOztBQ3BCRCxJQUFPLFNBQVMsQ0E0Q2Y7QUE1Q0QsV0FBTyxTQUFTLEVBQUMsQ0FBQztJQUVMQSxhQUFHQSxHQUFrQkEsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0E7SUFVeERBLFNBQWdCQSxrQkFBa0JBLENBQUNBLElBQUlBO1FBQ3JDQyxJQUFJQSxTQUFTQSxHQUFHQSxFQUFFQSxDQUFDQTtRQUNuQkEsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsRUFBRUEsVUFBQ0EsS0FBS0EsRUFBRUEsR0FBR0E7WUFDL0JBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLFFBQVFBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLFVBQVVBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLFVBQVVBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUM3RUEsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0E7WUFDekJBLENBQUNBO1FBQ0hBLENBQUNBLENBQUNBLENBQUNBO1FBQ0hBLE1BQU1BLENBQUNBLFNBQVNBLENBQUNBO0lBQ25CQSxDQUFDQTtJQVJlRCw0QkFBa0JBLEdBQWxCQSxrQkFRZkEsQ0FBQUE7SUFVREEsU0FBZ0JBLDRCQUE0QkEsQ0FBQ0EsSUFBSUE7UUFDL0NFLEVBQUVBLENBQUNBLENBQUNBLENB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QUFRQSxDQUFDQSxDQUFDQTtJQUN0QkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFHSkEsa0JBQWtCQSxDQUFDQSxTQUFTQSxDQUFDQSxPQUFPQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTtBQUNuREEsQ0FBQ0EsRUF6Qk0sT0FBTyxLQUFQLE9BQU8sUUF5QmI7O0FDMUJELElBQU8sT0FBTyxDQU1iO0FBTkQsV0FBTyxPQUFPLEVBQUMsQ0FBQztJQUVIQSx1QkFBZUEsR0FBR0EsZUFBT0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EseUJBQXlCQSxFQUFFQSxDQUFDQSxRQUFRQSxFQUFFQSxVQUFDQSxNQUFNQTtRQUMzRkEsTUFBTUEsQ0FBQ0EsTUFBTUEsR0FBR0EsUUFBUUEsQ0FBQ0E7SUFDM0JBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0FBRU5BLENBQUNBLEVBTk0sT0FBTyxLQUFQLE9BQU8sUUFNYiIsImZpbGUiOiJjb21waWxlZC5qcyIsInNvdXJjZXNDb250ZW50IjpbbnVsbCwibW9kdWxlIERhc2hib2FyZCB7XG5cbiAgLyoqXG4gICAqIEJhc2UgaW50ZXJmYWNlIHRoYXQgZGFzaGJvYXJkIHJlcG9zaXRvcmllcyBtdXN0IGltcGxlbWVudFxuICAgKlxuICAgKiBAY2xhc3MgRGFzaGJvYXJkUmVwb3NpdG9yeVxuICAgKi9cbiAgZXhwb3J0IGludGVyZmFjZSBEYXNoYm9hcmRSZXBvc2l0b3J5IHtcblxuICAgIHB1dERhc2hib2FyZHM6IChhcnJheTphbnlbXSwgY29tbWl0TWVzc2FnZTpzdHJpbmcsIGZuKSA9PiBhbnk7XG5cbiAgICBkZWxldGVEYXNoYm9hcmRzOiAoYXJyYXk6YW55W10sIGZuKSA9PiBhbnk7XG5cbiAgICBnZXREYXNoYm9hcmRzOiAoZm4pID0+IGFueTtcblxuICAgIGdldERhc2hib2FyZDogKGlkOnN0cmluZywgZm4pID0+IGFueTtcblxuICAgIGNyZWF0ZURhc2hib2FyZDogKG9wdGlvbnM6YW55KSA9PiBhbnk7XG5cbiAgICBjbG9uZURhc2hib2FyZDooZGFzaGJvYXJkOmFueSkgPT4gYW55O1xuXG4gICAgZ2V0VHlwZTooKSA9PiBzdHJpbmc7XG5cbiAgfVxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vaW5jbHVkZXMudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkSW50ZXJmYWNlcy50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG5cbiAgZXhwb3J0IHZhciBsb2c6TG9nZ2luZy5Mb2dnZXIgPSBMb2dnZXIuZ2V0KCdEYXNoYm9hcmQnKTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY2xlYW5lZCB1cCB2ZXJzaW9uIG9mIHRoZSBkYXNoYm9hcmQgZGF0YSB3aXRob3V0IGFueSBVSSBzZWxlY3Rpb24gc3RhdGVcbiAgICogQG1ldGhvZCBjbGVhbkRhc2hib2FyZERhdGFcbiAgICogQHN0YXRpY1xuICAgKiBAZm9yIERhc2hib2FyZFxuICAgKiBAcGFyYW0ge2FueX0gaXRlbVxuICAgKiBAcmV0dXJuIHthbnl9XG4gICAqL1xuICBleHBvcnQgZnVuY3Rpb24gY2xlYW5EYXNoYm9hcmREYXRhKGl0ZW0pIHtcbiAgICB2YXIgY2xlYW5JdGVtID0ge307XG4gICAgYW5ndWxhci5mb3JFYWNoKGl0ZW0sICh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICBpZiAoIWFuZ3VsYXIuaXNTdHJpbmcoa2V5KSB8fCAoIWtleS5zdGFydHNXaXRoKFwiJFwiKSAmJiAha2V5LnN0YXJ0c1dpdGgoXCJfXCIpKSkge1xuICAgICAgICBjbGVhbkl0ZW1ba2V5XSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBjbGVhbkl0ZW07XG4gIH1cblxuICAvKipcbiAgICogUnVucyBkZWNvZGVVUklDb21wb25lbnQoKSBvbiBlYWNoIHZhbHVlIGluIHRoZSBvYmplY3RcbiAgICogQG1ldGhvZCBkZWNvZGVVUklDb21wb25lbnRQcm9wZXJ0aWVzXG4gICAqIEBzdGF0aWNcbiAgICogQGZvciBEYXNoYm9hcmRcbiAgICogQHBhcmFtIHthbnl9IGhhc2hcbiAgICogQHJldHVybiB7YW55fVxuICAgKi9cbiAgZXhwb3J0IGZ1bmN0aW9uIGRlY29kZVVSSUNvbXBvbmVudFByb3BlcnRpZXMoaGFzaCkge1xuICAgIGlmICghaGFzaCkge1xuICAgICAgcmV0dXJuIGhhc2g7XG4gICAgfVxuICAgIHZhciBkZWNvZGVIYXNoID0ge307XG4gICAgYW5ndWxhci5mb3JFYWNoKGhhc2gsICh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICBkZWNvZGVIYXNoW2tleV0gPSB2YWx1ZSA/IGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkgOiB2YWx1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVjb2RlSGFzaDtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBvbk9wZXJhdGlvbkNvbXBsZXRlKHJlc3VsdCkge1xuICAgIGNvbnNvbGUubG9nKFwiQ29tcGxldGVkIGFkZGluZyB0aGUgZGFzaGJvYXJkIHdpdGggcmVzcG9uc2UgXCIgKyBKU09OLnN0cmluZ2lmeShyZXN1bHQpKTtcbiAgfVxufVxuIiwiLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICogQG1haW4gRGFzaGJvYXJkXG4gKi9cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRIZWxwZXJzLnRzXCIvPlxubW9kdWxlIERhc2hib2FyZCB7XG4gIFxuICBleHBvcnQgdmFyIHRlbXBsYXRlUGF0aCA9ICdwbHVnaW5zL2Rhc2hib2FyZC9odG1sLyc7XG4gIGV4cG9ydCB2YXIgcGx1Z2luTmFtZSA9ICdkYXNoYm9hcmQnO1xuICBcbiAgZXhwb3J0IHZhciBfbW9kdWxlID0gYW5ndWxhci5tb2R1bGUocGx1Z2luTmFtZSwgW10pO1xuXG4gIF9tb2R1bGUuY29uZmlnKFtcIiRyb3V0ZVByb3ZpZGVyXCIsICgkcm91dGVQcm92aWRlcikgPT4ge1xuICAgICRyb3V0ZVByb3ZpZGVyLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9hZGQnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnYWRkVG9EYXNoYm9hcmQuaHRtbCd9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvZWRpdCcsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdlZGl0RGFzaGJvYXJkcy5odG1sJ30pLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9pZHgvOmRhc2hib2FyZEluZGV4Jywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2Rhc2hib2FyZC5odG1sJ30pLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9pZC86ZGFzaGJvYXJkSWQnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnZGFzaGJvYXJkLmh0bWwnfSkuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2lkLzpkYXNoYm9hcmRJZC9zaGFyZScsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdzaGFyZS5odG1sJ30pLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9pbXBvcnQnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnaW1wb3J0Lmh0bWwnfSk7XG4gIH1dKTtcblxuICBfbW9kdWxlLnZhbHVlKCd1aS5jb25maWcnLCB7XG4gICAgLy8gVGhlIHVpLWpxIGRpcmVjdGl2ZSBuYW1lc3BhY2VcbiAgICBqcToge1xuICAgICAgZ3JpZHN0ZXI6IHtcbiAgICAgICAgd2lkZ2V0X21hcmdpbnM6IFsxMCwgMTBdLFxuICAgICAgICB3aWRnZXRfYmFzZV9kaW1lbnNpb25zOiBbMTQwLCAxNDBdXG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBfbW9kdWxlLnJ1bihbXCJIYXd0aW9OYXZcIiwgXCJ2aWV3UmVnaXN0cnlcIiwgKG5hdjpIYXd0aW9NYWluTmF2LlJlZ2lzdHJ5LCB2aWV3UmVnaXN0cnkpID0+IHtcbiAgICB2YXIgYnVpbGRlciA9IG5hdi5idWlsZGVyKCk7XG4gICAgdmFyIHRhYiA9IGJ1aWxkZXIuaWQocGx1Z2luTmFtZSlcbiAgICAgICAgICAgICAgICAuaHJlZigoKSA9PiAnL2Rhc2hib2FyZC9pZHgvMCcpXG4gICAgICAgICAgICAgICAgLnRpdGxlKCgpID0+ICdEYXNoYm9hcmQnKVxuICAgICAgICAgICAgICAgIC5idWlsZCgpO1xuICAgIG5hdi5hZGQodGFiKTtcbiAgICB2aWV3UmVnaXN0cnlbJ2Rhc2hib2FyZCddID0gVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ2xheW91dERhc2hib2FyZC5odG1sJyk7XG4gIH1dKTtcblxuICBoYXd0aW9QbHVnaW5Mb2FkZXIuYWRkTW9kdWxlKHBsdWdpbk5hbWUpO1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRJbnRlcmZhY2VzLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcblxuICBfbW9kdWxlLmZhY3RvcnkoJ2Rhc2hib2FyZFJlcG9zaXRvcnknLCBbKCkgPT4ge1xuICAgIHJldHVybiBuZXcgTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5KCk7XG4gIH1dKTtcblxuICAvKipcbiAgICogVGhlIGRlZmF1bHQgZGFzaGJvYXJkIGRlZmluaXRpb24gaWYgbm8gc2F2ZWQgZGFzaGJvYXJkcyBhcmUgYXZhaWxhYmxlXG4gICAqXG4gICAqIEBwcm9wZXJ0eSBkZWZhdWx0RGFzaGJvYXJkc1xuICAgKiBAZm9yIERhc2hib2FyZFxuICAgKiBAdHlwZSB7YW55fVxuICAgKi9cbiAgdmFyIGRlZmF1bHREYXNoYm9hcmRzID0gW1xuXG4gICAge1xuICAgICAgXCJ0aXRsZVwiOiBcIk1vbml0b3JcIixcbiAgICAgIFwiZ3JvdXBcIjogXCJQZXJzb25hbFwiLFxuICAgICAgXCJ3aWRnZXRzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwiaWRcIjogXCJ3MVwiLFxuICAgICAgICAgIFwidGl0bGVcIjogXCJPcGVyYXRpbmcgU3lzdGVtXCIsXG4gICAgICAgICAgXCJyb3dcIjogMSxcbiAgICAgICAgICBcImNvbFwiOiAxLFxuICAgICAgICAgIFwic2l6ZV94XCI6IDMsXG4gICAgICAgICAgXCJzaXplX3lcIjogNCxcbiAgICAgICAgICBcInBhdGhcIjogXCIvZXhhbXBsZS9wYWdlMVwiLFxuICAgICAgICAgIFwiaW5jbHVkZVwiOiBcInRlc3QtcGx1Z2lucy9leGFtcGxlL2h0bWwvcGFnZTEuaHRtbFwiLFxuICAgICAgICAgIFwic2VhcmNoXCI6IHtcbiAgICAgICAgICAgIFwibmlkXCI6IFwicm9vdC1qYXZhLmxhbmctT3BlcmF0aW5nU3lzdGVtXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiaGFzaFwiOiBcIlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcImlkXCI6IFwidzNcIixcbiAgICAgICAgICBcInRpdGxlXCI6IFwiSmF2YSBIZWFwIE1lbW9yeVwiLFxuICAgICAgICAgIFwicm93XCI6IDEsXG4gICAgICAgICAgXCJjb2xcIjogNixcbiAgICAgICAgICBcInNpemVfeFwiOiAyLFxuICAgICAgICAgIFwic2l6ZV95XCI6IDIsXG4gICAgICAgICAgXCJwYXRoXCI6IFwiam14L3dpZGdldC9kb251dFwiLFxuICAgICAgICAgIFwiaW5jbHVkZVwiOiBcInRlc3QtcGx1Z2lucy9leGFtcGxlL2h0bWwvcGFnZTEuaHRtbFwiLFxuICAgICAgICAgIFwic2VhcmNoXCI6IHt9LFxuICAgICAgICAgIFwiaGFzaFwiOiBcIlwiLFxuICAgICAgICAgIFwicm91dGVQYXJhbXNcIjogXCJ7XFxcInR5cGVcXFwiOlxcXCJkb251dFxcXCIsXFxcInRpdGxlXFxcIjpcXFwiSmF2YSBIZWFwIE1lbW9yeVxcXCIsXFxcIm1iZWFuXFxcIjpcXFwiamF2YS5sYW5nOnR5cGU9TWVtb3J5XFxcIixcXFwiYXR0cmlidXRlXFxcIjpcXFwiSGVhcE1lbW9yeVVzYWdlXFxcIixcXFwidG90YWxcXFwiOlxcXCJNYXhcXFwiLFxcXCJ0ZXJtc1xcXCI6XFxcIlVzZWRcXFwiLFxcXCJyZW1haW5pbmdcXFwiOlxcXCJGcmVlXFxcIn1cIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJpZFwiOiBcInc0XCIsXG4gICAgICAgICAgXCJ0aXRsZVwiOiBcIkphdmEgTm9uIEhlYXAgTWVtb3J5XCIsXG4gICAgICAgICAgXCJyb3dcIjogMSxcbiAgICAgICAgICBcImNvbFwiOiA4LFxuICAgICAgICAgIFwic2l6ZV94XCI6IDIsXG4gICAgICAgICAgXCJzaXplX3lcIjogMixcbiAgICAgICAgICBcInBhdGhcIjogXCIvZXhhbXBsZS9wYWdlMVwiLFxuICAgICAgICAgIFwiaW5jbHVkZVwiOiBcInRlc3QtcGx1Z2lucy9leGFtcGxlL2h0bWwvcGFnZTEuaHRtbFwiLFxuICAgICAgICAgIFwic2VhcmNoXCI6IHt9LFxuICAgICAgICAgIFwiaGFzaFwiOiBcIlwiLFxuICAgICAgICAgIFwicm91dGVQYXJhbXNcIjogXCJ7XFxcInR5cGVcXFwiOlxcXCJkb251dFxcXCIsXFxcInRpdGxlXFxcIjpcXFwiSmF2YSBOb24gSGVhcCBNZW1vcnlcXFwiLFxcXCJtYmVhblxcXCI6XFxcImphdmEubGFuZzp0eXBlPU1lbW9yeVxcXCIsXFxcImF0dHJpYnV0ZVxcXCI6XFxcIk5vbkhlYXBNZW1vcnlVc2FnZVxcXCIsXFxcInRvdGFsXFxcIjpcXFwiTWF4XFxcIixcXFwidGVybXNcXFwiOlxcXCJVc2VkXFxcIixcXFwicmVtYWluaW5nXFxcIjpcXFwiRnJlZVxcXCJ9XCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwiaWRcIjogXCJ3NVwiLFxuICAgICAgICAgIFwidGl0bGVcIjogXCJcIixcbiAgICAgICAgICBcInJvd1wiOiAzLFxuICAgICAgICAgIFwiY29sXCI6IDQsXG4gICAgICAgICAgXCJzaXplX3hcIjogNixcbiAgICAgICAgICBcInNpemVfeVwiOiAyLFxuICAgICAgICAgIFwicGF0aFwiOiBcIi9leGFtcGxlL3BhZ2UxXCIsXG4gICAgICAgICAgXCJpbmNsdWRlXCI6IFwidGVzdC1wbHVnaW5zL2V4YW1wbGUvaHRtbC9wYWdlMS5odG1sXCIsXG4gICAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgICAgXCJzaXplXCI6IFwiJTdCJTIyc2l6ZV94JTIyJTNBMiUyQyUyMnNpemVfeSUyMiUzQTIlN0RcIixcbiAgICAgICAgICAgIFwidGl0bGVcIjogXCJKYXZhJTIwTm9uJTIwSGVhcCUyME1lbW9yeVwiLFxuICAgICAgICAgICAgXCJyb3V0ZVBhcmFtc1wiOiBcIiU3QiUyMnR5cGUlMjIlM0ElMjJkb251dCUyMiUyQyUyMnRpdGxlJTIyJTNBJTIySmF2YSUyME5vbiUyMEhlYXAlMjBNZW1vcnklMjIlMkMlMjJtYmVhbiUyMiUzQSUyMmphdmEubGFuZyUzQXR5cGVcIixcbiAgICAgICAgICAgIFwibmlkXCI6IFwicm9vdC1qYXZhLmxhbmctVGhyZWFkaW5nXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiaGFzaFwiOiBcIlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcImlkXCI6IFwidzZcIixcbiAgICAgICAgICBcInRpdGxlXCI6IFwiU3lzdGVtIENQVSBMb2FkXCIsXG4gICAgICAgICAgXCJyb3dcIjogMSxcbiAgICAgICAgICBcImNvbFwiOiA0LFxuICAgICAgICAgIFwic2l6ZV94XCI6IDIsXG4gICAgICAgICAgXCJzaXplX3lcIjogMixcbiAgICAgICAgICBcInBhdGhcIjogXCIvZXhhbXBsZS9wYWdlMVwiLFxuICAgICAgICAgIFwiaW5jbHVkZVwiOiBcInRlc3QtcGx1Z2lucy9leGFtcGxlL2h0bWwvcGFnZTEuaHRtbFwiLFxuICAgICAgICAgIFwic2VhcmNoXCI6IHt9LFxuICAgICAgICAgIFwiaGFzaFwiOiBcIlwiLFxuICAgICAgICAgIFwicm91dGVQYXJhbXNcIjogXCJ7XFxcInR5cGVcXFwiOlxcXCJhcmVhXFxcIixcXFwidGl0bGVcXFwiOlxcXCJTeXN0ZW0gQ1BVIExvYWRcXFwiLFxcXCJtYmVhblxcXCI6XFxcImphdmEubGFuZzp0eXBlPU9wZXJhdGluZ1N5c3RlbVxcXCIsXFxcImF0dHJpYnV0ZVxcXCI6XFxcIlN5c3RlbUNwdUxvYWRcXFwifVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImlkXCI6IFwiNGU5ZDExNjE3M2NhNDE3NjdlXCJcbiAgICB9XG5cbiAgXTtcblxuXG4gIC8qKlxuICAgKiBAY2xhc3MgTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5XG4gICAqIEB1c2VzIERhc2hib2FyZFJlcG9zaXRvcnlcbiAgICovXG4gIGV4cG9ydCBjbGFzcyBMb2NhbERhc2hib2FyZFJlcG9zaXRvcnkgaW1wbGVtZW50cyBEYXNoYm9hcmRSZXBvc2l0b3J5IHtcblxuICAgIHByaXZhdGUgbG9jYWxTdG9yYWdlOldpbmRvd0xvY2FsU3RvcmFnZSA9IG51bGw7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIHRoaXMubG9jYWxTdG9yYWdlID0gQ29yZS5nZXRMb2NhbFN0b3JhZ2UoKTtcblxuICAgICAgZGVsZXRlIHRoaXMubG9jYWxTdG9yYWdlWyd1c2VyRGFzaGJvYXJkcyddO1xuXG4gICAgICBpZiAoJ3VzZXJEYXNoYm9hcmRzJyBpbiB0aGlzLmxvY2FsU3RvcmFnZSkge1xuICAgICAgICAvLyBsb2cuaW5mbyhcIkZvdW5kIHByZXZpb3VzbHkgc2F2ZWQgZGFzaGJvYXJkc1wiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc3RvcmVEYXNoYm9hcmRzKGRlZmF1bHREYXNoYm9hcmRzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGxvYWREYXNoYm9hcmRzKCkge1xuICAgICAgdmFyIGFuc3dlciA9IGFuZ3VsYXIuZnJvbUpzb24obG9jYWxTdG9yYWdlWyd1c2VyRGFzaGJvYXJkcyddKTtcbiAgICAgIGlmIChhbnN3ZXIubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGFuc3dlci5wdXNoKHRoaXMuY3JlYXRlRGFzaGJvYXJkKHt9KSk7XG4gICAgICB9XG4gICAgICBsb2cuZGVidWcoXCJyZXR1cm5pbmcgZGFzaGJvYXJkczogXCIsIGFuc3dlcik7XG4gICAgICByZXR1cm4gYW5zd2VyO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RvcmVEYXNoYm9hcmRzKGRhc2hib2FyZHM6YW55W10pIHtcbiAgICAgIGxvZy5kZWJ1ZyhcInN0b3JpbmcgZGFzaGJvYXJkczogXCIsIGRhc2hib2FyZHMpO1xuICAgICAgbG9jYWxTdG9yYWdlWyd1c2VyRGFzaGJvYXJkcyddID0gYW5ndWxhci50b0pzb24oZGFzaGJvYXJkcyk7XG4gICAgICByZXR1cm4gdGhpcy5sb2FkRGFzaGJvYXJkcygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBwdXREYXNoYm9hcmRzKGFycmF5OmFueVtdLCBjb21taXRNZXNzYWdlOnN0cmluZywgZm4pIHtcblxuICAgICAgdmFyIGRhc2hib2FyZHMgPSB0aGlzLmxvYWREYXNoYm9hcmRzKCk7XG5cbiAgICAgIGFycmF5LmZvckVhY2goKGRhc2gpID0+IHtcbiAgICAgICAgdmFyIGV4aXN0aW5nID0gZGFzaGJvYXJkcy5maW5kSW5kZXgoKGQpID0+IHsgcmV0dXJuIGQuaWQgPT09IGRhc2guaWQ7IH0pO1xuICAgICAgICBpZiAoZXhpc3RpbmcgPj0gMCkge1xuICAgICAgICAgIGRhc2hib2FyZHNbZXhpc3RpbmddID0gZGFzaDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXNoYm9hcmRzLnB1c2goZGFzaCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZm4odGhpcy5zdG9yZURhc2hib2FyZHMoZGFzaGJvYXJkcykpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZWxldGVEYXNoYm9hcmRzKGFycmF5OmFueVtdLCBmbikge1xuICAgICAgdmFyIGRhc2hib2FyZHMgPSB0aGlzLmxvYWREYXNoYm9hcmRzKCk7XG4gICAgICBhbmd1bGFyLmZvckVhY2goYXJyYXksIChpdGVtKSA9PiB7XG4gICAgICAgIGRhc2hib2FyZHMucmVtb3ZlKChpKSA9PiB7IHJldHVybiBpLmlkID09PSBpdGVtLmlkOyB9KTtcbiAgICAgIH0pO1xuICAgICAgZm4odGhpcy5zdG9yZURhc2hib2FyZHMoZGFzaGJvYXJkcykpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXREYXNoYm9hcmRzKGZuKSB7XG4gICAgICBmbih0aGlzLmxvYWREYXNoYm9hcmRzKCkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXREYXNoYm9hcmQoaWQ6c3RyaW5nLCBmbikge1xuICAgICAgdmFyIGRhc2hib2FyZHMgPSB0aGlzLmxvYWREYXNoYm9hcmRzKCk7XG4gICAgICB2YXIgZGFzaGJvYXJkID0gZGFzaGJvYXJkcy5maW5kKChkYXNoYm9hcmQpID0+IHsgcmV0dXJuIGRhc2hib2FyZC5pZCA9PT0gaWQgfSk7XG4gICAgICBmbihkYXNoYm9hcmQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGVEYXNoYm9hcmQob3B0aW9uczphbnkpIHtcbiAgICAgIHZhciBhbnN3ZXIgPXtcbiAgICAgICAgdGl0bGU6IFwiTmV3IERhc2hib2FyZFwiLFxuICAgICAgICBncm91cDogXCJQZXJzb25hbFwiLFxuICAgICAgICB3aWRnZXRzOiBbXVxuICAgICAgfTtcbiAgICAgIGFuc3dlciA9IGFuZ3VsYXIuZXh0ZW5kKGFuc3dlciwgb3B0aW9ucyk7XG4gICAgICBhbnN3ZXJbJ2lkJ10gPSBDb3JlLmdldFVVSUQoKTtcbiAgICAgIHJldHVybiBhbnN3ZXI7XG4gICAgfVxuXG4gICAgcHVibGljIGNsb25lRGFzaGJvYXJkKGRhc2hib2FyZDphbnkpIHtcbiAgICAgIHZhciBuZXdEYXNoYm9hcmQgPSBPYmplY3QuY2xvbmUoZGFzaGJvYXJkKTtcbiAgICAgIG5ld0Rhc2hib2FyZFsnaWQnXSA9IENvcmUuZ2V0VVVJRCgpO1xuICAgICAgbmV3RGFzaGJvYXJkWyd0aXRsZSddID0gXCJDb3B5IG9mIFwiICsgZGFzaGJvYXJkLnRpdGxlO1xuICAgICAgcmV0dXJuIG5ld0Rhc2hib2FyZDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0VHlwZSgpIHtcbiAgICAgIHJldHVybiAnY29udGFpbmVyJztcbiAgICB9XG4gIH1cblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG5cbiAgX21vZHVsZS5jb250cm9sbGVyKFwiRGFzaGJvYXJkLkVkaXREYXNoYm9hcmRzQ29udHJvbGxlclwiLCBbXCIkc2NvcGVcIiwgXCIkcm91dGVQYXJhbXNcIiwgXCIkcm91dGVcIiwgXCIkbG9jYXRpb25cIiwgXCIkcm9vdFNjb3BlXCIsIFwiZGFzaGJvYXJkUmVwb3NpdG9yeVwiLCAoJHNjb3BlLCAkcm91dGVQYXJhbXMsICRyb3V0ZSwgJGxvY2F0aW9uLCAkcm9vdFNjb3BlLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnkpID0+IHtcblxuICAgIC8vJHNjb3BlLmhhc2ggPSB3b3Jrc3BhY2UuaGFzaCgpO1xuICAgICRzY29wZS5zZWxlY3RlZEl0ZW1zID0gW107XG4gICAgJHNjb3BlLnJlcG9zaXRvcnkgPSBkYXNoYm9hcmRSZXBvc2l0b3J5O1xuICAgIC8vJHNjb3BlLmR1cGxpY2F0ZURhc2hib2FyZHMgPSBuZXcgVUkuRGlhbG9nKCk7XG4gICAgJHNjb3BlLnNlbGVjdGVkUHJvZmlsZXNEaWFsb2cgPSBbXTtcbiAgICAkc2NvcGUuX2Rhc2hib2FyZHMgPSBbXTtcblxuICAgICRyb290U2NvcGUuJG9uKCdkYXNoYm9hcmRzVXBkYXRlZCcsIGRhc2hib2FyZExvYWRlZCk7XG5cbiAgICAkc2NvcGUuaGFzVXJsID0gKCkgPT4ge1xuICAgICAgcmV0dXJuICgkc2NvcGUudXJsKSA/IHRydWUgOiBmYWxzZTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmhhc1NlbGVjdGlvbiA9ICgpID0+IHtcbiAgICAgIHJldHVybiAkc2NvcGUuc2VsZWN0ZWRJdGVtcy5sZW5ndGggIT09IDA7XG4gICAgfTtcblxuICAgICRzY29wZS5ncmlkT3B0aW9ucyA9IHtcbiAgICAgIHNlbGVjdGVkSXRlbXM6ICRzY29wZS5zZWxlY3RlZEl0ZW1zLFxuICAgICAgc2hvd0ZpbHRlcjogZmFsc2UsXG4gICAgICBzaG93Q29sdW1uTWVudTogZmFsc2UsXG4gICAgICBmaWx0ZXJPcHRpb25zOiB7XG4gICAgICAgIGZpbHRlclRleHQ6ICcnXG4gICAgICB9LFxuICAgICAgZGF0YTogJ19kYXNoYm9hcmRzJyxcbiAgICAgIHNlbGVjdFdpdGhDaGVja2JveE9ubHk6IHRydWUsXG4gICAgICBzaG93U2VsZWN0aW9uQ2hlY2tib3g6IHRydWUsXG4gICAgICBjb2x1bW5EZWZzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBmaWVsZDogJ3RpdGxlJyxcbiAgICAgICAgICBkaXNwbGF5TmFtZTogJ0Rhc2hib2FyZCcsXG4gICAgICAgICAgY2VsbFRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cIm5nQ2VsbFRleHRcIj48YSBuZy1ocmVmPVwiIy9kYXNoYm9hcmQvaWQve3tyb3cuZ2V0UHJvcGVydHkoJyArIFwiJ2lkJ1wiICsgJyl9fXt7aGFzaH19XCI+PGVkaXRhYmxlLXByb3BlcnR5IGNsYXNzPVwiaW5saW5lLWJsb2NrXCIgb24tc2F2ZT1cIm9uRGFzaFJlbmFtZWQocm93LmVudGl0eSlcIiBwcm9wZXJ0eT1cInRpdGxlXCIgbmctbW9kZWw9XCJyb3cuZW50aXR5XCI+PC9lZGl0YWJsZS1wcm9wZXJ0eT48L2E+PC9kaXY+J1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZmllbGQ6ICdncm91cCcsXG4gICAgICAgICAgZGlzcGxheU5hbWU6ICdHcm91cCdcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIGFmdGVyU2VsZWN0aW9uQ2hhbmdlOiBhZnRlclNlbGVjdGlvbkNoYW5nZVxuICAgIH07XG5cblxuICAgICRzY29wZS5vbkRhc2hSZW5hbWVkID0gKGRhc2gpID0+IHtcbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbZGFzaF0sIFwiUmVuYW1lZCBkYXNoYm9hcmRcIiwgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vIGhlbHBlcnMgc28gd2UgY2FuIGVuYWJsZS9kaXNhYmxlIHBhcnRzIG9mIHRoZSBVSSBkZXBlbmRpbmcgb24gaG93XG4gICAgLy8gZGFzaGJvYXJkIGRhdGEgaXMgc3RvcmVkXG4gICAgJHNjb3BlLnVzaW5nR2l0ID0gKCkgPT4ge1xuICAgICAgcmV0dXJuIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0VHlwZSgpID09PSAnZ2l0JztcbiAgICB9O1xuXG4gICAgJHNjb3BlLnVzaW5nRmFicmljID0gKCkgPT4ge1xuICAgICAgcmV0dXJuIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0VHlwZSgpID09PSAnZmFicmljJztcbiAgICB9O1xuXG4gICAgJHNjb3BlLnVzaW5nTG9jYWwgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlKCkgPT09ICdjb250YWluZXInO1xuICAgIH07XG5cbiAgICBpZiAoJHNjb3BlLnVzaW5nRmFicmljKCkpIHtcbiAgICAgICRzY29wZS5ncmlkT3B0aW9ucy5jb2x1bW5EZWZzLmFkZChbe1xuICAgICAgICBmaWVsZDogJ3ZlcnNpb25JZCcsXG4gICAgICAgIGRpc3BsYXlOYW1lOiAnVmVyc2lvbidcbiAgICAgIH0sIHtcbiAgICAgICAgZmllbGQ6ICdwcm9maWxlSWQnLFxuICAgICAgICBkaXNwbGF5TmFtZTogJ1Byb2ZpbGUnXG4gICAgICB9LCB7XG4gICAgICAgIGZpZWxkOiAnZmlsZU5hbWUnLFxuICAgICAgICBkaXNwbGF5TmFtZTogJ0ZpbGUgTmFtZSdcbiAgICAgIH1dKTtcbiAgICB9XG5cbiAgICAkc2NvcGUuJG9uKFwiJHJvdXRlQ2hhbmdlU3VjY2Vzc1wiLCBmdW5jdGlvbiAoZXZlbnQsIGN1cnJlbnQsIHByZXZpb3VzKSB7XG4gICAgICAvLyBsZXRzIGRvIHRoaXMgYXN5bmNocm9ub3VzbHkgdG8gYXZvaWQgRXJyb3I6ICRkaWdlc3QgYWxyZWFkeSBpbiBwcm9ncmVzc1xuICAgICAgc2V0VGltZW91dCh1cGRhdGVEYXRhLCAxMDApO1xuICAgIH0pO1xuXG5cbiAgICAkc2NvcGUuZ29CYWNrID0gKCkgPT4ge1xuICAgICAgdmFyIGhyZWYgPSBDb3JlLnRyaW1MZWFkaW5nKCRzY29wZS51cmwsIFwiI1wiKTtcbiAgICAgIGlmIChocmVmKSB7XG4gICAgICAgICRsb2NhdGlvbi51cmwoaHJlZik7XG4gICAgICB9XG4gICAgfTtcblxuXG4gICAgJHNjb3BlLmR1cGxpY2F0ZVRvUHJvZmlsZXMgPSAoKSA9PiB7XG4gICAgICBpZiAoJHNjb3BlLmhhc1NlbGVjdGlvbigpKSB7XG4gICAgICAgICRzY29wZS5kdXBsaWNhdGVEYXNoYm9hcmRzLm9wZW4oKTtcbiAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAkc2NvcGUuZG9EdXBsaWNhdGVUb1Byb2ZpbGVzID0gKCkgPT4ge1xuICAgICAgJHNjb3BlLmR1cGxpY2F0ZURhc2hib2FyZHMuY2xvc2UoKTtcblxuICAgICAgdmFyIG5ld0Rhc2hib2FyZHMgPSBbXTtcblxuICAgICAgJHNjb3BlLnNlbGVjdGVkSXRlbXMuZm9yRWFjaCgoZGFzaGJvYXJkKSA9PiB7XG4gICAgICAgICRzY29wZS5zZWxlY3RlZFByb2ZpbGVzRGlhbG9nLmZvckVhY2goKHByb2ZpbGUpID0+IHtcbiAgICAgICAgICB2YXIgbmV3RGFzaCA9IGRhc2hib2FyZFJlcG9zaXRvcnkuY2xvbmVEYXNoYm9hcmQoZGFzaGJvYXJkKTtcbiAgICAgICAgICBuZXdEYXNoWydwcm9maWxlSWQnXSA9IHByb2ZpbGUuaWQ7XG4gICAgICAgICAgbmV3RGFzaFsndGl0bGUnXSA9IGRhc2hib2FyZC50aXRsZTtcbiAgICAgICAgICBuZXdEYXNoYm9hcmRzLnB1c2gobmV3RGFzaCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIHZhciBjb21taXRNZXNzYWdlID0gXCJEdXBsaWNhdGluZyBcIiArICRzY29wZS5zZWxlY3RlZEl0ZW1zLmxlbmd0aCArIFwiIGRhc2hib2FyZHMgdG8gXCIgKyAkc2NvcGUuc2VsZWN0ZWRQcm9maWxlc0RpYWxvZy5sZW5ndGggKyBcIiBwcm9maWxlc1wiO1xuXG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMobmV3RGFzaGJvYXJkcywgY29tbWl0TWVzc2FnZSwgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgLy8gbGV0J3MganVzdCBiZSBzYWZlIGFuZCBlbnN1cmUgdGhlcmUncyBubyBzZWxlY3Rpb25zXG4gICAgICAgIGRlc2VsZWN0QWxsKCk7XG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgIH0pO1xuXG4gICAgfTtcblxuICAgICRzY29wZS5hZGRWaWV3VG9EYXNoYm9hcmQgPSAoKSA9PiB7XG4gICAgICB2YXIgbmV4dEhyZWYgPSBudWxsO1xuICAgICAgYW5ndWxhci5mb3JFYWNoKCRzY29wZS5zZWxlY3RlZEl0ZW1zLCAoc2VsZWN0ZWRJdGVtKSA9PiB7XG4gICAgICAgIC8vIFRPRE8gdGhpcyBjb3VsZCBiZSBhIGhlbHBlciBmdW5jdGlvblxuICAgICAgICB2YXIgdGV4dCA9ICRzY29wZS51cmw7XG4gICAgICAgIHZhciBxdWVyeSA9IG51bGw7XG4gICAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgICAgdmFyIGlkeCA9IHRleHQuaW5kZXhPZignPycpO1xuICAgICAgICAgIGlmIChpZHggJiYgaWR4ID4gMCkge1xuICAgICAgICAgICAgcXVlcnkgPSB0ZXh0LnN1YnN0cmluZyhpZHggKyAxKTtcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0LnN1YnN0cmluZygwLCBpZHgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0ZXh0ID0gQ29yZS50cmltTGVhZGluZyh0ZXh0LCBcIiNcIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNlYXJjaCA9IHt9O1xuICAgICAgICBpZiAocXVlcnkpIHtcbiAgICAgICAgICB2YXIgZXhwcmVzc2lvbnMgPSBxdWVyeS5zcGxpdChcIiZcIik7XG4gICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGV4cHJlc3Npb25zLCAoZXhwcmVzc2lvbikgPT4ge1xuICAgICAgICAgICAgaWYgKGV4cHJlc3Npb24pIHtcbiAgICAgICAgICAgICAgdmFyIG5hbWVzID0gZXhwcmVzc2lvbi5zcGxpdChcIj1cIik7XG4gICAgICAgICAgICAgIHZhciBrZXkgPSBuYW1lc1swXTtcbiAgICAgICAgICAgICAgdmFyIHZhbHVlID0gbmFtZXMubGVuZ3RoID4gMSA/IG5hbWVzWzFdIDogbnVsbDtcbiAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHZhciBvbGQgPSBzZWFyY2hba2V5XTtcbiAgICAgICAgICAgICAgaWYgKG9sZCkge1xuICAgICAgICAgICAgICAgIGlmICghYW5ndWxhci5pc0FycmF5KG9sZCkpIHtcbiAgICAgICAgICAgICAgICAgIG9sZCA9IFtvbGRdO1xuICAgICAgICAgICAgICAgICAgc2VhcmNoW2tleV0gPSBvbGQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG9sZC5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWFyY2hba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9jb25zb2xlLmxvZyhcInBhdGggaXM6IFwiICsgdGV4dCArIFwiIHRoZSBzZWFyY2ggaXMgXCIgKyBKU09OLnN0cmluZ2lmeShzZWFyY2gpKTtcbiAgICAgICAgaWYgKCRyb3V0ZSAmJiAkcm91dGUucm91dGVzKSB7XG4gICAgICAgICAgdmFyIHZhbHVlID0gJHJvdXRlLnJvdXRlc1t0ZXh0XTtcbiAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgIHZhciB0ZW1wbGF0ZVVybCA9IHZhbHVlW1widGVtcGxhdGVVcmxcIl07XG4gICAgICAgICAgICBpZiAodGVtcGxhdGVVcmwpIHtcbiAgICAgICAgICAgICAgaWYgKCFzZWxlY3RlZEl0ZW0ud2lkZ2V0cykge1xuICAgICAgICAgICAgICAgIHNlbGVjdGVkSXRlbS53aWRnZXRzID0gW107XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdmFyIG5leHROdW1iZXIgPSBzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5sZW5ndGggKyAxO1xuICAgICAgICAgICAgICB2YXIgd2lkZ2V0ID0ge1xuICAgICAgICAgICAgICAgIGlkOiBcIndcIiArIG5leHROdW1iZXIsIHRpdGxlOiBcIlwiLFxuICAgICAgICAgICAgICAgIHJvdzogMSxcbiAgICAgICAgICAgICAgICBjb2w6IDEsXG4gICAgICAgICAgICAgICAgc2l6ZV94OiAxLFxuICAgICAgICAgICAgICAgIHNpemVfeTogMSxcbiAgICAgICAgICAgICAgICBwYXRoOiBDb3JlLnRyaW1MZWFkaW5nKHRleHQsIFwiL1wiKSxcbiAgICAgICAgICAgICAgICBpbmNsdWRlOiB0ZW1wbGF0ZVVybCxcbiAgICAgICAgICAgICAgICBzZWFyY2g6IHNlYXJjaCxcbiAgICAgICAgICAgICAgICBoYXNoOiBcIlwiXG4gICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgaWYgKCRzY29wZS53aWRnZXRUaXRsZSkge1xuICAgICAgICAgICAgICAgIHdpZGdldC50aXRsZSA9ICRzY29wZS53aWRnZXRUaXRsZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vIGZpZ3VyZSBvdXQgdGhlIHdpZHRoIG9mIHRoZSBkYXNoXG4gICAgICAgICAgICAgIHZhciBncmlkV2lkdGggPSAwO1xuXG4gICAgICAgICAgICAgIHNlbGVjdGVkSXRlbS53aWRnZXRzLmZvckVhY2goKHcpID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgcmlnaHRTaWRlID0gdy5jb2wgKyB3LnNpemVfeDtcbiAgICAgICAgICAgICAgICBpZiAocmlnaHRTaWRlID4gZ3JpZFdpZHRoKSB7XG4gICAgICAgICAgICAgICAgICBncmlkV2lkdGggPSByaWdodFNpZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICBpZiAoJHNjb3BlLnByZWZlcnJlZFNpemUpIHtcbiAgICAgICAgICAgICAgICB3aWRnZXQuc2l6ZV94ID0gcGFyc2VJbnQoJHNjb3BlLnByZWZlcnJlZFNpemVbJ3NpemVfeCddKTtcbiAgICAgICAgICAgICAgICB3aWRnZXQuc2l6ZV95ID0gcGFyc2VJbnQoJHNjb3BlLnByZWZlcnJlZFNpemVbJ3NpemVfeSddKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgIHZhciBsZWZ0ID0gKHcpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdy5jb2w7XG4gICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgdmFyIHJpZ2h0ID0gKHcpICA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHcuY29sICsgdy5zaXplX3ggLSAxO1xuICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgIHZhciB0b3AgPSAodykgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB3LnJvdztcbiAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICB2YXIgYm90dG9tID0gKHcpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdy5yb3cgKyB3LnNpemVfeSAtIDE7XG4gICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgdmFyIGNvbGxpc2lvbiA9ICh3MSwgdzIpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gISggbGVmdCh3MikgPiByaWdodCh3MSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQodzIpIDwgbGVmdCh3MSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wKHcyKSA+IGJvdHRvbSh3MSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYm90dG9tKHcyKSA8IHRvcCh3MSkpO1xuICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgIGlmIChzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5pc0VtcHR5KCkpIHtcbiAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB3aGlsZSAoIWZvdW5kKSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0LmNvbCA9IDE7XG4gICAgICAgICAgICAgICAgaWYgKHdpZGdldC5jb2wgKyB3aWRnZXQuc2l6ZV94ID4gZ3JpZFdpZHRoKSB7XG4gICAgICAgICAgICAgICAgICAvLyBsZXQncyBub3QgbG9vayBmb3IgYSBwbGFjZSBuZXh0IHRvIGV4aXN0aW5nIHdpZGdldFxuICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRJdGVtLndpZGdldHMuZm9yRWFjaChmdW5jdGlvbih3LCBpZHgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdpZGdldC5yb3cgPD0gdy5yb3cpIHtcbiAgICAgICAgICAgICAgICAgICAgICB3aWRnZXQucm93Kys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKDsgKHdpZGdldC5jb2wgKyB3aWRnZXQuc2l6ZV94KSA8PSBncmlkV2lkdGg7IHdpZGdldC5jb2wrKykge1xuICAgICAgICAgICAgICAgICAgaWYgKCFzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5hbnkoKHcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSBjb2xsaXNpb24odywgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNcbiAgICAgICAgICAgICAgICAgIH0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgICAgICAgIHdpZGdldC5yb3cgPSB3aWRnZXQucm93ICsgMVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBqdXN0IGluIGNhc2UsIGtlZXAgdGhlIHNjcmlwdCBmcm9tIHJ1bm5pbmcgYXdheS4uLlxuICAgICAgICAgICAgICAgIGlmICh3aWRnZXQucm93ID4gNTApIHtcbiAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoJHNjb3BlLnJvdXRlUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0Wydyb3V0ZVBhcmFtcyddID0gJHNjb3BlLnJvdXRlUGFyYW1zO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHNlbGVjdGVkSXRlbS53aWRnZXRzLnB1c2god2lkZ2V0KTtcblxuICAgICAgICAgICAgICBpZiAoIW5leHRIcmVmICYmIHNlbGVjdGVkSXRlbS5pZCkge1xuICAgICAgICAgICAgICAgIG5leHRIcmVmID0gXCIvZGFzaGJvYXJkL2lkL1wiICsgc2VsZWN0ZWRJdGVtLmlkXG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUT0RPIHdlIG5lZWQgdG8gYmUgYWJsZSB0byBtYXRjaCBVUkkgdGVtcGxhdGVzLi4uXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gbm93IGxldHMgdXBkYXRlIHRoZSBhY3R1YWwgZGFzaGJvYXJkIGNvbmZpZ1xuICAgICAgdmFyIGNvbW1pdE1lc3NhZ2UgPSBcIkFkZCB3aWRnZXRcIjtcbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcygkc2NvcGUuc2VsZWN0ZWRJdGVtcywgY29tbWl0TWVzc2FnZSwgZnVuY3Rpb24oZGFzaGJvYXJkcykge1xuICAgICAgICBpZiAobmV4dEhyZWYpIHtcbiAgICAgICAgICAvLyByZW1vdmUgYW55IGRvZGd5IHF1ZXJ5XG4gICAgICAgICAgZGVsZXRlICRsb2NhdGlvbi5zZWFyY2goKVtcImhyZWZcIl07XG4gICAgICAgICAgJGxvY2F0aW9uLnBhdGgobmV4dEhyZWYpO1xuICAgICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgfTtcblxuICAgICRzY29wZS5jcmVhdGUgPSAoKSA9PiB7XG4gICAgICB2YXIgY291bnRlciA9IGRhc2hib2FyZHMoKS5sZW5ndGggKyAxO1xuICAgICAgdmFyIHRpdGxlID0gXCJVbnRpdGxlZFwiICsgY291bnRlcjtcbiAgICAgIHZhciBuZXdEYXNoID0gZGFzaGJvYXJkUmVwb3NpdG9yeS5jcmVhdGVEYXNoYm9hcmQoe3RpdGxlOiB0aXRsZX0pO1xuXG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoW25ld0Rhc2hdLCBcIkNyZWF0ZWQgbmV3IGRhc2hib2FyZDogXCIgKyB0aXRsZSwgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgLy8gbGV0J3MganVzdCBiZSBzYWZlIGFuZCBlbnN1cmUgdGhlcmUncyBubyBzZWxlY3Rpb25zXG4gICAgICAgIGRlc2VsZWN0QWxsKCk7XG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgIH0pO1xuXG4gICAgfTtcblxuICAgICRzY29wZS5kdXBsaWNhdGUgPSAoKSA9PiB7XG4gICAgICB2YXIgbmV3RGFzaGJvYXJkcyA9IFtdO1xuICAgICAgdmFyIGNvbW1pdE1lc3NhZ2UgPSBcIkR1cGxpY2F0ZWQgZGFzaGJvYXJkKHMpIFwiO1xuICAgICAgYW5ndWxhci5mb3JFYWNoKCRzY29wZS5zZWxlY3RlZEl0ZW1zLCAoaXRlbSwgaWR4KSA9PiB7XG4gICAgICAgIC8vIGxldHMgdW5zZWxlY3QgdGhpcyBpdGVtXG4gICAgICAgIHZhciBjb21taXRNZXNzYWdlID0gXCJEdXBsaWNhdGVkIGRhc2hib2FyZCBcIiArIGl0ZW0udGl0bGU7XG4gICAgICAgIHZhciBuZXdEYXNoID0gZGFzaGJvYXJkUmVwb3NpdG9yeS5jbG9uZURhc2hib2FyZChpdGVtKTtcbiAgICAgICAgbmV3RGFzaGJvYXJkcy5wdXNoKG5ld0Rhc2gpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIGxldCdzIGp1c3QgYmUgc2FmZSBhbmQgZW5zdXJlIHRoZXJlJ3Mgbm8gc2VsZWN0aW9uc1xuICAgICAgZGVzZWxlY3RBbGwoKTtcblxuICAgICAgY29tbWl0TWVzc2FnZSA9IGNvbW1pdE1lc3NhZ2UgKyBuZXdEYXNoYm9hcmRzLm1hcCgoZCkgPT4geyByZXR1cm4gZC50aXRsZSB9KS5qb2luKCcsJyk7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMobmV3RGFzaGJvYXJkcywgY29tbWl0TWVzc2FnZSwgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5kZWxldGVEYXNoYm9hcmQgPSAoKSA9PiB7XG4gICAgICBpZiAoJHNjb3BlLmhhc1NlbGVjdGlvbigpKSB7XG4gICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZGVsZXRlRGFzaGJvYXJkcygkc2NvcGUuc2VsZWN0ZWRJdGVtcywgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgICAvLyBsZXQncyBqdXN0IGJlIHNhZmUgYW5kIGVuc3VyZSB0aGVyZSdzIG5vIHNlbGVjdGlvbnNcbiAgICAgICAgICBkZXNlbGVjdEFsbCgpO1xuICAgICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgICRzY29wZS5naXN0ID0gKCkgPT4ge1xuICAgICAgaWYgKCRzY29wZS5zZWxlY3RlZEl0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGlkID0gJHNjb3BlLnNlbGVjdGVkSXRlbXNbMF0uaWQ7XG4gICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9pZC9cIiArIGlkICsgXCIvc2hhcmVcIik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZURhdGEoKSB7XG4gICAgICB2YXIgdXJsID0gJHJvdXRlUGFyYW1zW1wiaHJlZlwiXTtcbiAgICAgIGlmICh1cmwpIHtcbiAgICAgICAgJHNjb3BlLnVybCA9IGRlY29kZVVSSUNvbXBvbmVudCh1cmwpO1xuICAgICAgfVxuXG4gICAgICB2YXIgcm91dGVQYXJhbXMgPSAkcm91dGVQYXJhbXNbXCJyb3V0ZVBhcmFtc1wiXTtcbiAgICAgIGlmIChyb3V0ZVBhcmFtcykge1xuICAgICAgICAkc2NvcGUucm91dGVQYXJhbXMgPSBkZWNvZGVVUklDb21wb25lbnQocm91dGVQYXJhbXMpO1xuICAgICAgfVxuICAgICAgdmFyIHNpemU6YW55ID0gJHJvdXRlUGFyYW1zW1wic2l6ZVwiXTtcbiAgICAgIGlmIChzaXplKSB7XG4gICAgICAgIHNpemUgPSBkZWNvZGVVUklDb21wb25lbnQoc2l6ZSk7XG4gICAgICAgICRzY29wZS5wcmVmZXJyZWRTaXplID0gYW5ndWxhci5mcm9tSnNvbihzaXplKTtcbiAgICAgIH1cbiAgICAgIHZhciB0aXRsZTphbnkgPSAkcm91dGVQYXJhbXNbXCJ0aXRsZVwiXTtcbiAgICAgIGlmICh0aXRsZSkge1xuICAgICAgICB0aXRsZSA9IGRlY29kZVVSSUNvbXBvbmVudCh0aXRsZSk7XG4gICAgICAgICRzY29wZS53aWRnZXRUaXRsZSA9IHRpdGxlO1xuICAgICAgfVxuXG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZHMoKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGFzaGJvYXJkTG9hZGVkKGV2ZW50LCBkYXNoYm9hcmRzKSB7XG4gICAgICAkc2NvcGUuX2Rhc2hib2FyZHMgPSBkYXNoYm9hcmRzO1xuICAgICAgaWYgKGV2ZW50ID09PSBudWxsKSB7XG4gICAgICAgICRzY29wZS4kZW1pdCgnZGFzaGJvYXJkc1VwZGF0ZWQnLCBkYXNoYm9hcmRzKTtcbiAgICAgIH1cbiAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGFzaGJvYXJkcygpIHtcbiAgICAgIHJldHVybiAkc2NvcGUuX2Rhc2hib2FyZHM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWZ0ZXJTZWxlY3Rpb25DaGFuZ2Uocm93SXRlbSwgY2hlY2tBbGwpIHtcbiAgICAgIGlmIChjaGVja0FsbCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIC8vIHRoZW4gcm93IHdhcyBjbGlja2VkLCBub3Qgc2VsZWN0LWFsbCBjaGVja2JveFxuICAgICAgICAkc2NvcGUuZ3JpZE9wdGlvbnNbJyRncmlkU2NvcGUnXS5hbGxTZWxlY3RlZCA9IHJvd0l0ZW0uY29uZmlnLnNlbGVjdGVkSXRlbXMubGVuZ3RoID09ICRzY29wZS5fZGFzaGJvYXJkcy5sZW5ndGg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkc2NvcGUuZ3JpZE9wdGlvbnNbJyRncmlkU2NvcGUnXS5hbGxTZWxlY3RlZCA9IGNoZWNrQWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlc2VsZWN0QWxsKCkge1xuICAgICAgJHNjb3BlLnNlbGVjdGVkSXRlbXMuc3BsaWNlKDApO1xuICAgICAgJHNjb3BlLmdyaWRPcHRpb25zWyckZ3JpZFNjb3BlJ10uYWxsU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICB1cGRhdGVEYXRhKCk7XG4gIH1dKTtcbn1cbiIsIi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG5cbiAgLyoqXG4gICAqIEltcGxlbWVudHMgdGhlIG5nLklMb2NhdGlvblNlcnZpY2UgaW50ZXJmYWNlIGFuZCBpcyB1c2VkIGJ5IHRoZSBkYXNoYm9hcmQgdG8gc3VwcGx5XG4gICAqIGNvbnRyb2xsZXJzIHdpdGggYSBzYXZlZCBVUkwgbG9jYXRpb25cbiAgICpcbiAgICogQGNsYXNzIFJlY3RhbmdsZUxvY2F0aW9uXG4gICAqL1xuICBleHBvcnQgY2xhc3MgUmVjdGFuZ2xlTG9jYXRpb24geyAvLyBUT0RPIGltcGxlbWVudHMgbmcuSUxvY2F0aW9uU2VydmljZSB7XG4gICAgcHJpdmF0ZSBfcGF0aDogc3RyaW5nO1xuICAgIHByaXZhdGUgX2hhc2g6IHN0cmluZztcbiAgICBwcml2YXRlIF9zZWFyY2g6IGFueTtcblxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBkZWxlZ2F0ZTpuZy5JTG9jYXRpb25TZXJ2aWNlLCBwYXRoOnN0cmluZywgc2VhcmNoLCBoYXNoOnN0cmluZykge1xuICAgICAgdGhpcy5fcGF0aCA9IHBhdGg7XG4gICAgICB0aGlzLl9zZWFyY2ggPSBzZWFyY2g7XG4gICAgICB0aGlzLl9oYXNoID0gaGFzaDtcbiAgICB9XG5cbiAgICBhYnNVcmwoKSB7XG4gICAgICByZXR1cm4gdGhpcy5wcm90b2NvbCgpICsgdGhpcy5ob3N0KCkgKyBcIjpcIiArIHRoaXMucG9ydCgpICsgdGhpcy5wYXRoKCkgKyB0aGlzLnNlYXJjaCgpO1xuICAgIH1cblxuICAgIGhhc2gobmV3SGFzaDpzdHJpbmcgPSBudWxsKTphbnkge1xuICAgICAgaWYgKG5ld0hhc2gpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUuaGFzaChuZXdIYXNoKS5zZWFyY2goJ3RhYicsIG51bGwpO1xuICAgICAgICAvL3RoaXMuX2hhc2ggPSBuZXdIYXNoO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX2hhc2g7XG4gICAgfVxuXG4gICAgaG9zdCgpOnN0cmluZyB7XG4gICAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5ob3N0KCk7XG4gICAgfVxuXG4gICAgcGF0aChuZXdQYXRoOnN0cmluZyA9IG51bGwpOmFueSB7XG4gICAgICBpZiAobmV3UGF0aCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5wYXRoKG5ld1BhdGgpLnNlYXJjaCgndGFiJywgbnVsbCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fcGF0aDtcbiAgICB9XG5cbiAgICBwb3J0KCk6bnVtYmVyIHtcbiAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLnBvcnQoKTtcbiAgICB9XG5cbiAgICBwcm90b2NvbCgpIHtcbiAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLnBvcnQoKTtcbiAgICB9XG5cbiAgICByZXBsYWNlKCkge1xuICAgICAgLy8gVE9ET1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2VhcmNoKHBhcmFtZXRlcnNNYXA6YW55ID0gbnVsbCk6YW55IHtcbiAgICAgIGlmIChwYXJhbWV0ZXJzTWFwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLnNlYXJjaChwYXJhbWV0ZXJzTWFwKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9zZWFyY2g7XG4gICAgfVxuXG4gICAgdXJsKG5ld1ZhbHVlOiBzdHJpbmcgPSBudWxsKTphbnkge1xuICAgICAgaWYgKG5ld1ZhbHVlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLnVybChuZXdWYWx1ZSkuc2VhcmNoKCd0YWInLCBudWxsKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmFic1VybCgpO1xuICAgIH1cblxuICB9XG59XG4iLCIvKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUmVwb3NpdG9yeS50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJyZWN0YW5nbGVMb2NhdGlvbi50c1wiLz5cbm1vZHVsZSBEYXNoYm9hcmQge1xuXG4gIHZhciBtb2R1bGVzOkFycmF5PHN0cmluZz4gPSB1bmRlZmluZWQ7XG5cbiAgX21vZHVsZS5kaXJlY3RpdmUoJ2hhd3Rpb0Rhc2hib2FyZCcsIGZ1bmN0aW9uKCkge1xuICAgIG1vZHVsZXMgPSBoYXd0aW9QbHVnaW5Mb2FkZXJbJ21vZHVsZXMnXS5maWx0ZXIoKG5hbWUpID0+IHtcbiAgICAgIHJldHVybiBfLmlzU3RyaW5nKG5hbWUpICYmIG5hbWUgIT09ICduZyc7XG4gICAgfSk7XG4gICAgbG9nLmRlYnVnKFwiTW9kdWxlczogXCIsIG1vZHVsZXMpO1xuICAgIHJldHVybiBuZXcgRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlKCk7XG4gIH0pO1xuXG4gIGV4cG9ydCBjbGFzcyBHcmlkc3RlckRpcmVjdGl2ZSB7XG4gICAgcHVibGljIHJlc3RyaWN0ID0gJ0EnO1xuICAgIHB1YmxpYyByZXBsYWNlID0gdHJ1ZTtcblxuICAgIHB1YmxpYyBjb250cm9sbGVyID0gW1wiJHNjb3BlXCIsIFwiJGVsZW1lbnRcIiwgXCIkYXR0cnNcIiwgXCIkbG9jYXRpb25cIiwgXCIkcm91dGVQYXJhbXNcIiwgXCIkaW5qZWN0b3JcIiwgXCIkcm91dGVcIiwgXCIkdGVtcGxhdGVDYWNoZVwiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgXCIkY29tcGlsZVwiLCBcIiR0ZW1wbGF0ZVJlcXVlc3RcIiwgKCRzY29wZSwgJGVsZW1lbnQsICRhdHRycywgJGxvY2F0aW9uLCAkcm91dGVQYXJhbXMsICRpbmplY3RvciwgJHJvdXRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICR0ZW1wbGF0ZUNhY2hlLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAkY29tcGlsZSwgJHRlbXBsYXRlUmVxdWVzdCkgPT4ge1xuXG4gICAgICAkc2NvcGUucm91dGUgPSAkcm91dGU7XG4gICAgICAkc2NvcGUuaW5qZWN0b3IgPSAkaW5qZWN0b3I7XG5cbiAgICAgIHZhciBncmlkU2l6ZSA9IDE1MDtcbiAgICAgIHZhciBncmlkTWFyZ2luID0gNjtcbiAgICAgIHZhciBncmlkSGVpZ2h0O1xuXG4gICAgICAkc2NvcGUuZ3JpZFggPSBncmlkU2l6ZTtcbiAgICAgICRzY29wZS5ncmlkWSA9IGdyaWRTaXplO1xuXG4gICAgICAkc2NvcGUud2lkZ2V0TWFwID0ge307XG5cbiAgICAgICRzY29wZS4kb24oJyRkZXN0cm95JywgKCkgPT4ge1xuICAgICAgICBhbmd1bGFyLmZvckVhY2goJHNjb3BlLndpZGdldE1hcCwgKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgICBpZiAoJ3Njb3BlJyBpbiB2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIHNjb3BlID0gdmFsdWVbJ3Njb3BlJ107XG4gICAgICAgICAgICBzY29wZS4kZGVzdHJveSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgdXBkYXRlV2lkZ2V0cygpO1xuXG4gICAgICAkc2NvcGUucmVtb3ZlV2lkZ2V0ID0gZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgICAgIHZhciBncmlkc3RlciA9IGdldEdyaWRzdGVyKCk7XG4gICAgICAgIHZhciB3aWRnZXRFbGVtID0gbnVsbDtcblxuICAgICAgICAvLyBsZXRzIGRlc3Ryb3kgdGhlIHdpZGdldHMncyBzY29wZVxuICAgICAgICB2YXIgd2lkZ2V0RGF0YSA9ICRzY29wZS53aWRnZXRNYXBbd2lkZ2V0LmlkXTtcbiAgICAgICAgaWYgKHdpZGdldERhdGEpIHtcbiAgICAgICAgICBkZWxldGUgJHNjb3BlLndpZGdldE1hcFt3aWRnZXQuaWRdO1xuICAgICAgICAgIHZhciBzY29wZSA9IHdpZGdldERhdGEuc2NvcGU7XG4gICAgICAgICAgd2lkZ2V0RWxlbSA9IHdpZGdldERhdGEud2lkZ2V0O1xuICAgICAgICAgIGlmIChzY29wZSkge1xuICAgICAgICAgICAgc2NvcGUuJGRlc3Ryb3koKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF3aWRnZXRFbGVtKSB7XG4gICAgICAgICAgLy8gbGV0cyBnZXQgdGhlIGxpIHBhcmVudCBlbGVtZW50IG9mIHRoZSB0ZW1wbGF0ZVxuICAgICAgICAgIHdpZGdldEVsZW0gPSAkKFwiZGl2XCIpLmZpbmQoXCJbZGF0YS13aWRnZXRJZD0nXCIgKyB3aWRnZXQuaWQgKyBcIiddXCIpLnBhcmVudCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChncmlkc3RlciAmJiB3aWRnZXRFbGVtKSB7XG4gICAgICAgICAgZ3JpZHN0ZXIucmVtb3ZlX3dpZGdldCh3aWRnZXRFbGVtKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBubyBuZWVkIHRvIHJlbW92ZSBpdC4uLlxuICAgICAgICAvL3dpZGdldEVsZW0ucmVtb3ZlKCk7XG5cbiAgICAgICAgLy8gbGV0cyB0cmFzaCB0aGUgSlNPTiBtZXRhZGF0YVxuICAgICAgICBpZiAoJHNjb3BlLmRhc2hib2FyZCkge1xuICAgICAgICAgIHZhciB3aWRnZXRzID0gJHNjb3BlLmRhc2hib2FyZC53aWRnZXRzO1xuICAgICAgICAgIGlmICh3aWRnZXRzKSB7XG4gICAgICAgICAgICB3aWRnZXRzLnJlbW92ZSh3aWRnZXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkoXCJSZW1vdmVkIHdpZGdldCBcIiArIHdpZGdldC50aXRsZSk7XG4gICAgICB9O1xuXG4gICAgICBmdW5jdGlvbiBjaGFuZ2VXaWRnZXRTaXplKHdpZGdldCwgc2l6ZWZ1bmMsIHNhdmVmdW5jKSB7XG4gICAgICAgIHZhciBncmlkc3RlciA9IGdldEdyaWRzdGVyKCk7XG4gICAgICAgIHZhciBlbnRyeSA9ICRzY29wZS53aWRnZXRNYXBbd2lkZ2V0LmlkXTtcbiAgICAgICAgdmFyIHcgPSBlbnRyeS53aWRnZXQ7XG4gICAgICAgIHZhciBzY29wZSA9IGVudHJ5LnNjb3BlO1xuICAgICAgICBzaXplZnVuYyhlbnRyeSk7XG4gICAgICAgIGdyaWRzdGVyLnJlc2l6ZV93aWRnZXQodywgZW50cnkuc2l6ZV94LCBlbnRyeS5zaXplX3kpO1xuICAgICAgICBncmlkc3Rlci5zZXRfZG9tX2dyaWRfaGVpZ2h0KCk7XG5cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgdGVtcGxhdGUgPSAkdGVtcGxhdGVDYWNoZS5nZXQoXCJ3aWRnZXRUZW1wbGF0ZVwiKTtcbiAgICAgICAgICB2YXIgZGl2ID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICAgICAgICBkaXYuaHRtbCh0ZW1wbGF0ZSk7XG4gICAgICAgICAgdy5odG1sKCRjb21waWxlKGRpdi5jb250ZW50cygpKShzY29wZSkpO1xuXG4gICAgICAgICAgbWFrZVJlc2l6YWJsZSgpO1xuICAgICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG5cbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2F2ZWZ1bmMod2lkZ2V0KTtcbiAgICAgICAgICB9LCA1MCk7XG4gICAgICAgIH0sIDMwKTtcbiAgICAgIH1cblxuICAgICAgJHNjb3BlLm9uV2lkZ2V0UmVuYW1lZCA9IGZ1bmN0aW9uKHdpZGdldCkge1xuICAgICAgICB1cGRhdGVEYXNoYm9hcmRSZXBvc2l0b3J5KFwiUmVuYW1lZCB3aWRnZXQgdG8gXCIgKyB3aWRnZXQudGl0bGUpO1xuICAgICAgfTtcblxuICAgICAgZnVuY3Rpb24gdXBkYXRlV2lkZ2V0cygpIHtcbiAgICAgICAgJHNjb3BlLmlkID0gJHJvdXRlUGFyYW1zW1wiZGFzaGJvYXJkSWRcIl07XG4gICAgICAgICRzY29wZS5pZHggPSAkcm91dGVQYXJhbXNbXCJkYXNoYm9hcmRJbmRleFwiXTtcbiAgICAgICAgaWYgKCRzY29wZS5pZCkge1xuICAgICAgICAgICRzY29wZS4kZW1pdCgnbG9hZERhc2hib2FyZHMnKTtcbiAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZCgkc2NvcGUuaWQsIG9uRGFzaGJvYXJkTG9hZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXREYXNoYm9hcmRzKChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkcyk7XG5cbiAgICAgICAgICAgIHZhciBpZHggPSAkc2NvcGUuaWR4ID8gcGFyc2VJbnQoJHNjb3BlLmlkeCkgOiAwO1xuICAgICAgICAgICAgdmFyIGlkID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChkYXNoYm9hcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgdmFyIGRhc2hib2FyZCA9IGRhc2hib2FyZHMubGVuZ3RoID4gaWR4ID8gZGFzaGJvYXJkc1tpZHhdIDogZGFzaGJvYXJkWzBdO1xuICAgICAgICAgICAgICBpZCA9IGRhc2hib2FyZC5pZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZCkge1xuICAgICAgICAgICAgICAkbG9jYXRpb24ucGF0aChcIi9kYXNoYm9hcmQvaWQvXCIgKyBpZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAkbG9jYXRpb24ucGF0aChcIi9kYXNoYm9hcmQvZWRpdD90YWI9ZGFzaGJvYXJkXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBvbkRhc2hib2FyZExvYWQoZGFzaGJvYXJkKSB7XG4gICAgICAgICRzY29wZS5kYXNoYm9hcmQgPSBkYXNoYm9hcmQ7XG4gICAgICAgIHZhciB3aWRnZXRzID0gKChkYXNoYm9hcmQpID8gZGFzaGJvYXJkLndpZGdldHMgOiBudWxsKSB8fCBbXTtcblxuICAgICAgICB2YXIgbWluSGVpZ2h0ID0gMTA7XG4gICAgICAgIHZhciBtaW5XaWR0aCA9IDY7XG5cbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKHdpZGdldHMsICh3aWRnZXQpID0+IHtcbiAgICAgICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQod2lkZ2V0LnJvdykgJiYgbWluSGVpZ2h0IDwgd2lkZ2V0LnJvdykge1xuICAgICAgICAgICAgbWluSGVpZ2h0ID0gd2lkZ2V0LnJvdyArIDE7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZCh3aWRnZXQuc2l6ZV94XG4gICAgICAgICAgICAgICYmIGFuZ3VsYXIuaXNEZWZpbmVkKHdpZGdldC5jb2wpKSkge1xuICAgICAgICAgICAgdmFyIHJpZ2h0RWRnZSA9IHdpZGdldC5jb2wgKyB3aWRnZXQuc2l6ZV94O1xuICAgICAgICAgICAgaWYgKHJpZ2h0RWRnZSA+IG1pbldpZHRoKSB7XG4gICAgICAgICAgICAgIG1pbldpZHRoID0gcmlnaHRFZGdlICsgMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBncmlkc3RlciA9ICRlbGVtZW50LmdyaWRzdGVyKHtcbiAgICAgICAgICB3aWRnZXRfbWFyZ2luczogW2dyaWRNYXJnaW4sIGdyaWRNYXJnaW5dLFxuICAgICAgICAgIHdpZGdldF9iYXNlX2RpbWVuc2lvbnM6IFskc2NvcGUuZ3JpZFgsICRzY29wZS5ncmlkWV0sXG4gICAgICAgICAgZXh0cmFfcm93czogbWluSGVpZ2h0LFxuICAgICAgICAgIGV4dHJhX2NvbHM6IG1pbldpZHRoLFxuICAgICAgICAgIG1heF9zaXplX3g6IG1pbldpZHRoLFxuICAgICAgICAgIG1heF9zaXplX3k6IG1pbkhlaWdodCxcbiAgICAgICAgICBkcmFnZ2FibGU6IHtcbiAgICAgICAgICAgIHN0b3A6IChldmVudCwgdWkpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHNlcmlhbGl6ZURhc2hib2FyZCgpKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIkNoYW5naW5nIGRhc2hib2FyZCBsYXlvdXRcIik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pLmRhdGEoJ2dyaWRzdGVyJyk7XG5cbiAgICAgICAgdmFyIHRlbXBsYXRlID0gJHRlbXBsYXRlQ2FjaGUuZ2V0KFwid2lkZ2V0VGVtcGxhdGVcIik7XG5cbiAgICAgICAgdmFyIHJlbWFpbmluZyA9IHdpZGdldHMubGVuZ3RoO1xuXG4gICAgICAgIGZ1bmN0aW9uIG1heWJlRmluaXNoVXAoKSB7XG4gICAgICAgICAgcmVtYWluaW5nID0gcmVtYWluaW5nIC0gMTtcbiAgICAgICAgICBpZiAocmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgICAgICBtYWtlUmVzaXphYmxlKCk7XG4gICAgICAgICAgICBnZXRHcmlkc3RlcigpLmVuYWJsZSgpO1xuICAgICAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBhbmd1bGFyLmZvckVhY2god2lkZ2V0cywgKHdpZGdldCkgPT4ge1xuICAgICAgICAgIHZhciBwYXRoID0gd2lkZ2V0LnBhdGg7XG4gICAgICAgICAgdmFyIHNlYXJjaCA9IG51bGw7XG4gICAgICAgICAgaWYgKHdpZGdldC5zZWFyY2gpIHtcbiAgICAgICAgICAgIHNlYXJjaCA9IERhc2hib2FyZC5kZWNvZGVVUklDb21wb25lbnRQcm9wZXJ0aWVzKHdpZGdldC5zZWFyY2gpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAod2lkZ2V0LnJvdXRlUGFyYW1zKSB7XG4gICAgICAgICAgICBfLmV4dGVuZChzZWFyY2gsIGFuZ3VsYXIuZnJvbUpzb24od2lkZ2V0LnJvdXRlUGFyYW1zKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBoYXNoID0gd2lkZ2V0Lmhhc2g7IC8vIFRPRE8gZGVjb2RlIG9iamVjdD9cbiAgICAgICAgICB2YXIgbG9jYXRpb24gPSBuZXcgUmVjdGFuZ2xlTG9jYXRpb24oJGxvY2F0aW9uLCBwYXRoLCBzZWFyY2gsIGhhc2gpO1xuXG4gICAgICAgICAgdmFyIHRtcE1vZHVsZU5hbWUgPSAnZGFzaGJvYXJkLScgKyB3aWRnZXQuaWQ7XG4gICAgICAgICAgdmFyIHRtcE1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKHRtcE1vZHVsZU5hbWUsIG1vZHVsZXMpO1xuICAgICAgICAgIHRtcE1vZHVsZS5jb25maWcoWyckcHJvdmlkZScsICgkcHJvdmlkZSkgPT4ge1xuICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKCckbG9jYXRpb24nLCBbJyRkZWxlZ2F0ZScsICgkZGVsZWdhdGUpID0+IHtcbiAgICAgICAgICAgICAgLy9sb2cuZGVidWcoXCJVc2luZyAkbG9jYXRpb246IFwiLCBsb2NhdGlvbik7XG4gICAgICAgICAgICAgIHJldHVybiBsb2NhdGlvbjtcbiAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcignJHJvdXRlJywgWyckZGVsZWdhdGUnLCAoJGRlbGVnYXRlKSA9PiB7XG4gICAgICAgICAgICAgIC8vIHJlYWxseSBoYW5keSBmb3IgZGVidWdnaW5nLCBtb3N0bHkgdG8gdGVsbCBpZiBhIHdpZGdldCdzIHJvdXRlXG4gICAgICAgICAgICAgIC8vIGlzbid0IGFjdHVhbGx5IGF2YWlsYWJsZSBpbiB0aGUgY2hpbGQgYXBwXG4gICAgICAgICAgICAgIC8vbG9nLmRlYnVnKFwiVXNpbmcgJHJvdXRlOiBcIiwgJGRlbGVnYXRlKTtcbiAgICAgICAgICAgICAgcmV0dXJuICRkZWxlZ2F0ZTtcbiAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcignJHJvdXRlUGFyYW1zJywgWyckZGVsZWdhdGUnLCAoJGRlbGVnYXRlKSA9PiB7XG4gICAgICAgICAgICAgIC8vbG9nLmRlYnVnKFwiVXNpbmcgJHJvdXRlUGFyYW1zOiBcIiwgc2VhcmNoKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlYXJjaDtcbiAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICB9XSk7XG4gICAgICAgICAgaWYgKCF3aWRnZXQuc2l6ZV94IHx8IHdpZGdldC5zaXplX3ggPCAxKSB7XG4gICAgICAgICAgICB3aWRnZXQuc2l6ZV94ID0gMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCF3aWRnZXQuc2l6ZV95IHx8IHdpZGdldC5zaXplX3kgPCAxKSB7XG4gICAgICAgICAgICB3aWRnZXQuc2l6ZV95ID0gMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGRpdiA9ICQoJzxkaXY+PC9kaXY+Jyk7XG4gICAgICAgICAgZGl2Lmh0bWwodGVtcGxhdGUpO1xuICAgICAgICAgIHZhciBib2R5ID0gZGl2LmZpbmQoJy53aWRnZXQtYm9keScpO1xuICAgICAgICAgIHZhciB3aWRnZXRCb2R5ID0gJHRlbXBsYXRlUmVxdWVzdCh3aWRnZXQuaW5jbHVkZSk7XG4gICAgICAgICAgd2lkZ2V0Qm9keS50aGVuKCh3aWRnZXRCb2R5KSA9PiB7XG4gICAgICAgICAgICB2YXIgb3V0ZXJEaXYgPSBhbmd1bGFyLmVsZW1lbnQoJHRlbXBsYXRlQ2FjaGUuZ2V0KCd3aWRnZXRCbG9ja1RlbXBsYXRlLmh0bWwnKSk7XG4gICAgICAgICAgICBib2R5Lmh0bWwod2lkZ2V0Qm9keSk7XG4gICAgICAgICAgICBvdXRlckRpdi5odG1sKGJvZHkpO1xuICAgICAgICAgICAgYW5ndWxhci5ib290c3RyYXAoYm9keSwgW3RtcE1vZHVsZU5hbWVdKTtcbiAgICAgICAgICAgIHZhciB3ID0gZ3JpZHN0ZXIuYWRkX3dpZGdldChvdXRlckRpdiwgd2lkZ2V0LnNpemVfeCwgd2lkZ2V0LnNpemVfeSwgd2lkZ2V0LmNvbCwgd2lkZ2V0LnJvdyk7XG4gICAgICAgICAgICAkc2NvcGUud2lkZ2V0TWFwW3dpZGdldC5pZF0gPSB7XG4gICAgICAgICAgICAgIHdpZGdldDogd1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIG1heWJlRmluaXNoVXAoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHNlcmlhbGl6ZURhc2hib2FyZCgpIHtcbiAgICAgICAgdmFyIGdyaWRzdGVyID0gZ2V0R3JpZHN0ZXIoKTtcbiAgICAgICAgaWYgKGdyaWRzdGVyKSB7XG4gICAgICAgICAgdmFyIGRhdGEgPSBncmlkc3Rlci5zZXJpYWxpemUoKTtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiZ290IGRhdGE6IFwiICsgSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuXG4gICAgICAgICAgdmFyIHdpZGdldHMgPSAkc2NvcGUuZGFzaGJvYXJkLndpZGdldHMgfHwgW107XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coXCJXaWRnZXRzOiBcIiwgd2lkZ2V0cyk7XG5cbiAgICAgICAgICAvLyBsZXRzIGFzc3VtZSB0aGUgZGF0YSBpcyBpbiB0aGUgb3JkZXIgb2YgdGhlIHdpZGdldHMuLi5cbiAgICAgICAgICBhbmd1bGFyLmZvckVhY2god2lkZ2V0cywgKHdpZGdldCwgaWR4KSA9PiB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW2lkeF07XG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgd2lkZ2V0KSB7XG4gICAgICAgICAgICAgIC8vIGxldHMgY29weSB0aGUgdmFsdWVzIGFjcm9zc1xuICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2godmFsdWUsIChhdHRyLCBrZXkpID0+IHdpZGdldFtrZXldID0gYXR0cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBtYWtlUmVzaXphYmxlKCkge1xuXG4gICAgICAgIC8qXG5cbiAgICAgICAgdmFyIGJsb2NrczphbnkgPSAkKCcuZ3JpZC1ibG9jaycpO1xuICAgICAgICBibG9ja3MucmVzaXphYmxlKCdkZXN0cm95Jyk7XG5cbiAgICAgICAgYmxvY2tzLnJlc2l6YWJsZSh7XG4gICAgICAgICAgZ3JpZDogW2dyaWRTaXplICsgKGdyaWRNYXJnaW4gKiAyKSwgZ3JpZFNpemUgKyAoZ3JpZE1hcmdpbiAqIDIpXSxcbiAgICAgICAgICBhbmltYXRlOiBmYWxzZSxcbiAgICAgICAgICBtaW5XaWR0aDogZ3JpZFNpemUsXG4gICAgICAgICAgbWluSGVpZ2h0OiBncmlkU2l6ZSxcbiAgICAgICAgICBhdXRvSGlkZTogZmFsc2UsXG4gICAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uKGV2ZW50LCB1aSkge1xuICAgICAgICAgICAgZ3JpZEhlaWdodCA9IGdldEdyaWRzdGVyKCkuJGVsLmhlaWdodCgpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVzaXplOiBmdW5jdGlvbihldmVudCwgdWkpIHtcbiAgICAgICAgICAgIC8vc2V0IG5ldyBncmlkIGhlaWdodCBhbG9uZyB0aGUgZHJhZ2dpbmcgcGVyaW9kXG4gICAgICAgICAgICB2YXIgZyA9IGdldEdyaWRzdGVyKCk7XG4gICAgICAgICAgICB2YXIgZGVsdGEgPSBncmlkU2l6ZSArIGdyaWRNYXJnaW4gKiAyO1xuICAgICAgICAgICAgaWYgKGV2ZW50Lm9mZnNldFkgPiBnLiRlbC5oZWlnaHQoKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdmFyIGV4dHJhID0gTWF0aC5mbG9vcigoZXZlbnQub2Zmc2V0WSAtIGdyaWRIZWlnaHQpIC8gZGVsdGEgKyAxKTtcbiAgICAgICAgICAgICAgdmFyIG5ld0hlaWdodCA9IGdyaWRIZWlnaHQgKyBleHRyYSAqIGRlbHRhO1xuICAgICAgICAgICAgICBnLiRlbC5jc3MoJ2hlaWdodCcsIG5ld0hlaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzdG9wOiBmdW5jdGlvbihldmVudCwgdWkpIHtcbiAgICAgICAgICAgIHZhciByZXNpemVkID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJlc2l6ZUJsb2NrKHJlc2l6ZWQpO1xuICAgICAgICAgICAgfSwgMzAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgICQoJy51aS1yZXNpemFibGUtaGFuZGxlJykuaG92ZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZ2V0R3JpZHN0ZXIoKS5kaXNhYmxlKCk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGdldEdyaWRzdGVyKCkuZW5hYmxlKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICovXG4gICAgICB9XG5cblxuICAgICAgZnVuY3Rpb24gcmVzaXplQmxvY2soZWxtT2JqKSB7XG4gICAgICAgIC8vdmFyIGVsbU9iaiA9ICQoZWxtT2JqKTtcbiAgICAgICAgdmFyIGFyZWEgPSBlbG1PYmouZmluZCgnLndpZGdldC1hcmVhJyk7XG4gICAgICAgIHZhciB3ID0gZWxtT2JqLndpZHRoKCkgLSBncmlkU2l6ZTtcbiAgICAgICAgdmFyIGggPSBlbG1PYmouaGVpZ2h0KCkgLSBncmlkU2l6ZTtcblxuICAgICAgICBmb3IgKHZhciBncmlkX3cgPSAxOyB3ID4gMDsgdyAtPSAoZ3JpZFNpemUgKyAoZ3JpZE1hcmdpbiAqIDIpKSkge1xuICAgICAgICAgIGdyaWRfdysrO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgZ3JpZF9oID0gMTsgaCA+IDA7IGggLT0gKGdyaWRTaXplICsgKGdyaWRNYXJnaW4gKiAyKSkpIHtcbiAgICAgICAgICBncmlkX2grKztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB3aWRnZXQgPSB7XG4gICAgICAgICAgaWQ6IGFyZWEuYXR0cignZGF0YS13aWRnZXRJZCcpXG4gICAgICAgIH07XG5cbiAgICAgICAgY2hhbmdlV2lkZ2V0U2l6ZSh3aWRnZXQsIGZ1bmN0aW9uKHdpZGdldCkge1xuICAgICAgICAgIHdpZGdldC5zaXplX3ggPSBncmlkX3c7XG4gICAgICAgICAgd2lkZ2V0LnNpemVfeSA9IGdyaWRfaDtcbiAgICAgICAgfSwgZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgICAgICAgaWYgKHNlcmlhbGl6ZURhc2hib2FyZCgpKSB7XG4gICAgICAgICAgICB1cGRhdGVEYXNoYm9hcmRSZXBvc2l0b3J5KFwiQ2hhbmdlZCBzaXplIG9mIHdpZGdldDogXCIgKyB3aWRnZXQuaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKCRzY29wZS5kYXNoYm9hcmQpIHtcbiAgICAgICAgICB2YXIgY29tbWl0TWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgaWYgKCRzY29wZS5kYXNoYm9hcmQgJiYgJHNjb3BlLmRhc2hib2FyZC50aXRsZSkge1xuICAgICAgICAgICAgY29tbWl0TWVzc2FnZSArPSBcIiBvbiBkYXNoYm9hcmQgXCIgKyAkc2NvcGUuZGFzaGJvYXJkLnRpdGxlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoWyRzY29wZS5kYXNoYm9hcmRdLCBjb21taXRNZXNzYWdlLCBEYXNoYm9hcmQub25PcGVyYXRpb25Db21wbGV0ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZ2V0R3JpZHN0ZXIoKSB7XG4gICAgICAgIHJldHVybiAkZWxlbWVudC5ncmlkc3RlcigpLmRhdGEoJ2dyaWRzdGVyJyk7XG4gICAgICB9XG5cbiAgICB9XTtcblxuICB9XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuICBfbW9kdWxlLmNvbnRyb2xsZXIoXCJEYXNoYm9hcmQuSW1wb3J0Q29udHJvbGxlclwiLCBbXCIkc2NvcGVcIiwgXCIkbG9jYXRpb25cIiwgXCIkcm91dGVQYXJhbXNcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsICgkc2NvcGUsICRsb2NhdGlvbiwgJHJvdXRlUGFyYW1zLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnkpID0+IHtcbiAgICAkc2NvcGUucGxhY2Vob2xkZXIgPSBcIlBhc3RlIHRoZSBKU09OIGhlcmUgZm9yIHRoZSBkYXNoYm9hcmQgY29uZmlndXJhdGlvbiB0byBpbXBvcnQuLi5cIjtcbiAgICAkc2NvcGUuc291cmNlID0gJHNjb3BlLnBsYWNlaG9sZGVyO1xuXG4gICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICBtb2RlOiB7XG4gICAgICAgIG5hbWU6IFwiamF2YXNjcmlwdFwiXG4gICAgICB9XG4gICAgfTtcbiAgICAvLyRzY29wZS5jb2RlTWlycm9yT3B0aW9ucyA9IENvZGVFZGl0b3IuY3JlYXRlRWRpdG9yU2V0dGluZ3Mob3B0aW9ucyk7XG5cblxuICAgICRzY29wZS5pc1ZhbGlkID0gKCkgPT4gJHNjb3BlLnNvdXJjZSAmJiAkc2NvcGUuc291cmNlICE9PSAkc2NvcGUucGxhY2Vob2xkZXI7XG5cbiAgICAkc2NvcGUuaW1wb3J0SlNPTiA9ICgpID0+IHtcbiAgICAgIHZhciBqc29uID0gW107XG4gICAgICAvLyBsZXRzIHBhcnNlIHRoZSBKU09OLi4uXG4gICAgICB0cnkge1xuICAgICAgICBqc29uID0gSlNPTi5wYXJzZSgkc2NvcGUuc291cmNlKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy9IYXd0aW9Db3JlLm5vdGlmaWNhdGlvbihcImVycm9yXCIsIFwiQ291bGQgbm90IHBhcnNlIHRoZSBKU09OXFxuXCIgKyBlKTtcbiAgICAgICAganNvbiA9IFtdO1xuICAgICAgfVxuICAgICAgdmFyIGFycmF5ID0gW107XG4gICAgICBpZiAoYW5ndWxhci5pc0FycmF5KGpzb24pKSB7XG4gICAgICAgIGFycmF5ID0ganNvbjtcbiAgICAgIH0gZWxzZSBpZiAoYW5ndWxhci5pc09iamVjdChqc29uKSkge1xuICAgICAgICBhcnJheS5wdXNoKGpzb24pO1xuICAgICAgfVxuXG4gICAgICBpZiAoYXJyYXkubGVuZ3RoKSB7XG4gICAgICAgIC8vIGxldHMgZW5zdXJlIHdlIGhhdmUgc29tZSB2YWxpZCBpZHMgYW5kIHN0dWZmLi4uXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChhcnJheSwgKGRhc2gsIGluZGV4KSA9PiB7XG4gICAgICAgICAgYW5ndWxhci5jb3B5KGRhc2gsIGRhc2hib2FyZFJlcG9zaXRvcnkuY3JlYXRlRGFzaGJvYXJkKGRhc2gpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhhcnJheSwgXCJJbXBvcnRlZCBkYXNoYm9hcmQgSlNPTlwiLCBEYXNoYm9hcmQub25PcGVyYXRpb25Db21wbGV0ZSk7XG4gICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9lZGl0XCIpO1xuICAgICAgfVxuICAgIH1cbiAgfV0pO1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG4gIF9tb2R1bGUuY29udHJvbGxlcihcIkRhc2hib2FyZC5OYXZCYXJDb250cm9sbGVyXCIsIFtcIiRzY29wZVwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcIiRyb290U2NvcGVcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsICgkc2NvcGUsICRyb3V0ZVBhcmFtcywgJHJvb3RTY29wZSwgZGFzaGJvYXJkUmVwb3NpdG9yeTpEYXNoYm9hcmRSZXBvc2l0b3J5KSA9PiB7XG5cbiAgICAkc2NvcGUuX2Rhc2hib2FyZHMgPSBbXTtcblxuICAgICRzY29wZS5hY3RpdmVEYXNoYm9hcmQgPSAkcm91dGVQYXJhbXNbJ2Rhc2hib2FyZElkJ107XG5cbiAgICAkc2NvcGUuJG9uKCdsb2FkRGFzaGJvYXJkcycsIGxvYWREYXNoYm9hcmRzKTtcblxuICAgICRzY29wZS4kb24oJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkTG9hZGVkKTtcblxuICAgICRzY29wZS5kYXNoYm9hcmRzID0gKCkgPT4ge1xuICAgICAgcmV0dXJuICRzY29wZS5fZGFzaGJvYXJkc1xuICAgIH07XG5cbiAgICAkc2NvcGUub25UYWJSZW5hbWVkID0gZnVuY3Rpb24oZGFzaCkge1xuICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKFtkYXNoXSwgXCJSZW5hbWVkIGRhc2hib2FyZFwiLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZGFzaGJvYXJkTG9hZGVkKGV2ZW50LCBkYXNoYm9hcmRzKSB7XG4gICAgICBsb2cuZGVidWcoXCJuYXZiYXIgZGFzaGJvYXJkTG9hZGVkOiBcIiwgZGFzaGJvYXJkcyk7XG4gICAgICAkc2NvcGUuX2Rhc2hib2FyZHMgPSBkYXNoYm9hcmRzO1xuICAgICAgaWYgKGV2ZW50ID09PSBudWxsKSB7XG4gICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnZGFzaGJvYXJkc1VwZGF0ZWQnLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2FkRGFzaGJvYXJkcyhldmVudCkge1xuICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXREYXNoYm9hcmRzKChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIC8vIHByZXZlbnQgdGhlIGJyb2FkY2FzdCBmcm9tIGhhcHBlbmluZy4uLlxuICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1dKTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuICBleHBvcnQgdmFyIFNoYXJlQ29udHJvbGxlciA9IF9tb2R1bGUuY29udHJvbGxlcihcIkRhc2hib2FyZC5TaGFyZUNvbnRyb2xsZXJcIiwgW1wiJHNjb3BlXCIsIFwiJGxvY2F0aW9uXCIsIFwiJHJvdXRlUGFyYW1zXCIsIFwiZGFzaGJvYXJkUmVwb3NpdG9yeVwiLCAoJHNjb3BlLCAkbG9jYXRpb24sICRyb3V0ZVBhcmFtcywgZGFzaGJvYXJkUmVwb3NpdG9yeTpEYXNoYm9hcmRSZXBvc2l0b3J5KSA9PiB7XG4gICAgdmFyIGlkID0gJHJvdXRlUGFyYW1zW1wiZGFzaGJvYXJkSWRcIl07XG4gICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXREYXNoYm9hcmQoaWQsIG9uRGFzaGJvYXJkTG9hZCk7XG5cbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIG1vZGU6IHtcbiAgICAgICAgICBuYW1lOiBcImphdmFzY3JpcHRcIlxuICAgICAgfVxuICAgIH07XG4gICAgLy8kc2NvcGUuY29kZU1pcnJvck9wdGlvbnMgPSBDb2RlRWRpdG9yLmNyZWF0ZUVkaXRvclNldHRpbmdzKG9wdGlvbnMpO1xuXG4gICAgZnVuY3Rpb24gb25EYXNoYm9hcmRMb2FkKGRhc2hib2FyZCkge1xuICAgICAgJHNjb3BlLmRhc2hib2FyZCA9IERhc2hib2FyZC5jbGVhbkRhc2hib2FyZERhdGEoZGFzaGJvYXJkKTtcblxuICAgICAgJHNjb3BlLmpzb24gPSB7XG4gICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJoYXd0aW8gZGFzaGJvYXJkc1wiLFxuICAgICAgICBcInB1YmxpY1wiOiB0cnVlLFxuICAgICAgICBcImZpbGVzXCI6IHtcbiAgICAgICAgICBcImRhc2hib2FyZHMuanNvblwiOiB7XG4gICAgICAgICAgICBcImNvbnRlbnRcIjogSlNPTi5zdHJpbmdpZnkoJHNjb3BlLmRhc2hib2FyZCwgbnVsbCwgXCIgIFwiKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgJHNjb3BlLnNvdXJjZSA9IEpTT04uc3RyaW5naWZ5KCRzY29wZS5kYXNoYm9hcmQsIG51bGwsIFwiICBcIik7XG4gICAgICBDb3JlLiRhcHBseU5vd09yTGF0ZXIoJHNjb3BlKTtcbiAgICB9XG4gIH1dKTtcbn1cbiIsIi8vLyBDb3B5cmlnaHQgMjAxNC0yMDE1IFJlZCBIYXQsIEluYy4gYW5kL29yIGl0cyBhZmZpbGlhdGVzXG4vLy8gYW5kIG90aGVyIGNvbnRyaWJ1dG9ycyBhcyBpbmRpY2F0ZWQgYnkgdGhlIEBhdXRob3IgdGFncy5cbi8vL1xuLy8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8vXG4vLy8gICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vL1xuLy8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vaW5jbHVkZXMudHNcIi8+XG5tb2R1bGUgRXhhbXBsZSB7XG5cbiAgZXhwb3J0IHZhciBwbHVnaW5OYW1lID0gXCJoYXd0aW8tYXNzZW1ibHlcIjtcblxuICBleHBvcnQgdmFyIGxvZzogTG9nZ2luZy5Mb2dnZXIgPSBMb2dnZXIuZ2V0KHBsdWdpbk5hbWUpO1xuXG4gIGV4cG9ydCB2YXIgdGVtcGxhdGVQYXRoID0gXCJwbHVnaW5zL2V4YW1wbGUvaHRtbFwiO1xufVxuIiwiLy8vIENvcHlyaWdodCAyMDE0LTIwMTUgUmVkIEhhdCwgSW5jLiBhbmQvb3IgaXRzIGFmZmlsaWF0ZXNcbi8vLyBhbmQgb3RoZXIgY29udHJpYnV0b3JzIGFzIGluZGljYXRlZCBieSB0aGUgQGF1dGhvciB0YWdzLlxuLy8vXG4vLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLy9cbi8vLyAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8vXG4vLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9pbmNsdWRlcy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJleGFtcGxlR2xvYmFscy50c1wiLz5cbm1vZHVsZSBFeGFtcGxlIHtcblxuICBleHBvcnQgdmFyIF9tb2R1bGUgPSBhbmd1bGFyLm1vZHVsZShFeGFtcGxlLnBsdWdpbk5hbWUsIFtdKTtcblxuICB2YXIgdGFiID0gdW5kZWZpbmVkO1xuXG4gIF9tb2R1bGUuY29uZmlnKFtcIiRsb2NhdGlvblByb3ZpZGVyXCIsIFwiJHJvdXRlUHJvdmlkZXJcIiwgXCJIYXd0aW9OYXZCdWlsZGVyUHJvdmlkZXJcIixcbiAgICAoJGxvY2F0aW9uUHJvdmlkZXIsICRyb3V0ZVByb3ZpZGVyOiBuZy5yb3V0ZS5JUm91dGVQcm92aWRlciwgYnVpbGRlcjogSGF3dGlvTWFpbk5hdi5CdWlsZGVyRmFjdG9yeSkgPT4ge1xuICAgIHRhYiA9IGJ1aWxkZXIuY3JlYXRlKClcbiAgICAgIC5pZChFeGFtcGxlLnBsdWdpbk5hbWUpXG4gICAgICAudGl0bGUoKCkgPT4gXCJFeGFtcGxlXCIpXG4gICAgICAuaHJlZigoKSA9PiBcIi9leGFtcGxlXCIpXG4gICAgICAuc3ViUGF0aChcIlBhZ2UgMVwiLCBcInBhZ2UxXCIsIGJ1aWxkZXIuam9pbihFeGFtcGxlLnRlbXBsYXRlUGF0aCwgXCJwYWdlMS5odG1sXCIpKVxuICAgICAgLmJ1aWxkKCk7XG4gICAgYnVpbGRlci5jb25maWd1cmVSb3V0aW5nKCRyb3V0ZVByb3ZpZGVyLCB0YWIpO1xuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgfV0pO1xuXG4gIF9tb2R1bGUucnVuKFtcIkhhd3Rpb05hdlwiLCAoSGF3dGlvTmF2OiBIYXd0aW9NYWluTmF2LlJlZ2lzdHJ5KSA9PiB7XG4gICAgSGF3dGlvTmF2LmFkZCh0YWIpO1xuICAgIGxvZy5kZWJ1ZyhcImxvYWRlZFwiKTtcbiAgfV0pO1xuXG5cbiAgaGF3dGlvUGx1Z2luTG9hZGVyLmFkZE1vZHVsZShFeGFtcGxlLnBsdWdpbk5hbWUpO1xufVxuIiwiLy8vIENvcHlyaWdodCAyMDE0LTIwMTUgUmVkIEhhdCwgSW5jLiBhbmQvb3IgaXRzIGFmZmlsaWF0ZXNcbi8vLyBhbmQgb3RoZXIgY29udHJpYnV0b3JzIGFzIGluZGljYXRlZCBieSB0aGUgQGF1dGhvciB0YWdzLlxuLy8vXG4vLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLy9cbi8vLyAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8vXG4vLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJleGFtcGxlUGx1Z2luLnRzXCIvPlxubW9kdWxlIEV4YW1wbGUge1xuXG4gIGV4cG9ydCB2YXIgUGFnZTFDb250cm9sbGVyID0gX21vZHVsZS5jb250cm9sbGVyKFwiRXhhbXBsZS5QYWdlMUNvbnRyb2xsZXJcIiwgW1wiJHNjb3BlXCIsICgkc2NvcGUpID0+IHtcbiAgICAkc2NvcGUudGFyZ2V0ID0gXCJXb3JsZCFcIjtcbiAgfV0pO1xuXG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
angular.module("hawtio-dashboard-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("plugins/dashboard/html/addToDashboard.html","<div class=\"controller-section\" ng-controller=\"Dashboard.EditDashboardsController\">\n  <div class=\"row-fluid\">\n    <div class=\"span10 offset1 well\">\n      Select a dashboard (or multiple dashboards) in the table below and click \"Add View To Dashboard\" to add the view to a dashboard.  You can also create a new dashboard using the \"Create\" button, select it and then click the \"Add View To Dashboard\" to add the view to a new dashboard.\n    </div>\n  </div>\n  <div class=\"row-fluid\">\n\n    <div class=\"span12\">\n      <ul class=\"nav nav-tabs\">\n        <li>\n          <a href=\"\" ng-disabled=\"!hasSelection()\" ng-click=\"addViewToDashboard()\"\n                    title=\"Adds the current view to the selected dashboard(s)\" data-placement=\"bottom\">\n            <i class=\"icon-dashboard\"></i> Add View To Dashboard\n          </a>\n        </li>\n\n        <li>\n          <a href=\"\" ng-click=\"create()\"\n                  title=\"Create a new empty dashboard\" data-placement=\"bottom\">\n            <i class=\"icon-plus\"></i> Create\n          </a>\n        </li>\n\n      </ul>\n\n    </div>\n    <!--\n    <div class=\"span6\">\n      <div class=\"control-group\">\n        <input type=\"text\" class=\"span12 search-query\" ng-model=\"gridOptions.filterOptions.filterText\" placeholder=\"Filter...\">\n      </div>\n    </div>\n    -->\n  </div>\n\n  <div class=\"row-fluid\">\n    <div class=\"gridStyle\" ng-grid=\"gridOptions\"></div>\n  </div>\n</div>\n");
$templateCache.put("plugins/dashboard/html/dashboard.html","<script type=\"text/ng-template\" id=\"widgetTemplate\">\n  <div class=\"widget-area\" data-widgetId=\"{{widget.id}}\">\n    <div class=\"widget-title\">\n      <div class=\"row-fluid\">\n        <div class=\"pull-left\">\n          <editable-property ng-model=\"widget\" property=\"title\" on-save=\"onWidgetRenamed(widget)\"></editable-property>\n        </div>\n        <div class=\"pull-right\">\n          <i class=\"icon-remove\" title=\"Removes this view from the dashboard\" ng-click=\"removeWidget(widget)\"></i>\n        </div>\n      </div>\n    </div>\n    <div class=\"widget-body\">\n    </div>\n  </div>\n</script>\n<script type=\"text/ng-template\" id=\"widgetBlockTemplate.html\">\n  <li class=\"grid-block\" style=\"display: list-item; position: absolute\" ng-non-bindable data-$injector=\"\"></li>\n</script>\n\n<!--\n<div class=\"gridster\" ng-controller=\"Dashboard.DashboardController\">\n  <ul id=\"widgets\">\n  </ul>\n</div>\n-->\n\n<div class=\"row-fluid\">\n  <div class=\"span12 gridster\">\n    <ul id=\"widgets\" hawtio-dashboard></ul>\n  </div>\n</div>\n\n\n");
$templateCache.put("plugins/dashboard/html/editDashboards.html","<div class=\"controller-section\" ng-controller=\"Dashboard.EditDashboardsController\">\n  <div class=\"row-fluid\">\n\n    <div class=\"span12\">\n      <ul class=\"nav nav-tabs\">\n        <li>\n          <a href=\"\"\n             ng-click=\"create()\"\n             title=\"Create a new empty dashboard\"\n             data-placement=\"bottom\">\n            <i class=\"icon-plus\"></i> Create</a>\n        </li>\n        <li>\n          <a href=\"\"\n             ng-disabled=\"!hasSelection()\"\n             ng-click=\"duplicate()\"\n                  title=\"Create a copy of the selected dashboard(s)\" data-placement=\"bottom\">\n            <i class=\"icon-copy\"></i> Duplicate\n          </a>\n        </li>\n        <li>\n          <a href=\"\"\n             ng-show=\"usingFabric()\"\n             ng-disabled=\"!hasSelection()\"\n             ng-click=\"duplicateToProfiles()\"\n             title=\"Copy selected dashboards to another profile\">\n            <i class=\"icon-copy\"></i> Duplicate to profiles\n          </a>\n        </li>\n        <li>\n          <a href=\"\"\n             ng-disabled=\"!hasSelection()\"\n             ng-click=\"deleteDashboard()\"><i\n                  class=\"icon-remove\"></i> Delete\n          </a>\n        </li>\n        <li class=\"pull-right\">\n          <a href=\"#/dashboard/import\"\n             title=\"Imports a JSON dashboard configuration from github or some other URL\"\n             data-placement=\"bottom\">\n            <i class=\"icon-cloud-download\"></i> Import\n          </a>\n\n        </li>\n      </ul>\n    </div>\n  </div>\n\n  <div class=\"row-fluid\">\n    <div class=\"span12\">\n      <div class=\"gridStyle\" ng-grid=\"gridOptions\"></div>\n    </div>\n  </div>\n\n\n  <div modal=\"duplicateDashboards.show\">\n    <form name=\"addProfile\" class=\"form-horizontal no-bottom-margin\" ng-submit=\"doDuplicateToProfiles()\">\n      <div class=\"modal-header\"><h4>Copy dashboards</h4></div>\n      <div id=\"dialog-body\" class=\"modal-body\">\n        <label>Select one or more profiles to copy the dashboards to: </label>\n\n        <div fabric-profile-selector=\"selectedProfilesDialog\" version-id=\"container.versionId\" no-links=\"true\"></div>\n\n      </div>\n      <div class=\"modal-footer\">\n        <input class=\"btn btn-success\" ng-disabled=\"selectedProfilesDialog.length == 0\" type=\"submit\"\n               value=\"Copy\">\n        <input class=\"btn btn-primary\" ng-click=\"duplicateDashboards.close()\" type=\"button\" value=\"Cancel\">\n      </div>\n    </form>\n  </div>\n\n\n\n\n</div>\n");
$templateCache.put("plugins/dashboard/html/import.html","<div class=\"form-horizontal\" ng-controller=\"Dashboard.ImportController\">\n  <div class=\"control-group\">\n    <button id=\"importButton\" ng-disabled=\"!isValid()\" ng-click=\"importJSON()\"\n            class=\"btn btn-info\"\n            title=\"Imports the JSON configuration of the dashboard\">\n      <i class=\"icon-cloud-download\"></i> import dashboard JSON\n    </button>\n    <div id=\"alert-area\" class=\"span9 pull-right\"></div>\n  </div>\n  <div class=\"control-group\">\n    <textarea id=\"source\" ui-codemirror=\"codeMirrorOptions\" ng-model=\"source\"></textarea>\n  </div>\n</div>");
$templateCache.put("plugins/dashboard/html/layoutDashboard.html","<ul class=\"nav nav-tabs\" ng-controller=\"Dashboard.NavBarController\">\n  <li ng-repeat=\"dash in _dashboards track by $index\"\n      ng-class=\'{active : isActive(dash)}\'>\n    <a ng-href=\"#/dashboard/id/{{dash.id}}{{hash}}\">\n      <editable-property class=\"inline-block\"\n                         on-save=\"onTabRenamed(dash)\"\n                         property=\"title\"\n                         ng-model=\"dash\"></editable-property>\n    </a>\n  </li>\n  <li class=\"pull-right\" ng-class=\'{active : isEditing()}\'>\n    <a ng-href=\"#/dashboard/edit{{hash}}\" title=\"Manage the dashboards; letting you add, duplicate or remove dashboards\"\n       data-placement=\"bottom\">\n      <i class=\"icon-edit\"></i> Manage</a></li>\n</ul>\n<div class=\"row-fluid\">\n  <div ng-view></div>\n</div>\n\n\n");
$templateCache.put("plugins/example/html/page1.html","<div class=\"row\">\n  <div class=\"col-md-12\" ng-controller=\"Example.Page1Controller\">\n    <h1>Page 1</h1>\n    <p class=\'customClass\'>Hello {{target}}</p>\n  </div>\n</div>\n");}]); hawtioPluginLoader.addModule("hawtio-dashboard-templates");