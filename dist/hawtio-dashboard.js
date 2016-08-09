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
            if (dash && dash.inDashboard) {
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
            if ('userDashboards' in this.localStorage) {
                Dashboard.log.debug("Found previously saved dashboards");
            }
            else {
                Dashboard.log.debug("Storing pre-defined dashboards");
                this.storeDashboards(defaults.getAll());
            }
        }
        LocalDashboardRepository.prototype.loadDashboards = function () {
            var answer = angular.fromJson(localStorage['userDashboards']);
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
                var existing = _.findIndex(dashboards, function (d) { return d.id === dash.id; });
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
                _.remove(dashboards, function (i) { return i.id === item.id; });
            });
            fn(this.storeDashboards(dashboards));
        };
        LocalDashboardRepository.prototype.getDashboards = function (fn) {
            fn(this.loadDashboards());
        };
        LocalDashboardRepository.prototype.getDashboard = function (id, fn) {
            var dashboards = this.loadDashboards();
            var dashboard = _.find(dashboards, function (dashboard) { return dashboard.id === id; });
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
                    iframe = URI.decode(iframe);
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
                    sizeStr = URI.decode(sizeStr);
                }
                var size = angular.fromJson(sizeStr) || { size_x: 1, size_y: 1 };
                var title = URI.decode(config['title'] || '');
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
                    if (!selectedItem.widgets.length) {
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
                            if (!_.some(selectedItem.widgets, function (w) {
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
                    Dashboard.log.debug("Loaded dashboards: ", dashboards);
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
                            widgetElem.remove();
                        }
                    }
                    function removeWidget(widget) {
                        destroyWidget(widget);
                        if ($scope.dashboard) {
                            var widgets = $scope.dashboard.widgets;
                            if (widgets) {
                                var w = _.remove(widgets, function (w) { return w.id === widget.id; });
                                Dashboard.log.debug("Removed widget:", w);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluY2x1ZGVzLmpzIiwiZGFzaGJvYXJkL3RzL2Rhc2hib2FyZEludGVyZmFjZXMudHMiLCJkYXNoYm9hcmQvdHMvZGFzaGJvYXJkSGVscGVycy50cyIsImRhc2hib2FyZC90cy9kYXNoYm9hcmRQbHVnaW4udHMiLCJkYXNoYm9hcmQvdHMvZGFzaGJvYXJkUmVwb3NpdG9yeS50cyIsImRhc2hib2FyZC90cy9lZGl0RGFzaGJvYXJkcy50cyIsImRhc2hib2FyZC90cy9yZWN0YW5nbGVMb2NhdGlvbi50cyIsImRhc2hib2FyZC90cy9ncmlkc3RlckRpcmVjdGl2ZS50cyIsImRhc2hib2FyZC90cy9pbXBvcnQudHMiLCJkYXNoYm9hcmQvdHMvbmF2YmFyLnRzIiwiZGFzaGJvYXJkL3RzL3NoYXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUNxREM7O0FDakRELElBQU8sU0FBUyxDQTJJZjtBQTNJRCxXQUFPLFNBQVMsRUFBQyxDQUFDO0lBRUwsc0JBQVksR0FBRyx5QkFBeUIsQ0FBQztJQUN6QyxvQkFBVSxHQUFHLFdBQVcsQ0FBQztJQUV6QixhQUFHLEdBQWtCLE1BQU0sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQVUvRCw0QkFBbUMsSUFBSTtRQUNyQyxJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFDbkIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsVUFBQyxLQUFLLEVBQUUsR0FBRztZQUMvQixFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3RSxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQ3pCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztR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QUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDN0QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2hDLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ04sQ0FBQyxFQTdCTSxTQUFTLEtBQVQsU0FBUyxRQTZCZiIsImZpbGUiOiJjb21waWxlZC5qcyIsInNvdXJjZXNDb250ZW50IjpbbnVsbCwibW9kdWxlIERhc2hib2FyZCB7XG5cbiAgZXhwb3J0IGludGVyZmFjZSBEYXNoYm9hcmRTZXJ2aWNlIHtcbiAgICBoYXNEYXNoYm9hcmQ6Ym9vbGVhbjtcbiAgICBpbkRhc2hib2FyZDpib29sZWFuO1xuICAgIGdldEFkZExpbmsodGl0bGU/OnN0cmluZywgd2lkdGg/Om51bWJlciwgaGVpZ2h0PzpudW1iZXIpOnN0cmluZztcbiAgfVxuXG4gIGV4cG9ydCBpbnRlcmZhY2UgU2VhcmNoTWFwIHtcbiAgICBbbmFtZTogc3RyaW5nXTogc3RyaW5nO1xuICB9XG5cbiAgZXhwb3J0IGludGVyZmFjZSBEYXNoYm9hcmRXaWRnZXQge1xuICAgIGlkOiBzdHJpbmc7XG4gICAgdGl0bGU6IHN0cmluZztcbiAgICByb3c/OiBudW1iZXI7XG4gICAgY29sPzogbnVtYmVyO1xuICAgIHNpemVfeD86IG51bWJlcjtcbiAgICBzaXplX3k/OiBudW1iZXI7XG4gICAgcGF0aD86IHN0cmluZztcbiAgICB1cmw/OiBzdHJpbmc7XG4gICAgaW5jbHVkZT86IHN0cmluZztcbiAgICBzZWFyY2g/OiBTZWFyY2hNYXBcbiAgICByb3V0ZVBhcmFtcz86IHN0cmluZztcbiAgfVxuXG4gIGV4cG9ydCBpbnRlcmZhY2UgRGFzaGJvYXJkIHtcbiAgICBpZDogc3RyaW5nO1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgZ3JvdXA6IHN0cmluZztcbiAgICB3aWRnZXRzOiBBcnJheTxEYXNoYm9hcmRXaWRnZXQ+O1xuICB9XG5cbiAgZXhwb3J0IGludGVyZmFjZSBEZWZhdWx0RGFzaGJvYXJkcyB7XG4gICAgYWRkOiAoZGFzaGJhcmQ6RGFzaGJvYXJkKSA9PiB2b2lkO1xuICAgIHJlbW92ZTogKGlkOnN0cmluZykgPT4gRGFzaGJvYXJkO1xuICAgIGdldEFsbDogKCkgPT4gQXJyYXk8RGFzaGJvYXJkPjtcbiAgfVxuXG4gIC8qKlxuICAgKiBCYXNlIGludGVyZmFjZSB0aGF0IGRhc2hib2FyZCByZXBvc2l0b3JpZXMgbXVzdCBpbXBsZW1lbnRcbiAgICpcbiAgICogQGNsYXNzIERhc2hib2FyZFJlcG9zaXRvcnlcbiAgICovXG4gIGV4cG9ydCBpbnRlcmZhY2UgRGFzaGJvYXJkUmVwb3NpdG9yeSB7XG4gICAgcHV0RGFzaGJvYXJkczogKGFycmF5OmFueVtdLCBjb21taXRNZXNzYWdlOnN0cmluZywgZm4pID0+IGFueTtcbiAgICBkZWxldGVEYXNoYm9hcmRzOiAoYXJyYXk6QXJyYXk8RGFzaGJvYXJkPiwgZm4pID0+IGFueTtcbiAgICBnZXREYXNoYm9hcmRzOiAoZm46KGRhc2hib2FyZHM6IEFycmF5PERhc2hib2FyZD4pID0+IHZvaWQpID0+IHZvaWQ7XG4gICAgZ2V0RGFzaGJvYXJkOiAoaWQ6c3RyaW5nLCBmbjogKGRhc2hib2FyZDogRGFzaGJvYXJkKSA9PiB2b2lkKSA9PiBhbnk7XG4gICAgY3JlYXRlRGFzaGJvYXJkOiAob3B0aW9uczphbnkpID0+IGFueTtcbiAgICBjbG9uZURhc2hib2FyZDooZGFzaGJvYXJkOmFueSkgPT4gYW55O1xuICAgIGdldFR5cGU6KCkgPT4gc3RyaW5nO1xuICB9XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9pbmNsdWRlcy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRJbnRlcmZhY2VzLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcbiAgXG4gIGV4cG9ydCB2YXIgdGVtcGxhdGVQYXRoID0gJ3BsdWdpbnMvZGFzaGJvYXJkL2h0bWwvJztcbiAgZXhwb3J0IHZhciBwbHVnaW5OYW1lID0gJ2Rhc2hib2FyZCc7XG5cbiAgZXhwb3J0IHZhciBsb2c6TG9nZ2luZy5Mb2dnZXIgPSBMb2dnZXIuZ2V0KCdoYXd0aW8tZGFzaGJvYXJkJyk7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNsZWFuZWQgdXAgdmVyc2lvbiBvZiB0aGUgZGFzaGJvYXJkIGRhdGEgd2l0aG91dCBhbnkgVUkgc2VsZWN0aW9uIHN0YXRlXG4gICAqIEBtZXRob2QgY2xlYW5EYXNoYm9hcmREYXRhXG4gICAqIEBzdGF0aWNcbiAgICogQGZvciBEYXNoYm9hcmRcbiAgICogQHBhcmFtIHthbnl9IGl0ZW1cbiAgICogQHJldHVybiB7YW55fVxuICAgKi9cbiAgZXhwb3J0IGZ1bmN0aW9uIGNsZWFuRGFzaGJvYXJkRGF0YShpdGVtKSB7XG4gICAgdmFyIGNsZWFuSXRlbSA9IHt9O1xuICAgIGFuZ3VsYXIuZm9yRWFjaChpdGVtLCAodmFsdWUsIGtleSkgPT4ge1xuICAgICAgaWYgKCFhbmd1bGFyLmlzU3RyaW5nKGtleSkgfHwgKCFrZXkuc3RhcnRzV2l0aChcIiRcIikgJiYgIWtleS5zdGFydHNXaXRoKFwiX1wiKSkpIHtcbiAgICAgICAgY2xlYW5JdGVtW2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gY2xlYW5JdGVtO1xuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgZGVjb2RlVVJJQ29tcG9uZW50KCkgb24gZWFjaCB2YWx1ZSBpbiB0aGUgb2JqZWN0XG4gICAqIEBtZXRob2QgZGVjb2RlVVJJQ29tcG9uZW50UHJvcGVydGllc1xuICAgKiBAc3RhdGljXG4gICAqIEBmb3IgRGFzaGJvYXJkXG4gICAqIEBwYXJhbSB7YW55fSBoYXNoXG4gICAqIEByZXR1cm4ge2FueX1cbiAgICovXG4gIGV4cG9ydCBmdW5jdGlvbiBkZWNvZGVVUklDb21wb25lbnRQcm9wZXJ0aWVzKGhhc2gpIHtcbiAgICBpZiAoIWhhc2gpIHtcbiAgICAgIHJldHVybiBoYXNoO1xuICAgIH1cbiAgICB2YXIgZGVjb2RlSGFzaCA9IHt9O1xuICAgIGFuZ3VsYXIuZm9yRWFjaChoYXNoLCAodmFsdWUsIGtleSkgPT4ge1xuICAgICAgZGVjb2RlSGFzaFtrZXldID0gdmFsdWUgPyBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpIDogdmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlY29kZUhhc2g7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gb25PcGVyYXRpb25Db21wbGV0ZShyZXN1bHQpIHtcbiAgICBjb25zb2xlLmxvZyhcIkNvbXBsZXRlZCBhZGRpbmcgdGhlIGRhc2hib2FyZCB3aXRoIHJlc3BvbnNlIFwiICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0KSk7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gc2V0U3ViVGFicyh0YWI6YW55LCBidWlsZGVyLCBkYXNoYm9hcmRzOkFycmF5PERhc2hib2FyZD4sICRyb290U2NvcGUpIHtcbiAgICBpZiAoIXRhYiB8fCB0YWIuZW1iZWRkZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9IFxuICAgIGxvZy5kZWJ1ZyhcIlVwZGF0aW5nIHN1Yi10YWJzXCIpO1xuICAgIGlmICghdGFiLnRhYnMpIHtcbiAgICAgIHRhYi50YWJzID0gW107XG4gICAgfSBlbHNlIHtcbiAgICAgIHRhYi50YWJzLmxlbmd0aCA9IDA7XG4gICAgfVxuICAgIGxvZy5kZWJ1ZyhcInRhYjogXCIsIHRhYik7XG4gICAgbG9nLmRlYnVnKFwiZGFzaGJvYXJkczogXCIsIGRhc2hib2FyZHMpO1xuICAgIF8uZm9yRWFjaChkYXNoYm9hcmRzLCAoZGFzaGJvYXJkKSA9PiB7XG4gICAgICB2YXIgY2hpbGQgPSBidWlsZGVyXG4gICAgICAgIC5pZCgnZGFzaGJvYXJkLScgKyBkYXNoYm9hcmQuaWQpXG4gICAgICAgIC50aXRsZSgoKSA9PiBkYXNoYm9hcmQudGl0bGUgfHwgZGFzaGJvYXJkLmlkKVxuICAgICAgICAuaHJlZigoKSA9PiB7XG4gICAgICAgICAgdmFyIHVyaSA9IG5ldyBVUkkoVXJsSGVscGVycy5qb2luKCcvZGFzaGJvYXJkL2lkJywgZGFzaGJvYXJkLmlkKSlcbiAgICAgICAgICAgIHVyaS5zZWFyY2goe1xuICAgICAgICAgICAgICAnbWFpbi10YWInOiBwbHVnaW5OYW1lLFxuICAgICAgICAgICAgICAnc3ViLXRhYic6ICdkYXNoYm9hcmQtJyArIGRhc2hib2FyZC5pZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHVyaS50b1N0cmluZygpO1xuICAgICAgICB9KVxuICAgICAgICAuYnVpbGQoKTtcbiAgICAgIHRhYi50YWJzLnB1c2goY2hpbGQpO1xuICAgIH0pO1xuICAgIHZhciBtYW5hZ2UgPSBidWlsZGVyXG4gICAgICAuaWQoJ2Rhc2hib2FyZC1tYW5hZ2UnKVxuICAgICAgLnRpdGxlKCgpID0+ICc8aSBjbGFzcz1cImZhIGZhLXBlbmNpbFwiPjwvaT4mbmJzcDtNYW5hZ2UnKVxuICAgICAgLmhyZWYoKCkgPT4gJy9kYXNoYm9hcmQvZWRpdD9tYWluLXRhYj1kYXNoYm9hcmQmc3ViLXRhYj1kYXNoYm9hcmQtbWFuYWdlJylcbiAgICAgIC5idWlsZCgpO1xuICAgIHRhYi50YWJzLnB1c2gobWFuYWdlKTtcbiAgICB0YWIudGFicy5mb3JFYWNoKCh0YWIpID0+IHtcbiAgICAgIHRhYi5pc1NlbGVjdGVkID0gKCkgPT4ge1xuICAgICAgICB2YXIgaWQgPSB0YWIuaWQucmVwbGFjZSgnZGFzaGJvYXJkLScsICcnKTtcbiAgICAgICAgdmFyIHVyaSA9IG5ldyBVUkkoKTtcbiAgICAgICAgcmV0dXJuIHVyaS5xdWVyeSh0cnVlKVsnc3ViLXRhYiddID09PSB0YWIuaWQgfHwgXy5lbmRzV2l0aCh1cmkucGF0aCgpLCBpZCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgbG9nLmRlYnVnKFwiVXBkYXRlZCBtYWluIHRhYiB0bzogXCIsIHRhYik7XG4gICAgLy8kcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2hhd3Rpby1uYXYtcmVkcmF3Jyk7XG4gICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdoYXd0aW8tbmF2LXN1YnRhYi1yZWRyYXcnKTtcbiAgICBDb3JlLiRhcHBseSgkcm9vdFNjb3BlKTtcbiAgfVxuXG5cbiAgZXhwb3J0IGZ1bmN0aW9uIGdldER1bW15QnVpbGRlcigpIHtcbiAgICB2YXIgc2VsZiA9IHtcbiAgICAgIGlkOiAoKSA9PiBzZWxmLFxuICAgICAgZGVmYXVsdFBhZ2U6ICgpID0+IHNlbGYsXG4gICAgICByYW5rOiAoKSA9PiBzZWxmLFxuICAgICAgcmVsb2FkOiAoKSA9PiBzZWxmLFxuICAgICAgcGFnZTogKCkgPT4gc2VsZixcbiAgICAgIHRpdGxlOiAoKSA9PiBzZWxmLFxuICAgICAgdG9vbHRpcDogKCkgPT4gc2VsZixcbiAgICAgIGNvbnRleHQ6ICgpID0+IHNlbGYsXG4gICAgICBhdHRyaWJ1dGVzOiAoKSA9PiBzZWxmLFxuICAgICAgbGlua0F0dHJpYnV0ZXM6ICgpID0+IHNlbGYsXG4gICAgICBocmVmOiAoKSA9PiBzZWxmLFxuICAgICAgY2xpY2s6ICgpID0+IHNlbGYsXG4gICAgICBpc1ZhbGlkOiAoKSA9PiBzZWxmLFxuICAgICAgc2hvdzogKCkgPT4gc2VsZixcbiAgICAgIGlzU2VsZWN0ZWQ6ICgpID0+IHNlbGYsXG4gICAgICB0ZW1wbGF0ZTogKCkgPT4gc2VsZixcbiAgICAgIHRhYnM6ICgpID0+IHNlbGYsXG4gICAgICBzdWJQYXRoOiAoKSA9PiBzZWxmLFxuICAgICAgYnVpbGQ6ICgpID0+IHt9XG4gICAgfVxuICAgIHJldHVybiBzZWxmO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIGdldER1bW15QnVpbGRlckZhY3RvcnkoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNyZWF0ZTogKCkgPT4gZ2V0RHVtbXlCdWlsZGVyKCksXG4gICAgICBqb2luOiAoKSA9PiAnJyxcbiAgICAgIGNvbmZpZ3VyZVJvdXRpbmc6ICgpID0+IHt9XG4gICAgfVxuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIGdldER1bW15SGF3dGlvTmF2KCkge1xuICAgIHZhciBuYXYgPSB7XG4gICAgICBidWlsZGVyOiAoKSA9PiBnZXREdW1teUJ1aWxkZXIoKSxcbiAgICAgIGFkZDogKCkgPT4ge30sXG4gICAgICByZW1vdmU6ICgpID0+IFtdLFxuICAgICAgaXRlcmF0ZTogKCkgPT4gbnVsbCxcbiAgICAgIG9uOiAoKSA9PiB1bmRlZmluZWQsXG4gICAgICBzZWxlY3RlZDogKCkgPT4gdW5kZWZpbmVkXG4gICAgfVxuICAgIHJldHVybiBuYXY7XG4gIH1cbn1cbiIsIi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqIEBtYWluIERhc2hib2FyZFxuICovXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkSGVscGVycy50c1wiLz5cbm1vZHVsZSBEYXNoYm9hcmQge1xuICBcbiAgZXhwb3J0IHZhciBfbW9kdWxlID0gYW5ndWxhci5tb2R1bGUocGx1Z2luTmFtZSwgW10pO1xuXG4gIF9tb2R1bGUuY29uZmlnKFtcIiRyb3V0ZVByb3ZpZGVyXCIsIFwiJHByb3ZpZGVcIiwgKCRyb3V0ZVByb3ZpZGVyLCAkcHJvdmlkZSkgPT4ge1xuXG4gICAgJHByb3ZpZGUuZGVjb3JhdG9yKCdIYXd0aW9EYXNoYm9hcmQnLCBbJyRkZWxlZ2F0ZScsICgkZGVsZWdhdGUpID0+IHtcbiAgICAgICRkZWxlZ2F0ZVsnaGFzRGFzaGJvYXJkJ10gPSB0cnVlO1xuICAgICAgJGRlbGVnYXRlWydnZXRBZGRMaW5rJ10gPSAodGl0bGU/OnN0cmluZywgc2l6ZV94PzpudW1iZXIsIHNpemVfeT86bnVtYmVyKSA9PiB7XG4gICAgICAgIHZhciB0YXJnZXQgPSBuZXcgVVJJKCcvZGFzaGJvYXJkL2FkZCcpO1xuICAgICAgICB2YXIgY3VycmVudFVyaSA9IG5ldyBVUkkoKTtcbiAgICAgICAgLypcbiAgICAgICAgY3VycmVudFVyaS5yZW1vdmVRdWVyeSgnbWFpbi10YWInKTtcbiAgICAgICAgY3VycmVudFVyaS5yZW1vdmVRdWVyeSgnc3ViLXRhYicpO1xuICAgICAgICAqL1xuICAgICAgICB2YXIgd2lkZ2V0VXJpID0gbmV3IFVSSShjdXJyZW50VXJpLnBhdGgoKSk7XG4gICAgICAgIHdpZGdldFVyaS5xdWVyeShjdXJyZW50VXJpLnF1ZXJ5KHRydWUpKTtcbiAgICAgICAgdGFyZ2V0LnF1ZXJ5KChxdWVyeSkgPT4ge1xuICAgICAgICAgIHF1ZXJ5LmhyZWYgPSBVUkkuZW5jb2RlUmVzZXJ2ZWQod2lkZ2V0VXJpLnRvU3RyaW5nKCkpXG4gICAgICAgICAgaWYgKHRpdGxlKSB7XG4gICAgICAgICAgICBxdWVyeS50aXRsZSA9IFVSSS5lbmNvZGVSZXNlcnZlZCh0aXRsZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzaXplX3ggJiYgc2l6ZV95KSB7XG4gICAgICAgICAgICBxdWVyeS5zaXplID0gVVJJLmVuY29kZVJlc2VydmVkKGFuZ3VsYXIudG9Kc29uKHtzaXplX3g6IHNpemVfeCwgc2l6ZV95OiBzaXplX3l9KSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRhcmdldC50b1N0cmluZygpO1xuICAgICAgfVxuICAgICAgcmV0dXJuICRkZWxlZ2F0ZTtcbiAgICB9XSk7XG5cbiAgICAkcm91dGVQcm92aWRlci5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvYWRkJywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2FkZFRvRGFzaGJvYXJkLmh0bWwnfSkuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2VkaXQnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnZWRpdERhc2hib2FyZHMuaHRtbCd9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvaWR4LzpkYXNoYm9hcmRJbmRleCcsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdkYXNoYm9hcmQuaHRtbCcsIHJlbG9hZE9uU2VhcmNoOiBmYWxzZSB9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvaWQvOmRhc2hib2FyZElkJywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2Rhc2hib2FyZC5odG1sJywgcmVsb2FkT25TZWFyY2g6IGZhbHNlIH0pLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9pZC86ZGFzaGJvYXJkSWQvc2hhcmUnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnc2hhcmUuaHRtbCd9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvaW1wb3J0Jywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2ltcG9ydC5odG1sJ30pO1xuICB9XSk7XG5cbiAgX21vZHVsZS52YWx1ZSgndWkuY29uZmlnJywge1xuICAgIC8vIFRoZSB1aS1qcSBkaXJlY3RpdmUgbmFtZXNwYWNlXG4gICAganE6IHtcbiAgICAgIGdyaWRzdGVyOiB7XG4gICAgICAgIHdpZGdldF9tYXJnaW5zOiBbMTAsIDEwXSxcbiAgICAgICAgd2lkZ2V0X2Jhc2VfZGltZW5zaW9uczogWzE0MCwgMTQwXVxuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgX21vZHVsZS5mYWN0b3J5KCdIYXd0aW9EYXNoYm9hcmRUYWInLCBbJ0hhd3Rpb05hdicsICdIYXd0aW9EYXNoYm9hcmQnLCAnJHRpbWVvdXQnLCAnJHJvb3RTY29wZScsICdkYXNoYm9hcmRSZXBvc2l0b3J5JywgJyRsb2NhdGlvbicsIChuYXY6SGF3dGlvTWFpbk5hdi5SZWdpc3RyeSwgZGFzaDpEYXNoYm9hcmRTZXJ2aWNlLCAkdGltZW91dCwgJHJvb3RTY29wZSwgZGFzaGJvYXJkczpEYXNoYm9hcmRSZXBvc2l0b3J5LCAkbG9jYXRpb24pID0+IHtcbiAgICB2YXIgdGFiID0gPGFueT4ge1xuICAgICAgZW1iZWRkZWQ6IHRydWVcbiAgICB9O1xuICAgIGlmIChkYXNoICYmIGRhc2guaW5EYXNoYm9hcmQpIHtcbiAgICAgIGxvZy5kZWJ1ZyhcIkVtYmVkZGVkIGluIGEgZGFzaGJvYXJkLCBub3QgaW5pdGlhbGl6aW5nIG91ciBuYXZpZ2F0aW9uIHRhYlwiKTtcbiAgICAgIHJldHVybiB0YWI7XG4gICAgfVxuICAgIC8vIHNwZWNpYWwgY2FzZSBoZXJlLCB3ZSBkb24ndCB3YW50IHRvIG92ZXJ3cml0ZSBvdXIgc3RvcmVkIHRhYiFcbiAgICB2YXIgYnVpbGRlciA9IG5hdi5idWlsZGVyKCk7XG4gICAgdGFiID0gYnVpbGRlci5pZChwbHVnaW5OYW1lKVxuICAgICAgICAgICAgICAgICAgLmhyZWYoKCkgPT4gJy9kYXNoYm9hcmQvaWR4LzAnKVxuICAgICAgICAgICAgICAgICAgLmlzU2VsZWN0ZWQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXy5zdGFydHNXaXRoKCRsb2NhdGlvbi5wYXRoKCksICcvZGFzaGJvYXJkLycpO1xuICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgIC50aXRsZSgoKSA9PiAnRGFzaGJvYXJkJylcbiAgICAgICAgICAgICAgICAgIC5idWlsZCgpO1xuICAgIG5hdi5hZGQodGFiKTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGxvZy5kZWJ1ZyhcIlNldHRpbmcgdXAgZGFzaGJvYXJkIHN1Yi10YWJzXCIpO1xuICAgICAgZGFzaGJvYXJkcy5nZXREYXNoYm9hcmRzKChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIHNldFN1YlRhYnModGFiLCBidWlsZGVyLCBkYXNoYm9hcmRzLCAkcm9vdFNjb3BlKTtcbiAgICAgIH0pO1xuICAgIH0sIDUwMCk7XG4gICAgbG9nLmRlYnVnKFwiTm90IGVtYmVkZGVkIGluIGEgZGFzaGJvYXJkLCByZXR1cm5pbmcgcHJvcGVyIHRhYlwiKTtcbiAgICByZXR1cm4gdGFiO1xuICB9XSk7XG5cbiAgX21vZHVsZS5ydW4oW1wiSGF3dGlvRGFzaGJvYXJkVGFiXCIsIChIYXd0aW9EYXNoYm9hcmRUYWIpID0+IHtcbiAgICBsb2cuZGVidWcoXCJydW5uaW5nXCIpO1xuICB9XSk7XG5cbiAgaGF3dGlvUGx1Z2luTG9hZGVyLmFkZE1vZHVsZShwbHVnaW5OYW1lKTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkSW50ZXJmYWNlcy50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG5cbiAgX21vZHVsZS5mYWN0b3J5KCdkYXNoYm9hcmRSZXBvc2l0b3J5JywgWydEZWZhdWx0RGFzaGJvYXJkcycsIChkZWZhdWx0czpEZWZhdWx0RGFzaGJvYXJkcykgPT4ge1xuICAgIHJldHVybiBuZXcgTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5KGRlZmF1bHRzKTtcbiAgfV0pO1xuXG4gIF9tb2R1bGUuZmFjdG9yeSgnRGVmYXVsdERhc2hib2FyZHMnLCBbKCkgPT4ge1xuICAgIHZhciBkZWZhdWx0cyA9IDxBcnJheTxEYXNoYm9hcmQ+PltdO1xuICAgIHZhciBhbnN3ZXIgPSB7XG4gICAgICBhZGQ6IChkYXNoYm9hcmQ6RGFzaGJvYXJkKSA9PiB7XG4gICAgICAgIGRlZmF1bHRzLnB1c2goZGFzaGJvYXJkKTtcbiAgICAgIH0sXG4gICAgICByZW1vdmU6IChpZDpzdHJpbmcpID0+IHtcbiAgICAgICAgcmV0dXJuIF8ucmVtb3ZlKGRlZmF1bHRzLCAoZGFzaGJvYXJkKSA9PiBkYXNoYm9hcmQuaWQgPT09IGlkKTtcbiAgICAgIH0sXG4gICAgICBnZXRBbGw6ICgpID0+IGRlZmF1bHRzXG4gICAgfVxuICAgIHJldHVybiBhbnN3ZXI7XG4gIH1dKTtcblxuICAvKipcbiAgICogQGNsYXNzIExvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeVxuICAgKiBAdXNlcyBEYXNoYm9hcmRSZXBvc2l0b3J5XG4gICAqL1xuICBleHBvcnQgY2xhc3MgTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5IGltcGxlbWVudHMgRGFzaGJvYXJkUmVwb3NpdG9yeSB7XG5cbiAgICBwcml2YXRlIGxvY2FsU3RvcmFnZTpXaW5kb3dMb2NhbFN0b3JhZ2UgPSBudWxsO1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBkZWZhdWx0czpEZWZhdWx0RGFzaGJvYXJkcykge1xuICAgICAgdGhpcy5sb2NhbFN0b3JhZ2UgPSBDb3JlLmdldExvY2FsU3RvcmFnZSgpO1xuICAgICAgaWYgKCd1c2VyRGFzaGJvYXJkcycgaW4gdGhpcy5sb2NhbFN0b3JhZ2UpIHtcbiAgICAgICAgbG9nLmRlYnVnKFwiRm91bmQgcHJldmlvdXNseSBzYXZlZCBkYXNoYm9hcmRzXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbG9nLmRlYnVnKFwiU3RvcmluZyBwcmUtZGVmaW5lZCBkYXNoYm9hcmRzXCIpO1xuICAgICAgICB0aGlzLnN0b3JlRGFzaGJvYXJkcyhkZWZhdWx0cy5nZXRBbGwoKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBsb2FkRGFzaGJvYXJkcygpIHtcbiAgICAgIHZhciBhbnN3ZXIgPSBhbmd1bGFyLmZyb21Kc29uKGxvY2FsU3RvcmFnZVsndXNlckRhc2hib2FyZHMnXSk7XG4gICAgICBsb2cuZGVidWcoXCJyZXR1cm5pbmcgZGFzaGJvYXJkczogXCIsIGFuc3dlcik7XG4gICAgICByZXR1cm4gYW5zd2VyO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RvcmVEYXNoYm9hcmRzKGRhc2hib2FyZHM6YW55W10pIHtcbiAgICAgIGxvZy5kZWJ1ZyhcInN0b3JpbmcgZGFzaGJvYXJkczogXCIsIGRhc2hib2FyZHMpO1xuICAgICAgbG9jYWxTdG9yYWdlWyd1c2VyRGFzaGJvYXJkcyddID0gYW5ndWxhci50b0pzb24oZGFzaGJvYXJkcyk7XG4gICAgICByZXR1cm4gdGhpcy5sb2FkRGFzaGJvYXJkcygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBwdXREYXNoYm9hcmRzKGFycmF5OmFueVtdLCBjb21taXRNZXNzYWdlOnN0cmluZywgZm4pIHtcbiAgICAgIHZhciBkYXNoYm9hcmRzID0gdGhpcy5sb2FkRGFzaGJvYXJkcygpO1xuICAgICAgYXJyYXkuZm9yRWFjaCgoZGFzaCkgPT4ge1xuICAgICAgICB2YXIgZXhpc3RpbmcgPSBfLmZpbmRJbmRleChkYXNoYm9hcmRzLCAoZDphbnkpID0+IHsgcmV0dXJuIGQuaWQgPT09IGRhc2guaWQ7IH0pO1xuICAgICAgICBpZiAoZXhpc3RpbmcgPj0gMCkge1xuICAgICAgICAgIGRhc2hib2FyZHNbZXhpc3RpbmddID0gZGFzaDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXNoYm9hcmRzLnB1c2goZGFzaCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZm4odGhpcy5zdG9yZURhc2hib2FyZHMoZGFzaGJvYXJkcykpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZWxldGVEYXNoYm9hcmRzKGFycmF5OmFueVtdLCBmbikge1xuICAgICAgdmFyIGRhc2hib2FyZHMgPSB0aGlzLmxvYWREYXNoYm9hcmRzKCk7XG4gICAgICBhbmd1bGFyLmZvckVhY2goYXJyYXksIChpdGVtKSA9PiB7XG4gICAgICAgIF8ucmVtb3ZlKGRhc2hib2FyZHMsIChpOmFueSkgPT4geyByZXR1cm4gaS5pZCA9PT0gaXRlbS5pZDsgfSk7XG4gICAgICB9KTtcbiAgICAgIGZuKHRoaXMuc3RvcmVEYXNoYm9hcmRzKGRhc2hib2FyZHMpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RGFzaGJvYXJkcyhmbikge1xuICAgICAgZm4odGhpcy5sb2FkRGFzaGJvYXJkcygpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RGFzaGJvYXJkKGlkOnN0cmluZywgZm4pIHtcbiAgICAgIHZhciBkYXNoYm9hcmRzID0gdGhpcy5sb2FkRGFzaGJvYXJkcygpO1xuICAgICAgdmFyIGRhc2hib2FyZCA9IF8uZmluZChkYXNoYm9hcmRzLCAoZGFzaGJvYXJkOmFueSkgPT4geyByZXR1cm4gZGFzaGJvYXJkLmlkID09PSBpZCB9KTtcbiAgICAgIGZuKGRhc2hib2FyZCk7XG4gICAgfVxuXG4gICAgcHVibGljIGNyZWF0ZURhc2hib2FyZChvcHRpb25zOmFueSkge1xuICAgICAgdmFyIGFuc3dlciA9e1xuICAgICAgICB0aXRsZTogXCJOZXcgRGFzaGJvYXJkXCIsXG4gICAgICAgIGdyb3VwOiBcIlBlcnNvbmFsXCIsXG4gICAgICAgIHdpZGdldHM6IFtdXG4gICAgICB9O1xuICAgICAgYW5zd2VyID0gYW5ndWxhci5leHRlbmQoYW5zd2VyLCBvcHRpb25zKTtcbiAgICAgIGFuc3dlclsnaWQnXSA9IENvcmUuZ2V0VVVJRCgpO1xuICAgICAgcmV0dXJuIGFuc3dlcjtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2xvbmVEYXNoYm9hcmQoZGFzaGJvYXJkOmFueSkge1xuICAgICAgdmFyIG5ld0Rhc2hib2FyZCA9IF8uY2xvbmUoZGFzaGJvYXJkKTtcbiAgICAgIG5ld0Rhc2hib2FyZFsnaWQnXSA9IENvcmUuZ2V0VVVJRCgpO1xuICAgICAgbmV3RGFzaGJvYXJkWyd0aXRsZSddID0gXCJDb3B5IG9mIFwiICsgZGFzaGJvYXJkLnRpdGxlO1xuICAgICAgcmV0dXJuIG5ld0Rhc2hib2FyZDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0VHlwZSgpIHtcbiAgICAgIHJldHVybiAnY29udGFpbmVyJztcbiAgICB9XG4gIH1cblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG5cbiAgX21vZHVsZS5jb250cm9sbGVyKFwiRGFzaGJvYXJkLkVkaXREYXNoYm9hcmRzQ29udHJvbGxlclwiLCBbXCIkc2NvcGVcIiwgXCIkcm91dGVQYXJhbXNcIiwgXCIkcm91dGVcIiwgXCIkbG9jYXRpb25cIiwgXCIkcm9vdFNjb3BlXCIsIFwiZGFzaGJvYXJkUmVwb3NpdG9yeVwiLCBcIkhhd3Rpb05hdlwiLCBcIiR0aW1lb3V0XCIsIFwiJHRlbXBsYXRlQ2FjaGVcIiwgXCIkbW9kYWxcIiwgXCJIYXd0aW9EYXNoYm9hcmRUYWJcIiwgKCRzY29wZSwgJHJvdXRlUGFyYW1zLCAkcm91dGUsICRsb2NhdGlvbiwgJHJvb3RTY29wZSwgZGFzaGJvYXJkUmVwb3NpdG9yeTpEYXNoYm9hcmRSZXBvc2l0b3J5LCBuYXYsICR0aW1lb3V0LCAkdGVtcGxhdGVDYWNoZSwgJG1vZGFsLCB0YWIpID0+IHtcblxuICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IFtdO1xuXG4gICAgJHJvb3RTY29wZS4kb24oJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkTG9hZGVkKTtcblxuICAgICRzY29wZS5oYXNVcmwgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gKCRzY29wZS51cmwpID8gdHJ1ZSA6IGZhbHNlO1xuICAgIH07XG5cbiAgICAkc2NvcGUuaGFzU2VsZWN0aW9uID0gKCkgPT4ge1xuICAgICAgcmV0dXJuICRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLmxlbmd0aCAhPT0gMDtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmdyaWRPcHRpb25zID0ge1xuICAgICAgc2VsZWN0ZWRJdGVtczogW10sXG4gICAgICBzaG93RmlsdGVyOiBmYWxzZSxcbiAgICAgIHNob3dDb2x1bW5NZW51OiBmYWxzZSxcbiAgICAgIGZpbHRlck9wdGlvbnM6IHtcbiAgICAgICAgZmlsdGVyVGV4dDogJydcbiAgICAgIH0sXG4gICAgICBkYXRhOiAnX2Rhc2hib2FyZHMnLFxuICAgICAgc2VsZWN0V2l0aENoZWNrYm94T25seTogdHJ1ZSxcbiAgICAgIHNob3dTZWxlY3Rpb25DaGVja2JveDogdHJ1ZSxcbiAgICAgIGNvbHVtbkRlZnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGZpZWxkOiAndGl0bGUnLFxuICAgICAgICAgIGRpc3BsYXlOYW1lOiAnRGFzaGJvYXJkJyxcbiAgICAgICAgICBjZWxsVGVtcGxhdGU6ICR0ZW1wbGF0ZUNhY2hlLmdldChVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAnZWRpdERhc2hib2FyZFRpdGxlQ2VsbC5odG1sJykpXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBmaWVsZDogJ2dyb3VwJyxcbiAgICAgICAgICBkaXNwbGF5TmFtZTogJ0dyb3VwJ1xuICAgICAgICB9XG4gICAgICBdLFxuICAgIH07XG5cbiAgICB2YXIgZG9VcGRhdGUgPSBfLmRlYm91bmNlKHVwZGF0ZURhdGEsIDEwKTtcblxuICAgIC8vIGhlbHBlcnMgc28gd2UgY2FuIGVuYWJsZS9kaXNhYmxlIHBhcnRzIG9mIHRoZSBVSSBkZXBlbmRpbmcgb24gaG93XG4gICAgLy8gZGFzaGJvYXJkIGRhdGEgaXMgc3RvcmVkXG4gICAgLypcbiAgICAkc2NvcGUudXNpbmdHaXQgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlKCkgPT09ICdnaXQnO1xuICAgIH07XG5cbiAgICAkc2NvcGUudXNpbmdGYWJyaWMgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlKCkgPT09ICdmYWJyaWMnO1xuICAgIH07XG5cbiAgICAkc2NvcGUudXNpbmdMb2NhbCA9ICgpID0+IHtcbiAgICAgIHJldHVybiBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldFR5cGUoKSA9PT0gJ2NvbnRhaW5lcic7XG4gICAgfTtcblxuICAgIGlmICgkc2NvcGUudXNpbmdGYWJyaWMoKSkge1xuICAgICAgJHNjb3BlLmdyaWRPcHRpb25zLmNvbHVtbkRlZnMuYWRkKFt7XG4gICAgICAgIGZpZWxkOiAndmVyc2lvbklkJyxcbiAgICAgICAgZGlzcGxheU5hbWU6ICdWZXJzaW9uJ1xuICAgICAgfSwge1xuICAgICAgICBmaWVsZDogJ3Byb2ZpbGVJZCcsXG4gICAgICAgIGRpc3BsYXlOYW1lOiAnUHJvZmlsZSdcbiAgICAgIH0sIHtcbiAgICAgICAgZmllbGQ6ICdmaWxlTmFtZScsXG4gICAgICAgIGRpc3BsYXlOYW1lOiAnRmlsZSBOYW1lJ1xuICAgICAgfV0pO1xuICAgIH1cbiAgICAqL1xuXG4gICAgJHRpbWVvdXQoZG9VcGRhdGUsIDEwKTtcblxuICAgICRzY29wZS4kb24oXCIkcm91dGVDaGFuZ2VTdWNjZXNzXCIsIGZ1bmN0aW9uIChldmVudCwgY3VycmVudCwgcHJldmlvdXMpIHtcbiAgICAgIC8vIGxldHMgZG8gdGhpcyBhc3luY2hyb25vdXNseSB0byBhdm9pZCBFcnJvcjogJGRpZ2VzdCBhbHJlYWR5IGluIHByb2dyZXNzXG4gICAgICAkdGltZW91dChkb1VwZGF0ZSwgMTApO1xuICAgIH0pO1xuXG4gICAgJHNjb3BlLmFkZFZpZXdUb0Rhc2hib2FyZCA9ICgpID0+IHtcbiAgICAgIHZhciBuZXh0SHJlZiA9IG51bGw7XG4gICAgICB2YXIgc2VsZWN0ZWQgPSAkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcztcbiAgICAgIHZhciBjdXJyZW50VXJsID0gbmV3IFVSSSgpO1xuICAgICAgdmFyIGNvbmZpZyA9IGN1cnJlbnRVcmwucXVlcnkodHJ1ZSk7XG4gICAgICB2YXIgaHJlZiA9IGNvbmZpZ1snaHJlZiddO1xuICAgICAgdmFyIGlmcmFtZSA9IGNvbmZpZ1snaWZyYW1lJ107XG4gICAgICB2YXIgdHlwZSA9ICdocmVmJztcbiAgICAgIGlmIChocmVmKSB7XG4gICAgICAgIGhyZWYgPSBVUkkuZGVjb2RlKGhyZWYpO1xuICAgICAgICBocmVmID0gQ29yZS50cmltTGVhZGluZyhocmVmLCAnIycpO1xuICAgICAgfSBlbHNlIGlmIChpZnJhbWUpIHtcbiAgICAgICAgaWZyYW1lID0gVVJJLmRlY29kZShpZnJhbWUpO1xuICAgICAgICB0eXBlID0gJ2lmcmFtZSc7XG4gICAgICB9XG4gICAgICB2YXIgd2lkZ2V0VVJJID0gPGFueT4gdW5kZWZpbmVkO1xuICAgICAgc3dpdGNoKHR5cGUpIHtcbiAgICAgICAgY2FzZSAnaHJlZic6XG4gICAgICAgICAgbG9nLmRlYnVnKFwiaHJlZjogXCIsIGhyZWYpO1xuICAgICAgICAgIHdpZGdldFVSSSA9IG5ldyBVUkkoaHJlZik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2lmcmFtZSc6XG4gICAgICAgICAgbG9nLmRlYnVnKFwiaWZyYW1lOiBcIiwgaWZyYW1lKTtcbiAgICAgICAgICB3aWRnZXRVUkkgPSBuZXcgVVJJKGlmcmFtZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgbG9nLmRlYnVnKFwidHlwZSB1bmtub3duXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBzaXplU3RyID0gPGFueT4gY29uZmlnWydzaXplJ107XG4gICAgICBpZiAoc2l6ZVN0cikge1xuICAgICAgICBzaXplU3RyID0gVVJJLmRlY29kZShzaXplU3RyKTtcbiAgICAgIH1cbiAgICAgIHZhciBzaXplID0gYW5ndWxhci5mcm9tSnNvbihzaXplU3RyKSB8fCB7IHNpemVfeDogMSwgc2l6ZV95OiAxIH07XG4gICAgICB2YXIgdGl0bGUgPSBVUkkuZGVjb2RlKGNvbmZpZ1sndGl0bGUnXSB8fCAnJyk7XG4gICAgICB2YXIgdGVtcGxhdGVXaWRnZXQgPSB7XG4gICAgICAgIGlkOiBDb3JlLmdldFVVSUQoKSxcbiAgICAgICAgcm93OiAxLFxuICAgICAgICBjb2w6IDEsXG4gICAgICAgIHNpemVfeDogc2l6ZS5zaXplX3gsXG4gICAgICAgIHNpemVfeTogc2l6ZS5zaXplX3ksXG4gICAgICAgIHRpdGxlOiB0aXRsZVxuICAgICAgfVxuICAgICAgYW5ndWxhci5mb3JFYWNoKHNlbGVjdGVkLCAoc2VsZWN0ZWRJdGVtKSA9PiB7XG5cbiAgICAgICAgdmFyIHdpZGdldCA9IF8uY2xvbmVEZWVwKHRlbXBsYXRlV2lkZ2V0KTtcblxuICAgICAgICBpZiAoIXNlbGVjdGVkSXRlbS53aWRnZXRzKSB7XG4gICAgICAgICAgc2VsZWN0ZWRJdGVtLndpZGdldHMgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgIGNhc2UgJ2lmcmFtZSc6IFxuICAgICAgICAgICAgd2lkZ2V0ID0gPGFueT5fLmV4dGVuZCh7XG4gICAgICAgICAgICAgIGlmcmFtZTogaWZyYW1lXG4gICAgICAgICAgICB9LCB3aWRnZXQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnaHJlZic6XG4gICAgICAgICAgICB2YXIgdGV4dCA9IHdpZGdldFVSSS5wYXRoKCk7XG4gICAgICAgICAgICB2YXIgc2VhcmNoID0gd2lkZ2V0VVJJLnF1ZXJ5KHRydWUpO1xuICAgICAgICAgICAgaWYgKCRyb3V0ZSAmJiAkcm91dGUucm91dGVzKSB7XG4gICAgICAgICAgICAgIHZhciB2YWx1ZSA9ICRyb3V0ZS5yb3V0ZXNbdGV4dF07XG4gICAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZVVybCA9IHZhbHVlW1widGVtcGxhdGVVcmxcIl07XG4gICAgICAgICAgICAgICAgaWYgKHRlbXBsYXRlVXJsKSB7XG4gICAgICAgICAgICAgICAgICB3aWRnZXQgPSA8YW55PiBfLmV4dGVuZCh7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IHRleHQsXG4gICAgICAgICAgICAgICAgICAgIGluY2x1ZGU6IHRlbXBsYXRlVXJsLFxuICAgICAgICAgICAgICAgICAgICBzZWFyY2g6IHNlYXJjaCxcbiAgICAgICAgICAgICAgICAgICAgaGFzaDogXCJcIlxuICAgICAgICAgICAgICAgICAgfSwgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETyB3ZSBuZWVkIHRvIGJlIGFibGUgdG8gbWF0Y2ggVVJJIHRlbXBsYXRlcy4uLlxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZmlndXJlIG91dCB0aGUgd2lkdGggb2YgdGhlIGRhc2hcbiAgICAgICAgdmFyIGdyaWRXaWR0aCA9IDA7XG5cbiAgICAgICAgc2VsZWN0ZWRJdGVtLndpZGdldHMuZm9yRWFjaCgodykgPT4ge1xuICAgICAgICAgIHZhciByaWdodFNpZGUgPSB3LmNvbCArIHcuc2l6ZV94O1xuICAgICAgICAgIGlmIChyaWdodFNpZGUgPiBncmlkV2lkdGgpIHtcbiAgICAgICAgICAgIGdyaWRXaWR0aCA9IHJpZ2h0U2lkZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuXG4gICAgICAgIHZhciBsZWZ0ID0gKHcpID0+IHtcbiAgICAgICAgICByZXR1cm4gdy5jb2w7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHJpZ2h0ID0gKHcpICA9PiB7XG4gICAgICAgICAgcmV0dXJuIHcuY29sICsgdy5zaXplX3ggLSAxO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciB0b3AgPSAodykgPT4ge1xuICAgICAgICAgIHJldHVybiB3LnJvdztcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgYm90dG9tID0gKHcpID0+IHtcbiAgICAgICAgICByZXR1cm4gdy5yb3cgKyB3LnNpemVfeSAtIDE7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGNvbGxpc2lvbiA9ICh3MSwgdzIpID0+IHtcbiAgICAgICAgICByZXR1cm4gISggbGVmdCh3MikgPiByaWdodCh3MSkgfHxcbiAgICAgICAgICAgICAgcmlnaHQodzIpIDwgbGVmdCh3MSkgfHxcbiAgICAgICAgICAgICAgdG9wKHcyKSA+IGJvdHRvbSh3MSkgfHxcbiAgICAgICAgICAgICAgYm90dG9tKHcyKSA8IHRvcCh3MSkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmICghc2VsZWN0ZWRJdGVtLndpZGdldHMubGVuZ3RoKSB7XG4gICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKCFmb3VuZCkge1xuICAgICAgICAgIHdpZGdldC5jb2wgPSAxO1xuICAgICAgICAgIGlmICh3aWRnZXQuY29sICsgd2lkZ2V0LnNpemVfeCA+IGdyaWRXaWR0aCkge1xuICAgICAgICAgICAgLy8gbGV0J3Mgbm90IGxvb2sgZm9yIGEgcGxhY2UgbmV4dCB0byBleGlzdGluZyB3aWRnZXRcbiAgICAgICAgICAgIHNlbGVjdGVkSXRlbS53aWRnZXRzLmZvckVhY2goZnVuY3Rpb24odywgaWR4KSB7XG4gICAgICAgICAgICAgIGlmICh3aWRnZXQucm93IDw9IHcucm93KSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0LnJvdysrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yICg7ICh3aWRnZXQuY29sICsgd2lkZ2V0LnNpemVfeCkgPD0gZ3JpZFdpZHRoOyB3aWRnZXQuY29sKyspIHtcbiAgICAgICAgICAgIGlmICghXy5zb21lKHNlbGVjdGVkSXRlbS53aWRnZXRzLCAodykgPT4ge1xuICAgICAgICAgICAgICB2YXIgYyA9IGNvbGxpc2lvbih3LCB3aWRnZXQpO1xuICAgICAgICAgICAgICByZXR1cm4gY1xuICAgICAgICAgICAgfSkpIHtcbiAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgd2lkZ2V0LnJvdyA9IHdpZGdldC5yb3cgKyAxXG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGp1c3QgaW4gY2FzZSwga2VlcCB0aGUgc2NyaXB0IGZyb20gcnVubmluZyBhd2F5Li4uXG4gICAgICAgICAgaWYgKHdpZGdldC5yb3cgPiA1MCkge1xuICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgkc2NvcGUucm91dGVQYXJhbXMpIHtcbiAgICAgICAgICB3aWRnZXRbJ3JvdXRlUGFyYW1zJ10gPSAkc2NvcGUucm91dGVQYXJhbXM7XG4gICAgICAgIH1cbiAgICAgICAgc2VsZWN0ZWRJdGVtLndpZGdldHMucHVzaCh3aWRnZXQpO1xuICAgICAgICBpZiAoIW5leHRIcmVmICYmIHNlbGVjdGVkSXRlbS5pZCkge1xuICAgICAgICAgIG5leHRIcmVmID0gbmV3IFVSSSgpLnBhdGgoXCIvZGFzaGJvYXJkL2lkL1wiICsgc2VsZWN0ZWRJdGVtLmlkKS5xdWVyeSh7XG4gICAgICAgICAgICAnbWFpbi10YWInOiAnZGFzaGJvYXJkJyxcbiAgICAgICAgICAgICdzdWItdGFiJzogJ2Rhc2hib2FyZC0nICsgc2VsZWN0ZWRJdGVtLmlkXG4gICAgICAgICAgfSkucmVtb3ZlUXVlcnkoJ2hyZWYnKVxuICAgICAgICAgICAgLnJlbW92ZVF1ZXJ5KCd0aXRsZScpXG4gICAgICAgICAgICAucmVtb3ZlUXVlcnkoJ2lmcmFtZScpXG4gICAgICAgICAgICAucmVtb3ZlUXVlcnkoJ3NpemUnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIG5vdyBsZXRzIHVwZGF0ZSB0aGUgYWN0dWFsIGRhc2hib2FyZCBjb25maWdcbiAgICAgIHZhciBjb21taXRNZXNzYWdlID0gXCJBZGQgd2lkZ2V0XCI7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoc2VsZWN0ZWQsIGNvbW1pdE1lc3NhZ2UsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIC8qXG4gICAgICAgIGxvZy5kZWJ1ZyhcIlB1dCBkYXNoYm9hcmRzOiBcIiwgZGFzaGJvYXJkcyk7XG4gICAgICAgIGxvZy5kZWJ1ZyhcIk5leHQgaHJlZjogXCIsIG5leHRIcmVmLnRvU3RyaW5nKCkpO1xuICAgICAgICAqL1xuICAgICAgICBpZiAobmV4dEhyZWYpIHtcbiAgICAgICAgICAkbG9jYXRpb24ucGF0aChuZXh0SHJlZi5wYXRoKCkpLnNlYXJjaChuZXh0SHJlZi5xdWVyeSh0cnVlKSk7XG4gICAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB9O1xuXG4gICAgJHNjb3BlLmNyZWF0ZSA9ICgpID0+IHtcblxuICAgICAgdmFyIGNvdW50ZXIgPSBkYXNoYm9hcmRzKCkubGVuZ3RoICsgMTtcbiAgICAgIHZhciB0aXRsZSA9IFwiVW50aXRsZWRcIiArIGNvdW50ZXI7XG5cbiAgICAgIHZhciBtb2RhbCA9ICRtb2RhbC5vcGVuKHtcbiAgICAgICAgdGVtcGxhdGVVcmw6IFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdjcmVhdGVEYXNoYm9hcmRNb2RhbC5odG1sJyksXG4gICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRtb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAkc2NvcGUuZW50aXR5ID0ge1xuICAgICAgICAgICAgdGl0bGU6IHRpdGxlXG4gICAgICAgICAgfVxuICAgICAgICAgICRzY29wZS5jb25maWcgPSB7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICd0aXRsZSc6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgJHNjb3BlLm9rID0gKCkgPT4ge1xuICAgICAgICAgICAgbW9kYWwuY2xvc2UoKTtcbiAgICAgICAgICAgIHZhciB0aXRsZSA9ICRzY29wZS5lbnRpdHkudGl0bGVcbiAgICAgICAgICAgIHZhciBuZXdEYXNoID0gZGFzaGJvYXJkUmVwb3NpdG9yeS5jcmVhdGVEYXNoYm9hcmQoeyB0aXRsZTogdGl0bGUgfSk7XG4gICAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoW25ld0Rhc2hdLCBcIkNyZWF0ZWQgbmV3IGRhc2hib2FyZDogXCIgKyB0aXRsZSwgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgICAgICAgLy8gbGV0J3MganVzdCBiZSBzYWZlIGFuZCBlbnN1cmUgdGhlcmUncyBubyBzZWxlY3Rpb25zXG4gICAgICAgICAgICAgIGRlc2VsZWN0QWxsKCk7XG4gICAgICAgICAgICAgIHNldFN1YlRhYnModGFiLCBuYXYuYnVpbGRlcigpLCBkYXNoYm9hcmRzLCAkcm9vdFNjb3BlKTtcbiAgICAgICAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgICRzY29wZS5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgICAgICBtb2RhbC5kaXNtaXNzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XVxuICAgICAgfSk7XG4gICAgICAvKlxuICAgICAgdmFyIGNvdW50ZXIgPSBkYXNoYm9hcmRzKCkubGVuZ3RoICsgMTtcbiAgICAgIHZhciB0aXRsZSA9IFwiVW50aXRsZWRcIiArIGNvdW50ZXI7XG4gICAgICB2YXIgbmV3RGFzaCA9IGRhc2hib2FyZFJlcG9zaXRvcnkuY3JlYXRlRGFzaGJvYXJkKHt0aXRsZTogdGl0bGV9KTtcblxuICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKFtuZXdEYXNoXSwgXCJDcmVhdGVkIG5ldyBkYXNoYm9hcmQ6IFwiICsgdGl0bGUsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIC8vIGxldCdzIGp1c3QgYmUgc2FmZSBhbmQgZW5zdXJlIHRoZXJlJ3Mgbm8gc2VsZWN0aW9uc1xuICAgICAgICBkZXNlbGVjdEFsbCgpO1xuICAgICAgICBzZXRTdWJUYWJzKG5hdi5idWlsZGVyKCksIGRhc2hib2FyZHMsICRyb290U2NvcGUpO1xuICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICB9KTtcbiAgICAgICovXG5cbiAgICB9O1xuXG4gICAgJHNjb3BlLmR1cGxpY2F0ZSA9ICgpID0+IHtcbiAgICAgIHZhciBuZXdEYXNoYm9hcmRzID0gW107XG4gICAgICB2YXIgY29tbWl0TWVzc2FnZSA9IFwiRHVwbGljYXRlZCBkYXNoYm9hcmQocykgXCI7XG4gICAgICBhbmd1bGFyLmZvckVhY2goJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXMsIChpdGVtLCBpZHgpID0+IHtcbiAgICAgICAgLy8gbGV0cyB1bnNlbGVjdCB0aGlzIGl0ZW1cbiAgICAgICAgdmFyIGNvbW1pdE1lc3NhZ2UgPSBcIkR1cGxpY2F0ZWQgZGFzaGJvYXJkIFwiICsgaXRlbS50aXRsZTtcbiAgICAgICAgdmFyIG5ld0Rhc2ggPSBkYXNoYm9hcmRSZXBvc2l0b3J5LmNsb25lRGFzaGJvYXJkKGl0ZW0pO1xuICAgICAgICBuZXdEYXNoYm9hcmRzLnB1c2gobmV3RGFzaCk7XG4gICAgICB9KTtcblxuICAgICAgLy8gbGV0J3MganVzdCBiZSBzYWZlIGFuZCBlbnN1cmUgdGhlcmUncyBubyBzZWxlY3Rpb25zXG4gICAgICBkZXNlbGVjdEFsbCgpO1xuXG4gICAgICBjb21taXRNZXNzYWdlID0gY29tbWl0TWVzc2FnZSArIG5ld0Rhc2hib2FyZHMubWFwKChkKSA9PiB7IHJldHVybiBkLnRpdGxlIH0pLmpvaW4oJywnKTtcbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhuZXdEYXNoYm9hcmRzLCBjb21taXRNZXNzYWdlLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICBzZXRTdWJUYWJzKHRhYiwgbmF2LmJ1aWxkZXIoKSwgZGFzaGJvYXJkcywgJHJvb3RTY29wZSk7XG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUucmVuYW1lRGFzaGJvYXJkID0gKCkgPT4ge1xuICAgICAgaWYgKCRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICB2YXIgc2VsZWN0ZWQgPSA8YW55Pl8uZmlyc3QoJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXMpO1xuICAgICAgICB2YXIgbW9kYWwgPSAkbW9kYWwub3Blbih7XG4gICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdyZW5hbWVEYXNoYm9hcmRNb2RhbC5odG1sJyksXG4gICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCAnJG1vZGFsSW5zdGFuY2UnLCAoJHNjb3BlLCAkbW9kYWxJbnN0YW5jZSkgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLmNvbmZpZyA9IHtcbiAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICd0aXRsZSc6IHtcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgZGVmYXVsdDogc2VsZWN0ZWQudGl0bGVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWQgPSBzZWxlY3RlZDtcbiAgICAgICAgICAgICRzY29wZS5vayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgbW9kYWwuY2xvc2UoKTtcbiAgICAgICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKFskc2NvcGUuc2VsZWN0ZWRdLCAncmVuYW1lZCBkYXNoYm9hcmQnLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAgICAgICAgIC8vIGxldCdzIGp1c3QgYmUgc2FmZSBhbmQgZW5zdXJlIHRoZXJlJ3Mgbm8gc2VsZWN0aW9uc1xuICAgICAgICAgICAgICAgIGRlc2VsZWN0QWxsKCk7XG4gICAgICAgICAgICAgICAgc2V0U3ViVGFicyh0YWIsIG5hdi5idWlsZGVyKCksIGRhc2hib2FyZHMsICRyb290U2NvcGUpO1xuICAgICAgICAgICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgICBtb2RhbC5kaXNtaXNzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfV1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgICRzY29wZS5kZWxldGVEYXNoYm9hcmQgPSAoKSA9PiB7XG4gICAgICBpZiAoJHNjb3BlLmhhc1NlbGVjdGlvbigpKSB7XG4gICAgICAgIHZhciBzZWxlY3RlZCA9ICRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zO1xuICAgICAgICB2YXIgbW9kYWwgPSAkbW9kYWwub3Blbih7XG4gICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdkZWxldGVEYXNoYm9hcmRNb2RhbC5odG1sJyksXG4gICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCAnJG1vZGFsSW5zdGFuY2UnLCAoJHNjb3BlLCAkbW9kYWxJbnN0YW5jZSkgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkID0gc2VsZWN0ZWQ7XG4gICAgICAgICAgICAkc2NvcGUub2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZGVsZXRlRGFzaGJvYXJkcygkc2NvcGUuc2VsZWN0ZWQsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gbGV0J3MganVzdCBiZSBzYWZlIGFuZCBlbnN1cmUgdGhlcmUncyBubyBzZWxlY3Rpb25zXG4gICAgICAgICAgICAgICAgZGVzZWxlY3RBbGwoKTtcbiAgICAgICAgICAgICAgICBzZXRTdWJUYWJzKHRhYiwgbmF2LmJ1aWxkZXIoKSwgZGFzaGJvYXJkcywgJHJvb3RTY29wZSk7XG4gICAgICAgICAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgICAgICAgIG1vZGFsLmRpc21pc3MoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgJHNjb3BlLmdpc3QgPSAoKSA9PiB7XG4gICAgICBpZiAoJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgaWQgPSAkc2NvcGUuc2VsZWN0ZWRJdGVtc1swXS5pZDtcbiAgICAgICAgJGxvY2F0aW9uLnBhdGgoXCIvZGFzaGJvYXJkL2lkL1wiICsgaWQgKyBcIi9zaGFyZVwiKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gdXBkYXRlRGF0YSgpIHtcbiAgICAgIHZhciB1cmwgPSAkcm91dGVQYXJhbXNbXCJocmVmXCJdO1xuICAgICAgaWYgKHVybCkge1xuICAgICAgICAkc2NvcGUudXJsID0gZGVjb2RlVVJJQ29tcG9uZW50KHVybCk7XG4gICAgICB9XG5cbiAgICAgIHZhciByb3V0ZVBhcmFtcyA9ICRyb3V0ZVBhcmFtc1tcInJvdXRlUGFyYW1zXCJdO1xuICAgICAgaWYgKHJvdXRlUGFyYW1zKSB7XG4gICAgICAgICRzY29wZS5yb3V0ZVBhcmFtcyA9IGRlY29kZVVSSUNvbXBvbmVudChyb3V0ZVBhcmFtcyk7XG4gICAgICB9XG4gICAgICB2YXIgc2l6ZTphbnkgPSAkcm91dGVQYXJhbXNbXCJzaXplXCJdO1xuICAgICAgaWYgKHNpemUpIHtcbiAgICAgICAgc2l6ZSA9IGRlY29kZVVSSUNvbXBvbmVudChzaXplKTtcbiAgICAgICAgJHNjb3BlLnByZWZlcnJlZFNpemUgPSBhbmd1bGFyLmZyb21Kc29uKHNpemUpO1xuICAgICAgfVxuICAgICAgdmFyIHRpdGxlOmFueSA9ICRyb3V0ZVBhcmFtc1tcInRpdGxlXCJdO1xuICAgICAgaWYgKHRpdGxlKSB7XG4gICAgICAgIHRpdGxlID0gZGVjb2RlVVJJQ29tcG9uZW50KHRpdGxlKTtcbiAgICAgICAgJHNjb3BlLndpZGdldFRpdGxlID0gdGl0bGU7XG4gICAgICB9XG5cbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkcygoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICBsb2cuZGVidWcoXCJMb2FkZWQgZGFzaGJvYXJkczogXCIsIGRhc2hib2FyZHMpO1xuICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXNoYm9hcmRMb2FkZWQoZXZlbnQsIGRhc2hib2FyZHMpIHtcbiAgICAgIGRhc2hib2FyZHMuZm9yRWFjaCgoZGFzaGJvYXJkKSA9PiB7XG4gICAgICAgIGRhc2hib2FyZC5oYXNoID0gJz9tYWluLXRhYj1kYXNoYm9hcmQmc3ViLXRhYj1kYXNoYm9hcmQtJyArIGRhc2hib2FyZC5pZDtcbiAgICAgIH0pO1xuICAgICAgJHNjb3BlLl9kYXNoYm9hcmRzID0gZGFzaGJvYXJkcztcblxuICAgICAgaWYgKGV2ZW50ID09PSBudWxsKSB7XG4gICAgICAgICRzY29wZS4kZW1pdCgnZGFzaGJvYXJkc1VwZGF0ZWQnLCBkYXNoYm9hcmRzKTtcbiAgICAgIH1cbiAgICAgIENvcmUuJGFwcGx5KCRyb290U2NvcGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRhc2hib2FyZHMoKSB7XG4gICAgICByZXR1cm4gJHNjb3BlLl9kYXNoYm9hcmRzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlc2VsZWN0QWxsKCkge1xuICAgICAgJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXMubGVuZ3RoID0gMDtcbiAgICB9XG5cbiAgfV0pO1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZEhlbHBlcnMudHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnRzIHRoZSBuZy5JTG9jYXRpb25TZXJ2aWNlIGludGVyZmFjZSBhbmQgaXMgdXNlZCBieSB0aGUgZGFzaGJvYXJkIHRvIHN1cHBseVxuICAgKiBjb250cm9sbGVycyB3aXRoIGEgc2F2ZWQgVVJMIGxvY2F0aW9uXG4gICAqXG4gICAqIEBjbGFzcyBSZWN0YW5nbGVMb2NhdGlvblxuICAgKi9cbiAgZXhwb3J0IGNsYXNzIFJlY3RhbmdsZUxvY2F0aW9uIHsgLy8gVE9ETyBpbXBsZW1lbnRzIG5nLklMb2NhdGlvblNlcnZpY2Uge1xuICAgIHByaXZhdGUgX3BhdGg6IHN0cmluZztcbiAgICBwcml2YXRlIF9oYXNoOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBfc2VhcmNoOiBhbnk7XG4gICAgcHJpdmF0ZSB1cmk6VVJJO1xuXG4gICAgY29uc3RydWN0b3IocHVibGljIGRlbGVnYXRlOm5nLklMb2NhdGlvblNlcnZpY2UsIHBhdGg6c3RyaW5nLCBzZWFyY2gsIGhhc2g6c3RyaW5nKSB7XG4gICAgICB0aGlzLl9wYXRoID0gcGF0aDtcbiAgICAgIHRoaXMuX3NlYXJjaCA9IHNlYXJjaDtcbiAgICAgIHRoaXMuX2hhc2ggPSBoYXNoO1xuICAgICAgdGhpcy51cmkgPSBuZXcgVVJJKHBhdGgpO1xuICAgICAgdGhpcy51cmkuc2VhcmNoKChxdWVyeSkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2VhcmNoO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgYWJzVXJsKCkge1xuICAgICAgcmV0dXJuIHRoaXMucHJvdG9jb2woKSArIHRoaXMuaG9zdCgpICsgXCI6XCIgKyB0aGlzLnBvcnQoKSArIHRoaXMucGF0aCgpICsgdGhpcy5zZWFyY2goKTtcbiAgICB9XG5cbiAgICBoYXNoKG5ld0hhc2g6c3RyaW5nID0gbnVsbCk6YW55IHtcbiAgICAgIGlmIChuZXdIYXNoKSB7XG4gICAgICAgIHRoaXMudXJpLnNlYXJjaChuZXdIYXNoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5faGFzaDtcbiAgICB9XG5cbiAgICBob3N0KCk6c3RyaW5nIHtcbiAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLmhvc3QoKTtcbiAgICB9XG5cbiAgICBwYXRoKG5ld1BhdGg6c3RyaW5nID0gbnVsbCk6YW55IHtcbiAgICAgIGlmIChuZXdQYXRoKSB7XG4gICAgICAgIHRoaXMudXJpLnBhdGgobmV3UGF0aCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX3BhdGg7XG4gICAgfVxuXG4gICAgcG9ydCgpOm51bWJlciB7XG4gICAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5wb3J0KCk7XG4gICAgfVxuXG4gICAgcHJvdG9jb2woKSB7XG4gICAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5wb3J0KCk7XG4gICAgfVxuXG4gICAgcmVwbGFjZSgpIHtcbiAgICAgIC8vIFRPRE9cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNlYXJjaChwYXJhbWV0ZXJzTWFwOmFueSA9IG51bGwpOmFueSB7XG4gICAgICBpZiAocGFyYW1ldGVyc01hcCkge1xuICAgICAgICB0aGlzLnVyaS5zZWFyY2gocGFyYW1ldGVyc01hcCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX3NlYXJjaDtcbiAgICB9XG5cbiAgICB1cmwobmV3VmFsdWU6IHN0cmluZyA9IG51bGwpOmFueSB7XG4gICAgICBpZiAobmV3VmFsdWUpIHtcbiAgICAgICAgdGhpcy51cmkgPSBuZXcgVVJJKG5ld1ZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5hYnNVcmwoKTtcbiAgICB9XG5cbiAgfVxufVxuIiwiLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFJlcG9zaXRvcnkudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwicmVjdGFuZ2xlTG9jYXRpb24udHNcIi8+XG5tb2R1bGUgRGFzaGJvYXJkIHtcblxuICB2YXIgbW9kdWxlczpBcnJheTxzdHJpbmc+ID0gdW5kZWZpbmVkO1xuXG4gIF9tb2R1bGUuZGlyZWN0aXZlKCdoYXd0aW9EYXNoYm9hcmQnLCBmdW5jdGlvbigpIHtcbiAgICBtb2R1bGVzID0gaGF3dGlvUGx1Z2luTG9hZGVyWydtb2R1bGVzJ10uZmlsdGVyKChuYW1lKSA9PiB7XG4gICAgICByZXR1cm4gXy5pc1N0cmluZyhuYW1lKSAmJiBuYW1lICE9PSAnbmcnO1xuICAgIH0pO1xuICAgIHJldHVybiBuZXcgRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlKCk7XG4gIH0pO1xuXG4gIGV4cG9ydCBjbGFzcyBHcmlkc3RlckRpcmVjdGl2ZSB7XG4gICAgcHVibGljIHJlc3RyaWN0ID0gJ0EnO1xuICAgIHB1YmxpYyByZXBsYWNlID0gdHJ1ZTtcblxuICAgIHB1YmxpYyBjb250cm9sbGVyID0gW1wiJHNjb3BlXCIsIFwiJGVsZW1lbnRcIiwgXCIkYXR0cnNcIiwgXCIkbG9jYXRpb25cIiwgXCIkcm91dGVQYXJhbXNcIiwgXCIkdGVtcGxhdGVDYWNoZVwiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgXCIkY29tcGlsZVwiLCBcIiR0ZW1wbGF0ZVJlcXVlc3RcIiwgXCIkaW50ZXJwb2xhdGVcIiwgXCIkbW9kYWxcIiwgXCIkc2NlXCIsIFwiJHRpbWVvdXRcIiwgKCRzY29wZSwgJGVsZW1lbnQsICRhdHRycywgJGxvY2F0aW9uLCAkcm91dGVQYXJhbXMsICR0ZW1wbGF0ZUNhY2hlLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnksICRjb21waWxlLCAkdGVtcGxhdGVSZXF1ZXN0LCAkaW50ZXJwb2xhdGUsICRtb2RhbCwgJHNjZSwgJHRpbWVvdXQpID0+IHtcblxuICAgICAgdmFyIGdyaWRTaXplID0gMTUwO1xuICAgICAgdmFyIGdyaWRNYXJnaW4gPSA2O1xuICAgICAgdmFyIGdyaWRIZWlnaHQ7XG5cbiAgICAgIHZhciBncmlkWCA9IGdyaWRTaXplO1xuICAgICAgdmFyIGdyaWRZID0gZ3JpZFNpemU7XG5cbiAgICAgIHZhciB3aWRnZXRNYXAgPSB7fTtcblxuICAgICAgdmFyIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSA9ICRzY29wZS4kZXZhbCgnZGFzaGJvYXJkUmVwb3NpdG9yeScpIHx8IGRhc2hib2FyZFJlcG9zaXRvcnk7XG5cbiAgICAgICRzY29wZS4kb24oJyRkZXN0cm95JywgKCkgPT4ge1xuICAgICAgICBhbmd1bGFyLmZvckVhY2god2lkZ2V0TWFwLCAod2lkZ2V0LCBrZXkpID0+IHtcbiAgICAgICAgICBpZiAoJ3Njb3BlJyBpbiB3aWRnZXQpIHtcbiAgICAgICAgICAgIHZhciBzY29wZSA9IHdpZGdldFsnc2NvcGUnXTtcbiAgICAgICAgICAgIHNjb3BlLiRkZXN0cm95KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRlc3Ryb3lXaWRnZXQod2lkZ2V0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgJGVsZW1lbnQub24oJyRkZXN0cm95JywgKCkgPT4ge1xuICAgICAgICAkc2NvcGUuJGRlc3Ryb3koKTtcbiAgICAgIH0pO1xuXG4gICAgICBzZXRUaW1lb3V0KHVwZGF0ZVdpZGdldHMsIDEwKTtcblxuICAgICAgZnVuY3Rpb24gZGVzdHJveVdpZGdldCh3aWRnZXQpIHtcbiAgICAgICAgdmFyIGdyaWRzdGVyID0gZ2V0R3JpZHN0ZXIoKTtcbiAgICAgICAgdmFyIHdpZGdldEVsZW0gPSBudWxsO1xuICAgICAgICAvLyBsZXRzIGRlc3Ryb3kgdGhlIHdpZGdldHMncyBzY29wZVxuICAgICAgICB2YXIgd2lkZ2V0RGF0YSA9IHdpZGdldE1hcFt3aWRnZXQuaWRdO1xuICAgICAgICBpZiAod2lkZ2V0RGF0YSkge1xuICAgICAgICAgIGRlbGV0ZSB3aWRnZXRNYXBbd2lkZ2V0LmlkXTtcbiAgICAgICAgICB3aWRnZXRFbGVtID0gd2lkZ2V0RGF0YS53aWRnZXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF3aWRnZXRFbGVtKSB7XG4gICAgICAgICAgLy8gbGV0cyBnZXQgdGhlIGxpIHBhcmVudCBlbGVtZW50IG9mIHRoZSB0ZW1wbGF0ZVxuICAgICAgICAgIHdpZGdldEVsZW0gPSAkZWxlbWVudC5maW5kKFwiW2RhdGEtd2lkZ2V0SWQ9J1wiICsgd2lkZ2V0LmlkICsgXCInXVwiKS5wYXJlbnQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZ3JpZHN0ZXIgJiYgd2lkZ2V0RWxlbSkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBncmlkc3Rlci5yZW1vdmVfd2lkZ2V0KHdpZGdldEVsZW0pO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgLy8gbm90aGluZyB0byBkbywgd2UnbGwgZGVzdHJveSB0aGUgZWxlbWVudCBiZWxvd1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAod2lkZ2V0RWxlbSkge1xuICAgICAgICAgIHdpZGdldEVsZW0ucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcmVtb3ZlV2lkZ2V0KHdpZGdldCkge1xuICAgICAgICBkZXN0cm95V2lkZ2V0KHdpZGdldCk7XG4gICAgICAgIC8vIGxldHMgdHJhc2ggdGhlIEpTT04gbWV0YWRhdGFcbiAgICAgICAgaWYgKCRzY29wZS5kYXNoYm9hcmQpIHtcbiAgICAgICAgICB2YXIgd2lkZ2V0cyA9ICRzY29wZS5kYXNoYm9hcmQud2lkZ2V0cztcbiAgICAgICAgICBpZiAod2lkZ2V0cykge1xuICAgICAgICAgICAgdmFyIHcgPSBfLnJlbW92ZSh3aWRnZXRzLCAodzphbnkpID0+IHcuaWQgPT09IHdpZGdldC5pZCk7XG4gICAgICAgICAgICBsb2cuZGVidWcoXCJSZW1vdmVkIHdpZGdldDpcIiwgdyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkoXCJSZW1vdmVkIHdpZGdldCBcIiArIHdpZGdldC50aXRsZSk7XG4gICAgICB9O1xuXG4gICAgICBmdW5jdGlvbiBjaGFuZ2VXaWRnZXRTaXplKHdpZGdldCwgc2l6ZWZ1bmMsIHNhdmVmdW5jKSB7XG4gICAgICAgIGlmICghd2lkZ2V0KSB7XG4gICAgICAgICAgbG9nLmRlYnVnKFwid2lkZ2V0IHVuZGVmaW5lZFwiKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGdyaWRzdGVyID0gZ2V0R3JpZHN0ZXIoKTtcbiAgICAgICAgbG9nLmRlYnVnKFwiV2lkZ2V0IElEOiBcIiwgd2lkZ2V0LmlkLCBcIiB3aWRnZXRNYXA6IFwiLCB3aWRnZXRNYXApO1xuICAgICAgICB2YXIgZW50cnkgPSB3aWRnZXRNYXBbd2lkZ2V0LmlkXTtcbiAgICAgICAgdmFyIHcgPSBlbnRyeS53aWRnZXQ7XG4gICAgICAgIHNpemVmdW5jKGVudHJ5KTtcbiAgICAgICAgZ3JpZHN0ZXIucmVzaXplX3dpZGdldCh3LCBlbnRyeS5zaXplX3gsIGVudHJ5LnNpemVfeSk7XG4gICAgICAgIGdyaWRzdGVyLnNldF9kb21fZ3JpZF9oZWlnaHQoKTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgc2F2ZWZ1bmMod2lkZ2V0KTtcbiAgICAgICAgfSwgNTApO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBvbldpZGdldFJlbmFtZWQod2lkZ2V0KSB7XG4gICAgICAgIHVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkoXCJSZW5hbWVkIHdpZGdldCB0byBcIiArIHdpZGdldC50aXRsZSk7XG4gICAgICB9O1xuXG4gICAgICBmdW5jdGlvbiB1cGRhdGVXaWRnZXRzKCkge1xuICAgICAgICAkc2NvcGUuaWQgPSAkc2NvcGUuJGV2YWwoJ2Rhc2hib2FyZElkJykgfHwgJHJvdXRlUGFyYW1zW1wiZGFzaGJvYXJkSWRcIl07XG4gICAgICAgICRzY29wZS5pZHggPSAkc2NvcGUuJGV2YWwoJ2Rhc2hib2FyZEluZGV4JykgfHwgJHJvdXRlUGFyYW1zW1wiZGFzaGJvYXJkSW5kZXhcIl07XG4gICAgICAgIGlmICgkc2NvcGUuaWQpIHtcbiAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2xvYWREYXNoYm9hcmRzJyk7XG4gICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXREYXNoYm9hcmQoJHNjb3BlLmlkLCBvbkRhc2hib2FyZExvYWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkcygoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdkYXNoYm9hcmRzVXBkYXRlZCcsIGRhc2hib2FyZHMpO1xuXG4gICAgICAgICAgICB2YXIgaWR4ID0gJHNjb3BlLmlkeCA/IHBhcnNlSW50KCRzY29wZS5pZHgpIDogMDtcbiAgICAgICAgICAgIHZhciBpZCA9IG51bGw7XG4gICAgICAgICAgICBpZiAoZGFzaGJvYXJkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIHZhciBkYXNoYm9hcmQgPSBkYXNoYm9hcmRzLmxlbmd0aCA+IGlkeCA/IGRhc2hib2FyZHNbaWR4XSA6IGRhc2hib2FyZFswXTtcbiAgICAgICAgICAgICAgaWQgPSBkYXNoYm9hcmQuaWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoJHNjb3BlLiRldmFsKCdkYXNoYm9hcmRFbWJlZGRlZCcpKSB7XG4gICAgICAgICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZCkge1xuICAgICAgICAgICAgICAkbG9jYXRpb24ucGF0aChcIi9kYXNoYm9hcmQvaWQvXCIgKyBpZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAkbG9jYXRpb24ucGF0aChcIi9kYXNoYm9hcmQvZWRpdFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gb25EYXNoYm9hcmRMb2FkKGRhc2hib2FyZCkge1xuICAgICAgICAkc2NvcGUuZGFzaGJvYXJkID0gZGFzaGJvYXJkO1xuICAgICAgICB2YXIgd2lkZ2V0cyA9ICgoZGFzaGJvYXJkKSA/IGRhc2hib2FyZC53aWRnZXRzIDogbnVsbCkgfHwgW107XG5cbiAgICAgICAgdmFyIG1pbkhlaWdodCA9IDEwO1xuICAgICAgICB2YXIgbWluV2lkdGggPSA2O1xuXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaCh3aWRnZXRzLCAod2lkZ2V0KSA9PiB7XG4gICAgICAgICAgaWYgKCF3aWRnZXQpIHtcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhcIlVuZGVmaW5lZCB3aWRnZXQsIHNraXBwaW5nXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQod2lkZ2V0LnJvdykgJiYgbWluSGVpZ2h0IDwgd2lkZ2V0LnJvdykge1xuICAgICAgICAgICAgbWluSGVpZ2h0ID0gd2lkZ2V0LnJvdyArIDE7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZCh3aWRnZXQuc2l6ZV94XG4gICAgICAgICAgICAgICYmIGFuZ3VsYXIuaXNEZWZpbmVkKHdpZGdldC5jb2wpKSkge1xuICAgICAgICAgICAgdmFyIHJpZ2h0RWRnZSA9IHdpZGdldC5jb2wgKyB3aWRnZXQuc2l6ZV94O1xuICAgICAgICAgICAgaWYgKHJpZ2h0RWRnZSA+IG1pbldpZHRoKSB7XG4gICAgICAgICAgICAgIG1pbldpZHRoID0gcmlnaHRFZGdlICsgMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBncmlkc3RlciA9ICRlbGVtZW50LmdyaWRzdGVyKHtcbiAgICAgICAgICB3aWRnZXRfbWFyZ2luczogW2dyaWRNYXJnaW4sIGdyaWRNYXJnaW5dLFxuICAgICAgICAgIHdpZGdldF9iYXNlX2RpbWVuc2lvbnM6IFtncmlkWCwgZ3JpZFldLFxuICAgICAgICAgIGV4dHJhX3Jvd3M6IG1pbkhlaWdodCxcbiAgICAgICAgICBleHRyYV9jb2xzOiBtaW5XaWR0aCxcbiAgICAgICAgICBtYXhfc2l6ZV94OiBtaW5XaWR0aCxcbiAgICAgICAgICBtYXhfc2l6ZV95OiBtaW5IZWlnaHQsXG4gICAgICAgICAgZHJhZ2dhYmxlOiB7XG4gICAgICAgICAgICBzdG9wOiAoZXZlbnQsIHVpKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChzZXJpYWxpemVEYXNoYm9hcmQoKSkge1xuICAgICAgICAgICAgICAgIHVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkoXCJDaGFuZ2luZyBkYXNoYm9hcmQgbGF5b3V0XCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KS5kYXRhKCdncmlkc3RlcicpO1xuXG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9ICR0ZW1wbGF0ZUNhY2hlLmdldChVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCBcIndpZGdldFRlbXBsYXRlLmh0bWxcIikpO1xuICAgICAgICB2YXIgcmVtYWluaW5nID0gd2lkZ2V0cy5sZW5ndGg7XG5cbiAgICAgICAgZnVuY3Rpb24gbWF5YmVGaW5pc2hVcCgpIHtcbiAgICAgICAgICByZW1haW5pbmcgPSByZW1haW5pbmcgLSAxO1xuICAgICAgICAgIGlmIChyZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgICAgIG1ha2VSZXNpemFibGUoKTtcbiAgICAgICAgICAgIGdldEdyaWRzdGVyKCkuZW5hYmxlKCk7XG4gICAgICAgICAgICBDb3JlLiRhcHBseSgkc2NvcGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGRvUmVtb3ZlV2lkZ2V0KCRtb2RhbCwgd2lkZ2V0KSB7XG4gICAgICAgICAgbG9nLmRlYnVnKFwiUmVtb3ZlIHdpZGdldDogXCIsIHdpZGdldCk7XG4gICAgICAgICAgdmFyIG1vZGFsID0gJG1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdkZWxldGVXaWRnZXRNb2RhbC5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICckbW9kYWxJbnN0YW5jZScsICgkc2NvcGUsICRtb2RhbEluc3RhbmNlKSA9PiB7XG4gICAgICAgICAgICAgICRzY29wZS53aWRnZXQgPSB3aWRnZXQ7XG4gICAgICAgICAgICAgICRzY29wZS5vayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBtb2RhbC5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIHJlbW92ZVdpZGdldCgkc2NvcGUud2lkZ2V0KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIG1vZGFsLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfV1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGRvUmVuYW1lV2lkZ2V0KCRtb2RhbCwgd2lkZ2V0KSB7XG4gICAgICAgICAgbG9nLmRlYnVnKFwiUmVuYW1lIHdpZGdldDogXCIsIHdpZGdldCk7XG4gICAgICAgICAgdmFyIG1vZGFsID0gJG1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdyZW5hbWVXaWRnZXRNb2RhbC5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICckbW9kYWxJbnN0YW5jZScsICgkc2NvcGUsICRtb2RhbEluc3RhbmNlKSA9PiB7XG4gICAgICAgICAgICAgICRzY29wZS53aWRnZXQgPSB3aWRnZXQ7XG4gICAgICAgICAgICAgICRzY29wZS5jb25maWcgPSB7XG4gICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgJ3RpdGxlJzoge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogd2lkZ2V0LnRpdGxlXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAkc2NvcGUub2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgbW9kYWwuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICBvbldpZGdldFJlbmFtZWQoJHNjb3BlLndpZGdldCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBtb2RhbC5kaXNtaXNzKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1dXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBhbmd1bGFyLmZvckVhY2god2lkZ2V0cywgKHdpZGdldCkgPT4ge1xuICAgICAgICAgIHZhciB0eXBlID0gJ2ludGVybmFsJztcbiAgICAgICAgICBpZiAoJ2lmcmFtZScgaW4gd2lkZ2V0KSB7XG4gICAgICAgICAgICB0eXBlID0gJ2V4dGVybmFsJztcbiAgICAgICAgICB9XG4gICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdleHRlcm5hbCc6XG4gICAgICAgICAgICAgIGxvZy5kZWJ1ZyhcIlJlbmRlcmluZyBleHRlcm5hbCAoaWZyYW1lKSB3aWRnZXQ6IFwiLCB3aWRnZXQudGl0bGUgfHwgd2lkZ2V0LmlkKTtcbiAgICAgICAgICAgICAgdmFyIHNjb3BlID0gJHNjb3BlLiRuZXcoKTtcbiAgICAgICAgICAgICAgc2NvcGUud2lkZ2V0ID0gd2lkZ2V0O1xuICAgICAgICAgICAgICBzY29wZS5yZW1vdmVXaWRnZXQgPSAod2lkZ2V0KSA9PiBkb1JlbW92ZVdpZGdldCgkbW9kYWwsIHdpZGdldCk7XG4gICAgICAgICAgICAgIHNjb3BlLnJlbmFtZVdpZGdldCA9ICh3aWRnZXQpID0+IGRvUmVuYW1lV2lkZ2V0KCRtb2RhbCwgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgdmFyIHdpZGdldEJvZHk6YW55ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldChVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAnaWZyYW1lV2lkZ2V0VGVtcGxhdGUuaHRtbCcpKSk7XG4gICAgICAgICAgICAgIHZhciBvdXRlckRpdiA9IGFuZ3VsYXIuZWxlbWVudCgkdGVtcGxhdGVDYWNoZS5nZXQoVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ3dpZGdldEJsb2NrVGVtcGxhdGUuaHRtbCcpKSk7XG4gICAgICAgICAgICAgIHdpZGdldEJvZHkuZmluZCgnaWZyYW1lJykuYXR0cignc3JjJywgd2lkZ2V0LmlmcmFtZSk7XG4gICAgICAgICAgICAgIG91dGVyRGl2LmFwcGVuZCgkY29tcGlsZSh3aWRnZXRCb2R5KShzY29wZSkpO1xuICAgICAgICAgICAgICB2YXIgdyA9IGdyaWRzdGVyLmFkZF93aWRnZXQob3V0ZXJEaXYsIHdpZGdldC5zaXplX3gsIHdpZGdldC5zaXplX3ksIHdpZGdldC5jb2wsIHdpZGdldC5yb3cpO1xuICAgICAgICAgICAgICB3aWRnZXRNYXBbd2lkZ2V0LmlkXSA9IHtcbiAgICAgICAgICAgICAgICB3aWRnZXQ6IHdcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgbWF5YmVGaW5pc2hVcCgpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2ludGVybmFsJzogXG4gICAgICAgICAgICAgIGxvZy5kZWJ1ZyhcIlJlbmRlcmluZyBpbnRlcm5hbCB3aWRnZXQ6IFwiLCB3aWRnZXQudGl0bGUgfHwgd2lkZ2V0LmlkKTtcbiAgICAgICAgICAgICAgdmFyIHBhdGggPSB3aWRnZXQucGF0aDtcbiAgICAgICAgICAgICAgdmFyIHNlYXJjaCA9IG51bGw7XG4gICAgICAgICAgICAgIGlmICh3aWRnZXQuc2VhcmNoKSB7XG4gICAgICAgICAgICAgICAgc2VhcmNoID0gRGFzaGJvYXJkLmRlY29kZVVSSUNvbXBvbmVudFByb3BlcnRpZXMod2lkZ2V0LnNlYXJjaCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHdpZGdldC5yb3V0ZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIF8uZXh0ZW5kKHNlYXJjaCwgYW5ndWxhci5mcm9tSnNvbih3aWRnZXQucm91dGVQYXJhbXMpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB2YXIgaGFzaCA9IHdpZGdldC5oYXNoOyAvLyBUT0RPIGRlY29kZSBvYmplY3Q/XG4gICAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IG5ldyBSZWN0YW5nbGVMb2NhdGlvbigkbG9jYXRpb24sIHBhdGgsIHNlYXJjaCwgaGFzaCk7XG4gICAgICAgICAgICAgIGlmICghd2lkZ2V0LnNpemVfeCB8fCB3aWRnZXQuc2l6ZV94IDwgMSkge1xuICAgICAgICAgICAgICAgIHdpZGdldC5zaXplX3ggPSAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmICghd2lkZ2V0LnNpemVfeSB8fCB3aWRnZXQuc2l6ZV95IDwgMSkge1xuICAgICAgICAgICAgICAgIHdpZGdldC5zaXplX3kgPSAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHZhciB0bXBNb2R1bGVOYW1lID0gJ2Rhc2hib2FyZC0nICsgd2lkZ2V0LmlkO1xuICAgICAgICAgICAgICB2YXIgcGx1Z2lucyA9IF8uZmlsdGVyKGhhd3Rpb1BsdWdpbkxvYWRlci5nZXRNb2R1bGVzKCksIChtb2R1bGUpID0+IGFuZ3VsYXIuaXNTdHJpbmcobW9kdWxlKSk7XG4gICAgICAgICAgICAgIHZhciB0bXBNb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSh0bXBNb2R1bGVOYW1lLCBwbHVnaW5zKTtcblxuICAgICAgICAgICAgICBmdW5jdGlvbiBnZXRTZXJ2aWNlcyhtb2R1bGU6c3RyaW5nLCBhbnN3ZXI/OmFueSkge1xuICAgICAgICAgICAgICAgIGlmICghYW5zd2VyKSB7XG4gICAgICAgICAgICAgICAgICBhbnN3ZXIgPSA8YW55Pnt9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfLmZvckVhY2goYW5ndWxhci5tb2R1bGUobW9kdWxlKS5yZXF1aXJlcywgKG0pID0+IGdldFNlcnZpY2VzKG0sIGFuc3dlcikpO1xuICAgICAgICAgICAgICAgIF8uZm9yRWFjaCgoPGFueT5hbmd1bGFyLm1vZHVsZShtb2R1bGUpKS5faW52b2tlUXVldWUsIChhKSA9PiB7XG4gICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBhbnN3ZXJbYVsyXVswXV0gPSBIYXd0aW9Db3JlLmluamVjdG9yLmdldChhWzJdWzBdKTtcbiAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAvL25vdGhpbmcgdG8gZG9cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYW5zd2VyO1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB2YXIgc2VydmljZXMgPSB7fTtcbiAgICAgICAgICAgICAgXy5mb3JFYWNoKHBsdWdpbnMsIChwbHVnaW46c3RyaW5nKSA9PiBwbHVnaW4gPyBnZXRTZXJ2aWNlcyhwbHVnaW4sIHNlcnZpY2VzKSA6IGNvbnNvbGUubG9nKFwibnVsbCBwbHVnaW4gbmFtZVwiKSk7XG4gICAgICAgICAgICAgIC8vbG9nLmRlYnVnKFwic2VydmljZXM6IFwiLCBzZXJ2aWNlcyk7XG5cbiAgICAgICAgICAgICAgdG1wTW9kdWxlLmNvbmZpZyhbJyRwcm92aWRlJywgKCRwcm92aWRlKSA9PiB7XG4gICAgICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKCdIYXd0aW9EYXNoYm9hcmQnLCBbJyRkZWxlZ2F0ZScsICckcm9vdFNjb3BlJywgKCRkZWxlZ2F0ZSwgJHJvb3RTY29wZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgJGRlbGVnYXRlLmluRGFzaGJvYXJkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiAkZGVsZWdhdGU7XG4gICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcignJGxvY2F0aW9uJywgWyckZGVsZWdhdGUnLCAoJGRlbGVnYXRlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAvL2xvZy5kZWJ1ZyhcIlVzaW5nICRsb2NhdGlvbjogXCIsIGxvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBsb2NhdGlvbjtcbiAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKCckcm91dGUnLCBbJyRkZWxlZ2F0ZScsICgkZGVsZWdhdGUpID0+IHtcbiAgICAgICAgICAgICAgICAgIC8vIHJlYWxseSBoYW5keSBmb3IgZGVidWdnaW5nLCBtb3N0bHkgdG8gdGVsbCBpZiBhIHdpZGdldCdzIHJvdXRlXG4gICAgICAgICAgICAgICAgICAvLyBpc24ndCBhY3R1YWxseSBhdmFpbGFibGUgaW4gdGhlIGNoaWxkIGFwcFxuICAgICAgICAgICAgICAgICAgLy9sb2cuZGVidWcoXCJVc2luZyAkcm91dGU6IFwiLCAkZGVsZWdhdGUpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuICRkZWxlZ2F0ZTtcbiAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKCckcm91dGVQYXJhbXMnLCBbJyRkZWxlZ2F0ZScsICgkZGVsZWdhdGUpID0+IHtcbiAgICAgICAgICAgICAgICAgIC8vbG9nLmRlYnVnKFwiVXNpbmcgJHJvdXRlUGFyYW1zOiBcIiwgc2VhcmNoKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBzZWFyY2g7XG4gICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgIF8uZm9ySW4oc2VydmljZXMsIChzZXJ2aWNlLCBuYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgICBzd2l0Y2gobmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICckbG9jYXRpb24nOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICckcm91dGUnOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICckcm91dGVQYXJhbXMnOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICdIYXd0aW9EYXNoYm9hcmQnOlxuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdkYXNoYm9hcmRSZXBvc2l0b3J5JzpcbiAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKG5hbWUsIFsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcblxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnSGF3dGlvRGFzaGJvYXJkVGFiJzpcbiAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKG5hbWUsIFsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IGVtYmVkZGVkOiB0cnVlIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ0J1aWxkZXJGYWN0b3J5UHJvdmlkZXInOlxuICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IobmFtZSwgWygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdldER1bW15QnVpbGRlckZhY3RvcnkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcblxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnSGF3dGlvTmF2JzpcbiAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKG5hbWUsIFsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXREdW1teUhhd3Rpb05hdigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm90aGluZyB0byBkb1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAvL2xvZy5kZWJ1ZyhcIm5hbWU6IFwiLCBuYW1lLCBcIiBzZXJ2aWNlOiBcIiwgc2VydmljZSk7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKF8uc3RhcnRzV2l0aChuYW1lLCAnJCcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IobmFtZSwgWygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nLmRlYnVnKFwiUmV0dXJuaW5nIGV4aXN0aW5nIHNlcnZpY2UgZm9yOiBcIiwgbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXJ2aWNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWdub3JlLCB0aGlzJ2xsIGhhcHBlbiBmb3IgY29uc3RhbnRzIGFuZCBzdHVmZlxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICB0bXBNb2R1bGUuY29udHJvbGxlcignSGF3dGlvRGFzaGJvYXJkLlRpdGxlJywgW1wiJHNjb3BlXCIsIFwiJG1vZGFsXCIsICgkc2NvcGUsICRtb2RhbCkgPT4ge1xuICAgICAgICAgICAgICAgICRzY29wZS53aWRnZXQgPSB3aWRnZXQ7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnJlbW92ZVdpZGdldCA9ICh3aWRnZXQpID0+IGRvUmVtb3ZlV2lkZ2V0KCRtb2RhbCwgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgICAkc2NvcGUucmVuYW1lV2lkZ2V0ID0gKHdpZGdldCkgPT4gZG9SZW5hbWVXaWRnZXQoJG1vZGFsLCB3aWRnZXQpO1xuICAgICAgICAgICAgICB9XSk7XG5cbiAgICAgICAgICAgICAgdmFyIGRpdjphbnkgPSAkKHRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgZGl2LmF0dHIoeyAnZGF0YS13aWRnZXRJZCc6IHdpZGdldC5pZCB9KTtcbiAgICAgICAgICAgICAgdmFyIGJvZHkgPSBkaXYuZmluZCgnLndpZGdldC1ib2R5Jyk7XG4gICAgICAgICAgICAgIGxvZy5kZWJ1ZyhcImluY2x1ZGU6IFwiLCB3aWRnZXQuaW5jbHVkZSk7XG4gICAgICAgICAgICAgIHZhciB3aWRnZXRCb2R5ID0gJHRlbXBsYXRlQ2FjaGUuZ2V0KHdpZGdldC5pbmNsdWRlKTtcbiAgICAgICAgICAgICAgJHRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHZhciBvdXRlckRpdiA9IGFuZ3VsYXIuZWxlbWVudCgkdGVtcGxhdGVDYWNoZS5nZXQoVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ3dpZGdldEJsb2NrVGVtcGxhdGUuaHRtbCcpKSk7XG4gICAgICAgICAgICAgICAgYm9keS5odG1sKHdpZGdldEJvZHkpO1xuICAgICAgICAgICAgICAgIG91dGVyRGl2Lmh0bWwoZGl2KTtcbiAgICAgICAgICAgICAgICBhbmd1bGFyLmJvb3RzdHJhcChkaXYsIFt0bXBNb2R1bGVOYW1lXSk7XG4gICAgICAgICAgICAgICAgd2lkZ2V0TWFwW3dpZGdldC5pZF0gPSB7XG4gICAgICAgICAgICAgICAgICB3aWRnZXQ6IGdyaWRzdGVyLmFkZF93aWRnZXQob3V0ZXJEaXYsIHdpZGdldC5zaXplX3gsIHdpZGdldC5zaXplX3ksIHdpZGdldC5jb2wsIHdpZGdldC5yb3cpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBtYXliZUZpbmlzaFVwKCk7XG4gICAgICAgICAgICAgIH0sIDUwKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gc2VyaWFsaXplRGFzaGJvYXJkKCkge1xuICAgICAgICB2YXIgZ3JpZHN0ZXIgPSBnZXRHcmlkc3RlcigpO1xuICAgICAgICBpZiAoZ3JpZHN0ZXIpIHtcbiAgICAgICAgICB2YXIgZGF0YSA9IGdyaWRzdGVyLnNlcmlhbGl6ZSgpO1xuICAgICAgICAgIC8vY29uc29sZS5sb2coXCJnb3QgZGF0YTogXCIgKyBKU09OLnN0cmluZ2lmeShkYXRhKSk7XG5cbiAgICAgICAgICB2YXIgd2lkZ2V0cyA9ICRzY29wZS5kYXNoYm9hcmQud2lkZ2V0cyB8fCBbXTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIldpZGdldHM6IFwiLCB3aWRnZXRzKTtcblxuICAgICAgICAgIC8vIGxldHMgYXNzdW1lIHRoZSBkYXRhIGlzIGluIHRoZSBvcmRlciBvZiB0aGUgd2lkZ2V0cy4uLlxuICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaCh3aWRnZXRzLCAod2lkZ2V0LCBpZHgpID0+IHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGRhdGFbaWR4XTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB3aWRnZXQpIHtcbiAgICAgICAgICAgICAgLy8gbGV0cyBjb3B5IHRoZSB2YWx1ZXMgYWNyb3NzXG4gICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaCh2YWx1ZSwgKGF0dHIsIGtleSkgPT4gd2lkZ2V0W2tleV0gPSBhdHRyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG1ha2VSZXNpemFibGUoKSB7XG4gICAgICAgIHZhciBibG9ja3M6YW55ID0gJCgnLmdyaWQtYmxvY2snKTtcbiAgICAgICAgYmxvY2tzLnJlc2l6YWJsZSgnZGVzdHJveScpO1xuXG4gICAgICAgIGJsb2Nrcy5yZXNpemFibGUoe1xuICAgICAgICAgIGdyaWQ6IFtncmlkU2l6ZSArIChncmlkTWFyZ2luICogMiksIGdyaWRTaXplICsgKGdyaWRNYXJnaW4gKiAyKV0sXG4gICAgICAgICAgYW5pbWF0ZTogZmFsc2UsXG4gICAgICAgICAgbWluV2lkdGg6IGdyaWRTaXplLFxuICAgICAgICAgIG1pbkhlaWdodDogZ3JpZFNpemUsXG4gICAgICAgICAgYXV0b0hpZGU6IGZhbHNlLFxuICAgICAgICAgIHN0YXJ0OiBmdW5jdGlvbihldmVudCwgdWkpIHtcbiAgICAgICAgICAgIGdyaWRIZWlnaHQgPSBnZXRHcmlkc3RlcigpLiRlbC5oZWlnaHQoKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlc2l6ZTogZnVuY3Rpb24oZXZlbnQsIHVpKSB7XG4gICAgICAgICAgICAvL3NldCBuZXcgZ3JpZCBoZWlnaHQgYWxvbmcgdGhlIGRyYWdnaW5nIHBlcmlvZFxuICAgICAgICAgICAgdmFyIGcgPSBnZXRHcmlkc3RlcigpO1xuICAgICAgICAgICAgdmFyIGRlbHRhID0gZ3JpZFNpemUgKyBncmlkTWFyZ2luICogMjtcbiAgICAgICAgICAgIGlmIChldmVudC5vZmZzZXRZID4gZy4kZWwuaGVpZ2h0KCkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHZhciBleHRyYSA9IE1hdGguZmxvb3IoKGV2ZW50Lm9mZnNldFkgLSBncmlkSGVpZ2h0KSAvIGRlbHRhICsgMSk7XG4gICAgICAgICAgICAgIHZhciBuZXdIZWlnaHQgPSBncmlkSGVpZ2h0ICsgZXh0cmEgKiBkZWx0YTtcbiAgICAgICAgICAgICAgZy4kZWwuY3NzKCdoZWlnaHQnLCBuZXdIZWlnaHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgc3RvcDogZnVuY3Rpb24oZXZlbnQsIHVpKSB7XG4gICAgICAgICAgICB2YXIgcmVzaXplZCA9ICQodGhpcyk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXNpemVCbG9jayhyZXNpemVkKTtcbiAgICAgICAgICAgIH0sIDMwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAkKCcudWktcmVzaXphYmxlLWhhbmRsZScpLmhvdmVyKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGdldEdyaWRzdGVyKCkuZGlzYWJsZSgpO1xuICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBnZXRHcmlkc3RlcigpLmVuYWJsZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgfVxuXG5cbiAgICAgIGZ1bmN0aW9uIHJlc2l6ZUJsb2NrKGVsbU9iaikge1xuICAgICAgICB2YXIgYXJlYSA9IGVsbU9iai5maW5kKCcud2lkZ2V0LWFyZWEnKTtcbiAgICAgICAgdmFyIHcgPSBlbG1PYmoud2lkdGgoKSAtIGdyaWRTaXplO1xuICAgICAgICB2YXIgaCA9IGVsbU9iai5oZWlnaHQoKSAtIGdyaWRTaXplO1xuXG4gICAgICAgIGZvciAodmFyIGdyaWRfdyA9IDE7IHcgPiAwOyB3IC09IChncmlkU2l6ZSArIChncmlkTWFyZ2luICogMikpKSB7XG4gICAgICAgICAgZ3JpZF93Kys7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBncmlkX2ggPSAxOyBoID4gMDsgaCAtPSAoZ3JpZFNpemUgKyAoZ3JpZE1hcmdpbiAqIDIpKSkge1xuICAgICAgICAgIGdyaWRfaCsrO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHdpZGdldCA9IHtcbiAgICAgICAgICBpZDogYXJlYS5hdHRyKCdkYXRhLXdpZGdldElkJylcbiAgICAgICAgfTtcblxuICAgICAgICBjaGFuZ2VXaWRnZXRTaXplKHdpZGdldCwgZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgICAgICAgd2lkZ2V0LnNpemVfeCA9IGdyaWRfdztcbiAgICAgICAgICB3aWRnZXQuc2l6ZV95ID0gZ3JpZF9oO1xuICAgICAgICB9LCBmdW5jdGlvbih3aWRnZXQpIHtcbiAgICAgICAgICBpZiAoc2VyaWFsaXplRGFzaGJvYXJkKCkpIHtcbiAgICAgICAgICAgIHVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkoXCJDaGFuZ2VkIHNpemUgb2Ygd2lkZ2V0OiBcIiArIHdpZGdldC5pZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiB1cGRhdGVEYXNoYm9hcmRSZXBvc2l0b3J5KG1lc3NhZ2U6IHN0cmluZykge1xuICAgICAgICBpZiAoJHNjb3BlLmRhc2hib2FyZCkge1xuICAgICAgICAgIHZhciBjb21taXRNZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICBpZiAoJHNjb3BlLmRhc2hib2FyZCAmJiAkc2NvcGUuZGFzaGJvYXJkLnRpdGxlKSB7XG4gICAgICAgICAgICBjb21taXRNZXNzYWdlICs9IFwiIG9uIGRhc2hib2FyZCBcIiArICRzY29wZS5kYXNoYm9hcmQudGl0bGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbJHNjb3BlLmRhc2hib2FyZF0sIGNvbW1pdE1lc3NhZ2UsIERhc2hib2FyZC5vbk9wZXJhdGlvbkNvbXBsZXRlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBnZXRHcmlkc3RlcigpIHtcbiAgICAgICAgcmV0dXJuICRlbGVtZW50LmdyaWRzdGVyKCkuZGF0YSgnZ3JpZHN0ZXInKTtcbiAgICAgIH1cblxuICAgIH1dO1xuXG4gIH1cblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG4gIF9tb2R1bGUuY29udHJvbGxlcihcIkRhc2hib2FyZC5JbXBvcnRDb250cm9sbGVyXCIsIFtcIiRzY29wZVwiLCBcIiRsb2NhdGlvblwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgKCRzY29wZSwgJGxvY2F0aW9uLCAkcm91dGVQYXJhbXMsIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSkgPT4ge1xuICAgICRzY29wZS5wbGFjZWhvbGRlciA9IFwiUGFzdGUgdGhlIEpTT04gaGVyZSBmb3IgdGhlIGRhc2hib2FyZCBjb25maWd1cmF0aW9uIHRvIGltcG9ydC4uLlwiO1xuICAgICRzY29wZS5zb3VyY2UgPSAkc2NvcGUucGxhY2Vob2xkZXI7XG5cbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIG1vZGU6IHtcbiAgICAgICAgbmFtZTogXCJqYXZhc2NyaXB0XCJcbiAgICAgIH1cbiAgICB9O1xuICAgIC8vJHNjb3BlLmNvZGVNaXJyb3JPcHRpb25zID0gQ29kZUVkaXRvci5jcmVhdGVFZGl0b3JTZXR0aW5ncyhvcHRpb25zKTtcblxuXG4gICAgJHNjb3BlLmlzVmFsaWQgPSAoKSA9PiAkc2NvcGUuc291cmNlICYmICRzY29wZS5zb3VyY2UgIT09ICRzY29wZS5wbGFjZWhvbGRlcjtcblxuICAgICRzY29wZS5pbXBvcnRKU09OID0gKCkgPT4ge1xuICAgICAgdmFyIGpzb24gPSBbXTtcbiAgICAgIC8vIGxldHMgcGFyc2UgdGhlIEpTT04uLi5cbiAgICAgIHRyeSB7XG4gICAgICAgIGpzb24gPSBKU09OLnBhcnNlKCRzY29wZS5zb3VyY2UpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvL0hhd3Rpb0NvcmUubm90aWZpY2F0aW9uKFwiZXJyb3JcIiwgXCJDb3VsZCBub3QgcGFyc2UgdGhlIEpTT05cXG5cIiArIGUpO1xuICAgICAgICBqc29uID0gW107XG4gICAgICB9XG4gICAgICB2YXIgYXJyYXkgPSBbXTtcbiAgICAgIGlmIChhbmd1bGFyLmlzQXJyYXkoanNvbikpIHtcbiAgICAgICAgYXJyYXkgPSBqc29uO1xuICAgICAgfSBlbHNlIGlmIChhbmd1bGFyLmlzT2JqZWN0KGpzb24pKSB7XG4gICAgICAgIGFycmF5LnB1c2goanNvbik7XG4gICAgICB9XG5cbiAgICAgIGlmIChhcnJheS5sZW5ndGgpIHtcbiAgICAgICAgLy8gbGV0cyBlbnN1cmUgd2UgaGF2ZSBzb21lIHZhbGlkIGlkcyBhbmQgc3R1ZmYuLi5cbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKGFycmF5LCAoZGFzaCwgaW5kZXgpID0+IHtcbiAgICAgICAgICBhbmd1bGFyLmNvcHkoZGFzaCwgZGFzaGJvYXJkUmVwb3NpdG9yeS5jcmVhdGVEYXNoYm9hcmQoZGFzaCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKGFycmF5LCBcIkltcG9ydGVkIGRhc2hib2FyZCBKU09OXCIsIERhc2hib2FyZC5vbk9wZXJhdGlvbkNvbXBsZXRlKTtcbiAgICAgICAgJGxvY2F0aW9uLnBhdGgoXCIvZGFzaGJvYXJkL2VkaXRcIik7XG4gICAgICB9XG4gICAgfVxuICB9XSk7XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcbiAgX21vZHVsZS5jb250cm9sbGVyKFwiRGFzaGJvYXJkLk5hdkJhckNvbnRyb2xsZXJcIiwgW1wiJHNjb3BlXCIsIFwiJHJvdXRlUGFyYW1zXCIsIFwiJHJvb3RTY29wZVwiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgKCRzY29wZSwgJHJvdXRlUGFyYW1zLCAkcm9vdFNjb3BlLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnkpID0+IHtcblxuICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IFtdO1xuXG4gICAgJHNjb3BlLmFjdGl2ZURhc2hib2FyZCA9ICRyb3V0ZVBhcmFtc1snZGFzaGJvYXJkSWQnXTtcblxuICAgICRzY29wZS4kb24oJ2xvYWREYXNoYm9hcmRzJywgbG9hZERhc2hib2FyZHMpO1xuXG4gICAgJHNjb3BlLiRvbignZGFzaGJvYXJkc1VwZGF0ZWQnLCBkYXNoYm9hcmRMb2FkZWQpO1xuXG4gICAgJHNjb3BlLmRhc2hib2FyZHMgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gJHNjb3BlLl9kYXNoYm9hcmRzXG4gICAgfTtcblxuICAgICRzY29wZS5vblRhYlJlbmFtZWQgPSBmdW5jdGlvbihkYXNoKSB7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoW2Rhc2hdLCBcIlJlbmFtZWQgZGFzaGJvYXJkXCIsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBkYXNoYm9hcmRMb2FkZWQoZXZlbnQsIGRhc2hib2FyZHMpIHtcbiAgICAgIGxvZy5kZWJ1ZyhcIm5hdmJhciBkYXNoYm9hcmRMb2FkZWQ6IFwiLCBkYXNoYm9hcmRzKTtcbiAgICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IGRhc2hib2FyZHM7XG4gICAgICBpZiAoZXZlbnQgPT09IG51bGwpIHtcbiAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdkYXNoYm9hcmRzVXBkYXRlZCcsIGRhc2hib2FyZHMpO1xuICAgICAgICBDb3JlLiRhcHBseSgkc2NvcGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvYWREYXNoYm9hcmRzKGV2ZW50KSB7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZHMoKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgLy8gcHJldmVudCB0aGUgYnJvYWRjYXN0IGZyb20gaGFwcGVuaW5nLi4uXG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfV0pO1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG4gIGV4cG9ydCB2YXIgU2hhcmVDb250cm9sbGVyID0gX21vZHVsZS5jb250cm9sbGVyKFwiRGFzaGJvYXJkLlNoYXJlQ29udHJvbGxlclwiLCBbXCIkc2NvcGVcIiwgXCIkbG9jYXRpb25cIiwgXCIkcm91dGVQYXJhbXNcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsICgkc2NvcGUsICRsb2NhdGlvbiwgJHJvdXRlUGFyYW1zLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnkpID0+IHtcbiAgICB2YXIgaWQgPSAkcm91dGVQYXJhbXNbXCJkYXNoYm9hcmRJZFwiXTtcbiAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZChpZCwgb25EYXNoYm9hcmRMb2FkKTtcblxuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgbW9kZToge1xuICAgICAgICAgIG5hbWU6IFwiamF2YXNjcmlwdFwiXG4gICAgICB9XG4gICAgfTtcbiAgICAvLyRzY29wZS5jb2RlTWlycm9yT3B0aW9ucyA9IENvZGVFZGl0b3IuY3JlYXRlRWRpdG9yU2V0dGluZ3Mob3B0aW9ucyk7XG5cbiAgICBmdW5jdGlvbiBvbkRhc2hib2FyZExvYWQoZGFzaGJvYXJkKSB7XG4gICAgICAkc2NvcGUuZGFzaGJvYXJkID0gRGFzaGJvYXJkLmNsZWFuRGFzaGJvYXJkRGF0YShkYXNoYm9hcmQpO1xuXG4gICAgICAkc2NvcGUuanNvbiA9IHtcbiAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcImhhd3RpbyBkYXNoYm9hcmRzXCIsXG4gICAgICAgIFwicHVibGljXCI6IHRydWUsXG4gICAgICAgIFwiZmlsZXNcIjoge1xuICAgICAgICAgIFwiZGFzaGJvYXJkcy5qc29uXCI6IHtcbiAgICAgICAgICAgIFwiY29udGVudFwiOiBKU09OLnN0cmluZ2lmeSgkc2NvcGUuZGFzaGJvYXJkLCBudWxsLCBcIiAgXCIpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuc291cmNlID0gSlNPTi5zdHJpbmdpZnkoJHNjb3BlLmRhc2hib2FyZCwgbnVsbCwgXCIgIFwiKTtcbiAgICAgIENvcmUuJGFwcGx5Tm93T3JMYXRlcigkc2NvcGUpO1xuICAgIH1cbiAgfV0pO1xufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

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