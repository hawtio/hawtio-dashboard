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
        $routeProvider.when('/dashboard/add', { templateUrl: Dashboard.templatePath + 'addToDashboard.html' }).when('/dashboard/edit', { templateUrl: Dashboard.templatePath + 'editDashboards.html' }).when('/dashboard/idx/:dashboardIndex', { templateUrl: Dashboard.templatePath + 'dashboard.html', reloadOnSearch: false }).when('/dashboard/id/:dashboardId', { templateUrl: Dashboard.templatePath + 'dashboard.html', reloadOnSearch: false }).when('/dashboard/id/:dashboardId/share', { templateUrl: Dashboard.templatePath + 'share.html' }).when('/dashboard/import', { templateUrl: Dashboard.templatePath + 'import.html' });
    }]);
    Dashboard._module.value('ui.config', {
        jq: {
            gridster: {
                widget_margins: [10, 10],
                widget_base_dimensions: [140, 140]
            }
        }
    });
    var tab = undefined;
    function setSubTabs(builder, dashboards, $rootScope) {
        tab.tabs = [];
        _.forEach(dashboards, function (dashboard) {
            var child = builder.id('dashboard-' + dashboard.id).title(function () { return dashboard.title || dashboard.id; }).href(function () {
                var uri = new URI(UrlHelpers.join('/dashboard/id', dashboard.id));
                uri.search({
                    'main-tab': Dashboard.pluginName,
                    'sub-tab': 'dashboard-' + dashboard.id
                });
                return uri.toString();
            }).build();
            tab.tabs.push(child);
        });
        var manage = builder.id('dashboard-manage').title(function () { return '<i class="fa fa-pencil"></i>&nbsp;Manage'; }).href(function () { return '/dashboard/edit?main-tab=dashboard&sub-tab=dashboard-manage'; }).build();
        tab.tabs.push(manage);
        Core.$apply($rootScope);
    }
    Dashboard.setSubTabs = setSubTabs;
    Dashboard._module.run(["HawtioNav", "dashboardRepository", "$rootScope", function (nav, dashboards, $rootScope) {
        var builder = nav.builder();
        tab = builder.id(Dashboard.pluginName).href(function () { return '/dashboard/idx/0'; }).title(function () { return 'Dashboard'; }).build();
        nav.add(tab);
        dashboards.getDashboards(function (dashboards) {
            setSubTabs(builder, dashboards, $rootScope);
        });
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
    Dashboard._module.controller("Dashboard.EditDashboardsController", ["$scope", "$routeParams", "$route", "$location", "$rootScope", "dashboardRepository", "HawtioNav", "$timeout", "$templateCache", "$modal", function ($scope, $routeParams, $route, $location, $rootScope, dashboardRepository, nav, $timeout, $templateCache, $modal) {
        $scope._dashboards = [];
        $rootScope.$on('dashboardsUpdated', dashboardLoaded);
        $scope.hasUrl = function () {
            return ($scope.url) ? true : false;
        };
        $scope.hasSelection = function () {
            return $scope.gridOptions.selectedItems.length !== 0;
        };
        $scope.gridOptions = {
            selectedItems: [],
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
                    cellTemplate: $templateCache.get('editDashboardTitleCell.html')
                },
                {
                    field: 'group',
                    displayName: 'Group'
                }
            ],
        };
        $scope.$on("$routeChangeSuccess", function (event, current, previous) {
            $timeout(updateData, 10);
        });
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
                                nextHref = new URI().path("/dashboard/id/" + selectedItem.id).toString();
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
                Dashboard.setSubTabs(nav.builder(), dashboards, $rootScope);
                dashboardLoaded(null, dashboards);
            });
        };
        $scope.duplicate = function () {
            var newDashboards = [];
            var commitMessage = "Duplicated dashboard(s) ";
            angular.forEach($scope.gridOptions.selectedItems, function (item, idx) {
                var commitMessage = "Duplicated dashboard " + item.title;
                var newDash = dashboardRepository.cloneDashboard(item);
                newDashboards.push(newDash);
            });
            deselectAll();
            commitMessage = commitMessage + newDashboards.map(function (d) {
                return d.title;
            }).join(',');
            dashboardRepository.putDashboards(newDashboards, commitMessage, function (dashboards) {
                Dashboard.setSubTabs(nav.builder(), dashboards, $rootScope);
                dashboardLoaded(null, dashboards);
            });
        };
        $scope.renameDashboard = function () {
            if ($scope.gridOptions.selectedItems.length === 1) {
                var selected = _.first($scope.gridOptions.selectedItems);
                var modal = $modal.open({
                    templateUrl: UrlHelpers.join(Dashboard.templatePath, 'renameDashboardModal.html'),
                    controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                        $scope.config = {
                            properties: {
                                'title': {
                                    type: 'string',
                                    default: selected.title
                                }
                            }
                        };
                        $scope.selected = selected;
                        $scope.ok = function () {
                            modal.close();
                            dashboardRepository.putDashboards([$scope.selected], 'renamed dashboard', function (dashboards) {
                                deselectAll();
                                Dashboard.setSubTabs(nav.builder(), dashboards, $rootScope);
                                dashboardLoaded(null, dashboards);
                            });
                        };
                        $scope.cancel = function () {
                            modal.dismiss();
                        };
                    }]
                });
            }
        };
        $scope.deleteDashboard = function () {
            if ($scope.hasSelection()) {
                var selected = $scope.gridOptions.selectedItems;
                var modal = $modal.open({
                    templateUrl: UrlHelpers.join(Dashboard.templatePath, 'deleteDashboardModal.html'),
                    controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                        $scope.selected = selected;
                        $scope.ok = function () {
                            modal.close();
                            dashboardRepository.deleteDashboards($scope.selected, function (dashboards) {
                                deselectAll();
                                Dashboard.setSubTabs(nav.builder(), dashboards, $rootScope);
                                dashboardLoaded(null, dashboards);
                            });
                        };
                        $scope.cancel = function () {
                            modal.dismiss();
                        };
                    }]
                });
            }
        };
        $scope.gist = function () {
            if ($scope.gridOptions.selectedItems.length > 0) {
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
            dashboards.forEach(function (dashboard) {
                dashboard.hash = '?main-tab=dashboard&sub-tab=dashboard-' + dashboard.id;
            });
            $scope._dashboards = dashboards;
            if (event === null) {
                $scope.$emit('dashboardsUpdated', dashboards);
            }
            Core.$apply($rootScope);
        }
        function dashboards() {
            return $scope._dashboards;
        }
        function deselectAll() {
            $scope.gridOptions.selectedItems.length = 0;
        }
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
        return new Dashboard.GridsterDirective();
    });
    var GridsterDirective = (function () {
        function GridsterDirective() {
            this.restrict = 'A';
            this.replace = true;
            this.controller = ["$scope", "$element", "$attrs", "$location", "$routeParams", "$templateCache", "dashboardRepository", "$compile", "$templateRequest", function ($scope, $element, $attrs, $location, $routeParams, $templateCache, dashboardRepository, $compile, $templateRequest) {
                var gridSize = 150;
                var gridMargin = 6;
                var gridHeight;
                $scope.gridX = gridSize;
                $scope.gridY = gridSize;
                $scope.widgetMap = {};
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
                                $location.path("/dashboard/edit");
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluY2x1ZGVzLmpzIiwiL2hvbWUvZ2FzaGNydW1iL1dvcmsvU291cmNlL2hhd3Rpby1kYXNoYm9hcmQvZGFzaGJvYXJkL3RzL2Rhc2hib2FyZEludGVyZmFjZXMudHMiLCIvaG9tZS9nYXNoY3J1bWIvV29yay9Tb3VyY2UvaGF3dGlvLWRhc2hib2FyZC9kYXNoYm9hcmQvdHMvZGFzaGJvYXJkSGVscGVycy50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9kYXNoYm9hcmRQbHVnaW4udHMiLCIvaG9tZS9nYXNoY3J1bWIvV29yay9Tb3VyY2UvaGF3dGlvLWRhc2hib2FyZC9kYXNoYm9hcmQvdHMvZGFzaGJvYXJkUmVwb3NpdG9yeS50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9lZGl0RGFzaGJvYXJkcy50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9yZWN0YW5nbGVMb2NhdGlvbi50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9ncmlkc3RlckRpcmVjdGl2ZS50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9pbXBvcnQudHMiLCIvaG9tZS9nYXNoY3J1bWIvV29yay9Tb3VyY2UvaGF3dGlvLWRhc2hib2FyZC9kYXNoYm9hcmQvdHMvbmF2YmFyLnRzIiwiL2hvbWUvZ2FzaGNydW1iL1dvcmsvU291cmNlL2hhd3Rpby1kYXNoYm9hcmQvZGFzaGJvYXJkL3RzL3NoYXJlLnRzIiwiL2hvbWUvZ2FzaGNydW1iL1dvcmsvU291cmNlL2hhd3Rpby1kYXNoYm9hcmQvZXhhbXBsZS90cy9leGFtcGxlR2xvYmFscy50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2V4YW1wbGUvdHMvZXhhbXBsZVBsdWdpbi50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2V4YW1wbGUvdHMvcGFnZTEudHMiXSwibmFtZXMiOlsiRGFzaGJvYXJkIiwiRGFzaGJvYXJkLmNsZWFuRGFzaGJvYXJkRGF0YSIsIkRhc2hib2FyZC5kZWNvZGVVUklDb21wb25lbnRQcm9wZXJ0aWVzIiwiRGFzaGJvYXJkLm9uT3BlcmF0aW9uQ29tcGxldGUiLCJEYXNoYm9hcmQuc2V0U3ViVGFicyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5LmNvbnN0cnVjdG9yIiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5sb2FkRGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuc3RvcmVEYXNoYm9hcmRzIiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzIiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5kZWxldGVEYXNoYm9hcmRzIiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5nZXREYXNoYm9hcmRzIiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5nZXREYXNoYm9hcmQiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5LmNyZWF0ZURhc2hib2FyZCIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuY2xvbmVEYXNoYm9hcmQiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5LmdldFR5cGUiLCJEYXNoYm9hcmQudXBkYXRlRGF0YSIsIkRhc2hib2FyZC5kYXNoYm9hcmRMb2FkZWQiLCJEYXNoYm9hcmQuZGFzaGJvYXJkcyIsIkRhc2hib2FyZC5kZXNlbGVjdEFsbCIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbiIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbi5jb25zdHJ1Y3RvciIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbi5hYnNVcmwiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uaGFzaCIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbi5ob3N0IiwiRGFzaGJvYXJkLlJlY3RhbmdsZUxvY2F0aW9uLnBhdGgiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24ucG9ydCIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbi5wcm90b2NvbCIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbi5yZXBsYWNlIiwiRGFzaGJvYXJkLlJlY3RhbmdsZUxvY2F0aW9uLnNlYXJjaCIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbi51cmwiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3IiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3IuY2hhbmdlV2lkZ2V0U2l6ZSIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci51cGRhdGVXaWRnZXRzIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLm9uRGFzaGJvYXJkTG9hZCIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5vbkRhc2hib2FyZExvYWQubWF5YmVGaW5pc2hVcCIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5zZXJpYWxpemVEYXNoYm9hcmQiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3IubWFrZVJlc2l6YWJsZSIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5yZXNpemVCbG9jayIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci51cGRhdGVEYXNoYm9hcmRSZXBvc2l0b3J5IiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLmdldEdyaWRzdGVyIiwiRGFzaGJvYXJkLmxvYWREYXNoYm9hcmRzIiwiRGFzaGJvYXJkLm9uRGFzaGJvYXJkTG9hZCIsIkV4YW1wbGUiXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUN3Q0M7O0FDcENELElBQU8sU0FBUyxDQTRDZjtBQTVDRCxXQUFPLFNBQVMsRUFBQyxDQUFDO0lBRUxBLGFBQUdBLEdBQWtCQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQTtJQVV4REEsU0FBZ0JBLGtCQUFrQkEsQ0FBQ0EsSUFBSUE7UUFDckNDLElBQUlBLFNBQVNBLEdBQUdBLEVBQUVBLENBQUNBO1FBQ25CQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxJQUFJQSxFQUFFQSxVQUFDQSxLQUFLQSxFQUFFQSxHQUFHQTtZQUMvQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzdFQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQTtZQUN6QkEsQ0FBQ0E7UUFDSEEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDSEEsTUFBTUEsQ0FBQ0EsU0FBU0EsQ0FBQ0E7SUFDbkJBLENBQUNBO0lBUmVELDRCQUFrQkEsR0FBbEJBLGtCQVFmQSxDQUFBQTtJQVVEQSxTQUFnQkEsNEJBQTRCQSxDQUFDQSxJQUFJQTtRQUMvQ0UsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEs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Q0FBQ0EsSUFBSUEsQ0FBQ0E7d0JBQ3ZCQSxJQUFJQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQTt3QkFDbEJBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBOzRCQUNsQkEsTUFBTUEsR0FBR0EsU0FBU0EsQ0FBQ0EsNEJBQTRCQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTt3QkFDakVBLENBQUNBO3dCQUNEQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQSxDQUFDQTs0QkFDdkJBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLEVBQUVBLE9BQU9BLENBQUNBLFFBQVFBLENBQUNBLE1BQU1BLENBQUNBLFdBQVdBLENBQUNBLENBQUNBLENBQUNBO3dCQUN6REEsQ0FBQ0E7d0JBQ0RBLElBQUlBLElBQUlBLEdBQUdBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO3dCQUN2QkEsSUFBSUEsUUFBUUEsR0FBR0EsSUFBSUEsMkJBQWlCQSxDQUFDQSxTQUFTQSxFQUFFQSxJQUFJQSxFQUFFQSxNQUFNQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTt3QkFFcEVBLElBQUlBLGFBQWFBLEdBQUdBLFlBQVlBLEdBQUdBLE1BQU1BLENBQUNBLEVBQUVBLENBQUNBO3dCQUM3Q0EsSUFBSUEsU0FBU0EsR0FBR0EsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsYUFBYUEsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7d0JBQ3ZEQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxVQUFVQSxFQUFFQSxVQUFDQSxRQUFRQTs0QkFDckNBLFFBQVFBLENBQUNBLFNBQVNBLENBQUNBLFdBQVdBLEVBQUVBLENBQUNBLFdBQVdBLEVBQUVBLFVBQUNBLFNBQVNBO2dDQUV0REEsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0E7NEJBQ2xCQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTs0QkFDSkEsUUFBUUEsQ0FBQ0EsU0FB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R0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7UUFDbkJBLFdBQUdBLENBQUNBLEtBQUtBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO0lBQ3RCQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUdKQSxrQkFBa0JBLENBQUNBLFNBQVNBLENBQUNBLE9BQU9BLENBQUNBLFVBQVVBLENBQUNBLENBQUNBO0FBQ25EQSxDQUFDQSxFQXpCTSxPQUFPLEtBQVAsT0FBTyxRQXlCYjs7QUMxQkQsSUFBTyxPQUFPLENBTWI7QUFORCxXQUFPLE9BQU8sRUFBQyxDQUFDO0lBRUhBLHVCQUFlQSxHQUFHQSxlQUFPQSxDQUFDQSxVQUFVQSxDQUFDQSx5QkFBeUJBLEVBQUVBLENBQUNBLFFBQVFBLEVBQUVBLFVBQUNBLE1BQU1BO1FBQzNGQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQSxRQUFRQSxDQUFDQTtJQUMzQkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7QUFFTkEsQ0FBQ0EsRUFOTSxPQUFPLEtBQVAsT0FBTyxRQU1iIiwiZmlsZSI6ImNvbXBpbGVkLmpzIiwic291cmNlc0NvbnRlbnQiOltudWxsLCJtb2R1bGUgRGFzaGJvYXJkIHtcblxuICBleHBvcnQgaW50ZXJmYWNlIFNlYXJjaE1hcCB7XG4gICAgW25hbWU6IHN0cmluZ106IHN0cmluZztcbiAgfVxuXG4gIGV4cG9ydCBpbnRlcmZhY2UgRGFzaGJvYXJkV2lkZ2V0IHtcbiAgICBpZDogc3RyaW5nO1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgcm93PzogbnVtYmVyO1xuICAgIGNvbD86IG51bWJlcjtcbiAgICBzaXplX3g/OiBudW1iZXI7XG4gICAgc2l6ZV95PzogbnVtYmVyO1xuICAgIHBhdGg6IHN0cmluZztcbiAgICBpbmNsdWRlOiBzdHJpbmc7XG4gICAgc2VhcmNoOiBTZWFyY2hNYXBcbiAgICByb3V0ZVBhcmFtcz86IHN0cmluZztcbiAgfVxuXG4gIGV4cG9ydCBpbnRlcmZhY2UgRGFzaGJvYXJkIHtcbiAgICBpZDogc3RyaW5nO1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgZ3JvdXA6IHN0cmluZztcbiAgICB3aWRnZXRzOiBBcnJheTxEYXNoYm9hcmRXaWRnZXQ+O1xuICB9XG5cbiAgLyoqXG4gICAqIEJhc2UgaW50ZXJmYWNlIHRoYXQgZGFzaGJvYXJkIHJlcG9zaXRvcmllcyBtdXN0IGltcGxlbWVudFxuICAgKlxuICAgKiBAY2xhc3MgRGFzaGJvYXJkUmVwb3NpdG9yeVxuICAgKi9cbiAgZXhwb3J0IGludGVyZmFjZSBEYXNoYm9hcmRSZXBvc2l0b3J5IHtcbiAgICBwdXREYXNoYm9hcmRzOiAoYXJyYXk6YW55W10sIGNvbW1pdE1lc3NhZ2U6c3RyaW5nLCBmbikgPT4gYW55O1xuICAgIGRlbGV0ZURhc2hib2FyZHM6IChhcnJheTpBcnJheTxEYXNoYm9hcmQ+LCBmbikgPT4gYW55O1xuICAgIGdldERhc2hib2FyZHM6IChmbjooZGFzaGJvYXJkczogQXJyYXk8RGFzaGJvYXJkPikgPT4gdm9pZCkgPT4gdm9pZDtcbiAgICBnZXREYXNoYm9hcmQ6IChpZDpzdHJpbmcsIGZuOiAoZGFzaGJvYXJkOiBEYXNoYm9hcmQpID0+IHZvaWQpID0+IGFueTtcbiAgICBjcmVhdGVEYXNoYm9hcmQ6IChvcHRpb25zOmFueSkgPT4gYW55O1xuICAgIGNsb25lRGFzaGJvYXJkOihkYXNoYm9hcmQ6YW55KSA9PiBhbnk7XG4gICAgZ2V0VHlwZTooKSA9PiBzdHJpbmc7XG4gIH1cblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL2luY2x1ZGVzLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZEludGVyZmFjZXMudHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuXG4gIGV4cG9ydCB2YXIgbG9nOkxvZ2dpbmcuTG9nZ2VyID0gTG9nZ2VyLmdldCgnRGFzaGJvYXJkJyk7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNsZWFuZWQgdXAgdmVyc2lvbiBvZiB0aGUgZGFzaGJvYXJkIGRhdGEgd2l0aG91dCBhbnkgVUkgc2VsZWN0aW9uIHN0YXRlXG4gICAqIEBtZXRob2QgY2xlYW5EYXNoYm9hcmREYXRhXG4gICAqIEBzdGF0aWNcbiAgICogQGZvciBEYXNoYm9hcmRcbiAgICogQHBhcmFtIHthbnl9IGl0ZW1cbiAgICogQHJldHVybiB7YW55fVxuICAgKi9cbiAgZXhwb3J0IGZ1bmN0aW9uIGNsZWFuRGFzaGJvYXJkRGF0YShpdGVtKSB7XG4gICAgdmFyIGNsZWFuSXRlbSA9IHt9O1xuICAgIGFuZ3VsYXIuZm9yRWFjaChpdGVtLCAodmFsdWUsIGtleSkgPT4ge1xuICAgICAgaWYgKCFhbmd1bGFyLmlzU3RyaW5nKGtleSkgfHwgKCFrZXkuc3RhcnRzV2l0aChcIiRcIikgJiYgIWtleS5zdGFydHNXaXRoKFwiX1wiKSkpIHtcbiAgICAgICAgY2xlYW5JdGVtW2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gY2xlYW5JdGVtO1xuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgZGVjb2RlVVJJQ29tcG9uZW50KCkgb24gZWFjaCB2YWx1ZSBpbiB0aGUgb2JqZWN0XG4gICAqIEBtZXRob2QgZGVjb2RlVVJJQ29tcG9uZW50UHJvcGVydGllc1xuICAgKiBAc3RhdGljXG4gICAqIEBmb3IgRGFzaGJvYXJkXG4gICAqIEBwYXJhbSB7YW55fSBoYXNoXG4gICAqIEByZXR1cm4ge2FueX1cbiAgICovXG4gIGV4cG9ydCBmdW5jdGlvbiBkZWNvZGVVUklDb21wb25lbnRQcm9wZXJ0aWVzKGhhc2gpIHtcbiAgICBpZiAoIWhhc2gpIHtcbiAgICAgIHJldHVybiBoYXNoO1xuICAgIH1cbiAgICB2YXIgZGVjb2RlSGFzaCA9IHt9O1xuICAgIGFuZ3VsYXIuZm9yRWFjaChoYXNoLCAodmFsdWUsIGtleSkgPT4ge1xuICAgICAgZGVjb2RlSGFzaFtrZXldID0gdmFsdWUgPyBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpIDogdmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlY29kZUhhc2g7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gb25PcGVyYXRpb25Db21wbGV0ZShyZXN1bHQpIHtcbiAgICBjb25zb2xlLmxvZyhcIkNvbXBsZXRlZCBhZGRpbmcgdGhlIGRhc2hib2FyZCB3aXRoIHJlc3BvbnNlIFwiICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0KSk7XG4gIH1cbn1cbiIsIi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqIEBtYWluIERhc2hib2FyZFxuICovXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkSGVscGVycy50c1wiLz5cbm1vZHVsZSBEYXNoYm9hcmQge1xuICBcbiAgZXhwb3J0IHZhciB0ZW1wbGF0ZVBhdGggPSAncGx1Z2lucy9kYXNoYm9hcmQvaHRtbC8nO1xuICBleHBvcnQgdmFyIHBsdWdpbk5hbWUgPSAnZGFzaGJvYXJkJztcbiAgXG4gIGV4cG9ydCB2YXIgX21vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKHBsdWdpbk5hbWUsIFtdKTtcblxuICBfbW9kdWxlLmNvbmZpZyhbXCIkcm91dGVQcm92aWRlclwiLCAoJHJvdXRlUHJvdmlkZXIpID0+IHtcbiAgICAkcm91dGVQcm92aWRlci5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvYWRkJywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2FkZFRvRGFzaGJvYXJkLmh0bWwnfSkuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2VkaXQnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnZWRpdERhc2hib2FyZHMuaHRtbCd9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvaWR4LzpkYXNoYm9hcmRJbmRleCcsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdkYXNoYm9hcmQuaHRtbCcsIHJlbG9hZE9uU2VhcmNoOiBmYWxzZSB9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvaWQvOmRhc2hib2FyZElkJywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2Rhc2hib2FyZC5odG1sJywgcmVsb2FkT25TZWFyY2g6IGZhbHNlIH0pLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9pZC86ZGFzaGJvYXJkSWQvc2hhcmUnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnc2hhcmUuaHRtbCd9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvaW1wb3J0Jywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2ltcG9ydC5odG1sJ30pO1xuICB9XSk7XG5cbiAgX21vZHVsZS52YWx1ZSgndWkuY29uZmlnJywge1xuICAgIC8vIFRoZSB1aS1qcSBkaXJlY3RpdmUgbmFtZXNwYWNlXG4gICAganE6IHtcbiAgICAgIGdyaWRzdGVyOiB7XG4gICAgICAgIHdpZGdldF9tYXJnaW5zOiBbMTAsIDEwXSxcbiAgICAgICAgd2lkZ2V0X2Jhc2VfZGltZW5zaW9uczogWzE0MCwgMTQwXVxuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgdmFyIHRhYiA9IHVuZGVmaW5lZDtcblxuICBleHBvcnQgZnVuY3Rpb24gc2V0U3ViVGFicyhidWlsZGVyLCBkYXNoYm9hcmRzOkFycmF5PERhc2hib2FyZD4sICRyb290U2NvcGUpIHtcbiAgICB0YWIudGFicyA9IFtdO1xuICAgIF8uZm9yRWFjaChkYXNoYm9hcmRzLCAoZGFzaGJvYXJkKSA9PiB7XG4gICAgICB2YXIgY2hpbGQgPSBidWlsZGVyXG4gICAgICAgIC5pZCgnZGFzaGJvYXJkLScgKyBkYXNoYm9hcmQuaWQpXG4gICAgICAgIC50aXRsZSgoKSA9PiBkYXNoYm9hcmQudGl0bGUgfHwgZGFzaGJvYXJkLmlkKVxuICAgICAgICAuaHJlZigoKSA9PiB7XG4gICAgICAgICAgdmFyIHVyaSA9IG5ldyBVUkkoVXJsSGVscGVycy5qb2luKCcvZGFzaGJvYXJkL2lkJywgZGFzaGJvYXJkLmlkKSlcbiAgICAgICAgICAgIHVyaS5zZWFyY2goe1xuICAgICAgICAgICAgICAnbWFpbi10YWInOiBwbHVnaW5OYW1lLFxuICAgICAgICAgICAgICAnc3ViLXRhYic6ICdkYXNoYm9hcmQtJyArIGRhc2hib2FyZC5pZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHVyaS50b1N0cmluZygpO1xuICAgICAgICB9KVxuICAgICAgLmJ1aWxkKCk7XG4gICAgICB0YWIudGFicy5wdXNoKGNoaWxkKTtcbiAgICB9KTtcbiAgICB2YXIgbWFuYWdlID0gYnVpbGRlclxuICAgICAgLmlkKCdkYXNoYm9hcmQtbWFuYWdlJylcbiAgICAgIC50aXRsZSgoKSA9PiAnPGkgY2xhc3M9XCJmYSBmYS1wZW5jaWxcIj48L2k+Jm5ic3A7TWFuYWdlJylcbiAgICAgIC5ocmVmKCgpID0+ICcvZGFzaGJvYXJkL2VkaXQ/bWFpbi10YWI9ZGFzaGJvYXJkJnN1Yi10YWI9ZGFzaGJvYXJkLW1hbmFnZScpXG4gICAgICAuYnVpbGQoKTtcbiAgICB0YWIudGFicy5wdXNoKG1hbmFnZSk7XG4gICAgQ29yZS4kYXBwbHkoJHJvb3RTY29wZSk7XG4gIH1cblxuICBfbW9kdWxlLnJ1bihbXCJIYXd0aW9OYXZcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsIFwiJHJvb3RTY29wZVwiLCAobmF2Okhhd3Rpb01haW5OYXYuUmVnaXN0cnksIGRhc2hib2FyZHM6RGFzaGJvYXJkUmVwb3NpdG9yeSwgJHJvb3RTY29wZSkgPT4ge1xuICAgIHZhciBidWlsZGVyID0gbmF2LmJ1aWxkZXIoKTtcbiAgICB0YWIgPSBidWlsZGVyLmlkKHBsdWdpbk5hbWUpXG4gICAgICAgICAgICAgICAgLmhyZWYoKCkgPT4gJy9kYXNoYm9hcmQvaWR4LzAnKVxuICAgICAgICAgICAgICAgIC50aXRsZSgoKSA9PiAnRGFzaGJvYXJkJylcbiAgICAgICAgICAgICAgICAuYnVpbGQoKTtcbiAgICBuYXYuYWRkKHRhYik7XG4gICAgZGFzaGJvYXJkcy5nZXREYXNoYm9hcmRzKChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICBzZXRTdWJUYWJzKGJ1aWxkZXIsIGRhc2hib2FyZHMsICRyb290U2NvcGUpO1xuICAgIH0pO1xuICB9XSk7XG5cbiAgaGF3dGlvUGx1Z2luTG9hZGVyLmFkZE1vZHVsZShwbHVnaW5OYW1lKTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkSW50ZXJmYWNlcy50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG5cbiAgX21vZHVsZS5mYWN0b3J5KCdkYXNoYm9hcmRSZXBvc2l0b3J5JywgWygpID0+IHtcbiAgICByZXR1cm4gbmV3IExvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeSgpO1xuICB9XSk7XG5cbiAgLyoqXG4gICAqIFRoZSBkZWZhdWx0IGRhc2hib2FyZCBkZWZpbml0aW9uIGlmIG5vIHNhdmVkIGRhc2hib2FyZHMgYXJlIGF2YWlsYWJsZVxuICAgKlxuICAgKiBAcHJvcGVydHkgZGVmYXVsdERhc2hib2FyZHNcbiAgICogQGZvciBEYXNoYm9hcmRcbiAgICogQHR5cGUge2FueX1cbiAgICovXG4gIHZhciBkZWZhdWx0RGFzaGJvYXJkcyA9IFtcblxuICAgIHtcbiAgICAgIFwidGl0bGVcIjogXCJNb25pdG9yXCIsXG4gICAgICBcImdyb3VwXCI6IFwiUGVyc29uYWxcIixcbiAgICAgIFwid2lkZ2V0c1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcImlkXCI6IFwidzFcIixcbiAgICAgICAgICBcInRpdGxlXCI6IFwiT3BlcmF0aW5nIFN5c3RlbVwiLFxuICAgICAgICAgIFwicm93XCI6IDEsXG4gICAgICAgICAgXCJjb2xcIjogMSxcbiAgICAgICAgICBcInNpemVfeFwiOiAzLFxuICAgICAgICAgIFwic2l6ZV95XCI6IDQsXG4gICAgICAgICAgXCJwYXRoXCI6IFwiL2V4YW1wbGUvcGFnZTFcIixcbiAgICAgICAgICBcImluY2x1ZGVcIjogXCJ0ZXN0LXBsdWdpbnMvZXhhbXBsZS9odG1sL3BhZ2UxLmh0bWxcIixcbiAgICAgICAgICBcInNlYXJjaFwiOiB7XG4gICAgICAgICAgICBcIm5pZFwiOiBcInJvb3QtamF2YS5sYW5nLU9wZXJhdGluZ1N5c3RlbVwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImhhc2hcIjogXCJcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJpZFwiOiBcInczXCIsXG4gICAgICAgICAgXCJ0aXRsZVwiOiBcIkphdmEgSGVhcCBNZW1vcnlcIixcbiAgICAgICAgICBcInJvd1wiOiAxLFxuICAgICAgICAgIFwiY29sXCI6IDYsXG4gICAgICAgICAgXCJzaXplX3hcIjogMixcbiAgICAgICAgICBcInNpemVfeVwiOiAyLFxuICAgICAgICAgIFwicGF0aFwiOiBcImpteC93aWRnZXQvZG9udXRcIixcbiAgICAgICAgICBcImluY2x1ZGVcIjogXCJ0ZXN0LXBsdWdpbnMvZXhhbXBsZS9odG1sL3BhZ2UxLmh0bWxcIixcbiAgICAgICAgICBcInNlYXJjaFwiOiB7fSxcbiAgICAgICAgICBcImhhc2hcIjogXCJcIixcbiAgICAgICAgICBcInJvdXRlUGFyYW1zXCI6IFwie1xcXCJ0eXBlXFxcIjpcXFwiZG9udXRcXFwiLFxcXCJ0aXRsZVxcXCI6XFxcIkphdmEgSGVhcCBNZW1vcnlcXFwiLFxcXCJtYmVhblxcXCI6XFxcImphdmEubGFuZzp0eXBlPU1lbW9yeVxcXCIsXFxcImF0dHJpYnV0ZVxcXCI6XFxcIkhlYXBNZW1vcnlVc2FnZVxcXCIsXFxcInRvdGFsXFxcIjpcXFwiTWF4XFxcIixcXFwidGVybXNcXFwiOlxcXCJVc2VkXFxcIixcXFwicmVtYWluaW5nXFxcIjpcXFwiRnJlZVxcXCJ9XCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwiaWRcIjogXCJ3NFwiLFxuICAgICAgICAgIFwidGl0bGVcIjogXCJKYXZhIE5vbiBIZWFwIE1lbW9yeVwiLFxuICAgICAgICAgIFwicm93XCI6IDEsXG4gICAgICAgICAgXCJjb2xcIjogOCxcbiAgICAgICAgICBcInNpemVfeFwiOiAyLFxuICAgICAgICAgIFwic2l6ZV95XCI6IDIsXG4gICAgICAgICAgXCJwYXRoXCI6IFwiL2V4YW1wbGUvcGFnZTFcIixcbiAgICAgICAgICBcImluY2x1ZGVcIjogXCJ0ZXN0LXBsdWdpbnMvZXhhbXBsZS9odG1sL3BhZ2UxLmh0bWxcIixcbiAgICAgICAgICBcInNlYXJjaFwiOiB7fSxcbiAgICAgICAgICBcImhhc2hcIjogXCJcIixcbiAgICAgICAgICBcInJvdXRlUGFyYW1zXCI6IFwie1xcXCJ0eXBlXFxcIjpcXFwiZG9udXRcXFwiLFxcXCJ0aXRsZVxcXCI6XFxcIkphdmEgTm9uIEhlYXAgTWVtb3J5XFxcIixcXFwibWJlYW5cXFwiOlxcXCJqYXZhLmxhbmc6dHlwZT1NZW1vcnlcXFwiLFxcXCJhdHRyaWJ1dGVcXFwiOlxcXCJOb25IZWFwTWVtb3J5VXNhZ2VcXFwiLFxcXCJ0b3RhbFxcXCI6XFxcIk1heFxcXCIsXFxcInRlcm1zXFxcIjpcXFwiVXNlZFxcXCIsXFxcInJlbWFpbmluZ1xcXCI6XFxcIkZyZWVcXFwifVwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcImlkXCI6IFwidzVcIixcbiAgICAgICAgICBcInRpdGxlXCI6IFwiXCIsXG4gICAgICAgICAgXCJyb3dcIjogMyxcbiAgICAgICAgICBcImNvbFwiOiA0LFxuICAgICAgICAgIFwic2l6ZV94XCI6IDYsXG4gICAgICAgICAgXCJzaXplX3lcIjogMixcbiAgICAgICAgICBcInBhdGhcIjogXCIvZXhhbXBsZS9wYWdlMVwiLFxuICAgICAgICAgIFwiaW5jbHVkZVwiOiBcInRlc3QtcGx1Z2lucy9leGFtcGxlL2h0bWwvcGFnZTEuaHRtbFwiLFxuICAgICAgICAgIFwic2VhcmNoXCI6IHtcbiAgICAgICAgICAgIFwic2l6ZVwiOiBcIiU3QiUyMnNpemVfeCUyMiUzQTIlMkMlMjJzaXplX3klMjIlM0EyJTdEXCIsXG4gICAgICAgICAgICBcInRpdGxlXCI6IFwiSmF2YSUyME5vbiUyMEhlYXAlMjBNZW1vcnlcIixcbiAgICAgICAgICAgIFwicm91dGVQYXJhbXNcIjogXCIlN0IlMjJ0eXBlJTIyJTNBJTIyZG9udXQlMjIlMkMlMjJ0aXRsZSUyMiUzQSUyMkphdmElMjBOb24lMjBIZWFwJTIwTWVtb3J5JTIyJTJDJTIybWJlYW4lMjIlM0ElMjJqYXZhLmxhbmclM0F0eXBlXCIsXG4gICAgICAgICAgICBcIm5pZFwiOiBcInJvb3QtamF2YS5sYW5nLVRocmVhZGluZ1wiXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImhhc2hcIjogXCJcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJpZFwiOiBcInc2XCIsXG4gICAgICAgICAgXCJ0aXRsZVwiOiBcIlN5c3RlbSBDUFUgTG9hZFwiLFxuICAgICAgICAgIFwicm93XCI6IDEsXG4gICAgICAgICAgXCJjb2xcIjogNCxcbiAgICAgICAgICBcInNpemVfeFwiOiAyLFxuICAgICAgICAgIFwic2l6ZV95XCI6IDIsXG4gICAgICAgICAgXCJwYXRoXCI6IFwiL2V4YW1wbGUvcGFnZTFcIixcbiAgICAgICAgICBcImluY2x1ZGVcIjogXCJ0ZXN0LXBsdWdpbnMvZXhhbXBsZS9odG1sL3BhZ2UxLmh0bWxcIixcbiAgICAgICAgICBcInNlYXJjaFwiOiB7fSxcbiAgICAgICAgICBcImhhc2hcIjogXCJcIixcbiAgICAgICAgICBcInJvdXRlUGFyYW1zXCI6IFwie1xcXCJ0eXBlXFxcIjpcXFwiYXJlYVxcXCIsXFxcInRpdGxlXFxcIjpcXFwiU3lzdGVtIENQVSBMb2FkXFxcIixcXFwibWJlYW5cXFwiOlxcXCJqYXZhLmxhbmc6dHlwZT1PcGVyYXRpbmdTeXN0ZW1cXFwiLFxcXCJhdHRyaWJ1dGVcXFwiOlxcXCJTeXN0ZW1DcHVMb2FkXFxcIn1cIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJpZFwiOiBcIjRlOWQxMTYxNzNjYTQxNzY3ZVwiXG4gICAgfVxuXG4gIF07XG5cblxuICAvKipcbiAgICogQGNsYXNzIExvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeVxuICAgKiBAdXNlcyBEYXNoYm9hcmRSZXBvc2l0b3J5XG4gICAqL1xuICBleHBvcnQgY2xhc3MgTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5IGltcGxlbWVudHMgRGFzaGJvYXJkUmVwb3NpdG9yeSB7XG5cbiAgICBwcml2YXRlIGxvY2FsU3RvcmFnZTpXaW5kb3dMb2NhbFN0b3JhZ2UgPSBudWxsO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICB0aGlzLmxvY2FsU3RvcmFnZSA9IENvcmUuZ2V0TG9jYWxTdG9yYWdlKCk7XG5cbiAgICAgIGlmICgndXNlckRhc2hib2FyZHMnIGluIHRoaXMubG9jYWxTdG9yYWdlKSB7XG4gICAgICAgIC8vIGxvZy5pbmZvKFwiRm91bmQgcHJldmlvdXNseSBzYXZlZCBkYXNoYm9hcmRzXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zdG9yZURhc2hib2FyZHMoZGVmYXVsdERhc2hib2FyZHMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgbG9hZERhc2hib2FyZHMoKSB7XG4gICAgICB2YXIgYW5zd2VyID0gYW5ndWxhci5mcm9tSnNvbihsb2NhbFN0b3JhZ2VbJ3VzZXJEYXNoYm9hcmRzJ10pO1xuICAgICAgaWYgKGFuc3dlci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgYW5zd2VyLnB1c2godGhpcy5jcmVhdGVEYXNoYm9hcmQoe30pKTtcbiAgICAgIH1cbiAgICAgIGxvZy5kZWJ1ZyhcInJldHVybmluZyBkYXNoYm9hcmRzOiBcIiwgYW5zd2VyKTtcbiAgICAgIHJldHVybiBhbnN3ZXI7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdG9yZURhc2hib2FyZHMoZGFzaGJvYXJkczphbnlbXSkge1xuICAgICAgbG9nLmRlYnVnKFwic3RvcmluZyBkYXNoYm9hcmRzOiBcIiwgZGFzaGJvYXJkcyk7XG4gICAgICBsb2NhbFN0b3JhZ2VbJ3VzZXJEYXNoYm9hcmRzJ10gPSBhbmd1bGFyLnRvSnNvbihkYXNoYm9hcmRzKTtcbiAgICAgIHJldHVybiB0aGlzLmxvYWREYXNoYm9hcmRzKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHB1dERhc2hib2FyZHMoYXJyYXk6YW55W10sIGNvbW1pdE1lc3NhZ2U6c3RyaW5nLCBmbikge1xuXG4gICAgICB2YXIgZGFzaGJvYXJkcyA9IHRoaXMubG9hZERhc2hib2FyZHMoKTtcblxuICAgICAgYXJyYXkuZm9yRWFjaCgoZGFzaCkgPT4ge1xuICAgICAgICB2YXIgZXhpc3RpbmcgPSBkYXNoYm9hcmRzLmZpbmRJbmRleCgoZCkgPT4geyByZXR1cm4gZC5pZCA9PT0gZGFzaC5pZDsgfSk7XG4gICAgICAgIGlmIChleGlzdGluZyA+PSAwKSB7XG4gICAgICAgICAgZGFzaGJvYXJkc1tleGlzdGluZ10gPSBkYXNoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRhc2hib2FyZHMucHVzaChkYXNoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBmbih0aGlzLnN0b3JlRGFzaGJvYXJkcyhkYXNoYm9hcmRzKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlbGV0ZURhc2hib2FyZHMoYXJyYXk6YW55W10sIGZuKSB7XG4gICAgICB2YXIgZGFzaGJvYXJkcyA9IHRoaXMubG9hZERhc2hib2FyZHMoKTtcbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChhcnJheSwgKGl0ZW0pID0+IHtcbiAgICAgICAgZGFzaGJvYXJkcy5yZW1vdmUoKGkpID0+IHsgcmV0dXJuIGkuaWQgPT09IGl0ZW0uaWQ7IH0pO1xuICAgICAgfSk7XG4gICAgICBmbih0aGlzLnN0b3JlRGFzaGJvYXJkcyhkYXNoYm9hcmRzKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldERhc2hib2FyZHMoZm4pIHtcbiAgICAgIGZuKHRoaXMubG9hZERhc2hib2FyZHMoKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldERhc2hib2FyZChpZDpzdHJpbmcsIGZuKSB7XG4gICAgICB2YXIgZGFzaGJvYXJkcyA9IHRoaXMubG9hZERhc2hib2FyZHMoKTtcbiAgICAgIHZhciBkYXNoYm9hcmQgPSBkYXNoYm9hcmRzLmZpbmQoKGRhc2hib2FyZCkgPT4geyByZXR1cm4gZGFzaGJvYXJkLmlkID09PSBpZCB9KTtcbiAgICAgIGZuKGRhc2hib2FyZCk7XG4gICAgfVxuXG4gICAgcHVibGljIGNyZWF0ZURhc2hib2FyZChvcHRpb25zOmFueSkge1xuICAgICAgdmFyIGFuc3dlciA9e1xuICAgICAgICB0aXRsZTogXCJOZXcgRGFzaGJvYXJkXCIsXG4gICAgICAgIGdyb3VwOiBcIlBlcnNvbmFsXCIsXG4gICAgICAgIHdpZGdldHM6IFtdXG4gICAgICB9O1xuICAgICAgYW5zd2VyID0gYW5ndWxhci5leHRlbmQoYW5zd2VyLCBvcHRpb25zKTtcbiAgICAgIGFuc3dlclsnaWQnXSA9IENvcmUuZ2V0VVVJRCgpO1xuICAgICAgcmV0dXJuIGFuc3dlcjtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2xvbmVEYXNoYm9hcmQoZGFzaGJvYXJkOmFueSkge1xuICAgICAgdmFyIG5ld0Rhc2hib2FyZCA9IE9iamVjdC5jbG9uZShkYXNoYm9hcmQpO1xuICAgICAgbmV3RGFzaGJvYXJkWydpZCddID0gQ29yZS5nZXRVVUlEKCk7XG4gICAgICBuZXdEYXNoYm9hcmRbJ3RpdGxlJ10gPSBcIkNvcHkgb2YgXCIgKyBkYXNoYm9hcmQudGl0bGU7XG4gICAgICByZXR1cm4gbmV3RGFzaGJvYXJkO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRUeXBlKCkge1xuICAgICAgcmV0dXJuICdjb250YWluZXInO1xuICAgIH1cbiAgfVxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcblxuICBfbW9kdWxlLmNvbnRyb2xsZXIoXCJEYXNoYm9hcmQuRWRpdERhc2hib2FyZHNDb250cm9sbGVyXCIsIFtcIiRzY29wZVwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcIiRyb3V0ZVwiLCBcIiRsb2NhdGlvblwiLCBcIiRyb290U2NvcGVcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsIFwiSGF3dGlvTmF2XCIsIFwiJHRpbWVvdXRcIiwgXCIkdGVtcGxhdGVDYWNoZVwiLCBcIiRtb2RhbFwiLCAoJHNjb3BlLCAkcm91dGVQYXJhbXMsICRyb3V0ZSwgJGxvY2F0aW9uLCAkcm9vdFNjb3BlLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnksIG5hdiwgJHRpbWVvdXQsICR0ZW1wbGF0ZUNhY2hlLCAkbW9kYWwpID0+IHtcblxuICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IFtdO1xuXG4gICAgJHJvb3RTY29wZS4kb24oJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkTG9hZGVkKTtcblxuICAgICRzY29wZS5oYXNVcmwgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gKCRzY29wZS51cmwpID8gdHJ1ZSA6IGZhbHNlO1xuICAgIH07XG5cbiAgICAkc2NvcGUuaGFzU2VsZWN0aW9uID0gKCkgPT4ge1xuICAgICAgcmV0dXJuICRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLmxlbmd0aCAhPT0gMDtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmdyaWRPcHRpb25zID0ge1xuICAgICAgc2VsZWN0ZWRJdGVtczogW10sXG4gICAgICBzaG93RmlsdGVyOiBmYWxzZSxcbiAgICAgIHNob3dDb2x1bW5NZW51OiBmYWxzZSxcbiAgICAgIGZpbHRlck9wdGlvbnM6IHtcbiAgICAgICAgZmlsdGVyVGV4dDogJydcbiAgICAgIH0sXG4gICAgICBkYXRhOiAnX2Rhc2hib2FyZHMnLFxuICAgICAgc2VsZWN0V2l0aENoZWNrYm94T25seTogdHJ1ZSxcbiAgICAgIHNob3dTZWxlY3Rpb25DaGVja2JveDogdHJ1ZSxcbiAgICAgIGNvbHVtbkRlZnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGZpZWxkOiAndGl0bGUnLFxuICAgICAgICAgIGRpc3BsYXlOYW1lOiAnRGFzaGJvYXJkJyxcbiAgICAgICAgICBjZWxsVGVtcGxhdGU6ICR0ZW1wbGF0ZUNhY2hlLmdldCgnZWRpdERhc2hib2FyZFRpdGxlQ2VsbC5odG1sJylcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGZpZWxkOiAnZ3JvdXAnLFxuICAgICAgICAgIGRpc3BsYXlOYW1lOiAnR3JvdXAnXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgfTtcblxuICAgIC8vIGhlbHBlcnMgc28gd2UgY2FuIGVuYWJsZS9kaXNhYmxlIHBhcnRzIG9mIHRoZSBVSSBkZXBlbmRpbmcgb24gaG93XG4gICAgLy8gZGFzaGJvYXJkIGRhdGEgaXMgc3RvcmVkXG4gICAgLypcbiAgICAkc2NvcGUudXNpbmdHaXQgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlKCkgPT09ICdnaXQnO1xuICAgIH07XG5cbiAgICAkc2NvcGUudXNpbmdGYWJyaWMgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlKCkgPT09ICdmYWJyaWMnO1xuICAgIH07XG5cbiAgICAkc2NvcGUudXNpbmdMb2NhbCA9ICgpID0+IHtcbiAgICAgIHJldHVybiBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldFR5cGUoKSA9PT0gJ2NvbnRhaW5lcic7XG4gICAgfTtcblxuICAgIGlmICgkc2NvcGUudXNpbmdGYWJyaWMoKSkge1xuICAgICAgJHNjb3BlLmdyaWRPcHRpb25zLmNvbHVtbkRlZnMuYWRkKFt7XG4gICAgICAgIGZpZWxkOiAndmVyc2lvbklkJyxcbiAgICAgICAgZGlzcGxheU5hbWU6ICdWZXJzaW9uJ1xuICAgICAgfSwge1xuICAgICAgICBmaWVsZDogJ3Byb2ZpbGVJZCcsXG4gICAgICAgIGRpc3BsYXlOYW1lOiAnUHJvZmlsZSdcbiAgICAgIH0sIHtcbiAgICAgICAgZmllbGQ6ICdmaWxlTmFtZScsXG4gICAgICAgIGRpc3BsYXlOYW1lOiAnRmlsZSBOYW1lJ1xuICAgICAgfV0pO1xuICAgIH1cbiAgICAqL1xuXG4gICAgJHNjb3BlLiRvbihcIiRyb3V0ZUNoYW5nZVN1Y2Nlc3NcIiwgZnVuY3Rpb24gKGV2ZW50LCBjdXJyZW50LCBwcmV2aW91cykge1xuICAgICAgLy8gbGV0cyBkbyB0aGlzIGFzeW5jaHJvbm91c2x5IHRvIGF2b2lkIEVycm9yOiAkZGlnZXN0IGFscmVhZHkgaW4gcHJvZ3Jlc3NcbiAgICAgICR0aW1lb3V0KHVwZGF0ZURhdGEsIDEwKTtcbiAgICB9KTtcblxuICAgICRzY29wZS5hZGRWaWV3VG9EYXNoYm9hcmQgPSAoKSA9PiB7XG4gICAgICB2YXIgbmV4dEhyZWYgPSBudWxsO1xuICAgICAgYW5ndWxhci5mb3JFYWNoKCRzY29wZS5zZWxlY3RlZEl0ZW1zLCAoc2VsZWN0ZWRJdGVtKSA9PiB7XG4gICAgICAgIC8vIFRPRE8gdGhpcyBjb3VsZCBiZSBhIGhlbHBlciBmdW5jdGlvblxuICAgICAgICB2YXIgdGV4dCA9ICRzY29wZS51cmw7XG4gICAgICAgIHZhciBxdWVyeSA9IG51bGw7XG4gICAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgICAgdmFyIGlkeCA9IHRleHQuaW5kZXhPZignPycpO1xuICAgICAgICAgIGlmIChpZHggJiYgaWR4ID4gMCkge1xuICAgICAgICAgICAgcXVlcnkgPSB0ZXh0LnN1YnN0cmluZyhpZHggKyAxKTtcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0LnN1YnN0cmluZygwLCBpZHgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0ZXh0ID0gQ29yZS50cmltTGVhZGluZyh0ZXh0LCBcIiNcIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNlYXJjaCA9IHt9O1xuICAgICAgICBpZiAocXVlcnkpIHtcbiAgICAgICAgICB2YXIgZXhwcmVzc2lvbnMgPSBxdWVyeS5zcGxpdChcIiZcIik7XG4gICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGV4cHJlc3Npb25zLCAoZXhwcmVzc2lvbikgPT4ge1xuICAgICAgICAgICAgaWYgKGV4cHJlc3Npb24pIHtcbiAgICAgICAgICAgICAgdmFyIG5hbWVzID0gZXhwcmVzc2lvbi5zcGxpdChcIj1cIik7XG4gICAgICAgICAgICAgIHZhciBrZXkgPSBuYW1lc1swXTtcbiAgICAgICAgICAgICAgdmFyIHZhbHVlID0gbmFtZXMubGVuZ3RoID4gMSA/IG5hbWVzWzFdIDogbnVsbDtcbiAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHZhciBvbGQgPSBzZWFyY2hba2V5XTtcbiAgICAgICAgICAgICAgaWYgKG9sZCkge1xuICAgICAgICAgICAgICAgIGlmICghYW5ndWxhci5pc0FycmF5KG9sZCkpIHtcbiAgICAgICAgICAgICAgICAgIG9sZCA9IFtvbGRdO1xuICAgICAgICAgICAgICAgICAgc2VhcmNoW2tleV0gPSBvbGQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG9sZC5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWFyY2hba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9jb25zb2xlLmxvZyhcInBhdGggaXM6IFwiICsgdGV4dCArIFwiIHRoZSBzZWFyY2ggaXMgXCIgKyBKU09OLnN0cmluZ2lmeShzZWFyY2gpKTtcbiAgICAgICAgaWYgKCRyb3V0ZSAmJiAkcm91dGUucm91dGVzKSB7XG4gICAgICAgICAgdmFyIHZhbHVlID0gJHJvdXRlLnJvdXRlc1t0ZXh0XTtcbiAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgIHZhciB0ZW1wbGF0ZVVybCA9IHZhbHVlW1widGVtcGxhdGVVcmxcIl07XG4gICAgICAgICAgICBpZiAodGVtcGxhdGVVcmwpIHtcbiAgICAgICAgICAgICAgaWYgKCFzZWxlY3RlZEl0ZW0ud2lkZ2V0cykge1xuICAgICAgICAgICAgICAgIHNlbGVjdGVkSXRlbS53aWRnZXRzID0gW107XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdmFyIG5leHROdW1iZXIgPSBzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5sZW5ndGggKyAxO1xuICAgICAgICAgICAgICB2YXIgd2lkZ2V0ID0ge1xuICAgICAgICAgICAgICAgIGlkOiBcIndcIiArIG5leHROdW1iZXIsIHRpdGxlOiBcIlwiLFxuICAgICAgICAgICAgICAgIHJvdzogMSxcbiAgICAgICAgICAgICAgICBjb2w6IDEsXG4gICAgICAgICAgICAgICAgc2l6ZV94OiAxLFxuICAgICAgICAgICAgICAgIHNpemVfeTogMSxcbiAgICAgICAgICAgICAgICBwYXRoOiBDb3JlLnRyaW1MZWFkaW5nKHRleHQsIFwiL1wiKSxcbiAgICAgICAgICAgICAgICBpbmNsdWRlOiB0ZW1wbGF0ZVVybCxcbiAgICAgICAgICAgICAgICBzZWFyY2g6IHNlYXJjaCxcbiAgICAgICAgICAgICAgICBoYXNoOiBcIlwiXG4gICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgaWYgKCRzY29wZS53aWRnZXRUaXRsZSkge1xuICAgICAgICAgICAgICAgIHdpZGdldC50aXRsZSA9ICRzY29wZS53aWRnZXRUaXRsZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vIGZpZ3VyZSBvdXQgdGhlIHdpZHRoIG9mIHRoZSBkYXNoXG4gICAgICAgICAgICAgIHZhciBncmlkV2lkdGggPSAwO1xuXG4gICAgICAgICAgICAgIHNlbGVjdGVkSXRlbS53aWRnZXRzLmZvckVhY2goKHcpID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgcmlnaHRTaWRlID0gdy5jb2wgKyB3LnNpemVfeDtcbiAgICAgICAgICAgICAgICBpZiAocmlnaHRTaWRlID4gZ3JpZFdpZHRoKSB7XG4gICAgICAgICAgICAgICAgICBncmlkV2lkdGggPSByaWdodFNpZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICBpZiAoJHNjb3BlLnByZWZlcnJlZFNpemUpIHtcbiAgICAgICAgICAgICAgICB3aWRnZXQuc2l6ZV94ID0gcGFyc2VJbnQoJHNjb3BlLnByZWZlcnJlZFNpemVbJ3NpemVfeCddKTtcbiAgICAgICAgICAgICAgICB3aWRnZXQuc2l6ZV95ID0gcGFyc2VJbnQoJHNjb3BlLnByZWZlcnJlZFNpemVbJ3NpemVfeSddKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgIHZhciBsZWZ0ID0gKHcpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdy5jb2w7XG4gICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgdmFyIHJpZ2h0ID0gKHcpICA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHcuY29sICsgdy5zaXplX3ggLSAxO1xuICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgIHZhciB0b3AgPSAodykgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB3LnJvdztcbiAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICB2YXIgYm90dG9tID0gKHcpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdy5yb3cgKyB3LnNpemVfeSAtIDE7XG4gICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgdmFyIGNvbGxpc2lvbiA9ICh3MSwgdzIpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gISggbGVmdCh3MikgPiByaWdodCh3MSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQodzIpIDwgbGVmdCh3MSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wKHcyKSA+IGJvdHRvbSh3MSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYm90dG9tKHcyKSA8IHRvcCh3MSkpO1xuICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgIGlmIChzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5pc0VtcHR5KCkpIHtcbiAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB3aGlsZSAoIWZvdW5kKSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0LmNvbCA9IDE7XG4gICAgICAgICAgICAgICAgaWYgKHdpZGdldC5jb2wgKyB3aWRnZXQuc2l6ZV94ID4gZ3JpZFdpZHRoKSB7XG4gICAgICAgICAgICAgICAgICAvLyBsZXQncyBub3QgbG9vayBmb3IgYSBwbGFjZSBuZXh0IHRvIGV4aXN0aW5nIHdpZGdldFxuICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRJdGVtLndpZGdldHMuZm9yRWFjaChmdW5jdGlvbih3LCBpZHgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdpZGdldC5yb3cgPD0gdy5yb3cpIHtcbiAgICAgICAgICAgICAgICAgICAgICB3aWRnZXQucm93Kys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKDsgKHdpZGdldC5jb2wgKyB3aWRnZXQuc2l6ZV94KSA8PSBncmlkV2lkdGg7IHdpZGdldC5jb2wrKykge1xuICAgICAgICAgICAgICAgICAgaWYgKCFzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5hbnkoKHcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSBjb2xsaXNpb24odywgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNcbiAgICAgICAgICAgICAgICAgIH0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgICAgICAgIHdpZGdldC5yb3cgPSB3aWRnZXQucm93ICsgMVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBqdXN0IGluIGNhc2UsIGtlZXAgdGhlIHNjcmlwdCBmcm9tIHJ1bm5pbmcgYXdheS4uLlxuICAgICAgICAgICAgICAgIGlmICh3aWRnZXQucm93ID4gNTApIHtcbiAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoJHNjb3BlLnJvdXRlUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0Wydyb3V0ZVBhcmFtcyddID0gJHNjb3BlLnJvdXRlUGFyYW1zO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHNlbGVjdGVkSXRlbS53aWRnZXRzLnB1c2god2lkZ2V0KTtcblxuICAgICAgICAgICAgICBpZiAoIW5leHRIcmVmICYmIHNlbGVjdGVkSXRlbS5pZCkge1xuICAgICAgICAgICAgICAgIG5leHRIcmVmID0gbmV3IFVSSSgpLnBhdGgoXCIvZGFzaGJvYXJkL2lkL1wiICsgc2VsZWN0ZWRJdGVtLmlkKS50b1N0cmluZygpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVE9ETyB3ZSBuZWVkIHRvIGJlIGFibGUgdG8gbWF0Y2ggVVJJIHRlbXBsYXRlcy4uLlxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIG5vdyBsZXRzIHVwZGF0ZSB0aGUgYWN0dWFsIGRhc2hib2FyZCBjb25maWdcbiAgICAgIHZhciBjb21taXRNZXNzYWdlID0gXCJBZGQgd2lkZ2V0XCI7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoJHNjb3BlLnNlbGVjdGVkSXRlbXMsIGNvbW1pdE1lc3NhZ2UsIGZ1bmN0aW9uKGRhc2hib2FyZHMpIHtcbiAgICAgICAgaWYgKG5leHRIcmVmKSB7XG4gICAgICAgICAgLy8gcmVtb3ZlIGFueSBkb2RneSBxdWVyeVxuICAgICAgICAgIGRlbGV0ZSAkbG9jYXRpb24uc2VhcmNoKClbXCJocmVmXCJdO1xuICAgICAgICAgICRsb2NhdGlvbi5wYXRoKG5leHRIcmVmKTtcbiAgICAgICAgICBDb3JlLiRhcHBseSgkc2NvcGUpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgIH07XG5cbiAgICAkc2NvcGUuY3JlYXRlID0gKCkgPT4ge1xuICAgICAgdmFyIGNvdW50ZXIgPSBkYXNoYm9hcmRzKCkubGVuZ3RoICsgMTtcbiAgICAgIHZhciB0aXRsZSA9IFwiVW50aXRsZWRcIiArIGNvdW50ZXI7XG4gICAgICB2YXIgbmV3RGFzaCA9IGRhc2hib2FyZFJlcG9zaXRvcnkuY3JlYXRlRGFzaGJvYXJkKHt0aXRsZTogdGl0bGV9KTtcblxuICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKFtuZXdEYXNoXSwgXCJDcmVhdGVkIG5ldyBkYXNoYm9hcmQ6IFwiICsgdGl0bGUsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIC8vIGxldCdzIGp1c3QgYmUgc2FmZSBhbmQgZW5zdXJlIHRoZXJlJ3Mgbm8gc2VsZWN0aW9uc1xuICAgICAgICBkZXNlbGVjdEFsbCgpO1xuICAgICAgICBzZXRTdWJUYWJzKG5hdi5idWlsZGVyKCksIGRhc2hib2FyZHMsICRyb290U2NvcGUpO1xuICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICB9KTtcblxuICAgIH07XG5cbiAgICAkc2NvcGUuZHVwbGljYXRlID0gKCkgPT4ge1xuICAgICAgdmFyIG5ld0Rhc2hib2FyZHMgPSBbXTtcbiAgICAgIHZhciBjb21taXRNZXNzYWdlID0gXCJEdXBsaWNhdGVkIGRhc2hib2FyZChzKSBcIjtcbiAgICAgIGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcywgKGl0ZW0sIGlkeCkgPT4ge1xuICAgICAgICAvLyBsZXRzIHVuc2VsZWN0IHRoaXMgaXRlbVxuICAgICAgICB2YXIgY29tbWl0TWVzc2FnZSA9IFwiRHVwbGljYXRlZCBkYXNoYm9hcmQgXCIgKyBpdGVtLnRpdGxlO1xuICAgICAgICB2YXIgbmV3RGFzaCA9IGRhc2hib2FyZFJlcG9zaXRvcnkuY2xvbmVEYXNoYm9hcmQoaXRlbSk7XG4gICAgICAgIG5ld0Rhc2hib2FyZHMucHVzaChuZXdEYXNoKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBsZXQncyBqdXN0IGJlIHNhZmUgYW5kIGVuc3VyZSB0aGVyZSdzIG5vIHNlbGVjdGlvbnNcbiAgICAgIGRlc2VsZWN0QWxsKCk7XG5cbiAgICAgIGNvbW1pdE1lc3NhZ2UgPSBjb21taXRNZXNzYWdlICsgbmV3RGFzaGJvYXJkcy5tYXAoKGQpID0+IHsgcmV0dXJuIGQudGl0bGUgfSkuam9pbignLCcpO1xuICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKG5ld0Rhc2hib2FyZHMsIGNvbW1pdE1lc3NhZ2UsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIHNldFN1YlRhYnMobmF2LmJ1aWxkZXIoKSwgZGFzaGJvYXJkcywgJHJvb3RTY29wZSk7XG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUucmVuYW1lRGFzaGJvYXJkID0gKCkgPT4ge1xuICAgICAgaWYgKCRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICB2YXIgc2VsZWN0ZWQgPSA8YW55Pl8uZmlyc3QoJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXMpO1xuICAgICAgICB2YXIgbW9kYWwgPSAkbW9kYWwub3Blbih7XG4gICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdyZW5hbWVEYXNoYm9hcmRNb2RhbC5odG1sJyksXG4gICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCAnJG1vZGFsSW5zdGFuY2UnLCAoJHNjb3BlLCAkbW9kYWxJbnN0YW5jZSkgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLmNvbmZpZyA9IHtcbiAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICd0aXRsZSc6IHtcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgZGVmYXVsdDogc2VsZWN0ZWQudGl0bGVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWQgPSBzZWxlY3RlZDtcbiAgICAgICAgICAgICRzY29wZS5vayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgbW9kYWwuY2xvc2UoKTtcbiAgICAgICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKFskc2NvcGUuc2VsZWN0ZWRdLCAncmVuYW1lZCBkYXNoYm9hcmQnLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAgICAgICAgIC8vIGxldCdzIGp1c3QgYmUgc2FmZSBhbmQgZW5zdXJlIHRoZXJlJ3Mgbm8gc2VsZWN0aW9uc1xuICAgICAgICAgICAgICAgIGRlc2VsZWN0QWxsKCk7XG4gICAgICAgICAgICAgICAgc2V0U3ViVGFicyhuYXYuYnVpbGRlcigpLCBkYXNoYm9hcmRzLCAkcm9vdFNjb3BlKTtcbiAgICAgICAgICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgbW9kYWwuZGlzbWlzcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1dXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAkc2NvcGUuZGVsZXRlRGFzaGJvYXJkID0gKCkgPT4ge1xuICAgICAgaWYgKCRzY29wZS5oYXNTZWxlY3Rpb24oKSkge1xuICAgICAgICB2YXIgc2VsZWN0ZWQgPSAkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcztcbiAgICAgICAgdmFyIG1vZGFsID0gJG1vZGFsLm9wZW4oe1xuICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAnZGVsZXRlRGFzaGJvYXJkTW9kYWwuaHRtbCcpLFxuICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRtb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZCA9IHNlbGVjdGVkO1xuICAgICAgICAgICAgJHNjb3BlLm9rID0gKCkgPT4ge1xuICAgICAgICAgICAgICBtb2RhbC5jbG9zZSgpO1xuICAgICAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmRlbGV0ZURhc2hib2FyZHMoJHNjb3BlLnNlbGVjdGVkLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAgICAgICAgIC8vIGxldCdzIGp1c3QgYmUgc2FmZSBhbmQgZW5zdXJlIHRoZXJlJ3Mgbm8gc2VsZWN0aW9uc1xuICAgICAgICAgICAgICAgIGRlc2VsZWN0QWxsKCk7XG4gICAgICAgICAgICAgICAgc2V0U3ViVGFicyhuYXYuYnVpbGRlcigpLCBkYXNoYm9hcmRzLCAkcm9vdFNjb3BlKTtcbiAgICAgICAgICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgbW9kYWwuZGlzbWlzcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1dXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAkc2NvcGUuZ2lzdCA9ICgpID0+IHtcbiAgICAgIGlmICgkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBpZCA9ICRzY29wZS5zZWxlY3RlZEl0ZW1zWzBdLmlkO1xuICAgICAgICAkbG9jYXRpb24ucGF0aChcIi9kYXNoYm9hcmQvaWQvXCIgKyBpZCArIFwiL3NoYXJlXCIpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiB1cGRhdGVEYXRhKCkge1xuICAgICAgdmFyIHVybCA9ICRyb3V0ZVBhcmFtc1tcImhyZWZcIl07XG4gICAgICBpZiAodXJsKSB7XG4gICAgICAgICRzY29wZS51cmwgPSBkZWNvZGVVUklDb21wb25lbnQodXJsKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHJvdXRlUGFyYW1zID0gJHJvdXRlUGFyYW1zW1wicm91dGVQYXJhbXNcIl07XG4gICAgICBpZiAocm91dGVQYXJhbXMpIHtcbiAgICAgICAgJHNjb3BlLnJvdXRlUGFyYW1zID0gZGVjb2RlVVJJQ29tcG9uZW50KHJvdXRlUGFyYW1zKTtcbiAgICAgIH1cbiAgICAgIHZhciBzaXplOmFueSA9ICRyb3V0ZVBhcmFtc1tcInNpemVcIl07XG4gICAgICBpZiAoc2l6ZSkge1xuICAgICAgICBzaXplID0gZGVjb2RlVVJJQ29tcG9uZW50KHNpemUpO1xuICAgICAgICAkc2NvcGUucHJlZmVycmVkU2l6ZSA9IGFuZ3VsYXIuZnJvbUpzb24oc2l6ZSk7XG4gICAgICB9XG4gICAgICB2YXIgdGl0bGU6YW55ID0gJHJvdXRlUGFyYW1zW1widGl0bGVcIl07XG4gICAgICBpZiAodGl0bGUpIHtcbiAgICAgICAgdGl0bGUgPSBkZWNvZGVVUklDb21wb25lbnQodGl0bGUpO1xuICAgICAgICAkc2NvcGUud2lkZ2V0VGl0bGUgPSB0aXRsZTtcbiAgICAgIH1cblxuICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXREYXNoYm9hcmRzKChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRhc2hib2FyZExvYWRlZChldmVudCwgZGFzaGJvYXJkcykge1xuICAgICAgZGFzaGJvYXJkcy5mb3JFYWNoKChkYXNoYm9hcmQpID0+IHtcbiAgICAgICAgZGFzaGJvYXJkLmhhc2ggPSAnP21haW4tdGFiPWRhc2hib2FyZCZzdWItdGFiPWRhc2hib2FyZC0nICsgZGFzaGJvYXJkLmlkO1xuICAgICAgfSk7XG4gICAgICAkc2NvcGUuX2Rhc2hib2FyZHMgPSBkYXNoYm9hcmRzO1xuXG4gICAgICBpZiAoZXZlbnQgPT09IG51bGwpIHtcbiAgICAgICAgJHNjb3BlLiRlbWl0KCdkYXNoYm9hcmRzVXBkYXRlZCcsIGRhc2hib2FyZHMpO1xuICAgICAgfVxuICAgICAgQ29yZS4kYXBwbHkoJHJvb3RTY29wZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGFzaGJvYXJkcygpIHtcbiAgICAgIHJldHVybiAkc2NvcGUuX2Rhc2hib2FyZHM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVzZWxlY3RBbGwoKSB7XG4gICAgICAkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcy5sZW5ndGggPSAwO1xuICAgIH1cblxuICB9XSk7XG59XG4iLCIvKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnRzIHRoZSBuZy5JTG9jYXRpb25TZXJ2aWNlIGludGVyZmFjZSBhbmQgaXMgdXNlZCBieSB0aGUgZGFzaGJvYXJkIHRvIHN1cHBseVxuICAgKiBjb250cm9sbGVycyB3aXRoIGEgc2F2ZWQgVVJMIGxvY2F0aW9uXG4gICAqXG4gICAqIEBjbGFzcyBSZWN0YW5nbGVMb2NhdGlvblxuICAgKi9cbiAgZXhwb3J0IGNsYXNzIFJlY3RhbmdsZUxvY2F0aW9uIHsgLy8gVE9ETyBpbXBsZW1lbnRzIG5nLklMb2NhdGlvblNlcnZpY2Uge1xuICAgIHByaXZhdGUgX3BhdGg6IHN0cmluZztcbiAgICBwcml2YXRlIF9oYXNoOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBfc2VhcmNoOiBhbnk7XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgZGVsZWdhdGU6bmcuSUxvY2F0aW9uU2VydmljZSwgcGF0aDpzdHJpbmcsIHNlYXJjaCwgaGFzaDpzdHJpbmcpIHtcbiAgICAgIHRoaXMuX3BhdGggPSBwYXRoO1xuICAgICAgdGhpcy5fc2VhcmNoID0gc2VhcmNoO1xuICAgICAgdGhpcy5faGFzaCA9IGhhc2g7XG4gICAgfVxuXG4gICAgYWJzVXJsKCkge1xuICAgICAgcmV0dXJuIHRoaXMucHJvdG9jb2woKSArIHRoaXMuaG9zdCgpICsgXCI6XCIgKyB0aGlzLnBvcnQoKSArIHRoaXMucGF0aCgpICsgdGhpcy5zZWFyY2goKTtcbiAgICB9XG5cbiAgICBoYXNoKG5ld0hhc2g6c3RyaW5nID0gbnVsbCk6YW55IHtcbiAgICAgIGlmIChuZXdIYXNoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLmhhc2gobmV3SGFzaCkuc2VhcmNoKCd0YWInLCBudWxsKTtcbiAgICAgICAgLy90aGlzLl9oYXNoID0gbmV3SGFzaDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9oYXNoO1xuICAgIH1cblxuICAgIGhvc3QoKTpzdHJpbmcge1xuICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUuaG9zdCgpO1xuICAgIH1cblxuICAgIHBhdGgobmV3UGF0aDpzdHJpbmcgPSBudWxsKTphbnkge1xuICAgICAgaWYgKG5ld1BhdGgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUucGF0aChuZXdQYXRoKS5zZWFyY2goJ3RhYicsIG51bGwpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX3BhdGg7XG4gICAgfVxuXG4gICAgcG9ydCgpOm51bWJlciB7XG4gICAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5wb3J0KCk7XG4gICAgfVxuXG4gICAgcHJvdG9jb2woKSB7XG4gICAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5wb3J0KCk7XG4gICAgfVxuXG4gICAgcmVwbGFjZSgpIHtcbiAgICAgIC8vIFRPRE9cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNlYXJjaChwYXJhbWV0ZXJzTWFwOmFueSA9IG51bGwpOmFueSB7XG4gICAgICBpZiAocGFyYW1ldGVyc01hcCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5zZWFyY2gocGFyYW1ldGVyc01hcCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fc2VhcmNoO1xuICAgIH1cblxuICAgIHVybChuZXdWYWx1ZTogc3RyaW5nID0gbnVsbCk6YW55IHtcbiAgICAgIGlmIChuZXdWYWx1ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS51cmwobmV3VmFsdWUpLnNlYXJjaCgndGFiJywgbnVsbCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5hYnNVcmwoKTtcbiAgICB9XG5cbiAgfVxufVxuIiwiLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFJlcG9zaXRvcnkudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwicmVjdGFuZ2xlTG9jYXRpb24udHNcIi8+XG5tb2R1bGUgRGFzaGJvYXJkIHtcblxuICB2YXIgbW9kdWxlczpBcnJheTxzdHJpbmc+ID0gdW5kZWZpbmVkO1xuXG4gIF9tb2R1bGUuZGlyZWN0aXZlKCdoYXd0aW9EYXNoYm9hcmQnLCBmdW5jdGlvbigpIHtcbiAgICBtb2R1bGVzID0gaGF3dGlvUGx1Z2luTG9hZGVyWydtb2R1bGVzJ10uZmlsdGVyKChuYW1lKSA9PiB7XG4gICAgICByZXR1cm4gXy5pc1N0cmluZyhuYW1lKSAmJiBuYW1lICE9PSAnbmcnO1xuICAgIH0pO1xuICAgIHJldHVybiBuZXcgRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlKCk7XG4gIH0pO1xuXG4gIGV4cG9ydCBjbGFzcyBHcmlkc3RlckRpcmVjdGl2ZSB7XG4gICAgcHVibGljIHJlc3RyaWN0ID0gJ0EnO1xuICAgIHB1YmxpYyByZXBsYWNlID0gdHJ1ZTtcblxuICAgIHB1YmxpYyBjb250cm9sbGVyID0gW1wiJHNjb3BlXCIsIFwiJGVsZW1lbnRcIiwgXCIkYXR0cnNcIiwgXCIkbG9jYXRpb25cIiwgXCIkcm91dGVQYXJhbXNcIiwgXCIkdGVtcGxhdGVDYWNoZVwiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgXCIkY29tcGlsZVwiLCBcIiR0ZW1wbGF0ZVJlcXVlc3RcIiwgKCRzY29wZSwgJGVsZW1lbnQsICRhdHRycywgJGxvY2F0aW9uLCAkcm91dGVQYXJhbXMsICR0ZW1wbGF0ZUNhY2hlLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnksICRjb21waWxlLCAkdGVtcGxhdGVSZXF1ZXN0KSA9PiB7XG5cbiAgICAgIHZhciBncmlkU2l6ZSA9IDE1MDtcbiAgICAgIHZhciBncmlkTWFyZ2luID0gNjtcbiAgICAgIHZhciBncmlkSGVpZ2h0O1xuXG4gICAgICAkc2NvcGUuZ3JpZFggPSBncmlkU2l6ZTtcbiAgICAgICRzY29wZS5ncmlkWSA9IGdyaWRTaXplO1xuXG4gICAgICAkc2NvcGUud2lkZ2V0TWFwID0ge307XG5cbiAgICAgIC8qXG4gICAgICAkc2NvcGUuJG9uKCckZGVzdHJveScsICgpID0+IHtcbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKCRzY29wZS53aWRnZXRNYXAsICh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICAgICAgaWYgKCdzY29wZScgaW4gdmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBzY29wZSA9IHZhbHVlWydzY29wZSddO1xuICAgICAgICAgICAgc2NvcGUuJGRlc3Ryb3koKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICAqL1xuXG4gICAgICB1cGRhdGVXaWRnZXRzKCk7XG5cbiAgICAgICRzY29wZS5yZW1vdmVXaWRnZXQgPSBmdW5jdGlvbih3aWRnZXQpIHtcbiAgICAgICAgdmFyIGdyaWRzdGVyID0gZ2V0R3JpZHN0ZXIoKTtcbiAgICAgICAgdmFyIHdpZGdldEVsZW0gPSBudWxsO1xuXG4gICAgICAgIC8vIGxldHMgZGVzdHJveSB0aGUgd2lkZ2V0cydzIHNjb3BlXG4gICAgICAgIHZhciB3aWRnZXREYXRhID0gJHNjb3BlLndpZGdldE1hcFt3aWRnZXQuaWRdO1xuICAgICAgICBpZiAod2lkZ2V0RGF0YSkge1xuICAgICAgICAgIGRlbGV0ZSAkc2NvcGUud2lkZ2V0TWFwW3dpZGdldC5pZF07XG4gICAgICAgICAgdmFyIHNjb3BlID0gd2lkZ2V0RGF0YS5zY29wZTtcbiAgICAgICAgICB3aWRnZXRFbGVtID0gd2lkZ2V0RGF0YS53aWRnZXQ7XG4gICAgICAgICAgaWYgKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS4kZGVzdHJveSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXdpZGdldEVsZW0pIHtcbiAgICAgICAgICAvLyBsZXRzIGdldCB0aGUgbGkgcGFyZW50IGVsZW1lbnQgb2YgdGhlIHRlbXBsYXRlXG4gICAgICAgICAgd2lkZ2V0RWxlbSA9ICQoXCJkaXZcIikuZmluZChcIltkYXRhLXdpZGdldElkPSdcIiArIHdpZGdldC5pZCArIFwiJ11cIikucGFyZW50KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdyaWRzdGVyICYmIHdpZGdldEVsZW0pIHtcbiAgICAgICAgICBncmlkc3Rlci5yZW1vdmVfd2lkZ2V0KHdpZGdldEVsZW0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIG5vIG5lZWQgdG8gcmVtb3ZlIGl0Li4uXG4gICAgICAgIC8vd2lkZ2V0RWxlbS5yZW1vdmUoKTtcblxuICAgICAgICAvLyBsZXRzIHRyYXNoIHRoZSBKU09OIG1ldGFkYXRhXG4gICAgICAgIGlmICgkc2NvcGUuZGFzaGJvYXJkKSB7XG4gICAgICAgICAgdmFyIHdpZGdldHMgPSAkc2NvcGUuZGFzaGJvYXJkLndpZGdldHM7XG4gICAgICAgICAgaWYgKHdpZGdldHMpIHtcbiAgICAgICAgICAgIHdpZGdldHMucmVtb3ZlKHdpZGdldCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIlJlbW92ZWQgd2lkZ2V0IFwiICsgd2lkZ2V0LnRpdGxlKTtcbiAgICAgIH07XG5cbiAgICAgIGZ1bmN0aW9uIGNoYW5nZVdpZGdldFNpemUod2lkZ2V0LCBzaXplZnVuYywgc2F2ZWZ1bmMpIHtcbiAgICAgICAgdmFyIGdyaWRzdGVyID0gZ2V0R3JpZHN0ZXIoKTtcbiAgICAgICAgdmFyIGVudHJ5ID0gJHNjb3BlLndpZGdldE1hcFt3aWRnZXQuaWRdO1xuICAgICAgICB2YXIgdyA9IGVudHJ5LndpZGdldDtcbiAgICAgICAgdmFyIHNjb3BlID0gZW50cnkuc2NvcGU7XG4gICAgICAgIHNpemVmdW5jKGVudHJ5KTtcbiAgICAgICAgZ3JpZHN0ZXIucmVzaXplX3dpZGdldCh3LCBlbnRyeS5zaXplX3gsIGVudHJ5LnNpemVfeSk7XG4gICAgICAgIGdyaWRzdGVyLnNldF9kb21fZ3JpZF9oZWlnaHQoKTtcblxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9ICR0ZW1wbGF0ZUNhY2hlLmdldChcIndpZGdldFRlbXBsYXRlXCIpO1xuICAgICAgICAgIHZhciBkaXYgPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgICAgICAgIGRpdi5odG1sKHRlbXBsYXRlKTtcbiAgICAgICAgICB3Lmh0bWwoJGNvbXBpbGUoZGl2LmNvbnRlbnRzKCkpKHNjb3BlKSk7XG5cbiAgICAgICAgICBtYWtlUmVzaXphYmxlKCk7XG4gICAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcblxuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzYXZlZnVuYyh3aWRnZXQpO1xuICAgICAgICAgIH0sIDUwKTtcbiAgICAgICAgfSwgMzApO1xuICAgICAgfVxuXG4gICAgICAkc2NvcGUub25XaWRnZXRSZW5hbWVkID0gZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgICAgIHVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkoXCJSZW5hbWVkIHdpZGdldCB0byBcIiArIHdpZGdldC50aXRsZSk7XG4gICAgICB9O1xuXG4gICAgICBmdW5jdGlvbiB1cGRhdGVXaWRnZXRzKCkge1xuICAgICAgICAkc2NvcGUuaWQgPSAkcm91dGVQYXJhbXNbXCJkYXNoYm9hcmRJZFwiXTtcbiAgICAgICAgJHNjb3BlLmlkeCA9ICRyb3V0ZVBhcmFtc1tcImRhc2hib2FyZEluZGV4XCJdO1xuICAgICAgICBpZiAoJHNjb3BlLmlkKSB7XG4gICAgICAgICAgJHNjb3BlLiRlbWl0KCdsb2FkRGFzaGJvYXJkcycpO1xuICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkKCRzY29wZS5pZCwgb25EYXNoYm9hcmRMb2FkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZHMoKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgICAgICRzY29wZS4kZW1pdCgnZGFzaGJvYXJkc1VwZGF0ZWQnLCBkYXNoYm9hcmRzKTtcblxuICAgICAgICAgICAgdmFyIGlkeCA9ICRzY29wZS5pZHggPyBwYXJzZUludCgkc2NvcGUuaWR4KSA6IDA7XG4gICAgICAgICAgICB2YXIgaWQgPSBudWxsO1xuICAgICAgICAgICAgaWYgKGRhc2hib2FyZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICB2YXIgZGFzaGJvYXJkID0gZGFzaGJvYXJkcy5sZW5ndGggPiBpZHggPyBkYXNoYm9hcmRzW2lkeF0gOiBkYXNoYm9hcmRbMF07XG4gICAgICAgICAgICAgIGlkID0gZGFzaGJvYXJkLmlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkKSB7XG4gICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9pZC9cIiArIGlkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9lZGl0XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBvbkRhc2hib2FyZExvYWQoZGFzaGJvYXJkKSB7XG4gICAgICAgICRzY29wZS5kYXNoYm9hcmQgPSBkYXNoYm9hcmQ7XG4gICAgICAgIHZhciB3aWRnZXRzID0gKChkYXNoYm9hcmQpID8gZGFzaGJvYXJkLndpZGdldHMgOiBudWxsKSB8fCBbXTtcblxuICAgICAgICB2YXIgbWluSGVpZ2h0ID0gMTA7XG4gICAgICAgIHZhciBtaW5XaWR0aCA9IDY7XG5cbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKHdpZGdldHMsICh3aWRnZXQpID0+IHtcbiAgICAgICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQod2lkZ2V0LnJvdykgJiYgbWluSGVpZ2h0IDwgd2lkZ2V0LnJvdykge1xuICAgICAgICAgICAgbWluSGVpZ2h0ID0gd2lkZ2V0LnJvdyArIDE7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZCh3aWRnZXQuc2l6ZV94XG4gICAgICAgICAgICAgICYmIGFuZ3VsYXIuaXNEZWZpbmVkKHdpZGdldC5jb2wpKSkge1xuICAgICAgICAgICAgdmFyIHJpZ2h0RWRnZSA9IHdpZGdldC5jb2wgKyB3aWRnZXQuc2l6ZV94O1xuICAgICAgICAgICAgaWYgKHJpZ2h0RWRnZSA+IG1pbldpZHRoKSB7XG4gICAgICAgICAgICAgIG1pbldpZHRoID0gcmlnaHRFZGdlICsgMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBncmlkc3RlciA9ICRlbGVtZW50LmdyaWRzdGVyKHtcbiAgICAgICAgICB3aWRnZXRfbWFyZ2luczogW2dyaWRNYXJnaW4sIGdyaWRNYXJnaW5dLFxuICAgICAgICAgIHdpZGdldF9iYXNlX2RpbWVuc2lvbnM6IFskc2NvcGUuZ3JpZFgsICRzY29wZS5ncmlkWV0sXG4gICAgICAgICAgZXh0cmFfcm93czogbWluSGVpZ2h0LFxuICAgICAgICAgIGV4dHJhX2NvbHM6IG1pbldpZHRoLFxuICAgICAgICAgIG1heF9zaXplX3g6IG1pbldpZHRoLFxuICAgICAgICAgIG1heF9zaXplX3k6IG1pbkhlaWdodCxcbiAgICAgICAgICBkcmFnZ2FibGU6IHtcbiAgICAgICAgICAgIHN0b3A6IChldmVudCwgdWkpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHNlcmlhbGl6ZURhc2hib2FyZCgpKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIkNoYW5naW5nIGRhc2hib2FyZCBsYXlvdXRcIik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pLmRhdGEoJ2dyaWRzdGVyJyk7XG5cbiAgICAgICAgdmFyIHRlbXBsYXRlID0gJHRlbXBsYXRlQ2FjaGUuZ2V0KFwid2lkZ2V0VGVtcGxhdGVcIik7XG4gICAgICAgIHZhciByZW1haW5pbmcgPSB3aWRnZXRzLmxlbmd0aDtcblxuICAgICAgICBmdW5jdGlvbiBtYXliZUZpbmlzaFVwKCkge1xuICAgICAgICAgIHJlbWFpbmluZyA9IHJlbWFpbmluZyAtIDE7XG4gICAgICAgICAgaWYgKHJlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgICAgbWFrZVJlc2l6YWJsZSgpO1xuICAgICAgICAgICAgZ2V0R3JpZHN0ZXIoKS5lbmFibGUoKTtcbiAgICAgICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKHdpZGdldHMsICh3aWRnZXQpID0+IHtcbiAgICAgICAgICB2YXIgcGF0aCA9IHdpZGdldC5wYXRoO1xuICAgICAgICAgIHZhciBzZWFyY2ggPSBudWxsO1xuICAgICAgICAgIGlmICh3aWRnZXQuc2VhcmNoKSB7XG4gICAgICAgICAgICBzZWFyY2ggPSBEYXNoYm9hcmQuZGVjb2RlVVJJQ29tcG9uZW50UHJvcGVydGllcyh3aWRnZXQuc2VhcmNoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHdpZGdldC5yb3V0ZVBhcmFtcykge1xuICAgICAgICAgICAgXy5leHRlbmQoc2VhcmNoLCBhbmd1bGFyLmZyb21Kc29uKHdpZGdldC5yb3V0ZVBhcmFtcykpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgaGFzaCA9IHdpZGdldC5oYXNoOyAvLyBUT0RPIGRlY29kZSBvYmplY3Q/XG4gICAgICAgICAgdmFyIGxvY2F0aW9uID0gbmV3IFJlY3RhbmdsZUxvY2F0aW9uKCRsb2NhdGlvbiwgcGF0aCwgc2VhcmNoLCBoYXNoKTtcblxuICAgICAgICAgIHZhciB0bXBNb2R1bGVOYW1lID0gJ2Rhc2hib2FyZC0nICsgd2lkZ2V0LmlkO1xuICAgICAgICAgIHZhciB0bXBNb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSh0bXBNb2R1bGVOYW1lLCBtb2R1bGVzKTtcbiAgICAgICAgICB0bXBNb2R1bGUuY29uZmlnKFsnJHByb3ZpZGUnLCAoJHByb3ZpZGUpID0+IHtcbiAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcignJGxvY2F0aW9uJywgWyckZGVsZWdhdGUnLCAoJGRlbGVnYXRlKSA9PiB7XG4gICAgICAgICAgICAgIC8vbG9nLmRlYnVnKFwiVXNpbmcgJGxvY2F0aW9uOiBcIiwgbG9jYXRpb24pO1xuICAgICAgICAgICAgICByZXR1cm4gbG9jYXRpb247XG4gICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IoJyRyb3V0ZScsIFsnJGRlbGVnYXRlJywgKCRkZWxlZ2F0ZSkgPT4ge1xuICAgICAgICAgICAgICAvLyByZWFsbHkgaGFuZHkgZm9yIGRlYnVnZ2luZywgbW9zdGx5IHRvIHRlbGwgaWYgYSB3aWRnZXQncyByb3V0ZVxuICAgICAgICAgICAgICAvLyBpc24ndCBhY3R1YWxseSBhdmFpbGFibGUgaW4gdGhlIGNoaWxkIGFwcFxuICAgICAgICAgICAgICAvL2xvZy5kZWJ1ZyhcIlVzaW5nICRyb3V0ZTogXCIsICRkZWxlZ2F0ZSk7XG4gICAgICAgICAgICAgIHJldHVybiAkZGVsZWdhdGU7XG4gICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IoJyRyb3V0ZVBhcmFtcycsIFsnJGRlbGVnYXRlJywgKCRkZWxlZ2F0ZSkgPT4ge1xuICAgICAgICAgICAgICAvL2xvZy5kZWJ1ZyhcIlVzaW5nICRyb3V0ZVBhcmFtczogXCIsIHNlYXJjaCk7XG4gICAgICAgICAgICAgIHJldHVybiBzZWFyY2g7XG4gICAgICAgICAgICB9XSk7XG4gICAgICAgICAgfV0pO1xuICAgICAgICAgIGlmICghd2lkZ2V0LnNpemVfeCB8fCB3aWRnZXQuc2l6ZV94IDwgMSkge1xuICAgICAgICAgICAgd2lkZ2V0LnNpemVfeCA9IDE7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghd2lkZ2V0LnNpemVfeSB8fCB3aWRnZXQuc2l6ZV95IDwgMSkge1xuICAgICAgICAgICAgd2lkZ2V0LnNpemVfeSA9IDE7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBkaXYgPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgICAgICAgIGRpdi5odG1sKHRlbXBsYXRlKTtcbiAgICAgICAgICB2YXIgYm9keSA9IGRpdi5maW5kKCcud2lkZ2V0LWJvZHknKTtcbiAgICAgICAgICB2YXIgd2lkZ2V0Qm9keSA9ICR0ZW1wbGF0ZVJlcXVlc3Qod2lkZ2V0LmluY2x1ZGUpO1xuICAgICAgICAgIHdpZGdldEJvZHkudGhlbigod2lkZ2V0Qm9keSkgPT4ge1xuICAgICAgICAgICAgdmFyIG91dGVyRGl2ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldCgnd2lkZ2V0QmxvY2tUZW1wbGF0ZS5odG1sJykpO1xuICAgICAgICAgICAgYm9keS5odG1sKHdpZGdldEJvZHkpO1xuICAgICAgICAgICAgb3V0ZXJEaXYuaHRtbChib2R5KTtcbiAgICAgICAgICAgIGFuZ3VsYXIuYm9vdHN0cmFwKGJvZHksIFt0bXBNb2R1bGVOYW1lXSk7XG4gICAgICAgICAgICB2YXIgdyA9IGdyaWRzdGVyLmFkZF93aWRnZXQob3V0ZXJEaXYsIHdpZGdldC5zaXplX3gsIHdpZGdldC5zaXplX3ksIHdpZGdldC5jb2wsIHdpZGdldC5yb3cpO1xuICAgICAgICAgICAgJHNjb3BlLndpZGdldE1hcFt3aWRnZXQuaWRdID0ge1xuICAgICAgICAgICAgICB3aWRnZXQ6IHdcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBtYXliZUZpbmlzaFVwKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBzZXJpYWxpemVEYXNoYm9hcmQoKSB7XG4gICAgICAgIHZhciBncmlkc3RlciA9IGdldEdyaWRzdGVyKCk7XG4gICAgICAgIGlmIChncmlkc3Rlcikge1xuICAgICAgICAgIHZhciBkYXRhID0gZ3JpZHN0ZXIuc2VyaWFsaXplKCk7XG4gICAgICAgICAgLy9jb25zb2xlLmxvZyhcImdvdCBkYXRhOiBcIiArIEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcblxuICAgICAgICAgIHZhciB3aWRnZXRzID0gJHNjb3BlLmRhc2hib2FyZC53aWRnZXRzIHx8IFtdO1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiV2lkZ2V0czogXCIsIHdpZGdldHMpO1xuXG4gICAgICAgICAgLy8gbGV0cyBhc3N1bWUgdGhlIGRhdGEgaXMgaW4gdGhlIG9yZGVyIG9mIHRoZSB3aWRnZXRzLi4uXG4gICAgICAgICAgYW5ndWxhci5mb3JFYWNoKHdpZGdldHMsICh3aWRnZXQsIGlkeCkgPT4ge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gZGF0YVtpZHhdO1xuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHdpZGdldCkge1xuICAgICAgICAgICAgICAvLyBsZXRzIGNvcHkgdGhlIHZhbHVlcyBhY3Jvc3NcbiAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKHZhbHVlLCAoYXR0ciwga2V5KSA9PiB3aWRnZXRba2V5XSA9IGF0dHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gbWFrZVJlc2l6YWJsZSgpIHtcblxuICAgICAgICAvKlxuXG4gICAgICAgIHZhciBibG9ja3M6YW55ID0gJCgnLmdyaWQtYmxvY2snKTtcbiAgICAgICAgYmxvY2tzLnJlc2l6YWJsZSgnZGVzdHJveScpO1xuXG4gICAgICAgIGJsb2Nrcy5yZXNpemFibGUoe1xuICAgICAgICAgIGdyaWQ6IFtncmlkU2l6ZSArIChncmlkTWFyZ2luICogMiksIGdyaWRTaXplICsgKGdyaWRNYXJnaW4gKiAyKV0sXG4gICAgICAgICAgYW5pbWF0ZTogZmFsc2UsXG4gICAgICAgICAgbWluV2lkdGg6IGdyaWRTaXplLFxuICAgICAgICAgIG1pbkhlaWdodDogZ3JpZFNpemUsXG4gICAgICAgICAgYXV0b0hpZGU6IGZhbHNlLFxuICAgICAgICAgIHN0YXJ0OiBmdW5jdGlvbihldmVudCwgdWkpIHtcbiAgICAgICAgICAgIGdyaWRIZWlnaHQgPSBnZXRHcmlkc3RlcigpLiRlbC5oZWlnaHQoKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlc2l6ZTogZnVuY3Rpb24oZXZlbnQsIHVpKSB7XG4gICAgICAgICAgICAvL3NldCBuZXcgZ3JpZCBoZWlnaHQgYWxvbmcgdGhlIGRyYWdnaW5nIHBlcmlvZFxuICAgICAgICAgICAgdmFyIGcgPSBnZXRHcmlkc3RlcigpO1xuICAgICAgICAgICAgdmFyIGRlbHRhID0gZ3JpZFNpemUgKyBncmlkTWFyZ2luICogMjtcbiAgICAgICAgICAgIGlmIChldmVudC5vZmZzZXRZID4gZy4kZWwuaGVpZ2h0KCkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHZhciBleHRyYSA9IE1hdGguZmxvb3IoKGV2ZW50Lm9mZnNldFkgLSBncmlkSGVpZ2h0KSAvIGRlbHRhICsgMSk7XG4gICAgICAgICAgICAgIHZhciBuZXdIZWlnaHQgPSBncmlkSGVpZ2h0ICsgZXh0cmEgKiBkZWx0YTtcbiAgICAgICAgICAgICAgZy4kZWwuY3NzKCdoZWlnaHQnLCBuZXdIZWlnaHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgc3RvcDogZnVuY3Rpb24oZXZlbnQsIHVpKSB7XG4gICAgICAgICAgICB2YXIgcmVzaXplZCA9ICQodGhpcyk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXNpemVCbG9jayhyZXNpemVkKTtcbiAgICAgICAgICAgIH0sIDMwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAkKCcudWktcmVzaXphYmxlLWhhbmRsZScpLmhvdmVyKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGdldEdyaWRzdGVyKCkuZGlzYWJsZSgpO1xuICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBnZXRHcmlkc3RlcigpLmVuYWJsZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAqL1xuICAgICAgfVxuXG5cbiAgICAgIGZ1bmN0aW9uIHJlc2l6ZUJsb2NrKGVsbU9iaikge1xuICAgICAgICB2YXIgYXJlYSA9IGVsbU9iai5maW5kKCcud2lkZ2V0LWFyZWEnKTtcbiAgICAgICAgdmFyIHcgPSBlbG1PYmoud2lkdGgoKSAtIGdyaWRTaXplO1xuICAgICAgICB2YXIgaCA9IGVsbU9iai5oZWlnaHQoKSAtIGdyaWRTaXplO1xuXG4gICAgICAgIGZvciAodmFyIGdyaWRfdyA9IDE7IHcgPiAwOyB3IC09IChncmlkU2l6ZSArIChncmlkTWFyZ2luICogMikpKSB7XG4gICAgICAgICAgZ3JpZF93Kys7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBncmlkX2ggPSAxOyBoID4gMDsgaCAtPSAoZ3JpZFNpemUgKyAoZ3JpZE1hcmdpbiAqIDIpKSkge1xuICAgICAgICAgIGdyaWRfaCsrO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHdpZGdldCA9IHtcbiAgICAgICAgICBpZDogYXJlYS5hdHRyKCdkYXRhLXdpZGdldElkJylcbiAgICAgICAgfTtcblxuICAgICAgICBjaGFuZ2VXaWRnZXRTaXplKHdpZGdldCwgZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgICAgICAgd2lkZ2V0LnNpemVfeCA9IGdyaWRfdztcbiAgICAgICAgICB3aWRnZXQuc2l6ZV95ID0gZ3JpZF9oO1xuICAgICAgICB9LCBmdW5jdGlvbih3aWRnZXQpIHtcbiAgICAgICAgICBpZiAoc2VyaWFsaXplRGFzaGJvYXJkKCkpIHtcbiAgICAgICAgICAgIHVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkoXCJDaGFuZ2VkIHNpemUgb2Ygd2lkZ2V0OiBcIiArIHdpZGdldC5pZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiB1cGRhdGVEYXNoYm9hcmRSZXBvc2l0b3J5KG1lc3NhZ2U6IHN0cmluZykge1xuICAgICAgICBpZiAoJHNjb3BlLmRhc2hib2FyZCkge1xuICAgICAgICAgIHZhciBjb21taXRNZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICBpZiAoJHNjb3BlLmRhc2hib2FyZCAmJiAkc2NvcGUuZGFzaGJvYXJkLnRpdGxlKSB7XG4gICAgICAgICAgICBjb21taXRNZXNzYWdlICs9IFwiIG9uIGRhc2hib2FyZCBcIiArICRzY29wZS5kYXNoYm9hcmQudGl0bGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbJHNjb3BlLmRhc2hib2FyZF0sIGNvbW1pdE1lc3NhZ2UsIERhc2hib2FyZC5vbk9wZXJhdGlvbkNvbXBsZXRlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBnZXRHcmlkc3RlcigpIHtcbiAgICAgICAgcmV0dXJuICRlbGVtZW50LmdyaWRzdGVyKCkuZGF0YSgnZ3JpZHN0ZXInKTtcbiAgICAgIH1cblxuICAgIH1dO1xuXG4gIH1cblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG4gIF9tb2R1bGUuY29udHJvbGxlcihcIkRhc2hib2FyZC5JbXBvcnRDb250cm9sbGVyXCIsIFtcIiRzY29wZVwiLCBcIiRsb2NhdGlvblwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgKCRzY29wZSwgJGxvY2F0aW9uLCAkcm91dGVQYXJhbXMsIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSkgPT4ge1xuICAgICRzY29wZS5wbGFjZWhvbGRlciA9IFwiUGFzdGUgdGhlIEpTT04gaGVyZSBmb3IgdGhlIGRhc2hib2FyZCBjb25maWd1cmF0aW9uIHRvIGltcG9ydC4uLlwiO1xuICAgICRzY29wZS5zb3VyY2UgPSAkc2NvcGUucGxhY2Vob2xkZXI7XG5cbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIG1vZGU6IHtcbiAgICAgICAgbmFtZTogXCJqYXZhc2NyaXB0XCJcbiAgICAgIH1cbiAgICB9O1xuICAgIC8vJHNjb3BlLmNvZGVNaXJyb3JPcHRpb25zID0gQ29kZUVkaXRvci5jcmVhdGVFZGl0b3JTZXR0aW5ncyhvcHRpb25zKTtcblxuXG4gICAgJHNjb3BlLmlzVmFsaWQgPSAoKSA9PiAkc2NvcGUuc291cmNlICYmICRzY29wZS5zb3VyY2UgIT09ICRzY29wZS5wbGFjZWhvbGRlcjtcblxuICAgICRzY29wZS5pbXBvcnRKU09OID0gKCkgPT4ge1xuICAgICAgdmFyIGpzb24gPSBbXTtcbiAgICAgIC8vIGxldHMgcGFyc2UgdGhlIEpTT04uLi5cbiAgICAgIHRyeSB7XG4gICAgICAgIGpzb24gPSBKU09OLnBhcnNlKCRzY29wZS5zb3VyY2UpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvL0hhd3Rpb0NvcmUubm90aWZpY2F0aW9uKFwiZXJyb3JcIiwgXCJDb3VsZCBub3QgcGFyc2UgdGhlIEpTT05cXG5cIiArIGUpO1xuICAgICAgICBqc29uID0gW107XG4gICAgICB9XG4gICAgICB2YXIgYXJyYXkgPSBbXTtcbiAgICAgIGlmIChhbmd1bGFyLmlzQXJyYXkoanNvbikpIHtcbiAgICAgICAgYXJyYXkgPSBqc29uO1xuICAgICAgfSBlbHNlIGlmIChhbmd1bGFyLmlzT2JqZWN0KGpzb24pKSB7XG4gICAgICAgIGFycmF5LnB1c2goanNvbik7XG4gICAgICB9XG5cbiAgICAgIGlmIChhcnJheS5sZW5ndGgpIHtcbiAgICAgICAgLy8gbGV0cyBlbnN1cmUgd2UgaGF2ZSBzb21lIHZhbGlkIGlkcyBhbmQgc3R1ZmYuLi5cbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKGFycmF5LCAoZGFzaCwgaW5kZXgpID0+IHtcbiAgICAgICAgICBhbmd1bGFyLmNvcHkoZGFzaCwgZGFzaGJvYXJkUmVwb3NpdG9yeS5jcmVhdGVEYXNoYm9hcmQoZGFzaCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKGFycmF5LCBcIkltcG9ydGVkIGRhc2hib2FyZCBKU09OXCIsIERhc2hib2FyZC5vbk9wZXJhdGlvbkNvbXBsZXRlKTtcbiAgICAgICAgJGxvY2F0aW9uLnBhdGgoXCIvZGFzaGJvYXJkL2VkaXRcIik7XG4gICAgICB9XG4gICAgfVxuICB9XSk7XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcbiAgX21vZHVsZS5jb250cm9sbGVyKFwiRGFzaGJvYXJkLk5hdkJhckNvbnRyb2xsZXJcIiwgW1wiJHNjb3BlXCIsIFwiJHJvdXRlUGFyYW1zXCIsIFwiJHJvb3RTY29wZVwiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgKCRzY29wZSwgJHJvdXRlUGFyYW1zLCAkcm9vdFNjb3BlLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnkpID0+IHtcblxuICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IFtdO1xuXG4gICAgJHNjb3BlLmFjdGl2ZURhc2hib2FyZCA9ICRyb3V0ZVBhcmFtc1snZGFzaGJvYXJkSWQnXTtcblxuICAgICRzY29wZS4kb24oJ2xvYWREYXNoYm9hcmRzJywgbG9hZERhc2hib2FyZHMpO1xuXG4gICAgJHNjb3BlLiRvbignZGFzaGJvYXJkc1VwZGF0ZWQnLCBkYXNoYm9hcmRMb2FkZWQpO1xuXG4gICAgJHNjb3BlLmRhc2hib2FyZHMgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gJHNjb3BlLl9kYXNoYm9hcmRzXG4gICAgfTtcblxuICAgICRzY29wZS5vblRhYlJlbmFtZWQgPSBmdW5jdGlvbihkYXNoKSB7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoW2Rhc2hdLCBcIlJlbmFtZWQgZGFzaGJvYXJkXCIsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBkYXNoYm9hcmRMb2FkZWQoZXZlbnQsIGRhc2hib2FyZHMpIHtcbiAgICAgIGxvZy5kZWJ1ZyhcIm5hdmJhciBkYXNoYm9hcmRMb2FkZWQ6IFwiLCBkYXNoYm9hcmRzKTtcbiAgICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IGRhc2hib2FyZHM7XG4gICAgICBpZiAoZXZlbnQgPT09IG51bGwpIHtcbiAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdkYXNoYm9hcmRzVXBkYXRlZCcsIGRhc2hib2FyZHMpO1xuICAgICAgICBDb3JlLiRhcHBseSgkc2NvcGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvYWREYXNoYm9hcmRzKGV2ZW50KSB7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZHMoKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgLy8gcHJldmVudCB0aGUgYnJvYWRjYXN0IGZyb20gaGFwcGVuaW5nLi4uXG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfV0pO1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG4gIGV4cG9ydCB2YXIgU2hhcmVDb250cm9sbGVyID0gX21vZHVsZS5jb250cm9sbGVyKFwiRGFzaGJvYXJkLlNoYXJlQ29udHJvbGxlclwiLCBbXCIkc2NvcGVcIiwgXCIkbG9jYXRpb25cIiwgXCIkcm91dGVQYXJhbXNcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsICgkc2NvcGUsICRsb2NhdGlvbiwgJHJvdXRlUGFyYW1zLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnkpID0+IHtcbiAgICB2YXIgaWQgPSAkcm91dGVQYXJhbXNbXCJkYXNoYm9hcmRJZFwiXTtcbiAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZChpZCwgb25EYXNoYm9hcmRMb2FkKTtcblxuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgbW9kZToge1xuICAgICAgICAgIG5hbWU6IFwiamF2YXNjcmlwdFwiXG4gICAgICB9XG4gICAgfTtcbiAgICAvLyRzY29wZS5jb2RlTWlycm9yT3B0aW9ucyA9IENvZGVFZGl0b3IuY3JlYXRlRWRpdG9yU2V0dGluZ3Mob3B0aW9ucyk7XG5cbiAgICBmdW5jdGlvbiBvbkRhc2hib2FyZExvYWQoZGFzaGJvYXJkKSB7XG4gICAgICAkc2NvcGUuZGFzaGJvYXJkID0gRGFzaGJvYXJkLmNsZWFuRGFzaGJvYXJkRGF0YShkYXNoYm9hcmQpO1xuXG4gICAgICAkc2NvcGUuanNvbiA9IHtcbiAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcImhhd3RpbyBkYXNoYm9hcmRzXCIsXG4gICAgICAgIFwicHVibGljXCI6IHRydWUsXG4gICAgICAgIFwiZmlsZXNcIjoge1xuICAgICAgICAgIFwiZGFzaGJvYXJkcy5qc29uXCI6IHtcbiAgICAgICAgICAgIFwiY29udGVudFwiOiBKU09OLnN0cmluZ2lmeSgkc2NvcGUuZGFzaGJvYXJkLCBudWxsLCBcIiAgXCIpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuc291cmNlID0gSlNPTi5zdHJpbmdpZnkoJHNjb3BlLmRhc2hib2FyZCwgbnVsbCwgXCIgIFwiKTtcbiAgICAgIENvcmUuJGFwcGx5Tm93T3JMYXRlcigkc2NvcGUpO1xuICAgIH1cbiAgfV0pO1xufVxuIiwiLy8vIENvcHlyaWdodCAyMDE0LTIwMTUgUmVkIEhhdCwgSW5jLiBhbmQvb3IgaXRzIGFmZmlsaWF0ZXNcbi8vLyBhbmQgb3RoZXIgY29udHJpYnV0b3JzIGFzIGluZGljYXRlZCBieSB0aGUgQGF1dGhvciB0YWdzLlxuLy8vXG4vLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLy9cbi8vLyAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8vXG4vLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9pbmNsdWRlcy50c1wiLz5cbm1vZHVsZSBFeGFtcGxlIHtcblxuICBleHBvcnQgdmFyIHBsdWdpbk5hbWUgPSBcImhhd3Rpby1hc3NlbWJseVwiO1xuXG4gIGV4cG9ydCB2YXIgbG9nOiBMb2dnaW5nLkxvZ2dlciA9IExvZ2dlci5nZXQocGx1Z2luTmFtZSk7XG5cbiAgZXhwb3J0IHZhciB0ZW1wbGF0ZVBhdGggPSBcInBsdWdpbnMvZXhhbXBsZS9odG1sXCI7XG59XG4iLCIvLy8gQ29weXJpZ2h0IDIwMTQtMjAxNSBSZWQgSGF0LCBJbmMuIGFuZC9vciBpdHMgYWZmaWxpYXRlc1xuLy8vIGFuZCBvdGhlciBjb250cmlidXRvcnMgYXMgaW5kaWNhdGVkIGJ5IHRoZSBAYXV0aG9yIHRhZ3MuXG4vLy9cbi8vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vL1xuLy8vICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLy9cbi8vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL2luY2x1ZGVzLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImV4YW1wbGVHbG9iYWxzLnRzXCIvPlxubW9kdWxlIEV4YW1wbGUge1xuXG4gIGV4cG9ydCB2YXIgX21vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKEV4YW1wbGUucGx1Z2luTmFtZSwgW10pO1xuXG4gIHZhciB0YWIgPSB1bmRlZmluZWQ7XG5cbiAgX21vZHVsZS5jb25maWcoW1wiJGxvY2F0aW9uUHJvdmlkZXJcIiwgXCIkcm91dGVQcm92aWRlclwiLCBcIkhhd3Rpb05hdkJ1aWxkZXJQcm92aWRlclwiLFxuICAgICgkbG9jYXRpb25Qcm92aWRlciwgJHJvdXRlUHJvdmlkZXI6IG5nLnJvdXRlLklSb3V0ZVByb3ZpZGVyLCBidWlsZGVyOiBIYXd0aW9NYWluTmF2LkJ1aWxkZXJGYWN0b3J5KSA9PiB7XG4gICAgdGFiID0gYnVpbGRlci5jcmVhdGUoKVxuICAgICAgLmlkKEV4YW1wbGUucGx1Z2luTmFtZSlcbiAgICAgIC50aXRsZSgoKSA9PiBcIkV4YW1wbGVcIilcbiAgICAgIC5ocmVmKCgpID0+IFwiL2V4YW1wbGVcIilcbiAgICAgIC5zdWJQYXRoKFwiUGFnZSAxXCIsIFwicGFnZTFcIiwgYnVpbGRlci5qb2luKEV4YW1wbGUudGVtcGxhdGVQYXRoLCBcInBhZ2UxLmh0bWxcIikpXG4gICAgICAuYnVpbGQoKTtcbiAgICBidWlsZGVyLmNvbmZpZ3VyZVJvdXRpbmcoJHJvdXRlUHJvdmlkZXIsIHRhYik7XG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICB9XSk7XG5cbiAgX21vZHVsZS5ydW4oW1wiSGF3dGlvTmF2XCIsIChIYXd0aW9OYXY6IEhhd3Rpb01haW5OYXYuUmVnaXN0cnkpID0+IHtcbiAgICBIYXd0aW9OYXYuYWRkKHRhYik7XG4gICAgbG9nLmRlYnVnKFwibG9hZGVkXCIpO1xuICB9XSk7XG5cblxuICBoYXd0aW9QbHVnaW5Mb2FkZXIuYWRkTW9kdWxlKEV4YW1wbGUucGx1Z2luTmFtZSk7XG59XG4iLCIvLy8gQ29weXJpZ2h0IDIwMTQtMjAxNSBSZWQgSGF0LCBJbmMuIGFuZC9vciBpdHMgYWZmaWxpYXRlc1xuLy8vIGFuZCBvdGhlciBjb250cmlidXRvcnMgYXMgaW5kaWNhdGVkIGJ5IHRoZSBAYXV0aG9yIHRhZ3MuXG4vLy9cbi8vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vL1xuLy8vICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLy9cbi8vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImV4YW1wbGVQbHVnaW4udHNcIi8+XG5tb2R1bGUgRXhhbXBsZSB7XG5cbiAgZXhwb3J0IHZhciBQYWdlMUNvbnRyb2xsZXIgPSBfbW9kdWxlLmNvbnRyb2xsZXIoXCJFeGFtcGxlLlBhZ2UxQ29udHJvbGxlclwiLCBbXCIkc2NvcGVcIiwgKCRzY29wZSkgPT4ge1xuICAgICRzY29wZS50YXJnZXQgPSBcIldvcmxkIVwiO1xuICB9XSk7XG5cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
angular.module("hawtio-dashboard-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("plugins/dashboard/html/addToDashboard.html","<div class=\"controller-section\" ng-controller=\"Dashboard.EditDashboardsController\">\n  <div class=\"row-fluid\">\n    <div class=\"span10 offset1 well\">\n      Select a dashboard (or multiple dashboards) in the table below and click \"Add View To Dashboard\" to add the view to a dashboard.  You can also create a new dashboard using the \"Create\" button, select it and then click the \"Add View To Dashboard\" to add the view to a new dashboard.\n    </div>\n  </div>\n  <div class=\"row-fluid\">\n\n    <div class=\"span12\">\n      <ul class=\"nav nav-tabs\">\n        <li>\n          <a href=\"\" ng-disabled=\"!hasSelection()\" ng-click=\"addViewToDashboard()\"\n                    title=\"Adds the current view to the selected dashboard(s)\" data-placement=\"bottom\">\n            <i class=\"icon-dashboard\"></i> Add View To Dashboard\n          </a>\n        </li>\n\n        <li>\n          <a href=\"\" ng-click=\"create()\"\n                  title=\"Create a new empty dashboard\" data-placement=\"bottom\">\n            <i class=\"icon-plus\"></i> Create\n          </a>\n        </li>\n\n      </ul>\n\n    </div>\n    <!--\n    <div class=\"span6\">\n      <div class=\"control-group\">\n        <input type=\"text\" class=\"span12 search-query\" ng-model=\"gridOptions.filterOptions.filterText\" placeholder=\"Filter...\">\n      </div>\n    </div>\n    -->\n  </div>\n\n  <div class=\"row-fluid\">\n    <div class=\"gridStyle\" ng-grid=\"gridOptions\"></div>\n  </div>\n</div>\n");
$templateCache.put("plugins/dashboard/html/dashboard.html","<script type=\"text/ng-template\" id=\"widgetTemplate\">\n  <div class=\"widget-area\" data-widgetId=\"{{widget.id}}\">\n    <div class=\"widget-title\">\n      <div class=\"row-fluid\">\n        <div class=\"pull-left\">\n          <editable-property ng-model=\"widget\" property=\"title\" on-save=\"onWidgetRenamed(widget)\"></editable-property>\n        </div>\n        <div class=\"pull-right\">\n          <i class=\"icon-remove\" title=\"Removes this view from the dashboard\" ng-click=\"removeWidget(widget)\"></i>\n        </div>\n      </div>\n    </div>\n    <div class=\"widget-body\">\n    </div>\n  </div>\n</script>\n<script type=\"text/ng-template\" id=\"widgetBlockTemplate.html\">\n  <li class=\"grid-block\" style=\"display: list-item; position: absolute\" ng-non-bindable data-$injector=\"\"></li>\n</script>\n\n<!--\n<div class=\"gridster\" ng-controller=\"Dashboard.DashboardController\">\n  <ul id=\"widgets\">\n  </ul>\n</div>\n-->\n\n<div class=\"row-fluid\">\n  <div class=\"span12 gridster\">\n    <ul id=\"widgets\" hawtio-dashboard></ul>\n  </div>\n</div>\n\n\n");
$templateCache.put("plugins/dashboard/html/deleteDashboardModal.html","<div class=\"modal-header\">\n  <h3 class=\"modal-title\">Delete Dashboards?</h3>\n</div>\n<div class=\"modal-body\">\n  <p>Are you sure you want to delete the selected dashboards:</p>\n  <ul>\n    <li ng-repeat=\"dashboard in selected track by $index\">{{dashboard.title}}</li>\n  </ul>\n  <p class=\"strong\">This operation cannot be undone</p>\n</div>\n<div class=\"modal-footer\">\n  <button class=\"btn btn-primary\" ng-click=\"ok()\">OK</button>\n  <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n</div>\n");
$templateCache.put("plugins/dashboard/html/editDashboards.html","<script type=\"text/ng-template\" id=\"editDashboardTitleCell.html\">\n  <div class=\"ngCellText\"><a href=\"/dashboard/id/{{row.entity.id}}{{row.entity.hash}}\">{{row.entity.title}}</a></div>\n</script>\n<div ng-controller=\"Dashboard.EditDashboardsController\">\n  <div class=\"row\">\n    <div class=\"col-md-12\">\n      <p></p>\n      <ul class=\"nav nav-tabs\">\n        <li>\n          <button class=\"btn btn-success\" ng-click=\"create()\"\n             title=\"Create a new empty dashboard\"\n             data-placement=\"bottom\">\n            <i class=\"fa fa-plus\"></i> Create</button>\n        </li>\n        <li>\n          <button class=\"btn\" ng-click=\"renameDashboard()\"\n            ng-disabled=\"gridOptions.selectedItems.length !== 1\"\n             title=\"Rename the selected dashboard\"\n             data-placement=\"bottom\">\n            <i class=\"fa fa-arrows-h\"></i> Rename</button>\n        </li>\n        <li>\n          <button class=\"btn\" ng-disabled=\"!hasSelection()\"\n             ng-click=\"duplicate()\"\n                  title=\"Create a copy of the selected dashboard(s)\" data-placement=\"bottom\">\n            <i class=\"fa fa-copy\"></i> Duplicate\n          </button>\n        </li>\n        <li>\n          <button class=\"btn btn-danger\" ng-disabled=\"!hasSelection()\"\n             ng-click=\"deleteDashboard()\">\n             <i class=\"fa fa-remove\"></i> Delete\n          </button>\n        </li>\n        <li class=\"pull-right\">\n          <button class=\"btn btn-primary\" href=\"#/dashboard/import\"\n             title=\"Imports a JSON dashboard configuration from github or some other URL\"\n             data-placement=\"bottom\">\n            <i class=\"fa fa-cloud-download\"></i> Import\n          </button>\n        </li>\n      </ul>\n    </div>\n  </div>\n\n  <div class=\"row\">\n    <div class=\"col-md-12\">\n      <p></p>\n      <table class=\"table table-striped\" hawtio-simple-table=\"gridOptions\"></table>\n    </div>\n  </div>\n\n</div>\n");
$templateCache.put("plugins/dashboard/html/import.html","<div class=\"form-horizontal\" ng-controller=\"Dashboard.ImportController\">\n  <div class=\"control-group\">\n    <button id=\"importButton\" ng-disabled=\"!isValid()\" ng-click=\"importJSON()\"\n            class=\"btn btn-info\"\n            title=\"Imports the JSON configuration of the dashboard\">\n      <i class=\"icon-cloud-download\"></i> import dashboard JSON\n    </button>\n    <div id=\"alert-area\" class=\"span9 pull-right\"></div>\n  </div>\n  <div class=\"control-group\">\n    <textarea id=\"source\" ui-codemirror=\"codeMirrorOptions\" ng-model=\"source\"></textarea>\n  </div>\n</div>");
$templateCache.put("plugins/dashboard/html/renameDashboardModal.html","<div class=\"modal-header\">\n  <h3 class=\"modal-title\">Rename Dashboard \"{{selected.title}}\"</h3>\n</div>\n<div class=\"modal-body\">\n  <div hawtio-form2=\"config\" entity=\"selected\"></div>\n</div>\n<div class=\"modal-footer\">\n  <button class=\"btn btn-primary\" ng-click=\"ok()\">OK</button>\n  <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n</div>\n");
$templateCache.put("plugins/example/html/page1.html","<div class=\"row\">\n  <div class=\"col-md-12\" ng-controller=\"Example.Page1Controller\">\n    <h1>Page 1</h1>\n    <p class=\'customClass\'>Hello {{target}}</p>\n  </div>\n</div>\n");}]); hawtioPluginLoader.addModule("hawtio-dashboard-templates");