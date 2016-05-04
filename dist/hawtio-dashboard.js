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
                                                    case 'HawtioNav':
                                                        break;
                                                        try {
                                                            $provide.decorator(name, [function () {
                                                                    return Dashboard.getDummyHawtioNav();
                                                                }]);
                                                        }
                                                        catch (err) {
                                                        }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluY2x1ZGVzLmpzIiwiZGFzaGJvYXJkL3RzL2Rhc2hib2FyZEludGVyZmFjZXMudHMiLCJkYXNoYm9hcmQvdHMvZGFzaGJvYXJkSGVscGVycy50cyIsImRhc2hib2FyZC90cy9kYXNoYm9hcmRQbHVnaW4udHMiLCJkYXNoYm9hcmQvdHMvZGFzaGJvYXJkUmVwb3NpdG9yeS50cyIsImRhc2hib2FyZC90cy9lZGl0RGFzaGJvYXJkcy50cyIsImRhc2hib2FyZC90cy9yZWN0YW5nbGVMb2NhdGlvbi50cyIsImRhc2hib2FyZC90cy9ncmlkc3RlckRpcmVjdGl2ZS50cyIsImRhc2hib2FyZC90cy9pbXBvcnQudHMiLCJkYXNoYm9hcmQvdHMvbmF2YmFyLnRzIiwiZGFzaGJvYXJkL3RzL3NoYXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUNxREM7O0FDakRELElBQU8sU0FBUyxDQTJJZjtBQTNJRCxXQUFPLFNBQVMsRUFBQyxDQUFDO0lBRUwsc0JBQVksR0FBRyx5QkFBeUIsQ0FBQztJQUN6QyxvQkFBVSxHQUFHLFdBQVcsQ0FBQztJQUV6QixhQUFHLEdBQWtCLE1BQU0sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQVUvRCw0QkFBbUMsSUFBSTtRQUNyQyxJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFDbkIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsVUFBQyxLQUFLLEVBQUUsR0FBRztZQUMvQixFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3RSxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQ3pCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztR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RUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLHFCQUFxQixFQUFFLFVBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUUsbUJBQXVDO1lBQ25OLElBQUksRUFBRSxHQUFHLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUNyQyxtQkFBbUIsQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBRXRELElBQUksT0FBTyxHQUFHO2dCQUNaLElBQUksRUFBRTtvQkFDRixJQUFJLEVBQUUsWUFBWTtpQkFDckI7YUFDRixDQUFDO1lBR0YseUJBQXlCLFNBQVM7Z0JBQ2hDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUUzRCxNQUFNLENBQUMsSUFBSSxHQUFHO29CQUNaLGFBQWEsRUFBRSxtQkFBbUI7b0JBQ2xDLFFBQVEsRUFBRSxJQUFJO29CQUNkLE9BQU8sRUFBRTt3QkFDUCxpQkFBaUIsRUFBRTs0QkFDakIsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO3lCQUN4RDtxQkFDRjtpQkFDRixDQUFDO2dCQUVGLE1BQU0sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDN0QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2hDLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ04sQ0FBQyxFQTdCTSxTQUFTLEtBQVQsU0FBUyxRQTZCZiIsImZpbGUiOiJjb21waWxlZC5qcyIsInNvdXJjZXNDb250ZW50IjpbbnVsbCwibW9kdWxlIERhc2hib2FyZCB7XG5cbiAgZXhwb3J0IGludGVyZmFjZSBEYXNoYm9hcmRTZXJ2aWNlIHtcbiAgICBoYXNEYXNoYm9hcmQ6Ym9vbGVhbjtcbiAgICBpbkRhc2hib2FyZDpib29sZWFuO1xuICAgIGdldEFkZExpbmsodGl0bGU/OnN0cmluZywgd2lkdGg/Om51bWJlciwgaGVpZ2h0PzpudW1iZXIpOnN0cmluZztcbiAgfVxuXG4gIGV4cG9ydCBpbnRlcmZhY2UgU2VhcmNoTWFwIHtcbiAgICBbbmFtZTogc3RyaW5nXTogc3RyaW5nO1xuICB9XG5cbiAgZXhwb3J0IGludGVyZmFjZSBEYXNoYm9hcmRXaWRnZXQge1xuICAgIGlkOiBzdHJpbmc7XG4gICAgdGl0bGU6IHN0cmluZztcbiAgICByb3c/OiBudW1iZXI7XG4gICAgY29sPzogbnVtYmVyO1xuICAgIHNpemVfeD86IG51bWJlcjtcbiAgICBzaXplX3k/OiBudW1iZXI7XG4gICAgcGF0aD86IHN0cmluZztcbiAgICB1cmw/OiBzdHJpbmc7XG4gICAgaW5jbHVkZT86IHN0cmluZztcbiAgICBzZWFyY2g/OiBTZWFyY2hNYXBcbiAgICByb3V0ZVBhcmFtcz86IHN0cmluZztcbiAgfVxuXG4gIGV4cG9ydCBpbnRlcmZhY2UgRGFzaGJvYXJkIHtcbiAgICBpZDogc3RyaW5nO1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgZ3JvdXA6IHN0cmluZztcbiAgICB3aWRnZXRzOiBBcnJheTxEYXNoYm9hcmRXaWRnZXQ+O1xuICB9XG5cbiAgZXhwb3J0IGludGVyZmFjZSBEZWZhdWx0RGFzaGJvYXJkcyB7XG4gICAgYWRkOiAoZGFzaGJhcmQ6RGFzaGJvYXJkKSA9PiB2b2lkO1xuICAgIHJlbW92ZTogKGlkOnN0cmluZykgPT4gRGFzaGJvYXJkO1xuICAgIGdldEFsbDogKCkgPT4gQXJyYXk8RGFzaGJvYXJkPjtcbiAgfVxuXG4gIC8qKlxuICAgKiBCYXNlIGludGVyZmFjZSB0aGF0IGRhc2hib2FyZCByZXBvc2l0b3JpZXMgbXVzdCBpbXBsZW1lbnRcbiAgICpcbiAgICogQGNsYXNzIERhc2hib2FyZFJlcG9zaXRvcnlcbiAgICovXG4gIGV4cG9ydCBpbnRlcmZhY2UgRGFzaGJvYXJkUmVwb3NpdG9yeSB7XG4gICAgcHV0RGFzaGJvYXJkczogKGFycmF5OmFueVtdLCBjb21taXRNZXNzYWdlOnN0cmluZywgZm4pID0+IGFueTtcbiAgICBkZWxldGVEYXNoYm9hcmRzOiAoYXJyYXk6QXJyYXk8RGFzaGJvYXJkPiwgZm4pID0+IGFueTtcbiAgICBnZXREYXNoYm9hcmRzOiAoZm46KGRhc2hib2FyZHM6IEFycmF5PERhc2hib2FyZD4pID0+IHZvaWQpID0+IHZvaWQ7XG4gICAgZ2V0RGFzaGJvYXJkOiAoaWQ6c3RyaW5nLCBmbjogKGRhc2hib2FyZDogRGFzaGJvYXJkKSA9PiB2b2lkKSA9PiBhbnk7XG4gICAgY3JlYXRlRGFzaGJvYXJkOiAob3B0aW9uczphbnkpID0+IGFueTtcbiAgICBjbG9uZURhc2hib2FyZDooZGFzaGJvYXJkOmFueSkgPT4gYW55O1xuICAgIGdldFR5cGU6KCkgPT4gc3RyaW5nO1xuICB9XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9pbmNsdWRlcy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRJbnRlcmZhY2VzLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcbiAgXG4gIGV4cG9ydCB2YXIgdGVtcGxhdGVQYXRoID0gJ3BsdWdpbnMvZGFzaGJvYXJkL2h0bWwvJztcbiAgZXhwb3J0IHZhciBwbHVnaW5OYW1lID0gJ2Rhc2hib2FyZCc7XG5cbiAgZXhwb3J0IHZhciBsb2c6TG9nZ2luZy5Mb2dnZXIgPSBMb2dnZXIuZ2V0KCdoYXd0aW8tZGFzaGJvYXJkJyk7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNsZWFuZWQgdXAgdmVyc2lvbiBvZiB0aGUgZGFzaGJvYXJkIGRhdGEgd2l0aG91dCBhbnkgVUkgc2VsZWN0aW9uIHN0YXRlXG4gICAqIEBtZXRob2QgY2xlYW5EYXNoYm9hcmREYXRhXG4gICAqIEBzdGF0aWNcbiAgICogQGZvciBEYXNoYm9hcmRcbiAgICogQHBhcmFtIHthbnl9IGl0ZW1cbiAgICogQHJldHVybiB7YW55fVxuICAgKi9cbiAgZXhwb3J0IGZ1bmN0aW9uIGNsZWFuRGFzaGJvYXJkRGF0YShpdGVtKSB7XG4gICAgdmFyIGNsZWFuSXRlbSA9IHt9O1xuICAgIGFuZ3VsYXIuZm9yRWFjaChpdGVtLCAodmFsdWUsIGtleSkgPT4ge1xuICAgICAgaWYgKCFhbmd1bGFyLmlzU3RyaW5nKGtleSkgfHwgKCFrZXkuc3RhcnRzV2l0aChcIiRcIikgJiYgIWtleS5zdGFydHNXaXRoKFwiX1wiKSkpIHtcbiAgICAgICAgY2xlYW5JdGVtW2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gY2xlYW5JdGVtO1xuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgZGVjb2RlVVJJQ29tcG9uZW50KCkgb24gZWFjaCB2YWx1ZSBpbiB0aGUgb2JqZWN0XG4gICAqIEBtZXRob2QgZGVjb2RlVVJJQ29tcG9uZW50UHJvcGVydGllc1xuICAgKiBAc3RhdGljXG4gICAqIEBmb3IgRGFzaGJvYXJkXG4gICAqIEBwYXJhbSB7YW55fSBoYXNoXG4gICAqIEByZXR1cm4ge2FueX1cbiAgICovXG4gIGV4cG9ydCBmdW5jdGlvbiBkZWNvZGVVUklDb21wb25lbnRQcm9wZXJ0aWVzKGhhc2gpIHtcbiAgICBpZiAoIWhhc2gpIHtcbiAgICAgIHJldHVybiBoYXNoO1xuICAgIH1cbiAgICB2YXIgZGVjb2RlSGFzaCA9IHt9O1xuICAgIGFuZ3VsYXIuZm9yRWFjaChoYXNoLCAodmFsdWUsIGtleSkgPT4ge1xuICAgICAgZGVjb2RlSGFzaFtrZXldID0gdmFsdWUgPyBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpIDogdmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlY29kZUhhc2g7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gb25PcGVyYXRpb25Db21wbGV0ZShyZXN1bHQpIHtcbiAgICBjb25zb2xlLmxvZyhcIkNvbXBsZXRlZCBhZGRpbmcgdGhlIGRhc2hib2FyZCB3aXRoIHJlc3BvbnNlIFwiICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0KSk7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gc2V0U3ViVGFicyh0YWI6YW55LCBidWlsZGVyLCBkYXNoYm9hcmRzOkFycmF5PERhc2hib2FyZD4sICRyb290U2NvcGUpIHtcbiAgICBpZiAoIXRhYiB8fCB0YWIuZW1iZWRkZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9IFxuICAgIGxvZy5kZWJ1ZyhcIlVwZGF0aW5nIHN1Yi10YWJzXCIpO1xuICAgIGlmICghdGFiLnRhYnMpIHtcbiAgICAgIHRhYi50YWJzID0gW107XG4gICAgfSBlbHNlIHtcbiAgICAgIHRhYi50YWJzLmxlbmd0aCA9IDA7XG4gICAgfVxuICAgIGxvZy5kZWJ1ZyhcInRhYjogXCIsIHRhYik7XG4gICAgbG9nLmRlYnVnKFwiZGFzaGJvYXJkczogXCIsIGRhc2hib2FyZHMpO1xuICAgIF8uZm9yRWFjaChkYXNoYm9hcmRzLCAoZGFzaGJvYXJkKSA9PiB7XG4gICAgICB2YXIgY2hpbGQgPSBidWlsZGVyXG4gICAgICAgIC5pZCgnZGFzaGJvYXJkLScgKyBkYXNoYm9hcmQuaWQpXG4gICAgICAgIC50aXRsZSgoKSA9PiBkYXNoYm9hcmQudGl0bGUgfHwgZGFzaGJvYXJkLmlkKVxuICAgICAgICAuaHJlZigoKSA9PiB7XG4gICAgICAgICAgdmFyIHVyaSA9IG5ldyBVUkkoVXJsSGVscGVycy5qb2luKCcvZGFzaGJvYXJkL2lkJywgZGFzaGJvYXJkLmlkKSlcbiAgICAgICAgICAgIHVyaS5zZWFyY2goe1xuICAgICAgICAgICAgICAnbWFpbi10YWInOiBwbHVnaW5OYW1lLFxuICAgICAgICAgICAgICAnc3ViLXRhYic6ICdkYXNoYm9hcmQtJyArIGRhc2hib2FyZC5pZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHVyaS50b1N0cmluZygpO1xuICAgICAgICB9KVxuICAgICAgICAuYnVpbGQoKTtcbiAgICAgIHRhYi50YWJzLnB1c2goY2hpbGQpO1xuICAgIH0pO1xuICAgIHZhciBtYW5hZ2UgPSBidWlsZGVyXG4gICAgICAuaWQoJ2Rhc2hib2FyZC1tYW5hZ2UnKVxuICAgICAgLnRpdGxlKCgpID0+ICc8aSBjbGFzcz1cImZhIGZhLXBlbmNpbFwiPjwvaT4mbmJzcDtNYW5hZ2UnKVxuICAgICAgLmhyZWYoKCkgPT4gJy9kYXNoYm9hcmQvZWRpdD9tYWluLXRhYj1kYXNoYm9hcmQmc3ViLXRhYj1kYXNoYm9hcmQtbWFuYWdlJylcbiAgICAgIC5idWlsZCgpO1xuICAgIHRhYi50YWJzLnB1c2gobWFuYWdlKTtcbiAgICB0YWIudGFicy5mb3JFYWNoKCh0YWIpID0+IHtcbiAgICAgIHRhYi5pc1NlbGVjdGVkID0gKCkgPT4ge1xuICAgICAgICB2YXIgaWQgPSB0YWIuaWQucmVwbGFjZSgnZGFzaGJvYXJkLScsICcnKTtcbiAgICAgICAgdmFyIHVyaSA9IG5ldyBVUkkoKTtcbiAgICAgICAgcmV0dXJuIHVyaS5xdWVyeSh0cnVlKVsnc3ViLXRhYiddID09PSB0YWIuaWQgfHwgXy5lbmRzV2l0aCh1cmkucGF0aCgpLCBpZCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgbG9nLmRlYnVnKFwiVXBkYXRlZCBtYWluIHRhYiB0bzogXCIsIHRhYik7XG4gICAgLy8kcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2hhd3Rpby1uYXYtcmVkcmF3Jyk7XG4gICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdoYXd0aW8tbmF2LXN1YnRhYi1yZWRyYXcnKTtcbiAgICBDb3JlLiRhcHBseSgkcm9vdFNjb3BlKTtcbiAgfVxuXG5cbiAgZXhwb3J0IGZ1bmN0aW9uIGdldER1bW15QnVpbGRlcigpIHtcbiAgICB2YXIgc2VsZiA9IHtcbiAgICAgIGlkOiAoKSA9PiBzZWxmLFxuICAgICAgZGVmYXVsdFBhZ2U6ICgpID0+IHNlbGYsXG4gICAgICByYW5rOiAoKSA9PiBzZWxmLFxuICAgICAgcmVsb2FkOiAoKSA9PiBzZWxmLFxuICAgICAgcGFnZTogKCkgPT4gc2VsZixcbiAgICAgIHRpdGxlOiAoKSA9PiBzZWxmLFxuICAgICAgdG9vbHRpcDogKCkgPT4gc2VsZixcbiAgICAgIGNvbnRleHQ6ICgpID0+IHNlbGYsXG4gICAgICBhdHRyaWJ1dGVzOiAoKSA9PiBzZWxmLFxuICAgICAgbGlua0F0dHJpYnV0ZXM6ICgpID0+IHNlbGYsXG4gICAgICBocmVmOiAoKSA9PiBzZWxmLFxuICAgICAgY2xpY2s6ICgpID0+IHNlbGYsXG4gICAgICBpc1ZhbGlkOiAoKSA9PiBzZWxmLFxuICAgICAgc2hvdzogKCkgPT4gc2VsZixcbiAgICAgIGlzU2VsZWN0ZWQ6ICgpID0+IHNlbGYsXG4gICAgICB0ZW1wbGF0ZTogKCkgPT4gc2VsZixcbiAgICAgIHRhYnM6ICgpID0+IHNlbGYsXG4gICAgICBzdWJQYXRoOiAoKSA9PiBzZWxmLFxuICAgICAgYnVpbGQ6ICgpID0+IHt9XG4gICAgfVxuICAgIHJldHVybiBzZWxmO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIGdldER1bW15QnVpbGRlckZhY3RvcnkoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNyZWF0ZTogKCkgPT4gZ2V0RHVtbXlCdWlsZGVyKCksXG4gICAgICBqb2luOiAoKSA9PiAnJyxcbiAgICAgIGNvbmZpZ3VyZVJvdXRpbmc6ICgpID0+IHt9XG4gICAgfVxuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIGdldER1bW15SGF3dGlvTmF2KCkge1xuICAgIHZhciBuYXYgPSB7XG4gICAgICBidWlsZGVyOiAoKSA9PiBnZXREdW1teUJ1aWxkZXIoKSxcbiAgICAgIGFkZDogKCkgPT4ge30sXG4gICAgICByZW1vdmU6ICgpID0+IFtdLFxuICAgICAgaXRlcmF0ZTogKCkgPT4gbnVsbCxcbiAgICAgIG9uOiAoKSA9PiB1bmRlZmluZWQsXG4gICAgICBzZWxlY3RlZDogKCkgPT4gdW5kZWZpbmVkXG4gICAgfVxuICAgIHJldHVybiBuYXY7XG4gIH1cbn1cbiIsIi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqIEBtYWluIERhc2hib2FyZFxuICovXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkSGVscGVycy50c1wiLz5cbm1vZHVsZSBEYXNoYm9hcmQge1xuICBcbiAgZXhwb3J0IHZhciBfbW9kdWxlID0gYW5ndWxhci5tb2R1bGUocGx1Z2luTmFtZSwgW10pO1xuXG4gIF9tb2R1bGUuY29uZmlnKFtcIiRyb3V0ZVByb3ZpZGVyXCIsIFwiJHByb3ZpZGVcIiwgKCRyb3V0ZVByb3ZpZGVyLCAkcHJvdmlkZSkgPT4ge1xuXG4gICAgJHByb3ZpZGUuZGVjb3JhdG9yKCdIYXd0aW9EYXNoYm9hcmQnLCBbJyRkZWxlZ2F0ZScsICgkZGVsZWdhdGUpID0+IHtcbiAgICAgICRkZWxlZ2F0ZVsnaGFzRGFzaGJvYXJkJ10gPSB0cnVlO1xuICAgICAgJGRlbGVnYXRlWydnZXRBZGRMaW5rJ10gPSAodGl0bGU/OnN0cmluZywgc2l6ZV94PzpudW1iZXIsIHNpemVfeT86bnVtYmVyKSA9PiB7XG4gICAgICAgIHZhciB0YXJnZXQgPSBuZXcgVVJJKCcvZGFzaGJvYXJkL2FkZCcpO1xuICAgICAgICB2YXIgY3VycmVudFVyaSA9IG5ldyBVUkkoKTtcbiAgICAgICAgLypcbiAgICAgICAgY3VycmVudFVyaS5yZW1vdmVRdWVyeSgnbWFpbi10YWInKTtcbiAgICAgICAgY3VycmVudFVyaS5yZW1vdmVRdWVyeSgnc3ViLXRhYicpO1xuICAgICAgICAqL1xuICAgICAgICB2YXIgd2lkZ2V0VXJpID0gbmV3IFVSSShjdXJyZW50VXJpLnBhdGgoKSk7XG4gICAgICAgIHdpZGdldFVyaS5xdWVyeShjdXJyZW50VXJpLnF1ZXJ5KHRydWUpKTtcbiAgICAgICAgdGFyZ2V0LnF1ZXJ5KChxdWVyeSkgPT4ge1xuICAgICAgICAgIHF1ZXJ5LmhyZWYgPSBVUkkuZW5jb2RlUmVzZXJ2ZWQod2lkZ2V0VXJpLnRvU3RyaW5nKCkpXG4gICAgICAgICAgaWYgKHRpdGxlKSB7XG4gICAgICAgICAgICBxdWVyeS50aXRsZSA9IFVSSS5lbmNvZGVSZXNlcnZlZCh0aXRsZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzaXplX3ggJiYgc2l6ZV95KSB7XG4gICAgICAgICAgICBxdWVyeS5zaXplID0gVVJJLmVuY29kZVJlc2VydmVkKGFuZ3VsYXIudG9Kc29uKHtzaXplX3g6IHNpemVfeCwgc2l6ZV95OiBzaXplX3l9KSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRhcmdldC50b1N0cmluZygpO1xuICAgICAgfVxuICAgICAgcmV0dXJuICRkZWxlZ2F0ZTtcbiAgICB9XSk7XG5cbiAgICAkcm91dGVQcm92aWRlci5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvYWRkJywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2FkZFRvRGFzaGJvYXJkLmh0bWwnfSkuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2VkaXQnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnZWRpdERhc2hib2FyZHMuaHRtbCd9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvaWR4LzpkYXNoYm9hcmRJbmRleCcsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdkYXNoYm9hcmQuaHRtbCcsIHJlbG9hZE9uU2VhcmNoOiBmYWxzZSB9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvaWQvOmRhc2hib2FyZElkJywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2Rhc2hib2FyZC5odG1sJywgcmVsb2FkT25TZWFyY2g6IGZhbHNlIH0pLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9pZC86ZGFzaGJvYXJkSWQvc2hhcmUnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnc2hhcmUuaHRtbCd9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvaW1wb3J0Jywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2ltcG9ydC5odG1sJ30pO1xuICB9XSk7XG5cbiAgX21vZHVsZS52YWx1ZSgndWkuY29uZmlnJywge1xuICAgIC8vIFRoZSB1aS1qcSBkaXJlY3RpdmUgbmFtZXNwYWNlXG4gICAganE6IHtcbiAgICAgIGdyaWRzdGVyOiB7XG4gICAgICAgIHdpZGdldF9tYXJnaW5zOiBbMTAsIDEwXSxcbiAgICAgICAgd2lkZ2V0X2Jhc2VfZGltZW5zaW9uczogWzE0MCwgMTQwXVxuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgX21vZHVsZS5mYWN0b3J5KCdIYXd0aW9EYXNoYm9hcmRUYWInLCBbJ0hhd3Rpb05hdicsICdIYXd0aW9EYXNoYm9hcmQnLCAnJHRpbWVvdXQnLCAnJHJvb3RTY29wZScsICdkYXNoYm9hcmRSZXBvc2l0b3J5JywgJyRsb2NhdGlvbicsIChuYXY6SGF3dGlvTWFpbk5hdi5SZWdpc3RyeSwgZGFzaDpEYXNoYm9hcmRTZXJ2aWNlLCAkdGltZW91dCwgJHJvb3RTY29wZSwgZGFzaGJvYXJkczpEYXNoYm9hcmRSZXBvc2l0b3J5LCAkbG9jYXRpb24pID0+IHtcbiAgICB2YXIgdGFiID0gPGFueT4ge1xuICAgICAgZW1iZWRkZWQ6IHRydWVcbiAgICB9O1xuICAgIGlmIChkYXNoLmluRGFzaGJvYXJkKSB7XG4gICAgICBsb2cuZGVidWcoXCJFbWJlZGRlZCBpbiBhIGRhc2hib2FyZCwgbm90IGluaXRpYWxpemluZyBvdXIgbmF2aWdhdGlvbiB0YWJcIik7XG4gICAgICByZXR1cm4gdGFiO1xuICAgIH1cbiAgICAvLyBzcGVjaWFsIGNhc2UgaGVyZSwgd2UgZG9uJ3Qgd2FudCB0byBvdmVyd3JpdGUgb3VyIHN0b3JlZCB0YWIhXG4gICAgdmFyIGJ1aWxkZXIgPSBuYXYuYnVpbGRlcigpO1xuICAgIHRhYiA9IGJ1aWxkZXIuaWQocGx1Z2luTmFtZSlcbiAgICAgICAgICAgICAgICAgIC5ocmVmKCgpID0+ICcvZGFzaGJvYXJkL2lkeC8wJylcbiAgICAgICAgICAgICAgICAgIC5pc1NlbGVjdGVkKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF8uc3RhcnRzV2l0aCgkbG9jYXRpb24ucGF0aCgpLCAnL2Rhc2hib2FyZC8nKTtcbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAudGl0bGUoKCkgPT4gJ0Rhc2hib2FyZCcpXG4gICAgICAgICAgICAgICAgICAuYnVpbGQoKTtcbiAgICBuYXYuYWRkKHRhYik7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBsb2cuZGVidWcoXCJTZXR0aW5nIHVwIGRhc2hib2FyZCBzdWItdGFic1wiKTtcbiAgICAgIGRhc2hib2FyZHMuZ2V0RGFzaGJvYXJkcygoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICBzZXRTdWJUYWJzKHRhYiwgYnVpbGRlciwgZGFzaGJvYXJkcywgJHJvb3RTY29wZSk7XG4gICAgICB9KTtcbiAgICB9LCA1MDApO1xuICAgIGxvZy5kZWJ1ZyhcIk5vdCBlbWJlZGRlZCBpbiBhIGRhc2hib2FyZCwgcmV0dXJuaW5nIHByb3BlciB0YWJcIik7XG4gICAgcmV0dXJuIHRhYjtcbiAgfV0pO1xuXG4gIF9tb2R1bGUucnVuKFtcIkhhd3Rpb0Rhc2hib2FyZFRhYlwiLCAoSGF3dGlvRGFzaGJvYXJkVGFiKSA9PiB7XG4gICAgbG9nLmRlYnVnKFwicnVubmluZ1wiKTtcbiAgfV0pO1xuXG4gIGhhd3Rpb1BsdWdpbkxvYWRlci5hZGRNb2R1bGUocGx1Z2luTmFtZSk7XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZEludGVyZmFjZXMudHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuXG4gIF9tb2R1bGUuZmFjdG9yeSgnZGFzaGJvYXJkUmVwb3NpdG9yeScsIFsnRGVmYXVsdERhc2hib2FyZHMnLCAoZGVmYXVsdHM6RGVmYXVsdERhc2hib2FyZHMpID0+IHtcbiAgICByZXR1cm4gbmV3IExvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeShkZWZhdWx0cyk7XG4gIH1dKTtcblxuICBfbW9kdWxlLmZhY3RvcnkoJ0RlZmF1bHREYXNoYm9hcmRzJywgWygpID0+IHtcbiAgICB2YXIgZGVmYXVsdHMgPSA8QXJyYXk8RGFzaGJvYXJkPj5bXTtcbiAgICB2YXIgYW5zd2VyID0ge1xuICAgICAgYWRkOiAoZGFzaGJvYXJkOkRhc2hib2FyZCkgPT4ge1xuICAgICAgICBkZWZhdWx0cy5wdXNoKGRhc2hib2FyZCk7XG4gICAgICB9LFxuICAgICAgcmVtb3ZlOiAoaWQ6c3RyaW5nKSA9PiB7XG4gICAgICAgIHJldHVybiBfLnJlbW92ZShkZWZhdWx0cywgKGRhc2hib2FyZCkgPT4gZGFzaGJvYXJkLmlkID09PSBpZCk7XG4gICAgICB9LFxuICAgICAgZ2V0QWxsOiAoKSA9PiBkZWZhdWx0c1xuICAgIH1cbiAgICByZXR1cm4gYW5zd2VyO1xuICB9XSk7XG5cbiAgLyoqXG4gICAqIEBjbGFzcyBMb2NhbERhc2hib2FyZFJlcG9zaXRvcnlcbiAgICogQHVzZXMgRGFzaGJvYXJkUmVwb3NpdG9yeVxuICAgKi9cbiAgZXhwb3J0IGNsYXNzIExvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeSBpbXBsZW1lbnRzIERhc2hib2FyZFJlcG9zaXRvcnkge1xuXG4gICAgcHJpdmF0ZSBsb2NhbFN0b3JhZ2U6V2luZG93TG9jYWxTdG9yYWdlID0gbnVsbDtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZGVmYXVsdHM6RGVmYXVsdERhc2hib2FyZHMpIHtcbiAgICAgIHRoaXMubG9jYWxTdG9yYWdlID0gQ29yZS5nZXRMb2NhbFN0b3JhZ2UoKTtcbiAgICAgIC8qXG4gICAgICBpZiAoJ3VzZXJEYXNoYm9hcmRzJyBpbiB0aGlzLmxvY2FsU3RvcmFnZSkge1xuICAgICAgICBsb2cuZGVidWcoXCJGb3VuZCBwcmV2aW91c2x5IHNhdmVkIGRhc2hib2FyZHNcIik7XG4gICAgICAgIGlmICh0aGlzLmxvYWREYXNoYm9hcmRzKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgdGhpcy5zdG9yZURhc2hib2FyZHMoZGVmYXVsdHMuZ2V0QWxsKCkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnN0b3JlRGFzaGJvYXJkcyhkZWZhdWx0cy5nZXRBbGwoKSk7XG4gICAgICB9XG4gICAgICAqL1xuICAgIH1cblxuICAgIHByaXZhdGUgbG9hZERhc2hib2FyZHMoKSB7XG4gICAgICB2YXIgYW5zd2VyID0gYW5ndWxhci5mcm9tSnNvbihsb2NhbFN0b3JhZ2VbJ3VzZXJEYXNoYm9hcmRzJ10pO1xuICAgICAgaWYgKCFhbnN3ZXIgfHwgYW5zd2VyLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBhbnN3ZXIgPSB0aGlzLmRlZmF1bHRzLmdldEFsbCgpO1xuICAgICAgfVxuICAgICAgbG9nLmRlYnVnKFwicmV0dXJuaW5nIGRhc2hib2FyZHM6IFwiLCBhbnN3ZXIpO1xuICAgICAgcmV0dXJuIGFuc3dlcjtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN0b3JlRGFzaGJvYXJkcyhkYXNoYm9hcmRzOmFueVtdKSB7XG4gICAgICBsb2cuZGVidWcoXCJzdG9yaW5nIGRhc2hib2FyZHM6IFwiLCBkYXNoYm9hcmRzKTtcbiAgICAgIGxvY2FsU3RvcmFnZVsndXNlckRhc2hib2FyZHMnXSA9IGFuZ3VsYXIudG9Kc29uKGRhc2hib2FyZHMpO1xuICAgICAgcmV0dXJuIHRoaXMubG9hZERhc2hib2FyZHMoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcHV0RGFzaGJvYXJkcyhhcnJheTphbnlbXSwgY29tbWl0TWVzc2FnZTpzdHJpbmcsIGZuKSB7XG4gICAgICB2YXIgZGFzaGJvYXJkcyA9IHRoaXMubG9hZERhc2hib2FyZHMoKTtcbiAgICAgIGFycmF5LmZvckVhY2goKGRhc2gpID0+IHtcbiAgICAgICAgdmFyIGV4aXN0aW5nID0gZGFzaGJvYXJkcy5maW5kSW5kZXgoKGQpID0+IHsgcmV0dXJuIGQuaWQgPT09IGRhc2guaWQ7IH0pO1xuICAgICAgICBpZiAoZXhpc3RpbmcgPj0gMCkge1xuICAgICAgICAgIGRhc2hib2FyZHNbZXhpc3RpbmddID0gZGFzaDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXNoYm9hcmRzLnB1c2goZGFzaCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZm4odGhpcy5zdG9yZURhc2hib2FyZHMoZGFzaGJvYXJkcykpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZWxldGVEYXNoYm9hcmRzKGFycmF5OmFueVtdLCBmbikge1xuICAgICAgdmFyIGRhc2hib2FyZHMgPSB0aGlzLmxvYWREYXNoYm9hcmRzKCk7XG4gICAgICBhbmd1bGFyLmZvckVhY2goYXJyYXksIChpdGVtKSA9PiB7XG4gICAgICAgIGRhc2hib2FyZHMucmVtb3ZlKChpKSA9PiB7IHJldHVybiBpLmlkID09PSBpdGVtLmlkOyB9KTtcbiAgICAgIH0pO1xuICAgICAgZm4odGhpcy5zdG9yZURhc2hib2FyZHMoZGFzaGJvYXJkcykpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXREYXNoYm9hcmRzKGZuKSB7XG4gICAgICBmbih0aGlzLmxvYWREYXNoYm9hcmRzKCkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXREYXNoYm9hcmQoaWQ6c3RyaW5nLCBmbikge1xuICAgICAgdmFyIGRhc2hib2FyZHMgPSB0aGlzLmxvYWREYXNoYm9hcmRzKCk7XG4gICAgICB2YXIgZGFzaGJvYXJkID0gZGFzaGJvYXJkcy5maW5kKChkYXNoYm9hcmQpID0+IHsgcmV0dXJuIGRhc2hib2FyZC5pZCA9PT0gaWQgfSk7XG4gICAgICBmbihkYXNoYm9hcmQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGVEYXNoYm9hcmQob3B0aW9uczphbnkpIHtcbiAgICAgIHZhciBhbnN3ZXIgPXtcbiAgICAgICAgdGl0bGU6IFwiTmV3IERhc2hib2FyZFwiLFxuICAgICAgICBncm91cDogXCJQZXJzb25hbFwiLFxuICAgICAgICB3aWRnZXRzOiBbXVxuICAgICAgfTtcbiAgICAgIGFuc3dlciA9IGFuZ3VsYXIuZXh0ZW5kKGFuc3dlciwgb3B0aW9ucyk7XG4gICAgICBhbnN3ZXJbJ2lkJ10gPSBDb3JlLmdldFVVSUQoKTtcbiAgICAgIHJldHVybiBhbnN3ZXI7XG4gICAgfVxuXG4gICAgcHVibGljIGNsb25lRGFzaGJvYXJkKGRhc2hib2FyZDphbnkpIHtcbiAgICAgIHZhciBuZXdEYXNoYm9hcmQgPSBfLmNsb25lKGRhc2hib2FyZCk7XG4gICAgICBuZXdEYXNoYm9hcmRbJ2lkJ10gPSBDb3JlLmdldFVVSUQoKTtcbiAgICAgIG5ld0Rhc2hib2FyZFsndGl0bGUnXSA9IFwiQ29weSBvZiBcIiArIGRhc2hib2FyZC50aXRsZTtcbiAgICAgIHJldHVybiBuZXdEYXNoYm9hcmQ7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFR5cGUoKSB7XG4gICAgICByZXR1cm4gJ2NvbnRhaW5lcic7XG4gICAgfVxuICB9XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuXG4gIF9tb2R1bGUuY29udHJvbGxlcihcIkRhc2hib2FyZC5FZGl0RGFzaGJvYXJkc0NvbnRyb2xsZXJcIiwgW1wiJHNjb3BlXCIsIFwiJHJvdXRlUGFyYW1zXCIsIFwiJHJvdXRlXCIsIFwiJGxvY2F0aW9uXCIsIFwiJHJvb3RTY29wZVwiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgXCJIYXd0aW9OYXZcIiwgXCIkdGltZW91dFwiLCBcIiR0ZW1wbGF0ZUNhY2hlXCIsIFwiJG1vZGFsXCIsIFwiSGF3dGlvRGFzaGJvYXJkVGFiXCIsICgkc2NvcGUsICRyb3V0ZVBhcmFtcywgJHJvdXRlLCAkbG9jYXRpb24sICRyb290U2NvcGUsIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSwgbmF2LCAkdGltZW91dCwgJHRlbXBsYXRlQ2FjaGUsICRtb2RhbCwgdGFiKSA9PiB7XG5cbiAgICAkc2NvcGUuX2Rhc2hib2FyZHMgPSBbXTtcblxuICAgICRyb290U2NvcGUuJG9uKCdkYXNoYm9hcmRzVXBkYXRlZCcsIGRhc2hib2FyZExvYWRlZCk7XG5cbiAgICAkc2NvcGUuaGFzVXJsID0gKCkgPT4ge1xuICAgICAgcmV0dXJuICgkc2NvcGUudXJsKSA/IHRydWUgOiBmYWxzZTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmhhc1NlbGVjdGlvbiA9ICgpID0+IHtcbiAgICAgIHJldHVybiAkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcy5sZW5ndGggIT09IDA7XG4gICAgfTtcblxuICAgICRzY29wZS5ncmlkT3B0aW9ucyA9IHtcbiAgICAgIHNlbGVjdGVkSXRlbXM6IFtdLFxuICAgICAgc2hvd0ZpbHRlcjogZmFsc2UsXG4gICAgICBzaG93Q29sdW1uTWVudTogZmFsc2UsXG4gICAgICBmaWx0ZXJPcHRpb25zOiB7XG4gICAgICAgIGZpbHRlclRleHQ6ICcnXG4gICAgICB9LFxuICAgICAgZGF0YTogJ19kYXNoYm9hcmRzJyxcbiAgICAgIHNlbGVjdFdpdGhDaGVja2JveE9ubHk6IHRydWUsXG4gICAgICBzaG93U2VsZWN0aW9uQ2hlY2tib3g6IHRydWUsXG4gICAgICBjb2x1bW5EZWZzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBmaWVsZDogJ3RpdGxlJyxcbiAgICAgICAgICBkaXNwbGF5TmFtZTogJ0Rhc2hib2FyZCcsXG4gICAgICAgICAgY2VsbFRlbXBsYXRlOiAkdGVtcGxhdGVDYWNoZS5nZXQoVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ2VkaXREYXNoYm9hcmRUaXRsZUNlbGwuaHRtbCcpKVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZmllbGQ6ICdncm91cCcsXG4gICAgICAgICAgZGlzcGxheU5hbWU6ICdHcm91cCdcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICB9O1xuXG4gICAgdmFyIGRvVXBkYXRlID0gXy5kZWJvdW5jZSh1cGRhdGVEYXRhLCAxMCk7XG5cbiAgICAvLyBoZWxwZXJzIHNvIHdlIGNhbiBlbmFibGUvZGlzYWJsZSBwYXJ0cyBvZiB0aGUgVUkgZGVwZW5kaW5nIG9uIGhvd1xuICAgIC8vIGRhc2hib2FyZCBkYXRhIGlzIHN0b3JlZFxuICAgIC8qXG4gICAgJHNjb3BlLnVzaW5nR2l0ID0gKCkgPT4ge1xuICAgICAgcmV0dXJuIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0VHlwZSgpID09PSAnZ2l0JztcbiAgICB9O1xuXG4gICAgJHNjb3BlLnVzaW5nRmFicmljID0gKCkgPT4ge1xuICAgICAgcmV0dXJuIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0VHlwZSgpID09PSAnZmFicmljJztcbiAgICB9O1xuXG4gICAgJHNjb3BlLnVzaW5nTG9jYWwgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlKCkgPT09ICdjb250YWluZXInO1xuICAgIH07XG5cbiAgICBpZiAoJHNjb3BlLnVzaW5nRmFicmljKCkpIHtcbiAgICAgICRzY29wZS5ncmlkT3B0aW9ucy5jb2x1bW5EZWZzLmFkZChbe1xuICAgICAgICBmaWVsZDogJ3ZlcnNpb25JZCcsXG4gICAgICAgIGRpc3BsYXlOYW1lOiAnVmVyc2lvbidcbiAgICAgIH0sIHtcbiAgICAgICAgZmllbGQ6ICdwcm9maWxlSWQnLFxuICAgICAgICBkaXNwbGF5TmFtZTogJ1Byb2ZpbGUnXG4gICAgICB9LCB7XG4gICAgICAgIGZpZWxkOiAnZmlsZU5hbWUnLFxuICAgICAgICBkaXNwbGF5TmFtZTogJ0ZpbGUgTmFtZSdcbiAgICAgIH1dKTtcbiAgICB9XG4gICAgKi9cblxuICAgICR0aW1lb3V0KGRvVXBkYXRlLCAxMCk7XG5cbiAgICAkc2NvcGUuJG9uKFwiJHJvdXRlQ2hhbmdlU3VjY2Vzc1wiLCBmdW5jdGlvbiAoZXZlbnQsIGN1cnJlbnQsIHByZXZpb3VzKSB7XG4gICAgICAvLyBsZXRzIGRvIHRoaXMgYXN5bmNocm9ub3VzbHkgdG8gYXZvaWQgRXJyb3I6ICRkaWdlc3QgYWxyZWFkeSBpbiBwcm9ncmVzc1xuICAgICAgJHRpbWVvdXQoZG9VcGRhdGUsIDEwKTtcbiAgICB9KTtcblxuICAgICRzY29wZS5hZGRWaWV3VG9EYXNoYm9hcmQgPSAoKSA9PiB7XG4gICAgICB2YXIgbmV4dEhyZWYgPSBudWxsO1xuICAgICAgdmFyIHNlbGVjdGVkID0gJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXM7XG4gICAgICB2YXIgY3VycmVudFVybCA9IG5ldyBVUkkoKTtcbiAgICAgIHZhciBjb25maWcgPSBjdXJyZW50VXJsLnF1ZXJ5KHRydWUpO1xuICAgICAgdmFyIGhyZWYgPSBjb25maWdbJ2hyZWYnXTtcbiAgICAgIHZhciBpZnJhbWUgPSBjb25maWdbJ2lmcmFtZSddO1xuICAgICAgdmFyIHR5cGUgPSAnaHJlZic7XG4gICAgICBpZiAoaHJlZikge1xuICAgICAgICBocmVmID0gVVJJLmRlY29kZShocmVmKTtcbiAgICAgICAgaHJlZiA9IENvcmUudHJpbUxlYWRpbmcoaHJlZiwgJyMnKTtcbiAgICAgIH0gZWxzZSBpZiAoaWZyYW1lKSB7XG4gICAgICAgIGlmcmFtZSA9IGlmcmFtZS51bmVzY2FwZVVSTCgpO1xuICAgICAgICB0eXBlID0gJ2lmcmFtZSc7XG4gICAgICB9XG4gICAgICB2YXIgd2lkZ2V0VVJJID0gPGFueT4gdW5kZWZpbmVkO1xuICAgICAgc3dpdGNoKHR5cGUpIHtcbiAgICAgICAgY2FzZSAnaHJlZic6XG4gICAgICAgICAgbG9nLmRlYnVnKFwiaHJlZjogXCIsIGhyZWYpO1xuICAgICAgICAgIHdpZGdldFVSSSA9IG5ldyBVUkkoaHJlZik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2lmcmFtZSc6XG4gICAgICAgICAgbG9nLmRlYnVnKFwiaWZyYW1lOiBcIiwgaWZyYW1lKTtcbiAgICAgICAgICB3aWRnZXRVUkkgPSBuZXcgVVJJKGlmcmFtZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgbG9nLmRlYnVnKFwidHlwZSB1bmtub3duXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBzaXplU3RyID0gPGFueT4gY29uZmlnWydzaXplJ107XG4gICAgICBpZiAoc2l6ZVN0cikge1xuICAgICAgICBzaXplU3RyID0gc2l6ZVN0ci51bmVzY2FwZVVSTCgpO1xuICAgICAgfVxuICAgICAgdmFyIHNpemUgPSBhbmd1bGFyLmZyb21Kc29uKHNpemVTdHIpIHx8IHsgc2l6ZV94OiAxLCBzaXplX3k6IDEgfTtcbiAgICAgIHZhciB0aXRsZSA9IChjb25maWdbJ3RpdGxlJ10gfHwgJycpLnVuZXNjYXBlVVJMKCk7XG4gICAgICB2YXIgdGVtcGxhdGVXaWRnZXQgPSB7XG4gICAgICAgIGlkOiBDb3JlLmdldFVVSUQoKSxcbiAgICAgICAgcm93OiAxLFxuICAgICAgICBjb2w6IDEsXG4gICAgICAgIHNpemVfeDogc2l6ZS5zaXplX3gsXG4gICAgICAgIHNpemVfeTogc2l6ZS5zaXplX3ksXG4gICAgICAgIHRpdGxlOiB0aXRsZVxuICAgICAgfVxuICAgICAgYW5ndWxhci5mb3JFYWNoKHNlbGVjdGVkLCAoc2VsZWN0ZWRJdGVtKSA9PiB7XG5cbiAgICAgICAgdmFyIHdpZGdldCA9IF8uY2xvbmVEZWVwKHRlbXBsYXRlV2lkZ2V0KTtcblxuICAgICAgICBpZiAoIXNlbGVjdGVkSXRlbS53aWRnZXRzKSB7XG4gICAgICAgICAgc2VsZWN0ZWRJdGVtLndpZGdldHMgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgIGNhc2UgJ2lmcmFtZSc6IFxuICAgICAgICAgICAgd2lkZ2V0ID0gPGFueT5fLmV4dGVuZCh7XG4gICAgICAgICAgICAgIGlmcmFtZTogaWZyYW1lXG4gICAgICAgICAgICB9LCB3aWRnZXQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnaHJlZic6XG4gICAgICAgICAgICB2YXIgdGV4dCA9IHdpZGdldFVSSS5wYXRoKCk7XG4gICAgICAgICAgICB2YXIgc2VhcmNoID0gd2lkZ2V0VVJJLnF1ZXJ5KHRydWUpO1xuICAgICAgICAgICAgaWYgKCRyb3V0ZSAmJiAkcm91dGUucm91dGVzKSB7XG4gICAgICAgICAgICAgIHZhciB2YWx1ZSA9ICRyb3V0ZS5yb3V0ZXNbdGV4dF07XG4gICAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZVVybCA9IHZhbHVlW1widGVtcGxhdGVVcmxcIl07XG4gICAgICAgICAgICAgICAgaWYgKHRlbXBsYXRlVXJsKSB7XG4gICAgICAgICAgICAgICAgICB3aWRnZXQgPSA8YW55PiBfLmV4dGVuZCh7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IHRleHQsXG4gICAgICAgICAgICAgICAgICAgIGluY2x1ZGU6IHRlbXBsYXRlVXJsLFxuICAgICAgICAgICAgICAgICAgICBzZWFyY2g6IHNlYXJjaCxcbiAgICAgICAgICAgICAgICAgICAgaGFzaDogXCJcIlxuICAgICAgICAgICAgICAgICAgfSwgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETyB3ZSBuZWVkIHRvIGJlIGFibGUgdG8gbWF0Y2ggVVJJIHRlbXBsYXRlcy4uLlxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZmlndXJlIG91dCB0aGUgd2lkdGggb2YgdGhlIGRhc2hcbiAgICAgICAgdmFyIGdyaWRXaWR0aCA9IDA7XG5cbiAgICAgICAgc2VsZWN0ZWRJdGVtLndpZGdldHMuZm9yRWFjaCgodykgPT4ge1xuICAgICAgICAgIHZhciByaWdodFNpZGUgPSB3LmNvbCArIHcuc2l6ZV94O1xuICAgICAgICAgIGlmIChyaWdodFNpZGUgPiBncmlkV2lkdGgpIHtcbiAgICAgICAgICAgIGdyaWRXaWR0aCA9IHJpZ2h0U2lkZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuXG4gICAgICAgIHZhciBsZWZ0ID0gKHcpID0+IHtcbiAgICAgICAgICByZXR1cm4gdy5jb2w7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHJpZ2h0ID0gKHcpICA9PiB7XG4gICAgICAgICAgcmV0dXJuIHcuY29sICsgdy5zaXplX3ggLSAxO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciB0b3AgPSAodykgPT4ge1xuICAgICAgICAgIHJldHVybiB3LnJvdztcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgYm90dG9tID0gKHcpID0+IHtcbiAgICAgICAgICByZXR1cm4gdy5yb3cgKyB3LnNpemVfeSAtIDE7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGNvbGxpc2lvbiA9ICh3MSwgdzIpID0+IHtcbiAgICAgICAgICByZXR1cm4gISggbGVmdCh3MikgPiByaWdodCh3MSkgfHxcbiAgICAgICAgICAgICAgcmlnaHQodzIpIDwgbGVmdCh3MSkgfHxcbiAgICAgICAgICAgICAgdG9wKHcyKSA+IGJvdHRvbSh3MSkgfHxcbiAgICAgICAgICAgICAgYm90dG9tKHcyKSA8IHRvcCh3MSkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5pc0VtcHR5KCkpIHtcbiAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB3aGlsZSAoIWZvdW5kKSB7XG4gICAgICAgICAgd2lkZ2V0LmNvbCA9IDE7XG4gICAgICAgICAgaWYgKHdpZGdldC5jb2wgKyB3aWRnZXQuc2l6ZV94ID4gZ3JpZFdpZHRoKSB7XG4gICAgICAgICAgICAvLyBsZXQncyBub3QgbG9vayBmb3IgYSBwbGFjZSBuZXh0IHRvIGV4aXN0aW5nIHdpZGdldFxuICAgICAgICAgICAgc2VsZWN0ZWRJdGVtLndpZGdldHMuZm9yRWFjaChmdW5jdGlvbih3LCBpZHgpIHtcbiAgICAgICAgICAgICAgaWYgKHdpZGdldC5yb3cgPD0gdy5yb3cpIHtcbiAgICAgICAgICAgICAgICB3aWRnZXQucm93Kys7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKDsgKHdpZGdldC5jb2wgKyB3aWRnZXQuc2l6ZV94KSA8PSBncmlkV2lkdGg7IHdpZGdldC5jb2wrKykge1xuICAgICAgICAgICAgaWYgKCFzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5hbnkoKHcpID0+IHtcbiAgICAgICAgICAgICAgdmFyIGMgPSBjb2xsaXNpb24odywgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgcmV0dXJuIGNcbiAgICAgICAgICAgIH0pKSB7XG4gICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgIHdpZGdldC5yb3cgPSB3aWRnZXQucm93ICsgMVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBqdXN0IGluIGNhc2UsIGtlZXAgdGhlIHNjcmlwdCBmcm9tIHJ1bm5pbmcgYXdheS4uLlxuICAgICAgICAgIGlmICh3aWRnZXQucm93ID4gNTApIHtcbiAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoJHNjb3BlLnJvdXRlUGFyYW1zKSB7XG4gICAgICAgICAgd2lkZ2V0Wydyb3V0ZVBhcmFtcyddID0gJHNjb3BlLnJvdXRlUGFyYW1zO1xuICAgICAgICB9XG4gICAgICAgIHNlbGVjdGVkSXRlbS53aWRnZXRzLnB1c2god2lkZ2V0KTtcbiAgICAgICAgaWYgKCFuZXh0SHJlZiAmJiBzZWxlY3RlZEl0ZW0uaWQpIHtcbiAgICAgICAgICBuZXh0SHJlZiA9IG5ldyBVUkkoKS5wYXRoKFwiL2Rhc2hib2FyZC9pZC9cIiArIHNlbGVjdGVkSXRlbS5pZCkucXVlcnkoe1xuICAgICAgICAgICAgJ21haW4tdGFiJzogJ2Rhc2hib2FyZCcsXG4gICAgICAgICAgICAnc3ViLXRhYic6ICdkYXNoYm9hcmQtJyArIHNlbGVjdGVkSXRlbS5pZFxuICAgICAgICAgIH0pLnJlbW92ZVF1ZXJ5KCdocmVmJylcbiAgICAgICAgICAgIC5yZW1vdmVRdWVyeSgndGl0bGUnKVxuICAgICAgICAgICAgLnJlbW92ZVF1ZXJ5KCdpZnJhbWUnKVxuICAgICAgICAgICAgLnJlbW92ZVF1ZXJ5KCdzaXplJyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBub3cgbGV0cyB1cGRhdGUgdGhlIGFjdHVhbCBkYXNoYm9hcmQgY29uZmlnXG4gICAgICB2YXIgY29tbWl0TWVzc2FnZSA9IFwiQWRkIHdpZGdldFwiO1xuICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKHNlbGVjdGVkLCBjb21taXRNZXNzYWdlLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAvKlxuICAgICAgICBsb2cuZGVidWcoXCJQdXQgZGFzaGJvYXJkczogXCIsIGRhc2hib2FyZHMpO1xuICAgICAgICBsb2cuZGVidWcoXCJOZXh0IGhyZWY6IFwiLCBuZXh0SHJlZi50b1N0cmluZygpKTtcbiAgICAgICAgKi9cbiAgICAgICAgaWYgKG5leHRIcmVmKSB7XG4gICAgICAgICAgJGxvY2F0aW9uLnBhdGgobmV4dEhyZWYucGF0aCgpKS5zZWFyY2gobmV4dEhyZWYucXVlcnkodHJ1ZSkpO1xuICAgICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgfTtcblxuICAgICRzY29wZS5jcmVhdGUgPSAoKSA9PiB7XG5cbiAgICAgIHZhciBjb3VudGVyID0gZGFzaGJvYXJkcygpLmxlbmd0aCArIDE7XG4gICAgICB2YXIgdGl0bGUgPSBcIlVudGl0bGVkXCIgKyBjb3VudGVyO1xuXG4gICAgICB2YXIgbW9kYWwgPSAkbW9kYWwub3Blbih7XG4gICAgICAgIHRlbXBsYXRlVXJsOiBVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAnY3JlYXRlRGFzaGJvYXJkTW9kYWwuaHRtbCcpLFxuICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICckbW9kYWxJbnN0YW5jZScsICgkc2NvcGUsICRtb2RhbEluc3RhbmNlKSA9PiB7XG4gICAgICAgICAgJHNjb3BlLmVudGl0eSA9IHtcbiAgICAgICAgICAgIHRpdGxlOiB0aXRsZVxuICAgICAgICAgIH1cbiAgICAgICAgICAkc2NvcGUuY29uZmlnID0ge1xuICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAndGl0bGUnOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgICRzY29wZS5vayA9ICgpID0+IHtcbiAgICAgICAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgICB2YXIgdGl0bGUgPSAkc2NvcGUuZW50aXR5LnRpdGxlXG4gICAgICAgICAgICB2YXIgbmV3RGFzaCA9IGRhc2hib2FyZFJlcG9zaXRvcnkuY3JlYXRlRGFzaGJvYXJkKHsgdGl0bGU6IHRpdGxlIH0pO1xuICAgICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKFtuZXdEYXNoXSwgXCJDcmVhdGVkIG5ldyBkYXNoYm9hcmQ6IFwiICsgdGl0bGUsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgICAgICAgIC8vIGxldCdzIGp1c3QgYmUgc2FmZSBhbmQgZW5zdXJlIHRoZXJlJ3Mgbm8gc2VsZWN0aW9uc1xuICAgICAgICAgICAgICBkZXNlbGVjdEFsbCgpO1xuICAgICAgICAgICAgICBzZXRTdWJUYWJzKHRhYiwgbmF2LmJ1aWxkZXIoKSwgZGFzaGJvYXJkcywgJHJvb3RTY29wZSk7XG4gICAgICAgICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgbW9kYWwuZGlzbWlzcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfV1cbiAgICAgIH0pO1xuICAgICAgLypcbiAgICAgIHZhciBjb3VudGVyID0gZGFzaGJvYXJkcygpLmxlbmd0aCArIDE7XG4gICAgICB2YXIgdGl0bGUgPSBcIlVudGl0bGVkXCIgKyBjb3VudGVyO1xuICAgICAgdmFyIG5ld0Rhc2ggPSBkYXNoYm9hcmRSZXBvc2l0b3J5LmNyZWF0ZURhc2hib2FyZCh7dGl0bGU6IHRpdGxlfSk7XG5cbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbbmV3RGFzaF0sIFwiQ3JlYXRlZCBuZXcgZGFzaGJvYXJkOiBcIiArIHRpdGxlLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAvLyBsZXQncyBqdXN0IGJlIHNhZmUgYW5kIGVuc3VyZSB0aGVyZSdzIG5vIHNlbGVjdGlvbnNcbiAgICAgICAgZGVzZWxlY3RBbGwoKTtcbiAgICAgICAgc2V0U3ViVGFicyhuYXYuYnVpbGRlcigpLCBkYXNoYm9hcmRzLCAkcm9vdFNjb3BlKTtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG4gICAgICAqL1xuXG4gICAgfTtcblxuICAgICRzY29wZS5kdXBsaWNhdGUgPSAoKSA9PiB7XG4gICAgICB2YXIgbmV3RGFzaGJvYXJkcyA9IFtdO1xuICAgICAgdmFyIGNvbW1pdE1lc3NhZ2UgPSBcIkR1cGxpY2F0ZWQgZGFzaGJvYXJkKHMpIFwiO1xuICAgICAgYW5ndWxhci5mb3JFYWNoKCRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLCAoaXRlbSwgaWR4KSA9PiB7XG4gICAgICAgIC8vIGxldHMgdW5zZWxlY3QgdGhpcyBpdGVtXG4gICAgICAgIHZhciBjb21taXRNZXNzYWdlID0gXCJEdXBsaWNhdGVkIGRhc2hib2FyZCBcIiArIGl0ZW0udGl0bGU7XG4gICAgICAgIHZhciBuZXdEYXNoID0gZGFzaGJvYXJkUmVwb3NpdG9yeS5jbG9uZURhc2hib2FyZChpdGVtKTtcbiAgICAgICAgbmV3RGFzaGJvYXJkcy5wdXNoKG5ld0Rhc2gpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIGxldCdzIGp1c3QgYmUgc2FmZSBhbmQgZW5zdXJlIHRoZXJlJ3Mgbm8gc2VsZWN0aW9uc1xuICAgICAgZGVzZWxlY3RBbGwoKTtcblxuICAgICAgY29tbWl0TWVzc2FnZSA9IGNvbW1pdE1lc3NhZ2UgKyBuZXdEYXNoYm9hcmRzLm1hcCgoZCkgPT4geyByZXR1cm4gZC50aXRsZSB9KS5qb2luKCcsJyk7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMobmV3RGFzaGJvYXJkcywgY29tbWl0TWVzc2FnZSwgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgc2V0U3ViVGFicyh0YWIsIG5hdi5idWlsZGVyKCksIGRhc2hib2FyZHMsICRyb290U2NvcGUpO1xuICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlbmFtZURhc2hib2FyZCA9ICgpID0+IHtcbiAgICAgIGlmICgkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkID0gPGFueT5fLmZpcnN0KCRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zKTtcbiAgICAgICAgdmFyIG1vZGFsID0gJG1vZGFsLm9wZW4oe1xuICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAncmVuYW1lRGFzaGJvYXJkTW9kYWwuaHRtbCcpLFxuICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRtb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAgICRzY29wZS5jb25maWcgPSB7XG4gICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAndGl0bGUnOiB7XG4gICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHNlbGVjdGVkLnRpdGxlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkID0gc2VsZWN0ZWQ7XG4gICAgICAgICAgICAkc2NvcGUub2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbJHNjb3BlLnNlbGVjdGVkXSwgJ3JlbmFtZWQgZGFzaGJvYXJkJywgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBsZXQncyBqdXN0IGJlIHNhZmUgYW5kIGVuc3VyZSB0aGVyZSdzIG5vIHNlbGVjdGlvbnNcbiAgICAgICAgICAgICAgICBkZXNlbGVjdEFsbCgpO1xuICAgICAgICAgICAgICAgIHNldFN1YlRhYnModGFiLCBuYXYuYnVpbGRlcigpLCBkYXNoYm9hcmRzLCAkcm9vdFNjb3BlKTtcbiAgICAgICAgICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgbW9kYWwuZGlzbWlzcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1dXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAkc2NvcGUuZGVsZXRlRGFzaGJvYXJkID0gKCkgPT4ge1xuICAgICAgaWYgKCRzY29wZS5oYXNTZWxlY3Rpb24oKSkge1xuICAgICAgICB2YXIgc2VsZWN0ZWQgPSAkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcztcbiAgICAgICAgdmFyIG1vZGFsID0gJG1vZGFsLm9wZW4oe1xuICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAnZGVsZXRlRGFzaGJvYXJkTW9kYWwuaHRtbCcpLFxuICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRtb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZCA9IHNlbGVjdGVkO1xuICAgICAgICAgICAgJHNjb3BlLm9rID0gKCkgPT4ge1xuICAgICAgICAgICAgICBtb2RhbC5jbG9zZSgpO1xuICAgICAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmRlbGV0ZURhc2hib2FyZHMoJHNjb3BlLnNlbGVjdGVkLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAgICAgICAgIC8vIGxldCdzIGp1c3QgYmUgc2FmZSBhbmQgZW5zdXJlIHRoZXJlJ3Mgbm8gc2VsZWN0aW9uc1xuICAgICAgICAgICAgICAgIGRlc2VsZWN0QWxsKCk7XG4gICAgICAgICAgICAgICAgc2V0U3ViVGFicyh0YWIsIG5hdi5idWlsZGVyKCksIGRhc2hib2FyZHMsICRyb290U2NvcGUpO1xuICAgICAgICAgICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgICBtb2RhbC5kaXNtaXNzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfV1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgICRzY29wZS5naXN0ID0gKCkgPT4ge1xuICAgICAgaWYgKCRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGlkID0gJHNjb3BlLnNlbGVjdGVkSXRlbXNbMF0uaWQ7XG4gICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9pZC9cIiArIGlkICsgXCIvc2hhcmVcIik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZURhdGEoKSB7XG4gICAgICB2YXIgdXJsID0gJHJvdXRlUGFyYW1zW1wiaHJlZlwiXTtcbiAgICAgIGlmICh1cmwpIHtcbiAgICAgICAgJHNjb3BlLnVybCA9IGRlY29kZVVSSUNvbXBvbmVudCh1cmwpO1xuICAgICAgfVxuXG4gICAgICB2YXIgcm91dGVQYXJhbXMgPSAkcm91dGVQYXJhbXNbXCJyb3V0ZVBhcmFtc1wiXTtcbiAgICAgIGlmIChyb3V0ZVBhcmFtcykge1xuICAgICAgICAkc2NvcGUucm91dGVQYXJhbXMgPSBkZWNvZGVVUklDb21wb25lbnQocm91dGVQYXJhbXMpO1xuICAgICAgfVxuICAgICAgdmFyIHNpemU6YW55ID0gJHJvdXRlUGFyYW1zW1wic2l6ZVwiXTtcbiAgICAgIGlmIChzaXplKSB7XG4gICAgICAgIHNpemUgPSBkZWNvZGVVUklDb21wb25lbnQoc2l6ZSk7XG4gICAgICAgICRzY29wZS5wcmVmZXJyZWRTaXplID0gYW5ndWxhci5mcm9tSnNvbihzaXplKTtcbiAgICAgIH1cbiAgICAgIHZhciB0aXRsZTphbnkgPSAkcm91dGVQYXJhbXNbXCJ0aXRsZVwiXTtcbiAgICAgIGlmICh0aXRsZSkge1xuICAgICAgICB0aXRsZSA9IGRlY29kZVVSSUNvbXBvbmVudCh0aXRsZSk7XG4gICAgICAgICRzY29wZS53aWRnZXRUaXRsZSA9IHRpdGxlO1xuICAgICAgfVxuXG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZHMoKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGFzaGJvYXJkTG9hZGVkKGV2ZW50LCBkYXNoYm9hcmRzKSB7XG4gICAgICBkYXNoYm9hcmRzLmZvckVhY2goKGRhc2hib2FyZCkgPT4ge1xuICAgICAgICBkYXNoYm9hcmQuaGFzaCA9ICc/bWFpbi10YWI9ZGFzaGJvYXJkJnN1Yi10YWI9ZGFzaGJvYXJkLScgKyBkYXNoYm9hcmQuaWQ7XG4gICAgICB9KTtcbiAgICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IGRhc2hib2FyZHM7XG5cbiAgICAgIGlmIChldmVudCA9PT0gbnVsbCkge1xuICAgICAgICAkc2NvcGUuJGVtaXQoJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkcyk7XG4gICAgICB9XG4gICAgICBDb3JlLiRhcHBseSgkcm9vdFNjb3BlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXNoYm9hcmRzKCkge1xuICAgICAgcmV0dXJuICRzY29wZS5fZGFzaGJvYXJkcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZXNlbGVjdEFsbCgpIHtcbiAgICAgICRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLmxlbmd0aCA9IDA7XG4gICAgfVxuXG4gIH1dKTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRIZWxwZXJzLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcblxuICAvKipcbiAgICogSW1wbGVtZW50cyB0aGUgbmcuSUxvY2F0aW9uU2VydmljZSBpbnRlcmZhY2UgYW5kIGlzIHVzZWQgYnkgdGhlIGRhc2hib2FyZCB0byBzdXBwbHlcbiAgICogY29udHJvbGxlcnMgd2l0aCBhIHNhdmVkIFVSTCBsb2NhdGlvblxuICAgKlxuICAgKiBAY2xhc3MgUmVjdGFuZ2xlTG9jYXRpb25cbiAgICovXG4gIGV4cG9ydCBjbGFzcyBSZWN0YW5nbGVMb2NhdGlvbiB7IC8vIFRPRE8gaW1wbGVtZW50cyBuZy5JTG9jYXRpb25TZXJ2aWNlIHtcbiAgICBwcml2YXRlIF9wYXRoOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBfaGFzaDogc3RyaW5nO1xuICAgIHByaXZhdGUgX3NlYXJjaDogYW55O1xuICAgIHByaXZhdGUgdXJpOlVSSTtcblxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBkZWxlZ2F0ZTpuZy5JTG9jYXRpb25TZXJ2aWNlLCBwYXRoOnN0cmluZywgc2VhcmNoLCBoYXNoOnN0cmluZykge1xuICAgICAgdGhpcy5fcGF0aCA9IHBhdGg7XG4gICAgICB0aGlzLl9zZWFyY2ggPSBzZWFyY2g7XG4gICAgICB0aGlzLl9oYXNoID0gaGFzaDtcbiAgICAgIHRoaXMudXJpID0gbmV3IFVSSShwYXRoKTtcbiAgICAgIHRoaXMudXJpLnNlYXJjaCgocXVlcnkpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlYXJjaDtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGFic1VybCgpIHtcbiAgICAgIHJldHVybiB0aGlzLnByb3RvY29sKCkgKyB0aGlzLmhvc3QoKSArIFwiOlwiICsgdGhpcy5wb3J0KCkgKyB0aGlzLnBhdGgoKSArIHRoaXMuc2VhcmNoKCk7XG4gICAgfVxuXG4gICAgaGFzaChuZXdIYXNoOnN0cmluZyA9IG51bGwpOmFueSB7XG4gICAgICBpZiAobmV3SGFzaCkge1xuICAgICAgICB0aGlzLnVyaS5zZWFyY2gobmV3SGFzaCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX2hhc2g7XG4gICAgfVxuXG4gICAgaG9zdCgpOnN0cmluZyB7XG4gICAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5ob3N0KCk7XG4gICAgfVxuXG4gICAgcGF0aChuZXdQYXRoOnN0cmluZyA9IG51bGwpOmFueSB7XG4gICAgICBpZiAobmV3UGF0aCkge1xuICAgICAgICB0aGlzLnVyaS5wYXRoKG5ld1BhdGgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9wYXRoO1xuICAgIH1cblxuICAgIHBvcnQoKTpudW1iZXIge1xuICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUucG9ydCgpO1xuICAgIH1cblxuICAgIHByb3RvY29sKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUucG9ydCgpO1xuICAgIH1cblxuICAgIHJlcGxhY2UoKSB7XG4gICAgICAvLyBUT0RPXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZWFyY2gocGFyYW1ldGVyc01hcDphbnkgPSBudWxsKTphbnkge1xuICAgICAgaWYgKHBhcmFtZXRlcnNNYXApIHtcbiAgICAgICAgdGhpcy51cmkuc2VhcmNoKHBhcmFtZXRlcnNNYXApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9zZWFyY2g7XG4gICAgfVxuXG4gICAgdXJsKG5ld1ZhbHVlOiBzdHJpbmcgPSBudWxsKTphbnkge1xuICAgICAgaWYgKG5ld1ZhbHVlKSB7XG4gICAgICAgIHRoaXMudXJpID0gbmV3IFVSSShuZXdWYWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuYWJzVXJsKCk7XG4gICAgfVxuXG4gIH1cbn1cbiIsIi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRSZXBvc2l0b3J5LnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cInJlY3RhbmdsZUxvY2F0aW9uLnRzXCIvPlxubW9kdWxlIERhc2hib2FyZCB7XG5cbiAgdmFyIG1vZHVsZXM6QXJyYXk8c3RyaW5nPiA9IHVuZGVmaW5lZDtcblxuICBfbW9kdWxlLmRpcmVjdGl2ZSgnaGF3dGlvRGFzaGJvYXJkJywgZnVuY3Rpb24oKSB7XG4gICAgbW9kdWxlcyA9IGhhd3Rpb1BsdWdpbkxvYWRlclsnbW9kdWxlcyddLmZpbHRlcigobmFtZSkgPT4ge1xuICAgICAgcmV0dXJuIF8uaXNTdHJpbmcobmFtZSkgJiYgbmFtZSAhPT0gJ25nJztcbiAgICB9KTtcbiAgICByZXR1cm4gbmV3IERhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZSgpO1xuICB9KTtcblxuICBleHBvcnQgY2xhc3MgR3JpZHN0ZXJEaXJlY3RpdmUge1xuICAgIHB1YmxpYyByZXN0cmljdCA9ICdBJztcbiAgICBwdWJsaWMgcmVwbGFjZSA9IHRydWU7XG5cbiAgICBwdWJsaWMgY29udHJvbGxlciA9IFtcIiRzY29wZVwiLCBcIiRlbGVtZW50XCIsIFwiJGF0dHJzXCIsIFwiJGxvY2F0aW9uXCIsIFwiJHJvdXRlUGFyYW1zXCIsIFwiJHRlbXBsYXRlQ2FjaGVcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsIFwiJGNvbXBpbGVcIiwgXCIkdGVtcGxhdGVSZXF1ZXN0XCIsIFwiJGludGVycG9sYXRlXCIsIFwiJG1vZGFsXCIsIFwiJHNjZVwiLCBcIiR0aW1lb3V0XCIsICgkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMsICRsb2NhdGlvbiwgJHJvdXRlUGFyYW1zLCAkdGVtcGxhdGVDYWNoZSwgZGFzaGJvYXJkUmVwb3NpdG9yeTpEYXNoYm9hcmRSZXBvc2l0b3J5LCAkY29tcGlsZSwgJHRlbXBsYXRlUmVxdWVzdCwgJGludGVycG9sYXRlLCAkbW9kYWwsICRzY2UsICR0aW1lb3V0KSA9PiB7XG5cbiAgICAgIHZhciBncmlkU2l6ZSA9IDE1MDtcbiAgICAgIHZhciBncmlkTWFyZ2luID0gNjtcbiAgICAgIHZhciBncmlkSGVpZ2h0O1xuXG4gICAgICB2YXIgZ3JpZFggPSBncmlkU2l6ZTtcbiAgICAgIHZhciBncmlkWSA9IGdyaWRTaXplO1xuXG4gICAgICB2YXIgd2lkZ2V0TWFwID0ge307XG5cbiAgICAgIHZhciBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnkgPSAkc2NvcGUuJGV2YWwoJ2Rhc2hib2FyZFJlcG9zaXRvcnknKSB8fCBkYXNoYm9hcmRSZXBvc2l0b3J5O1xuXG4gICAgICAkc2NvcGUuJG9uKCckZGVzdHJveScsICgpID0+IHtcbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKHdpZGdldE1hcCwgKHdpZGdldCwga2V5KSA9PiB7XG4gICAgICAgICAgaWYgKCdzY29wZScgaW4gd2lkZ2V0KSB7XG4gICAgICAgICAgICB2YXIgc2NvcGUgPSB3aWRnZXRbJ3Njb3BlJ107XG4gICAgICAgICAgICBzY29wZS4kZGVzdHJveSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkZXN0cm95V2lkZ2V0KHdpZGdldCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgICRlbGVtZW50Lm9uKCckZGVzdHJveScsICgpID0+IHtcbiAgICAgICAgJHNjb3BlLiRkZXN0cm95KCk7XG4gICAgICB9KTtcblxuICAgICAgc2V0VGltZW91dCh1cGRhdGVXaWRnZXRzLCAxMCk7XG5cbiAgICAgIGZ1bmN0aW9uIGRlc3Ryb3lXaWRnZXQod2lkZ2V0KSB7XG4gICAgICAgIHZhciBncmlkc3RlciA9IGdldEdyaWRzdGVyKCk7XG4gICAgICAgIHZhciB3aWRnZXRFbGVtID0gbnVsbDtcbiAgICAgICAgLy8gbGV0cyBkZXN0cm95IHRoZSB3aWRnZXRzJ3Mgc2NvcGVcbiAgICAgICAgdmFyIHdpZGdldERhdGEgPSB3aWRnZXRNYXBbd2lkZ2V0LmlkXTtcbiAgICAgICAgaWYgKHdpZGdldERhdGEpIHtcbiAgICAgICAgICBkZWxldGUgd2lkZ2V0TWFwW3dpZGdldC5pZF07XG4gICAgICAgICAgd2lkZ2V0RWxlbSA9IHdpZGdldERhdGEud2lkZ2V0O1xuICAgICAgICB9XG4gICAgICAgIGlmICghd2lkZ2V0RWxlbSkge1xuICAgICAgICAgIC8vIGxldHMgZ2V0IHRoZSBsaSBwYXJlbnQgZWxlbWVudCBvZiB0aGUgdGVtcGxhdGVcbiAgICAgICAgICB3aWRnZXRFbGVtID0gJGVsZW1lbnQuZmluZChcIltkYXRhLXdpZGdldElkPSdcIiArIHdpZGdldC5pZCArIFwiJ11cIikucGFyZW50KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdyaWRzdGVyICYmIHdpZGdldEVsZW0pIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgZ3JpZHN0ZXIucmVtb3ZlX3dpZGdldCh3aWRnZXRFbGVtKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIC8vIG5vdGhpbmcgdG8gZG8sIHdlJ2xsIGRlc3Ryb3kgdGhlIGVsZW1lbnQgYmVsb3dcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHdpZGdldEVsZW0pIHtcbiAgICAgICAgICBsb2cuZGVidWcoXCJSZW1vdmluZyB3aWRnZXQ6IFwiLCB3aWRnZXQuaWQpO1xuICAgICAgICAgIHdpZGdldEVsZW0ucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcmVtb3ZlV2lkZ2V0KHdpZGdldCkge1xuICAgICAgICBkZXN0cm95V2lkZ2V0KHdpZGdldCk7XG4gICAgICAgIC8vIGxldHMgdHJhc2ggdGhlIEpTT04gbWV0YWRhdGFcbiAgICAgICAgaWYgKCRzY29wZS5kYXNoYm9hcmQpIHtcbiAgICAgICAgICB2YXIgd2lkZ2V0cyA9ICRzY29wZS5kYXNoYm9hcmQud2lkZ2V0cztcbiAgICAgICAgICBpZiAod2lkZ2V0cykge1xuICAgICAgICAgICAgd2lkZ2V0cy5yZW1vdmUod2lkZ2V0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIlJlbW92ZWQgd2lkZ2V0IFwiICsgd2lkZ2V0LnRpdGxlKTtcbiAgICAgIH07XG5cbiAgICAgIGZ1bmN0aW9uIGNoYW5nZVdpZGdldFNpemUod2lkZ2V0LCBzaXplZnVuYywgc2F2ZWZ1bmMpIHtcbiAgICAgICAgaWYgKCF3aWRnZXQpIHtcbiAgICAgICAgICBsb2cuZGVidWcoXCJ3aWRnZXQgdW5kZWZpbmVkXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZ3JpZHN0ZXIgPSBnZXRHcmlkc3RlcigpO1xuICAgICAgICBsb2cuZGVidWcoXCJXaWRnZXQgSUQ6IFwiLCB3aWRnZXQuaWQsIFwiIHdpZGdldE1hcDogXCIsIHdpZGdldE1hcCk7XG4gICAgICAgIHZhciBlbnRyeSA9IHdpZGdldE1hcFt3aWRnZXQuaWRdO1xuICAgICAgICB2YXIgdyA9IGVudHJ5LndpZGdldDtcbiAgICAgICAgc2l6ZWZ1bmMoZW50cnkpO1xuICAgICAgICBncmlkc3Rlci5yZXNpemVfd2lkZ2V0KHcsIGVudHJ5LnNpemVfeCwgZW50cnkuc2l6ZV95KTtcbiAgICAgICAgZ3JpZHN0ZXIuc2V0X2RvbV9ncmlkX2hlaWdodCgpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICBzYXZlZnVuYyh3aWRnZXQpO1xuICAgICAgICB9LCA1MCk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG9uV2lkZ2V0UmVuYW1lZCh3aWRnZXQpIHtcbiAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIlJlbmFtZWQgd2lkZ2V0IHRvIFwiICsgd2lkZ2V0LnRpdGxlKTtcbiAgICAgIH07XG5cbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZVdpZGdldHMoKSB7XG4gICAgICAgICRzY29wZS5pZCA9ICRzY29wZS4kZXZhbCgnZGFzaGJvYXJkSWQnKSB8fCAkcm91dGVQYXJhbXNbXCJkYXNoYm9hcmRJZFwiXTtcbiAgICAgICAgJHNjb3BlLmlkeCA9ICRzY29wZS4kZXZhbCgnZGFzaGJvYXJkSW5kZXgnKSB8fCAkcm91dGVQYXJhbXNbXCJkYXNoYm9hcmRJbmRleFwiXTtcbiAgICAgICAgaWYgKCRzY29wZS5pZCkge1xuICAgICAgICAgICRzY29wZS4kZW1pdCgnbG9hZERhc2hib2FyZHMnKTtcbiAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZCgkc2NvcGUuaWQsIG9uRGFzaGJvYXJkTG9hZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXREYXNoYm9hcmRzKChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkcyk7XG5cbiAgICAgICAgICAgIHZhciBpZHggPSAkc2NvcGUuaWR4ID8gcGFyc2VJbnQoJHNjb3BlLmlkeCkgOiAwO1xuICAgICAgICAgICAgdmFyIGlkID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChkYXNoYm9hcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgdmFyIGRhc2hib2FyZCA9IGRhc2hib2FyZHMubGVuZ3RoID4gaWR4ID8gZGFzaGJvYXJkc1tpZHhdIDogZGFzaGJvYXJkWzBdO1xuICAgICAgICAgICAgICBpZCA9IGRhc2hib2FyZC5pZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgkc2NvcGUuJGV2YWwoJ2Rhc2hib2FyZEVtYmVkZGVkJykpIHtcbiAgICAgICAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkKSB7XG4gICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9pZC9cIiArIGlkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9lZGl0XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBvbkRhc2hib2FyZExvYWQoZGFzaGJvYXJkKSB7XG4gICAgICAgICRzY29wZS5kYXNoYm9hcmQgPSBkYXNoYm9hcmQ7XG4gICAgICAgIHZhciB3aWRnZXRzID0gKChkYXNoYm9hcmQpID8gZGFzaGJvYXJkLndpZGdldHMgOiBudWxsKSB8fCBbXTtcblxuICAgICAgICB2YXIgbWluSGVpZ2h0ID0gMTA7XG4gICAgICAgIHZhciBtaW5XaWR0aCA9IDY7XG5cbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKHdpZGdldHMsICh3aWRnZXQpID0+IHtcbiAgICAgICAgICBpZiAoIXdpZGdldCkge1xuICAgICAgICAgICAgbG9nLmRlYnVnKFwiVW5kZWZpbmVkIHdpZGdldCwgc2tpcHBpbmdcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZCh3aWRnZXQucm93KSAmJiBtaW5IZWlnaHQgPCB3aWRnZXQucm93KSB7XG4gICAgICAgICAgICBtaW5IZWlnaHQgPSB3aWRnZXQucm93ICsgMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHdpZGdldC5zaXplX3hcbiAgICAgICAgICAgICAgJiYgYW5ndWxhci5pc0RlZmluZWQod2lkZ2V0LmNvbCkpKSB7XG4gICAgICAgICAgICB2YXIgcmlnaHRFZGdlID0gd2lkZ2V0LmNvbCArIHdpZGdldC5zaXplX3g7XG4gICAgICAgICAgICBpZiAocmlnaHRFZGdlID4gbWluV2lkdGgpIHtcbiAgICAgICAgICAgICAgbWluV2lkdGggPSByaWdodEVkZ2UgKyAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGdyaWRzdGVyID0gJGVsZW1lbnQuZ3JpZHN0ZXIoe1xuICAgICAgICAgIHdpZGdldF9tYXJnaW5zOiBbZ3JpZE1hcmdpbiwgZ3JpZE1hcmdpbl0sXG4gICAgICAgICAgd2lkZ2V0X2Jhc2VfZGltZW5zaW9uczogW2dyaWRYLCBncmlkWV0sXG4gICAgICAgICAgZXh0cmFfcm93czogbWluSGVpZ2h0LFxuICAgICAgICAgIGV4dHJhX2NvbHM6IG1pbldpZHRoLFxuICAgICAgICAgIG1heF9zaXplX3g6IG1pbldpZHRoLFxuICAgICAgICAgIG1heF9zaXplX3k6IG1pbkhlaWdodCxcbiAgICAgICAgICBkcmFnZ2FibGU6IHtcbiAgICAgICAgICAgIHN0b3A6IChldmVudCwgdWkpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHNlcmlhbGl6ZURhc2hib2FyZCgpKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIkNoYW5naW5nIGRhc2hib2FyZCBsYXlvdXRcIik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pLmRhdGEoJ2dyaWRzdGVyJyk7XG5cbiAgICAgICAgdmFyIHRlbXBsYXRlID0gJHRlbXBsYXRlQ2FjaGUuZ2V0KFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsIFwid2lkZ2V0VGVtcGxhdGUuaHRtbFwiKSk7XG4gICAgICAgIHZhciByZW1haW5pbmcgPSB3aWRnZXRzLmxlbmd0aDtcblxuICAgICAgICBmdW5jdGlvbiBtYXliZUZpbmlzaFVwKCkge1xuICAgICAgICAgIHJlbWFpbmluZyA9IHJlbWFpbmluZyAtIDE7XG4gICAgICAgICAgaWYgKHJlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgICAgbWFrZVJlc2l6YWJsZSgpO1xuICAgICAgICAgICAgZ2V0R3JpZHN0ZXIoKS5lbmFibGUoKTtcbiAgICAgICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZG9SZW1vdmVXaWRnZXQoJG1vZGFsLCB3aWRnZXQpIHtcbiAgICAgICAgICBsb2cuZGVidWcoXCJSZW1vdmUgd2lkZ2V0OiBcIiwgd2lkZ2V0KTtcbiAgICAgICAgICB2YXIgbW9kYWwgPSAkbW9kYWwub3Blbih7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ2RlbGV0ZVdpZGdldE1vZGFsLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRtb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAgICAgJHNjb3BlLndpZGdldCA9IHdpZGdldDtcbiAgICAgICAgICAgICAgJHNjb3BlLm9rID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgcmVtb3ZlV2lkZ2V0KCRzY29wZS53aWRnZXQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgbW9kYWwuZGlzbWlzcygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZG9SZW5hbWVXaWRnZXQoJG1vZGFsLCB3aWRnZXQpIHtcbiAgICAgICAgICBsb2cuZGVidWcoXCJSZW5hbWUgd2lkZ2V0OiBcIiwgd2lkZ2V0KTtcbiAgICAgICAgICB2YXIgbW9kYWwgPSAkbW9kYWwub3Blbih7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ3JlbmFtZVdpZGdldE1vZGFsLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRtb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAgICAgJHNjb3BlLndpZGdldCA9IHdpZGdldDtcbiAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZyA9IHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAndGl0bGUnOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB3aWRnZXQudGl0bGVcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICRzY29wZS5vayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBtb2RhbC5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIG9uV2lkZ2V0UmVuYW1lZCgkc2NvcGUud2lkZ2V0KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIG1vZGFsLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfV1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaCh3aWRnZXRzLCAod2lkZ2V0KSA9PiB7XG4gICAgICAgICAgdmFyIHR5cGUgPSAnaW50ZXJuYWwnO1xuICAgICAgICAgIGlmICgnaWZyYW1lJyBpbiB3aWRnZXQpIHtcbiAgICAgICAgICAgIHR5cGUgPSAnZXh0ZXJuYWwnO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2V4dGVybmFsJzpcbiAgICAgICAgICAgICAgbG9nLmRlYnVnKFwiUmVuZGVyaW5nIGV4dGVybmFsIChpZnJhbWUpIHdpZGdldDogXCIsIHdpZGdldC50aXRsZSB8fCB3aWRnZXQuaWQpO1xuICAgICAgICAgICAgICB2YXIgc2NvcGUgPSAkc2NvcGUuJG5ldygpO1xuICAgICAgICAgICAgICBzY29wZS53aWRnZXQgPSB3aWRnZXQ7XG4gICAgICAgICAgICAgIHNjb3BlLnJlbW92ZVdpZGdldCA9ICh3aWRnZXQpID0+IGRvUmVtb3ZlV2lkZ2V0KCRtb2RhbCwgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgc2NvcGUucmVuYW1lV2lkZ2V0ID0gKHdpZGdldCkgPT4gZG9SZW5hbWVXaWRnZXQoJG1vZGFsLCB3aWRnZXQpO1xuICAgICAgICAgICAgICB2YXIgd2lkZ2V0Qm9keTphbnkgPSBhbmd1bGFyLmVsZW1lbnQoJHRlbXBsYXRlQ2FjaGUuZ2V0KFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdpZnJhbWVXaWRnZXRUZW1wbGF0ZS5odG1sJykpKTtcbiAgICAgICAgICAgICAgdmFyIG91dGVyRGl2ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldChVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAnd2lkZ2V0QmxvY2tUZW1wbGF0ZS5odG1sJykpKTtcbiAgICAgICAgICAgICAgd2lkZ2V0Qm9keS5maW5kKCdpZnJhbWUnKS5hdHRyKCdzcmMnLCB3aWRnZXQuaWZyYW1lKTtcbiAgICAgICAgICAgICAgb3V0ZXJEaXYuYXBwZW5kKCRjb21waWxlKHdpZGdldEJvZHkpKHNjb3BlKSk7XG4gICAgICAgICAgICAgIHZhciB3ID0gZ3JpZHN0ZXIuYWRkX3dpZGdldChvdXRlckRpdiwgd2lkZ2V0LnNpemVfeCwgd2lkZ2V0LnNpemVfeSwgd2lkZ2V0LmNvbCwgd2lkZ2V0LnJvdyk7XG4gICAgICAgICAgICAgIHdpZGdldE1hcFt3aWRnZXQuaWRdID0ge1xuICAgICAgICAgICAgICAgIHdpZGdldDogd1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICBtYXliZUZpbmlzaFVwKCk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnaW50ZXJuYWwnOiBcbiAgICAgICAgICAgICAgbG9nLmRlYnVnKFwiUmVuZGVyaW5nIGludGVybmFsIHdpZGdldDogXCIsIHdpZGdldC50aXRsZSB8fCB3aWRnZXQuaWQpO1xuICAgICAgICAgICAgICB2YXIgcGF0aCA9IHdpZGdldC5wYXRoO1xuICAgICAgICAgICAgICB2YXIgc2VhcmNoID0gbnVsbDtcbiAgICAgICAgICAgICAgaWYgKHdpZGdldC5zZWFyY2gpIHtcbiAgICAgICAgICAgICAgICBzZWFyY2ggPSBEYXNoYm9hcmQuZGVjb2RlVVJJQ29tcG9uZW50UHJvcGVydGllcyh3aWRnZXQuc2VhcmNoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAod2lkZ2V0LnJvdXRlUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgXy5leHRlbmQoc2VhcmNoLCBhbmd1bGFyLmZyb21Kc29uKHdpZGdldC5yb3V0ZVBhcmFtcykpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHZhciBoYXNoID0gd2lkZ2V0Lmhhc2g7IC8vIFRPRE8gZGVjb2RlIG9iamVjdD9cbiAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gbmV3IFJlY3RhbmdsZUxvY2F0aW9uKCRsb2NhdGlvbiwgcGF0aCwgc2VhcmNoLCBoYXNoKTtcbiAgICAgICAgICAgICAgaWYgKCF3aWRnZXQuc2l6ZV94IHx8IHdpZGdldC5zaXplX3ggPCAxKSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0LnNpemVfeCA9IDE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKCF3aWRnZXQuc2l6ZV95IHx8IHdpZGdldC5zaXplX3kgPCAxKSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0LnNpemVfeSA9IDE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdmFyIHRtcE1vZHVsZU5hbWUgPSAnZGFzaGJvYXJkLScgKyB3aWRnZXQuaWQ7XG4gICAgICAgICAgICAgIHZhciBwbHVnaW5zID0gXy5maWx0ZXIoaGF3dGlvUGx1Z2luTG9hZGVyLmdldE1vZHVsZXMoKSwgKG1vZHVsZSkgPT4gYW5ndWxhci5pc1N0cmluZyhtb2R1bGUpKTtcbiAgICAgICAgICAgICAgdmFyIHRtcE1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKHRtcE1vZHVsZU5hbWUsIHBsdWdpbnMpO1xuXG4gICAgICAgICAgICAgIGZ1bmN0aW9uIGdldFNlcnZpY2VzKG1vZHVsZTpzdHJpbmcsIGFuc3dlcj86YW55KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFhbnN3ZXIpIHtcbiAgICAgICAgICAgICAgICAgIGFuc3dlciA9IDxhbnk+e307XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF8uZm9yRWFjaChhbmd1bGFyLm1vZHVsZShtb2R1bGUpLnJlcXVpcmVzLCAobSkgPT4gZ2V0U2VydmljZXMobSwgYW5zd2VyKSk7XG4gICAgICAgICAgICAgICAgXy5mb3JFYWNoKCg8YW55PmFuZ3VsYXIubW9kdWxlKG1vZHVsZSkpLl9pbnZva2VRdWV1ZSwgKGEpID0+IHtcbiAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGFuc3dlclthWzJdWzBdXSA9IEhhd3Rpb0NvcmUuaW5qZWN0b3IuZ2V0KGFbMl1bMF0pO1xuICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vbm90aGluZyB0byBkb1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBhbnN3ZXI7XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIHZhciBzZXJ2aWNlcyA9IHt9O1xuICAgICAgICAgICAgICBfLmZvckVhY2gocGx1Z2lucywgKHBsdWdpbjpzdHJpbmcpID0+IHBsdWdpbiA/IGdldFNlcnZpY2VzKHBsdWdpbiwgc2VydmljZXMpIDogY29uc29sZS5sb2coXCJudWxsIHBsdWdpbiBuYW1lXCIpKTtcbiAgICAgICAgICAgICAgLy9sb2cuZGVidWcoXCJzZXJ2aWNlczogXCIsIHNlcnZpY2VzKTtcblxuICAgICAgICAgICAgICB0bXBNb2R1bGUuY29uZmlnKFsnJHByb3ZpZGUnLCAoJHByb3ZpZGUpID0+IHtcbiAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IoJ0hhd3Rpb0Rhc2hib2FyZCcsIFsnJGRlbGVnYXRlJywgJyRyb290U2NvcGUnLCAoJGRlbGVnYXRlLCAkcm9vdFNjb3BlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAkZGVsZWdhdGUuaW5EYXNoYm9hcmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuICRkZWxlZ2F0ZTtcbiAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKCckbG9jYXRpb24nLCBbJyRkZWxlZ2F0ZScsICgkZGVsZWdhdGUpID0+IHtcbiAgICAgICAgICAgICAgICAgIC8vbG9nLmRlYnVnKFwiVXNpbmcgJGxvY2F0aW9uOiBcIiwgbG9jYXRpb24pO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxvY2F0aW9uO1xuICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IoJyRyb3V0ZScsIFsnJGRlbGVnYXRlJywgKCRkZWxlZ2F0ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgLy8gcmVhbGx5IGhhbmR5IGZvciBkZWJ1Z2dpbmcsIG1vc3RseSB0byB0ZWxsIGlmIGEgd2lkZ2V0J3Mgcm91dGVcbiAgICAgICAgICAgICAgICAgIC8vIGlzbid0IGFjdHVhbGx5IGF2YWlsYWJsZSBpbiB0aGUgY2hpbGQgYXBwXG4gICAgICAgICAgICAgICAgICAvL2xvZy5kZWJ1ZyhcIlVzaW5nICRyb3V0ZTogXCIsICRkZWxlZ2F0ZSk7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gJGRlbGVnYXRlO1xuICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IoJyRyb3V0ZVBhcmFtcycsIFsnJGRlbGVnYXRlJywgKCRkZWxlZ2F0ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgLy9sb2cuZGVidWcoXCJVc2luZyAkcm91dGVQYXJhbXM6IFwiLCBzZWFyY2gpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlYXJjaDtcbiAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgXy5mb3JJbihzZXJ2aWNlcywgKHNlcnZpY2UsIG5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICAgIHN3aXRjaChuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJyRsb2NhdGlvbic6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJyRyb3V0ZSc6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJyRyb3V0ZVBhcmFtcyc6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ0hhd3Rpb0Rhc2hib2FyZCc6XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2Rhc2hib2FyZFJlcG9zaXRvcnknOlxuICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IobmFtZSwgWygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdIYXd0aW9EYXNoYm9hcmRUYWInOlxuICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IobmFtZSwgWygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgZW1iZWRkZWQ6IHRydWUgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcblxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnQnVpbGRlckZhY3RvcnlQcm92aWRlcic6XG4gICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcihuYW1lLCBbKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2V0RHVtbXlCdWlsZGVyRmFjdG9yeSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXNlICdIYXd0aW9OYXYnOlxuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IobmFtZSwgWygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdldER1bW15SGF3dGlvTmF2KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBub3RoaW5nIHRvIGRvXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgIC8vbG9nLmRlYnVnKFwibmFtZTogXCIsIG5hbWUsIFwiIHNlcnZpY2U6IFwiLCBzZXJ2aWNlKTtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoXy5zdGFydHNXaXRoKG5hbWUsICckJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcihuYW1lLCBbKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBsb2cuZGVidWcoXCJSZXR1cm5pbmcgZXhpc3Rpbmcgc2VydmljZSBmb3I6IFwiLCBuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlcnZpY2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpZ25vcmUsIHRoaXMnbGwgaGFwcGVuIGZvciBjb25zdGFudHMgYW5kIHN0dWZmXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgIHRtcE1vZHVsZS5jb250cm9sbGVyKCdIYXd0aW9EYXNoYm9hcmQuVGl0bGUnLCBbXCIkc2NvcGVcIiwgXCIkbW9kYWxcIiwgKCRzY29wZSwgJG1vZGFsKSA9PiB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLndpZGdldCA9IHdpZGdldDtcbiAgICAgICAgICAgICAgICAkc2NvcGUucmVtb3ZlV2lkZ2V0ID0gKHdpZGdldCkgPT4gZG9SZW1vdmVXaWRnZXQoJG1vZGFsLCB3aWRnZXQpO1xuICAgICAgICAgICAgICAgICRzY29wZS5yZW5hbWVXaWRnZXQgPSAod2lkZ2V0KSA9PiBkb1JlbmFtZVdpZGdldCgkbW9kYWwsIHdpZGdldCk7XG4gICAgICAgICAgICAgIH1dKTtcblxuICAgICAgICAgICAgICB2YXIgZGl2OmFueSA9ICQodGVtcGxhdGUpO1xuICAgICAgICAgICAgICBkaXYuYXR0cih7ICdkYXRhLXdpZGdldElkJzogd2lkZ2V0LmlkIH0pO1xuICAgICAgICAgICAgICB2YXIgYm9keSA9IGRpdi5maW5kKCcud2lkZ2V0LWJvZHknKTtcbiAgICAgICAgICAgICAgbG9nLmRlYnVnKFwiaW5jbHVkZTogXCIsIHdpZGdldC5pbmNsdWRlKTtcbiAgICAgICAgICAgICAgdmFyIHdpZGdldEJvZHkgPSAkdGVtcGxhdGVDYWNoZS5nZXQod2lkZ2V0LmluY2x1ZGUpO1xuICAgICAgICAgICAgICAkdGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdmFyIG91dGVyRGl2ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldChVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAnd2lkZ2V0QmxvY2tUZW1wbGF0ZS5odG1sJykpKTtcbiAgICAgICAgICAgICAgICBib2R5Lmh0bWwod2lkZ2V0Qm9keSk7XG4gICAgICAgICAgICAgICAgb3V0ZXJEaXYuaHRtbChkaXYpO1xuICAgICAgICAgICAgICAgIGFuZ3VsYXIuYm9vdHN0cmFwKGRpdiwgW3RtcE1vZHVsZU5hbWVdKTtcbiAgICAgICAgICAgICAgICB3aWRnZXRNYXBbd2lkZ2V0LmlkXSA9IHtcbiAgICAgICAgICAgICAgICAgIHdpZGdldDogZ3JpZHN0ZXIuYWRkX3dpZGdldChvdXRlckRpdiwgd2lkZ2V0LnNpemVfeCwgd2lkZ2V0LnNpemVfeSwgd2lkZ2V0LmNvbCwgd2lkZ2V0LnJvdylcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIG1heWJlRmluaXNoVXAoKTtcbiAgICAgICAgICAgICAgfSwgNTApO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBzZXJpYWxpemVEYXNoYm9hcmQoKSB7XG4gICAgICAgIHZhciBncmlkc3RlciA9IGdldEdyaWRzdGVyKCk7XG4gICAgICAgIGlmIChncmlkc3Rlcikge1xuICAgICAgICAgIHZhciBkYXRhID0gZ3JpZHN0ZXIuc2VyaWFsaXplKCk7XG4gICAgICAgICAgLy9jb25zb2xlLmxvZyhcImdvdCBkYXRhOiBcIiArIEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcblxuICAgICAgICAgIHZhciB3aWRnZXRzID0gJHNjb3BlLmRhc2hib2FyZC53aWRnZXRzIHx8IFtdO1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiV2lkZ2V0czogXCIsIHdpZGdldHMpO1xuXG4gICAgICAgICAgLy8gbGV0cyBhc3N1bWUgdGhlIGRhdGEgaXMgaW4gdGhlIG9yZGVyIG9mIHRoZSB3aWRnZXRzLi4uXG4gICAgICAgICAgYW5ndWxhci5mb3JFYWNoKHdpZGdldHMsICh3aWRnZXQsIGlkeCkgPT4ge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gZGF0YVtpZHhdO1xuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHdpZGdldCkge1xuICAgICAgICAgICAgICAvLyBsZXRzIGNvcHkgdGhlIHZhbHVlcyBhY3Jvc3NcbiAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKHZhbHVlLCAoYXR0ciwga2V5KSA9PiB3aWRnZXRba2V5XSA9IGF0dHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gbWFrZVJlc2l6YWJsZSgpIHtcbiAgICAgICAgdmFyIGJsb2NrczphbnkgPSAkKCcuZ3JpZC1ibG9jaycpO1xuICAgICAgICBibG9ja3MucmVzaXphYmxlKCdkZXN0cm95Jyk7XG5cbiAgICAgICAgYmxvY2tzLnJlc2l6YWJsZSh7XG4gICAgICAgICAgZ3JpZDogW2dyaWRTaXplICsgKGdyaWRNYXJnaW4gKiAyKSwgZ3JpZFNpemUgKyAoZ3JpZE1hcmdpbiAqIDIpXSxcbiAgICAgICAgICBhbmltYXRlOiBmYWxzZSxcbiAgICAgICAgICBtaW5XaWR0aDogZ3JpZFNpemUsXG4gICAgICAgICAgbWluSGVpZ2h0OiBncmlkU2l6ZSxcbiAgICAgICAgICBhdXRvSGlkZTogZmFsc2UsXG4gICAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uKGV2ZW50LCB1aSkge1xuICAgICAgICAgICAgZ3JpZEhlaWdodCA9IGdldEdyaWRzdGVyKCkuJGVsLmhlaWdodCgpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVzaXplOiBmdW5jdGlvbihldmVudCwgdWkpIHtcbiAgICAgICAgICAgIC8vc2V0IG5ldyBncmlkIGhlaWdodCBhbG9uZyB0aGUgZHJhZ2dpbmcgcGVyaW9kXG4gICAgICAgICAgICB2YXIgZyA9IGdldEdyaWRzdGVyKCk7XG4gICAgICAgICAgICB2YXIgZGVsdGEgPSBncmlkU2l6ZSArIGdyaWRNYXJnaW4gKiAyO1xuICAgICAgICAgICAgaWYgKGV2ZW50Lm9mZnNldFkgPiBnLiRlbC5oZWlnaHQoKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdmFyIGV4dHJhID0gTWF0aC5mbG9vcigoZXZlbnQub2Zmc2V0WSAtIGdyaWRIZWlnaHQpIC8gZGVsdGEgKyAxKTtcbiAgICAgICAgICAgICAgdmFyIG5ld0hlaWdodCA9IGdyaWRIZWlnaHQgKyBleHRyYSAqIGRlbHRhO1xuICAgICAgICAgICAgICBnLiRlbC5jc3MoJ2hlaWdodCcsIG5ld0hlaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzdG9wOiBmdW5jdGlvbihldmVudCwgdWkpIHtcbiAgICAgICAgICAgIHZhciByZXNpemVkID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJlc2l6ZUJsb2NrKHJlc2l6ZWQpO1xuICAgICAgICAgICAgfSwgMzAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgICQoJy51aS1yZXNpemFibGUtaGFuZGxlJykuaG92ZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZ2V0R3JpZHN0ZXIoKS5kaXNhYmxlKCk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGdldEdyaWRzdGVyKCkuZW5hYmxlKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICB9XG5cblxuICAgICAgZnVuY3Rpb24gcmVzaXplQmxvY2soZWxtT2JqKSB7XG4gICAgICAgIHZhciBhcmVhID0gZWxtT2JqLmZpbmQoJy53aWRnZXQtYXJlYScpO1xuICAgICAgICB2YXIgdyA9IGVsbU9iai53aWR0aCgpIC0gZ3JpZFNpemU7XG4gICAgICAgIHZhciBoID0gZWxtT2JqLmhlaWdodCgpIC0gZ3JpZFNpemU7XG5cbiAgICAgICAgZm9yICh2YXIgZ3JpZF93ID0gMTsgdyA+IDA7IHcgLT0gKGdyaWRTaXplICsgKGdyaWRNYXJnaW4gKiAyKSkpIHtcbiAgICAgICAgICBncmlkX3crKztcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGdyaWRfaCA9IDE7IGggPiAwOyBoIC09IChncmlkU2l6ZSArIChncmlkTWFyZ2luICogMikpKSB7XG4gICAgICAgICAgZ3JpZF9oKys7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgd2lkZ2V0ID0ge1xuICAgICAgICAgIGlkOiBhcmVhLmF0dHIoJ2RhdGEtd2lkZ2V0SWQnKVxuICAgICAgICB9O1xuXG4gICAgICAgIGNoYW5nZVdpZGdldFNpemUod2lkZ2V0LCBmdW5jdGlvbih3aWRnZXQpIHtcbiAgICAgICAgICB3aWRnZXQuc2l6ZV94ID0gZ3JpZF93O1xuICAgICAgICAgIHdpZGdldC5zaXplX3kgPSBncmlkX2g7XG4gICAgICAgIH0sIGZ1bmN0aW9uKHdpZGdldCkge1xuICAgICAgICAgIGlmIChzZXJpYWxpemVEYXNoYm9hcmQoKSkge1xuICAgICAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIkNoYW5nZWQgc2l6ZSBvZiB3aWRnZXQ6IFwiICsgd2lkZ2V0LmlkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgICAgIGlmICgkc2NvcGUuZGFzaGJvYXJkKSB7XG4gICAgICAgICAgdmFyIGNvbW1pdE1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgICAgIGlmICgkc2NvcGUuZGFzaGJvYXJkICYmICRzY29wZS5kYXNoYm9hcmQudGl0bGUpIHtcbiAgICAgICAgICAgIGNvbW1pdE1lc3NhZ2UgKz0gXCIgb24gZGFzaGJvYXJkIFwiICsgJHNjb3BlLmRhc2hib2FyZC50aXRsZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKFskc2NvcGUuZGFzaGJvYXJkXSwgY29tbWl0TWVzc2FnZSwgRGFzaGJvYXJkLm9uT3BlcmF0aW9uQ29tcGxldGUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGdldEdyaWRzdGVyKCkge1xuICAgICAgICByZXR1cm4gJGVsZW1lbnQuZ3JpZHN0ZXIoKS5kYXRhKCdncmlkc3RlcicpO1xuICAgICAgfVxuXG4gICAgfV07XG5cbiAgfVxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcbiAgX21vZHVsZS5jb250cm9sbGVyKFwiRGFzaGJvYXJkLkltcG9ydENvbnRyb2xsZXJcIiwgW1wiJHNjb3BlXCIsIFwiJGxvY2F0aW9uXCIsIFwiJHJvdXRlUGFyYW1zXCIsIFwiZGFzaGJvYXJkUmVwb3NpdG9yeVwiLCAoJHNjb3BlLCAkbG9jYXRpb24sICRyb3V0ZVBhcmFtcywgZGFzaGJvYXJkUmVwb3NpdG9yeTpEYXNoYm9hcmRSZXBvc2l0b3J5KSA9PiB7XG4gICAgJHNjb3BlLnBsYWNlaG9sZGVyID0gXCJQYXN0ZSB0aGUgSlNPTiBoZXJlIGZvciB0aGUgZGFzaGJvYXJkIGNvbmZpZ3VyYXRpb24gdG8gaW1wb3J0Li4uXCI7XG4gICAgJHNjb3BlLnNvdXJjZSA9ICRzY29wZS5wbGFjZWhvbGRlcjtcblxuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgbW9kZToge1xuICAgICAgICBuYW1lOiBcImphdmFzY3JpcHRcIlxuICAgICAgfVxuICAgIH07XG4gICAgLy8kc2NvcGUuY29kZU1pcnJvck9wdGlvbnMgPSBDb2RlRWRpdG9yLmNyZWF0ZUVkaXRvclNldHRpbmdzKG9wdGlvbnMpO1xuXG5cbiAgICAkc2NvcGUuaXNWYWxpZCA9ICgpID0+ICRzY29wZS5zb3VyY2UgJiYgJHNjb3BlLnNvdXJjZSAhPT0gJHNjb3BlLnBsYWNlaG9sZGVyO1xuXG4gICAgJHNjb3BlLmltcG9ydEpTT04gPSAoKSA9PiB7XG4gICAgICB2YXIganNvbiA9IFtdO1xuICAgICAgLy8gbGV0cyBwYXJzZSB0aGUgSlNPTi4uLlxuICAgICAgdHJ5IHtcbiAgICAgICAganNvbiA9IEpTT04ucGFyc2UoJHNjb3BlLnNvdXJjZSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vSGF3dGlvQ29yZS5ub3RpZmljYXRpb24oXCJlcnJvclwiLCBcIkNvdWxkIG5vdCBwYXJzZSB0aGUgSlNPTlxcblwiICsgZSk7XG4gICAgICAgIGpzb24gPSBbXTtcbiAgICAgIH1cbiAgICAgIHZhciBhcnJheSA9IFtdO1xuICAgICAgaWYgKGFuZ3VsYXIuaXNBcnJheShqc29uKSkge1xuICAgICAgICBhcnJheSA9IGpzb247XG4gICAgICB9IGVsc2UgaWYgKGFuZ3VsYXIuaXNPYmplY3QoanNvbikpIHtcbiAgICAgICAgYXJyYXkucHVzaChqc29uKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFycmF5Lmxlbmd0aCkge1xuICAgICAgICAvLyBsZXRzIGVuc3VyZSB3ZSBoYXZlIHNvbWUgdmFsaWQgaWRzIGFuZCBzdHVmZi4uLlxuICAgICAgICBhbmd1bGFyLmZvckVhY2goYXJyYXksIChkYXNoLCBpbmRleCkgPT4ge1xuICAgICAgICAgIGFuZ3VsYXIuY29weShkYXNoLCBkYXNoYm9hcmRSZXBvc2l0b3J5LmNyZWF0ZURhc2hib2FyZChkYXNoKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoYXJyYXksIFwiSW1wb3J0ZWQgZGFzaGJvYXJkIEpTT05cIiwgRGFzaGJvYXJkLm9uT3BlcmF0aW9uQ29tcGxldGUpO1xuICAgICAgICAkbG9jYXRpb24ucGF0aChcIi9kYXNoYm9hcmQvZWRpdFwiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1dKTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuICBfbW9kdWxlLmNvbnRyb2xsZXIoXCJEYXNoYm9hcmQuTmF2QmFyQ29udHJvbGxlclwiLCBbXCIkc2NvcGVcIiwgXCIkcm91dGVQYXJhbXNcIiwgXCIkcm9vdFNjb3BlXCIsIFwiZGFzaGJvYXJkUmVwb3NpdG9yeVwiLCAoJHNjb3BlLCAkcm91dGVQYXJhbXMsICRyb290U2NvcGUsIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSkgPT4ge1xuXG4gICAgJHNjb3BlLl9kYXNoYm9hcmRzID0gW107XG5cbiAgICAkc2NvcGUuYWN0aXZlRGFzaGJvYXJkID0gJHJvdXRlUGFyYW1zWydkYXNoYm9hcmRJZCddO1xuXG4gICAgJHNjb3BlLiRvbignbG9hZERhc2hib2FyZHMnLCBsb2FkRGFzaGJvYXJkcyk7XG5cbiAgICAkc2NvcGUuJG9uKCdkYXNoYm9hcmRzVXBkYXRlZCcsIGRhc2hib2FyZExvYWRlZCk7XG5cbiAgICAkc2NvcGUuZGFzaGJvYXJkcyA9ICgpID0+IHtcbiAgICAgIHJldHVybiAkc2NvcGUuX2Rhc2hib2FyZHNcbiAgICB9O1xuXG4gICAgJHNjb3BlLm9uVGFiUmVuYW1lZCA9IGZ1bmN0aW9uKGRhc2gpIHtcbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbZGFzaF0sIFwiUmVuYW1lZCBkYXNoYm9hcmRcIiwgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGRhc2hib2FyZExvYWRlZChldmVudCwgZGFzaGJvYXJkcykge1xuICAgICAgbG9nLmRlYnVnKFwibmF2YmFyIGRhc2hib2FyZExvYWRlZDogXCIsIGRhc2hib2FyZHMpO1xuICAgICAgJHNjb3BlLl9kYXNoYm9hcmRzID0gZGFzaGJvYXJkcztcbiAgICAgIGlmIChldmVudCA9PT0gbnVsbCkge1xuICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkcyk7XG4gICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbG9hZERhc2hib2FyZHMoZXZlbnQpIHtcbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkcygoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAvLyBwcmV2ZW50IHRoZSBicm9hZGNhc3QgZnJvbSBoYXBwZW5pbmcuLi5cbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgICBDb3JlLiRhcHBseSgkc2NvcGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XSk7XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcbiAgZXhwb3J0IHZhciBTaGFyZUNvbnRyb2xsZXIgPSBfbW9kdWxlLmNvbnRyb2xsZXIoXCJEYXNoYm9hcmQuU2hhcmVDb250cm9sbGVyXCIsIFtcIiRzY29wZVwiLCBcIiRsb2NhdGlvblwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgKCRzY29wZSwgJGxvY2F0aW9uLCAkcm91dGVQYXJhbXMsIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSkgPT4ge1xuICAgIHZhciBpZCA9ICRyb3V0ZVBhcmFtc1tcImRhc2hib2FyZElkXCJdO1xuICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkKGlkLCBvbkRhc2hib2FyZExvYWQpO1xuXG4gICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICBtb2RlOiB7XG4gICAgICAgICAgbmFtZTogXCJqYXZhc2NyaXB0XCJcbiAgICAgIH1cbiAgICB9O1xuICAgIC8vJHNjb3BlLmNvZGVNaXJyb3JPcHRpb25zID0gQ29kZUVkaXRvci5jcmVhdGVFZGl0b3JTZXR0aW5ncyhvcHRpb25zKTtcblxuICAgIGZ1bmN0aW9uIG9uRGFzaGJvYXJkTG9hZChkYXNoYm9hcmQpIHtcbiAgICAgICRzY29wZS5kYXNoYm9hcmQgPSBEYXNoYm9hcmQuY2xlYW5EYXNoYm9hcmREYXRhKGRhc2hib2FyZCk7XG5cbiAgICAgICRzY29wZS5qc29uID0ge1xuICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiaGF3dGlvIGRhc2hib2FyZHNcIixcbiAgICAgICAgXCJwdWJsaWNcIjogdHJ1ZSxcbiAgICAgICAgXCJmaWxlc1wiOiB7XG4gICAgICAgICAgXCJkYXNoYm9hcmRzLmpzb25cIjoge1xuICAgICAgICAgICAgXCJjb250ZW50XCI6IEpTT04uc3RyaW5naWZ5KCRzY29wZS5kYXNoYm9hcmQsIG51bGwsIFwiICBcIilcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5zb3VyY2UgPSBKU09OLnN0cmluZ2lmeSgkc2NvcGUuZGFzaGJvYXJkLCBudWxsLCBcIiAgXCIpO1xuICAgICAgQ29yZS4kYXBwbHlOb3dPckxhdGVyKCRzY29wZSk7XG4gICAgfVxuICB9XSk7XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

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