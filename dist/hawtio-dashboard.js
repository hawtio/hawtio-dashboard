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
    Dashboard._module.config(["$routeProvider", "$provide", function ($routeProvider, $provide) {
        $provide.decorator('HawtioDashboard', ['$delegate', function ($delegate) {
            $delegate['getAddLink'] = function () {
                var target = new URI('/dashboard/add');
                var currentUri = new URI();
                currentUri.removeQuery('main-tab');
                currentUri.removeQuery('sub-tab');
                var widgetUri = new URI(currentUri.path());
                widgetUri.query(currentUri.query(true));
                target.query({
                    href: widgetUri.toString().escapeURL()
                });
                return target.toString();
            };
            return $delegate;
        }]);
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
        Dashboard.log.debug("Updating sub-tabs");
        if (!tab.tabs) {
            tab.tabs = [];
        }
        else {
            tab.tabs.length = 0;
        }
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
        tab.tabs.forEach(function (tab) {
            tab.isSelected = function () {
                var id = tab.id.replace('dashboard-', '');
                var uri = new URI();
                return uri.query(true)['sub-tab'] === tab.id || _.endsWith(uri.path(), id);
            };
        });
        Core.$apply($rootScope);
    }
    Dashboard.setSubTabs = setSubTabs;
    Dashboard._module.run(["HawtioNav", "dashboardRepository", "$rootScope", "HawtioDashboard", "$timeout", function (nav, dashboards, $rootScope, dash, $timeout) {
        if (!dash.inDashboard) {
            var builder = nav.builder();
            tab = builder.id(Dashboard.pluginName).href(function () { return '/dashboard/idx/0'; }).title(function () { return 'Dashboard'; }).build();
            nav.add(tab);
            $timeout(function () {
                dashboards.getDashboards(function (dashboards) {
                    setSubTabs(builder, dashboards, $rootScope);
                });
            }, 500);
        }
    }]);
    hawtioPluginLoader.addModule(Dashboard.pluginName);
})(Dashboard || (Dashboard = {}));

var Dashboard;
(function (Dashboard) {
    Dashboard._module.factory('dashboardRepository', ['DefaultDashboards', function (defaults) {
        return new LocalDashboardRepository(defaults);
    }]);
    Dashboard._module.factory('DefaultDashboards', [function () {
        var defaults = [];
        var answer = {
            add: function (dashboard) {
                defaults.push(dashboard);
            },
            remove: function (id) {
                return _.remove(defaults, function (dashboard) { return dashboard.id === id; });
            },
            getAll: function () { return defaults; }
        };
        return answer;
    }]);
    var LocalDashboardRepository = (function () {
        function LocalDashboardRepository(defaults) {
            this.defaults = defaults;
            this.localStorage = null;
            this.localStorage = Core.getLocalStorage();
        }
        LocalDashboardRepository.prototype.loadDashboards = function () {
            var answer = angular.fromJson(localStorage['userDashboards']);
            if (!answer || answer.length === 0) {
                answer = this.defaults.getAll();
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
                    cellTemplate: $templateCache.get(UrlHelpers.join(Dashboard.templatePath, 'editDashboardTitleCell.html'))
                },
                {
                    field: 'group',
                    displayName: 'Group'
                }
            ],
        };
        var doUpdate = _.debounce(updateData, 10);
        $timeout(doUpdate, 10);
        $scope.$on("$routeChangeSuccess", function (event, current, previous) {
            $timeout(doUpdate, 10);
        });
        $scope.addViewToDashboard = function () {
            var nextHref = null;
            var selected = $scope.gridOptions.selectedItems;
            var currentUrl = new URI();
            var config = currentUrl.query(true);
            var href = config['href'];
            var iframe = config['iframe'];
            var type = 'href';
            if (href) {
                href = href.unescapeURL();
                href = Core.trimLeading(href, '#');
            }
            else if (iframe) {
                iframe = iframe.unescapeURL();
                type = 'iframe';
            }
            var widgetURI = undefined;
            switch (type) {
                case 'href':
                    Dashboard.log.debug("href: ", href);
                    widgetURI = new URI(href);
                    break;
                case 'iframe':
                    Dashboard.log.debug("iframe: ", iframe);
                    widgetURI = new URI(iframe);
                    break;
                default:
                    Dashboard.log.debug("type unknown");
                    return;
            }
            var sizeStr = config['size'];
            if (sizeStr) {
                sizeStr = sizeStr.unescapeURL();
            }
            var size = angular.fromJson(sizeStr) || { size_x: 1, size_y: 1 };
            var title = (config['title'] || '').unescapeURL();
            var templateWidget = {
                id: undefined,
                row: 1,
                col: 1,
                size_x: size.size_x,
                size_y: size.size_y,
                title: title
            };
            angular.forEach(selected, function (selectedItem) {
                var widget = _.cloneDeep(templateWidget);
                if (!selectedItem.widgets) {
                    selectedItem.widgets = [];
                }
                var nextNumber = selectedItem.widgets.length + 1;
                widget.id = 'w' + nextNumber;
                Dashboard.log.debug("widgetURI: ", widgetURI.toString());
                switch (type) {
                    case 'iframe':
                        widget = _.extend({
                            iframe: iframe
                        }, widget);
                        break;
                    case 'href':
                        var text = widgetURI.path();
                        var search = widgetURI.query(true);
                        if ($route && $route.routes) {
                            var value = $route.routes[text];
                            if (value) {
                                var templateUrl = value["templateUrl"];
                                if (templateUrl) {
                                    widget = _.extend({
                                        path: text,
                                        include: templateUrl,
                                        search: search,
                                        hash: ""
                                    }, widget);
                                }
                            }
                            else {
                                return;
                            }
                        }
                        break;
                }
                var gridWidth = 0;
                selectedItem.widgets.forEach(function (w) {
                    var rightSide = w.col + w.size_x;
                    if (rightSide > gridWidth) {
                        gridWidth = rightSide;
                    }
                });
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
                    }).removeQuery('href').removeQuery('title').removeQuery('iframe').removeQuery('size');
                }
            });
            var commitMessage = "Add widget";
            dashboardRepository.putDashboards(selected, commitMessage, function (dashboards) {
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
            this.controller = ["$scope", "$element", "$attrs", "$location", "$routeParams", "$templateCache", "dashboardRepository", "$compile", "$templateRequest", "$interpolate", "$modal", "$sce", function ($scope, $element, $attrs, $location, $routeParams, $templateCache, dashboardRepository, $compile, $templateRequest, $interpolate, $modal, $sce) {
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
                setTimeout(updateWidgets, 10);
                function removeWidget(widget) {
                    var gridster = getGridster();
                    var widgetElem = null;
                    var widgetData = $scope.widgetMap[widget.id];
                    if (widgetData) {
                        delete $scope.widgetMap[widget.id];
                        widgetElem = widgetData.widget;
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
                }
                ;
                function changeWidgetSize(widget, sizefunc, savefunc) {
                    if (!widget) {
                        Dashboard.log.debug("widget undefined");
                        return;
                    }
                    var gridster = getGridster();
                    Dashboard.log.debug("Widget ID: ", widget.id, " widgetMap: ", $scope.widgetMap);
                    var entry = $scope.widgetMap[widget.id];
                    var w = entry.widget;
                    sizefunc(entry);
                    gridster.resize_widget(w, entry.size_x, entry.size_y);
                    gridster.set_dom_grid_height();
                    setTimeout(function () {
                        savefunc(widget);
                    }, 50);
                }
                function onWidgetRenamed(widget) {
                    updateDashboardRepository("Renamed widget to " + widget.title);
                }
                ;
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
                        if (!widget) {
                            Dashboard.log.debug("Undefined widget, skipping");
                            return;
                        }
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
                    function doRemoveWidget($modal, widget) {
                        Dashboard.log.debug("Remove widget: ", widget);
                        var modal = $modal.open({
                            templateUrl: UrlHelpers.join(Dashboard.templatePath, 'deleteWidgetModal.html'),
                            controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                                $scope.widget = widget;
                                $scope.ok = function () {
                                    modal.close();
                                    removeWidget($scope.widget);
                                };
                                $scope.cancel = function () {
                                    modal.dismiss();
                                };
                            }]
                        });
                    }
                    function doRenameWidget($modal, widget) {
                        Dashboard.log.debug("Rename widget: ", widget);
                        var modal = $modal.open({
                            templateUrl: UrlHelpers.join(Dashboard.templatePath, 'renameWidgetModal.html'),
                            controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                                $scope.widget = widget;
                                $scope.config = {
                                    properties: {
                                        'title': {
                                            type: 'string',
                                            default: widget.title
                                        }
                                    }
                                };
                                $scope.ok = function () {
                                    modal.close();
                                    onWidgetRenamed($scope.widget);
                                };
                                $scope.cancel = function () {
                                    modal.dismiss();
                                };
                            }]
                        });
                    }
                    angular.forEach(widgets, function (widget) {
                        var type = 'internal';
                        if ('iframe' in widget) {
                            type = 'external';
                        }
                        switch (type) {
                            case 'external':
                                var scope = $scope.$new();
                                scope.widget = widget;
                                scope.removeWidget = function (widget) { return doRemoveWidget($modal, widget); };
                                scope.renameWidget = function (widget) { return doRenameWidget($modal, widget); };
                                var widgetBody = angular.element($templateCache.get('iframeWidgetTemplate.html'));
                                var outerDiv = angular.element($templateCache.get('widgetBlockTemplate.html'));
                                widgetBody.find('iframe').attr('src', widget.iframe);
                                outerDiv.append($compile(widgetBody)(scope));
                                var w = gridster.add_widget(outerDiv, widget.size_x, widget.size_y, widget.col, widget.row);
                                $scope.widgetMap[widget.id] = {
                                    widget: w
                                };
                                maybeFinishUp();
                                break;
                            case 'internal':
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
                                if (!widget.size_x || widget.size_x < 1) {
                                    widget.size_x = 1;
                                }
                                if (!widget.size_y || widget.size_y < 1) {
                                    widget.size_y = 1;
                                }
                                var tmpModuleName = 'dashboard-' + widget.id;
                                var tmpModule = angular.module(tmpModuleName, modules);
                                tmpModule.config(['$provide', function ($provide) {
                                    $provide.decorator('HawtioDashboard', ['$delegate', '$rootScope', function ($delegate, $rootScope) {
                                        $delegate.inDashboard = true;
                                        return $delegate;
                                    }]);
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
                                tmpModule.controller('HawtioDashboard.Title', ["$scope", "$modal", function ($scope, $modal) {
                                    $scope.widget = widget;
                                    $scope.removeWidget = function (widget) { return doRemoveWidget($modal, widget); };
                                    $scope.renameWidget = function (widget) { return doRenameWidget($modal, widget); };
                                }]);
                                var div = $(template);
                                div.attr({ 'data-widgetId': widget.id });
                                var body = div.find('.widget-body');
                                var widgetBody = $templateRequest(widget.include);
                                widgetBody.then(function (widgetBody) {
                                    var outerDiv = angular.element($templateCache.get('widgetBlockTemplate.html'));
                                    body.html(widgetBody);
                                    outerDiv.html(div);
                                    angular.bootstrap(div, [tmpModuleName]);
                                    var w = gridster.add_widget(outerDiv, widget.size_x, widget.size_y, widget.col, widget.row);
                                    $scope.widgetMap[widget.id] = {
                                        widget: w
                                    };
                                    maybeFinishUp();
                                });
                                break;
                        }
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
                    var blocks = $('.grid-block');
                    blocks.resizable('destroy');
                    blocks.resizable({
                        grid: [gridSize + (gridMargin * 2), gridSize + (gridMargin * 2)],
                        animate: false,
                        minWidth: gridSize,
                        minHeight: gridSize,
                        autoHide: false,
                        start: function (event, ui) {
                            gridHeight = getGridster().$el.height();
                        },
                        resize: function (event, ui) {
                            var g = getGridster();
                            var delta = gridSize + gridMargin * 2;
                            if (event.offsetY > g.$el.height()) {
                                var extra = Math.floor((event.offsetY - gridHeight) / delta + 1);
                                var newHeight = gridHeight + extra * delta;
                                g.$el.css('height', newHeight);
                            }
                        },
                        stop: function (event, ui) {
                            var resized = $(this);
                            setTimeout(function () {
                                resizeBlock(resized);
                            }, 300);
                        }
                    });
                    $('.ui-resizable-handle').hover(function () {
                        getGridster().disable();
                    }, function () {
                        getGridster().enable();
                    });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluY2x1ZGVzLmpzIiwiL2hvbWUvdWJ1bnR1L2hhd3Rpby1kYXNoYm9hcmQvZGFzaGJvYXJkL3RzL2Rhc2hib2FyZEludGVyZmFjZXMudHMiLCIvaG9tZS91YnVudHUvaGF3dGlvLWRhc2hib2FyZC9kYXNoYm9hcmQvdHMvZGFzaGJvYXJkSGVscGVycy50cyIsIi9ob21lL3VidW50dS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9kYXNoYm9hcmRQbHVnaW4udHMiLCIvaG9tZS91YnVudHUvaGF3dGlvLWRhc2hib2FyZC9kYXNoYm9hcmQvdHMvZGFzaGJvYXJkUmVwb3NpdG9yeS50cyIsIi9ob21lL3VidW50dS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9lZGl0RGFzaGJvYXJkcy50cyIsIi9ob21lL3VidW50dS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9yZWN0YW5nbGVMb2NhdGlvbi50cyIsIi9ob21lL3VidW50dS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9ncmlkc3RlckRpcmVjdGl2ZS50cyIsIi9ob21lL3VidW50dS9oYXd0aW8tZGFzaGJvYXJkL2Rhc2hib2FyZC90cy9pbXBvcnQudHMiLCIvaG9tZS91YnVudHUvaGF3dGlvLWRhc2hib2FyZC9kYXNoYm9hcmQvdHMvbmF2YmFyLnRzIiwiL2hvbWUvdWJ1bnR1L2hhd3Rpby1kYXNoYm9hcmQvZGFzaGJvYXJkL3RzL3NoYXJlLnRzIl0sIm5hbWVzIjpbIkRhc2hib2FyZCIsIkRhc2hib2FyZC5jbGVhbkRhc2hib2FyZERhdGEiLCJEYXNoYm9hcmQuZGVjb2RlVVJJQ29tcG9uZW50UHJvcGVydGllcyIsIkRhc2hib2FyZC5vbk9wZXJhdGlvbkNvbXBsZXRlIiwiRGFzaGJvYXJkLnNldFN1YlRhYnMiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5IiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5jb25zdHJ1Y3RvciIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkubG9hZERhc2hib2FyZHMiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5LnN0b3JlRGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZGVsZXRlRGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkIiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5jcmVhdGVEYXNoYm9hcmQiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5LmNsb25lRGFzaGJvYXJkIiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlIiwiRGFzaGJvYXJkLnVwZGF0ZURhdGEiLCJEYXNoYm9hcmQuZGFzaGJvYXJkTG9hZGVkIiwiRGFzaGJvYXJkLmRhc2hib2FyZHMiLCJEYXNoYm9hcmQuZGVzZWxlY3RBbGwiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24iLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uY29uc3RydWN0b3IiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uYWJzVXJsIiwiRGFzaGJvYXJkLlJlY3RhbmdsZUxvY2F0aW9uLmhhc2giLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uaG9zdCIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbi5wYXRoIiwiRGFzaGJvYXJkLlJlY3RhbmdsZUxvY2F0aW9uLnBvcnQiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24ucHJvdG9jb2wiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24ucmVwbGFjZSIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbi5zZWFyY2giLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24udXJsIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLnJlbW92ZVdpZGdldCIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5jaGFuZ2VXaWRnZXRTaXplIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLm9uV2lkZ2V0UmVuYW1lZCIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci51cGRhdGVXaWRnZXRzIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLm9uRGFzaGJvYXJkTG9hZCIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5vbkRhc2hib2FyZExvYWQubWF5YmVGaW5pc2hVcCIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5vbkRhc2hib2FyZExvYWQuZG9SZW1vdmVXaWRnZXQiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3Iub25EYXNoYm9hcmRMb2FkLmRvUmVuYW1lV2lkZ2V0IiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLnNlcmlhbGl6ZURhc2hib2FyZCIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5tYWtlUmVzaXphYmxlIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLnJlc2l6ZUJsb2NrIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLnVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3IuZ2V0R3JpZHN0ZXIiLCJEYXNoYm9hcmQubG9hZERhc2hib2FyZHMiLCJEYXNoYm9hcmQub25EYXNoYm9hcmRMb2FkIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FDb0RDOztBQ2hERCxJQUFPLFNBQVMsQ0E0Q2Y7QUE1Q0QsV0FBTyxTQUFTLEVBQUMsQ0FBQztJQUVMQSxhQUFHQSxHQUFrQkEsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0E7SUFVeERBLFNBQWdCQSxrQkFBa0JBLENBQUNBLElBQUlBO1FBQ3JDQyxJQUFJQSxTQUFTQSxHQUFHQSxFQUFFQSxDQUFDQTtRQUNuQkEsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsRUFBRUEsVUFBQ0EsS0FBS0EsRUFBRUEsR0FBR0E7WUFDL0JBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLFFBQVFBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLFVBQVVBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLFVBQVVBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUM3RUEsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0E7WUFDekJBLENBQUNBO1FBQ0hBLENBQUNBLENBQUNBLENBQUNBO1FBQ0hBLE1BQU1BLENBQUNBLFNBQVNBLENBQUNBO0lBQ25CQSxDQUFDQTtJQVJlRCw0QkFBa0JBLEdBQWxCQSxrQkFRZkEsQ0FBQUE7SUFVREEsU0FBZ0JBLDRCQUE0QkEsQ0FBQ0EsSUFBSUE7UUFDL0NFLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO1lBQ1ZBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO1FBQ2RBLENBQUNBO1FBQ0RBLElBQUlBLFVBQVVBLEdBQUdBLEVBQUVBLENBQUNBO1FBQ3BCQSxPQUFPQSxDQUFDQSxPQUFP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QSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDbEJBLE1BQU1BLEdBQUdBLE1BQU1BLENBQUNBLFdBQVdBLEVBQUVBLENBQUNBO2dCQUM5QkEsSUFBSUEsR0FBR0EsUUFBUUEsQ0FBQ0E7WUFDbEJBLENBQUNBO1lBQ0RBLElBQUlBLFNBQVNBLEdBQVNBLFNBQVNBLENBQUNBO1lBQ2hDQSxNQUFNQSxDQUFBQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDWkEsS0FBS0EsTUFBTUE7b0JBQ1RBLGFBQUdBLENBQUNBLEtBQUtBLENBQUNBLFFBQVFBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO29CQUMxQkEsU0FBU0EsR0FBR0EsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7b0JBQzFCQSxLQUFLQSxDQUFDQTtnQkFDUkEsS0FBS0EsUUFBUUE7b0JBQ1hBLGFBQUdBLENBQUNBLEtBQUtBLENBQUNBLFVBQVVBLEVBQUVBLE1BQU1BLENBQUNBLENBQUNBO29CQUM5QkEsU0FBU0EsR0FBR0EsSUFBSUEsR0FBR0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7b0JBQzVCQSxLQUFLQSxDQUFDQTtnQkFDUkE7b0JBQ0VBLGFBQUdBLENBQUNBLEtBQUtBLENBQUNBLGNBQWNBLENBQUNBLENBQUNBO29CQUMxQkEsTUFBTUEsQ0FBQ0E7WUFDWEEsQ0FBQ0E7WUFDREEsSUFBSUEsT0FBT0EsR0FBU0EsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7WUFDbkNBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBO2dCQUNaQSxPQUFPQSxHQUFHQSxPQUFPQSxDQUFDQSxXQUFXQSxFQUFFQSxDQUFDQTtZQUNsQ0EsQ0FBQ0E7WUFDREEsSUFBSUEsSUFBSUEsR0FBR0EsT0FBT0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsRUFBRUEsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsTUFBTUEsRUFBRUEsQ0FB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Q0E7cUJBQ3hEQTtpQkFDRkE7YUFDRkEsQ0FBQ0E7WUFFRkEsTUFBTUEsQ0FBQ0EsTUFBTUEsR0FBR0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsU0FBU0EsRUFBRUEsSUFBSUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDN0RBLElBQUlBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7UUFDaENBLENBQUNBO0lBQ0gvQyxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtBQUNOQSxDQUFDQSxFQTdCTSxTQUFTLEtBQVQsU0FBUyxRQTZCZiIsImZpbGUiOiJjb21waWxlZC5qcyIsInNvdXJjZXNDb250ZW50IjpbbnVsbCwibW9kdWxlIERhc2hib2FyZCB7XG5cbiAgZXhwb3J0IGludGVyZmFjZSBEYXNoYm9hcmRTZXJ2aWNlIHtcbiAgICBpbkRhc2hib2FyZDpib29sZWFuO1xuICAgIGdldEFkZExpbmsoKTpzdHJpbmc7XG4gIH1cblxuICBleHBvcnQgaW50ZXJmYWNlIFNlYXJjaE1hcCB7XG4gICAgW25hbWU6IHN0cmluZ106IHN0cmluZztcbiAgfVxuXG4gIGV4cG9ydCBpbnRlcmZhY2UgRGFzaGJvYXJkV2lkZ2V0IHtcbiAgICBpZDogc3RyaW5nO1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgcm93PzogbnVtYmVyO1xuICAgIGNvbD86IG51bWJlcjtcbiAgICBzaXplX3g/OiBudW1iZXI7XG4gICAgc2l6ZV95PzogbnVtYmVyO1xuICAgIHBhdGg/OiBzdHJpbmc7XG4gICAgdXJsPzogc3RyaW5nO1xuICAgIGluY2x1ZGU/OiBzdHJpbmc7XG4gICAgc2VhcmNoPzogU2VhcmNoTWFwXG4gICAgcm91dGVQYXJhbXM/OiBzdHJpbmc7XG4gIH1cblxuICBleHBvcnQgaW50ZXJmYWNlIERhc2hib2FyZCB7XG4gICAgaWQ6IHN0cmluZztcbiAgICB0aXRsZTogc3RyaW5nO1xuICAgIGdyb3VwOiBzdHJpbmc7XG4gICAgd2lkZ2V0czogQXJyYXk8RGFzaGJvYXJkV2lkZ2V0PjtcbiAgfVxuXG4gIGV4cG9ydCBpbnRlcmZhY2UgRGVmYXVsdERhc2hib2FyZHMge1xuICAgIGFkZDogKGRhc2hiYXJkOkRhc2hib2FyZCkgPT4gdm9pZDtcbiAgICByZW1vdmU6IChpZDpzdHJpbmcpID0+IERhc2hib2FyZDtcbiAgICBnZXRBbGw6ICgpID0+IEFycmF5PERhc2hib2FyZD47XG4gIH1cblxuICAvKipcbiAgICogQmFzZSBpbnRlcmZhY2UgdGhhdCBkYXNoYm9hcmQgcmVwb3NpdG9yaWVzIG11c3QgaW1wbGVtZW50XG4gICAqXG4gICAqIEBjbGFzcyBEYXNoYm9hcmRSZXBvc2l0b3J5XG4gICAqL1xuICBleHBvcnQgaW50ZXJmYWNlIERhc2hib2FyZFJlcG9zaXRvcnkge1xuICAgIHB1dERhc2hib2FyZHM6IChhcnJheTphbnlbXSwgY29tbWl0TWVzc2FnZTpzdHJpbmcsIGZuKSA9PiBhbnk7XG4gICAgZGVsZXRlRGFzaGJvYXJkczogKGFycmF5OkFycmF5PERhc2hib2FyZD4sIGZuKSA9PiBhbnk7XG4gICAgZ2V0RGFzaGJvYXJkczogKGZuOihkYXNoYm9hcmRzOiBBcnJheTxEYXNoYm9hcmQ+KSA9PiB2b2lkKSA9PiB2b2lkO1xuICAgIGdldERhc2hib2FyZDogKGlkOnN0cmluZywgZm46IChkYXNoYm9hcmQ6IERhc2hib2FyZCkgPT4gdm9pZCkgPT4gYW55O1xuICAgIGNyZWF0ZURhc2hib2FyZDogKG9wdGlvbnM6YW55KSA9PiBhbnk7XG4gICAgY2xvbmVEYXNoYm9hcmQ6KGRhc2hib2FyZDphbnkpID0+IGFueTtcbiAgICBnZXRUeXBlOigpID0+IHN0cmluZztcbiAgfVxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vaW5jbHVkZXMudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkSW50ZXJmYWNlcy50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG5cbiAgZXhwb3J0IHZhciBsb2c6TG9nZ2luZy5Mb2dnZXIgPSBMb2dnZXIuZ2V0KCdEYXNoYm9hcmQnKTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY2xlYW5lZCB1cCB2ZXJzaW9uIG9mIHRoZSBkYXNoYm9hcmQgZGF0YSB3aXRob3V0IGFueSBVSSBzZWxlY3Rpb24gc3RhdGVcbiAgICogQG1ldGhvZCBjbGVhbkRhc2hib2FyZERhdGFcbiAgICogQHN0YXRpY1xuICAgKiBAZm9yIERhc2hib2FyZFxuICAgKiBAcGFyYW0ge2FueX0gaXRlbVxuICAgKiBAcmV0dXJuIHthbnl9XG4gICAqL1xuICBleHBvcnQgZnVuY3Rpb24gY2xlYW5EYXNoYm9hcmREYXRhKGl0ZW0pIHtcbiAgICB2YXIgY2xlYW5JdGVtID0ge307XG4gICAgYW5ndWxhci5mb3JFYWNoKGl0ZW0sICh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICBpZiAoIWFuZ3VsYXIuaXNTdHJpbmcoa2V5KSB8fCAoIWtleS5zdGFydHNXaXRoKFwiJFwiKSAmJiAha2V5LnN0YXJ0c1dpdGgoXCJfXCIpKSkge1xuICAgICAgICBjbGVhbkl0ZW1ba2V5XSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBjbGVhbkl0ZW07XG4gIH1cblxuICAvKipcbiAgICogUnVucyBkZWNvZGVVUklDb21wb25lbnQoKSBvbiBlYWNoIHZhbHVlIGluIHRoZSBvYmplY3RcbiAgICogQG1ldGhvZCBkZWNvZGVVUklDb21wb25lbnRQcm9wZXJ0aWVzXG4gICAqIEBzdGF0aWNcbiAgICogQGZvciBEYXNoYm9hcmRcbiAgICogQHBhcmFtIHthbnl9IGhhc2hcbiAgICogQHJldHVybiB7YW55fVxuICAgKi9cbiAgZXhwb3J0IGZ1bmN0aW9uIGRlY29kZVVSSUNvbXBvbmVudFByb3BlcnRpZXMoaGFzaCkge1xuICAgIGlmICghaGFzaCkge1xuICAgICAgcmV0dXJuIGhhc2g7XG4gICAgfVxuICAgIHZhciBkZWNvZGVIYXNoID0ge307XG4gICAgYW5ndWxhci5mb3JFYWNoKGhhc2gsICh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICBkZWNvZGVIYXNoW2tleV0gPSB2YWx1ZSA/IGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkgOiB2YWx1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVjb2RlSGFzaDtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBvbk9wZXJhdGlvbkNvbXBsZXRlKHJlc3VsdCkge1xuICAgIGNvbnNvbGUubG9nKFwiQ29tcGxldGVkIGFkZGluZyB0aGUgZGFzaGJvYXJkIHdpdGggcmVzcG9uc2UgXCIgKyBKU09OLnN0cmluZ2lmeShyZXN1bHQpKTtcbiAgfVxufVxuIiwiLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICogQG1haW4gRGFzaGJvYXJkXG4gKi9cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRIZWxwZXJzLnRzXCIvPlxubW9kdWxlIERhc2hib2FyZCB7XG4gIFxuICBleHBvcnQgdmFyIHRlbXBsYXRlUGF0aCA9ICdwbHVnaW5zL2Rhc2hib2FyZC9odG1sLyc7XG4gIGV4cG9ydCB2YXIgcGx1Z2luTmFtZSA9ICdkYXNoYm9hcmQnO1xuICBcbiAgZXhwb3J0IHZhciBfbW9kdWxlID0gYW5ndWxhci5tb2R1bGUocGx1Z2luTmFtZSwgW10pO1xuXG4gIF9tb2R1bGUuY29uZmlnKFtcIiRyb3V0ZVByb3ZpZGVyXCIsIFwiJHByb3ZpZGVcIiwgKCRyb3V0ZVByb3ZpZGVyLCAkcHJvdmlkZSkgPT4ge1xuXG4gICAgJHByb3ZpZGUuZGVjb3JhdG9yKCdIYXd0aW9EYXNoYm9hcmQnLCBbJyRkZWxlZ2F0ZScsICgkZGVsZWdhdGUpID0+IHtcbiAgICAgICRkZWxlZ2F0ZVsnZ2V0QWRkTGluayddID0gKCkgPT4ge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gbmV3IFVSSSgnL2Rhc2hib2FyZC9hZGQnKTtcbiAgICAgICAgdmFyIGN1cnJlbnRVcmkgPSBuZXcgVVJJKCk7XG4gICAgICAgIGN1cnJlbnRVcmkucmVtb3ZlUXVlcnkoJ21haW4tdGFiJyk7XG4gICAgICAgIGN1cnJlbnRVcmkucmVtb3ZlUXVlcnkoJ3N1Yi10YWInKTtcbiAgICAgICAgdmFyIHdpZGdldFVyaSA9IG5ldyBVUkkoY3VycmVudFVyaS5wYXRoKCkpO1xuICAgICAgICB3aWRnZXRVcmkucXVlcnkoY3VycmVudFVyaS5xdWVyeSh0cnVlKSk7XG4gICAgICAgIHRhcmdldC5xdWVyeSh7XG4gICAgICAgICAgaHJlZjogd2lkZ2V0VXJpLnRvU3RyaW5nKCkuZXNjYXBlVVJMKClcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0YXJnZXQudG9TdHJpbmcoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAkZGVsZWdhdGU7XG4gICAgfV0pO1xuXG4gICAgJHJvdXRlUHJvdmlkZXIuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2FkZCcsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdhZGRUb0Rhc2hib2FyZC5odG1sJ30pLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9lZGl0Jywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2VkaXREYXNoYm9hcmRzLmh0bWwnfSkuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2lkeC86ZGFzaGJvYXJkSW5kZXgnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnZGFzaGJvYXJkLmh0bWwnLCByZWxvYWRPblNlYXJjaDogZmFsc2UgfSkuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2lkLzpkYXNoYm9hcmRJZCcsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdkYXNoYm9hcmQuaHRtbCcsIHJlbG9hZE9uU2VhcmNoOiBmYWxzZSB9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvaWQvOmRhc2hib2FyZElkL3NoYXJlJywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ3NoYXJlLmh0bWwnfSkuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2ltcG9ydCcsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdpbXBvcnQuaHRtbCd9KTtcbiAgfV0pO1xuXG4gIF9tb2R1bGUudmFsdWUoJ3VpLmNvbmZpZycsIHtcbiAgICAvLyBUaGUgdWktanEgZGlyZWN0aXZlIG5hbWVzcGFjZVxuICAgIGpxOiB7XG4gICAgICBncmlkc3Rlcjoge1xuICAgICAgICB3aWRnZXRfbWFyZ2luczogWzEwLCAxMF0sXG4gICAgICAgIHdpZGdldF9iYXNlX2RpbWVuc2lvbnM6IFsxNDAsIDE0MF1cbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIHZhciB0YWIgPSB1bmRlZmluZWQ7XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIHNldFN1YlRhYnMoYnVpbGRlciwgZGFzaGJvYXJkczpBcnJheTxEYXNoYm9hcmQ+LCAkcm9vdFNjb3BlKSB7XG4gICAgbG9nLmRlYnVnKFwiVXBkYXRpbmcgc3ViLXRhYnNcIik7XG4gICAgaWYgKCF0YWIudGFicykge1xuICAgICAgdGFiLnRhYnMgPSBbXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGFiLnRhYnMubGVuZ3RoID0gMDtcbiAgICB9XG4gICAgXy5mb3JFYWNoKGRhc2hib2FyZHMsIChkYXNoYm9hcmQpID0+IHtcbiAgICAgIHZhciBjaGlsZCA9IGJ1aWxkZXJcbiAgICAgICAgLmlkKCdkYXNoYm9hcmQtJyArIGRhc2hib2FyZC5pZClcbiAgICAgICAgLnRpdGxlKCgpID0+IGRhc2hib2FyZC50aXRsZSB8fCBkYXNoYm9hcmQuaWQpXG4gICAgICAgIC5ocmVmKCgpID0+IHtcbiAgICAgICAgICB2YXIgdXJpID0gbmV3IFVSSShVcmxIZWxwZXJzLmpvaW4oJy9kYXNoYm9hcmQvaWQnLCBkYXNoYm9hcmQuaWQpKVxuICAgICAgICAgICAgdXJpLnNlYXJjaCh7XG4gICAgICAgICAgICAgICdtYWluLXRhYic6IHBsdWdpbk5hbWUsXG4gICAgICAgICAgICAgICdzdWItdGFiJzogJ2Rhc2hib2FyZC0nICsgZGFzaGJvYXJkLmlkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gdXJpLnRvU3RyaW5nKCk7XG4gICAgICAgIH0pXG4gICAgICAuYnVpbGQoKTtcbiAgICAgIHRhYi50YWJzLnB1c2goY2hpbGQpO1xuICAgIH0pO1xuICAgIHZhciBtYW5hZ2UgPSBidWlsZGVyXG4gICAgICAuaWQoJ2Rhc2hib2FyZC1tYW5hZ2UnKVxuICAgICAgLnRpdGxlKCgpID0+ICc8aSBjbGFzcz1cImZhIGZhLXBlbmNpbFwiPjwvaT4mbmJzcDtNYW5hZ2UnKVxuICAgICAgLmhyZWYoKCkgPT4gJy9kYXNoYm9hcmQvZWRpdD9tYWluLXRhYj1kYXNoYm9hcmQmc3ViLXRhYj1kYXNoYm9hcmQtbWFuYWdlJylcbiAgICAgIC5idWlsZCgpO1xuICAgIHRhYi50YWJzLnB1c2gobWFuYWdlKTtcbiAgICB0YWIudGFicy5mb3JFYWNoKCh0YWIpID0+IHtcbiAgICAgIHRhYi5pc1NlbGVjdGVkID0gKCkgPT4ge1xuICAgICAgICB2YXIgaWQgPSB0YWIuaWQucmVwbGFjZSgnZGFzaGJvYXJkLScsICcnKTtcbiAgICAgICAgdmFyIHVyaSA9IG5ldyBVUkkoKTtcbiAgICAgICAgcmV0dXJuIHVyaS5xdWVyeSh0cnVlKVsnc3ViLXRhYiddID09PSB0YWIuaWQgfHwgXy5lbmRzV2l0aCh1cmkucGF0aCgpLCBpZCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgQ29yZS4kYXBwbHkoJHJvb3RTY29wZSk7XG4gIH1cblxuICBfbW9kdWxlLnJ1bihbXCJIYXd0aW9OYXZcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsIFwiJHJvb3RTY29wZVwiLCBcIkhhd3Rpb0Rhc2hib2FyZFwiLCBcIiR0aW1lb3V0XCIsIChuYXY6SGF3dGlvTWFpbk5hdi5SZWdpc3RyeSwgZGFzaGJvYXJkczpEYXNoYm9hcmRSZXBvc2l0b3J5LCAkcm9vdFNjb3BlLCBkYXNoOkRhc2hib2FyZFNlcnZpY2UsICR0aW1lb3V0KSA9PiB7XG4gICAgLy8gc3BlY2lhbCBjYXNlIGhlcmUsIHdlIGRvbid0IHdhbnQgdG8gb3ZlcndyaXRlIG91ciBzdG9yZWQgdGFiIVxuICAgIGlmICghZGFzaC5pbkRhc2hib2FyZCkge1xuICAgICAgdmFyIGJ1aWxkZXIgPSBuYXYuYnVpbGRlcigpO1xuICAgICAgdGFiID0gYnVpbGRlci5pZChwbHVnaW5OYW1lKVxuICAgICAgICAuaHJlZigoKSA9PiAnL2Rhc2hib2FyZC9pZHgvMCcpXG4gICAgICAgIC50aXRsZSgoKSA9PiAnRGFzaGJvYXJkJylcbiAgICAgICAgLmJ1aWxkKCk7XG4gICAgICBuYXYuYWRkKHRhYik7XG4gICAgICAkdGltZW91dCgoKSA9PiB7XG4gICAgICAgIGRhc2hib2FyZHMuZ2V0RGFzaGJvYXJkcygoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAgIHNldFN1YlRhYnMoYnVpbGRlciwgZGFzaGJvYXJkcywgJHJvb3RTY29wZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSwgNTAwKTtcbiAgICB9XG4gIH1dKTtcblxuICBoYXd0aW9QbHVnaW5Mb2FkZXIuYWRkTW9kdWxlKHBsdWdpbk5hbWUpO1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRJbnRlcmZhY2VzLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcblxuICBfbW9kdWxlLmZhY3RvcnkoJ2Rhc2hib2FyZFJlcG9zaXRvcnknLCBbJ0RlZmF1bHREYXNoYm9hcmRzJywgKGRlZmF1bHRzOkRlZmF1bHREYXNoYm9hcmRzKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBMb2NhbERhc2hib2FyZFJlcG9zaXRvcnkoZGVmYXVsdHMpO1xuICB9XSk7XG5cbiAgX21vZHVsZS5mYWN0b3J5KCdEZWZhdWx0RGFzaGJvYXJkcycsIFsoKSA9PiB7XG4gICAgdmFyIGRlZmF1bHRzID0gPEFycmF5PERhc2hib2FyZD4+W107XG4gICAgdmFyIGFuc3dlciA9IHtcbiAgICAgIGFkZDogKGRhc2hib2FyZDpEYXNoYm9hcmQpID0+IHtcbiAgICAgICAgZGVmYXVsdHMucHVzaChkYXNoYm9hcmQpO1xuICAgICAgfSxcbiAgICAgIHJlbW92ZTogKGlkOnN0cmluZykgPT4ge1xuICAgICAgICByZXR1cm4gXy5yZW1vdmUoZGVmYXVsdHMsIChkYXNoYm9hcmQpID0+IGRhc2hib2FyZC5pZCA9PT0gaWQpO1xuICAgICAgfSxcbiAgICAgIGdldEFsbDogKCkgPT4gZGVmYXVsdHNcbiAgICB9XG4gICAgcmV0dXJuIGFuc3dlcjtcbiAgfV0pO1xuXG4gIC8qKlxuICAgKiBAY2xhc3MgTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5XG4gICAqIEB1c2VzIERhc2hib2FyZFJlcG9zaXRvcnlcbiAgICovXG4gIGV4cG9ydCBjbGFzcyBMb2NhbERhc2hib2FyZFJlcG9zaXRvcnkgaW1wbGVtZW50cyBEYXNoYm9hcmRSZXBvc2l0b3J5IHtcblxuICAgIHByaXZhdGUgbG9jYWxTdG9yYWdlOldpbmRvd0xvY2FsU3RvcmFnZSA9IG51bGw7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGRlZmF1bHRzOkRlZmF1bHREYXNoYm9hcmRzKSB7XG4gICAgICB0aGlzLmxvY2FsU3RvcmFnZSA9IENvcmUuZ2V0TG9jYWxTdG9yYWdlKCk7XG4gICAgICAvKlxuICAgICAgaWYgKCd1c2VyRGFzaGJvYXJkcycgaW4gdGhpcy5sb2NhbFN0b3JhZ2UpIHtcbiAgICAgICAgbG9nLmRlYnVnKFwiRm91bmQgcHJldmlvdXNseSBzYXZlZCBkYXNoYm9hcmRzXCIpO1xuICAgICAgICBpZiAodGhpcy5sb2FkRGFzaGJvYXJkcygpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHRoaXMuc3RvcmVEYXNoYm9hcmRzKGRlZmF1bHRzLmdldEFsbCgpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zdG9yZURhc2hib2FyZHMoZGVmYXVsdHMuZ2V0QWxsKCkpO1xuICAgICAgfVxuICAgICAgKi9cbiAgICB9XG5cbiAgICBwcml2YXRlIGxvYWREYXNoYm9hcmRzKCkge1xuICAgICAgdmFyIGFuc3dlciA9IGFuZ3VsYXIuZnJvbUpzb24obG9jYWxTdG9yYWdlWyd1c2VyRGFzaGJvYXJkcyddKTtcbiAgICAgIGlmICghYW5zd2VyIHx8IGFuc3dlci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgYW5zd2VyID0gdGhpcy5kZWZhdWx0cy5nZXRBbGwoKTtcbiAgICAgIH1cbiAgICAgIGxvZy5kZWJ1ZyhcInJldHVybmluZyBkYXNoYm9hcmRzOiBcIiwgYW5zd2VyKTtcbiAgICAgIHJldHVybiBhbnN3ZXI7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdG9yZURhc2hib2FyZHMoZGFzaGJvYXJkczphbnlbXSkge1xuICAgICAgbG9nLmRlYnVnKFwic3RvcmluZyBkYXNoYm9hcmRzOiBcIiwgZGFzaGJvYXJkcyk7XG4gICAgICBsb2NhbFN0b3JhZ2VbJ3VzZXJEYXNoYm9hcmRzJ10gPSBhbmd1bGFyLnRvSnNvbihkYXNoYm9hcmRzKTtcbiAgICAgIHJldHVybiB0aGlzLmxvYWREYXNoYm9hcmRzKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHB1dERhc2hib2FyZHMoYXJyYXk6YW55W10sIGNvbW1pdE1lc3NhZ2U6c3RyaW5nLCBmbikge1xuICAgICAgdmFyIGRhc2hib2FyZHMgPSB0aGlzLmxvYWREYXNoYm9hcmRzKCk7XG4gICAgICBhcnJheS5mb3JFYWNoKChkYXNoKSA9PiB7XG4gICAgICAgIHZhciBleGlzdGluZyA9IGRhc2hib2FyZHMuZmluZEluZGV4KChkKSA9PiB7IHJldHVybiBkLmlkID09PSBkYXNoLmlkOyB9KTtcbiAgICAgICAgaWYgKGV4aXN0aW5nID49IDApIHtcbiAgICAgICAgICBkYXNoYm9hcmRzW2V4aXN0aW5nXSA9IGRhc2g7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGFzaGJvYXJkcy5wdXNoKGRhc2gpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGZuKHRoaXMuc3RvcmVEYXNoYm9hcmRzKGRhc2hib2FyZHMpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVsZXRlRGFzaGJvYXJkcyhhcnJheTphbnlbXSwgZm4pIHtcbiAgICAgIHZhciBkYXNoYm9hcmRzID0gdGhpcy5sb2FkRGFzaGJvYXJkcygpO1xuICAgICAgYW5ndWxhci5mb3JFYWNoKGFycmF5LCAoaXRlbSkgPT4ge1xuICAgICAgICBkYXNoYm9hcmRzLnJlbW92ZSgoaSkgPT4geyByZXR1cm4gaS5pZCA9PT0gaXRlbS5pZDsgfSk7XG4gICAgICB9KTtcbiAgICAgIGZuKHRoaXMuc3RvcmVEYXNoYm9hcmRzKGRhc2hib2FyZHMpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RGFzaGJvYXJkcyhmbikge1xuICAgICAgZm4odGhpcy5sb2FkRGFzaGJvYXJkcygpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RGFzaGJvYXJkKGlkOnN0cmluZywgZm4pIHtcbiAgICAgIHZhciBkYXNoYm9hcmRzID0gdGhpcy5sb2FkRGFzaGJvYXJkcygpO1xuICAgICAgdmFyIGRhc2hib2FyZCA9IGRhc2hib2FyZHMuZmluZCgoZGFzaGJvYXJkKSA9PiB7IHJldHVybiBkYXNoYm9hcmQuaWQgPT09IGlkIH0pO1xuICAgICAgZm4oZGFzaGJvYXJkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY3JlYXRlRGFzaGJvYXJkKG9wdGlvbnM6YW55KSB7XG4gICAgICB2YXIgYW5zd2VyID17XG4gICAgICAgIHRpdGxlOiBcIk5ldyBEYXNoYm9hcmRcIixcbiAgICAgICAgZ3JvdXA6IFwiUGVyc29uYWxcIixcbiAgICAgICAgd2lkZ2V0czogW11cbiAgICAgIH07XG4gICAgICBhbnN3ZXIgPSBhbmd1bGFyLmV4dGVuZChhbnN3ZXIsIG9wdGlvbnMpO1xuICAgICAgYW5zd2VyWydpZCddID0gQ29yZS5nZXRVVUlEKCk7XG4gICAgICByZXR1cm4gYW5zd2VyO1xuICAgIH1cblxuICAgIHB1YmxpYyBjbG9uZURhc2hib2FyZChkYXNoYm9hcmQ6YW55KSB7XG4gICAgICB2YXIgbmV3RGFzaGJvYXJkID0gT2JqZWN0LmNsb25lKGRhc2hib2FyZCk7XG4gICAgICBuZXdEYXNoYm9hcmRbJ2lkJ10gPSBDb3JlLmdldFVVSUQoKTtcbiAgICAgIG5ld0Rhc2hib2FyZFsndGl0bGUnXSA9IFwiQ29weSBvZiBcIiArIGRhc2hib2FyZC50aXRsZTtcbiAgICAgIHJldHVybiBuZXdEYXNoYm9hcmQ7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFR5cGUoKSB7XG4gICAgICByZXR1cm4gJ2NvbnRhaW5lcic7XG4gICAgfVxuICB9XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuXG4gIF9tb2R1bGUuY29udHJvbGxlcihcIkRhc2hib2FyZC5FZGl0RGFzaGJvYXJkc0NvbnRyb2xsZXJcIiwgW1wiJHNjb3BlXCIsIFwiJHJvdXRlUGFyYW1zXCIsIFwiJHJvdXRlXCIsIFwiJGxvY2F0aW9uXCIsIFwiJHJvb3RTY29wZVwiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgXCJIYXd0aW9OYXZcIiwgXCIkdGltZW91dFwiLCBcIiR0ZW1wbGF0ZUNhY2hlXCIsIFwiJG1vZGFsXCIsICgkc2NvcGUsICRyb3V0ZVBhcmFtcywgJHJvdXRlLCAkbG9jYXRpb24sICRyb290U2NvcGUsIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSwgbmF2LCAkdGltZW91dCwgJHRlbXBsYXRlQ2FjaGUsICRtb2RhbCkgPT4ge1xuXG4gICAgJHNjb3BlLl9kYXNoYm9hcmRzID0gW107XG5cbiAgICAkcm9vdFNjb3BlLiRvbignZGFzaGJvYXJkc1VwZGF0ZWQnLCBkYXNoYm9hcmRMb2FkZWQpO1xuXG4gICAgJHNjb3BlLmhhc1VybCA9ICgpID0+IHtcbiAgICAgIHJldHVybiAoJHNjb3BlLnVybCkgPyB0cnVlIDogZmFsc2U7XG4gICAgfTtcblxuICAgICRzY29wZS5oYXNTZWxlY3Rpb24gPSAoKSA9PiB7XG4gICAgICByZXR1cm4gJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXMubGVuZ3RoICE9PSAwO1xuICAgIH07XG5cbiAgICAkc2NvcGUuZ3JpZE9wdGlvbnMgPSB7XG4gICAgICBzZWxlY3RlZEl0ZW1zOiBbXSxcbiAgICAgIHNob3dGaWx0ZXI6IGZhbHNlLFxuICAgICAgc2hvd0NvbHVtbk1lbnU6IGZhbHNlLFxuICAgICAgZmlsdGVyT3B0aW9uczoge1xuICAgICAgICBmaWx0ZXJUZXh0OiAnJ1xuICAgICAgfSxcbiAgICAgIGRhdGE6ICdfZGFzaGJvYXJkcycsXG4gICAgICBzZWxlY3RXaXRoQ2hlY2tib3hPbmx5OiB0cnVlLFxuICAgICAgc2hvd1NlbGVjdGlvbkNoZWNrYm94OiB0cnVlLFxuICAgICAgY29sdW1uRGVmczogW1xuICAgICAgICB7XG4gICAgICAgICAgZmllbGQ6ICd0aXRsZScsXG4gICAgICAgICAgZGlzcGxheU5hbWU6ICdEYXNoYm9hcmQnLFxuICAgICAgICAgIGNlbGxUZW1wbGF0ZTogJHRlbXBsYXRlQ2FjaGUuZ2V0KFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdlZGl0RGFzaGJvYXJkVGl0bGVDZWxsLmh0bWwnKSlcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGZpZWxkOiAnZ3JvdXAnLFxuICAgICAgICAgIGRpc3BsYXlOYW1lOiAnR3JvdXAnXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgfTtcblxuICAgIHZhciBkb1VwZGF0ZSA9IF8uZGVib3VuY2UodXBkYXRlRGF0YSwgMTApO1xuXG4gICAgLy8gaGVscGVycyBzbyB3ZSBjYW4gZW5hYmxlL2Rpc2FibGUgcGFydHMgb2YgdGhlIFVJIGRlcGVuZGluZyBvbiBob3dcbiAgICAvLyBkYXNoYm9hcmQgZGF0YSBpcyBzdG9yZWRcbiAgICAvKlxuICAgICRzY29wZS51c2luZ0dpdCA9ICgpID0+IHtcbiAgICAgIHJldHVybiBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldFR5cGUoKSA9PT0gJ2dpdCc7XG4gICAgfTtcblxuICAgICRzY29wZS51c2luZ0ZhYnJpYyA9ICgpID0+IHtcbiAgICAgIHJldHVybiBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldFR5cGUoKSA9PT0gJ2ZhYnJpYyc7XG4gICAgfTtcblxuICAgICRzY29wZS51c2luZ0xvY2FsID0gKCkgPT4ge1xuICAgICAgcmV0dXJuIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0VHlwZSgpID09PSAnY29udGFpbmVyJztcbiAgICB9O1xuXG4gICAgaWYgKCRzY29wZS51c2luZ0ZhYnJpYygpKSB7XG4gICAgICAkc2NvcGUuZ3JpZE9wdGlvbnMuY29sdW1uRGVmcy5hZGQoW3tcbiAgICAgICAgZmllbGQ6ICd2ZXJzaW9uSWQnLFxuICAgICAgICBkaXNwbGF5TmFtZTogJ1ZlcnNpb24nXG4gICAgICB9LCB7XG4gICAgICAgIGZpZWxkOiAncHJvZmlsZUlkJyxcbiAgICAgICAgZGlzcGxheU5hbWU6ICdQcm9maWxlJ1xuICAgICAgfSwge1xuICAgICAgICBmaWVsZDogJ2ZpbGVOYW1lJyxcbiAgICAgICAgZGlzcGxheU5hbWU6ICdGaWxlIE5hbWUnXG4gICAgICB9XSk7XG4gICAgfVxuICAgICovXG5cbiAgICAkdGltZW91dChkb1VwZGF0ZSwgMTApO1xuXG4gICAgJHNjb3BlLiRvbihcIiRyb3V0ZUNoYW5nZVN1Y2Nlc3NcIiwgZnVuY3Rpb24gKGV2ZW50LCBjdXJyZW50LCBwcmV2aW91cykge1xuICAgICAgLy8gbGV0cyBkbyB0aGlzIGFzeW5jaHJvbm91c2x5IHRvIGF2b2lkIEVycm9yOiAkZGlnZXN0IGFscmVhZHkgaW4gcHJvZ3Jlc3NcbiAgICAgICR0aW1lb3V0KGRvVXBkYXRlLCAxMCk7XG4gICAgfSk7XG5cbiAgICAkc2NvcGUuYWRkVmlld1RvRGFzaGJvYXJkID0gKCkgPT4ge1xuICAgICAgdmFyIG5leHRIcmVmID0gbnVsbDtcbiAgICAgIHZhciBzZWxlY3RlZCA9ICRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zO1xuICAgICAgdmFyIGN1cnJlbnRVcmwgPSBuZXcgVVJJKCk7XG4gICAgICB2YXIgY29uZmlnID0gY3VycmVudFVybC5xdWVyeSh0cnVlKTtcbiAgICAgIHZhciBocmVmID0gY29uZmlnWydocmVmJ107XG4gICAgICB2YXIgaWZyYW1lID0gY29uZmlnWydpZnJhbWUnXTtcbiAgICAgIHZhciB0eXBlID0gJ2hyZWYnO1xuICAgICAgaWYgKGhyZWYpIHtcbiAgICAgICAgaHJlZiA9IGhyZWYudW5lc2NhcGVVUkwoKTtcbiAgICAgICAgaHJlZiA9IENvcmUudHJpbUxlYWRpbmcoaHJlZiwgJyMnKTtcbiAgICAgIH0gZWxzZSBpZiAoaWZyYW1lKSB7XG4gICAgICAgIGlmcmFtZSA9IGlmcmFtZS51bmVzY2FwZVVSTCgpO1xuICAgICAgICB0eXBlID0gJ2lmcmFtZSc7XG4gICAgICB9XG4gICAgICB2YXIgd2lkZ2V0VVJJID0gPGFueT4gdW5kZWZpbmVkO1xuICAgICAgc3dpdGNoKHR5cGUpIHtcbiAgICAgICAgY2FzZSAnaHJlZic6XG4gICAgICAgICAgbG9nLmRlYnVnKFwiaHJlZjogXCIsIGhyZWYpO1xuICAgICAgICAgIHdpZGdldFVSSSA9IG5ldyBVUkkoaHJlZik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2lmcmFtZSc6XG4gICAgICAgICAgbG9nLmRlYnVnKFwiaWZyYW1lOiBcIiwgaWZyYW1lKTtcbiAgICAgICAgICB3aWRnZXRVUkkgPSBuZXcgVVJJKGlmcmFtZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgbG9nLmRlYnVnKFwidHlwZSB1bmtub3duXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBzaXplU3RyID0gPGFueT4gY29uZmlnWydzaXplJ107XG4gICAgICBpZiAoc2l6ZVN0cikge1xuICAgICAgICBzaXplU3RyID0gc2l6ZVN0ci51bmVzY2FwZVVSTCgpO1xuICAgICAgfVxuICAgICAgdmFyIHNpemUgPSBhbmd1bGFyLmZyb21Kc29uKHNpemVTdHIpIHx8IHsgc2l6ZV94OiAxLCBzaXplX3k6IDEgfTtcbiAgICAgIHZhciB0aXRsZSA9IChjb25maWdbJ3RpdGxlJ10gfHwgJycpLnVuZXNjYXBlVVJMKCk7XG4gICAgICB2YXIgdGVtcGxhdGVXaWRnZXQgPSB7XG4gICAgICAgIGlkOiB1bmRlZmluZWQsXG4gICAgICAgIHJvdzogMSxcbiAgICAgICAgY29sOiAxLFxuICAgICAgICBzaXplX3g6IHNpemUuc2l6ZV94LFxuICAgICAgICBzaXplX3k6IHNpemUuc2l6ZV95LFxuICAgICAgICB0aXRsZTogdGl0bGVcbiAgICAgIH1cbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZWxlY3RlZCwgKHNlbGVjdGVkSXRlbSkgPT4ge1xuXG4gICAgICAgIHZhciB3aWRnZXQgPSBfLmNsb25lRGVlcCh0ZW1wbGF0ZVdpZGdldCk7XG5cbiAgICAgICAgaWYgKCFzZWxlY3RlZEl0ZW0ud2lkZ2V0cykge1xuICAgICAgICAgIHNlbGVjdGVkSXRlbS53aWRnZXRzID0gW107XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5leHROdW1iZXIgPSBzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5sZW5ndGggKyAxO1xuICAgICAgICB3aWRnZXQuaWQgPSAndycgKyBuZXh0TnVtYmVyO1xuICAgICAgICBsb2cuZGVidWcoXCJ3aWRnZXRVUkk6IFwiLCB3aWRnZXRVUkkudG9TdHJpbmcoKSk7XG5cbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgY2FzZSAnaWZyYW1lJzogXG4gICAgICAgICAgICB3aWRnZXQgPSA8YW55Pl8uZXh0ZW5kKHtcbiAgICAgICAgICAgICAgaWZyYW1lOiBpZnJhbWVcbiAgICAgICAgICAgIH0sIHdpZGdldCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdocmVmJzpcbiAgICAgICAgICAgIHZhciB0ZXh0ID0gd2lkZ2V0VVJJLnBhdGgoKTtcbiAgICAgICAgICAgIHZhciBzZWFyY2ggPSB3aWRnZXRVUkkucXVlcnkodHJ1ZSk7XG4gICAgICAgICAgICBpZiAoJHJvdXRlICYmICRyb3V0ZS5yb3V0ZXMpIHtcbiAgICAgICAgICAgICAgdmFyIHZhbHVlID0gJHJvdXRlLnJvdXRlc1t0ZXh0XTtcbiAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlVXJsID0gdmFsdWVbXCJ0ZW1wbGF0ZVVybFwiXTtcbiAgICAgICAgICAgICAgICBpZiAodGVtcGxhdGVVcmwpIHtcbiAgICAgICAgICAgICAgICAgIHdpZGdldCA9IDxhbnk+IF8uZXh0ZW5kKHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogdGV4dCxcbiAgICAgICAgICAgICAgICAgICAgaW5jbHVkZTogdGVtcGxhdGVVcmwsXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaDogc2VhcmNoLFxuICAgICAgICAgICAgICAgICAgICBoYXNoOiBcIlwiXG4gICAgICAgICAgICAgICAgICB9LCB3aWRnZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPIHdlIG5lZWQgdG8gYmUgYWJsZSB0byBtYXRjaCBVUkkgdGVtcGxhdGVzLi4uXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICAvLyBmaWd1cmUgb3V0IHRoZSB3aWR0aCBvZiB0aGUgZGFzaFxuICAgICAgICB2YXIgZ3JpZFdpZHRoID0gMDtcblxuICAgICAgICBzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5mb3JFYWNoKCh3KSA9PiB7XG4gICAgICAgICAgdmFyIHJpZ2h0U2lkZSA9IHcuY29sICsgdy5zaXplX3g7XG4gICAgICAgICAgaWYgKHJpZ2h0U2lkZSA+IGdyaWRXaWR0aCkge1xuICAgICAgICAgICAgZ3JpZFdpZHRoID0gcmlnaHRTaWRlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGZvdW5kID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIGxlZnQgPSAodykgPT4ge1xuICAgICAgICAgIHJldHVybiB3LmNvbDtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcmlnaHQgPSAodykgID0+IHtcbiAgICAgICAgICByZXR1cm4gdy5jb2wgKyB3LnNpemVfeCAtIDE7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHRvcCA9ICh3KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHcucm93O1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBib3R0b20gPSAodykgPT4ge1xuICAgICAgICAgIHJldHVybiB3LnJvdyArIHcuc2l6ZV95IC0gMTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgY29sbGlzaW9uID0gKHcxLCB3MikgPT4ge1xuICAgICAgICAgIHJldHVybiAhKCBsZWZ0KHcyKSA+IHJpZ2h0KHcxKSB8fFxuICAgICAgICAgICAgICByaWdodCh3MikgPCBsZWZ0KHcxKSB8fFxuICAgICAgICAgICAgICB0b3AodzIpID4gYm90dG9tKHcxKSB8fFxuICAgICAgICAgICAgICBib3R0b20odzIpIDwgdG9wKHcxKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHNlbGVjdGVkSXRlbS53aWRnZXRzLmlzRW1wdHkoKSkge1xuICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlICghZm91bmQpIHtcbiAgICAgICAgICB3aWRnZXQuY29sID0gMTtcbiAgICAgICAgICBpZiAod2lkZ2V0LmNvbCArIHdpZGdldC5zaXplX3ggPiBncmlkV2lkdGgpIHtcbiAgICAgICAgICAgIC8vIGxldCdzIG5vdCBsb29rIGZvciBhIHBsYWNlIG5leHQgdG8gZXhpc3Rpbmcgd2lkZ2V0XG4gICAgICAgICAgICBzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5mb3JFYWNoKGZ1bmN0aW9uKHcsIGlkeCkge1xuICAgICAgICAgICAgICBpZiAod2lkZ2V0LnJvdyA8PSB3LnJvdykge1xuICAgICAgICAgICAgICAgIHdpZGdldC5yb3crKztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAoOyAod2lkZ2V0LmNvbCArIHdpZGdldC5zaXplX3gpIDw9IGdyaWRXaWR0aDsgd2lkZ2V0LmNvbCsrKSB7XG4gICAgICAgICAgICBpZiAoIXNlbGVjdGVkSXRlbS53aWRnZXRzLmFueSgodykgPT4ge1xuICAgICAgICAgICAgICB2YXIgYyA9IGNvbGxpc2lvbih3LCB3aWRnZXQpO1xuICAgICAgICAgICAgICByZXR1cm4gY1xuICAgICAgICAgICAgfSkpIHtcbiAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgd2lkZ2V0LnJvdyA9IHdpZGdldC5yb3cgKyAxXG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGp1c3QgaW4gY2FzZSwga2VlcCB0aGUgc2NyaXB0IGZyb20gcnVubmluZyBhd2F5Li4uXG4gICAgICAgICAgaWYgKHdpZGdldC5yb3cgPiA1MCkge1xuICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgkc2NvcGUucm91dGVQYXJhbXMpIHtcbiAgICAgICAgICB3aWRnZXRbJ3JvdXRlUGFyYW1zJ10gPSAkc2NvcGUucm91dGVQYXJhbXM7XG4gICAgICAgIH1cbiAgICAgICAgc2VsZWN0ZWRJdGVtLndpZGdldHMucHVzaCh3aWRnZXQpO1xuICAgICAgICBpZiAoIW5leHRIcmVmICYmIHNlbGVjdGVkSXRlbS5pZCkge1xuICAgICAgICAgIG5leHRIcmVmID0gbmV3IFVSSSgpLnBhdGgoXCIvZGFzaGJvYXJkL2lkL1wiICsgc2VsZWN0ZWRJdGVtLmlkKS5xdWVyeSh7XG4gICAgICAgICAgICAnbWFpbi10YWInOiAnZGFzaGJvYXJkJyxcbiAgICAgICAgICAgICdzdWItdGFiJzogJ2Rhc2hib2FyZC0nICsgc2VsZWN0ZWRJdGVtLmlkXG4gICAgICAgICAgfSkucmVtb3ZlUXVlcnkoJ2hyZWYnKVxuICAgICAgICAgICAgLnJlbW92ZVF1ZXJ5KCd0aXRsZScpXG4gICAgICAgICAgICAucmVtb3ZlUXVlcnkoJ2lmcmFtZScpXG4gICAgICAgICAgICAucmVtb3ZlUXVlcnkoJ3NpemUnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIG5vdyBsZXRzIHVwZGF0ZSB0aGUgYWN0dWFsIGRhc2hib2FyZCBjb25maWdcbiAgICAgIHZhciBjb21taXRNZXNzYWdlID0gXCJBZGQgd2lkZ2V0XCI7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoc2VsZWN0ZWQsIGNvbW1pdE1lc3NhZ2UsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIC8qXG4gICAgICAgIGxvZy5kZWJ1ZyhcIlB1dCBkYXNoYm9hcmRzOiBcIiwgZGFzaGJvYXJkcyk7XG4gICAgICAgIGxvZy5kZWJ1ZyhcIk5leHQgaHJlZjogXCIsIG5leHRIcmVmLnRvU3RyaW5nKCkpO1xuICAgICAgICAqL1xuICAgICAgICBpZiAobmV4dEhyZWYpIHtcbiAgICAgICAgICAkbG9jYXRpb24ucGF0aChuZXh0SHJlZi5wYXRoKCkpLnNlYXJjaChuZXh0SHJlZi5xdWVyeSh0cnVlKSk7XG4gICAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB9O1xuXG4gICAgJHNjb3BlLmNyZWF0ZSA9ICgpID0+IHtcbiAgICAgIHZhciBjb3VudGVyID0gZGFzaGJvYXJkcygpLmxlbmd0aCArIDE7XG4gICAgICB2YXIgdGl0bGUgPSBcIlVudGl0bGVkXCIgKyBjb3VudGVyO1xuICAgICAgdmFyIG5ld0Rhc2ggPSBkYXNoYm9hcmRSZXBvc2l0b3J5LmNyZWF0ZURhc2hib2FyZCh7dGl0bGU6IHRpdGxlfSk7XG5cbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbbmV3RGFzaF0sIFwiQ3JlYXRlZCBuZXcgZGFzaGJvYXJkOiBcIiArIHRpdGxlLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAvLyBsZXQncyBqdXN0IGJlIHNhZmUgYW5kIGVuc3VyZSB0aGVyZSdzIG5vIHNlbGVjdGlvbnNcbiAgICAgICAgZGVzZWxlY3RBbGwoKTtcbiAgICAgICAgc2V0U3ViVGFicyhuYXYuYnVpbGRlcigpLCBkYXNoYm9hcmRzLCAkcm9vdFNjb3BlKTtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG5cbiAgICB9O1xuXG4gICAgJHNjb3BlLmR1cGxpY2F0ZSA9ICgpID0+IHtcbiAgICAgIHZhciBuZXdEYXNoYm9hcmRzID0gW107XG4gICAgICB2YXIgY29tbWl0TWVzc2FnZSA9IFwiRHVwbGljYXRlZCBkYXNoYm9hcmQocykgXCI7XG4gICAgICBhbmd1bGFyLmZvckVhY2goJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXMsIChpdGVtLCBpZHgpID0+IHtcbiAgICAgICAgLy8gbGV0cyB1bnNlbGVjdCB0aGlzIGl0ZW1cbiAgICAgICAgdmFyIGNvbW1pdE1lc3NhZ2UgPSBcIkR1cGxpY2F0ZWQgZGFzaGJvYXJkIFwiICsgaXRlbS50aXRsZTtcbiAgICAgICAgdmFyIG5ld0Rhc2ggPSBkYXNoYm9hcmRSZXBvc2l0b3J5LmNsb25lRGFzaGJvYXJkKGl0ZW0pO1xuICAgICAgICBuZXdEYXNoYm9hcmRzLnB1c2gobmV3RGFzaCk7XG4gICAgICB9KTtcblxuICAgICAgLy8gbGV0J3MganVzdCBiZSBzYWZlIGFuZCBlbnN1cmUgdGhlcmUncyBubyBzZWxlY3Rpb25zXG4gICAgICBkZXNlbGVjdEFsbCgpO1xuXG4gICAgICBjb21taXRNZXNzYWdlID0gY29tbWl0TWVzc2FnZSArIG5ld0Rhc2hib2FyZHMubWFwKChkKSA9PiB7IHJldHVybiBkLnRpdGxlIH0pLmpvaW4oJywnKTtcbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhuZXdEYXNoYm9hcmRzLCBjb21taXRNZXNzYWdlLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICBzZXRTdWJUYWJzKG5hdi5idWlsZGVyKCksIGRhc2hib2FyZHMsICRyb290U2NvcGUpO1xuICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlbmFtZURhc2hib2FyZCA9ICgpID0+IHtcbiAgICAgIGlmICgkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkID0gPGFueT5fLmZpcnN0KCRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zKTtcbiAgICAgICAgdmFyIG1vZGFsID0gJG1vZGFsLm9wZW4oe1xuICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAncmVuYW1lRGFzaGJvYXJkTW9kYWwuaHRtbCcpLFxuICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRtb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAgICRzY29wZS5jb25maWcgPSB7XG4gICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAndGl0bGUnOiB7XG4gICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHNlbGVjdGVkLnRpdGxlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkID0gc2VsZWN0ZWQ7XG4gICAgICAgICAgICAkc2NvcGUub2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbJHNjb3BlLnNlbGVjdGVkXSwgJ3JlbmFtZWQgZGFzaGJvYXJkJywgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBsZXQncyBqdXN0IGJlIHNhZmUgYW5kIGVuc3VyZSB0aGVyZSdzIG5vIHNlbGVjdGlvbnNcbiAgICAgICAgICAgICAgICBkZXNlbGVjdEFsbCgpO1xuICAgICAgICAgICAgICAgIHNldFN1YlRhYnMobmF2LmJ1aWxkZXIoKSwgZGFzaGJvYXJkcywgJHJvb3RTY29wZSk7XG4gICAgICAgICAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgICAgICAgIG1vZGFsLmRpc21pc3MoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgJHNjb3BlLmRlbGV0ZURhc2hib2FyZCA9ICgpID0+IHtcbiAgICAgIGlmICgkc2NvcGUuaGFzU2VsZWN0aW9uKCkpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkID0gJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXM7XG4gICAgICAgIHZhciBtb2RhbCA9ICRtb2RhbC5vcGVuKHtcbiAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ2RlbGV0ZURhc2hib2FyZE1vZGFsLmh0bWwnKSxcbiAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICckbW9kYWxJbnN0YW5jZScsICgkc2NvcGUsICRtb2RhbEluc3RhbmNlKSA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWQgPSBzZWxlY3RlZDtcbiAgICAgICAgICAgICRzY29wZS5vayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgbW9kYWwuY2xvc2UoKTtcbiAgICAgICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5kZWxldGVEYXNoYm9hcmRzKCRzY29wZS5zZWxlY3RlZCwgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBsZXQncyBqdXN0IGJlIHNhZmUgYW5kIGVuc3VyZSB0aGVyZSdzIG5vIHNlbGVjdGlvbnNcbiAgICAgICAgICAgICAgICBkZXNlbGVjdEFsbCgpO1xuICAgICAgICAgICAgICAgIHNldFN1YlRhYnMobmF2LmJ1aWxkZXIoKSwgZGFzaGJvYXJkcywgJHJvb3RTY29wZSk7XG4gICAgICAgICAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgICAgICAgIG1vZGFsLmRpc21pc3MoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgJHNjb3BlLmdpc3QgPSAoKSA9PiB7XG4gICAgICBpZiAoJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgaWQgPSAkc2NvcGUuc2VsZWN0ZWRJdGVtc1swXS5pZDtcbiAgICAgICAgJGxvY2F0aW9uLnBhdGgoXCIvZGFzaGJvYXJkL2lkL1wiICsgaWQgKyBcIi9zaGFyZVwiKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gdXBkYXRlRGF0YSgpIHtcbiAgICAgIHZhciB1cmwgPSAkcm91dGVQYXJhbXNbXCJocmVmXCJdO1xuICAgICAgaWYgKHVybCkge1xuICAgICAgICAkc2NvcGUudXJsID0gZGVjb2RlVVJJQ29tcG9uZW50KHVybCk7XG4gICAgICB9XG5cbiAgICAgIHZhciByb3V0ZVBhcmFtcyA9ICRyb3V0ZVBhcmFtc1tcInJvdXRlUGFyYW1zXCJdO1xuICAgICAgaWYgKHJvdXRlUGFyYW1zKSB7XG4gICAgICAgICRzY29wZS5yb3V0ZVBhcmFtcyA9IGRlY29kZVVSSUNvbXBvbmVudChyb3V0ZVBhcmFtcyk7XG4gICAgICB9XG4gICAgICB2YXIgc2l6ZTphbnkgPSAkcm91dGVQYXJhbXNbXCJzaXplXCJdO1xuICAgICAgaWYgKHNpemUpIHtcbiAgICAgICAgc2l6ZSA9IGRlY29kZVVSSUNvbXBvbmVudChzaXplKTtcbiAgICAgICAgJHNjb3BlLnByZWZlcnJlZFNpemUgPSBhbmd1bGFyLmZyb21Kc29uKHNpemUpO1xuICAgICAgfVxuICAgICAgdmFyIHRpdGxlOmFueSA9ICRyb3V0ZVBhcmFtc1tcInRpdGxlXCJdO1xuICAgICAgaWYgKHRpdGxlKSB7XG4gICAgICAgIHRpdGxlID0gZGVjb2RlVVJJQ29tcG9uZW50KHRpdGxlKTtcbiAgICAgICAgJHNjb3BlLndpZGdldFRpdGxlID0gdGl0bGU7XG4gICAgICB9XG5cbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkcygoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXNoYm9hcmRMb2FkZWQoZXZlbnQsIGRhc2hib2FyZHMpIHtcbiAgICAgIGRhc2hib2FyZHMuZm9yRWFjaCgoZGFzaGJvYXJkKSA9PiB7XG4gICAgICAgIGRhc2hib2FyZC5oYXNoID0gJz9tYWluLXRhYj1kYXNoYm9hcmQmc3ViLXRhYj1kYXNoYm9hcmQtJyArIGRhc2hib2FyZC5pZDtcbiAgICAgIH0pO1xuICAgICAgJHNjb3BlLl9kYXNoYm9hcmRzID0gZGFzaGJvYXJkcztcblxuICAgICAgaWYgKGV2ZW50ID09PSBudWxsKSB7XG4gICAgICAgICRzY29wZS4kZW1pdCgnZGFzaGJvYXJkc1VwZGF0ZWQnLCBkYXNoYm9hcmRzKTtcbiAgICAgIH1cbiAgICAgIENvcmUuJGFwcGx5KCRyb290U2NvcGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRhc2hib2FyZHMoKSB7XG4gICAgICByZXR1cm4gJHNjb3BlLl9kYXNoYm9hcmRzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlc2VsZWN0QWxsKCkge1xuICAgICAgJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXMubGVuZ3RoID0gMDtcbiAgICB9XG5cbiAgfV0pO1xufVxuIiwiLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcblxuICAvKipcbiAgICogSW1wbGVtZW50cyB0aGUgbmcuSUxvY2F0aW9uU2VydmljZSBpbnRlcmZhY2UgYW5kIGlzIHVzZWQgYnkgdGhlIGRhc2hib2FyZCB0byBzdXBwbHlcbiAgICogY29udHJvbGxlcnMgd2l0aCBhIHNhdmVkIFVSTCBsb2NhdGlvblxuICAgKlxuICAgKiBAY2xhc3MgUmVjdGFuZ2xlTG9jYXRpb25cbiAgICovXG4gIGV4cG9ydCBjbGFzcyBSZWN0YW5nbGVMb2NhdGlvbiB7IC8vIFRPRE8gaW1wbGVtZW50cyBuZy5JTG9jYXRpb25TZXJ2aWNlIHtcbiAgICBwcml2YXRlIF9wYXRoOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBfaGFzaDogc3RyaW5nO1xuICAgIHByaXZhdGUgX3NlYXJjaDogYW55O1xuXG4gICAgY29uc3RydWN0b3IocHVibGljIGRlbGVnYXRlOm5nLklMb2NhdGlvblNlcnZpY2UsIHBhdGg6c3RyaW5nLCBzZWFyY2gsIGhhc2g6c3RyaW5nKSB7XG4gICAgICB0aGlzLl9wYXRoID0gcGF0aDtcbiAgICAgIHRoaXMuX3NlYXJjaCA9IHNlYXJjaDtcbiAgICAgIHRoaXMuX2hhc2ggPSBoYXNoO1xuICAgIH1cblxuICAgIGFic1VybCgpIHtcbiAgICAgIHJldHVybiB0aGlzLnByb3RvY29sKCkgKyB0aGlzLmhvc3QoKSArIFwiOlwiICsgdGhpcy5wb3J0KCkgKyB0aGlzLnBhdGgoKSArIHRoaXMuc2VhcmNoKCk7XG4gICAgfVxuXG4gICAgaGFzaChuZXdIYXNoOnN0cmluZyA9IG51bGwpOmFueSB7XG4gICAgICBpZiAobmV3SGFzaCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5oYXNoKG5ld0hhc2gpLnNlYXJjaCgndGFiJywgbnVsbCk7XG4gICAgICAgIC8vdGhpcy5faGFzaCA9IG5ld0hhc2g7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5faGFzaDtcbiAgICB9XG5cbiAgICBob3N0KCk6c3RyaW5nIHtcbiAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLmhvc3QoKTtcbiAgICB9XG5cbiAgICBwYXRoKG5ld1BhdGg6c3RyaW5nID0gbnVsbCk6YW55IHtcbiAgICAgIGlmIChuZXdQYXRoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLnBhdGgobmV3UGF0aCkuc2VhcmNoKCd0YWInLCBudWxsKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9wYXRoO1xuICAgIH1cblxuICAgIHBvcnQoKTpudW1iZXIge1xuICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUucG9ydCgpO1xuICAgIH1cblxuICAgIHByb3RvY29sKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUucG9ydCgpO1xuICAgIH1cblxuICAgIHJlcGxhY2UoKSB7XG4gICAgICAvLyBUT0RPXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZWFyY2gocGFyYW1ldGVyc01hcDphbnkgPSBudWxsKTphbnkge1xuICAgICAgaWYgKHBhcmFtZXRlcnNNYXApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUuc2VhcmNoKHBhcmFtZXRlcnNNYXApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX3NlYXJjaDtcbiAgICB9XG5cbiAgICB1cmwobmV3VmFsdWU6IHN0cmluZyA9IG51bGwpOmFueSB7XG4gICAgICBpZiAobmV3VmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUudXJsKG5ld1ZhbHVlKS5zZWFyY2goJ3RhYicsIG51bGwpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuYWJzVXJsKCk7XG4gICAgfVxuXG4gIH1cbn1cbiIsIi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRSZXBvc2l0b3J5LnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cInJlY3RhbmdsZUxvY2F0aW9uLnRzXCIvPlxubW9kdWxlIERhc2hib2FyZCB7XG5cbiAgdmFyIG1vZHVsZXM6QXJyYXk8c3RyaW5nPiA9IHVuZGVmaW5lZDtcblxuICBfbW9kdWxlLmRpcmVjdGl2ZSgnaGF3dGlvRGFzaGJvYXJkJywgZnVuY3Rpb24oKSB7XG4gICAgbW9kdWxlcyA9IGhhd3Rpb1BsdWdpbkxvYWRlclsnbW9kdWxlcyddLmZpbHRlcigobmFtZSkgPT4ge1xuICAgICAgcmV0dXJuIF8uaXNTdHJpbmcobmFtZSkgJiYgbmFtZSAhPT0gJ25nJztcbiAgICB9KTtcbiAgICByZXR1cm4gbmV3IERhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZSgpO1xuICB9KTtcblxuICBleHBvcnQgY2xhc3MgR3JpZHN0ZXJEaXJlY3RpdmUge1xuICAgIHB1YmxpYyByZXN0cmljdCA9ICdBJztcbiAgICBwdWJsaWMgcmVwbGFjZSA9IHRydWU7XG5cbiAgICBwdWJsaWMgY29udHJvbGxlciA9IFtcIiRzY29wZVwiLCBcIiRlbGVtZW50XCIsIFwiJGF0dHJzXCIsIFwiJGxvY2F0aW9uXCIsIFwiJHJvdXRlUGFyYW1zXCIsIFwiJHRlbXBsYXRlQ2FjaGVcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsIFwiJGNvbXBpbGVcIiwgXCIkdGVtcGxhdGVSZXF1ZXN0XCIsIFwiJGludGVycG9sYXRlXCIsIFwiJG1vZGFsXCIsIFwiJHNjZVwiLCAoJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzLCAkbG9jYXRpb24sICRyb3V0ZVBhcmFtcywgJHRlbXBsYXRlQ2FjaGUsIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSwgJGNvbXBpbGUsICR0ZW1wbGF0ZVJlcXVlc3QsICRpbnRlcnBvbGF0ZSwgJG1vZGFsLCAkc2NlKSA9PiB7XG5cbiAgICAgIHZhciBncmlkU2l6ZSA9IDE1MDtcbiAgICAgIHZhciBncmlkTWFyZ2luID0gNjtcbiAgICAgIHZhciBncmlkSGVpZ2h0O1xuXG4gICAgICAkc2NvcGUuZ3JpZFggPSBncmlkU2l6ZTtcbiAgICAgICRzY29wZS5ncmlkWSA9IGdyaWRTaXplO1xuXG4gICAgICAkc2NvcGUud2lkZ2V0TWFwID0ge307XG5cbiAgICAgICRzY29wZS4kb24oJyRkZXN0cm95JywgKCkgPT4ge1xuICAgICAgICBhbmd1bGFyLmZvckVhY2goJHNjb3BlLndpZGdldE1hcCwgKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgICBpZiAoJ3Njb3BlJyBpbiB2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIHNjb3BlID0gdmFsdWVbJ3Njb3BlJ107XG4gICAgICAgICAgICBzY29wZS4kZGVzdHJveSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgc2V0VGltZW91dCh1cGRhdGVXaWRnZXRzLCAxMCk7XG5cbiAgICAgIGZ1bmN0aW9uIHJlbW92ZVdpZGdldCh3aWRnZXQpIHtcbiAgICAgICAgdmFyIGdyaWRzdGVyID0gZ2V0R3JpZHN0ZXIoKTtcbiAgICAgICAgdmFyIHdpZGdldEVsZW0gPSBudWxsO1xuXG4gICAgICAgIC8vIGxldHMgZGVzdHJveSB0aGUgd2lkZ2V0cydzIHNjb3BlXG4gICAgICAgIHZhciB3aWRnZXREYXRhID0gJHNjb3BlLndpZGdldE1hcFt3aWRnZXQuaWRdO1xuICAgICAgICBpZiAod2lkZ2V0RGF0YSkge1xuICAgICAgICAgIGRlbGV0ZSAkc2NvcGUud2lkZ2V0TWFwW3dpZGdldC5pZF07XG4gICAgICAgICAgd2lkZ2V0RWxlbSA9IHdpZGdldERhdGEud2lkZ2V0O1xuICAgICAgICB9XG4gICAgICAgIGlmICghd2lkZ2V0RWxlbSkge1xuICAgICAgICAgIC8vIGxldHMgZ2V0IHRoZSBsaSBwYXJlbnQgZWxlbWVudCBvZiB0aGUgdGVtcGxhdGVcbiAgICAgICAgICB3aWRnZXRFbGVtID0gJChcImRpdlwiKS5maW5kKFwiW2RhdGEtd2lkZ2V0SWQ9J1wiICsgd2lkZ2V0LmlkICsgXCInXVwiKS5wYXJlbnQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZ3JpZHN0ZXIgJiYgd2lkZ2V0RWxlbSkge1xuICAgICAgICAgIGdyaWRzdGVyLnJlbW92ZV93aWRnZXQod2lkZ2V0RWxlbSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbGV0cyB0cmFzaCB0aGUgSlNPTiBtZXRhZGF0YVxuICAgICAgICBpZiAoJHNjb3BlLmRhc2hib2FyZCkge1xuICAgICAgICAgIHZhciB3aWRnZXRzID0gJHNjb3BlLmRhc2hib2FyZC53aWRnZXRzO1xuICAgICAgICAgIGlmICh3aWRnZXRzKSB7XG4gICAgICAgICAgICB3aWRnZXRzLnJlbW92ZSh3aWRnZXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkoXCJSZW1vdmVkIHdpZGdldCBcIiArIHdpZGdldC50aXRsZSk7XG4gICAgICB9O1xuXG4gICAgICBmdW5jdGlvbiBjaGFuZ2VXaWRnZXRTaXplKHdpZGdldCwgc2l6ZWZ1bmMsIHNhdmVmdW5jKSB7XG4gICAgICAgIGlmICghd2lkZ2V0KSB7XG4gICAgICAgICAgbG9nLmRlYnVnKFwid2lkZ2V0IHVuZGVmaW5lZFwiKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGdyaWRzdGVyID0gZ2V0R3JpZHN0ZXIoKTtcbiAgICAgICAgbG9nLmRlYnVnKFwiV2lkZ2V0IElEOiBcIiwgd2lkZ2V0LmlkLCBcIiB3aWRnZXRNYXA6IFwiLCAkc2NvcGUud2lkZ2V0TWFwKTtcbiAgICAgICAgdmFyIGVudHJ5ID0gJHNjb3BlLndpZGdldE1hcFt3aWRnZXQuaWRdO1xuICAgICAgICB2YXIgdyA9IGVudHJ5LndpZGdldDtcbiAgICAgICAgc2l6ZWZ1bmMoZW50cnkpO1xuICAgICAgICBncmlkc3Rlci5yZXNpemVfd2lkZ2V0KHcsIGVudHJ5LnNpemVfeCwgZW50cnkuc2l6ZV95KTtcbiAgICAgICAgZ3JpZHN0ZXIuc2V0X2RvbV9ncmlkX2hlaWdodCgpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNhdmVmdW5jKHdpZGdldCk7XG4gICAgICAgIH0sIDUwKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gb25XaWRnZXRSZW5hbWVkKHdpZGdldCkge1xuICAgICAgICB1cGRhdGVEYXNoYm9hcmRSZXBvc2l0b3J5KFwiUmVuYW1lZCB3aWRnZXQgdG8gXCIgKyB3aWRnZXQudGl0bGUpO1xuICAgICAgfTtcblxuICAgICAgZnVuY3Rpb24gdXBkYXRlV2lkZ2V0cygpIHtcbiAgICAgICAgJHNjb3BlLmlkID0gJHJvdXRlUGFyYW1zW1wiZGFzaGJvYXJkSWRcIl07XG4gICAgICAgICRzY29wZS5pZHggPSAkcm91dGVQYXJhbXNbXCJkYXNoYm9hcmRJbmRleFwiXTtcbiAgICAgICAgaWYgKCRzY29wZS5pZCkge1xuICAgICAgICAgICRzY29wZS4kZW1pdCgnbG9hZERhc2hib2FyZHMnKTtcbiAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZCgkc2NvcGUuaWQsIG9uRGFzaGJvYXJkTG9hZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXREYXNoYm9hcmRzKChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkcyk7XG5cbiAgICAgICAgICAgIHZhciBpZHggPSAkc2NvcGUuaWR4ID8gcGFyc2VJbnQoJHNjb3BlLmlkeCkgOiAwO1xuICAgICAgICAgICAgdmFyIGlkID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChkYXNoYm9hcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgdmFyIGRhc2hib2FyZCA9IGRhc2hib2FyZHMubGVuZ3RoID4gaWR4ID8gZGFzaGJvYXJkc1tpZHhdIDogZGFzaGJvYXJkWzBdO1xuICAgICAgICAgICAgICBpZCA9IGRhc2hib2FyZC5pZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZCkge1xuICAgICAgICAgICAgICAkbG9jYXRpb24ucGF0aChcIi9kYXNoYm9hcmQvaWQvXCIgKyBpZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAkbG9jYXRpb24ucGF0aChcIi9kYXNoYm9hcmQvZWRpdFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gb25EYXNoYm9hcmRMb2FkKGRhc2hib2FyZCkge1xuICAgICAgICAkc2NvcGUuZGFzaGJvYXJkID0gZGFzaGJvYXJkO1xuICAgICAgICB2YXIgd2lkZ2V0cyA9ICgoZGFzaGJvYXJkKSA/IGRhc2hib2FyZC53aWRnZXRzIDogbnVsbCkgfHwgW107XG5cbiAgICAgICAgdmFyIG1pbkhlaWdodCA9IDEwO1xuICAgICAgICB2YXIgbWluV2lkdGggPSA2O1xuXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaCh3aWRnZXRzLCAod2lkZ2V0KSA9PiB7XG4gICAgICAgICAgaWYgKCF3aWRnZXQpIHtcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhcIlVuZGVmaW5lZCB3aWRnZXQsIHNraXBwaW5nXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQod2lkZ2V0LnJvdykgJiYgbWluSGVpZ2h0IDwgd2lkZ2V0LnJvdykge1xuICAgICAgICAgICAgbWluSGVpZ2h0ID0gd2lkZ2V0LnJvdyArIDE7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZCh3aWRnZXQuc2l6ZV94XG4gICAgICAgICAgICAgICYmIGFuZ3VsYXIuaXNEZWZpbmVkKHdpZGdldC5jb2wpKSkge1xuICAgICAgICAgICAgdmFyIHJpZ2h0RWRnZSA9IHdpZGdldC5jb2wgKyB3aWRnZXQuc2l6ZV94O1xuICAgICAgICAgICAgaWYgKHJpZ2h0RWRnZSA+IG1pbldpZHRoKSB7XG4gICAgICAgICAgICAgIG1pbldpZHRoID0gcmlnaHRFZGdlICsgMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBncmlkc3RlciA9ICRlbGVtZW50LmdyaWRzdGVyKHtcbiAgICAgICAgICB3aWRnZXRfbWFyZ2luczogW2dyaWRNYXJnaW4sIGdyaWRNYXJnaW5dLFxuICAgICAgICAgIHdpZGdldF9iYXNlX2RpbWVuc2lvbnM6IFskc2NvcGUuZ3JpZFgsICRzY29wZS5ncmlkWV0sXG4gICAgICAgICAgZXh0cmFfcm93czogbWluSGVpZ2h0LFxuICAgICAgICAgIGV4dHJhX2NvbHM6IG1pbldpZHRoLFxuICAgICAgICAgIG1heF9zaXplX3g6IG1pbldpZHRoLFxuICAgICAgICAgIG1heF9zaXplX3k6IG1pbkhlaWdodCxcbiAgICAgICAgICBkcmFnZ2FibGU6IHtcbiAgICAgICAgICAgIHN0b3A6IChldmVudCwgdWkpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHNlcmlhbGl6ZURhc2hib2FyZCgpKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIkNoYW5naW5nIGRhc2hib2FyZCBsYXlvdXRcIik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pLmRhdGEoJ2dyaWRzdGVyJyk7XG5cbiAgICAgICAgdmFyIHRlbXBsYXRlID0gJHRlbXBsYXRlQ2FjaGUuZ2V0KFwid2lkZ2V0VGVtcGxhdGVcIik7XG4gICAgICAgIHZhciByZW1haW5pbmcgPSB3aWRnZXRzLmxlbmd0aDtcblxuICAgICAgICBmdW5jdGlvbiBtYXliZUZpbmlzaFVwKCkge1xuICAgICAgICAgIHJlbWFpbmluZyA9IHJlbWFpbmluZyAtIDE7XG4gICAgICAgICAgaWYgKHJlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgICAgbWFrZVJlc2l6YWJsZSgpO1xuICAgICAgICAgICAgZ2V0R3JpZHN0ZXIoKS5lbmFibGUoKTtcbiAgICAgICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZG9SZW1vdmVXaWRnZXQoJG1vZGFsLCB3aWRnZXQpIHtcbiAgICAgICAgICBsb2cuZGVidWcoXCJSZW1vdmUgd2lkZ2V0OiBcIiwgd2lkZ2V0KTtcbiAgICAgICAgICB2YXIgbW9kYWwgPSAkbW9kYWwub3Blbih7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ2RlbGV0ZVdpZGdldE1vZGFsLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRtb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAgICAgJHNjb3BlLndpZGdldCA9IHdpZGdldDtcbiAgICAgICAgICAgICAgJHNjb3BlLm9rID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgcmVtb3ZlV2lkZ2V0KCRzY29wZS53aWRnZXQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgbW9kYWwuZGlzbWlzcygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZG9SZW5hbWVXaWRnZXQoJG1vZGFsLCB3aWRnZXQpIHtcbiAgICAgICAgICBsb2cuZGVidWcoXCJSZW5hbWUgd2lkZ2V0OiBcIiwgd2lkZ2V0KTtcbiAgICAgICAgICB2YXIgbW9kYWwgPSAkbW9kYWwub3Blbih7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ3JlbmFtZVdpZGdldE1vZGFsLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRtb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAgICAgJHNjb3BlLndpZGdldCA9IHdpZGdldDtcbiAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZyA9IHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAndGl0bGUnOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB3aWRnZXQudGl0bGVcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICRzY29wZS5vayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBtb2RhbC5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIG9uV2lkZ2V0UmVuYW1lZCgkc2NvcGUud2lkZ2V0KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIG1vZGFsLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfV1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaCh3aWRnZXRzLCAod2lkZ2V0KSA9PiB7XG4gICAgICAgICAgdmFyIHR5cGUgPSAnaW50ZXJuYWwnO1xuICAgICAgICAgIGlmICgnaWZyYW1lJyBpbiB3aWRnZXQpIHtcbiAgICAgICAgICAgIHR5cGUgPSAnZXh0ZXJuYWwnO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2V4dGVybmFsJzpcbiAgICAgICAgICAgICAgdmFyIHNjb3BlID0gJHNjb3BlLiRuZXcoKTtcbiAgICAgICAgICAgICAgc2NvcGUud2lkZ2V0ID0gd2lkZ2V0O1xuICAgICAgICAgICAgICBzY29wZS5yZW1vdmVXaWRnZXQgPSAod2lkZ2V0KSA9PiBkb1JlbW92ZVdpZGdldCgkbW9kYWwsIHdpZGdldCk7XG4gICAgICAgICAgICAgIHNjb3BlLnJlbmFtZVdpZGdldCA9ICh3aWRnZXQpID0+IGRvUmVuYW1lV2lkZ2V0KCRtb2RhbCwgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgdmFyIHdpZGdldEJvZHk6YW55ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldCgnaWZyYW1lV2lkZ2V0VGVtcGxhdGUuaHRtbCcpKTtcbiAgICAgICAgICAgICAgdmFyIG91dGVyRGl2ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldCgnd2lkZ2V0QmxvY2tUZW1wbGF0ZS5odG1sJykpO1xuICAgICAgICAgICAgICB3aWRnZXRCb2R5LmZpbmQoJ2lmcmFtZScpLmF0dHIoJ3NyYycsIHdpZGdldC5pZnJhbWUpO1xuICAgICAgICAgICAgICBvdXRlckRpdi5hcHBlbmQoJGNvbXBpbGUod2lkZ2V0Qm9keSkoc2NvcGUpKTtcbiAgICAgICAgICAgICAgdmFyIHcgPSBncmlkc3Rlci5hZGRfd2lkZ2V0KG91dGVyRGl2LCB3aWRnZXQuc2l6ZV94LCB3aWRnZXQuc2l6ZV95LCB3aWRnZXQuY29sLCB3aWRnZXQucm93KTtcbiAgICAgICAgICAgICAgJHNjb3BlLndpZGdldE1hcFt3aWRnZXQuaWRdID0ge1xuICAgICAgICAgICAgICAgIHdpZGdldDogd1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICBtYXliZUZpbmlzaFVwKCk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnaW50ZXJuYWwnOiBcbiAgICAgICAgICAgICAgdmFyIHBhdGggPSB3aWRnZXQucGF0aDtcbiAgICAgICAgICAgICAgdmFyIHNlYXJjaCA9IG51bGw7XG4gICAgICAgICAgICAgIGlmICh3aWRnZXQuc2VhcmNoKSB7XG4gICAgICAgICAgICAgICAgc2VhcmNoID0gRGFzaGJvYXJkLmRlY29kZVVSSUNvbXBvbmVudFByb3BlcnRpZXMod2lkZ2V0LnNlYXJjaCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHdpZGdldC5yb3V0ZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIF8uZXh0ZW5kKHNlYXJjaCwgYW5ndWxhci5mcm9tSnNvbih3aWRnZXQucm91dGVQYXJhbXMpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB2YXIgaGFzaCA9IHdpZGdldC5oYXNoOyAvLyBUT0RPIGRlY29kZSBvYmplY3Q/XG4gICAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IG5ldyBSZWN0YW5nbGVMb2NhdGlvbigkbG9jYXRpb24sIHBhdGgsIHNlYXJjaCwgaGFzaCk7XG4gICAgICAgICAgICAgIGlmICghd2lkZ2V0LnNpemVfeCB8fCB3aWRnZXQuc2l6ZV94IDwgMSkge1xuICAgICAgICAgICAgICAgIHdpZGdldC5zaXplX3ggPSAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmICghd2lkZ2V0LnNpemVfeSB8fCB3aWRnZXQuc2l6ZV95IDwgMSkge1xuICAgICAgICAgICAgICAgIHdpZGdldC5zaXplX3kgPSAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHZhciB0bXBNb2R1bGVOYW1lID0gJ2Rhc2hib2FyZC0nICsgd2lkZ2V0LmlkO1xuICAgICAgICAgICAgICB2YXIgdG1wTW9kdWxlID0gYW5ndWxhci5tb2R1bGUodG1wTW9kdWxlTmFtZSwgbW9kdWxlcyk7XG4gICAgICAgICAgICAgIHRtcE1vZHVsZS5jb25maWcoWyckcHJvdmlkZScsICgkcHJvdmlkZSkgPT4ge1xuICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcignSGF3dGlvRGFzaGJvYXJkJywgWyckZGVsZWdhdGUnLCAnJHJvb3RTY29wZScsICgkZGVsZWdhdGUsICRyb290U2NvcGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICRkZWxlZ2F0ZS5pbkRhc2hib2FyZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gJGRlbGVnYXRlO1xuICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IoJyRsb2NhdGlvbicsIFsnJGRlbGVnYXRlJywgKCRkZWxlZ2F0ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgLy9sb2cuZGVidWcoXCJVc2luZyAkbG9jYXRpb246IFwiLCBsb2NhdGlvbik7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gbG9jYXRpb247XG4gICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcignJHJvdXRlJywgWyckZGVsZWdhdGUnLCAoJGRlbGVnYXRlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAvLyByZWFsbHkgaGFuZHkgZm9yIGRlYnVnZ2luZywgbW9zdGx5IHRvIHRlbGwgaWYgYSB3aWRnZXQncyByb3V0ZVxuICAgICAgICAgICAgICAgICAgLy8gaXNuJ3QgYWN0dWFsbHkgYXZhaWxhYmxlIGluIHRoZSBjaGlsZCBhcHBcbiAgICAgICAgICAgICAgICAgIC8vbG9nLmRlYnVnKFwiVXNpbmcgJHJvdXRlOiBcIiwgJGRlbGVnYXRlKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiAkZGVsZWdhdGU7XG4gICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcignJHJvdXRlUGFyYW1zJywgWyckZGVsZWdhdGUnLCAoJGRlbGVnYXRlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAvL2xvZy5kZWJ1ZyhcIlVzaW5nICRyb3V0ZVBhcmFtczogXCIsIHNlYXJjaCk7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gc2VhcmNoO1xuICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICB0bXBNb2R1bGUuY29udHJvbGxlcignSGF3dGlvRGFzaGJvYXJkLlRpdGxlJywgW1wiJHNjb3BlXCIsIFwiJG1vZGFsXCIsICgkc2NvcGUsICRtb2RhbCkgPT4ge1xuICAgICAgICAgICAgICAgICRzY29wZS53aWRnZXQgPSB3aWRnZXQ7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnJlbW92ZVdpZGdldCA9ICh3aWRnZXQpID0+IGRvUmVtb3ZlV2lkZ2V0KCRtb2RhbCwgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgICAkc2NvcGUucmVuYW1lV2lkZ2V0ID0gKHdpZGdldCkgPT4gZG9SZW5hbWVXaWRnZXQoJG1vZGFsLCB3aWRnZXQpO1xuICAgICAgICAgICAgICB9XSk7XG5cbiAgICAgICAgICAgICAgdmFyIGRpdjphbnkgPSAkKHRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgZGl2LmF0dHIoeyAnZGF0YS13aWRnZXRJZCc6IHdpZGdldC5pZCB9KTtcbiAgICAgICAgICAgICAgdmFyIGJvZHkgPSBkaXYuZmluZCgnLndpZGdldC1ib2R5Jyk7XG4gICAgICAgICAgICAgIHZhciB3aWRnZXRCb2R5ID0gJHRlbXBsYXRlUmVxdWVzdCh3aWRnZXQuaW5jbHVkZSk7XG4gICAgICAgICAgICAgIHdpZGdldEJvZHkudGhlbigod2lkZ2V0Qm9keSkgPT4ge1xuICAgICAgICAgICAgICAgIHZhciBvdXRlckRpdiA9IGFuZ3VsYXIuZWxlbWVudCgkdGVtcGxhdGVDYWNoZS5nZXQoJ3dpZGdldEJsb2NrVGVtcGxhdGUuaHRtbCcpKTtcbiAgICAgICAgICAgICAgICBib2R5Lmh0bWwod2lkZ2V0Qm9keSk7XG4gICAgICAgICAgICAgICAgb3V0ZXJEaXYuaHRtbChkaXYpO1xuICAgICAgICAgICAgICAgIGFuZ3VsYXIuYm9vdHN0cmFwKGRpdiwgW3RtcE1vZHVsZU5hbWVdKTtcbiAgICAgICAgICAgICAgICB2YXIgdyA9IGdyaWRzdGVyLmFkZF93aWRnZXQob3V0ZXJEaXYsIHdpZGdldC5zaXplX3gsIHdpZGdldC5zaXplX3ksIHdpZGdldC5jb2wsIHdpZGdldC5yb3cpO1xuICAgICAgICAgICAgICAgICRzY29wZS53aWRnZXRNYXBbd2lkZ2V0LmlkXSA9IHtcbiAgICAgICAgICAgICAgICAgIHdpZGdldDogd1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgbWF5YmVGaW5pc2hVcCgpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gc2VyaWFsaXplRGFzaGJvYXJkKCkge1xuICAgICAgICB2YXIgZ3JpZHN0ZXIgPSBnZXRHcmlkc3RlcigpO1xuICAgICAgICBpZiAoZ3JpZHN0ZXIpIHtcbiAgICAgICAgICB2YXIgZGF0YSA9IGdyaWRzdGVyLnNlcmlhbGl6ZSgpO1xuICAgICAgICAgIC8vY29uc29sZS5sb2coXCJnb3QgZGF0YTogXCIgKyBKU09OLnN0cmluZ2lmeShkYXRhKSk7XG5cbiAgICAgICAgICB2YXIgd2lkZ2V0cyA9ICRzY29wZS5kYXNoYm9hcmQud2lkZ2V0cyB8fCBbXTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIldpZGdldHM6IFwiLCB3aWRnZXRzKTtcblxuICAgICAgICAgIC8vIGxldHMgYXNzdW1lIHRoZSBkYXRhIGlzIGluIHRoZSBvcmRlciBvZiB0aGUgd2lkZ2V0cy4uLlxuICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaCh3aWRnZXRzLCAod2lkZ2V0LCBpZHgpID0+IHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGRhdGFbaWR4XTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB3aWRnZXQpIHtcbiAgICAgICAgICAgICAgLy8gbGV0cyBjb3B5IHRoZSB2YWx1ZXMgYWNyb3NzXG4gICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaCh2YWx1ZSwgKGF0dHIsIGtleSkgPT4gd2lkZ2V0W2tleV0gPSBhdHRyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG1ha2VSZXNpemFibGUoKSB7XG4gICAgICAgIHZhciBibG9ja3M6YW55ID0gJCgnLmdyaWQtYmxvY2snKTtcbiAgICAgICAgYmxvY2tzLnJlc2l6YWJsZSgnZGVzdHJveScpO1xuXG4gICAgICAgIGJsb2Nrcy5yZXNpemFibGUoe1xuICAgICAgICAgIGdyaWQ6IFtncmlkU2l6ZSArIChncmlkTWFyZ2luICogMiksIGdyaWRTaXplICsgKGdyaWRNYXJnaW4gKiAyKV0sXG4gICAgICAgICAgYW5pbWF0ZTogZmFsc2UsXG4gICAgICAgICAgbWluV2lkdGg6IGdyaWRTaXplLFxuICAgICAgICAgIG1pbkhlaWdodDogZ3JpZFNpemUsXG4gICAgICAgICAgYXV0b0hpZGU6IGZhbHNlLFxuICAgICAgICAgIHN0YXJ0OiBmdW5jdGlvbihldmVudCwgdWkpIHtcbiAgICAgICAgICAgIGdyaWRIZWlnaHQgPSBnZXRHcmlkc3RlcigpLiRlbC5oZWlnaHQoKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlc2l6ZTogZnVuY3Rpb24oZXZlbnQsIHVpKSB7XG4gICAgICAgICAgICAvL3NldCBuZXcgZ3JpZCBoZWlnaHQgYWxvbmcgdGhlIGRyYWdnaW5nIHBlcmlvZFxuICAgICAgICAgICAgdmFyIGcgPSBnZXRHcmlkc3RlcigpO1xuICAgICAgICAgICAgdmFyIGRlbHRhID0gZ3JpZFNpemUgKyBncmlkTWFyZ2luICogMjtcbiAgICAgICAgICAgIGlmIChldmVudC5vZmZzZXRZID4gZy4kZWwuaGVpZ2h0KCkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHZhciBleHRyYSA9IE1hdGguZmxvb3IoKGV2ZW50Lm9mZnNldFkgLSBncmlkSGVpZ2h0KSAvIGRlbHRhICsgMSk7XG4gICAgICAgICAgICAgIHZhciBuZXdIZWlnaHQgPSBncmlkSGVpZ2h0ICsgZXh0cmEgKiBkZWx0YTtcbiAgICAgICAgICAgICAgZy4kZWwuY3NzKCdoZWlnaHQnLCBuZXdIZWlnaHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgc3RvcDogZnVuY3Rpb24oZXZlbnQsIHVpKSB7XG4gICAgICAgICAgICB2YXIgcmVzaXplZCA9ICQodGhpcyk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXNpemVCbG9jayhyZXNpemVkKTtcbiAgICAgICAgICAgIH0sIDMwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAkKCcudWktcmVzaXphYmxlLWhhbmRsZScpLmhvdmVyKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGdldEdyaWRzdGVyKCkuZGlzYWJsZSgpO1xuICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBnZXRHcmlkc3RlcigpLmVuYWJsZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgfVxuXG5cbiAgICAgIGZ1bmN0aW9uIHJlc2l6ZUJsb2NrKGVsbU9iaikge1xuICAgICAgICB2YXIgYXJlYSA9IGVsbU9iai5maW5kKCcud2lkZ2V0LWFyZWEnKTtcbiAgICAgICAgdmFyIHcgPSBlbG1PYmoud2lkdGgoKSAtIGdyaWRTaXplO1xuICAgICAgICB2YXIgaCA9IGVsbU9iai5oZWlnaHQoKSAtIGdyaWRTaXplO1xuXG4gICAgICAgIGZvciAodmFyIGdyaWRfdyA9IDE7IHcgPiAwOyB3IC09IChncmlkU2l6ZSArIChncmlkTWFyZ2luICogMikpKSB7XG4gICAgICAgICAgZ3JpZF93Kys7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBncmlkX2ggPSAxOyBoID4gMDsgaCAtPSAoZ3JpZFNpemUgKyAoZ3JpZE1hcmdpbiAqIDIpKSkge1xuICAgICAgICAgIGdyaWRfaCsrO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHdpZGdldCA9IHtcbiAgICAgICAgICBpZDogYXJlYS5hdHRyKCdkYXRhLXdpZGdldElkJylcbiAgICAgICAgfTtcblxuICAgICAgICBjaGFuZ2VXaWRnZXRTaXplKHdpZGdldCwgZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgICAgICAgd2lkZ2V0LnNpemVfeCA9IGdyaWRfdztcbiAgICAgICAgICB3aWRnZXQuc2l6ZV95ID0gZ3JpZF9oO1xuICAgICAgICB9LCBmdW5jdGlvbih3aWRnZXQpIHtcbiAgICAgICAgICBpZiAoc2VyaWFsaXplRGFzaGJvYXJkKCkpIHtcbiAgICAgICAgICAgIHVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkoXCJDaGFuZ2VkIHNpemUgb2Ygd2lkZ2V0OiBcIiArIHdpZGdldC5pZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiB1cGRhdGVEYXNoYm9hcmRSZXBvc2l0b3J5KG1lc3NhZ2U6IHN0cmluZykge1xuICAgICAgICBpZiAoJHNjb3BlLmRhc2hib2FyZCkge1xuICAgICAgICAgIHZhciBjb21taXRNZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICBpZiAoJHNjb3BlLmRhc2hib2FyZCAmJiAkc2NvcGUuZGFzaGJvYXJkLnRpdGxlKSB7XG4gICAgICAgICAgICBjb21taXRNZXNzYWdlICs9IFwiIG9uIGRhc2hib2FyZCBcIiArICRzY29wZS5kYXNoYm9hcmQudGl0bGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbJHNjb3BlLmRhc2hib2FyZF0sIGNvbW1pdE1lc3NhZ2UsIERhc2hib2FyZC5vbk9wZXJhdGlvbkNvbXBsZXRlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBnZXRHcmlkc3RlcigpIHtcbiAgICAgICAgcmV0dXJuICRlbGVtZW50LmdyaWRzdGVyKCkuZGF0YSgnZ3JpZHN0ZXInKTtcbiAgICAgIH1cblxuICAgIH1dO1xuXG4gIH1cblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG4gIF9tb2R1bGUuY29udHJvbGxlcihcIkRhc2hib2FyZC5JbXBvcnRDb250cm9sbGVyXCIsIFtcIiRzY29wZVwiLCBcIiRsb2NhdGlvblwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgKCRzY29wZSwgJGxvY2F0aW9uLCAkcm91dGVQYXJhbXMsIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSkgPT4ge1xuICAgICRzY29wZS5wbGFjZWhvbGRlciA9IFwiUGFzdGUgdGhlIEpTT04gaGVyZSBmb3IgdGhlIGRhc2hib2FyZCBjb25maWd1cmF0aW9uIHRvIGltcG9ydC4uLlwiO1xuICAgICRzY29wZS5zb3VyY2UgPSAkc2NvcGUucGxhY2Vob2xkZXI7XG5cbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIG1vZGU6IHtcbiAgICAgICAgbmFtZTogXCJqYXZhc2NyaXB0XCJcbiAgICAgIH1cbiAgICB9O1xuICAgIC8vJHNjb3BlLmNvZGVNaXJyb3JPcHRpb25zID0gQ29kZUVkaXRvci5jcmVhdGVFZGl0b3JTZXR0aW5ncyhvcHRpb25zKTtcblxuXG4gICAgJHNjb3BlLmlzVmFsaWQgPSAoKSA9PiAkc2NvcGUuc291cmNlICYmICRzY29wZS5zb3VyY2UgIT09ICRzY29wZS5wbGFjZWhvbGRlcjtcblxuICAgICRzY29wZS5pbXBvcnRKU09OID0gKCkgPT4ge1xuICAgICAgdmFyIGpzb24gPSBbXTtcbiAgICAgIC8vIGxldHMgcGFyc2UgdGhlIEpTT04uLi5cbiAgICAgIHRyeSB7XG4gICAgICAgIGpzb24gPSBKU09OLnBhcnNlKCRzY29wZS5zb3VyY2UpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvL0hhd3Rpb0NvcmUubm90aWZpY2F0aW9uKFwiZXJyb3JcIiwgXCJDb3VsZCBub3QgcGFyc2UgdGhlIEpTT05cXG5cIiArIGUpO1xuICAgICAgICBqc29uID0gW107XG4gICAgICB9XG4gICAgICB2YXIgYXJyYXkgPSBbXTtcbiAgICAgIGlmIChhbmd1bGFyLmlzQXJyYXkoanNvbikpIHtcbiAgICAgICAgYXJyYXkgPSBqc29uO1xuICAgICAgfSBlbHNlIGlmIChhbmd1bGFyLmlzT2JqZWN0KGpzb24pKSB7XG4gICAgICAgIGFycmF5LnB1c2goanNvbik7XG4gICAgICB9XG5cbiAgICAgIGlmIChhcnJheS5sZW5ndGgpIHtcbiAgICAgICAgLy8gbGV0cyBlbnN1cmUgd2UgaGF2ZSBzb21lIHZhbGlkIGlkcyBhbmQgc3R1ZmYuLi5cbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKGFycmF5LCAoZGFzaCwgaW5kZXgpID0+IHtcbiAgICAgICAgICBhbmd1bGFyLmNvcHkoZGFzaCwgZGFzaGJvYXJkUmVwb3NpdG9yeS5jcmVhdGVEYXNoYm9hcmQoZGFzaCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKGFycmF5LCBcIkltcG9ydGVkIGRhc2hib2FyZCBKU09OXCIsIERhc2hib2FyZC5vbk9wZXJhdGlvbkNvbXBsZXRlKTtcbiAgICAgICAgJGxvY2F0aW9uLnBhdGgoXCIvZGFzaGJvYXJkL2VkaXRcIik7XG4gICAgICB9XG4gICAgfVxuICB9XSk7XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcbiAgX21vZHVsZS5jb250cm9sbGVyKFwiRGFzaGJvYXJkLk5hdkJhckNvbnRyb2xsZXJcIiwgW1wiJHNjb3BlXCIsIFwiJHJvdXRlUGFyYW1zXCIsIFwiJHJvb3RTY29wZVwiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgKCRzY29wZSwgJHJvdXRlUGFyYW1zLCAkcm9vdFNjb3BlLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnkpID0+IHtcblxuICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IFtdO1xuXG4gICAgJHNjb3BlLmFjdGl2ZURhc2hib2FyZCA9ICRyb3V0ZVBhcmFtc1snZGFzaGJvYXJkSWQnXTtcblxuICAgICRzY29wZS4kb24oJ2xvYWREYXNoYm9hcmRzJywgbG9hZERhc2hib2FyZHMpO1xuXG4gICAgJHNjb3BlLiRvbignZGFzaGJvYXJkc1VwZGF0ZWQnLCBkYXNoYm9hcmRMb2FkZWQpO1xuXG4gICAgJHNjb3BlLmRhc2hib2FyZHMgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gJHNjb3BlLl9kYXNoYm9hcmRzXG4gICAgfTtcblxuICAgICRzY29wZS5vblRhYlJlbmFtZWQgPSBmdW5jdGlvbihkYXNoKSB7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoW2Rhc2hdLCBcIlJlbmFtZWQgZGFzaGJvYXJkXCIsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBkYXNoYm9hcmRMb2FkZWQoZXZlbnQsIGRhc2hib2FyZHMpIHtcbiAgICAgIGxvZy5kZWJ1ZyhcIm5hdmJhciBkYXNoYm9hcmRMb2FkZWQ6IFwiLCBkYXNoYm9hcmRzKTtcbiAgICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IGRhc2hib2FyZHM7XG4gICAgICBpZiAoZXZlbnQgPT09IG51bGwpIHtcbiAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdkYXNoYm9hcmRzVXBkYXRlZCcsIGRhc2hib2FyZHMpO1xuICAgICAgICBDb3JlLiRhcHBseSgkc2NvcGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvYWREYXNoYm9hcmRzKGV2ZW50KSB7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZHMoKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgLy8gcHJldmVudCB0aGUgYnJvYWRjYXN0IGZyb20gaGFwcGVuaW5nLi4uXG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfV0pO1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG4gIGV4cG9ydCB2YXIgU2hhcmVDb250cm9sbGVyID0gX21vZHVsZS5jb250cm9sbGVyKFwiRGFzaGJvYXJkLlNoYXJlQ29udHJvbGxlclwiLCBbXCIkc2NvcGVcIiwgXCIkbG9jYXRpb25cIiwgXCIkcm91dGVQYXJhbXNcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsICgkc2NvcGUsICRsb2NhdGlvbiwgJHJvdXRlUGFyYW1zLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnkpID0+IHtcbiAgICB2YXIgaWQgPSAkcm91dGVQYXJhbXNbXCJkYXNoYm9hcmRJZFwiXTtcbiAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZChpZCwgb25EYXNoYm9hcmRMb2FkKTtcblxuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgbW9kZToge1xuICAgICAgICAgIG5hbWU6IFwiamF2YXNjcmlwdFwiXG4gICAgICB9XG4gICAgfTtcbiAgICAvLyRzY29wZS5jb2RlTWlycm9yT3B0aW9ucyA9IENvZGVFZGl0b3IuY3JlYXRlRWRpdG9yU2V0dGluZ3Mob3B0aW9ucyk7XG5cbiAgICBmdW5jdGlvbiBvbkRhc2hib2FyZExvYWQoZGFzaGJvYXJkKSB7XG4gICAgICAkc2NvcGUuZGFzaGJvYXJkID0gRGFzaGJvYXJkLmNsZWFuRGFzaGJvYXJkRGF0YShkYXNoYm9hcmQpO1xuXG4gICAgICAkc2NvcGUuanNvbiA9IHtcbiAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcImhhd3RpbyBkYXNoYm9hcmRzXCIsXG4gICAgICAgIFwicHVibGljXCI6IHRydWUsXG4gICAgICAgIFwiZmlsZXNcIjoge1xuICAgICAgICAgIFwiZGFzaGJvYXJkcy5qc29uXCI6IHtcbiAgICAgICAgICAgIFwiY29udGVudFwiOiBKU09OLnN0cmluZ2lmeSgkc2NvcGUuZGFzaGJvYXJkLCBudWxsLCBcIiAgXCIpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuc291cmNlID0gSlNPTi5zdHJpbmdpZnkoJHNjb3BlLmRhc2hib2FyZCwgbnVsbCwgXCIgIFwiKTtcbiAgICAgIENvcmUuJGFwcGx5Tm93T3JMYXRlcigkc2NvcGUpO1xuICAgIH1cbiAgfV0pO1xufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
angular.module("hawtio-dashboard-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("plugins/dashboard/html/addToDashboard.html","<div class=\"controller-section\" ng-controller=\"Dashboard.EditDashboardsController\">\n  <div class=\"row-fluid\">\n    <div class=\"span10 offset1 well\">\n      Select a dashboard (or multiple dashboards) in the table below and click \"Add View To Dashboard\" to add the view to a dashboard.  You can also create a new dashboard using the \"Create\" button, select it and then click the \"Add View To Dashboard\" to add the view to a new dashboard.\n    </div>\n  </div>\n  <div class=\"row-fluid\">\n\n    <div class=\"span12\">\n      <ul class=\"nav nav-tabs\">\n        <li>\n          <button class=\"btn btn-primary\" \n                  ng-disabled=\"!hasSelection()\" ng-click=\"addViewToDashboard()\"\n                  title=\"Adds the current view to the selected dashboard(s)\" data-placement=\"bottom\">\n            <i class=\"fa fa-dashboard\"></i> Add View To Dashboard\n          </a>\n        </li>\n        <li>\n          <button class=\"btn btn-success\" ng-click=\"create()\"\n             title=\"Create a new empty dashboard\"\n             data-placement=\"bottom\">\n            <i class=\"fa fa-plus\"></i> Create</button>\n        </li>\n      </ul>\n\n    </div>\n    <!--\n    <div class=\"span6\">\n      <div class=\"control-group\">\n        <input type=\"text\" class=\"span12 search-query\" ng-model=\"gridOptions.filterOptions.filterText\" placeholder=\"Filter...\">\n      </div>\n    </div>\n    -->\n  </div>\n\n  <div class=\"row-fluid\">\n    <table class=\"table table-striped\" hawtio-simple-table=\"gridOptions\"></table>\n  </div>\n</div>\n");
$templateCache.put("plugins/dashboard/html/dashboard.html","<script type=\"text/ng-template\" id=\"widgetTemplate\">\n  <div class=\"widget-area\">\n    <div class=\"widget-title\" ng-controller=\"HawtioDashboard.Title\">\n      <div class=\"row-fluid\">\n        <div class=\"pull-left\">\n          {{widget.title}}\n        </div>\n        <div class=\"pull-right\">\n          <i class=\"fa fa-pencil\" title=\"Rename this widget\" ng-click=\"renameWidget(widget)\"></i>\n          <i class=\"fa fa-times\" title=\"Removes this view from the dashboard\" ng-click=\"removeWidget(widget)\"></i>\n        </div>\n      </div>\n    </div>\n    <div class=\"widget-body\">\n    </div>\n  </div>\n</script>\n<script type=\"text/ng-template\" id=\"iframeWidgetTemplate.html\">\n  <div class=\"widget-area\" data-widgetId=\"{{widget.id}}\">\n    <div class=\"widget-title\">\n      <div class=\"row-fluid\">\n        <div class=\"pull-left\">\n          {{widget.title}}\n        </div>\n        <div class=\"pull-right\">\n          <i class=\"fa fa-pencil\" title=\"Rename this widget\" ng-click=\"renameWidget(widget)\"></i>\n          <i class=\"fa fa-times\" title=\"Removes this view from the dashboard\" ng-click=\"removeWidget(widget)\"></i>\n        </div>\n      </div>\n    </div>\n    <div class=\"widget-body\">\n      <div class=\"iframe-holder\">\n        <iframe seamless=\"true\"></iframe>\n      </div>\n    </div>\n  </div>\n</script>\n<script type=\"text/ng-template\" id=\"widgetBlockTemplate.html\">\n  <li class=\"grid-block\" style=\"display: list-item; position: absolute\" ng-non-bindable data-$injector=\"\"></li>\n</script>\n\n<!--\n<div class=\"gridster\" ng-controller=\"Dashboard.DashboardController\">\n  <ul id=\"widgets\">\n  </ul>\n</div>\n-->\n\n<div class=\"row-fluid\">\n  <div class=\"span12 gridster\">\n    <ul id=\"widgets\" hawtio-dashboard></ul>\n  </div>\n</div>\n\n\n");
$templateCache.put("plugins/dashboard/html/deleteDashboardModal.html","<div class=\"modal-header\">\n  <h3 class=\"modal-title\">Delete Dashboards?</h3>\n</div>\n<div class=\"modal-body\">\n  <p>Are you sure you want to delete the selected dashboards:</p>\n  <ul>\n    <li ng-repeat=\"dashboard in selected track by $index\">{{dashboard.title}}</li>\n  </ul>\n  <p class=\"strong\">This operation cannot be undone</p>\n</div>\n<div class=\"modal-footer\">\n  <button class=\"btn btn-primary\" ng-click=\"ok()\">OK</button>\n  <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n</div>\n");
$templateCache.put("plugins/dashboard/html/deleteWidgetModal.html","<div class=\"modal-header\">\n  <h3 class=\"modal-title\">Delete Widget</h3>\n</div>\n<div class=\"modal-body\">\n  <p>Are you sure you want to delete the widget <span ng-show=\"widget.title\">\"{{widget.title}}\"</span>?</p>\n  <p class=\"strong\">This operation cannot be undone</p>\n</div>\n<div class=\"modal-footer\">\n  <button class=\"btn btn-primary\" ng-click=\"ok()\">OK</button>\n  <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n</div>\n");
$templateCache.put("plugins/dashboard/html/editDashboardTitleCell.html","<div class=\"ngCellText\"><a href=\"/dashboard/id/{{row.entity.id}}{{row.entity.hash}}\">{{row.entity.title}}</a></div>\n");
$templateCache.put("plugins/dashboard/html/editDashboards.html","<div ng-controller=\"Dashboard.EditDashboardsController\">\n  <div class=\"row\">\n    <div class=\"col-md-12\">\n      <p></p>\n      <ul class=\"nav nav-tabs\">\n        <li>\n          <button class=\"btn btn-success\" ng-click=\"create()\"\n             title=\"Create a new empty dashboard\"\n             data-placement=\"bottom\">\n            <i class=\"fa fa-plus\"></i> Create</button>\n        </li>\n        <li>\n          <button class=\"btn\" ng-click=\"renameDashboard()\"\n            ng-disabled=\"gridOptions.selectedItems.length !== 1\"\n             title=\"Rename the selected dashboard\"\n             data-placement=\"bottom\">\n            <i class=\"fa fa-arrows-h\"></i> Rename</button>\n        </li>\n        <li>\n          <button class=\"btn\" ng-disabled=\"!hasSelection()\"\n             ng-click=\"duplicate()\"\n                  title=\"Create a copy of the selected dashboard(s)\" data-placement=\"bottom\">\n            <i class=\"fa fa-copy\"></i> Duplicate\n          </button>\n        </li>\n        <li>\n          <button class=\"btn btn-danger\" ng-disabled=\"!hasSelection()\"\n             ng-click=\"deleteDashboard()\">\n             <i class=\"fa fa-remove\"></i> Delete\n          </button>\n        </li>\n        <!--\n        <li class=\"pull-right\">\n          <button class=\"btn btn-primary\" href=\"#/dashboard/import\"\n             title=\"Imports a JSON dashboard configuration from github or some other URL\"\n             data-placement=\"bottom\">\n            <i class=\"fa fa-cloud-download\"></i> Import\n          </button>\n        </li>\n        -->\n      </ul>\n    </div>\n  </div>\n\n  <div class=\"row\">\n    <div class=\"col-md-12\">\n      <p></p>\n      <table class=\"table table-striped\" hawtio-simple-table=\"gridOptions\"></table>\n    </div>\n  </div>\n\n</div>\n");
$templateCache.put("plugins/dashboard/html/import.html","<div class=\"form-horizontal\" ng-controller=\"Dashboard.ImportController\">\n  <div class=\"control-group\">\n    <button id=\"importButton\" ng-disabled=\"!isValid()\" ng-click=\"importJSON()\"\n            class=\"btn btn-info\"\n            title=\"Imports the JSON configuration of the dashboard\">\n      <i class=\"icon-cloud-download\"></i> import dashboard JSON\n    </button>\n    <div id=\"alert-area\" class=\"span9 pull-right\"></div>\n  </div>\n  <div class=\"control-group\">\n    <textarea id=\"source\" ui-codemirror=\"codeMirrorOptions\" ng-model=\"source\"></textarea>\n  </div>\n</div>");
$templateCache.put("plugins/dashboard/html/renameDashboardModal.html","<div class=\"modal-header\">\n  <h3 class=\"modal-title\">Rename Dashboard \"{{selected.title}}\"</h3>\n</div>\n<div class=\"modal-body\">\n  <div hawtio-form-2=\"config\" entity=\"selected\"></div>\n</div>\n<div class=\"modal-footer\">\n  <button class=\"btn btn-primary\" ng-click=\"ok()\">OK</button>\n  <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n</div>\n");
$templateCache.put("plugins/dashboard/html/renameWidgetModal.html","<div class=\"modal-header\">\n  <h3 class=\"modal-title\">Rename Dashboard</h3>\n</div>\n<div class=\"modal-body\">\n  <div hawtio-form-2=\"config\" entity=\"widget\"></div>\n</div>\n<div class=\"modal-footer\">\n  <button class=\"btn btn-primary\" ng-click=\"ok()\">OK</button>\n  <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n</div>\n");}]); hawtioPluginLoader.addModule("hawtio-dashboard-templates");