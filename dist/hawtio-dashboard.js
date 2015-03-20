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
                    "path": "jmx/attributes",
                    "include": "",
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
                    "include": "",
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
                    "path": "jmx/widget/donut",
                    "include": "",
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
                    "path": "jmx/charts",
                    "include": "",
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
                    "path": "jmx/widget/area",
                    "include": "",
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
    Dashboard._module.directive('hawtioDashboard', function () {
        return new Dashboard.GridsterDirective();
    });
    var GridsterDirective = (function () {
        function GridsterDirective() {
            this.restrict = 'A';
            this.replace = true;
            this.controller = ["$scope", "$element", "$attrs", "$location", "$routeParams", "$injector", "$route", "$templateCache", "dashboardRepository", "$compile", function ($scope, $element, $attrs, $location, $routeParams, $injector, $route, $templateCache, dashboardRepository, $compile) {
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
                    angular.forEach(widgets, function (widget) {
                        var childScope = $scope.$new(false);
                        childScope.widget = widget;
                        var path = widget.path;
                        var search = null;
                        if (widget.search) {
                            search = Dashboard.decodeURIComponentProperties(widget.search);
                        }
                        var hash = widget.hash;
                        var location = new Dashboard.RectangleLocation($location, path, search, hash);
                        var routeParams = null;
                        if (widget.routeParams) {
                            routeParams = angular.fromJson(widget.routeParams);
                        }
                        var $$scopeInjections = {
                            location: location,
                            $location: location,
                            $routeParams: routeParams
                        };
                        childScope.$$scopeInjections = $$scopeInjections;
                        childScope.inDashboard = true;
                        if (!widget.size_x || widget.size_x < 1) {
                            widget.size_x = 1;
                        }
                        if (!widget.size_y || widget.size_y < 1) {
                            widget.size_y = 1;
                        }
                        var div = $('<div></div>');
                        div.html(template);
                        var outerDiv = $('<li class="grid-block" style="display: list-item; position: absolute"></li>');
                        outerDiv.html($compile(div.contents())(childScope));
                        var w = gridster.add_widget(outerDiv, widget.size_x, widget.size_y, widget.col, widget.row);
                        $scope.widgetMap[widget.id] = {
                            widget: w,
                            scope: childScope
                        };
                    });
                    makeResizable();
                    getGridster().enable();
                    Core.$apply($scope);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluY2x1ZGVzLmpzIiwiL2hvbWUvZ2FzaGNydW1iL1dvcmsvU291cmNlL2hhd3Rpby1kYXNoYm9hcmQvZGFzaGJvYXJkL3RzL2Rhc2hib2FyZEludGVyZmFjZXMudHMiLCIvaG9tZS9nYXNoY3J1bWIvV29yay9Tb3VyY2UvaGF3dGlvLWRhc2hib2FyZC9kYXNoYm9hcmQvdHMvZGFzaGJvYXJkSGVscGVycy50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9kYXNoYm9hcmRQbHVnaW4udHMiLCIvaG9tZS9nYXNoY3J1bWIvV29yay9Tb3VyY2UvaGF3dGlvLWRhc2hib2FyZC9kYXNoYm9hcmQvdHMvZGFzaGJvYXJkUmVwb3NpdG9yeS50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9lZGl0RGFzaGJvYXJkcy50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9yZWN0YW5nbGVMb2NhdGlvbi50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9ncmlkc3RlckRpcmVjdGl2ZS50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9pbXBvcnQudHMiLCIvaG9tZS9nYXNoY3J1bWIvV29yay9Tb3VyY2UvaGF3dGlvLWRhc2hib2FyZC9kYXNoYm9hcmQvdHMvbmF2YmFyLnRzIiwiL2hvbWUvZ2FzaGNydW1iL1dvcmsvU291cmNlL2hhd3Rpby1kYXNoYm9hcmQvZGFzaGJvYXJkL3RzL3NoYXJlLnRzIiwiL2hvbWUvZ2FzaGNydW1iL1dvcmsvU291cmNlL2hhd3Rpby1kYXNoYm9hcmQvZXhhbXBsZS90cy9leGFtcGxlR2xvYmFscy50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2V4YW1wbGUvdHMvZXhhbXBsZVBsdWdpbi50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2V4YW1wbGUvdHMvcGFnZTEudHMiXSwibmFtZXMiOlsiRGFzaGJvYXJkIiwiRGFzaGJvYXJkLmNsZWFuRGFzaGJvYXJkRGF0YSIsIkRhc2hib2FyZC5kZWNvZGVVUklDb21wb25lbnRQcm9wZXJ0aWVzIiwiRGFzaGJvYXJkLm9uT3BlcmF0aW9uQ29tcGxldGUiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5IiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5jb25zdHJ1Y3RvciIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkubG9hZERhc2hib2FyZHMiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5LnN0b3JlRGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZGVsZXRlRGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkIiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5jcmVhdGVEYXNoYm9hcmQiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5LmNsb25lRGFzaGJvYXJkIiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlIiwiRGFzaGJvYXJkLnVwZGF0ZURhdGEiLCJEYXNoYm9hcmQuZGFzaGJvYXJkTG9hZGVkIiwiRGFzaGJvYXJkLmRhc2hib2FyZHMiLCJEYXNoYm9hcmQuYWZ0ZXJTZWxlY3Rpb25DaGFuZ2UiLCJEYXNoYm9hcmQuZGVzZWxlY3RBbGwiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24iLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uY29uc3RydWN0b3IiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uYWJzVXJsIiwiRGFzaGJvYXJkLlJlY3RhbmdsZUxvY2F0aW9uLmhhc2giLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uaG9zdCIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbi5wYXRoIiwiRGFzaGJvYXJkLlJlY3RhbmdsZUxvY2F0aW9uLnBvcnQiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24ucHJvdG9jb2wiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24ucmVwbGFjZSIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbi5zZWFyY2giLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24udXJsIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLmNoYW5nZVdpZGdldFNpemUiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3IudXBkYXRlV2lkZ2V0cyIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5vbkRhc2hib2FyZExvYWQiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3Iuc2VyaWFsaXplRGFzaGJvYXJkIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLm1ha2VSZXNpemFibGUiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3IucmVzaXplQmxvY2siLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3IudXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeSIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5nZXRHcmlkc3RlciIsIkRhc2hib2FyZC5sb2FkRGFzaGJvYXJkcyIsIkRhc2hib2FyZC5vbkRhc2hib2FyZExvYWQiLCJFeGFtcGxlIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FDd0JDOztBQ3BCRCxJQUFPLFNBQVMsQ0E0Q2Y7QUE1Q0QsV0FBTyxTQUFTLEVBQUMsQ0FBQztJQUVMQSxhQUFHQSxHQUFrQkEsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0E7SUFVeERBLFNBQWdCQSxrQkFBa0JBLENBQUNBLElBQUlBO1FBQ3JDQyxJQUFJQSxTQUFTQSxHQUFHQSxFQUFFQSxDQUFDQTtRQUNuQkEsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsRUFBRUEsVUFBQ0EsS0FBS0EsRUFBRUEsR0FBR0E7WUFDL0JBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLFFBQVFBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLFVBQVVBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLFVBQVVBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUM3RUEsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0E7WUFDekJBLENBQUNBO1FBQ0hBLENBQUNBLENBQUNBLENBQUNBO1FBQ0hBLE1BQU1BLENBQUNBLFNBQVNBLENBQUNBO0lBQ25CQSxDQUFDQTtJQVJlRCw0QkFBa0JBLEdBQWxCQSxrQkFRZkEsQ0FBQUE7SUFVREEsU0FBZ0JBLDRCQUE0QkEsQ0FBQ0EsSUFBSUE7UUFDL0NFLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO1lBQ1ZBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO1FBQ2RBLENBQUNBO1FB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Q0FBQ0E7QUFFTkEsQ0FBQ0EsRUFOTSxPQUFPLEtBQVAsT0FBTyxRQU1iIiwiZmlsZSI6ImNvbXBpbGVkLmpzIiwic291cmNlc0NvbnRlbnQiOltudWxsLCJtb2R1bGUgRGFzaGJvYXJkIHtcblxuICAvKipcbiAgICogQmFzZSBpbnRlcmZhY2UgdGhhdCBkYXNoYm9hcmQgcmVwb3NpdG9yaWVzIG11c3QgaW1wbGVtZW50XG4gICAqXG4gICAqIEBjbGFzcyBEYXNoYm9hcmRSZXBvc2l0b3J5XG4gICAqL1xuICBleHBvcnQgaW50ZXJmYWNlIERhc2hib2FyZFJlcG9zaXRvcnkge1xuXG4gICAgcHV0RGFzaGJvYXJkczogKGFycmF5OmFueVtdLCBjb21taXRNZXNzYWdlOnN0cmluZywgZm4pID0+IGFueTtcblxuICAgIGRlbGV0ZURhc2hib2FyZHM6IChhcnJheTphbnlbXSwgZm4pID0+IGFueTtcblxuICAgIGdldERhc2hib2FyZHM6IChmbikgPT4gYW55O1xuXG4gICAgZ2V0RGFzaGJvYXJkOiAoaWQ6c3RyaW5nLCBmbikgPT4gYW55O1xuXG4gICAgY3JlYXRlRGFzaGJvYXJkOiAob3B0aW9uczphbnkpID0+IGFueTtcblxuICAgIGNsb25lRGFzaGJvYXJkOihkYXNoYm9hcmQ6YW55KSA9PiBhbnk7XG5cbiAgICBnZXRUeXBlOigpID0+IHN0cmluZztcblxuICB9XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9pbmNsdWRlcy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRJbnRlcmZhY2VzLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcblxuICBleHBvcnQgdmFyIGxvZzpMb2dnaW5nLkxvZ2dlciA9IExvZ2dlci5nZXQoJ0Rhc2hib2FyZCcpO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjbGVhbmVkIHVwIHZlcnNpb24gb2YgdGhlIGRhc2hib2FyZCBkYXRhIHdpdGhvdXQgYW55IFVJIHNlbGVjdGlvbiBzdGF0ZVxuICAgKiBAbWV0aG9kIGNsZWFuRGFzaGJvYXJkRGF0YVxuICAgKiBAc3RhdGljXG4gICAqIEBmb3IgRGFzaGJvYXJkXG4gICAqIEBwYXJhbSB7YW55fSBpdGVtXG4gICAqIEByZXR1cm4ge2FueX1cbiAgICovXG4gIGV4cG9ydCBmdW5jdGlvbiBjbGVhbkRhc2hib2FyZERhdGEoaXRlbSkge1xuICAgIHZhciBjbGVhbkl0ZW0gPSB7fTtcbiAgICBhbmd1bGFyLmZvckVhY2goaXRlbSwgKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgIGlmICghYW5ndWxhci5pc1N0cmluZyhrZXkpIHx8ICgha2V5LnN0YXJ0c1dpdGgoXCIkXCIpICYmICFrZXkuc3RhcnRzV2l0aChcIl9cIikpKSB7XG4gICAgICAgIGNsZWFuSXRlbVtrZXldID0gdmFsdWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGNsZWFuSXRlbTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIGRlY29kZVVSSUNvbXBvbmVudCgpIG9uIGVhY2ggdmFsdWUgaW4gdGhlIG9iamVjdFxuICAgKiBAbWV0aG9kIGRlY29kZVVSSUNvbXBvbmVudFByb3BlcnRpZXNcbiAgICogQHN0YXRpY1xuICAgKiBAZm9yIERhc2hib2FyZFxuICAgKiBAcGFyYW0ge2FueX0gaGFzaFxuICAgKiBAcmV0dXJuIHthbnl9XG4gICAqL1xuICBleHBvcnQgZnVuY3Rpb24gZGVjb2RlVVJJQ29tcG9uZW50UHJvcGVydGllcyhoYXNoKSB7XG4gICAgaWYgKCFoYXNoKSB7XG4gICAgICByZXR1cm4gaGFzaDtcbiAgICB9XG4gICAgdmFyIGRlY29kZUhhc2ggPSB7fTtcbiAgICBhbmd1bGFyLmZvckVhY2goaGFzaCwgKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgIGRlY29kZUhhc2hba2V5XSA9IHZhbHVlID8gZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKSA6IHZhbHVlO1xuICAgIH0pO1xuICAgIHJldHVybiBkZWNvZGVIYXNoO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIG9uT3BlcmF0aW9uQ29tcGxldGUocmVzdWx0KSB7XG4gICAgY29uc29sZS5sb2coXCJDb21wbGV0ZWQgYWRkaW5nIHRoZSBkYXNoYm9hcmQgd2l0aCByZXNwb25zZSBcIiArIEpTT04uc3RyaW5naWZ5KHJlc3VsdCkpO1xuICB9XG59XG4iLCIvKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKiBAbWFpbiBEYXNoYm9hcmRcbiAqL1xuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZEhlbHBlcnMudHNcIi8+XG5tb2R1bGUgRGFzaGJvYXJkIHtcbiAgXG4gIGV4cG9ydCB2YXIgdGVtcGxhdGVQYXRoID0gJ3BsdWdpbnMvZGFzaGJvYXJkL2h0bWwvJztcbiAgZXhwb3J0IHZhciBwbHVnaW5OYW1lID0gJ2Rhc2hib2FyZCc7XG4gIFxuICBleHBvcnQgdmFyIF9tb2R1bGUgPSBhbmd1bGFyLm1vZHVsZShwbHVnaW5OYW1lLCBbXSk7XG5cbiAgX21vZHVsZS5jb25maWcoW1wiJHJvdXRlUHJvdmlkZXJcIiwgKCRyb3V0ZVByb3ZpZGVyKSA9PiB7XG4gICAgJHJvdXRlUHJvdmlkZXIuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2FkZCcsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdhZGRUb0Rhc2hib2FyZC5odG1sJ30pLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9lZGl0Jywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2VkaXREYXNoYm9hcmRzLmh0bWwnfSkuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2lkeC86ZGFzaGJvYXJkSW5kZXgnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnZGFzaGJvYXJkLmh0bWwnfSkuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2lkLzpkYXNoYm9hcmRJZCcsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdkYXNoYm9hcmQuaHRtbCd9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvaWQvOmRhc2hib2FyZElkL3NoYXJlJywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ3NoYXJlLmh0bWwnfSkuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2ltcG9ydCcsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdpbXBvcnQuaHRtbCd9KTtcbiAgfV0pO1xuXG4gIF9tb2R1bGUudmFsdWUoJ3VpLmNvbmZpZycsIHtcbiAgICAvLyBUaGUgdWktanEgZGlyZWN0aXZlIG5hbWVzcGFjZVxuICAgIGpxOiB7XG4gICAgICBncmlkc3Rlcjoge1xuICAgICAgICB3aWRnZXRfbWFyZ2luczogWzEwLCAxMF0sXG4gICAgICAgIHdpZGdldF9iYXNlX2RpbWVuc2lvbnM6IFsxNDAsIDE0MF1cbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIF9tb2R1bGUucnVuKFtcIkhhd3Rpb05hdlwiLCBcInZpZXdSZWdpc3RyeVwiLCAobmF2Okhhd3Rpb01haW5OYXYuUmVnaXN0cnksIHZpZXdSZWdpc3RyeSkgPT4ge1xuICAgIHZhciBidWlsZGVyID0gbmF2LmJ1aWxkZXIoKTtcbiAgICB2YXIgdGFiID0gYnVpbGRlci5pZChwbHVnaW5OYW1lKVxuICAgICAgICAgICAgICAgIC5ocmVmKCgpID0+ICcvZGFzaGJvYXJkL2lkeC8wJylcbiAgICAgICAgICAgICAgICAudGl0bGUoKCkgPT4gJ0Rhc2hib2FyZCcpXG4gICAgICAgICAgICAgICAgLmJ1aWxkKCk7XG4gICAgbmF2LmFkZCh0YWIpO1xuICAgIHZpZXdSZWdpc3RyeVsnZGFzaGJvYXJkJ10gPSBVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAnbGF5b3V0RGFzaGJvYXJkLmh0bWwnKTtcbiAgfV0pO1xuXG4gIGhhd3Rpb1BsdWdpbkxvYWRlci5hZGRNb2R1bGUocGx1Z2luTmFtZSk7XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZEludGVyZmFjZXMudHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuXG4gIF9tb2R1bGUuZmFjdG9yeSgnZGFzaGJvYXJkUmVwb3NpdG9yeScsIFsoKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBMb2NhbERhc2hib2FyZFJlcG9zaXRvcnkoKTtcbiAgfV0pO1xuXG4gIC8qKlxuICAgKiBUaGUgZGVmYXVsdCBkYXNoYm9hcmQgZGVmaW5pdGlvbiBpZiBubyBzYXZlZCBkYXNoYm9hcmRzIGFyZSBhdmFpbGFibGVcbiAgICpcbiAgICogQHByb3BlcnR5IGRlZmF1bHREYXNoYm9hcmRzXG4gICAqIEBmb3IgRGFzaGJvYXJkXG4gICAqIEB0eXBlIHthbnl9XG4gICAqL1xuICB2YXIgZGVmYXVsdERhc2hib2FyZHMgPSBbXG5cbiAgICB7XG4gICAgICBcInRpdGxlXCI6IFwiTW9uaXRvclwiLFxuICAgICAgXCJncm91cFwiOiBcIlBlcnNvbmFsXCIsXG4gICAgICBcIndpZGdldHNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJpZFwiOiBcIncxXCIsXG4gICAgICAgICAgXCJ0aXRsZVwiOiBcIk9wZXJhdGluZyBTeXN0ZW1cIixcbiAgICAgICAgICBcInJvd1wiOiAxLFxuICAgICAgICAgIFwiY29sXCI6IDEsXG4gICAgICAgICAgXCJzaXplX3hcIjogMyxcbiAgICAgICAgICBcInNpemVfeVwiOiA0LFxuICAgICAgICAgIFwicGF0aFwiOiBcImpteC9hdHRyaWJ1dGVzXCIsXG4gICAgICAgICAgXCJpbmNsdWRlXCI6IFwiXCIsXG4gICAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgICAgXCJuaWRcIjogXCJyb290LWphdmEubGFuZy1PcGVyYXRpbmdTeXN0ZW1cIlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJoYXNoXCI6IFwiXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwiaWRcIjogXCJ3M1wiLFxuICAgICAgICAgIFwidGl0bGVcIjogXCJKYXZhIEhlYXAgTWVtb3J5XCIsXG4gICAgICAgICAgXCJyb3dcIjogMSxcbiAgICAgICAgICBcImNvbFwiOiA2LFxuICAgICAgICAgIFwic2l6ZV94XCI6IDIsXG4gICAgICAgICAgXCJzaXplX3lcIjogMixcbiAgICAgICAgICBcInBhdGhcIjogXCJqbXgvd2lkZ2V0L2RvbnV0XCIsXG4gICAgICAgICAgXCJpbmNsdWRlXCI6IFwiXCIsXG4gICAgICAgICAgXCJzZWFyY2hcIjoge30sXG4gICAgICAgICAgXCJoYXNoXCI6IFwiXCIsXG4gICAgICAgICAgXCJyb3V0ZVBhcmFtc1wiOiBcIntcXFwidHlwZVxcXCI6XFxcImRvbnV0XFxcIixcXFwidGl0bGVcXFwiOlxcXCJKYXZhIEhlYXAgTWVtb3J5XFxcIixcXFwibWJlYW5cXFwiOlxcXCJqYXZhLmxhbmc6dHlwZT1NZW1vcnlcXFwiLFxcXCJhdHRyaWJ1dGVcXFwiOlxcXCJIZWFwTWVtb3J5VXNhZ2VcXFwiLFxcXCJ0b3RhbFxcXCI6XFxcIk1heFxcXCIsXFxcInRlcm1zXFxcIjpcXFwiVXNlZFxcXCIsXFxcInJlbWFpbmluZ1xcXCI6XFxcIkZyZWVcXFwifVwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcImlkXCI6IFwidzRcIixcbiAgICAgICAgICBcInRpdGxlXCI6IFwiSmF2YSBOb24gSGVhcCBNZW1vcnlcIixcbiAgICAgICAgICBcInJvd1wiOiAxLFxuICAgICAgICAgIFwiY29sXCI6IDgsXG4gICAgICAgICAgXCJzaXplX3hcIjogMixcbiAgICAgICAgICBcInNpemVfeVwiOiAyLFxuICAgICAgICAgIFwicGF0aFwiOiBcImpteC93aWRnZXQvZG9udXRcIixcbiAgICAgICAgICBcImluY2x1ZGVcIjogXCJcIixcbiAgICAgICAgICBcInNlYXJjaFwiOiB7fSxcbiAgICAgICAgICBcImhhc2hcIjogXCJcIixcbiAgICAgICAgICBcInJvdXRlUGFyYW1zXCI6IFwie1xcXCJ0eXBlXFxcIjpcXFwiZG9udXRcXFwiLFxcXCJ0aXRsZVxcXCI6XFxcIkphdmEgTm9uIEhlYXAgTWVtb3J5XFxcIixcXFwibWJlYW5cXFwiOlxcXCJqYXZhLmxhbmc6dHlwZT1NZW1vcnlcXFwiLFxcXCJhdHRyaWJ1dGVcXFwiOlxcXCJOb25IZWFwTWVtb3J5VXNhZ2VcXFwiLFxcXCJ0b3RhbFxcXCI6XFxcIk1heFxcXCIsXFxcInRlcm1zXFxcIjpcXFwiVXNlZFxcXCIsXFxcInJlbWFpbmluZ1xcXCI6XFxcIkZyZWVcXFwifVwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcImlkXCI6IFwidzVcIixcbiAgICAgICAgICBcInRpdGxlXCI6IFwiXCIsXG4gICAgICAgICAgXCJyb3dcIjogMyxcbiAgICAgICAgICBcImNvbFwiOiA0LFxuICAgICAgICAgIFwic2l6ZV94XCI6IDYsXG4gICAgICAgICAgXCJzaXplX3lcIjogMixcbiAgICAgICAgICBcInBhdGhcIjogXCJqbXgvY2hhcnRzXCIsXG4gICAgICAgICAgXCJpbmNsdWRlXCI6IFwiXCIsXG4gICAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgICAgXCJzaXplXCI6IFwiJTdCJTIyc2l6ZV94JTIyJTNBMiUyQyUyMnNpemVfeSUyMiUzQTIlN0RcIixcbiAgICAgICAgICAgIFwidGl0bGVcIjogXCJKYXZhJTIwTm9uJTIwSGVhcCUyME1lbW9yeVwiLFxuICAgICAgICAgICAgXCJyb3V0ZVBhcmFtc1wiOiBcIiU3QiUyMnR5cGUlMjIlM0ElMjJkb251dCUyMiUyQyUyMnRpdGxlJTIyJTNBJTIySmF2YSUyME5vbiUyMEhlYXAlMjBNZW1vcnklMjIlMkMlMjJtYmVhbiUyMiUzQSUyMmphdmEubGFuZyUzQXR5cGVcIixcbiAgICAgICAgICAgIFwibmlkXCI6IFwicm9vdC1qYXZhLmxhbmctVGhyZWFkaW5nXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiaGFzaFwiOiBcIlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcImlkXCI6IFwidzZcIixcbiAgICAgICAgICBcInRpdGxlXCI6IFwiU3lzdGVtIENQVSBMb2FkXCIsXG4gICAgICAgICAgXCJyb3dcIjogMSxcbiAgICAgICAgICBcImNvbFwiOiA0LFxuICAgICAgICAgIFwic2l6ZV94XCI6IDIsXG4gICAgICAgICAgXCJzaXplX3lcIjogMixcbiAgICAgICAgICBcInBhdGhcIjogXCJqbXgvd2lkZ2V0L2FyZWFcIixcbiAgICAgICAgICBcImluY2x1ZGVcIjogXCJcIixcbiAgICAgICAgICBcInNlYXJjaFwiOiB7fSxcbiAgICAgICAgICBcImhhc2hcIjogXCJcIixcbiAgICAgICAgICBcInJvdXRlUGFyYW1zXCI6IFwie1xcXCJ0eXBlXFxcIjpcXFwiYXJlYVxcXCIsXFxcInRpdGxlXFxcIjpcXFwiU3lzdGVtIENQVSBMb2FkXFxcIixcXFwibWJlYW5cXFwiOlxcXCJqYXZhLmxhbmc6dHlwZT1PcGVyYXRpbmdTeXN0ZW1cXFwiLFxcXCJhdHRyaWJ1dGVcXFwiOlxcXCJTeXN0ZW1DcHVMb2FkXFxcIn1cIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJpZFwiOiBcIjRlOWQxMTYxNzNjYTQxNzY3ZVwiXG4gICAgfVxuXG4gIF07XG5cblxuICAvKipcbiAgICogQGNsYXNzIExvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeVxuICAgKiBAdXNlcyBEYXNoYm9hcmRSZXBvc2l0b3J5XG4gICAqL1xuICBleHBvcnQgY2xhc3MgTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5IGltcGxlbWVudHMgRGFzaGJvYXJkUmVwb3NpdG9yeSB7XG5cbiAgICBwcml2YXRlIGxvY2FsU3RvcmFnZTpXaW5kb3dMb2NhbFN0b3JhZ2UgPSBudWxsO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICB0aGlzLmxvY2FsU3RvcmFnZSA9IENvcmUuZ2V0TG9jYWxTdG9yYWdlKCk7XG5cbiAgICAgIGlmICgndXNlckRhc2hib2FyZHMnIGluIHRoaXMubG9jYWxTdG9yYWdlKSB7XG4gICAgICAgIC8vIGxvZy5pbmZvKFwiRm91bmQgcHJldmlvdXNseSBzYXZlZCBkYXNoYm9hcmRzXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zdG9yZURhc2hib2FyZHMoZGVmYXVsdERhc2hib2FyZHMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgbG9hZERhc2hib2FyZHMoKSB7XG4gICAgICB2YXIgYW5zd2VyID0gYW5ndWxhci5mcm9tSnNvbihsb2NhbFN0b3JhZ2VbJ3VzZXJEYXNoYm9hcmRzJ10pO1xuICAgICAgaWYgKGFuc3dlci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgYW5zd2VyLnB1c2godGhpcy5jcmVhdGVEYXNoYm9hcmQoe30pKTtcbiAgICAgIH1cbiAgICAgIGxvZy5kZWJ1ZyhcInJldHVybmluZyBkYXNoYm9hcmRzOiBcIiwgYW5zd2VyKTtcbiAgICAgIHJldHVybiBhbnN3ZXI7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdG9yZURhc2hib2FyZHMoZGFzaGJvYXJkczphbnlbXSkge1xuICAgICAgbG9nLmRlYnVnKFwic3RvcmluZyBkYXNoYm9hcmRzOiBcIiwgZGFzaGJvYXJkcyk7XG4gICAgICBsb2NhbFN0b3JhZ2VbJ3VzZXJEYXNoYm9hcmRzJ10gPSBhbmd1bGFyLnRvSnNvbihkYXNoYm9hcmRzKTtcbiAgICAgIHJldHVybiB0aGlzLmxvYWREYXNoYm9hcmRzKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHB1dERhc2hib2FyZHMoYXJyYXk6YW55W10sIGNvbW1pdE1lc3NhZ2U6c3RyaW5nLCBmbikge1xuXG4gICAgICB2YXIgZGFzaGJvYXJkcyA9IHRoaXMubG9hZERhc2hib2FyZHMoKTtcblxuICAgICAgYXJyYXkuZm9yRWFjaCgoZGFzaCkgPT4ge1xuICAgICAgICB2YXIgZXhpc3RpbmcgPSBkYXNoYm9hcmRzLmZpbmRJbmRleCgoZCkgPT4geyByZXR1cm4gZC5pZCA9PT0gZGFzaC5pZDsgfSk7XG4gICAgICAgIGlmIChleGlzdGluZyA+PSAwKSB7XG4gICAgICAgICAgZGFzaGJvYXJkc1tleGlzdGluZ10gPSBkYXNoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRhc2hib2FyZHMucHVzaChkYXNoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBmbih0aGlzLnN0b3JlRGFzaGJvYXJkcyhkYXNoYm9hcmRzKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlbGV0ZURhc2hib2FyZHMoYXJyYXk6YW55W10sIGZuKSB7XG4gICAgICB2YXIgZGFzaGJvYXJkcyA9IHRoaXMubG9hZERhc2hib2FyZHMoKTtcbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChhcnJheSwgKGl0ZW0pID0+IHtcbiAgICAgICAgZGFzaGJvYXJkcy5yZW1vdmUoKGkpID0+IHsgcmV0dXJuIGkuaWQgPT09IGl0ZW0uaWQ7IH0pO1xuICAgICAgfSk7XG4gICAgICBmbih0aGlzLnN0b3JlRGFzaGJvYXJkcyhkYXNoYm9hcmRzKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldERhc2hib2FyZHMoZm4pIHtcbiAgICAgIGZuKHRoaXMubG9hZERhc2hib2FyZHMoKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldERhc2hib2FyZChpZDpzdHJpbmcsIGZuKSB7XG4gICAgICB2YXIgZGFzaGJvYXJkcyA9IHRoaXMubG9hZERhc2hib2FyZHMoKTtcbiAgICAgIHZhciBkYXNoYm9hcmQgPSBkYXNoYm9hcmRzLmZpbmQoKGRhc2hib2FyZCkgPT4geyByZXR1cm4gZGFzaGJvYXJkLmlkID09PSBpZCB9KTtcbiAgICAgIGZuKGRhc2hib2FyZCk7XG4gICAgfVxuXG4gICAgcHVibGljIGNyZWF0ZURhc2hib2FyZChvcHRpb25zOmFueSkge1xuICAgICAgdmFyIGFuc3dlciA9e1xuICAgICAgICB0aXRsZTogXCJOZXcgRGFzaGJvYXJkXCIsXG4gICAgICAgIGdyb3VwOiBcIlBlcnNvbmFsXCIsXG4gICAgICAgIHdpZGdldHM6IFtdXG4gICAgICB9O1xuICAgICAgYW5zd2VyID0gYW5ndWxhci5leHRlbmQoYW5zd2VyLCBvcHRpb25zKTtcbiAgICAgIGFuc3dlclsnaWQnXSA9IENvcmUuZ2V0VVVJRCgpO1xuICAgICAgcmV0dXJuIGFuc3dlcjtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2xvbmVEYXNoYm9hcmQoZGFzaGJvYXJkOmFueSkge1xuICAgICAgdmFyIG5ld0Rhc2hib2FyZCA9IE9iamVjdC5jbG9uZShkYXNoYm9hcmQpO1xuICAgICAgbmV3RGFzaGJvYXJkWydpZCddID0gQ29yZS5nZXRVVUlEKCk7XG4gICAgICBuZXdEYXNoYm9hcmRbJ3RpdGxlJ10gPSBcIkNvcHkgb2YgXCIgKyBkYXNoYm9hcmQudGl0bGU7XG4gICAgICByZXR1cm4gbmV3RGFzaGJvYXJkO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRUeXBlKCkge1xuICAgICAgcmV0dXJuICdjb250YWluZXInO1xuICAgIH1cbiAgfVxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcblxuICBfbW9kdWxlLmNvbnRyb2xsZXIoXCJEYXNoYm9hcmQuRWRpdERhc2hib2FyZHNDb250cm9sbGVyXCIsIFtcIiRzY29wZVwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcIiRyb3V0ZVwiLCBcIiRsb2NhdGlvblwiLCBcIiRyb290U2NvcGVcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsICgkc2NvcGUsICRyb3V0ZVBhcmFtcywgJHJvdXRlLCAkbG9jYXRpb24sICRyb290U2NvcGUsIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSkgPT4ge1xuXG4gICAgLy8kc2NvcGUuaGFzaCA9IHdvcmtzcGFjZS5oYXNoKCk7XG4gICAgJHNjb3BlLnNlbGVjdGVkSXRlbXMgPSBbXTtcbiAgICAkc2NvcGUucmVwb3NpdG9yeSA9IGRhc2hib2FyZFJlcG9zaXRvcnk7XG4gICAgLy8kc2NvcGUuZHVwbGljYXRlRGFzaGJvYXJkcyA9IG5ldyBVSS5EaWFsb2coKTtcbiAgICAkc2NvcGUuc2VsZWN0ZWRQcm9maWxlc0RpYWxvZyA9IFtdO1xuICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IFtdO1xuXG4gICAgJHJvb3RTY29wZS4kb24oJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkTG9hZGVkKTtcblxuICAgICRzY29wZS5oYXNVcmwgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gKCRzY29wZS51cmwpID8gdHJ1ZSA6IGZhbHNlO1xuICAgIH07XG5cbiAgICAkc2NvcGUuaGFzU2VsZWN0aW9uID0gKCkgPT4ge1xuICAgICAgcmV0dXJuICRzY29wZS5zZWxlY3RlZEl0ZW1zLmxlbmd0aCAhPT0gMDtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmdyaWRPcHRpb25zID0ge1xuICAgICAgc2VsZWN0ZWRJdGVtczogJHNjb3BlLnNlbGVjdGVkSXRlbXMsXG4gICAgICBzaG93RmlsdGVyOiBmYWxzZSxcbiAgICAgIHNob3dDb2x1bW5NZW51OiBmYWxzZSxcbiAgICAgIGZpbHRlck9wdGlvbnM6IHtcbiAgICAgICAgZmlsdGVyVGV4dDogJydcbiAgICAgIH0sXG4gICAgICBkYXRhOiAnX2Rhc2hib2FyZHMnLFxuICAgICAgc2VsZWN0V2l0aENoZWNrYm94T25seTogdHJ1ZSxcbiAgICAgIHNob3dTZWxlY3Rpb25DaGVja2JveDogdHJ1ZSxcbiAgICAgIGNvbHVtbkRlZnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGZpZWxkOiAndGl0bGUnLFxuICAgICAgICAgIGRpc3BsYXlOYW1lOiAnRGFzaGJvYXJkJyxcbiAgICAgICAgICBjZWxsVGVtcGxhdGU6ICc8ZGl2IGNsYXNzPVwibmdDZWxsVGV4dFwiPjxhIG5nLWhyZWY9XCIjL2Rhc2hib2FyZC9pZC97e3Jvdy5nZXRQcm9wZXJ0eSgnICsgXCInaWQnXCIgKyAnKX19e3toYXNofX1cIj48ZWRpdGFibGUtcHJvcGVydHkgY2xhc3M9XCJpbmxpbmUtYmxvY2tcIiBvbi1zYXZlPVwib25EYXNoUmVuYW1lZChyb3cuZW50aXR5KVwiIHByb3BlcnR5PVwidGl0bGVcIiBuZy1tb2RlbD1cInJvdy5lbnRpdHlcIj48L2VkaXRhYmxlLXByb3BlcnR5PjwvYT48L2Rpdj4nXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBmaWVsZDogJ2dyb3VwJyxcbiAgICAgICAgICBkaXNwbGF5TmFtZTogJ0dyb3VwJ1xuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgYWZ0ZXJTZWxlY3Rpb25DaGFuZ2U6IGFmdGVyU2VsZWN0aW9uQ2hhbmdlXG4gICAgfTtcblxuXG4gICAgJHNjb3BlLm9uRGFzaFJlbmFtZWQgPSAoZGFzaCkgPT4ge1xuICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKFtkYXNoXSwgXCJSZW5hbWVkIGRhc2hib2FyZFwiLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gaGVscGVycyBzbyB3ZSBjYW4gZW5hYmxlL2Rpc2FibGUgcGFydHMgb2YgdGhlIFVJIGRlcGVuZGluZyBvbiBob3dcbiAgICAvLyBkYXNoYm9hcmQgZGF0YSBpcyBzdG9yZWRcbiAgICAkc2NvcGUudXNpbmdHaXQgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlKCkgPT09ICdnaXQnO1xuICAgIH07XG5cbiAgICAkc2NvcGUudXNpbmdGYWJyaWMgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlKCkgPT09ICdmYWJyaWMnO1xuICAgIH07XG5cbiAgICAkc2NvcGUudXNpbmdMb2NhbCA9ICgpID0+IHtcbiAgICAgIHJldHVybiBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldFR5cGUoKSA9PT0gJ2NvbnRhaW5lcic7XG4gICAgfTtcblxuICAgIGlmICgkc2NvcGUudXNpbmdGYWJyaWMoKSkge1xuICAgICAgJHNjb3BlLmdyaWRPcHRpb25zLmNvbHVtbkRlZnMuYWRkKFt7XG4gICAgICAgIGZpZWxkOiAndmVyc2lvbklkJyxcbiAgICAgICAgZGlzcGxheU5hbWU6ICdWZXJzaW9uJ1xuICAgICAgfSwge1xuICAgICAgICBmaWVsZDogJ3Byb2ZpbGVJZCcsXG4gICAgICAgIGRpc3BsYXlOYW1lOiAnUHJvZmlsZSdcbiAgICAgIH0sIHtcbiAgICAgICAgZmllbGQ6ICdmaWxlTmFtZScsXG4gICAgICAgIGRpc3BsYXlOYW1lOiAnRmlsZSBOYW1lJ1xuICAgICAgfV0pO1xuICAgIH1cblxuICAgICRzY29wZS4kb24oXCIkcm91dGVDaGFuZ2VTdWNjZXNzXCIsIGZ1bmN0aW9uIChldmVudCwgY3VycmVudCwgcHJldmlvdXMpIHtcbiAgICAgIC8vIGxldHMgZG8gdGhpcyBhc3luY2hyb25vdXNseSB0byBhdm9pZCBFcnJvcjogJGRpZ2VzdCBhbHJlYWR5IGluIHByb2dyZXNzXG4gICAgICBzZXRUaW1lb3V0KHVwZGF0ZURhdGEsIDEwMCk7XG4gICAgfSk7XG5cblxuICAgICRzY29wZS5nb0JhY2sgPSAoKSA9PiB7XG4gICAgICB2YXIgaHJlZiA9IENvcmUudHJpbUxlYWRpbmcoJHNjb3BlLnVybCwgXCIjXCIpO1xuICAgICAgaWYgKGhyZWYpIHtcbiAgICAgICAgJGxvY2F0aW9uLnVybChocmVmKTtcbiAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAkc2NvcGUuZHVwbGljYXRlVG9Qcm9maWxlcyA9ICgpID0+IHtcbiAgICAgIGlmICgkc2NvcGUuaGFzU2VsZWN0aW9uKCkpIHtcbiAgICAgICAgJHNjb3BlLmR1cGxpY2F0ZURhc2hib2FyZHMub3BlbigpO1xuICAgICAgfVxuICAgIH07XG5cblxuICAgICRzY29wZS5kb0R1cGxpY2F0ZVRvUHJvZmlsZXMgPSAoKSA9PiB7XG4gICAgICAkc2NvcGUuZHVwbGljYXRlRGFzaGJvYXJkcy5jbG9zZSgpO1xuXG4gICAgICB2YXIgbmV3RGFzaGJvYXJkcyA9IFtdO1xuXG4gICAgICAkc2NvcGUuc2VsZWN0ZWRJdGVtcy5mb3JFYWNoKChkYXNoYm9hcmQpID0+IHtcbiAgICAgICAgJHNjb3BlLnNlbGVjdGVkUHJvZmlsZXNEaWFsb2cuZm9yRWFjaCgocHJvZmlsZSkgPT4ge1xuICAgICAgICAgIHZhciBuZXdEYXNoID0gZGFzaGJvYXJkUmVwb3NpdG9yeS5jbG9uZURhc2hib2FyZChkYXNoYm9hcmQpO1xuICAgICAgICAgIG5ld0Rhc2hbJ3Byb2ZpbGVJZCddID0gcHJvZmlsZS5pZDtcbiAgICAgICAgICBuZXdEYXNoWyd0aXRsZSddID0gZGFzaGJvYXJkLnRpdGxlO1xuICAgICAgICAgIG5ld0Rhc2hib2FyZHMucHVzaChuZXdEYXNoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgdmFyIGNvbW1pdE1lc3NhZ2UgPSBcIkR1cGxpY2F0aW5nIFwiICsgJHNjb3BlLnNlbGVjdGVkSXRlbXMubGVuZ3RoICsgXCIgZGFzaGJvYXJkcyB0byBcIiArICRzY29wZS5zZWxlY3RlZFByb2ZpbGVzRGlhbG9nLmxlbmd0aCArIFwiIHByb2ZpbGVzXCI7XG5cbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhuZXdEYXNoYm9hcmRzLCBjb21taXRNZXNzYWdlLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAvLyBsZXQncyBqdXN0IGJlIHNhZmUgYW5kIGVuc3VyZSB0aGVyZSdzIG5vIHNlbGVjdGlvbnNcbiAgICAgICAgZGVzZWxlY3RBbGwoKTtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG5cbiAgICB9O1xuXG4gICAgJHNjb3BlLmFkZFZpZXdUb0Rhc2hib2FyZCA9ICgpID0+IHtcbiAgICAgIHZhciBuZXh0SHJlZiA9IG51bGw7XG4gICAgICBhbmd1bGFyLmZvckVhY2goJHNjb3BlLnNlbGVjdGVkSXRlbXMsIChzZWxlY3RlZEl0ZW0pID0+IHtcbiAgICAgICAgLy8gVE9ETyB0aGlzIGNvdWxkIGJlIGEgaGVscGVyIGZ1bmN0aW9uXG4gICAgICAgIHZhciB0ZXh0ID0gJHNjb3BlLnVybDtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gbnVsbDtcbiAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICB2YXIgaWR4ID0gdGV4dC5pbmRleE9mKCc/Jyk7XG4gICAgICAgICAgaWYgKGlkeCAmJiBpZHggPiAwKSB7XG4gICAgICAgICAgICBxdWVyeSA9IHRleHQuc3Vic3RyaW5nKGlkeCArIDEpO1xuICAgICAgICAgICAgdGV4dCA9IHRleHQuc3Vic3RyaW5nKDAsIGlkeCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRleHQgPSBDb3JlLnRyaW1MZWFkaW5nKHRleHQsIFwiI1wiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc2VhcmNoID0ge307XG4gICAgICAgIGlmIChxdWVyeSkge1xuICAgICAgICAgIHZhciBleHByZXNzaW9ucyA9IHF1ZXJ5LnNwbGl0KFwiJlwiKTtcbiAgICAgICAgICBhbmd1bGFyLmZvckVhY2goZXhwcmVzc2lvbnMsIChleHByZXNzaW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXhwcmVzc2lvbikge1xuICAgICAgICAgICAgICB2YXIgbmFtZXMgPSBleHByZXNzaW9uLnNwbGl0KFwiPVwiKTtcbiAgICAgICAgICAgICAgdmFyIGtleSA9IG5hbWVzWzBdO1xuICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBuYW1lcy5sZW5ndGggPiAxID8gbmFtZXNbMV0gOiBudWxsO1xuICAgICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdmFyIG9sZCA9IHNlYXJjaFtrZXldO1xuICAgICAgICAgICAgICBpZiAob2xkKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFhbmd1bGFyLmlzQXJyYXkob2xkKSkge1xuICAgICAgICAgICAgICAgICAgb2xkID0gW29sZF07XG4gICAgICAgICAgICAgICAgICBzZWFyY2hba2V5XSA9IG9sZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb2xkLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlYXJjaFtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvL2NvbnNvbGUubG9nKFwicGF0aCBpczogXCIgKyB0ZXh0ICsgXCIgdGhlIHNlYXJjaCBpcyBcIiArIEpTT04uc3RyaW5naWZ5KHNlYXJjaCkpO1xuICAgICAgICBpZiAoJHJvdXRlICYmICRyb3V0ZS5yb3V0ZXMpIHtcbiAgICAgICAgICB2YXIgdmFsdWUgPSAkcm91dGUucm91dGVzW3RleHRdO1xuICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIHRlbXBsYXRlVXJsID0gdmFsdWVbXCJ0ZW1wbGF0ZVVybFwiXTtcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZVVybCkge1xuICAgICAgICAgICAgICBpZiAoIXNlbGVjdGVkSXRlbS53aWRnZXRzKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRJdGVtLndpZGdldHMgPSBbXTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB2YXIgbmV4dE51bWJlciA9IHNlbGVjdGVkSXRlbS53aWRnZXRzLmxlbmd0aCArIDE7XG4gICAgICAgICAgICAgIHZhciB3aWRnZXQgPSB7XG4gICAgICAgICAgICAgICAgaWQ6IFwid1wiICsgbmV4dE51bWJlciwgdGl0bGU6IFwiXCIsXG4gICAgICAgICAgICAgICAgcm93OiAxLFxuICAgICAgICAgICAgICAgIGNvbDogMSxcbiAgICAgICAgICAgICAgICBzaXplX3g6IDEsXG4gICAgICAgICAgICAgICAgc2l6ZV95OiAxLFxuICAgICAgICAgICAgICAgIHBhdGg6IENvcmUudHJpbUxlYWRpbmcodGV4dCwgXCIvXCIpLFxuICAgICAgICAgICAgICAgIGluY2x1ZGU6IHRlbXBsYXRlVXJsLFxuICAgICAgICAgICAgICAgIHNlYXJjaDogc2VhcmNoLFxuICAgICAgICAgICAgICAgIGhhc2g6IFwiXCJcbiAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICBpZiAoJHNjb3BlLndpZGdldFRpdGxlKSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0LnRpdGxlID0gJHNjb3BlLndpZGdldFRpdGxlO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gZmlndXJlIG91dCB0aGUgd2lkdGggb2YgdGhlIGRhc2hcbiAgICAgICAgICAgICAgdmFyIGdyaWRXaWR0aCA9IDA7XG5cbiAgICAgICAgICAgICAgc2VsZWN0ZWRJdGVtLndpZGdldHMuZm9yRWFjaCgodykgPT4ge1xuICAgICAgICAgICAgICAgIHZhciByaWdodFNpZGUgPSB3LmNvbCArIHcuc2l6ZV94O1xuICAgICAgICAgICAgICAgIGlmIChyaWdodFNpZGUgPiBncmlkV2lkdGgpIHtcbiAgICAgICAgICAgICAgICAgIGdyaWRXaWR0aCA9IHJpZ2h0U2lkZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgIGlmICgkc2NvcGUucHJlZmVycmVkU2l6ZSkge1xuICAgICAgICAgICAgICAgIHdpZGdldC5zaXplX3ggPSBwYXJzZUludCgkc2NvcGUucHJlZmVycmVkU2l6ZVsnc2l6ZV94J10pO1xuICAgICAgICAgICAgICAgIHdpZGdldC5zaXplX3kgPSBwYXJzZUludCgkc2NvcGUucHJlZmVycmVkU2l6ZVsnc2l6ZV95J10pO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgdmFyIGZvdW5kID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgdmFyIGxlZnQgPSAodykgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB3LmNvbDtcbiAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICB2YXIgcmlnaHQgPSAodykgID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdy5jb2wgKyB3LnNpemVfeCAtIDE7XG4gICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgdmFyIHRvcCA9ICh3KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHcucm93O1xuICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgIHZhciBib3R0b20gPSAodykgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB3LnJvdyArIHcuc2l6ZV95IC0gMTtcbiAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICB2YXIgY29sbGlzaW9uID0gKHcxLCB3MikgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiAhKCBsZWZ0KHcyKSA+IHJpZ2h0KHcxKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICByaWdodCh3MikgPCBsZWZ0KHcxKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0b3AodzIpID4gYm90dG9tKHcxKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICBib3R0b20odzIpIDwgdG9wKHcxKSk7XG4gICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkSXRlbS53aWRnZXRzLmlzRW1wdHkoKSkge1xuICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHdoaWxlICghZm91bmQpIHtcbiAgICAgICAgICAgICAgICB3aWRnZXQuY29sID0gMTtcbiAgICAgICAgICAgICAgICBpZiAod2lkZ2V0LmNvbCArIHdpZGdldC5zaXplX3ggPiBncmlkV2lkdGgpIHtcbiAgICAgICAgICAgICAgICAgIC8vIGxldCdzIG5vdCBsb29rIGZvciBhIHBsYWNlIG5leHQgdG8gZXhpc3Rpbmcgd2lkZ2V0XG4gICAgICAgICAgICAgICAgICBzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5mb3JFYWNoKGZ1bmN0aW9uKHcsIGlkeCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAod2lkZ2V0LnJvdyA8PSB3LnJvdykge1xuICAgICAgICAgICAgICAgICAgICAgIHdpZGdldC5yb3crKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAoOyAod2lkZ2V0LmNvbCArIHdpZGdldC5zaXplX3gpIDw9IGdyaWRXaWR0aDsgd2lkZ2V0LmNvbCsrKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoIXNlbGVjdGVkSXRlbS53aWRnZXRzLmFueSgodykgPT4ge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IGNvbGxpc2lvbih3LCB3aWRnZXQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY1xuICAgICAgICAgICAgICAgICAgfSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgICAgICAgd2lkZ2V0LnJvdyA9IHdpZGdldC5yb3cgKyAxXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGp1c3QgaW4gY2FzZSwga2VlcCB0aGUgc2NyaXB0IGZyb20gcnVubmluZyBhd2F5Li4uXG4gICAgICAgICAgICAgICAgaWYgKHdpZGdldC5yb3cgPiA1MCkge1xuICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICgkc2NvcGUucm91dGVQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICB3aWRnZXRbJ3JvdXRlUGFyYW1zJ10gPSAkc2NvcGUucm91dGVQYXJhbXM7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc2VsZWN0ZWRJdGVtLndpZGdldHMucHVzaCh3aWRnZXQpO1xuXG4gICAgICAgICAgICAgIGlmICghbmV4dEhyZWYgJiYgc2VsZWN0ZWRJdGVtLmlkKSB7XG4gICAgICAgICAgICAgICAgbmV4dEhyZWYgPSBcIi9kYXNoYm9hcmQvaWQvXCIgKyBzZWxlY3RlZEl0ZW0uaWRcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRPRE8gd2UgbmVlZCB0byBiZSBhYmxlIHRvIG1hdGNoIFVSSSB0ZW1wbGF0ZXMuLi5cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBub3cgbGV0cyB1cGRhdGUgdGhlIGFjdHVhbCBkYXNoYm9hcmQgY29uZmlnXG4gICAgICB2YXIgY29tbWl0TWVzc2FnZSA9IFwiQWRkIHdpZGdldFwiO1xuICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKCRzY29wZS5zZWxlY3RlZEl0ZW1zLCBjb21taXRNZXNzYWdlLCBmdW5jdGlvbihkYXNoYm9hcmRzKSB7XG4gICAgICAgIGlmIChuZXh0SHJlZikge1xuICAgICAgICAgIC8vIHJlbW92ZSBhbnkgZG9kZ3kgcXVlcnlcbiAgICAgICAgICBkZWxldGUgJGxvY2F0aW9uLnNlYXJjaCgpW1wiaHJlZlwiXTtcbiAgICAgICAgICAkbG9jYXRpb24ucGF0aChuZXh0SHJlZik7XG4gICAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB9O1xuXG4gICAgJHNjb3BlLmNyZWF0ZSA9ICgpID0+IHtcbiAgICAgIHZhciBjb3VudGVyID0gZGFzaGJvYXJkcygpLmxlbmd0aCArIDE7XG4gICAgICB2YXIgdGl0bGUgPSBcIlVudGl0bGVkXCIgKyBjb3VudGVyO1xuICAgICAgdmFyIG5ld0Rhc2ggPSBkYXNoYm9hcmRSZXBvc2l0b3J5LmNyZWF0ZURhc2hib2FyZCh7dGl0bGU6IHRpdGxlfSk7XG5cbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbbmV3RGFzaF0sIFwiQ3JlYXRlZCBuZXcgZGFzaGJvYXJkOiBcIiArIHRpdGxlLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAvLyBsZXQncyBqdXN0IGJlIHNhZmUgYW5kIGVuc3VyZSB0aGVyZSdzIG5vIHNlbGVjdGlvbnNcbiAgICAgICAgZGVzZWxlY3RBbGwoKTtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG5cbiAgICB9O1xuXG4gICAgJHNjb3BlLmR1cGxpY2F0ZSA9ICgpID0+IHtcbiAgICAgIHZhciBuZXdEYXNoYm9hcmRzID0gW107XG4gICAgICB2YXIgY29tbWl0TWVzc2FnZSA9IFwiRHVwbGljYXRlZCBkYXNoYm9hcmQocykgXCI7XG4gICAgICBhbmd1bGFyLmZvckVhY2goJHNjb3BlLnNlbGVjdGVkSXRlbXMsIChpdGVtLCBpZHgpID0+IHtcbiAgICAgICAgLy8gbGV0cyB1bnNlbGVjdCB0aGlzIGl0ZW1cbiAgICAgICAgdmFyIGNvbW1pdE1lc3NhZ2UgPSBcIkR1cGxpY2F0ZWQgZGFzaGJvYXJkIFwiICsgaXRlbS50aXRsZTtcbiAgICAgICAgdmFyIG5ld0Rhc2ggPSBkYXNoYm9hcmRSZXBvc2l0b3J5LmNsb25lRGFzaGJvYXJkKGl0ZW0pO1xuICAgICAgICBuZXdEYXNoYm9hcmRzLnB1c2gobmV3RGFzaCk7XG4gICAgICB9KTtcblxuICAgICAgLy8gbGV0J3MganVzdCBiZSBzYWZlIGFuZCBlbnN1cmUgdGhlcmUncyBubyBzZWxlY3Rpb25zXG4gICAgICBkZXNlbGVjdEFsbCgpO1xuXG4gICAgICBjb21taXRNZXNzYWdlID0gY29tbWl0TWVzc2FnZSArIG5ld0Rhc2hib2FyZHMubWFwKChkKSA9PiB7IHJldHVybiBkLnRpdGxlIH0pLmpvaW4oJywnKTtcbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhuZXdEYXNoYm9hcmRzLCBjb21taXRNZXNzYWdlLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmRlbGV0ZURhc2hib2FyZCA9ICgpID0+IHtcbiAgICAgIGlmICgkc2NvcGUuaGFzU2VsZWN0aW9uKCkpIHtcbiAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5kZWxldGVEYXNoYm9hcmRzKCRzY29wZS5zZWxlY3RlZEl0ZW1zLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAgIC8vIGxldCdzIGp1c3QgYmUgc2FmZSBhbmQgZW5zdXJlIHRoZXJlJ3Mgbm8gc2VsZWN0aW9uc1xuICAgICAgICAgIGRlc2VsZWN0QWxsKCk7XG4gICAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgJHNjb3BlLmdpc3QgPSAoKSA9PiB7XG4gICAgICBpZiAoJHNjb3BlLnNlbGVjdGVkSXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgaWQgPSAkc2NvcGUuc2VsZWN0ZWRJdGVtc1swXS5pZDtcbiAgICAgICAgJGxvY2F0aW9uLnBhdGgoXCIvZGFzaGJvYXJkL2lkL1wiICsgaWQgKyBcIi9zaGFyZVwiKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gdXBkYXRlRGF0YSgpIHtcbiAgICAgIHZhciB1cmwgPSAkcm91dGVQYXJhbXNbXCJocmVmXCJdO1xuICAgICAgaWYgKHVybCkge1xuICAgICAgICAkc2NvcGUudXJsID0gZGVjb2RlVVJJQ29tcG9uZW50KHVybCk7XG4gICAgICB9XG5cbiAgICAgIHZhciByb3V0ZVBhcmFtcyA9ICRyb3V0ZVBhcmFtc1tcInJvdXRlUGFyYW1zXCJdO1xuICAgICAgaWYgKHJvdXRlUGFyYW1zKSB7XG4gICAgICAgICRzY29wZS5yb3V0ZVBhcmFtcyA9IGRlY29kZVVSSUNvbXBvbmVudChyb3V0ZVBhcmFtcyk7XG4gICAgICB9XG4gICAgICB2YXIgc2l6ZTphbnkgPSAkcm91dGVQYXJhbXNbXCJzaXplXCJdO1xuICAgICAgaWYgKHNpemUpIHtcbiAgICAgICAgc2l6ZSA9IGRlY29kZVVSSUNvbXBvbmVudChzaXplKTtcbiAgICAgICAgJHNjb3BlLnByZWZlcnJlZFNpemUgPSBhbmd1bGFyLmZyb21Kc29uKHNpemUpO1xuICAgICAgfVxuICAgICAgdmFyIHRpdGxlOmFueSA9ICRyb3V0ZVBhcmFtc1tcInRpdGxlXCJdO1xuICAgICAgaWYgKHRpdGxlKSB7XG4gICAgICAgIHRpdGxlID0gZGVjb2RlVVJJQ29tcG9uZW50KHRpdGxlKTtcbiAgICAgICAgJHNjb3BlLndpZGdldFRpdGxlID0gdGl0bGU7XG4gICAgICB9XG5cbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkcygoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXNoYm9hcmRMb2FkZWQoZXZlbnQsIGRhc2hib2FyZHMpIHtcbiAgICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IGRhc2hib2FyZHM7XG4gICAgICBpZiAoZXZlbnQgPT09IG51bGwpIHtcbiAgICAgICAgJHNjb3BlLiRlbWl0KCdkYXNoYm9hcmRzVXBkYXRlZCcsIGRhc2hib2FyZHMpO1xuICAgICAgfVxuICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXNoYm9hcmRzKCkge1xuICAgICAgcmV0dXJuICRzY29wZS5fZGFzaGJvYXJkcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZnRlclNlbGVjdGlvbkNoYW5nZShyb3dJdGVtLCBjaGVja0FsbCkge1xuICAgICAgaWYgKGNoZWNrQWxsID09PSB2b2lkIDApIHtcbiAgICAgICAgLy8gdGhlbiByb3cgd2FzIGNsaWNrZWQsIG5vdCBzZWxlY3QtYWxsIGNoZWNrYm94XG4gICAgICAgICRzY29wZS5ncmlkT3B0aW9uc1snJGdyaWRTY29wZSddLmFsbFNlbGVjdGVkID0gcm93SXRlbS5jb25maWcuc2VsZWN0ZWRJdGVtcy5sZW5ndGggPT0gJHNjb3BlLl9kYXNoYm9hcmRzLmxlbmd0aDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRzY29wZS5ncmlkT3B0aW9uc1snJGdyaWRTY29wZSddLmFsbFNlbGVjdGVkID0gY2hlY2tBbGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVzZWxlY3RBbGwoKSB7XG4gICAgICAkc2NvcGUuc2VsZWN0ZWRJdGVtcy5zcGxpY2UoMCk7XG4gICAgICAkc2NvcGUuZ3JpZE9wdGlvbnNbJyRncmlkU2NvcGUnXS5hbGxTZWxlY3RlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIHVwZGF0ZURhdGEoKTtcbiAgfV0pO1xufVxuIiwiLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcblxuICAvKipcbiAgICogSW1wbGVtZW50cyB0aGUgbmcuSUxvY2F0aW9uU2VydmljZSBpbnRlcmZhY2UgYW5kIGlzIHVzZWQgYnkgdGhlIGRhc2hib2FyZCB0byBzdXBwbHlcbiAgICogY29udHJvbGxlcnMgd2l0aCBhIHNhdmVkIFVSTCBsb2NhdGlvblxuICAgKlxuICAgKiBAY2xhc3MgUmVjdGFuZ2xlTG9jYXRpb25cbiAgICovXG4gIGV4cG9ydCBjbGFzcyBSZWN0YW5nbGVMb2NhdGlvbiB7IC8vIFRPRE8gaW1wbGVtZW50cyBuZy5JTG9jYXRpb25TZXJ2aWNlIHtcbiAgICBwcml2YXRlIF9wYXRoOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBfaGFzaDogc3RyaW5nO1xuICAgIHByaXZhdGUgX3NlYXJjaDogYW55O1xuXG4gICAgY29uc3RydWN0b3IocHVibGljIGRlbGVnYXRlOm5nLklMb2NhdGlvblNlcnZpY2UsIHBhdGg6c3RyaW5nLCBzZWFyY2gsIGhhc2g6c3RyaW5nKSB7XG4gICAgICB0aGlzLl9wYXRoID0gcGF0aDtcbiAgICAgIHRoaXMuX3NlYXJjaCA9IHNlYXJjaDtcbiAgICAgIHRoaXMuX2hhc2ggPSBoYXNoO1xuICAgIH1cblxuICAgIGFic1VybCgpIHtcbiAgICAgIHJldHVybiB0aGlzLnByb3RvY29sKCkgKyB0aGlzLmhvc3QoKSArIFwiOlwiICsgdGhpcy5wb3J0KCkgKyB0aGlzLnBhdGgoKSArIHRoaXMuc2VhcmNoKCk7XG4gICAgfVxuXG4gICAgaGFzaChuZXdIYXNoOnN0cmluZyA9IG51bGwpOmFueSB7XG4gICAgICBpZiAobmV3SGFzaCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5oYXNoKG5ld0hhc2gpLnNlYXJjaCgndGFiJywgbnVsbCk7XG4gICAgICAgIC8vdGhpcy5faGFzaCA9IG5ld0hhc2g7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5faGFzaDtcbiAgICB9XG5cbiAgICBob3N0KCk6c3RyaW5nIHtcbiAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLmhvc3QoKTtcbiAgICB9XG5cbiAgICBwYXRoKG5ld1BhdGg6c3RyaW5nID0gbnVsbCk6YW55IHtcbiAgICAgIGlmIChuZXdQYXRoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLnBhdGgobmV3UGF0aCkuc2VhcmNoKCd0YWInLCBudWxsKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9wYXRoO1xuICAgIH1cblxuICAgIHBvcnQoKTpudW1iZXIge1xuICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUucG9ydCgpO1xuICAgIH1cblxuICAgIHByb3RvY29sKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUucG9ydCgpO1xuICAgIH1cblxuICAgIHJlcGxhY2UoKSB7XG4gICAgICAvLyBUT0RPXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZWFyY2gocGFyYW1ldGVyc01hcDphbnkgPSBudWxsKTphbnkge1xuICAgICAgaWYgKHBhcmFtZXRlcnNNYXApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUuc2VhcmNoKHBhcmFtZXRlcnNNYXApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX3NlYXJjaDtcbiAgICB9XG5cbiAgICB1cmwobmV3VmFsdWU6IHN0cmluZyA9IG51bGwpOmFueSB7XG4gICAgICBpZiAobmV3VmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUudXJsKG5ld1ZhbHVlKS5zZWFyY2goJ3RhYicsIG51bGwpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuYWJzVXJsKCk7XG4gICAgfVxuXG4gIH1cbn1cbiIsIi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRSZXBvc2l0b3J5LnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cInJlY3RhbmdsZUxvY2F0aW9uLnRzXCIvPlxubW9kdWxlIERhc2hib2FyZCB7XG5cbiAgX21vZHVsZS5kaXJlY3RpdmUoJ2hhd3Rpb0Rhc2hib2FyZCcsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlKCk7XG4gIH0pO1xuXG4gIGV4cG9ydCBjbGFzcyBHcmlkc3RlckRpcmVjdGl2ZSB7XG4gICAgcHVibGljIHJlc3RyaWN0ID0gJ0EnO1xuICAgIHB1YmxpYyByZXBsYWNlID0gdHJ1ZTtcblxuICAgIHB1YmxpYyBjb250cm9sbGVyID0gW1wiJHNjb3BlXCIsIFwiJGVsZW1lbnRcIiwgXCIkYXR0cnNcIiwgXCIkbG9jYXRpb25cIiwgXCIkcm91dGVQYXJhbXNcIiwgXCIkaW5qZWN0b3JcIiwgXCIkcm91dGVcIiwgXCIkdGVtcGxhdGVDYWNoZVwiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgXCIkY29tcGlsZVwiLCAoJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzLCAkbG9jYXRpb24sICRyb3V0ZVBhcmFtcywgJGluamVjdG9yLCAkcm91dGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgJHRlbXBsYXRlQ2FjaGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeTpEYXNoYm9hcmRSZXBvc2l0b3J5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICRjb21waWxlKSA9PiB7XG5cbiAgICAgICRzY29wZS5yb3V0ZSA9ICRyb3V0ZTtcbiAgICAgICRzY29wZS5pbmplY3RvciA9ICRpbmplY3RvcjtcblxuICAgICAgdmFyIGdyaWRTaXplID0gMTUwO1xuICAgICAgdmFyIGdyaWRNYXJnaW4gPSA2O1xuICAgICAgdmFyIGdyaWRIZWlnaHQ7XG5cbiAgICAgICRzY29wZS5ncmlkWCA9IGdyaWRTaXplO1xuICAgICAgJHNjb3BlLmdyaWRZID0gZ3JpZFNpemU7XG5cbiAgICAgICRzY29wZS53aWRnZXRNYXAgPSB7fTtcblxuICAgICAgJHNjb3BlLiRvbignJGRlc3Ryb3knLCAoKSA9PiB7XG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUud2lkZ2V0TWFwLCAodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICAgIGlmICgnc2NvcGUnIGluIHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgc2NvcGUgPSB2YWx1ZVsnc2NvcGUnXTtcbiAgICAgICAgICAgIHNjb3BlLiRkZXN0cm95KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICB1cGRhdGVXaWRnZXRzKCk7XG5cbiAgICAgICRzY29wZS5yZW1vdmVXaWRnZXQgPSBmdW5jdGlvbih3aWRnZXQpIHtcbiAgICAgICAgdmFyIGdyaWRzdGVyID0gZ2V0R3JpZHN0ZXIoKTtcbiAgICAgICAgdmFyIHdpZGdldEVsZW0gPSBudWxsO1xuXG4gICAgICAgIC8vIGxldHMgZGVzdHJveSB0aGUgd2lkZ2V0cydzIHNjb3BlXG4gICAgICAgIHZhciB3aWRnZXREYXRhID0gJHNjb3BlLndpZGdldE1hcFt3aWRnZXQuaWRdO1xuICAgICAgICBpZiAod2lkZ2V0RGF0YSkge1xuICAgICAgICAgIGRlbGV0ZSAkc2NvcGUud2lkZ2V0TWFwW3dpZGdldC5pZF07XG4gICAgICAgICAgdmFyIHNjb3BlID0gd2lkZ2V0RGF0YS5zY29wZTtcbiAgICAgICAgICB3aWRnZXRFbGVtID0gd2lkZ2V0RGF0YS53aWRnZXQ7XG4gICAgICAgICAgaWYgKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS4kZGVzdHJveSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXdpZGdldEVsZW0pIHtcbiAgICAgICAgICAvLyBsZXRzIGdldCB0aGUgbGkgcGFyZW50IGVsZW1lbnQgb2YgdGhlIHRlbXBsYXRlXG4gICAgICAgICAgd2lkZ2V0RWxlbSA9ICQoXCJkaXZcIikuZmluZChcIltkYXRhLXdpZGdldElkPSdcIiArIHdpZGdldC5pZCArIFwiJ11cIikucGFyZW50KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdyaWRzdGVyICYmIHdpZGdldEVsZW0pIHtcbiAgICAgICAgICBncmlkc3Rlci5yZW1vdmVfd2lkZ2V0KHdpZGdldEVsZW0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIG5vIG5lZWQgdG8gcmVtb3ZlIGl0Li4uXG4gICAgICAgIC8vd2lkZ2V0RWxlbS5yZW1vdmUoKTtcblxuICAgICAgICAvLyBsZXRzIHRyYXNoIHRoZSBKU09OIG1ldGFkYXRhXG4gICAgICAgIGlmICgkc2NvcGUuZGFzaGJvYXJkKSB7XG4gICAgICAgICAgdmFyIHdpZGdldHMgPSAkc2NvcGUuZGFzaGJvYXJkLndpZGdldHM7XG4gICAgICAgICAgaWYgKHdpZGdldHMpIHtcbiAgICAgICAgICAgIHdpZGdldHMucmVtb3ZlKHdpZGdldCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIlJlbW92ZWQgd2lkZ2V0IFwiICsgd2lkZ2V0LnRpdGxlKTtcbiAgICAgIH07XG5cbiAgICAgIGZ1bmN0aW9uIGNoYW5nZVdpZGdldFNpemUod2lkZ2V0LCBzaXplZnVuYywgc2F2ZWZ1bmMpIHtcbiAgICAgICAgdmFyIGdyaWRzdGVyID0gZ2V0R3JpZHN0ZXIoKTtcbiAgICAgICAgdmFyIGVudHJ5ID0gJHNjb3BlLndpZGdldE1hcFt3aWRnZXQuaWRdO1xuICAgICAgICB2YXIgdyA9IGVudHJ5LndpZGdldDtcbiAgICAgICAgdmFyIHNjb3BlID0gZW50cnkuc2NvcGU7XG4gICAgICAgIHNpemVmdW5jKGVudHJ5KTtcbiAgICAgICAgZ3JpZHN0ZXIucmVzaXplX3dpZGdldCh3LCBlbnRyeS5zaXplX3gsIGVudHJ5LnNpemVfeSk7XG4gICAgICAgIGdyaWRzdGVyLnNldF9kb21fZ3JpZF9oZWlnaHQoKTtcblxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9ICR0ZW1wbGF0ZUNhY2hlLmdldChcIndpZGdldFRlbXBsYXRlXCIpO1xuICAgICAgICAgIHZhciBkaXYgPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgICAgICAgIGRpdi5odG1sKHRlbXBsYXRlKTtcbiAgICAgICAgICB3Lmh0bWwoJGNvbXBpbGUoZGl2LmNvbnRlbnRzKCkpKHNjb3BlKSk7XG5cbiAgICAgICAgICBtYWtlUmVzaXphYmxlKCk7XG4gICAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcblxuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzYXZlZnVuYyh3aWRnZXQpO1xuICAgICAgICAgIH0sIDUwKTtcbiAgICAgICAgfSwgMzApO1xuICAgICAgfVxuXG4gICAgICAkc2NvcGUub25XaWRnZXRSZW5hbWVkID0gZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgICAgIHVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkoXCJSZW5hbWVkIHdpZGdldCB0byBcIiArIHdpZGdldC50aXRsZSk7XG4gICAgICB9O1xuXG4gICAgICBmdW5jdGlvbiB1cGRhdGVXaWRnZXRzKCkge1xuICAgICAgICAkc2NvcGUuaWQgPSAkcm91dGVQYXJhbXNbXCJkYXNoYm9hcmRJZFwiXTtcbiAgICAgICAgJHNjb3BlLmlkeCA9ICRyb3V0ZVBhcmFtc1tcImRhc2hib2FyZEluZGV4XCJdO1xuICAgICAgICBpZiAoJHNjb3BlLmlkKSB7XG4gICAgICAgICAgJHNjb3BlLiRlbWl0KCdsb2FkRGFzaGJvYXJkcycpO1xuICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkKCRzY29wZS5pZCwgb25EYXNoYm9hcmRMb2FkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZHMoKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgICAgICRzY29wZS4kZW1pdCgnZGFzaGJvYXJkc1VwZGF0ZWQnLCBkYXNoYm9hcmRzKTtcblxuICAgICAgICAgICAgdmFyIGlkeCA9ICRzY29wZS5pZHggPyBwYXJzZUludCgkc2NvcGUuaWR4KSA6IDA7XG4gICAgICAgICAgICB2YXIgaWQgPSBudWxsO1xuICAgICAgICAgICAgaWYgKGRhc2hib2FyZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICB2YXIgZGFzaGJvYXJkID0gZGFzaGJvYXJkcy5sZW5ndGggPiBpZHggPyBkYXNoYm9hcmRzW2lkeF0gOiBkYXNoYm9hcmRbMF07XG4gICAgICAgICAgICAgIGlkID0gZGFzaGJvYXJkLmlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkKSB7XG4gICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9pZC9cIiArIGlkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9lZGl0P3RhYj1kYXNoYm9hcmRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBDb3JlLiRhcHBseSgkc2NvcGUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG9uRGFzaGJvYXJkTG9hZChkYXNoYm9hcmQpIHtcbiAgICAgICAgJHNjb3BlLmRhc2hib2FyZCA9IGRhc2hib2FyZDtcbiAgICAgICAgdmFyIHdpZGdldHMgPSAoKGRhc2hib2FyZCkgPyBkYXNoYm9hcmQud2lkZ2V0cyA6IG51bGwpIHx8IFtdO1xuXG4gICAgICAgIHZhciBtaW5IZWlnaHQgPSAxMDtcbiAgICAgICAgdmFyIG1pbldpZHRoID0gNjtcblxuICAgICAgICBhbmd1bGFyLmZvckVhY2god2lkZ2V0cywgKHdpZGdldCkgPT4ge1xuICAgICAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZCh3aWRnZXQucm93KSAmJiBtaW5IZWlnaHQgPCB3aWRnZXQucm93KSB7XG4gICAgICAgICAgICBtaW5IZWlnaHQgPSB3aWRnZXQucm93ICsgMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHdpZGdldC5zaXplX3hcbiAgICAgICAgICAgICAgJiYgYW5ndWxhci5pc0RlZmluZWQod2lkZ2V0LmNvbCkpKSB7XG4gICAgICAgICAgICB2YXIgcmlnaHRFZGdlID0gd2lkZ2V0LmNvbCArIHdpZGdldC5zaXplX3g7XG4gICAgICAgICAgICBpZiAocmlnaHRFZGdlID4gbWluV2lkdGgpIHtcbiAgICAgICAgICAgICAgbWluV2lkdGggPSByaWdodEVkZ2UgKyAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZ3JpZHN0ZXIgPSAkZWxlbWVudC5ncmlkc3Rlcih7XG4gICAgICAgICAgd2lkZ2V0X21hcmdpbnM6IFtncmlkTWFyZ2luLCBncmlkTWFyZ2luXSxcbiAgICAgICAgICB3aWRnZXRfYmFzZV9kaW1lbnNpb25zOiBbJHNjb3BlLmdyaWRYLCAkc2NvcGUuZ3JpZFldLFxuICAgICAgICAgIGV4dHJhX3Jvd3M6IG1pbkhlaWdodCxcbiAgICAgICAgICBleHRyYV9jb2xzOiBtaW5XaWR0aCxcbiAgICAgICAgICBtYXhfc2l6ZV94OiBtaW5XaWR0aCxcbiAgICAgICAgICBtYXhfc2l6ZV95OiBtaW5IZWlnaHQsXG4gICAgICAgICAgZHJhZ2dhYmxlOiB7XG4gICAgICAgICAgICBzdG9wOiAoZXZlbnQsIHVpKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChzZXJpYWxpemVEYXNoYm9hcmQoKSkge1xuICAgICAgICAgICAgICAgIHVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkoXCJDaGFuZ2luZyBkYXNoYm9hcmQgbGF5b3V0XCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KS5kYXRhKCdncmlkc3RlcicpO1xuXG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9ICR0ZW1wbGF0ZUNhY2hlLmdldChcIndpZGdldFRlbXBsYXRlXCIpO1xuICAgICAgICBhbmd1bGFyLmZvckVhY2god2lkZ2V0cywgKHdpZGdldCkgPT4ge1xuICAgICAgICAgIHZhciBjaGlsZFNjb3BlID0gJHNjb3BlLiRuZXcoZmFsc2UpO1xuICAgICAgICAgIGNoaWxkU2NvcGUud2lkZ2V0ID0gd2lkZ2V0O1xuICAgICAgICAgIHZhciBwYXRoID0gd2lkZ2V0LnBhdGg7XG4gICAgICAgICAgdmFyIHNlYXJjaCA9IG51bGw7XG4gICAgICAgICAgaWYgKHdpZGdldC5zZWFyY2gpIHtcbiAgICAgICAgICAgIHNlYXJjaCA9IERhc2hib2FyZC5kZWNvZGVVUklDb21wb25lbnRQcm9wZXJ0aWVzKHdpZGdldC5zZWFyY2gpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgaGFzaCA9IHdpZGdldC5oYXNoOyAvLyBUT0RPIGRlY29kZSBvYmplY3Q/XG4gICAgICAgICAgdmFyIGxvY2F0aW9uID0gbmV3IFJlY3RhbmdsZUxvY2F0aW9uKCRsb2NhdGlvbiwgcGF0aCwgc2VhcmNoLCBoYXNoKTtcbiAgICAgICAgICB2YXIgcm91dGVQYXJhbXMgPSBudWxsO1xuICAgICAgICAgIGlmICh3aWRnZXQucm91dGVQYXJhbXMpIHtcbiAgICAgICAgICAgIHJvdXRlUGFyYW1zID0gYW5ndWxhci5mcm9tSnNvbih3aWRnZXQucm91dGVQYXJhbXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvKlxuXG4gICAgICAgICAgdmFyIGNoaWxkV29ya3NwYWNlID0gd29ya3NwYWNlLmNyZWF0ZUNoaWxkV29ya3NwYWNlKGxvY2F0aW9uKTtcbiAgICAgICAgICAvL3ZhciBjaGlsZFdvcmtzcGFjZSA9IHdvcmtzcGFjZTtcbiAgICAgICAgICBjaGlsZFdvcmtzcGFjZS4kbG9jYXRpb24gPSBsb2NhdGlvbjtcblxuICAgICAgICAgIC8vIG5vdyB3ZSBuZWVkIHRvIHVwZGF0ZSB0aGUgc2VsZWN0aW9uIGZyb20gdGhlIGxvY2F0aW9uIHNlYXJjaCgpXG4gICAgICAgICAgaWYgKHNlYXJjaCkge1xuICAgICAgICAgICAgdmFyIGtleSA9IGxvY2F0aW9uLnNlYXJjaCgpWyduaWQnXTtcbiAgICAgICAgICAgIGlmIChrZXkgJiYgd29ya3NwYWNlLnRyZWUpIHtcbiAgICAgICAgICAgICAgLy8gbGV0cyBmaW5kIHRoZSBub2RlIGZvciB0aGlzIGtleS4uLlxuICAgICAgICAgICAgICBjaGlsZFdvcmtzcGFjZS5zZWxlY3Rpb24gPSB3b3Jrc3BhY2Uua2V5VG9Ob2RlTWFwW2tleV07XG4gICAgICAgICAgICAgIGlmICghY2hpbGRXb3Jrc3BhY2Uuc2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlY29kZWRLZXkgPSBkZWNvZGVVUklDb21wb25lbnQoa2V5KTtcbiAgICAgICAgICAgICAgICBjaGlsZFdvcmtzcGFjZS5zZWxlY3Rpb24gPSB3b3Jrc3BhY2Uua2V5VG9Ob2RlTWFwW2RlY29kZWRLZXldO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSovXG5cbiAgICAgICAgICB2YXIgJCRzY29wZUluamVjdGlvbnMgPSB7XG4gICAgICAgICAgICBsb2NhdGlvbjogbG9jYXRpb24sXG4gICAgICAgICAgICAkbG9jYXRpb246IGxvY2F0aW9uLFxuICAgICAgICAgICAgJHJvdXRlUGFyYW1zOiByb3V0ZVBhcmFtc1xuICAgICAgICAgIH07XG4gICAgICAgICAgY2hpbGRTY29wZS4kJHNjb3BlSW5qZWN0aW9ucyA9ICQkc2NvcGVJbmplY3Rpb25zO1xuICAgICAgICAgIGNoaWxkU2NvcGUuaW5EYXNoYm9hcmQgPSB0cnVlO1xuXG4gICAgICAgICAgaWYgKCF3aWRnZXQuc2l6ZV94IHx8IHdpZGdldC5zaXplX3ggPCAxKSB7XG4gICAgICAgICAgICB3aWRnZXQuc2l6ZV94ID0gMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCF3aWRnZXQuc2l6ZV95IHx8IHdpZGdldC5zaXplX3kgPCAxKSB7XG4gICAgICAgICAgICB3aWRnZXQuc2l6ZV95ID0gMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGRpdiA9ICQoJzxkaXY+PC9kaXY+Jyk7XG4gICAgICAgICAgZGl2Lmh0bWwodGVtcGxhdGUpO1xuXG4gICAgICAgICAgdmFyIG91dGVyRGl2ID0gJCgnPGxpIGNsYXNzPVwiZ3JpZC1ibG9ja1wiIHN0eWxlPVwiZGlzcGxheTogbGlzdC1pdGVtOyBwb3NpdGlvbjogYWJzb2x1dGVcIj48L2xpPicpO1xuICAgICAgICAgIG91dGVyRGl2Lmh0bWwoJGNvbXBpbGUoZGl2LmNvbnRlbnRzKCkpKGNoaWxkU2NvcGUpKTtcbiAgICAgICAgICB2YXIgdyA9IGdyaWRzdGVyLmFkZF93aWRnZXQob3V0ZXJEaXYsIHdpZGdldC5zaXplX3gsIHdpZGdldC5zaXplX3ksIHdpZGdldC5jb2wsIHdpZGdldC5yb3cpO1xuXG4gICAgICAgICAgJHNjb3BlLndpZGdldE1hcFt3aWRnZXQuaWRdID0ge1xuICAgICAgICAgICAgd2lkZ2V0OiB3LFxuICAgICAgICAgICAgc2NvcGU6IGNoaWxkU2NvcGVcbiAgICAgICAgICB9O1xuXG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgbWFrZVJlc2l6YWJsZSgpO1xuICAgICAgICBnZXRHcmlkc3RlcigpLmVuYWJsZSgpO1xuXG4gICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHNlcmlhbGl6ZURhc2hib2FyZCgpIHtcbiAgICAgICAgdmFyIGdyaWRzdGVyID0gZ2V0R3JpZHN0ZXIoKTtcbiAgICAgICAgaWYgKGdyaWRzdGVyKSB7XG4gICAgICAgICAgdmFyIGRhdGEgPSBncmlkc3Rlci5zZXJpYWxpemUoKTtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiZ290IGRhdGE6IFwiICsgSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuXG4gICAgICAgICAgdmFyIHdpZGdldHMgPSAkc2NvcGUuZGFzaGJvYXJkLndpZGdldHMgfHwgW107XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coXCJXaWRnZXRzOiBcIiwgd2lkZ2V0cyk7XG5cbiAgICAgICAgICAvLyBsZXRzIGFzc3VtZSB0aGUgZGF0YSBpcyBpbiB0aGUgb3JkZXIgb2YgdGhlIHdpZGdldHMuLi5cbiAgICAgICAgICBhbmd1bGFyLmZvckVhY2god2lkZ2V0cywgKHdpZGdldCwgaWR4KSA9PiB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW2lkeF07XG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgd2lkZ2V0KSB7XG4gICAgICAgICAgICAgIC8vIGxldHMgY29weSB0aGUgdmFsdWVzIGFjcm9zc1xuICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2godmFsdWUsIChhdHRyLCBrZXkpID0+IHdpZGdldFtrZXldID0gYXR0cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBtYWtlUmVzaXphYmxlKCkge1xuXG4gICAgICAgIC8qXG5cbiAgICAgICAgdmFyIGJsb2NrczphbnkgPSAkKCcuZ3JpZC1ibG9jaycpO1xuICAgICAgICBibG9ja3MucmVzaXphYmxlKCdkZXN0cm95Jyk7XG5cbiAgICAgICAgYmxvY2tzLnJlc2l6YWJsZSh7XG4gICAgICAgICAgZ3JpZDogW2dyaWRTaXplICsgKGdyaWRNYXJnaW4gKiAyKSwgZ3JpZFNpemUgKyAoZ3JpZE1hcmdpbiAqIDIpXSxcbiAgICAgICAgICBhbmltYXRlOiBmYWxzZSxcbiAgICAgICAgICBtaW5XaWR0aDogZ3JpZFNpemUsXG4gICAgICAgICAgbWluSGVpZ2h0OiBncmlkU2l6ZSxcbiAgICAgICAgICBhdXRvSGlkZTogZmFsc2UsXG4gICAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uKGV2ZW50LCB1aSkge1xuICAgICAgICAgICAgZ3JpZEhlaWdodCA9IGdldEdyaWRzdGVyKCkuJGVsLmhlaWdodCgpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVzaXplOiBmdW5jdGlvbihldmVudCwgdWkpIHtcbiAgICAgICAgICAgIC8vc2V0IG5ldyBncmlkIGhlaWdodCBhbG9uZyB0aGUgZHJhZ2dpbmcgcGVyaW9kXG4gICAgICAgICAgICB2YXIgZyA9IGdldEdyaWRzdGVyKCk7XG4gICAgICAgICAgICB2YXIgZGVsdGEgPSBncmlkU2l6ZSArIGdyaWRNYXJnaW4gKiAyO1xuICAgICAgICAgICAgaWYgKGV2ZW50Lm9mZnNldFkgPiBnLiRlbC5oZWlnaHQoKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdmFyIGV4dHJhID0gTWF0aC5mbG9vcigoZXZlbnQub2Zmc2V0WSAtIGdyaWRIZWlnaHQpIC8gZGVsdGEgKyAxKTtcbiAgICAgICAgICAgICAgdmFyIG5ld0hlaWdodCA9IGdyaWRIZWlnaHQgKyBleHRyYSAqIGRlbHRhO1xuICAgICAgICAgICAgICBnLiRlbC5jc3MoJ2hlaWdodCcsIG5ld0hlaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzdG9wOiBmdW5jdGlvbihldmVudCwgdWkpIHtcbiAgICAgICAgICAgIHZhciByZXNpemVkID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJlc2l6ZUJsb2NrKHJlc2l6ZWQpO1xuICAgICAgICAgICAgfSwgMzAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgICQoJy51aS1yZXNpemFibGUtaGFuZGxlJykuaG92ZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZ2V0R3JpZHN0ZXIoKS5kaXNhYmxlKCk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGdldEdyaWRzdGVyKCkuZW5hYmxlKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICovXG4gICAgICB9XG5cblxuICAgICAgZnVuY3Rpb24gcmVzaXplQmxvY2soZWxtT2JqKSB7XG4gICAgICAgIC8vdmFyIGVsbU9iaiA9ICQoZWxtT2JqKTtcbiAgICAgICAgdmFyIGFyZWEgPSBlbG1PYmouZmluZCgnLndpZGdldC1hcmVhJyk7XG4gICAgICAgIHZhciB3ID0gZWxtT2JqLndpZHRoKCkgLSBncmlkU2l6ZTtcbiAgICAgICAgdmFyIGggPSBlbG1PYmouaGVpZ2h0KCkgLSBncmlkU2l6ZTtcblxuICAgICAgICBmb3IgKHZhciBncmlkX3cgPSAxOyB3ID4gMDsgdyAtPSAoZ3JpZFNpemUgKyAoZ3JpZE1hcmdpbiAqIDIpKSkge1xuICAgICAgICAgIGdyaWRfdysrO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgZ3JpZF9oID0gMTsgaCA+IDA7IGggLT0gKGdyaWRTaXplICsgKGdyaWRNYXJnaW4gKiAyKSkpIHtcbiAgICAgICAgICBncmlkX2grKztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB3aWRnZXQgPSB7XG4gICAgICAgICAgaWQ6IGFyZWEuYXR0cignZGF0YS13aWRnZXRJZCcpXG4gICAgICAgIH07XG5cbiAgICAgICAgY2hhbmdlV2lkZ2V0U2l6ZSh3aWRnZXQsIGZ1bmN0aW9uKHdpZGdldCkge1xuICAgICAgICAgIHdpZGdldC5zaXplX3ggPSBncmlkX3c7XG4gICAgICAgICAgd2lkZ2V0LnNpemVfeSA9IGdyaWRfaDtcbiAgICAgICAgfSwgZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgICAgICAgaWYgKHNlcmlhbGl6ZURhc2hib2FyZCgpKSB7XG4gICAgICAgICAgICB1cGRhdGVEYXNoYm9hcmRSZXBvc2l0b3J5KFwiQ2hhbmdlZCBzaXplIG9mIHdpZGdldDogXCIgKyB3aWRnZXQuaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKCRzY29wZS5kYXNoYm9hcmQpIHtcbiAgICAgICAgICB2YXIgY29tbWl0TWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgaWYgKCRzY29wZS5kYXNoYm9hcmQgJiYgJHNjb3BlLmRhc2hib2FyZC50aXRsZSkge1xuICAgICAgICAgICAgY29tbWl0TWVzc2FnZSArPSBcIiBvbiBkYXNoYm9hcmQgXCIgKyAkc2NvcGUuZGFzaGJvYXJkLnRpdGxlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoWyRzY29wZS5kYXNoYm9hcmRdLCBjb21taXRNZXNzYWdlLCBEYXNoYm9hcmQub25PcGVyYXRpb25Db21wbGV0ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZ2V0R3JpZHN0ZXIoKSB7XG4gICAgICAgIHJldHVybiAkZWxlbWVudC5ncmlkc3RlcigpLmRhdGEoJ2dyaWRzdGVyJyk7XG4gICAgICB9XG5cbiAgICB9XTtcblxuICB9XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuICBfbW9kdWxlLmNvbnRyb2xsZXIoXCJEYXNoYm9hcmQuSW1wb3J0Q29udHJvbGxlclwiLCBbXCIkc2NvcGVcIiwgXCIkbG9jYXRpb25cIiwgXCIkcm91dGVQYXJhbXNcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsICgkc2NvcGUsICRsb2NhdGlvbiwgJHJvdXRlUGFyYW1zLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnkpID0+IHtcbiAgICAkc2NvcGUucGxhY2Vob2xkZXIgPSBcIlBhc3RlIHRoZSBKU09OIGhlcmUgZm9yIHRoZSBkYXNoYm9hcmQgY29uZmlndXJhdGlvbiB0byBpbXBvcnQuLi5cIjtcbiAgICAkc2NvcGUuc291cmNlID0gJHNjb3BlLnBsYWNlaG9sZGVyO1xuXG4gICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICBtb2RlOiB7XG4gICAgICAgIG5hbWU6IFwiamF2YXNjcmlwdFwiXG4gICAgICB9XG4gICAgfTtcbiAgICAvLyRzY29wZS5jb2RlTWlycm9yT3B0aW9ucyA9IENvZGVFZGl0b3IuY3JlYXRlRWRpdG9yU2V0dGluZ3Mob3B0aW9ucyk7XG5cblxuICAgICRzY29wZS5pc1ZhbGlkID0gKCkgPT4gJHNjb3BlLnNvdXJjZSAmJiAkc2NvcGUuc291cmNlICE9PSAkc2NvcGUucGxhY2Vob2xkZXI7XG5cbiAgICAkc2NvcGUuaW1wb3J0SlNPTiA9ICgpID0+IHtcbiAgICAgIHZhciBqc29uID0gW107XG4gICAgICAvLyBsZXRzIHBhcnNlIHRoZSBKU09OLi4uXG4gICAgICB0cnkge1xuICAgICAgICBqc29uID0gSlNPTi5wYXJzZSgkc2NvcGUuc291cmNlKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy9IYXd0aW9Db3JlLm5vdGlmaWNhdGlvbihcImVycm9yXCIsIFwiQ291bGQgbm90IHBhcnNlIHRoZSBKU09OXFxuXCIgKyBlKTtcbiAgICAgICAganNvbiA9IFtdO1xuICAgICAgfVxuICAgICAgdmFyIGFycmF5ID0gW107XG4gICAgICBpZiAoYW5ndWxhci5pc0FycmF5KGpzb24pKSB7XG4gICAgICAgIGFycmF5ID0ganNvbjtcbiAgICAgIH0gZWxzZSBpZiAoYW5ndWxhci5pc09iamVjdChqc29uKSkge1xuICAgICAgICBhcnJheS5wdXNoKGpzb24pO1xuICAgICAgfVxuXG4gICAgICBpZiAoYXJyYXkubGVuZ3RoKSB7XG4gICAgICAgIC8vIGxldHMgZW5zdXJlIHdlIGhhdmUgc29tZSB2YWxpZCBpZHMgYW5kIHN0dWZmLi4uXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChhcnJheSwgKGRhc2gsIGluZGV4KSA9PiB7XG4gICAgICAgICAgYW5ndWxhci5jb3B5KGRhc2gsIGRhc2hib2FyZFJlcG9zaXRvcnkuY3JlYXRlRGFzaGJvYXJkKGRhc2gpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhhcnJheSwgXCJJbXBvcnRlZCBkYXNoYm9hcmQgSlNPTlwiLCBEYXNoYm9hcmQub25PcGVyYXRpb25Db21wbGV0ZSk7XG4gICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9lZGl0XCIpO1xuICAgICAgfVxuICAgIH1cbiAgfV0pO1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG4gIF9tb2R1bGUuY29udHJvbGxlcihcIkRhc2hib2FyZC5OYXZCYXJDb250cm9sbGVyXCIsIFtcIiRzY29wZVwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcIiRyb290U2NvcGVcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsICgkc2NvcGUsICRyb3V0ZVBhcmFtcywgJHJvb3RTY29wZSwgZGFzaGJvYXJkUmVwb3NpdG9yeTpEYXNoYm9hcmRSZXBvc2l0b3J5KSA9PiB7XG5cbiAgICAkc2NvcGUuX2Rhc2hib2FyZHMgPSBbXTtcblxuICAgICRzY29wZS5hY3RpdmVEYXNoYm9hcmQgPSAkcm91dGVQYXJhbXNbJ2Rhc2hib2FyZElkJ107XG5cbiAgICAkc2NvcGUuJG9uKCdsb2FkRGFzaGJvYXJkcycsIGxvYWREYXNoYm9hcmRzKTtcblxuICAgICRzY29wZS4kb24oJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkTG9hZGVkKTtcblxuICAgICRzY29wZS5kYXNoYm9hcmRzID0gKCkgPT4ge1xuICAgICAgcmV0dXJuICRzY29wZS5fZGFzaGJvYXJkc1xuICAgIH07XG5cbiAgICAkc2NvcGUub25UYWJSZW5hbWVkID0gZnVuY3Rpb24oZGFzaCkge1xuICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKFtkYXNoXSwgXCJSZW5hbWVkIGRhc2hib2FyZFwiLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZGFzaGJvYXJkTG9hZGVkKGV2ZW50LCBkYXNoYm9hcmRzKSB7XG4gICAgICBsb2cuZGVidWcoXCJuYXZiYXIgZGFzaGJvYXJkTG9hZGVkOiBcIiwgZGFzaGJvYXJkcyk7XG4gICAgICAkc2NvcGUuX2Rhc2hib2FyZHMgPSBkYXNoYm9hcmRzO1xuICAgICAgaWYgKGV2ZW50ID09PSBudWxsKSB7XG4gICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnZGFzaGJvYXJkc1VwZGF0ZWQnLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2FkRGFzaGJvYXJkcyhldmVudCkge1xuICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXREYXNoYm9hcmRzKChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIC8vIHByZXZlbnQgdGhlIGJyb2FkY2FzdCBmcm9tIGhhcHBlbmluZy4uLlxuICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1dKTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuICBleHBvcnQgdmFyIFNoYXJlQ29udHJvbGxlciA9IF9tb2R1bGUuY29udHJvbGxlcihcIkRhc2hib2FyZC5TaGFyZUNvbnRyb2xsZXJcIiwgW1wiJHNjb3BlXCIsIFwiJGxvY2F0aW9uXCIsIFwiJHJvdXRlUGFyYW1zXCIsIFwiZGFzaGJvYXJkUmVwb3NpdG9yeVwiLCAoJHNjb3BlLCAkbG9jYXRpb24sICRyb3V0ZVBhcmFtcywgZGFzaGJvYXJkUmVwb3NpdG9yeTpEYXNoYm9hcmRSZXBvc2l0b3J5KSA9PiB7XG4gICAgdmFyIGlkID0gJHJvdXRlUGFyYW1zW1wiZGFzaGJvYXJkSWRcIl07XG4gICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXREYXNoYm9hcmQoaWQsIG9uRGFzaGJvYXJkTG9hZCk7XG5cbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIG1vZGU6IHtcbiAgICAgICAgICBuYW1lOiBcImphdmFzY3JpcHRcIlxuICAgICAgfVxuICAgIH07XG4gICAgLy8kc2NvcGUuY29kZU1pcnJvck9wdGlvbnMgPSBDb2RlRWRpdG9yLmNyZWF0ZUVkaXRvclNldHRpbmdzKG9wdGlvbnMpO1xuXG4gICAgZnVuY3Rpb24gb25EYXNoYm9hcmRMb2FkKGRhc2hib2FyZCkge1xuICAgICAgJHNjb3BlLmRhc2hib2FyZCA9IERhc2hib2FyZC5jbGVhbkRhc2hib2FyZERhdGEoZGFzaGJvYXJkKTtcblxuICAgICAgJHNjb3BlLmpzb24gPSB7XG4gICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJoYXd0aW8gZGFzaGJvYXJkc1wiLFxuICAgICAgICBcInB1YmxpY1wiOiB0cnVlLFxuICAgICAgICBcImZpbGVzXCI6IHtcbiAgICAgICAgICBcImRhc2hib2FyZHMuanNvblwiOiB7XG4gICAgICAgICAgICBcImNvbnRlbnRcIjogSlNPTi5zdHJpbmdpZnkoJHNjb3BlLmRhc2hib2FyZCwgbnVsbCwgXCIgIFwiKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgJHNjb3BlLnNvdXJjZSA9IEpTT04uc3RyaW5naWZ5KCRzY29wZS5kYXNoYm9hcmQsIG51bGwsIFwiICBcIik7XG4gICAgICBDb3JlLiRhcHBseU5vd09yTGF0ZXIoJHNjb3BlKTtcbiAgICB9XG4gIH1dKTtcbn1cbiIsIi8vLyBDb3B5cmlnaHQgMjAxNC0yMDE1IFJlZCBIYXQsIEluYy4gYW5kL29yIGl0cyBhZmZpbGlhdGVzXG4vLy8gYW5kIG90aGVyIGNvbnRyaWJ1dG9ycyBhcyBpbmRpY2F0ZWQgYnkgdGhlIEBhdXRob3IgdGFncy5cbi8vL1xuLy8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8vXG4vLy8gICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vL1xuLy8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vaW5jbHVkZXMudHNcIi8+XG5tb2R1bGUgRXhhbXBsZSB7XG5cbiAgZXhwb3J0IHZhciBwbHVnaW5OYW1lID0gXCJoYXd0aW8tYXNzZW1ibHlcIjtcblxuICBleHBvcnQgdmFyIGxvZzogTG9nZ2luZy5Mb2dnZXIgPSBMb2dnZXIuZ2V0KHBsdWdpbk5hbWUpO1xuXG4gIGV4cG9ydCB2YXIgdGVtcGxhdGVQYXRoID0gXCJwbHVnaW5zL2V4YW1wbGUvaHRtbFwiO1xufVxuIiwiLy8vIENvcHlyaWdodCAyMDE0LTIwMTUgUmVkIEhhdCwgSW5jLiBhbmQvb3IgaXRzIGFmZmlsaWF0ZXNcbi8vLyBhbmQgb3RoZXIgY29udHJpYnV0b3JzIGFzIGluZGljYXRlZCBieSB0aGUgQGF1dGhvciB0YWdzLlxuLy8vXG4vLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLy9cbi8vLyAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8vXG4vLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9pbmNsdWRlcy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJleGFtcGxlR2xvYmFscy50c1wiLz5cbm1vZHVsZSBFeGFtcGxlIHtcblxuICBleHBvcnQgdmFyIF9tb2R1bGUgPSBhbmd1bGFyLm1vZHVsZShFeGFtcGxlLnBsdWdpbk5hbWUsIFtdKTtcblxuICB2YXIgdGFiID0gdW5kZWZpbmVkO1xuXG4gIF9tb2R1bGUuY29uZmlnKFtcIiRsb2NhdGlvblByb3ZpZGVyXCIsIFwiJHJvdXRlUHJvdmlkZXJcIiwgXCJIYXd0aW9OYXZCdWlsZGVyUHJvdmlkZXJcIixcbiAgICAoJGxvY2F0aW9uUHJvdmlkZXIsICRyb3V0ZVByb3ZpZGVyOiBuZy5yb3V0ZS5JUm91dGVQcm92aWRlciwgYnVpbGRlcjogSGF3dGlvTWFpbk5hdi5CdWlsZGVyRmFjdG9yeSkgPT4ge1xuICAgIHRhYiA9IGJ1aWxkZXIuY3JlYXRlKClcbiAgICAgIC5pZChFeGFtcGxlLnBsdWdpbk5hbWUpXG4gICAgICAudGl0bGUoKCkgPT4gXCJFeGFtcGxlXCIpXG4gICAgICAuaHJlZigoKSA9PiBcIi9leGFtcGxlXCIpXG4gICAgICAuc3ViUGF0aChcIlBhZ2UgMVwiLCBcInBhZ2UxXCIsIGJ1aWxkZXIuam9pbihFeGFtcGxlLnRlbXBsYXRlUGF0aCwgXCJwYWdlMS5odG1sXCIpKVxuICAgICAgLmJ1aWxkKCk7XG4gICAgYnVpbGRlci5jb25maWd1cmVSb3V0aW5nKCRyb3V0ZVByb3ZpZGVyLCB0YWIpO1xuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgfV0pO1xuXG4gIF9tb2R1bGUucnVuKFtcIkhhd3Rpb05hdlwiLCAoSGF3dGlvTmF2OiBIYXd0aW9NYWluTmF2LlJlZ2lzdHJ5KSA9PiB7XG4gICAgSGF3dGlvTmF2LmFkZCh0YWIpO1xuICAgIGxvZy5kZWJ1ZyhcImxvYWRlZFwiKTtcbiAgfV0pO1xuXG5cbiAgaGF3dGlvUGx1Z2luTG9hZGVyLmFkZE1vZHVsZShFeGFtcGxlLnBsdWdpbk5hbWUpO1xufVxuIiwiLy8vIENvcHlyaWdodCAyMDE0LTIwMTUgUmVkIEhhdCwgSW5jLiBhbmQvb3IgaXRzIGFmZmlsaWF0ZXNcbi8vLyBhbmQgb3RoZXIgY29udHJpYnV0b3JzIGFzIGluZGljYXRlZCBieSB0aGUgQGF1dGhvciB0YWdzLlxuLy8vXG4vLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLy9cbi8vLyAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8vXG4vLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJleGFtcGxlUGx1Z2luLnRzXCIvPlxubW9kdWxlIEV4YW1wbGUge1xuXG4gIGV4cG9ydCB2YXIgUGFnZTFDb250cm9sbGVyID0gX21vZHVsZS5jb250cm9sbGVyKFwiRXhhbXBsZS5QYWdlMUNvbnRyb2xsZXJcIiwgW1wiJHNjb3BlXCIsICgkc2NvcGUpID0+IHtcbiAgICAkc2NvcGUudGFyZ2V0ID0gXCJXb3JsZCFcIjtcbiAgfV0pO1xuXG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
angular.module("hawtio-dashboard-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("plugins/dashboard/html/addToDashboard.html","<div class=\"controller-section\" ng-controller=\"Dashboard.EditDashboardsController\">\n  <div class=\"row-fluid\">\n    <div class=\"span10 offset1 well\">\n      Select a dashboard (or multiple dashboards) in the table below and click \"Add View To Dashboard\" to add the view to a dashboard.  You can also create a new dashboard using the \"Create\" button, select it and then click the \"Add View To Dashboard\" to add the view to a new dashboard.\n    </div>\n  </div>\n  <div class=\"row-fluid\">\n\n    <div class=\"span12\">\n      <ul class=\"nav nav-tabs\">\n        <li>\n          <a href=\"\" ng-disabled=\"!hasSelection()\" ng-click=\"addViewToDashboard()\"\n                    title=\"Adds the current view to the selected dashboard(s)\" data-placement=\"bottom\">\n            <i class=\"icon-dashboard\"></i> Add View To Dashboard\n          </a>\n        </li>\n\n        <li>\n          <a href=\"\" ng-click=\"create()\"\n                  title=\"Create a new empty dashboard\" data-placement=\"bottom\">\n            <i class=\"icon-plus\"></i> Create\n          </a>\n        </li>\n\n      </ul>\n\n    </div>\n    <!--\n    <div class=\"span6\">\n      <div class=\"control-group\">\n        <input type=\"text\" class=\"span12 search-query\" ng-model=\"gridOptions.filterOptions.filterText\" placeholder=\"Filter...\">\n      </div>\n    </div>\n    -->\n  </div>\n\n  <div class=\"row-fluid\">\n    <div class=\"gridStyle\" ng-grid=\"gridOptions\"></div>\n  </div>\n</div>\n");
$templateCache.put("plugins/dashboard/html/dashboard.html","<script type=\"text/ng-template\" id=\"widgetTemplate\">\n  <div class=\"widget-area\" data-widgetId=\"{{widget.id}}\">\n    <div class=\"widget-title\">\n      <div class=\"row-fluid\">\n        <div class=\"pull-left\">\n          <editable-property ng-model=\"widget\" property=\"title\" on-save=\"onWidgetRenamed(widget)\"></editable-property>\n        </div>\n        <div class=\"pull-right\">\n          <i class=\"icon-remove\" title=\"Removes this view from the dashboard\" ng-click=\"removeWidget(widget)\"></i>\n        </div>\n      </div>\n    </div>\n    <div class=\"widget-body\">\n      <div ng-include=\"widget.include\"></div>\n    </div>\n  </div>\n</script>\n\n<!--\n<div class=\"gridster\" ng-controller=\"Dashboard.DashboardController\">\n  <ul id=\"widgets\">\n  </ul>\n</div>\n-->\n\n<div class=\"row-fluid\">\n  <div class=\"span12 gridster\">\n    <ul id=\"widgets\" hawtio-dashboard></ul>\n  </div>\n</div>\n\n\n");
$templateCache.put("plugins/dashboard/html/editDashboards.html","<div class=\"controller-section\" ng-controller=\"Dashboard.EditDashboardsController\">\n  <div class=\"row-fluid\">\n\n    <div class=\"span12\">\n      <ul class=\"nav nav-tabs\">\n        <li>\n          <a href=\"\"\n             ng-click=\"create()\"\n             title=\"Create a new empty dashboard\"\n             data-placement=\"bottom\">\n            <i class=\"icon-plus\"></i> Create</a>\n        </li>\n        <li>\n          <a href=\"\"\n             ng-disabled=\"!hasSelection()\"\n             ng-click=\"duplicate()\"\n                  title=\"Create a copy of the selected dashboard(s)\" data-placement=\"bottom\">\n            <i class=\"icon-copy\"></i> Duplicate\n          </a>\n        </li>\n        <li>\n          <a href=\"\"\n             ng-show=\"usingFabric()\"\n             ng-disabled=\"!hasSelection()\"\n             ng-click=\"duplicateToProfiles()\"\n             title=\"Copy selected dashboards to another profile\">\n            <i class=\"icon-copy\"></i> Duplicate to profiles\n          </a>\n        </li>\n        <li>\n          <a href=\"\"\n             ng-disabled=\"!hasSelection()\"\n             ng-click=\"deleteDashboard()\"><i\n                  class=\"icon-remove\"></i> Delete\n          </a>\n        </li>\n        <li class=\"pull-right\">\n          <a href=\"#/dashboard/import\"\n             title=\"Imports a JSON dashboard configuration from github or some other URL\"\n             data-placement=\"bottom\">\n            <i class=\"icon-cloud-download\"></i> Import\n          </a>\n\n        </li>\n      </ul>\n    </div>\n  </div>\n\n  <div class=\"row-fluid\">\n    <div class=\"span12\">\n      <div class=\"gridStyle\" ng-grid=\"gridOptions\"></div>\n    </div>\n  </div>\n\n\n  <div modal=\"duplicateDashboards.show\">\n    <form name=\"addProfile\" class=\"form-horizontal no-bottom-margin\" ng-submit=\"doDuplicateToProfiles()\">\n      <div class=\"modal-header\"><h4>Copy dashboards</h4></div>\n      <div id=\"dialog-body\" class=\"modal-body\">\n        <label>Select one or more profiles to copy the dashboards to: </label>\n\n        <div fabric-profile-selector=\"selectedProfilesDialog\" version-id=\"container.versionId\" no-links=\"true\"></div>\n\n      </div>\n      <div class=\"modal-footer\">\n        <input class=\"btn btn-success\" ng-disabled=\"selectedProfilesDialog.length == 0\" type=\"submit\"\n               value=\"Copy\">\n        <input class=\"btn btn-primary\" ng-click=\"duplicateDashboards.close()\" type=\"button\" value=\"Cancel\">\n      </div>\n    </form>\n  </div>\n\n\n\n\n</div>\n");
$templateCache.put("plugins/dashboard/html/import.html","<div class=\"form-horizontal\" ng-controller=\"Dashboard.ImportController\">\n  <div class=\"control-group\">\n    <button id=\"importButton\" ng-disabled=\"!isValid()\" ng-click=\"importJSON()\"\n            class=\"btn btn-info\"\n            title=\"Imports the JSON configuration of the dashboard\">\n      <i class=\"icon-cloud-download\"></i> import dashboard JSON\n    </button>\n    <div id=\"alert-area\" class=\"span9 pull-right\"></div>\n  </div>\n  <div class=\"control-group\">\n    <textarea id=\"source\" ui-codemirror=\"codeMirrorOptions\" ng-model=\"source\"></textarea>\n  </div>\n</div>");
$templateCache.put("plugins/dashboard/html/layoutDashboard.html","<ul class=\"nav nav-tabs\" ng-controller=\"Dashboard.NavBarController\">\n  <li ng-repeat=\"dash in _dashboards track by $index\"\n      ng-class=\'{active : isActive(dash)}\'>\n    <a ng-href=\"#/dashboard/id/{{dash.id}}{{hash}}\">\n      <editable-property class=\"inline-block\"\n                         on-save=\"onTabRenamed(dash)\"\n                         property=\"title\"\n                         ng-model=\"dash\"></editable-property>\n    </a>\n  </li>\n  <li class=\"pull-right\" ng-class=\'{active : isEditing()}\'>\n    <a ng-href=\"#/dashboard/edit{{hash}}\" title=\"Manage the dashboards; letting you add, duplicate or remove dashboards\"\n       data-placement=\"bottom\">\n      <i class=\"icon-edit\"></i> Manage</a></li>\n</ul>\n<div class=\"row-fluid\">\n  <div ng-view></div>\n</div>\n\n\n");
$templateCache.put("plugins/example/html/page1.html","<div class=\"row\">\n  <div class=\"col-md-12\" ng-controller=\"Example.Page1Controller\">\n    <h1>Page 1</h1>\n    <p class=\'customClass\'>Hello {{target}}</p>\n  </div>\n</div>\n");}]); hawtioPluginLoader.addModule("hawtio-dashboard-templates");