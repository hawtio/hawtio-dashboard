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
    Dashboard.templatePath = 'plugins/dashboard/html/';
    Dashboard.pluginName = 'dashboard';
    Dashboard.log = Logger.get('hawtio-dashboard');
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
    function setSubTabs(tab, builder, dashboards, $rootScope) {
        if (!tab || tab.embedded) {
            return;
        }
        Dashboard.log.debug("Updating sub-tabs");
        if (!tab.tabs) {
            tab.tabs = [];
        }
        else {
            tab.tabs.length = 0;
        }
        Dashboard.log.debug("tab: ", tab);
        Dashboard.log.debug("dashboards: ", dashboards);
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
        Dashboard.log.debug("Updated main tab to: ", tab);
        $rootScope.$broadcast('hawtio-nav-subtab-redraw');
        Core.$apply($rootScope);
    }
    Dashboard.setSubTabs = setSubTabs;
    function getDummyBuilder() {
        var self = {
            id: function () { return self; },
            defaultPage: function () { return self; },
            rank: function () { return self; },
            reload: function () { return self; },
            page: function () { return self; },
            title: function () { return self; },
            tooltip: function () { return self; },
            context: function () { return self; },
            attributes: function () { return self; },
            linkAttributes: function () { return self; },
            href: function () { return self; },
            click: function () { return self; },
            isValid: function () { return self; },
            show: function () { return self; },
            isSelected: function () { return self; },
            template: function () { return self; },
            tabs: function () { return self; },
            subPath: function () { return self; },
            build: function () { }
        };
        return self;
    }
    Dashboard.getDummyBuilder = getDummyBuilder;
    function getDummyBuilderFactory() {
        return {
            create: function () { return getDummyBuilder(); },
            join: function () { return ''; },
            configureRouting: function () { }
        };
    }
    Dashboard.getDummyBuilderFactory = getDummyBuilderFactory;
    function getDummyHawtioNav() {
        var nav = {
            builder: function () { return getDummyBuilder(); },
            add: function () { },
            remove: function () { return []; },
            iterate: function () { return null; },
            on: function () { return undefined; },
            selected: function () { return undefined; }
        };
        return nav;
    }
    Dashboard.getDummyHawtioNav = getDummyHawtioNav;
})(Dashboard || (Dashboard = {}));

var Dashboard;
(function (Dashboard) {
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
                            query.href = URI.encodeReserved(widgetUri.toString());
                            if (title) {
                                query.title = URI.encodeReserved(title);
                            }
                            if (size_x && size_y) {
                                query.size = URI.encodeReserved(angular.toJson({ size_x: size_x, size_y: size_y }));
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
    Dashboard._module.factory('HawtioDashboardTab', ['HawtioNav', 'HawtioDashboard', '$timeout', '$rootScope', 'dashboardRepository', '$location', function (nav, dash, $timeout, $rootScope, dashboards, $location) {
            var tab = {
                embedded: true
            };
            if (dash.inDashboard) {
                Dashboard.log.debug("Embedded in a dashboard, not initializing our navigation tab");
                return tab;
            }
            var builder = nav.builder();
            tab = builder.id(Dashboard.pluginName)
                .href(function () { return '/dashboard/idx/0'; })
                .isSelected(function () {
                return _.startsWith($location.path(), '/dashboard/');
            })
                .title(function () { return 'Dashboard'; })
                .build();
            nav.add(tab);
            setTimeout(function () {
                Dashboard.log.debug("Setting up dashboard sub-tabs");
                dashboards.getDashboards(function (dashboards) {
                    Dashboard.setSubTabs(tab, builder, dashboards, $rootScope);
                });
            }, 500);
            Dashboard.log.debug("Not embedded in a dashboard, returning proper tab");
            return tab;
        }]);
    Dashboard._module.run(["HawtioDashboardTab", function (HawtioDashboardTab) {
            Dashboard.log.debug("running");
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
            var newDashboard = _.clone(dashboard);
            newDashboard['id'] = Core.getUUID();
            newDashboard['title'] = "Copy of " + dashboard.title;
            return newDashboard;
        };
        LocalDashboardRepository.prototype.getType = function () {
            return 'container';
        };
        return LocalDashboardRepository;
    }());
    Dashboard.LocalDashboardRepository = LocalDashboardRepository;
})(Dashboard || (Dashboard = {}));

var Dashboard;
(function (Dashboard) {
    Dashboard._module.controller("Dashboard.EditDashboardsController", ["$scope", "$routeParams", "$route", "$location", "$rootScope", "dashboardRepository", "HawtioNav", "$timeout", "$templateCache", "$modal", "HawtioDashboardTab", function ($scope, $routeParams, $route, $location, $rootScope, dashboardRepository, nav, $timeout, $templateCache, $modal, tab) {
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
                    href = URI.decode(href);
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
                                    Dashboard.setSubTabs(tab, nav.builder(), dashboards, $rootScope);
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
                    Dashboard.setSubTabs(tab, nav.builder(), dashboards, $rootScope);
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
                                        Dashboard.setSubTabs(tab, nav.builder(), dashboards, $rootScope);
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
                                        Dashboard.setSubTabs(tab, nav.builder(), dashboards, $rootScope);
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
    }());
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
            this.controller = ["$scope", "$element", "$attrs", "$location", "$routeParams", "$templateCache", "dashboardRepository", "$compile", "$templateRequest", "$interpolate", "$modal", "$sce", "$timeout", function ($scope, $element, $attrs, $location, $routeParams, $templateCache, dashboardRepository, $compile, $templateRequest, $interpolate, $modal, $sce, $timeout) {
                    var gridSize = 150;
                    var gridMargin = 6;
                    var gridHeight;
                    var gridX = gridSize;
                    var gridY = gridSize;
                    var widgetMap = {};
                    var dashboardRepository = $scope.$eval('dashboardRepository') || dashboardRepository;
                    $scope.$on('$destroy', function () {
                        angular.forEach(widgetMap, function (widget, key) {
                            if ('scope' in widget) {
                                var scope = widget['scope'];
                                scope.$destroy();
                            }
                            destroyWidget(widget);
                        });
                    });
                    $element.on('$destroy', function () {
                        $scope.$destroy();
                    });
                    setTimeout(updateWidgets, 10);
                    function destroyWidget(widget) {
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
                            try {
                                gridster.remove_widget(widgetElem);
                            }
                            catch (err) {
                            }
                        }
                        if (widgetElem) {
                            Dashboard.log.debug("Removing widget: ", widget.id);
                            widgetElem.remove();
                        }
                    }
                    function removeWidget(widget) {
                        destroyWidget(widget);
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
                                                        break;
                                                    case 'dashboardRepository':
                                                        try {
                                                            $provide.decorator(name, [function () {
                                                                    return [];
                                                                }]);
                                                        }
                                                        catch (err) {
                                                        }
                                                        break;
                                                    case 'HawtioDashboardTab':
                                                        try {
                                                            $provide.decorator(name, [function () {
                                                                    return { embedded: true };
                                                                }]);
                                                        }
                                                        catch (err) {
                                                        }
                                                        break;
                                                    case 'BuilderFactoryProvider':
                                                        try {
                                                            $provide.decorator(name, [function () {
                                                                    return Dashboard.getDummyBuilderFactory();
                                                                }]);
                                                        }
                                                        catch (err) {
                                                        }
                                                        break;
                                                    case 'HawtioNav':
                                                        try {
                                                            $provide.decorator(name, [function () {
                                                                    return Dashboard.getDummyHawtioNav();
                                                                }]);
                                                        }
                                                        catch (err) {
                                                        }
                                                        break;
                                                    default:
                                                        if (_.startsWith(name, '$')) {
                                                            return;
                                                        }
                                                        try {
                                                            $provide.decorator(name, [function () {
                                                                    Dashboard.log.debug("Returning existing service for: ", name);
                                                                    return service;
                                                                }]);
                                                        }
                                                        catch (err) {
                                                        }
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
    }());
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluY2x1ZGVzLmpzIiwiZGFzaGJvYXJkL3RzL2Rhc2hib2FyZEludGVyZmFjZXMudHMiLCJkYXNoYm9hcmQvdHMvZGFzaGJvYXJkSGVscGVycy50cyIsImRhc2hib2FyZC90cy9kYXNoYm9hcmRQbHVnaW4udHMiLCJkYXNoYm9hcmQvdHMvZGFzaGJvYXJkUmVwb3NpdG9yeS50cyIsImRhc2hib2FyZC90cy9lZGl0RGFzaGJvYXJkcy50cyIsImRhc2hib2FyZC90cy9yZWN0YW5nbGVMb2NhdGlvbi50cyIsImRhc2hib2FyZC90cy9ncmlkc3RlckRpcmVjdGl2ZS50cyIsImRhc2hib2FyZC90cy9pbXBvcnQudHMiLCJkYXNoYm9hcmQvdHMvbmF2YmFyLnRzIiwiZGFzaGJvYXJkL3RzL3NoYXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUNxREM7O0FDakRELElBQU8sU0FBUyxDQTJJZjtBQTNJRCxXQUFPLFNBQVMsRUFBQyxDQUFDO0lBRUwsc0JBQVksR0FBRyx5QkFBeUIsQ0FBQztJQUN6QyxvQkFBVSxHQUFHLFdBQVcsQ0FBQztJQUV6QixhQUFHLEdBQWtCLE1BQU0sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQVUvRCw0QkFBbUMsSUFBSTtRQUNyQyxJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFDbkIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsVUFBQyxLQUFLLEVBQUUsR0FBRztZQUMvQixFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3RSxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQ3pCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztR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LEVBQUUsQ0FBQyxRQUFRLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxxQkFBcUIsRUFBRSxVQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFFLG1CQUF1QztZQUNuTixJQUFJLEVBQUUsR0FBRyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDckMsbUJBQW1CLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUV0RCxJQUFJLE9BQU8sR0FBRztnQkFDWixJQUFJLEVBQUU7b0JBQ0YsSUFBSSxFQUFFLFlBQVk7aUJBQ3JCO2FBQ0YsQ0FBQztZQUdGLHlCQUF5QixTQUFTO2dCQUNoQyxNQUFNLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFFM0QsTUFBTSxDQUFDLElBQUksR0FBRztvQkFDWixhQUFhLEVBQUUsbUJBQW1CO29CQUNsQyxRQUFRLEVBQUUsSUFBSTtvQkFDZCxPQUFPLEVBQUU7d0JBQ1AsaUJBQWlCLEVBQUU7NEJBQ2pCLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQzt5QkFDeEQ7cUJBQ0Y7aUJBQ0YsQ0FBQztnQkFFRixNQUFNLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzdELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNoQyxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNOLENBQUMsRUE3Qk0sU0FBUyxLQUFULFNBQVMsUUE2QmYiLCJmaWxlIjoiY29tcGlsZWQuanMiLCJzb3VyY2VzQ29udGVudCI6W251bGwsIm1vZHVsZSBEYXNoYm9hcmQge1xuXG4gIGV4cG9ydCBpbnRlcmZhY2UgRGFzaGJvYXJkU2VydmljZSB7XG4gICAgaGFzRGFzaGJvYXJkOmJvb2xlYW47XG4gICAgaW5EYXNoYm9hcmQ6Ym9vbGVhbjtcbiAgICBnZXRBZGRMaW5rKHRpdGxlPzpzdHJpbmcsIHdpZHRoPzpudW1iZXIsIGhlaWdodD86bnVtYmVyKTpzdHJpbmc7XG4gIH1cblxuICBleHBvcnQgaW50ZXJmYWNlIFNlYXJjaE1hcCB7XG4gICAgW25hbWU6IHN0cmluZ106IHN0cmluZztcbiAgfVxuXG4gIGV4cG9ydCBpbnRlcmZhY2UgRGFzaGJvYXJkV2lkZ2V0IHtcbiAgICBpZDogc3RyaW5nO1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgcm93PzogbnVtYmVyO1xuICAgIGNvbD86IG51bWJlcjtcbiAgICBzaXplX3g/OiBudW1iZXI7XG4gICAgc2l6ZV95PzogbnVtYmVyO1xuICAgIHBhdGg/OiBzdHJpbmc7XG4gICAgdXJsPzogc3RyaW5nO1xuICAgIGluY2x1ZGU/OiBzdHJpbmc7XG4gICAgc2VhcmNoPzogU2VhcmNoTWFwXG4gICAgcm91dGVQYXJhbXM/OiBzdHJpbmc7XG4gIH1cblxuICBleHBvcnQgaW50ZXJmYWNlIERhc2hib2FyZCB7XG4gICAgaWQ6IHN0cmluZztcbiAgICB0aXRsZTogc3RyaW5nO1xuICAgIGdyb3VwOiBzdHJpbmc7XG4gICAgd2lkZ2V0czogQXJyYXk8RGFzaGJvYXJkV2lkZ2V0PjtcbiAgfVxuXG4gIGV4cG9ydCBpbnRlcmZhY2UgRGVmYXVsdERhc2hib2FyZHMge1xuICAgIGFkZDogKGRhc2hiYXJkOkRhc2hib2FyZCkgPT4gdm9pZDtcbiAgICByZW1vdmU6IChpZDpzdHJpbmcpID0+IERhc2hib2FyZDtcbiAgICBnZXRBbGw6ICgpID0+IEFycmF5PERhc2hib2FyZD47XG4gIH1cblxuICAvKipcbiAgICogQmFzZSBpbnRlcmZhY2UgdGhhdCBkYXNoYm9hcmQgcmVwb3NpdG9yaWVzIG11c3QgaW1wbGVtZW50XG4gICAqXG4gICAqIEBjbGFzcyBEYXNoYm9hcmRSZXBvc2l0b3J5XG4gICAqL1xuICBleHBvcnQgaW50ZXJmYWNlIERhc2hib2FyZFJlcG9zaXRvcnkge1xuICAgIHB1dERhc2hib2FyZHM6IChhcnJheTphbnlbXSwgY29tbWl0TWVzc2FnZTpzdHJpbmcsIGZuKSA9PiBhbnk7XG4gICAgZGVsZXRlRGFzaGJvYXJkczogKGFycmF5OkFycmF5PERhc2hib2FyZD4sIGZuKSA9PiBhbnk7XG4gICAgZ2V0RGFzaGJvYXJkczogKGZuOihkYXNoYm9hcmRzOiBBcnJheTxEYXNoYm9hcmQ+KSA9PiB2b2lkKSA9PiB2b2lkO1xuICAgIGdldERhc2hib2FyZDogKGlkOnN0cmluZywgZm46IChkYXNoYm9hcmQ6IERhc2hib2FyZCkgPT4gdm9pZCkgPT4gYW55O1xuICAgIGNyZWF0ZURhc2hib2FyZDogKG9wdGlvbnM6YW55KSA9PiBhbnk7XG4gICAgY2xvbmVEYXNoYm9hcmQ6KGRhc2hib2FyZDphbnkpID0+IGFueTtcbiAgICBnZXRUeXBlOigpID0+IHN0cmluZztcbiAgfVxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vaW5jbHVkZXMudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkSW50ZXJmYWNlcy50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG4gIFxuICBleHBvcnQgdmFyIHRlbXBsYXRlUGF0aCA9ICdwbHVnaW5zL2Rhc2hib2FyZC9odG1sLyc7XG4gIGV4cG9ydCB2YXIgcGx1Z2luTmFtZSA9ICdkYXNoYm9hcmQnO1xuXG4gIGV4cG9ydCB2YXIgbG9nOkxvZ2dpbmcuTG9nZ2VyID0gTG9nZ2VyLmdldCgnaGF3dGlvLWRhc2hib2FyZCcpO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjbGVhbmVkIHVwIHZlcnNpb24gb2YgdGhlIGRhc2hib2FyZCBkYXRhIHdpdGhvdXQgYW55IFVJIHNlbGVjdGlvbiBzdGF0ZVxuICAgKiBAbWV0aG9kIGNsZWFuRGFzaGJvYXJkRGF0YVxuICAgKiBAc3RhdGljXG4gICAqIEBmb3IgRGFzaGJvYXJkXG4gICAqIEBwYXJhbSB7YW55fSBpdGVtXG4gICAqIEByZXR1cm4ge2FueX1cbiAgICovXG4gIGV4cG9ydCBmdW5jdGlvbiBjbGVhbkRhc2hib2FyZERhdGEoaXRlbSkge1xuICAgIHZhciBjbGVhbkl0ZW0gPSB7fTtcbiAgICBhbmd1bGFyLmZvckVhY2goaXRlbSwgKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgIGlmICghYW5ndWxhci5pc1N0cmluZyhrZXkpIHx8ICgha2V5LnN0YXJ0c1dpdGgoXCIkXCIpICYmICFrZXkuc3RhcnRzV2l0aChcIl9cIikpKSB7XG4gICAgICAgIGNsZWFuSXRlbVtrZXldID0gdmFsdWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGNsZWFuSXRlbTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIGRlY29kZVVSSUNvbXBvbmVudCgpIG9uIGVhY2ggdmFsdWUgaW4gdGhlIG9iamVjdFxuICAgKiBAbWV0aG9kIGRlY29kZVVSSUNvbXBvbmVudFByb3BlcnRpZXNcbiAgICogQHN0YXRpY1xuICAgKiBAZm9yIERhc2hib2FyZFxuICAgKiBAcGFyYW0ge2FueX0gaGFzaFxuICAgKiBAcmV0dXJuIHthbnl9XG4gICAqL1xuICBleHBvcnQgZnVuY3Rpb24gZGVjb2RlVVJJQ29tcG9uZW50UHJvcGVydGllcyhoYXNoKSB7XG4gICAgaWYgKCFoYXNoKSB7XG4gICAgICByZXR1cm4gaGFzaDtcbiAgICB9XG4gICAgdmFyIGRlY29kZUhhc2ggPSB7fTtcbiAgICBhbmd1bGFyLmZvckVhY2goaGFzaCwgKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgIGRlY29kZUhhc2hba2V5XSA9IHZhbHVlID8gZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKSA6IHZhbHVlO1xuICAgIH0pO1xuICAgIHJldHVybiBkZWNvZGVIYXNoO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIG9uT3BlcmF0aW9uQ29tcGxldGUocmVzdWx0KSB7XG4gICAgY29uc29sZS5sb2coXCJDb21wbGV0ZWQgYWRkaW5nIHRoZSBkYXNoYm9hcmQgd2l0aCByZXNwb25zZSBcIiArIEpTT04uc3RyaW5naWZ5KHJlc3VsdCkpO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIHNldFN1YlRhYnModGFiOmFueSwgYnVpbGRlciwgZGFzaGJvYXJkczpBcnJheTxEYXNoYm9hcmQ+LCAkcm9vdFNjb3BlKSB7XG4gICAgaWYgKCF0YWIgfHwgdGFiLmVtYmVkZGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfSBcbiAgICBsb2cuZGVidWcoXCJVcGRhdGluZyBzdWItdGFic1wiKTtcbiAgICBpZiAoIXRhYi50YWJzKSB7XG4gICAgICB0YWIudGFicyA9IFtdO1xuICAgIH0gZWxzZSB7XG4gICAgICB0YWIudGFicy5sZW5ndGggPSAwO1xuICAgIH1cbiAgICBsb2cuZGVidWcoXCJ0YWI6IFwiLCB0YWIpO1xuICAgIGxvZy5kZWJ1ZyhcImRhc2hib2FyZHM6IFwiLCBkYXNoYm9hcmRzKTtcbiAgICBfLmZvckVhY2goZGFzaGJvYXJkcywgKGRhc2hib2FyZCkgPT4ge1xuICAgICAgdmFyIGNoaWxkID0gYnVpbGRlclxuICAgICAgICAuaWQoJ2Rhc2hib2FyZC0nICsgZGFzaGJvYXJkLmlkKVxuICAgICAgICAudGl0bGUoKCkgPT4gZGFzaGJvYXJkLnRpdGxlIHx8IGRhc2hib2FyZC5pZClcbiAgICAgICAgLmhyZWYoKCkgPT4ge1xuICAgICAgICAgIHZhciB1cmkgPSBuZXcgVVJJKFVybEhlbHBlcnMuam9pbignL2Rhc2hib2FyZC9pZCcsIGRhc2hib2FyZC5pZCkpXG4gICAgICAgICAgICB1cmkuc2VhcmNoKHtcbiAgICAgICAgICAgICAgJ21haW4tdGFiJzogcGx1Z2luTmFtZSxcbiAgICAgICAgICAgICAgJ3N1Yi10YWInOiAnZGFzaGJvYXJkLScgKyBkYXNoYm9hcmQuaWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiB1cmkudG9TdHJpbmcoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmJ1aWxkKCk7XG4gICAgICB0YWIudGFicy5wdXNoKGNoaWxkKTtcbiAgICB9KTtcbiAgICB2YXIgbWFuYWdlID0gYnVpbGRlclxuICAgICAgLmlkKCdkYXNoYm9hcmQtbWFuYWdlJylcbiAgICAgIC50aXRsZSgoKSA9PiAnPGkgY2xhc3M9XCJmYSBmYS1wZW5jaWxcIj48L2k+Jm5ic3A7TWFuYWdlJylcbiAgICAgIC5ocmVmKCgpID0+ICcvZGFzaGJvYXJkL2VkaXQ/bWFpbi10YWI9ZGFzaGJvYXJkJnN1Yi10YWI9ZGFzaGJvYXJkLW1hbmFnZScpXG4gICAgICAuYnVpbGQoKTtcbiAgICB0YWIudGFicy5wdXNoKG1hbmFnZSk7XG4gICAgdGFiLnRhYnMuZm9yRWFjaCgodGFiKSA9PiB7XG4gICAgICB0YWIuaXNTZWxlY3RlZCA9ICgpID0+IHtcbiAgICAgICAgdmFyIGlkID0gdGFiLmlkLnJlcGxhY2UoJ2Rhc2hib2FyZC0nLCAnJyk7XG4gICAgICAgIHZhciB1cmkgPSBuZXcgVVJJKCk7XG4gICAgICAgIHJldHVybiB1cmkucXVlcnkodHJ1ZSlbJ3N1Yi10YWInXSA9PT0gdGFiLmlkIHx8IF8uZW5kc1dpdGgodXJpLnBhdGgoKSwgaWQpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGxvZy5kZWJ1ZyhcIlVwZGF0ZWQgbWFpbiB0YWIgdG86IFwiLCB0YWIpO1xuICAgIC8vJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdoYXd0aW8tbmF2LXJlZHJhdycpO1xuICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnaGF3dGlvLW5hdi1zdWJ0YWItcmVkcmF3Jyk7XG4gICAgQ29yZS4kYXBwbHkoJHJvb3RTY29wZSk7XG4gIH1cblxuXG4gIGV4cG9ydCBmdW5jdGlvbiBnZXREdW1teUJ1aWxkZXIoKSB7XG4gICAgdmFyIHNlbGYgPSB7XG4gICAgICBpZDogKCkgPT4gc2VsZixcbiAgICAgIGRlZmF1bHRQYWdlOiAoKSA9PiBzZWxmLFxuICAgICAgcmFuazogKCkgPT4gc2VsZixcbiAgICAgIHJlbG9hZDogKCkgPT4gc2VsZixcbiAgICAgIHBhZ2U6ICgpID0+IHNlbGYsXG4gICAgICB0aXRsZTogKCkgPT4gc2VsZixcbiAgICAgIHRvb2x0aXA6ICgpID0+IHNlbGYsXG4gICAgICBjb250ZXh0OiAoKSA9PiBzZWxmLFxuICAgICAgYXR0cmlidXRlczogKCkgPT4gc2VsZixcbiAgICAgIGxpbmtBdHRyaWJ1dGVzOiAoKSA9PiBzZWxmLFxuICAgICAgaHJlZjogKCkgPT4gc2VsZixcbiAgICAgIGNsaWNrOiAoKSA9PiBzZWxmLFxuICAgICAgaXNWYWxpZDogKCkgPT4gc2VsZixcbiAgICAgIHNob3c6ICgpID0+IHNlbGYsXG4gICAgICBpc1NlbGVjdGVkOiAoKSA9PiBzZWxmLFxuICAgICAgdGVtcGxhdGU6ICgpID0+IHNlbGYsXG4gICAgICB0YWJzOiAoKSA9PiBzZWxmLFxuICAgICAgc3ViUGF0aDogKCkgPT4gc2VsZixcbiAgICAgIGJ1aWxkOiAoKSA9PiB7fVxuICAgIH1cbiAgICByZXR1cm4gc2VsZjtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBnZXREdW1teUJ1aWxkZXJGYWN0b3J5KCkge1xuICAgIHJldHVybiB7XG4gICAgICBjcmVhdGU6ICgpID0+IGdldER1bW15QnVpbGRlcigpLFxuICAgICAgam9pbjogKCkgPT4gJycsXG4gICAgICBjb25maWd1cmVSb3V0aW5nOiAoKSA9PiB7fVxuICAgIH1cbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBnZXREdW1teUhhd3Rpb05hdigpIHtcbiAgICB2YXIgbmF2ID0ge1xuICAgICAgYnVpbGRlcjogKCkgPT4gZ2V0RHVtbXlCdWlsZGVyKCksXG4gICAgICBhZGQ6ICgpID0+IHt9LFxuICAgICAgcmVtb3ZlOiAoKSA9PiBbXSxcbiAgICAgIGl0ZXJhdGU6ICgpID0+IG51bGwsXG4gICAgICBvbjogKCkgPT4gdW5kZWZpbmVkLFxuICAgICAgc2VsZWN0ZWQ6ICgpID0+IHVuZGVmaW5lZFxuICAgIH1cbiAgICByZXR1cm4gbmF2O1xuICB9XG59XG4iLCIvKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKiBAbWFpbiBEYXNoYm9hcmRcbiAqL1xuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZEhlbHBlcnMudHNcIi8+XG5tb2R1bGUgRGFzaGJvYXJkIHtcbiAgXG4gIGV4cG9ydCB2YXIgX21vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKHBsdWdpbk5hbWUsIFtdKTtcblxuICBfbW9kdWxlLmNvbmZpZyhbXCIkcm91dGVQcm92aWRlclwiLCBcIiRwcm92aWRlXCIsICgkcm91dGVQcm92aWRlciwgJHByb3ZpZGUpID0+IHtcblxuICAgICRwcm92aWRlLmRlY29yYXRvcignSGF3dGlvRGFzaGJvYXJkJywgWyckZGVsZWdhdGUnLCAoJGRlbGVnYXRlKSA9PiB7XG4gICAgICAkZGVsZWdhdGVbJ2hhc0Rhc2hib2FyZCddID0gdHJ1ZTtcbiAgICAgICRkZWxlZ2F0ZVsnZ2V0QWRkTGluayddID0gKHRpdGxlPzpzdHJpbmcsIHNpemVfeD86bnVtYmVyLCBzaXplX3k/Om51bWJlcikgPT4ge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gbmV3IFVSSSgnL2Rhc2hib2FyZC9hZGQnKTtcbiAgICAgICAgdmFyIGN1cnJlbnRVcmkgPSBuZXcgVVJJKCk7XG4gICAgICAgIC8qXG4gICAgICAgIGN1cnJlbnRVcmkucmVtb3ZlUXVlcnkoJ21haW4tdGFiJyk7XG4gICAgICAgIGN1cnJlbnRVcmkucmVtb3ZlUXVlcnkoJ3N1Yi10YWInKTtcbiAgICAgICAgKi9cbiAgICAgICAgdmFyIHdpZGdldFVyaSA9IG5ldyBVUkkoY3VycmVudFVyaS5wYXRoKCkpO1xuICAgICAgICB3aWRnZXRVcmkucXVlcnkoY3VycmVudFVyaS5xdWVyeSh0cnVlKSk7XG4gICAgICAgIHRhcmdldC5xdWVyeSgocXVlcnkpID0+IHtcbiAgICAgICAgICBxdWVyeS5ocmVmID0gVVJJLmVuY29kZVJlc2VydmVkKHdpZGdldFVyaS50b1N0cmluZygpKVxuICAgICAgICAgIGlmICh0aXRsZSkge1xuICAgICAgICAgICAgcXVlcnkudGl0bGUgPSBVUkkuZW5jb2RlUmVzZXJ2ZWQodGl0bGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc2l6ZV94ICYmIHNpemVfeSkge1xuICAgICAgICAgICAgcXVlcnkuc2l6ZSA9IFVSSS5lbmNvZGVSZXNlcnZlZChhbmd1bGFyLnRvSnNvbih7c2l6ZV94OiBzaXplX3gsIHNpemVfeTogc2l6ZV95fSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0YXJnZXQudG9TdHJpbmcoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAkZGVsZWdhdGU7XG4gICAgfV0pO1xuXG4gICAgJHJvdXRlUHJvdmlkZXIuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2FkZCcsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdhZGRUb0Rhc2hib2FyZC5odG1sJ30pLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9lZGl0Jywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2VkaXREYXNoYm9hcmRzLmh0bWwnfSkuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2lkeC86ZGFzaGJvYXJkSW5kZXgnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnZGFzaGJvYXJkLmh0bWwnLCByZWxvYWRPblNlYXJjaDogZmFsc2UgfSkuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2lkLzpkYXNoYm9hcmRJZCcsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdkYXNoYm9hcmQuaHRtbCcsIHJlbG9hZE9uU2VhcmNoOiBmYWxzZSB9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvaWQvOmRhc2hib2FyZElkL3NoYXJlJywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ3NoYXJlLmh0bWwnfSkuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2ltcG9ydCcsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdpbXBvcnQuaHRtbCd9KTtcbiAgfV0pO1xuXG4gIF9tb2R1bGUudmFsdWUoJ3VpLmNvbmZpZycsIHtcbiAgICAvLyBUaGUgdWktanEgZGlyZWN0aXZlIG5hbWVzcGFjZVxuICAgIGpxOiB7XG4gICAgICBncmlkc3Rlcjoge1xuICAgICAgICB3aWRnZXRfbWFyZ2luczogWzEwLCAxMF0sXG4gICAgICAgIHdpZGdldF9iYXNlX2RpbWVuc2lvbnM6IFsxNDAsIDE0MF1cbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIF9tb2R1bGUuZmFjdG9yeSgnSGF3dGlvRGFzaGJvYXJkVGFiJywgWydIYXd0aW9OYXYnLCAnSGF3dGlvRGFzaGJvYXJkJywgJyR0aW1lb3V0JywgJyRyb290U2NvcGUnLCAnZGFzaGJvYXJkUmVwb3NpdG9yeScsICckbG9jYXRpb24nLCAobmF2Okhhd3Rpb01haW5OYXYuUmVnaXN0cnksIGRhc2g6RGFzaGJvYXJkU2VydmljZSwgJHRpbWVvdXQsICRyb290U2NvcGUsIGRhc2hib2FyZHM6RGFzaGJvYXJkUmVwb3NpdG9yeSwgJGxvY2F0aW9uKSA9PiB7XG4gICAgdmFyIHRhYiA9IDxhbnk+IHtcbiAgICAgIGVtYmVkZGVkOiB0cnVlXG4gICAgfTtcbiAgICBpZiAoZGFzaC5pbkRhc2hib2FyZCkge1xuICAgICAgbG9nLmRlYnVnKFwiRW1iZWRkZWQgaW4gYSBkYXNoYm9hcmQsIG5vdCBpbml0aWFsaXppbmcgb3VyIG5hdmlnYXRpb24gdGFiXCIpO1xuICAgICAgcmV0dXJuIHRhYjtcbiAgICB9XG4gICAgLy8gc3BlY2lhbCBjYXNlIGhlcmUsIHdlIGRvbid0IHdhbnQgdG8gb3ZlcndyaXRlIG91ciBzdG9yZWQgdGFiIVxuICAgIHZhciBidWlsZGVyID0gbmF2LmJ1aWxkZXIoKTtcbiAgICB0YWIgPSBidWlsZGVyLmlkKHBsdWdpbk5hbWUpXG4gICAgICAgICAgICAgICAgICAuaHJlZigoKSA9PiAnL2Rhc2hib2FyZC9pZHgvMCcpXG4gICAgICAgICAgICAgICAgICAuaXNTZWxlY3RlZCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfLnN0YXJ0c1dpdGgoJGxvY2F0aW9uLnBhdGgoKSwgJy9kYXNoYm9hcmQvJyk7XG4gICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgLnRpdGxlKCgpID0+ICdEYXNoYm9hcmQnKVxuICAgICAgICAgICAgICAgICAgLmJ1aWxkKCk7XG4gICAgbmF2LmFkZCh0YWIpO1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgbG9nLmRlYnVnKFwiU2V0dGluZyB1cCBkYXNoYm9hcmQgc3ViLXRhYnNcIik7XG4gICAgICBkYXNoYm9hcmRzLmdldERhc2hib2FyZHMoKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgc2V0U3ViVGFicyh0YWIsIGJ1aWxkZXIsIGRhc2hib2FyZHMsICRyb290U2NvcGUpO1xuICAgICAgfSk7XG4gICAgfSwgNTAwKTtcbiAgICBsb2cuZGVidWcoXCJOb3QgZW1iZWRkZWQgaW4gYSBkYXNoYm9hcmQsIHJldHVybmluZyBwcm9wZXIgdGFiXCIpO1xuICAgIHJldHVybiB0YWI7XG4gIH1dKTtcblxuICBfbW9kdWxlLnJ1bihbXCJIYXd0aW9EYXNoYm9hcmRUYWJcIiwgKEhhd3Rpb0Rhc2hib2FyZFRhYikgPT4ge1xuICAgIGxvZy5kZWJ1ZyhcInJ1bm5pbmdcIik7XG4gIH1dKTtcblxuICBoYXd0aW9QbHVnaW5Mb2FkZXIuYWRkTW9kdWxlKHBsdWdpbk5hbWUpO1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRJbnRlcmZhY2VzLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcblxuICBfbW9kdWxlLmZhY3RvcnkoJ2Rhc2hib2FyZFJlcG9zaXRvcnknLCBbJ0RlZmF1bHREYXNoYm9hcmRzJywgKGRlZmF1bHRzOkRlZmF1bHREYXNoYm9hcmRzKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBMb2NhbERhc2hib2FyZFJlcG9zaXRvcnkoZGVmYXVsdHMpO1xuICB9XSk7XG5cbiAgX21vZHVsZS5mYWN0b3J5KCdEZWZhdWx0RGFzaGJvYXJkcycsIFsoKSA9PiB7XG4gICAgdmFyIGRlZmF1bHRzID0gPEFycmF5PERhc2hib2FyZD4+W107XG4gICAgdmFyIGFuc3dlciA9IHtcbiAgICAgIGFkZDogKGRhc2hib2FyZDpEYXNoYm9hcmQpID0+IHtcbiAgICAgICAgZGVmYXVsdHMucHVzaChkYXNoYm9hcmQpO1xuICAgICAgfSxcbiAgICAgIHJlbW92ZTogKGlkOnN0cmluZykgPT4ge1xuICAgICAgICByZXR1cm4gXy5yZW1vdmUoZGVmYXVsdHMsIChkYXNoYm9hcmQpID0+IGRhc2hib2FyZC5pZCA9PT0gaWQpO1xuICAgICAgfSxcbiAgICAgIGdldEFsbDogKCkgPT4gZGVmYXVsdHNcbiAgICB9XG4gICAgcmV0dXJuIGFuc3dlcjtcbiAgfV0pO1xuXG4gIC8qKlxuICAgKiBAY2xhc3MgTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5XG4gICAqIEB1c2VzIERhc2hib2FyZFJlcG9zaXRvcnlcbiAgICovXG4gIGV4cG9ydCBjbGFzcyBMb2NhbERhc2hib2FyZFJlcG9zaXRvcnkgaW1wbGVtZW50cyBEYXNoYm9hcmRSZXBvc2l0b3J5IHtcblxuICAgIHByaXZhdGUgbG9jYWxTdG9yYWdlOldpbmRvd0xvY2FsU3RvcmFnZSA9IG51bGw7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGRlZmF1bHRzOkRlZmF1bHREYXNoYm9hcmRzKSB7XG4gICAgICB0aGlzLmxvY2FsU3RvcmFnZSA9IENvcmUuZ2V0TG9jYWxTdG9yYWdlKCk7XG4gICAgICAvKlxuICAgICAgaWYgKCd1c2VyRGFzaGJvYXJkcycgaW4gdGhpcy5sb2NhbFN0b3JhZ2UpIHtcbiAgICAgICAgbG9nLmRlYnVnKFwiRm91bmQgcHJldmlvdXNseSBzYXZlZCBkYXNoYm9hcmRzXCIpO1xuICAgICAgICBpZiAodGhpcy5sb2FkRGFzaGJvYXJkcygpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHRoaXMuc3RvcmVEYXNoYm9hcmRzKGRlZmF1bHRzLmdldEFsbCgpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zdG9yZURhc2hib2FyZHMoZGVmYXVsdHMuZ2V0QWxsKCkpO1xuICAgICAgfVxuICAgICAgKi9cbiAgICB9XG5cbiAgICBwcml2YXRlIGxvYWREYXNoYm9hcmRzKCkge1xuICAgICAgdmFyIGFuc3dlciA9IGFuZ3VsYXIuZnJvbUpzb24obG9jYWxTdG9yYWdlWyd1c2VyRGFzaGJvYXJkcyddKTtcbiAgICAgIGlmICghYW5zd2VyIHx8IGFuc3dlci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgYW5zd2VyID0gdGhpcy5kZWZhdWx0cy5nZXRBbGwoKTtcbiAgICAgIH1cbiAgICAgIGxvZy5kZWJ1ZyhcInJldHVybmluZyBkYXNoYm9hcmRzOiBcIiwgYW5zd2VyKTtcbiAgICAgIHJldHVybiBhbnN3ZXI7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdG9yZURhc2hib2FyZHMoZGFzaGJvYXJkczphbnlbXSkge1xuICAgICAgbG9nLmRlYnVnKFwic3RvcmluZyBkYXNoYm9hcmRzOiBcIiwgZGFzaGJvYXJkcyk7XG4gICAgICBsb2NhbFN0b3JhZ2VbJ3VzZXJEYXNoYm9hcmRzJ10gPSBhbmd1bGFyLnRvSnNvbihkYXNoYm9hcmRzKTtcbiAgICAgIHJldHVybiB0aGlzLmxvYWREYXNoYm9hcmRzKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHB1dERhc2hib2FyZHMoYXJyYXk6YW55W10sIGNvbW1pdE1lc3NhZ2U6c3RyaW5nLCBmbikge1xuICAgICAgdmFyIGRhc2hib2FyZHMgPSB0aGlzLmxvYWREYXNoYm9hcmRzKCk7XG4gICAgICBhcnJheS5mb3JFYWNoKChkYXNoKSA9PiB7XG4gICAgICAgIHZhciBleGlzdGluZyA9IGRhc2hib2FyZHMuZmluZEluZGV4KChkKSA9PiB7IHJldHVybiBkLmlkID09PSBkYXNoLmlkOyB9KTtcbiAgICAgICAgaWYgKGV4aXN0aW5nID49IDApIHtcbiAgICAgICAgICBkYXNoYm9hcmRzW2V4aXN0aW5nXSA9IGRhc2g7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGFzaGJvYXJkcy5wdXNoKGRhc2gpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGZuKHRoaXMuc3RvcmVEYXNoYm9hcmRzKGRhc2hib2FyZHMpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVsZXRlRGFzaGJvYXJkcyhhcnJheTphbnlbXSwgZm4pIHtcbiAgICAgIHZhciBkYXNoYm9hcmRzID0gdGhpcy5sb2FkRGFzaGJvYXJkcygpO1xuICAgICAgYW5ndWxhci5mb3JFYWNoKGFycmF5LCAoaXRlbSkgPT4ge1xuICAgICAgICBkYXNoYm9hcmRzLnJlbW92ZSgoaSkgPT4geyByZXR1cm4gaS5pZCA9PT0gaXRlbS5pZDsgfSk7XG4gICAgICB9KTtcbiAgICAgIGZuKHRoaXMuc3RvcmVEYXNoYm9hcmRzKGRhc2hib2FyZHMpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RGFzaGJvYXJkcyhmbikge1xuICAgICAgZm4odGhpcy5sb2FkRGFzaGJvYXJkcygpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RGFzaGJvYXJkKGlkOnN0cmluZywgZm4pIHtcbiAgICAgIHZhciBkYXNoYm9hcmRzID0gdGhpcy5sb2FkRGFzaGJvYXJkcygpO1xuICAgICAgdmFyIGRhc2hib2FyZCA9IGRhc2hib2FyZHMuZmluZCgoZGFzaGJvYXJkKSA9PiB7IHJldHVybiBkYXNoYm9hcmQuaWQgPT09IGlkIH0pO1xuICAgICAgZm4oZGFzaGJvYXJkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY3JlYXRlRGFzaGJvYXJkKG9wdGlvbnM6YW55KSB7XG4gICAgICB2YXIgYW5zd2VyID17XG4gICAgICAgIHRpdGxlOiBcIk5ldyBEYXNoYm9hcmRcIixcbiAgICAgICAgZ3JvdXA6IFwiUGVyc29uYWxcIixcbiAgICAgICAgd2lkZ2V0czogW11cbiAgICAgIH07XG4gICAgICBhbnN3ZXIgPSBhbmd1bGFyLmV4dGVuZChhbnN3ZXIsIG9wdGlvbnMpO1xuICAgICAgYW5zd2VyWydpZCddID0gQ29yZS5nZXRVVUlEKCk7XG4gICAgICByZXR1cm4gYW5zd2VyO1xuICAgIH1cblxuICAgIHB1YmxpYyBjbG9uZURhc2hib2FyZChkYXNoYm9hcmQ6YW55KSB7XG4gICAgICB2YXIgbmV3RGFzaGJvYXJkID0gXy5jbG9uZShkYXNoYm9hcmQpO1xuICAgICAgbmV3RGFzaGJvYXJkWydpZCddID0gQ29yZS5nZXRVVUlEKCk7XG4gICAgICBuZXdEYXNoYm9hcmRbJ3RpdGxlJ10gPSBcIkNvcHkgb2YgXCIgKyBkYXNoYm9hcmQudGl0bGU7XG4gICAgICByZXR1cm4gbmV3RGFzaGJvYXJkO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRUeXBlKCkge1xuICAgICAgcmV0dXJuICdjb250YWluZXInO1xuICAgIH1cbiAgfVxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcblxuICBfbW9kdWxlLmNvbnRyb2xsZXIoXCJEYXNoYm9hcmQuRWRpdERhc2hib2FyZHNDb250cm9sbGVyXCIsIFtcIiRzY29wZVwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcIiRyb3V0ZVwiLCBcIiRsb2NhdGlvblwiLCBcIiRyb290U2NvcGVcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsIFwiSGF3dGlvTmF2XCIsIFwiJHRpbWVvdXRcIiwgXCIkdGVtcGxhdGVDYWNoZVwiLCBcIiRtb2RhbFwiLCBcIkhhd3Rpb0Rhc2hib2FyZFRhYlwiLCAoJHNjb3BlLCAkcm91dGVQYXJhbXMsICRyb3V0ZSwgJGxvY2F0aW9uLCAkcm9vdFNjb3BlLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnksIG5hdiwgJHRpbWVvdXQsICR0ZW1wbGF0ZUNhY2hlLCAkbW9kYWwsIHRhYikgPT4ge1xuXG4gICAgJHNjb3BlLl9kYXNoYm9hcmRzID0gW107XG5cbiAgICAkcm9vdFNjb3BlLiRvbignZGFzaGJvYXJkc1VwZGF0ZWQnLCBkYXNoYm9hcmRMb2FkZWQpO1xuXG4gICAgJHNjb3BlLmhhc1VybCA9ICgpID0+IHtcbiAgICAgIHJldHVybiAoJHNjb3BlLnVybCkgPyB0cnVlIDogZmFsc2U7XG4gICAgfTtcblxuICAgICRzY29wZS5oYXNTZWxlY3Rpb24gPSAoKSA9PiB7XG4gICAgICByZXR1cm4gJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXMubGVuZ3RoICE9PSAwO1xuICAgIH07XG5cbiAgICAkc2NvcGUuZ3JpZE9wdGlvbnMgPSB7XG4gICAgICBzZWxlY3RlZEl0ZW1zOiBbXSxcbiAgICAgIHNob3dGaWx0ZXI6IGZhbHNlLFxuICAgICAgc2hvd0NvbHVtbk1lbnU6IGZhbHNlLFxuICAgICAgZmlsdGVyT3B0aW9uczoge1xuICAgICAgICBmaWx0ZXJUZXh0OiAnJ1xuICAgICAgfSxcbiAgICAgIGRhdGE6ICdfZGFzaGJvYXJkcycsXG4gICAgICBzZWxlY3RXaXRoQ2hlY2tib3hPbmx5OiB0cnVlLFxuICAgICAgc2hvd1NlbGVjdGlvbkNoZWNrYm94OiB0cnVlLFxuICAgICAgY29sdW1uRGVmczogW1xuICAgICAgICB7XG4gICAgICAgICAgZmllbGQ6ICd0aXRsZScsXG4gICAgICAgICAgZGlzcGxheU5hbWU6ICdEYXNoYm9hcmQnLFxuICAgICAgICAgIGNlbGxUZW1wbGF0ZTogJHRlbXBsYXRlQ2FjaGUuZ2V0KFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdlZGl0RGFzaGJvYXJkVGl0bGVDZWxsLmh0bWwnKSlcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGZpZWxkOiAnZ3JvdXAnLFxuICAgICAgICAgIGRpc3BsYXlOYW1lOiAnR3JvdXAnXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgfTtcblxuICAgIHZhciBkb1VwZGF0ZSA9IF8uZGVib3VuY2UodXBkYXRlRGF0YSwgMTApO1xuXG4gICAgLy8gaGVscGVycyBzbyB3ZSBjYW4gZW5hYmxlL2Rpc2FibGUgcGFydHMgb2YgdGhlIFVJIGRlcGVuZGluZyBvbiBob3dcbiAgICAvLyBkYXNoYm9hcmQgZGF0YSBpcyBzdG9yZWRcbiAgICAvKlxuICAgICRzY29wZS51c2luZ0dpdCA9ICgpID0+IHtcbiAgICAgIHJldHVybiBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldFR5cGUoKSA9PT0gJ2dpdCc7XG4gICAgfTtcblxuICAgICRzY29wZS51c2luZ0ZhYnJpYyA9ICgpID0+IHtcbiAgICAgIHJldHVybiBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldFR5cGUoKSA9PT0gJ2ZhYnJpYyc7XG4gICAgfTtcblxuICAgICRzY29wZS51c2luZ0xvY2FsID0gKCkgPT4ge1xuICAgICAgcmV0dXJuIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0VHlwZSgpID09PSAnY29udGFpbmVyJztcbiAgICB9O1xuXG4gICAgaWYgKCRzY29wZS51c2luZ0ZhYnJpYygpKSB7XG4gICAgICAkc2NvcGUuZ3JpZE9wdGlvbnMuY29sdW1uRGVmcy5hZGQoW3tcbiAgICAgICAgZmllbGQ6ICd2ZXJzaW9uSWQnLFxuICAgICAgICBkaXNwbGF5TmFtZTogJ1ZlcnNpb24nXG4gICAgICB9LCB7XG4gICAgICAgIGZpZWxkOiAncHJvZmlsZUlkJyxcbiAgICAgICAgZGlzcGxheU5hbWU6ICdQcm9maWxlJ1xuICAgICAgfSwge1xuICAgICAgICBmaWVsZDogJ2ZpbGVOYW1lJyxcbiAgICAgICAgZGlzcGxheU5hbWU6ICdGaWxlIE5hbWUnXG4gICAgICB9XSk7XG4gICAgfVxuICAgICovXG5cbiAgICAkdGltZW91dChkb1VwZGF0ZSwgMTApO1xuXG4gICAgJHNjb3BlLiRvbihcIiRyb3V0ZUNoYW5nZVN1Y2Nlc3NcIiwgZnVuY3Rpb24gKGV2ZW50LCBjdXJyZW50LCBwcmV2aW91cykge1xuICAgICAgLy8gbGV0cyBkbyB0aGlzIGFzeW5jaHJvbm91c2x5IHRvIGF2b2lkIEVycm9yOiAkZGlnZXN0IGFscmVhZHkgaW4gcHJvZ3Jlc3NcbiAgICAgICR0aW1lb3V0KGRvVXBkYXRlLCAxMCk7XG4gICAgfSk7XG5cbiAgICAkc2NvcGUuYWRkVmlld1RvRGFzaGJvYXJkID0gKCkgPT4ge1xuICAgICAgdmFyIG5leHRIcmVmID0gbnVsbDtcbiAgICAgIHZhciBzZWxlY3RlZCA9ICRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zO1xuICAgICAgdmFyIGN1cnJlbnRVcmwgPSBuZXcgVVJJKCk7XG4gICAgICB2YXIgY29uZmlnID0gY3VycmVudFVybC5xdWVyeSh0cnVlKTtcbiAgICAgIHZhciBocmVmID0gY29uZmlnWydocmVmJ107XG4gICAgICB2YXIgaWZyYW1lID0gY29uZmlnWydpZnJhbWUnXTtcbiAgICAgIHZhciB0eXBlID0gJ2hyZWYnO1xuICAgICAgaWYgKGhyZWYpIHtcbiAgICAgICAgaHJlZiA9IFVSSS5kZWNvZGUoaHJlZik7XG4gICAgICAgIGhyZWYgPSBDb3JlLnRyaW1MZWFkaW5nKGhyZWYsICcjJyk7XG4gICAgICB9IGVsc2UgaWYgKGlmcmFtZSkge1xuICAgICAgICBpZnJhbWUgPSBpZnJhbWUudW5lc2NhcGVVUkwoKTtcbiAgICAgICAgdHlwZSA9ICdpZnJhbWUnO1xuICAgICAgfVxuICAgICAgdmFyIHdpZGdldFVSSSA9IDxhbnk+IHVuZGVmaW5lZDtcbiAgICAgIHN3aXRjaCh0eXBlKSB7XG4gICAgICAgIGNhc2UgJ2hyZWYnOlxuICAgICAgICAgIGxvZy5kZWJ1ZyhcImhyZWY6IFwiLCBocmVmKTtcbiAgICAgICAgICB3aWRnZXRVUkkgPSBuZXcgVVJJKGhyZWYpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdpZnJhbWUnOlxuICAgICAgICAgIGxvZy5kZWJ1ZyhcImlmcmFtZTogXCIsIGlmcmFtZSk7XG4gICAgICAgICAgd2lkZ2V0VVJJID0gbmV3IFVSSShpZnJhbWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGxvZy5kZWJ1ZyhcInR5cGUgdW5rbm93blwiKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgc2l6ZVN0ciA9IDxhbnk+IGNvbmZpZ1snc2l6ZSddO1xuICAgICAgaWYgKHNpemVTdHIpIHtcbiAgICAgICAgc2l6ZVN0ciA9IHNpemVTdHIudW5lc2NhcGVVUkwoKTtcbiAgICAgIH1cbiAgICAgIHZhciBzaXplID0gYW5ndWxhci5mcm9tSnNvbihzaXplU3RyKSB8fCB7IHNpemVfeDogMSwgc2l6ZV95OiAxIH07XG4gICAgICB2YXIgdGl0bGUgPSAoY29uZmlnWyd0aXRsZSddIHx8ICcnKS51bmVzY2FwZVVSTCgpO1xuICAgICAgdmFyIHRlbXBsYXRlV2lkZ2V0ID0ge1xuICAgICAgICBpZDogQ29yZS5nZXRVVUlEKCksXG4gICAgICAgIHJvdzogMSxcbiAgICAgICAgY29sOiAxLFxuICAgICAgICBzaXplX3g6IHNpemUuc2l6ZV94LFxuICAgICAgICBzaXplX3k6IHNpemUuc2l6ZV95LFxuICAgICAgICB0aXRsZTogdGl0bGVcbiAgICAgIH1cbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZWxlY3RlZCwgKHNlbGVjdGVkSXRlbSkgPT4ge1xuXG4gICAgICAgIHZhciB3aWRnZXQgPSBfLmNsb25lRGVlcCh0ZW1wbGF0ZVdpZGdldCk7XG5cbiAgICAgICAgaWYgKCFzZWxlY3RlZEl0ZW0ud2lkZ2V0cykge1xuICAgICAgICAgIHNlbGVjdGVkSXRlbS53aWRnZXRzID0gW107XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICBjYXNlICdpZnJhbWUnOiBcbiAgICAgICAgICAgIHdpZGdldCA9IDxhbnk+Xy5leHRlbmQoe1xuICAgICAgICAgICAgICBpZnJhbWU6IGlmcmFtZVxuICAgICAgICAgICAgfSwgd2lkZ2V0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2hyZWYnOlxuICAgICAgICAgICAgdmFyIHRleHQgPSB3aWRnZXRVUkkucGF0aCgpO1xuICAgICAgICAgICAgdmFyIHNlYXJjaCA9IHdpZGdldFVSSS5xdWVyeSh0cnVlKTtcbiAgICAgICAgICAgIGlmICgkcm91dGUgJiYgJHJvdXRlLnJvdXRlcykge1xuICAgICAgICAgICAgICB2YXIgdmFsdWUgPSAkcm91dGUucm91dGVzW3RleHRdO1xuICAgICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGVtcGxhdGVVcmwgPSB2YWx1ZVtcInRlbXBsYXRlVXJsXCJdO1xuICAgICAgICAgICAgICAgIGlmICh0ZW1wbGF0ZVVybCkge1xuICAgICAgICAgICAgICAgICAgd2lkZ2V0ID0gPGFueT4gXy5leHRlbmQoe1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiB0ZXh0LFxuICAgICAgICAgICAgICAgICAgICBpbmNsdWRlOiB0ZW1wbGF0ZVVybCxcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiBzZWFyY2gsXG4gICAgICAgICAgICAgICAgICAgIGhhc2g6IFwiXCJcbiAgICAgICAgICAgICAgICAgIH0sIHdpZGdldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFRPRE8gd2UgbmVlZCB0byBiZSBhYmxlIHRvIG1hdGNoIFVSSSB0ZW1wbGF0ZXMuLi5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIC8vIGZpZ3VyZSBvdXQgdGhlIHdpZHRoIG9mIHRoZSBkYXNoXG4gICAgICAgIHZhciBncmlkV2lkdGggPSAwO1xuXG4gICAgICAgIHNlbGVjdGVkSXRlbS53aWRnZXRzLmZvckVhY2goKHcpID0+IHtcbiAgICAgICAgICB2YXIgcmlnaHRTaWRlID0gdy5jb2wgKyB3LnNpemVfeDtcbiAgICAgICAgICBpZiAocmlnaHRTaWRlID4gZ3JpZFdpZHRoKSB7XG4gICAgICAgICAgICBncmlkV2lkdGggPSByaWdodFNpZGU7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZm91bmQgPSBmYWxzZTtcblxuICAgICAgICB2YXIgbGVmdCA9ICh3KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHcuY29sO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciByaWdodCA9ICh3KSAgPT4ge1xuICAgICAgICAgIHJldHVybiB3LmNvbCArIHcuc2l6ZV94IC0gMTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgdG9wID0gKHcpID0+IHtcbiAgICAgICAgICByZXR1cm4gdy5yb3c7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGJvdHRvbSA9ICh3KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHcucm93ICsgdy5zaXplX3kgLSAxO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBjb2xsaXNpb24gPSAodzEsIHcyKSA9PiB7XG4gICAgICAgICAgcmV0dXJuICEoIGxlZnQodzIpID4gcmlnaHQodzEpIHx8XG4gICAgICAgICAgICAgIHJpZ2h0KHcyKSA8IGxlZnQodzEpIHx8XG4gICAgICAgICAgICAgIHRvcCh3MikgPiBib3R0b20odzEpIHx8XG4gICAgICAgICAgICAgIGJvdHRvbSh3MikgPCB0b3AodzEpKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoc2VsZWN0ZWRJdGVtLndpZGdldHMuaXNFbXB0eSgpKSB7XG4gICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKCFmb3VuZCkge1xuICAgICAgICAgIHdpZGdldC5jb2wgPSAxO1xuICAgICAgICAgIGlmICh3aWRnZXQuY29sICsgd2lkZ2V0LnNpemVfeCA+IGdyaWRXaWR0aCkge1xuICAgICAgICAgICAgLy8gbGV0J3Mgbm90IGxvb2sgZm9yIGEgcGxhY2UgbmV4dCB0byBleGlzdGluZyB3aWRnZXRcbiAgICAgICAgICAgIHNlbGVjdGVkSXRlbS53aWRnZXRzLmZvckVhY2goZnVuY3Rpb24odywgaWR4KSB7XG4gICAgICAgICAgICAgIGlmICh3aWRnZXQucm93IDw9IHcucm93KSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0LnJvdysrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yICg7ICh3aWRnZXQuY29sICsgd2lkZ2V0LnNpemVfeCkgPD0gZ3JpZFdpZHRoOyB3aWRnZXQuY29sKyspIHtcbiAgICAgICAgICAgIGlmICghc2VsZWN0ZWRJdGVtLndpZGdldHMuYW55KCh3KSA9PiB7XG4gICAgICAgICAgICAgIHZhciBjID0gY29sbGlzaW9uKHcsIHdpZGdldCk7XG4gICAgICAgICAgICAgIHJldHVybiBjXG4gICAgICAgICAgICB9KSkge1xuICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICB3aWRnZXQucm93ID0gd2lkZ2V0LnJvdyArIDFcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8ganVzdCBpbiBjYXNlLCBrZWVwIHRoZSBzY3JpcHQgZnJvbSBydW5uaW5nIGF3YXkuLi5cbiAgICAgICAgICBpZiAod2lkZ2V0LnJvdyA+IDUwKSB7XG4gICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCRzY29wZS5yb3V0ZVBhcmFtcykge1xuICAgICAgICAgIHdpZGdldFsncm91dGVQYXJhbXMnXSA9ICRzY29wZS5yb3V0ZVBhcmFtcztcbiAgICAgICAgfVxuICAgICAgICBzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5wdXNoKHdpZGdldCk7XG4gICAgICAgIGlmICghbmV4dEhyZWYgJiYgc2VsZWN0ZWRJdGVtLmlkKSB7XG4gICAgICAgICAgbmV4dEhyZWYgPSBuZXcgVVJJKCkucGF0aChcIi9kYXNoYm9hcmQvaWQvXCIgKyBzZWxlY3RlZEl0ZW0uaWQpLnF1ZXJ5KHtcbiAgICAgICAgICAgICdtYWluLXRhYic6ICdkYXNoYm9hcmQnLFxuICAgICAgICAgICAgJ3N1Yi10YWInOiAnZGFzaGJvYXJkLScgKyBzZWxlY3RlZEl0ZW0uaWRcbiAgICAgICAgICB9KS5yZW1vdmVRdWVyeSgnaHJlZicpXG4gICAgICAgICAgICAucmVtb3ZlUXVlcnkoJ3RpdGxlJylcbiAgICAgICAgICAgIC5yZW1vdmVRdWVyeSgnaWZyYW1lJylcbiAgICAgICAgICAgIC5yZW1vdmVRdWVyeSgnc2l6ZScpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gbm93IGxldHMgdXBkYXRlIHRoZSBhY3R1YWwgZGFzaGJvYXJkIGNvbmZpZ1xuICAgICAgdmFyIGNvbW1pdE1lc3NhZ2UgPSBcIkFkZCB3aWRnZXRcIjtcbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhzZWxlY3RlZCwgY29tbWl0TWVzc2FnZSwgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgLypcbiAgICAgICAgbG9nLmRlYnVnKFwiUHV0IGRhc2hib2FyZHM6IFwiLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgbG9nLmRlYnVnKFwiTmV4dCBocmVmOiBcIiwgbmV4dEhyZWYudG9TdHJpbmcoKSk7XG4gICAgICAgICovXG4gICAgICAgIGlmIChuZXh0SHJlZikge1xuICAgICAgICAgICRsb2NhdGlvbi5wYXRoKG5leHRIcmVmLnBhdGgoKSkuc2VhcmNoKG5leHRIcmVmLnF1ZXJ5KHRydWUpKTtcbiAgICAgICAgICBDb3JlLiRhcHBseSgkc2NvcGUpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgIH07XG5cbiAgICAkc2NvcGUuY3JlYXRlID0gKCkgPT4ge1xuXG4gICAgICB2YXIgY291bnRlciA9IGRhc2hib2FyZHMoKS5sZW5ndGggKyAxO1xuICAgICAgdmFyIHRpdGxlID0gXCJVbnRpdGxlZFwiICsgY291bnRlcjtcblxuICAgICAgdmFyIG1vZGFsID0gJG1vZGFsLm9wZW4oe1xuICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ2NyZWF0ZURhc2hib2FyZE1vZGFsLmh0bWwnKSxcbiAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCAnJG1vZGFsSW5zdGFuY2UnLCAoJHNjb3BlLCAkbW9kYWxJbnN0YW5jZSkgPT4ge1xuICAgICAgICAgICRzY29wZS5lbnRpdHkgPSB7XG4gICAgICAgICAgICB0aXRsZTogdGl0bGVcbiAgICAgICAgICB9XG4gICAgICAgICAgJHNjb3BlLmNvbmZpZyA9IHtcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgJ3RpdGxlJzoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICAkc2NvcGUub2sgPSAoKSA9PiB7XG4gICAgICAgICAgICBtb2RhbC5jbG9zZSgpO1xuICAgICAgICAgICAgdmFyIHRpdGxlID0gJHNjb3BlLmVudGl0eS50aXRsZVxuICAgICAgICAgICAgdmFyIG5ld0Rhc2ggPSBkYXNoYm9hcmRSZXBvc2l0b3J5LmNyZWF0ZURhc2hib2FyZCh7IHRpdGxlOiB0aXRsZSB9KTtcbiAgICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbbmV3RGFzaF0sIFwiQ3JlYXRlZCBuZXcgZGFzaGJvYXJkOiBcIiArIHRpdGxlLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAgICAgICAvLyBsZXQncyBqdXN0IGJlIHNhZmUgYW5kIGVuc3VyZSB0aGVyZSdzIG5vIHNlbGVjdGlvbnNcbiAgICAgICAgICAgICAgZGVzZWxlY3RBbGwoKTtcbiAgICAgICAgICAgICAgc2V0U3ViVGFicyh0YWIsIG5hdi5idWlsZGVyKCksIGRhc2hib2FyZHMsICRyb290U2NvcGUpO1xuICAgICAgICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgJHNjb3BlLmNhbmNlbCA9ICgpID0+IHtcbiAgICAgICAgICAgIG1vZGFsLmRpc21pc3MoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1dXG4gICAgICB9KTtcbiAgICAgIC8qXG4gICAgICB2YXIgY291bnRlciA9IGRhc2hib2FyZHMoKS5sZW5ndGggKyAxO1xuICAgICAgdmFyIHRpdGxlID0gXCJVbnRpdGxlZFwiICsgY291bnRlcjtcbiAgICAgIHZhciBuZXdEYXNoID0gZGFzaGJvYXJkUmVwb3NpdG9yeS5jcmVhdGVEYXNoYm9hcmQoe3RpdGxlOiB0aXRsZX0pO1xuXG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoW25ld0Rhc2hdLCBcIkNyZWF0ZWQgbmV3IGRhc2hib2FyZDogXCIgKyB0aXRsZSwgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgLy8gbGV0J3MganVzdCBiZSBzYWZlIGFuZCBlbnN1cmUgdGhlcmUncyBubyBzZWxlY3Rpb25zXG4gICAgICAgIGRlc2VsZWN0QWxsKCk7XG4gICAgICAgIHNldFN1YlRhYnMobmF2LmJ1aWxkZXIoKSwgZGFzaGJvYXJkcywgJHJvb3RTY29wZSk7XG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgIH0pO1xuICAgICAgKi9cblxuICAgIH07XG5cbiAgICAkc2NvcGUuZHVwbGljYXRlID0gKCkgPT4ge1xuICAgICAgdmFyIG5ld0Rhc2hib2FyZHMgPSBbXTtcbiAgICAgIHZhciBjb21taXRNZXNzYWdlID0gXCJEdXBsaWNhdGVkIGRhc2hib2FyZChzKSBcIjtcbiAgICAgIGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcywgKGl0ZW0sIGlkeCkgPT4ge1xuICAgICAgICAvLyBsZXRzIHVuc2VsZWN0IHRoaXMgaXRlbVxuICAgICAgICB2YXIgY29tbWl0TWVzc2FnZSA9IFwiRHVwbGljYXRlZCBkYXNoYm9hcmQgXCIgKyBpdGVtLnRpdGxlO1xuICAgICAgICB2YXIgbmV3RGFzaCA9IGRhc2hib2FyZFJlcG9zaXRvcnkuY2xvbmVEYXNoYm9hcmQoaXRlbSk7XG4gICAgICAgIG5ld0Rhc2hib2FyZHMucHVzaChuZXdEYXNoKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBsZXQncyBqdXN0IGJlIHNhZmUgYW5kIGVuc3VyZSB0aGVyZSdzIG5vIHNlbGVjdGlvbnNcbiAgICAgIGRlc2VsZWN0QWxsKCk7XG5cbiAgICAgIGNvbW1pdE1lc3NhZ2UgPSBjb21taXRNZXNzYWdlICsgbmV3RGFzaGJvYXJkcy5tYXAoKGQpID0+IHsgcmV0dXJuIGQudGl0bGUgfSkuam9pbignLCcpO1xuICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKG5ld0Rhc2hib2FyZHMsIGNvbW1pdE1lc3NhZ2UsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIHNldFN1YlRhYnModGFiLCBuYXYuYnVpbGRlcigpLCBkYXNoYm9hcmRzLCAkcm9vdFNjb3BlKTtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5yZW5hbWVEYXNoYm9hcmQgPSAoKSA9PiB7XG4gICAgICBpZiAoJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHZhciBzZWxlY3RlZCA9IDxhbnk+Xy5maXJzdCgkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcyk7XG4gICAgICAgIHZhciBtb2RhbCA9ICRtb2RhbC5vcGVuKHtcbiAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ3JlbmFtZURhc2hib2FyZE1vZGFsLmh0bWwnKSxcbiAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICckbW9kYWxJbnN0YW5jZScsICgkc2NvcGUsICRtb2RhbEluc3RhbmNlKSA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuY29uZmlnID0ge1xuICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgJ3RpdGxlJzoge1xuICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICBkZWZhdWx0OiBzZWxlY3RlZC50aXRsZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZCA9IHNlbGVjdGVkO1xuICAgICAgICAgICAgJHNjb3BlLm9rID0gKCkgPT4ge1xuICAgICAgICAgICAgICBtb2RhbC5jbG9zZSgpO1xuICAgICAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoWyRzY29wZS5zZWxlY3RlZF0sICdyZW5hbWVkIGRhc2hib2FyZCcsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gbGV0J3MganVzdCBiZSBzYWZlIGFuZCBlbnN1cmUgdGhlcmUncyBubyBzZWxlY3Rpb25zXG4gICAgICAgICAgICAgICAgZGVzZWxlY3RBbGwoKTtcbiAgICAgICAgICAgICAgICBzZXRTdWJUYWJzKHRhYiwgbmF2LmJ1aWxkZXIoKSwgZGFzaGJvYXJkcywgJHJvb3RTY29wZSk7XG4gICAgICAgICAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgICAgICAgIG1vZGFsLmRpc21pc3MoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgJHNjb3BlLmRlbGV0ZURhc2hib2FyZCA9ICgpID0+IHtcbiAgICAgIGlmICgkc2NvcGUuaGFzU2VsZWN0aW9uKCkpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkID0gJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXM7XG4gICAgICAgIHZhciBtb2RhbCA9ICRtb2RhbC5vcGVuKHtcbiAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ2RlbGV0ZURhc2hib2FyZE1vZGFsLmh0bWwnKSxcbiAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICckbW9kYWxJbnN0YW5jZScsICgkc2NvcGUsICRtb2RhbEluc3RhbmNlKSA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWQgPSBzZWxlY3RlZDtcbiAgICAgICAgICAgICRzY29wZS5vayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgbW9kYWwuY2xvc2UoKTtcbiAgICAgICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5kZWxldGVEYXNoYm9hcmRzKCRzY29wZS5zZWxlY3RlZCwgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBsZXQncyBqdXN0IGJlIHNhZmUgYW5kIGVuc3VyZSB0aGVyZSdzIG5vIHNlbGVjdGlvbnNcbiAgICAgICAgICAgICAgICBkZXNlbGVjdEFsbCgpO1xuICAgICAgICAgICAgICAgIHNldFN1YlRhYnModGFiLCBuYXYuYnVpbGRlcigpLCBkYXNoYm9hcmRzLCAkcm9vdFNjb3BlKTtcbiAgICAgICAgICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgbW9kYWwuZGlzbWlzcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1dXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAkc2NvcGUuZ2lzdCA9ICgpID0+IHtcbiAgICAgIGlmICgkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBpZCA9ICRzY29wZS5zZWxlY3RlZEl0ZW1zWzBdLmlkO1xuICAgICAgICAkbG9jYXRpb24ucGF0aChcIi9kYXNoYm9hcmQvaWQvXCIgKyBpZCArIFwiL3NoYXJlXCIpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiB1cGRhdGVEYXRhKCkge1xuICAgICAgdmFyIHVybCA9ICRyb3V0ZVBhcmFtc1tcImhyZWZcIl07XG4gICAgICBpZiAodXJsKSB7XG4gICAgICAgICRzY29wZS51cmwgPSBkZWNvZGVVUklDb21wb25lbnQodXJsKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHJvdXRlUGFyYW1zID0gJHJvdXRlUGFyYW1zW1wicm91dGVQYXJhbXNcIl07XG4gICAgICBpZiAocm91dGVQYXJhbXMpIHtcbiAgICAgICAgJHNjb3BlLnJvdXRlUGFyYW1zID0gZGVjb2RlVVJJQ29tcG9uZW50KHJvdXRlUGFyYW1zKTtcbiAgICAgIH1cbiAgICAgIHZhciBzaXplOmFueSA9ICRyb3V0ZVBhcmFtc1tcInNpemVcIl07XG4gICAgICBpZiAoc2l6ZSkge1xuICAgICAgICBzaXplID0gZGVjb2RlVVJJQ29tcG9uZW50KHNpemUpO1xuICAgICAgICAkc2NvcGUucHJlZmVycmVkU2l6ZSA9IGFuZ3VsYXIuZnJvbUpzb24oc2l6ZSk7XG4gICAgICB9XG4gICAgICB2YXIgdGl0bGU6YW55ID0gJHJvdXRlUGFyYW1zW1widGl0bGVcIl07XG4gICAgICBpZiAodGl0bGUpIHtcbiAgICAgICAgdGl0bGUgPSBkZWNvZGVVUklDb21wb25lbnQodGl0bGUpO1xuICAgICAgICAkc2NvcGUud2lkZ2V0VGl0bGUgPSB0aXRsZTtcbiAgICAgIH1cblxuICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXREYXNoYm9hcmRzKChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRhc2hib2FyZExvYWRlZChldmVudCwgZGFzaGJvYXJkcykge1xuICAgICAgZGFzaGJvYXJkcy5mb3JFYWNoKChkYXNoYm9hcmQpID0+IHtcbiAgICAgICAgZGFzaGJvYXJkLmhhc2ggPSAnP21haW4tdGFiPWRhc2hib2FyZCZzdWItdGFiPWRhc2hib2FyZC0nICsgZGFzaGJvYXJkLmlkO1xuICAgICAgfSk7XG4gICAgICAkc2NvcGUuX2Rhc2hib2FyZHMgPSBkYXNoYm9hcmRzO1xuXG4gICAgICBpZiAoZXZlbnQgPT09IG51bGwpIHtcbiAgICAgICAgJHNjb3BlLiRlbWl0KCdkYXNoYm9hcmRzVXBkYXRlZCcsIGRhc2hib2FyZHMpO1xuICAgICAgfVxuICAgICAgQ29yZS4kYXBwbHkoJHJvb3RTY29wZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGFzaGJvYXJkcygpIHtcbiAgICAgIHJldHVybiAkc2NvcGUuX2Rhc2hib2FyZHM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVzZWxlY3RBbGwoKSB7XG4gICAgICAkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcy5sZW5ndGggPSAwO1xuICAgIH1cblxuICB9XSk7XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkSGVscGVycy50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG5cbiAgLyoqXG4gICAqIEltcGxlbWVudHMgdGhlIG5nLklMb2NhdGlvblNlcnZpY2UgaW50ZXJmYWNlIGFuZCBpcyB1c2VkIGJ5IHRoZSBkYXNoYm9hcmQgdG8gc3VwcGx5XG4gICAqIGNvbnRyb2xsZXJzIHdpdGggYSBzYXZlZCBVUkwgbG9jYXRpb25cbiAgICpcbiAgICogQGNsYXNzIFJlY3RhbmdsZUxvY2F0aW9uXG4gICAqL1xuICBleHBvcnQgY2xhc3MgUmVjdGFuZ2xlTG9jYXRpb24geyAvLyBUT0RPIGltcGxlbWVudHMgbmcuSUxvY2F0aW9uU2VydmljZSB7XG4gICAgcHJpdmF0ZSBfcGF0aDogc3RyaW5nO1xuICAgIHByaXZhdGUgX2hhc2g6IHN0cmluZztcbiAgICBwcml2YXRlIF9zZWFyY2g6IGFueTtcbiAgICBwcml2YXRlIHVyaTpVUkk7XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgZGVsZWdhdGU6bmcuSUxvY2F0aW9uU2VydmljZSwgcGF0aDpzdHJpbmcsIHNlYXJjaCwgaGFzaDpzdHJpbmcpIHtcbiAgICAgIHRoaXMuX3BhdGggPSBwYXRoO1xuICAgICAgdGhpcy5fc2VhcmNoID0gc2VhcmNoO1xuICAgICAgdGhpcy5faGFzaCA9IGhhc2g7XG4gICAgICB0aGlzLnVyaSA9IG5ldyBVUkkocGF0aCk7XG4gICAgICB0aGlzLnVyaS5zZWFyY2goKHF1ZXJ5KSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZWFyY2g7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBhYnNVcmwoKSB7XG4gICAgICByZXR1cm4gdGhpcy5wcm90b2NvbCgpICsgdGhpcy5ob3N0KCkgKyBcIjpcIiArIHRoaXMucG9ydCgpICsgdGhpcy5wYXRoKCkgKyB0aGlzLnNlYXJjaCgpO1xuICAgIH1cblxuICAgIGhhc2gobmV3SGFzaDpzdHJpbmcgPSBudWxsKTphbnkge1xuICAgICAgaWYgKG5ld0hhc2gpIHtcbiAgICAgICAgdGhpcy51cmkuc2VhcmNoKG5ld0hhc2gpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9oYXNoO1xuICAgIH1cblxuICAgIGhvc3QoKTpzdHJpbmcge1xuICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUuaG9zdCgpO1xuICAgIH1cblxuICAgIHBhdGgobmV3UGF0aDpzdHJpbmcgPSBudWxsKTphbnkge1xuICAgICAgaWYgKG5ld1BhdGgpIHtcbiAgICAgICAgdGhpcy51cmkucGF0aChuZXdQYXRoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fcGF0aDtcbiAgICB9XG5cbiAgICBwb3J0KCk6bnVtYmVyIHtcbiAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLnBvcnQoKTtcbiAgICB9XG5cbiAgICBwcm90b2NvbCgpIHtcbiAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLnBvcnQoKTtcbiAgICB9XG5cbiAgICByZXBsYWNlKCkge1xuICAgICAgLy8gVE9ET1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2VhcmNoKHBhcmFtZXRlcnNNYXA6YW55ID0gbnVsbCk6YW55IHtcbiAgICAgIGlmIChwYXJhbWV0ZXJzTWFwKSB7XG4gICAgICAgIHRoaXMudXJpLnNlYXJjaChwYXJhbWV0ZXJzTWFwKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fc2VhcmNoO1xuICAgIH1cblxuICAgIHVybChuZXdWYWx1ZTogc3RyaW5nID0gbnVsbCk6YW55IHtcbiAgICAgIGlmIChuZXdWYWx1ZSkge1xuICAgICAgICB0aGlzLnVyaSA9IG5ldyBVUkkobmV3VmFsdWUpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmFic1VybCgpO1xuICAgIH1cblxuICB9XG59XG4iLCIvKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUmVwb3NpdG9yeS50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJyZWN0YW5nbGVMb2NhdGlvbi50c1wiLz5cbm1vZHVsZSBEYXNoYm9hcmQge1xuXG4gIHZhciBtb2R1bGVzOkFycmF5PHN0cmluZz4gPSB1bmRlZmluZWQ7XG5cbiAgX21vZHVsZS5kaXJlY3RpdmUoJ2hhd3Rpb0Rhc2hib2FyZCcsIGZ1bmN0aW9uKCkge1xuICAgIG1vZHVsZXMgPSBoYXd0aW9QbHVnaW5Mb2FkZXJbJ21vZHVsZXMnXS5maWx0ZXIoKG5hbWUpID0+IHtcbiAgICAgIHJldHVybiBfLmlzU3RyaW5nKG5hbWUpICYmIG5hbWUgIT09ICduZyc7XG4gICAgfSk7XG4gICAgcmV0dXJuIG5ldyBEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUoKTtcbiAgfSk7XG5cbiAgZXhwb3J0IGNsYXNzIEdyaWRzdGVyRGlyZWN0aXZlIHtcbiAgICBwdWJsaWMgcmVzdHJpY3QgPSAnQSc7XG4gICAgcHVibGljIHJlcGxhY2UgPSB0cnVlO1xuXG4gICAgcHVibGljIGNvbnRyb2xsZXIgPSBbXCIkc2NvcGVcIiwgXCIkZWxlbWVudFwiLCBcIiRhdHRyc1wiLCBcIiRsb2NhdGlvblwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcIiR0ZW1wbGF0ZUNhY2hlXCIsIFwiZGFzaGJvYXJkUmVwb3NpdG9yeVwiLCBcIiRjb21waWxlXCIsIFwiJHRlbXBsYXRlUmVxdWVzdFwiLCBcIiRpbnRlcnBvbGF0ZVwiLCBcIiRtb2RhbFwiLCBcIiRzY2VcIiwgXCIkdGltZW91dFwiLCAoJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzLCAkbG9jYXRpb24sICRyb3V0ZVBhcmFtcywgJHRlbXBsYXRlQ2FjaGUsIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSwgJGNvbXBpbGUsICR0ZW1wbGF0ZVJlcXVlc3QsICRpbnRlcnBvbGF0ZSwgJG1vZGFsLCAkc2NlLCAkdGltZW91dCkgPT4ge1xuXG4gICAgICB2YXIgZ3JpZFNpemUgPSAxNTA7XG4gICAgICB2YXIgZ3JpZE1hcmdpbiA9IDY7XG4gICAgICB2YXIgZ3JpZEhlaWdodDtcblxuICAgICAgdmFyIGdyaWRYID0gZ3JpZFNpemU7XG4gICAgICB2YXIgZ3JpZFkgPSBncmlkU2l6ZTtcblxuICAgICAgdmFyIHdpZGdldE1hcCA9IHt9O1xuXG4gICAgICB2YXIgZGFzaGJvYXJkUmVwb3NpdG9yeTpEYXNoYm9hcmRSZXBvc2l0b3J5ID0gJHNjb3BlLiRldmFsKCdkYXNoYm9hcmRSZXBvc2l0b3J5JykgfHwgZGFzaGJvYXJkUmVwb3NpdG9yeTtcblxuICAgICAgJHNjb3BlLiRvbignJGRlc3Ryb3knLCAoKSA9PiB7XG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaCh3aWRnZXRNYXAsICh3aWRnZXQsIGtleSkgPT4ge1xuICAgICAgICAgIGlmICgnc2NvcGUnIGluIHdpZGdldCkge1xuICAgICAgICAgICAgdmFyIHNjb3BlID0gd2lkZ2V0WydzY29wZSddO1xuICAgICAgICAgICAgc2NvcGUuJGRlc3Ryb3koKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGVzdHJveVdpZGdldCh3aWRnZXQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAkZWxlbWVudC5vbignJGRlc3Ryb3knLCAoKSA9PiB7XG4gICAgICAgICRzY29wZS4kZGVzdHJveSgpO1xuICAgICAgfSk7XG5cbiAgICAgIHNldFRpbWVvdXQodXBkYXRlV2lkZ2V0cywgMTApO1xuXG4gICAgICBmdW5jdGlvbiBkZXN0cm95V2lkZ2V0KHdpZGdldCkge1xuICAgICAgICB2YXIgZ3JpZHN0ZXIgPSBnZXRHcmlkc3RlcigpO1xuICAgICAgICB2YXIgd2lkZ2V0RWxlbSA9IG51bGw7XG4gICAgICAgIC8vIGxldHMgZGVzdHJveSB0aGUgd2lkZ2V0cydzIHNjb3BlXG4gICAgICAgIHZhciB3aWRnZXREYXRhID0gd2lkZ2V0TWFwW3dpZGdldC5pZF07XG4gICAgICAgIGlmICh3aWRnZXREYXRhKSB7XG4gICAgICAgICAgZGVsZXRlIHdpZGdldE1hcFt3aWRnZXQuaWRdO1xuICAgICAgICAgIHdpZGdldEVsZW0gPSB3aWRnZXREYXRhLndpZGdldDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXdpZGdldEVsZW0pIHtcbiAgICAgICAgICAvLyBsZXRzIGdldCB0aGUgbGkgcGFyZW50IGVsZW1lbnQgb2YgdGhlIHRlbXBsYXRlXG4gICAgICAgICAgd2lkZ2V0RWxlbSA9ICRlbGVtZW50LmZpbmQoXCJbZGF0YS13aWRnZXRJZD0nXCIgKyB3aWRnZXQuaWQgKyBcIiddXCIpLnBhcmVudCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChncmlkc3RlciAmJiB3aWRnZXRFbGVtKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGdyaWRzdGVyLnJlbW92ZV93aWRnZXQod2lkZ2V0RWxlbSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAvLyBub3RoaW5nIHRvIGRvLCB3ZSdsbCBkZXN0cm95IHRoZSBlbGVtZW50IGJlbG93XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh3aWRnZXRFbGVtKSB7XG4gICAgICAgICAgbG9nLmRlYnVnKFwiUmVtb3Zpbmcgd2lkZ2V0OiBcIiwgd2lkZ2V0LmlkKTtcbiAgICAgICAgICB3aWRnZXRFbGVtLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlbW92ZVdpZGdldCh3aWRnZXQpIHtcbiAgICAgICAgZGVzdHJveVdpZGdldCh3aWRnZXQpO1xuICAgICAgICAvLyBsZXRzIHRyYXNoIHRoZSBKU09OIG1ldGFkYXRhXG4gICAgICAgIGlmICgkc2NvcGUuZGFzaGJvYXJkKSB7XG4gICAgICAgICAgdmFyIHdpZGdldHMgPSAkc2NvcGUuZGFzaGJvYXJkLndpZGdldHM7XG4gICAgICAgICAgaWYgKHdpZGdldHMpIHtcbiAgICAgICAgICAgIHdpZGdldHMucmVtb3ZlKHdpZGdldCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkoXCJSZW1vdmVkIHdpZGdldCBcIiArIHdpZGdldC50aXRsZSk7XG4gICAgICB9O1xuXG4gICAgICBmdW5jdGlvbiBjaGFuZ2VXaWRnZXRTaXplKHdpZGdldCwgc2l6ZWZ1bmMsIHNhdmVmdW5jKSB7XG4gICAgICAgIGlmICghd2lkZ2V0KSB7XG4gICAgICAgICAgbG9nLmRlYnVnKFwid2lkZ2V0IHVuZGVmaW5lZFwiKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGdyaWRzdGVyID0gZ2V0R3JpZHN0ZXIoKTtcbiAgICAgICAgbG9nLmRlYnVnKFwiV2lkZ2V0IElEOiBcIiwgd2lkZ2V0LmlkLCBcIiB3aWRnZXRNYXA6IFwiLCB3aWRnZXRNYXApO1xuICAgICAgICB2YXIgZW50cnkgPSB3aWRnZXRNYXBbd2lkZ2V0LmlkXTtcbiAgICAgICAgdmFyIHcgPSBlbnRyeS53aWRnZXQ7XG4gICAgICAgIHNpemVmdW5jKGVudHJ5KTtcbiAgICAgICAgZ3JpZHN0ZXIucmVzaXplX3dpZGdldCh3LCBlbnRyeS5zaXplX3gsIGVudHJ5LnNpemVfeSk7XG4gICAgICAgIGdyaWRzdGVyLnNldF9kb21fZ3JpZF9oZWlnaHQoKTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgc2F2ZWZ1bmMod2lkZ2V0KTtcbiAgICAgICAgfSwgNTApO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBvbldpZGdldFJlbmFtZWQod2lkZ2V0KSB7XG4gICAgICAgIHVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkoXCJSZW5hbWVkIHdpZGdldCB0byBcIiArIHdpZGdldC50aXRsZSk7XG4gICAgICB9O1xuXG4gICAgICBmdW5jdGlvbiB1cGRhdGVXaWRnZXRzKCkge1xuICAgICAgICAkc2NvcGUuaWQgPSAkc2NvcGUuJGV2YWwoJ2Rhc2hib2FyZElkJykgfHwgJHJvdXRlUGFyYW1zW1wiZGFzaGJvYXJkSWRcIl07XG4gICAgICAgICRzY29wZS5pZHggPSAkc2NvcGUuJGV2YWwoJ2Rhc2hib2FyZEluZGV4JykgfHwgJHJvdXRlUGFyYW1zW1wiZGFzaGJvYXJkSW5kZXhcIl07XG4gICAgICAgIGlmICgkc2NvcGUuaWQpIHtcbiAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2xvYWREYXNoYm9hcmRzJyk7XG4gICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXREYXNoYm9hcmQoJHNjb3BlLmlkLCBvbkRhc2hib2FyZExvYWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkcygoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdkYXNoYm9hcmRzVXBkYXRlZCcsIGRhc2hib2FyZHMpO1xuXG4gICAgICAgICAgICB2YXIgaWR4ID0gJHNjb3BlLmlkeCA/IHBhcnNlSW50KCRzY29wZS5pZHgpIDogMDtcbiAgICAgICAgICAgIHZhciBpZCA9IG51bGw7XG4gICAgICAgICAgICBpZiAoZGFzaGJvYXJkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIHZhciBkYXNoYm9hcmQgPSBkYXNoYm9hcmRzLmxlbmd0aCA+IGlkeCA/IGRhc2hib2FyZHNbaWR4XSA6IGRhc2hib2FyZFswXTtcbiAgICAgICAgICAgICAgaWQgPSBkYXNoYm9hcmQuaWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoJHNjb3BlLiRldmFsKCdkYXNoYm9hcmRFbWJlZGRlZCcpKSB7XG4gICAgICAgICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZCkge1xuICAgICAgICAgICAgICAkbG9jYXRpb24ucGF0aChcIi9kYXNoYm9hcmQvaWQvXCIgKyBpZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAkbG9jYXRpb24ucGF0aChcIi9kYXNoYm9hcmQvZWRpdFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gb25EYXNoYm9hcmRMb2FkKGRhc2hib2FyZCkge1xuICAgICAgICAkc2NvcGUuZGFzaGJvYXJkID0gZGFzaGJvYXJkO1xuICAgICAgICB2YXIgd2lkZ2V0cyA9ICgoZGFzaGJvYXJkKSA/IGRhc2hib2FyZC53aWRnZXRzIDogbnVsbCkgfHwgW107XG5cbiAgICAgICAgdmFyIG1pbkhlaWdodCA9IDEwO1xuICAgICAgICB2YXIgbWluV2lkdGggPSA2O1xuXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaCh3aWRnZXRzLCAod2lkZ2V0KSA9PiB7XG4gICAgICAgICAgaWYgKCF3aWRnZXQpIHtcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhcIlVuZGVmaW5lZCB3aWRnZXQsIHNraXBwaW5nXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQod2lkZ2V0LnJvdykgJiYgbWluSGVpZ2h0IDwgd2lkZ2V0LnJvdykge1xuICAgICAgICAgICAgbWluSGVpZ2h0ID0gd2lkZ2V0LnJvdyArIDE7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZCh3aWRnZXQuc2l6ZV94XG4gICAgICAgICAgICAgICYmIGFuZ3VsYXIuaXNEZWZpbmVkKHdpZGdldC5jb2wpKSkge1xuICAgICAgICAgICAgdmFyIHJpZ2h0RWRnZSA9IHdpZGdldC5jb2wgKyB3aWRnZXQuc2l6ZV94O1xuICAgICAgICAgICAgaWYgKHJpZ2h0RWRnZSA+IG1pbldpZHRoKSB7XG4gICAgICAgICAgICAgIG1pbldpZHRoID0gcmlnaHRFZGdlICsgMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBncmlkc3RlciA9ICRlbGVtZW50LmdyaWRzdGVyKHtcbiAgICAgICAgICB3aWRnZXRfbWFyZ2luczogW2dyaWRNYXJnaW4sIGdyaWRNYXJnaW5dLFxuICAgICAgICAgIHdpZGdldF9iYXNlX2RpbWVuc2lvbnM6IFtncmlkWCwgZ3JpZFldLFxuICAgICAgICAgIGV4dHJhX3Jvd3M6IG1pbkhlaWdodCxcbiAgICAgICAgICBleHRyYV9jb2xzOiBtaW5XaWR0aCxcbiAgICAgICAgICBtYXhfc2l6ZV94OiBtaW5XaWR0aCxcbiAgICAgICAgICBtYXhfc2l6ZV95OiBtaW5IZWlnaHQsXG4gICAgICAgICAgZHJhZ2dhYmxlOiB7XG4gICAgICAgICAgICBzdG9wOiAoZXZlbnQsIHVpKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChzZXJpYWxpemVEYXNoYm9hcmQoKSkge1xuICAgICAgICAgICAgICAgIHVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkoXCJDaGFuZ2luZyBkYXNoYm9hcmQgbGF5b3V0XCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KS5kYXRhKCdncmlkc3RlcicpO1xuXG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9ICR0ZW1wbGF0ZUNhY2hlLmdldChVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCBcIndpZGdldFRlbXBsYXRlLmh0bWxcIikpO1xuICAgICAgICB2YXIgcmVtYWluaW5nID0gd2lkZ2V0cy5sZW5ndGg7XG5cbiAgICAgICAgZnVuY3Rpb24gbWF5YmVGaW5pc2hVcCgpIHtcbiAgICAgICAgICByZW1haW5pbmcgPSByZW1haW5pbmcgLSAxO1xuICAgICAgICAgIGlmIChyZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgICAgIG1ha2VSZXNpemFibGUoKTtcbiAgICAgICAgICAgIGdldEdyaWRzdGVyKCkuZW5hYmxlKCk7XG4gICAgICAgICAgICBDb3JlLiRhcHBseSgkc2NvcGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGRvUmVtb3ZlV2lkZ2V0KCRtb2RhbCwgd2lkZ2V0KSB7XG4gICAgICAgICAgbG9nLmRlYnVnKFwiUmVtb3ZlIHdpZGdldDogXCIsIHdpZGdldCk7XG4gICAgICAgICAgdmFyIG1vZGFsID0gJG1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdkZWxldGVXaWRnZXRNb2RhbC5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICckbW9kYWxJbnN0YW5jZScsICgkc2NvcGUsICRtb2RhbEluc3RhbmNlKSA9PiB7XG4gICAgICAgICAgICAgICRzY29wZS53aWRnZXQgPSB3aWRnZXQ7XG4gICAgICAgICAgICAgICRzY29wZS5vayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBtb2RhbC5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIHJlbW92ZVdpZGdldCgkc2NvcGUud2lkZ2V0KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIG1vZGFsLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfV1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGRvUmVuYW1lV2lkZ2V0KCRtb2RhbCwgd2lkZ2V0KSB7XG4gICAgICAgICAgbG9nLmRlYnVnKFwiUmVuYW1lIHdpZGdldDogXCIsIHdpZGdldCk7XG4gICAgICAgICAgdmFyIG1vZGFsID0gJG1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdyZW5hbWVXaWRnZXRNb2RhbC5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICckbW9kYWxJbnN0YW5jZScsICgkc2NvcGUsICRtb2RhbEluc3RhbmNlKSA9PiB7XG4gICAgICAgICAgICAgICRzY29wZS53aWRnZXQgPSB3aWRnZXQ7XG4gICAgICAgICAgICAgICRzY29wZS5jb25maWcgPSB7XG4gICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgJ3RpdGxlJzoge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogd2lkZ2V0LnRpdGxlXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAkc2NvcGUub2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgbW9kYWwuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICBvbldpZGdldFJlbmFtZWQoJHNjb3BlLndpZGdldCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBtb2RhbC5kaXNtaXNzKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1dXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBhbmd1bGFyLmZvckVhY2god2lkZ2V0cywgKHdpZGdldCkgPT4ge1xuICAgICAgICAgIHZhciB0eXBlID0gJ2ludGVybmFsJztcbiAgICAgICAgICBpZiAoJ2lmcmFtZScgaW4gd2lkZ2V0KSB7XG4gICAgICAgICAgICB0eXBlID0gJ2V4dGVybmFsJztcbiAgICAgICAgICB9XG4gICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdleHRlcm5hbCc6XG4gICAgICAgICAgICAgIGxvZy5kZWJ1ZyhcIlJlbmRlcmluZyBleHRlcm5hbCAoaWZyYW1lKSB3aWRnZXQ6IFwiLCB3aWRnZXQudGl0bGUgfHwgd2lkZ2V0LmlkKTtcbiAgICAgICAgICAgICAgdmFyIHNjb3BlID0gJHNjb3BlLiRuZXcoKTtcbiAgICAgICAgICAgICAgc2NvcGUud2lkZ2V0ID0gd2lkZ2V0O1xuICAgICAgICAgICAgICBzY29wZS5yZW1vdmVXaWRnZXQgPSAod2lkZ2V0KSA9PiBkb1JlbW92ZVdpZGdldCgkbW9kYWwsIHdpZGdldCk7XG4gICAgICAgICAgICAgIHNjb3BlLnJlbmFtZVdpZGdldCA9ICh3aWRnZXQpID0+IGRvUmVuYW1lV2lkZ2V0KCRtb2RhbCwgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgdmFyIHdpZGdldEJvZHk6YW55ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldChVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAnaWZyYW1lV2lkZ2V0VGVtcGxhdGUuaHRtbCcpKSk7XG4gICAgICAgICAgICAgIHZhciBvdXRlckRpdiA9IGFuZ3VsYXIuZWxlbWVudCgkdGVtcGxhdGVDYWNoZS5nZXQoVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ3dpZGdldEJsb2NrVGVtcGxhdGUuaHRtbCcpKSk7XG4gICAgICAgICAgICAgIHdpZGdldEJvZHkuZmluZCgnaWZyYW1lJykuYXR0cignc3JjJywgd2lkZ2V0LmlmcmFtZSk7XG4gICAgICAgICAgICAgIG91dGVyRGl2LmFwcGVuZCgkY29tcGlsZSh3aWRnZXRCb2R5KShzY29wZSkpO1xuICAgICAgICAgICAgICB2YXIgdyA9IGdyaWRzdGVyLmFkZF93aWRnZXQob3V0ZXJEaXYsIHdpZGdldC5zaXplX3gsIHdpZGdldC5zaXplX3ksIHdpZGdldC5jb2wsIHdpZGdldC5yb3cpO1xuICAgICAgICAgICAgICB3aWRnZXRNYXBbd2lkZ2V0LmlkXSA9IHtcbiAgICAgICAgICAgICAgICB3aWRnZXQ6IHdcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgbWF5YmVGaW5pc2hVcCgpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2ludGVybmFsJzogXG4gICAgICAgICAgICAgIGxvZy5kZWJ1ZyhcIlJlbmRlcmluZyBpbnRlcm5hbCB3aWRnZXQ6IFwiLCB3aWRnZXQudGl0bGUgfHwgd2lkZ2V0LmlkKTtcbiAgICAgICAgICAgICAgdmFyIHBhdGggPSB3aWRnZXQucGF0aDtcbiAgICAgICAgICAgICAgdmFyIHNlYXJjaCA9IG51bGw7XG4gICAgICAgICAgICAgIGlmICh3aWRnZXQuc2VhcmNoKSB7XG4gICAgICAgICAgICAgICAgc2VhcmNoID0gRGFzaGJvYXJkLmRlY29kZVVSSUNvbXBvbmVudFByb3BlcnRpZXMod2lkZ2V0LnNlYXJjaCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHdpZGdldC5yb3V0ZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIF8uZXh0ZW5kKHNlYXJjaCwgYW5ndWxhci5mcm9tSnNvbih3aWRnZXQucm91dGVQYXJhbXMpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB2YXIgaGFzaCA9IHdpZGdldC5oYXNoOyAvLyBUT0RPIGRlY29kZSBvYmplY3Q/XG4gICAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IG5ldyBSZWN0YW5nbGVMb2NhdGlvbigkbG9jYXRpb24sIHBhdGgsIHNlYXJjaCwgaGFzaCk7XG4gICAgICAgICAgICAgIGlmICghd2lkZ2V0LnNpemVfeCB8fCB3aWRnZXQuc2l6ZV94IDwgMSkge1xuICAgICAgICAgICAgICAgIHdpZGdldC5zaXplX3ggPSAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmICghd2lkZ2V0LnNpemVfeSB8fCB3aWRnZXQuc2l6ZV95IDwgMSkge1xuICAgICAgICAgICAgICAgIHdpZGdldC5zaXplX3kgPSAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHZhciB0bXBNb2R1bGVOYW1lID0gJ2Rhc2hib2FyZC0nICsgd2lkZ2V0LmlkO1xuICAgICAgICAgICAgICB2YXIgcGx1Z2lucyA9IF8uZmlsdGVyKGhhd3Rpb1BsdWdpbkxvYWRlci5nZXRNb2R1bGVzKCksIChtb2R1bGUpID0+IGFuZ3VsYXIuaXNTdHJpbmcobW9kdWxlKSk7XG4gICAgICAgICAgICAgIHZhciB0bXBNb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSh0bXBNb2R1bGVOYW1lLCBwbHVnaW5zKTtcblxuICAgICAgICAgICAgICBmdW5jdGlvbiBnZXRTZXJ2aWNlcyhtb2R1bGU6c3RyaW5nLCBhbnN3ZXI/OmFueSkge1xuICAgICAgICAgICAgICAgIGlmICghYW5zd2VyKSB7XG4gICAgICAgICAgICAgICAgICBhbnN3ZXIgPSA8YW55Pnt9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfLmZvckVhY2goYW5ndWxhci5tb2R1bGUobW9kdWxlKS5yZXF1aXJlcywgKG0pID0+IGdldFNlcnZpY2VzKG0sIGFuc3dlcikpO1xuICAgICAgICAgICAgICAgIF8uZm9yRWFjaCgoPGFueT5hbmd1bGFyLm1vZHVsZShtb2R1bGUpKS5faW52b2tlUXVldWUsIChhKSA9PiB7XG4gICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBhbnN3ZXJbYVsyXVswXV0gPSBIYXd0aW9Db3JlLmluamVjdG9yLmdldChhWzJdWzBdKTtcbiAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAvL25vdGhpbmcgdG8gZG9cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYW5zd2VyO1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB2YXIgc2VydmljZXMgPSB7fTtcbiAgICAgICAgICAgICAgXy5mb3JFYWNoKHBsdWdpbnMsIChwbHVnaW46c3RyaW5nKSA9PiBwbHVnaW4gPyBnZXRTZXJ2aWNlcyhwbHVnaW4sIHNlcnZpY2VzKSA6IGNvbnNvbGUubG9nKFwibnVsbCBwbHVnaW4gbmFtZVwiKSk7XG4gICAgICAgICAgICAgIC8vbG9nLmRlYnVnKFwic2VydmljZXM6IFwiLCBzZXJ2aWNlcyk7XG5cbiAgICAgICAgICAgICAgdG1wTW9kdWxlLmNvbmZpZyhbJyRwcm92aWRlJywgKCRwcm92aWRlKSA9PiB7XG4gICAgICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKCdIYXd0aW9EYXNoYm9hcmQnLCBbJyRkZWxlZ2F0ZScsICckcm9vdFNjb3BlJywgKCRkZWxlZ2F0ZSwgJHJvb3RTY29wZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgJGRlbGVnYXRlLmluRGFzaGJvYXJkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiAkZGVsZWdhdGU7XG4gICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcignJGxvY2F0aW9uJywgWyckZGVsZWdhdGUnLCAoJGRlbGVnYXRlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAvL2xvZy5kZWJ1ZyhcIlVzaW5nICRsb2NhdGlvbjogXCIsIGxvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBsb2NhdGlvbjtcbiAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKCckcm91dGUnLCBbJyRkZWxlZ2F0ZScsICgkZGVsZWdhdGUpID0+IHtcbiAgICAgICAgICAgICAgICAgIC8vIHJlYWxseSBoYW5keSBmb3IgZGVidWdnaW5nLCBtb3N0bHkgdG8gdGVsbCBpZiBhIHdpZGdldCdzIHJvdXRlXG4gICAgICAgICAgICAgICAgICAvLyBpc24ndCBhY3R1YWxseSBhdmFpbGFibGUgaW4gdGhlIGNoaWxkIGFwcFxuICAgICAgICAgICAgICAgICAgLy9sb2cuZGVidWcoXCJVc2luZyAkcm91dGU6IFwiLCAkZGVsZWdhdGUpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuICRkZWxlZ2F0ZTtcbiAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKCckcm91dGVQYXJhbXMnLCBbJyRkZWxlZ2F0ZScsICgkZGVsZWdhdGUpID0+IHtcbiAgICAgICAgICAgICAgICAgIC8vbG9nLmRlYnVnKFwiVXNpbmcgJHJvdXRlUGFyYW1zOiBcIiwgc2VhcmNoKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBzZWFyY2g7XG4gICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgIF8uZm9ySW4oc2VydmljZXMsIChzZXJ2aWNlLCBuYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgICBzd2l0Y2gobmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICckbG9jYXRpb24nOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICckcm91dGUnOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICckcm91dGVQYXJhbXMnOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICdIYXd0aW9EYXNoYm9hcmQnOlxuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdkYXNoYm9hcmRSZXBvc2l0b3J5JzpcbiAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKG5hbWUsIFsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcblxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnSGF3dGlvRGFzaGJvYXJkVGFiJzpcbiAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKG5hbWUsIFsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IGVtYmVkZGVkOiB0cnVlIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ0J1aWxkZXJGYWN0b3J5UHJvdmlkZXInOlxuICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IobmFtZSwgWygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdldER1bW15QnVpbGRlckZhY3RvcnkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcblxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnSGF3dGlvTmF2JzpcbiAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKG5hbWUsIFsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXREdW1teUhhd3Rpb05hdigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm90aGluZyB0byBkb1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAvL2xvZy5kZWJ1ZyhcIm5hbWU6IFwiLCBuYW1lLCBcIiBzZXJ2aWNlOiBcIiwgc2VydmljZSk7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKF8uc3RhcnRzV2l0aChuYW1lLCAnJCcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IobmFtZSwgWygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nLmRlYnVnKFwiUmV0dXJuaW5nIGV4aXN0aW5nIHNlcnZpY2UgZm9yOiBcIiwgbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXJ2aWNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWdub3JlLCB0aGlzJ2xsIGhhcHBlbiBmb3IgY29uc3RhbnRzIGFuZCBzdHVmZlxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICB0bXBNb2R1bGUuY29udHJvbGxlcignSGF3dGlvRGFzaGJvYXJkLlRpdGxlJywgW1wiJHNjb3BlXCIsIFwiJG1vZGFsXCIsICgkc2NvcGUsICRtb2RhbCkgPT4ge1xuICAgICAgICAgICAgICAgICRzY29wZS53aWRnZXQgPSB3aWRnZXQ7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnJlbW92ZVdpZGdldCA9ICh3aWRnZXQpID0+IGRvUmVtb3ZlV2lkZ2V0KCRtb2RhbCwgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgICAkc2NvcGUucmVuYW1lV2lkZ2V0ID0gKHdpZGdldCkgPT4gZG9SZW5hbWVXaWRnZXQoJG1vZGFsLCB3aWRnZXQpO1xuICAgICAgICAgICAgICB9XSk7XG5cbiAgICAgICAgICAgICAgdmFyIGRpdjphbnkgPSAkKHRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgZGl2LmF0dHIoeyAnZGF0YS13aWRnZXRJZCc6IHdpZGdldC5pZCB9KTtcbiAgICAgICAgICAgICAgdmFyIGJvZHkgPSBkaXYuZmluZCgnLndpZGdldC1ib2R5Jyk7XG4gICAgICAgICAgICAgIGxvZy5kZWJ1ZyhcImluY2x1ZGU6IFwiLCB3aWRnZXQuaW5jbHVkZSk7XG4gICAgICAgICAgICAgIHZhciB3aWRnZXRCb2R5ID0gJHRlbXBsYXRlQ2FjaGUuZ2V0KHdpZGdldC5pbmNsdWRlKTtcbiAgICAgICAgICAgICAgJHRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHZhciBvdXRlckRpdiA9IGFuZ3VsYXIuZWxlbWVudCgkdGVtcGxhdGVDYWNoZS5nZXQoVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ3dpZGdldEJsb2NrVGVtcGxhdGUuaHRtbCcpKSk7XG4gICAgICAgICAgICAgICAgYm9keS5odG1sKHdpZGdldEJvZHkpO1xuICAgICAgICAgICAgICAgIG91dGVyRGl2Lmh0bWwoZGl2KTtcbiAgICAgICAgICAgICAgICBhbmd1bGFyLmJvb3RzdHJhcChkaXYsIFt0bXBNb2R1bGVOYW1lXSk7XG4gICAgICAgICAgICAgICAgd2lkZ2V0TWFwW3dpZGdldC5pZF0gPSB7XG4gICAgICAgICAgICAgICAgICB3aWRnZXQ6IGdyaWRzdGVyLmFkZF93aWRnZXQob3V0ZXJEaXYsIHdpZGdldC5zaXplX3gsIHdpZGdldC5zaXplX3ksIHdpZGdldC5jb2wsIHdpZGdldC5yb3cpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBtYXliZUZpbmlzaFVwKCk7XG4gICAgICAgICAgICAgIH0sIDUwKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gc2VyaWFsaXplRGFzaGJvYXJkKCkge1xuICAgICAgICB2YXIgZ3JpZHN0ZXIgPSBnZXRHcmlkc3RlcigpO1xuICAgICAgICBpZiAoZ3JpZHN0ZXIpIHtcbiAgICAgICAgICB2YXIgZGF0YSA9IGdyaWRzdGVyLnNlcmlhbGl6ZSgpO1xuICAgICAgICAgIC8vY29uc29sZS5sb2coXCJnb3QgZGF0YTogXCIgKyBKU09OLnN0cmluZ2lmeShkYXRhKSk7XG5cbiAgICAgICAgICB2YXIgd2lkZ2V0cyA9ICRzY29wZS5kYXNoYm9hcmQud2lkZ2V0cyB8fCBbXTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIldpZGdldHM6IFwiLCB3aWRnZXRzKTtcblxuICAgICAgICAgIC8vIGxldHMgYXNzdW1lIHRoZSBkYXRhIGlzIGluIHRoZSBvcmRlciBvZiB0aGUgd2lkZ2V0cy4uLlxuICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaCh3aWRnZXRzLCAod2lkZ2V0LCBpZHgpID0+IHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGRhdGFbaWR4XTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB3aWRnZXQpIHtcbiAgICAgICAgICAgICAgLy8gbGV0cyBjb3B5IHRoZSB2YWx1ZXMgYWNyb3NzXG4gICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaCh2YWx1ZSwgKGF0dHIsIGtleSkgPT4gd2lkZ2V0W2tleV0gPSBhdHRyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG1ha2VSZXNpemFibGUoKSB7XG4gICAgICAgIHZhciBibG9ja3M6YW55ID0gJCgnLmdyaWQtYmxvY2snKTtcbiAgICAgICAgYmxvY2tzLnJlc2l6YWJsZSgnZGVzdHJveScpO1xuXG4gICAgICAgIGJsb2Nrcy5yZXNpemFibGUoe1xuICAgICAgICAgIGdyaWQ6IFtncmlkU2l6ZSArIChncmlkTWFyZ2luICogMiksIGdyaWRTaXplICsgKGdyaWRNYXJnaW4gKiAyKV0sXG4gICAgICAgICAgYW5pbWF0ZTogZmFsc2UsXG4gICAgICAgICAgbWluV2lkdGg6IGdyaWRTaXplLFxuICAgICAgICAgIG1pbkhlaWdodDogZ3JpZFNpemUsXG4gICAgICAgICAgYXV0b0hpZGU6IGZhbHNlLFxuICAgICAgICAgIHN0YXJ0OiBmdW5jdGlvbihldmVudCwgdWkpIHtcbiAgICAgICAgICAgIGdyaWRIZWlnaHQgPSBnZXRHcmlkc3RlcigpLiRlbC5oZWlnaHQoKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlc2l6ZTogZnVuY3Rpb24oZXZlbnQsIHVpKSB7XG4gICAgICAgICAgICAvL3NldCBuZXcgZ3JpZCBoZWlnaHQgYWxvbmcgdGhlIGRyYWdnaW5nIHBlcmlvZFxuICAgICAgICAgICAgdmFyIGcgPSBnZXRHcmlkc3RlcigpO1xuICAgICAgICAgICAgdmFyIGRlbHRhID0gZ3JpZFNpemUgKyBncmlkTWFyZ2luICogMjtcbiAgICAgICAgICAgIGlmIChldmVudC5vZmZzZXRZID4gZy4kZWwuaGVpZ2h0KCkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHZhciBleHRyYSA9IE1hdGguZmxvb3IoKGV2ZW50Lm9mZnNldFkgLSBncmlkSGVpZ2h0KSAvIGRlbHRhICsgMSk7XG4gICAgICAgICAgICAgIHZhciBuZXdIZWlnaHQgPSBncmlkSGVpZ2h0ICsgZXh0cmEgKiBkZWx0YTtcbiAgICAgICAgICAgICAgZy4kZWwuY3NzKCdoZWlnaHQnLCBuZXdIZWlnaHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgc3RvcDogZnVuY3Rpb24oZXZlbnQsIHVpKSB7XG4gICAgICAgICAgICB2YXIgcmVzaXplZCA9ICQodGhpcyk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXNpemVCbG9jayhyZXNpemVkKTtcbiAgICAgICAgICAgIH0sIDMwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAkKCcudWktcmVzaXphYmxlLWhhbmRsZScpLmhvdmVyKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGdldEdyaWRzdGVyKCkuZGlzYWJsZSgpO1xuICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBnZXRHcmlkc3RlcigpLmVuYWJsZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgfVxuXG5cbiAgICAgIGZ1bmN0aW9uIHJlc2l6ZUJsb2NrKGVsbU9iaikge1xuICAgICAgICB2YXIgYXJlYSA9IGVsbU9iai5maW5kKCcud2lkZ2V0LWFyZWEnKTtcbiAgICAgICAgdmFyIHcgPSBlbG1PYmoud2lkdGgoKSAtIGdyaWRTaXplO1xuICAgICAgICB2YXIgaCA9IGVsbU9iai5oZWlnaHQoKSAtIGdyaWRTaXplO1xuXG4gICAgICAgIGZvciAodmFyIGdyaWRfdyA9IDE7IHcgPiAwOyB3IC09IChncmlkU2l6ZSArIChncmlkTWFyZ2luICogMikpKSB7XG4gICAgICAgICAgZ3JpZF93Kys7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBncmlkX2ggPSAxOyBoID4gMDsgaCAtPSAoZ3JpZFNpemUgKyAoZ3JpZE1hcmdpbiAqIDIpKSkge1xuICAgICAgICAgIGdyaWRfaCsrO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHdpZGdldCA9IHtcbiAgICAgICAgICBpZDogYXJlYS5hdHRyKCdkYXRhLXdpZGdldElkJylcbiAgICAgICAgfTtcblxuICAgICAgICBjaGFuZ2VXaWRnZXRTaXplKHdpZGdldCwgZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgICAgICAgd2lkZ2V0LnNpemVfeCA9IGdyaWRfdztcbiAgICAgICAgICB3aWRnZXQuc2l6ZV95ID0gZ3JpZF9oO1xuICAgICAgICB9LCBmdW5jdGlvbih3aWRnZXQpIHtcbiAgICAgICAgICBpZiAoc2VyaWFsaXplRGFzaGJvYXJkKCkpIHtcbiAgICAgICAgICAgIHVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkoXCJDaGFuZ2VkIHNpemUgb2Ygd2lkZ2V0OiBcIiArIHdpZGdldC5pZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiB1cGRhdGVEYXNoYm9hcmRSZXBvc2l0b3J5KG1lc3NhZ2U6IHN0cmluZykge1xuICAgICAgICBpZiAoJHNjb3BlLmRhc2hib2FyZCkge1xuICAgICAgICAgIHZhciBjb21taXRNZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICBpZiAoJHNjb3BlLmRhc2hib2FyZCAmJiAkc2NvcGUuZGFzaGJvYXJkLnRpdGxlKSB7XG4gICAgICAgICAgICBjb21taXRNZXNzYWdlICs9IFwiIG9uIGRhc2hib2FyZCBcIiArICRzY29wZS5kYXNoYm9hcmQudGl0bGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbJHNjb3BlLmRhc2hib2FyZF0sIGNvbW1pdE1lc3NhZ2UsIERhc2hib2FyZC5vbk9wZXJhdGlvbkNvbXBsZXRlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBnZXRHcmlkc3RlcigpIHtcbiAgICAgICAgcmV0dXJuICRlbGVtZW50LmdyaWRzdGVyKCkuZGF0YSgnZ3JpZHN0ZXInKTtcbiAgICAgIH1cblxuICAgIH1dO1xuXG4gIH1cblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG4gIF9tb2R1bGUuY29udHJvbGxlcihcIkRhc2hib2FyZC5JbXBvcnRDb250cm9sbGVyXCIsIFtcIiRzY29wZVwiLCBcIiRsb2NhdGlvblwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgKCRzY29wZSwgJGxvY2F0aW9uLCAkcm91dGVQYXJhbXMsIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSkgPT4ge1xuICAgICRzY29wZS5wbGFjZWhvbGRlciA9IFwiUGFzdGUgdGhlIEpTT04gaGVyZSBmb3IgdGhlIGRhc2hib2FyZCBjb25maWd1cmF0aW9uIHRvIGltcG9ydC4uLlwiO1xuICAgICRzY29wZS5zb3VyY2UgPSAkc2NvcGUucGxhY2Vob2xkZXI7XG5cbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIG1vZGU6IHtcbiAgICAgICAgbmFtZTogXCJqYXZhc2NyaXB0XCJcbiAgICAgIH1cbiAgICB9O1xuICAgIC8vJHNjb3BlLmNvZGVNaXJyb3JPcHRpb25zID0gQ29kZUVkaXRvci5jcmVhdGVFZGl0b3JTZXR0aW5ncyhvcHRpb25zKTtcblxuXG4gICAgJHNjb3BlLmlzVmFsaWQgPSAoKSA9PiAkc2NvcGUuc291cmNlICYmICRzY29wZS5zb3VyY2UgIT09ICRzY29wZS5wbGFjZWhvbGRlcjtcblxuICAgICRzY29wZS5pbXBvcnRKU09OID0gKCkgPT4ge1xuICAgICAgdmFyIGpzb24gPSBbXTtcbiAgICAgIC8vIGxldHMgcGFyc2UgdGhlIEpTT04uLi5cbiAgICAgIHRyeSB7XG4gICAgICAgIGpzb24gPSBKU09OLnBhcnNlKCRzY29wZS5zb3VyY2UpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvL0hhd3Rpb0NvcmUubm90aWZpY2F0aW9uKFwiZXJyb3JcIiwgXCJDb3VsZCBub3QgcGFyc2UgdGhlIEpTT05cXG5cIiArIGUpO1xuICAgICAgICBqc29uID0gW107XG4gICAgICB9XG4gICAgICB2YXIgYXJyYXkgPSBbXTtcbiAgICAgIGlmIChhbmd1bGFyLmlzQXJyYXkoanNvbikpIHtcbiAgICAgICAgYXJyYXkgPSBqc29uO1xuICAgICAgfSBlbHNlIGlmIChhbmd1bGFyLmlzT2JqZWN0KGpzb24pKSB7XG4gICAgICAgIGFycmF5LnB1c2goanNvbik7XG4gICAgICB9XG5cbiAgICAgIGlmIChhcnJheS5sZW5ndGgpIHtcbiAgICAgICAgLy8gbGV0cyBlbnN1cmUgd2UgaGF2ZSBzb21lIHZhbGlkIGlkcyBhbmQgc3R1ZmYuLi5cbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKGFycmF5LCAoZGFzaCwgaW5kZXgpID0+IHtcbiAgICAgICAgICBhbmd1bGFyLmNvcHkoZGFzaCwgZGFzaGJvYXJkUmVwb3NpdG9yeS5jcmVhdGVEYXNoYm9hcmQoZGFzaCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKGFycmF5LCBcIkltcG9ydGVkIGRhc2hib2FyZCBKU09OXCIsIERhc2hib2FyZC5vbk9wZXJhdGlvbkNvbXBsZXRlKTtcbiAgICAgICAgJGxvY2F0aW9uLnBhdGgoXCIvZGFzaGJvYXJkL2VkaXRcIik7XG4gICAgICB9XG4gICAgfVxuICB9XSk7XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcbiAgX21vZHVsZS5jb250cm9sbGVyKFwiRGFzaGJvYXJkLk5hdkJhckNvbnRyb2xsZXJcIiwgW1wiJHNjb3BlXCIsIFwiJHJvdXRlUGFyYW1zXCIsIFwiJHJvb3RTY29wZVwiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgKCRzY29wZSwgJHJvdXRlUGFyYW1zLCAkcm9vdFNjb3BlLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnkpID0+IHtcblxuICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IFtdO1xuXG4gICAgJHNjb3BlLmFjdGl2ZURhc2hib2FyZCA9ICRyb3V0ZVBhcmFtc1snZGFzaGJvYXJkSWQnXTtcblxuICAgICRzY29wZS4kb24oJ2xvYWREYXNoYm9hcmRzJywgbG9hZERhc2hib2FyZHMpO1xuXG4gICAgJHNjb3BlLiRvbignZGFzaGJvYXJkc1VwZGF0ZWQnLCBkYXNoYm9hcmRMb2FkZWQpO1xuXG4gICAgJHNjb3BlLmRhc2hib2FyZHMgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gJHNjb3BlLl9kYXNoYm9hcmRzXG4gICAgfTtcblxuICAgICRzY29wZS5vblRhYlJlbmFtZWQgPSBmdW5jdGlvbihkYXNoKSB7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoW2Rhc2hdLCBcIlJlbmFtZWQgZGFzaGJvYXJkXCIsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBkYXNoYm9hcmRMb2FkZWQoZXZlbnQsIGRhc2hib2FyZHMpIHtcbiAgICAgIGxvZy5kZWJ1ZyhcIm5hdmJhciBkYXNoYm9hcmRMb2FkZWQ6IFwiLCBkYXNoYm9hcmRzKTtcbiAgICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IGRhc2hib2FyZHM7XG4gICAgICBpZiAoZXZlbnQgPT09IG51bGwpIHtcbiAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdkYXNoYm9hcmRzVXBkYXRlZCcsIGRhc2hib2FyZHMpO1xuICAgICAgICBDb3JlLiRhcHBseSgkc2NvcGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvYWREYXNoYm9hcmRzKGV2ZW50KSB7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZHMoKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgLy8gcHJldmVudCB0aGUgYnJvYWRjYXN0IGZyb20gaGFwcGVuaW5nLi4uXG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfV0pO1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG4gIGV4cG9ydCB2YXIgU2hhcmVDb250cm9sbGVyID0gX21vZHVsZS5jb250cm9sbGVyKFwiRGFzaGJvYXJkLlNoYXJlQ29udHJvbGxlclwiLCBbXCIkc2NvcGVcIiwgXCIkbG9jYXRpb25cIiwgXCIkcm91dGVQYXJhbXNcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsICgkc2NvcGUsICRsb2NhdGlvbiwgJHJvdXRlUGFyYW1zLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnkpID0+IHtcbiAgICB2YXIgaWQgPSAkcm91dGVQYXJhbXNbXCJkYXNoYm9hcmRJZFwiXTtcbiAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZChpZCwgb25EYXNoYm9hcmRMb2FkKTtcblxuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgbW9kZToge1xuICAgICAgICAgIG5hbWU6IFwiamF2YXNjcmlwdFwiXG4gICAgICB9XG4gICAgfTtcbiAgICAvLyRzY29wZS5jb2RlTWlycm9yT3B0aW9ucyA9IENvZGVFZGl0b3IuY3JlYXRlRWRpdG9yU2V0dGluZ3Mob3B0aW9ucyk7XG5cbiAgICBmdW5jdGlvbiBvbkRhc2hib2FyZExvYWQoZGFzaGJvYXJkKSB7XG4gICAgICAkc2NvcGUuZGFzaGJvYXJkID0gRGFzaGJvYXJkLmNsZWFuRGFzaGJvYXJkRGF0YShkYXNoYm9hcmQpO1xuXG4gICAgICAkc2NvcGUuanNvbiA9IHtcbiAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcImhhd3RpbyBkYXNoYm9hcmRzXCIsXG4gICAgICAgIFwicHVibGljXCI6IHRydWUsXG4gICAgICAgIFwiZmlsZXNcIjoge1xuICAgICAgICAgIFwiZGFzaGJvYXJkcy5qc29uXCI6IHtcbiAgICAgICAgICAgIFwiY29udGVudFwiOiBKU09OLnN0cmluZ2lmeSgkc2NvcGUuZGFzaGJvYXJkLCBudWxsLCBcIiAgXCIpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuc291cmNlID0gSlNPTi5zdHJpbmdpZnkoJHNjb3BlLmRhc2hib2FyZCwgbnVsbCwgXCIgIFwiKTtcbiAgICAgIENvcmUuJGFwcGx5Tm93T3JMYXRlcigkc2NvcGUpO1xuICAgIH1cbiAgfV0pO1xufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

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