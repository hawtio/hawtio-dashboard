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
            var selected = $scope.gridOptions.selectedItems;
            var currentUrl = new URI();
            var href = currentUrl.query(true)['href'];
            if (href) {
                href = href.unescapeURL();
            }
            Dashboard.log.debug("href: ", href);
            $scope.url = href;
            var widgetURI = new URI(href);
            angular.forEach(selected, function (selectedItem) {
                var text = widgetURI.path();
                var search = widgetURI.query(true);
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
                                path: text,
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
                                nextHref = new URI().path("/dashboard/id/" + selectedItem.id).query({
                                    'main-tab': 'dashboard',
                                    'sub-tab': 'dashboard-' + selectedItem.id
                                }).removeQuery('href');
                            }
                        }
                    }
                    else {
                    }
                }
            });
            var commitMessage = "Add widget";
            dashboardRepository.putDashboards(selected, commitMessage, function (dashboards) {
                Dashboard.log.debug("Put dashboards: ", dashboards);
                Dashboard.log.debug("Next href: ", nextHref.toString());
                if (nextHref) {
                    $location.path(nextHref.path()).search(nextHref.query(true));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluY2x1ZGVzLmpzIiwiL2hvbWUvZ2FzaGNydW1iL1dvcmsvU291cmNlL2hhd3Rpby1kYXNoYm9hcmQvZGFzaGJvYXJkL3RzL2Rhc2hib2FyZEludGVyZmFjZXMudHMiLCIvaG9tZS9nYXNoY3J1bWIvV29yay9Tb3VyY2UvaGF3dGlvLWRhc2hib2FyZC9kYXNoYm9hcmQvdHMvZGFzaGJvYXJkSGVscGVycy50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9kYXNoYm9hcmRQbHVnaW4udHMiLCIvaG9tZS9nYXNoY3J1bWIvV29yay9Tb3VyY2UvaGF3dGlvLWRhc2hib2FyZC9kYXNoYm9hcmQvdHMvZGFzaGJvYXJkUmVwb3NpdG9yeS50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9lZGl0RGFzaGJvYXJkcy50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9yZWN0YW5nbGVMb2NhdGlvbi50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9ncmlkc3RlckRpcmVjdGl2ZS50cyIsIi9ob21lL2dhc2hjcnVtYi9Xb3JrL1NvdXJjZS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9pbXBvcnQudHMiLCIvaG9tZS9nYXNoY3J1bWIvV29yay9Tb3VyY2UvaGF3dGlvLWRhc2hib2FyZC9kYXNoYm9hcmQvdHMvbmF2YmFyLnRzIiwiL2hvbWUvZ2FzaGNydW1iL1dvcmsvU291cmNlL2hhd3Rpby1kYXNoYm9hcmQvZGFzaGJvYXJkL3RzL3NoYXJlLnRzIl0sIm5hbWVzIjpbIkRhc2hib2FyZCIsIkRhc2hib2FyZC5jbGVhbkRhc2hib2FyZERhdGEiLCJEYXNoYm9hcmQuZGVjb2RlVVJJQ29tcG9uZW50UHJvcGVydGllcyIsIkRhc2hib2FyZC5vbk9wZXJhdGlvbkNvbXBsZXRlIiwiRGFzaGJvYXJkLnNldFN1YlRhYnMiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5IiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5jb25zdHJ1Y3RvciIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkubG9hZERhc2hib2FyZHMiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5LnN0b3JlRGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZGVsZXRlRGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkIiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5jcmVhdGVEYXNoYm9hcmQiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5LmNsb25lRGFzaGJvYXJkIiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlIiwiRGFzaGJvYXJkLnVwZGF0ZURhdGEiLCJEYXNoYm9hcmQuZGFzaGJvYXJkTG9hZGVkIiwiRGFzaGJvYXJkLmRhc2hib2FyZHMiLCJEYXNoYm9hcmQuZGVzZWxlY3RBbGwiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24iLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uY29uc3RydWN0b3IiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uYWJzVXJsIiwiRGFzaGJvYXJkLlJlY3RhbmdsZUxvY2F0aW9uLmhhc2giLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uaG9zdCIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbi5wYXRoIiwiRGFzaGJvYXJkLlJlY3RhbmdsZUxvY2F0aW9uLnBvcnQiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24ucHJvdG9jb2wiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24ucmVwbGFjZSIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbi5zZWFyY2giLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24udXJsIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLmNoYW5nZVdpZGdldFNpemUiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3IudXBkYXRlV2lkZ2V0cyIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5vbkRhc2hib2FyZExvYWQiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3Iub25EYXNoYm9hcmRMb2FkLm1heWJlRmluaXNoVXAiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3Iuc2VyaWFsaXplRGFzaGJvYXJkIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLm1ha2VSZXNpemFibGUiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3IucmVzaXplQmxvY2siLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3IudXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeSIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5nZXRHcmlkc3RlciIsIkRhc2hib2FyZC5sb2FkRGFzaGJvYXJkcyIsIkRhc2hib2FyZC5vbkRhc2hib2FyZExvYWQiXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUN3Q0M7O0FD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Q0EsTUFBTUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0NBQ3pEQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQSxRQUFRQSxDQUFDQSxNQUFNQSxDQUFDQSxhQUFhQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTs0QkFDM0RBLENBQUNBOzRCQUVEQSxJQUFJQSxLQUFLQSxHQUFHQSxLQUFLQSxDQUFDQTs0QkFFbEJBLElBQUlBLElBQUlBLEdBQUdBLFVBQUNBLENBQUNBO2dDQUNYQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQTs0QkFDZkEsQ0FBQ0EsQ0FBQ0E7NEJBRUZBLElBQUlBLEtBQUtBLEdBQUdBLFVBQUNBLENBQUNBO2dDQUNaQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQTs0QkFDOUJBLENBQUNBLENBQUNBOzRCQUVGQSxJQUFJQSxHQUFHQSxHQUFHQSxVQUFDQSxDQUFDQTtnQ0FDVkEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0E7NEJBQ2ZBLENBQUNBLENBQUNBOzRCQUVGQSxJQUFJQSxNQUFNQSxHQUFHQSxVQUFDQSxDQUFDQTtnQ0FDYkEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7NEJBQzlCQSxDQUFDQSxDQUFDQTs0QkFFRkEsSUFBSUEsU0FBU0EsR0FBR0EsVUFBQ0EsRUFBRUEsRUFBRUEsRUFBRUE7Z0NBQ3JCQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFFQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxJQUNwQkEsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsSUFDcEJBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLE1B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LENBQUNBOzRCQUNsQkEsTUFBTUEsR0FBR0EsU0FBU0EsQ0FBQ0EsNEJBQTRCQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTt3QkFDakVBLENBQUNBO3dCQUNEQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQSxDQUFDQTs0QkFDdkJBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLEVBQUVBLE9BQU9BLENBQUNBLFFBQVFBLENBQUNBLE1BQU1BLENBQUNBLFdBQVdBLENBQUNBLENBQUNBLENBQUNBO3dCQUN6REEsQ0FBQ0E7d0JBQ0RBLElBQUlBLElBQUlBLEdBQUdBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO3dCQUN2QkEsSUFBSUEsUUFBUUEsR0FBR0EsSUFBSUEsMkJBQWlCQSxDQUFDQSxTQUFTQSxFQUFFQSxJQUFJQSxFQUFFQSxNQUFNQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTt3QkFFcEVBLElBQUlBLGFBQWFBLEdBQUdBLFlBQVlBLEdBQUdBLE1BQU1BLENBQUNBLEVBQUVBLENBQUNBO3dCQUM3Q0EsSUFBSUEsU0FBU0EsR0FBR0EsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsYUFBYUEsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7d0JBQ3ZEQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxVQUFVQSxFQUFFQSxVQUFDQSxRQUFRQTs0QkFDckNBLFFBQVFBLENBQUNBLFNBQVNBLENBQUNBLFdBQVdBLEVBQUVBLENBQUNBLFdBQVdBLEVBQUVBLFVBQUNBLFNBQVNBO2dDQUV0REEsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0E7NEJBQ2xCQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTs0QkFDSkEsUUFBUUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsUUFBUUEsRUFBRUEsQ0FBQ0EsV0FBV0EsRUFBRUEsVUFBQ0EsU0FBU0E7Z0NBSW5EQSxNQUFNQSxDQUFDQSxTQUFTQSxDQUFDQTs0QkFDbkJBLENBQUNBLENBQUNBLENBQUNBLENB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QTtnQkFDRkEsSUFBSUEsRUFBRUEsWUFBWUE7YUFDckJBO1NBQ0ZBLENBQUNBO1FBR0ZBLFNBQVNBLGVBQWVBLENBQUNBLFNBQVNBO1lBQ2hDMkMsTUFBTUEsQ0FBQ0EsU0FBU0EsR0FBR0EsU0FBU0EsQ0FBQ0Esa0JBQWtCQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQTtZQUUzREEsTUFBTUEsQ0FBQ0EsSUFBSUEsR0FBR0E7Z0JBQ1pBLGFBQWFBLEVBQUVBLG1CQUFtQkE7Z0JBQ2xDQSxRQUFRQSxFQUFFQSxJQUFJQTtnQkFDZEEsT0FBT0EsRUFBRUE7b0JBQ1BBLGlCQUFpQkEsRUFBRUE7d0JBQ2pCQSxTQUFTQSxFQUFFQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxTQUFTQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxDQUFDQTtxQkFDeERBO2lCQUNGQTthQUNGQSxDQUFDQTtZQUVGQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxTQUFTQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUM3REEsSUFBSUEsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUNoQ0EsQ0FBQ0E7SUFDSDNDLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0FBQ05BLENBQUNBLEVBN0JNLFNBQVMsS0FBVCxTQUFTLFFBNkJmIiwiZmlsZSI6ImNvbXBpbGVkLmpzIiwic291cmNlc0NvbnRlbnQiOltudWxsLCJtb2R1bGUgRGFzaGJvYXJkIHtcblxuICBleHBvcnQgaW50ZXJmYWNlIFNlYXJjaE1hcCB7XG4gICAgW25hbWU6IHN0cmluZ106IHN0cmluZztcbiAgfVxuXG4gIGV4cG9ydCBpbnRlcmZhY2UgRGFzaGJvYXJkV2lkZ2V0IHtcbiAgICBpZDogc3RyaW5nO1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgcm93PzogbnVtYmVyO1xuICAgIGNvbD86IG51bWJlcjtcbiAgICBzaXplX3g/OiBudW1iZXI7XG4gICAgc2l6ZV95PzogbnVtYmVyO1xuICAgIHBhdGg6IHN0cmluZztcbiAgICBpbmNsdWRlOiBzdHJpbmc7XG4gICAgc2VhcmNoOiBTZWFyY2hNYXBcbiAgICByb3V0ZVBhcmFtcz86IHN0cmluZztcbiAgfVxuXG4gIGV4cG9ydCBpbnRlcmZhY2UgRGFzaGJvYXJkIHtcbiAgICBpZDogc3RyaW5nO1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgZ3JvdXA6IHN0cmluZztcbiAgICB3aWRnZXRzOiBBcnJheTxEYXNoYm9hcmRXaWRnZXQ+O1xuICB9XG5cbiAgLyoqXG4gICAqIEJhc2UgaW50ZXJmYWNlIHRoYXQgZGFzaGJvYXJkIHJlcG9zaXRvcmllcyBtdXN0IGltcGxlbWVudFxuICAgKlxuICAgKiBAY2xhc3MgRGFzaGJvYXJkUmVwb3NpdG9yeVxuICAgKi9cbiAgZXhwb3J0IGludGVyZmFjZSBEYXNoYm9hcmRSZXBvc2l0b3J5IHtcbiAgICBwdXREYXNoYm9hcmRzOiAoYXJyYXk6YW55W10sIGNvbW1pdE1lc3NhZ2U6c3RyaW5nLCBmbikgPT4gYW55O1xuICAgIGRlbGV0ZURhc2hib2FyZHM6IChhcnJheTpBcnJheTxEYXNoYm9hcmQ+LCBmbikgPT4gYW55O1xuICAgIGdldERhc2hib2FyZHM6IChmbjooZGFzaGJvYXJkczogQXJyYXk8RGFzaGJvYXJkPikgPT4gdm9pZCkgPT4gdm9pZDtcbiAgICBnZXREYXNoYm9hcmQ6IChpZDpzdHJpbmcsIGZuOiAoZGFzaGJvYXJkOiBEYXNoYm9hcmQpID0+IHZvaWQpID0+IGFueTtcbiAgICBjcmVhdGVEYXNoYm9hcmQ6IChvcHRpb25zOmFueSkgPT4gYW55O1xuICAgIGNsb25lRGFzaGJvYXJkOihkYXNoYm9hcmQ6YW55KSA9PiBhbnk7XG4gICAgZ2V0VHlwZTooKSA9PiBzdHJpbmc7XG4gIH1cblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL2luY2x1ZGVzLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZEludGVyZmFjZXMudHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuXG4gIGV4cG9ydCB2YXIgbG9nOkxvZ2dpbmcuTG9nZ2VyID0gTG9nZ2VyLmdldCgnRGFzaGJvYXJkJyk7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNsZWFuZWQgdXAgdmVyc2lvbiBvZiB0aGUgZGFzaGJvYXJkIGRhdGEgd2l0aG91dCBhbnkgVUkgc2VsZWN0aW9uIHN0YXRlXG4gICAqIEBtZXRob2QgY2xlYW5EYXNoYm9hcmREYXRhXG4gICAqIEBzdGF0aWNcbiAgICogQGZvciBEYXNoYm9hcmRcbiAgICogQHBhcmFtIHthbnl9IGl0ZW1cbiAgICogQHJldHVybiB7YW55fVxuICAgKi9cbiAgZXhwb3J0IGZ1bmN0aW9uIGNsZWFuRGFzaGJvYXJkRGF0YShpdGVtKSB7XG4gICAgdmFyIGNsZWFuSXRlbSA9IHt9O1xuICAgIGFuZ3VsYXIuZm9yRWFjaChpdGVtLCAodmFsdWUsIGtleSkgPT4ge1xuICAgICAgaWYgKCFhbmd1bGFyLmlzU3RyaW5nKGtleSkgfHwgKCFrZXkuc3RhcnRzV2l0aChcIiRcIikgJiYgIWtleS5zdGFydHNXaXRoKFwiX1wiKSkpIHtcbiAgICAgICAgY2xlYW5JdGVtW2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gY2xlYW5JdGVtO1xuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgZGVjb2RlVVJJQ29tcG9uZW50KCkgb24gZWFjaCB2YWx1ZSBpbiB0aGUgb2JqZWN0XG4gICAqIEBtZXRob2QgZGVjb2RlVVJJQ29tcG9uZW50UHJvcGVydGllc1xuICAgKiBAc3RhdGljXG4gICAqIEBmb3IgRGFzaGJvYXJkXG4gICAqIEBwYXJhbSB7YW55fSBoYXNoXG4gICAqIEByZXR1cm4ge2FueX1cbiAgICovXG4gIGV4cG9ydCBmdW5jdGlvbiBkZWNvZGVVUklDb21wb25lbnRQcm9wZXJ0aWVzKGhhc2gpIHtcbiAgICBpZiAoIWhhc2gpIHtcbiAgICAgIHJldHVybiBoYXNoO1xuICAgIH1cbiAgICB2YXIgZGVjb2RlSGFzaCA9IHt9O1xuICAgIGFuZ3VsYXIuZm9yRWFjaChoYXNoLCAodmFsdWUsIGtleSkgPT4ge1xuICAgICAgZGVjb2RlSGFzaFtrZXldID0gdmFsdWUgPyBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpIDogdmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlY29kZUhhc2g7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gb25PcGVyYXRpb25Db21wbGV0ZShyZXN1bHQpIHtcbiAgICBjb25zb2xlLmxvZyhcIkNvbXBsZXRlZCBhZGRpbmcgdGhlIGRhc2hib2FyZCB3aXRoIHJlc3BvbnNlIFwiICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0KSk7XG4gIH1cbn1cbiIsIi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqIEBtYWluIERhc2hib2FyZFxuICovXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkSGVscGVycy50c1wiLz5cbm1vZHVsZSBEYXNoYm9hcmQge1xuICBcbiAgZXhwb3J0IHZhciB0ZW1wbGF0ZVBhdGggPSAncGx1Z2lucy9kYXNoYm9hcmQvaHRtbC8nO1xuICBleHBvcnQgdmFyIHBsdWdpbk5hbWUgPSAnZGFzaGJvYXJkJztcbiAgXG4gIGV4cG9ydCB2YXIgX21vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKHBsdWdpbk5hbWUsIFtdKTtcblxuICBfbW9kdWxlLmNvbmZpZyhbXCIkcm91dGVQcm92aWRlclwiLCAoJHJvdXRlUHJvdmlkZXIpID0+IHtcbiAgICAkcm91dGVQcm92aWRlci5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvYWRkJywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2FkZFRvRGFzaGJvYXJkLmh0bWwnfSkuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2VkaXQnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnZWRpdERhc2hib2FyZHMuaHRtbCd9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvaWR4LzpkYXNoYm9hcmRJbmRleCcsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdkYXNoYm9hcmQuaHRtbCcsIHJlbG9hZE9uU2VhcmNoOiBmYWxzZSB9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvaWQvOmRhc2hib2FyZElkJywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2Rhc2hib2FyZC5odG1sJywgcmVsb2FkT25TZWFyY2g6IGZhbHNlIH0pLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9pZC86ZGFzaGJvYXJkSWQvc2hhcmUnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnc2hhcmUuaHRtbCd9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvaW1wb3J0Jywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2ltcG9ydC5odG1sJ30pO1xuICB9XSk7XG5cbiAgX21vZHVsZS52YWx1ZSgndWkuY29uZmlnJywge1xuICAgIC8vIFRoZSB1aS1qcSBkaXJlY3RpdmUgbmFtZXNwYWNlXG4gICAganE6IHtcbiAgICAgIGdyaWRzdGVyOiB7XG4gICAgICAgIHdpZGdldF9tYXJnaW5zOiBbMTAsIDEwXSxcbiAgICAgICAgd2lkZ2V0X2Jhc2VfZGltZW5zaW9uczogWzE0MCwgMTQwXVxuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgdmFyIHRhYiA9IHVuZGVmaW5lZDtcblxuICBleHBvcnQgZnVuY3Rpb24gc2V0U3ViVGFicyhidWlsZGVyLCBkYXNoYm9hcmRzOkFycmF5PERhc2hib2FyZD4sICRyb290U2NvcGUpIHtcbiAgICB0YWIudGFicyA9IFtdO1xuICAgIF8uZm9yRWFjaChkYXNoYm9hcmRzLCAoZGFzaGJvYXJkKSA9PiB7XG4gICAgICB2YXIgY2hpbGQgPSBidWlsZGVyXG4gICAgICAgIC5pZCgnZGFzaGJvYXJkLScgKyBkYXNoYm9hcmQuaWQpXG4gICAgICAgIC50aXRsZSgoKSA9PiBkYXNoYm9hcmQudGl0bGUgfHwgZGFzaGJvYXJkLmlkKVxuICAgICAgICAuaHJlZigoKSA9PiB7XG4gICAgICAgICAgdmFyIHVyaSA9IG5ldyBVUkkoVXJsSGVscGVycy5qb2luKCcvZGFzaGJvYXJkL2lkJywgZGFzaGJvYXJkLmlkKSlcbiAgICAgICAgICAgIHVyaS5zZWFyY2goe1xuICAgICAgICAgICAgICAnbWFpbi10YWInOiBwbHVnaW5OYW1lLFxuICAgICAgICAgICAgICAnc3ViLXRhYic6ICdkYXNoYm9hcmQtJyArIGRhc2hib2FyZC5pZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHVyaS50b1N0cmluZygpO1xuICAgICAgICB9KVxuICAgICAgLmJ1aWxkKCk7XG4gICAgICB0YWIudGFicy5wdXNoKGNoaWxkKTtcbiAgICB9KTtcbiAgICB2YXIgbWFuYWdlID0gYnVpbGRlclxuICAgICAgLmlkKCdkYXNoYm9hcmQtbWFuYWdlJylcbiAgICAgIC50aXRsZSgoKSA9PiAnPGkgY2xhc3M9XCJmYSBmYS1wZW5jaWxcIj48L2k+Jm5ic3A7TWFuYWdlJylcbiAgICAgIC5ocmVmKCgpID0+ICcvZGFzaGJvYXJkL2VkaXQ/bWFpbi10YWI9ZGFzaGJvYXJkJnN1Yi10YWI9ZGFzaGJvYXJkLW1hbmFnZScpXG4gICAgICAuYnVpbGQoKTtcbiAgICB0YWIudGFicy5wdXNoKG1hbmFnZSk7XG4gICAgQ29yZS4kYXBwbHkoJHJvb3RTY29wZSk7XG4gIH1cblxuICBfbW9kdWxlLnJ1bihbXCJIYXd0aW9OYXZcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsIFwiJHJvb3RTY29wZVwiLCAobmF2Okhhd3Rpb01haW5OYXYuUmVnaXN0cnksIGRhc2hib2FyZHM6RGFzaGJvYXJkUmVwb3NpdG9yeSwgJHJvb3RTY29wZSkgPT4ge1xuICAgIHZhciBidWlsZGVyID0gbmF2LmJ1aWxkZXIoKTtcbiAgICB0YWIgPSBidWlsZGVyLmlkKHBsdWdpbk5hbWUpXG4gICAgICAgICAgICAgICAgLmhyZWYoKCkgPT4gJy9kYXNoYm9hcmQvaWR4LzAnKVxuICAgICAgICAgICAgICAgIC50aXRsZSgoKSA9PiAnRGFzaGJvYXJkJylcbiAgICAgICAgICAgICAgICAuYnVpbGQoKTtcbiAgICBuYXYuYWRkKHRhYik7XG4gICAgZGFzaGJvYXJkcy5nZXREYXNoYm9hcmRzKChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICBzZXRTdWJUYWJzKGJ1aWxkZXIsIGRhc2hib2FyZHMsICRyb290U2NvcGUpO1xuICAgIH0pO1xuICB9XSk7XG5cbiAgaGF3dGlvUGx1Z2luTG9hZGVyLmFkZE1vZHVsZShwbHVnaW5OYW1lKTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkSW50ZXJmYWNlcy50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG5cbiAgX21vZHVsZS5mYWN0b3J5KCdkYXNoYm9hcmRSZXBvc2l0b3J5JywgWygpID0+IHtcbiAgICByZXR1cm4gbmV3IExvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeSgpO1xuICB9XSk7XG5cbiAgLyoqXG4gICAqIFRoZSBkZWZhdWx0IGRhc2hib2FyZCBkZWZpbml0aW9uIGlmIG5vIHNhdmVkIGRhc2hib2FyZHMgYXJlIGF2YWlsYWJsZVxuICAgKlxuICAgKiBAcHJvcGVydHkgZGVmYXVsdERhc2hib2FyZHNcbiAgICogQGZvciBEYXNoYm9hcmRcbiAgICogQHR5cGUge2FueX1cbiAgICovXG4gIHZhciBkZWZhdWx0RGFzaGJvYXJkcyA9IFtcblxuICAgIHtcbiAgICAgIFwidGl0bGVcIjogXCJNb25pdG9yXCIsXG4gICAgICBcImdyb3VwXCI6IFwiUGVyc29uYWxcIixcbiAgICAgIFwid2lkZ2V0c1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcImlkXCI6IFwidzFcIixcbiAgICAgICAgICBcInRpdGxlXCI6IFwiT3BlcmF0aW5nIFN5c3RlbVwiLFxuICAgICAgICAgIFwicm93XCI6IDEsXG4gICAgICAgICAgXCJjb2xcIjogMSxcbiAgICAgICAgICBcInNpemVfeFwiOiAzLFxuICAgICAgICAgIFwic2l6ZV95XCI6IDQsXG4gICAgICAgICAgXCJwYXRoXCI6IFwiL2V4YW1wbGUvcGFnZTFcIixcbiAgICAgICAgICBcImluY2x1ZGVcIjogXCJ0ZXN0LXBsdWdpbnMvZXhhbXBsZS9odG1sL3BhZ2UxLmh0bWxcIixcbiAgICAgICAgICBcInNlYXJjaFwiOiB7XG4gICAgICAgICAgICBcIm5pZFwiOiBcInJvb3QtamF2YS5sYW5nLU9wZXJhdGluZ1N5c3RlbVwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImhhc2hcIjogXCJcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJpZFwiOiBcInczXCIsXG4gICAgICAgICAgXCJ0aXRsZVwiOiBcIkphdmEgSGVhcCBNZW1vcnlcIixcbiAgICAgICAgICBcInJvd1wiOiAxLFxuICAgICAgICAgIFwiY29sXCI6IDYsXG4gICAgICAgICAgXCJzaXplX3hcIjogMixcbiAgICAgICAgICBcInNpemVfeVwiOiAyLFxuICAgICAgICAgIFwicGF0aFwiOiBcImpteC93aWRnZXQvZG9udXRcIixcbiAgICAgICAgICBcImluY2x1ZGVcIjogXCJ0ZXN0LXBsdWdpbnMvZXhhbXBsZS9odG1sL3BhZ2UxLmh0bWxcIixcbiAgICAgICAgICBcInNlYXJjaFwiOiB7fSxcbiAgICAgICAgICBcImhhc2hcIjogXCJcIixcbiAgICAgICAgICBcInJvdXRlUGFyYW1zXCI6IFwie1xcXCJ0eXBlXFxcIjpcXFwiZG9udXRcXFwiLFxcXCJ0aXRsZVxcXCI6XFxcIkphdmEgSGVhcCBNZW1vcnlcXFwiLFxcXCJtYmVhblxcXCI6XFxcImphdmEubGFuZzp0eXBlPU1lbW9yeVxcXCIsXFxcImF0dHJpYnV0ZVxcXCI6XFxcIkhlYXBNZW1vcnlVc2FnZVxcXCIsXFxcInRvdGFsXFxcIjpcXFwiTWF4XFxcIixcXFwidGVybXNcXFwiOlxcXCJVc2VkXFxcIixcXFwicmVtYWluaW5nXFxcIjpcXFwiRnJlZVxcXCJ9XCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwiaWRcIjogXCJ3NFwiLFxuICAgICAgICAgIFwidGl0bGVcIjogXCJKYXZhIE5vbiBIZWFwIE1lbW9yeVwiLFxuICAgICAgICAgIFwicm93XCI6IDEsXG4gICAgICAgICAgXCJjb2xcIjogOCxcbiAgICAgICAgICBcInNpemVfeFwiOiAyLFxuICAgICAgICAgIFwic2l6ZV95XCI6IDIsXG4gICAgICAgICAgXCJwYXRoXCI6IFwiL2V4YW1wbGUvcGFnZTFcIixcbiAgICAgICAgICBcImluY2x1ZGVcIjogXCJ0ZXN0LXBsdWdpbnMvZXhhbXBsZS9odG1sL3BhZ2UxLmh0bWxcIixcbiAgICAgICAgICBcInNlYXJjaFwiOiB7fSxcbiAgICAgICAgICBcImhhc2hcIjogXCJcIixcbiAgICAgICAgICBcInJvdXRlUGFyYW1zXCI6IFwie1xcXCJ0eXBlXFxcIjpcXFwiZG9udXRcXFwiLFxcXCJ0aXRsZVxcXCI6XFxcIkphdmEgTm9uIEhlYXAgTWVtb3J5XFxcIixcXFwibWJlYW5cXFwiOlxcXCJqYXZhLmxhbmc6dHlwZT1NZW1vcnlcXFwiLFxcXCJhdHRyaWJ1dGVcXFwiOlxcXCJOb25IZWFwTWVtb3J5VXNhZ2VcXFwiLFxcXCJ0b3RhbFxcXCI6XFxcIk1heFxcXCIsXFxcInRlcm1zXFxcIjpcXFwiVXNlZFxcXCIsXFxcInJlbWFpbmluZ1xcXCI6XFxcIkZyZWVcXFwifVwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcImlkXCI6IFwidzVcIixcbiAgICAgICAgICBcInRpdGxlXCI6IFwiXCIsXG4gICAgICAgICAgXCJyb3dcIjogMyxcbiAgICAgICAgICBcImNvbFwiOiA0LFxuICAgICAgICAgIFwic2l6ZV94XCI6IDYsXG4gICAgICAgICAgXCJzaXplX3lcIjogMixcbiAgICAgICAgICBcInBhdGhcIjogXCIvZXhhbXBsZS9wYWdlMVwiLFxuICAgICAgICAgIFwiaW5jbHVkZVwiOiBcInRlc3QtcGx1Z2lucy9leGFtcGxlL2h0bWwvcGFnZTEuaHRtbFwiLFxuICAgICAgICAgIFwic2VhcmNoXCI6IHtcbiAgICAgICAgICAgIFwic2l6ZVwiOiBcIiU3QiUyMnNpemVfeCUyMiUzQTIlMkMlMjJzaXplX3klMjIlM0EyJTdEXCIsXG4gICAgICAgICAgICBcInRpdGxlXCI6IFwiSmF2YSUyME5vbiUyMEhlYXAlMjBNZW1vcnlcIixcbiAgICAgICAgICAgIFwicm91dGVQYXJhbXNcIjogXCIlN0IlMjJ0eXBlJTIyJTNBJTIyZG9udXQlMjIlMkMlMjJ0aXRsZSUyMiUzQSUyMkphdmElMjBOb24lMjBIZWFwJTIwTWVtb3J5JTIyJTJDJTIybWJlYW4lMjIlM0ElMjJqYXZhLmxhbmclM0F0eXBlXCIsXG4gICAgICAgICAgICBcIm5pZFwiOiBcInJvb3QtamF2YS5sYW5nLVRocmVhZGluZ1wiXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImhhc2hcIjogXCJcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJpZFwiOiBcInc2XCIsXG4gICAgICAgICAgXCJ0aXRsZVwiOiBcIlN5c3RlbSBDUFUgTG9hZFwiLFxuICAgICAgICAgIFwicm93XCI6IDEsXG4gICAgICAgICAgXCJjb2xcIjogNCxcbiAgICAgICAgICBcInNpemVfeFwiOiAyLFxuICAgICAgICAgIFwic2l6ZV95XCI6IDIsXG4gICAgICAgICAgXCJwYXRoXCI6IFwiL2V4YW1wbGUvcGFnZTFcIixcbiAgICAgICAgICBcImluY2x1ZGVcIjogXCJ0ZXN0LXBsdWdpbnMvZXhhbXBsZS9odG1sL3BhZ2UxLmh0bWxcIixcbiAgICAgICAgICBcInNlYXJjaFwiOiB7fSxcbiAgICAgICAgICBcImhhc2hcIjogXCJcIixcbiAgICAgICAgICBcInJvdXRlUGFyYW1zXCI6IFwie1xcXCJ0eXBlXFxcIjpcXFwiYXJlYVxcXCIsXFxcInRpdGxlXFxcIjpcXFwiU3lzdGVtIENQVSBMb2FkXFxcIixcXFwibWJlYW5cXFwiOlxcXCJqYXZhLmxhbmc6dHlwZT1PcGVyYXRpbmdTeXN0ZW1cXFwiLFxcXCJhdHRyaWJ1dGVcXFwiOlxcXCJTeXN0ZW1DcHVMb2FkXFxcIn1cIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJpZFwiOiBcIjRlOWQxMTYxNzNjYTQxNzY3ZVwiXG4gICAgfVxuXG4gIF07XG5cblxuICAvKipcbiAgICogQGNsYXNzIExvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeVxuICAgKiBAdXNlcyBEYXNoYm9hcmRSZXBvc2l0b3J5XG4gICAqL1xuICBleHBvcnQgY2xhc3MgTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5IGltcGxlbWVudHMgRGFzaGJvYXJkUmVwb3NpdG9yeSB7XG5cbiAgICBwcml2YXRlIGxvY2FsU3RvcmFnZTpXaW5kb3dMb2NhbFN0b3JhZ2UgPSBudWxsO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICB0aGlzLmxvY2FsU3RvcmFnZSA9IENvcmUuZ2V0TG9jYWxTdG9yYWdlKCk7XG5cbiAgICAgIGlmICgndXNlckRhc2hib2FyZHMnIGluIHRoaXMubG9jYWxTdG9yYWdlKSB7XG4gICAgICAgIC8vIGxvZy5pbmZvKFwiRm91bmQgcHJldmlvdXNseSBzYXZlZCBkYXNoYm9hcmRzXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zdG9yZURhc2hib2FyZHMoZGVmYXVsdERhc2hib2FyZHMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgbG9hZERhc2hib2FyZHMoKSB7XG4gICAgICB2YXIgYW5zd2VyID0gYW5ndWxhci5mcm9tSnNvbihsb2NhbFN0b3JhZ2VbJ3VzZXJEYXNoYm9hcmRzJ10pO1xuICAgICAgaWYgKGFuc3dlci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgYW5zd2VyLnB1c2godGhpcy5jcmVhdGVEYXNoYm9hcmQoe30pKTtcbiAgICAgIH1cbiAgICAgIGxvZy5kZWJ1ZyhcInJldHVybmluZyBkYXNoYm9hcmRzOiBcIiwgYW5zd2VyKTtcbiAgICAgIHJldHVybiBhbnN3ZXI7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdG9yZURhc2hib2FyZHMoZGFzaGJvYXJkczphbnlbXSkge1xuICAgICAgbG9nLmRlYnVnKFwic3RvcmluZyBkYXNoYm9hcmRzOiBcIiwgZGFzaGJvYXJkcyk7XG4gICAgICBsb2NhbFN0b3JhZ2VbJ3VzZXJEYXNoYm9hcmRzJ10gPSBhbmd1bGFyLnRvSnNvbihkYXNoYm9hcmRzKTtcbiAgICAgIHJldHVybiB0aGlzLmxvYWREYXNoYm9hcmRzKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHB1dERhc2hib2FyZHMoYXJyYXk6YW55W10sIGNvbW1pdE1lc3NhZ2U6c3RyaW5nLCBmbikge1xuXG4gICAgICB2YXIgZGFzaGJvYXJkcyA9IHRoaXMubG9hZERhc2hib2FyZHMoKTtcblxuICAgICAgYXJyYXkuZm9yRWFjaCgoZGFzaCkgPT4ge1xuICAgICAgICB2YXIgZXhpc3RpbmcgPSBkYXNoYm9hcmRzLmZpbmRJbmRleCgoZCkgPT4geyByZXR1cm4gZC5pZCA9PT0gZGFzaC5pZDsgfSk7XG4gICAgICAgIGlmIChleGlzdGluZyA+PSAwKSB7XG4gICAgICAgICAgZGFzaGJvYXJkc1tleGlzdGluZ10gPSBkYXNoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRhc2hib2FyZHMucHVzaChkYXNoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBmbih0aGlzLnN0b3JlRGFzaGJvYXJkcyhkYXNoYm9hcmRzKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlbGV0ZURhc2hib2FyZHMoYXJyYXk6YW55W10sIGZuKSB7XG4gICAgICB2YXIgZGFzaGJvYXJkcyA9IHRoaXMubG9hZERhc2hib2FyZHMoKTtcbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChhcnJheSwgKGl0ZW0pID0+IHtcbiAgICAgICAgZGFzaGJvYXJkcy5yZW1vdmUoKGkpID0+IHsgcmV0dXJuIGkuaWQgPT09IGl0ZW0uaWQ7IH0pO1xuICAgICAgfSk7XG4gICAgICBmbih0aGlzLnN0b3JlRGFzaGJvYXJkcyhkYXNoYm9hcmRzKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldERhc2hib2FyZHMoZm4pIHtcbiAgICAgIGZuKHRoaXMubG9hZERhc2hib2FyZHMoKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldERhc2hib2FyZChpZDpzdHJpbmcsIGZuKSB7XG4gICAgICB2YXIgZGFzaGJvYXJkcyA9IHRoaXMubG9hZERhc2hib2FyZHMoKTtcbiAgICAgIHZhciBkYXNoYm9hcmQgPSBkYXNoYm9hcmRzLmZpbmQoKGRhc2hib2FyZCkgPT4geyByZXR1cm4gZGFzaGJvYXJkLmlkID09PSBpZCB9KTtcbiAgICAgIGZuKGRhc2hib2FyZCk7XG4gICAgfVxuXG4gICAgcHVibGljIGNyZWF0ZURhc2hib2FyZChvcHRpb25zOmFueSkge1xuICAgICAgdmFyIGFuc3dlciA9e1xuICAgICAgICB0aXRsZTogXCJOZXcgRGFzaGJvYXJkXCIsXG4gICAgICAgIGdyb3VwOiBcIlBlcnNvbmFsXCIsXG4gICAgICAgIHdpZGdldHM6IFtdXG4gICAgICB9O1xuICAgICAgYW5zd2VyID0gYW5ndWxhci5leHRlbmQoYW5zd2VyLCBvcHRpb25zKTtcbiAgICAgIGFuc3dlclsnaWQnXSA9IENvcmUuZ2V0VVVJRCgpO1xuICAgICAgcmV0dXJuIGFuc3dlcjtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2xvbmVEYXNoYm9hcmQoZGFzaGJvYXJkOmFueSkge1xuICAgICAgdmFyIG5ld0Rhc2hib2FyZCA9IE9iamVjdC5jbG9uZShkYXNoYm9hcmQpO1xuICAgICAgbmV3RGFzaGJvYXJkWydpZCddID0gQ29yZS5nZXRVVUlEKCk7XG4gICAgICBuZXdEYXNoYm9hcmRbJ3RpdGxlJ10gPSBcIkNvcHkgb2YgXCIgKyBkYXNoYm9hcmQudGl0bGU7XG4gICAgICByZXR1cm4gbmV3RGFzaGJvYXJkO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRUeXBlKCkge1xuICAgICAgcmV0dXJuICdjb250YWluZXInO1xuICAgIH1cbiAgfVxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcblxuICBfbW9kdWxlLmNvbnRyb2xsZXIoXCJEYXNoYm9hcmQuRWRpdERhc2hib2FyZHNDb250cm9sbGVyXCIsIFtcIiRzY29wZVwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcIiRyb3V0ZVwiLCBcIiRsb2NhdGlvblwiLCBcIiRyb290U2NvcGVcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsIFwiSGF3dGlvTmF2XCIsIFwiJHRpbWVvdXRcIiwgXCIkdGVtcGxhdGVDYWNoZVwiLCBcIiRtb2RhbFwiLCAoJHNjb3BlLCAkcm91dGVQYXJhbXMsICRyb3V0ZSwgJGxvY2F0aW9uLCAkcm9vdFNjb3BlLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnksIG5hdiwgJHRpbWVvdXQsICR0ZW1wbGF0ZUNhY2hlLCAkbW9kYWwpID0+IHtcblxuICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IFtdO1xuXG4gICAgJHJvb3RTY29wZS4kb24oJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkTG9hZGVkKTtcblxuICAgICRzY29wZS5oYXNVcmwgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gKCRzY29wZS51cmwpID8gdHJ1ZSA6IGZhbHNlO1xuICAgIH07XG5cbiAgICAkc2NvcGUuaGFzU2VsZWN0aW9uID0gKCkgPT4ge1xuICAgICAgcmV0dXJuICRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLmxlbmd0aCAhPT0gMDtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmdyaWRPcHRpb25zID0ge1xuICAgICAgc2VsZWN0ZWRJdGVtczogW10sXG4gICAgICBzaG93RmlsdGVyOiBmYWxzZSxcbiAgICAgIHNob3dDb2x1bW5NZW51OiBmYWxzZSxcbiAgICAgIGZpbHRlck9wdGlvbnM6IHtcbiAgICAgICAgZmlsdGVyVGV4dDogJydcbiAgICAgIH0sXG4gICAgICBkYXRhOiAnX2Rhc2hib2FyZHMnLFxuICAgICAgc2VsZWN0V2l0aENoZWNrYm94T25seTogdHJ1ZSxcbiAgICAgIHNob3dTZWxlY3Rpb25DaGVja2JveDogdHJ1ZSxcbiAgICAgIGNvbHVtbkRlZnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGZpZWxkOiAndGl0bGUnLFxuICAgICAgICAgIGRpc3BsYXlOYW1lOiAnRGFzaGJvYXJkJyxcbiAgICAgICAgICBjZWxsVGVtcGxhdGU6ICR0ZW1wbGF0ZUNhY2hlLmdldCgnZWRpdERhc2hib2FyZFRpdGxlQ2VsbC5odG1sJylcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGZpZWxkOiAnZ3JvdXAnLFxuICAgICAgICAgIGRpc3BsYXlOYW1lOiAnR3JvdXAnXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgfTtcblxuICAgIC8vIGhlbHBlcnMgc28gd2UgY2FuIGVuYWJsZS9kaXNhYmxlIHBhcnRzIG9mIHRoZSBVSSBkZXBlbmRpbmcgb24gaG93XG4gICAgLy8gZGFzaGJvYXJkIGRhdGEgaXMgc3RvcmVkXG4gICAgLypcbiAgICAkc2NvcGUudXNpbmdHaXQgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlKCkgPT09ICdnaXQnO1xuICAgIH07XG5cbiAgICAkc2NvcGUudXNpbmdGYWJyaWMgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlKCkgPT09ICdmYWJyaWMnO1xuICAgIH07XG5cbiAgICAkc2NvcGUudXNpbmdMb2NhbCA9ICgpID0+IHtcbiAgICAgIHJldHVybiBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldFR5cGUoKSA9PT0gJ2NvbnRhaW5lcic7XG4gICAgfTtcblxuICAgIGlmICgkc2NvcGUudXNpbmdGYWJyaWMoKSkge1xuICAgICAgJHNjb3BlLmdyaWRPcHRpb25zLmNvbHVtbkRlZnMuYWRkKFt7XG4gICAgICAgIGZpZWxkOiAndmVyc2lvbklkJyxcbiAgICAgICAgZGlzcGxheU5hbWU6ICdWZXJzaW9uJ1xuICAgICAgfSwge1xuICAgICAgICBmaWVsZDogJ3Byb2ZpbGVJZCcsXG4gICAgICAgIGRpc3BsYXlOYW1lOiAnUHJvZmlsZSdcbiAgICAgIH0sIHtcbiAgICAgICAgZmllbGQ6ICdmaWxlTmFtZScsXG4gICAgICAgIGRpc3BsYXlOYW1lOiAnRmlsZSBOYW1lJ1xuICAgICAgfV0pO1xuICAgIH1cbiAgICAqL1xuXG4gICAgJHNjb3BlLiRvbihcIiRyb3V0ZUNoYW5nZVN1Y2Nlc3NcIiwgZnVuY3Rpb24gKGV2ZW50LCBjdXJyZW50LCBwcmV2aW91cykge1xuICAgICAgLy8gbGV0cyBkbyB0aGlzIGFzeW5jaHJvbm91c2x5IHRvIGF2b2lkIEVycm9yOiAkZGlnZXN0IGFscmVhZHkgaW4gcHJvZ3Jlc3NcbiAgICAgICR0aW1lb3V0KHVwZGF0ZURhdGEsIDEwKTtcbiAgICB9KTtcblxuICAgICRzY29wZS5hZGRWaWV3VG9EYXNoYm9hcmQgPSAoKSA9PiB7XG4gICAgICB2YXIgbmV4dEhyZWYgPSBudWxsO1xuICAgICAgdmFyIHNlbGVjdGVkID0gJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXM7XG5cbiAgICAgIHZhciBjdXJyZW50VXJsID0gbmV3IFVSSSgpO1xuICAgICAgdmFyIGhyZWYgPSBjdXJyZW50VXJsLnF1ZXJ5KHRydWUpWydocmVmJ107XG4gICAgICBpZiAoaHJlZikge1xuICAgICAgICBocmVmID0gaHJlZi51bmVzY2FwZVVSTCgpO1xuICAgICAgfVxuICAgICAgbG9nLmRlYnVnKFwiaHJlZjogXCIsIGhyZWYpO1xuICAgICAgJHNjb3BlLnVybCA9IGhyZWY7XG5cbiAgICAgIHZhciB3aWRnZXRVUkkgPSBuZXcgVVJJKGhyZWYpO1xuXG4gICAgICBhbmd1bGFyLmZvckVhY2goc2VsZWN0ZWQsIChzZWxlY3RlZEl0ZW0pID0+IHtcblxuICAgICAgICB2YXIgdGV4dCA9IHdpZGdldFVSSS5wYXRoKCk7XG4gICAgICAgIHZhciBzZWFyY2ggPSB3aWRnZXRVUkkucXVlcnkodHJ1ZSk7XG5cbiAgICAgICAgaWYgKCRyb3V0ZSAmJiAkcm91dGUucm91dGVzKSB7XG4gICAgICAgICAgdmFyIHZhbHVlID0gJHJvdXRlLnJvdXRlc1t0ZXh0XTtcbiAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgIHZhciB0ZW1wbGF0ZVVybCA9IHZhbHVlW1widGVtcGxhdGVVcmxcIl07XG4gICAgICAgICAgICBpZiAodGVtcGxhdGVVcmwpIHtcbiAgICAgICAgICAgICAgaWYgKCFzZWxlY3RlZEl0ZW0ud2lkZ2V0cykge1xuICAgICAgICAgICAgICAgIHNlbGVjdGVkSXRlbS53aWRnZXRzID0gW107XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdmFyIG5leHROdW1iZXIgPSBzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5sZW5ndGggKyAxO1xuICAgICAgICAgICAgICB2YXIgd2lkZ2V0ID0ge1xuICAgICAgICAgICAgICAgIGlkOiBcIndcIiArIG5leHROdW1iZXIsIHRpdGxlOiBcIlwiLFxuICAgICAgICAgICAgICAgIHJvdzogMSxcbiAgICAgICAgICAgICAgICBjb2w6IDEsXG4gICAgICAgICAgICAgICAgc2l6ZV94OiAxLFxuICAgICAgICAgICAgICAgIHNpemVfeTogMSxcbiAgICAgICAgICAgICAgICBwYXRoOiB0ZXh0LFxuICAgICAgICAgICAgICAgIGluY2x1ZGU6IHRlbXBsYXRlVXJsLFxuICAgICAgICAgICAgICAgIHNlYXJjaDogc2VhcmNoLFxuICAgICAgICAgICAgICAgIGhhc2g6IFwiXCJcbiAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICBpZiAoJHNjb3BlLndpZGdldFRpdGxlKSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0LnRpdGxlID0gJHNjb3BlLndpZGdldFRpdGxlO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gZmlndXJlIG91dCB0aGUgd2lkdGggb2YgdGhlIGRhc2hcbiAgICAgICAgICAgICAgdmFyIGdyaWRXaWR0aCA9IDA7XG5cbiAgICAgICAgICAgICAgc2VsZWN0ZWRJdGVtLndpZGdldHMuZm9yRWFjaCgodykgPT4ge1xuICAgICAgICAgICAgICAgIHZhciByaWdodFNpZGUgPSB3LmNvbCArIHcuc2l6ZV94O1xuICAgICAgICAgICAgICAgIGlmIChyaWdodFNpZGUgPiBncmlkV2lkdGgpIHtcbiAgICAgICAgICAgICAgICAgIGdyaWRXaWR0aCA9IHJpZ2h0U2lkZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgIGlmICgkc2NvcGUucHJlZmVycmVkU2l6ZSkge1xuICAgICAgICAgICAgICAgIHdpZGdldC5zaXplX3ggPSBwYXJzZUludCgkc2NvcGUucHJlZmVycmVkU2l6ZVsnc2l6ZV94J10pO1xuICAgICAgICAgICAgICAgIHdpZGdldC5zaXplX3kgPSBwYXJzZUludCgkc2NvcGUucHJlZmVycmVkU2l6ZVsnc2l6ZV95J10pO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgdmFyIGZvdW5kID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgdmFyIGxlZnQgPSAodykgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB3LmNvbDtcbiAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICB2YXIgcmlnaHQgPSAodykgID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdy5jb2wgKyB3LnNpemVfeCAtIDE7XG4gICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgdmFyIHRvcCA9ICh3KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHcucm93O1xuICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgIHZhciBib3R0b20gPSAodykgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB3LnJvdyArIHcuc2l6ZV95IC0gMTtcbiAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICB2YXIgY29sbGlzaW9uID0gKHcxLCB3MikgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiAhKCBsZWZ0KHcyKSA+IHJpZ2h0KHcxKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICByaWdodCh3MikgPCBsZWZ0KHcxKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0b3AodzIpID4gYm90dG9tKHcxKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICBib3R0b20odzIpIDwgdG9wKHcxKSk7XG4gICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkSXRlbS53aWRnZXRzLmlzRW1wdHkoKSkge1xuICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHdoaWxlICghZm91bmQpIHtcbiAgICAgICAgICAgICAgICB3aWRnZXQuY29sID0gMTtcbiAgICAgICAgICAgICAgICBpZiAod2lkZ2V0LmNvbCArIHdpZGdldC5zaXplX3ggPiBncmlkV2lkdGgpIHtcbiAgICAgICAgICAgICAgICAgIC8vIGxldCdzIG5vdCBsb29rIGZvciBhIHBsYWNlIG5leHQgdG8gZXhpc3Rpbmcgd2lkZ2V0XG4gICAgICAgICAgICAgICAgICBzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5mb3JFYWNoKGZ1bmN0aW9uKHcsIGlkeCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAod2lkZ2V0LnJvdyA8PSB3LnJvdykge1xuICAgICAgICAgICAgICAgICAgICAgIHdpZGdldC5yb3crKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAoOyAod2lkZ2V0LmNvbCArIHdpZGdldC5zaXplX3gpIDw9IGdyaWRXaWR0aDsgd2lkZ2V0LmNvbCsrKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoIXNlbGVjdGVkSXRlbS53aWRnZXRzLmFueSgodykgPT4ge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IGNvbGxpc2lvbih3LCB3aWRnZXQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY1xuICAgICAgICAgICAgICAgICAgfSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgICAgICAgd2lkZ2V0LnJvdyA9IHdpZGdldC5yb3cgKyAxXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGp1c3QgaW4gY2FzZSwga2VlcCB0aGUgc2NyaXB0IGZyb20gcnVubmluZyBhd2F5Li4uXG4gICAgICAgICAgICAgICAgaWYgKHdpZGdldC5yb3cgPiA1MCkge1xuICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICgkc2NvcGUucm91dGVQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICB3aWRnZXRbJ3JvdXRlUGFyYW1zJ10gPSAkc2NvcGUucm91dGVQYXJhbXM7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc2VsZWN0ZWRJdGVtLndpZGdldHMucHVzaCh3aWRnZXQpO1xuICAgICAgICAgICAgICBpZiAoIW5leHRIcmVmICYmIHNlbGVjdGVkSXRlbS5pZCkge1xuICAgICAgICAgICAgICAgIG5leHRIcmVmID0gbmV3IFVSSSgpLnBhdGgoXCIvZGFzaGJvYXJkL2lkL1wiICsgc2VsZWN0ZWRJdGVtLmlkKS5xdWVyeSh7XG4gICAgICAgICAgICAgICAgICAnbWFpbi10YWInOiAnZGFzaGJvYXJkJyxcbiAgICAgICAgICAgICAgICAgICdzdWItdGFiJzogJ2Rhc2hib2FyZC0nICsgc2VsZWN0ZWRJdGVtLmlkXG4gICAgICAgICAgICAgICAgfSkucmVtb3ZlUXVlcnkoJ2hyZWYnKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRPRE8gd2UgbmVlZCB0byBiZSBhYmxlIHRvIG1hdGNoIFVSSSB0ZW1wbGF0ZXMuLi5cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBub3cgbGV0cyB1cGRhdGUgdGhlIGFjdHVhbCBkYXNoYm9hcmQgY29uZmlnXG4gICAgICB2YXIgY29tbWl0TWVzc2FnZSA9IFwiQWRkIHdpZGdldFwiO1xuICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKHNlbGVjdGVkLCBjb21taXRNZXNzYWdlLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICBsb2cuZGVidWcoXCJQdXQgZGFzaGJvYXJkczogXCIsIGRhc2hib2FyZHMpO1xuICAgICAgICBsb2cuZGVidWcoXCJOZXh0IGhyZWY6IFwiLCBuZXh0SHJlZi50b1N0cmluZygpKTtcbiAgICAgICAgaWYgKG5leHRIcmVmKSB7XG4gICAgICAgICAgJGxvY2F0aW9uLnBhdGgobmV4dEhyZWYucGF0aCgpKS5zZWFyY2gobmV4dEhyZWYucXVlcnkodHJ1ZSkpO1xuICAgICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgfTtcblxuICAgICRzY29wZS5jcmVhdGUgPSAoKSA9PiB7XG4gICAgICB2YXIgY291bnRlciA9IGRhc2hib2FyZHMoKS5sZW5ndGggKyAxO1xuICAgICAgdmFyIHRpdGxlID0gXCJVbnRpdGxlZFwiICsgY291bnRlcjtcbiAgICAgIHZhciBuZXdEYXNoID0gZGFzaGJvYXJkUmVwb3NpdG9yeS5jcmVhdGVEYXNoYm9hcmQoe3RpdGxlOiB0aXRsZX0pO1xuXG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoW25ld0Rhc2hdLCBcIkNyZWF0ZWQgbmV3IGRhc2hib2FyZDogXCIgKyB0aXRsZSwgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgLy8gbGV0J3MganVzdCBiZSBzYWZlIGFuZCBlbnN1cmUgdGhlcmUncyBubyBzZWxlY3Rpb25zXG4gICAgICAgIGRlc2VsZWN0QWxsKCk7XG4gICAgICAgIHNldFN1YlRhYnMobmF2LmJ1aWxkZXIoKSwgZGFzaGJvYXJkcywgJHJvb3RTY29wZSk7XG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgIH0pO1xuXG4gICAgfTtcblxuICAgICRzY29wZS5kdXBsaWNhdGUgPSAoKSA9PiB7XG4gICAgICB2YXIgbmV3RGFzaGJvYXJkcyA9IFtdO1xuICAgICAgdmFyIGNvbW1pdE1lc3NhZ2UgPSBcIkR1cGxpY2F0ZWQgZGFzaGJvYXJkKHMpIFwiO1xuICAgICAgYW5ndWxhci5mb3JFYWNoKCRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLCAoaXRlbSwgaWR4KSA9PiB7XG4gICAgICAgIC8vIGxldHMgdW5zZWxlY3QgdGhpcyBpdGVtXG4gICAgICAgIHZhciBjb21taXRNZXNzYWdlID0gXCJEdXBsaWNhdGVkIGRhc2hib2FyZCBcIiArIGl0ZW0udGl0bGU7XG4gICAgICAgIHZhciBuZXdEYXNoID0gZGFzaGJvYXJkUmVwb3NpdG9yeS5jbG9uZURhc2hib2FyZChpdGVtKTtcbiAgICAgICAgbmV3RGFzaGJvYXJkcy5wdXNoKG5ld0Rhc2gpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIGxldCdzIGp1c3QgYmUgc2FmZSBhbmQgZW5zdXJlIHRoZXJlJ3Mgbm8gc2VsZWN0aW9uc1xuICAgICAgZGVzZWxlY3RBbGwoKTtcblxuICAgICAgY29tbWl0TWVzc2FnZSA9IGNvbW1pdE1lc3NhZ2UgKyBuZXdEYXNoYm9hcmRzLm1hcCgoZCkgPT4geyByZXR1cm4gZC50aXRsZSB9KS5qb2luKCcsJyk7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMobmV3RGFzaGJvYXJkcywgY29tbWl0TWVzc2FnZSwgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgc2V0U3ViVGFicyhuYXYuYnVpbGRlcigpLCBkYXNoYm9hcmRzLCAkcm9vdFNjb3BlKTtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZW5hbWVEYXNoYm9hcmQgPSAoKSA9PiB7XG4gICAgICBpZiAoJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHZhciBzZWxlY3RlZCA9IDxhbnk+Xy5maXJzdCgkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcyk7XG4gICAgICAgIHZhciBtb2RhbCA9ICRtb2RhbC5vcGVuKHtcbiAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ3JlbmFtZURhc2hib2FyZE1vZGFsLmh0bWwnKSxcbiAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICckbW9kYWxJbnN0YW5jZScsICgkc2NvcGUsICRtb2RhbEluc3RhbmNlKSA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuY29uZmlnID0ge1xuICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgJ3RpdGxlJzoge1xuICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICBkZWZhdWx0OiBzZWxlY3RlZC50aXRsZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZCA9IHNlbGVjdGVkO1xuICAgICAgICAgICAgJHNjb3BlLm9rID0gKCkgPT4ge1xuICAgICAgICAgICAgICBtb2RhbC5jbG9zZSgpO1xuICAgICAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoWyRzY29wZS5zZWxlY3RlZF0sICdyZW5hbWVkIGRhc2hib2FyZCcsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gbGV0J3MganVzdCBiZSBzYWZlIGFuZCBlbnN1cmUgdGhlcmUncyBubyBzZWxlY3Rpb25zXG4gICAgICAgICAgICAgICAgZGVzZWxlY3RBbGwoKTtcbiAgICAgICAgICAgICAgICBzZXRTdWJUYWJzKG5hdi5idWlsZGVyKCksIGRhc2hib2FyZHMsICRyb290U2NvcGUpO1xuICAgICAgICAgICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgICBtb2RhbC5kaXNtaXNzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfV1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgICRzY29wZS5kZWxldGVEYXNoYm9hcmQgPSAoKSA9PiB7XG4gICAgICBpZiAoJHNjb3BlLmhhc1NlbGVjdGlvbigpKSB7XG4gICAgICAgIHZhciBzZWxlY3RlZCA9ICRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zO1xuICAgICAgICB2YXIgbW9kYWwgPSAkbW9kYWwub3Blbih7XG4gICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdkZWxldGVEYXNoYm9hcmRNb2RhbC5odG1sJyksXG4gICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCAnJG1vZGFsSW5zdGFuY2UnLCAoJHNjb3BlLCAkbW9kYWxJbnN0YW5jZSkgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkID0gc2VsZWN0ZWQ7XG4gICAgICAgICAgICAkc2NvcGUub2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZGVsZXRlRGFzaGJvYXJkcygkc2NvcGUuc2VsZWN0ZWQsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gbGV0J3MganVzdCBiZSBzYWZlIGFuZCBlbnN1cmUgdGhlcmUncyBubyBzZWxlY3Rpb25zXG4gICAgICAgICAgICAgICAgZGVzZWxlY3RBbGwoKTtcbiAgICAgICAgICAgICAgICBzZXRTdWJUYWJzKG5hdi5idWlsZGVyKCksIGRhc2hib2FyZHMsICRyb290U2NvcGUpO1xuICAgICAgICAgICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgICBtb2RhbC5kaXNtaXNzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfV1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgICRzY29wZS5naXN0ID0gKCkgPT4ge1xuICAgICAgaWYgKCRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGlkID0gJHNjb3BlLnNlbGVjdGVkSXRlbXNbMF0uaWQ7XG4gICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9pZC9cIiArIGlkICsgXCIvc2hhcmVcIik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZURhdGEoKSB7XG4gICAgICB2YXIgdXJsID0gJHJvdXRlUGFyYW1zW1wiaHJlZlwiXTtcbiAgICAgIGlmICh1cmwpIHtcbiAgICAgICAgJHNjb3BlLnVybCA9IGRlY29kZVVSSUNvbXBvbmVudCh1cmwpO1xuICAgICAgfVxuXG4gICAgICB2YXIgcm91dGVQYXJhbXMgPSAkcm91dGVQYXJhbXNbXCJyb3V0ZVBhcmFtc1wiXTtcbiAgICAgIGlmIChyb3V0ZVBhcmFtcykge1xuICAgICAgICAkc2NvcGUucm91dGVQYXJhbXMgPSBkZWNvZGVVUklDb21wb25lbnQocm91dGVQYXJhbXMpO1xuICAgICAgfVxuICAgICAgdmFyIHNpemU6YW55ID0gJHJvdXRlUGFyYW1zW1wic2l6ZVwiXTtcbiAgICAgIGlmIChzaXplKSB7XG4gICAgICAgIHNpemUgPSBkZWNvZGVVUklDb21wb25lbnQoc2l6ZSk7XG4gICAgICAgICRzY29wZS5wcmVmZXJyZWRTaXplID0gYW5ndWxhci5mcm9tSnNvbihzaXplKTtcbiAgICAgIH1cbiAgICAgIHZhciB0aXRsZTphbnkgPSAkcm91dGVQYXJhbXNbXCJ0aXRsZVwiXTtcbiAgICAgIGlmICh0aXRsZSkge1xuICAgICAgICB0aXRsZSA9IGRlY29kZVVSSUNvbXBvbmVudCh0aXRsZSk7XG4gICAgICAgICRzY29wZS53aWRnZXRUaXRsZSA9IHRpdGxlO1xuICAgICAgfVxuXG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZHMoKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGFzaGJvYXJkTG9hZGVkKGV2ZW50LCBkYXNoYm9hcmRzKSB7XG4gICAgICBkYXNoYm9hcmRzLmZvckVhY2goKGRhc2hib2FyZCkgPT4ge1xuICAgICAgICBkYXNoYm9hcmQuaGFzaCA9ICc/bWFpbi10YWI9ZGFzaGJvYXJkJnN1Yi10YWI9ZGFzaGJvYXJkLScgKyBkYXNoYm9hcmQuaWQ7XG4gICAgICB9KTtcbiAgICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IGRhc2hib2FyZHM7XG5cbiAgICAgIGlmIChldmVudCA9PT0gbnVsbCkge1xuICAgICAgICAkc2NvcGUuJGVtaXQoJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkcyk7XG4gICAgICB9XG4gICAgICBDb3JlLiRhcHBseSgkcm9vdFNjb3BlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXNoYm9hcmRzKCkge1xuICAgICAgcmV0dXJuICRzY29wZS5fZGFzaGJvYXJkcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZXNlbGVjdEFsbCgpIHtcbiAgICAgICRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLmxlbmd0aCA9IDA7XG4gICAgfVxuXG4gIH1dKTtcbn1cbiIsIi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG5cbiAgLyoqXG4gICAqIEltcGxlbWVudHMgdGhlIG5nLklMb2NhdGlvblNlcnZpY2UgaW50ZXJmYWNlIGFuZCBpcyB1c2VkIGJ5IHRoZSBkYXNoYm9hcmQgdG8gc3VwcGx5XG4gICAqIGNvbnRyb2xsZXJzIHdpdGggYSBzYXZlZCBVUkwgbG9jYXRpb25cbiAgICpcbiAgICogQGNsYXNzIFJlY3RhbmdsZUxvY2F0aW9uXG4gICAqL1xuICBleHBvcnQgY2xhc3MgUmVjdGFuZ2xlTG9jYXRpb24geyAvLyBUT0RPIGltcGxlbWVudHMgbmcuSUxvY2F0aW9uU2VydmljZSB7XG4gICAgcHJpdmF0ZSBfcGF0aDogc3RyaW5nO1xuICAgIHByaXZhdGUgX2hhc2g6IHN0cmluZztcbiAgICBwcml2YXRlIF9zZWFyY2g6IGFueTtcblxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBkZWxlZ2F0ZTpuZy5JTG9jYXRpb25TZXJ2aWNlLCBwYXRoOnN0cmluZywgc2VhcmNoLCBoYXNoOnN0cmluZykge1xuICAgICAgdGhpcy5fcGF0aCA9IHBhdGg7XG4gICAgICB0aGlzLl9zZWFyY2ggPSBzZWFyY2g7XG4gICAgICB0aGlzLl9oYXNoID0gaGFzaDtcbiAgICB9XG5cbiAgICBhYnNVcmwoKSB7XG4gICAgICByZXR1cm4gdGhpcy5wcm90b2NvbCgpICsgdGhpcy5ob3N0KCkgKyBcIjpcIiArIHRoaXMucG9ydCgpICsgdGhpcy5wYXRoKCkgKyB0aGlzLnNlYXJjaCgpO1xuICAgIH1cblxuICAgIGhhc2gobmV3SGFzaDpzdHJpbmcgPSBudWxsKTphbnkge1xuICAgICAgaWYgKG5ld0hhc2gpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUuaGFzaChuZXdIYXNoKS5zZWFyY2goJ3RhYicsIG51bGwpO1xuICAgICAgICAvL3RoaXMuX2hhc2ggPSBuZXdIYXNoO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX2hhc2g7XG4gICAgfVxuXG4gICAgaG9zdCgpOnN0cmluZyB7XG4gICAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5ob3N0KCk7XG4gICAgfVxuXG4gICAgcGF0aChuZXdQYXRoOnN0cmluZyA9IG51bGwpOmFueSB7XG4gICAgICBpZiAobmV3UGF0aCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5wYXRoKG5ld1BhdGgpLnNlYXJjaCgndGFiJywgbnVsbCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fcGF0aDtcbiAgICB9XG5cbiAgICBwb3J0KCk6bnVtYmVyIHtcbiAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLnBvcnQoKTtcbiAgICB9XG5cbiAgICBwcm90b2NvbCgpIHtcbiAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLnBvcnQoKTtcbiAgICB9XG5cbiAgICByZXBsYWNlKCkge1xuICAgICAgLy8gVE9ET1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2VhcmNoKHBhcmFtZXRlcnNNYXA6YW55ID0gbnVsbCk6YW55IHtcbiAgICAgIGlmIChwYXJhbWV0ZXJzTWFwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLnNlYXJjaChwYXJhbWV0ZXJzTWFwKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9zZWFyY2g7XG4gICAgfVxuXG4gICAgdXJsKG5ld1ZhbHVlOiBzdHJpbmcgPSBudWxsKTphbnkge1xuICAgICAgaWYgKG5ld1ZhbHVlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLnVybChuZXdWYWx1ZSkuc2VhcmNoKCd0YWInLCBudWxsKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmFic1VybCgpO1xuICAgIH1cblxuICB9XG59XG4iLCIvKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUmVwb3NpdG9yeS50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJyZWN0YW5nbGVMb2NhdGlvbi50c1wiLz5cbm1vZHVsZSBEYXNoYm9hcmQge1xuXG4gIHZhciBtb2R1bGVzOkFycmF5PHN0cmluZz4gPSB1bmRlZmluZWQ7XG5cbiAgX21vZHVsZS5kaXJlY3RpdmUoJ2hhd3Rpb0Rhc2hib2FyZCcsIGZ1bmN0aW9uKCkge1xuICAgIG1vZHVsZXMgPSBoYXd0aW9QbHVnaW5Mb2FkZXJbJ21vZHVsZXMnXS5maWx0ZXIoKG5hbWUpID0+IHtcbiAgICAgIHJldHVybiBfLmlzU3RyaW5nKG5hbWUpICYmIG5hbWUgIT09ICduZyc7XG4gICAgfSk7XG4gICAgcmV0dXJuIG5ldyBEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUoKTtcbiAgfSk7XG5cbiAgZXhwb3J0IGNsYXNzIEdyaWRzdGVyRGlyZWN0aXZlIHtcbiAgICBwdWJsaWMgcmVzdHJpY3QgPSAnQSc7XG4gICAgcHVibGljIHJlcGxhY2UgPSB0cnVlO1xuXG4gICAgcHVibGljIGNvbnRyb2xsZXIgPSBbXCIkc2NvcGVcIiwgXCIkZWxlbWVudFwiLCBcIiRhdHRyc1wiLCBcIiRsb2NhdGlvblwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcIiR0ZW1wbGF0ZUNhY2hlXCIsIFwiZGFzaGJvYXJkUmVwb3NpdG9yeVwiLCBcIiRjb21waWxlXCIsIFwiJHRlbXBsYXRlUmVxdWVzdFwiLCAoJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzLCAkbG9jYXRpb24sICRyb3V0ZVBhcmFtcywgJHRlbXBsYXRlQ2FjaGUsIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSwgJGNvbXBpbGUsICR0ZW1wbGF0ZVJlcXVlc3QpID0+IHtcblxuICAgICAgdmFyIGdyaWRTaXplID0gMTUwO1xuICAgICAgdmFyIGdyaWRNYXJnaW4gPSA2O1xuICAgICAgdmFyIGdyaWRIZWlnaHQ7XG5cbiAgICAgICRzY29wZS5ncmlkWCA9IGdyaWRTaXplO1xuICAgICAgJHNjb3BlLmdyaWRZID0gZ3JpZFNpemU7XG5cbiAgICAgICRzY29wZS53aWRnZXRNYXAgPSB7fTtcblxuICAgICAgLypcbiAgICAgICRzY29wZS4kb24oJyRkZXN0cm95JywgKCkgPT4ge1xuICAgICAgICBhbmd1bGFyLmZvckVhY2goJHNjb3BlLndpZGdldE1hcCwgKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgICBpZiAoJ3Njb3BlJyBpbiB2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIHNjb3BlID0gdmFsdWVbJ3Njb3BlJ107XG4gICAgICAgICAgICBzY29wZS4kZGVzdHJveSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgICovXG5cbiAgICAgIHVwZGF0ZVdpZGdldHMoKTtcblxuICAgICAgJHNjb3BlLnJlbW92ZVdpZGdldCA9IGZ1bmN0aW9uKHdpZGdldCkge1xuICAgICAgICB2YXIgZ3JpZHN0ZXIgPSBnZXRHcmlkc3RlcigpO1xuICAgICAgICB2YXIgd2lkZ2V0RWxlbSA9IG51bGw7XG5cbiAgICAgICAgLy8gbGV0cyBkZXN0cm95IHRoZSB3aWRnZXRzJ3Mgc2NvcGVcbiAgICAgICAgdmFyIHdpZGdldERhdGEgPSAkc2NvcGUud2lkZ2V0TWFwW3dpZGdldC5pZF07XG4gICAgICAgIGlmICh3aWRnZXREYXRhKSB7XG4gICAgICAgICAgZGVsZXRlICRzY29wZS53aWRnZXRNYXBbd2lkZ2V0LmlkXTtcbiAgICAgICAgICB2YXIgc2NvcGUgPSB3aWRnZXREYXRhLnNjb3BlO1xuICAgICAgICAgIHdpZGdldEVsZW0gPSB3aWRnZXREYXRhLndpZGdldDtcbiAgICAgICAgICBpZiAoc2NvcGUpIHtcbiAgICAgICAgICAgIHNjb3BlLiRkZXN0cm95KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghd2lkZ2V0RWxlbSkge1xuICAgICAgICAgIC8vIGxldHMgZ2V0IHRoZSBsaSBwYXJlbnQgZWxlbWVudCBvZiB0aGUgdGVtcGxhdGVcbiAgICAgICAgICB3aWRnZXRFbGVtID0gJChcImRpdlwiKS5maW5kKFwiW2RhdGEtd2lkZ2V0SWQ9J1wiICsgd2lkZ2V0LmlkICsgXCInXVwiKS5wYXJlbnQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZ3JpZHN0ZXIgJiYgd2lkZ2V0RWxlbSkge1xuICAgICAgICAgIGdyaWRzdGVyLnJlbW92ZV93aWRnZXQod2lkZ2V0RWxlbSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbm8gbmVlZCB0byByZW1vdmUgaXQuLi5cbiAgICAgICAgLy93aWRnZXRFbGVtLnJlbW92ZSgpO1xuXG4gICAgICAgIC8vIGxldHMgdHJhc2ggdGhlIEpTT04gbWV0YWRhdGFcbiAgICAgICAgaWYgKCRzY29wZS5kYXNoYm9hcmQpIHtcbiAgICAgICAgICB2YXIgd2lkZ2V0cyA9ICRzY29wZS5kYXNoYm9hcmQud2lkZ2V0cztcbiAgICAgICAgICBpZiAod2lkZ2V0cykge1xuICAgICAgICAgICAgd2lkZ2V0cy5yZW1vdmUod2lkZ2V0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGVEYXNoYm9hcmRSZXBvc2l0b3J5KFwiUmVtb3ZlZCB3aWRnZXQgXCIgKyB3aWRnZXQudGl0bGUpO1xuICAgICAgfTtcblxuICAgICAgZnVuY3Rpb24gY2hhbmdlV2lkZ2V0U2l6ZSh3aWRnZXQsIHNpemVmdW5jLCBzYXZlZnVuYykge1xuICAgICAgICB2YXIgZ3JpZHN0ZXIgPSBnZXRHcmlkc3RlcigpO1xuICAgICAgICB2YXIgZW50cnkgPSAkc2NvcGUud2lkZ2V0TWFwW3dpZGdldC5pZF07XG4gICAgICAgIHZhciB3ID0gZW50cnkud2lkZ2V0O1xuICAgICAgICB2YXIgc2NvcGUgPSBlbnRyeS5zY29wZTtcbiAgICAgICAgc2l6ZWZ1bmMoZW50cnkpO1xuICAgICAgICBncmlkc3Rlci5yZXNpemVfd2lkZ2V0KHcsIGVudHJ5LnNpemVfeCwgZW50cnkuc2l6ZV95KTtcbiAgICAgICAgZ3JpZHN0ZXIuc2V0X2RvbV9ncmlkX2hlaWdodCgpO1xuXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHRlbXBsYXRlID0gJHRlbXBsYXRlQ2FjaGUuZ2V0KFwid2lkZ2V0VGVtcGxhdGVcIik7XG4gICAgICAgICAgdmFyIGRpdiA9ICQoJzxkaXY+PC9kaXY+Jyk7XG4gICAgICAgICAgZGl2Lmh0bWwodGVtcGxhdGUpO1xuICAgICAgICAgIHcuaHRtbCgkY29tcGlsZShkaXYuY29udGVudHMoKSkoc2NvcGUpKTtcblxuICAgICAgICAgIG1ha2VSZXNpemFibGUoKTtcbiAgICAgICAgICBDb3JlLiRhcHBseSgkc2NvcGUpO1xuXG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNhdmVmdW5jKHdpZGdldCk7XG4gICAgICAgICAgfSwgNTApO1xuICAgICAgICB9LCAzMCk7XG4gICAgICB9XG5cbiAgICAgICRzY29wZS5vbldpZGdldFJlbmFtZWQgPSBmdW5jdGlvbih3aWRnZXQpIHtcbiAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIlJlbmFtZWQgd2lkZ2V0IHRvIFwiICsgd2lkZ2V0LnRpdGxlKTtcbiAgICAgIH07XG5cbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZVdpZGdldHMoKSB7XG4gICAgICAgICRzY29wZS5pZCA9ICRyb3V0ZVBhcmFtc1tcImRhc2hib2FyZElkXCJdO1xuICAgICAgICAkc2NvcGUuaWR4ID0gJHJvdXRlUGFyYW1zW1wiZGFzaGJvYXJkSW5kZXhcIl07XG4gICAgICAgIGlmICgkc2NvcGUuaWQpIHtcbiAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2xvYWREYXNoYm9hcmRzJyk7XG4gICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXREYXNoYm9hcmQoJHNjb3BlLmlkLCBvbkRhc2hib2FyZExvYWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkcygoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdkYXNoYm9hcmRzVXBkYXRlZCcsIGRhc2hib2FyZHMpO1xuXG4gICAgICAgICAgICB2YXIgaWR4ID0gJHNjb3BlLmlkeCA/IHBhcnNlSW50KCRzY29wZS5pZHgpIDogMDtcbiAgICAgICAgICAgIHZhciBpZCA9IG51bGw7XG4gICAgICAgICAgICBpZiAoZGFzaGJvYXJkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIHZhciBkYXNoYm9hcmQgPSBkYXNoYm9hcmRzLmxlbmd0aCA+IGlkeCA/IGRhc2hib2FyZHNbaWR4XSA6IGRhc2hib2FyZFswXTtcbiAgICAgICAgICAgICAgaWQgPSBkYXNoYm9hcmQuaWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQpIHtcbiAgICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoXCIvZGFzaGJvYXJkL2lkL1wiICsgaWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoXCIvZGFzaGJvYXJkL2VkaXRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBDb3JlLiRhcHBseSgkc2NvcGUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG9uRGFzaGJvYXJkTG9hZChkYXNoYm9hcmQpIHtcbiAgICAgICAgJHNjb3BlLmRhc2hib2FyZCA9IGRhc2hib2FyZDtcbiAgICAgICAgdmFyIHdpZGdldHMgPSAoKGRhc2hib2FyZCkgPyBkYXNoYm9hcmQud2lkZ2V0cyA6IG51bGwpIHx8IFtdO1xuXG4gICAgICAgIHZhciBtaW5IZWlnaHQgPSAxMDtcbiAgICAgICAgdmFyIG1pbldpZHRoID0gNjtcblxuICAgICAgICBhbmd1bGFyLmZvckVhY2god2lkZ2V0cywgKHdpZGdldCkgPT4ge1xuICAgICAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZCh3aWRnZXQucm93KSAmJiBtaW5IZWlnaHQgPCB3aWRnZXQucm93KSB7XG4gICAgICAgICAgICBtaW5IZWlnaHQgPSB3aWRnZXQucm93ICsgMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHdpZGdldC5zaXplX3hcbiAgICAgICAgICAgICAgJiYgYW5ndWxhci5pc0RlZmluZWQod2lkZ2V0LmNvbCkpKSB7XG4gICAgICAgICAgICB2YXIgcmlnaHRFZGdlID0gd2lkZ2V0LmNvbCArIHdpZGdldC5zaXplX3g7XG4gICAgICAgICAgICBpZiAocmlnaHRFZGdlID4gbWluV2lkdGgpIHtcbiAgICAgICAgICAgICAgbWluV2lkdGggPSByaWdodEVkZ2UgKyAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGdyaWRzdGVyID0gJGVsZW1lbnQuZ3JpZHN0ZXIoe1xuICAgICAgICAgIHdpZGdldF9tYXJnaW5zOiBbZ3JpZE1hcmdpbiwgZ3JpZE1hcmdpbl0sXG4gICAgICAgICAgd2lkZ2V0X2Jhc2VfZGltZW5zaW9uczogWyRzY29wZS5ncmlkWCwgJHNjb3BlLmdyaWRZXSxcbiAgICAgICAgICBleHRyYV9yb3dzOiBtaW5IZWlnaHQsXG4gICAgICAgICAgZXh0cmFfY29sczogbWluV2lkdGgsXG4gICAgICAgICAgbWF4X3NpemVfeDogbWluV2lkdGgsXG4gICAgICAgICAgbWF4X3NpemVfeTogbWluSGVpZ2h0LFxuICAgICAgICAgIGRyYWdnYWJsZToge1xuICAgICAgICAgICAgc3RvcDogKGV2ZW50LCB1aSkgPT4ge1xuICAgICAgICAgICAgICBpZiAoc2VyaWFsaXplRGFzaGJvYXJkKCkpIHtcbiAgICAgICAgICAgICAgICB1cGRhdGVEYXNoYm9hcmRSZXBvc2l0b3J5KFwiQ2hhbmdpbmcgZGFzaGJvYXJkIGxheW91dFwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSkuZGF0YSgnZ3JpZHN0ZXInKTtcblxuICAgICAgICB2YXIgdGVtcGxhdGUgPSAkdGVtcGxhdGVDYWNoZS5nZXQoXCJ3aWRnZXRUZW1wbGF0ZVwiKTtcbiAgICAgICAgdmFyIHJlbWFpbmluZyA9IHdpZGdldHMubGVuZ3RoO1xuXG4gICAgICAgIGZ1bmN0aW9uIG1heWJlRmluaXNoVXAoKSB7XG4gICAgICAgICAgcmVtYWluaW5nID0gcmVtYWluaW5nIC0gMTtcbiAgICAgICAgICBpZiAocmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgICAgICBtYWtlUmVzaXphYmxlKCk7XG4gICAgICAgICAgICBnZXRHcmlkc3RlcigpLmVuYWJsZSgpO1xuICAgICAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBhbmd1bGFyLmZvckVhY2god2lkZ2V0cywgKHdpZGdldCkgPT4ge1xuICAgICAgICAgIHZhciBwYXRoID0gd2lkZ2V0LnBhdGg7XG4gICAgICAgICAgdmFyIHNlYXJjaCA9IG51bGw7XG4gICAgICAgICAgaWYgKHdpZGdldC5zZWFyY2gpIHtcbiAgICAgICAgICAgIHNlYXJjaCA9IERhc2hib2FyZC5kZWNvZGVVUklDb21wb25lbnRQcm9wZXJ0aWVzKHdpZGdldC5zZWFyY2gpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAod2lkZ2V0LnJvdXRlUGFyYW1zKSB7XG4gICAgICAgICAgICBfLmV4dGVuZChzZWFyY2gsIGFuZ3VsYXIuZnJvbUpzb24od2lkZ2V0LnJvdXRlUGFyYW1zKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBoYXNoID0gd2lkZ2V0Lmhhc2g7IC8vIFRPRE8gZGVjb2RlIG9iamVjdD9cbiAgICAgICAgICB2YXIgbG9jYXRpb24gPSBuZXcgUmVjdGFuZ2xlTG9jYXRpb24oJGxvY2F0aW9uLCBwYXRoLCBzZWFyY2gsIGhhc2gpO1xuXG4gICAgICAgICAgdmFyIHRtcE1vZHVsZU5hbWUgPSAnZGFzaGJvYXJkLScgKyB3aWRnZXQuaWQ7XG4gICAgICAgICAgdmFyIHRtcE1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKHRtcE1vZHVsZU5hbWUsIG1vZHVsZXMpO1xuICAgICAgICAgIHRtcE1vZHVsZS5jb25maWcoWyckcHJvdmlkZScsICgkcHJvdmlkZSkgPT4ge1xuICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKCckbG9jYXRpb24nLCBbJyRkZWxlZ2F0ZScsICgkZGVsZWdhdGUpID0+IHtcbiAgICAgICAgICAgICAgLy9sb2cuZGVidWcoXCJVc2luZyAkbG9jYXRpb246IFwiLCBsb2NhdGlvbik7XG4gICAgICAgICAgICAgIHJldHVybiBsb2NhdGlvbjtcbiAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcignJHJvdXRlJywgWyckZGVsZWdhdGUnLCAoJGRlbGVnYXRlKSA9PiB7XG4gICAgICAgICAgICAgIC8vIHJlYWxseSBoYW5keSBmb3IgZGVidWdnaW5nLCBtb3N0bHkgdG8gdGVsbCBpZiBhIHdpZGdldCdzIHJvdXRlXG4gICAgICAgICAgICAgIC8vIGlzbid0IGFjdHVhbGx5IGF2YWlsYWJsZSBpbiB0aGUgY2hpbGQgYXBwXG4gICAgICAgICAgICAgIC8vbG9nLmRlYnVnKFwiVXNpbmcgJHJvdXRlOiBcIiwgJGRlbGVnYXRlKTtcbiAgICAgICAgICAgICAgcmV0dXJuICRkZWxlZ2F0ZTtcbiAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcignJHJvdXRlUGFyYW1zJywgWyckZGVsZWdhdGUnLCAoJGRlbGVnYXRlKSA9PiB7XG4gICAgICAgICAgICAgIC8vbG9nLmRlYnVnKFwiVXNpbmcgJHJvdXRlUGFyYW1zOiBcIiwgc2VhcmNoKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlYXJjaDtcbiAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICB9XSk7XG4gICAgICAgICAgaWYgKCF3aWRnZXQuc2l6ZV94IHx8IHdpZGdldC5zaXplX3ggPCAxKSB7XG4gICAgICAgICAgICB3aWRnZXQuc2l6ZV94ID0gMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCF3aWRnZXQuc2l6ZV95IHx8IHdpZGdldC5zaXplX3kgPCAxKSB7XG4gICAgICAgICAgICB3aWRnZXQuc2l6ZV95ID0gMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGRpdiA9ICQoJzxkaXY+PC9kaXY+Jyk7XG4gICAgICAgICAgZGl2Lmh0bWwodGVtcGxhdGUpO1xuICAgICAgICAgIHZhciBib2R5ID0gZGl2LmZpbmQoJy53aWRnZXQtYm9keScpO1xuICAgICAgICAgIHZhciB3aWRnZXRCb2R5ID0gJHRlbXBsYXRlUmVxdWVzdCh3aWRnZXQuaW5jbHVkZSk7XG4gICAgICAgICAgd2lkZ2V0Qm9keS50aGVuKCh3aWRnZXRCb2R5KSA9PiB7XG4gICAgICAgICAgICB2YXIgb3V0ZXJEaXYgPSBhbmd1bGFyLmVsZW1lbnQoJHRlbXBsYXRlQ2FjaGUuZ2V0KCd3aWRnZXRCbG9ja1RlbXBsYXRlLmh0bWwnKSk7XG4gICAgICAgICAgICBib2R5Lmh0bWwod2lkZ2V0Qm9keSk7XG4gICAgICAgICAgICBvdXRlckRpdi5odG1sKGJvZHkpO1xuICAgICAgICAgICAgYW5ndWxhci5ib290c3RyYXAoYm9keSwgW3RtcE1vZHVsZU5hbWVdKTtcbiAgICAgICAgICAgIHZhciB3ID0gZ3JpZHN0ZXIuYWRkX3dpZGdldChvdXRlckRpdiwgd2lkZ2V0LnNpemVfeCwgd2lkZ2V0LnNpemVfeSwgd2lkZ2V0LmNvbCwgd2lkZ2V0LnJvdyk7XG4gICAgICAgICAgICAkc2NvcGUud2lkZ2V0TWFwW3dpZGdldC5pZF0gPSB7XG4gICAgICAgICAgICAgIHdpZGdldDogd1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIG1heWJlRmluaXNoVXAoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHNlcmlhbGl6ZURhc2hib2FyZCgpIHtcbiAgICAgICAgdmFyIGdyaWRzdGVyID0gZ2V0R3JpZHN0ZXIoKTtcbiAgICAgICAgaWYgKGdyaWRzdGVyKSB7XG4gICAgICAgICAgdmFyIGRhdGEgPSBncmlkc3Rlci5zZXJpYWxpemUoKTtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiZ290IGRhdGE6IFwiICsgSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuXG4gICAgICAgICAgdmFyIHdpZGdldHMgPSAkc2NvcGUuZGFzaGJvYXJkLndpZGdldHMgfHwgW107XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coXCJXaWRnZXRzOiBcIiwgd2lkZ2V0cyk7XG5cbiAgICAgICAgICAvLyBsZXRzIGFzc3VtZSB0aGUgZGF0YSBpcyBpbiB0aGUgb3JkZXIgb2YgdGhlIHdpZGdldHMuLi5cbiAgICAgICAgICBhbmd1bGFyLmZvckVhY2god2lkZ2V0cywgKHdpZGdldCwgaWR4KSA9PiB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW2lkeF07XG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgd2lkZ2V0KSB7XG4gICAgICAgICAgICAgIC8vIGxldHMgY29weSB0aGUgdmFsdWVzIGFjcm9zc1xuICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2godmFsdWUsIChhdHRyLCBrZXkpID0+IHdpZGdldFtrZXldID0gYXR0cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBtYWtlUmVzaXphYmxlKCkge1xuXG4gICAgICAgIC8qXG5cbiAgICAgICAgdmFyIGJsb2NrczphbnkgPSAkKCcuZ3JpZC1ibG9jaycpO1xuICAgICAgICBibG9ja3MucmVzaXphYmxlKCdkZXN0cm95Jyk7XG5cbiAgICAgICAgYmxvY2tzLnJlc2l6YWJsZSh7XG4gICAgICAgICAgZ3JpZDogW2dyaWRTaXplICsgKGdyaWRNYXJnaW4gKiAyKSwgZ3JpZFNpemUgKyAoZ3JpZE1hcmdpbiAqIDIpXSxcbiAgICAgICAgICBhbmltYXRlOiBmYWxzZSxcbiAgICAgICAgICBtaW5XaWR0aDogZ3JpZFNpemUsXG4gICAgICAgICAgbWluSGVpZ2h0OiBncmlkU2l6ZSxcbiAgICAgICAgICBhdXRvSGlkZTogZmFsc2UsXG4gICAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uKGV2ZW50LCB1aSkge1xuICAgICAgICAgICAgZ3JpZEhlaWdodCA9IGdldEdyaWRzdGVyKCkuJGVsLmhlaWdodCgpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVzaXplOiBmdW5jdGlvbihldmVudCwgdWkpIHtcbiAgICAgICAgICAgIC8vc2V0IG5ldyBncmlkIGhlaWdodCBhbG9uZyB0aGUgZHJhZ2dpbmcgcGVyaW9kXG4gICAgICAgICAgICB2YXIgZyA9IGdldEdyaWRzdGVyKCk7XG4gICAgICAgICAgICB2YXIgZGVsdGEgPSBncmlkU2l6ZSArIGdyaWRNYXJnaW4gKiAyO1xuICAgICAgICAgICAgaWYgKGV2ZW50Lm9mZnNldFkgPiBnLiRlbC5oZWlnaHQoKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdmFyIGV4dHJhID0gTWF0aC5mbG9vcigoZXZlbnQub2Zmc2V0WSAtIGdyaWRIZWlnaHQpIC8gZGVsdGEgKyAxKTtcbiAgICAgICAgICAgICAgdmFyIG5ld0hlaWdodCA9IGdyaWRIZWlnaHQgKyBleHRyYSAqIGRlbHRhO1xuICAgICAgICAgICAgICBnLiRlbC5jc3MoJ2hlaWdodCcsIG5ld0hlaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzdG9wOiBmdW5jdGlvbihldmVudCwgdWkpIHtcbiAgICAgICAgICAgIHZhciByZXNpemVkID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJlc2l6ZUJsb2NrKHJlc2l6ZWQpO1xuICAgICAgICAgICAgfSwgMzAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgICQoJy51aS1yZXNpemFibGUtaGFuZGxlJykuaG92ZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZ2V0R3JpZHN0ZXIoKS5kaXNhYmxlKCk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGdldEdyaWRzdGVyKCkuZW5hYmxlKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICovXG4gICAgICB9XG5cblxuICAgICAgZnVuY3Rpb24gcmVzaXplQmxvY2soZWxtT2JqKSB7XG4gICAgICAgIHZhciBhcmVhID0gZWxtT2JqLmZpbmQoJy53aWRnZXQtYXJlYScpO1xuICAgICAgICB2YXIgdyA9IGVsbU9iai53aWR0aCgpIC0gZ3JpZFNpemU7XG4gICAgICAgIHZhciBoID0gZWxtT2JqLmhlaWdodCgpIC0gZ3JpZFNpemU7XG5cbiAgICAgICAgZm9yICh2YXIgZ3JpZF93ID0gMTsgdyA+IDA7IHcgLT0gKGdyaWRTaXplICsgKGdyaWRNYXJnaW4gKiAyKSkpIHtcbiAgICAgICAgICBncmlkX3crKztcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGdyaWRfaCA9IDE7IGggPiAwOyBoIC09IChncmlkU2l6ZSArIChncmlkTWFyZ2luICogMikpKSB7XG4gICAgICAgICAgZ3JpZF9oKys7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgd2lkZ2V0ID0ge1xuICAgICAgICAgIGlkOiBhcmVhLmF0dHIoJ2RhdGEtd2lkZ2V0SWQnKVxuICAgICAgICB9O1xuXG4gICAgICAgIGNoYW5nZVdpZGdldFNpemUod2lkZ2V0LCBmdW5jdGlvbih3aWRnZXQpIHtcbiAgICAgICAgICB3aWRnZXQuc2l6ZV94ID0gZ3JpZF93O1xuICAgICAgICAgIHdpZGdldC5zaXplX3kgPSBncmlkX2g7XG4gICAgICAgIH0sIGZ1bmN0aW9uKHdpZGdldCkge1xuICAgICAgICAgIGlmIChzZXJpYWxpemVEYXNoYm9hcmQoKSkge1xuICAgICAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIkNoYW5nZWQgc2l6ZSBvZiB3aWRnZXQ6IFwiICsgd2lkZ2V0LmlkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgICAgIGlmICgkc2NvcGUuZGFzaGJvYXJkKSB7XG4gICAgICAgICAgdmFyIGNvbW1pdE1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgICAgIGlmICgkc2NvcGUuZGFzaGJvYXJkICYmICRzY29wZS5kYXNoYm9hcmQudGl0bGUpIHtcbiAgICAgICAgICAgIGNvbW1pdE1lc3NhZ2UgKz0gXCIgb24gZGFzaGJvYXJkIFwiICsgJHNjb3BlLmRhc2hib2FyZC50aXRsZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKFskc2NvcGUuZGFzaGJvYXJkXSwgY29tbWl0TWVzc2FnZSwgRGFzaGJvYXJkLm9uT3BlcmF0aW9uQ29tcGxldGUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGdldEdyaWRzdGVyKCkge1xuICAgICAgICByZXR1cm4gJGVsZW1lbnQuZ3JpZHN0ZXIoKS5kYXRhKCdncmlkc3RlcicpO1xuICAgICAgfVxuXG4gICAgfV07XG5cbiAgfVxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcbiAgX21vZHVsZS5jb250cm9sbGVyKFwiRGFzaGJvYXJkLkltcG9ydENvbnRyb2xsZXJcIiwgW1wiJHNjb3BlXCIsIFwiJGxvY2F0aW9uXCIsIFwiJHJvdXRlUGFyYW1zXCIsIFwiZGFzaGJvYXJkUmVwb3NpdG9yeVwiLCAoJHNjb3BlLCAkbG9jYXRpb24sICRyb3V0ZVBhcmFtcywgZGFzaGJvYXJkUmVwb3NpdG9yeTpEYXNoYm9hcmRSZXBvc2l0b3J5KSA9PiB7XG4gICAgJHNjb3BlLnBsYWNlaG9sZGVyID0gXCJQYXN0ZSB0aGUgSlNPTiBoZXJlIGZvciB0aGUgZGFzaGJvYXJkIGNvbmZpZ3VyYXRpb24gdG8gaW1wb3J0Li4uXCI7XG4gICAgJHNjb3BlLnNvdXJjZSA9ICRzY29wZS5wbGFjZWhvbGRlcjtcblxuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgbW9kZToge1xuICAgICAgICBuYW1lOiBcImphdmFzY3JpcHRcIlxuICAgICAgfVxuICAgIH07XG4gICAgLy8kc2NvcGUuY29kZU1pcnJvck9wdGlvbnMgPSBDb2RlRWRpdG9yLmNyZWF0ZUVkaXRvclNldHRpbmdzKG9wdGlvbnMpO1xuXG5cbiAgICAkc2NvcGUuaXNWYWxpZCA9ICgpID0+ICRzY29wZS5zb3VyY2UgJiYgJHNjb3BlLnNvdXJjZSAhPT0gJHNjb3BlLnBsYWNlaG9sZGVyO1xuXG4gICAgJHNjb3BlLmltcG9ydEpTT04gPSAoKSA9PiB7XG4gICAgICB2YXIganNvbiA9IFtdO1xuICAgICAgLy8gbGV0cyBwYXJzZSB0aGUgSlNPTi4uLlxuICAgICAgdHJ5IHtcbiAgICAgICAganNvbiA9IEpTT04ucGFyc2UoJHNjb3BlLnNvdXJjZSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vSGF3dGlvQ29yZS5ub3RpZmljYXRpb24oXCJlcnJvclwiLCBcIkNvdWxkIG5vdCBwYXJzZSB0aGUgSlNPTlxcblwiICsgZSk7XG4gICAgICAgIGpzb24gPSBbXTtcbiAgICAgIH1cbiAgICAgIHZhciBhcnJheSA9IFtdO1xuICAgICAgaWYgKGFuZ3VsYXIuaXNBcnJheShqc29uKSkge1xuICAgICAgICBhcnJheSA9IGpzb247XG4gICAgICB9IGVsc2UgaWYgKGFuZ3VsYXIuaXNPYmplY3QoanNvbikpIHtcbiAgICAgICAgYXJyYXkucHVzaChqc29uKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFycmF5Lmxlbmd0aCkge1xuICAgICAgICAvLyBsZXRzIGVuc3VyZSB3ZSBoYXZlIHNvbWUgdmFsaWQgaWRzIGFuZCBzdHVmZi4uLlxuICAgICAgICBhbmd1bGFyLmZvckVhY2goYXJyYXksIChkYXNoLCBpbmRleCkgPT4ge1xuICAgICAgICAgIGFuZ3VsYXIuY29weShkYXNoLCBkYXNoYm9hcmRSZXBvc2l0b3J5LmNyZWF0ZURhc2hib2FyZChkYXNoKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoYXJyYXksIFwiSW1wb3J0ZWQgZGFzaGJvYXJkIEpTT05cIiwgRGFzaGJvYXJkLm9uT3BlcmF0aW9uQ29tcGxldGUpO1xuICAgICAgICAkbG9jYXRpb24ucGF0aChcIi9kYXNoYm9hcmQvZWRpdFwiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1dKTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuICBfbW9kdWxlLmNvbnRyb2xsZXIoXCJEYXNoYm9hcmQuTmF2QmFyQ29udHJvbGxlclwiLCBbXCIkc2NvcGVcIiwgXCIkcm91dGVQYXJhbXNcIiwgXCIkcm9vdFNjb3BlXCIsIFwiZGFzaGJvYXJkUmVwb3NpdG9yeVwiLCAoJHNjb3BlLCAkcm91dGVQYXJhbXMsICRyb290U2NvcGUsIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSkgPT4ge1xuXG4gICAgJHNjb3BlLl9kYXNoYm9hcmRzID0gW107XG5cbiAgICAkc2NvcGUuYWN0aXZlRGFzaGJvYXJkID0gJHJvdXRlUGFyYW1zWydkYXNoYm9hcmRJZCddO1xuXG4gICAgJHNjb3BlLiRvbignbG9hZERhc2hib2FyZHMnLCBsb2FkRGFzaGJvYXJkcyk7XG5cbiAgICAkc2NvcGUuJG9uKCdkYXNoYm9hcmRzVXBkYXRlZCcsIGRhc2hib2FyZExvYWRlZCk7XG5cbiAgICAkc2NvcGUuZGFzaGJvYXJkcyA9ICgpID0+IHtcbiAgICAgIHJldHVybiAkc2NvcGUuX2Rhc2hib2FyZHNcbiAgICB9O1xuXG4gICAgJHNjb3BlLm9uVGFiUmVuYW1lZCA9IGZ1bmN0aW9uKGRhc2gpIHtcbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbZGFzaF0sIFwiUmVuYW1lZCBkYXNoYm9hcmRcIiwgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGRhc2hib2FyZExvYWRlZChldmVudCwgZGFzaGJvYXJkcykge1xuICAgICAgbG9nLmRlYnVnKFwibmF2YmFyIGRhc2hib2FyZExvYWRlZDogXCIsIGRhc2hib2FyZHMpO1xuICAgICAgJHNjb3BlLl9kYXNoYm9hcmRzID0gZGFzaGJvYXJkcztcbiAgICAgIGlmIChldmVudCA9PT0gbnVsbCkge1xuICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkcyk7XG4gICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbG9hZERhc2hib2FyZHMoZXZlbnQpIHtcbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkcygoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAvLyBwcmV2ZW50IHRoZSBicm9hZGNhc3QgZnJvbSBoYXBwZW5pbmcuLi5cbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgICBDb3JlLiRhcHBseSgkc2NvcGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XSk7XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcbiAgZXhwb3J0IHZhciBTaGFyZUNvbnRyb2xsZXIgPSBfbW9kdWxlLmNvbnRyb2xsZXIoXCJEYXNoYm9hcmQuU2hhcmVDb250cm9sbGVyXCIsIFtcIiRzY29wZVwiLCBcIiRsb2NhdGlvblwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgKCRzY29wZSwgJGxvY2F0aW9uLCAkcm91dGVQYXJhbXMsIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSkgPT4ge1xuICAgIHZhciBpZCA9ICRyb3V0ZVBhcmFtc1tcImRhc2hib2FyZElkXCJdO1xuICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkKGlkLCBvbkRhc2hib2FyZExvYWQpO1xuXG4gICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICBtb2RlOiB7XG4gICAgICAgICAgbmFtZTogXCJqYXZhc2NyaXB0XCJcbiAgICAgIH1cbiAgICB9O1xuICAgIC8vJHNjb3BlLmNvZGVNaXJyb3JPcHRpb25zID0gQ29kZUVkaXRvci5jcmVhdGVFZGl0b3JTZXR0aW5ncyhvcHRpb25zKTtcblxuICAgIGZ1bmN0aW9uIG9uRGFzaGJvYXJkTG9hZChkYXNoYm9hcmQpIHtcbiAgICAgICRzY29wZS5kYXNoYm9hcmQgPSBEYXNoYm9hcmQuY2xlYW5EYXNoYm9hcmREYXRhKGRhc2hib2FyZCk7XG5cbiAgICAgICRzY29wZS5qc29uID0ge1xuICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiaGF3dGlvIGRhc2hib2FyZHNcIixcbiAgICAgICAgXCJwdWJsaWNcIjogdHJ1ZSxcbiAgICAgICAgXCJmaWxlc1wiOiB7XG4gICAgICAgICAgXCJkYXNoYm9hcmRzLmpzb25cIjoge1xuICAgICAgICAgICAgXCJjb250ZW50XCI6IEpTT04uc3RyaW5naWZ5KCRzY29wZS5kYXNoYm9hcmQsIG51bGwsIFwiICBcIilcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5zb3VyY2UgPSBKU09OLnN0cmluZ2lmeSgkc2NvcGUuZGFzaGJvYXJkLCBudWxsLCBcIiAgXCIpO1xuICAgICAgQ29yZS4kYXBwbHlOb3dPckxhdGVyKCRzY29wZSk7XG4gICAgfVxuICB9XSk7XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
angular.module("hawtio-dashboard-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("plugins/dashboard/html/addToDashboard.html","<div class=\"controller-section\" ng-controller=\"Dashboard.EditDashboardsController\">\n  <div class=\"row-fluid\">\n    <div class=\"span10 offset1 well\">\n      Select a dashboard (or multiple dashboards) in the table below and click \"Add View To Dashboard\" to add the view to a dashboard.  You can also create a new dashboard using the \"Create\" button, select it and then click the \"Add View To Dashboard\" to add the view to a new dashboard.\n    </div>\n  </div>\n  <div class=\"row-fluid\">\n\n    <div class=\"span12\">\n      <ul class=\"nav nav-tabs\">\n        <li>\n          <button class=\"btn btn-primary\" \n                  ng-disabled=\"!hasSelection()\" ng-click=\"addViewToDashboard()\"\n                  title=\"Adds the current view to the selected dashboard(s)\" data-placement=\"bottom\">\n            <i class=\"fa fa-dashboard\"></i> Add View To Dashboard\n          </a>\n        </li>\n\n        <li>\n          <button class=\"btn btn-success\" ng-clck=\"create()\"\n                  title=\"Create a new empty dashboard\" data-placement=\"bottom\">\n            <i class=\"fa fa-plus\"></i> Create\n          </a>\n        </li>\n\n      </ul>\n\n    </div>\n    <!--\n    <div class=\"span6\">\n      <div class=\"control-group\">\n        <input type=\"text\" class=\"span12 search-query\" ng-model=\"gridOptions.filterOptions.filterText\" placeholder=\"Filter...\">\n      </div>\n    </div>\n    -->\n  </div>\n\n  <div class=\"row-fluid\">\n    <table class=\"table table-striped\" hawtio-simple-table=\"gridOptions\"></table>\n  </div>\n</div>\n");
$templateCache.put("plugins/dashboard/html/dashboard.html","<script type=\"text/ng-template\" id=\"widgetTemplate\">\n  <div class=\"widget-area\" data-widgetId=\"{{widget.id}}\">\n    <div class=\"widget-title\">\n      <div class=\"row-fluid\">\n        <div class=\"pull-left\">\n          <editable-property ng-model=\"widget\" property=\"title\" on-save=\"onWidgetRenamed(widget)\"></editable-property>\n        </div>\n        <div class=\"pull-right\">\n          <i class=\"icon-remove\" title=\"Removes this view from the dashboard\" ng-click=\"removeWidget(widget)\"></i>\n        </div>\n      </div>\n    </div>\n    <div class=\"widget-body\">\n    </div>\n  </div>\n</script>\n<script type=\"text/ng-template\" id=\"widgetBlockTemplate.html\">\n  <li class=\"grid-block\" style=\"display: list-item; position: absolute\" ng-non-bindable data-$injector=\"\"></li>\n</script>\n\n<!--\n<div class=\"gridster\" ng-controller=\"Dashboard.DashboardController\">\n  <ul id=\"widgets\">\n  </ul>\n</div>\n-->\n\n<div class=\"row-fluid\">\n  <div class=\"span12 gridster\">\n    <ul id=\"widgets\" hawtio-dashboard></ul>\n  </div>\n</div>\n\n\n");
$templateCache.put("plugins/dashboard/html/deleteDashboardModal.html","<div class=\"modal-header\">\n  <h3 class=\"modal-title\">Delete Dashboards?</h3>\n</div>\n<div class=\"modal-body\">\n  <p>Are you sure you want to delete the selected dashboards:</p>\n  <ul>\n    <li ng-repeat=\"dashboard in selected track by $index\">{{dashboard.title}}</li>\n  </ul>\n  <p class=\"strong\">This operation cannot be undone</p>\n</div>\n<div class=\"modal-footer\">\n  <button class=\"btn btn-primary\" ng-click=\"ok()\">OK</button>\n  <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n</div>\n");
$templateCache.put("plugins/dashboard/html/editDashboards.html","<script type=\"text/ng-template\" id=\"editDashboardTitleCell.html\">\n  <div class=\"ngCellText\"><a href=\"/dashboard/id/{{row.entity.id}}{{row.entity.hash}}\">{{row.entity.title}}</a></div>\n</script>\n<div ng-controller=\"Dashboard.EditDashboardsController\">\n  <div class=\"row\">\n    <div class=\"col-md-12\">\n      <p></p>\n      <ul class=\"nav nav-tabs\">\n        <li>\n          <button class=\"btn btn-success\" ng-click=\"create()\"\n             title=\"Create a new empty dashboard\"\n             data-placement=\"bottom\">\n            <i class=\"fa fa-plus\"></i> Create</button>\n        </li>\n        <li>\n          <button class=\"btn\" ng-click=\"renameDashboard()\"\n            ng-disabled=\"gridOptions.selectedItems.length !== 1\"\n             title=\"Rename the selected dashboard\"\n             data-placement=\"bottom\">\n            <i class=\"fa fa-arrows-h\"></i> Rename</button>\n        </li>\n        <li>\n          <button class=\"btn\" ng-disabled=\"!hasSelection()\"\n             ng-click=\"duplicate()\"\n                  title=\"Create a copy of the selected dashboard(s)\" data-placement=\"bottom\">\n            <i class=\"fa fa-copy\"></i> Duplicate\n          </button>\n        </li>\n        <li>\n          <button class=\"btn btn-danger\" ng-disabled=\"!hasSelection()\"\n             ng-click=\"deleteDashboard()\">\n             <i class=\"fa fa-remove\"></i> Delete\n          </button>\n        </li>\n        <li class=\"pull-right\">\n          <button class=\"btn btn-primary\" href=\"#/dashboard/import\"\n             title=\"Imports a JSON dashboard configuration from github or some other URL\"\n             data-placement=\"bottom\">\n            <i class=\"fa fa-cloud-download\"></i> Import\n          </button>\n        </li>\n      </ul>\n    </div>\n  </div>\n\n  <div class=\"row\">\n    <div class=\"col-md-12\">\n      <p></p>\n      <table class=\"table table-striped\" hawtio-simple-table=\"gridOptions\"></table>\n    </div>\n  </div>\n\n</div>\n");
$templateCache.put("plugins/dashboard/html/import.html","<div class=\"form-horizontal\" ng-controller=\"Dashboard.ImportController\">\n  <div class=\"control-group\">\n    <button id=\"importButton\" ng-disabled=\"!isValid()\" ng-click=\"importJSON()\"\n            class=\"btn btn-info\"\n            title=\"Imports the JSON configuration of the dashboard\">\n      <i class=\"icon-cloud-download\"></i> import dashboard JSON\n    </button>\n    <div id=\"alert-area\" class=\"span9 pull-right\"></div>\n  </div>\n  <div class=\"control-group\">\n    <textarea id=\"source\" ui-codemirror=\"codeMirrorOptions\" ng-model=\"source\"></textarea>\n  </div>\n</div>");
$templateCache.put("plugins/dashboard/html/renameDashboardModal.html","<div class=\"modal-header\">\n  <h3 class=\"modal-title\">Rename Dashboard \"{{selected.title}}\"</h3>\n</div>\n<div class=\"modal-body\">\n  <div hawtio-form-2=\"config\" entity=\"selected\"></div>\n</div>\n<div class=\"modal-footer\">\n  <button class=\"btn btn-primary\" ng-click=\"ok()\">OK</button>\n  <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n</div>\n");}]); hawtioPluginLoader.addModule("hawtio-dashboard-templates");