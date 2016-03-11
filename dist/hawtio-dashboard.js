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
    })();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluY2x1ZGVzLmpzIiwiZGFzaGJvYXJkL3RzL2Rhc2hib2FyZEludGVyZmFjZXMudHMiLCJkYXNoYm9hcmQvdHMvZGFzaGJvYXJkSGVscGVycy50cyIsImRhc2hib2FyZC90cy9kYXNoYm9hcmRQbHVnaW4udHMiLCJkYXNoYm9hcmQvdHMvZGFzaGJvYXJkUmVwb3NpdG9yeS50cyIsImRhc2hib2FyZC90cy9lZGl0RGFzaGJvYXJkcy50cyIsImRhc2hib2FyZC90cy9yZWN0YW5nbGVMb2NhdGlvbi50cyIsImRhc2hib2FyZC90cy9ncmlkc3RlckRpcmVjdGl2ZS50cyIsImRhc2hib2FyZC90cy9pbXBvcnQudHMiLCJkYXNoYm9hcmQvdHMvbmF2YmFyLnRzIiwiZGFzaGJvYXJkL3RzL3NoYXJlLnRzIl0sIm5hbWVzIjpbIkRhc2hib2FyZCIsIkRhc2hib2FyZC5jbGVhbkRhc2hib2FyZERhdGEiLCJEYXNoYm9hcmQuZGVjb2RlVVJJQ29tcG9uZW50UHJvcGVydGllcyIsIkRhc2hib2FyZC5vbk9wZXJhdGlvbkNvbXBsZXRlIiwiRGFzaGJvYXJkLnNldFN1YlRhYnMiLCJEYXNoYm9hcmQuZ2V0RHVtbXlCdWlsZGVyIiwiRGFzaGJvYXJkLmdldER1bW15QnVpbGRlckZhY3RvcnkiLCJEYXNoYm9hcmQuZ2V0RHVtbXlIYXd0aW9OYXYiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5IiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5jb25zdHJ1Y3RvciIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkubG9hZERhc2hib2FyZHMiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5LnN0b3JlRGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZGVsZXRlRGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkIiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5jcmVhdGVEYXNoYm9hcmQiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5LmNsb25lRGFzaGJvYXJkIiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlIiwiRGFzaGJvYXJkLnVwZGF0ZURhdGEiLCJEYXNoYm9hcmQuZGFzaGJvYXJkTG9hZGVkIiwiRGFzaGJvYXJkLmRhc2hib2FyZHMiLCJEYXNoYm9hcmQuZGVzZWxlY3RBbGwiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24iLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uY29uc3RydWN0b3IiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uYWJzVXJsIiwiRGFzaGJvYXJkLlJlY3RhbmdsZUxvY2F0aW9uLmhhc2giLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uaG9zdCIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbi5wYXRoIiwiRGFzaGJvYXJkLlJlY3RhbmdsZUxvY2F0aW9uLnBvcnQiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24ucHJvdG9jb2wiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24ucmVwbGFjZSIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbi5zZWFyY2giLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24udXJsIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLmRlc3Ryb3lXaWRnZXQiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3IucmVtb3ZlV2lkZ2V0IiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLmNoYW5nZVdpZGdldFNpemUiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3Iub25XaWRnZXRSZW5hbWVkIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLnVwZGF0ZVdpZGdldHMiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3Iub25EYXNoYm9hcmRMb2FkIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLm9uRGFzaGJvYXJkTG9hZC5tYXliZUZpbmlzaFVwIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLm9uRGFzaGJvYXJkTG9hZC5kb1JlbW92ZVdpZGdldCIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5vbkRhc2hib2FyZExvYWQuZG9SZW5hbWVXaWRnZXQiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3Iub25EYXNoYm9hcmRMb2FkLmdldFNlcnZpY2VzIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLnNlcmlhbGl6ZURhc2hib2FyZCIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5tYWtlUmVzaXphYmxlIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLnJlc2l6ZUJsb2NrIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLnVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3IuZ2V0R3JpZHN0ZXIiLCJEYXNoYm9hcmQubG9hZERhc2hib2FyZHMiLCJEYXNoYm9hcmQub25EYXNoYm9hcmRMb2FkIl0sIm1h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QSxTQUFTQSxDQUFDQSxZQUFZQSxDQUFDQSxHQUFHQSxVQUFDQSxLQUFhQSxFQUFFQSxNQUFjQSxFQUFFQSxNQUFjQTt3QkFDdEVBLElBQUlBLE1BQU1BLEdBQUdBLElBQUlBLEdBQUdBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsQ0FBQ0E7d0JBQ3ZDQSxJQUFJQSxVQUFVQSxHQUFHQSxJQUFJQSxHQUFHQSxFQUFFQSxDQUFDQTt3QkFLM0JBLElBQUlBLFNBQVNBLEdBQUdBLElBQUlBLEdBQUdBLENBQUNBLFVBQVVBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBLENBQUNBO3dCQUMzQ0EsU0FBU0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQ3hDQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQSxVQUFDQSxLQUFLQTs0QkFDakJBLEtBQUtBLENBQUNBLElBQUlBLEdBQUdBLEdBQUdBLENBQUNBLGNBQWNBLENBQUNBLFNBQVNBLENBQUNBLFFBQVFBLEVBQUVBLENBQUNBLENBQUFBOzRCQUNyREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0NBQ1ZBLEtBQUtBLENBQUNBLEtBQUtBLEdBQUdBLEdBQUdBLENBQUNBLGNBQWNBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBOzRCQUMxQ0EsQ0FBQ0E7NEJBQ0RBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLElBQUlBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBO2dDQUNyQkEsS0FBS0EsQ0FBQ0EsSUFBSUEsR0FBR0EsR0FBR0EsQ0FBQ0EsY0FBY0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsRUFBQ0EsTUFBTUEsRUFBRUEsTUFBTUEsRUFBRUEsTUFBTUEsRUFBRUEsTUFBTUEsRUFBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7NEJBQ3BGQSxDQUFDQTt3QkFDSEEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQ0hBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBLFFB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QSxTQUFTQSxFQUFFQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxTQUFTQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxDQUFDQTt5QkFDeERBO3FCQUNGQTtpQkFDRkEsQ0FBQ0E7Z0JBRUZBLE1BQU1BLENBQUNBLE1BQU1BLEdBQUdBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBLFNBQVNBLEVBQUVBLElBQUlBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO2dCQUM3REEsSUFBSUEsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtZQUNoQ0EsQ0FBQ0E7UUFDSHBELENBQUNBLENBQUNBLENBQUNBLENBQUNBO0FBQ05BLENBQUNBLEVBN0JNLFNBQVMsS0FBVCxTQUFTLFFBNkJmIiwiZmlsZSI6ImNvbXBpbGVkLmpzIiwic291cmNlc0NvbnRlbnQiOltudWxsLCJtb2R1bGUgRGFzaGJvYXJkIHtcblxuICBleHBvcnQgaW50ZXJmYWNlIERhc2hib2FyZFNlcnZpY2Uge1xuICAgIGhhc0Rhc2hib2FyZDpib29sZWFuO1xuICAgIGluRGFzaGJvYXJkOmJvb2xlYW47XG4gICAgZ2V0QWRkTGluayh0aXRsZT86c3RyaW5nLCB3aWR0aD86bnVtYmVyLCBoZWlnaHQ/Om51bWJlcik6c3RyaW5nO1xuICB9XG5cbiAgZXhwb3J0IGludGVyZmFjZSBTZWFyY2hNYXAge1xuICAgIFtuYW1lOiBzdHJpbmddOiBzdHJpbmc7XG4gIH1cblxuICBleHBvcnQgaW50ZXJmYWNlIERhc2hib2FyZFdpZGdldCB7XG4gICAgaWQ6IHN0cmluZztcbiAgICB0aXRsZTogc3RyaW5nO1xuICAgIHJvdz86IG51bWJlcjtcbiAgICBjb2w/OiBudW1iZXI7XG4gICAgc2l6ZV94PzogbnVtYmVyO1xuICAgIHNpemVfeT86IG51bWJlcjtcbiAgICBwYXRoPzogc3RyaW5nO1xuICAgIHVybD86IHN0cmluZztcbiAgICBpbmNsdWRlPzogc3RyaW5nO1xuICAgIHNlYXJjaD86IFNlYXJjaE1hcFxuICAgIHJvdXRlUGFyYW1zPzogc3RyaW5nO1xuICB9XG5cbiAgZXhwb3J0IGludGVyZmFjZSBEYXNoYm9hcmQge1xuICAgIGlkOiBzdHJpbmc7XG4gICAgdGl0bGU6IHN0cmluZztcbiAgICBncm91cDogc3RyaW5nO1xuICAgIHdpZGdldHM6IEFycmF5PERhc2hib2FyZFdpZGdldD47XG4gIH1cblxuICBleHBvcnQgaW50ZXJmYWNlIERlZmF1bHREYXNoYm9hcmRzIHtcbiAgICBhZGQ6IChkYXNoYmFyZDpEYXNoYm9hcmQpID0+IHZvaWQ7XG4gICAgcmVtb3ZlOiAoaWQ6c3RyaW5nKSA9PiBEYXNoYm9hcmQ7XG4gICAgZ2V0QWxsOiAoKSA9PiBBcnJheTxEYXNoYm9hcmQ+O1xuICB9XG5cbiAgLyoqXG4gICAqIEJhc2UgaW50ZXJmYWNlIHRoYXQgZGFzaGJvYXJkIHJlcG9zaXRvcmllcyBtdXN0IGltcGxlbWVudFxuICAgKlxuICAgKiBAY2xhc3MgRGFzaGJvYXJkUmVwb3NpdG9yeVxuICAgKi9cbiAgZXhwb3J0IGludGVyZmFjZSBEYXNoYm9hcmRSZXBvc2l0b3J5IHtcbiAgICBwdXREYXNoYm9hcmRzOiAoYXJyYXk6YW55W10sIGNvbW1pdE1lc3NhZ2U6c3RyaW5nLCBmbikgPT4gYW55O1xuICAgIGRlbGV0ZURhc2hib2FyZHM6IChhcnJheTpBcnJheTxEYXNoYm9hcmQ+LCBmbikgPT4gYW55O1xuICAgIGdldERhc2hib2FyZHM6IChmbjooZGFzaGJvYXJkczogQXJyYXk8RGFzaGJvYXJkPikgPT4gdm9pZCkgPT4gdm9pZDtcbiAgICBnZXREYXNoYm9hcmQ6IChpZDpzdHJpbmcsIGZuOiAoZGFzaGJvYXJkOiBEYXNoYm9hcmQpID0+IHZvaWQpID0+IGFueTtcbiAgICBjcmVhdGVEYXNoYm9hcmQ6IChvcHRpb25zOmFueSkgPT4gYW55O1xuICAgIGNsb25lRGFzaGJvYXJkOihkYXNoYm9hcmQ6YW55KSA9PiBhbnk7XG4gICAgZ2V0VHlwZTooKSA9PiBzdHJpbmc7XG4gIH1cblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL2luY2x1ZGVzLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZEludGVyZmFjZXMudHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuICBcbiAgZXhwb3J0IHZhciB0ZW1wbGF0ZVBhdGggPSAncGx1Z2lucy9kYXNoYm9hcmQvaHRtbC8nO1xuICBleHBvcnQgdmFyIHBsdWdpbk5hbWUgPSAnZGFzaGJvYXJkJztcblxuICBleHBvcnQgdmFyIGxvZzpMb2dnaW5nLkxvZ2dlciA9IExvZ2dlci5nZXQoJ2hhd3Rpby1kYXNoYm9hcmQnKTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY2xlYW5lZCB1cCB2ZXJzaW9uIG9mIHRoZSBkYXNoYm9hcmQgZGF0YSB3aXRob3V0IGFueSBVSSBzZWxlY3Rpb24gc3RhdGVcbiAgICogQG1ldGhvZCBjbGVhbkRhc2hib2FyZERhdGFcbiAgICogQHN0YXRpY1xuICAgKiBAZm9yIERhc2hib2FyZFxuICAgKiBAcGFyYW0ge2FueX0gaXRlbVxuICAgKiBAcmV0dXJuIHthbnl9XG4gICAqL1xuICBleHBvcnQgZnVuY3Rpb24gY2xlYW5EYXNoYm9hcmREYXRhKGl0ZW0pIHtcbiAgICB2YXIgY2xlYW5JdGVtID0ge307XG4gICAgYW5ndWxhci5mb3JFYWNoKGl0ZW0sICh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICBpZiAoIWFuZ3VsYXIuaXNTdHJpbmcoa2V5KSB8fCAoIWtleS5zdGFydHNXaXRoKFwiJFwiKSAmJiAha2V5LnN0YXJ0c1dpdGgoXCJfXCIpKSkge1xuICAgICAgICBjbGVhbkl0ZW1ba2V5XSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBjbGVhbkl0ZW07XG4gIH1cblxuICAvKipcbiAgICogUnVucyBkZWNvZGVVUklDb21wb25lbnQoKSBvbiBlYWNoIHZhbHVlIGluIHRoZSBvYmplY3RcbiAgICogQG1ldGhvZCBkZWNvZGVVUklDb21wb25lbnRQcm9wZXJ0aWVzXG4gICAqIEBzdGF0aWNcbiAgICogQGZvciBEYXNoYm9hcmRcbiAgICogQHBhcmFtIHthbnl9IGhhc2hcbiAgICogQHJldHVybiB7YW55fVxuICAgKi9cbiAgZXhwb3J0IGZ1bmN0aW9uIGRlY29kZVVSSUNvbXBvbmVudFByb3BlcnRpZXMoaGFzaCkge1xuICAgIGlmICghaGFzaCkge1xuICAgICAgcmV0dXJuIGhhc2g7XG4gICAgfVxuICAgIHZhciBkZWNvZGVIYXNoID0ge307XG4gICAgYW5ndWxhci5mb3JFYWNoKGhhc2gsICh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICBkZWNvZGVIYXNoW2tleV0gPSB2YWx1ZSA/IGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkgOiB2YWx1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVjb2RlSGFzaDtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBvbk9wZXJhdGlvbkNvbXBsZXRlKHJlc3VsdCkge1xuICAgIGNvbnNvbGUubG9nKFwiQ29tcGxldGVkIGFkZGluZyB0aGUgZGFzaGJvYXJkIHdpdGggcmVzcG9uc2UgXCIgKyBKU09OLnN0cmluZ2lmeShyZXN1bHQpKTtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBzZXRTdWJUYWJzKHRhYjphbnksIGJ1aWxkZXIsIGRhc2hib2FyZHM6QXJyYXk8RGFzaGJvYXJkPiwgJHJvb3RTY29wZSkge1xuICAgIGlmICghdGFiIHx8IHRhYi5lbWJlZGRlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH0gXG4gICAgbG9nLmRlYnVnKFwiVXBkYXRpbmcgc3ViLXRhYnNcIik7XG4gICAgaWYgKCF0YWIudGFicykge1xuICAgICAgdGFiLnRhYnMgPSBbXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGFiLnRhYnMubGVuZ3RoID0gMDtcbiAgICB9XG4gICAgbG9nLmRlYnVnKFwidGFiOiBcIiwgdGFiKTtcbiAgICBsb2cuZGVidWcoXCJkYXNoYm9hcmRzOiBcIiwgZGFzaGJvYXJkcyk7XG4gICAgXy5mb3JFYWNoKGRhc2hib2FyZHMsIChkYXNoYm9hcmQpID0+IHtcbiAgICAgIHZhciBjaGlsZCA9IGJ1aWxkZXJcbiAgICAgICAgLmlkKCdkYXNoYm9hcmQtJyArIGRhc2hib2FyZC5pZClcbiAgICAgICAgLnRpdGxlKCgpID0+IGRhc2hib2FyZC50aXRsZSB8fCBkYXNoYm9hcmQuaWQpXG4gICAgICAgIC5ocmVmKCgpID0+IHtcbiAgICAgICAgICB2YXIgdXJpID0gbmV3IFVSSShVcmxIZWxwZXJzLmpvaW4oJy9kYXNoYm9hcmQvaWQnLCBkYXNoYm9hcmQuaWQpKVxuICAgICAgICAgICAgdXJpLnNlYXJjaCh7XG4gICAgICAgICAgICAgICdtYWluLXRhYic6IHBsdWdpbk5hbWUsXG4gICAgICAgICAgICAgICdzdWItdGFiJzogJ2Rhc2hib2FyZC0nICsgZGFzaGJvYXJkLmlkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gdXJpLnRvU3RyaW5nKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5idWlsZCgpO1xuICAgICAgdGFiLnRhYnMucHVzaChjaGlsZCk7XG4gICAgfSk7XG4gICAgdmFyIG1hbmFnZSA9IGJ1aWxkZXJcbiAgICAgIC5pZCgnZGFzaGJvYXJkLW1hbmFnZScpXG4gICAgICAudGl0bGUoKCkgPT4gJzxpIGNsYXNzPVwiZmEgZmEtcGVuY2lsXCI+PC9pPiZuYnNwO01hbmFnZScpXG4gICAgICAuaHJlZigoKSA9PiAnL2Rhc2hib2FyZC9lZGl0P21haW4tdGFiPWRhc2hib2FyZCZzdWItdGFiPWRhc2hib2FyZC1tYW5hZ2UnKVxuICAgICAgLmJ1aWxkKCk7XG4gICAgdGFiLnRhYnMucHVzaChtYW5hZ2UpO1xuICAgIHRhYi50YWJzLmZvckVhY2goKHRhYikgPT4ge1xuICAgICAgdGFiLmlzU2VsZWN0ZWQgPSAoKSA9PiB7XG4gICAgICAgIHZhciBpZCA9IHRhYi5pZC5yZXBsYWNlKCdkYXNoYm9hcmQtJywgJycpO1xuICAgICAgICB2YXIgdXJpID0gbmV3IFVSSSgpO1xuICAgICAgICByZXR1cm4gdXJpLnF1ZXJ5KHRydWUpWydzdWItdGFiJ10gPT09IHRhYi5pZCB8fCBfLmVuZHNXaXRoKHVyaS5wYXRoKCksIGlkKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBsb2cuZGVidWcoXCJVcGRhdGVkIG1haW4gdGFiIHRvOiBcIiwgdGFiKTtcbiAgICAvLyRyb290U2NvcGUuJGJyb2FkY2FzdCgnaGF3dGlvLW5hdi1yZWRyYXcnKTtcbiAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2hhd3Rpby1uYXYtc3VidGFiLXJlZHJhdycpO1xuICAgIENvcmUuJGFwcGx5KCRyb290U2NvcGUpO1xuICB9XG5cblxuICBleHBvcnQgZnVuY3Rpb24gZ2V0RHVtbXlCdWlsZGVyKCkge1xuICAgIHZhciBzZWxmID0ge1xuICAgICAgaWQ6ICgpID0+IHNlbGYsXG4gICAgICBkZWZhdWx0UGFnZTogKCkgPT4gc2VsZixcbiAgICAgIHJhbms6ICgpID0+IHNlbGYsXG4gICAgICByZWxvYWQ6ICgpID0+IHNlbGYsXG4gICAgICBwYWdlOiAoKSA9PiBzZWxmLFxuICAgICAgdGl0bGU6ICgpID0+IHNlbGYsXG4gICAgICB0b29sdGlwOiAoKSA9PiBzZWxmLFxuICAgICAgY29udGV4dDogKCkgPT4gc2VsZixcbiAgICAgIGF0dHJpYnV0ZXM6ICgpID0+IHNlbGYsXG4gICAgICBsaW5rQXR0cmlidXRlczogKCkgPT4gc2VsZixcbiAgICAgIGhyZWY6ICgpID0+IHNlbGYsXG4gICAgICBjbGljazogKCkgPT4gc2VsZixcbiAgICAgIGlzVmFsaWQ6ICgpID0+IHNlbGYsXG4gICAgICBzaG93OiAoKSA9PiBzZWxmLFxuICAgICAgaXNTZWxlY3RlZDogKCkgPT4gc2VsZixcbiAgICAgIHRlbXBsYXRlOiAoKSA9PiBzZWxmLFxuICAgICAgdGFiczogKCkgPT4gc2VsZixcbiAgICAgIHN1YlBhdGg6ICgpID0+IHNlbGYsXG4gICAgICBidWlsZDogKCkgPT4ge31cbiAgICB9XG4gICAgcmV0dXJuIHNlbGY7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gZ2V0RHVtbXlCdWlsZGVyRmFjdG9yeSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY3JlYXRlOiAoKSA9PiBnZXREdW1teUJ1aWxkZXIoKSxcbiAgICAgIGpvaW46ICgpID0+ICcnLFxuICAgICAgY29uZmlndXJlUm91dGluZzogKCkgPT4ge31cbiAgICB9XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gZ2V0RHVtbXlIYXd0aW9OYXYoKSB7XG4gICAgdmFyIG5hdiA9IHtcbiAgICAgIGJ1aWxkZXI6ICgpID0+IGdldER1bW15QnVpbGRlcigpLFxuICAgICAgYWRkOiAoKSA9PiB7fSxcbiAgICAgIHJlbW92ZTogKCkgPT4gW10sXG4gICAgICBpdGVyYXRlOiAoKSA9PiBudWxsLFxuICAgICAgb246ICgpID0+IHVuZGVmaW5lZCxcbiAgICAgIHNlbGVjdGVkOiAoKSA9PiB1bmRlZmluZWRcbiAgICB9XG4gICAgcmV0dXJuIG5hdjtcbiAgfVxufVxuIiwiLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICogQG1haW4gRGFzaGJvYXJkXG4gKi9cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRIZWxwZXJzLnRzXCIvPlxubW9kdWxlIERhc2hib2FyZCB7XG4gIFxuICBleHBvcnQgdmFyIF9tb2R1bGUgPSBhbmd1bGFyLm1vZHVsZShwbHVnaW5OYW1lLCBbXSk7XG5cbiAgX21vZHVsZS5jb25maWcoW1wiJHJvdXRlUHJvdmlkZXJcIiwgXCIkcHJvdmlkZVwiLCAoJHJvdXRlUHJvdmlkZXIsICRwcm92aWRlKSA9PiB7XG5cbiAgICAkcHJvdmlkZS5kZWNvcmF0b3IoJ0hhd3Rpb0Rhc2hib2FyZCcsIFsnJGRlbGVnYXRlJywgKCRkZWxlZ2F0ZSkgPT4ge1xuICAgICAgJGRlbGVnYXRlWydoYXNEYXNoYm9hcmQnXSA9IHRydWU7XG4gICAgICAkZGVsZWdhdGVbJ2dldEFkZExpbmsnXSA9ICh0aXRsZT86c3RyaW5nLCBzaXplX3g/Om51bWJlciwgc2l6ZV95PzpudW1iZXIpID0+IHtcbiAgICAgICAgdmFyIHRhcmdldCA9IG5ldyBVUkkoJy9kYXNoYm9hcmQvYWRkJyk7XG4gICAgICAgIHZhciBjdXJyZW50VXJpID0gbmV3IFVSSSgpO1xuICAgICAgICAvKlxuICAgICAgICBjdXJyZW50VXJpLnJlbW92ZVF1ZXJ5KCdtYWluLXRhYicpO1xuICAgICAgICBjdXJyZW50VXJpLnJlbW92ZVF1ZXJ5KCdzdWItdGFiJyk7XG4gICAgICAgICovXG4gICAgICAgIHZhciB3aWRnZXRVcmkgPSBuZXcgVVJJKGN1cnJlbnRVcmkucGF0aCgpKTtcbiAgICAgICAgd2lkZ2V0VXJpLnF1ZXJ5KGN1cnJlbnRVcmkucXVlcnkodHJ1ZSkpO1xuICAgICAgICB0YXJnZXQucXVlcnkoKHF1ZXJ5KSA9PiB7XG4gICAgICAgICAgcXVlcnkuaHJlZiA9IFVSSS5lbmNvZGVSZXNlcnZlZCh3aWRnZXRVcmkudG9TdHJpbmcoKSlcbiAgICAgICAgICBpZiAodGl0bGUpIHtcbiAgICAgICAgICAgIHF1ZXJ5LnRpdGxlID0gVVJJLmVuY29kZVJlc2VydmVkKHRpdGxlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHNpemVfeCAmJiBzaXplX3kpIHtcbiAgICAgICAgICAgIHF1ZXJ5LnNpemUgPSBVUkkuZW5jb2RlUmVzZXJ2ZWQoYW5ndWxhci50b0pzb24oe3NpemVfeDogc2l6ZV94LCBzaXplX3k6IHNpemVfeX0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGFyZ2V0LnRvU3RyaW5nKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gJGRlbGVnYXRlO1xuICAgIH1dKTtcblxuICAgICRyb3V0ZVByb3ZpZGVyLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9hZGQnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnYWRkVG9EYXNoYm9hcmQuaHRtbCd9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvZWRpdCcsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdlZGl0RGFzaGJvYXJkcy5odG1sJ30pLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9pZHgvOmRhc2hib2FyZEluZGV4Jywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2Rhc2hib2FyZC5odG1sJywgcmVsb2FkT25TZWFyY2g6IGZhbHNlIH0pLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9pZC86ZGFzaGJvYXJkSWQnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnZGFzaGJvYXJkLmh0bWwnLCByZWxvYWRPblNlYXJjaDogZmFsc2UgfSkuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2lkLzpkYXNoYm9hcmRJZC9zaGFyZScsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdzaGFyZS5odG1sJ30pLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9pbXBvcnQnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnaW1wb3J0Lmh0bWwnfSk7XG4gIH1dKTtcblxuICBfbW9kdWxlLnZhbHVlKCd1aS5jb25maWcnLCB7XG4gICAgLy8gVGhlIHVpLWpxIGRpcmVjdGl2ZSBuYW1lc3BhY2VcbiAgICBqcToge1xuICAgICAgZ3JpZHN0ZXI6IHtcbiAgICAgICAgd2lkZ2V0X21hcmdpbnM6IFsxMCwgMTBdLFxuICAgICAgICB3aWRnZXRfYmFzZV9kaW1lbnNpb25zOiBbMTQwLCAxNDBdXG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBfbW9kdWxlLmZhY3RvcnkoJ0hhd3Rpb0Rhc2hib2FyZFRhYicsIFsnSGF3dGlvTmF2JywgJ0hhd3Rpb0Rhc2hib2FyZCcsICckdGltZW91dCcsICckcm9vdFNjb3BlJywgJ2Rhc2hib2FyZFJlcG9zaXRvcnknLCAnJGxvY2F0aW9uJywgKG5hdjpIYXd0aW9NYWluTmF2LlJlZ2lzdHJ5LCBkYXNoOkRhc2hib2FyZFNlcnZpY2UsICR0aW1lb3V0LCAkcm9vdFNjb3BlLCBkYXNoYm9hcmRzOkRhc2hib2FyZFJlcG9zaXRvcnksICRsb2NhdGlvbikgPT4ge1xuICAgIHZhciB0YWIgPSA8YW55PiB7XG4gICAgICBlbWJlZGRlZDogdHJ1ZVxuICAgIH07XG4gICAgaWYgKGRhc2guaW5EYXNoYm9hcmQpIHtcbiAgICAgIGxvZy5kZWJ1ZyhcIkVtYmVkZGVkIGluIGEgZGFzaGJvYXJkLCBub3QgaW5pdGlhbGl6aW5nIG91ciBuYXZpZ2F0aW9uIHRhYlwiKTtcbiAgICAgIHJldHVybiB0YWI7XG4gICAgfVxuICAgIC8vIHNwZWNpYWwgY2FzZSBoZXJlLCB3ZSBkb24ndCB3YW50IHRvIG92ZXJ3cml0ZSBvdXIgc3RvcmVkIHRhYiFcbiAgICB2YXIgYnVpbGRlciA9IG5hdi5idWlsZGVyKCk7XG4gICAgdGFiID0gYnVpbGRlci5pZChwbHVnaW5OYW1lKVxuICAgICAgICAgICAgICAgICAgLmhyZWYoKCkgPT4gJy9kYXNoYm9hcmQvaWR4LzAnKVxuICAgICAgICAgICAgICAgICAgLmlzU2VsZWN0ZWQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXy5zdGFydHNXaXRoKCRsb2NhdGlvbi5wYXRoKCksICcvZGFzaGJvYXJkLycpO1xuICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgIC50aXRsZSgoKSA9PiAnRGFzaGJvYXJkJylcbiAgICAgICAgICAgICAgICAgIC5idWlsZCgpO1xuICAgIG5hdi5hZGQodGFiKTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGxvZy5kZWJ1ZyhcIlNldHRpbmcgdXAgZGFzaGJvYXJkIHN1Yi10YWJzXCIpO1xuICAgICAgZGFzaGJvYXJkcy5nZXREYXNoYm9hcmRzKChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIHNldFN1YlRhYnModGFiLCBidWlsZGVyLCBkYXNoYm9hcmRzLCAkcm9vdFNjb3BlKTtcbiAgICAgIH0pO1xuICAgIH0sIDUwMCk7XG4gICAgbG9nLmRlYnVnKFwiTm90IGVtYmVkZGVkIGluIGEgZGFzaGJvYXJkLCByZXR1cm5pbmcgcHJvcGVyIHRhYlwiKTtcbiAgICByZXR1cm4gdGFiO1xuICB9XSk7XG5cbiAgX21vZHVsZS5ydW4oW1wiSGF3dGlvRGFzaGJvYXJkVGFiXCIsIChIYXd0aW9EYXNoYm9hcmRUYWIpID0+IHtcbiAgICBsb2cuZGVidWcoXCJydW5uaW5nXCIpO1xuICB9XSk7XG5cbiAgaGF3dGlvUGx1Z2luTG9hZGVyLmFkZE1vZHVsZShwbHVnaW5OYW1lKTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkSW50ZXJmYWNlcy50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG5cbiAgX21vZHVsZS5mYWN0b3J5KCdkYXNoYm9hcmRSZXBvc2l0b3J5JywgWydEZWZhdWx0RGFzaGJvYXJkcycsIChkZWZhdWx0czpEZWZhdWx0RGFzaGJvYXJkcykgPT4ge1xuICAgIHJldHVybiBuZXcgTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5KGRlZmF1bHRzKTtcbiAgfV0pO1xuXG4gIF9tb2R1bGUuZmFjdG9yeSgnRGVmYXVsdERhc2hib2FyZHMnLCBbKCkgPT4ge1xuICAgIHZhciBkZWZhdWx0cyA9IDxBcnJheTxEYXNoYm9hcmQ+PltdO1xuICAgIHZhciBhbnN3ZXIgPSB7XG4gICAgICBhZGQ6IChkYXNoYm9hcmQ6RGFzaGJvYXJkKSA9PiB7XG4gICAgICAgIGRlZmF1bHRzLnB1c2goZGFzaGJvYXJkKTtcbiAgICAgIH0sXG4gICAgICByZW1vdmU6IChpZDpzdHJpbmcpID0+IHtcbiAgICAgICAgcmV0dXJuIF8ucmVtb3ZlKGRlZmF1bHRzLCAoZGFzaGJvYXJkKSA9PiBkYXNoYm9hcmQuaWQgPT09IGlkKTtcbiAgICAgIH0sXG4gICAgICBnZXRBbGw6ICgpID0+IGRlZmF1bHRzXG4gICAgfVxuICAgIHJldHVybiBhbnN3ZXI7XG4gIH1dKTtcblxuICAvKipcbiAgICogQGNsYXNzIExvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeVxuICAgKiBAdXNlcyBEYXNoYm9hcmRSZXBvc2l0b3J5XG4gICAqL1xuICBleHBvcnQgY2xhc3MgTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5IGltcGxlbWVudHMgRGFzaGJvYXJkUmVwb3NpdG9yeSB7XG5cbiAgICBwcml2YXRlIGxvY2FsU3RvcmFnZTpXaW5kb3dMb2NhbFN0b3JhZ2UgPSBudWxsO1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBkZWZhdWx0czpEZWZhdWx0RGFzaGJvYXJkcykge1xuICAgICAgdGhpcy5sb2NhbFN0b3JhZ2UgPSBDb3JlLmdldExvY2FsU3RvcmFnZSgpO1xuICAgICAgLypcbiAgICAgIGlmICgndXNlckRhc2hib2FyZHMnIGluIHRoaXMubG9jYWxTdG9yYWdlKSB7XG4gICAgICAgIGxvZy5kZWJ1ZyhcIkZvdW5kIHByZXZpb3VzbHkgc2F2ZWQgZGFzaGJvYXJkc1wiKTtcbiAgICAgICAgaWYgKHRoaXMubG9hZERhc2hib2FyZHMoKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICB0aGlzLnN0b3JlRGFzaGJvYXJkcyhkZWZhdWx0cy5nZXRBbGwoKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc3RvcmVEYXNoYm9hcmRzKGRlZmF1bHRzLmdldEFsbCgpKTtcbiAgICAgIH1cbiAgICAgICovXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBsb2FkRGFzaGJvYXJkcygpIHtcbiAgICAgIHZhciBhbnN3ZXIgPSBhbmd1bGFyLmZyb21Kc29uKGxvY2FsU3RvcmFnZVsndXNlckRhc2hib2FyZHMnXSk7XG4gICAgICBpZiAoIWFuc3dlciB8fCBhbnN3ZXIubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGFuc3dlciA9IHRoaXMuZGVmYXVsdHMuZ2V0QWxsKCk7XG4gICAgICB9XG4gICAgICBsb2cuZGVidWcoXCJyZXR1cm5pbmcgZGFzaGJvYXJkczogXCIsIGFuc3dlcik7XG4gICAgICByZXR1cm4gYW5zd2VyO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RvcmVEYXNoYm9hcmRzKGRhc2hib2FyZHM6YW55W10pIHtcbiAgICAgIGxvZy5kZWJ1ZyhcInN0b3JpbmcgZGFzaGJvYXJkczogXCIsIGRhc2hib2FyZHMpO1xuICAgICAgbG9jYWxTdG9yYWdlWyd1c2VyRGFzaGJvYXJkcyddID0gYW5ndWxhci50b0pzb24oZGFzaGJvYXJkcyk7XG4gICAgICByZXR1cm4gdGhpcy5sb2FkRGFzaGJvYXJkcygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBwdXREYXNoYm9hcmRzKGFycmF5OmFueVtdLCBjb21taXRNZXNzYWdlOnN0cmluZywgZm4pIHtcbiAgICAgIHZhciBkYXNoYm9hcmRzID0gdGhpcy5sb2FkRGFzaGJvYXJkcygpO1xuICAgICAgYXJyYXkuZm9yRWFjaCgoZGFzaCkgPT4ge1xuICAgICAgICB2YXIgZXhpc3RpbmcgPSBkYXNoYm9hcmRzLmZpbmRJbmRleCgoZCkgPT4geyByZXR1cm4gZC5pZCA9PT0gZGFzaC5pZDsgfSk7XG4gICAgICAgIGlmIChleGlzdGluZyA+PSAwKSB7XG4gICAgICAgICAgZGFzaGJvYXJkc1tleGlzdGluZ10gPSBkYXNoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRhc2hib2FyZHMucHVzaChkYXNoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBmbih0aGlzLnN0b3JlRGFzaGJvYXJkcyhkYXNoYm9hcmRzKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlbGV0ZURhc2hib2FyZHMoYXJyYXk6YW55W10sIGZuKSB7XG4gICAgICB2YXIgZGFzaGJvYXJkcyA9IHRoaXMubG9hZERhc2hib2FyZHMoKTtcbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChhcnJheSwgKGl0ZW0pID0+IHtcbiAgICAgICAgZGFzaGJvYXJkcy5yZW1vdmUoKGkpID0+IHsgcmV0dXJuIGkuaWQgPT09IGl0ZW0uaWQ7IH0pO1xuICAgICAgfSk7XG4gICAgICBmbih0aGlzLnN0b3JlRGFzaGJvYXJkcyhkYXNoYm9hcmRzKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldERhc2hib2FyZHMoZm4pIHtcbiAgICAgIGZuKHRoaXMubG9hZERhc2hib2FyZHMoKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldERhc2hib2FyZChpZDpzdHJpbmcsIGZuKSB7XG4gICAgICB2YXIgZGFzaGJvYXJkcyA9IHRoaXMubG9hZERhc2hib2FyZHMoKTtcbiAgICAgIHZhciBkYXNoYm9hcmQgPSBkYXNoYm9hcmRzLmZpbmQoKGRhc2hib2FyZCkgPT4geyByZXR1cm4gZGFzaGJvYXJkLmlkID09PSBpZCB9KTtcbiAgICAgIGZuKGRhc2hib2FyZCk7XG4gICAgfVxuXG4gICAgcHVibGljIGNyZWF0ZURhc2hib2FyZChvcHRpb25zOmFueSkge1xuICAgICAgdmFyIGFuc3dlciA9e1xuICAgICAgICB0aXRsZTogXCJOZXcgRGFzaGJvYXJkXCIsXG4gICAgICAgIGdyb3VwOiBcIlBlcnNvbmFsXCIsXG4gICAgICAgIHdpZGdldHM6IFtdXG4gICAgICB9O1xuICAgICAgYW5zd2VyID0gYW5ndWxhci5leHRlbmQoYW5zd2VyLCBvcHRpb25zKTtcbiAgICAgIGFuc3dlclsnaWQnXSA9IENvcmUuZ2V0VVVJRCgpO1xuICAgICAgcmV0dXJuIGFuc3dlcjtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2xvbmVEYXNoYm9hcmQoZGFzaGJvYXJkOmFueSkge1xuICAgICAgdmFyIG5ld0Rhc2hib2FyZCA9IF8uY2xvbmUoZGFzaGJvYXJkKTtcbiAgICAgIG5ld0Rhc2hib2FyZFsnaWQnXSA9IENvcmUuZ2V0VVVJRCgpO1xuICAgICAgbmV3RGFzaGJvYXJkWyd0aXRsZSddID0gXCJDb3B5IG9mIFwiICsgZGFzaGJvYXJkLnRpdGxlO1xuICAgICAgcmV0dXJuIG5ld0Rhc2hib2FyZDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0VHlwZSgpIHtcbiAgICAgIHJldHVybiAnY29udGFpbmVyJztcbiAgICB9XG4gIH1cblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG5cbiAgX21vZHVsZS5jb250cm9sbGVyKFwiRGFzaGJvYXJkLkVkaXREYXNoYm9hcmRzQ29udHJvbGxlclwiLCBbXCIkc2NvcGVcIiwgXCIkcm91dGVQYXJhbXNcIiwgXCIkcm91dGVcIiwgXCIkbG9jYXRpb25cIiwgXCIkcm9vdFNjb3BlXCIsIFwiZGFzaGJvYXJkUmVwb3NpdG9yeVwiLCBcIkhhd3Rpb05hdlwiLCBcIiR0aW1lb3V0XCIsIFwiJHRlbXBsYXRlQ2FjaGVcIiwgXCIkbW9kYWxcIiwgXCJIYXd0aW9EYXNoYm9hcmRUYWJcIiwgKCRzY29wZSwgJHJvdXRlUGFyYW1zLCAkcm91dGUsICRsb2NhdGlvbiwgJHJvb3RTY29wZSwgZGFzaGJvYXJkUmVwb3NpdG9yeTpEYXNoYm9hcmRSZXBvc2l0b3J5LCBuYXYsICR0aW1lb3V0LCAkdGVtcGxhdGVDYWNoZSwgJG1vZGFsLCB0YWIpID0+IHtcblxuICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IFtdO1xuXG4gICAgJHJvb3RTY29wZS4kb24oJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkTG9hZGVkKTtcblxuICAgICRzY29wZS5oYXNVcmwgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gKCRzY29wZS51cmwpID8gdHJ1ZSA6IGZhbHNlO1xuICAgIH07XG5cbiAgICAkc2NvcGUuaGFzU2VsZWN0aW9uID0gKCkgPT4ge1xuICAgICAgcmV0dXJuICRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLmxlbmd0aCAhPT0gMDtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmdyaWRPcHRpb25zID0ge1xuICAgICAgc2VsZWN0ZWRJdGVtczogW10sXG4gICAgICBzaG93RmlsdGVyOiBmYWxzZSxcbiAgICAgIHNob3dDb2x1bW5NZW51OiBmYWxzZSxcbiAgICAgIGZpbHRlck9wdGlvbnM6IHtcbiAgICAgICAgZmlsdGVyVGV4dDogJydcbiAgICAgIH0sXG4gICAgICBkYXRhOiAnX2Rhc2hib2FyZHMnLFxuICAgICAgc2VsZWN0V2l0aENoZWNrYm94T25seTogdHJ1ZSxcbiAgICAgIHNob3dTZWxlY3Rpb25DaGVja2JveDogdHJ1ZSxcbiAgICAgIGNvbHVtbkRlZnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGZpZWxkOiAndGl0bGUnLFxuICAgICAgICAgIGRpc3BsYXlOYW1lOiAnRGFzaGJvYXJkJyxcbiAgICAgICAgICBjZWxsVGVtcGxhdGU6ICR0ZW1wbGF0ZUNhY2hlLmdldChVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAnZWRpdERhc2hib2FyZFRpdGxlQ2VsbC5odG1sJykpXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBmaWVsZDogJ2dyb3VwJyxcbiAgICAgICAgICBkaXNwbGF5TmFtZTogJ0dyb3VwJ1xuICAgICAgICB9XG4gICAgICBdLFxuICAgIH07XG5cbiAgICB2YXIgZG9VcGRhdGUgPSBfLmRlYm91bmNlKHVwZGF0ZURhdGEsIDEwKTtcblxuICAgIC8vIGhlbHBlcnMgc28gd2UgY2FuIGVuYWJsZS9kaXNhYmxlIHBhcnRzIG9mIHRoZSBVSSBkZXBlbmRpbmcgb24gaG93XG4gICAgLy8gZGFzaGJvYXJkIGRhdGEgaXMgc3RvcmVkXG4gICAgLypcbiAgICAkc2NvcGUudXNpbmdHaXQgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlKCkgPT09ICdnaXQnO1xuICAgIH07XG5cbiAgICAkc2NvcGUudXNpbmdGYWJyaWMgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlKCkgPT09ICdmYWJyaWMnO1xuICAgIH07XG5cbiAgICAkc2NvcGUudXNpbmdMb2NhbCA9ICgpID0+IHtcbiAgICAgIHJldHVybiBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldFR5cGUoKSA9PT0gJ2NvbnRhaW5lcic7XG4gICAgfTtcblxuICAgIGlmICgkc2NvcGUudXNpbmdGYWJyaWMoKSkge1xuICAgICAgJHNjb3BlLmdyaWRPcHRpb25zLmNvbHVtbkRlZnMuYWRkKFt7XG4gICAgICAgIGZpZWxkOiAndmVyc2lvbklkJyxcbiAgICAgICAgZGlzcGxheU5hbWU6ICdWZXJzaW9uJ1xuICAgICAgfSwge1xuICAgICAgICBmaWVsZDogJ3Byb2ZpbGVJZCcsXG4gICAgICAgIGRpc3BsYXlOYW1lOiAnUHJvZmlsZSdcbiAgICAgIH0sIHtcbiAgICAgICAgZmllbGQ6ICdmaWxlTmFtZScsXG4gICAgICAgIGRpc3BsYXlOYW1lOiAnRmlsZSBOYW1lJ1xuICAgICAgfV0pO1xuICAgIH1cbiAgICAqL1xuXG4gICAgJHRpbWVvdXQoZG9VcGRhdGUsIDEwKTtcblxuICAgICRzY29wZS4kb24oXCIkcm91dGVDaGFuZ2VTdWNjZXNzXCIsIGZ1bmN0aW9uIChldmVudCwgY3VycmVudCwgcHJldmlvdXMpIHtcbiAgICAgIC8vIGxldHMgZG8gdGhpcyBhc3luY2hyb25vdXNseSB0byBhdm9pZCBFcnJvcjogJGRpZ2VzdCBhbHJlYWR5IGluIHByb2dyZXNzXG4gICAgICAkdGltZW91dChkb1VwZGF0ZSwgMTApO1xuICAgIH0pO1xuXG4gICAgJHNjb3BlLmFkZFZpZXdUb0Rhc2hib2FyZCA9ICgpID0+IHtcbiAgICAgIHZhciBuZXh0SHJlZiA9IG51bGw7XG4gICAgICB2YXIgc2VsZWN0ZWQgPSAkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcztcbiAgICAgIHZhciBjdXJyZW50VXJsID0gbmV3IFVSSSgpO1xuICAgICAgdmFyIGNvbmZpZyA9IGN1cnJlbnRVcmwucXVlcnkodHJ1ZSk7XG4gICAgICB2YXIgaHJlZiA9IGNvbmZpZ1snaHJlZiddO1xuICAgICAgdmFyIGlmcmFtZSA9IGNvbmZpZ1snaWZyYW1lJ107XG4gICAgICB2YXIgdHlwZSA9ICdocmVmJztcbiAgICAgIGlmIChocmVmKSB7XG4gICAgICAgIGhyZWYgPSBVUkkuZGVjb2RlKGhyZWYpO1xuICAgICAgICBocmVmID0gQ29yZS50cmltTGVhZGluZyhocmVmLCAnIycpO1xuICAgICAgfSBlbHNlIGlmIChpZnJhbWUpIHtcbiAgICAgICAgaWZyYW1lID0gaWZyYW1lLnVuZXNjYXBlVVJMKCk7XG4gICAgICAgIHR5cGUgPSAnaWZyYW1lJztcbiAgICAgIH1cbiAgICAgIHZhciB3aWRnZXRVUkkgPSA8YW55PiB1bmRlZmluZWQ7XG4gICAgICBzd2l0Y2godHlwZSkge1xuICAgICAgICBjYXNlICdocmVmJzpcbiAgICAgICAgICBsb2cuZGVidWcoXCJocmVmOiBcIiwgaHJlZik7XG4gICAgICAgICAgd2lkZ2V0VVJJID0gbmV3IFVSSShocmVmKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnaWZyYW1lJzpcbiAgICAgICAgICBsb2cuZGVidWcoXCJpZnJhbWU6IFwiLCBpZnJhbWUpO1xuICAgICAgICAgIHdpZGdldFVSSSA9IG5ldyBVUkkoaWZyYW1lKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBsb2cuZGVidWcoXCJ0eXBlIHVua25vd25cIik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIHNpemVTdHIgPSA8YW55PiBjb25maWdbJ3NpemUnXTtcbiAgICAgIGlmIChzaXplU3RyKSB7XG4gICAgICAgIHNpemVTdHIgPSBzaXplU3RyLnVuZXNjYXBlVVJMKCk7XG4gICAgICB9XG4gICAgICB2YXIgc2l6ZSA9IGFuZ3VsYXIuZnJvbUpzb24oc2l6ZVN0cikgfHwgeyBzaXplX3g6IDEsIHNpemVfeTogMSB9O1xuICAgICAgdmFyIHRpdGxlID0gKGNvbmZpZ1sndGl0bGUnXSB8fCAnJykudW5lc2NhcGVVUkwoKTtcbiAgICAgIHZhciB0ZW1wbGF0ZVdpZGdldCA9IHtcbiAgICAgICAgaWQ6IENvcmUuZ2V0VVVJRCgpLFxuICAgICAgICByb3c6IDEsXG4gICAgICAgIGNvbDogMSxcbiAgICAgICAgc2l6ZV94OiBzaXplLnNpemVfeCxcbiAgICAgICAgc2l6ZV95OiBzaXplLnNpemVfeSxcbiAgICAgICAgdGl0bGU6IHRpdGxlXG4gICAgICB9XG4gICAgICBhbmd1bGFyLmZvckVhY2goc2VsZWN0ZWQsIChzZWxlY3RlZEl0ZW0pID0+IHtcblxuICAgICAgICB2YXIgd2lkZ2V0ID0gXy5jbG9uZURlZXAodGVtcGxhdGVXaWRnZXQpO1xuXG4gICAgICAgIGlmICghc2VsZWN0ZWRJdGVtLndpZGdldHMpIHtcbiAgICAgICAgICBzZWxlY3RlZEl0ZW0ud2lkZ2V0cyA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgY2FzZSAnaWZyYW1lJzogXG4gICAgICAgICAgICB3aWRnZXQgPSA8YW55Pl8uZXh0ZW5kKHtcbiAgICAgICAgICAgICAgaWZyYW1lOiBpZnJhbWVcbiAgICAgICAgICAgIH0sIHdpZGdldCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdocmVmJzpcbiAgICAgICAgICAgIHZhciB0ZXh0ID0gd2lkZ2V0VVJJLnBhdGgoKTtcbiAgICAgICAgICAgIHZhciBzZWFyY2ggPSB3aWRnZXRVUkkucXVlcnkodHJ1ZSk7XG4gICAgICAgICAgICBpZiAoJHJvdXRlICYmICRyb3V0ZS5yb3V0ZXMpIHtcbiAgICAgICAgICAgICAgdmFyIHZhbHVlID0gJHJvdXRlLnJvdXRlc1t0ZXh0XTtcbiAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlVXJsID0gdmFsdWVbXCJ0ZW1wbGF0ZVVybFwiXTtcbiAgICAgICAgICAgICAgICBpZiAodGVtcGxhdGVVcmwpIHtcbiAgICAgICAgICAgICAgICAgIHdpZGdldCA9IDxhbnk+IF8uZXh0ZW5kKHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogdGV4dCxcbiAgICAgICAgICAgICAgICAgICAgaW5jbHVkZTogdGVtcGxhdGVVcmwsXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaDogc2VhcmNoLFxuICAgICAgICAgICAgICAgICAgICBoYXNoOiBcIlwiXG4gICAgICAgICAgICAgICAgICB9LCB3aWRnZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPIHdlIG5lZWQgdG8gYmUgYWJsZSB0byBtYXRjaCBVUkkgdGVtcGxhdGVzLi4uXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICAvLyBmaWd1cmUgb3V0IHRoZSB3aWR0aCBvZiB0aGUgZGFzaFxuICAgICAgICB2YXIgZ3JpZFdpZHRoID0gMDtcblxuICAgICAgICBzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5mb3JFYWNoKCh3KSA9PiB7XG4gICAgICAgICAgdmFyIHJpZ2h0U2lkZSA9IHcuY29sICsgdy5zaXplX3g7XG4gICAgICAgICAgaWYgKHJpZ2h0U2lkZSA+IGdyaWRXaWR0aCkge1xuICAgICAgICAgICAgZ3JpZFdpZHRoID0gcmlnaHRTaWRlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGZvdW5kID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIGxlZnQgPSAodykgPT4ge1xuICAgICAgICAgIHJldHVybiB3LmNvbDtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcmlnaHQgPSAodykgID0+IHtcbiAgICAgICAgICByZXR1cm4gdy5jb2wgKyB3LnNpemVfeCAtIDE7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHRvcCA9ICh3KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHcucm93O1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBib3R0b20gPSAodykgPT4ge1xuICAgICAgICAgIHJldHVybiB3LnJvdyArIHcuc2l6ZV95IC0gMTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgY29sbGlzaW9uID0gKHcxLCB3MikgPT4ge1xuICAgICAgICAgIHJldHVybiAhKCBsZWZ0KHcyKSA+IHJpZ2h0KHcxKSB8fFxuICAgICAgICAgICAgICByaWdodCh3MikgPCBsZWZ0KHcxKSB8fFxuICAgICAgICAgICAgICB0b3AodzIpID4gYm90dG9tKHcxKSB8fFxuICAgICAgICAgICAgICBib3R0b20odzIpIDwgdG9wKHcxKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHNlbGVjdGVkSXRlbS53aWRnZXRzLmlzRW1wdHkoKSkge1xuICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlICghZm91bmQpIHtcbiAgICAgICAgICB3aWRnZXQuY29sID0gMTtcbiAgICAgICAgICBpZiAod2lkZ2V0LmNvbCArIHdpZGdldC5zaXplX3ggPiBncmlkV2lkdGgpIHtcbiAgICAgICAgICAgIC8vIGxldCdzIG5vdCBsb29rIGZvciBhIHBsYWNlIG5leHQgdG8gZXhpc3Rpbmcgd2lkZ2V0XG4gICAgICAgICAgICBzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5mb3JFYWNoKGZ1bmN0aW9uKHcsIGlkeCkge1xuICAgICAgICAgICAgICBpZiAod2lkZ2V0LnJvdyA8PSB3LnJvdykge1xuICAgICAgICAgICAgICAgIHdpZGdldC5yb3crKztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAoOyAod2lkZ2V0LmNvbCArIHdpZGdldC5zaXplX3gpIDw9IGdyaWRXaWR0aDsgd2lkZ2V0LmNvbCsrKSB7XG4gICAgICAgICAgICBpZiAoIXNlbGVjdGVkSXRlbS53aWRnZXRzLmFueSgodykgPT4ge1xuICAgICAgICAgICAgICB2YXIgYyA9IGNvbGxpc2lvbih3LCB3aWRnZXQpO1xuICAgICAgICAgICAgICByZXR1cm4gY1xuICAgICAgICAgICAgfSkpIHtcbiAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgd2lkZ2V0LnJvdyA9IHdpZGdldC5yb3cgKyAxXG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGp1c3QgaW4gY2FzZSwga2VlcCB0aGUgc2NyaXB0IGZyb20gcnVubmluZyBhd2F5Li4uXG4gICAgICAgICAgaWYgKHdpZGdldC5yb3cgPiA1MCkge1xuICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgkc2NvcGUucm91dGVQYXJhbXMpIHtcbiAgICAgICAgICB3aWRnZXRbJ3JvdXRlUGFyYW1zJ10gPSAkc2NvcGUucm91dGVQYXJhbXM7XG4gICAgICAgIH1cbiAgICAgICAgc2VsZWN0ZWRJdGVtLndpZGdldHMucHVzaCh3aWRnZXQpO1xuICAgICAgICBpZiAoIW5leHRIcmVmICYmIHNlbGVjdGVkSXRlbS5pZCkge1xuICAgICAgICAgIG5leHRIcmVmID0gbmV3IFVSSSgpLnBhdGgoXCIvZGFzaGJvYXJkL2lkL1wiICsgc2VsZWN0ZWRJdGVtLmlkKS5xdWVyeSh7XG4gICAgICAgICAgICAnbWFpbi10YWInOiAnZGFzaGJvYXJkJyxcbiAgICAgICAgICAgICdzdWItdGFiJzogJ2Rhc2hib2FyZC0nICsgc2VsZWN0ZWRJdGVtLmlkXG4gICAgICAgICAgfSkucmVtb3ZlUXVlcnkoJ2hyZWYnKVxuICAgICAgICAgICAgLnJlbW92ZVF1ZXJ5KCd0aXRsZScpXG4gICAgICAgICAgICAucmVtb3ZlUXVlcnkoJ2lmcmFtZScpXG4gICAgICAgICAgICAucmVtb3ZlUXVlcnkoJ3NpemUnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIG5vdyBsZXRzIHVwZGF0ZSB0aGUgYWN0dWFsIGRhc2hib2FyZCBjb25maWdcbiAgICAgIHZhciBjb21taXRNZXNzYWdlID0gXCJBZGQgd2lkZ2V0XCI7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoc2VsZWN0ZWQsIGNvbW1pdE1lc3NhZ2UsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIC8qXG4gICAgICAgIGxvZy5kZWJ1ZyhcIlB1dCBkYXNoYm9hcmRzOiBcIiwgZGFzaGJvYXJkcyk7XG4gICAgICAgIGxvZy5kZWJ1ZyhcIk5leHQgaHJlZjogXCIsIG5leHRIcmVmLnRvU3RyaW5nKCkpO1xuICAgICAgICAqL1xuICAgICAgICBpZiAobmV4dEhyZWYpIHtcbiAgICAgICAgICAkbG9jYXRpb24ucGF0aChuZXh0SHJlZi5wYXRoKCkpLnNlYXJjaChuZXh0SHJlZi5xdWVyeSh0cnVlKSk7XG4gICAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB9O1xuXG4gICAgJHNjb3BlLmNyZWF0ZSA9ICgpID0+IHtcblxuICAgICAgdmFyIGNvdW50ZXIgPSBkYXNoYm9hcmRzKCkubGVuZ3RoICsgMTtcbiAgICAgIHZhciB0aXRsZSA9IFwiVW50aXRsZWRcIiArIGNvdW50ZXI7XG5cbiAgICAgIHZhciBtb2RhbCA9ICRtb2RhbC5vcGVuKHtcbiAgICAgICAgdGVtcGxhdGVVcmw6IFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdjcmVhdGVEYXNoYm9hcmRNb2RhbC5odG1sJyksXG4gICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRtb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAkc2NvcGUuZW50aXR5ID0ge1xuICAgICAgICAgICAgdGl0bGU6IHRpdGxlXG4gICAgICAgICAgfVxuICAgICAgICAgICRzY29wZS5jb25maWcgPSB7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICd0aXRsZSc6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgICAgJHNjb3BlLm9rID0gKCkgPT4ge1xuICAgICAgICAgICAgbW9kYWwuY2xvc2UoKTtcbiAgICAgICAgICAgIHZhciB0aXRsZSA9ICRzY29wZS5lbnRpdHkudGl0bGVcbiAgICAgICAgICAgIHZhciBuZXdEYXNoID0gZGFzaGJvYXJkUmVwb3NpdG9yeS5jcmVhdGVEYXNoYm9hcmQoeyB0aXRsZTogdGl0bGUgfSk7XG4gICAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoW25ld0Rhc2hdLCBcIkNyZWF0ZWQgbmV3IGRhc2hib2FyZDogXCIgKyB0aXRsZSwgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgICAgICAgLy8gbGV0J3MganVzdCBiZSBzYWZlIGFuZCBlbnN1cmUgdGhlcmUncyBubyBzZWxlY3Rpb25zXG4gICAgICAgICAgICAgIGRlc2VsZWN0QWxsKCk7XG4gICAgICAgICAgICAgIHNldFN1YlRhYnModGFiLCBuYXYuYnVpbGRlcigpLCBkYXNoYm9hcmRzLCAkcm9vdFNjb3BlKTtcbiAgICAgICAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgICRzY29wZS5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgICAgICBtb2RhbC5kaXNtaXNzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XVxuICAgICAgfSk7XG4gICAgICAvKlxuICAgICAgdmFyIGNvdW50ZXIgPSBkYXNoYm9hcmRzKCkubGVuZ3RoICsgMTtcbiAgICAgIHZhciB0aXRsZSA9IFwiVW50aXRsZWRcIiArIGNvdW50ZXI7XG4gICAgICB2YXIgbmV3RGFzaCA9IGRhc2hib2FyZFJlcG9zaXRvcnkuY3JlYXRlRGFzaGJvYXJkKHt0aXRsZTogdGl0bGV9KTtcblxuICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKFtuZXdEYXNoXSwgXCJDcmVhdGVkIG5ldyBkYXNoYm9hcmQ6IFwiICsgdGl0bGUsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIC8vIGxldCdzIGp1c3QgYmUgc2FmZSBhbmQgZW5zdXJlIHRoZXJlJ3Mgbm8gc2VsZWN0aW9uc1xuICAgICAgICBkZXNlbGVjdEFsbCgpO1xuICAgICAgICBzZXRTdWJUYWJzKG5hdi5idWlsZGVyKCksIGRhc2hib2FyZHMsICRyb290U2NvcGUpO1xuICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICB9KTtcbiAgICAgICovXG5cbiAgICB9O1xuXG4gICAgJHNjb3BlLmR1cGxpY2F0ZSA9ICgpID0+IHtcbiAgICAgIHZhciBuZXdEYXNoYm9hcmRzID0gW107XG4gICAgICB2YXIgY29tbWl0TWVzc2FnZSA9IFwiRHVwbGljYXRlZCBkYXNoYm9hcmQocykgXCI7XG4gICAgICBhbmd1bGFyLmZvckVhY2goJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXMsIChpdGVtLCBpZHgpID0+IHtcbiAgICAgICAgLy8gbGV0cyB1bnNlbGVjdCB0aGlzIGl0ZW1cbiAgICAgICAgdmFyIGNvbW1pdE1lc3NhZ2UgPSBcIkR1cGxpY2F0ZWQgZGFzaGJvYXJkIFwiICsgaXRlbS50aXRsZTtcbiAgICAgICAgdmFyIG5ld0Rhc2ggPSBkYXNoYm9hcmRSZXBvc2l0b3J5LmNsb25lRGFzaGJvYXJkKGl0ZW0pO1xuICAgICAgICBuZXdEYXNoYm9hcmRzLnB1c2gobmV3RGFzaCk7XG4gICAgICB9KTtcblxuICAgICAgLy8gbGV0J3MganVzdCBiZSBzYWZlIGFuZCBlbnN1cmUgdGhlcmUncyBubyBzZWxlY3Rpb25zXG4gICAgICBkZXNlbGVjdEFsbCgpO1xuXG4gICAgICBjb21taXRNZXNzYWdlID0gY29tbWl0TWVzc2FnZSArIG5ld0Rhc2hib2FyZHMubWFwKChkKSA9PiB7IHJldHVybiBkLnRpdGxlIH0pLmpvaW4oJywnKTtcbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhuZXdEYXNoYm9hcmRzLCBjb21taXRNZXNzYWdlLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICBzZXRTdWJUYWJzKHRhYiwgbmF2LmJ1aWxkZXIoKSwgZGFzaGJvYXJkcywgJHJvb3RTY29wZSk7XG4gICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUucmVuYW1lRGFzaGJvYXJkID0gKCkgPT4ge1xuICAgICAgaWYgKCRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICB2YXIgc2VsZWN0ZWQgPSA8YW55Pl8uZmlyc3QoJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXMpO1xuICAgICAgICB2YXIgbW9kYWwgPSAkbW9kYWwub3Blbih7XG4gICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdyZW5hbWVEYXNoYm9hcmRNb2RhbC5odG1sJyksXG4gICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCAnJG1vZGFsSW5zdGFuY2UnLCAoJHNjb3BlLCAkbW9kYWxJbnN0YW5jZSkgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLmNvbmZpZyA9IHtcbiAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICd0aXRsZSc6IHtcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgZGVmYXVsdDogc2VsZWN0ZWQudGl0bGVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWQgPSBzZWxlY3RlZDtcbiAgICAgICAgICAgICRzY29wZS5vayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgbW9kYWwuY2xvc2UoKTtcbiAgICAgICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKFskc2NvcGUuc2VsZWN0ZWRdLCAncmVuYW1lZCBkYXNoYm9hcmQnLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAgICAgICAgIC8vIGxldCdzIGp1c3QgYmUgc2FmZSBhbmQgZW5zdXJlIHRoZXJlJ3Mgbm8gc2VsZWN0aW9uc1xuICAgICAgICAgICAgICAgIGRlc2VsZWN0QWxsKCk7XG4gICAgICAgICAgICAgICAgc2V0U3ViVGFicyh0YWIsIG5hdi5idWlsZGVyKCksIGRhc2hib2FyZHMsICRyb290U2NvcGUpO1xuICAgICAgICAgICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgICBtb2RhbC5kaXNtaXNzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfV1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgICRzY29wZS5kZWxldGVEYXNoYm9hcmQgPSAoKSA9PiB7XG4gICAgICBpZiAoJHNjb3BlLmhhc1NlbGVjdGlvbigpKSB7XG4gICAgICAgIHZhciBzZWxlY3RlZCA9ICRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zO1xuICAgICAgICB2YXIgbW9kYWwgPSAkbW9kYWwub3Blbih7XG4gICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdkZWxldGVEYXNoYm9hcmRNb2RhbC5odG1sJyksXG4gICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCAnJG1vZGFsSW5zdGFuY2UnLCAoJHNjb3BlLCAkbW9kYWxJbnN0YW5jZSkgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkID0gc2VsZWN0ZWQ7XG4gICAgICAgICAgICAkc2NvcGUub2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZGVsZXRlRGFzaGJvYXJkcygkc2NvcGUuc2VsZWN0ZWQsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gbGV0J3MganVzdCBiZSBzYWZlIGFuZCBlbnN1cmUgdGhlcmUncyBubyBzZWxlY3Rpb25zXG4gICAgICAgICAgICAgICAgZGVzZWxlY3RBbGwoKTtcbiAgICAgICAgICAgICAgICBzZXRTdWJUYWJzKHRhYiwgbmF2LmJ1aWxkZXIoKSwgZGFzaGJvYXJkcywgJHJvb3RTY29wZSk7XG4gICAgICAgICAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgICAgICAgIG1vZGFsLmRpc21pc3MoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgJHNjb3BlLmdpc3QgPSAoKSA9PiB7XG4gICAgICBpZiAoJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgaWQgPSAkc2NvcGUuc2VsZWN0ZWRJdGVtc1swXS5pZDtcbiAgICAgICAgJGxvY2F0aW9uLnBhdGgoXCIvZGFzaGJvYXJkL2lkL1wiICsgaWQgKyBcIi9zaGFyZVwiKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gdXBkYXRlRGF0YSgpIHtcbiAgICAgIHZhciB1cmwgPSAkcm91dGVQYXJhbXNbXCJocmVmXCJdO1xuICAgICAgaWYgKHVybCkge1xuICAgICAgICAkc2NvcGUudXJsID0gZGVjb2RlVVJJQ29tcG9uZW50KHVybCk7XG4gICAgICB9XG5cbiAgICAgIHZhciByb3V0ZVBhcmFtcyA9ICRyb3V0ZVBhcmFtc1tcInJvdXRlUGFyYW1zXCJdO1xuICAgICAgaWYgKHJvdXRlUGFyYW1zKSB7XG4gICAgICAgICRzY29wZS5yb3V0ZVBhcmFtcyA9IGRlY29kZVVSSUNvbXBvbmVudChyb3V0ZVBhcmFtcyk7XG4gICAgICB9XG4gICAgICB2YXIgc2l6ZTphbnkgPSAkcm91dGVQYXJhbXNbXCJzaXplXCJdO1xuICAgICAgaWYgKHNpemUpIHtcbiAgICAgICAgc2l6ZSA9IGRlY29kZVVSSUNvbXBvbmVudChzaXplKTtcbiAgICAgICAgJHNjb3BlLnByZWZlcnJlZFNpemUgPSBhbmd1bGFyLmZyb21Kc29uKHNpemUpO1xuICAgICAgfVxuICAgICAgdmFyIHRpdGxlOmFueSA9ICRyb3V0ZVBhcmFtc1tcInRpdGxlXCJdO1xuICAgICAgaWYgKHRpdGxlKSB7XG4gICAgICAgIHRpdGxlID0gZGVjb2RlVVJJQ29tcG9uZW50KHRpdGxlKTtcbiAgICAgICAgJHNjb3BlLndpZGdldFRpdGxlID0gdGl0bGU7XG4gICAgICB9XG5cbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkcygoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXNoYm9hcmRMb2FkZWQoZXZlbnQsIGRhc2hib2FyZHMpIHtcbiAgICAgIGRhc2hib2FyZHMuZm9yRWFjaCgoZGFzaGJvYXJkKSA9PiB7XG4gICAgICAgIGRhc2hib2FyZC5oYXNoID0gJz9tYWluLXRhYj1kYXNoYm9hcmQmc3ViLXRhYj1kYXNoYm9hcmQtJyArIGRhc2hib2FyZC5pZDtcbiAgICAgIH0pO1xuICAgICAgJHNjb3BlLl9kYXNoYm9hcmRzID0gZGFzaGJvYXJkcztcblxuICAgICAgaWYgKGV2ZW50ID09PSBudWxsKSB7XG4gICAgICAgICRzY29wZS4kZW1pdCgnZGFzaGJvYXJkc1VwZGF0ZWQnLCBkYXNoYm9hcmRzKTtcbiAgICAgIH1cbiAgICAgIENvcmUuJGFwcGx5KCRyb290U2NvcGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRhc2hib2FyZHMoKSB7XG4gICAgICByZXR1cm4gJHNjb3BlLl9kYXNoYm9hcmRzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlc2VsZWN0QWxsKCkge1xuICAgICAgJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXMubGVuZ3RoID0gMDtcbiAgICB9XG5cbiAgfV0pO1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZEhlbHBlcnMudHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnRzIHRoZSBuZy5JTG9jYXRpb25TZXJ2aWNlIGludGVyZmFjZSBhbmQgaXMgdXNlZCBieSB0aGUgZGFzaGJvYXJkIHRvIHN1cHBseVxuICAgKiBjb250cm9sbGVycyB3aXRoIGEgc2F2ZWQgVVJMIGxvY2F0aW9uXG4gICAqXG4gICAqIEBjbGFzcyBSZWN0YW5nbGVMb2NhdGlvblxuICAgKi9cbiAgZXhwb3J0IGNsYXNzIFJlY3RhbmdsZUxvY2F0aW9uIHsgLy8gVE9ETyBpbXBsZW1lbnRzIG5nLklMb2NhdGlvblNlcnZpY2Uge1xuICAgIHByaXZhdGUgX3BhdGg6IHN0cmluZztcbiAgICBwcml2YXRlIF9oYXNoOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBfc2VhcmNoOiBhbnk7XG4gICAgcHJpdmF0ZSB1cmk6VVJJO1xuXG4gICAgY29uc3RydWN0b3IocHVibGljIGRlbGVnYXRlOm5nLklMb2NhdGlvblNlcnZpY2UsIHBhdGg6c3RyaW5nLCBzZWFyY2gsIGhhc2g6c3RyaW5nKSB7XG4gICAgICB0aGlzLl9wYXRoID0gcGF0aDtcbiAgICAgIHRoaXMuX3NlYXJjaCA9IHNlYXJjaDtcbiAgICAgIHRoaXMuX2hhc2ggPSBoYXNoO1xuICAgICAgdGhpcy51cmkgPSBuZXcgVVJJKHBhdGgpO1xuICAgICAgdGhpcy51cmkuc2VhcmNoKChxdWVyeSkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2VhcmNoO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgYWJzVXJsKCkge1xuICAgICAgcmV0dXJuIHRoaXMucHJvdG9jb2woKSArIHRoaXMuaG9zdCgpICsgXCI6XCIgKyB0aGlzLnBvcnQoKSArIHRoaXMucGF0aCgpICsgdGhpcy5zZWFyY2goKTtcbiAgICB9XG5cbiAgICBoYXNoKG5ld0hhc2g6c3RyaW5nID0gbnVsbCk6YW55IHtcbiAgICAgIGlmIChuZXdIYXNoKSB7XG4gICAgICAgIHRoaXMudXJpLnNlYXJjaChuZXdIYXNoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5faGFzaDtcbiAgICB9XG5cbiAgICBob3N0KCk6c3RyaW5nIHtcbiAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLmhvc3QoKTtcbiAgICB9XG5cbiAgICBwYXRoKG5ld1BhdGg6c3RyaW5nID0gbnVsbCk6YW55IHtcbiAgICAgIGlmIChuZXdQYXRoKSB7XG4gICAgICAgIHRoaXMudXJpLnBhdGgobmV3UGF0aCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX3BhdGg7XG4gICAgfVxuXG4gICAgcG9ydCgpOm51bWJlciB7XG4gICAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5wb3J0KCk7XG4gICAgfVxuXG4gICAgcHJvdG9jb2woKSB7XG4gICAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5wb3J0KCk7XG4gICAgfVxuXG4gICAgcmVwbGFjZSgpIHtcbiAgICAgIC8vIFRPRE9cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNlYXJjaChwYXJhbWV0ZXJzTWFwOmFueSA9IG51bGwpOmFueSB7XG4gICAgICBpZiAocGFyYW1ldGVyc01hcCkge1xuICAgICAgICB0aGlzLnVyaS5zZWFyY2gocGFyYW1ldGVyc01hcCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX3NlYXJjaDtcbiAgICB9XG5cbiAgICB1cmwobmV3VmFsdWU6IHN0cmluZyA9IG51bGwpOmFueSB7XG4gICAgICBpZiAobmV3VmFsdWUpIHtcbiAgICAgICAgdGhpcy51cmkgPSBuZXcgVVJJKG5ld1ZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5hYnNVcmwoKTtcbiAgICB9XG5cbiAgfVxufVxuIiwiLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFJlcG9zaXRvcnkudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwicmVjdGFuZ2xlTG9jYXRpb24udHNcIi8+XG5tb2R1bGUgRGFzaGJvYXJkIHtcblxuICB2YXIgbW9kdWxlczpBcnJheTxzdHJpbmc+ID0gdW5kZWZpbmVkO1xuXG4gIF9tb2R1bGUuZGlyZWN0aXZlKCdoYXd0aW9EYXNoYm9hcmQnLCBmdW5jdGlvbigpIHtcbiAgICBtb2R1bGVzID0gaGF3dGlvUGx1Z2luTG9hZGVyWydtb2R1bGVzJ10uZmlsdGVyKChuYW1lKSA9PiB7XG4gICAgICByZXR1cm4gXy5pc1N0cmluZyhuYW1lKSAmJiBuYW1lICE9PSAnbmcnO1xuICAgIH0pO1xuICAgIHJldHVybiBuZXcgRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlKCk7XG4gIH0pO1xuXG4gIGV4cG9ydCBjbGFzcyBHcmlkc3RlckRpcmVjdGl2ZSB7XG4gICAgcHVibGljIHJlc3RyaWN0ID0gJ0EnO1xuICAgIHB1YmxpYyByZXBsYWNlID0gdHJ1ZTtcblxuICAgIHB1YmxpYyBjb250cm9sbGVyID0gW1wiJHNjb3BlXCIsIFwiJGVsZW1lbnRcIiwgXCIkYXR0cnNcIiwgXCIkbG9jYXRpb25cIiwgXCIkcm91dGVQYXJhbXNcIiwgXCIkdGVtcGxhdGVDYWNoZVwiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgXCIkY29tcGlsZVwiLCBcIiR0ZW1wbGF0ZVJlcXVlc3RcIiwgXCIkaW50ZXJwb2xhdGVcIiwgXCIkbW9kYWxcIiwgXCIkc2NlXCIsIFwiJHRpbWVvdXRcIiwgKCRzY29wZSwgJGVsZW1lbnQsICRhdHRycywgJGxvY2F0aW9uLCAkcm91dGVQYXJhbXMsICR0ZW1wbGF0ZUNhY2hlLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnksICRjb21waWxlLCAkdGVtcGxhdGVSZXF1ZXN0LCAkaW50ZXJwb2xhdGUsICRtb2RhbCwgJHNjZSwgJHRpbWVvdXQpID0+IHtcblxuICAgICAgdmFyIGdyaWRTaXplID0gMTUwO1xuICAgICAgdmFyIGdyaWRNYXJnaW4gPSA2O1xuICAgICAgdmFyIGdyaWRIZWlnaHQ7XG5cbiAgICAgIHZhciBncmlkWCA9IGdyaWRTaXplO1xuICAgICAgdmFyIGdyaWRZID0gZ3JpZFNpemU7XG5cbiAgICAgIHZhciB3aWRnZXRNYXAgPSB7fTtcblxuICAgICAgdmFyIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSA9ICRzY29wZS4kZXZhbCgnZGFzaGJvYXJkUmVwb3NpdG9yeScpIHx8IGRhc2hib2FyZFJlcG9zaXRvcnk7XG5cbiAgICAgICRzY29wZS4kb24oJyRkZXN0cm95JywgKCkgPT4ge1xuICAgICAgICBhbmd1bGFyLmZvckVhY2god2lkZ2V0TWFwLCAod2lkZ2V0LCBrZXkpID0+IHtcbiAgICAgICAgICBpZiAoJ3Njb3BlJyBpbiB3aWRnZXQpIHtcbiAgICAgICAgICAgIHZhciBzY29wZSA9IHdpZGdldFsnc2NvcGUnXTtcbiAgICAgICAgICAgIHNjb3BlLiRkZXN0cm95KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRlc3Ryb3lXaWRnZXQod2lkZ2V0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgJGVsZW1lbnQub24oJyRkZXN0cm95JywgKCkgPT4ge1xuICAgICAgICAkc2NvcGUuJGRlc3Ryb3koKTtcbiAgICAgIH0pO1xuXG4gICAgICBzZXRUaW1lb3V0KHVwZGF0ZVdpZGdldHMsIDEwKTtcblxuICAgICAgZnVuY3Rpb24gZGVzdHJveVdpZGdldCh3aWRnZXQpIHtcbiAgICAgICAgdmFyIGdyaWRzdGVyID0gZ2V0R3JpZHN0ZXIoKTtcbiAgICAgICAgdmFyIHdpZGdldEVsZW0gPSBudWxsO1xuICAgICAgICAvLyBsZXRzIGRlc3Ryb3kgdGhlIHdpZGdldHMncyBzY29wZVxuICAgICAgICB2YXIgd2lkZ2V0RGF0YSA9IHdpZGdldE1hcFt3aWRnZXQuaWRdO1xuICAgICAgICBpZiAod2lkZ2V0RGF0YSkge1xuICAgICAgICAgIGRlbGV0ZSB3aWRnZXRNYXBbd2lkZ2V0LmlkXTtcbiAgICAgICAgICB3aWRnZXRFbGVtID0gd2lkZ2V0RGF0YS53aWRnZXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF3aWRnZXRFbGVtKSB7XG4gICAgICAgICAgLy8gbGV0cyBnZXQgdGhlIGxpIHBhcmVudCBlbGVtZW50IG9mIHRoZSB0ZW1wbGF0ZVxuICAgICAgICAgIHdpZGdldEVsZW0gPSAkZWxlbWVudC5maW5kKFwiW2RhdGEtd2lkZ2V0SWQ9J1wiICsgd2lkZ2V0LmlkICsgXCInXVwiKS5wYXJlbnQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZ3JpZHN0ZXIgJiYgd2lkZ2V0RWxlbSkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBncmlkc3Rlci5yZW1vdmVfd2lkZ2V0KHdpZGdldEVsZW0pO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgLy8gbm90aGluZyB0byBkbywgd2UnbGwgZGVzdHJveSB0aGUgZWxlbWVudCBiZWxvd1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAod2lkZ2V0RWxlbSkge1xuICAgICAgICAgIGxvZy5kZWJ1ZyhcIlJlbW92aW5nIHdpZGdldDogXCIsIHdpZGdldC5pZCk7XG4gICAgICAgICAgd2lkZ2V0RWxlbS5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiByZW1vdmVXaWRnZXQod2lkZ2V0KSB7XG4gICAgICAgIGRlc3Ryb3lXaWRnZXQod2lkZ2V0KTtcbiAgICAgICAgLy8gbGV0cyB0cmFzaCB0aGUgSlNPTiBtZXRhZGF0YVxuICAgICAgICBpZiAoJHNjb3BlLmRhc2hib2FyZCkge1xuICAgICAgICAgIHZhciB3aWRnZXRzID0gJHNjb3BlLmRhc2hib2FyZC53aWRnZXRzO1xuICAgICAgICAgIGlmICh3aWRnZXRzKSB7XG4gICAgICAgICAgICB3aWRnZXRzLnJlbW92ZSh3aWRnZXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB1cGRhdGVEYXNoYm9hcmRSZXBvc2l0b3J5KFwiUmVtb3ZlZCB3aWRnZXQgXCIgKyB3aWRnZXQudGl0bGUpO1xuICAgICAgfTtcblxuICAgICAgZnVuY3Rpb24gY2hhbmdlV2lkZ2V0U2l6ZSh3aWRnZXQsIHNpemVmdW5jLCBzYXZlZnVuYykge1xuICAgICAgICBpZiAoIXdpZGdldCkge1xuICAgICAgICAgIGxvZy5kZWJ1ZyhcIndpZGdldCB1bmRlZmluZWRcIik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBncmlkc3RlciA9IGdldEdyaWRzdGVyKCk7XG4gICAgICAgIGxvZy5kZWJ1ZyhcIldpZGdldCBJRDogXCIsIHdpZGdldC5pZCwgXCIgd2lkZ2V0TWFwOiBcIiwgd2lkZ2V0TWFwKTtcbiAgICAgICAgdmFyIGVudHJ5ID0gd2lkZ2V0TWFwW3dpZGdldC5pZF07XG4gICAgICAgIHZhciB3ID0gZW50cnkud2lkZ2V0O1xuICAgICAgICBzaXplZnVuYyhlbnRyeSk7XG4gICAgICAgIGdyaWRzdGVyLnJlc2l6ZV93aWRnZXQodywgZW50cnkuc2l6ZV94LCBlbnRyeS5zaXplX3kpO1xuICAgICAgICBncmlkc3Rlci5zZXRfZG9tX2dyaWRfaGVpZ2h0KCk7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIHNhdmVmdW5jKHdpZGdldCk7XG4gICAgICAgIH0sIDUwKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gb25XaWRnZXRSZW5hbWVkKHdpZGdldCkge1xuICAgICAgICB1cGRhdGVEYXNoYm9hcmRSZXBvc2l0b3J5KFwiUmVuYW1lZCB3aWRnZXQgdG8gXCIgKyB3aWRnZXQudGl0bGUpO1xuICAgICAgfTtcblxuICAgICAgZnVuY3Rpb24gdXBkYXRlV2lkZ2V0cygpIHtcbiAgICAgICAgJHNjb3BlLmlkID0gJHNjb3BlLiRldmFsKCdkYXNoYm9hcmRJZCcpIHx8ICRyb3V0ZVBhcmFtc1tcImRhc2hib2FyZElkXCJdO1xuICAgICAgICAkc2NvcGUuaWR4ID0gJHNjb3BlLiRldmFsKCdkYXNoYm9hcmRJbmRleCcpIHx8ICRyb3V0ZVBhcmFtc1tcImRhc2hib2FyZEluZGV4XCJdO1xuICAgICAgICBpZiAoJHNjb3BlLmlkKSB7XG4gICAgICAgICAgJHNjb3BlLiRlbWl0KCdsb2FkRGFzaGJvYXJkcycpO1xuICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkKCRzY29wZS5pZCwgb25EYXNoYm9hcmRMb2FkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZHMoKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgICAgICRzY29wZS4kZW1pdCgnZGFzaGJvYXJkc1VwZGF0ZWQnLCBkYXNoYm9hcmRzKTtcblxuICAgICAgICAgICAgdmFyIGlkeCA9ICRzY29wZS5pZHggPyBwYXJzZUludCgkc2NvcGUuaWR4KSA6IDA7XG4gICAgICAgICAgICB2YXIgaWQgPSBudWxsO1xuICAgICAgICAgICAgaWYgKGRhc2hib2FyZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICB2YXIgZGFzaGJvYXJkID0gZGFzaGJvYXJkcy5sZW5ndGggPiBpZHggPyBkYXNoYm9hcmRzW2lkeF0gOiBkYXNoYm9hcmRbMF07XG4gICAgICAgICAgICAgIGlkID0gZGFzaGJvYXJkLmlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCRzY29wZS4kZXZhbCgnZGFzaGJvYXJkRW1iZWRkZWQnKSkge1xuICAgICAgICAgICAgICBDb3JlLiRhcHBseSgkc2NvcGUpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQpIHtcbiAgICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoXCIvZGFzaGJvYXJkL2lkL1wiICsgaWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoXCIvZGFzaGJvYXJkL2VkaXRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBDb3JlLiRhcHBseSgkc2NvcGUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG9uRGFzaGJvYXJkTG9hZChkYXNoYm9hcmQpIHtcbiAgICAgICAgJHNjb3BlLmRhc2hib2FyZCA9IGRhc2hib2FyZDtcbiAgICAgICAgdmFyIHdpZGdldHMgPSAoKGRhc2hib2FyZCkgPyBkYXNoYm9hcmQud2lkZ2V0cyA6IG51bGwpIHx8IFtdO1xuXG4gICAgICAgIHZhciBtaW5IZWlnaHQgPSAxMDtcbiAgICAgICAgdmFyIG1pbldpZHRoID0gNjtcblxuICAgICAgICBhbmd1bGFyLmZvckVhY2god2lkZ2V0cywgKHdpZGdldCkgPT4ge1xuICAgICAgICAgIGlmICghd2lkZ2V0KSB7XG4gICAgICAgICAgICBsb2cuZGVidWcoXCJVbmRlZmluZWQgd2lkZ2V0LCBza2lwcGluZ1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHdpZGdldC5yb3cpICYmIG1pbkhlaWdodCA8IHdpZGdldC5yb3cpIHtcbiAgICAgICAgICAgIG1pbkhlaWdodCA9IHdpZGdldC5yb3cgKyAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQod2lkZ2V0LnNpemVfeFxuICAgICAgICAgICAgICAmJiBhbmd1bGFyLmlzRGVmaW5lZCh3aWRnZXQuY29sKSkpIHtcbiAgICAgICAgICAgIHZhciByaWdodEVkZ2UgPSB3aWRnZXQuY29sICsgd2lkZ2V0LnNpemVfeDtcbiAgICAgICAgICAgIGlmIChyaWdodEVkZ2UgPiBtaW5XaWR0aCkge1xuICAgICAgICAgICAgICBtaW5XaWR0aCA9IHJpZ2h0RWRnZSArIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZ3JpZHN0ZXIgPSAkZWxlbWVudC5ncmlkc3Rlcih7XG4gICAgICAgICAgd2lkZ2V0X21hcmdpbnM6IFtncmlkTWFyZ2luLCBncmlkTWFyZ2luXSxcbiAgICAgICAgICB3aWRnZXRfYmFzZV9kaW1lbnNpb25zOiBbZ3JpZFgsIGdyaWRZXSxcbiAgICAgICAgICBleHRyYV9yb3dzOiBtaW5IZWlnaHQsXG4gICAgICAgICAgZXh0cmFfY29sczogbWluV2lkdGgsXG4gICAgICAgICAgbWF4X3NpemVfeDogbWluV2lkdGgsXG4gICAgICAgICAgbWF4X3NpemVfeTogbWluSGVpZ2h0LFxuICAgICAgICAgIGRyYWdnYWJsZToge1xuICAgICAgICAgICAgc3RvcDogKGV2ZW50LCB1aSkgPT4ge1xuICAgICAgICAgICAgICBpZiAoc2VyaWFsaXplRGFzaGJvYXJkKCkpIHtcbiAgICAgICAgICAgICAgICB1cGRhdGVEYXNoYm9hcmRSZXBvc2l0b3J5KFwiQ2hhbmdpbmcgZGFzaGJvYXJkIGxheW91dFwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSkuZGF0YSgnZ3JpZHN0ZXInKTtcblxuICAgICAgICB2YXIgdGVtcGxhdGUgPSAkdGVtcGxhdGVDYWNoZS5nZXQoVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgXCJ3aWRnZXRUZW1wbGF0ZS5odG1sXCIpKTtcbiAgICAgICAgdmFyIHJlbWFpbmluZyA9IHdpZGdldHMubGVuZ3RoO1xuXG4gICAgICAgIGZ1bmN0aW9uIG1heWJlRmluaXNoVXAoKSB7XG4gICAgICAgICAgcmVtYWluaW5nID0gcmVtYWluaW5nIC0gMTtcbiAgICAgICAgICBpZiAocmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgICAgICBtYWtlUmVzaXphYmxlKCk7XG4gICAgICAgICAgICBnZXRHcmlkc3RlcigpLmVuYWJsZSgpO1xuICAgICAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBkb1JlbW92ZVdpZGdldCgkbW9kYWwsIHdpZGdldCkge1xuICAgICAgICAgIGxvZy5kZWJ1ZyhcIlJlbW92ZSB3aWRnZXQ6IFwiLCB3aWRnZXQpO1xuICAgICAgICAgIHZhciBtb2RhbCA9ICRtb2RhbC5vcGVuKHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAnZGVsZXRlV2lkZ2V0TW9kYWwuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCAnJG1vZGFsSW5zdGFuY2UnLCAoJHNjb3BlLCAkbW9kYWxJbnN0YW5jZSkgPT4ge1xuICAgICAgICAgICAgICAkc2NvcGUud2lkZ2V0ID0gd2lkZ2V0O1xuICAgICAgICAgICAgICAkc2NvcGUub2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgbW9kYWwuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICByZW1vdmVXaWRnZXQoJHNjb3BlLndpZGdldCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBtb2RhbC5kaXNtaXNzKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1dXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBkb1JlbmFtZVdpZGdldCgkbW9kYWwsIHdpZGdldCkge1xuICAgICAgICAgIGxvZy5kZWJ1ZyhcIlJlbmFtZSB3aWRnZXQ6IFwiLCB3aWRnZXQpO1xuICAgICAgICAgIHZhciBtb2RhbCA9ICRtb2RhbC5vcGVuKHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAncmVuYW1lV2lkZ2V0TW9kYWwuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCAnJG1vZGFsSW5zdGFuY2UnLCAoJHNjb3BlLCAkbW9kYWxJbnN0YW5jZSkgPT4ge1xuICAgICAgICAgICAgICAkc2NvcGUud2lkZ2V0ID0gd2lkZ2V0O1xuICAgICAgICAgICAgICAkc2NvcGUuY29uZmlnID0ge1xuICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICd0aXRsZSc6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHdpZGdldC50aXRsZVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgJHNjb3BlLm9rID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgb25XaWRnZXRSZW5hbWVkKCRzY29wZS53aWRnZXQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgbW9kYWwuZGlzbWlzcygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKHdpZGdldHMsICh3aWRnZXQpID0+IHtcbiAgICAgICAgICB2YXIgdHlwZSA9ICdpbnRlcm5hbCc7XG4gICAgICAgICAgaWYgKCdpZnJhbWUnIGluIHdpZGdldCkge1xuICAgICAgICAgICAgdHlwZSA9ICdleHRlcm5hbCc7XG4gICAgICAgICAgfVxuICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnZXh0ZXJuYWwnOlxuICAgICAgICAgICAgICBsb2cuZGVidWcoXCJSZW5kZXJpbmcgZXh0ZXJuYWwgKGlmcmFtZSkgd2lkZ2V0OiBcIiwgd2lkZ2V0LnRpdGxlIHx8IHdpZGdldC5pZCk7XG4gICAgICAgICAgICAgIHZhciBzY29wZSA9ICRzY29wZS4kbmV3KCk7XG4gICAgICAgICAgICAgIHNjb3BlLndpZGdldCA9IHdpZGdldDtcbiAgICAgICAgICAgICAgc2NvcGUucmVtb3ZlV2lkZ2V0ID0gKHdpZGdldCkgPT4gZG9SZW1vdmVXaWRnZXQoJG1vZGFsLCB3aWRnZXQpO1xuICAgICAgICAgICAgICBzY29wZS5yZW5hbWVXaWRnZXQgPSAod2lkZ2V0KSA9PiBkb1JlbmFtZVdpZGdldCgkbW9kYWwsIHdpZGdldCk7XG4gICAgICAgICAgICAgIHZhciB3aWRnZXRCb2R5OmFueSA9IGFuZ3VsYXIuZWxlbWVudCgkdGVtcGxhdGVDYWNoZS5nZXQoVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ2lmcmFtZVdpZGdldFRlbXBsYXRlLmh0bWwnKSkpO1xuICAgICAgICAgICAgICB2YXIgb3V0ZXJEaXYgPSBhbmd1bGFyLmVsZW1lbnQoJHRlbXBsYXRlQ2FjaGUuZ2V0KFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICd3aWRnZXRCbG9ja1RlbXBsYXRlLmh0bWwnKSkpO1xuICAgICAgICAgICAgICB3aWRnZXRCb2R5LmZpbmQoJ2lmcmFtZScpLmF0dHIoJ3NyYycsIHdpZGdldC5pZnJhbWUpO1xuICAgICAgICAgICAgICBvdXRlckRpdi5hcHBlbmQoJGNvbXBpbGUod2lkZ2V0Qm9keSkoc2NvcGUpKTtcbiAgICAgICAgICAgICAgdmFyIHcgPSBncmlkc3Rlci5hZGRfd2lkZ2V0KG91dGVyRGl2LCB3aWRnZXQuc2l6ZV94LCB3aWRnZXQuc2l6ZV95LCB3aWRnZXQuY29sLCB3aWRnZXQucm93KTtcbiAgICAgICAgICAgICAgd2lkZ2V0TWFwW3dpZGdldC5pZF0gPSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0OiB3XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIG1heWJlRmluaXNoVXAoKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdpbnRlcm5hbCc6IFxuICAgICAgICAgICAgICBsb2cuZGVidWcoXCJSZW5kZXJpbmcgaW50ZXJuYWwgd2lkZ2V0OiBcIiwgd2lkZ2V0LnRpdGxlIHx8IHdpZGdldC5pZCk7XG4gICAgICAgICAgICAgIHZhciBwYXRoID0gd2lkZ2V0LnBhdGg7XG4gICAgICAgICAgICAgIHZhciBzZWFyY2ggPSBudWxsO1xuICAgICAgICAgICAgICBpZiAod2lkZ2V0LnNlYXJjaCkge1xuICAgICAgICAgICAgICAgIHNlYXJjaCA9IERhc2hib2FyZC5kZWNvZGVVUklDb21wb25lbnRQcm9wZXJ0aWVzKHdpZGdldC5zZWFyY2gpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmICh3aWRnZXQucm91dGVQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBfLmV4dGVuZChzZWFyY2gsIGFuZ3VsYXIuZnJvbUpzb24od2lkZ2V0LnJvdXRlUGFyYW1zKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdmFyIGhhc2ggPSB3aWRnZXQuaGFzaDsgLy8gVE9ETyBkZWNvZGUgb2JqZWN0P1xuICAgICAgICAgICAgICB2YXIgbG9jYXRpb24gPSBuZXcgUmVjdGFuZ2xlTG9jYXRpb24oJGxvY2F0aW9uLCBwYXRoLCBzZWFyY2gsIGhhc2gpO1xuICAgICAgICAgICAgICBpZiAoIXdpZGdldC5zaXplX3ggfHwgd2lkZ2V0LnNpemVfeCA8IDEpIHtcbiAgICAgICAgICAgICAgICB3aWRnZXQuc2l6ZV94ID0gMTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoIXdpZGdldC5zaXplX3kgfHwgd2lkZ2V0LnNpemVfeSA8IDEpIHtcbiAgICAgICAgICAgICAgICB3aWRnZXQuc2l6ZV95ID0gMTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB2YXIgdG1wTW9kdWxlTmFtZSA9ICdkYXNoYm9hcmQtJyArIHdpZGdldC5pZDtcbiAgICAgICAgICAgICAgdmFyIHBsdWdpbnMgPSBfLmZpbHRlcihoYXd0aW9QbHVnaW5Mb2FkZXIuZ2V0TW9kdWxlcygpLCAobW9kdWxlKSA9PiBhbmd1bGFyLmlzU3RyaW5nKG1vZHVsZSkpO1xuICAgICAgICAgICAgICB2YXIgdG1wTW9kdWxlID0gYW5ndWxhci5tb2R1bGUodG1wTW9kdWxlTmFtZSwgcGx1Z2lucyk7XG5cbiAgICAgICAgICAgICAgZnVuY3Rpb24gZ2V0U2VydmljZXMobW9kdWxlOnN0cmluZywgYW5zd2VyPzphbnkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWFuc3dlcikge1xuICAgICAgICAgICAgICAgICAgYW5zd2VyID0gPGFueT57fTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXy5mb3JFYWNoKGFuZ3VsYXIubW9kdWxlKG1vZHVsZSkucmVxdWlyZXMsIChtKSA9PiBnZXRTZXJ2aWNlcyhtLCBhbnN3ZXIpKTtcbiAgICAgICAgICAgICAgICBfLmZvckVhY2goKDxhbnk+YW5ndWxhci5tb2R1bGUobW9kdWxlKSkuX2ludm9rZVF1ZXVlLCAoYSkgPT4ge1xuICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgYW5zd2VyW2FbMl1bMF1dID0gSGF3dGlvQ29yZS5pbmplY3Rvci5nZXQoYVsyXVswXSk7XG4gICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy9ub3RoaW5nIHRvIGRvXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFuc3dlcjtcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgdmFyIHNlcnZpY2VzID0ge307XG4gICAgICAgICAgICAgIF8uZm9yRWFjaChwbHVnaW5zLCAocGx1Z2luOnN0cmluZykgPT4gcGx1Z2luID8gZ2V0U2VydmljZXMocGx1Z2luLCBzZXJ2aWNlcykgOiBjb25zb2xlLmxvZyhcIm51bGwgcGx1Z2luIG5hbWVcIikpO1xuICAgICAgICAgICAgICAvL2xvZy5kZWJ1ZyhcInNlcnZpY2VzOiBcIiwgc2VydmljZXMpO1xuXG4gICAgICAgICAgICAgIHRtcE1vZHVsZS5jb25maWcoWyckcHJvdmlkZScsICgkcHJvdmlkZSkgPT4ge1xuICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcignSGF3dGlvRGFzaGJvYXJkJywgWyckZGVsZWdhdGUnLCAnJHJvb3RTY29wZScsICgkZGVsZWdhdGUsICRyb290U2NvcGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICRkZWxlZ2F0ZS5pbkRhc2hib2FyZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gJGRlbGVnYXRlO1xuICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IoJyRsb2NhdGlvbicsIFsnJGRlbGVnYXRlJywgKCRkZWxlZ2F0ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgLy9sb2cuZGVidWcoXCJVc2luZyAkbG9jYXRpb246IFwiLCBsb2NhdGlvbik7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gbG9jYXRpb247XG4gICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcignJHJvdXRlJywgWyckZGVsZWdhdGUnLCAoJGRlbGVnYXRlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAvLyByZWFsbHkgaGFuZHkgZm9yIGRlYnVnZ2luZywgbW9zdGx5IHRvIHRlbGwgaWYgYSB3aWRnZXQncyByb3V0ZVxuICAgICAgICAgICAgICAgICAgLy8gaXNuJ3QgYWN0dWFsbHkgYXZhaWxhYmxlIGluIHRoZSBjaGlsZCBhcHBcbiAgICAgICAgICAgICAgICAgIC8vbG9nLmRlYnVnKFwiVXNpbmcgJHJvdXRlOiBcIiwgJGRlbGVnYXRlKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiAkZGVsZWdhdGU7XG4gICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcignJHJvdXRlUGFyYW1zJywgWyckZGVsZWdhdGUnLCAoJGRlbGVnYXRlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAvL2xvZy5kZWJ1ZyhcIlVzaW5nICRyb3V0ZVBhcmFtczogXCIsIHNlYXJjaCk7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gc2VhcmNoO1xuICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICBfLmZvckluKHNlcnZpY2VzLCAoc2VydmljZSwgbmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgc3dpdGNoKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnJGxvY2F0aW9uJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnJHJvdXRlJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnJHJvdXRlUGFyYW1zJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnSGF3dGlvRGFzaGJvYXJkJzpcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZGFzaGJvYXJkUmVwb3NpdG9yeSc6XG4gICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcihuYW1lLCBbKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ0hhd3Rpb0Rhc2hib2FyZFRhYic6XG4gICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcihuYW1lLCBbKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBlbWJlZGRlZDogdHJ1ZSB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdCdWlsZGVyRmFjdG9yeVByb3ZpZGVyJzpcbiAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKG5hbWUsIFsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXREdW1teUJ1aWxkZXJGYWN0b3J5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ0hhd3Rpb05hdic6XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcihuYW1lLCBbKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2V0RHVtbXlIYXd0aW9OYXYoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vdGhpbmcgdG8gZG9cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgLy9sb2cuZGVidWcoXCJuYW1lOiBcIiwgbmFtZSwgXCIgc2VydmljZTogXCIsIHNlcnZpY2UpO1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChfLnN0YXJ0c1dpdGgobmFtZSwgJyQnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKG5hbWUsIFsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGxvZy5kZWJ1ZyhcIlJldHVybmluZyBleGlzdGluZyBzZXJ2aWNlIGZvcjogXCIsIG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VydmljZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlnbm9yZSwgdGhpcydsbCBoYXBwZW4gZm9yIGNvbnN0YW50cyBhbmQgc3R1ZmZcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgdG1wTW9kdWxlLmNvbnRyb2xsZXIoJ0hhd3Rpb0Rhc2hib2FyZC5UaXRsZScsIFtcIiRzY29wZVwiLCBcIiRtb2RhbFwiLCAoJHNjb3BlLCAkbW9kYWwpID0+IHtcbiAgICAgICAgICAgICAgICAkc2NvcGUud2lkZ2V0ID0gd2lkZ2V0O1xuICAgICAgICAgICAgICAgICRzY29wZS5yZW1vdmVXaWRnZXQgPSAod2lkZ2V0KSA9PiBkb1JlbW92ZVdpZGdldCgkbW9kYWwsIHdpZGdldCk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnJlbmFtZVdpZGdldCA9ICh3aWRnZXQpID0+IGRvUmVuYW1lV2lkZ2V0KCRtb2RhbCwgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgfV0pO1xuXG4gICAgICAgICAgICAgIHZhciBkaXY6YW55ID0gJCh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICAgIGRpdi5hdHRyKHsgJ2RhdGEtd2lkZ2V0SWQnOiB3aWRnZXQuaWQgfSk7XG4gICAgICAgICAgICAgIHZhciBib2R5ID0gZGl2LmZpbmQoJy53aWRnZXQtYm9keScpO1xuICAgICAgICAgICAgICBsb2cuZGVidWcoXCJpbmNsdWRlOiBcIiwgd2lkZ2V0LmluY2x1ZGUpO1xuICAgICAgICAgICAgICB2YXIgd2lkZ2V0Qm9keSA9ICR0ZW1wbGF0ZUNhY2hlLmdldCh3aWRnZXQuaW5jbHVkZSk7XG4gICAgICAgICAgICAgICR0aW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgb3V0ZXJEaXYgPSBhbmd1bGFyLmVsZW1lbnQoJHRlbXBsYXRlQ2FjaGUuZ2V0KFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICd3aWRnZXRCbG9ja1RlbXBsYXRlLmh0bWwnKSkpO1xuICAgICAgICAgICAgICAgIGJvZHkuaHRtbCh3aWRnZXRCb2R5KTtcbiAgICAgICAgICAgICAgICBvdXRlckRpdi5odG1sKGRpdik7XG4gICAgICAgICAgICAgICAgYW5ndWxhci5ib290c3RyYXAoZGl2LCBbdG1wTW9kdWxlTmFtZV0pO1xuICAgICAgICAgICAgICAgIHdpZGdldE1hcFt3aWRnZXQuaWRdID0ge1xuICAgICAgICAgICAgICAgICAgd2lkZ2V0OiBncmlkc3Rlci5hZGRfd2lkZ2V0KG91dGVyRGl2LCB3aWRnZXQuc2l6ZV94LCB3aWRnZXQuc2l6ZV95LCB3aWRnZXQuY29sLCB3aWRnZXQucm93KVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgbWF5YmVGaW5pc2hVcCgpO1xuICAgICAgICAgICAgICB9LCA1MCk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHNlcmlhbGl6ZURhc2hib2FyZCgpIHtcbiAgICAgICAgdmFyIGdyaWRzdGVyID0gZ2V0R3JpZHN0ZXIoKTtcbiAgICAgICAgaWYgKGdyaWRzdGVyKSB7XG4gICAgICAgICAgdmFyIGRhdGEgPSBncmlkc3Rlci5zZXJpYWxpemUoKTtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiZ290IGRhdGE6IFwiICsgSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuXG4gICAgICAgICAgdmFyIHdpZGdldHMgPSAkc2NvcGUuZGFzaGJvYXJkLndpZGdldHMgfHwgW107XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coXCJXaWRnZXRzOiBcIiwgd2lkZ2V0cyk7XG5cbiAgICAgICAgICAvLyBsZXRzIGFzc3VtZSB0aGUgZGF0YSBpcyBpbiB0aGUgb3JkZXIgb2YgdGhlIHdpZGdldHMuLi5cbiAgICAgICAgICBhbmd1bGFyLmZvckVhY2god2lkZ2V0cywgKHdpZGdldCwgaWR4KSA9PiB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW2lkeF07XG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgd2lkZ2V0KSB7XG4gICAgICAgICAgICAgIC8vIGxldHMgY29weSB0aGUgdmFsdWVzIGFjcm9zc1xuICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2godmFsdWUsIChhdHRyLCBrZXkpID0+IHdpZGdldFtrZXldID0gYXR0cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBtYWtlUmVzaXphYmxlKCkge1xuICAgICAgICB2YXIgYmxvY2tzOmFueSA9ICQoJy5ncmlkLWJsb2NrJyk7XG4gICAgICAgIGJsb2Nrcy5yZXNpemFibGUoJ2Rlc3Ryb3knKTtcblxuICAgICAgICBibG9ja3MucmVzaXphYmxlKHtcbiAgICAgICAgICBncmlkOiBbZ3JpZFNpemUgKyAoZ3JpZE1hcmdpbiAqIDIpLCBncmlkU2l6ZSArIChncmlkTWFyZ2luICogMildLFxuICAgICAgICAgIGFuaW1hdGU6IGZhbHNlLFxuICAgICAgICAgIG1pbldpZHRoOiBncmlkU2l6ZSxcbiAgICAgICAgICBtaW5IZWlnaHQ6IGdyaWRTaXplLFxuICAgICAgICAgIGF1dG9IaWRlOiBmYWxzZSxcbiAgICAgICAgICBzdGFydDogZnVuY3Rpb24oZXZlbnQsIHVpKSB7XG4gICAgICAgICAgICBncmlkSGVpZ2h0ID0gZ2V0R3JpZHN0ZXIoKS4kZWwuaGVpZ2h0KCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICByZXNpemU6IGZ1bmN0aW9uKGV2ZW50LCB1aSkge1xuICAgICAgICAgICAgLy9zZXQgbmV3IGdyaWQgaGVpZ2h0IGFsb25nIHRoZSBkcmFnZ2luZyBwZXJpb2RcbiAgICAgICAgICAgIHZhciBnID0gZ2V0R3JpZHN0ZXIoKTtcbiAgICAgICAgICAgIHZhciBkZWx0YSA9IGdyaWRTaXplICsgZ3JpZE1hcmdpbiAqIDI7XG4gICAgICAgICAgICBpZiAoZXZlbnQub2Zmc2V0WSA+IGcuJGVsLmhlaWdodCgpKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB2YXIgZXh0cmEgPSBNYXRoLmZsb29yKChldmVudC5vZmZzZXRZIC0gZ3JpZEhlaWdodCkgLyBkZWx0YSArIDEpO1xuICAgICAgICAgICAgICB2YXIgbmV3SGVpZ2h0ID0gZ3JpZEhlaWdodCArIGV4dHJhICogZGVsdGE7XG4gICAgICAgICAgICAgIGcuJGVsLmNzcygnaGVpZ2h0JywgbmV3SGVpZ2h0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHN0b3A6IGZ1bmN0aW9uKGV2ZW50LCB1aSkge1xuICAgICAgICAgICAgdmFyIHJlc2l6ZWQgPSAkKHRoaXMpO1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmVzaXplQmxvY2socmVzaXplZCk7XG4gICAgICAgICAgICB9LCAzMDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgJCgnLnVpLXJlc2l6YWJsZS1oYW5kbGUnKS5ob3ZlcihmdW5jdGlvbigpIHtcbiAgICAgICAgICBnZXRHcmlkc3RlcigpLmRpc2FibGUoKTtcbiAgICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZ2V0R3JpZHN0ZXIoKS5lbmFibGUoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIH1cblxuXG4gICAgICBmdW5jdGlvbiByZXNpemVCbG9jayhlbG1PYmopIHtcbiAgICAgICAgdmFyIGFyZWEgPSBlbG1PYmouZmluZCgnLndpZGdldC1hcmVhJyk7XG4gICAgICAgIHZhciB3ID0gZWxtT2JqLndpZHRoKCkgLSBncmlkU2l6ZTtcbiAgICAgICAgdmFyIGggPSBlbG1PYmouaGVpZ2h0KCkgLSBncmlkU2l6ZTtcblxuICAgICAgICBmb3IgKHZhciBncmlkX3cgPSAxOyB3ID4gMDsgdyAtPSAoZ3JpZFNpemUgKyAoZ3JpZE1hcmdpbiAqIDIpKSkge1xuICAgICAgICAgIGdyaWRfdysrO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgZ3JpZF9oID0gMTsgaCA+IDA7IGggLT0gKGdyaWRTaXplICsgKGdyaWRNYXJnaW4gKiAyKSkpIHtcbiAgICAgICAgICBncmlkX2grKztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB3aWRnZXQgPSB7XG4gICAgICAgICAgaWQ6IGFyZWEuYXR0cignZGF0YS13aWRnZXRJZCcpXG4gICAgICAgIH07XG5cbiAgICAgICAgY2hhbmdlV2lkZ2V0U2l6ZSh3aWRnZXQsIGZ1bmN0aW9uKHdpZGdldCkge1xuICAgICAgICAgIHdpZGdldC5zaXplX3ggPSBncmlkX3c7XG4gICAgICAgICAgd2lkZ2V0LnNpemVfeSA9IGdyaWRfaDtcbiAgICAgICAgfSwgZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgICAgICAgaWYgKHNlcmlhbGl6ZURhc2hib2FyZCgpKSB7XG4gICAgICAgICAgICB1cGRhdGVEYXNoYm9hcmRSZXBvc2l0b3J5KFwiQ2hhbmdlZCBzaXplIG9mIHdpZGdldDogXCIgKyB3aWRnZXQuaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKCRzY29wZS5kYXNoYm9hcmQpIHtcbiAgICAgICAgICB2YXIgY29tbWl0TWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgaWYgKCRzY29wZS5kYXNoYm9hcmQgJiYgJHNjb3BlLmRhc2hib2FyZC50aXRsZSkge1xuICAgICAgICAgICAgY29tbWl0TWVzc2FnZSArPSBcIiBvbiBkYXNoYm9hcmQgXCIgKyAkc2NvcGUuZGFzaGJvYXJkLnRpdGxlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoWyRzY29wZS5kYXNoYm9hcmRdLCBjb21taXRNZXNzYWdlLCBEYXNoYm9hcmQub25PcGVyYXRpb25Db21wbGV0ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZ2V0R3JpZHN0ZXIoKSB7XG4gICAgICAgIHJldHVybiAkZWxlbWVudC5ncmlkc3RlcigpLmRhdGEoJ2dyaWRzdGVyJyk7XG4gICAgICB9XG5cbiAgICB9XTtcblxuICB9XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuICBfbW9kdWxlLmNvbnRyb2xsZXIoXCJEYXNoYm9hcmQuSW1wb3J0Q29udHJvbGxlclwiLCBbXCIkc2NvcGVcIiwgXCIkbG9jYXRpb25cIiwgXCIkcm91dGVQYXJhbXNcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsICgkc2NvcGUsICRsb2NhdGlvbiwgJHJvdXRlUGFyYW1zLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnkpID0+IHtcbiAgICAkc2NvcGUucGxhY2Vob2xkZXIgPSBcIlBhc3RlIHRoZSBKU09OIGhlcmUgZm9yIHRoZSBkYXNoYm9hcmQgY29uZmlndXJhdGlvbiB0byBpbXBvcnQuLi5cIjtcbiAgICAkc2NvcGUuc291cmNlID0gJHNjb3BlLnBsYWNlaG9sZGVyO1xuXG4gICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICBtb2RlOiB7XG4gICAgICAgIG5hbWU6IFwiamF2YXNjcmlwdFwiXG4gICAgICB9XG4gICAgfTtcbiAgICAvLyRzY29wZS5jb2RlTWlycm9yT3B0aW9ucyA9IENvZGVFZGl0b3IuY3JlYXRlRWRpdG9yU2V0dGluZ3Mob3B0aW9ucyk7XG5cblxuICAgICRzY29wZS5pc1ZhbGlkID0gKCkgPT4gJHNjb3BlLnNvdXJjZSAmJiAkc2NvcGUuc291cmNlICE9PSAkc2NvcGUucGxhY2Vob2xkZXI7XG5cbiAgICAkc2NvcGUuaW1wb3J0SlNPTiA9ICgpID0+IHtcbiAgICAgIHZhciBqc29uID0gW107XG4gICAgICAvLyBsZXRzIHBhcnNlIHRoZSBKU09OLi4uXG4gICAgICB0cnkge1xuICAgICAgICBqc29uID0gSlNPTi5wYXJzZSgkc2NvcGUuc291cmNlKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy9IYXd0aW9Db3JlLm5vdGlmaWNhdGlvbihcImVycm9yXCIsIFwiQ291bGQgbm90IHBhcnNlIHRoZSBKU09OXFxuXCIgKyBlKTtcbiAgICAgICAganNvbiA9IFtdO1xuICAgICAgfVxuICAgICAgdmFyIGFycmF5ID0gW107XG4gICAgICBpZiAoYW5ndWxhci5pc0FycmF5KGpzb24pKSB7XG4gICAgICAgIGFycmF5ID0ganNvbjtcbiAgICAgIH0gZWxzZSBpZiAoYW5ndWxhci5pc09iamVjdChqc29uKSkge1xuICAgICAgICBhcnJheS5wdXNoKGpzb24pO1xuICAgICAgfVxuXG4gICAgICBpZiAoYXJyYXkubGVuZ3RoKSB7XG4gICAgICAgIC8vIGxldHMgZW5zdXJlIHdlIGhhdmUgc29tZSB2YWxpZCBpZHMgYW5kIHN0dWZmLi4uXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChhcnJheSwgKGRhc2gsIGluZGV4KSA9PiB7XG4gICAgICAgICAgYW5ndWxhci5jb3B5KGRhc2gsIGRhc2hib2FyZFJlcG9zaXRvcnkuY3JlYXRlRGFzaGJvYXJkKGRhc2gpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhhcnJheSwgXCJJbXBvcnRlZCBkYXNoYm9hcmQgSlNPTlwiLCBEYXNoYm9hcmQub25PcGVyYXRpb25Db21wbGV0ZSk7XG4gICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9lZGl0XCIpO1xuICAgICAgfVxuICAgIH1cbiAgfV0pO1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG4gIF9tb2R1bGUuY29udHJvbGxlcihcIkRhc2hib2FyZC5OYXZCYXJDb250cm9sbGVyXCIsIFtcIiRzY29wZVwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcIiRyb290U2NvcGVcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsICgkc2NvcGUsICRyb3V0ZVBhcmFtcywgJHJvb3RTY29wZSwgZGFzaGJvYXJkUmVwb3NpdG9yeTpEYXNoYm9hcmRSZXBvc2l0b3J5KSA9PiB7XG5cbiAgICAkc2NvcGUuX2Rhc2hib2FyZHMgPSBbXTtcblxuICAgICRzY29wZS5hY3RpdmVEYXNoYm9hcmQgPSAkcm91dGVQYXJhbXNbJ2Rhc2hib2FyZElkJ107XG5cbiAgICAkc2NvcGUuJG9uKCdsb2FkRGFzaGJvYXJkcycsIGxvYWREYXNoYm9hcmRzKTtcblxuICAgICRzY29wZS4kb24oJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkTG9hZGVkKTtcblxuICAgICRzY29wZS5kYXNoYm9hcmRzID0gKCkgPT4ge1xuICAgICAgcmV0dXJuICRzY29wZS5fZGFzaGJvYXJkc1xuICAgIH07XG5cbiAgICAkc2NvcGUub25UYWJSZW5hbWVkID0gZnVuY3Rpb24oZGFzaCkge1xuICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKFtkYXNoXSwgXCJSZW5hbWVkIGRhc2hib2FyZFwiLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZGFzaGJvYXJkTG9hZGVkKGV2ZW50LCBkYXNoYm9hcmRzKSB7XG4gICAgICBsb2cuZGVidWcoXCJuYXZiYXIgZGFzaGJvYXJkTG9hZGVkOiBcIiwgZGFzaGJvYXJkcyk7XG4gICAgICAkc2NvcGUuX2Rhc2hib2FyZHMgPSBkYXNoYm9hcmRzO1xuICAgICAgaWYgKGV2ZW50ID09PSBudWxsKSB7XG4gICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnZGFzaGJvYXJkc1VwZGF0ZWQnLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2FkRGFzaGJvYXJkcyhldmVudCkge1xuICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXREYXNoYm9hcmRzKChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIC8vIHByZXZlbnQgdGhlIGJyb2FkY2FzdCBmcm9tIGhhcHBlbmluZy4uLlxuICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1dKTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuICBleHBvcnQgdmFyIFNoYXJlQ29udHJvbGxlciA9IF9tb2R1bGUuY29udHJvbGxlcihcIkRhc2hib2FyZC5TaGFyZUNvbnRyb2xsZXJcIiwgW1wiJHNjb3BlXCIsIFwiJGxvY2F0aW9uXCIsIFwiJHJvdXRlUGFyYW1zXCIsIFwiZGFzaGJvYXJkUmVwb3NpdG9yeVwiLCAoJHNjb3BlLCAkbG9jYXRpb24sICRyb3V0ZVBhcmFtcywgZGFzaGJvYXJkUmVwb3NpdG9yeTpEYXNoYm9hcmRSZXBvc2l0b3J5KSA9PiB7XG4gICAgdmFyIGlkID0gJHJvdXRlUGFyYW1zW1wiZGFzaGJvYXJkSWRcIl07XG4gICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXREYXNoYm9hcmQoaWQsIG9uRGFzaGJvYXJkTG9hZCk7XG5cbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIG1vZGU6IHtcbiAgICAgICAgICBuYW1lOiBcImphdmFzY3JpcHRcIlxuICAgICAgfVxuICAgIH07XG4gICAgLy8kc2NvcGUuY29kZU1pcnJvck9wdGlvbnMgPSBDb2RlRWRpdG9yLmNyZWF0ZUVkaXRvclNldHRpbmdzKG9wdGlvbnMpO1xuXG4gICAgZnVuY3Rpb24gb25EYXNoYm9hcmRMb2FkKGRhc2hib2FyZCkge1xuICAgICAgJHNjb3BlLmRhc2hib2FyZCA9IERhc2hib2FyZC5jbGVhbkRhc2hib2FyZERhdGEoZGFzaGJvYXJkKTtcblxuICAgICAgJHNjb3BlLmpzb24gPSB7XG4gICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJoYXd0aW8gZGFzaGJvYXJkc1wiLFxuICAgICAgICBcInB1YmxpY1wiOiB0cnVlLFxuICAgICAgICBcImZpbGVzXCI6IHtcbiAgICAgICAgICBcImRhc2hib2FyZHMuanNvblwiOiB7XG4gICAgICAgICAgICBcImNvbnRlbnRcIjogSlNPTi5zdHJpbmdpZnkoJHNjb3BlLmRhc2hib2FyZCwgbnVsbCwgXCIgIFwiKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgJHNjb3BlLnNvdXJjZSA9IEpTT04uc3RyaW5naWZ5KCRzY29wZS5kYXNoYm9hcmQsIG51bGwsIFwiICBcIik7XG4gICAgICBDb3JlLiRhcHBseU5vd09yTGF0ZXIoJHNjb3BlKTtcbiAgICB9XG4gIH1dKTtcbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

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