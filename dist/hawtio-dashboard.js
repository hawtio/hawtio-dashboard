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
/// <reference path="../libs/hawtio-utilities/defs.d.ts"/>



/// <reference path="../../includes.ts"/>
/// <reference path="dashboardInterfaces.ts"/>
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

/// <reference path="dashboardHelpers.ts"/>
var Dashboard;
(function (Dashboard) {
    Dashboard.templatePath = 'plugins/dashboard/html/';
    Dashboard.pluginName = 'dashboard';
    Dashboard._module = angular.module(Dashboard.pluginName, []);
    Dashboard._module.config(["$routeProvider", "$provide", function ($routeProvider, $provide) {
            $provide.decorator('HawtioDashboard', ['$delegate', function ($delegate) {
                    $delegate['hasDashboard'] = true;
                    $delegate['getAddLink'] = function (title, size_x, size_y) {
                        var target = new URI('/dashboard/add');
                        var currentUri = new URI();
                        var widgetUri = new URI(currentUri.path());
                        widgetUri.query(currentUri.query(true));
                        target.query(function (query) {
                            query.href = widgetUri.toString().escapeURL();
                            if (title) {
                                query.title = title.escapeURL();
                            }
                            if (size_x && size_y) {
                                query.size = angular.toJson({ size_x: size_x, size_y: size_y }).escapeURL();
                            }
                        });
                        return target.toString();
                    };
                    return $delegate;
                }]);
            $routeProvider.
                when('/dashboard/add', { templateUrl: Dashboard.templatePath + 'addToDashboard.html' }).
                when('/dashboard/edit', { templateUrl: Dashboard.templatePath + 'editDashboards.html' }).
                when('/dashboard/idx/:dashboardIndex', { templateUrl: Dashboard.templatePath + 'dashboard.html', reloadOnSearch: false }).
                when('/dashboard/id/:dashboardId', { templateUrl: Dashboard.templatePath + 'dashboard.html', reloadOnSearch: false }).
                when('/dashboard/id/:dashboardId/share', { templateUrl: Dashboard.templatePath + 'share.html' }).
                when('/dashboard/import', { templateUrl: Dashboard.templatePath + 'import.html' });
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
            var child = builder
                .id('dashboard-' + dashboard.id)
                .title(function () { return dashboard.title || dashboard.id; })
                .href(function () {
                var uri = new URI(UrlHelpers.join('/dashboard/id', dashboard.id));
                uri.search({
                    'main-tab': Dashboard.pluginName,
                    'sub-tab': 'dashboard-' + dashboard.id
                });
                return uri.toString();
            })
                .build();
            tab.tabs.push(child);
        });
        var manage = builder
            .id('dashboard-manage')
            .title(function () { return '<i class="fa fa-pencil"></i>&nbsp;Manage'; })
            .href(function () { return '/dashboard/edit?main-tab=dashboard&sub-tab=dashboard-manage'; })
            .build();
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
                tab = builder.id(Dashboard.pluginName)
                    .href(function () { return '/dashboard/idx/0'; })
                    .title(function () { return 'Dashboard'; })
                    .build();
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

/// <reference path="dashboardPlugin.ts"/>
/// <reference path="dashboardInterfaces.ts"/>
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
                var existing = dashboards.findIndex(function (d) { return d.id === dash.id; });
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
                dashboards.remove(function (i) { return i.id === item.id; });
            });
            fn(this.storeDashboards(dashboards));
        };
        LocalDashboardRepository.prototype.getDashboards = function (fn) {
            fn(this.loadDashboards());
        };
        LocalDashboardRepository.prototype.getDashboard = function (id, fn) {
            var dashboards = this.loadDashboards();
            var dashboard = dashboards.find(function (dashboard) { return dashboard.id === id; });
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

/// <reference path="dashboardPlugin.ts"/>
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
                    id: Core.getUUID(),
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
                        return !(left(w2) > right(w1) ||
                            right(w2) < left(w1) ||
                            top(w2) > bottom(w1) ||
                            bottom(w2) < top(w1));
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
                        }).removeQuery('href')
                            .removeQuery('title')
                            .removeQuery('iframe')
                            .removeQuery('size');
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
                var modal = $modal.open({
                    templateUrl: UrlHelpers.join(Dashboard.templatePath, 'createDashboardModal.html'),
                    controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                            $scope.entity = {
                                title: title
                            };
                            $scope.config = {
                                properties: {
                                    'title': {
                                        type: 'string',
                                    }
                                }
                            };
                            $scope.ok = function () {
                                modal.close();
                                var title = $scope.entity.title;
                                var newDash = dashboardRepository.createDashboard({ title: title });
                                dashboardRepository.putDashboards([newDash], "Created new dashboard: " + title, function (dashboards) {
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
                commitMessage = commitMessage + newDashboards.map(function (d) { return d.title; }).join(',');
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

/// <reference path="dashboardHelpers.ts"/>
var Dashboard;
(function (Dashboard) {
    var RectangleLocation = (function () {
        function RectangleLocation(delegate, path, search, hash) {
            var _this = this;
            this.delegate = delegate;
            this._path = path;
            this._search = search;
            this._hash = hash;
            this.uri = new URI(path);
            this.uri.search(function (query) {
                return _this._search;
            });
        }
        RectangleLocation.prototype.absUrl = function () {
            return this.protocol() + this.host() + ":" + this.port() + this.path() + this.search();
        };
        RectangleLocation.prototype.hash = function (newHash) {
            if (newHash === void 0) { newHash = null; }
            if (newHash) {
                this.uri.search(newHash);
                return this;
            }
            return this._hash;
        };
        RectangleLocation.prototype.host = function () {
            return this.delegate.host();
        };
        RectangleLocation.prototype.path = function (newPath) {
            if (newPath === void 0) { newPath = null; }
            if (newPath) {
                this.uri.path(newPath);
                return this;
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
                this.uri.search(parametersMap);
                return this;
            }
            return this._search;
        };
        RectangleLocation.prototype.url = function (newValue) {
            if (newValue === void 0) { newValue = null; }
            if (newValue) {
                this.uri = new URI(newValue);
                return this;
            }
            return this.absUrl();
        };
        return RectangleLocation;
    })();
    Dashboard.RectangleLocation = RectangleLocation;
})(Dashboard || (Dashboard = {}));

/// <reference path="dashboardPlugin.ts"/>
/// <reference path="dashboardRepository.ts"/>
/// <reference path="rectangleLocation.ts"/>
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
            this.controller = ["$scope", "$element", "$attrs", "$location", "$routeParams", "$templateCache", "dashboardRepository", "$compile", "$templateRequest", "$interpolate", "$modal", "$sce", "$timeout", function ($scope, $element, $attrs, $location, $routeParams, $templateCache, dashboardRepository, $compile, $templateRequest, $interpolate, $modal, $sce, $timeout) {
                    var gridSize = 150;
                    var gridMargin = 6;
                    var gridHeight;
                    var gridX = gridSize;
                    var gridY = gridSize;
                    var widgetMap = {};
                    var dashboardRepository = $scope.$eval('dashboardRepository') || dashboardRepository;
                    $scope.$on('$destroy', function () {
                        angular.forEach(widgetMap, function (value, key) {
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
                        var widgetData = widgetMap[widget.id];
                        if (widgetData) {
                            delete widgetMap[widget.id];
                            widgetElem = widgetData.widget;
                        }
                        if (!widgetElem) {
                            widgetElem = $element.find("[data-widgetId='" + widget.id + "']").parent();
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
                        Dashboard.log.debug("Widget ID: ", widget.id, " widgetMap: ", widgetMap);
                        var entry = widgetMap[widget.id];
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
                        $scope.id = $scope.$eval('dashboardId') || $routeParams["dashboardId"];
                        $scope.idx = $scope.$eval('dashboardIndex') || $routeParams["dashboardIndex"];
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
                                if ($scope.$eval('dashboardEmbedded')) {
                                    Core.$apply($scope);
                                    return;
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
                            if (angular.isDefined(widget.size_x
                                && angular.isDefined(widget.col))) {
                                var rightEdge = widget.col + widget.size_x;
                                if (rightEdge > minWidth) {
                                    minWidth = rightEdge + 1;
                                }
                            }
                        });
                        var gridster = $element.gridster({
                            widget_margins: [gridMargin, gridMargin],
                            widget_base_dimensions: [gridX, gridY],
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
                        var template = $templateCache.get(UrlHelpers.join(Dashboard.templatePath, "widgetTemplate.html"));
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
                                    Dashboard.log.debug("Rendering external (iframe) widget: ", widget.title || widget.id);
                                    var scope = $scope.$new();
                                    scope.widget = widget;
                                    scope.removeWidget = function (widget) { return doRemoveWidget($modal, widget); };
                                    scope.renameWidget = function (widget) { return doRenameWidget($modal, widget); };
                                    var widgetBody = angular.element($templateCache.get(UrlHelpers.join(Dashboard.templatePath, 'iframeWidgetTemplate.html')));
                                    var outerDiv = angular.element($templateCache.get(UrlHelpers.join(Dashboard.templatePath, 'widgetBlockTemplate.html')));
                                    widgetBody.find('iframe').attr('src', widget.iframe);
                                    outerDiv.append($compile(widgetBody)(scope));
                                    var w = gridster.add_widget(outerDiv, widget.size_x, widget.size_y, widget.col, widget.row);
                                    widgetMap[widget.id] = {
                                        widget: w
                                    };
                                    maybeFinishUp();
                                    break;
                                case 'internal':
                                    Dashboard.log.debug("Rendering internal widget: ", widget.title || widget.id);
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
                                    var plugins = _.filter(hawtioPluginLoader.getModules(), function (module) { return angular.isString(module); });
                                    var tmpModule = angular.module(tmpModuleName, plugins);
                                    function getServices(module, answer) {
                                        if (!answer) {
                                            answer = {};
                                        }
                                        _.forEach(angular.module(module).requires, function (m) { return getServices(m, answer); });
                                        _.forEach(angular.module(module)._invokeQueue, function (a) {
                                            try {
                                                answer[a[2][0]] = HawtioCore.injector.get(a[2][0]);
                                            }
                                            catch (err) {
                                            }
                                        });
                                        return answer;
                                    }
                                    ;
                                    var services = {};
                                    _.forEach(plugins, function (plugin) { return plugin ? getServices(plugin, services) : console.log("null plugin name"); });
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
                                            _.forIn(services, function (service, name) {
                                                switch (name) {
                                                    case '$location':
                                                    case '$route':
                                                    case '$routeParams':
                                                    case 'HawtioDashboard':
                                                        return;
                                                }
                                                try {
                                                    $provide.decorator(name, [function () {
                                                            console.log("Returning existing service for: ", name);
                                                            return service;
                                                        }]);
                                                }
                                                catch (err) {
                                                }
                                            });
                                        }]);
                                    tmpModule.controller('HawtioDashboard.Title', ["$scope", "$modal", function ($scope, $modal) {
                                            $scope.widget = widget;
                                            $scope.removeWidget = function (widget) { return doRemoveWidget($modal, widget); };
                                            $scope.renameWidget = function (widget) { return doRenameWidget($modal, widget); };
                                        }]);
                                    var div = $(template);
                                    div.attr({ 'data-widgetId': widget.id });
                                    var body = div.find('.widget-body');
                                    Dashboard.log.debug("include: ", widget.include);
                                    var widgetBody = $templateCache.get(widget.include);
                                    $timeout(function () {
                                        var outerDiv = angular.element($templateCache.get(UrlHelpers.join(Dashboard.templatePath, 'widgetBlockTemplate.html')));
                                        body.html(widgetBody);
                                        outerDiv.html(div);
                                        angular.bootstrap(div, [tmpModuleName]);
                                        widgetMap[widget.id] = {
                                            widget: gridster.add_widget(outerDiv, widget.size_x, widget.size_y, widget.col, widget.row)
                                        };
                                        maybeFinishUp();
                                    }, 50);
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

/// <reference path="dashboardPlugin.ts"/>
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

/// <reference path="dashboardPlugin.ts"/>
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

/// <reference path="dashboardPlugin.ts"/>
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluY2x1ZGVzLnRzIiwiZGFzaGJvYXJkL3RzL2Rhc2hib2FyZEludGVyZmFjZXMudHMiLCJkYXNoYm9hcmQvdHMvZGFzaGJvYXJkSGVscGVycy50cyIsImRhc2hib2FyZC90cy9kYXNoYm9hcmRQbHVnaW4udHMiLCJkYXNoYm9hcmQvdHMvZGFzaGJvYXJkUmVwb3NpdG9yeS50cyIsImRhc2hib2FyZC90cy9lZGl0RGFzaGJvYXJkcy50cyIsImRhc2hib2FyZC90cy9yZWN0YW5nbGVMb2NhdGlvbi50cyIsImRhc2hib2FyZC90cy9ncmlkc3RlckRpcmVjdGl2ZS50cyIsImRhc2hib2FyZC90cy9pbXBvcnQudHMiLCJkYXNoYm9hcmQvdHMvbmF2YmFyLnRzIiwiZGFzaGJvYXJkL3RzL3NoYXJlLnRzIl0sIm5hbWVzIjpbIkRhc2hib2FyZCIsIkRhc2hib2FyZC5jbGVhbkRhc2hib2FyZERhdGEiLCJEYXNoYm9hcmQuZGVjb2RlVVJJQ29tcG9uZW50UHJvcGVydGllcyIsIkRhc2hib2FyZC5vbk9wZXJhdGlvbkNvbXBsZXRlIiwiRGFzaGJvYXJkLnNldFN1YlRhYnMiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5IiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5jb25zdHJ1Y3RvciIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkubG9hZERhc2hib2FyZHMiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5LnN0b3JlRGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZGVsZXRlRGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkIiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5jcmVhdGVEYXNoYm9hcmQiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5LmNsb25lRGFzaGJvYXJkIiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlIiwiRGFzaGJvYXJkLnVwZGF0ZURhdGEiLCJEYXNoYm9hcmQuZGFzaGJvYXJkTG9hZGVkIiwiRGFzaGJvYXJkLmRhc2hib2FyZHMiLCJEYXNoYm9hcmQuZGVzZWxlY3RBbGwiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24iLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uY29uc3RydWN0b3IiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uYWJzVXJsIiwiRGFzaGJvYXJkLlJlY3RhbmdsZUxvY2F0aW9uLmhhc2giLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uaG9zdCIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbi5wYXRoIiwiRGFzaGJvYXJkLlJlY3RhbmdsZUxvY2F0aW9uLnBvcnQiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24ucHJvdG9jb2wiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24ucmVwbGFjZSIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbi5zZWFyY2giLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24udXJsIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLnJlbW92ZVdpZGdldCIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5jaGFuZ2VXaWRnZXRTaXplIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLm9uV2lkZ2V0UmVuYW1lZCIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci51cGRhdGVXaWRnZXRzIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLm9uRGFzaGJvYXJkTG9hZCIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5vbkRhc2hib2FyZExvYWQubWF5YmVGaW5pc2hVcCIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5vbkRhc2hib2FyZExvYWQuZG9SZW1vdmVXaWRnZXQiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3Iub25EYXNoYm9hcmRMb2FkLmRvUmVuYW1lV2lkZ2V0IiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLm9uRGFzaGJvYXJkTG9hZC5nZXRTZXJ2aWNlcyIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5zZXJpYWxpemVEYXNoYm9hcmQiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3IubWFrZVJlc2l6YWJsZSIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5yZXNpemVCbG9jayIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci51cGRhdGVEYXNoYm9hcmRSZXBvc2l0b3J5IiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLmdldEdyaWRzdGVyIiwiRGFzaGJvYXJkLmxvYWREYXNoYm9hcmRzIiwiRGFzaGJvYXJkLm9uRGFzaGJvYXJkTG9hZCJdLCJtYXBwaW5ncyI6IkFBQUEsMkRBQTJEO0FBQzNELDREQUE0RDtBQUM1RCxHQUFHO0FBQ0gsbUVBQW1FO0FBQ25FLG9FQUFvRTtBQUNwRSwyQ0FBMkM7QUFDM0MsR0FBRztBQUNILGdEQUFnRDtBQUNoRCxHQUFHO0FBQ0gsdUVBQXVFO0FBQ3ZFLHFFQUFxRTtBQUNyRSw0RUFBNEU7QUFDNUUsdUVBQXVFO0FBQ3ZFLGtDQUFrQztBQUVsQywwREFBMEQ7O0FDdUN6RDs7QUN0REQseUNBQXlDO0FBQ3pDLDhDQUE4QztBQUk5QyxJQUFPLFNBQVMsQ0E0Q2Y7QUE1Q0QsV0FBTyxTQUFTLEVBQUMsQ0FBQztJQUVMQSxhQUFHQSxHQUFrQkEsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0E7SUFVeERBLDRCQUFtQ0EsSUFBSUE7UUFDckNDLElBQUlBLFNBQVNBLEdBQUdBLEVBQUVBLENBQUNBO1FBQ25CQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxJQUFJQSxFQUFFQSxVQUFDQSxLQUFLQSxFQUFFQSxHQUFHQTtZQUMvQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzdFQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQTtZQUN6QkEsQ0FBQ0E7UUFDSEEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDSEEsTUFBTUEsQ0FBQ0EsU0FBU0EsQ0FBQ0E7SUFDbkJBLENBQUNBO0lBUmVELDRCQUFrQkEscUJBUWpDQSxDQUFBQTtJQVVEQSxzQ0FBNkNBLElBQUlBO1FBQy9DRSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNWQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtRQUNkQSxDQUFDQTtRQUNEQSxJQUFJQSxVQUFVQSxHQUFHQSxFQUFFQSxDQUFDQTtRQUNwQkEsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsRUFBRUEsVUFBQ0EsS0FBS0EsRUFBRUEsR0FBR0E7WUFDL0JBLFVBQVVBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEtBQUtBLEdBQUdBLGtCQUFrQkEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0E7UUFDOURBLENBQUNBLENBQUNBLENBQUNBO1FBQ0hBLE1BQU1BLENBQUNBLFVBQVVBLENBQUNBO0lBQ3BCQSxDQUFDQTtJQVRlRixzQ0FBNEJBLCtCQVMzQ0EsQ0FBQUE7SUFFREEsNkJBQW9DQSxNQUFNQTtRQUN4Q0csT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsK0NBQStDQSxHQUFHQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUN4RkEsQ0FBQ0E7SUFGZUgsNkJBQW1CQSxzQkFFbENBLENBQUFBO0FBQ0hBLENBQUNBLEVBNUNNLFNBQVMsS0FBVCxTQUFTLFFBNENmOztBQzdDRCwyQ0FBMkM7QUFDM0MsSUFBTyxTQUFTLENBK0dmO0FBL0dELFdBQU8sU0FBUyxFQUFDLENBQUM7SUFFTEEsc0JBQVlBLEdBQUdBLHlCQUF5QkEsQ0FBQ0E7SUFDekNBLG9CQUFVQSxHQUFHQSxXQUFXQSxDQUFDQTtJQUV6QkEsaUJBQU9BLEdBQUdBLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBLG9CQUFVQSxFQUFFQSxFQUFFQSxDQUFDQSxDQUFDQTtJQUVwREEsaUJBQU9BLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLGdCQUFnQkEsRUFBRUEsVUFBVUEsRUFBRUEsVUFBQ0EsY0FBY0EsRUFBRUEsUUFBUUE7WUFFckVBLFFBQVFBLENBQUNBLFNBQVNBLENBQUNBLGlCQUFpQkEsRUFBRUEsQ0FBQ0EsV0FBV0EsRUFBRUEsVUFBQ0EsU0FBU0E7b0JBQzVEQSxTQUFTQSxDQUFDQSxjQUFjQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQTtvQkFDakNBLFNBQVNBLENBQUNBLFlBQVlBLENBQUNBLEdBQUdBLFVBQUNBLEtBQWFBLEVBQUVBLE1BQWNBLEVBQUVBLE1BQWNBO3dCQUN0RUEsSUFBSUEsTUFBTUEsR0FBR0EsSUFBSUEsR0FBR0EsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxDQUFDQTt3QkFDdkNBLElBQUlBLFVBQVVBLEdBQUdBLElBQUlBLEdBQUdBLEVBQUVBLENBQUNBO3dCQUszQkEsSUFBSUEsU0FBU0EsR0FBR0EsSUFBSUEsR0FBR0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0EsQ0FBQ0E7d0JBQzNDQSxTQUFTQSxDQUFDQSxLQUFLQSxDQUFDQSxVQUFVQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDeENBLE1BQU1BLENBQUNBLEtBQUtBLENBQUNBLFVBQUNBLEtBQUtBOzRCQUNqQkEsS0FBS0EsQ0FBQ0EsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsUUFBUUEsRUFBRUEsQ0FBQ0EsU0FBU0EsRUFBRUEsQ0FBQUE7NEJBQzdDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtnQ0FDVkEsS0FBS0EsQ0FBQ0EsS0FBS0EsR0FBR0EsS0FBS0EsQ0FBQ0EsU0FBU0EsRUFBRUEsQ0FBQ0E7NEJBQ2xDQSxDQUFDQTs0QkFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsSUFBSUEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0NBQ3JCQSxLQUFLQSxDQUFDQSxJQUFJQSxHQUFHQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxFQUFDQSxNQUFNQSxFQUFFQSxNQUFNQSxFQUFFQSxNQUFNQSxFQUFFQSxNQUFNQSxFQUFDQSxDQUFDQSxDQUFDQSxTQUFTQSxFQUFFQSxDQUFDQTs0QkFDNUVBLENBQUNBO3dCQUNIQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDSEEsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsUUFBUUEsRUFBRUEsQ0FBQ0E7b0JBQzNCQSxDQUFDQSxDQUFBQTtvQkFDREEsTUFBTUEsQ0FBQ0EsU0FBU0EsQ0FBQ0E7Z0JBQ25CQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUVKQSxjQUFjQTtnQkFDTkEsSUFBSUEsQ0FBQ0EsZ0JBQWdCQSxFQUFFQSxFQUFDQSxXQUFXQSxFQUFFQSxTQUFTQSxDQUFDQSxZQUFZQSxHQUFHQSxxQkFBcUJBLEVBQUNBLENBQUNBO2dCQUNyRkEsSUFBSUEsQ0FBQ0EsaUJBQWlCQSxFQUFFQSxFQUFDQSxXQUFXQSxFQUFFQSxTQUFTQSxDQUFDQSxZQUFZQSxHQUFHQSxxQkFBcUJBLEVBQUNBLENBQUNBO2dCQUN0RkEsSUFBSUEsQ0FBQ0EsZ0NBQWdDQSxFQUFFQSxFQUFDQSxXQUFXQSxFQUFFQSxTQUFTQSxDQUFDQSxZQUFZQSxHQUFHQSxnQkFBZ0JBLEVBQUVBLGNBQWNBLEVBQUVBLEtBQUtBLEVBQUVBLENBQUNBO2dCQUN4SEEsSUFBSUEsQ0FBQ0EsNEJBQTRCQSxFQUFFQSxFQUFDQSxXQUFXQSxFQUFFQSxTQUFTQSxDQUFDQSxZQUFZQSxHQUFHQSxnQkFBZ0JBLEVBQUVBLGNBQWNBLEVBQUVBLEtBQUtBLEVBQUVBLENBQUNBO2dCQUNwSEEsSUFBSUEsQ0FBQ0Esa0NBQWtDQSxFQUFFQSxFQUFDQSxXQUFXQSxFQUFFQSxTQUFTQSxDQUFDQSxZQUFZQSxHQUFHQSxZQUFZQSxFQUFDQSxDQUFDQTtnQkFDOUZBLElBQUlBLENBQUNBLG1CQUFtQkEsRUFBRUEsRUFBQ0EsV0FBV0EsRUFBRUEsU0FBU0EsQ0FBQ0EsWUFBWUEsR0FBR0EsYUFBYUEsRUFBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDM0ZBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0lBRUpBLGlCQUFPQSxDQUFDQSxLQUFLQSxDQUFDQSxXQUFXQSxFQUFFQTtRQUV6QkEsRUFBRUEsRUFBRUE7WUFDRkEsUUFBUUEsRUFBRUE7Z0JBQ1JBLGNBQWNBLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUN4QkEsc0JBQXNCQSxFQUFFQSxDQUFDQSxHQUFHQSxFQUFFQSxHQUFHQSxDQUFDQTthQUNuQ0E7U0FDRkE7S0FDRkEsQ0FBQ0EsQ0FBQ0E7SUFFSEEsSUFBSUEsR0FBR0EsR0FBR0EsU0FBU0EsQ0FBQ0E7SUFFcEJBLG9CQUEyQkEsT0FBT0EsRUFBRUEsVUFBMkJBLEVBQUVBLFVBQVVBO1FBQ3pFSSxhQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxtQkFBbUJBLENBQUNBLENBQUNBO1FBQy9CQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNkQSxHQUFHQSxDQUFDQSxJQUFJQSxHQUFHQSxFQUFFQSxDQUFDQTtRQUNoQkEsQ0FBQ0E7UUFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDTkEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7UUFDdEJBLENBQUNBO1FBQ0RBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLFVBQVVBLEVBQUVBLFVBQUNBLFNBQVNBO1lBQzlCQSxJQUFJQSxLQUFLQSxHQUFHQSxPQUFPQTtpQkFDaEJBLEVBQUVBLENBQUNBLFlBQVlBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBO2lCQUMvQkEsS0FBS0EsQ0FBQ0EsY0FBTUEsT0FBQUEsU0FBU0EsQ0FBQ0EsS0FBS0EsSUFBSUEsU0FBU0EsQ0FBQ0EsRUFBRUEsRUFBL0JBLENBQStCQSxDQUFDQTtpQkFDNUNBLElBQUlBLENBQUNBO2dCQUNKQSxJQUFJQSxHQUFHQSxHQUFHQSxJQUFJQSxHQUFHQSxDQUFDQSxVQUFVQSxDQUFDQSxJQUFJQSxDQUFDQSxlQUFlQSxFQUFFQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFBQTtnQkFDL0RBLEdBQUdBLENBQUNBLE1BQU1BLENBQUNBO29CQUNUQSxVQUFVQSxFQUFFQSxvQkFBVUE7b0JBQ3RCQSxTQUFTQSxFQUFFQSxZQUFZQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQTtpQkFDdkNBLENBQUNBLENBQUNBO2dCQUNMQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxRQUFRQSxFQUFFQSxDQUFDQTtZQUN4QkEsQ0FBQ0EsQ0FBQ0E7aUJBQ0hBLEtBQUtBLEVBQUVBLENBQUNBO1lBQ1RBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO1FBQ3ZCQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNIQSxJQUFJQSxNQUFNQSxHQUFHQSxPQUFPQTthQUNqQkEsRUFBRUEsQ0FBQ0Esa0JBQWtCQSxDQUFDQTthQUN0QkEsS0FBS0EsQ0FBQ0EsY0FBTUEsT0FBQUEsMENBQTBDQSxFQUExQ0EsQ0FBMENBLENBQUNBO2FBQ3ZEQSxJQUFJQSxDQUFDQSxjQUFNQSxPQUFBQSw2REFBNkRBLEVBQTdEQSxDQUE2REEsQ0FBQ0E7YUFDekVBLEtBQUtBLEVBQUVBLENBQUNBO1FBQ1hBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQ3RCQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxVQUFDQSxHQUFHQTtZQUNuQkEsR0FBR0EsQ0FBQ0EsVUFBVUEsR0FBR0E7Z0JBQ2ZBLElBQUlBLEVBQUVBLEdBQUdBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLE9BQU9BLENBQUNBLFlBQVlBLEVBQUVBLEVBQUVBLENBQUNBLENBQUNBO2dCQUMxQ0EsSUFBSUEsR0FBR0EsR0FBR0EsSUFBSUEsR0FBR0EsRUFBRUEsQ0FBQ0E7Z0JBQ3BCQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxTQUFTQSxDQUFDQSxLQUFLQSxHQUFHQSxDQUFDQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQSxRQUFRQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUM3RUEsQ0FBQ0EsQ0FBQUE7UUFDSEEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0E7SUFDMUJBLENBQUNBO0lBcENlSixvQkFBVUEsYUFvQ3pCQSxDQUFBQTtJQUVEQSxpQkFBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsV0FBV0EsRUFBRUEscUJBQXFCQSxFQUFFQSxZQUFZQSxFQUFFQSxpQkFBaUJBLEVBQUVBLFVBQVVBLEVBQUVBLFVBQUNBLEdBQTBCQSxFQUFFQSxVQUE4QkEsRUFBRUEsVUFBVUEsRUFBRUEsSUFBcUJBLEVBQUVBLFFBQVFBO1lBRXBNQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDdEJBLElBQUlBLE9BQU9BLEdBQUdBLEdBQUdBLENBQUNBLE9BQU9BLEVBQUVBLENBQUNBO2dCQUM1QkEsR0FBR0EsR0FBR0EsT0FBT0EsQ0FBQ0EsRUFBRUEsQ0FBQ0Esb0JBQVVBLENBQUNBO3FCQUN6QkEsSUFBSUEsQ0FBQ0EsY0FBTUEsT0FBQUEsa0JBQWtCQSxFQUFsQkEsQ0FBa0JBLENBQUNBO3FCQUM5QkEsS0FBS0EsQ0FBQ0EsY0FBTUEsT0FBQUEsV0FBV0EsRUFBWEEsQ0FBV0EsQ0FBQ0E7cUJBQ3hCQSxLQUFLQSxFQUFFQSxDQUFDQTtnQkFDWEEsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ2JBLFFBQVFBLENBQUNBO29CQUNQQSxVQUFVQSxDQUFDQSxhQUFhQSxDQUFDQSxVQUFDQSxVQUFVQTt3QkFDbENBLFVBQVVBLENBQUNBLE9BQU9BLEVBQUVBLFVBQVVBLEVBQUVBLFVBQVVBLENBQUNBLENBQUNBO29CQUM5Q0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ0xBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBO1lBQ1ZBLENBQUNBO1FBQ0hBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0lBRUpBLGtCQUFrQkEsQ0FBQ0EsU0FBU0EsQ0FBQ0Esb0JBQVVBLENBQUNBLENBQUNBO0FBQzNDQSxDQUFDQSxFQS9HTSxTQUFTLEtBQVQsU0FBUyxRQStHZjs7QUNwSEQsMENBQTBDO0FBQzFDLDhDQUE4QztBQUk5QyxJQUFPLFNBQVMsQ0ErR2Y7QUEvR0QsV0FBTyxTQUFTLEVBQUMsQ0FBQztJQUVoQkEsaUJBQU9BLENBQUNBLE9BQU9BLENBQUNBLHFCQUFxQkEsRUFBRUEsQ0FBQ0EsbUJBQW1CQSxFQUFFQSxVQUFDQSxRQUEwQkE7WUFDdEZBLE1BQU1BLENBQUNBLElBQUlBLHdCQUF3QkEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7UUFDaERBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0lBRUpBLGlCQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxtQkFBbUJBLEVBQUVBLENBQUNBO1lBQ3BDQSxJQUFJQSxRQUFRQSxHQUFxQkEsRUFBRUEsQ0FBQ0E7WUFDcENBLElBQUlBLE1BQU1BLEdBQUdBO2dCQUNYQSxHQUFHQSxFQUFFQSxVQUFDQSxTQUFtQkE7b0JBQ3ZCQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQTtnQkFDM0JBLENBQUNBO2dCQUNEQSxNQUFNQSxFQUFFQSxVQUFDQSxFQUFTQTtvQkFDaEJBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLFFBQVFBLEVBQUVBLFVBQUNBLFNBQVNBLElBQUtBLE9BQUFBLFNBQVNBLENBQUNBLEVBQUVBLEtBQUtBLEVBQUVBLEVBQW5CQSxDQUFtQkEsQ0FBQ0EsQ0FBQ0E7Z0JBQ2hFQSxDQUFDQTtnQkFDREEsTUFBTUEsRUFBRUEsY0FBTUEsT0FBQUEsUUFBUUEsRUFBUkEsQ0FBUUE7YUFDdkJBLENBQUFBO1lBQ0RBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBO1FBQ2hCQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtJQU1KQTtRQUlFSyxrQ0FBb0JBLFFBQTBCQTtZQUExQkMsYUFBUUEsR0FBUkEsUUFBUUEsQ0FBa0JBO1lBRnRDQSxpQkFBWUEsR0FBc0JBLElBQUlBLENBQUNBO1lBRzdDQSxJQUFJQSxDQUFDQSxZQUFZQSxHQUFHQSxJQUFJQSxDQUFDQSxlQUFlQSxFQUFFQSxDQUFDQTtRQVc3Q0EsQ0FBQ0E7UUFFT0QsaURBQWNBLEdBQXRCQTtZQUNFRSxJQUFJQSxNQUFNQSxHQUFHQSxPQUFPQSxDQUFDQSxRQUFRQSxDQUFDQSxZQUFZQSxDQUFDQSxnQkFBZ0JBLENBQUNBLENBQUNBLENBQUNBO1lBQzlEQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxJQUFJQSxNQUFNQSxDQUFDQSxNQUFNQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDbkNBLE1BQU1BLEdBQUdBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBO1lBQ2xDQSxDQUFDQTtZQUNEQSxhQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSx3QkFBd0JBLEVBQUVBLE1BQU1BLENBQUNBLENBQUNBO1lBQzVDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQTtRQUNoQkEsQ0FBQ0E7UUFFT0Ysa0RBQWVBLEdBQXZCQSxVQUF3QkEsVUFBZ0JBO1lBQ3RDRyxhQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxzQkFBc0JBLEVBQUVBLFVBQVVBLENBQUNBLENBQUNBO1lBQzlDQSxZQUFZQSxDQUFDQSxnQkFBZ0JBLENBQUNBLEdBQUdBLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBLFVBQVVBLENBQUNBLENBQUNBO1lBQzVEQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxjQUFjQSxFQUFFQSxDQUFDQTtRQUMvQkEsQ0FBQ0E7UUFFTUgsZ0RBQWFBLEdBQXBCQSxVQUFxQkEsS0FBV0EsRUFBRUEsYUFBb0JBLEVBQUVBLEVBQUVBO1lBQ3hESSxJQUFJQSxVQUFVQSxHQUFHQSxJQUFJQSxDQUFDQSxjQUFjQSxFQUFFQSxDQUFDQTtZQUN2Q0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsVUFBQ0EsSUFBSUE7Z0JBQ2pCQSxJQUFJQSxRQUFRQSxHQUFHQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxVQUFDQSxDQUFDQSxJQUFPQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxLQUFLQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDekVBLEVBQUVBLENBQUNBLENBQUNBLFFBQVFBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO29CQUNsQkEsVUFBVUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0E7Z0JBQzlCQSxDQUFDQTtnQkFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7b0JBQ05BLFVBQVVBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO2dCQUN4QkEsQ0FBQ0E7WUFDSEEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDSEEsRUFBRUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDdkNBLENBQUNBO1FBRU1KLG1EQUFnQkEsR0FBdkJBLFVBQXdCQSxLQUFXQSxFQUFFQSxFQUFFQTtZQUNyQ0ssSUFBSUEsVUFBVUEsR0FBR0EsSUFBSUEsQ0FBQ0EsY0FBY0EsRUFBRUEsQ0FBQ0E7WUFDdkNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEtBQUtBLEVBQUVBLFVBQUNBLElBQUlBO2dCQUMxQkEsVUFBVUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsVUFBQ0EsQ0FBQ0EsSUFBT0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsS0FBS0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDekRBLENBQUNBLENBQUNBLENBQUNBO1lBQ0hBLEVBQUVBLENBQUNBLElBQUlBLENBQUNBLGVBQWVBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBO1FBQ3ZDQSxDQUFDQTtRQUVNTCxnREFBYUEsR0FBcEJBLFVBQXFCQSxFQUFFQTtZQUNyQk0sRUFBRUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsY0FBY0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDNUJBLENBQUNBO1FBRU1OLCtDQUFZQSxHQUFuQkEsVUFBb0JBLEVBQVNBLEVBQUVBLEVBQUVBO1lBQy9CTyxJQUFJQSxVQUFVQSxHQUFHQSxJQUFJQSxDQUFDQSxjQUFjQSxFQUFFQSxDQUFDQTtZQUN2Q0EsSUFBSUEsU0FBU0EsR0FBR0EsVUFBVUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBQ0EsU0FBU0EsSUFBT0EsTUFBTUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsRUFBRUEsS0FBS0EsRUFBRUEsQ0FBQUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDL0VBLEVBQUVBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBO1FBQ2hCQSxDQUFDQTtRQUVNUCxrREFBZUEsR0FBdEJBLFVBQXVCQSxPQUFXQTtZQUNoQ1EsSUFBSUEsTUFBTUEsR0FBRUE7Z0JBQ1ZBLEtBQUtBLEVBQUVBLGVBQWVBO2dCQUN0QkEsS0FBS0EsRUFBRUEsVUFBVUE7Z0JBQ2pCQSxPQUFPQSxFQUFFQSxFQUFFQTthQUNaQSxDQUFDQTtZQUNGQSxNQUFNQSxHQUFHQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtZQUN6Q0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsT0FBT0EsRUFBRUEsQ0FBQ0E7WUFDOUJBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBO1FBQ2hCQSxDQUFDQTtRQUVNUixpREFBY0EsR0FBckJBLFVBQXNCQSxTQUFhQTtZQUNqQ1MsSUFBSUEsWUFBWUEsR0FBR0EsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0E7WUFDM0NBLFlBQVlBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLE9BQU9BLEVBQUVBLENBQUNBO1lBQ3BDQSxZQUFZQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxVQUFVQSxHQUFHQSxTQUFTQSxDQUFDQSxLQUFLQSxDQUFDQTtZQUNyREEsTUFBTUEsQ0FBQ0EsWUFBWUEsQ0FBQ0E7UUFDdEJBLENBQUNBO1FBRU1ULDBDQUFPQSxHQUFkQTtZQUNFVSxNQUFNQSxDQUFDQSxXQUFXQSxDQUFDQTtRQUNyQkEsQ0FBQ0E7UUFDSFYsK0JBQUNBO0lBQURBLENBckZBTCxBQXFGQ0ssSUFBQUw7SUFyRllBLGtDQUF3QkEsMkJBcUZwQ0EsQ0FBQUE7QUFFSEEsQ0FBQ0EsRUEvR00sU0FBUyxLQUFULFNBQVMsUUErR2Y7O0FDcEhELDBDQUEwQztBQUkxQyxJQUFPLFNBQVMsQ0FpYmY7QUFqYkQsV0FBTyxTQUFTLEVBQUMsQ0FBQztJQUVoQkEsaUJBQU9BLENBQUNBLFVBQVVBLENBQUNBLG9DQUFvQ0EsRUFBRUEsQ0FBQ0EsUUFBUUEsRUFBRUEsY0FBY0EsRUFBRUEsUUFBUUEsRUFBRUEsV0FBV0EsRUFBRUEsWUFBWUEsRUFBRUEscUJBQXFCQSxFQUFFQSxXQUFXQSxFQUFFQSxVQUFVQSxFQUFFQSxnQkFBZ0JBLEVBQUVBLFFBQVFBLEVBQUVBLFVBQUNBLE1BQU1BLEVBQUVBLFlBQVlBLEVBQUVBLE1BQU1BLEVBQUVBLFNBQVNBLEVBQUVBLFVBQVVBLEVBQUVBLG1CQUF1Q0EsRUFBRUEsR0FBR0EsRUFBRUEsUUFBUUEsRUFBRUEsY0FBY0EsRUFBRUEsTUFBTUE7WUFFdlVBLE1BQU1BLENBQUNBLFdBQVdBLEdBQUdBLEVBQUVBLENBQUNBO1lBRXhCQSxVQUFVQSxDQUFDQSxHQUFHQSxDQUFDQSxtQkFBbUJBLEVBQUVBLGVBQWVBLENBQUNBLENBQUNBO1lBRXJEQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQTtnQkFDZEEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsSUFBSUEsR0FBR0EsS0FBS0EsQ0FBQ0E7WUFDckNBLENBQUNBLENBQUNBO1lBRUZBLE1BQU1BLENBQUNBLFlBQVlBLEdBQUdBO2dCQUNwQkEsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsTUFBTUEsS0FBS0EsQ0FBQ0EsQ0FBQ0E7WUFDdkRBLENBQUNBLENBQUNBO1lBRUZBLE1BQU1BLENBQUNBLFdBQVdBLEdBQUdBO2dCQUNuQkEsYUFBYUEsRUFBRUEsRUFBRUE7Z0JBQ2pCQSxVQUFVQSxFQUFFQSxLQUFLQTtnQkFDakJBLGNBQWNBLEVBQUVBLEtBQUtBO2dCQUNyQkEsYUFBYUEsRUFBRUE7b0JBQ2JBLFVBQVVBLEVBQUVBLEVBQUVBO2lCQUNmQTtnQkFDREEsSUFBSUEsRUFBRUEsYUFBYUE7Z0JBQ25CQSxzQkFBc0JBLEVBQUVBLElBQUlBO2dCQUM1QkEscUJBQXFCQSxFQUFFQSxJQUFJQTtnQkFDM0JBLFVBQVVBLEVBQUVBO29CQUNWQTt3QkFDRUEsS0FBS0EsRUFBRUEsT0FBT0E7d0JBQ2RBLFdBQVdBLEVBQUVBLFdBQVdBO3dCQUN4QkEsWUFBWUEsRUFBRUEsY0FBY0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsSUFBSUEsQ0FBQ0Esc0JBQVlBLEVBQUVBLDZCQUE2QkEsQ0FBQ0EsQ0FBQ0E7cUJBQy9GQTtvQkFDREE7d0JBQ0VBLEtBQUtBLEVBQUVBLE9BQU9BO3dCQUNkQSxXQUFXQSxFQUFFQSxPQUFPQTtxQkFDckJBO2lCQUNGQTthQUNGQSxDQUFDQTtZQUVGQSxJQUFJQSxRQUFRQSxHQUFHQSxDQUFDQSxDQUFDQSxRQUFRQSxDQUFDQSxVQUFVQSxFQUFFQSxFQUFFQSxDQUFDQSxDQUFDQTtZQStCMUNBLFFBQVFBLENBQUNBLFFBQVFBLEVBQUVBLEVBQUVBLENBQUNBLENBQUNBO1lBRXZCQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxxQkFBcUJBLEVBQUVBLFVBQVVBLEtBQUtBLEVBQUVBLE9BQU9BLEVBQUVBLFFBQVFBO2dCQUVsRSxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3pCLENBQUMsQ0FBQ0EsQ0FBQ0E7WUFFSEEsTUFBTUEsQ0FBQ0Esa0JBQWtCQSxHQUFHQTtnQkFDMUJBLElBQUlBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBO2dCQUNwQkEsSUFBSUEsUUFBUUEsR0FBR0EsTUFBTUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsYUFBYUEsQ0FBQ0E7Z0JBQ2hEQSxJQUFJQSxVQUFVQSxHQUFHQSxJQUFJQSxHQUFHQSxFQUFFQSxDQUFDQTtnQkFDM0JBLElBQUlBLE1BQU1BLEdBQUdBLFVBQVVBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO2dCQUNwQ0EsSUFBSUEsSUFBSUEsR0FBR0EsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7Z0JBQzFCQSxJQUFJQSxNQUFNQSxHQUFHQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtnQkFDOUJBLElBQUlBLElBQUlBLEdBQUdBLE1BQU1BLENBQUNBO2dCQUNsQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ1RBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLFdBQVdBLEVBQUVBLENBQUNBO29CQUMxQkEsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsSUFBSUEsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3JDQSxDQUFDQTtnQkFBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ2xCQSxNQUFNQSxHQUFHQSxNQUFNQSxDQUFDQSxXQUFXQSxFQUFFQSxDQUFDQTtvQkFDOUJBLElBQUlBLEdBQUdBLFFBQVFBLENBQUNBO2dCQUNsQkEsQ0FBQ0E7Z0JBQ0RBLElBQUlBLFNBQVNBLEdBQVNBLFNBQVNBLENBQUNBO2dCQUNoQ0EsTUFBTUEsQ0FBQUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ1pBLEtBQUtBLE1BQU1BO3dCQUNUQSxhQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxRQUFRQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTt3QkFDMUJBLFNBQVNBLEdBQUdBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO3dCQUMxQkEsS0FBS0EsQ0FBQ0E7b0JBQ1JBLEtBQUtBLFFBQVFBO3dCQUNYQSxhQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxVQUFVQSxFQUFFQSxNQUFNQSxDQUFDQSxDQUFDQTt3QkFDOUJBLFNBQVNBLEdBQUdBLElBQUlBLEdBQUdBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO3dCQUM1QkEsS0FBS0EsQ0FBQ0E7b0JBQ1JBO3dCQUNFQSxhQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxjQUFjQSxDQUFDQSxDQUFDQTt3QkFDMUJBLE1BQU1BLENBQUNBO2dCQUNYQSxDQUFDQTtnQkFDREEsSUFBSUEsT0FBT0EsR0FBU0EsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ25DQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDWkEsT0FBT0EsR0FBR0EsT0FBT0EsQ0FBQ0EsV0FBV0EsRUFBRUEsQ0FBQ0E7Z0JBQ2xDQSxDQUFDQTtnQkFDREEsSUFBSUEsSUFBSUEsR0FBR0EsT0FBT0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsRUFBRUEsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0E7Z0JBQ2pFQSxJQUFJQSxLQUFLQSxHQUFHQSxDQUFDQSxNQUFNQSxDQUFDQSxPQUFPQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQSxDQUFDQSxXQUFXQSxFQUFFQSxDQUFDQTtnQkFDbERBLElBQUlBLGNBQWNBLEdBQUdBO29CQUNuQkEsRUFBRUEsRUFBRUEsSUFBSUEsQ0FBQ0EsT0FBT0EsRUFBRUE7b0JBQ2xCQSxHQUFHQSxFQUFFQSxDQUFDQTtvQkFDTkEsR0FBR0EsRUFBRUEsQ0FBQ0E7b0JBQ05BLE1BQU1BLEVBQUVBLElBQUlBLENBQUNBLE1BQU1BO29CQUNuQkEsTUFBTUEsRUFBRUEsSUFBSUEsQ0FBQ0EsTUFBTUE7b0JBQ25CQSxLQUFLQSxFQUFFQSxLQUFLQTtpQkFDYkEsQ0FBQUE7Z0JBQ0RBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLFFBQVFBLEVBQUVBLFVBQUNBLFlBQVlBO29CQUVyQ0EsSUFBSUEsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsY0FBY0EsQ0FBQ0EsQ0FBQ0E7b0JBRXpDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxZQUFZQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDMUJBLFlBQVlBLENBQUNBLE9BQU9BLEdBQUdBLEVBQUVBLENBQUNBO29CQUM1QkEsQ0FBQ0E7b0JBRURBLE1BQU1BLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO3dCQUNiQSxLQUFLQSxRQUFRQTs0QkFDWEEsTUFBTUEsR0FBUUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7Z0NBQ3JCQSxNQUFNQSxFQUFFQSxNQUFNQTs2QkFDZkEsRUFBRUEsTUFBTUEsQ0FBQ0EsQ0FBQ0E7NEJBQ1hBLEtBQUtBLENBQUNBO3dCQUNSQSxLQUFLQSxNQUFNQTs0QkFDVEEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0E7NEJBQzVCQSxJQUFJQSxNQUFNQSxHQUFHQSxTQUFTQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTs0QkFDbkNBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLElBQUlBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBO2dDQUM1QkEsSUFBSUEsS0FBS0EsR0FBR0EsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0NBQ2hDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtvQ0FDVkEsSUFBSUEsV0FBV0EsR0FBR0EsS0FBS0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsQ0FBQ0E7b0NBQ3ZDQSxFQUFFQSxDQUFDQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQSxDQUFDQTt3Q0FDaEJBLE1BQU1BLEdBQVNBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBOzRDQUN0QkEsSUFBSUEsRUFBRUEsSUFBSUE7NENBQ1ZBLE9BQU9BLEVBQUVBLFdBQVdBOzRDQUNwQkEsTUFBTUEsRUFBRUEsTUFBTUE7NENBQ2RBLElBQUlBLEVBQUVBLEVBQUVBO3lDQUNUQSxFQUFFQSxNQUFNQSxDQUFDQSxDQUFDQTtvQ0FDYkEsQ0FBQ0E7Z0NBQ0hBLENBQUNBO2dDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtvQ0FFTkEsTUFBTUEsQ0FBQ0E7Z0NBQ1RBLENBQUNBOzRCQUNIQSxDQUFDQTs0QkFDREEsS0FBS0EsQ0FBQ0E7b0JBQ1ZBLENBQUNBO29CQUVEQSxJQUFJQSxTQUFTQSxHQUFHQSxDQUFDQSxDQUFDQTtvQkFFbEJBLFlBQVlBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLFVBQUNBLENBQUNBO3dCQUM3QkEsSUFBSUEsU0FBU0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7d0JBQ2pDQSxFQUFFQSxDQUFDQSxDQUFDQSxTQUFTQSxHQUFHQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTs0QkFDMUJBLFNBQVNBLEdBQUdBLFNBQVNBLENBQUNBO3dCQUN4QkEsQ0FBQ0E7b0JBQ0hBLENBQUNBLENBQUNBLENBQUNBO29CQUVIQSxJQUFJQSxLQUFLQSxHQUFHQSxLQUFLQSxDQUFDQTtvQkFFbEJBLElBQUlBLElBQUlBLEdBQUdBLFVBQUNBLENBQUNBO3dCQUNYQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQTtvQkFDZkEsQ0FBQ0EsQ0FBQ0E7b0JBRUZBLElBQUlBLEtBQUtBLEdBQUdBLFVBQUNBLENBQUNBO3dCQUNaQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQTtvQkFDOUJBLENBQUNBLENBQUNBO29CQUVGQSxJQUFJQSxHQUFHQSxHQUFHQSxVQUFDQSxDQUFDQTt3QkFDVkEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0E7b0JBQ2ZBLENBQUNBLENBQUNBO29CQUVGQSxJQUFJQSxNQUFNQSxHQUFHQSxVQUFDQSxDQUFDQTt3QkFDYkEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7b0JBQzlCQSxDQUFDQSxDQUFDQTtvQkFFRkEsSUFBSUEsU0FBU0EsR0FBR0EsVUFBQ0EsRUFBRUEsRUFBRUEsRUFBRUE7d0JBQ3JCQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFFQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQTs0QkFDMUJBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBOzRCQUNwQkEsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsTUFBTUEsQ0FBQ0EsRUFBRUEsQ0FBQ0E7NEJBQ3BCQSxNQUFNQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDNUJBLENBQUNBLENBQUNBO29CQUVGQSxFQUFFQSxDQUFDQSxDQUFDQSxZQUFZQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDbkNBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBO29CQUNmQSxDQUFDQTtvQkFFREEsT0FBT0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0E7d0JBQ2RBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBO3dCQUNmQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTs0QkFFM0NBLFlBQVlBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLFVBQVNBLENBQUNBLEVBQUVBLEdBQUdBO2dDQUMxQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29DQUN4QixNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7Z0NBQ2YsQ0FBQzs0QkFDSCxDQUFDLENBQUNBLENBQUNBOzRCQUNIQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQTt3QkFDZkEsQ0FBQ0E7d0JBQ0RBLEdBQUdBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLFNBQVNBLEVBQUVBLE1BQU1BLENBQUNBLEdBQUdBLEVBQUVBLEVBQUVBLENBQUNBOzRCQUMvREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsWUFBWUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsVUFBQ0EsQ0FBQ0E7Z0NBQzlCQSxJQUFJQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxDQUFDQSxFQUFFQSxNQUFNQSxDQUFDQSxDQUFDQTtnQ0FDN0JBLE1BQU1BLENBQUNBLENBQUNBLENBQUFBOzRCQUNWQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQ0FDSEEsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0E7Z0NBQ2JBLEtBQUtBLENBQUNBOzRCQUNSQSxDQUFDQTt3QkFDSEEsQ0FBQ0E7d0JBQ0RBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBOzRCQUNYQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFBQTt3QkFDN0JBLENBQUNBO3dCQUVEQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTs0QkFDcEJBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBO3dCQUNmQSxDQUFDQTtvQkFDSEEsQ0FBQ0E7b0JBRURBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLFdBQVdBLENBQUNBLENBQUNBLENBQUNBO3dCQUN2QkEsTUFBTUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsR0FBR0EsTUFBTUEsQ0FBQ0EsV0FBV0EsQ0FBQ0E7b0JBQzdDQSxDQUFDQTtvQkFDREEsWUFBWUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7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QSxhQUFhQSxDQUFDQSxDQUFDQTtZQUNyQ0EsbUJBQW1CQSxDQUFDQSxZQUFZQSxDQUFDQSxFQUFFQSxFQUFFQSxlQUFlQSxDQUFDQSxDQUFDQTtZQUV0REEsSUFBSUEsT0FBT0EsR0FBR0E7Z0JBQ1pBLElBQUlBLEVBQUVBO29CQUNGQSxJQUFJQSxFQUFFQSxZQUFZQTtpQkFDckJBO2FBQ0ZBLENBQUNBO1lBR0ZBLHlCQUF5QkEsU0FBU0E7Z0JBQ2hDZ0QsTUFBTUEsQ0FBQ0EsU0FBU0EsR0FBR0EsU0FBU0EsQ0FBQ0Esa0JBQWtCQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQTtnQkFFM0RBLE1BQU1BLENBQUNBLElBQUlBLEdBQUdBO29CQUNaQSxhQUFhQSxFQUFFQSxtQkFBbUJBO29CQUNsQ0EsUUFBUUEsRUFBRUEsSUFBSUE7b0JBQ2RBLE9BQU9BLEVBQUVBO3dCQUNQQSxpQkFBaUJBLEVBQUVBOzRCQUNqQkEsU0FBU0EsRUFBRUEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsU0FBU0EsRUFBRUEsSUFBSUEsRUFBRUEsSUFBSUEsQ0FBQ0E7eUJBQ3hEQTtxQkFDRkE7aUJBQ0ZBLENBQUNBO2dCQUVGQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxTQUFTQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtnQkFDN0RBLElBQUlBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7WUFDaENBLENBQUNBO1FBQ0hoRCxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtBQUNOQSxDQUFDQSxFQTdCTSxTQUFTLEtBQVQsU0FBUyxRQTZCZiIsImZpbGUiOiJjb21waWxlZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLyBDb3B5cmlnaHQgMjAxNC0yMDE1IFJlZCBIYXQsIEluYy4gYW5kL29yIGl0cyBhZmZpbGlhdGVzXG4vLy8gYW5kIG90aGVyIGNvbnRyaWJ1dG9ycyBhcyBpbmRpY2F0ZWQgYnkgdGhlIEBhdXRob3IgdGFncy5cbi8vL1xuLy8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8vXG4vLy8gICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vL1xuLy8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vbGlicy9oYXd0aW8tdXRpbGl0aWVzL2RlZnMuZC50c1wiLz5cbiIsIm1vZHVsZSBEYXNoYm9hcmQge1xuXG4gIGV4cG9ydCBpbnRlcmZhY2UgRGFzaGJvYXJkU2VydmljZSB7XG4gICAgaGFzRGFzaGJvYXJkOmJvb2xlYW47XG4gICAgaW5EYXNoYm9hcmQ6Ym9vbGVhbjtcbiAgICBnZXRBZGRMaW5rKHRpdGxlPzpzdHJpbmcsIHdpZHRoPzpudW1iZXIsIGhlaWdodD86bnVtYmVyKTpzdHJpbmc7XG4gIH1cblxuICBleHBvcnQgaW50ZXJmYWNlIFNlYXJjaE1hcCB7XG4gICAgW25hbWU6IHN0cmluZ106IHN0cmluZztcbiAgfVxuXG4gIGV4cG9ydCBpbnRlcmZhY2UgRGFzaGJvYXJkV2lkZ2V0IHtcbiAgICBpZDogc3RyaW5nO1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgcm93PzogbnVtYmVyO1xuICAgIGNvbD86IG51bWJlcjtcbiAgICBzaXplX3g/OiBudW1iZXI7XG4gICAgc2l6ZV95PzogbnVtYmVyO1xuICAgIHBhdGg/OiBzdHJpbmc7XG4gICAgdXJsPzogc3RyaW5nO1xuICAgIGluY2x1ZGU/OiBzdHJpbmc7XG4gICAgc2VhcmNoPzogU2VhcmNoTWFwXG4gICAgcm91dGVQYXJhbXM/OiBzdHJpbmc7XG4gIH1cblxuICBleHBvcnQgaW50ZXJmYWNlIERhc2hib2FyZCB7XG4gICAgaWQ6IHN0cmluZztcbiAgICB0aXRsZTogc3RyaW5nO1xuICAgIGdyb3VwOiBzdHJpbmc7XG4gICAgd2lkZ2V0czogQXJyYXk8RGFzaGJvYXJkV2lkZ2V0PjtcbiAgfVxuXG4gIGV4cG9ydCBpbnRlcmZhY2UgRGVmYXVsdERhc2hib2FyZHMge1xuICAgIGFkZDogKGRhc2hiYXJkOkRhc2hib2FyZCkgPT4gdm9pZDtcbiAgICByZW1vdmU6IChpZDpzdHJpbmcpID0+IERhc2hib2FyZDtcbiAgICBnZXRBbGw6ICgpID0+IEFycmF5PERhc2hib2FyZD47XG4gIH1cblxuICAvKipcbiAgICogQmFzZSBpbnRlcmZhY2UgdGhhdCBkYXNoYm9hcmQgcmVwb3NpdG9yaWVzIG11c3QgaW1wbGVtZW50XG4gICAqXG4gICAqIEBjbGFzcyBEYXNoYm9hcmRSZXBvc2l0b3J5XG4gICAqL1xuICBleHBvcnQgaW50ZXJmYWNlIERhc2hib2FyZFJlcG9zaXRvcnkge1xuICAgIHB1dERhc2hib2FyZHM6IChhcnJheTphbnlbXSwgY29tbWl0TWVzc2FnZTpzdHJpbmcsIGZuKSA9PiBhbnk7XG4gICAgZGVsZXRlRGFzaGJvYXJkczogKGFycmF5OkFycmF5PERhc2hib2FyZD4sIGZuKSA9PiBhbnk7XG4gICAgZ2V0RGFzaGJvYXJkczogKGZuOihkYXNoYm9hcmRzOiBBcnJheTxEYXNoYm9hcmQ+KSA9PiB2b2lkKSA9PiB2b2lkO1xuICAgIGdldERhc2hib2FyZDogKGlkOnN0cmluZywgZm46IChkYXNoYm9hcmQ6IERhc2hib2FyZCkgPT4gdm9pZCkgPT4gYW55O1xuICAgIGNyZWF0ZURhc2hib2FyZDogKG9wdGlvbnM6YW55KSA9PiBhbnk7XG4gICAgY2xvbmVEYXNoYm9hcmQ6KGRhc2hib2FyZDphbnkpID0+IGFueTtcbiAgICBnZXRUeXBlOigpID0+IHN0cmluZztcbiAgfVxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vaW5jbHVkZXMudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkSW50ZXJmYWNlcy50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG5cbiAgZXhwb3J0IHZhciBsb2c6TG9nZ2luZy5Mb2dnZXIgPSBMb2dnZXIuZ2V0KCdEYXNoYm9hcmQnKTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY2xlYW5lZCB1cCB2ZXJzaW9uIG9mIHRoZSBkYXNoYm9hcmQgZGF0YSB3aXRob3V0IGFueSBVSSBzZWxlY3Rpb24gc3RhdGVcbiAgICogQG1ldGhvZCBjbGVhbkRhc2hib2FyZERhdGFcbiAgICogQHN0YXRpY1xuICAgKiBAZm9yIERhc2hib2FyZFxuICAgKiBAcGFyYW0ge2FueX0gaXRlbVxuICAgKiBAcmV0dXJuIHthbnl9XG4gICAqL1xuICBleHBvcnQgZnVuY3Rpb24gY2xlYW5EYXNoYm9hcmREYXRhKGl0ZW0pIHtcbiAgICB2YXIgY2xlYW5JdGVtID0ge307XG4gICAgYW5ndWxhci5mb3JFYWNoKGl0ZW0sICh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICBpZiAoIWFuZ3VsYXIuaXNTdHJpbmcoa2V5KSB8fCAoIWtleS5zdGFydHNXaXRoKFwiJFwiKSAmJiAha2V5LnN0YXJ0c1dpdGgoXCJfXCIpKSkge1xuICAgICAgICBjbGVhbkl0ZW1ba2V5XSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBjbGVhbkl0ZW07XG4gIH1cblxuICAvKipcbiAgICogUnVucyBkZWNvZGVVUklDb21wb25lbnQoKSBvbiBlYWNoIHZhbHVlIGluIHRoZSBvYmplY3RcbiAgICogQG1ldGhvZCBkZWNvZGVVUklDb21wb25lbnRQcm9wZXJ0aWVzXG4gICAqIEBzdGF0aWNcbiAgICogQGZvciBEYXNoYm9hcmRcbiAgICogQHBhcmFtIHthbnl9IGhhc2hcbiAgICogQHJldHVybiB7YW55fVxuICAgKi9cbiAgZXhwb3J0IGZ1bmN0aW9uIGRlY29kZVVSSUNvbXBvbmVudFByb3BlcnRpZXMoaGFzaCkge1xuICAgIGlmICghaGFzaCkge1xuICAgICAgcmV0dXJuIGhhc2g7XG4gICAgfVxuICAgIHZhciBkZWNvZGVIYXNoID0ge307XG4gICAgYW5ndWxhci5mb3JFYWNoKGhhc2gsICh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICBkZWNvZGVIYXNoW2tleV0gPSB2YWx1ZSA/IGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkgOiB2YWx1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVjb2RlSGFzaDtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBvbk9wZXJhdGlvbkNvbXBsZXRlKHJlc3VsdCkge1xuICAgIGNvbnNvbGUubG9nKFwiQ29tcGxldGVkIGFkZGluZyB0aGUgZGFzaGJvYXJkIHdpdGggcmVzcG9uc2UgXCIgKyBKU09OLnN0cmluZ2lmeShyZXN1bHQpKTtcbiAgfVxufVxuIiwiLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICogQG1haW4gRGFzaGJvYXJkXG4gKi9cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRIZWxwZXJzLnRzXCIvPlxubW9kdWxlIERhc2hib2FyZCB7XG4gIFxuICBleHBvcnQgdmFyIHRlbXBsYXRlUGF0aCA9ICdwbHVnaW5zL2Rhc2hib2FyZC9odG1sLyc7XG4gIGV4cG9ydCB2YXIgcGx1Z2luTmFtZSA9ICdkYXNoYm9hcmQnO1xuICBcbiAgZXhwb3J0IHZhciBfbW9kdWxlID0gYW5ndWxhci5tb2R1bGUocGx1Z2luTmFtZSwgW10pO1xuXG4gIF9tb2R1bGUuY29uZmlnKFtcIiRyb3V0ZVByb3ZpZGVyXCIsIFwiJHByb3ZpZGVcIiwgKCRyb3V0ZVByb3ZpZGVyLCAkcHJvdmlkZSkgPT4ge1xuXG4gICAgJHByb3ZpZGUuZGVjb3JhdG9yKCdIYXd0aW9EYXNoYm9hcmQnLCBbJyRkZWxlZ2F0ZScsICgkZGVsZWdhdGUpID0+IHtcbiAgICAgICRkZWxlZ2F0ZVsnaGFzRGFzaGJvYXJkJ10gPSB0cnVlO1xuICAgICAgJGRlbGVnYXRlWydnZXRBZGRMaW5rJ10gPSAodGl0bGU/OnN0cmluZywgc2l6ZV94PzpudW1iZXIsIHNpemVfeT86bnVtYmVyKSA9PiB7XG4gICAgICAgIHZhciB0YXJnZXQgPSBuZXcgVVJJKCcvZGFzaGJvYXJkL2FkZCcpO1xuICAgICAgICB2YXIgY3VycmVudFVyaSA9IG5ldyBVUkkoKTtcbiAgICAgICAgLypcbiAgICAgICAgY3VycmVudFVyaS5yZW1vdmVRdWVyeSgnbWFpbi10YWInKTtcbiAgICAgICAgY3VycmVudFVyaS5yZW1vdmVRdWVyeSgnc3ViLXRhYicpO1xuICAgICAgICAqL1xuICAgICAgICB2YXIgd2lkZ2V0VXJpID0gbmV3IFVSSShjdXJyZW50VXJpLnBhdGgoKSk7XG4gICAgICAgIHdpZGdldFVyaS5xdWVyeShjdXJyZW50VXJpLnF1ZXJ5KHRydWUpKTtcbiAgICAgICAgdGFyZ2V0LnF1ZXJ5KChxdWVyeSkgPT4ge1xuICAgICAgICAgIHF1ZXJ5LmhyZWYgPSB3aWRnZXRVcmkudG9TdHJpbmcoKS5lc2NhcGVVUkwoKVxuICAgICAgICAgIGlmICh0aXRsZSkge1xuICAgICAgICAgICAgcXVlcnkudGl0bGUgPSB0aXRsZS5lc2NhcGVVUkwoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHNpemVfeCAmJiBzaXplX3kpIHtcbiAgICAgICAgICAgIHF1ZXJ5LnNpemUgPSBhbmd1bGFyLnRvSnNvbih7c2l6ZV94OiBzaXplX3gsIHNpemVfeTogc2l6ZV95fSkuZXNjYXBlVVJMKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRhcmdldC50b1N0cmluZygpO1xuICAgICAgfVxuICAgICAgcmV0dXJuICRkZWxlZ2F0ZTtcbiAgICB9XSk7XG5cbiAgICAkcm91dGVQcm92aWRlci5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvYWRkJywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2FkZFRvRGFzaGJvYXJkLmh0bWwnfSkuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2VkaXQnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnZWRpdERhc2hib2FyZHMuaHRtbCd9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvaWR4LzpkYXNoYm9hcmRJbmRleCcsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdkYXNoYm9hcmQuaHRtbCcsIHJlbG9hZE9uU2VhcmNoOiBmYWxzZSB9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvaWQvOmRhc2hib2FyZElkJywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2Rhc2hib2FyZC5odG1sJywgcmVsb2FkT25TZWFyY2g6IGZhbHNlIH0pLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9pZC86ZGFzaGJvYXJkSWQvc2hhcmUnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnc2hhcmUuaHRtbCd9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvaW1wb3J0Jywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2ltcG9ydC5odG1sJ30pO1xuICB9XSk7XG5cbiAgX21vZHVsZS52YWx1ZSgndWkuY29uZmlnJywge1xuICAgIC8vIFRoZSB1aS1qcSBkaXJlY3RpdmUgbmFtZXNwYWNlXG4gICAganE6IHtcbiAgICAgIGdyaWRzdGVyOiB7XG4gICAgICAgIHdpZGdldF9tYXJnaW5zOiBbMTAsIDEwXSxcbiAgICAgICAgd2lkZ2V0X2Jhc2VfZGltZW5zaW9uczogWzE0MCwgMTQwXVxuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgdmFyIHRhYiA9IHVuZGVmaW5lZDtcblxuICBleHBvcnQgZnVuY3Rpb24gc2V0U3ViVGFicyhidWlsZGVyLCBkYXNoYm9hcmRzOkFycmF5PERhc2hib2FyZD4sICRyb290U2NvcGUpIHtcbiAgICBsb2cuZGVidWcoXCJVcGRhdGluZyBzdWItdGFic1wiKTtcbiAgICBpZiAoIXRhYi50YWJzKSB7XG4gICAgICB0YWIudGFicyA9IFtdO1xuICAgIH0gZWxzZSB7XG4gICAgICB0YWIudGFicy5sZW5ndGggPSAwO1xuICAgIH1cbiAgICBfLmZvckVhY2goZGFzaGJvYXJkcywgKGRhc2hib2FyZCkgPT4ge1xuICAgICAgdmFyIGNoaWxkID0gYnVpbGRlclxuICAgICAgICAuaWQoJ2Rhc2hib2FyZC0nICsgZGFzaGJvYXJkLmlkKVxuICAgICAgICAudGl0bGUoKCkgPT4gZGFzaGJvYXJkLnRpdGxlIHx8IGRhc2hib2FyZC5pZClcbiAgICAgICAgLmhyZWYoKCkgPT4ge1xuICAgICAgICAgIHZhciB1cmkgPSBuZXcgVVJJKFVybEhlbHBlcnMuam9pbignL2Rhc2hib2FyZC9pZCcsIGRhc2hib2FyZC5pZCkpXG4gICAgICAgICAgICB1cmkuc2VhcmNoKHtcbiAgICAgICAgICAgICAgJ21haW4tdGFiJzogcGx1Z2luTmFtZSxcbiAgICAgICAgICAgICAgJ3N1Yi10YWInOiAnZGFzaGJvYXJkLScgKyBkYXNoYm9hcmQuaWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiB1cmkudG9TdHJpbmcoKTtcbiAgICAgICAgfSlcbiAgICAgIC5idWlsZCgpO1xuICAgICAgdGFiLnRhYnMucHVzaChjaGlsZCk7XG4gICAgfSk7XG4gICAgdmFyIG1hbmFnZSA9IGJ1aWxkZXJcbiAgICAgIC5pZCgnZGFzaGJvYXJkLW1hbmFnZScpXG4gICAgICAudGl0bGUoKCkgPT4gJzxpIGNsYXNzPVwiZmEgZmEtcGVuY2lsXCI+PC9pPiZuYnNwO01hbmFnZScpXG4gICAgICAuaHJlZigoKSA9PiAnL2Rhc2hib2FyZC9lZGl0P21haW4tdGFiPWRhc2hib2FyZCZzdWItdGFiPWRhc2hib2FyZC1tYW5hZ2UnKVxuICAgICAgLmJ1aWxkKCk7XG4gICAgdGFiLnRhYnMucHVzaChtYW5hZ2UpO1xuICAgIHRhYi50YWJzLmZvckVhY2goKHRhYikgPT4ge1xuICAgICAgdGFiLmlzU2VsZWN0ZWQgPSAoKSA9PiB7XG4gICAgICAgIHZhciBpZCA9IHRhYi5pZC5yZXBsYWNlKCdkYXNoYm9hcmQtJywgJycpO1xuICAgICAgICB2YXIgdXJpID0gbmV3IFVSSSgpO1xuICAgICAgICByZXR1cm4gdXJpLnF1ZXJ5KHRydWUpWydzdWItdGFiJ10gPT09IHRhYi5pZCB8fCBfLmVuZHNXaXRoKHVyaS5wYXRoKCksIGlkKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBDb3JlLiRhcHBseSgkcm9vdFNjb3BlKTtcbiAgfVxuXG4gIF9tb2R1bGUucnVuKFtcIkhhd3Rpb05hdlwiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgXCIkcm9vdFNjb3BlXCIsIFwiSGF3dGlvRGFzaGJvYXJkXCIsIFwiJHRpbWVvdXRcIiwgKG5hdjpIYXd0aW9NYWluTmF2LlJlZ2lzdHJ5LCBkYXNoYm9hcmRzOkRhc2hib2FyZFJlcG9zaXRvcnksICRyb290U2NvcGUsIGRhc2g6RGFzaGJvYXJkU2VydmljZSwgJHRpbWVvdXQpID0+IHtcbiAgICAvLyBzcGVjaWFsIGNhc2UgaGVyZSwgd2UgZG9uJ3Qgd2FudCB0byBvdmVyd3JpdGUgb3VyIHN0b3JlZCB0YWIhXG4gICAgaWYgKCFkYXNoLmluRGFzaGJvYXJkKSB7XG4gICAgICB2YXIgYnVpbGRlciA9IG5hdi5idWlsZGVyKCk7XG4gICAgICB0YWIgPSBidWlsZGVyLmlkKHBsdWdpbk5hbWUpXG4gICAgICAgIC5ocmVmKCgpID0+ICcvZGFzaGJvYXJkL2lkeC8wJylcbiAgICAgICAgLnRpdGxlKCgpID0+ICdEYXNoYm9hcmQnKVxuICAgICAgICAuYnVpbGQoKTtcbiAgICAgIG5hdi5hZGQodGFiKTtcbiAgICAgICR0aW1lb3V0KCgpID0+IHtcbiAgICAgICAgZGFzaGJvYXJkcy5nZXREYXNoYm9hcmRzKChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgICAgc2V0U3ViVGFicyhidWlsZGVyLCBkYXNoYm9hcmRzLCAkcm9vdFNjb3BlKTtcbiAgICAgICAgfSk7XG4gICAgICB9LCA1MDApO1xuICAgIH1cbiAgfV0pO1xuXG4gIGhhd3Rpb1BsdWdpbkxvYWRlci5hZGRNb2R1bGUocGx1Z2luTmFtZSk7XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZEludGVyZmFjZXMudHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuXG4gIF9tb2R1bGUuZmFjdG9yeSgnZGFzaGJvYXJkUmVwb3NpdG9yeScsIFsnRGVmYXVsdERhc2hib2FyZHMnLCAoZGVmYXVsdHM6RGVmYXVsdERhc2hib2FyZHMpID0+IHtcbiAgICByZXR1cm4gbmV3IExvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeShkZWZhdWx0cyk7XG4gIH1dKTtcblxuICBfbW9kdWxlLmZhY3RvcnkoJ0RlZmF1bHREYXNoYm9hcmRzJywgWygpID0+IHtcbiAgICB2YXIgZGVmYXVsdHMgPSA8QXJyYXk8RGFzaGJvYXJkPj5bXTtcbiAgICB2YXIgYW5zd2VyID0ge1xuICAgICAgYWRkOiAoZGFzaGJvYXJkOkRhc2hib2FyZCkgPT4ge1xuICAgICAgICBkZWZhdWx0cy5wdXNoKGRhc2hib2FyZCk7XG4gICAgICB9LFxuICAgICAgcmVtb3ZlOiAoaWQ6c3RyaW5nKSA9PiB7XG4gICAgICAgIHJldHVybiBfLnJlbW92ZShkZWZhdWx0cywgKGRhc2hib2FyZCkgPT4gZGFzaGJvYXJkLmlkID09PSBpZCk7XG4gICAgICB9LFxuICAgICAgZ2V0QWxsOiAoKSA9PiBkZWZhdWx0c1xuICAgIH1cbiAgICByZXR1cm4gYW5zd2VyO1xuICB9XSk7XG5cbiAgLyoqXG4gICAqIEBjbGFzcyBMb2NhbERhc2hib2FyZFJlcG9zaXRvcnlcbiAgICogQHVzZXMgRGFzaGJvYXJkUmVwb3NpdG9yeVxuICAgKi9cbiAgZXhwb3J0IGNsYXNzIExvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeSBpbXBsZW1lbnRzIERhc2hib2FyZFJlcG9zaXRvcnkge1xuXG4gICAgcHJpdmF0ZSBsb2NhbFN0b3JhZ2U6V2luZG93TG9jYWxTdG9yYWdlID0gbnVsbDtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZGVmYXVsdHM6RGVmYXVsdERhc2hib2FyZHMpIHtcbiAgICAgIHRoaXMubG9jYWxTdG9yYWdlID0gQ29yZS5nZXRMb2NhbFN0b3JhZ2UoKTtcbiAgICAgIC8qXG4gICAgICBpZiAoJ3VzZXJEYXNoYm9hcmRzJyBpbiB0aGlzLmxvY2FsU3RvcmFnZSkge1xuICAgICAgICBsb2cuZGVidWcoXCJGb3VuZCBwcmV2aW91c2x5IHNhdmVkIGRhc2hib2FyZHNcIik7XG4gICAgICAgIGlmICh0aGlzLmxvYWREYXNoYm9hcmRzKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgdGhpcy5zdG9yZURhc2hib2FyZHMoZGVmYXVsdHMuZ2V0QWxsKCkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnN0b3JlRGFzaGJvYXJkcyhkZWZhdWx0cy5nZXRBbGwoKSk7XG4gICAgICB9XG4gICAgICAqL1xuICAgIH1cblxuICAgIHByaXZhdGUgbG9hZERhc2hib2FyZHMoKSB7XG4gICAgICB2YXIgYW5zd2VyID0gYW5ndWxhci5mcm9tSnNvbihsb2NhbFN0b3JhZ2VbJ3VzZXJEYXNoYm9hcmRzJ10pO1xuICAgICAgaWYgKCFhbnN3ZXIgfHwgYW5zd2VyLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBhbnN3ZXIgPSB0aGlzLmRlZmF1bHRzLmdldEFsbCgpO1xuICAgICAgfVxuICAgICAgbG9nLmRlYnVnKFwicmV0dXJuaW5nIGRhc2hib2FyZHM6IFwiLCBhbnN3ZXIpO1xuICAgICAgcmV0dXJuIGFuc3dlcjtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN0b3JlRGFzaGJvYXJkcyhkYXNoYm9hcmRzOmFueVtdKSB7XG4gICAgICBsb2cuZGVidWcoXCJzdG9yaW5nIGRhc2hib2FyZHM6IFwiLCBkYXNoYm9hcmRzKTtcbiAgICAgIGxvY2FsU3RvcmFnZVsndXNlckRhc2hib2FyZHMnXSA9IGFuZ3VsYXIudG9Kc29uKGRhc2hib2FyZHMpO1xuICAgICAgcmV0dXJuIHRoaXMubG9hZERhc2hib2FyZHMoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcHV0RGFzaGJvYXJkcyhhcnJheTphbnlbXSwgY29tbWl0TWVzc2FnZTpzdHJpbmcsIGZuKSB7XG4gICAgICB2YXIgZGFzaGJvYXJkcyA9IHRoaXMubG9hZERhc2hib2FyZHMoKTtcbiAgICAgIGFycmF5LmZvckVhY2goKGRhc2gpID0+IHtcbiAgICAgICAgdmFyIGV4aXN0aW5nID0gZGFzaGJvYXJkcy5maW5kSW5kZXgoKGQpID0+IHsgcmV0dXJuIGQuaWQgPT09IGRhc2guaWQ7IH0pO1xuICAgICAgICBpZiAoZXhpc3RpbmcgPj0gMCkge1xuICAgICAgICAgIGRhc2hib2FyZHNbZXhpc3RpbmddID0gZGFzaDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXNoYm9hcmRzLnB1c2goZGFzaCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZm4odGhpcy5zdG9yZURhc2hib2FyZHMoZGFzaGJvYXJkcykpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZWxldGVEYXNoYm9hcmRzKGFycmF5OmFueVtdLCBmbikge1xuICAgICAgdmFyIGRhc2hib2FyZHMgPSB0aGlzLmxvYWREYXNoYm9hcmRzKCk7XG4gICAgICBhbmd1bGFyLmZvckVhY2goYXJyYXksIChpdGVtKSA9PiB7XG4gICAgICAgIGRhc2hib2FyZHMucmVtb3ZlKChpKSA9PiB7IHJldHVybiBpLmlkID09PSBpdGVtLmlkOyB9KTtcbiAgICAgIH0pO1xuICAgICAgZm4odGhpcy5zdG9yZURhc2hib2FyZHMoZGFzaGJvYXJkcykpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXREYXNoYm9hcmRzKGZuKSB7XG4gICAgICBmbih0aGlzLmxvYWREYXNoYm9hcmRzKCkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXREYXNoYm9hcmQoaWQ6c3RyaW5nLCBmbikge1xuICAgICAgdmFyIGRhc2hib2FyZHMgPSB0aGlzLmxvYWREYXNoYm9hcmRzKCk7XG4gICAgICB2YXIgZGFzaGJvYXJkID0gZGFzaGJvYXJkcy5maW5kKChkYXNoYm9hcmQpID0+IHsgcmV0dXJuIGRhc2hib2FyZC5pZCA9PT0gaWQgfSk7XG4gICAgICBmbihkYXNoYm9hcmQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGVEYXNoYm9hcmQob3B0aW9uczphbnkpIHtcbiAgICAgIHZhciBhbnN3ZXIgPXtcbiAgICAgICAgdGl0bGU6IFwiTmV3IERhc2hib2FyZFwiLFxuICAgICAgICBncm91cDogXCJQZXJzb25hbFwiLFxuICAgICAgICB3aWRnZXRzOiBbXVxuICAgICAgfTtcbiAgICAgIGFuc3dlciA9IGFuZ3VsYXIuZXh0ZW5kKGFuc3dlciwgb3B0aW9ucyk7XG4gICAgICBhbnN3ZXJbJ2lkJ10gPSBDb3JlLmdldFVVSUQoKTtcbiAgICAgIHJldHVybiBhbnN3ZXI7XG4gICAgfVxuXG4gICAgcHVibGljIGNsb25lRGFzaGJvYXJkKGRhc2hib2FyZDphbnkpIHtcbiAgICAgIHZhciBuZXdEYXNoYm9hcmQgPSBPYmplY3QuY2xvbmUoZGFzaGJvYXJkKTtcbiAgICAgIG5ld0Rhc2hib2FyZFsnaWQnXSA9IENvcmUuZ2V0VVVJRCgpO1xuICAgICAgbmV3RGFzaGJvYXJkWyd0aXRsZSddID0gXCJDb3B5IG9mIFwiICsgZGFzaGJvYXJkLnRpdGxlO1xuICAgICAgcmV0dXJuIG5ld0Rhc2hib2FyZDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0VHlwZSgpIHtcbiAgICAgIHJldHVybiAnY29udGFpbmVyJztcbiAgICB9XG4gIH1cblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG5cbiAgX21vZHVsZS5jb250cm9sbGVyKFwiRGFzaGJvYXJkLkVkaXREYXNoYm9hcmRzQ29udHJvbGxlclwiLCBbXCIkc2NvcGVcIiwgXCIkcm91dGVQYXJhbXNcIiwgXCIkcm91dGVcIiwgXCIkbG9jYXRpb25cIiwgXCIkcm9vdFNjb3BlXCIsIFwiZGFzaGJvYXJkUmVwb3NpdG9yeVwiLCBcIkhhd3Rpb05hdlwiLCBcIiR0aW1lb3V0XCIsIFwiJHRlbXBsYXRlQ2FjaGVcIiwgXCIkbW9kYWxcIiwgKCRzY29wZSwgJHJvdXRlUGFyYW1zLCAkcm91dGUsICRsb2NhdGlvbiwgJHJvb3RTY29wZSwgZGFzaGJvYXJkUmVwb3NpdG9yeTpEYXNoYm9hcmRSZXBvc2l0b3J5LCBuYXYsICR0aW1lb3V0LCAkdGVtcGxhdGVDYWNoZSwgJG1vZGFsKSA9PiB7XG5cbiAgICAkc2NvcGUuX2Rhc2hib2FyZHMgPSBbXTtcblxuICAgICRyb290U2NvcGUuJG9uKCdkYXNoYm9hcmRzVXBkYXRlZCcsIGRhc2hib2FyZExvYWRlZCk7XG5cbiAgICAkc2NvcGUuaGFzVXJsID0gKCkgPT4ge1xuICAgICAgcmV0dXJuICgkc2NvcGUudXJsKSA/IHRydWUgOiBmYWxzZTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmhhc1NlbGVjdGlvbiA9ICgpID0+IHtcbiAgICAgIHJldHVybiAkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcy5sZW5ndGggIT09IDA7XG4gICAgfTtcblxuICAgICRzY29wZS5ncmlkT3B0aW9ucyA9IHtcbiAgICAgIHNlbGVjdGVkSXRlbXM6IFtdLFxuICAgICAgc2hvd0ZpbHRlcjogZmFsc2UsXG4gICAgICBzaG93Q29sdW1uTWVudTogZmFsc2UsXG4gICAgICBmaWx0ZXJPcHRpb25zOiB7XG4gICAgICAgIGZpbHRlclRleHQ6ICcnXG4gICAgICB9LFxuICAgICAgZGF0YTogJ19kYXNoYm9hcmRzJyxcbiAgICAgIHNlbGVjdFdpdGhDaGVja2JveE9ubHk6IHRydWUsXG4gICAgICBzaG93U2VsZWN0aW9uQ2hlY2tib3g6IHRydWUsXG4gICAgICBjb2x1bW5EZWZzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBmaWVsZDogJ3RpdGxlJyxcbiAgICAgICAgICBkaXNwbGF5TmFtZTogJ0Rhc2hib2FyZCcsXG4gICAgICAgICAgY2VsbFRlbXBsYXRlOiAkdGVtcGxhdGVDYWNoZS5nZXQoVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ2VkaXREYXNoYm9hcmRUaXRsZUNlbGwuaHRtbCcpKVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZmllbGQ6ICdncm91cCcsXG4gICAgICAgICAgZGlzcGxheU5hbWU6ICdHcm91cCdcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICB9O1xuXG4gICAgdmFyIGRvVXBkYXRlID0gXy5kZWJvdW5jZSh1cGRhdGVEYXRhLCAxMCk7XG5cbiAgICAvLyBoZWxwZXJzIHNvIHdlIGNhbiBlbmFibGUvZGlzYWJsZSBwYXJ0cyBvZiB0aGUgVUkgZGVwZW5kaW5nIG9uIGhvd1xuICAgIC8vIGRhc2hib2FyZCBkYXRhIGlzIHN0b3JlZFxuICAgIC8qXG4gICAgJHNjb3BlLnVzaW5nR2l0ID0gKCkgPT4ge1xuICAgICAgcmV0dXJuIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0VHlwZSgpID09PSAnZ2l0JztcbiAgICB9O1xuXG4gICAgJHNjb3BlLnVzaW5nRmFicmljID0gKCkgPT4ge1xuICAgICAgcmV0dXJuIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0VHlwZSgpID09PSAnZmFicmljJztcbiAgICB9O1xuXG4gICAgJHNjb3BlLnVzaW5nTG9jYWwgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlKCkgPT09ICdjb250YWluZXInO1xuICAgIH07XG5cbiAgICBpZiAoJHNjb3BlLnVzaW5nRmFicmljKCkpIHtcbiAgICAgICRzY29wZS5ncmlkT3B0aW9ucy5jb2x1bW5EZWZzLmFkZChbe1xuICAgICAgICBmaWVsZDogJ3ZlcnNpb25JZCcsXG4gICAgICAgIGRpc3BsYXlOYW1lOiAnVmVyc2lvbidcbiAgICAgIH0sIHtcbiAgICAgICAgZmllbGQ6ICdwcm9maWxlSWQnLFxuICAgICAgICBkaXNwbGF5TmFtZTogJ1Byb2ZpbGUnXG4gICAgICB9LCB7XG4gICAgICAgIGZpZWxkOiAnZmlsZU5hbWUnLFxuICAgICAgICBkaXNwbGF5TmFtZTogJ0ZpbGUgTmFtZSdcbiAgICAgIH1dKTtcbiAgICB9XG4gICAgKi9cblxuICAgICR0aW1lb3V0KGRvVXBkYXRlLCAxMCk7XG5cbiAgICAkc2NvcGUuJG9uKFwiJHJvdXRlQ2hhbmdlU3VjY2Vzc1wiLCBmdW5jdGlvbiAoZXZlbnQsIGN1cnJlbnQsIHByZXZpb3VzKSB7XG4gICAgICAvLyBsZXRzIGRvIHRoaXMgYXN5bmNocm9ub3VzbHkgdG8gYXZvaWQgRXJyb3I6ICRkaWdlc3QgYWxyZWFkeSBpbiBwcm9ncmVzc1xuICAgICAgJHRpbWVvdXQoZG9VcGRhdGUsIDEwKTtcbiAgICB9KTtcblxuICAgICRzY29wZS5hZGRWaWV3VG9EYXNoYm9hcmQgPSAoKSA9PiB7XG4gICAgICB2YXIgbmV4dEhyZWYgPSBudWxsO1xuICAgICAgdmFyIHNlbGVjdGVkID0gJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXM7XG4gICAgICB2YXIgY3VycmVudFVybCA9IG5ldyBVUkkoKTtcbiAgICAgIHZhciBjb25maWcgPSBjdXJyZW50VXJsLnF1ZXJ5KHRydWUpO1xuICAgICAgdmFyIGhyZWYgPSBjb25maWdbJ2hyZWYnXTtcbiAgICAgIHZhciBpZnJhbWUgPSBjb25maWdbJ2lmcmFtZSddO1xuICAgICAgdmFyIHR5cGUgPSAnaHJlZic7XG4gICAgICBpZiAoaHJlZikge1xuICAgICAgICBocmVmID0gaHJlZi51bmVzY2FwZVVSTCgpO1xuICAgICAgICBocmVmID0gQ29yZS50cmltTGVhZGluZyhocmVmLCAnIycpO1xuICAgICAgfSBlbHNlIGlmIChpZnJhbWUpIHtcbiAgICAgICAgaWZyYW1lID0gaWZyYW1lLnVuZXNjYXBlVVJMKCk7XG4gICAgICAgIHR5cGUgPSAnaWZyYW1lJztcbiAgICAgIH1cbiAgICAgIHZhciB3aWRnZXRVUkkgPSA8YW55PiB1bmRlZmluZWQ7XG4gICAgICBzd2l0Y2godHlwZSkge1xuICAgICAgICBjYXNlICdocmVmJzpcbiAgICAgICAgICBsb2cuZGVidWcoXCJocmVmOiBcIiwgaHJlZik7XG4gICAgICAgICAgd2lkZ2V0VVJJID0gbmV3IFVSSShocmVmKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnaWZyYW1lJzpcbiAgICAgICAgICBsb2cuZGVidWcoXCJpZnJhbWU6IFwiLCBpZnJhbWUpO1xuICAgICAgICAgIHdpZGdldFVSSSA9IG5ldyBVUkkoaWZyYW1lKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBsb2cuZGVidWcoXCJ0eXBlIHVua25vd25cIik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIHNpemVTdHIgPSA8YW55PiBjb25maWdbJ3NpemUnXTtcbiAgICAgIGlmIChzaXplU3RyKSB7XG4gICAgICAgIHNpemVTdHIgPSBzaXplU3RyLnVuZXNjYXBlVVJMKCk7XG4gICAgICB9XG4gICAgICB2YXIgc2l6ZSA9IGFuZ3VsYXIuZnJvbUpzb24oc2l6ZVN0cikgfHwgeyBzaXplX3g6IDEsIHNpemVfeTogMSB9O1xuICAgICAgdmFyIHRpdGxlID0gKGNvbmZpZ1sndGl0bGUnXSB8fCAnJykudW5lc2NhcGVVUkwoKTtcbiAgICAgIHZhciB0ZW1wbGF0ZVdpZGdldCA9IHtcbiAgICAgICAgaWQ6IENvcmUuZ2V0VVVJRCgpLFxuICAgICAgICByb3c6IDEsXG4gICAgICAgIGNvbDogMSxcbiAgICAgICAgc2l6ZV94OiBzaXplLnNpemVfeCxcbiAgICAgICAgc2l6ZV95OiBzaXplLnNpemVfeSxcbiAgICAgICAgdGl0bGU6IHRpdGxlXG4gICAgICB9XG4gICAgICBhbmd1bGFyLmZvckVhY2goc2VsZWN0ZWQsIChzZWxlY3RlZEl0ZW0pID0+IHtcblxuICAgICAgICB2YXIgd2lkZ2V0ID0gXy5jbG9uZURlZXAodGVtcGxhdGVXaWRnZXQpO1xuXG4gICAgICAgIGlmICghc2VsZWN0ZWRJdGVtLndpZGdldHMpIHtcbiAgICAgICAgICBzZWxlY3RlZEl0ZW0ud2lkZ2V0cyA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgY2FzZSAnaWZyYW1lJzogXG4gICAgICAgICAgICB3aWRnZXQgPSA8YW55Pl8uZXh0ZW5kKHtcbiAgICAgICAgICAgICAgaWZyYW1lOiBpZnJhbWVcbiAgICAgICAgICAgIH0sIHdpZGdldCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdocmVmJzpcbiAgICAgICAgICAgIHZhciB0ZXh0ID0gd2lkZ2V0VVJJLnBhdGgoKTtcbiAgICAgICAgICAgIHZhciBzZWFyY2ggPSB3aWRnZXRVUkkucXVlcnkodHJ1ZSk7XG4gICAgICAgICAgICBpZiAoJHJvdXRlICYmICRyb3V0ZS5yb3V0ZXMpIHtcbiAgICAgICAgICAgICAgdmFyIHZhbHVlID0gJHJvdXRlLnJvdXRlc1t0ZXh0XTtcbiAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlVXJsID0gdmFsdWVbXCJ0ZW1wbGF0ZVVybFwiXTtcbiAgICAgICAgICAgICAgICBpZiAodGVtcGxhdGVVcmwpIHtcbiAgICAgICAgICAgICAgICAgIHdpZGdldCA9IDxhbnk+IF8uZXh0ZW5kKHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogdGV4dCxcbiAgICAgICAgICAgICAgICAgICAgaW5jbHVkZTogdGVtcGxhdGVVcmwsXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaDogc2VhcmNoLFxuICAgICAgICAgICAgICAgICAgICBoYXNoOiBcIlwiXG4gICAgICAgICAgICAgICAgICB9LCB3aWRnZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPIHdlIG5lZWQgdG8gYmUgYWJsZSB0byBtYXRjaCBVUkkgdGVtcGxhdGVzLi4uXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICAvLyBmaWd1cmUgb3V0IHRoZSB3aWR0aCBvZiB0aGUgZGFzaFxuICAgICAgICB2YXIgZ3JpZFdpZHRoID0gMDtcblxuICAgICAgICBzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5mb3JFYWNoKCh3KSA9PiB7XG4gICAgICAgICAgdmFyIHJpZ2h0U2lkZSA9IHcuY29sICsgdy5zaXplX3g7XG4gICAgICAgICAgaWYgKHJpZ2h0U2lkZSA+IGdyaWRXaWR0aCkge1xuICAgICAgICAgICAgZ3JpZFdpZHRoID0gcmlnaHRTaWRlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGZvdW5kID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIGxlZnQgPSAodykgPT4ge1xuICAgICAgICAgIHJldHVybiB3LmNvbDtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcmlnaHQgPSAodykgID0+IHtcbiAgICAgICAgICByZXR1cm4gdy5jb2wgKyB3LnNpemVfeCAtIDE7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHRvcCA9ICh3KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHcucm93O1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBib3R0b20gPSAodykgPT4ge1xuICAgICAgICAgIHJldHVybiB3LnJvdyArIHcuc2l6ZV95IC0gMTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgY29sbGlzaW9uID0gKHcxLCB3MikgPT4ge1xuICAgICAgICAgIHJldHVybiAhKCBsZWZ0KHcyKSA+IHJpZ2h0KHcxKSB8fFxuICAgICAgICAgICAgICByaWdodCh3MikgPCBsZWZ0KHcxKSB8fFxuICAgICAgICAgICAgICB0b3AodzIpID4gYm90dG9tKHcxKSB8fFxuICAgICAgICAgICAgICBib3R0b20odzIpIDwgdG9wKHcxKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHNlbGVjdGVkSXRlbS53aWRnZXRzLmlzRW1wdHkoKSkge1xuICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlICghZm91bmQpIHtcbiAgICAgICAgICB3aWRnZXQuY29sID0gMTtcbiAgICAgICAgICBpZiAod2lkZ2V0LmNvbCArIHdpZGdldC5zaXplX3ggPiBncmlkV2lkdGgpIHtcbiAgICAgICAgICAgIC8vIGxldCdzIG5vdCBsb29rIGZvciBhIHBsYWNlIG5leHQgdG8gZXhpc3Rpbmcgd2lkZ2V0XG4gICAgICAgICAgICBzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5mb3JFYWNoKGZ1bmN0aW9uKHcsIGlkeCkge1xuICAgICAgICAgICAgICBpZiAod2lkZ2V0LnJvdyA8PSB3LnJvdykge1xuICAgICAgICAgICAgICAgIHdpZGdldC5yb3crKztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAoOyAod2lkZ2V0LmNvbCArIHdpZGdldC5zaXplX3gpIDw9IGdyaWRXaWR0aDsgd2lkZ2V0LmNvbCsrKSB7XG4gICAgICAgICAgICBpZiAoIXNlbGVjdGVkSXRlbS53aWRnZXRzLmFueSgodykgPT4ge1xuICAgICAgICAgICAgICB2YXIgYyA9IGNvbGxpc2lvbih3LCB3aWRnZXQpO1xuICAgICAgICAgICAgICByZXR1cm4gY1xuICAgICAgICAgICAgfSkpIHtcbiAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgd2lkZ2V0LnJvdyA9IHdpZGdldC5yb3cgKyAxXG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGp1c3QgaW4gY2FzZSwga2VlcCB0aGUgc2NyaXB0IGZyb20gcnVubmluZyBhd2F5Li4uXG4gICAgICAgICAgaWYgKHdpZGdldC5yb3cgPiA1MCkge1xuICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgkc2NvcGUucm91dGVQYXJhbXMpIHtcbiAgICAgICAgICB3aWRnZXRbJ3JvdXRlUGFyYW1zJ10gPSAkc2NvcGUucm91dGVQYXJhbXM7XG4gICAgICAgIH1cbiAgICAgICAgc2VsZWN0ZWRJdGVtLndpZGdldHMucHVzaCh3aWRnZXQpO1xuICAgICAgICBpZiAoIW5leHRIcmVmICYmIHNlbGVjdGVkSXRlbS5pZCkge1xuICAgICAgICAgIG5leHRIcmVmID0gbmV3IFVSSSgpLnBhdGgoXCIvZGFzaGJvYXJkL2lkL1wiICsgc2VsZWN0ZWRJdGVtLmlkKS5xdWVyeSh7XG4gICAgICAgICAgICAnbWFpbi10YWInOiAnZGFzaGJvYXJkJyxcbiAgICAgICAgICAgICdzdWItdGFiJzogJ2Rhc2hib2FyZC0nICsgc2VsZWN0ZWRJdGVtLmlkXG4gICAgICAgICAgfSkucmVtb3ZlUXVlcnkoJ2hyZWYnKVxuICAgICAgICAgICAgLnJlbW92ZVF1ZXJ5KCd0aXRsZScpXG4gICAgICAgICAgICAucmVtb3ZlUXVlcnkoJ2lmcmFtZScpXG4gICAgICAgICAgICAucmVtb3ZlUXVlcnkoJ3NpemUnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIG5vdyBsZXRzIHVwZGF0ZSB0aGUgYWN0dWFsIGRhc2hib2FyZCBjb25maWdcbiAgICAgIHZhciBjb21taXRNZXNzYWdlID0gXCJBZGQgd2lkZ2V0XCI7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoc2VsZWN0ZWQsIGNvbW1pdE1lc3NhZ2UsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIC8qXG4gICAgICAgIGxvZy5kZWJ1ZyhcIlB1dCBkYXNoYm9hcmRzOiBcIiwgZGFzaGJvYXJkcyk7XG4gICAgICAgIGxvZy5kZWJ1ZyhcIk5leHQgaHJlZjogXCIsIG5leHRIcmVmLnRvU3RyaW5nKCkpO1xuICAgICAgICAqL1xuICAgICAgICBpZiAobmV4dEhyZWYpIHtcbiAgICAgICAgICAkbG9jYXRpb24ucGF0aChuZXh0SHJlZi5wYXRoKCkpLnNlYXJjaChuZXh0SHJlZi5xdWVyeSh0cnVlKSk7XG4gICAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB9O1xuXG4gICAgJHNjb3BlLmNyZWF0ZSA9ICgpID0+IHtcblxuICAgICAgdmFyIGNvdW50ZXIgPSBkYXNoYm9hcmRzKCkubGVuZ3RoICsgMTtcbiAgICAgIHZhciB0aXRsZSA9IFwiVW50aXRsZWRcIiArIGNvdW50ZXI7XG5cbiAgICAgIHZhciBtb2RhbCA9ICRtb2RhbC5vcGVuKHtcbiAgICAgICAgdGVtcGxhdGVVcmw6IFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdjcmVhdGVEYXNoYm9hcmRNb2RhbC5odG1sJyksXG4gICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRtb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAkc2NvcGUuZW50aXR5ID0ge1xuICAgICAgICAgICAgdGl0bGU6IHRpdGxlXG4gICAgICAgICAgfVxuICAgICAgICAgICRzY29wZS5jb25maWcgPSB7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICd0aXRsZSc6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgJHNjb3BlLm9rID0gKCkgPT4ge1xuICAgICAgICAgICAgbW9kYWwuY2xvc2UoKTtcbiAgICAgICAgICAgIHZhciB0aXRsZSA9ICRzY29wZS5lbnRpdHkudGl0bGVcbiAgICAgICAgICAgIHZhciBuZXdEYXNoID0gZGFzaGJvYXJkUmVwb3NpdG9yeS5jcmVhdGVEYXNoYm9hcmQoeyB0aXRsZTogdGl0bGUgfSk7XG4gICAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoW25ld0Rhc2hdLCBcIkNyZWF0ZWQgbmV3IGRhc2hib2FyZDogXCIgKyB0aXRsZSwgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgICAgICAgLy8gbGV0J3MganVzdCBiZSBzYWZlIGFuZCBlbnN1cmUgdGhlcmUncyBubyBzZWxlY3Rpb25zXG4gICAgICAgICAgICAgIGRlc2VsZWN0QWxsKCk7XG4gICAgICAgICAgICAgIHNldFN1YlRhYnMobmF2LmJ1aWxkZXIoKSwgZGFzaGJvYXJkcywgJHJvb3RTY29wZSk7XG4gICAgICAgICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgbW9kYWwuZGlzbWlzcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfV1cbiAgICAgIH0pO1xuICAgICAgLypcbiAgICAgIHZhciBjb3VudGVyID0gZGFzaGJvYXJkcygpLmxlbmd0aCArIDE7XG4gICAgICB2YXIgdGl0bGUgPSBcIlVudGl0bGVkXCIgKyBjb3VudGVyO1xuICAgICAgdmFyIG5ld0Rhc2ggPSBkYXNoYm9hcmRSZXBvc2l0b3J5LmNyZWF0ZURhc2hib2FyZCh7dGl0bGU6IHRpdGxlfSk7XG5cbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbbmV3RGFzaF0sIFwiQ3JlYXRlZCBuZXcgZGFzaGJvYXJkOiBcIiArIHRpdGxlLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAvLyBsZXQncyBqdXN0IGJlIHNhZmUgYW5kIGVuc3VyZSB0aGVyZSdzIG5vIHNlbGVjdGlvbnNcbiAgICAgICAgZGVzZWxlY3RBbGwoKTtcbiAgICAgICAgc2V0U3ViVGFicyhuYXYuYnVpbGRlcigpLCBkYXNoYm9hcmRzLCAkcm9vdFNjb3BlKTtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG4gICAgICAqL1xuXG4gICAgfTtcblxuICAgICRzY29wZS5kdXBsaWNhdGUgPSAoKSA9PiB7XG4gICAgICB2YXIgbmV3RGFzaGJvYXJkcyA9IFtdO1xuICAgICAgdmFyIGNvbW1pdE1lc3NhZ2UgPSBcIkR1cGxpY2F0ZWQgZGFzaGJvYXJkKHMpIFwiO1xuICAgICAgYW5ndWxhci5mb3JFYWNoKCRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLCAoaXRlbSwgaWR4KSA9PiB7XG4gICAgICAgIC8vIGxldHMgdW5zZWxlY3QgdGhpcyBpdGVtXG4gICAgICAgIHZhciBjb21taXRNZXNzYWdlID0gXCJEdXBsaWNhdGVkIGRhc2hib2FyZCBcIiArIGl0ZW0udGl0bGU7XG4gICAgICAgIHZhciBuZXdEYXNoID0gZGFzaGJvYXJkUmVwb3NpdG9yeS5jbG9uZURhc2hib2FyZChpdGVtKTtcbiAgICAgICAgbmV3RGFzaGJvYXJkcy5wdXNoKG5ld0Rhc2gpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIGxldCdzIGp1c3QgYmUgc2FmZSBhbmQgZW5zdXJlIHRoZXJlJ3Mgbm8gc2VsZWN0aW9uc1xuICAgICAgZGVzZWxlY3RBbGwoKTtcblxuICAgICAgY29tbWl0TWVzc2FnZSA9IGNvbW1pdE1lc3NhZ2UgKyBuZXdEYXNoYm9hcmRzLm1hcCgoZCkgPT4geyByZXR1cm4gZC50aXRsZSB9KS5qb2luKCcsJyk7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMobmV3RGFzaGJvYXJkcywgY29tbWl0TWVzc2FnZSwgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgc2V0U3ViVGFicyhuYXYuYnVpbGRlcigpLCBkYXNoYm9hcmRzLCAkcm9vdFNjb3BlKTtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZW5hbWVEYXNoYm9hcmQgPSAoKSA9PiB7XG4gICAgICBpZiAoJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHZhciBzZWxlY3RlZCA9IDxhbnk+Xy5maXJzdCgkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcyk7XG4gICAgICAgIHZhciBtb2RhbCA9ICRtb2RhbC5vcGVuKHtcbiAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ3JlbmFtZURhc2hib2FyZE1vZGFsLmh0bWwnKSxcbiAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICckbW9kYWxJbnN0YW5jZScsICgkc2NvcGUsICRtb2RhbEluc3RhbmNlKSA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuY29uZmlnID0ge1xuICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgJ3RpdGxlJzoge1xuICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICBkZWZhdWx0OiBzZWxlY3RlZC50aXRsZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZCA9IHNlbGVjdGVkO1xuICAgICAgICAgICAgJHNjb3BlLm9rID0gKCkgPT4ge1xuICAgICAgICAgICAgICBtb2RhbC5jbG9zZSgpO1xuICAgICAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoWyRzY29wZS5zZWxlY3RlZF0sICdyZW5hbWVkIGRhc2hib2FyZCcsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gbGV0J3MganVzdCBiZSBzYWZlIGFuZCBlbnN1cmUgdGhlcmUncyBubyBzZWxlY3Rpb25zXG4gICAgICAgICAgICAgICAgZGVzZWxlY3RBbGwoKTtcbiAgICAgICAgICAgICAgICBzZXRTdWJUYWJzKG5hdi5idWlsZGVyKCksIGRhc2hib2FyZHMsICRyb290U2NvcGUpO1xuICAgICAgICAgICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgICBtb2RhbC5kaXNtaXNzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfV1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgICRzY29wZS5kZWxldGVEYXNoYm9hcmQgPSAoKSA9PiB7XG4gICAgICBpZiAoJHNjb3BlLmhhc1NlbGVjdGlvbigpKSB7XG4gICAgICAgIHZhciBzZWxlY3RlZCA9ICRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zO1xuICAgICAgICB2YXIgbW9kYWwgPSAkbW9kYWwub3Blbih7XG4gICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdkZWxldGVEYXNoYm9hcmRNb2RhbC5odG1sJyksXG4gICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCAnJG1vZGFsSW5zdGFuY2UnLCAoJHNjb3BlLCAkbW9kYWxJbnN0YW5jZSkgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkID0gc2VsZWN0ZWQ7XG4gICAgICAgICAgICAkc2NvcGUub2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZGVsZXRlRGFzaGJvYXJkcygkc2NvcGUuc2VsZWN0ZWQsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gbGV0J3MganVzdCBiZSBzYWZlIGFuZCBlbnN1cmUgdGhlcmUncyBubyBzZWxlY3Rpb25zXG4gICAgICAgICAgICAgICAgZGVzZWxlY3RBbGwoKTtcbiAgICAgICAgICAgICAgICBzZXRTdWJUYWJzKG5hdi5idWlsZGVyKCksIGRhc2hib2FyZHMsICRyb290U2NvcGUpO1xuICAgICAgICAgICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgICBtb2RhbC5kaXNtaXNzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfV1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgICRzY29wZS5naXN0ID0gKCkgPT4ge1xuICAgICAgaWYgKCRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGlkID0gJHNjb3BlLnNlbGVjdGVkSXRlbXNbMF0uaWQ7XG4gICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9pZC9cIiArIGlkICsgXCIvc2hhcmVcIik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZURhdGEoKSB7XG4gICAgICB2YXIgdXJsID0gJHJvdXRlUGFyYW1zW1wiaHJlZlwiXTtcbiAgICAgIGlmICh1cmwpIHtcbiAgICAgICAgJHNjb3BlLnVybCA9IGRlY29kZVVSSUNvbXBvbmVudCh1cmwpO1xuICAgICAgfVxuXG4gICAgICB2YXIgcm91dGVQYXJhbXMgPSAkcm91dGVQYXJhbXNbXCJyb3V0ZVBhcmFtc1wiXTtcbiAgICAgIGlmIChyb3V0ZVBhcmFtcykge1xuICAgICAgICAkc2NvcGUucm91dGVQYXJhbXMgPSBkZWNvZGVVUklDb21wb25lbnQocm91dGVQYXJhbXMpO1xuICAgICAgfVxuICAgICAgdmFyIHNpemU6YW55ID0gJHJvdXRlUGFyYW1zW1wic2l6ZVwiXTtcbiAgICAgIGlmIChzaXplKSB7XG4gICAgICAgIHNpemUgPSBkZWNvZGVVUklDb21wb25lbnQoc2l6ZSk7XG4gICAgICAgICRzY29wZS5wcmVmZXJyZWRTaXplID0gYW5ndWxhci5mcm9tSnNvbihzaXplKTtcbiAgICAgIH1cbiAgICAgIHZhciB0aXRsZTphbnkgPSAkcm91dGVQYXJhbXNbXCJ0aXRsZVwiXTtcbiAgICAgIGlmICh0aXRsZSkge1xuICAgICAgICB0aXRsZSA9IGRlY29kZVVSSUNvbXBvbmVudCh0aXRsZSk7XG4gICAgICAgICRzY29wZS53aWRnZXRUaXRsZSA9IHRpdGxlO1xuICAgICAgfVxuXG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZHMoKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGFzaGJvYXJkTG9hZGVkKGV2ZW50LCBkYXNoYm9hcmRzKSB7XG4gICAgICBkYXNoYm9hcmRzLmZvckVhY2goKGRhc2hib2FyZCkgPT4ge1xuICAgICAgICBkYXNoYm9hcmQuaGFzaCA9ICc/bWFpbi10YWI9ZGFzaGJvYXJkJnN1Yi10YWI9ZGFzaGJvYXJkLScgKyBkYXNoYm9hcmQuaWQ7XG4gICAgICB9KTtcbiAgICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IGRhc2hib2FyZHM7XG5cbiAgICAgIGlmIChldmVudCA9PT0gbnVsbCkge1xuICAgICAgICAkc2NvcGUuJGVtaXQoJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkcyk7XG4gICAgICB9XG4gICAgICBDb3JlLiRhcHBseSgkcm9vdFNjb3BlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXNoYm9hcmRzKCkge1xuICAgICAgcmV0dXJuICRzY29wZS5fZGFzaGJvYXJkcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZXNlbGVjdEFsbCgpIHtcbiAgICAgICRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLmxlbmd0aCA9IDA7XG4gICAgfVxuXG4gIH1dKTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRIZWxwZXJzLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcblxuICAvKipcbiAgICogSW1wbGVtZW50cyB0aGUgbmcuSUxvY2F0aW9uU2VydmljZSBpbnRlcmZhY2UgYW5kIGlzIHVzZWQgYnkgdGhlIGRhc2hib2FyZCB0byBzdXBwbHlcbiAgICogY29udHJvbGxlcnMgd2l0aCBhIHNhdmVkIFVSTCBsb2NhdGlvblxuICAgKlxuICAgKiBAY2xhc3MgUmVjdGFuZ2xlTG9jYXRpb25cbiAgICovXG4gIGV4cG9ydCBjbGFzcyBSZWN0YW5nbGVMb2NhdGlvbiB7IC8vIFRPRE8gaW1wbGVtZW50cyBuZy5JTG9jYXRpb25TZXJ2aWNlIHtcbiAgICBwcml2YXRlIF9wYXRoOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBfaGFzaDogc3RyaW5nO1xuICAgIHByaXZhdGUgX3NlYXJjaDogYW55O1xuICAgIHByaXZhdGUgdXJpOlVSSTtcblxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBkZWxlZ2F0ZTpuZy5JTG9jYXRpb25TZXJ2aWNlLCBwYXRoOnN0cmluZywgc2VhcmNoLCBoYXNoOnN0cmluZykge1xuICAgICAgdGhpcy5fcGF0aCA9IHBhdGg7XG4gICAgICB0aGlzLl9zZWFyY2ggPSBzZWFyY2g7XG4gICAgICB0aGlzLl9oYXNoID0gaGFzaDtcbiAgICAgIHRoaXMudXJpID0gbmV3IFVSSShwYXRoKTtcbiAgICAgIHRoaXMudXJpLnNlYXJjaCgocXVlcnkpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlYXJjaDtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGFic1VybCgpIHtcbiAgICAgIHJldHVybiB0aGlzLnByb3RvY29sKCkgKyB0aGlzLmhvc3QoKSArIFwiOlwiICsgdGhpcy5wb3J0KCkgKyB0aGlzLnBhdGgoKSArIHRoaXMuc2VhcmNoKCk7XG4gICAgfVxuXG4gICAgaGFzaChuZXdIYXNoOnN0cmluZyA9IG51bGwpOmFueSB7XG4gICAgICBpZiAobmV3SGFzaCkge1xuICAgICAgICB0aGlzLnVyaS5zZWFyY2gobmV3SGFzaCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX2hhc2g7XG4gICAgfVxuXG4gICAgaG9zdCgpOnN0cmluZyB7XG4gICAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5ob3N0KCk7XG4gICAgfVxuXG4gICAgcGF0aChuZXdQYXRoOnN0cmluZyA9IG51bGwpOmFueSB7XG4gICAgICBpZiAobmV3UGF0aCkge1xuICAgICAgICB0aGlzLnVyaS5wYXRoKG5ld1BhdGgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9wYXRoO1xuICAgIH1cblxuICAgIHBvcnQoKTpudW1iZXIge1xuICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUucG9ydCgpO1xuICAgIH1cblxuICAgIHByb3RvY29sKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUucG9ydCgpO1xuICAgIH1cblxuICAgIHJlcGxhY2UoKSB7XG4gICAgICAvLyBUT0RPXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZWFyY2gocGFyYW1ldGVyc01hcDphbnkgPSBudWxsKTphbnkge1xuICAgICAgaWYgKHBhcmFtZXRlcnNNYXApIHtcbiAgICAgICAgdGhpcy51cmkuc2VhcmNoKHBhcmFtZXRlcnNNYXApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9zZWFyY2g7XG4gICAgfVxuXG4gICAgdXJsKG5ld1ZhbHVlOiBzdHJpbmcgPSBudWxsKTphbnkge1xuICAgICAgaWYgKG5ld1ZhbHVlKSB7XG4gICAgICAgIHRoaXMudXJpID0gbmV3IFVSSShuZXdWYWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuYWJzVXJsKCk7XG4gICAgfVxuXG4gIH1cbn1cbiIsIi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRSZXBvc2l0b3J5LnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cInJlY3RhbmdsZUxvY2F0aW9uLnRzXCIvPlxubW9kdWxlIERhc2hib2FyZCB7XG5cbiAgdmFyIG1vZHVsZXM6QXJyYXk8c3RyaW5nPiA9IHVuZGVmaW5lZDtcblxuICBfbW9kdWxlLmRpcmVjdGl2ZSgnaGF3dGlvRGFzaGJvYXJkJywgZnVuY3Rpb24oKSB7XG4gICAgbW9kdWxlcyA9IGhhd3Rpb1BsdWdpbkxvYWRlclsnbW9kdWxlcyddLmZpbHRlcigobmFtZSkgPT4ge1xuICAgICAgcmV0dXJuIF8uaXNTdHJpbmcobmFtZSkgJiYgbmFtZSAhPT0gJ25nJztcbiAgICB9KTtcbiAgICByZXR1cm4gbmV3IERhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZSgpO1xuICB9KTtcblxuICBleHBvcnQgY2xhc3MgR3JpZHN0ZXJEaXJlY3RpdmUge1xuICAgIHB1YmxpYyByZXN0cmljdCA9ICdBJztcbiAgICBwdWJsaWMgcmVwbGFjZSA9IHRydWU7XG5cbiAgICBwdWJsaWMgY29udHJvbGxlciA9IFtcIiRzY29wZVwiLCBcIiRlbGVtZW50XCIsIFwiJGF0dHJzXCIsIFwiJGxvY2F0aW9uXCIsIFwiJHJvdXRlUGFyYW1zXCIsIFwiJHRlbXBsYXRlQ2FjaGVcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsIFwiJGNvbXBpbGVcIiwgXCIkdGVtcGxhdGVSZXF1ZXN0XCIsIFwiJGludGVycG9sYXRlXCIsIFwiJG1vZGFsXCIsIFwiJHNjZVwiLCBcIiR0aW1lb3V0XCIsICgkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMsICRsb2NhdGlvbiwgJHJvdXRlUGFyYW1zLCAkdGVtcGxhdGVDYWNoZSwgZGFzaGJvYXJkUmVwb3NpdG9yeTpEYXNoYm9hcmRSZXBvc2l0b3J5LCAkY29tcGlsZSwgJHRlbXBsYXRlUmVxdWVzdCwgJGludGVycG9sYXRlLCAkbW9kYWwsICRzY2UsICR0aW1lb3V0KSA9PiB7XG5cbiAgICAgIHZhciBncmlkU2l6ZSA9IDE1MDtcbiAgICAgIHZhciBncmlkTWFyZ2luID0gNjtcbiAgICAgIHZhciBncmlkSGVpZ2h0O1xuXG4gICAgICB2YXIgZ3JpZFggPSBncmlkU2l6ZTtcbiAgICAgIHZhciBncmlkWSA9IGdyaWRTaXplO1xuXG4gICAgICB2YXIgd2lkZ2V0TWFwID0ge307XG5cbiAgICAgIHZhciBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnkgPSAkc2NvcGUuJGV2YWwoJ2Rhc2hib2FyZFJlcG9zaXRvcnknKSB8fCBkYXNoYm9hcmRSZXBvc2l0b3J5O1xuXG4gICAgICAkc2NvcGUuJG9uKCckZGVzdHJveScsICgpID0+IHtcbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKHdpZGdldE1hcCwgKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgICBpZiAoJ3Njb3BlJyBpbiB2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIHNjb3BlID0gdmFsdWVbJ3Njb3BlJ107XG4gICAgICAgICAgICBzY29wZS4kZGVzdHJveSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgc2V0VGltZW91dCh1cGRhdGVXaWRnZXRzLCAxMCk7XG5cbiAgICAgIGZ1bmN0aW9uIHJlbW92ZVdpZGdldCh3aWRnZXQpIHtcbiAgICAgICAgdmFyIGdyaWRzdGVyID0gZ2V0R3JpZHN0ZXIoKTtcbiAgICAgICAgdmFyIHdpZGdldEVsZW0gPSBudWxsO1xuXG4gICAgICAgIC8vIGxldHMgZGVzdHJveSB0aGUgd2lkZ2V0cydzIHNjb3BlXG4gICAgICAgIHZhciB3aWRnZXREYXRhID0gd2lkZ2V0TWFwW3dpZGdldC5pZF07XG4gICAgICAgIGlmICh3aWRnZXREYXRhKSB7XG4gICAgICAgICAgZGVsZXRlIHdpZGdldE1hcFt3aWRnZXQuaWRdO1xuICAgICAgICAgIHdpZGdldEVsZW0gPSB3aWRnZXREYXRhLndpZGdldDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXdpZGdldEVsZW0pIHtcbiAgICAgICAgICAvLyBsZXRzIGdldCB0aGUgbGkgcGFyZW50IGVsZW1lbnQgb2YgdGhlIHRlbXBsYXRlXG4gICAgICAgICAgd2lkZ2V0RWxlbSA9ICRlbGVtZW50LmZpbmQoXCJbZGF0YS13aWRnZXRJZD0nXCIgKyB3aWRnZXQuaWQgKyBcIiddXCIpLnBhcmVudCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChncmlkc3RlciAmJiB3aWRnZXRFbGVtKSB7XG4gICAgICAgICAgZ3JpZHN0ZXIucmVtb3ZlX3dpZGdldCh3aWRnZXRFbGVtKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBsZXRzIHRyYXNoIHRoZSBKU09OIG1ldGFkYXRhXG4gICAgICAgIGlmICgkc2NvcGUuZGFzaGJvYXJkKSB7XG4gICAgICAgICAgdmFyIHdpZGdldHMgPSAkc2NvcGUuZGFzaGJvYXJkLndpZGdldHM7XG4gICAgICAgICAgaWYgKHdpZGdldHMpIHtcbiAgICAgICAgICAgIHdpZGdldHMucmVtb3ZlKHdpZGdldCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIlJlbW92ZWQgd2lkZ2V0IFwiICsgd2lkZ2V0LnRpdGxlKTtcbiAgICAgIH07XG5cbiAgICAgIGZ1bmN0aW9uIGNoYW5nZVdpZGdldFNpemUod2lkZ2V0LCBzaXplZnVuYywgc2F2ZWZ1bmMpIHtcbiAgICAgICAgaWYgKCF3aWRnZXQpIHtcbiAgICAgICAgICBsb2cuZGVidWcoXCJ3aWRnZXQgdW5kZWZpbmVkXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZ3JpZHN0ZXIgPSBnZXRHcmlkc3RlcigpO1xuICAgICAgICBsb2cuZGVidWcoXCJXaWRnZXQgSUQ6IFwiLCB3aWRnZXQuaWQsIFwiIHdpZGdldE1hcDogXCIsIHdpZGdldE1hcCk7XG4gICAgICAgIHZhciBlbnRyeSA9IHdpZGdldE1hcFt3aWRnZXQuaWRdO1xuICAgICAgICB2YXIgdyA9IGVudHJ5LndpZGdldDtcbiAgICAgICAgc2l6ZWZ1bmMoZW50cnkpO1xuICAgICAgICBncmlkc3Rlci5yZXNpemVfd2lkZ2V0KHcsIGVudHJ5LnNpemVfeCwgZW50cnkuc2l6ZV95KTtcbiAgICAgICAgZ3JpZHN0ZXIuc2V0X2RvbV9ncmlkX2hlaWdodCgpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICBzYXZlZnVuYyh3aWRnZXQpO1xuICAgICAgICB9LCA1MCk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG9uV2lkZ2V0UmVuYW1lZCh3aWRnZXQpIHtcbiAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIlJlbmFtZWQgd2lkZ2V0IHRvIFwiICsgd2lkZ2V0LnRpdGxlKTtcbiAgICAgIH07XG5cbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZVdpZGdldHMoKSB7XG4gICAgICAgICRzY29wZS5pZCA9ICRzY29wZS4kZXZhbCgnZGFzaGJvYXJkSWQnKSB8fCAkcm91dGVQYXJhbXNbXCJkYXNoYm9hcmRJZFwiXTtcbiAgICAgICAgJHNjb3BlLmlkeCA9ICRzY29wZS4kZXZhbCgnZGFzaGJvYXJkSW5kZXgnKSB8fCAkcm91dGVQYXJhbXNbXCJkYXNoYm9hcmRJbmRleFwiXTtcbiAgICAgICAgaWYgKCRzY29wZS5pZCkge1xuICAgICAgICAgICRzY29wZS4kZW1pdCgnbG9hZERhc2hib2FyZHMnKTtcbiAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZCgkc2NvcGUuaWQsIG9uRGFzaGJvYXJkTG9hZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXREYXNoYm9hcmRzKChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkcyk7XG5cbiAgICAgICAgICAgIHZhciBpZHggPSAkc2NvcGUuaWR4ID8gcGFyc2VJbnQoJHNjb3BlLmlkeCkgOiAwO1xuICAgICAgICAgICAgdmFyIGlkID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChkYXNoYm9hcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgdmFyIGRhc2hib2FyZCA9IGRhc2hib2FyZHMubGVuZ3RoID4gaWR4ID8gZGFzaGJvYXJkc1tpZHhdIDogZGFzaGJvYXJkWzBdO1xuICAgICAgICAgICAgICBpZCA9IGRhc2hib2FyZC5pZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgkc2NvcGUuJGV2YWwoJ2Rhc2hib2FyZEVtYmVkZGVkJykpIHtcbiAgICAgICAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkKSB7XG4gICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9pZC9cIiArIGlkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9lZGl0XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBvbkRhc2hib2FyZExvYWQoZGFzaGJvYXJkKSB7XG4gICAgICAgICRzY29wZS5kYXNoYm9hcmQgPSBkYXNoYm9hcmQ7XG4gICAgICAgIHZhciB3aWRnZXRzID0gKChkYXNoYm9hcmQpID8gZGFzaGJvYXJkLndpZGdldHMgOiBudWxsKSB8fCBbXTtcblxuICAgICAgICB2YXIgbWluSGVpZ2h0ID0gMTA7XG4gICAgICAgIHZhciBtaW5XaWR0aCA9IDY7XG5cbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKHdpZGdldHMsICh3aWRnZXQpID0+IHtcbiAgICAgICAgICBpZiAoIXdpZGdldCkge1xuICAgICAgICAgICAgbG9nLmRlYnVnKFwiVW5kZWZpbmVkIHdpZGdldCwgc2tpcHBpbmdcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZCh3aWRnZXQucm93KSAmJiBtaW5IZWlnaHQgPCB3aWRnZXQucm93KSB7XG4gICAgICAgICAgICBtaW5IZWlnaHQgPSB3aWRnZXQucm93ICsgMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHdpZGdldC5zaXplX3hcbiAgICAgICAgICAgICAgJiYgYW5ndWxhci5pc0RlZmluZWQod2lkZ2V0LmNvbCkpKSB7XG4gICAgICAgICAgICB2YXIgcmlnaHRFZGdlID0gd2lkZ2V0LmNvbCArIHdpZGdldC5zaXplX3g7XG4gICAgICAgICAgICBpZiAocmlnaHRFZGdlID4gbWluV2lkdGgpIHtcbiAgICAgICAgICAgICAgbWluV2lkdGggPSByaWdodEVkZ2UgKyAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGdyaWRzdGVyID0gJGVsZW1lbnQuZ3JpZHN0ZXIoe1xuICAgICAgICAgIHdpZGdldF9tYXJnaW5zOiBbZ3JpZE1hcmdpbiwgZ3JpZE1hcmdpbl0sXG4gICAgICAgICAgd2lkZ2V0X2Jhc2VfZGltZW5zaW9uczogW2dyaWRYLCBncmlkWV0sXG4gICAgICAgICAgZXh0cmFfcm93czogbWluSGVpZ2h0LFxuICAgICAgICAgIGV4dHJhX2NvbHM6IG1pbldpZHRoLFxuICAgICAgICAgIG1heF9zaXplX3g6IG1pbldpZHRoLFxuICAgICAgICAgIG1heF9zaXplX3k6IG1pbkhlaWdodCxcbiAgICAgICAgICBkcmFnZ2FibGU6IHtcbiAgICAgICAgICAgIHN0b3A6IChldmVudCwgdWkpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHNlcmlhbGl6ZURhc2hib2FyZCgpKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIkNoYW5naW5nIGRhc2hib2FyZCBsYXlvdXRcIik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pLmRhdGEoJ2dyaWRzdGVyJyk7XG5cbiAgICAgICAgdmFyIHRlbXBsYXRlID0gJHRlbXBsYXRlQ2FjaGUuZ2V0KFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsIFwid2lkZ2V0VGVtcGxhdGUuaHRtbFwiKSk7XG4gICAgICAgIHZhciByZW1haW5pbmcgPSB3aWRnZXRzLmxlbmd0aDtcblxuICAgICAgICBmdW5jdGlvbiBtYXliZUZpbmlzaFVwKCkge1xuICAgICAgICAgIHJlbWFpbmluZyA9IHJlbWFpbmluZyAtIDE7XG4gICAgICAgICAgaWYgKHJlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgICAgbWFrZVJlc2l6YWJsZSgpO1xuICAgICAgICAgICAgZ2V0R3JpZHN0ZXIoKS5lbmFibGUoKTtcbiAgICAgICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZG9SZW1vdmVXaWRnZXQoJG1vZGFsLCB3aWRnZXQpIHtcbiAgICAgICAgICBsb2cuZGVidWcoXCJSZW1vdmUgd2lkZ2V0OiBcIiwgd2lkZ2V0KTtcbiAgICAgICAgICB2YXIgbW9kYWwgPSAkbW9kYWwub3Blbih7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ2RlbGV0ZVdpZGdldE1vZGFsLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRtb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAgICAgJHNjb3BlLndpZGdldCA9IHdpZGdldDtcbiAgICAgICAgICAgICAgJHNjb3BlLm9rID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgcmVtb3ZlV2lkZ2V0KCRzY29wZS53aWRnZXQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgbW9kYWwuZGlzbWlzcygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZG9SZW5hbWVXaWRnZXQoJG1vZGFsLCB3aWRnZXQpIHtcbiAgICAgICAgICBsb2cuZGVidWcoXCJSZW5hbWUgd2lkZ2V0OiBcIiwgd2lkZ2V0KTtcbiAgICAgICAgICB2YXIgbW9kYWwgPSAkbW9kYWwub3Blbih7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ3JlbmFtZVdpZGdldE1vZGFsLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRtb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAgICAgJHNjb3BlLndpZGdldCA9IHdpZGdldDtcbiAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZyA9IHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAndGl0bGUnOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB3aWRnZXQudGl0bGVcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICRzY29wZS5vayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBtb2RhbC5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIG9uV2lkZ2V0UmVuYW1lZCgkc2NvcGUud2lkZ2V0KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIG1vZGFsLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfV1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaCh3aWRnZXRzLCAod2lkZ2V0KSA9PiB7XG4gICAgICAgICAgdmFyIHR5cGUgPSAnaW50ZXJuYWwnO1xuICAgICAgICAgIGlmICgnaWZyYW1lJyBpbiB3aWRnZXQpIHtcbiAgICAgICAgICAgIHR5cGUgPSAnZXh0ZXJuYWwnO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2V4dGVybmFsJzpcbiAgICAgICAgICAgICAgbG9nLmRlYnVnKFwiUmVuZGVyaW5nIGV4dGVybmFsIChpZnJhbWUpIHdpZGdldDogXCIsIHdpZGdldC50aXRsZSB8fCB3aWRnZXQuaWQpO1xuICAgICAgICAgICAgICB2YXIgc2NvcGUgPSAkc2NvcGUuJG5ldygpO1xuICAgICAgICAgICAgICBzY29wZS53aWRnZXQgPSB3aWRnZXQ7XG4gICAgICAgICAgICAgIHNjb3BlLnJlbW92ZVdpZGdldCA9ICh3aWRnZXQpID0+IGRvUmVtb3ZlV2lkZ2V0KCRtb2RhbCwgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgc2NvcGUucmVuYW1lV2lkZ2V0ID0gKHdpZGdldCkgPT4gZG9SZW5hbWVXaWRnZXQoJG1vZGFsLCB3aWRnZXQpO1xuICAgICAgICAgICAgICB2YXIgd2lkZ2V0Qm9keTphbnkgPSBhbmd1bGFyLmVsZW1lbnQoJHRlbXBsYXRlQ2FjaGUuZ2V0KFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdpZnJhbWVXaWRnZXRUZW1wbGF0ZS5odG1sJykpKTtcbiAgICAgICAgICAgICAgdmFyIG91dGVyRGl2ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldChVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAnd2lkZ2V0QmxvY2tUZW1wbGF0ZS5odG1sJykpKTtcbiAgICAgICAgICAgICAgd2lkZ2V0Qm9keS5maW5kKCdpZnJhbWUnKS5hdHRyKCdzcmMnLCB3aWRnZXQuaWZyYW1lKTtcbiAgICAgICAgICAgICAgb3V0ZXJEaXYuYXBwZW5kKCRjb21waWxlKHdpZGdldEJvZHkpKHNjb3BlKSk7XG4gICAgICAgICAgICAgIHZhciB3ID0gZ3JpZHN0ZXIuYWRkX3dpZGdldChvdXRlckRpdiwgd2lkZ2V0LnNpemVfeCwgd2lkZ2V0LnNpemVfeSwgd2lkZ2V0LmNvbCwgd2lkZ2V0LnJvdyk7XG4gICAgICAgICAgICAgIHdpZGdldE1hcFt3aWRnZXQuaWRdID0ge1xuICAgICAgICAgICAgICAgIHdpZGdldDogd1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICBtYXliZUZpbmlzaFVwKCk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnaW50ZXJuYWwnOiBcbiAgICAgICAgICAgICAgbG9nLmRlYnVnKFwiUmVuZGVyaW5nIGludGVybmFsIHdpZGdldDogXCIsIHdpZGdldC50aXRsZSB8fCB3aWRnZXQuaWQpO1xuICAgICAgICAgICAgICB2YXIgcGF0aCA9IHdpZGdldC5wYXRoO1xuICAgICAgICAgICAgICB2YXIgc2VhcmNoID0gbnVsbDtcbiAgICAgICAgICAgICAgaWYgKHdpZGdldC5zZWFyY2gpIHtcbiAgICAgICAgICAgICAgICBzZWFyY2ggPSBEYXNoYm9hcmQuZGVjb2RlVVJJQ29tcG9uZW50UHJvcGVydGllcyh3aWRnZXQuc2VhcmNoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAod2lkZ2V0LnJvdXRlUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgXy5leHRlbmQoc2VhcmNoLCBhbmd1bGFyLmZyb21Kc29uKHdpZGdldC5yb3V0ZVBhcmFtcykpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHZhciBoYXNoID0gd2lkZ2V0Lmhhc2g7IC8vIFRPRE8gZGVjb2RlIG9iamVjdD9cbiAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gbmV3IFJlY3RhbmdsZUxvY2F0aW9uKCRsb2NhdGlvbiwgcGF0aCwgc2VhcmNoLCBoYXNoKTtcbiAgICAgICAgICAgICAgaWYgKCF3aWRnZXQuc2l6ZV94IHx8IHdpZGdldC5zaXplX3ggPCAxKSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0LnNpemVfeCA9IDE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKCF3aWRnZXQuc2l6ZV95IHx8IHdpZGdldC5zaXplX3kgPCAxKSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0LnNpemVfeSA9IDE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdmFyIHRtcE1vZHVsZU5hbWUgPSAnZGFzaGJvYXJkLScgKyB3aWRnZXQuaWQ7XG4gICAgICAgICAgICAgIHZhciBwbHVnaW5zID0gXy5maWx0ZXIoaGF3dGlvUGx1Z2luTG9hZGVyLmdldE1vZHVsZXMoKSwgKG1vZHVsZSkgPT4gYW5ndWxhci5pc1N0cmluZyhtb2R1bGUpKTtcbiAgICAgICAgICAgICAgdmFyIHRtcE1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKHRtcE1vZHVsZU5hbWUsIHBsdWdpbnMpO1xuXG4gICAgICAgICAgICAgIGZ1bmN0aW9uIGdldFNlcnZpY2VzKG1vZHVsZTpzdHJpbmcsIGFuc3dlcj86YW55KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFhbnN3ZXIpIHtcbiAgICAgICAgICAgICAgICAgIGFuc3dlciA9IDxhbnk+e307XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF8uZm9yRWFjaChhbmd1bGFyLm1vZHVsZShtb2R1bGUpLnJlcXVpcmVzLCAobSkgPT4gZ2V0U2VydmljZXMobSwgYW5zd2VyKSk7XG4gICAgICAgICAgICAgICAgXy5mb3JFYWNoKCg8YW55PmFuZ3VsYXIubW9kdWxlKG1vZHVsZSkpLl9pbnZva2VRdWV1ZSwgKGEpID0+IHtcbiAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGFuc3dlclthWzJdWzBdXSA9IEhhd3Rpb0NvcmUuaW5qZWN0b3IuZ2V0KGFbMl1bMF0pO1xuICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vbm90aGluZyB0byBkb1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBhbnN3ZXI7XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIHZhciBzZXJ2aWNlcyA9IHt9O1xuICAgICAgICAgICAgICBfLmZvckVhY2gocGx1Z2lucywgKHBsdWdpbjpzdHJpbmcpID0+IHBsdWdpbiA/IGdldFNlcnZpY2VzKHBsdWdpbiwgc2VydmljZXMpIDogY29uc29sZS5sb2coXCJudWxsIHBsdWdpbiBuYW1lXCIpKTtcbiAgICAgICAgICAgICAgLy9sb2cuZGVidWcoXCJzZXJ2aWNlczogXCIsIHNlcnZpY2VzKTtcblxuICAgICAgICAgICAgICB0bXBNb2R1bGUuY29uZmlnKFsnJHByb3ZpZGUnLCAoJHByb3ZpZGUpID0+IHtcbiAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IoJ0hhd3Rpb0Rhc2hib2FyZCcsIFsnJGRlbGVnYXRlJywgJyRyb290U2NvcGUnLCAoJGRlbGVnYXRlLCAkcm9vdFNjb3BlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAkZGVsZWdhdGUuaW5EYXNoYm9hcmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuICRkZWxlZ2F0ZTtcbiAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKCckbG9jYXRpb24nLCBbJyRkZWxlZ2F0ZScsICgkZGVsZWdhdGUpID0+IHtcbiAgICAgICAgICAgICAgICAgIC8vbG9nLmRlYnVnKFwiVXNpbmcgJGxvY2F0aW9uOiBcIiwgbG9jYXRpb24pO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxvY2F0aW9uO1xuICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IoJyRyb3V0ZScsIFsnJGRlbGVnYXRlJywgKCRkZWxlZ2F0ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgLy8gcmVhbGx5IGhhbmR5IGZvciBkZWJ1Z2dpbmcsIG1vc3RseSB0byB0ZWxsIGlmIGEgd2lkZ2V0J3Mgcm91dGVcbiAgICAgICAgICAgICAgICAgIC8vIGlzbid0IGFjdHVhbGx5IGF2YWlsYWJsZSBpbiB0aGUgY2hpbGQgYXBwXG4gICAgICAgICAgICAgICAgICAvL2xvZy5kZWJ1ZyhcIlVzaW5nICRyb3V0ZTogXCIsICRkZWxlZ2F0ZSk7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gJGRlbGVnYXRlO1xuICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IoJyRyb3V0ZVBhcmFtcycsIFsnJGRlbGVnYXRlJywgKCRkZWxlZ2F0ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgLy9sb2cuZGVidWcoXCJVc2luZyAkcm91dGVQYXJhbXM6IFwiLCBzZWFyY2gpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlYXJjaDtcbiAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgXy5mb3JJbihzZXJ2aWNlcywgKHNlcnZpY2UsIG5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICAgIHN3aXRjaChuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJyRsb2NhdGlvbic6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJyRyb3V0ZSc6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJyRyb3V0ZVBhcmFtcyc6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ0hhd3Rpb0Rhc2hib2FyZCc6XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLy9sb2cuZGVidWcoXCJuYW1lOiBcIiwgbmFtZSwgXCIgc2VydmljZTogXCIsIHNlcnZpY2UpO1xuICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKG5hbWUsIFsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXR1cm5pbmcgZXhpc3Rpbmcgc2VydmljZSBmb3I6IFwiLCBuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VydmljZTtcbiAgICAgICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlnbm9yZSwgdGhpcydsbCBoYXBwZW4gZm9yIGNvbnN0YW50cyBhbmQgc3R1ZmZcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICB0bXBNb2R1bGUuY29udHJvbGxlcignSGF3dGlvRGFzaGJvYXJkLlRpdGxlJywgW1wiJHNjb3BlXCIsIFwiJG1vZGFsXCIsICgkc2NvcGUsICRtb2RhbCkgPT4ge1xuICAgICAgICAgICAgICAgICRzY29wZS53aWRnZXQgPSB3aWRnZXQ7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnJlbW92ZVdpZGdldCA9ICh3aWRnZXQpID0+IGRvUmVtb3ZlV2lkZ2V0KCRtb2RhbCwgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgICAkc2NvcGUucmVuYW1lV2lkZ2V0ID0gKHdpZGdldCkgPT4gZG9SZW5hbWVXaWRnZXQoJG1vZGFsLCB3aWRnZXQpO1xuICAgICAgICAgICAgICB9XSk7XG5cbiAgICAgICAgICAgICAgdmFyIGRpdjphbnkgPSAkKHRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgZGl2LmF0dHIoeyAnZGF0YS13aWRnZXRJZCc6IHdpZGdldC5pZCB9KTtcbiAgICAgICAgICAgICAgdmFyIGJvZHkgPSBkaXYuZmluZCgnLndpZGdldC1ib2R5Jyk7XG4gICAgICAgICAgICAgIGxvZy5kZWJ1ZyhcImluY2x1ZGU6IFwiLCB3aWRnZXQuaW5jbHVkZSk7XG4gICAgICAgICAgICAgIHZhciB3aWRnZXRCb2R5ID0gJHRlbXBsYXRlQ2FjaGUuZ2V0KHdpZGdldC5pbmNsdWRlKTtcbiAgICAgICAgICAgICAgJHRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHZhciBvdXRlckRpdiA9IGFuZ3VsYXIuZWxlbWVudCgkdGVtcGxhdGVDYWNoZS5nZXQoVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ3dpZGdldEJsb2NrVGVtcGxhdGUuaHRtbCcpKSk7XG4gICAgICAgICAgICAgICAgYm9keS5odG1sKHdpZGdldEJvZHkpO1xuICAgICAgICAgICAgICAgIG91dGVyRGl2Lmh0bWwoZGl2KTtcbiAgICAgICAgICAgICAgICBhbmd1bGFyLmJvb3RzdHJhcChkaXYsIFt0bXBNb2R1bGVOYW1lXSk7XG4gICAgICAgICAgICAgICAgd2lkZ2V0TWFwW3dpZGdldC5pZF0gPSB7XG4gICAgICAgICAgICAgICAgICB3aWRnZXQ6IGdyaWRzdGVyLmFkZF93aWRnZXQob3V0ZXJEaXYsIHdpZGdldC5zaXplX3gsIHdpZGdldC5zaXplX3ksIHdpZGdldC5jb2wsIHdpZGdldC5yb3cpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBtYXliZUZpbmlzaFVwKCk7XG4gICAgICAgICAgICAgIH0sIDUwKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gc2VyaWFsaXplRGFzaGJvYXJkKCkge1xuICAgICAgICB2YXIgZ3JpZHN0ZXIgPSBnZXRHcmlkc3RlcigpO1xuICAgICAgICBpZiAoZ3JpZHN0ZXIpIHtcbiAgICAgICAgICB2YXIgZGF0YSA9IGdyaWRzdGVyLnNlcmlhbGl6ZSgpO1xuICAgICAgICAgIC8vY29uc29sZS5sb2coXCJnb3QgZGF0YTogXCIgKyBKU09OLnN0cmluZ2lmeShkYXRhKSk7XG5cbiAgICAgICAgICB2YXIgd2lkZ2V0cyA9ICRzY29wZS5kYXNoYm9hcmQud2lkZ2V0cyB8fCBbXTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIldpZGdldHM6IFwiLCB3aWRnZXRzKTtcblxuICAgICAgICAgIC8vIGxldHMgYXNzdW1lIHRoZSBkYXRhIGlzIGluIHRoZSBvcmRlciBvZiB0aGUgd2lkZ2V0cy4uLlxuICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaCh3aWRnZXRzLCAod2lkZ2V0LCBpZHgpID0+IHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGRhdGFbaWR4XTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB3aWRnZXQpIHtcbiAgICAgICAgICAgICAgLy8gbGV0cyBjb3B5IHRoZSB2YWx1ZXMgYWNyb3NzXG4gICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaCh2YWx1ZSwgKGF0dHIsIGtleSkgPT4gd2lkZ2V0W2tleV0gPSBhdHRyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG1ha2VSZXNpemFibGUoKSB7XG4gICAgICAgIHZhciBibG9ja3M6YW55ID0gJCgnLmdyaWQtYmxvY2snKTtcbiAgICAgICAgYmxvY2tzLnJlc2l6YWJsZSgnZGVzdHJveScpO1xuXG4gICAgICAgIGJsb2Nrcy5yZXNpemFibGUoe1xuICAgICAgICAgIGdyaWQ6IFtncmlkU2l6ZSArIChncmlkTWFyZ2luICogMiksIGdyaWRTaXplICsgKGdyaWRNYXJnaW4gKiAyKV0sXG4gICAgICAgICAgYW5pbWF0ZTogZmFsc2UsXG4gICAgICAgICAgbWluV2lkdGg6IGdyaWRTaXplLFxuICAgICAgICAgIG1pbkhlaWdodDogZ3JpZFNpemUsXG4gICAgICAgICAgYXV0b0hpZGU6IGZhbHNlLFxuICAgICAgICAgIHN0YXJ0OiBmdW5jdGlvbihldmVudCwgdWkpIHtcbiAgICAgICAgICAgIGdyaWRIZWlnaHQgPSBnZXRHcmlkc3RlcigpLiRlbC5oZWlnaHQoKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlc2l6ZTogZnVuY3Rpb24oZXZlbnQsIHVpKSB7XG4gICAgICAgICAgICAvL3NldCBuZXcgZ3JpZCBoZWlnaHQgYWxvbmcgdGhlIGRyYWdnaW5nIHBlcmlvZFxuICAgICAgICAgICAgdmFyIGcgPSBnZXRHcmlkc3RlcigpO1xuICAgICAgICAgICAgdmFyIGRlbHRhID0gZ3JpZFNpemUgKyBncmlkTWFyZ2luICogMjtcbiAgICAgICAgICAgIGlmIChldmVudC5vZmZzZXRZID4gZy4kZWwuaGVpZ2h0KCkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHZhciBleHRyYSA9IE1hdGguZmxvb3IoKGV2ZW50Lm9mZnNldFkgLSBncmlkSGVpZ2h0KSAvIGRlbHRhICsgMSk7XG4gICAgICAgICAgICAgIHZhciBuZXdIZWlnaHQgPSBncmlkSGVpZ2h0ICsgZXh0cmEgKiBkZWx0YTtcbiAgICAgICAgICAgICAgZy4kZWwuY3NzKCdoZWlnaHQnLCBuZXdIZWlnaHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgc3RvcDogZnVuY3Rpb24oZXZlbnQsIHVpKSB7XG4gICAgICAgICAgICB2YXIgcmVzaXplZCA9ICQodGhpcyk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXNpemVCbG9jayhyZXNpemVkKTtcbiAgICAgICAgICAgIH0sIDMwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAkKCcudWktcmVzaXphYmxlLWhhbmRsZScpLmhvdmVyKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGdldEdyaWRzdGVyKCkuZGlzYWJsZSgpO1xuICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBnZXRHcmlkc3RlcigpLmVuYWJsZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgfVxuXG5cbiAgICAgIGZ1bmN0aW9uIHJlc2l6ZUJsb2NrKGVsbU9iaikge1xuICAgICAgICB2YXIgYXJlYSA9IGVsbU9iai5maW5kKCcud2lkZ2V0LWFyZWEnKTtcbiAgICAgICAgdmFyIHcgPSBlbG1PYmoud2lkdGgoKSAtIGdyaWRTaXplO1xuICAgICAgICB2YXIgaCA9IGVsbU9iai5oZWlnaHQoKSAtIGdyaWRTaXplO1xuXG4gICAgICAgIGZvciAodmFyIGdyaWRfdyA9IDE7IHcgPiAwOyB3IC09IChncmlkU2l6ZSArIChncmlkTWFyZ2luICogMikpKSB7XG4gICAgICAgICAgZ3JpZF93Kys7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBncmlkX2ggPSAxOyBoID4gMDsgaCAtPSAoZ3JpZFNpemUgKyAoZ3JpZE1hcmdpbiAqIDIpKSkge1xuICAgICAgICAgIGdyaWRfaCsrO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHdpZGdldCA9IHtcbiAgICAgICAgICBpZDogYXJlYS5hdHRyKCdkYXRhLXdpZGdldElkJylcbiAgICAgICAgfTtcblxuICAgICAgICBjaGFuZ2VXaWRnZXRTaXplKHdpZGdldCwgZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgICAgICAgd2lkZ2V0LnNpemVfeCA9IGdyaWRfdztcbiAgICAgICAgICB3aWRnZXQuc2l6ZV95ID0gZ3JpZF9oO1xuICAgICAgICB9LCBmdW5jdGlvbih3aWRnZXQpIHtcbiAgICAgICAgICBpZiAoc2VyaWFsaXplRGFzaGJvYXJkKCkpIHtcbiAgICAgICAgICAgIHVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkoXCJDaGFuZ2VkIHNpemUgb2Ygd2lkZ2V0OiBcIiArIHdpZGdldC5pZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiB1cGRhdGVEYXNoYm9hcmRSZXBvc2l0b3J5KG1lc3NhZ2U6IHN0cmluZykge1xuICAgICAgICBpZiAoJHNjb3BlLmRhc2hib2FyZCkge1xuICAgICAgICAgIHZhciBjb21taXRNZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICBpZiAoJHNjb3BlLmRhc2hib2FyZCAmJiAkc2NvcGUuZGFzaGJvYXJkLnRpdGxlKSB7XG4gICAgICAgICAgICBjb21taXRNZXNzYWdlICs9IFwiIG9uIGRhc2hib2FyZCBcIiArICRzY29wZS5kYXNoYm9hcmQudGl0bGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbJHNjb3BlLmRhc2hib2FyZF0sIGNvbW1pdE1lc3NhZ2UsIERhc2hib2FyZC5vbk9wZXJhdGlvbkNvbXBsZXRlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBnZXRHcmlkc3RlcigpIHtcbiAgICAgICAgcmV0dXJuICRlbGVtZW50LmdyaWRzdGVyKCkuZGF0YSgnZ3JpZHN0ZXInKTtcbiAgICAgIH1cblxuICAgIH1dO1xuXG4gIH1cblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG4gIF9tb2R1bGUuY29udHJvbGxlcihcIkRhc2hib2FyZC5JbXBvcnRDb250cm9sbGVyXCIsIFtcIiRzY29wZVwiLCBcIiRsb2NhdGlvblwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgKCRzY29wZSwgJGxvY2F0aW9uLCAkcm91dGVQYXJhbXMsIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSkgPT4ge1xuICAgICRzY29wZS5wbGFjZWhvbGRlciA9IFwiUGFzdGUgdGhlIEpTT04gaGVyZSBmb3IgdGhlIGRhc2hib2FyZCBjb25maWd1cmF0aW9uIHRvIGltcG9ydC4uLlwiO1xuICAgICRzY29wZS5zb3VyY2UgPSAkc2NvcGUucGxhY2Vob2xkZXI7XG5cbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIG1vZGU6IHtcbiAgICAgICAgbmFtZTogXCJqYXZhc2NyaXB0XCJcbiAgICAgIH1cbiAgICB9O1xuICAgIC8vJHNjb3BlLmNvZGVNaXJyb3JPcHRpb25zID0gQ29kZUVkaXRvci5jcmVhdGVFZGl0b3JTZXR0aW5ncyhvcHRpb25zKTtcblxuXG4gICAgJHNjb3BlLmlzVmFsaWQgPSAoKSA9PiAkc2NvcGUuc291cmNlICYmICRzY29wZS5zb3VyY2UgIT09ICRzY29wZS5wbGFjZWhvbGRlcjtcblxuICAgICRzY29wZS5pbXBvcnRKU09OID0gKCkgPT4ge1xuICAgICAgdmFyIGpzb24gPSBbXTtcbiAgICAgIC8vIGxldHMgcGFyc2UgdGhlIEpTT04uLi5cbiAgICAgIHRyeSB7XG4gICAgICAgIGpzb24gPSBKU09OLnBhcnNlKCRzY29wZS5zb3VyY2UpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvL0hhd3Rpb0NvcmUubm90aWZpY2F0aW9uKFwiZXJyb3JcIiwgXCJDb3VsZCBub3QgcGFyc2UgdGhlIEpTT05cXG5cIiArIGUpO1xuICAgICAgICBqc29uID0gW107XG4gICAgICB9XG4gICAgICB2YXIgYXJyYXkgPSBbXTtcbiAgICAgIGlmIChhbmd1bGFyLmlzQXJyYXkoanNvbikpIHtcbiAgICAgICAgYXJyYXkgPSBqc29uO1xuICAgICAgfSBlbHNlIGlmIChhbmd1bGFyLmlzT2JqZWN0KGpzb24pKSB7XG4gICAgICAgIGFycmF5LnB1c2goanNvbik7XG4gICAgICB9XG5cbiAgICAgIGlmIChhcnJheS5sZW5ndGgpIHtcbiAgICAgICAgLy8gbGV0cyBlbnN1cmUgd2UgaGF2ZSBzb21lIHZhbGlkIGlkcyBhbmQgc3R1ZmYuLi5cbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKGFycmF5LCAoZGFzaCwgaW5kZXgpID0+IHtcbiAgICAgICAgICBhbmd1bGFyLmNvcHkoZGFzaCwgZGFzaGJvYXJkUmVwb3NpdG9yeS5jcmVhdGVEYXNoYm9hcmQoZGFzaCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKGFycmF5LCBcIkltcG9ydGVkIGRhc2hib2FyZCBKU09OXCIsIERhc2hib2FyZC5vbk9wZXJhdGlvbkNvbXBsZXRlKTtcbiAgICAgICAgJGxvY2F0aW9uLnBhdGgoXCIvZGFzaGJvYXJkL2VkaXRcIik7XG4gICAgICB9XG4gICAgfVxuICB9XSk7XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcbiAgX21vZHVsZS5jb250cm9sbGVyKFwiRGFzaGJvYXJkLk5hdkJhckNvbnRyb2xsZXJcIiwgW1wiJHNjb3BlXCIsIFwiJHJvdXRlUGFyYW1zXCIsIFwiJHJvb3RTY29wZVwiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgKCRzY29wZSwgJHJvdXRlUGFyYW1zLCAkcm9vdFNjb3BlLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnkpID0+IHtcblxuICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IFtdO1xuXG4gICAgJHNjb3BlLmFjdGl2ZURhc2hib2FyZCA9ICRyb3V0ZVBhcmFtc1snZGFzaGJvYXJkSWQnXTtcblxuICAgICRzY29wZS4kb24oJ2xvYWREYXNoYm9hcmRzJywgbG9hZERhc2hib2FyZHMpO1xuXG4gICAgJHNjb3BlLiRvbignZGFzaGJvYXJkc1VwZGF0ZWQnLCBkYXNoYm9hcmRMb2FkZWQpO1xuXG4gICAgJHNjb3BlLmRhc2hib2FyZHMgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gJHNjb3BlLl9kYXNoYm9hcmRzXG4gICAgfTtcblxuICAgICRzY29wZS5vblRhYlJlbmFtZWQgPSBmdW5jdGlvbihkYXNoKSB7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoW2Rhc2hdLCBcIlJlbmFtZWQgZGFzaGJvYXJkXCIsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBkYXNoYm9hcmRMb2FkZWQoZXZlbnQsIGRhc2hib2FyZHMpIHtcbiAgICAgIGxvZy5kZWJ1ZyhcIm5hdmJhciBkYXNoYm9hcmRMb2FkZWQ6IFwiLCBkYXNoYm9hcmRzKTtcbiAgICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IGRhc2hib2FyZHM7XG4gICAgICBpZiAoZXZlbnQgPT09IG51bGwpIHtcbiAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdkYXNoYm9hcmRzVXBkYXRlZCcsIGRhc2hib2FyZHMpO1xuICAgICAgICBDb3JlLiRhcHBseSgkc2NvcGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvYWREYXNoYm9hcmRzKGV2ZW50KSB7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZHMoKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgLy8gcHJldmVudCB0aGUgYnJvYWRjYXN0IGZyb20gaGFwcGVuaW5nLi4uXG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfV0pO1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG4gIGV4cG9ydCB2YXIgU2hhcmVDb250cm9sbGVyID0gX21vZHVsZS5jb250cm9sbGVyKFwiRGFzaGJvYXJkLlNoYXJlQ29udHJvbGxlclwiLCBbXCIkc2NvcGVcIiwgXCIkbG9jYXRpb25cIiwgXCIkcm91dGVQYXJhbXNcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsICgkc2NvcGUsICRsb2NhdGlvbiwgJHJvdXRlUGFyYW1zLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnkpID0+IHtcbiAgICB2YXIgaWQgPSAkcm91dGVQYXJhbXNbXCJkYXNoYm9hcmRJZFwiXTtcbiAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZChpZCwgb25EYXNoYm9hcmRMb2FkKTtcblxuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgbW9kZToge1xuICAgICAgICAgIG5hbWU6IFwiamF2YXNjcmlwdFwiXG4gICAgICB9XG4gICAgfTtcbiAgICAvLyRzY29wZS5jb2RlTWlycm9yT3B0aW9ucyA9IENvZGVFZGl0b3IuY3JlYXRlRWRpdG9yU2V0dGluZ3Mob3B0aW9ucyk7XG5cbiAgICBmdW5jdGlvbiBvbkRhc2hib2FyZExvYWQoZGFzaGJvYXJkKSB7XG4gICAgICAkc2NvcGUuZGFzaGJvYXJkID0gRGFzaGJvYXJkLmNsZWFuRGFzaGJvYXJkRGF0YShkYXNoYm9hcmQpO1xuXG4gICAgICAkc2NvcGUuanNvbiA9IHtcbiAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcImhhd3RpbyBkYXNoYm9hcmRzXCIsXG4gICAgICAgIFwicHVibGljXCI6IHRydWUsXG4gICAgICAgIFwiZmlsZXNcIjoge1xuICAgICAgICAgIFwiZGFzaGJvYXJkcy5qc29uXCI6IHtcbiAgICAgICAgICAgIFwiY29udGVudFwiOiBKU09OLnN0cmluZ2lmeSgkc2NvcGUuZGFzaGJvYXJkLCBudWxsLCBcIiAgXCIpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuc291cmNlID0gSlNPTi5zdHJpbmdpZnkoJHNjb3BlLmRhc2hib2FyZCwgbnVsbCwgXCIgIFwiKTtcbiAgICAgIENvcmUuJGFwcGx5Tm93T3JMYXRlcigkc2NvcGUpO1xuICAgIH1cbiAgfV0pO1xufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

angular.module("hawtio-dashboard-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("plugins/dashboard/html/addToDashboard.html","<div class=\"controller-section\" ng-controller=\"Dashboard.EditDashboardsController\">\n  <div class=\"row-fluid\">\n    <div class=\"span10 offset1 well\">\n      Select a dashboard (or multiple dashboards) in the table below and click \"Add View To Dashboard\" to add the view to a dashboard.  You can also create a new dashboard using the \"Create\" button, select it and then click the \"Add View To Dashboard\" to add the view to a new dashboard.\n    </div>\n  </div>\n  <div class=\"row-fluid\">\n\n    <div class=\"span12\">\n      <ul class=\"nav nav-tabs\">\n        <li>\n          <button class=\"btn btn-primary\" \n                  ng-disabled=\"!hasSelection()\" ng-click=\"addViewToDashboard()\"\n                  title=\"Adds the current view to the selected dashboard(s)\" data-placement=\"bottom\">\n            <i class=\"fa fa-dashboard\"></i> Add View To Dashboard\n          </a>\n        </li>\n        <li>\n          <button class=\"btn btn-success\" ng-click=\"create()\"\n             title=\"Create a new empty dashboard\"\n             data-placement=\"bottom\">\n            <i class=\"fa fa-plus\"></i> Create</button>\n        </li>\n      </ul>\n\n    </div>\n    <!--\n    <div class=\"span6\">\n      <div class=\"control-group\">\n        <input type=\"text\" class=\"span12 search-query\" ng-model=\"gridOptions.filterOptions.filterText\" placeholder=\"Filter...\">\n      </div>\n    </div>\n    -->\n  </div>\n\n  <div class=\"row-fluid\">\n    <table class=\"table table-striped\" hawtio-simple-table=\"gridOptions\"></table>\n  </div>\n</div>\n");
$templateCache.put("plugins/dashboard/html/createDashboardModal.html","<div class=\"modal-header\">\n  <h3 class=\"modal-title\">Create New Dashboard</h3>\n</div>\n<div class=\"modal-body\">\n  <div hawtio-form-2=\"config\" entity=\"entity\"></div>\n</div>\n<div class=\"modal-footer\">\n  <button class=\"btn btn-primary\" ng-click=\"ok()\">OK</button>\n  <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n</div>\n");
$templateCache.put("plugins/dashboard/html/dashboard.html","<div class=\"row-fluid\">\n  <div class=\"span12 gridster\">\n    <ul id=\"widgets\" hawtio-dashboard></ul>\n  </div>\n</div>\n\n\n");
$templateCache.put("plugins/dashboard/html/deleteDashboardModal.html","<div class=\"modal-header\">\n  <h3 class=\"modal-title\">Delete Dashboards?</h3>\n</div>\n<div class=\"modal-body\">\n  <p>Are you sure you want to delete the selected dashboards:</p>\n  <ul>\n    <li ng-repeat=\"dashboard in selected track by $index\">{{dashboard.title}}</li>\n  </ul>\n  <p class=\"strong\">This operation cannot be undone</p>\n</div>\n<div class=\"modal-footer\">\n  <button class=\"btn btn-primary\" ng-click=\"ok()\">OK</button>\n  <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n</div>\n");
$templateCache.put("plugins/dashboard/html/deleteWidgetModal.html","<div class=\"modal-header\">\n  <h3 class=\"modal-title\">Delete Widget</h3>\n</div>\n<div class=\"modal-body\">\n  <p>Are you sure you want to delete the widget <span ng-show=\"widget.title\">\"{{widget.title}}\"</span>?</p>\n  <p class=\"strong\">This operation cannot be undone</p>\n</div>\n<div class=\"modal-footer\">\n  <button class=\"btn btn-primary\" ng-click=\"ok()\">OK</button>\n  <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n</div>\n");
$templateCache.put("plugins/dashboard/html/editDashboardTitleCell.html","<div class=\"ngCellText\"><a href=\"/dashboard/id/{{row.entity.id}}{{row.entity.hash}}\">{{row.entity.title}}</a></div>\n");
$templateCache.put("plugins/dashboard/html/editDashboards.html","<div ng-controller=\"Dashboard.EditDashboardsController\">\n  <div class=\"row\">\n    <div class=\"col-md-12\">\n      <p></p>\n      <ul class=\"nav nav-tabs\">\n        <li>\n          <button class=\"btn btn-success\" ng-click=\"create()\"\n             title=\"Create a new empty dashboard\"\n             data-placement=\"bottom\">\n            <i class=\"fa fa-plus\"></i> Create</button>\n        </li>\n        <li>\n          <button class=\"btn\" ng-click=\"renameDashboard()\"\n            ng-disabled=\"gridOptions.selectedItems.length !== 1\"\n             title=\"Rename the selected dashboard\"\n             data-placement=\"bottom\">\n            <i class=\"fa fa-arrows-h\"></i> Rename</button>\n        </li>\n        <li>\n          <button class=\"btn\" ng-disabled=\"!hasSelection()\"\n             ng-click=\"duplicate()\"\n                  title=\"Create a copy of the selected dashboard(s)\" data-placement=\"bottom\">\n            <i class=\"fa fa-copy\"></i> Duplicate\n          </button>\n        </li>\n        <li>\n          <button class=\"btn btn-danger\" ng-disabled=\"!hasSelection()\"\n             ng-click=\"deleteDashboard()\">\n             <i class=\"fa fa-remove\"></i> Delete\n          </button>\n        </li>\n        <!--\n        <li class=\"pull-right\">\n          <button class=\"btn btn-primary\" href=\"#/dashboard/import\"\n             title=\"Imports a JSON dashboard configuration from github or some other URL\"\n             data-placement=\"bottom\">\n            <i class=\"fa fa-cloud-download\"></i> Import\n          </button>\n        </li>\n        -->\n      </ul>\n    </div>\n  </div>\n\n  <div class=\"row\">\n    <div class=\"col-md-12\">\n      <p></p>\n      <table class=\"table table-striped\" hawtio-simple-table=\"gridOptions\"></table>\n    </div>\n  </div>\n\n</div>\n");
$templateCache.put("plugins/dashboard/html/iframeWidgetTemplate.html","<div class=\"widget-area\" data-widgetId=\"{{widget.id}}\">\n  <div class=\"widget-title\">\n    <div class=\"row-fluid\">\n      <div class=\"pull-left\">\n        {{widget.title}}\n      </div>\n      <div class=\"pull-right\">\n        <i class=\"fa fa-pencil\" title=\"Rename this widget\" ng-click=\"renameWidget(widget)\"></i>\n        <i class=\"fa fa-times\" title=\"Removes this view from the dashboard\" ng-click=\"removeWidget(widget)\"></i>\n      </div>\n    </div>\n  </div>\n  <div class=\"widget-body\">\n    <div class=\"iframe-holder\">\n      <iframe seamless=\"true\"></iframe>\n    </div>\n  </div>\n</div>\n");
$templateCache.put("plugins/dashboard/html/import.html","<div class=\"form-horizontal\" ng-controller=\"Dashboard.ImportController\">\n  <div class=\"control-group\">\n    <button id=\"importButton\" ng-disabled=\"!isValid()\" ng-click=\"importJSON()\"\n            class=\"btn btn-info\"\n            title=\"Imports the JSON configuration of the dashboard\">\n      <i class=\"icon-cloud-download\"></i> import dashboard JSON\n    </button>\n    <div id=\"alert-area\" class=\"span9 pull-right\"></div>\n  </div>\n  <div class=\"control-group\">\n    <textarea id=\"source\" ui-codemirror=\"codeMirrorOptions\" ng-model=\"source\"></textarea>\n  </div>\n</div>");
$templateCache.put("plugins/dashboard/html/renameDashboardModal.html","<div class=\"modal-header\">\n  <h3 class=\"modal-title\">Rename Dashboard \"{{selected.title}}\"</h3>\n</div>\n<div class=\"modal-body\">\n  <div hawtio-form-2=\"config\" entity=\"selected\"></div>\n</div>\n<div class=\"modal-footer\">\n  <button class=\"btn btn-primary\" ng-click=\"ok()\">OK</button>\n  <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n</div>\n");
$templateCache.put("plugins/dashboard/html/renameWidgetModal.html","<div class=\"modal-header\">\n  <h3 class=\"modal-title\">Rename Dashboard</h3>\n</div>\n<div class=\"modal-body\">\n  <div hawtio-form-2=\"config\" entity=\"widget\"></div>\n</div>\n<div class=\"modal-footer\">\n  <button class=\"btn btn-primary\" ng-click=\"ok()\">OK</button>\n  <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n</div>\n");
$templateCache.put("plugins/dashboard/html/widgetBlockTemplate.html","<li class=\"grid-block\" style=\"display: list-item; position: absolute\" ng-non-bindable data-$injector=\"\"></li>\n");
$templateCache.put("plugins/dashboard/html/widgetTemplate.html","  <div class=\"widget-area\">\n    <div class=\"widget-title\" ng-controller=\"HawtioDashboard.Title\">\n      <div class=\"row-fluid\">\n        <div class=\"pull-left\">\n          {{widget.title}}\n        </div>\n        <div class=\"pull-right\">\n          <i class=\"fa fa-pencil\" title=\"Rename this widget\" ng-click=\"renameWidget(widget)\"></i>\n          <i class=\"fa fa-times\" title=\"Removes this view from the dashboard\" ng-click=\"removeWidget(widget)\"></i>\n        </div>\n      </div>\n    </div>\n    <div class=\"widget-body\">\n    </div>\n  </div>\n");}]); hawtioPluginLoader.addModule("hawtio-dashboard-templates");