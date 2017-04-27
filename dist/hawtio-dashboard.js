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
            if (!angular.isString(key) || (!_.startsWith(key, '$') && !_.startsWith(key, '_'))) {
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
    Dashboard._module.controller("Dashboard.EditDashboardsController", ["$scope", "$routeParams", "$route", "$location", "$rootScope", "dashboardRepository", "HawtioNav", "$timeout", "$templateCache", "$uibModal", "HawtioDashboardTab", function ($scope, $routeParams, $route, $location, $rootScope, dashboardRepository, nav, $timeout, $templateCache, $uibModal, tab) {
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
                var modal = $uibModal.open({
                    templateUrl: UrlHelpers.join(Dashboard.templatePath, 'createDashboardModal.html'),
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
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
                    var modal = $uibModal.open({
                        templateUrl: UrlHelpers.join(Dashboard.templatePath, 'renameDashboardModal.html'),
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
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
                    var modal = $uibModal.open({
                        templateUrl: UrlHelpers.join(Dashboard.templatePath, 'deleteDashboardModal.html'),
                        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
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
            this.controller = ["$scope", "$element", "$attrs", "$location", "$routeParams", "$templateCache", "dashboardRepository", "$compile", "$templateRequest", "$interpolate", "$uibModal", "$sce", "$timeout", function ($scope, $element, $attrs, $location, $routeParams, $templateCache, dashboardRepository, $compile, $templateRequest, $interpolate, $uibModal, $sce, $timeout) {
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
                        function doRemoveWidget($uibModal, widget) {
                            Dashboard.log.debug("Remove widget: ", widget);
                            var modal = $uibModal.open({
                                templateUrl: UrlHelpers.join(Dashboard.templatePath, 'deleteWidgetModal.html'),
                                controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
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
                        function doRenameWidget($uibModal, widget) {
                            Dashboard.log.debug("Rename widget: ", widget);
                            var modal = $uibModal.open({
                                templateUrl: UrlHelpers.join(Dashboard.templatePath, 'renameWidgetModal.html'),
                                controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
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
                                    scope.removeWidget = function (widget) { return doRemoveWidget($uibModal, widget); };
                                    scope.renameWidget = function (widget) { return doRenameWidget($uibModal, widget); };
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
                                    var getServices_1 = function (module, answer) {
                                        if (!answer) {
                                            answer = {};
                                        }
                                        _.forEach(angular.module(module).requires, function (m) { return getServices_1(m, answer); });
                                        _.forEach(angular.module(module)._invokeQueue, function (a) {
                                            try {
                                                answer[a[2][0]] = HawtioCore.injector.get(a[2][0]);
                                            }
                                            catch (err) {
                                            }
                                        });
                                        return answer;
                                    };
                                    var services = {};
                                    _.forEach(plugins, function (plugin) { return plugin ? getServices_1(plugin, services) : console.log("null plugin name"); });
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
                                    tmpModule.controller('HawtioDashboard.Title', ["$scope", "$uibModal", function ($scope, $uibModal) {
                                            $scope.widget = widget;
                                            $scope.removeWidget = function (widget) { return doRemoveWidget($uibModal, widget); };
                                            $scope.renameWidget = function (widget) { return doRenameWidget($uibModal, widget); };
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
                        blocks.resizable();
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBsdWdpbnMvZGFzaGJvYXJkL3RzL2Rhc2hib2FyZEhlbHBlcnMudHMiLCJwbHVnaW5zL2Rhc2hib2FyZC90cy9kYXNoYm9hcmRQbHVnaW4udHMiLCJwbHVnaW5zL2Rhc2hib2FyZC90cy9kYXNoYm9hcmRSZXBvc2l0b3J5LnRzIiwicGx1Z2lucy9kYXNoYm9hcmQvdHMvZWRpdERhc2hib2FyZHMudHMiLCJwbHVnaW5zL2Rhc2hib2FyZC90cy9yZWN0YW5nbGVMb2NhdGlvbi50cyIsInBsdWdpbnMvZGFzaGJvYXJkL3RzL2dyaWRzdGVyRGlyZWN0aXZlLnRzIiwicGx1Z2lucy9kYXNoYm9hcmQvdHMvaW1wb3J0LnRzIiwicGx1Z2lucy9kYXNoYm9hcmQvdHMvbmF2YmFyLnRzIiwicGx1Z2lucy9kYXNoYm9hcmQvdHMvc2hhcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBS0EsSUFBTyxTQUFTLENBMklmO0FBM0lELFdBQU8sU0FBUztJQUVILHNCQUFZLEdBQUcseUJBQXlCLENBQUM7SUFDekMsb0JBQVUsR0FBRyxXQUFXLENBQUM7SUFFekIsYUFBRyxHQUFrQixNQUFNLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFVL0QsNEJBQW1DLElBQUk7UUFDckMsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ25CLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFVBQUMsS0FBSyxFQUFFLEdBQUc7WUFDL0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRixTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQ3pCLENBQUM7UUFDSCxDQUFD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Q0FBQyxJQUFJLEdBQUc7b0JBQ1osYUFBYSxFQUFFLG1CQUFtQjtvQkFDbEMsUUFBUSxFQUFFLElBQUk7b0JBQ2QsT0FBTyxFQUFFO3dCQUNQLGlCQUFpQixFQUFFOzRCQUNqQixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUM7eUJBQ3hEO3FCQUNGO2lCQUNGLENBQUM7Z0JBRUYsTUFBTSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM3RCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDaEMsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTixDQUFDLEVBN0JNLFNBQVMsS0FBVCxTQUFTLFFBNkJmIiwiZmlsZSI6ImNvbXBpbGVkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL2luY2x1ZGVzLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZEludGVyZmFjZXMudHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuICBcbiAgZXhwb3J0IHZhciB0ZW1wbGF0ZVBhdGggPSAncGx1Z2lucy9kYXNoYm9hcmQvaHRtbC8nO1xuICBleHBvcnQgdmFyIHBsdWdpbk5hbWUgPSAnZGFzaGJvYXJkJztcblxuICBleHBvcnQgdmFyIGxvZzpMb2dnaW5nLkxvZ2dlciA9IExvZ2dlci5nZXQoJ2hhd3Rpby1kYXNoYm9hcmQnKTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY2xlYW5lZCB1cCB2ZXJzaW9uIG9mIHRoZSBkYXNoYm9hcmQgZGF0YSB3aXRob3V0IGFueSBVSSBzZWxlY3Rpb24gc3RhdGVcbiAgICogQG1ldGhvZCBjbGVhbkRhc2hib2FyZERhdGFcbiAgICogQHN0YXRpY1xuICAgKiBAZm9yIERhc2hib2FyZFxuICAgKiBAcGFyYW0ge2FueX0gaXRlbVxuICAgKiBAcmV0dXJuIHthbnl9XG4gICAqL1xuICBleHBvcnQgZnVuY3Rpb24gY2xlYW5EYXNoYm9hcmREYXRhKGl0ZW0pIHtcbiAgICB2YXIgY2xlYW5JdGVtID0ge307XG4gICAgYW5ndWxhci5mb3JFYWNoKGl0ZW0sICh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICBpZiAoIWFuZ3VsYXIuaXNTdHJpbmcoa2V5KSB8fCAoIV8uc3RhcnRzV2l0aChrZXksICckJykgJiYgIV8uc3RhcnRzV2l0aChrZXksICdfJykpKSB7XG4gICAgICAgIGNsZWFuSXRlbVtrZXldID0gdmFsdWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGNsZWFuSXRlbTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIGRlY29kZVVSSUNvbXBvbmVudCgpIG9uIGVhY2ggdmFsdWUgaW4gdGhlIG9iamVjdFxuICAgKiBAbWV0aG9kIGRlY29kZVVSSUNvbXBvbmVudFByb3BlcnRpZXNcbiAgICogQHN0YXRpY1xuICAgKiBAZm9yIERhc2hib2FyZFxuICAgKiBAcGFyYW0ge2FueX0gaGFzaFxuICAgKiBAcmV0dXJuIHthbnl9XG4gICAqL1xuICBleHBvcnQgZnVuY3Rpb24gZGVjb2RlVVJJQ29tcG9uZW50UHJvcGVydGllcyhoYXNoKSB7XG4gICAgaWYgKCFoYXNoKSB7XG4gICAgICByZXR1cm4gaGFzaDtcbiAgICB9XG4gICAgdmFyIGRlY29kZUhhc2ggPSB7fTtcbiAgICBhbmd1bGFyLmZvckVhY2goaGFzaCwgKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgIGRlY29kZUhhc2hba2V5XSA9IHZhbHVlID8gZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKSA6IHZhbHVlO1xuICAgIH0pO1xuICAgIHJldHVybiBkZWNvZGVIYXNoO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIG9uT3BlcmF0aW9uQ29tcGxldGUocmVzdWx0KSB7XG4gICAgY29uc29sZS5sb2coXCJDb21wbGV0ZWQgYWRkaW5nIHRoZSBkYXNoYm9hcmQgd2l0aCByZXNwb25zZSBcIiArIEpTT04uc3RyaW5naWZ5KHJlc3VsdCkpO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIHNldFN1YlRhYnModGFiOmFueSwgYnVpbGRlciwgZGFzaGJvYXJkczpBcnJheTxEYXNoYm9hcmQ+LCAkcm9vdFNjb3BlKSB7XG4gICAgaWYgKCF0YWIgfHwgdGFiLmVtYmVkZGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfSBcbiAgICBsb2cuZGVidWcoXCJVcGRhdGluZyBzdWItdGFic1wiKTtcbiAgICBpZiAoIXRhYi50YWJzKSB7XG4gICAgICB0YWIudGFicyA9IFtdO1xuICAgIH0gZWxzZSB7XG4gICAgICB0YWIudGFicy5sZW5ndGggPSAwO1xuICAgIH1cbiAgICBsb2cuZGVidWcoXCJ0YWI6IFwiLCB0YWIpO1xuICAgIGxvZy5kZWJ1ZyhcImRhc2hib2FyZHM6IFwiLCBkYXNoYm9hcmRzKTtcbiAgICBfLmZvckVhY2goZGFzaGJvYXJkcywgKGRhc2hib2FyZCkgPT4ge1xuICAgICAgdmFyIGNoaWxkID0gYnVpbGRlclxuICAgICAgICAuaWQoJ2Rhc2hib2FyZC0nICsgZGFzaGJvYXJkLmlkKVxuICAgICAgICAudGl0bGUoKCkgPT4gZGFzaGJvYXJkLnRpdGxlIHx8IGRhc2hib2FyZC5pZClcbiAgICAgICAgLmhyZWYoKCkgPT4ge1xuICAgICAgICAgIHZhciB1cmkgPSBuZXcgVVJJKFVybEhlbHBlcnMuam9pbignL2Rhc2hib2FyZC9pZCcsIGRhc2hib2FyZC5pZCkpXG4gICAgICAgICAgICB1cmkuc2VhcmNoKHtcbiAgICAgICAgICAgICAgJ21haW4tdGFiJzogcGx1Z2luTmFtZSxcbiAgICAgICAgICAgICAgJ3N1Yi10YWInOiAnZGFzaGJvYXJkLScgKyBkYXNoYm9hcmQuaWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiB1cmkudG9TdHJpbmcoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmJ1aWxkKCk7XG4gICAgICB0YWIudGFicy5wdXNoKGNoaWxkKTtcbiAgICB9KTtcbiAgICB2YXIgbWFuYWdlID0gYnVpbGRlclxuICAgICAgLmlkKCdkYXNoYm9hcmQtbWFuYWdlJylcbiAgICAgIC50aXRsZSgoKSA9PiAnPGkgY2xhc3M9XCJmYSBmYS1wZW5jaWxcIj48L2k+Jm5ic3A7TWFuYWdlJylcbiAgICAgIC5ocmVmKCgpID0+ICcvZGFzaGJvYXJkL2VkaXQ/bWFpbi10YWI9ZGFzaGJvYXJkJnN1Yi10YWI9ZGFzaGJvYXJkLW1hbmFnZScpXG4gICAgICAuYnVpbGQoKTtcbiAgICB0YWIudGFicy5wdXNoKG1hbmFnZSk7XG4gICAgdGFiLnRhYnMuZm9yRWFjaCgodGFiKSA9PiB7XG4gICAgICB0YWIuaXNTZWxlY3RlZCA9ICgpID0+IHtcbiAgICAgICAgdmFyIGlkID0gdGFiLmlkLnJlcGxhY2UoJ2Rhc2hib2FyZC0nLCAnJyk7XG4gICAgICAgIHZhciB1cmkgPSBuZXcgVVJJKCk7XG4gICAgICAgIHJldHVybiB1cmkucXVlcnkodHJ1ZSlbJ3N1Yi10YWInXSA9PT0gdGFiLmlkIHx8IF8uZW5kc1dpdGgodXJpLnBhdGgoKSwgaWQpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGxvZy5kZWJ1ZyhcIlVwZGF0ZWQgbWFpbiB0YWIgdG86IFwiLCB0YWIpO1xuICAgIC8vJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdoYXd0aW8tbmF2LXJlZHJhdycpO1xuICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnaGF3dGlvLW5hdi1zdWJ0YWItcmVkcmF3Jyk7XG4gICAgQ29yZS4kYXBwbHkoJHJvb3RTY29wZSk7XG4gIH1cblxuXG4gIGV4cG9ydCBmdW5jdGlvbiBnZXREdW1teUJ1aWxkZXIoKSB7XG4gICAgdmFyIHNlbGYgPSB7XG4gICAgICBpZDogKCkgPT4gc2VsZixcbiAgICAgIGRlZmF1bHRQYWdlOiAoKSA9PiBzZWxmLFxuICAgICAgcmFuazogKCkgPT4gc2VsZixcbiAgICAgIHJlbG9hZDogKCkgPT4gc2VsZixcbiAgICAgIHBhZ2U6ICgpID0+IHNlbGYsXG4gICAgICB0aXRsZTogKCkgPT4gc2VsZixcbiAgICAgIHRvb2x0aXA6ICgpID0+IHNlbGYsXG4gICAgICBjb250ZXh0OiAoKSA9PiBzZWxmLFxuICAgICAgYXR0cmlidXRlczogKCkgPT4gc2VsZixcbiAgICAgIGxpbmtBdHRyaWJ1dGVzOiAoKSA9PiBzZWxmLFxuICAgICAgaHJlZjogKCkgPT4gc2VsZixcbiAgICAgIGNsaWNrOiAoKSA9PiBzZWxmLFxuICAgICAgaXNWYWxpZDogKCkgPT4gc2VsZixcbiAgICAgIHNob3c6ICgpID0+IHNlbGYsXG4gICAgICBpc1NlbGVjdGVkOiAoKSA9PiBzZWxmLFxuICAgICAgdGVtcGxhdGU6ICgpID0+IHNlbGYsXG4gICAgICB0YWJzOiAoKSA9PiBzZWxmLFxuICAgICAgc3ViUGF0aDogKCkgPT4gc2VsZixcbiAgICAgIGJ1aWxkOiAoKSA9PiB7fVxuICAgIH1cbiAgICByZXR1cm4gc2VsZjtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBnZXREdW1teUJ1aWxkZXJGYWN0b3J5KCkge1xuICAgIHJldHVybiB7XG4gICAgICBjcmVhdGU6ICgpID0+IGdldER1bW15QnVpbGRlcigpLFxuICAgICAgam9pbjogKCkgPT4gJycsXG4gICAgICBjb25maWd1cmVSb3V0aW5nOiAoKSA9PiB7fVxuICAgIH1cbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBnZXREdW1teUhhd3Rpb05hdigpIHtcbiAgICB2YXIgbmF2ID0ge1xuICAgICAgYnVpbGRlcjogKCkgPT4gZ2V0RHVtbXlCdWlsZGVyKCksXG4gICAgICBhZGQ6ICgpID0+IHt9LFxuICAgICAgcmVtb3ZlOiAoKSA9PiBbXSxcbiAgICAgIGl0ZXJhdGU6ICgpID0+IG51bGwsXG4gICAgICBvbjogKCkgPT4gdW5kZWZpbmVkLFxuICAgICAgc2VsZWN0ZWQ6ICgpID0+IHVuZGVmaW5lZFxuICAgIH1cbiAgICByZXR1cm4gbmF2O1xuICB9XG59XG4iLCIvKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKiBAbWFpbiBEYXNoYm9hcmRcbiAqL1xuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZEhlbHBlcnMudHNcIi8+XG5tb2R1bGUgRGFzaGJvYXJkIHtcbiAgXG4gIGV4cG9ydCB2YXIgX21vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKHBsdWdpbk5hbWUsIFtdKTtcblxuICBfbW9kdWxlLmNvbmZpZyhbXCIkcm91dGVQcm92aWRlclwiLCBcIiRwcm92aWRlXCIsICgkcm91dGVQcm92aWRlciwgJHByb3ZpZGUpID0+IHtcblxuICAgICRwcm92aWRlLmRlY29yYXRvcignSGF3dGlvRGFzaGJvYXJkJywgWyckZGVsZWdhdGUnLCAoJGRlbGVnYXRlKSA9PiB7XG4gICAgICAkZGVsZWdhdGVbJ2hhc0Rhc2hib2FyZCddID0gdHJ1ZTtcbiAgICAgICRkZWxlZ2F0ZVsnZ2V0QWRkTGluayddID0gKHRpdGxlPzpzdHJpbmcsIHNpemVfeD86bnVtYmVyLCBzaXplX3k/Om51bWJlcikgPT4ge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gbmV3IFVSSSgnL2Rhc2hib2FyZC9hZGQnKTtcbiAgICAgICAgdmFyIGN1cnJlbnRVcmkgPSBuZXcgVVJJKCk7XG4gICAgICAgIC8qXG4gICAgICAgIGN1cnJlbnRVcmkucmVtb3ZlUXVlcnkoJ21haW4tdGFiJyk7XG4gICAgICAgIGN1cnJlbnRVcmkucmVtb3ZlUXVlcnkoJ3N1Yi10YWInKTtcbiAgICAgICAgKi9cbiAgICAgICAgdmFyIHdpZGdldFVyaSA9IG5ldyBVUkkoY3VycmVudFVyaS5wYXRoKCkpO1xuICAgICAgICB3aWRnZXRVcmkucXVlcnkoY3VycmVudFVyaS5xdWVyeSh0cnVlKSk7XG4gICAgICAgIHRhcmdldC5xdWVyeSgocXVlcnkpID0+IHtcbiAgICAgICAgICBxdWVyeS5ocmVmID0gVVJJLmVuY29kZVJlc2VydmVkKHdpZGdldFVyaS50b1N0cmluZygpKVxuICAgICAgICAgIGlmICh0aXRsZSkge1xuICAgICAgICAgICAgcXVlcnkudGl0bGUgPSBVUkkuZW5jb2RlUmVzZXJ2ZWQodGl0bGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc2l6ZV94ICYmIHNpemVfeSkge1xuICAgICAgICAgICAgcXVlcnkuc2l6ZSA9IFVSSS5lbmNvZGVSZXNlcnZlZChhbmd1bGFyLnRvSnNvbih7c2l6ZV94OiBzaXplX3gsIHNpemVfeTogc2l6ZV95fSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0YXJnZXQudG9TdHJpbmcoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAkZGVsZWdhdGU7XG4gICAgfV0pO1xuXG4gICAgJHJvdXRlUHJvdmlkZXIuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2FkZCcsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdhZGRUb0Rhc2hib2FyZC5odG1sJ30pLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9lZGl0Jywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2VkaXREYXNoYm9hcmRzLmh0bWwnfSkuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2lkeC86ZGFzaGJvYXJkSW5kZXgnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnZGFzaGJvYXJkLmh0bWwnLCByZWxvYWRPblNlYXJjaDogZmFsc2UgfSkuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2lkLzpkYXNoYm9hcmRJZCcsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdkYXNoYm9hcmQuaHRtbCcsIHJlbG9hZE9uU2VhcmNoOiBmYWxzZSB9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvaWQvOmRhc2hib2FyZElkL3NoYXJlJywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ3NoYXJlLmh0bWwnfSkuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2ltcG9ydCcsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdpbXBvcnQuaHRtbCd9KTtcbiAgfV0pO1xuXG4gIF9tb2R1bGUudmFsdWUoJ3VpLmNvbmZpZycsIHtcbiAgICAvLyBUaGUgdWktanEgZGlyZWN0aXZlIG5hbWVzcGFjZVxuICAgIGpxOiB7XG4gICAgICBncmlkc3Rlcjoge1xuICAgICAgICB3aWRnZXRfbWFyZ2luczogWzEwLCAxMF0sXG4gICAgICAgIHdpZGdldF9iYXNlX2RpbWVuc2lvbnM6IFsxNDAsIDE0MF1cbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIF9tb2R1bGUuZmFjdG9yeSgnSGF3dGlvRGFzaGJvYXJkVGFiJywgWydIYXd0aW9OYXYnLCAnSGF3dGlvRGFzaGJvYXJkJywgJyR0aW1lb3V0JywgJyRyb290U2NvcGUnLCAnZGFzaGJvYXJkUmVwb3NpdG9yeScsICckbG9jYXRpb24nLCAobmF2Okhhd3Rpb01haW5OYXYuUmVnaXN0cnksIGRhc2g6RGFzaGJvYXJkU2VydmljZSwgJHRpbWVvdXQsICRyb290U2NvcGUsIGRhc2hib2FyZHM6RGFzaGJvYXJkUmVwb3NpdG9yeSwgJGxvY2F0aW9uKSA9PiB7XG4gICAgdmFyIHRhYiA9IDxhbnk+IHtcbiAgICAgIGVtYmVkZGVkOiB0cnVlXG4gICAgfTtcbiAgICBpZiAoZGFzaCAmJiBkYXNoLmluRGFzaGJvYXJkKSB7XG4gICAgICBsb2cuZGVidWcoXCJFbWJlZGRlZCBpbiBhIGRhc2hib2FyZCwgbm90IGluaXRpYWxpemluZyBvdXIgbmF2aWdhdGlvbiB0YWJcIik7XG4gICAgICByZXR1cm4gdGFiO1xuICAgIH1cbiAgICAvLyBzcGVjaWFsIGNhc2UgaGVyZSwgd2UgZG9uJ3Qgd2FudCB0byBvdmVyd3JpdGUgb3VyIHN0b3JlZCB0YWIhXG4gICAgdmFyIGJ1aWxkZXIgPSBuYXYuYnVpbGRlcigpO1xuICAgIHRhYiA9IGJ1aWxkZXIuaWQocGx1Z2luTmFtZSlcbiAgICAgICAgICAgICAgICAgIC5ocmVmKCgpID0+ICcvZGFzaGJvYXJkL2lkeC8wJylcbiAgICAgICAgICAgICAgICAgIC5pc1NlbGVjdGVkKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF8uc3RhcnRzV2l0aCgkbG9jYXRpb24ucGF0aCgpLCAnL2Rhc2hib2FyZC8nKTtcbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAudGl0bGUoKCkgPT4gJ0Rhc2hib2FyZCcpXG4gICAgICAgICAgICAgICAgICAuYnVpbGQoKTtcbiAgICBuYXYuYWRkKHRhYik7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBsb2cuZGVidWcoXCJTZXR0aW5nIHVwIGRhc2hib2FyZCBzdWItdGFic1wiKTtcbiAgICAgIGRhc2hib2FyZHMuZ2V0RGFzaGJvYXJkcygoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICBzZXRTdWJUYWJzKHRhYiwgYnVpbGRlciwgZGFzaGJvYXJkcywgJHJvb3RTY29wZSk7XG4gICAgICB9KTtcbiAgICB9LCA1MDApO1xuICAgIGxvZy5kZWJ1ZyhcIk5vdCBlbWJlZGRlZCBpbiBhIGRhc2hib2FyZCwgcmV0dXJuaW5nIHByb3BlciB0YWJcIik7XG4gICAgcmV0dXJuIHRhYjtcbiAgfV0pO1xuXG4gIF9tb2R1bGUucnVuKFtcIkhhd3Rpb0Rhc2hib2FyZFRhYlwiLCAoSGF3dGlvRGFzaGJvYXJkVGFiKSA9PiB7XG4gICAgbG9nLmRlYnVnKFwicnVubmluZ1wiKTtcbiAgfV0pO1xuXG4gIGhhd3Rpb1BsdWdpbkxvYWRlci5hZGRNb2R1bGUocGx1Z2luTmFtZSk7XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZEludGVyZmFjZXMudHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuXG4gIF9tb2R1bGUuZmFjdG9yeSgnZGFzaGJvYXJkUmVwb3NpdG9yeScsIFsnRGVmYXVsdERhc2hib2FyZHMnLCAoZGVmYXVsdHM6RGVmYXVsdERhc2hib2FyZHMpID0+IHtcbiAgICByZXR1cm4gbmV3IExvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeShkZWZhdWx0cyk7XG4gIH1dKTtcblxuICBfbW9kdWxlLmZhY3RvcnkoJ0RlZmF1bHREYXNoYm9hcmRzJywgWygpID0+IHtcbiAgICB2YXIgZGVmYXVsdHMgPSA8QXJyYXk8RGFzaGJvYXJkPj5bXTtcbiAgICB2YXIgYW5zd2VyID0ge1xuICAgICAgYWRkOiAoZGFzaGJvYXJkOkRhc2hib2FyZCkgPT4ge1xuICAgICAgICBkZWZhdWx0cy5wdXNoKGRhc2hib2FyZCk7XG4gICAgICB9LFxuICAgICAgcmVtb3ZlOiAoaWQ6c3RyaW5nKSA9PiB7XG4gICAgICAgIHJldHVybiBfLnJlbW92ZShkZWZhdWx0cywgKGRhc2hib2FyZCkgPT4gZGFzaGJvYXJkLmlkID09PSBpZCk7XG4gICAgICB9LFxuICAgICAgZ2V0QWxsOiAoKSA9PiBkZWZhdWx0c1xuICAgIH1cbiAgICByZXR1cm4gYW5zd2VyO1xuICB9XSk7XG5cbiAgLyoqXG4gICAqIEBjbGFzcyBMb2NhbERhc2hib2FyZFJlcG9zaXRvcnlcbiAgICogQHVzZXMgRGFzaGJvYXJkUmVwb3NpdG9yeVxuICAgKi9cbiAgZXhwb3J0IGNsYXNzIExvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeSBpbXBsZW1lbnRzIERhc2hib2FyZFJlcG9zaXRvcnkge1xuXG4gICAgcHJpdmF0ZSBsb2NhbFN0b3JhZ2U6V2luZG93TG9jYWxTdG9yYWdlID0gbnVsbDtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZGVmYXVsdHM6RGVmYXVsdERhc2hib2FyZHMpIHtcbiAgICAgIHRoaXMubG9jYWxTdG9yYWdlID0gQ29yZS5nZXRMb2NhbFN0b3JhZ2UoKTtcbiAgICAgIGlmICgndXNlckRhc2hib2FyZHMnIGluIHRoaXMubG9jYWxTdG9yYWdlKSB7XG4gICAgICAgIGxvZy5kZWJ1ZyhcIkZvdW5kIHByZXZpb3VzbHkgc2F2ZWQgZGFzaGJvYXJkc1wiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvZy5kZWJ1ZyhcIlN0b3JpbmcgcHJlLWRlZmluZWQgZGFzaGJvYXJkc1wiKTtcbiAgICAgICAgdGhpcy5zdG9yZURhc2hib2FyZHMoZGVmYXVsdHMuZ2V0QWxsKCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgbG9hZERhc2hib2FyZHMoKSB7XG4gICAgICB2YXIgYW5zd2VyID0gYW5ndWxhci5mcm9tSnNvbihsb2NhbFN0b3JhZ2VbJ3VzZXJEYXNoYm9hcmRzJ10pO1xuICAgICAgbG9nLmRlYnVnKFwicmV0dXJuaW5nIGRhc2hib2FyZHM6IFwiLCBhbnN3ZXIpO1xuICAgICAgcmV0dXJuIGFuc3dlcjtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN0b3JlRGFzaGJvYXJkcyhkYXNoYm9hcmRzOmFueVtdKSB7XG4gICAgICBsb2cuZGVidWcoXCJzdG9yaW5nIGRhc2hib2FyZHM6IFwiLCBkYXNoYm9hcmRzKTtcbiAgICAgIGxvY2FsU3RvcmFnZVsndXNlckRhc2hib2FyZHMnXSA9IGFuZ3VsYXIudG9Kc29uKGRhc2hib2FyZHMpO1xuICAgICAgcmV0dXJuIHRoaXMubG9hZERhc2hib2FyZHMoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcHV0RGFzaGJvYXJkcyhhcnJheTphbnlbXSwgY29tbWl0TWVzc2FnZTpzdHJpbmcsIGZuKSB7XG4gICAgICB2YXIgZGFzaGJvYXJkcyA9IHRoaXMubG9hZERhc2hib2FyZHMoKTtcbiAgICAgIGFycmF5LmZvckVhY2goKGRhc2gpID0+IHtcbiAgICAgICAgdmFyIGV4aXN0aW5nID0gXy5maW5kSW5kZXgoZGFzaGJvYXJkcywgKGQ6YW55KSA9PiB7IHJldHVybiBkLmlkID09PSBkYXNoLmlkOyB9KTtcbiAgICAgICAgaWYgKGV4aXN0aW5nID49IDApIHtcbiAgICAgICAgICBkYXNoYm9hcmRzW2V4aXN0aW5nXSA9IGRhc2g7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGFzaGJvYXJkcy5wdXNoKGRhc2gpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGZuKHRoaXMuc3RvcmVEYXNoYm9hcmRzKGRhc2hib2FyZHMpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVsZXRlRGFzaGJvYXJkcyhhcnJheTphbnlbXSwgZm4pIHtcbiAgICAgIHZhciBkYXNoYm9hcmRzID0gdGhpcy5sb2FkRGFzaGJvYXJkcygpO1xuICAgICAgYW5ndWxhci5mb3JFYWNoKGFycmF5LCAoaXRlbSkgPT4ge1xuICAgICAgICBfLnJlbW92ZShkYXNoYm9hcmRzLCAoaTphbnkpID0+IHsgcmV0dXJuIGkuaWQgPT09IGl0ZW0uaWQ7IH0pO1xuICAgICAgfSk7XG4gICAgICBmbih0aGlzLnN0b3JlRGFzaGJvYXJkcyhkYXNoYm9hcmRzKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldERhc2hib2FyZHMoZm4pIHtcbiAgICAgIGZuKHRoaXMubG9hZERhc2hib2FyZHMoKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldERhc2hib2FyZChpZDpzdHJpbmcsIGZuKSB7XG4gICAgICB2YXIgZGFzaGJvYXJkcyA9IHRoaXMubG9hZERhc2hib2FyZHMoKTtcbiAgICAgIHZhciBkYXNoYm9hcmQgPSBfLmZpbmQoZGFzaGJvYXJkcywgKGRhc2hib2FyZDphbnkpID0+IHsgcmV0dXJuIGRhc2hib2FyZC5pZCA9PT0gaWQgfSk7XG4gICAgICBmbihkYXNoYm9hcmQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGVEYXNoYm9hcmQob3B0aW9uczphbnkpIHtcbiAgICAgIHZhciBhbnN3ZXIgPXtcbiAgICAgICAgdGl0bGU6IFwiTmV3IERhc2hib2FyZFwiLFxuICAgICAgICBncm91cDogXCJQZXJzb25hbFwiLFxuICAgICAgICB3aWRnZXRzOiBbXVxuICAgICAgfTtcbiAgICAgIGFuc3dlciA9IGFuZ3VsYXIuZXh0ZW5kKGFuc3dlciwgb3B0aW9ucyk7XG4gICAgICBhbnN3ZXJbJ2lkJ10gPSBDb3JlLmdldFVVSUQoKTtcbiAgICAgIHJldHVybiBhbnN3ZXI7XG4gICAgfVxuXG4gICAgcHVibGljIGNsb25lRGFzaGJvYXJkKGRhc2hib2FyZDphbnkpIHtcbiAgICAgIHZhciBuZXdEYXNoYm9hcmQgPSBfLmNsb25lKGRhc2hib2FyZCk7XG4gICAgICBuZXdEYXNoYm9hcmRbJ2lkJ10gPSBDb3JlLmdldFVVSUQoKTtcbiAgICAgIG5ld0Rhc2hib2FyZFsndGl0bGUnXSA9IFwiQ29weSBvZiBcIiArIGRhc2hib2FyZC50aXRsZTtcbiAgICAgIHJldHVybiBuZXdEYXNoYm9hcmQ7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFR5cGUoKSB7XG4gICAgICByZXR1cm4gJ2NvbnRhaW5lcic7XG4gICAgfVxuICB9XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuXG4gIF9tb2R1bGUuY29udHJvbGxlcihcIkRhc2hib2FyZC5FZGl0RGFzaGJvYXJkc0NvbnRyb2xsZXJcIiwgW1wiJHNjb3BlXCIsIFwiJHJvdXRlUGFyYW1zXCIsIFwiJHJvdXRlXCIsIFwiJGxvY2F0aW9uXCIsIFwiJHJvb3RTY29wZVwiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgXCJIYXd0aW9OYXZcIiwgXCIkdGltZW91dFwiLCBcIiR0ZW1wbGF0ZUNhY2hlXCIsIFwiJHVpYk1vZGFsXCIsIFwiSGF3dGlvRGFzaGJvYXJkVGFiXCIsICgkc2NvcGUsICRyb3V0ZVBhcmFtcywgJHJvdXRlLCAkbG9jYXRpb24sICRyb290U2NvcGUsIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSwgbmF2LCAkdGltZW91dCwgJHRlbXBsYXRlQ2FjaGUsICR1aWJNb2RhbCwgdGFiKSA9PiB7XG5cbiAgICAkc2NvcGUuX2Rhc2hib2FyZHMgPSBbXTtcblxuICAgICRyb290U2NvcGUuJG9uKCdkYXNoYm9hcmRzVXBkYXRlZCcsIGRhc2hib2FyZExvYWRlZCk7XG5cbiAgICAkc2NvcGUuaGFzVXJsID0gKCkgPT4ge1xuICAgICAgcmV0dXJuICgkc2NvcGUudXJsKSA/IHRydWUgOiBmYWxzZTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmhhc1NlbGVjdGlvbiA9ICgpID0+IHtcbiAgICAgIHJldHVybiAkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcy5sZW5ndGggIT09IDA7XG4gICAgfTtcblxuICAgICRzY29wZS5ncmlkT3B0aW9ucyA9IHtcbiAgICAgIHNlbGVjdGVkSXRlbXM6IFtdLFxuICAgICAgc2hvd0ZpbHRlcjogZmFsc2UsXG4gICAgICBzaG93Q29sdW1uTWVudTogZmFsc2UsXG4gICAgICBmaWx0ZXJPcHRpb25zOiB7XG4gICAgICAgIGZpbHRlclRleHQ6ICcnXG4gICAgICB9LFxuICAgICAgZGF0YTogJ19kYXNoYm9hcmRzJyxcbiAgICAgIHNlbGVjdFdpdGhDaGVja2JveE9ubHk6IHRydWUsXG4gICAgICBzaG93U2VsZWN0aW9uQ2hlY2tib3g6IHRydWUsXG4gICAgICBjb2x1bW5EZWZzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBmaWVsZDogJ3RpdGxlJyxcbiAgICAgICAgICBkaXNwbGF5TmFtZTogJ0Rhc2hib2FyZCcsXG4gICAgICAgICAgY2VsbFRlbXBsYXRlOiAkdGVtcGxhdGVDYWNoZS5nZXQoVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ2VkaXREYXNoYm9hcmRUaXRsZUNlbGwuaHRtbCcpKVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZmllbGQ6ICdncm91cCcsXG4gICAgICAgICAgZGlzcGxheU5hbWU6ICdHcm91cCdcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICB9O1xuXG4gICAgdmFyIGRvVXBkYXRlID0gXy5kZWJvdW5jZSh1cGRhdGVEYXRhLCAxMCk7XG5cbiAgICAvLyBoZWxwZXJzIHNvIHdlIGNhbiBlbmFibGUvZGlzYWJsZSBwYXJ0cyBvZiB0aGUgVUkgZGVwZW5kaW5nIG9uIGhvd1xuICAgIC8vIGRhc2hib2FyZCBkYXRhIGlzIHN0b3JlZFxuICAgIC8qXG4gICAgJHNjb3BlLnVzaW5nR2l0ID0gKCkgPT4ge1xuICAgICAgcmV0dXJuIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0VHlwZSgpID09PSAnZ2l0JztcbiAgICB9O1xuXG4gICAgJHNjb3BlLnVzaW5nRmFicmljID0gKCkgPT4ge1xuICAgICAgcmV0dXJuIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0VHlwZSgpID09PSAnZmFicmljJztcbiAgICB9O1xuXG4gICAgJHNjb3BlLnVzaW5nTG9jYWwgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlKCkgPT09ICdjb250YWluZXInO1xuICAgIH07XG5cbiAgICBpZiAoJHNjb3BlLnVzaW5nRmFicmljKCkpIHtcbiAgICAgICRzY29wZS5ncmlkT3B0aW9ucy5jb2x1bW5EZWZzLmFkZChbe1xuICAgICAgICBmaWVsZDogJ3ZlcnNpb25JZCcsXG4gICAgICAgIGRpc3BsYXlOYW1lOiAnVmVyc2lvbidcbiAgICAgIH0sIHtcbiAgICAgICAgZmllbGQ6ICdwcm9maWxlSWQnLFxuICAgICAgICBkaXNwbGF5TmFtZTogJ1Byb2ZpbGUnXG4gICAgICB9LCB7XG4gICAgICAgIGZpZWxkOiAnZmlsZU5hbWUnLFxuICAgICAgICBkaXNwbGF5TmFtZTogJ0ZpbGUgTmFtZSdcbiAgICAgIH1dKTtcbiAgICB9XG4gICAgKi9cblxuICAgICR0aW1lb3V0KGRvVXBkYXRlLCAxMCk7XG5cbiAgICAkc2NvcGUuJG9uKFwiJHJvdXRlQ2hhbmdlU3VjY2Vzc1wiLCBmdW5jdGlvbiAoZXZlbnQsIGN1cnJlbnQsIHByZXZpb3VzKSB7XG4gICAgICAvLyBsZXRzIGRvIHRoaXMgYXN5bmNocm9ub3VzbHkgdG8gYXZvaWQgRXJyb3I6ICRkaWdlc3QgYWxyZWFkeSBpbiBwcm9ncmVzc1xuICAgICAgJHRpbWVvdXQoZG9VcGRhdGUsIDEwKTtcbiAgICB9KTtcblxuICAgICRzY29wZS5hZGRWaWV3VG9EYXNoYm9hcmQgPSAoKSA9PiB7XG4gICAgICB2YXIgbmV4dEhyZWYgPSBudWxsO1xuICAgICAgdmFyIHNlbGVjdGVkID0gJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXM7XG4gICAgICB2YXIgY3VycmVudFVybCA9IG5ldyBVUkkoKTtcbiAgICAgIHZhciBjb25maWcgPSBjdXJyZW50VXJsLnF1ZXJ5KHRydWUpO1xuICAgICAgdmFyIGhyZWYgPSBjb25maWdbJ2hyZWYnXTtcbiAgICAgIHZhciBpZnJhbWUgPSBjb25maWdbJ2lmcmFtZSddO1xuICAgICAgdmFyIHR5cGUgPSAnaHJlZic7XG4gICAgICBpZiAoaHJlZikge1xuICAgICAgICBocmVmID0gVVJJLmRlY29kZShocmVmKTtcbiAgICAgICAgaHJlZiA9IENvcmUudHJpbUxlYWRpbmcoaHJlZiwgJyMnKTtcbiAgICAgIH0gZWxzZSBpZiAoaWZyYW1lKSB7XG4gICAgICAgIGlmcmFtZSA9IFVSSS5kZWNvZGUoaWZyYW1lKTtcbiAgICAgICAgdHlwZSA9ICdpZnJhbWUnO1xuICAgICAgfVxuICAgICAgdmFyIHdpZGdldFVSSSA9IDxhbnk+IHVuZGVmaW5lZDtcbiAgICAgIHN3aXRjaCh0eXBlKSB7XG4gICAgICAgIGNhc2UgJ2hyZWYnOlxuICAgICAgICAgIGxvZy5kZWJ1ZyhcImhyZWY6IFwiLCBocmVmKTtcbiAgICAgICAgICB3aWRnZXRVUkkgPSBuZXcgVVJJKGhyZWYpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdpZnJhbWUnOlxuICAgICAgICAgIGxvZy5kZWJ1ZyhcImlmcmFtZTogXCIsIGlmcmFtZSk7XG4gICAgICAgICAgd2lkZ2V0VVJJID0gbmV3IFVSSShpZnJhbWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGxvZy5kZWJ1ZyhcInR5cGUgdW5rbm93blwiKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgc2l6ZVN0ciA9IDxhbnk+IGNvbmZpZ1snc2l6ZSddO1xuICAgICAgaWYgKHNpemVTdHIpIHtcbiAgICAgICAgc2l6ZVN0ciA9IFVSSS5kZWNvZGUoc2l6ZVN0cik7XG4gICAgICB9XG4gICAgICB2YXIgc2l6ZSA9IGFuZ3VsYXIuZnJvbUpzb24oc2l6ZVN0cikgfHwgeyBzaXplX3g6IDEsIHNpemVfeTogMSB9O1xuICAgICAgdmFyIHRpdGxlID0gVVJJLmRlY29kZShjb25maWdbJ3RpdGxlJ10gfHwgJycpO1xuICAgICAgdmFyIHRlbXBsYXRlV2lkZ2V0ID0ge1xuICAgICAgICBpZDogQ29yZS5nZXRVVUlEKCksXG4gICAgICAgIHJvdzogMSxcbiAgICAgICAgY29sOiAxLFxuICAgICAgICBzaXplX3g6IHNpemUuc2l6ZV94LFxuICAgICAgICBzaXplX3k6IHNpemUuc2l6ZV95LFxuICAgICAgICB0aXRsZTogdGl0bGVcbiAgICAgIH1cbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZWxlY3RlZCwgKHNlbGVjdGVkSXRlbSkgPT4ge1xuXG4gICAgICAgIHZhciB3aWRnZXQgPSBfLmNsb25lRGVlcCh0ZW1wbGF0ZVdpZGdldCk7XG5cbiAgICAgICAgaWYgKCFzZWxlY3RlZEl0ZW0ud2lkZ2V0cykge1xuICAgICAgICAgIHNlbGVjdGVkSXRlbS53aWRnZXRzID0gW107XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICBjYXNlICdpZnJhbWUnOiBcbiAgICAgICAgICAgIHdpZGdldCA9IDxhbnk+Xy5leHRlbmQoe1xuICAgICAgICAgICAgICBpZnJhbWU6IGlmcmFtZVxuICAgICAgICAgICAgfSwgd2lkZ2V0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2hyZWYnOlxuICAgICAgICAgICAgdmFyIHRleHQgPSB3aWRnZXRVUkkucGF0aCgpO1xuICAgICAgICAgICAgdmFyIHNlYXJjaCA9IHdpZGdldFVSSS5xdWVyeSh0cnVlKTtcbiAgICAgICAgICAgIGlmICgkcm91dGUgJiYgJHJvdXRlLnJvdXRlcykge1xuICAgICAgICAgICAgICB2YXIgdmFsdWUgPSAkcm91dGUucm91dGVzW3RleHRdO1xuICAgICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGVtcGxhdGVVcmwgPSB2YWx1ZVtcInRlbXBsYXRlVXJsXCJdO1xuICAgICAgICAgICAgICAgIGlmICh0ZW1wbGF0ZVVybCkge1xuICAgICAgICAgICAgICAgICAgd2lkZ2V0ID0gPGFueT4gXy5leHRlbmQoe1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiB0ZXh0LFxuICAgICAgICAgICAgICAgICAgICBpbmNsdWRlOiB0ZW1wbGF0ZVVybCxcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoOiBzZWFyY2gsXG4gICAgICAgICAgICAgICAgICAgIGhhc2g6IFwiXCJcbiAgICAgICAgICAgICAgICAgIH0sIHdpZGdldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFRPRE8gd2UgbmVlZCB0byBiZSBhYmxlIHRvIG1hdGNoIFVSSSB0ZW1wbGF0ZXMuLi5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIC8vIGZpZ3VyZSBvdXQgdGhlIHdpZHRoIG9mIHRoZSBkYXNoXG4gICAgICAgIHZhciBncmlkV2lkdGggPSAwO1xuXG4gICAgICAgIHNlbGVjdGVkSXRlbS53aWRnZXRzLmZvckVhY2goKHcpID0+IHtcbiAgICAgICAgICB2YXIgcmlnaHRTaWRlID0gdy5jb2wgKyB3LnNpemVfeDtcbiAgICAgICAgICBpZiAocmlnaHRTaWRlID4gZ3JpZFdpZHRoKSB7XG4gICAgICAgICAgICBncmlkV2lkdGggPSByaWdodFNpZGU7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZm91bmQgPSBmYWxzZTtcblxuICAgICAgICB2YXIgbGVmdCA9ICh3KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHcuY29sO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciByaWdodCA9ICh3KSAgPT4ge1xuICAgICAgICAgIHJldHVybiB3LmNvbCArIHcuc2l6ZV94IC0gMTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgdG9wID0gKHcpID0+IHtcbiAgICAgICAgICByZXR1cm4gdy5yb3c7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGJvdHRvbSA9ICh3KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHcucm93ICsgdy5zaXplX3kgLSAxO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBjb2xsaXNpb24gPSAodzEsIHcyKSA9PiB7XG4gICAgICAgICAgcmV0dXJuICEoIGxlZnQodzIpID4gcmlnaHQodzEpIHx8XG4gICAgICAgICAgICAgIHJpZ2h0KHcyKSA8IGxlZnQodzEpIHx8XG4gICAgICAgICAgICAgIHRvcCh3MikgPiBib3R0b20odzEpIHx8XG4gICAgICAgICAgICAgIGJvdHRvbSh3MikgPCB0b3AodzEpKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIXNlbGVjdGVkSXRlbS53aWRnZXRzLmxlbmd0aCkge1xuICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlICghZm91bmQpIHtcbiAgICAgICAgICB3aWRnZXQuY29sID0gMTtcbiAgICAgICAgICBpZiAod2lkZ2V0LmNvbCArIHdpZGdldC5zaXplX3ggPiBncmlkV2lkdGgpIHtcbiAgICAgICAgICAgIC8vIGxldCdzIG5vdCBsb29rIGZvciBhIHBsYWNlIG5leHQgdG8gZXhpc3Rpbmcgd2lkZ2V0XG4gICAgICAgICAgICBzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5mb3JFYWNoKGZ1bmN0aW9uKHcsIGlkeCkge1xuICAgICAgICAgICAgICBpZiAod2lkZ2V0LnJvdyA8PSB3LnJvdykge1xuICAgICAgICAgICAgICAgIHdpZGdldC5yb3crKztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAoOyAod2lkZ2V0LmNvbCArIHdpZGdldC5zaXplX3gpIDw9IGdyaWRXaWR0aDsgd2lkZ2V0LmNvbCsrKSB7XG4gICAgICAgICAgICBpZiAoIV8uc29tZShzZWxlY3RlZEl0ZW0ud2lkZ2V0cywgKHcpID0+IHtcbiAgICAgICAgICAgICAgdmFyIGMgPSBjb2xsaXNpb24odywgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgcmV0dXJuIGNcbiAgICAgICAgICAgIH0pKSB7XG4gICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgIHdpZGdldC5yb3cgPSB3aWRnZXQucm93ICsgMVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBqdXN0IGluIGNhc2UsIGtlZXAgdGhlIHNjcmlwdCBmcm9tIHJ1bm5pbmcgYXdheS4uLlxuICAgICAgICAgIGlmICh3aWRnZXQucm93ID4gNTApIHtcbiAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoJHNjb3BlLnJvdXRlUGFyYW1zKSB7XG4gICAgICAgICAgd2lkZ2V0Wydyb3V0ZVBhcmFtcyddID0gJHNjb3BlLnJvdXRlUGFyYW1zO1xuICAgICAgICB9XG4gICAgICAgIHNlbGVjdGVkSXRlbS53aWRnZXRzLnB1c2god2lkZ2V0KTtcbiAgICAgICAgaWYgKCFuZXh0SHJlZiAmJiBzZWxlY3RlZEl0ZW0uaWQpIHtcbiAgICAgICAgICBuZXh0SHJlZiA9IG5ldyBVUkkoKS5wYXRoKFwiL2Rhc2hib2FyZC9pZC9cIiArIHNlbGVjdGVkSXRlbS5pZCkucXVlcnkoe1xuICAgICAgICAgICAgJ21haW4tdGFiJzogJ2Rhc2hib2FyZCcsXG4gICAgICAgICAgICAnc3ViLXRhYic6ICdkYXNoYm9hcmQtJyArIHNlbGVjdGVkSXRlbS5pZFxuICAgICAgICAgIH0pLnJlbW92ZVF1ZXJ5KCdocmVmJylcbiAgICAgICAgICAgIC5yZW1vdmVRdWVyeSgndGl0bGUnKVxuICAgICAgICAgICAgLnJlbW92ZVF1ZXJ5KCdpZnJhbWUnKVxuICAgICAgICAgICAgLnJlbW92ZVF1ZXJ5KCdzaXplJyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBub3cgbGV0cyB1cGRhdGUgdGhlIGFjdHVhbCBkYXNoYm9hcmQgY29uZmlnXG4gICAgICB2YXIgY29tbWl0TWVzc2FnZSA9IFwiQWRkIHdpZGdldFwiO1xuICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKHNlbGVjdGVkLCBjb21taXRNZXNzYWdlLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAvKlxuICAgICAgICBsb2cuZGVidWcoXCJQdXQgZGFzaGJvYXJkczogXCIsIGRhc2hib2FyZHMpO1xuICAgICAgICBsb2cuZGVidWcoXCJOZXh0IGhyZWY6IFwiLCBuZXh0SHJlZi50b1N0cmluZygpKTtcbiAgICAgICAgKi9cbiAgICAgICAgaWYgKG5leHRIcmVmKSB7XG4gICAgICAgICAgJGxvY2F0aW9uLnBhdGgobmV4dEhyZWYucGF0aCgpKS5zZWFyY2gobmV4dEhyZWYucXVlcnkodHJ1ZSkpO1xuICAgICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgfTtcblxuICAgICRzY29wZS5jcmVhdGUgPSAoKSA9PiB7XG5cbiAgICAgIHZhciBjb3VudGVyID0gZGFzaGJvYXJkcygpLmxlbmd0aCArIDE7XG4gICAgICB2YXIgdGl0bGUgPSBcIlVudGl0bGVkXCIgKyBjb3VudGVyO1xuXG4gICAgICB2YXIgbW9kYWwgPSAkdWliTW9kYWwub3Blbih7XG4gICAgICAgIHRlbXBsYXRlVXJsOiBVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAnY3JlYXRlRGFzaGJvYXJkTW9kYWwuaHRtbCcpLFxuICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlKSA9PiB7XG4gICAgICAgICAgJHNjb3BlLmVudGl0eSA9IHtcbiAgICAgICAgICAgIHRpdGxlOiB0aXRsZVxuICAgICAgICAgIH1cbiAgICAgICAgICAkc2NvcGUuY29uZmlnID0ge1xuICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAndGl0bGUnOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgICRzY29wZS5vayA9ICgpID0+IHtcbiAgICAgICAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgICB2YXIgdGl0bGUgPSAkc2NvcGUuZW50aXR5LnRpdGxlXG4gICAgICAgICAgICB2YXIgbmV3RGFzaCA9IGRhc2hib2FyZFJlcG9zaXRvcnkuY3JlYXRlRGFzaGJvYXJkKHsgdGl0bGU6IHRpdGxlIH0pO1xuICAgICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKFtuZXdEYXNoXSwgXCJDcmVhdGVkIG5ldyBkYXNoYm9hcmQ6IFwiICsgdGl0bGUsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgICAgICAgIC8vIGxldCdzIGp1c3QgYmUgc2FmZSBhbmQgZW5zdXJlIHRoZXJlJ3Mgbm8gc2VsZWN0aW9uc1xuICAgICAgICAgICAgICBkZXNlbGVjdEFsbCgpO1xuICAgICAgICAgICAgICBzZXRTdWJUYWJzKHRhYiwgbmF2LmJ1aWxkZXIoKSwgZGFzaGJvYXJkcywgJHJvb3RTY29wZSk7XG4gICAgICAgICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgbW9kYWwuZGlzbWlzcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfV1cbiAgICAgIH0pO1xuICAgICAgLypcbiAgICAgIHZhciBjb3VudGVyID0gZGFzaGJvYXJkcygpLmxlbmd0aCArIDE7XG4gICAgICB2YXIgdGl0bGUgPSBcIlVudGl0bGVkXCIgKyBjb3VudGVyO1xuICAgICAgdmFyIG5ld0Rhc2ggPSBkYXNoYm9hcmRSZXBvc2l0b3J5LmNyZWF0ZURhc2hib2FyZCh7dGl0bGU6IHRpdGxlfSk7XG5cbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbbmV3RGFzaF0sIFwiQ3JlYXRlZCBuZXcgZGFzaGJvYXJkOiBcIiArIHRpdGxlLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAvLyBsZXQncyBqdXN0IGJlIHNhZmUgYW5kIGVuc3VyZSB0aGVyZSdzIG5vIHNlbGVjdGlvbnNcbiAgICAgICAgZGVzZWxlY3RBbGwoKTtcbiAgICAgICAgc2V0U3ViVGFicyhuYXYuYnVpbGRlcigpLCBkYXNoYm9hcmRzLCAkcm9vdFNjb3BlKTtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG4gICAgICAqL1xuXG4gICAgfTtcblxuICAgICRzY29wZS5kdXBsaWNhdGUgPSAoKSA9PiB7XG4gICAgICB2YXIgbmV3RGFzaGJvYXJkcyA9IFtdO1xuICAgICAgdmFyIGNvbW1pdE1lc3NhZ2UgPSBcIkR1cGxpY2F0ZWQgZGFzaGJvYXJkKHMpIFwiO1xuICAgICAgYW5ndWxhci5mb3JFYWNoKCRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLCAoaXRlbSwgaWR4KSA9PiB7XG4gICAgICAgIC8vIGxldHMgdW5zZWxlY3QgdGhpcyBpdGVtXG4gICAgICAgIHZhciBjb21taXRNZXNzYWdlID0gXCJEdXBsaWNhdGVkIGRhc2hib2FyZCBcIiArIGl0ZW0udGl0bGU7XG4gICAgICAgIHZhciBuZXdEYXNoID0gZGFzaGJvYXJkUmVwb3NpdG9yeS5jbG9uZURhc2hib2FyZChpdGVtKTtcbiAgICAgICAgbmV3RGFzaGJvYXJkcy5wdXNoKG5ld0Rhc2gpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIGxldCdzIGp1c3QgYmUgc2FmZSBhbmQgZW5zdXJlIHRoZXJlJ3Mgbm8gc2VsZWN0aW9uc1xuICAgICAgZGVzZWxlY3RBbGwoKTtcblxuICAgICAgY29tbWl0TWVzc2FnZSA9IGNvbW1pdE1lc3NhZ2UgKyBuZXdEYXNoYm9hcmRzLm1hcCgoZCkgPT4geyByZXR1cm4gZC50aXRsZSB9KS5qb2luKCcsJyk7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMobmV3RGFzaGJvYXJkcywgY29tbWl0TWVzc2FnZSwgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgc2V0U3ViVGFicyh0YWIsIG5hdi5idWlsZGVyKCksIGRhc2hib2FyZHMsICRyb290U2NvcGUpO1xuICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlbmFtZURhc2hib2FyZCA9ICgpID0+IHtcbiAgICAgIGlmICgkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkID0gPGFueT5fLmZpcnN0KCRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zKTtcbiAgICAgICAgdmFyIG1vZGFsID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAncmVuYW1lRGFzaGJvYXJkTW9kYWwuaHRtbCcpLFxuICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyR1aWJNb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJHVpYk1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAgICRzY29wZS5jb25maWcgPSB7XG4gICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAndGl0bGUnOiB7XG4gICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHNlbGVjdGVkLnRpdGxlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkID0gc2VsZWN0ZWQ7XG4gICAgICAgICAgICAkc2NvcGUub2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbJHNjb3BlLnNlbGVjdGVkXSwgJ3JlbmFtZWQgZGFzaGJvYXJkJywgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBsZXQncyBqdXN0IGJlIHNhZmUgYW5kIGVuc3VyZSB0aGVyZSdzIG5vIHNlbGVjdGlvbnNcbiAgICAgICAgICAgICAgICBkZXNlbGVjdEFsbCgpO1xuICAgICAgICAgICAgICAgIHNldFN1YlRhYnModGFiLCBuYXYuYnVpbGRlcigpLCBkYXNoYm9hcmRzLCAkcm9vdFNjb3BlKTtcbiAgICAgICAgICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgbW9kYWwuZGlzbWlzcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1dXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAkc2NvcGUuZGVsZXRlRGFzaGJvYXJkID0gKCkgPT4ge1xuICAgICAgaWYgKCRzY29wZS5oYXNTZWxlY3Rpb24oKSkge1xuICAgICAgICB2YXIgc2VsZWN0ZWQgPSAkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcztcbiAgICAgICAgdmFyIG1vZGFsID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAnZGVsZXRlRGFzaGJvYXJkTW9kYWwuaHRtbCcpLFxuICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyR1aWJNb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJHVpYk1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZCA9IHNlbGVjdGVkO1xuICAgICAgICAgICAgJHNjb3BlLm9rID0gKCkgPT4ge1xuICAgICAgICAgICAgICBtb2RhbC5jbG9zZSgpO1xuICAgICAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmRlbGV0ZURhc2hib2FyZHMoJHNjb3BlLnNlbGVjdGVkLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAgICAgICAgIC8vIGxldCdzIGp1c3QgYmUgc2FmZSBhbmQgZW5zdXJlIHRoZXJlJ3Mgbm8gc2VsZWN0aW9uc1xuICAgICAgICAgICAgICAgIGRlc2VsZWN0QWxsKCk7XG4gICAgICAgICAgICAgICAgc2V0U3ViVGFicyh0YWIsIG5hdi5idWlsZGVyKCksIGRhc2hib2FyZHMsICRyb290U2NvcGUpO1xuICAgICAgICAgICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgICBtb2RhbC5kaXNtaXNzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfV1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgICRzY29wZS5naXN0ID0gKCkgPT4ge1xuICAgICAgaWYgKCRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGlkID0gJHNjb3BlLnNlbGVjdGVkSXRlbXNbMF0uaWQ7XG4gICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9pZC9cIiArIGlkICsgXCIvc2hhcmVcIik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZURhdGEoKSB7XG4gICAgICB2YXIgdXJsID0gJHJvdXRlUGFyYW1zW1wiaHJlZlwiXTtcbiAgICAgIGlmICh1cmwpIHtcbiAgICAgICAgJHNjb3BlLnVybCA9IGRlY29kZVVSSUNvbXBvbmVudCh1cmwpO1xuICAgICAgfVxuXG4gICAgICB2YXIgcm91dGVQYXJhbXMgPSAkcm91dGVQYXJhbXNbXCJyb3V0ZVBhcmFtc1wiXTtcbiAgICAgIGlmIChyb3V0ZVBhcmFtcykge1xuICAgICAgICAkc2NvcGUucm91dGVQYXJhbXMgPSBkZWNvZGVVUklDb21wb25lbnQocm91dGVQYXJhbXMpO1xuICAgICAgfVxuICAgICAgdmFyIHNpemU6YW55ID0gJHJvdXRlUGFyYW1zW1wic2l6ZVwiXTtcbiAgICAgIGlmIChzaXplKSB7XG4gICAgICAgIHNpemUgPSBkZWNvZGVVUklDb21wb25lbnQoc2l6ZSk7XG4gICAgICAgICRzY29wZS5wcmVmZXJyZWRTaXplID0gYW5ndWxhci5mcm9tSnNvbihzaXplKTtcbiAgICAgIH1cbiAgICAgIHZhciB0aXRsZTphbnkgPSAkcm91dGVQYXJhbXNbXCJ0aXRsZVwiXTtcbiAgICAgIGlmICh0aXRsZSkge1xuICAgICAgICB0aXRsZSA9IGRlY29kZVVSSUNvbXBvbmVudCh0aXRsZSk7XG4gICAgICAgICRzY29wZS53aWRnZXRUaXRsZSA9IHRpdGxlO1xuICAgICAgfVxuXG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZHMoKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgbG9nLmRlYnVnKFwiTG9hZGVkIGRhc2hib2FyZHM6IFwiLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGFzaGJvYXJkTG9hZGVkKGV2ZW50LCBkYXNoYm9hcmRzKSB7XG4gICAgICBkYXNoYm9hcmRzLmZvckVhY2goKGRhc2hib2FyZCkgPT4ge1xuICAgICAgICBkYXNoYm9hcmQuaGFzaCA9ICc/bWFpbi10YWI9ZGFzaGJvYXJkJnN1Yi10YWI9ZGFzaGJvYXJkLScgKyBkYXNoYm9hcmQuaWQ7XG4gICAgICB9KTtcbiAgICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IGRhc2hib2FyZHM7XG5cbiAgICAgIGlmIChldmVudCA9PT0gbnVsbCkge1xuICAgICAgICAkc2NvcGUuJGVtaXQoJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkcyk7XG4gICAgICB9XG4gICAgICBDb3JlLiRhcHBseSgkcm9vdFNjb3BlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXNoYm9hcmRzKCkge1xuICAgICAgcmV0dXJuICRzY29wZS5fZGFzaGJvYXJkcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZXNlbGVjdEFsbCgpIHtcbiAgICAgICRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLmxlbmd0aCA9IDA7XG4gICAgfVxuXG4gIH1dKTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRIZWxwZXJzLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcblxuICAvKipcbiAgICogSW1wbGVtZW50cyB0aGUgbmcuSUxvY2F0aW9uU2VydmljZSBpbnRlcmZhY2UgYW5kIGlzIHVzZWQgYnkgdGhlIGRhc2hib2FyZCB0byBzdXBwbHlcbiAgICogY29udHJvbGxlcnMgd2l0aCBhIHNhdmVkIFVSTCBsb2NhdGlvblxuICAgKlxuICAgKiBAY2xhc3MgUmVjdGFuZ2xlTG9jYXRpb25cbiAgICovXG4gIGV4cG9ydCBjbGFzcyBSZWN0YW5nbGVMb2NhdGlvbiB7IC8vIFRPRE8gaW1wbGVtZW50cyBuZy5JTG9jYXRpb25TZXJ2aWNlIHtcbiAgICBwcml2YXRlIF9wYXRoOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBfaGFzaDogc3RyaW5nO1xuICAgIHByaXZhdGUgX3NlYXJjaDogYW55O1xuICAgIHByaXZhdGUgdXJpOnVyaS5VUkk7XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgZGVsZWdhdGU6bmcuSUxvY2F0aW9uU2VydmljZSwgcGF0aDpzdHJpbmcsIHNlYXJjaCwgaGFzaDpzdHJpbmcpIHtcbiAgICAgIHRoaXMuX3BhdGggPSBwYXRoO1xuICAgICAgdGhpcy5fc2VhcmNoID0gc2VhcmNoO1xuICAgICAgdGhpcy5faGFzaCA9IGhhc2g7XG4gICAgICB0aGlzLnVyaSA9IG5ldyBVUkkocGF0aCk7XG4gICAgICB0aGlzLnVyaS5zZWFyY2goKHF1ZXJ5KSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZWFyY2g7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBhYnNVcmwoKSB7XG4gICAgICByZXR1cm4gdGhpcy5wcm90b2NvbCgpICsgdGhpcy5ob3N0KCkgKyBcIjpcIiArIHRoaXMucG9ydCgpICsgdGhpcy5wYXRoKCkgKyB0aGlzLnNlYXJjaCgpO1xuICAgIH1cblxuICAgIGhhc2gobmV3SGFzaDpzdHJpbmcgPSBudWxsKTphbnkge1xuICAgICAgaWYgKG5ld0hhc2gpIHtcbiAgICAgICAgdGhpcy51cmkuc2VhcmNoKG5ld0hhc2gpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9oYXNoO1xuICAgIH1cblxuICAgIGhvc3QoKTpzdHJpbmcge1xuICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUuaG9zdCgpO1xuICAgIH1cblxuICAgIHBhdGgobmV3UGF0aDpzdHJpbmcgPSBudWxsKTphbnkge1xuICAgICAgaWYgKG5ld1BhdGgpIHtcbiAgICAgICAgdGhpcy51cmkucGF0aChuZXdQYXRoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fcGF0aDtcbiAgICB9XG5cbiAgICBwb3J0KCk6bnVtYmVyIHtcbiAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLnBvcnQoKTtcbiAgICB9XG5cbiAgICBwcm90b2NvbCgpIHtcbiAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLnBvcnQoKTtcbiAgICB9XG5cbiAgICByZXBsYWNlKCkge1xuICAgICAgLy8gVE9ET1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2VhcmNoKHBhcmFtZXRlcnNNYXA6YW55ID0gbnVsbCk6YW55IHtcbiAgICAgIGlmIChwYXJhbWV0ZXJzTWFwKSB7XG4gICAgICAgIHRoaXMudXJpLnNlYXJjaChwYXJhbWV0ZXJzTWFwKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fc2VhcmNoO1xuICAgIH1cblxuICAgIHVybChuZXdWYWx1ZTogc3RyaW5nID0gbnVsbCk6YW55IHtcbiAgICAgIGlmIChuZXdWYWx1ZSkge1xuICAgICAgICB0aGlzLnVyaSA9IG5ldyBVUkkobmV3VmFsdWUpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmFic1VybCgpO1xuICAgIH1cblxuICB9XG59XG4iLCIvKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUmVwb3NpdG9yeS50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJyZWN0YW5nbGVMb2NhdGlvbi50c1wiLz5cbm1vZHVsZSBEYXNoYm9hcmQge1xuXG4gIHZhciBtb2R1bGVzOkFycmF5PHN0cmluZz4gPSB1bmRlZmluZWQ7XG5cbiAgX21vZHVsZS5kaXJlY3RpdmUoJ2hhd3Rpb0Rhc2hib2FyZCcsIGZ1bmN0aW9uKCkge1xuICAgIG1vZHVsZXMgPSBoYXd0aW9QbHVnaW5Mb2FkZXJbJ21vZHVsZXMnXS5maWx0ZXIoKG5hbWUpID0+IHtcbiAgICAgIHJldHVybiBfLmlzU3RyaW5nKG5hbWUpICYmIG5hbWUgIT09ICduZyc7XG4gICAgfSk7XG4gICAgcmV0dXJuIG5ldyBEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUoKTtcbiAgfSk7XG5cbiAgZXhwb3J0IGNsYXNzIEdyaWRzdGVyRGlyZWN0aXZlIHtcbiAgICBwdWJsaWMgcmVzdHJpY3QgPSAnQSc7XG4gICAgcHVibGljIHJlcGxhY2UgPSB0cnVlO1xuXG4gICAgcHVibGljIGNvbnRyb2xsZXIgPSBbXCIkc2NvcGVcIiwgXCIkZWxlbWVudFwiLCBcIiRhdHRyc1wiLCBcIiRsb2NhdGlvblwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcIiR0ZW1wbGF0ZUNhY2hlXCIsIFwiZGFzaGJvYXJkUmVwb3NpdG9yeVwiLCBcIiRjb21waWxlXCIsIFwiJHRlbXBsYXRlUmVxdWVzdFwiLCBcIiRpbnRlcnBvbGF0ZVwiLCBcIiR1aWJNb2RhbFwiLCBcIiRzY2VcIiwgXCIkdGltZW91dFwiLCAoJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzLCAkbG9jYXRpb24sICRyb3V0ZVBhcmFtcywgJHRlbXBsYXRlQ2FjaGUsIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSwgJGNvbXBpbGUsICR0ZW1wbGF0ZVJlcXVlc3QsICRpbnRlcnBvbGF0ZSwgJHVpYk1vZGFsLCAkc2NlLCAkdGltZW91dCkgPT4ge1xuXG4gICAgICB2YXIgZ3JpZFNpemUgPSAxNTA7XG4gICAgICB2YXIgZ3JpZE1hcmdpbiA9IDY7XG4gICAgICB2YXIgZ3JpZEhlaWdodDtcblxuICAgICAgdmFyIGdyaWRYID0gZ3JpZFNpemU7XG4gICAgICB2YXIgZ3JpZFkgPSBncmlkU2l6ZTtcblxuICAgICAgdmFyIHdpZGdldE1hcCA9IHt9O1xuXG4gICAgICB2YXIgZGFzaGJvYXJkUmVwb3NpdG9yeTpEYXNoYm9hcmRSZXBvc2l0b3J5ID0gJHNjb3BlLiRldmFsKCdkYXNoYm9hcmRSZXBvc2l0b3J5JykgfHwgZGFzaGJvYXJkUmVwb3NpdG9yeTtcblxuICAgICAgJHNjb3BlLiRvbignJGRlc3Ryb3knLCAoKSA9PiB7XG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaCh3aWRnZXRNYXAsICh3aWRnZXQsIGtleSkgPT4ge1xuICAgICAgICAgIGlmICgnc2NvcGUnIGluIHdpZGdldCkge1xuICAgICAgICAgICAgdmFyIHNjb3BlID0gd2lkZ2V0WydzY29wZSddO1xuICAgICAgICAgICAgc2NvcGUuJGRlc3Ryb3koKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGVzdHJveVdpZGdldCh3aWRnZXQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAkZWxlbWVudC5vbignJGRlc3Ryb3knLCAoKSA9PiB7XG4gICAgICAgICRzY29wZS4kZGVzdHJveSgpO1xuICAgICAgfSk7XG5cbiAgICAgIHNldFRpbWVvdXQodXBkYXRlV2lkZ2V0cywgMTApO1xuXG4gICAgICBmdW5jdGlvbiBkZXN0cm95V2lkZ2V0KHdpZGdldCkge1xuICAgICAgICB2YXIgZ3JpZHN0ZXIgPSBnZXRHcmlkc3RlcigpO1xuICAgICAgICB2YXIgd2lkZ2V0RWxlbSA9IG51bGw7XG4gICAgICAgIC8vIGxldHMgZGVzdHJveSB0aGUgd2lkZ2V0cydzIHNjb3BlXG4gICAgICAgIHZhciB3aWRnZXREYXRhID0gd2lkZ2V0TWFwW3dpZGdldC5pZF07XG4gICAgICAgIGlmICh3aWRnZXREYXRhKSB7XG4gICAgICAgICAgZGVsZXRlIHdpZGdldE1hcFt3aWRnZXQuaWRdO1xuICAgICAgICAgIHdpZGdldEVsZW0gPSB3aWRnZXREYXRhLndpZGdldDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXdpZGdldEVsZW0pIHtcbiAgICAgICAgICAvLyBsZXRzIGdldCB0aGUgbGkgcGFyZW50IGVsZW1lbnQgb2YgdGhlIHRlbXBsYXRlXG4gICAgICAgICAgd2lkZ2V0RWxlbSA9ICRlbGVtZW50LmZpbmQoXCJbZGF0YS13aWRnZXRJZD0nXCIgKyB3aWRnZXQuaWQgKyBcIiddXCIpLnBhcmVudCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChncmlkc3RlciAmJiB3aWRnZXRFbGVtKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGdyaWRzdGVyLnJlbW92ZV93aWRnZXQod2lkZ2V0RWxlbSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAvLyBub3RoaW5nIHRvIGRvLCB3ZSdsbCBkZXN0cm95IHRoZSBlbGVtZW50IGJlbG93XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh3aWRnZXRFbGVtKSB7XG4gICAgICAgICAgd2lkZ2V0RWxlbS5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiByZW1vdmVXaWRnZXQod2lkZ2V0KSB7XG4gICAgICAgIGRlc3Ryb3lXaWRnZXQod2lkZ2V0KTtcbiAgICAgICAgLy8gbGV0cyB0cmFzaCB0aGUgSlNPTiBtZXRhZGF0YVxuICAgICAgICBpZiAoJHNjb3BlLmRhc2hib2FyZCkge1xuICAgICAgICAgIHZhciB3aWRnZXRzID0gJHNjb3BlLmRhc2hib2FyZC53aWRnZXRzO1xuICAgICAgICAgIGlmICh3aWRnZXRzKSB7XG4gICAgICAgICAgICB2YXIgdyA9IF8ucmVtb3ZlKHdpZGdldHMsICh3OmFueSkgPT4gdy5pZCA9PT0gd2lkZ2V0LmlkKTtcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhcIlJlbW92ZWQgd2lkZ2V0OlwiLCB3KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIlJlbW92ZWQgd2lkZ2V0IFwiICsgd2lkZ2V0LnRpdGxlKTtcbiAgICAgIH07XG5cbiAgICAgIGZ1bmN0aW9uIGNoYW5nZVdpZGdldFNpemUod2lkZ2V0LCBzaXplZnVuYywgc2F2ZWZ1bmMpIHtcbiAgICAgICAgaWYgKCF3aWRnZXQpIHtcbiAgICAgICAgICBsb2cuZGVidWcoXCJ3aWRnZXQgdW5kZWZpbmVkXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZ3JpZHN0ZXIgPSBnZXRHcmlkc3RlcigpO1xuICAgICAgICBsb2cuZGVidWcoXCJXaWRnZXQgSUQ6IFwiLCB3aWRnZXQuaWQsIFwiIHdpZGdldE1hcDogXCIsIHdpZGdldE1hcCk7XG4gICAgICAgIHZhciBlbnRyeSA9IHdpZGdldE1hcFt3aWRnZXQuaWRdO1xuICAgICAgICB2YXIgdyA9IGVudHJ5LndpZGdldDtcbiAgICAgICAgc2l6ZWZ1bmMoZW50cnkpO1xuICAgICAgICBncmlkc3Rlci5yZXNpemVfd2lkZ2V0KHcsIGVudHJ5LnNpemVfeCwgZW50cnkuc2l6ZV95KTtcbiAgICAgICAgZ3JpZHN0ZXIuc2V0X2RvbV9ncmlkX2hlaWdodCgpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICBzYXZlZnVuYyh3aWRnZXQpO1xuICAgICAgICB9LCA1MCk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG9uV2lkZ2V0UmVuYW1lZCh3aWRnZXQpIHtcbiAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIlJlbmFtZWQgd2lkZ2V0IHRvIFwiICsgd2lkZ2V0LnRpdGxlKTtcbiAgICAgIH07XG5cbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZVdpZGdldHMoKSB7XG4gICAgICAgICRzY29wZS5pZCA9ICRzY29wZS4kZXZhbCgnZGFzaGJvYXJkSWQnKSB8fCAkcm91dGVQYXJhbXNbXCJkYXNoYm9hcmRJZFwiXTtcbiAgICAgICAgJHNjb3BlLmlkeCA9ICRzY29wZS4kZXZhbCgnZGFzaGJvYXJkSW5kZXgnKSB8fCAkcm91dGVQYXJhbXNbXCJkYXNoYm9hcmRJbmRleFwiXTtcbiAgICAgICAgaWYgKCRzY29wZS5pZCkge1xuICAgICAgICAgICRzY29wZS4kZW1pdCgnbG9hZERhc2hib2FyZHMnKTtcbiAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZCgkc2NvcGUuaWQsIG9uRGFzaGJvYXJkTG9hZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXREYXNoYm9hcmRzKChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkcyk7XG5cbiAgICAgICAgICAgIHZhciBpZHggPSAkc2NvcGUuaWR4ID8gcGFyc2VJbnQoJHNjb3BlLmlkeCkgOiAwO1xuICAgICAgICAgICAgdmFyIGlkID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChkYXNoYm9hcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgdmFyIGRhc2hib2FyZCA9IGRhc2hib2FyZHMubGVuZ3RoID4gaWR4ID8gZGFzaGJvYXJkc1tpZHhdIDogZGFzaGJvYXJkWzBdO1xuICAgICAgICAgICAgICBpZCA9IGRhc2hib2FyZC5pZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgkc2NvcGUuJGV2YWwoJ2Rhc2hib2FyZEVtYmVkZGVkJykpIHtcbiAgICAgICAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkKSB7XG4gICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9pZC9cIiArIGlkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9lZGl0XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBvbkRhc2hib2FyZExvYWQoZGFzaGJvYXJkKSB7XG4gICAgICAgICRzY29wZS5kYXNoYm9hcmQgPSBkYXNoYm9hcmQ7XG4gICAgICAgIHZhciB3aWRnZXRzID0gKChkYXNoYm9hcmQpID8gZGFzaGJvYXJkLndpZGdldHMgOiBudWxsKSB8fCBbXTtcblxuICAgICAgICB2YXIgbWluSGVpZ2h0ID0gMTA7XG4gICAgICAgIHZhciBtaW5XaWR0aCA9IDY7XG5cbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKHdpZGdldHMsICh3aWRnZXQpID0+IHtcbiAgICAgICAgICBpZiAoIXdpZGdldCkge1xuICAgICAgICAgICAgbG9nLmRlYnVnKFwiVW5kZWZpbmVkIHdpZGdldCwgc2tpcHBpbmdcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZCh3aWRnZXQucm93KSAmJiBtaW5IZWlnaHQgPCB3aWRnZXQucm93KSB7XG4gICAgICAgICAgICBtaW5IZWlnaHQgPSB3aWRnZXQucm93ICsgMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHdpZGdldC5zaXplX3hcbiAgICAgICAgICAgICAgJiYgYW5ndWxhci5pc0RlZmluZWQod2lkZ2V0LmNvbCkpKSB7XG4gICAgICAgICAgICB2YXIgcmlnaHRFZGdlID0gd2lkZ2V0LmNvbCArIHdpZGdldC5zaXplX3g7XG4gICAgICAgICAgICBpZiAocmlnaHRFZGdlID4gbWluV2lkdGgpIHtcbiAgICAgICAgICAgICAgbWluV2lkdGggPSByaWdodEVkZ2UgKyAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGdyaWRzdGVyID0gJGVsZW1lbnQuZ3JpZHN0ZXIoe1xuICAgICAgICAgIHdpZGdldF9tYXJnaW5zOiBbZ3JpZE1hcmdpbiwgZ3JpZE1hcmdpbl0sXG4gICAgICAgICAgd2lkZ2V0X2Jhc2VfZGltZW5zaW9uczogW2dyaWRYLCBncmlkWV0sXG4gICAgICAgICAgZXh0cmFfcm93czogbWluSGVpZ2h0LFxuICAgICAgICAgIGV4dHJhX2NvbHM6IG1pbldpZHRoLFxuICAgICAgICAgIG1heF9zaXplX3g6IG1pbldpZHRoLFxuICAgICAgICAgIG1heF9zaXplX3k6IG1pbkhlaWdodCxcbiAgICAgICAgICBkcmFnZ2FibGU6IHtcbiAgICAgICAgICAgIHN0b3A6IChldmVudCwgdWkpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHNlcmlhbGl6ZURhc2hib2FyZCgpKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIkNoYW5naW5nIGRhc2hib2FyZCBsYXlvdXRcIik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pLmRhdGEoJ2dyaWRzdGVyJyk7XG5cbiAgICAgICAgdmFyIHRlbXBsYXRlID0gJHRlbXBsYXRlQ2FjaGUuZ2V0KFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsIFwid2lkZ2V0VGVtcGxhdGUuaHRtbFwiKSk7XG4gICAgICAgIHZhciByZW1haW5pbmcgPSB3aWRnZXRzLmxlbmd0aDtcblxuICAgICAgICBmdW5jdGlvbiBtYXliZUZpbmlzaFVwKCkge1xuICAgICAgICAgIHJlbWFpbmluZyA9IHJlbWFpbmluZyAtIDE7XG4gICAgICAgICAgaWYgKHJlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgICAgbWFrZVJlc2l6YWJsZSgpO1xuICAgICAgICAgICAgZ2V0R3JpZHN0ZXIoKS5lbmFibGUoKTtcbiAgICAgICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZG9SZW1vdmVXaWRnZXQoJHVpYk1vZGFsLCB3aWRnZXQpIHtcbiAgICAgICAgICBsb2cuZGVidWcoXCJSZW1vdmUgd2lkZ2V0OiBcIiwgd2lkZ2V0KTtcbiAgICAgICAgICB2YXIgbW9kYWwgPSAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ2RlbGV0ZVdpZGdldE1vZGFsLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyR1aWJNb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJHVpYk1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAgICAgJHNjb3BlLndpZGdldCA9IHdpZGdldDtcbiAgICAgICAgICAgICAgJHNjb3BlLm9rID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgcmVtb3ZlV2lkZ2V0KCRzY29wZS53aWRnZXQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgbW9kYWwuZGlzbWlzcygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZG9SZW5hbWVXaWRnZXQoJHVpYk1vZGFsLCB3aWRnZXQpIHtcbiAgICAgICAgICBsb2cuZGVidWcoXCJSZW5hbWUgd2lkZ2V0OiBcIiwgd2lkZ2V0KTtcbiAgICAgICAgICB2YXIgbW9kYWwgPSAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ3JlbmFtZVdpZGdldE1vZGFsLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyR1aWJNb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJHVpYk1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAgICAgJHNjb3BlLndpZGdldCA9IHdpZGdldDtcbiAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZyA9IHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAndGl0bGUnOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB3aWRnZXQudGl0bGVcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICRzY29wZS5vayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBtb2RhbC5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIG9uV2lkZ2V0UmVuYW1lZCgkc2NvcGUud2lkZ2V0KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIG1vZGFsLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfV1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaCh3aWRnZXRzLCAod2lkZ2V0KSA9PiB7XG4gICAgICAgICAgdmFyIHR5cGUgPSAnaW50ZXJuYWwnO1xuICAgICAgICAgIGlmICgnaWZyYW1lJyBpbiB3aWRnZXQpIHtcbiAgICAgICAgICAgIHR5cGUgPSAnZXh0ZXJuYWwnO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2V4dGVybmFsJzpcbiAgICAgICAgICAgICAgbG9nLmRlYnVnKFwiUmVuZGVyaW5nIGV4dGVybmFsIChpZnJhbWUpIHdpZGdldDogXCIsIHdpZGdldC50aXRsZSB8fCB3aWRnZXQuaWQpO1xuICAgICAgICAgICAgICB2YXIgc2NvcGUgPSAkc2NvcGUuJG5ldygpO1xuICAgICAgICAgICAgICBzY29wZS53aWRnZXQgPSB3aWRnZXQ7XG4gICAgICAgICAgICAgIHNjb3BlLnJlbW92ZVdpZGdldCA9ICh3aWRnZXQpID0+IGRvUmVtb3ZlV2lkZ2V0KCR1aWJNb2RhbCwgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgc2NvcGUucmVuYW1lV2lkZ2V0ID0gKHdpZGdldCkgPT4gZG9SZW5hbWVXaWRnZXQoJHVpYk1vZGFsLCB3aWRnZXQpO1xuICAgICAgICAgICAgICB2YXIgd2lkZ2V0Qm9keTphbnkgPSBhbmd1bGFyLmVsZW1lbnQoJHRlbXBsYXRlQ2FjaGUuZ2V0KFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdpZnJhbWVXaWRnZXRUZW1wbGF0ZS5odG1sJykpKTtcbiAgICAgICAgICAgICAgdmFyIG91dGVyRGl2ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldChVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAnd2lkZ2V0QmxvY2tUZW1wbGF0ZS5odG1sJykpKTtcbiAgICAgICAgICAgICAgd2lkZ2V0Qm9keS5maW5kKCdpZnJhbWUnKS5hdHRyKCdzcmMnLCB3aWRnZXQuaWZyYW1lKTtcbiAgICAgICAgICAgICAgb3V0ZXJEaXYuYXBwZW5kKCRjb21waWxlKHdpZGdldEJvZHkpKHNjb3BlKSk7XG4gICAgICAgICAgICAgIHZhciB3ID0gZ3JpZHN0ZXIuYWRkX3dpZGdldChvdXRlckRpdiwgd2lkZ2V0LnNpemVfeCwgd2lkZ2V0LnNpemVfeSwgd2lkZ2V0LmNvbCwgd2lkZ2V0LnJvdyk7XG4gICAgICAgICAgICAgIHdpZGdldE1hcFt3aWRnZXQuaWRdID0ge1xuICAgICAgICAgICAgICAgIHdpZGdldDogd1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICBtYXliZUZpbmlzaFVwKCk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnaW50ZXJuYWwnOiBcbiAgICAgICAgICAgICAgbG9nLmRlYnVnKFwiUmVuZGVyaW5nIGludGVybmFsIHdpZGdldDogXCIsIHdpZGdldC50aXRsZSB8fCB3aWRnZXQuaWQpO1xuICAgICAgICAgICAgICB2YXIgcGF0aCA9IHdpZGdldC5wYXRoO1xuICAgICAgICAgICAgICB2YXIgc2VhcmNoID0gbnVsbDtcbiAgICAgICAgICAgICAgaWYgKHdpZGdldC5zZWFyY2gpIHtcbiAgICAgICAgICAgICAgICBzZWFyY2ggPSBEYXNoYm9hcmQuZGVjb2RlVVJJQ29tcG9uZW50UHJvcGVydGllcyh3aWRnZXQuc2VhcmNoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAod2lkZ2V0LnJvdXRlUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgXy5leHRlbmQoc2VhcmNoLCBhbmd1bGFyLmZyb21Kc29uKHdpZGdldC5yb3V0ZVBhcmFtcykpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHZhciBoYXNoID0gd2lkZ2V0Lmhhc2g7IC8vIFRPRE8gZGVjb2RlIG9iamVjdD9cbiAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gbmV3IFJlY3RhbmdsZUxvY2F0aW9uKCRsb2NhdGlvbiwgcGF0aCwgc2VhcmNoLCBoYXNoKTtcbiAgICAgICAgICAgICAgaWYgKCF3aWRnZXQuc2l6ZV94IHx8IHdpZGdldC5zaXplX3ggPCAxKSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0LnNpemVfeCA9IDE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKCF3aWRnZXQuc2l6ZV95IHx8IHdpZGdldC5zaXplX3kgPCAxKSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0LnNpemVfeSA9IDE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdmFyIHRtcE1vZHVsZU5hbWUgPSAnZGFzaGJvYXJkLScgKyB3aWRnZXQuaWQ7XG4gICAgICAgICAgICAgIHZhciBwbHVnaW5zID0gXy5maWx0ZXIoaGF3dGlvUGx1Z2luTG9hZGVyLmdldE1vZHVsZXMoKSwgKG1vZHVsZSkgPT4gYW5ndWxhci5pc1N0cmluZyhtb2R1bGUpKTtcbiAgICAgICAgICAgICAgdmFyIHRtcE1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKHRtcE1vZHVsZU5hbWUsIHBsdWdpbnMpO1xuXG4gICAgICAgICAgICAgIGNvbnN0IGdldFNlcnZpY2VzID0gZnVuY3Rpb24obW9kdWxlOnN0cmluZywgYW5zd2VyPzphbnkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWFuc3dlcikge1xuICAgICAgICAgICAgICAgICAgYW5zd2VyID0gPGFueT57fTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXy5mb3JFYWNoKGFuZ3VsYXIubW9kdWxlKG1vZHVsZSkucmVxdWlyZXMsIChtKSA9PiBnZXRTZXJ2aWNlcyhtLCBhbnN3ZXIpKTtcbiAgICAgICAgICAgICAgICBfLmZvckVhY2goKDxhbnk+YW5ndWxhci5tb2R1bGUobW9kdWxlKSkuX2ludm9rZVF1ZXVlLCAoYSkgPT4ge1xuICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgYW5zd2VyW2FbMl1bMF1dID0gSGF3dGlvQ29yZS5pbmplY3Rvci5nZXQoYVsyXVswXSk7XG4gICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy9ub3RoaW5nIHRvIGRvXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFuc3dlcjtcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgdmFyIHNlcnZpY2VzID0ge307XG4gICAgICAgICAgICAgIF8uZm9yRWFjaChwbHVnaW5zLCAocGx1Z2luOnN0cmluZykgPT4gcGx1Z2luID8gZ2V0U2VydmljZXMocGx1Z2luLCBzZXJ2aWNlcykgOiBjb25zb2xlLmxvZyhcIm51bGwgcGx1Z2luIG5hbWVcIikpO1xuICAgICAgICAgICAgICAvL2xvZy5kZWJ1ZyhcInNlcnZpY2VzOiBcIiwgc2VydmljZXMpO1xuXG4gICAgICAgICAgICAgIHRtcE1vZHVsZS5jb25maWcoWyckcHJvdmlkZScsICgkcHJvdmlkZSkgPT4ge1xuICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcignSGF3dGlvRGFzaGJvYXJkJywgWyckZGVsZWdhdGUnLCAnJHJvb3RTY29wZScsICgkZGVsZWdhdGUsICRyb290U2NvcGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICRkZWxlZ2F0ZS5pbkRhc2hib2FyZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gJGRlbGVnYXRlO1xuICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IoJyRsb2NhdGlvbicsIFsnJGRlbGVnYXRlJywgKCRkZWxlZ2F0ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgLy9sb2cuZGVidWcoXCJVc2luZyAkbG9jYXRpb246IFwiLCBsb2NhdGlvbik7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gbG9jYXRpb247XG4gICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcignJHJvdXRlJywgWyckZGVsZWdhdGUnLCAoJGRlbGVnYXRlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAvLyByZWFsbHkgaGFuZHkgZm9yIGRlYnVnZ2luZywgbW9zdGx5IHRvIHRlbGwgaWYgYSB3aWRnZXQncyByb3V0ZVxuICAgICAgICAgICAgICAgICAgLy8gaXNuJ3QgYWN0dWFsbHkgYXZhaWxhYmxlIGluIHRoZSBjaGlsZCBhcHBcbiAgICAgICAgICAgICAgICAgIC8vbG9nLmRlYnVnKFwiVXNpbmcgJHJvdXRlOiBcIiwgJGRlbGVnYXRlKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiAkZGVsZWdhdGU7XG4gICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcignJHJvdXRlUGFyYW1zJywgWyckZGVsZWdhdGUnLCAoJGRlbGVnYXRlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAvL2xvZy5kZWJ1ZyhcIlVzaW5nICRyb3V0ZVBhcmFtczogXCIsIHNlYXJjaCk7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gc2VhcmNoO1xuICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICBfLmZvckluKHNlcnZpY2VzLCAoc2VydmljZSwgbmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgc3dpdGNoKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnJGxvY2F0aW9uJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnJHJvdXRlJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnJHJvdXRlUGFyYW1zJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnSGF3dGlvRGFzaGJvYXJkJzpcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZGFzaGJvYXJkUmVwb3NpdG9yeSc6XG4gICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcihuYW1lLCBbKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ0hhd3Rpb0Rhc2hib2FyZFRhYic6XG4gICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcihuYW1lLCBbKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBlbWJlZGRlZDogdHJ1ZSB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdCdWlsZGVyRmFjdG9yeVByb3ZpZGVyJzpcbiAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKG5hbWUsIFsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXREdW1teUJ1aWxkZXJGYWN0b3J5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ0hhd3Rpb05hdic6XG4gICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcihuYW1lLCBbKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2V0RHVtbXlIYXd0aW9OYXYoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vdGhpbmcgdG8gZG9cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgLy9sb2cuZGVidWcoXCJuYW1lOiBcIiwgbmFtZSwgXCIgc2VydmljZTogXCIsIHNlcnZpY2UpO1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChfLnN0YXJ0c1dpdGgobmFtZSwgJyQnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKG5hbWUsIFsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGxvZy5kZWJ1ZyhcIlJldHVybmluZyBleGlzdGluZyBzZXJ2aWNlIGZvcjogXCIsIG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VydmljZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlnbm9yZSwgdGhpcydsbCBoYXBwZW4gZm9yIGNvbnN0YW50cyBhbmQgc3R1ZmZcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgdG1wTW9kdWxlLmNvbnRyb2xsZXIoJ0hhd3Rpb0Rhc2hib2FyZC5UaXRsZScsIFtcIiRzY29wZVwiLCBcIiR1aWJNb2RhbFwiLCAoJHNjb3BlLCAkdWliTW9kYWwpID0+IHtcbiAgICAgICAgICAgICAgICAkc2NvcGUud2lkZ2V0ID0gd2lkZ2V0O1xuICAgICAgICAgICAgICAgICRzY29wZS5yZW1vdmVXaWRnZXQgPSAod2lkZ2V0KSA9PiBkb1JlbW92ZVdpZGdldCgkdWliTW9kYWwsIHdpZGdldCk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnJlbmFtZVdpZGdldCA9ICh3aWRnZXQpID0+IGRvUmVuYW1lV2lkZ2V0KCR1aWJNb2RhbCwgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgfV0pO1xuXG4gICAgICAgICAgICAgIHZhciBkaXY6YW55ID0gJCh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICAgIGRpdi5hdHRyKHsgJ2RhdGEtd2lkZ2V0SWQnOiB3aWRnZXQuaWQgfSk7XG4gICAgICAgICAgICAgIHZhciBib2R5ID0gZGl2LmZpbmQoJy53aWRnZXQtYm9keScpO1xuICAgICAgICAgICAgICBsb2cuZGVidWcoXCJpbmNsdWRlOiBcIiwgd2lkZ2V0LmluY2x1ZGUpO1xuICAgICAgICAgICAgICB2YXIgd2lkZ2V0Qm9keSA9ICR0ZW1wbGF0ZUNhY2hlLmdldCh3aWRnZXQuaW5jbHVkZSk7XG4gICAgICAgICAgICAgICR0aW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgb3V0ZXJEaXYgPSBhbmd1bGFyLmVsZW1lbnQoJHRlbXBsYXRlQ2FjaGUuZ2V0KFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICd3aWRnZXRCbG9ja1RlbXBsYXRlLmh0bWwnKSkpO1xuICAgICAgICAgICAgICAgIGJvZHkuaHRtbCh3aWRnZXRCb2R5KTtcbiAgICAgICAgICAgICAgICBvdXRlckRpdi5odG1sKGRpdik7XG4gICAgICAgICAgICAgICAgYW5ndWxhci5ib290c3RyYXAoZGl2LCBbdG1wTW9kdWxlTmFtZV0pO1xuICAgICAgICAgICAgICAgIHdpZGdldE1hcFt3aWRnZXQuaWRdID0ge1xuICAgICAgICAgICAgICAgICAgd2lkZ2V0OiBncmlkc3Rlci5hZGRfd2lkZ2V0KG91dGVyRGl2LCB3aWRnZXQuc2l6ZV94LCB3aWRnZXQuc2l6ZV95LCB3aWRnZXQuY29sLCB3aWRnZXQucm93KVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgbWF5YmVGaW5pc2hVcCgpO1xuICAgICAgICAgICAgICB9LCA1MCk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHNlcmlhbGl6ZURhc2hib2FyZCgpIHtcbiAgICAgICAgdmFyIGdyaWRzdGVyID0gZ2V0R3JpZHN0ZXIoKTtcbiAgICAgICAgaWYgKGdyaWRzdGVyKSB7XG4gICAgICAgICAgdmFyIGRhdGEgPSBncmlkc3Rlci5zZXJpYWxpemUoKTtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiZ290IGRhdGE6IFwiICsgSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuXG4gICAgICAgICAgdmFyIHdpZGdldHMgPSAkc2NvcGUuZGFzaGJvYXJkLndpZGdldHMgfHwgW107XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coXCJXaWRnZXRzOiBcIiwgd2lkZ2V0cyk7XG5cbiAgICAgICAgICAvLyBsZXRzIGFzc3VtZSB0aGUgZGF0YSBpcyBpbiB0aGUgb3JkZXIgb2YgdGhlIHdpZGdldHMuLi5cbiAgICAgICAgICBhbmd1bGFyLmZvckVhY2god2lkZ2V0cywgKHdpZGdldCwgaWR4KSA9PiB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW2lkeF07XG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgd2lkZ2V0KSB7XG4gICAgICAgICAgICAgIC8vIGxldHMgY29weSB0aGUgdmFsdWVzIGFjcm9zc1xuICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2godmFsdWUsIChhdHRyLCBrZXkpID0+IHdpZGdldFtrZXldID0gYXR0cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBtYWtlUmVzaXphYmxlKCkge1xuICAgICAgICB2YXIgYmxvY2tzOmFueSA9ICQoJy5ncmlkLWJsb2NrJyk7XG4gICAgICAgIGJsb2Nrcy5yZXNpemFibGUoKTtcbiAgICAgICAgYmxvY2tzLnJlc2l6YWJsZSgnZGVzdHJveScpO1xuXG4gICAgICAgIGJsb2Nrcy5yZXNpemFibGUoe1xuICAgICAgICAgIGdyaWQ6IFtncmlkU2l6ZSArIChncmlkTWFyZ2luICogMiksIGdyaWRTaXplICsgKGdyaWRNYXJnaW4gKiAyKV0sXG4gICAgICAgICAgYW5pbWF0ZTogZmFsc2UsXG4gICAgICAgICAgbWluV2lkdGg6IGdyaWRTaXplLFxuICAgICAgICAgIG1pbkhlaWdodDogZ3JpZFNpemUsXG4gICAgICAgICAgYXV0b0hpZGU6IGZhbHNlLFxuICAgICAgICAgIHN0YXJ0OiBmdW5jdGlvbihldmVudCwgdWkpIHtcbiAgICAgICAgICAgIGdyaWRIZWlnaHQgPSBnZXRHcmlkc3RlcigpLiRlbC5oZWlnaHQoKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlc2l6ZTogZnVuY3Rpb24oZXZlbnQsIHVpKSB7XG4gICAgICAgICAgICAvL3NldCBuZXcgZ3JpZCBoZWlnaHQgYWxvbmcgdGhlIGRyYWdnaW5nIHBlcmlvZFxuICAgICAgICAgICAgdmFyIGcgPSBnZXRHcmlkc3RlcigpO1xuICAgICAgICAgICAgdmFyIGRlbHRhID0gZ3JpZFNpemUgKyBncmlkTWFyZ2luICogMjtcbiAgICAgICAgICAgIGlmIChldmVudC5vZmZzZXRZID4gZy4kZWwuaGVpZ2h0KCkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHZhciBleHRyYSA9IE1hdGguZmxvb3IoKGV2ZW50Lm9mZnNldFkgLSBncmlkSGVpZ2h0KSAvIGRlbHRhICsgMSk7XG4gICAgICAgICAgICAgIHZhciBuZXdIZWlnaHQgPSBncmlkSGVpZ2h0ICsgZXh0cmEgKiBkZWx0YTtcbiAgICAgICAgICAgICAgZy4kZWwuY3NzKCdoZWlnaHQnLCBuZXdIZWlnaHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgc3RvcDogZnVuY3Rpb24oZXZlbnQsIHVpKSB7XG4gICAgICAgICAgICB2YXIgcmVzaXplZCA9ICQodGhpcyk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXNpemVCbG9jayhyZXNpemVkKTtcbiAgICAgICAgICAgIH0sIDMwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAkKCcudWktcmVzaXphYmxlLWhhbmRsZScpLmhvdmVyKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGdldEdyaWRzdGVyKCkuZGlzYWJsZSgpO1xuICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBnZXRHcmlkc3RlcigpLmVuYWJsZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgfVxuXG5cbiAgICAgIGZ1bmN0aW9uIHJlc2l6ZUJsb2NrKGVsbU9iaikge1xuICAgICAgICB2YXIgYXJlYSA9IGVsbU9iai5maW5kKCcud2lkZ2V0LWFyZWEnKTtcbiAgICAgICAgdmFyIHcgPSBlbG1PYmoud2lkdGgoKSAtIGdyaWRTaXplO1xuICAgICAgICB2YXIgaCA9IGVsbU9iai5oZWlnaHQoKSAtIGdyaWRTaXplO1xuXG4gICAgICAgIGZvciAodmFyIGdyaWRfdyA9IDE7IHcgPiAwOyB3IC09IChncmlkU2l6ZSArIChncmlkTWFyZ2luICogMikpKSB7XG4gICAgICAgICAgZ3JpZF93Kys7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBncmlkX2ggPSAxOyBoID4gMDsgaCAtPSAoZ3JpZFNpemUgKyAoZ3JpZE1hcmdpbiAqIDIpKSkge1xuICAgICAgICAgIGdyaWRfaCsrO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHdpZGdldCA9IHtcbiAgICAgICAgICBpZDogYXJlYS5hdHRyKCdkYXRhLXdpZGdldElkJylcbiAgICAgICAgfTtcblxuICAgICAgICBjaGFuZ2VXaWRnZXRTaXplKHdpZGdldCwgZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgICAgICAgd2lkZ2V0LnNpemVfeCA9IGdyaWRfdztcbiAgICAgICAgICB3aWRnZXQuc2l6ZV95ID0gZ3JpZF9oO1xuICAgICAgICB9LCBmdW5jdGlvbih3aWRnZXQpIHtcbiAgICAgICAgICBpZiAoc2VyaWFsaXplRGFzaGJvYXJkKCkpIHtcbiAgICAgICAgICAgIHVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkoXCJDaGFuZ2VkIHNpemUgb2Ygd2lkZ2V0OiBcIiArIHdpZGdldC5pZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiB1cGRhdGVEYXNoYm9hcmRSZXBvc2l0b3J5KG1lc3NhZ2U6IHN0cmluZykge1xuICAgICAgICBpZiAoJHNjb3BlLmRhc2hib2FyZCkge1xuICAgICAgICAgIHZhciBjb21taXRNZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICBpZiAoJHNjb3BlLmRhc2hib2FyZCAmJiAkc2NvcGUuZGFzaGJvYXJkLnRpdGxlKSB7XG4gICAgICAgICAgICBjb21taXRNZXNzYWdlICs9IFwiIG9uIGRhc2hib2FyZCBcIiArICRzY29wZS5kYXNoYm9hcmQudGl0bGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbJHNjb3BlLmRhc2hib2FyZF0sIGNvbW1pdE1lc3NhZ2UsIERhc2hib2FyZC5vbk9wZXJhdGlvbkNvbXBsZXRlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBnZXRHcmlkc3RlcigpIHtcbiAgICAgICAgcmV0dXJuICRlbGVtZW50LmdyaWRzdGVyKCkuZGF0YSgnZ3JpZHN0ZXInKTtcbiAgICAgIH1cblxuICAgIH1dO1xuXG4gIH1cblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG4gIF9tb2R1bGUuY29udHJvbGxlcihcIkRhc2hib2FyZC5JbXBvcnRDb250cm9sbGVyXCIsIFtcIiRzY29wZVwiLCBcIiRsb2NhdGlvblwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgKCRzY29wZSwgJGxvY2F0aW9uLCAkcm91dGVQYXJhbXMsIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSkgPT4ge1xuICAgICRzY29wZS5wbGFjZWhvbGRlciA9IFwiUGFzdGUgdGhlIEpTT04gaGVyZSBmb3IgdGhlIGRhc2hib2FyZCBjb25maWd1cmF0aW9uIHRvIGltcG9ydC4uLlwiO1xuICAgICRzY29wZS5zb3VyY2UgPSAkc2NvcGUucGxhY2Vob2xkZXI7XG5cbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIG1vZGU6IHtcbiAgICAgICAgbmFtZTogXCJqYXZhc2NyaXB0XCJcbiAgICAgIH1cbiAgICB9O1xuICAgIC8vJHNjb3BlLmNvZGVNaXJyb3JPcHRpb25zID0gQ29kZUVkaXRvci5jcmVhdGVFZGl0b3JTZXR0aW5ncyhvcHRpb25zKTtcblxuXG4gICAgJHNjb3BlLmlzVmFsaWQgPSAoKSA9PiAkc2NvcGUuc291cmNlICYmICRzY29wZS5zb3VyY2UgIT09ICRzY29wZS5wbGFjZWhvbGRlcjtcblxuICAgICRzY29wZS5pbXBvcnRKU09OID0gKCkgPT4ge1xuICAgICAgdmFyIGpzb24gPSBbXTtcbiAgICAgIC8vIGxldHMgcGFyc2UgdGhlIEpTT04uLi5cbiAgICAgIHRyeSB7XG4gICAgICAgIGpzb24gPSBKU09OLnBhcnNlKCRzY29wZS5zb3VyY2UpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvL0hhd3Rpb0NvcmUubm90aWZpY2F0aW9uKFwiZXJyb3JcIiwgXCJDb3VsZCBub3QgcGFyc2UgdGhlIEpTT05cXG5cIiArIGUpO1xuICAgICAgICBqc29uID0gW107XG4gICAgICB9XG4gICAgICB2YXIgYXJyYXkgPSBbXTtcbiAgICAgIGlmIChhbmd1bGFyLmlzQXJyYXkoanNvbikpIHtcbiAgICAgICAgYXJyYXkgPSBqc29uO1xuICAgICAgfSBlbHNlIGlmIChhbmd1bGFyLmlzT2JqZWN0KGpzb24pKSB7XG4gICAgICAgIGFycmF5LnB1c2goanNvbik7XG4gICAgICB9XG5cbiAgICAgIGlmIChhcnJheS5sZW5ndGgpIHtcbiAgICAgICAgLy8gbGV0cyBlbnN1cmUgd2UgaGF2ZSBzb21lIHZhbGlkIGlkcyBhbmQgc3R1ZmYuLi5cbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKGFycmF5LCAoZGFzaCwgaW5kZXgpID0+IHtcbiAgICAgICAgICBhbmd1bGFyLmNvcHkoZGFzaCwgZGFzaGJvYXJkUmVwb3NpdG9yeS5jcmVhdGVEYXNoYm9hcmQoZGFzaCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKGFycmF5LCBcIkltcG9ydGVkIGRhc2hib2FyZCBKU09OXCIsIERhc2hib2FyZC5vbk9wZXJhdGlvbkNvbXBsZXRlKTtcbiAgICAgICAgJGxvY2F0aW9uLnBhdGgoXCIvZGFzaGJvYXJkL2VkaXRcIik7XG4gICAgICB9XG4gICAgfVxuICB9XSk7XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcbiAgX21vZHVsZS5jb250cm9sbGVyKFwiRGFzaGJvYXJkLk5hdkJhckNvbnRyb2xsZXJcIiwgW1wiJHNjb3BlXCIsIFwiJHJvdXRlUGFyYW1zXCIsIFwiJHJvb3RTY29wZVwiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgKCRzY29wZSwgJHJvdXRlUGFyYW1zLCAkcm9vdFNjb3BlLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnkpID0+IHtcblxuICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IFtdO1xuXG4gICAgJHNjb3BlLmFjdGl2ZURhc2hib2FyZCA9ICRyb3V0ZVBhcmFtc1snZGFzaGJvYXJkSWQnXTtcblxuICAgICRzY29wZS4kb24oJ2xvYWREYXNoYm9hcmRzJywgbG9hZERhc2hib2FyZHMpO1xuXG4gICAgJHNjb3BlLiRvbignZGFzaGJvYXJkc1VwZGF0ZWQnLCBkYXNoYm9hcmRMb2FkZWQpO1xuXG4gICAgJHNjb3BlLmRhc2hib2FyZHMgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gJHNjb3BlLl9kYXNoYm9hcmRzXG4gICAgfTtcblxuICAgICRzY29wZS5vblRhYlJlbmFtZWQgPSBmdW5jdGlvbihkYXNoKSB7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoW2Rhc2hdLCBcIlJlbmFtZWQgZGFzaGJvYXJkXCIsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBkYXNoYm9hcmRMb2FkZWQoZXZlbnQsIGRhc2hib2FyZHMpIHtcbiAgICAgIGxvZy5kZWJ1ZyhcIm5hdmJhciBkYXNoYm9hcmRMb2FkZWQ6IFwiLCBkYXNoYm9hcmRzKTtcbiAgICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IGRhc2hib2FyZHM7XG4gICAgICBpZiAoZXZlbnQgPT09IG51bGwpIHtcbiAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdkYXNoYm9hcmRzVXBkYXRlZCcsIGRhc2hib2FyZHMpO1xuICAgICAgICBDb3JlLiRhcHBseSgkc2NvcGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvYWREYXNoYm9hcmRzKGV2ZW50KSB7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZHMoKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgLy8gcHJldmVudCB0aGUgYnJvYWRjYXN0IGZyb20gaGFwcGVuaW5nLi4uXG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfV0pO1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG4gIGV4cG9ydCB2YXIgU2hhcmVDb250cm9sbGVyID0gX21vZHVsZS5jb250cm9sbGVyKFwiRGFzaGJvYXJkLlNoYXJlQ29udHJvbGxlclwiLCBbXCIkc2NvcGVcIiwgXCIkbG9jYXRpb25cIiwgXCIkcm91dGVQYXJhbXNcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsICgkc2NvcGUsICRsb2NhdGlvbiwgJHJvdXRlUGFyYW1zLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnkpID0+IHtcbiAgICB2YXIgaWQgPSAkcm91dGVQYXJhbXNbXCJkYXNoYm9hcmRJZFwiXTtcbiAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZChpZCwgb25EYXNoYm9hcmRMb2FkKTtcblxuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgbW9kZToge1xuICAgICAgICAgIG5hbWU6IFwiamF2YXNjcmlwdFwiXG4gICAgICB9XG4gICAgfTtcbiAgICAvLyRzY29wZS5jb2RlTWlycm9yT3B0aW9ucyA9IENvZGVFZGl0b3IuY3JlYXRlRWRpdG9yU2V0dGluZ3Mob3B0aW9ucyk7XG5cbiAgICBmdW5jdGlvbiBvbkRhc2hib2FyZExvYWQoZGFzaGJvYXJkKSB7XG4gICAgICAkc2NvcGUuZGFzaGJvYXJkID0gRGFzaGJvYXJkLmNsZWFuRGFzaGJvYXJkRGF0YShkYXNoYm9hcmQpO1xuXG4gICAgICAkc2NvcGUuanNvbiA9IHtcbiAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcImhhd3RpbyBkYXNoYm9hcmRzXCIsXG4gICAgICAgIFwicHVibGljXCI6IHRydWUsXG4gICAgICAgIFwiZmlsZXNcIjoge1xuICAgICAgICAgIFwiZGFzaGJvYXJkcy5qc29uXCI6IHtcbiAgICAgICAgICAgIFwiY29udGVudFwiOiBKU09OLnN0cmluZ2lmeSgkc2NvcGUuZGFzaGJvYXJkLCBudWxsLCBcIiAgXCIpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuc291cmNlID0gSlNPTi5zdHJpbmdpZnkoJHNjb3BlLmRhc2hib2FyZCwgbnVsbCwgXCIgIFwiKTtcbiAgICAgIENvcmUuJGFwcGx5Tm93T3JMYXRlcigkc2NvcGUpO1xuICAgIH1cbiAgfV0pO1xufVxuIl19

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