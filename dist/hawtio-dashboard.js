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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluY2x1ZGVzLmpzIiwiZGFzaGJvYXJkL3RzL2Rhc2hib2FyZEludGVyZmFjZXMudHMiLCJkYXNoYm9hcmQvdHMvZGFzaGJvYXJkSGVscGVycy50cyIsImRhc2hib2FyZC90cy9kYXNoYm9hcmRQbHVnaW4udHMiLCJkYXNoYm9hcmQvdHMvZGFzaGJvYXJkUmVwb3NpdG9yeS50cyIsImRhc2hib2FyZC90cy9lZGl0RGFzaGJvYXJkcy50cyIsImRhc2hib2FyZC90cy9yZWN0YW5nbGVMb2NhdGlvbi50cyIsImRhc2hib2FyZC90cy9ncmlkc3RlckRpcmVjdGl2ZS50cyIsImRhc2hib2FyZC90cy9pbXBvcnQudHMiLCJkYXNoYm9hcmQvdHMvbmF2YmFyLnRzIiwiZGFzaGJvYXJkL3RzL3NoYXJlLnRzIl0sIm5hbWVzIjpbIkRhc2hib2FyZCIsIkRhc2hib2FyZC5jbGVhbkRhc2hib2FyZERhdGEiLCJEYXNoYm9hcmQuZGVjb2RlVVJJQ29tcG9uZW50UHJvcGVydGllcyIsIkRhc2hib2FyZC5vbk9wZXJhdGlvbkNvbXBsZXRlIiwiRGFzaGJvYXJkLnNldFN1YlRhYnMiLCJEYXNoYm9hcmQuZ2V0RHVtbXlCdWlsZGVyIiwiRGFzaGJvYXJkLmdldER1bW15QnVpbGRlckZhY3RvcnkiLCJEYXNoYm9hcmQuZ2V0RHVtbXlIYXd0aW9OYXYiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5IiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5jb25zdHJ1Y3RvciIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkubG9hZERhc2hib2FyZHMiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5LnN0b3JlRGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZGVsZXRlRGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkcyIsIkRhc2hib2FyZC5Mb2NhbERhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkIiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5jcmVhdGVEYXNoYm9hcmQiLCJEYXNoYm9hcmQuTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5LmNsb25lRGFzaGJvYXJkIiwiRGFzaGJvYXJkLkxvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeS5nZXRUeXBlIiwiRGFzaGJvYXJkLnVwZGF0ZURhdGEiLCJEYXNoYm9hcmQuZGFzaGJvYXJkTG9hZGVkIiwiRGFzaGJvYXJkLmRhc2hib2FyZHMiLCJEYXNoYm9hcmQuZGVzZWxlY3RBbGwiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24iLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uY29uc3RydWN0b3IiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uYWJzVXJsIiwiRGFzaGJvYXJkLlJlY3RhbmdsZUxvY2F0aW9uLmhhc2giLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24uaG9zdCIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbi5wYXRoIiwiRGFzaGJvYXJkLlJlY3RhbmdsZUxvY2F0aW9uLnBvcnQiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24ucHJvdG9jb2wiLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24ucmVwbGFjZSIsIkRhc2hib2FyZC5SZWN0YW5nbGVMb2NhdGlvbi5zZWFyY2giLCJEYXNoYm9hcmQuUmVjdGFuZ2xlTG9jYXRpb24udXJsIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLmRlc3Ryb3lXaWRnZXQiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3IucmVtb3ZlV2lkZ2V0IiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLmNoYW5nZVdpZGdldFNpemUiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3Iub25XaWRnZXRSZW5hbWVkIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLnVwZGF0ZVdpZGdldHMiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3Iub25EYXNoYm9hcmRMb2FkIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLm9uRGFzaGJvYXJkTG9hZC5tYXliZUZpbmlzaFVwIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLm9uRGFzaGJvYXJkTG9hZC5kb1JlbW92ZVdpZGdldCIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5vbkRhc2hib2FyZExvYWQuZG9SZW5hbWVXaWRnZXQiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3Iub25EYXNoYm9hcmRMb2FkLmdldFNlcnZpY2VzIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLnNlcmlhbGl6ZURhc2hib2FyZCIsIkRhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5tYWtlUmVzaXphYmxlIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLnJlc2l6ZUJsb2NrIiwiRGFzaGJvYXJkLkdyaWRzdGVyRGlyZWN0aXZlLmNvbnN0cnVjdG9yLnVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkiLCJEYXNoYm9hcmQuR3JpZHN0ZXJEaXJlY3RpdmUuY29uc3RydWN0b3IuZ2V0R3JpZHN0ZXIiLCJEYXNoYm9hcmQubG9hZERhc2hib2FyZHMiLCJEYXNoYm9hcmQub25EYXNoYm9hcmRMb2FkIl0sIm1h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QSxTQUFTQSxDQUFDQSxZQUFZQSxDQUFDQSxHQUFHQSxVQUFDQSxLQUFhQSxFQUFFQSxNQUFjQSxFQUFFQSxNQUFjQTt3QkFDdEVBLElBQUlBLE1BQU1BLEdBQUdBLElBQUlBLEdBQUdBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsQ0FBQ0E7d0JBQ3ZDQSxJQUFJQSxVQUFVQSxHQUFHQSxJQUFJQSxHQUFHQSxFQUFFQSxDQUFDQTt3QkFLM0JBLElBQUlBLFNBQVNBLEdBQUdBLElBQUlBLEdBQUdBLENBQUNBLFVBQVVBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBLENBQUNBO3dCQUMzQ0EsU0FBU0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQ3hDQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQSxVQUFDQSxLQUFLQTs0QkFDakJBLEtBQUtBLENBQUNBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLFFBQVFBLEVBQUVBLENBQUNBLFNBQVNBLEVBQUVBLENBQUFBOzRCQUM3Q0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0NBQ1ZBLEtBQUtBLENBQUNBLEtBQUtBLEdBQUdBLEtBQUtBLENBQUNBLFNBQVNBLEVBQUVBLENBQUNBOzRCQUNsQ0EsQ0FBQ0E7NEJBQ0RBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLElBQUlBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBO2dDQUNyQkEsS0FBS0EsQ0FBQ0EsSUFBSUEsR0FBR0EsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsRUFBQ0EsTUFBTUEsRUFBRUEsTUFBTUEsRUFBRUEsTUFBTUEsRUFBRUEsTUFBTUEsRUFBQ0EsQ0FBQ0EsQ0FBQ0EsU0FBU0EsRUFBRUEsQ0FBQ0E7NEJBQzVFQSxDQUFDQTt3QkFDSEEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQ0hBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBLFFBQVFBLEVBQUVBLENBQUNBO29CQUMzQkEsQ0FBQ0EsQ0FBQUE7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SUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsTUFBTUEsQ0FBQ0EsQ0FBQ0E7Z0NBQzdCQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFBQTs0QkFDVkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0NBQ0hBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBO2dDQUNiQSxLQUFLQSxDQUFDQTs0QkFDUkEsQ0FBQ0E7d0JBQ0hBLENBQUNBO3dCQUNEQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTs0QkFDWEEsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FBR0EsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQUE7d0JBQzdCQSxDQUFDQTt3QkFFREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FBR0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7NEJBQ3BCQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQTt3QkFDZkEsQ0FBQ0E7b0JBQ0hBLENBQUNBO29CQUVEQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDdkJBLE1BQU1BLENBQUNBLGFBQWFBLENBQUNBLEdBQUdBLE1BQU1BLENBQUNBLFdBQVdBLENBQUNBO29CQUM3Q0EsQ0FBQ0E7b0JBQ0RBLFlBQVlBLENBQUNBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO29CQUNsQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsUUFBUUEsSUFBSUEsWUFBWUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQ2pDQSxRQUFRQSxHQUFHQSxJQUFJQSxHQUFHQSxFQUFFQSxDQUFDQSxJQUFJQSxDQUFDQSxnQkFBZ0JBLEdBQUdBLFlBQVlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBOzRCQUNsRUEsVUFBVUEsRUFBRUEsV0FBV0E7NEJBQ3ZCQSxTQUFTQSxFQUFFQSxZQUFZQSxHQUFHQSxZQUFZQSxDQUFDQSxFQUFFQTt5QkFDMUNBLENBQUNBLENBQUNBLFdBQVdBLENBQUNBLE1BQU1BLENBQUNBOzZCQUNuQkEsV0FBV0EsQ0FBQ0EsT0FBT0EsQ0FBQ0E7NkJBQ3BCQSxXQUFXQSxDQUFDQSxRQUFRQSxDQUFDQTs2QkFDckJBLFdBQVdBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO29CQUN6QkEsQ0FBQ0E7Z0JBQ0hBLENBQUNBLENBQUNBLENBQUNBO2dCQUdIQSxJQUFJQSxhQUFhQSxHQUFHQSxZQUFZQSxDQUFDQTtnQkFDakNBLG1CQUFtQkEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsUUFBUUEsRUFBRUEsYUFBYUEsRUFBRUEsVUFBQ0EsVUFBVUE7b0JBS3BFQSxFQUFFQSxDQUFDQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDYkEsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQzdEQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtvQkFDdEJBLENBQUNBO2dCQUNIQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUVMQSxDQUFDQSxDQUFDQTtZQUVGQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQTtnQkFFZEEsSUFBSUEsT0FBT0EsR0FBR0EsVUFBVUEsRUFBRUEsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3RDQSxJQUFJQSxLQUFLQSxHQUFHQSxVQUFVQSxHQUFHQSxPQUFPQSxDQUFDQTtnQkFFakNBLElBQUlBLEtBQUtBLEdBQUdBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO29CQUN0QkEsV0FBV0EsRUFBRUEsVUFBVUEsQ0FBQ0EsSUFBSUEsQ0FBQ0Esc0JBQVlBLEVBQUVBLDJCQUEyQkEsQ0FBQ0E7b0JBQ3ZFQSxVQUFVQSxFQUFFQSxDQUFDQSxRQUFRQSxFQUFFQSxnQkFBZ0JBLEVBQUVBLFVBQUNBLE1BQU1BLEVBQUVBLGNBQWNBOzRCQUM5REEsTUFBTUEsQ0FBQ0EsTUFBTUEsR0FBR0E7Z0NBQ2RBLEtBQUtBLEVBQUVBLEtBQUtBOzZCQUNiQSxDQUFBQTs0QkFDREEsTUFBTUEsQ0FBQ0EsTUFBTUEsR0FBR0E7Z0NBQ2RBLFVBQVVBLEVBQUVBO29DQUNWQSxPQUFPQSxFQUFFQTt3Q0FDUEEsSUFBSUEsRUFBRUEsUUFBUUE7cUNBQ2ZBO2lDQUNGQTs2QkFDRkEsQ0FBQ0E7NEJBQ0ZBLE1BQU1BLENBQUNBLEVBQUVBLEdBQUdBO2dDQUNWQSxLQUFLQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQTtnQ0FDZEEsSUFBSUEsS0FBS0EsR0FBR0EsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQUE7Z0NBQy9CQSxJQUFJQSxPQUFPQSxHQUFHQSxtQkFBbUJBLENBQUNBLGVBQWVBLENBQUNBLEVBQUVBLEtBQUtBLEVBQUVBLEtBQUtBLEVBQUVBLENBQUNBLENBQUNBO2dDQUNwRUEsbUJBQW1CQSxDQUFDQSxhQUFhQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxFQUFFQSx5QkFBeUJBLEdBQUdBLEtBQUtBLEVBQUVBLFVBQUNBLFVBQVVBO29DQUV6RkEsV0FBV0EsRUFBRUEsQ0FBQ0E7b0NBQ2RBLG9CQUFVQSxDQUFDQSxHQUFHQSxFQUFFQSxHQUFHQSxDQUFDQSxPQUFPQSxFQUFFQSxFQUFFQSxVQUFVQSxFQUFFQSxVQUFVQSxDQUFDQSxDQUFDQTtvQ0FDdkRBLGVBQWVBLENBQUNBLElBQUlBLEVBQUVBLFVBQVVBLENBQUNBLENBQUNBO2dDQUNwQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7NEJBQ0xBLENBQUNBLENBQUFBOzRCQUNEQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQTtnQ0FDZEEsS0FBS0EsQ0FBQ0EsT0FBT0EsRUFBRUEsQ0FBQ0E7NEJBQ2xCQSxDQUFDQSxDQUFBQTt3QkFDSEEsQ0FBQ0EsQ0FBQ0E7aUJBQ0hBLENBQUNBLENBQUNBO1lBY0xBLENBQUNBLENBQUNBO1lBRUZBLE1BQU1BLENBQUNBLFNBQVNBLEdBQUdBO2dCQUNqQkEsSUFBSUEsYUFBYUEsR0FBR0EsRUFBRUEsQ0FBQ0E7Z0JBQ3ZCQSxJQUFJQSxhQUFhQSxHQUFHQSwwQkFBMEJBLENBQUNBO2dCQUMvQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsYUFBYUEsRUFBRUEsVUFBQ0EsSUFBSUEsRUFBRUEsR0FBR0E7b0JBRTFEQSxJQUFJQSxhQUFhQSxHQUFHQSx1QkFBdUJBLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBO29CQUN6REEsSUFBSUEsT0FBT0EsR0FBR0EsbUJBQW1CQSxDQUFDQSxjQUFjQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtvQkFDdkRBLGFBQWFBLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO2dCQUM5QkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBR0hBLFdBQVdBLEVBQUVBLENBQUNBO2dCQUVkQSxhQUFhQSxHQUFHQSxhQUFhQSxHQUFHQSxhQUFhQSxDQUFDQSxHQUFHQSxDQUFDQSxVQUFDQSxDQUFDQSxJQUFPQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFBQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtnQkFDdkZBLG1CQUFtQkEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsYUFBYUEsRUFBRUEsYUFBYUEsRUFBRUEsVUFBQ0EsVUFBVUE7b0JBQ3pFQSxvQkFBVUEsQ0FBQ0EsR0FBR0EsRUFBRUEsR0FBR0EsQ0FBQ0EsT0FBT0EsRUFBRUEsRUFBRUEsVUFBVUEsRUFBRUEsVUFBVUEsQ0FBQ0EsQ0FBQ0E7b0JBQ3ZEQSxlQUFlQSxDQUFDQSxJQUFJQSxFQUFFQSxVQUFVQSxDQUFDQSxDQUFDQTtnQkFDcENBLENBQUNBLENBQUNBLENBQUNBO1lBQ0xBLENBQUNBLENBQUNBO1lBRUZBLE1BQU1BLENBQUNBLGVBQWVBLEdBQUdBO2dCQUN2QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsTUFBTUEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ2xEQSxJQUFJQSxRQUFRQSxHQUFRQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxDQUFDQSxXQUFXQSxDQUFDQSxhQUFhQSxDQUFDQSxDQUFDQTtvQkFDOURBLElBQUlBLEtBQUtBLEdBQUdBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO3dCQUN0QkEsV0FBV0EsRUFBRUEsVUFBVUEsQ0FBQ0EsSUFBSUEsQ0FBQ0Esc0JBQVlBLEVBQUVBLDJCQUEyQkEsQ0FBQ0E7d0JBQ3ZFQSxVQUFVQSxFQUFFQSxDQUFDQSxRQUFRQSxFQUFFQSxnQkFBZ0JBLEVBQUVBLFVBQUNBLE1BQU1BLEVBQUVBLGNBQWNBO2dDQUM5REEsTUFBTUEsQ0FBQ0EsTUFBTUEsR0FBR0E7b0NBQ2RBLFVBQVVBLEVBQUVBO3dDQUNWQSxPQUFPQSxFQUFFQTs0Q0FDUEEsSUFBSUEsRUFBRUEsUUFBUUE7NENBQ2RBLE9BQU9BLEVBQUVBLFFBQVFBLENBQUNBLEtBQUtBO3lDQUN4QkE7cUNBQ0ZBO2lDQUNGQSxDQUFDQTtnQ0FDRkEsTUFBTUEsQ0FBQ0EsUUFBUUEsR0FBR0EsUUFBUUEsQ0FBQ0E7Z0NBQzNCQSxNQUFNQSxDQUFDQSxFQUFFQSxHQUFHQTtvQ0FDVkEsS0FBS0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0E7b0NBQ2RBLG1CQUFtQkEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsRUFBRUEsbUJBQW1CQSxFQUFFQSxVQUFDQSxVQUFVQTt3Q0FFbkZBLFdBQVdBLEVBQUVBLENBQUNBO3dDQUNkQSxvQkFBVUEsQ0FBQ0EsR0FBR0EsRUFBRUEsR0FBR0EsQ0FBQ0EsT0FBT0EsRUFBRUEsRUFBRUEsVUFBVUEsRUFBRUEsVUFBVUEsQ0FBQ0EsQ0FBQ0E7d0NBQ3ZEQSxlQUFlQSxDQUFDQSxJQUFJQSxFQUFFQSxVQUFVQSxDQUFDQSxDQUFDQTtvQ0FDcENBLENBQUNBLENBQUNBLENBQUNBO2dDQUNMQSxDQUFDQSxDQUFBQTtnQ0FDREEsTUFBTUEsQ0FBQ0EsTUFBTUEsR0FBR0E7b0NBQ2RBLEtBQUtBLENBQUNBLE9BQU9BLEVBQUVBLENBQUNBO2dDQUNsQkEsQ0FBQ0EsQ0FBQUE7NEJBQ0hBLENBQUNBLENBQUNBO3FCQUNIQSxDQUFDQSxDQUFDQTtnQkFDTEEsQ0FBQ0E7WUFDSEEsQ0FBQ0EsQ0FBQ0E7WUFFRkEsTUFBTUEsQ0FBQ0EsZUFBZUEsR0FBR0E7Z0JBQ3ZCQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxZQUFZQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDMUJBLElBQUlBLFFBQVFBLEdBQUdBLE1BQU1BLENBQUNBLFdBQVdBLENBQUNBLGFBQWFBLENBQUNBO29CQUNoREEsSUFBSUEsS0FBS0EsR0FBR0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7d0JBQ3RCQSxXQUFXQSxFQUFFQSxVQUFVQSxDQUFDQSxJQUFJQSxDQUFDQSxzQkFBWUEsRUFBRUEsMkJBQTJCQSxDQUFDQTt3QkFDdkVBLFVBQVVBLEVBQUVBLENBQUNBLFFBQVFBLEVBQUVBLGdCQUFnQkEsRUFBRUEsVUFBQ0EsTUFBTUEsRUFBRUEsY0FBY0E7Z0NBQzlEQSxNQUFNQSxDQUFDQSxRQUFRQSxHQUFHQSxRQUFRQSxDQUFDQTtnQ0FDM0JBLE1BQU1BLENBQUNBLEVBQUVBLEdBQUdBO29DQUNWQSxLQUFLQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQTtvQ0FDZEEsbUJBQW1CQSxDQUFDQSxnQkFBZ0JBLENBQUNBLE1BQU1BLENBQUNBLFFBQVFBLEVBQUVBLFVBQUNBLFVBQVVBO3dDQUUvREEsV0FBV0EsRUFBRUEsQ0FBQ0E7d0NBQ2RBLG9CQUFVQSxDQUFDQSxHQUFHQSxFQUFFQSxHQUFHQSxDQUFDQSxPQUFPQSxFQUFFQSxFQUFFQSxVQUFVQSxFQUFFQSxVQUFVQSxDQUFDQSxDQUFDQTt3Q0FDdkRBLGVBQWVBLENBQUNBLElBQUlBLEVBQUVBLFVBQVVBLENBQUNBLENBQUNBO29DQUNwQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0NBQ0xBLENBQUNBLENBQUFBO2dDQUNEQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQTtvQ0FDZEEsS0FBS0EsQ0FBQ0EsT0FBT0EsRUFBRUEsQ0FBQ0E7Z0NBQ2xCQSxDQUFDQSxDQUFBQTs0QkFDSEEsQ0FBQ0EsQ0FBQ0E7cUJBQ0hBLENBQUNBLENBQUNBO2dCQUNMQSxDQUFDQTtZQUNIQSxDQUFDQSxDQUFDQTtZQUVGQSxNQUFNQSxDQUFDQSxJQUFJQSxHQUFHQTtnQkFDWkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ2hEQSxJQUFJQSxFQUFFQSxHQUFHQSxNQUFNQSxDQUFDQSxhQUFhQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQTtvQkFDcENBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLGdCQUFnQkEsR0FBR0EsRUFBRUEsR0FBR0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ25EQSxDQUFDQTtZQUNIQSxDQUFDQSxDQUFDQTtZQUVGQTtnQkFDRW1CLElBQUlBLEdBQUdBLEdBQUdBLFlBQVlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO2dCQUMvQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ1JBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLGtCQUFrQkEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3ZDQSxDQUFDQTtnQkFFREEsSUFBSUEsV0FBV0EsR0FBR0EsWUFBWUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsQ0FBQ0E7Z0JBQzlDQSxFQUFFQSxDQUFDQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDaEJBLE1BQU1BLENBQUNBLFdBQVdBLEdBQUdBLGtCQUFrQkEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3ZEQSxDQUFDQTtnQkFDREEsSUFBSUEsSUFBSUEsR0FBT0EsWUFBWUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3BDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDVEEsSUFBSUEsR0FBR0Esa0JBQWtCQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtvQkFDaENBLE1BQU1BLENBQUNBLGFBQWFBLEdBQUdBLE9BQU9BLENBQUNBLFFBQVFBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO2dCQUNoREEsQ0FBQ0E7Z0JBQ0RBLElBQUlBLEtBQUtBLEdBQU9BLFlBQVlBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO2dCQUN0Q0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ1ZBLEtBQUtBLEdBQUdBLGtCQUFrQkEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7b0JBQ2xDQSxNQUFNQSxDQUFDQSxXQUFXQSxHQUFHQSxLQUFLQSxDQUFDQTtnQkFDN0JBLENBQUNBO2dCQUVEQSxtQkFBbUJBLENBQUNBLGFBQWFBLENBQUNBLFVBQUNBLFVBQVVBO29CQUMzQ0EsZUFBZUEsQ0FBQ0EsSUFBSUEsRUFBRUEsVUFBVUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3BDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNMQSxDQUFDQTtZQUVEbkIseUJBQXlCQSxLQUFLQSxFQUFFQSxVQUFVQTtnQkFDeENvQixVQUFVQSxDQUFDQSxPQUFPQSxDQUFDQSxVQUFDQSxTQUFTQTtvQkFDM0JBLFNBQVNBLENBQUNBLElBQUlBLEdBQUdBLHdDQUF3Q0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0E7Z0JBQzNFQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDSEEsTUFBTUEsQ0FBQ0EsV0FBV0EsR0FBR0EsVUFBVUEsQ0FBQ0E7Z0JBRWhDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDbkJBLE1BQU1BLENBQUNBLEtBQUtBLENBQUNBLG1CQUFtQkEsRUFBRUEsVUFBVUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ2hEQSxDQUFDQTtnQkFDREEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0E7WUFDMUJBLENBQUNBO1lBRURwQjtnQkFDRXFCLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBLFdBQVdBLENBQUNBO1lBQzVCQSxDQUFDQTtZQUVEckI7Z0JBQ0VzQixNQUFNQSxDQUFDQSxXQUFXQSxDQUFDQSxhQUFhQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUM5Q0EsQ0FBQ0E7UUFFSHRCLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0FBQ05BLENBQUNBLEVBamJNLFNBQVMsS0FBVCxTQUFTLFFBaWJmOztBQ2piRCxJQUFPLFNBQVMsQ0E4RWY7QUE5RUQsV0FBTyxTQUFTLEVBQUMsQ0FBQztJQVFoQkE7UUFNRXVCLDJCQUFtQkEsUUFBNEJBLEVBQUVBLElBQVdBLEVBQUVBLE1BQU1BLEVBQUVBLElBQVdBO1lBTm5GQyxpQkFxRUNBO1lBL0RvQkEsYUFBUUEsR0FBUkEsUUFBUUEsQ0FBb0JBO1lBQzdDQSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQTtZQUNsQkEsSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsTUFBTUEsQ0FBQ0E7WUFDdEJBLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBO1lBQ2xCQSxJQUFJQSxDQUFDQSxHQUFHQSxHQUFHQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUN6QkEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsVUFBQ0EsS0FBS0E7Z0JBQ3BCQSxNQUFNQSxDQUFDQSxLQUFJQSxDQUFDQSxPQUFPQSxDQUFDQTtZQUN0QkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDTEEsQ0FBQ0E7UUFFREQsa0NBQU1BLEdBQU5BO1lBQ0VFLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLEVBQUVBLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLEVBQUVBLEdBQUdBLEdBQUdBLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLEVBQUVBLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLEVBQUVBLEdBQUdBLElBQUlBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBO1FBQ3pGQSxDQUFDQTtRQUVERixnQ0FBSUEsR0FBSkEsVUFBS0EsT0FBcUJBO1lBQXJCRyx1QkFBcUJBLEdBQXJCQSxjQUFxQkE7WUFDeEJBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBO2dCQUNaQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxNQUFNQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTtnQkFDekJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO1lBQ2RBLENBQUNBO1lBQ0RBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBO1FBQ3BCQSxDQUFDQTtRQUVESCxnQ0FBSUEsR0FBSkE7WUFDRUksTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0E7UUFDOUJBLENBQUNBO1FBRURKLGdDQUFJQSxHQUFKQSxVQUFLQSxPQUFxQkE7WUFBckJLLHVCQUFxQkEsR0FBckJBLGNBQXFCQTtZQUN4QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ1pBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO2dCQUN2QkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7WUFDZEEsQ0FBQ0E7WUFDREEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0E7UUFDcEJBLENBQUNBO1FBRURMLGdDQUFJQSxHQUFKQTtZQUNFTSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTtRQUM5QkEsQ0FBQ0E7UUFFRE4sb0NBQVFBLEdBQVJBO1lBQ0VPLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBO1FBQzlCQSxDQUFDQTtRQUVEUCxtQ0FBT0EsR0FBUEE7WUFFRVEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7UUFDZEEsQ0FBQ0E7UUFFRFIsa0NBQU1BLEdBQU5BLFVBQU9BLGFBQXdCQTtZQUF4QlMsNkJBQXdCQSxHQUF4QkEsb0JBQXdCQTtZQUM3QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ2xCQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxNQUFNQSxDQUFDQSxhQUFhQSxDQUFDQSxDQUFDQTtnQkFDL0JBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO1lBQ2RBLENBQUNBO1lBQ0RBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBO1FBQ3RCQSxDQUFDQTtRQUVEVCwrQkFBR0EsR0FBSEEsVUFBSUEsUUFBdUJBO1lBQXZCVSx3QkFBdUJBLEdBQXZCQSxlQUF1QkE7WUFDekJBLEVBQUVBLENBQUNBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBO2dCQUNiQSxJQUFJQSxDQUFDQSxHQUFHQSxHQUFHQSxJQUFJQSxHQUFHQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtnQkFDN0JBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO1lBQ2RBLENBQUNBO1lBQ0RBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBO1FBQ3ZCQSxDQUFDQTtRQUVIVix3QkFBQ0E7SUFBREEsQ0FyRUF2QixBQXFFQ3VCLElBQUF2QjtJQXJFWUEsMkJBQWlCQSxvQkFxRTdCQSxDQUFBQTtBQUNIQSxDQUFDQSxFQTlFTSxTQUFTLEtBQVQsU0FBUyxRQThFZjs7QUM1RUQsSUFBTyxTQUFTLENBcWZmO0FBcmZELFdBQU8sU0FBUyxFQUFDLENBQUM7SUFFaEJBLElBQUlBLE9BQU9BLEdBQWlCQSxTQUFTQSxDQUFDQTtJQUV0Q0EsaUJBQU9BLENBQUNBLFNBQVNBLENBQUNBLGlCQUFpQkEsRUFBRUE7UUFDbkMsT0FBTyxHQUFHLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFDLElBQUk7WUFDbEQsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLElBQUksQ0FBQztRQUMzQyxDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxJQUFJLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0lBQzNDLENBQUMsQ0FBQ0EsQ0FBQ0E7SUFFSEE7UUFBQWtDO1lBQ1NDLGFBQVFBLEdBQUdBLEdBQUdBLENBQUNBO1lBQ2ZBLFlBQU9BLEdBQUdBLElBQUlBLENBQUNBO1lBRWZBLGVBQVVBLEdBQUdBLENBQUNBLFFBQVFBLEVBQUVBLFVBQVVBLEVBQUVBLFFBQVFBLEVBQUVBLFdBQVdBLEVBQUVBLGNBQWNBLEVBQUVBLGdCQUFnQkEsRUFBRUEscUJBQXFCQSxFQUFFQSxVQUFVQSxFQUFFQSxrQkFBa0JBLEVBQUVBLGNBQWNBLEVBQUVBLFFBQVFBLEVBQUVBLE1BQU1BLEVBQUVBLFVBQVVBLEVBQUVBLFVBQUNBLE1BQU1BLEVBQUVBLFFBQVFBLEVBQUVBLE1BQU1BLEVBQUVBLFNBQVNBLEVBQUVBLFlBQVlBLEVBQUVBLGNBQWNBLEVBQUVBLG1CQUF1Q0EsRUFBRUEsUUFBUUEsRUFBRUEsZ0JBQWdCQSxFQUFFQSxZQUFZQSxFQUFFQSxNQUFNQSxFQUFFQSxJQUFJQSxFQUFFQSxRQUFRQTtvQkFFcFhBLElBQUlBLFFBQVFBLEdBQUdBLEdBQUdBLENBQUNBO29CQUNuQkEsSUFBSUEsVUFBVUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7b0JBQ25CQSxJQUFJQSxVQUFVQSxDQUFDQTtvQkFFZkEsSUFBSUEsS0FBS0EsR0FBR0EsUUFBUUEsQ0FBQ0E7b0JBQ3JCQSxJQUFJQSxLQUFLQSxHQUFHQSxRQUFRQSxDQUFDQTtvQkFFckJBLElBQUlBLFNBQVNBLEdBQUdBLEVBQUVBLENBQUNBO29CQUVuQkEsSUFBSUEsbUJBQW1CQSxHQUF1QkEsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EscUJBQXFCQSxDQUFDQSxJQUFJQSxtQkFBbUJBLENBQUNBO29CQUV6R0EsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsVUFBVUEsRUFBRUE7d0JBQ3JCQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxTQUFTQSxFQUFFQSxVQUFDQSxNQUFNQSxFQUFFQSxHQUFHQTs0QkFDckNBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLElBQUlBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBO2dDQUN0QkEsSUFBSUEsS0FBS0EsR0FBR0EsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7Z0NBQzVCQSxLQUFLQSxDQUFDQSxRQUFRQSxFQUFFQSxDQUFDQTs0QkFDbkJBLENBQUNBOzRCQUNEQSxhQUFhQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTt3QkFDeEJBLENBQUNBLENBQUNBLENBQUNBO29CQUNMQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFFSEEsUUFBUUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsVUFBVUEsRUFBRUE7d0JBQ3RCQSxNQUFNQSxDQUFDQSxRQUFRQSxFQUFFQSxDQUFDQTtvQkFDcEJBLENBQUNBLENBQUNBLENBQUNBO29CQUVIQSxVQUFVQSxDQUFDQSxhQUFhQSxFQUFFQSxFQUFFQSxDQUFDQSxDQUFDQTtvQkFFOUJBLHVCQUF1QkEsTUFBTUE7d0JBQzNCQyxJQUFJQSxRQUFRQSxHQUFHQSxXQUFXQSxFQUFFQSxDQUFDQTt3QkFDN0JBLElBQUlBLFVBQVVBLEdBQUdBLElBQUlBLENBQUNBO3dCQUV0QkEsSUFBSUEsVUFBVUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7d0JBQ3RDQSxFQUFFQSxDQUFDQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQTs0QkFDZkEsT0FBT0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7NEJBQzVCQSxVQUFVQSxHQUFHQSxVQUFVQSxDQUFDQSxNQUFNQSxDQUFDQTt3QkFDakNBLENBQUNBO3dCQUNEQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQTs0QkFFaEJBLFVBQVVBLEdBQUdBLFFBQVFBLENBQUNBLElBQUlBLENBQUNBLGtCQUFrQkEsR0FBR0EsTUFBTUEsQ0FBQ0EsRUFBRUEsR0FBR0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0E7d0JBQzdFQSxDQUFDQTt3QkFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsSUFBSUEsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7NEJBQzNCQSxJQUFJQSxDQUFDQTtnQ0FDSEEsUUFBUUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0E7NEJBQ3JDQSxDQUFFQTs0QkFBQUEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7NEJBRWZBLENBQUNBO3dCQUNIQSxDQUFDQTt3QkFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7NEJBQ2ZBLGFBQUdBLENBQUNBLEtBQUtBLENBQUNBLG1CQUFtQkEsRUFBRUEsTUFBTUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7NEJBQzFDQSxVQUFVQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQTt3QkFDdEJBLENBQUNBO29CQUNIQSxDQUFDQTtvQkFFREQsc0JBQXNCQSxNQUFNQTt3QkFDMUJFLGFBQWFBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO3dCQUV0QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7NEJBQ3JCQSxJQUFJQSxPQUFPQSxHQUFHQSxNQUFNQSxDQUFDQSxTQUFTQSxDQUFDQSxPQUFPQSxDQUFDQTs0QkFDdkNBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBO2dDQUNaQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTs0QkFDekJBLENBQUNBO3dCQUNIQSxDQUFDQTt3QkFDREEseUJBQXlCQSxDQUFDQSxpQkFBaUJBLEdBQUdBLE1BQU1BLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO29CQUM5REEsQ0FBQ0E7b0JBQUFGLENBQUNBO29CQUVGQSwwQkFBMEJBLE1BQU1BLEVBQUVBLFFBQVFBLEVBQUVBLFFBQVFBO3dCQUNsREcsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7NEJBQ1pBLGFBQUdBLENBQUNBLEtBQUtBLENBQUNBLGtCQUFrQkEsQ0FBQ0EsQ0FBQ0E7NEJBQzlCQSxNQUFNQSxDQUFDQTt3QkFDVEEsQ0FBQ0E7d0JBQ0RBLElBQUlBLFFBQVFBLEdBQUdBLFdBQVdBLEVBQUVBLENBQUNBO3dCQUM3QkEsYUFBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsYUFBYUEsRUFBRUEsTUFBTUEsQ0FBQ0EsRUFBRUEsRUFBRUEsY0FBY0EsRUFBRUEsU0FBU0EsQ0FBQ0EsQ0FBQ0E7d0JBQy9EQSxJQUFJQSxLQUFLQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTt3QkFDakNBLElBQUlBLENBQUNBLEdBQUdBLEtBQUtBLENBQUNBLE1BQU1BLENBQUNBO3dCQUNyQkEsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7d0JBQ2hCQSxRQUFRQSxDQUFDQSxhQUFhQSxDQUFDQSxDQUFDQSxFQUFFQSxLQUFLQSxDQUFDQSxNQUFNQSxFQUFFQSxLQUFLQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTt3QkFDdERBLFFBQVFBLENBQUNBLG1CQUFtQkEsRUFBRUEsQ0FBQ0E7d0JBQy9CQSxVQUFVQSxDQUFDQTs0QkFDVEEsUUFBUUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7d0JBQ25CQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQSxDQUFDQTtvQkFDVEEsQ0FBQ0E7b0JBRURILHlCQUF5QkEsTUFBTUE7d0JBQzdCSSx5QkFBeUJBLENBQUNBLG9CQUFvQkEsR0FBR0EsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7b0JBQ2pFQSxDQUFDQTtvQkFBQUosQ0FBQ0E7b0JBRUZBO3dCQUNFSyxNQUFNQSxDQUFDQSxFQUFFQSxHQUFHQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQSxhQUFhQSxDQUFDQSxJQUFJQSxZQUFZQSxDQUFDQSxhQUFhQSxDQUFDQSxDQUFDQTt3QkFDdkVBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLE1BQU1BLENBQUNBLEtBQUtBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsSUFBSUEsWUFBWUEsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxDQUFDQTt3QkFDOUVBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBOzRCQUNkQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQSxnQkFBZ0JBLENBQUNBLENBQUNBOzRCQUMvQkEsbUJBQW1CQSxDQUFDQSxZQUFZQSxDQUFDQSxNQUFNQSxDQUFDQSxFQUFFQSxFQUFFQSxlQUFlQSxDQUFDQSxDQUFDQTt3QkFDL0RBLENBQUNBO3dCQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTs0QkFDTkEsbUJBQW1CQSxDQUFDQSxhQUFhQSxDQUFDQSxVQUFDQSxVQUFVQTtnQ0FDM0NBLE1BQU1BLENBQUNBLEtBQUtBLENBQUNBLG1CQUFtQkEsRUFBRUEsVUFBVUEsQ0FBQ0EsQ0FBQ0E7Z0NBRTlDQSxJQUFJQSxHQUFHQSxHQUFHQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxRQUFRQSxDQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtnQ0FDaERBLElBQUlBLEVBQUVBLEdBQUdBLElBQUlBLENBQUNBO2dDQUNkQSxFQUFFQSxDQUFDQSxDQUFDQSxVQUFVQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtvQ0FDMUJBLElBQUlBLFNBQVNBLEdBQUdBLFVBQVVBLENBQUNBLE1BQU1BLEdBQUdBLEdBQUdBLEdBQUdBLFVBQVVBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO29DQUN6RUEsRUFBRUEsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0E7Z0NBQ3BCQSxDQUFDQTtnQ0FDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsbUJBQW1CQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtvQ0FDdENBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO29DQUNwQkEsTUFBTUEsQ0FBQ0E7Z0NBQ1RBLENBQUNBO2dDQUNEQSxFQUFFQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtvQ0FDUEEsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZ0JBQWdCQSxHQUFHQSxFQUFFQSxDQUFDQSxDQUFDQTtnQ0FDeENBLENBQUNBO2dDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtvQ0FDTkEsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsaUJBQWlCQSxDQUFDQSxDQUFDQTtnQ0FDcENBLENBQUNBO2dDQUNEQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTs0QkFDdEJBLENBQUNBLENBQUNBLENBQUNBO3dCQUNMQSxDQUFDQTtvQkFDSEEsQ0FBQ0E7b0JBRURMLHlCQUF5QkEsU0FBU0E7d0JBQ2hDTSxNQUFNQSxDQUFDQSxTQUFTQSxHQUFHQSxTQUFTQSxDQUFDQTt3QkFDN0JBLElBQUlBLE9BQU9BLEdBQUdBLENBQUNBLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBO3dCQUU3REEsSUFBSUEsU0FBU0EsR0FBR0EsRUFBRUEsQ0FBQ0E7d0JBQ25CQSxJQUFJQSxRQUFRQSxHQUFHQSxDQUFDQSxDQUFDQTt3QkFFakJBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLEVBQUVBLFVBQUNBLE1BQU1BOzRCQUM5QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0NBQ1pBLGFBQUdBLENBQUNBLEtBQUtBLENBQUNBLDRCQUE0QkEsQ0FBQ0EsQ0FBQ0E7Z0NBQ3hDQSxNQUFNQSxDQUFDQTs0QkFDVEEsQ0FBQ0E7NEJBQ0RBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLFNBQVNBLEdBQUdBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO2dDQUM1REEsU0FBU0EsR0FBR0EsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7NEJBQzdCQSxDQUFDQTs0QkFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUE7bUNBQzVCQSxPQUFPQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQ0FDdENBLElBQUlBLFNBQVNBLEdBQUdBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBO2dDQUMzQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsU0FBU0EsR0FBR0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0NBQ3pCQSxRQUFRQSxHQUFHQSxTQUFTQSxHQUFHQSxDQUFDQSxDQUFDQTtnQ0FDM0JBLENBQUNBOzRCQUNIQSxDQUFDQTt3QkFDSEEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBRUhBLElBQUlBLFFBQVFBLEdBQUdBLFFBQVFBLENBQUNBLFFBQVFBLENBQUNBOzRCQUMvQkEsY0FBY0EsRUFBRUEsQ0FBQ0EsVUFBVUEsRUFBRUEsVUFBVUEsQ0FBQ0E7NEJBQ3hDQSxzQkFBc0JBLEVBQUVBLENBQUNBLEtBQUtBLEVBQUVBLEtBQUtBLENBQUNBOzRCQUN0Q0EsVUFBVUEsRUFBRUEsU0FBU0E7NEJBQ3JCQSxVQUFVQSxFQUFFQSxRQUFRQTs0QkFDcEJBLFVBQVVBLEVBQUVBLFFBQVFBOzRCQUNwQkEsVUFBVUEsRUFBRUEsU0FBU0E7NEJBQ3JCQSxTQUFTQSxFQUFFQTtnQ0FDVEEsSUFBSUEsRUFBRUEsVUFBQ0EsS0FBS0EsRUFBRUEsRUFBRUE7b0NBQ2RBLEVBQUVBLENBQUNBLENBQUNBLGtCQUFrQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0NBQ3pCQSx5QkFBeUJBLENBQUNBLDJCQUEyQkEsQ0FBQ0EsQ0FBQ0E7b0NBQ3pEQSxDQUFDQTtnQ0FDSEEsQ0FBQ0E7NkJBQ0ZBO3lCQUNGQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTt3QkFFcEJBLElBQUlBLFFBQVFBLEdBQUdBLGNBQWNBLENBQUNBLEdBQUdBLENBQUNBLFVBQVVBLENBQUNBLElBQUlBLENBQUNBLHNCQUFZQSxFQUFFQSxxQkFBcUJBLENBQUNBLENBQUNBLENBQUNBO3dCQUN4RkEsSUFBSUEsU0FBU0EsR0FBR0EsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7d0JBRS9CQTs0QkFDRUMsU0FBU0EsR0FBR0EsU0FBU0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7NEJBQzFCQSxFQUFFQSxDQUFDQSxDQUFDQSxTQUFTQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQ0FDcEJBLGFBQWFBLEVBQUVBLENBQUNBO2dDQUNoQkEsV0FBV0EsRUFBRUEsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0E7Z0NBQ3ZCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTs0QkFDdEJBLENBQUNBO3dCQUNIQSxDQUFDQTt3QkFFREQsd0JBQXdCQSxNQUFNQSxFQUFFQSxNQUFNQTs0QkFDcENFLGFBQUdBLENBQUNBLEtBQUtBLENBQUNBLGlCQUFpQkEsRUFBRUEsTUFBTUEsQ0FBQ0EsQ0FBQ0E7NEJBQ3JDQSxJQUFJQSxLQUFLQSxHQUFHQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtnQ0FDdEJBLFdBQVdBLEVBQUVBLFVBQVVBLENBQUNBLElBQUlBLENBQUNBLHNCQUFZQSxFQUFFQSx3QkFBd0JBLENBQUNBO2dDQUNwRUEsVUFBVUEsRUFBRUEsQ0FBQ0EsUUFBUUEsRUFBRUEsZ0JBQWdCQSxFQUFFQSxVQUFDQSxNQUFNQSxFQUFFQSxjQUFjQTt3Q0FDOURBLE1BQU1BLENBQUNBLE1BQU1BLEdBQUdBLE1BQU1BLENBQUNBO3dDQUN2QkEsTUFBTUEsQ0FBQ0EsRUFBRUEsR0FBR0E7NENBQ1ZBLEtBQUtBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBOzRDQUNkQSxZQUFZQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTt3Q0FDOUJBLENBQUNBLENBQUFBO3dDQUNEQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQTs0Q0FDZEEsS0FBS0EsQ0FBQ0EsT0FBT0EsRUFBRUEsQ0FBQ0E7d0NBQ2xCQSxDQUFDQSxDQUFBQTtvQ0FDSEEsQ0FBQ0EsQ0FBQ0E7NkJBQ0hBLENBQUNBLENBQUNBO3dCQUNMQSxDQUFDQTt3QkFFREYsd0JBQXdCQSxNQUFNQSxFQUFFQSxNQUFNQTs0QkFDcENHLGFBQUdBLENBQUNBLEtBQUtBLENBQUNBLGlCQUFpQkEsRUFBRUEsTUFBTUEsQ0FBQ0EsQ0FBQ0E7NEJBQ3JDQSxJQUFJQSxLQUFLQSxHQUFHQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtnQ0FDdEJBLFdBQVdBLEVBQUVBLFVBQVVBLENBQUNBLElBQUlBLENBQUNBLHNCQUFZQSxFQUFFQSx3QkFBd0JBLENBQUNBO2dDQUNwRUEsVUFBVUEsRUFBRUEsQ0FBQ0EsUUFBUUEsRUFBRUEsZ0JBQWdCQSxFQUFFQSxVQUFDQSxNQUFNQSxFQUFFQSxjQUFjQTt3Q0FDOURBLE1BQU1BLENBQUNBLE1BQU1BLEdBQUdBLE1BQU1BLENBQUNBO3dDQUN2QkEsTUFBTUEsQ0FBQ0EsTUFBTUEsR0FBR0E7NENBQ2RBLFVBQVVBLEVBQUVBO2dEQUNWQSxPQUFPQSxFQUFFQTtvREFDUEEsSUFBSUEsRUFBRUEsUUFBUUE7b0RBQ2RBLE9BQU9BLEVBQUVBLE1BQU1BLENBQUNBLEtBQUtBO2lEQUN0QkE7NkNBQ0ZBO3lDQUNGQSxDQUFDQTt3Q0FDRkEsTUFBTUEsQ0FBQ0EsRUFBRUEsR0FBR0E7NENBQ1ZBLEtBQUtBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBOzRDQUNkQSxlQUFlQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTt3Q0FDakNBLENBQUNBLENBQUFBO3dDQUNEQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQTs0Q0FDZEEsS0FBS0EsQ0FBQ0EsT0FBT0EsRUFBRUEsQ0FBQ0E7d0NBQ2xCQSxDQUFDQSxDQUFBQTtvQ0FDSEEsQ0FBQ0EsQ0FBQ0E7NkJBQ0hBLENBQUNBLENBQUNBO3dCQUNMQSxDQUFDQTt3QkFFREgsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsRUFBRUEsVUFBQ0EsTUFBTUE7NEJBQzlCQSxJQUFJQSxJQUFJQSxHQUFHQSxVQUFVQSxDQUFDQTs0QkFDdEJBLEVBQUVBLENBQUNBLENBQUNBLFFBQVFBLElBQUlBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBO2dDQUN2QkEsSUFBSUEsR0FBR0EsVUFBVUEsQ0FBQ0E7NEJBQ3BCQSxDQUFDQTs0QkFDREEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0NBQ2JBLEtBQUtBLFVBQVVBO29DQUNiQSxhQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxzQ0FBc0NBLEVBQUVBLE1BQU1BLENBQUNBLEtBQUtBLElBQUlBLE1BQU1BLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO29DQUM3RUEsSUFBSUEsS0FBS0EsR0FBR0EsTUFBTUEsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0E7b0NBQzFCQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxNQUFNQSxDQUFDQTtvQ0FDdEJBLEtBQUtBLENBQUNBLFlBQVlBLEdBQUdBLFVBQUNBLE1BQU1BLElBQUtBLE9BQUFBLGNBQWNBLENBQUNBLE1BQU1BLEVBQUVBLE1BQU1BLENBQUNBLEVBQTlCQSxDQUE4QkEsQ0FBQ0E7b0NBQ2hFQSxLQUFLQSxDQUFDQSxZQUFZQSxHQUFHQSxVQUFDQSxNQUFNQSxJQUFLQSxPQUFBQSxjQUFjQSxDQUFDQSxNQUFNQSxFQUFFQSxNQUFNQSxDQUFDQSxFQUE5QkEsQ0FBOEJBLENBQUNBO29DQUNoRUEsSUFBSUEsVUFBVUEsR0FBT0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsY0FBY0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsSUFBSUEsQ0FBQ0Esc0JBQVlBLEVBQUVBLDJCQUEyQkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0NBQ3JIQSxJQUFJQSxRQUFRQSxHQUFHQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxjQUFjQSxDQUFDQSxHQUFHQSxDQUFDQSxVQUFVQSxDQUFDQSxJQUFJQSxDQUFDQSxzQkFBWUEsRUFBRUEsMEJBQTBCQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtvQ0FDOUdBLFVBQVVBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLEVBQUVBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO29DQUNyREEsUUFBUUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0NBQzdDQSxJQUFJQSxDQUFDQSxHQUFHQSxRQUFRQSxDQUFDQSxVQUFVQSxDQUFDQSxRQUFRQSxFQUFFQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxNQUFNQSxDQUFDQSxHQUFHQSxFQUFFQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtvQ0FDNUZBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBO3dDQUNyQkEsTUFBTUEsRUFBRUEsQ0FBQ0E7cUNBQ1ZBLENBQUNBO29DQUNGQSxhQUFhQSxFQUFFQSxDQUFDQTtvQ0FDaEJBLEtBQUtBLENBQUNBO2dDQUNSQSxLQUFLQSxVQUFVQTtvQ0FDYkEsYUFBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsNkJBQTZCQSxFQUFFQSxNQUFNQSxDQUFDQSxLQUFLQSxJQUFJQSxNQUFNQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtvQ0FDcEVBLElBQUlBLElBQUlBLEdBQUdBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO29DQUN2QkEsSUFBSUEsTUFBTUEsR0FBR0EsSUFBSUEsQ0FBQ0E7b0NBQ2xCQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTt3Q0FDbEJBLE1BQU1BLEdBQUdBLFNBQVNBLENBQUNBLDRCQUE0QkEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7b0NBQ2pFQSxDQUFDQTtvQ0FDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0NBQ3ZCQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxPQUFPQSxDQUFDQSxRQUFRQSxDQUFDQSxNQUFNQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQSxDQUFDQTtvQ0FDekRBLENBQUNBO29DQUNEQSxJQUFJQSxJQUFJQSxHQUFHQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtvQ0FDdkJBLElBQUlBLFFBQVFBLEdBQUdBLElBQUlBLDJCQUFpQkEsQ0FBQ0EsU0FBU0EsRUFBRUEsSUFBSUEsRUFBRUEsTUFBTUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7b0NBQ3BFQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxJQUFJQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTt3Q0FDeENBLE1BQU1BLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBO29DQUNwQkEsQ0FBQ0E7b0NBQ0RBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLE1B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QVVBLEdBQUdBLGNBQWNBLENBQUNBLEdBQUdBLENBQUNBLE1BQU1BLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO29DQUNwREEsUUFBUUEsQ0FBQ0E7d0NBQ1BBLElBQUlBLFFBQVFBLEdBQUdBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLGNBQWNBLENBQUNBLEdBQUdBLENBQUNBLFVBQVVBLENBQUNBLElBQUlBLENBQUNBLHNCQUFZQSxFQUFFQSwwQkFBMEJBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO3dDQUM5R0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0E7d0NBQ3RCQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTt3Q0FDbkJBLE9BQU9BLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBLGFBQWFBLENBQUNBLENBQUNBLENBQUNBO3dDQUN4Q0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0E7NENBQ3JCQSxNQUFNQSxFQUFFQSxRQUFRQSxDQUFDQSxVQUFVQSxDQUFDQSxRQUFRQSxFQUFFQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxNQUFNQSxDQUFDQSxHQUFHQSxFQUFFQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQTt5Q0FDNUZBLENBQUNBO3dDQUNGQSxhQUFhQSxFQUFFQSxDQUFDQTtvQ0FDbEJBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBLENBQUNBO29DQUNQQSxLQUFLQSxDQUFDQTs0QkFDVkEsQ0FBQ0E7d0JBQ0hBLENBQUNBLENBQUNBLENBQUNBO29CQUNMQSxDQUFDQTtvQkFFRE47d0JBQ0VXLElBQUlBLFFBQVFBLEdBQUdBLFdBQVdBLEVBQUVBLENBQUNBO3dCQUM3QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7NEJBQ2JBLElBQUlBLElBQUlBLEdBQUdBLFFBQVFBLENBQUNBLFNBQVNBLEVBQUVBLENB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QSxTQUFTQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxDQUFDQTt5QkFDeERBO3FCQUNGQTtpQkFDRkEsQ0FBQ0E7Z0JBRUZBLE1BQU1BLENBQUNBLE1BQU1BLEdBQUdBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBLFNBQVNBLEVBQUVBLElBQUlBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO2dCQUM3REEsSUFBSUEsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtZQUNoQ0EsQ0FBQ0E7UUFDSHBELENBQUNBLENBQUNBLENBQUNBLENBQUNBO0FBQ05BLENBQUNBLEVBN0JNLFNBQVMsS0FBVCxTQUFTLFFBNkJmIiwiZmlsZSI6ImNvbXBpbGVkLmpzIiwic291cmNlc0NvbnRlbnQiOltudWxsLCJtb2R1bGUgRGFzaGJvYXJkIHtcblxuICBleHBvcnQgaW50ZXJmYWNlIERhc2hib2FyZFNlcnZpY2Uge1xuICAgIGhhc0Rhc2hib2FyZDpib29sZWFuO1xuICAgIGluRGFzaGJvYXJkOmJvb2xlYW47XG4gICAgZ2V0QWRkTGluayh0aXRsZT86c3RyaW5nLCB3aWR0aD86bnVtYmVyLCBoZWlnaHQ/Om51bWJlcik6c3RyaW5nO1xuICB9XG5cbiAgZXhwb3J0IGludGVyZmFjZSBTZWFyY2hNYXAge1xuICAgIFtuYW1lOiBzdHJpbmddOiBzdHJpbmc7XG4gIH1cblxuICBleHBvcnQgaW50ZXJmYWNlIERhc2hib2FyZFdpZGdldCB7XG4gICAgaWQ6IHN0cmluZztcbiAgICB0aXRsZTogc3RyaW5nO1xuICAgIHJvdz86IG51bWJlcjtcbiAgICBjb2w/OiBudW1iZXI7XG4gICAgc2l6ZV94PzogbnVtYmVyO1xuICAgIHNpemVfeT86IG51bWJlcjtcbiAgICBwYXRoPzogc3RyaW5nO1xuICAgIHVybD86IHN0cmluZztcbiAgICBpbmNsdWRlPzogc3RyaW5nO1xuICAgIHNlYXJjaD86IFNlYXJjaE1hcFxuICAgIHJvdXRlUGFyYW1zPzogc3RyaW5nO1xuICB9XG5cbiAgZXhwb3J0IGludGVyZmFjZSBEYXNoYm9hcmQge1xuICAgIGlkOiBzdHJpbmc7XG4gICAgdGl0bGU6IHN0cmluZztcbiAgICBncm91cDogc3RyaW5nO1xuICAgIHdpZGdldHM6IEFycmF5PERhc2hib2FyZFdpZGdldD47XG4gIH1cblxuICBleHBvcnQgaW50ZXJmYWNlIERlZmF1bHREYXNoYm9hcmRzIHtcbiAgICBhZGQ6IChkYXNoYmFyZDpEYXNoYm9hcmQpID0+IHZvaWQ7XG4gICAgcmVtb3ZlOiAoaWQ6c3RyaW5nKSA9PiBEYXNoYm9hcmQ7XG4gICAgZ2V0QWxsOiAoKSA9PiBBcnJheTxEYXNoYm9hcmQ+O1xuICB9XG5cbiAgLyoqXG4gICAqIEJhc2UgaW50ZXJmYWNlIHRoYXQgZGFzaGJvYXJkIHJlcG9zaXRvcmllcyBtdXN0IGltcGxlbWVudFxuICAgKlxuICAgKiBAY2xhc3MgRGFzaGJvYXJkUmVwb3NpdG9yeVxuICAgKi9cbiAgZXhwb3J0IGludGVyZmFjZSBEYXNoYm9hcmRSZXBvc2l0b3J5IHtcbiAgICBwdXREYXNoYm9hcmRzOiAoYXJyYXk6YW55W10sIGNvbW1pdE1lc3NhZ2U6c3RyaW5nLCBmbikgPT4gYW55O1xuICAgIGRlbGV0ZURhc2hib2FyZHM6IChhcnJheTpBcnJheTxEYXNoYm9hcmQ+LCBmbikgPT4gYW55O1xuICAgIGdldERhc2hib2FyZHM6IChmbjooZGFzaGJvYXJkczogQXJyYXk8RGFzaGJvYXJkPikgPT4gdm9pZCkgPT4gdm9pZDtcbiAgICBnZXREYXNoYm9hcmQ6IChpZDpzdHJpbmcsIGZuOiAoZGFzaGJvYXJkOiBEYXNoYm9hcmQpID0+IHZvaWQpID0+IGFueTtcbiAgICBjcmVhdGVEYXNoYm9hcmQ6IChvcHRpb25zOmFueSkgPT4gYW55O1xuICAgIGNsb25lRGFzaGJvYXJkOihkYXNoYm9hcmQ6YW55KSA9PiBhbnk7XG4gICAgZ2V0VHlwZTooKSA9PiBzdHJpbmc7XG4gIH1cblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL2luY2x1ZGVzLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZEludGVyZmFjZXMudHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuICBcbiAgZXhwb3J0IHZhciB0ZW1wbGF0ZVBhdGggPSAncGx1Z2lucy9kYXNoYm9hcmQvaHRtbC8nO1xuICBleHBvcnQgdmFyIHBsdWdpbk5hbWUgPSAnZGFzaGJvYXJkJztcblxuICBleHBvcnQgdmFyIGxvZzpMb2dnaW5nLkxvZ2dlciA9IExvZ2dlci5nZXQoJ2hhd3Rpby1kYXNoYm9hcmQnKTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY2xlYW5lZCB1cCB2ZXJzaW9uIG9mIHRoZSBkYXNoYm9hcmQgZGF0YSB3aXRob3V0IGFueSBVSSBzZWxlY3Rpb24gc3RhdGVcbiAgICogQG1ldGhvZCBjbGVhbkRhc2hib2FyZERhdGFcbiAgICogQHN0YXRpY1xuICAgKiBAZm9yIERhc2hib2FyZFxuICAgKiBAcGFyYW0ge2FueX0gaXRlbVxuICAgKiBAcmV0dXJuIHthbnl9XG4gICAqL1xuICBleHBvcnQgZnVuY3Rpb24gY2xlYW5EYXNoYm9hcmREYXRhKGl0ZW0pIHtcbiAgICB2YXIgY2xlYW5JdGVtID0ge307XG4gICAgYW5ndWxhci5mb3JFYWNoKGl0ZW0sICh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICBpZiAoIWFuZ3VsYXIuaXNTdHJpbmcoa2V5KSB8fCAoIWtleS5zdGFydHNXaXRoKFwiJFwiKSAmJiAha2V5LnN0YXJ0c1dpdGgoXCJfXCIpKSkge1xuICAgICAgICBjbGVhbkl0ZW1ba2V5XSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBjbGVhbkl0ZW07XG4gIH1cblxuICAvKipcbiAgICogUnVucyBkZWNvZGVVUklDb21wb25lbnQoKSBvbiBlYWNoIHZhbHVlIGluIHRoZSBvYmplY3RcbiAgICogQG1ldGhvZCBkZWNvZGVVUklDb21wb25lbnRQcm9wZXJ0aWVzXG4gICAqIEBzdGF0aWNcbiAgICogQGZvciBEYXNoYm9hcmRcbiAgICogQHBhcmFtIHthbnl9IGhhc2hcbiAgICogQHJldHVybiB7YW55fVxuICAgKi9cbiAgZXhwb3J0IGZ1bmN0aW9uIGRlY29kZVVSSUNvbXBvbmVudFByb3BlcnRpZXMoaGFzaCkge1xuICAgIGlmICghaGFzaCkge1xuICAgICAgcmV0dXJuIGhhc2g7XG4gICAgfVxuICAgIHZhciBkZWNvZGVIYXNoID0ge307XG4gICAgYW5ndWxhci5mb3JFYWNoKGhhc2gsICh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICBkZWNvZGVIYXNoW2tleV0gPSB2YWx1ZSA/IGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkgOiB2YWx1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVjb2RlSGFzaDtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBvbk9wZXJhdGlvbkNvbXBsZXRlKHJlc3VsdCkge1xuICAgIGNvbnNvbGUubG9nKFwiQ29tcGxldGVkIGFkZGluZyB0aGUgZGFzaGJvYXJkIHdpdGggcmVzcG9uc2UgXCIgKyBKU09OLnN0cmluZ2lmeShyZXN1bHQpKTtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBzZXRTdWJUYWJzKHRhYjphbnksIGJ1aWxkZXIsIGRhc2hib2FyZHM6QXJyYXk8RGFzaGJvYXJkPiwgJHJvb3RTY29wZSkge1xuICAgIGlmICghdGFiIHx8IHRhYi5lbWJlZGRlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH0gXG4gICAgbG9nLmRlYnVnKFwiVXBkYXRpbmcgc3ViLXRhYnNcIik7XG4gICAgaWYgKCF0YWIudGFicykge1xuICAgICAgdGFiLnRhYnMgPSBbXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGFiLnRhYnMubGVuZ3RoID0gMDtcbiAgICB9XG4gICAgbG9nLmRlYnVnKFwidGFiOiBcIiwgdGFiKTtcbiAgICBsb2cuZGVidWcoXCJkYXNoYm9hcmRzOiBcIiwgZGFzaGJvYXJkcyk7XG4gICAgXy5mb3JFYWNoKGRhc2hib2FyZHMsIChkYXNoYm9hcmQpID0+IHtcbiAgICAgIHZhciBjaGlsZCA9IGJ1aWxkZXJcbiAgICAgICAgLmlkKCdkYXNoYm9hcmQtJyArIGRhc2hib2FyZC5pZClcbiAgICAgICAgLnRpdGxlKCgpID0+IGRhc2hib2FyZC50aXRsZSB8fCBkYXNoYm9hcmQuaWQpXG4gICAgICAgIC5ocmVmKCgpID0+IHtcbiAgICAgICAgICB2YXIgdXJpID0gbmV3IFVSSShVcmxIZWxwZXJzLmpvaW4oJy9kYXNoYm9hcmQvaWQnLCBkYXNoYm9hcmQuaWQpKVxuICAgICAgICAgICAgdXJpLnNlYXJjaCh7XG4gICAgICAgICAgICAgICdtYWluLXRhYic6IHBsdWdpbk5hbWUsXG4gICAgICAgICAgICAgICdzdWItdGFiJzogJ2Rhc2hib2FyZC0nICsgZGFzaGJvYXJkLmlkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gdXJpLnRvU3RyaW5nKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5idWlsZCgpO1xuICAgICAgdGFiLnRhYnMucHVzaChjaGlsZCk7XG4gICAgfSk7XG4gICAgdmFyIG1hbmFnZSA9IGJ1aWxkZXJcbiAgICAgIC5pZCgnZGFzaGJvYXJkLW1hbmFnZScpXG4gICAgICAudGl0bGUoKCkgPT4gJzxpIGNsYXNzPVwiZmEgZmEtcGVuY2lsXCI+PC9pPiZuYnNwO01hbmFnZScpXG4gICAgICAuaHJlZigoKSA9PiAnL2Rhc2hib2FyZC9lZGl0P21haW4tdGFiPWRhc2hib2FyZCZzdWItdGFiPWRhc2hib2FyZC1tYW5hZ2UnKVxuICAgICAgLmJ1aWxkKCk7XG4gICAgdGFiLnRhYnMucHVzaChtYW5hZ2UpO1xuICAgIHRhYi50YWJzLmZvckVhY2goKHRhYikgPT4ge1xuICAgICAgdGFiLmlzU2VsZWN0ZWQgPSAoKSA9PiB7XG4gICAgICAgIHZhciBpZCA9IHRhYi5pZC5yZXBsYWNlKCdkYXNoYm9hcmQtJywgJycpO1xuICAgICAgICB2YXIgdXJpID0gbmV3IFVSSSgpO1xuICAgICAgICByZXR1cm4gdXJpLnF1ZXJ5KHRydWUpWydzdWItdGFiJ10gPT09IHRhYi5pZCB8fCBfLmVuZHNXaXRoKHVyaS5wYXRoKCksIGlkKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBsb2cuZGVidWcoXCJVcGRhdGVkIG1haW4gdGFiIHRvOiBcIiwgdGFiKTtcbiAgICAvLyRyb290U2NvcGUuJGJyb2FkY2FzdCgnaGF3dGlvLW5hdi1yZWRyYXcnKTtcbiAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2hhd3Rpby1uYXYtc3VidGFiLXJlZHJhdycpO1xuICAgIENvcmUuJGFwcGx5KCRyb290U2NvcGUpO1xuICB9XG5cblxuICBleHBvcnQgZnVuY3Rpb24gZ2V0RHVtbXlCdWlsZGVyKCkge1xuICAgIHZhciBzZWxmID0ge1xuICAgICAgaWQ6ICgpID0+IHNlbGYsXG4gICAgICBkZWZhdWx0UGFnZTogKCkgPT4gc2VsZixcbiAgICAgIHJhbms6ICgpID0+IHNlbGYsXG4gICAgICByZWxvYWQ6ICgpID0+IHNlbGYsXG4gICAgICBwYWdlOiAoKSA9PiBzZWxmLFxuICAgICAgdGl0bGU6ICgpID0+IHNlbGYsXG4gICAgICB0b29sdGlwOiAoKSA9PiBzZWxmLFxuICAgICAgY29udGV4dDogKCkgPT4gc2VsZixcbiAgICAgIGF0dHJpYnV0ZXM6ICgpID0+IHNlbGYsXG4gICAgICBsaW5rQXR0cmlidXRlczogKCkgPT4gc2VsZixcbiAgICAgIGhyZWY6ICgpID0+IHNlbGYsXG4gICAgICBjbGljazogKCkgPT4gc2VsZixcbiAgICAgIGlzVmFsaWQ6ICgpID0+IHNlbGYsXG4gICAgICBzaG93OiAoKSA9PiBzZWxmLFxuICAgICAgaXNTZWxlY3RlZDogKCkgPT4gc2VsZixcbiAgICAgIHRlbXBsYXRlOiAoKSA9PiBzZWxmLFxuICAgICAgdGFiczogKCkgPT4gc2VsZixcbiAgICAgIHN1YlBhdGg6ICgpID0+IHNlbGYsXG4gICAgICBidWlsZDogKCkgPT4ge31cbiAgICB9XG4gICAgcmV0dXJuIHNlbGY7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gZ2V0RHVtbXlCdWlsZGVyRmFjdG9yeSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY3JlYXRlOiAoKSA9PiBnZXREdW1teUJ1aWxkZXIoKSxcbiAgICAgIGpvaW46ICgpID0+ICcnLFxuICAgICAgY29uZmlndXJlUm91dGluZzogKCkgPT4ge31cbiAgICB9XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gZ2V0RHVtbXlIYXd0aW9OYXYoKSB7XG4gICAgdmFyIG5hdiA9IHtcbiAgICAgIGJ1aWxkZXI6ICgpID0+IGdldER1bW15QnVpbGRlcigpLFxuICAgICAgYWRkOiAoKSA9PiB7fSxcbiAgICAgIHJlbW92ZTogKCkgPT4gW10sXG4gICAgICBpdGVyYXRlOiAoKSA9PiBudWxsLFxuICAgICAgb246ICgpID0+IHVuZGVmaW5lZCxcbiAgICAgIHNlbGVjdGVkOiAoKSA9PiB1bmRlZmluZWRcbiAgICB9XG4gICAgcmV0dXJuIG5hdjtcbiAgfVxufVxuIiwiLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICogQG1haW4gRGFzaGJvYXJkXG4gKi9cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRIZWxwZXJzLnRzXCIvPlxubW9kdWxlIERhc2hib2FyZCB7XG4gIFxuICBleHBvcnQgdmFyIF9tb2R1bGUgPSBhbmd1bGFyLm1vZHVsZShwbHVnaW5OYW1lLCBbXSk7XG5cbiAgX21vZHVsZS5jb25maWcoW1wiJHJvdXRlUHJvdmlkZXJcIiwgXCIkcHJvdmlkZVwiLCAoJHJvdXRlUHJvdmlkZXIsICRwcm92aWRlKSA9PiB7XG5cbiAgICAkcHJvdmlkZS5kZWNvcmF0b3IoJ0hhd3Rpb0Rhc2hib2FyZCcsIFsnJGRlbGVnYXRlJywgKCRkZWxlZ2F0ZSkgPT4ge1xuICAgICAgJGRlbGVnYXRlWydoYXNEYXNoYm9hcmQnXSA9IHRydWU7XG4gICAgICAkZGVsZWdhdGVbJ2dldEFkZExpbmsnXSA9ICh0aXRsZT86c3RyaW5nLCBzaXplX3g/Om51bWJlciwgc2l6ZV95PzpudW1iZXIpID0+IHtcbiAgICAgICAgdmFyIHRhcmdldCA9IG5ldyBVUkkoJy9kYXNoYm9hcmQvYWRkJyk7XG4gICAgICAgIHZhciBjdXJyZW50VXJpID0gbmV3IFVSSSgpO1xuICAgICAgICAvKlxuICAgICAgICBjdXJyZW50VXJpLnJlbW92ZVF1ZXJ5KCdtYWluLXRhYicpO1xuICAgICAgICBjdXJyZW50VXJpLnJlbW92ZVF1ZXJ5KCdzdWItdGFiJyk7XG4gICAgICAgICovXG4gICAgICAgIHZhciB3aWRnZXRVcmkgPSBuZXcgVVJJKGN1cnJlbnRVcmkucGF0aCgpKTtcbiAgICAgICAgd2lkZ2V0VXJpLnF1ZXJ5KGN1cnJlbnRVcmkucXVlcnkodHJ1ZSkpO1xuICAgICAgICB0YXJnZXQucXVlcnkoKHF1ZXJ5KSA9PiB7XG4gICAgICAgICAgcXVlcnkuaHJlZiA9IHdpZGdldFVyaS50b1N0cmluZygpLmVzY2FwZVVSTCgpXG4gICAgICAgICAgaWYgKHRpdGxlKSB7XG4gICAgICAgICAgICBxdWVyeS50aXRsZSA9IHRpdGxlLmVzY2FwZVVSTCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc2l6ZV94ICYmIHNpemVfeSkge1xuICAgICAgICAgICAgcXVlcnkuc2l6ZSA9IGFuZ3VsYXIudG9Kc29uKHtzaXplX3g6IHNpemVfeCwgc2l6ZV95OiBzaXplX3l9KS5lc2NhcGVVUkwoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGFyZ2V0LnRvU3RyaW5nKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gJGRlbGVnYXRlO1xuICAgIH1dKTtcblxuICAgICRyb3V0ZVByb3ZpZGVyLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9hZGQnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnYWRkVG9EYXNoYm9hcmQuaHRtbCd9KS5cbiAgICAgICAgICAgIHdoZW4oJy9kYXNoYm9hcmQvZWRpdCcsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdlZGl0RGFzaGJvYXJkcy5odG1sJ30pLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9pZHgvOmRhc2hib2FyZEluZGV4Jywge3RlbXBsYXRlVXJsOiBEYXNoYm9hcmQudGVtcGxhdGVQYXRoICsgJ2Rhc2hib2FyZC5odG1sJywgcmVsb2FkT25TZWFyY2g6IGZhbHNlIH0pLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9pZC86ZGFzaGJvYXJkSWQnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnZGFzaGJvYXJkLmh0bWwnLCByZWxvYWRPblNlYXJjaDogZmFsc2UgfSkuXG4gICAgICAgICAgICB3aGVuKCcvZGFzaGJvYXJkL2lkLzpkYXNoYm9hcmRJZC9zaGFyZScsIHt0ZW1wbGF0ZVVybDogRGFzaGJvYXJkLnRlbXBsYXRlUGF0aCArICdzaGFyZS5odG1sJ30pLlxuICAgICAgICAgICAgd2hlbignL2Rhc2hib2FyZC9pbXBvcnQnLCB7dGVtcGxhdGVVcmw6IERhc2hib2FyZC50ZW1wbGF0ZVBhdGggKyAnaW1wb3J0Lmh0bWwnfSk7XG4gIH1dKTtcblxuICBfbW9kdWxlLnZhbHVlKCd1aS5jb25maWcnLCB7XG4gICAgLy8gVGhlIHVpLWpxIGRpcmVjdGl2ZSBuYW1lc3BhY2VcbiAgICBqcToge1xuICAgICAgZ3JpZHN0ZXI6IHtcbiAgICAgICAgd2lkZ2V0X21hcmdpbnM6IFsxMCwgMTBdLFxuICAgICAgICB3aWRnZXRfYmFzZV9kaW1lbnNpb25zOiBbMTQwLCAxNDBdXG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBfbW9kdWxlLmZhY3RvcnkoJ0hhd3Rpb0Rhc2hib2FyZFRhYicsIFsnSGF3dGlvTmF2JywgJ0hhd3Rpb0Rhc2hib2FyZCcsICckdGltZW91dCcsICckcm9vdFNjb3BlJywgJ2Rhc2hib2FyZFJlcG9zaXRvcnknLCAnJGxvY2F0aW9uJywgKG5hdjpIYXd0aW9NYWluTmF2LlJlZ2lzdHJ5LCBkYXNoOkRhc2hib2FyZFNlcnZpY2UsICR0aW1lb3V0LCAkcm9vdFNjb3BlLCBkYXNoYm9hcmRzOkRhc2hib2FyZFJlcG9zaXRvcnksICRsb2NhdGlvbikgPT4ge1xuICAgIHZhciB0YWIgPSA8YW55PiB7XG4gICAgICBlbWJlZGRlZDogdHJ1ZVxuICAgIH07XG4gICAgaWYgKGRhc2guaW5EYXNoYm9hcmQpIHtcbiAgICAgIGxvZy5kZWJ1ZyhcIkVtYmVkZGVkIGluIGEgZGFzaGJvYXJkLCBub3QgaW5pdGlhbGl6aW5nIG91ciBuYXZpZ2F0aW9uIHRhYlwiKTtcbiAgICAgIHJldHVybiB0YWI7XG4gICAgfVxuICAgIC8vIHNwZWNpYWwgY2FzZSBoZXJlLCB3ZSBkb24ndCB3YW50IHRvIG92ZXJ3cml0ZSBvdXIgc3RvcmVkIHRhYiFcbiAgICB2YXIgYnVpbGRlciA9IG5hdi5idWlsZGVyKCk7XG4gICAgdGFiID0gYnVpbGRlci5pZChwbHVnaW5OYW1lKVxuICAgICAgICAgICAgICAgICAgLmhyZWYoKCkgPT4gJy9kYXNoYm9hcmQvaWR4LzAnKVxuICAgICAgICAgICAgICAgICAgLmlzU2VsZWN0ZWQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXy5zdGFydHNXaXRoKCRsb2NhdGlvbi5wYXRoKCksICcvZGFzaGJvYXJkLycpO1xuICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgIC50aXRsZSgoKSA9PiAnRGFzaGJvYXJkJylcbiAgICAgICAgICAgICAgICAgIC5idWlsZCgpO1xuICAgIG5hdi5hZGQodGFiKTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGxvZy5kZWJ1ZyhcIlNldHRpbmcgdXAgZGFzaGJvYXJkIHN1Yi10YWJzXCIpO1xuICAgICAgZGFzaGJvYXJkcy5nZXREYXNoYm9hcmRzKChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgIHNldFN1YlRhYnModGFiLCBidWlsZGVyLCBkYXNoYm9hcmRzLCAkcm9vdFNjb3BlKTtcbiAgICAgIH0pO1xuICAgIH0sIDUwMCk7XG4gICAgbG9nLmRlYnVnKFwiTm90IGVtYmVkZGVkIGluIGEgZGFzaGJvYXJkLCByZXR1cm5pbmcgcHJvcGVyIHRhYlwiKTtcbiAgICByZXR1cm4gdGFiO1xuICB9XSk7XG5cbiAgX21vZHVsZS5ydW4oW1wiSGF3dGlvRGFzaGJvYXJkVGFiXCIsIChIYXd0aW9EYXNoYm9hcmRUYWIpID0+IHtcbiAgICBsb2cuZGVidWcoXCJydW5uaW5nXCIpO1xuICB9XSk7XG5cbiAgaGF3dGlvUGx1Z2luTG9hZGVyLmFkZE1vZHVsZShwbHVnaW5OYW1lKTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkSW50ZXJmYWNlcy50c1wiLz5cbi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xubW9kdWxlIERhc2hib2FyZCB7XG5cbiAgX21vZHVsZS5mYWN0b3J5KCdkYXNoYm9hcmRSZXBvc2l0b3J5JywgWydEZWZhdWx0RGFzaGJvYXJkcycsIChkZWZhdWx0czpEZWZhdWx0RGFzaGJvYXJkcykgPT4ge1xuICAgIHJldHVybiBuZXcgTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5KGRlZmF1bHRzKTtcbiAgfV0pO1xuXG4gIF9tb2R1bGUuZmFjdG9yeSgnRGVmYXVsdERhc2hib2FyZHMnLCBbKCkgPT4ge1xuICAgIHZhciBkZWZhdWx0cyA9IDxBcnJheTxEYXNoYm9hcmQ+PltdO1xuICAgIHZhciBhbnN3ZXIgPSB7XG4gICAgICBhZGQ6IChkYXNoYm9hcmQ6RGFzaGJvYXJkKSA9PiB7XG4gICAgICAgIGRlZmF1bHRzLnB1c2goZGFzaGJvYXJkKTtcbiAgICAgIH0sXG4gICAgICByZW1vdmU6IChpZDpzdHJpbmcpID0+IHtcbiAgICAgICAgcmV0dXJuIF8ucmVtb3ZlKGRlZmF1bHRzLCAoZGFzaGJvYXJkKSA9PiBkYXNoYm9hcmQuaWQgPT09IGlkKTtcbiAgICAgIH0sXG4gICAgICBnZXRBbGw6ICgpID0+IGRlZmF1bHRzXG4gICAgfVxuICAgIHJldHVybiBhbnN3ZXI7XG4gIH1dKTtcblxuICAvKipcbiAgICogQGNsYXNzIExvY2FsRGFzaGJvYXJkUmVwb3NpdG9yeVxuICAgKiBAdXNlcyBEYXNoYm9hcmRSZXBvc2l0b3J5XG4gICAqL1xuICBleHBvcnQgY2xhc3MgTG9jYWxEYXNoYm9hcmRSZXBvc2l0b3J5IGltcGxlbWVudHMgRGFzaGJvYXJkUmVwb3NpdG9yeSB7XG5cbiAgICBwcml2YXRlIGxvY2FsU3RvcmFnZTpXaW5kb3dMb2NhbFN0b3JhZ2UgPSBudWxsO1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBkZWZhdWx0czpEZWZhdWx0RGFzaGJvYXJkcykge1xuICAgICAgdGhpcy5sb2NhbFN0b3JhZ2UgPSBDb3JlLmdldExvY2FsU3RvcmFnZSgpO1xuICAgICAgLypcbiAgICAgIGlmICgndXNlckRhc2hib2FyZHMnIGluIHRoaXMubG9jYWxTdG9yYWdlKSB7XG4gICAgICAgIGxvZy5kZWJ1ZyhcIkZvdW5kIHByZXZpb3VzbHkgc2F2ZWQgZGFzaGJvYXJkc1wiKTtcbiAgICAgICAgaWYgKHRoaXMubG9hZERhc2hib2FyZHMoKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICB0aGlzLnN0b3JlRGFzaGJvYXJkcyhkZWZhdWx0cy5nZXRBbGwoKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc3RvcmVEYXNoYm9hcmRzKGRlZmF1bHRzLmdldEFsbCgpKTtcbiAgICAgIH1cbiAgICAgICovXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBsb2FkRGFzaGJvYXJkcygpIHtcbiAgICAgIHZhciBhbnN3ZXIgPSBhbmd1bGFyLmZyb21Kc29uKGxvY2FsU3RvcmFnZVsndXNlckRhc2hib2FyZHMnXSk7XG4gICAgICBpZiAoIWFuc3dlciB8fCBhbnN3ZXIubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGFuc3dlciA9IHRoaXMuZGVmYXVsdHMuZ2V0QWxsKCk7XG4gICAgICB9XG4gICAgICBsb2cuZGVidWcoXCJyZXR1cm5pbmcgZGFzaGJvYXJkczogXCIsIGFuc3dlcik7XG4gICAgICByZXR1cm4gYW5zd2VyO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RvcmVEYXNoYm9hcmRzKGRhc2hib2FyZHM6YW55W10pIHtcbiAgICAgIGxvZy5kZWJ1ZyhcInN0b3JpbmcgZGFzaGJvYXJkczogXCIsIGRhc2hib2FyZHMpO1xuICAgICAgbG9jYWxTdG9yYWdlWyd1c2VyRGFzaGJvYXJkcyddID0gYW5ndWxhci50b0pzb24oZGFzaGJvYXJkcyk7XG4gICAgICByZXR1cm4gdGhpcy5sb2FkRGFzaGJvYXJkcygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBwdXREYXNoYm9hcmRzKGFycmF5OmFueVtdLCBjb21taXRNZXNzYWdlOnN0cmluZywgZm4pIHtcbiAgICAgIHZhciBkYXNoYm9hcmRzID0gdGhpcy5sb2FkRGFzaGJvYXJkcygpO1xuICAgICAgYXJyYXkuZm9yRWFjaCgoZGFzaCkgPT4ge1xuICAgICAgICB2YXIgZXhpc3RpbmcgPSBkYXNoYm9hcmRzLmZpbmRJbmRleCgoZCkgPT4geyByZXR1cm4gZC5pZCA9PT0gZGFzaC5pZDsgfSk7XG4gICAgICAgIGlmIChleGlzdGluZyA+PSAwKSB7XG4gICAgICAgICAgZGFzaGJvYXJkc1tleGlzdGluZ10gPSBkYXNoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRhc2hib2FyZHMucHVzaChkYXNoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBmbih0aGlzLnN0b3JlRGFzaGJvYXJkcyhkYXNoYm9hcmRzKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlbGV0ZURhc2hib2FyZHMoYXJyYXk6YW55W10sIGZuKSB7XG4gICAgICB2YXIgZGFzaGJvYXJkcyA9IHRoaXMubG9hZERhc2hib2FyZHMoKTtcbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChhcnJheSwgKGl0ZW0pID0+IHtcbiAgICAgICAgZGFzaGJvYXJkcy5yZW1vdmUoKGkpID0+IHsgcmV0dXJuIGkuaWQgPT09IGl0ZW0uaWQ7IH0pO1xuICAgICAgfSk7XG4gICAgICBmbih0aGlzLnN0b3JlRGFzaGJvYXJkcyhkYXNoYm9hcmRzKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldERhc2hib2FyZHMoZm4pIHtcbiAgICAgIGZuKHRoaXMubG9hZERhc2hib2FyZHMoKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldERhc2hib2FyZChpZDpzdHJpbmcsIGZuKSB7XG4gICAgICB2YXIgZGFzaGJvYXJkcyA9IHRoaXMubG9hZERhc2hib2FyZHMoKTtcbiAgICAgIHZhciBkYXNoYm9hcmQgPSBkYXNoYm9hcmRzLmZpbmQoKGRhc2hib2FyZCkgPT4geyByZXR1cm4gZGFzaGJvYXJkLmlkID09PSBpZCB9KTtcbiAgICAgIGZuKGRhc2hib2FyZCk7XG4gICAgfVxuXG4gICAgcHVibGljIGNyZWF0ZURhc2hib2FyZChvcHRpb25zOmFueSkge1xuICAgICAgdmFyIGFuc3dlciA9e1xuICAgICAgICB0aXRsZTogXCJOZXcgRGFzaGJvYXJkXCIsXG4gICAgICAgIGdyb3VwOiBcIlBlcnNvbmFsXCIsXG4gICAgICAgIHdpZGdldHM6IFtdXG4gICAgICB9O1xuICAgICAgYW5zd2VyID0gYW5ndWxhci5leHRlbmQoYW5zd2VyLCBvcHRpb25zKTtcbiAgICAgIGFuc3dlclsnaWQnXSA9IENvcmUuZ2V0VVVJRCgpO1xuICAgICAgcmV0dXJuIGFuc3dlcjtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2xvbmVEYXNoYm9hcmQoZGFzaGJvYXJkOmFueSkge1xuICAgICAgdmFyIG5ld0Rhc2hib2FyZCA9IE9iamVjdC5jbG9uZShkYXNoYm9hcmQpO1xuICAgICAgbmV3RGFzaGJvYXJkWydpZCddID0gQ29yZS5nZXRVVUlEKCk7XG4gICAgICBuZXdEYXNoYm9hcmRbJ3RpdGxlJ10gPSBcIkNvcHkgb2YgXCIgKyBkYXNoYm9hcmQudGl0bGU7XG4gICAgICByZXR1cm4gbmV3RGFzaGJvYXJkO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRUeXBlKCkge1xuICAgICAgcmV0dXJuICdjb250YWluZXInO1xuICAgIH1cbiAgfVxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcblxuICBfbW9kdWxlLmNvbnRyb2xsZXIoXCJEYXNoYm9hcmQuRWRpdERhc2hib2FyZHNDb250cm9sbGVyXCIsIFtcIiRzY29wZVwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcIiRyb3V0ZVwiLCBcIiRsb2NhdGlvblwiLCBcIiRyb290U2NvcGVcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsIFwiSGF3dGlvTmF2XCIsIFwiJHRpbWVvdXRcIiwgXCIkdGVtcGxhdGVDYWNoZVwiLCBcIiRtb2RhbFwiLCBcIkhhd3Rpb0Rhc2hib2FyZFRhYlwiLCAoJHNjb3BlLCAkcm91dGVQYXJhbXMsICRyb3V0ZSwgJGxvY2F0aW9uLCAkcm9vdFNjb3BlLCBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnksIG5hdiwgJHRpbWVvdXQsICR0ZW1wbGF0ZUNhY2hlLCAkbW9kYWwsIHRhYikgPT4ge1xuXG4gICAgJHNjb3BlLl9kYXNoYm9hcmRzID0gW107XG5cbiAgICAkcm9vdFNjb3BlLiRvbignZGFzaGJvYXJkc1VwZGF0ZWQnLCBkYXNoYm9hcmRMb2FkZWQpO1xuXG4gICAgJHNjb3BlLmhhc1VybCA9ICgpID0+IHtcbiAgICAgIHJldHVybiAoJHNjb3BlLnVybCkgPyB0cnVlIDogZmFsc2U7XG4gICAgfTtcblxuICAgICRzY29wZS5oYXNTZWxlY3Rpb24gPSAoKSA9PiB7XG4gICAgICByZXR1cm4gJHNjb3BlLmdyaWRPcHRpb25zLnNlbGVjdGVkSXRlbXMubGVuZ3RoICE9PSAwO1xuICAgIH07XG5cbiAgICAkc2NvcGUuZ3JpZE9wdGlvbnMgPSB7XG4gICAgICBzZWxlY3RlZEl0ZW1zOiBbXSxcbiAgICAgIHNob3dGaWx0ZXI6IGZhbHNlLFxuICAgICAgc2hvd0NvbHVtbk1lbnU6IGZhbHNlLFxuICAgICAgZmlsdGVyT3B0aW9uczoge1xuICAgICAgICBmaWx0ZXJUZXh0OiAnJ1xuICAgICAgfSxcbiAgICAgIGRhdGE6ICdfZGFzaGJvYXJkcycsXG4gICAgICBzZWxlY3RXaXRoQ2hlY2tib3hPbmx5OiB0cnVlLFxuICAgICAgc2hvd1NlbGVjdGlvbkNoZWNrYm94OiB0cnVlLFxuICAgICAgY29sdW1uRGVmczogW1xuICAgICAgICB7XG4gICAgICAgICAgZmllbGQ6ICd0aXRsZScsXG4gICAgICAgICAgZGlzcGxheU5hbWU6ICdEYXNoYm9hcmQnLFxuICAgICAgICAgIGNlbGxUZW1wbGF0ZTogJHRlbXBsYXRlQ2FjaGUuZ2V0KFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdlZGl0RGFzaGJvYXJkVGl0bGVDZWxsLmh0bWwnKSlcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGZpZWxkOiAnZ3JvdXAnLFxuICAgICAgICAgIGRpc3BsYXlOYW1lOiAnR3JvdXAnXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgfTtcblxuICAgIHZhciBkb1VwZGF0ZSA9IF8uZGVib3VuY2UodXBkYXRlRGF0YSwgMTApO1xuXG4gICAgLy8gaGVscGVycyBzbyB3ZSBjYW4gZW5hYmxlL2Rpc2FibGUgcGFydHMgb2YgdGhlIFVJIGRlcGVuZGluZyBvbiBob3dcbiAgICAvLyBkYXNoYm9hcmQgZGF0YSBpcyBzdG9yZWRcbiAgICAvKlxuICAgICRzY29wZS51c2luZ0dpdCA9ICgpID0+IHtcbiAgICAgIHJldHVybiBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldFR5cGUoKSA9PT0gJ2dpdCc7XG4gICAgfTtcblxuICAgICRzY29wZS51c2luZ0ZhYnJpYyA9ICgpID0+IHtcbiAgICAgIHJldHVybiBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldFR5cGUoKSA9PT0gJ2ZhYnJpYyc7XG4gICAgfTtcblxuICAgICRzY29wZS51c2luZ0xvY2FsID0gKCkgPT4ge1xuICAgICAgcmV0dXJuIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0VHlwZSgpID09PSAnY29udGFpbmVyJztcbiAgICB9O1xuXG4gICAgaWYgKCRzY29wZS51c2luZ0ZhYnJpYygpKSB7XG4gICAgICAkc2NvcGUuZ3JpZE9wdGlvbnMuY29sdW1uRGVmcy5hZGQoW3tcbiAgICAgICAgZmllbGQ6ICd2ZXJzaW9uSWQnLFxuICAgICAgICBkaXNwbGF5TmFtZTogJ1ZlcnNpb24nXG4gICAgICB9LCB7XG4gICAgICAgIGZpZWxkOiAncHJvZmlsZUlkJyxcbiAgICAgICAgZGlzcGxheU5hbWU6ICdQcm9maWxlJ1xuICAgICAgfSwge1xuICAgICAgICBmaWVsZDogJ2ZpbGVOYW1lJyxcbiAgICAgICAgZGlzcGxheU5hbWU6ICdGaWxlIE5hbWUnXG4gICAgICB9XSk7XG4gICAgfVxuICAgICovXG5cbiAgICAkdGltZW91dChkb1VwZGF0ZSwgMTApO1xuXG4gICAgJHNjb3BlLiRvbihcIiRyb3V0ZUNoYW5nZVN1Y2Nlc3NcIiwgZnVuY3Rpb24gKGV2ZW50LCBjdXJyZW50LCBwcmV2aW91cykge1xuICAgICAgLy8gbGV0cyBkbyB0aGlzIGFzeW5jaHJvbm91c2x5IHRvIGF2b2lkIEVycm9yOiAkZGlnZXN0IGFscmVhZHkgaW4gcHJvZ3Jlc3NcbiAgICAgICR0aW1lb3V0KGRvVXBkYXRlLCAxMCk7XG4gICAgfSk7XG5cbiAgICAkc2NvcGUuYWRkVmlld1RvRGFzaGJvYXJkID0gKCkgPT4ge1xuICAgICAgdmFyIG5leHRIcmVmID0gbnVsbDtcbiAgICAgIHZhciBzZWxlY3RlZCA9ICRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zO1xuICAgICAgdmFyIGN1cnJlbnRVcmwgPSBuZXcgVVJJKCk7XG4gICAgICB2YXIgY29uZmlnID0gY3VycmVudFVybC5xdWVyeSh0cnVlKTtcbiAgICAgIHZhciBocmVmID0gY29uZmlnWydocmVmJ107XG4gICAgICB2YXIgaWZyYW1lID0gY29uZmlnWydpZnJhbWUnXTtcbiAgICAgIHZhciB0eXBlID0gJ2hyZWYnO1xuICAgICAgaWYgKGhyZWYpIHtcbiAgICAgICAgaHJlZiA9IGhyZWYudW5lc2NhcGVVUkwoKTtcbiAgICAgICAgaHJlZiA9IENvcmUudHJpbUxlYWRpbmcoaHJlZiwgJyMnKTtcbiAgICAgIH0gZWxzZSBpZiAoaWZyYW1lKSB7XG4gICAgICAgIGlmcmFtZSA9IGlmcmFtZS51bmVzY2FwZVVSTCgpO1xuICAgICAgICB0eXBlID0gJ2lmcmFtZSc7XG4gICAgICB9XG4gICAgICB2YXIgd2lkZ2V0VVJJID0gPGFueT4gdW5kZWZpbmVkO1xuICAgICAgc3dpdGNoKHR5cGUpIHtcbiAgICAgICAgY2FzZSAnaHJlZic6XG4gICAgICAgICAgbG9nLmRlYnVnKFwiaHJlZjogXCIsIGhyZWYpO1xuICAgICAgICAgIHdpZGdldFVSSSA9IG5ldyBVUkkoaHJlZik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2lmcmFtZSc6XG4gICAgICAgICAgbG9nLmRlYnVnKFwiaWZyYW1lOiBcIiwgaWZyYW1lKTtcbiAgICAgICAgICB3aWRnZXRVUkkgPSBuZXcgVVJJKGlmcmFtZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgbG9nLmRlYnVnKFwidHlwZSB1bmtub3duXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBzaXplU3RyID0gPGFueT4gY29uZmlnWydzaXplJ107XG4gICAgICBpZiAoc2l6ZVN0cikge1xuICAgICAgICBzaXplU3RyID0gc2l6ZVN0ci51bmVzY2FwZVVSTCgpO1xuICAgICAgfVxuICAgICAgdmFyIHNpemUgPSBhbmd1bGFyLmZyb21Kc29uKHNpemVTdHIpIHx8IHsgc2l6ZV94OiAxLCBzaXplX3k6IDEgfTtcbiAgICAgIHZhciB0aXRsZSA9IChjb25maWdbJ3RpdGxlJ10gfHwgJycpLnVuZXNjYXBlVVJMKCk7XG4gICAgICB2YXIgdGVtcGxhdGVXaWRnZXQgPSB7XG4gICAgICAgIGlkOiBDb3JlLmdldFVVSUQoKSxcbiAgICAgICAgcm93OiAxLFxuICAgICAgICBjb2w6IDEsXG4gICAgICAgIHNpemVfeDogc2l6ZS5zaXplX3gsXG4gICAgICAgIHNpemVfeTogc2l6ZS5zaXplX3ksXG4gICAgICAgIHRpdGxlOiB0aXRsZVxuICAgICAgfVxuICAgICAgYW5ndWxhci5mb3JFYWNoKHNlbGVjdGVkLCAoc2VsZWN0ZWRJdGVtKSA9PiB7XG5cbiAgICAgICAgdmFyIHdpZGdldCA9IF8uY2xvbmVEZWVwKHRlbXBsYXRlV2lkZ2V0KTtcblxuICAgICAgICBpZiAoIXNlbGVjdGVkSXRlbS53aWRnZXRzKSB7XG4gICAgICAgICAgc2VsZWN0ZWRJdGVtLndpZGdldHMgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgIGNhc2UgJ2lmcmFtZSc6IFxuICAgICAgICAgICAgd2lkZ2V0ID0gPGFueT5fLmV4dGVuZCh7XG4gICAgICAgICAgICAgIGlmcmFtZTogaWZyYW1lXG4gICAgICAgICAgICB9LCB3aWRnZXQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnaHJlZic6XG4gICAgICAgICAgICB2YXIgdGV4dCA9IHdpZGdldFVSSS5wYXRoKCk7XG4gICAgICAgICAgICB2YXIgc2VhcmNoID0gd2lkZ2V0VVJJLnF1ZXJ5KHRydWUpO1xuICAgICAgICAgICAgaWYgKCRyb3V0ZSAmJiAkcm91dGUucm91dGVzKSB7XG4gICAgICAgICAgICAgIHZhciB2YWx1ZSA9ICRyb3V0ZS5yb3V0ZXNbdGV4dF07XG4gICAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZVVybCA9IHZhbHVlW1widGVtcGxhdGVVcmxcIl07XG4gICAgICAgICAgICAgICAgaWYgKHRlbXBsYXRlVXJsKSB7XG4gICAgICAgICAgICAgICAgICB3aWRnZXQgPSA8YW55PiBfLmV4dGVuZCh7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IHRleHQsXG4gICAgICAgICAgICAgICAgICAgIGluY2x1ZGU6IHRlbXBsYXRlVXJsLFxuICAgICAgICAgICAgICAgICAgICBzZWFyY2g6IHNlYXJjaCxcbiAgICAgICAgICAgICAgICAgICAgaGFzaDogXCJcIlxuICAgICAgICAgICAgICAgICAgfSwgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETyB3ZSBuZWVkIHRvIGJlIGFibGUgdG8gbWF0Y2ggVVJJIHRlbXBsYXRlcy4uLlxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZmlndXJlIG91dCB0aGUgd2lkdGggb2YgdGhlIGRhc2hcbiAgICAgICAgdmFyIGdyaWRXaWR0aCA9IDA7XG5cbiAgICAgICAgc2VsZWN0ZWRJdGVtLndpZGdldHMuZm9yRWFjaCgodykgPT4ge1xuICAgICAgICAgIHZhciByaWdodFNpZGUgPSB3LmNvbCArIHcuc2l6ZV94O1xuICAgICAgICAgIGlmIChyaWdodFNpZGUgPiBncmlkV2lkdGgpIHtcbiAgICAgICAgICAgIGdyaWRXaWR0aCA9IHJpZ2h0U2lkZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuXG4gICAgICAgIHZhciBsZWZ0ID0gKHcpID0+IHtcbiAgICAgICAgICByZXR1cm4gdy5jb2w7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHJpZ2h0ID0gKHcpICA9PiB7XG4gICAgICAgICAgcmV0dXJuIHcuY29sICsgdy5zaXplX3ggLSAxO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciB0b3AgPSAodykgPT4ge1xuICAgICAgICAgIHJldHVybiB3LnJvdztcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgYm90dG9tID0gKHcpID0+IHtcbiAgICAgICAgICByZXR1cm4gdy5yb3cgKyB3LnNpemVfeSAtIDE7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGNvbGxpc2lvbiA9ICh3MSwgdzIpID0+IHtcbiAgICAgICAgICByZXR1cm4gISggbGVmdCh3MikgPiByaWdodCh3MSkgfHxcbiAgICAgICAgICAgICAgcmlnaHQodzIpIDwgbGVmdCh3MSkgfHxcbiAgICAgICAgICAgICAgdG9wKHcyKSA+IGJvdHRvbSh3MSkgfHxcbiAgICAgICAgICAgICAgYm90dG9tKHcyKSA8IHRvcCh3MSkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5pc0VtcHR5KCkpIHtcbiAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB3aGlsZSAoIWZvdW5kKSB7XG4gICAgICAgICAgd2lkZ2V0LmNvbCA9IDE7XG4gICAgICAgICAgaWYgKHdpZGdldC5jb2wgKyB3aWRnZXQuc2l6ZV94ID4gZ3JpZFdpZHRoKSB7XG4gICAgICAgICAgICAvLyBsZXQncyBub3QgbG9vayBmb3IgYSBwbGFjZSBuZXh0IHRvIGV4aXN0aW5nIHdpZGdldFxuICAgICAgICAgICAgc2VsZWN0ZWRJdGVtLndpZGdldHMuZm9yRWFjaChmdW5jdGlvbih3LCBpZHgpIHtcbiAgICAgICAgICAgICAgaWYgKHdpZGdldC5yb3cgPD0gdy5yb3cpIHtcbiAgICAgICAgICAgICAgICB3aWRnZXQucm93Kys7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKDsgKHdpZGdldC5jb2wgKyB3aWRnZXQuc2l6ZV94KSA8PSBncmlkV2lkdGg7IHdpZGdldC5jb2wrKykge1xuICAgICAgICAgICAgaWYgKCFzZWxlY3RlZEl0ZW0ud2lkZ2V0cy5hbnkoKHcpID0+IHtcbiAgICAgICAgICAgICAgdmFyIGMgPSBjb2xsaXNpb24odywgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgcmV0dXJuIGNcbiAgICAgICAgICAgIH0pKSB7XG4gICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgIHdpZGdldC5yb3cgPSB3aWRnZXQucm93ICsgMVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBqdXN0IGluIGNhc2UsIGtlZXAgdGhlIHNjcmlwdCBmcm9tIHJ1bm5pbmcgYXdheS4uLlxuICAgICAgICAgIGlmICh3aWRnZXQucm93ID4gNTApIHtcbiAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoJHNjb3BlLnJvdXRlUGFyYW1zKSB7XG4gICAgICAgICAgd2lkZ2V0Wydyb3V0ZVBhcmFtcyddID0gJHNjb3BlLnJvdXRlUGFyYW1zO1xuICAgICAgICB9XG4gICAgICAgIHNlbGVjdGVkSXRlbS53aWRnZXRzLnB1c2god2lkZ2V0KTtcbiAgICAgICAgaWYgKCFuZXh0SHJlZiAmJiBzZWxlY3RlZEl0ZW0uaWQpIHtcbiAgICAgICAgICBuZXh0SHJlZiA9IG5ldyBVUkkoKS5wYXRoKFwiL2Rhc2hib2FyZC9pZC9cIiArIHNlbGVjdGVkSXRlbS5pZCkucXVlcnkoe1xuICAgICAgICAgICAgJ21haW4tdGFiJzogJ2Rhc2hib2FyZCcsXG4gICAgICAgICAgICAnc3ViLXRhYic6ICdkYXNoYm9hcmQtJyArIHNlbGVjdGVkSXRlbS5pZFxuICAgICAgICAgIH0pLnJlbW92ZVF1ZXJ5KCdocmVmJylcbiAgICAgICAgICAgIC5yZW1vdmVRdWVyeSgndGl0bGUnKVxuICAgICAgICAgICAgLnJlbW92ZVF1ZXJ5KCdpZnJhbWUnKVxuICAgICAgICAgICAgLnJlbW92ZVF1ZXJ5KCdzaXplJyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBub3cgbGV0cyB1cGRhdGUgdGhlIGFjdHVhbCBkYXNoYm9hcmQgY29uZmlnXG4gICAgICB2YXIgY29tbWl0TWVzc2FnZSA9IFwiQWRkIHdpZGdldFwiO1xuICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKHNlbGVjdGVkLCBjb21taXRNZXNzYWdlLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAvKlxuICAgICAgICBsb2cuZGVidWcoXCJQdXQgZGFzaGJvYXJkczogXCIsIGRhc2hib2FyZHMpO1xuICAgICAgICBsb2cuZGVidWcoXCJOZXh0IGhyZWY6IFwiLCBuZXh0SHJlZi50b1N0cmluZygpKTtcbiAgICAgICAgKi9cbiAgICAgICAgaWYgKG5leHRIcmVmKSB7XG4gICAgICAgICAgJGxvY2F0aW9uLnBhdGgobmV4dEhyZWYucGF0aCgpKS5zZWFyY2gobmV4dEhyZWYucXVlcnkodHJ1ZSkpO1xuICAgICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgfTtcblxuICAgICRzY29wZS5jcmVhdGUgPSAoKSA9PiB7XG5cbiAgICAgIHZhciBjb3VudGVyID0gZGFzaGJvYXJkcygpLmxlbmd0aCArIDE7XG4gICAgICB2YXIgdGl0bGUgPSBcIlVudGl0bGVkXCIgKyBjb3VudGVyO1xuXG4gICAgICB2YXIgbW9kYWwgPSAkbW9kYWwub3Blbih7XG4gICAgICAgIHRlbXBsYXRlVXJsOiBVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAnY3JlYXRlRGFzaGJvYXJkTW9kYWwuaHRtbCcpLFxuICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICckbW9kYWxJbnN0YW5jZScsICgkc2NvcGUsICRtb2RhbEluc3RhbmNlKSA9PiB7XG4gICAgICAgICAgJHNjb3BlLmVudGl0eSA9IHtcbiAgICAgICAgICAgIHRpdGxlOiB0aXRsZVxuICAgICAgICAgIH1cbiAgICAgICAgICAkc2NvcGUuY29uZmlnID0ge1xuICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAndGl0bGUnOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgICRzY29wZS5vayA9ICgpID0+IHtcbiAgICAgICAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgICB2YXIgdGl0bGUgPSAkc2NvcGUuZW50aXR5LnRpdGxlXG4gICAgICAgICAgICB2YXIgbmV3RGFzaCA9IGRhc2hib2FyZFJlcG9zaXRvcnkuY3JlYXRlRGFzaGJvYXJkKHsgdGl0bGU6IHRpdGxlIH0pO1xuICAgICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKFtuZXdEYXNoXSwgXCJDcmVhdGVkIG5ldyBkYXNoYm9hcmQ6IFwiICsgdGl0bGUsIChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgICAgICAgIC8vIGxldCdzIGp1c3QgYmUgc2FmZSBhbmQgZW5zdXJlIHRoZXJlJ3Mgbm8gc2VsZWN0aW9uc1xuICAgICAgICAgICAgICBkZXNlbGVjdEFsbCgpO1xuICAgICAgICAgICAgICBzZXRTdWJUYWJzKHRhYiwgbmF2LmJ1aWxkZXIoKSwgZGFzaGJvYXJkcywgJHJvb3RTY29wZSk7XG4gICAgICAgICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgbW9kYWwuZGlzbWlzcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfV1cbiAgICAgIH0pO1xuICAgICAgLypcbiAgICAgIHZhciBjb3VudGVyID0gZGFzaGJvYXJkcygpLmxlbmd0aCArIDE7XG4gICAgICB2YXIgdGl0bGUgPSBcIlVudGl0bGVkXCIgKyBjb3VudGVyO1xuICAgICAgdmFyIG5ld0Rhc2ggPSBkYXNoYm9hcmRSZXBvc2l0b3J5LmNyZWF0ZURhc2hib2FyZCh7dGl0bGU6IHRpdGxlfSk7XG5cbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbbmV3RGFzaF0sIFwiQ3JlYXRlZCBuZXcgZGFzaGJvYXJkOiBcIiArIHRpdGxlLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAvLyBsZXQncyBqdXN0IGJlIHNhZmUgYW5kIGVuc3VyZSB0aGVyZSdzIG5vIHNlbGVjdGlvbnNcbiAgICAgICAgZGVzZWxlY3RBbGwoKTtcbiAgICAgICAgc2V0U3ViVGFicyhuYXYuYnVpbGRlcigpLCBkYXNoYm9hcmRzLCAkcm9vdFNjb3BlKTtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG4gICAgICAqL1xuXG4gICAgfTtcblxuICAgICRzY29wZS5kdXBsaWNhdGUgPSAoKSA9PiB7XG4gICAgICB2YXIgbmV3RGFzaGJvYXJkcyA9IFtdO1xuICAgICAgdmFyIGNvbW1pdE1lc3NhZ2UgPSBcIkR1cGxpY2F0ZWQgZGFzaGJvYXJkKHMpIFwiO1xuICAgICAgYW5ndWxhci5mb3JFYWNoKCRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLCAoaXRlbSwgaWR4KSA9PiB7XG4gICAgICAgIC8vIGxldHMgdW5zZWxlY3QgdGhpcyBpdGVtXG4gICAgICAgIHZhciBjb21taXRNZXNzYWdlID0gXCJEdXBsaWNhdGVkIGRhc2hib2FyZCBcIiArIGl0ZW0udGl0bGU7XG4gICAgICAgIHZhciBuZXdEYXNoID0gZGFzaGJvYXJkUmVwb3NpdG9yeS5jbG9uZURhc2hib2FyZChpdGVtKTtcbiAgICAgICAgbmV3RGFzaGJvYXJkcy5wdXNoKG5ld0Rhc2gpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIGxldCdzIGp1c3QgYmUgc2FmZSBhbmQgZW5zdXJlIHRoZXJlJ3Mgbm8gc2VsZWN0aW9uc1xuICAgICAgZGVzZWxlY3RBbGwoKTtcblxuICAgICAgY29tbWl0TWVzc2FnZSA9IGNvbW1pdE1lc3NhZ2UgKyBuZXdEYXNoYm9hcmRzLm1hcCgoZCkgPT4geyByZXR1cm4gZC50aXRsZSB9KS5qb2luKCcsJyk7XG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMobmV3RGFzaGJvYXJkcywgY29tbWl0TWVzc2FnZSwgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgc2V0U3ViVGFicyh0YWIsIG5hdi5idWlsZGVyKCksIGRhc2hib2FyZHMsICRyb290U2NvcGUpO1xuICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJlbmFtZURhc2hib2FyZCA9ICgpID0+IHtcbiAgICAgIGlmICgkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkID0gPGFueT5fLmZpcnN0KCRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zKTtcbiAgICAgICAgdmFyIG1vZGFsID0gJG1vZGFsLm9wZW4oe1xuICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAncmVuYW1lRGFzaGJvYXJkTW9kYWwuaHRtbCcpLFxuICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRtb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAgICRzY29wZS5jb25maWcgPSB7XG4gICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAndGl0bGUnOiB7XG4gICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHNlbGVjdGVkLnRpdGxlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkID0gc2VsZWN0ZWQ7XG4gICAgICAgICAgICAkc2NvcGUub2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbJHNjb3BlLnNlbGVjdGVkXSwgJ3JlbmFtZWQgZGFzaGJvYXJkJywgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBsZXQncyBqdXN0IGJlIHNhZmUgYW5kIGVuc3VyZSB0aGVyZSdzIG5vIHNlbGVjdGlvbnNcbiAgICAgICAgICAgICAgICBkZXNlbGVjdEFsbCgpO1xuICAgICAgICAgICAgICAgIHNldFN1YlRhYnModGFiLCBuYXYuYnVpbGRlcigpLCBkYXNoYm9hcmRzLCAkcm9vdFNjb3BlKTtcbiAgICAgICAgICAgICAgICBkYXNoYm9hcmRMb2FkZWQobnVsbCwgZGFzaGJvYXJkcyk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgbW9kYWwuZGlzbWlzcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1dXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAkc2NvcGUuZGVsZXRlRGFzaGJvYXJkID0gKCkgPT4ge1xuICAgICAgaWYgKCRzY29wZS5oYXNTZWxlY3Rpb24oKSkge1xuICAgICAgICB2YXIgc2VsZWN0ZWQgPSAkc2NvcGUuZ3JpZE9wdGlvbnMuc2VsZWN0ZWRJdGVtcztcbiAgICAgICAgdmFyIG1vZGFsID0gJG1vZGFsLm9wZW4oe1xuICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAnZGVsZXRlRGFzaGJvYXJkTW9kYWwuaHRtbCcpLFxuICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRtb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZCA9IHNlbGVjdGVkO1xuICAgICAgICAgICAgJHNjb3BlLm9rID0gKCkgPT4ge1xuICAgICAgICAgICAgICBtb2RhbC5jbG9zZSgpO1xuICAgICAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmRlbGV0ZURhc2hib2FyZHMoJHNjb3BlLnNlbGVjdGVkLCAoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAgICAgICAgIC8vIGxldCdzIGp1c3QgYmUgc2FmZSBhbmQgZW5zdXJlIHRoZXJlJ3Mgbm8gc2VsZWN0aW9uc1xuICAgICAgICAgICAgICAgIGRlc2VsZWN0QWxsKCk7XG4gICAgICAgICAgICAgICAgc2V0U3ViVGFicyh0YWIsIG5hdi5idWlsZGVyKCksIGRhc2hib2FyZHMsICRyb290U2NvcGUpO1xuICAgICAgICAgICAgICAgIGRhc2hib2FyZExvYWRlZChudWxsLCBkYXNoYm9hcmRzKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgICBtb2RhbC5kaXNtaXNzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfV1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgICRzY29wZS5naXN0ID0gKCkgPT4ge1xuICAgICAgaWYgKCRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGlkID0gJHNjb3BlLnNlbGVjdGVkSXRlbXNbMF0uaWQ7XG4gICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9pZC9cIiArIGlkICsgXCIvc2hhcmVcIik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZURhdGEoKSB7XG4gICAgICB2YXIgdXJsID0gJHJvdXRlUGFyYW1zW1wiaHJlZlwiXTtcbiAgICAgIGlmICh1cmwpIHtcbiAgICAgICAgJHNjb3BlLnVybCA9IGRlY29kZVVSSUNvbXBvbmVudCh1cmwpO1xuICAgICAgfVxuXG4gICAgICB2YXIgcm91dGVQYXJhbXMgPSAkcm91dGVQYXJhbXNbXCJyb3V0ZVBhcmFtc1wiXTtcbiAgICAgIGlmIChyb3V0ZVBhcmFtcykge1xuICAgICAgICAkc2NvcGUucm91dGVQYXJhbXMgPSBkZWNvZGVVUklDb21wb25lbnQocm91dGVQYXJhbXMpO1xuICAgICAgfVxuICAgICAgdmFyIHNpemU6YW55ID0gJHJvdXRlUGFyYW1zW1wic2l6ZVwiXTtcbiAgICAgIGlmIChzaXplKSB7XG4gICAgICAgIHNpemUgPSBkZWNvZGVVUklDb21wb25lbnQoc2l6ZSk7XG4gICAgICAgICRzY29wZS5wcmVmZXJyZWRTaXplID0gYW5ndWxhci5mcm9tSnNvbihzaXplKTtcbiAgICAgIH1cbiAgICAgIHZhciB0aXRsZTphbnkgPSAkcm91dGVQYXJhbXNbXCJ0aXRsZVwiXTtcbiAgICAgIGlmICh0aXRsZSkge1xuICAgICAgICB0aXRsZSA9IGRlY29kZVVSSUNvbXBvbmVudCh0aXRsZSk7XG4gICAgICAgICRzY29wZS53aWRnZXRUaXRsZSA9IHRpdGxlO1xuICAgICAgfVxuXG4gICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZHMoKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGFzaGJvYXJkTG9hZGVkKGV2ZW50LCBkYXNoYm9hcmRzKSB7XG4gICAgICBkYXNoYm9hcmRzLmZvckVhY2goKGRhc2hib2FyZCkgPT4ge1xuICAgICAgICBkYXNoYm9hcmQuaGFzaCA9ICc/bWFpbi10YWI9ZGFzaGJvYXJkJnN1Yi10YWI9ZGFzaGJvYXJkLScgKyBkYXNoYm9hcmQuaWQ7XG4gICAgICB9KTtcbiAgICAgICRzY29wZS5fZGFzaGJvYXJkcyA9IGRhc2hib2FyZHM7XG5cbiAgICAgIGlmIChldmVudCA9PT0gbnVsbCkge1xuICAgICAgICAkc2NvcGUuJGVtaXQoJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkcyk7XG4gICAgICB9XG4gICAgICBDb3JlLiRhcHBseSgkcm9vdFNjb3BlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXNoYm9hcmRzKCkge1xuICAgICAgcmV0dXJuICRzY29wZS5fZGFzaGJvYXJkcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZXNlbGVjdEFsbCgpIHtcbiAgICAgICRzY29wZS5ncmlkT3B0aW9ucy5zZWxlY3RlZEl0ZW1zLmxlbmd0aCA9IDA7XG4gICAgfVxuXG4gIH1dKTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRIZWxwZXJzLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcblxuICAvKipcbiAgICogSW1wbGVtZW50cyB0aGUgbmcuSUxvY2F0aW9uU2VydmljZSBpbnRlcmZhY2UgYW5kIGlzIHVzZWQgYnkgdGhlIGRhc2hib2FyZCB0byBzdXBwbHlcbiAgICogY29udHJvbGxlcnMgd2l0aCBhIHNhdmVkIFVSTCBsb2NhdGlvblxuICAgKlxuICAgKiBAY2xhc3MgUmVjdGFuZ2xlTG9jYXRpb25cbiAgICovXG4gIGV4cG9ydCBjbGFzcyBSZWN0YW5nbGVMb2NhdGlvbiB7IC8vIFRPRE8gaW1wbGVtZW50cyBuZy5JTG9jYXRpb25TZXJ2aWNlIHtcbiAgICBwcml2YXRlIF9wYXRoOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBfaGFzaDogc3RyaW5nO1xuICAgIHByaXZhdGUgX3NlYXJjaDogYW55O1xuICAgIHByaXZhdGUgdXJpOlVSSTtcblxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBkZWxlZ2F0ZTpuZy5JTG9jYXRpb25TZXJ2aWNlLCBwYXRoOnN0cmluZywgc2VhcmNoLCBoYXNoOnN0cmluZykge1xuICAgICAgdGhpcy5fcGF0aCA9IHBhdGg7XG4gICAgICB0aGlzLl9zZWFyY2ggPSBzZWFyY2g7XG4gICAgICB0aGlzLl9oYXNoID0gaGFzaDtcbiAgICAgIHRoaXMudXJpID0gbmV3IFVSSShwYXRoKTtcbiAgICAgIHRoaXMudXJpLnNlYXJjaCgocXVlcnkpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlYXJjaDtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGFic1VybCgpIHtcbiAgICAgIHJldHVybiB0aGlzLnByb3RvY29sKCkgKyB0aGlzLmhvc3QoKSArIFwiOlwiICsgdGhpcy5wb3J0KCkgKyB0aGlzLnBhdGgoKSArIHRoaXMuc2VhcmNoKCk7XG4gICAgfVxuXG4gICAgaGFzaChuZXdIYXNoOnN0cmluZyA9IG51bGwpOmFueSB7XG4gICAgICBpZiAobmV3SGFzaCkge1xuICAgICAgICB0aGlzLnVyaS5zZWFyY2gobmV3SGFzaCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX2hhc2g7XG4gICAgfVxuXG4gICAgaG9zdCgpOnN0cmluZyB7XG4gICAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5ob3N0KCk7XG4gICAgfVxuXG4gICAgcGF0aChuZXdQYXRoOnN0cmluZyA9IG51bGwpOmFueSB7XG4gICAgICBpZiAobmV3UGF0aCkge1xuICAgICAgICB0aGlzLnVyaS5wYXRoKG5ld1BhdGgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9wYXRoO1xuICAgIH1cblxuICAgIHBvcnQoKTpudW1iZXIge1xuICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUucG9ydCgpO1xuICAgIH1cblxuICAgIHByb3RvY29sKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUucG9ydCgpO1xuICAgIH1cblxuICAgIHJlcGxhY2UoKSB7XG4gICAgICAvLyBUT0RPXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZWFyY2gocGFyYW1ldGVyc01hcDphbnkgPSBudWxsKTphbnkge1xuICAgICAgaWYgKHBhcmFtZXRlcnNNYXApIHtcbiAgICAgICAgdGhpcy51cmkuc2VhcmNoKHBhcmFtZXRlcnNNYXApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9zZWFyY2g7XG4gICAgfVxuXG4gICAgdXJsKG5ld1ZhbHVlOiBzdHJpbmcgPSBudWxsKTphbnkge1xuICAgICAgaWYgKG5ld1ZhbHVlKSB7XG4gICAgICAgIHRoaXMudXJpID0gbmV3IFVSSShuZXdWYWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuYWJzVXJsKCk7XG4gICAgfVxuXG4gIH1cbn1cbiIsIi8qKlxuICogQG1vZHVsZSBEYXNoYm9hcmRcbiAqL1xuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRhc2hib2FyZFBsdWdpbi50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRSZXBvc2l0b3J5LnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cInJlY3RhbmdsZUxvY2F0aW9uLnRzXCIvPlxubW9kdWxlIERhc2hib2FyZCB7XG5cbiAgdmFyIG1vZHVsZXM6QXJyYXk8c3RyaW5nPiA9IHVuZGVmaW5lZDtcblxuICBfbW9kdWxlLmRpcmVjdGl2ZSgnaGF3dGlvRGFzaGJvYXJkJywgZnVuY3Rpb24oKSB7XG4gICAgbW9kdWxlcyA9IGhhd3Rpb1BsdWdpbkxvYWRlclsnbW9kdWxlcyddLmZpbHRlcigobmFtZSkgPT4ge1xuICAgICAgcmV0dXJuIF8uaXNTdHJpbmcobmFtZSkgJiYgbmFtZSAhPT0gJ25nJztcbiAgICB9KTtcbiAgICByZXR1cm4gbmV3IERhc2hib2FyZC5Hcmlkc3RlckRpcmVjdGl2ZSgpO1xuICB9KTtcblxuICBleHBvcnQgY2xhc3MgR3JpZHN0ZXJEaXJlY3RpdmUge1xuICAgIHB1YmxpYyByZXN0cmljdCA9ICdBJztcbiAgICBwdWJsaWMgcmVwbGFjZSA9IHRydWU7XG5cbiAgICBwdWJsaWMgY29udHJvbGxlciA9IFtcIiRzY29wZVwiLCBcIiRlbGVtZW50XCIsIFwiJGF0dHJzXCIsIFwiJGxvY2F0aW9uXCIsIFwiJHJvdXRlUGFyYW1zXCIsIFwiJHRlbXBsYXRlQ2FjaGVcIiwgXCJkYXNoYm9hcmRSZXBvc2l0b3J5XCIsIFwiJGNvbXBpbGVcIiwgXCIkdGVtcGxhdGVSZXF1ZXN0XCIsIFwiJGludGVycG9sYXRlXCIsIFwiJG1vZGFsXCIsIFwiJHNjZVwiLCBcIiR0aW1lb3V0XCIsICgkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMsICRsb2NhdGlvbiwgJHJvdXRlUGFyYW1zLCAkdGVtcGxhdGVDYWNoZSwgZGFzaGJvYXJkUmVwb3NpdG9yeTpEYXNoYm9hcmRSZXBvc2l0b3J5LCAkY29tcGlsZSwgJHRlbXBsYXRlUmVxdWVzdCwgJGludGVycG9sYXRlLCAkbW9kYWwsICRzY2UsICR0aW1lb3V0KSA9PiB7XG5cbiAgICAgIHZhciBncmlkU2l6ZSA9IDE1MDtcbiAgICAgIHZhciBncmlkTWFyZ2luID0gNjtcbiAgICAgIHZhciBncmlkSGVpZ2h0O1xuXG4gICAgICB2YXIgZ3JpZFggPSBncmlkU2l6ZTtcbiAgICAgIHZhciBncmlkWSA9IGdyaWRTaXplO1xuXG4gICAgICB2YXIgd2lkZ2V0TWFwID0ge307XG5cbiAgICAgIHZhciBkYXNoYm9hcmRSZXBvc2l0b3J5OkRhc2hib2FyZFJlcG9zaXRvcnkgPSAkc2NvcGUuJGV2YWwoJ2Rhc2hib2FyZFJlcG9zaXRvcnknKSB8fCBkYXNoYm9hcmRSZXBvc2l0b3J5O1xuXG4gICAgICAkc2NvcGUuJG9uKCckZGVzdHJveScsICgpID0+IHtcbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKHdpZGdldE1hcCwgKHdpZGdldCwga2V5KSA9PiB7XG4gICAgICAgICAgaWYgKCdzY29wZScgaW4gd2lkZ2V0KSB7XG4gICAgICAgICAgICB2YXIgc2NvcGUgPSB3aWRnZXRbJ3Njb3BlJ107XG4gICAgICAgICAgICBzY29wZS4kZGVzdHJveSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkZXN0cm95V2lkZ2V0KHdpZGdldCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgICRlbGVtZW50Lm9uKCckZGVzdHJveScsICgpID0+IHtcbiAgICAgICAgJHNjb3BlLiRkZXN0cm95KCk7XG4gICAgICB9KTtcblxuICAgICAgc2V0VGltZW91dCh1cGRhdGVXaWRnZXRzLCAxMCk7XG5cbiAgICAgIGZ1bmN0aW9uIGRlc3Ryb3lXaWRnZXQod2lkZ2V0KSB7XG4gICAgICAgIHZhciBncmlkc3RlciA9IGdldEdyaWRzdGVyKCk7XG4gICAgICAgIHZhciB3aWRnZXRFbGVtID0gbnVsbDtcbiAgICAgICAgLy8gbGV0cyBkZXN0cm95IHRoZSB3aWRnZXRzJ3Mgc2NvcGVcbiAgICAgICAgdmFyIHdpZGdldERhdGEgPSB3aWRnZXRNYXBbd2lkZ2V0LmlkXTtcbiAgICAgICAgaWYgKHdpZGdldERhdGEpIHtcbiAgICAgICAgICBkZWxldGUgd2lkZ2V0TWFwW3dpZGdldC5pZF07XG4gICAgICAgICAgd2lkZ2V0RWxlbSA9IHdpZGdldERhdGEud2lkZ2V0O1xuICAgICAgICB9XG4gICAgICAgIGlmICghd2lkZ2V0RWxlbSkge1xuICAgICAgICAgIC8vIGxldHMgZ2V0IHRoZSBsaSBwYXJlbnQgZWxlbWVudCBvZiB0aGUgdGVtcGxhdGVcbiAgICAgICAgICB3aWRnZXRFbGVtID0gJGVsZW1lbnQuZmluZChcIltkYXRhLXdpZGdldElkPSdcIiArIHdpZGdldC5pZCArIFwiJ11cIikucGFyZW50KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdyaWRzdGVyICYmIHdpZGdldEVsZW0pIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgZ3JpZHN0ZXIucmVtb3ZlX3dpZGdldCh3aWRnZXRFbGVtKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIC8vIG5vdGhpbmcgdG8gZG8sIHdlJ2xsIGRlc3Ryb3kgdGhlIGVsZW1lbnQgYmVsb3dcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHdpZGdldEVsZW0pIHtcbiAgICAgICAgICBsb2cuZGVidWcoXCJSZW1vdmluZyB3aWRnZXQ6IFwiLCB3aWRnZXQuaWQpO1xuICAgICAgICAgIHdpZGdldEVsZW0ucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcmVtb3ZlV2lkZ2V0KHdpZGdldCkge1xuICAgICAgICBkZXN0cm95V2lkZ2V0KHdpZGdldCk7XG4gICAgICAgIC8vIGxldHMgdHJhc2ggdGhlIEpTT04gbWV0YWRhdGFcbiAgICAgICAgaWYgKCRzY29wZS5kYXNoYm9hcmQpIHtcbiAgICAgICAgICB2YXIgd2lkZ2V0cyA9ICRzY29wZS5kYXNoYm9hcmQud2lkZ2V0cztcbiAgICAgICAgICBpZiAod2lkZ2V0cykge1xuICAgICAgICAgICAgd2lkZ2V0cy5yZW1vdmUod2lkZ2V0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIlJlbW92ZWQgd2lkZ2V0IFwiICsgd2lkZ2V0LnRpdGxlKTtcbiAgICAgIH07XG5cbiAgICAgIGZ1bmN0aW9uIGNoYW5nZVdpZGdldFNpemUod2lkZ2V0LCBzaXplZnVuYywgc2F2ZWZ1bmMpIHtcbiAgICAgICAgaWYgKCF3aWRnZXQpIHtcbiAgICAgICAgICBsb2cuZGVidWcoXCJ3aWRnZXQgdW5kZWZpbmVkXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZ3JpZHN0ZXIgPSBnZXRHcmlkc3RlcigpO1xuICAgICAgICBsb2cuZGVidWcoXCJXaWRnZXQgSUQ6IFwiLCB3aWRnZXQuaWQsIFwiIHdpZGdldE1hcDogXCIsIHdpZGdldE1hcCk7XG4gICAgICAgIHZhciBlbnRyeSA9IHdpZGdldE1hcFt3aWRnZXQuaWRdO1xuICAgICAgICB2YXIgdyA9IGVudHJ5LndpZGdldDtcbiAgICAgICAgc2l6ZWZ1bmMoZW50cnkpO1xuICAgICAgICBncmlkc3Rlci5yZXNpemVfd2lkZ2V0KHcsIGVudHJ5LnNpemVfeCwgZW50cnkuc2l6ZV95KTtcbiAgICAgICAgZ3JpZHN0ZXIuc2V0X2RvbV9ncmlkX2hlaWdodCgpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICBzYXZlZnVuYyh3aWRnZXQpO1xuICAgICAgICB9LCA1MCk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG9uV2lkZ2V0UmVuYW1lZCh3aWRnZXQpIHtcbiAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIlJlbmFtZWQgd2lkZ2V0IHRvIFwiICsgd2lkZ2V0LnRpdGxlKTtcbiAgICAgIH07XG5cbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZVdpZGdldHMoKSB7XG4gICAgICAgICRzY29wZS5pZCA9ICRzY29wZS4kZXZhbCgnZGFzaGJvYXJkSWQnKSB8fCAkcm91dGVQYXJhbXNbXCJkYXNoYm9hcmRJZFwiXTtcbiAgICAgICAgJHNjb3BlLmlkeCA9ICRzY29wZS4kZXZhbCgnZGFzaGJvYXJkSW5kZXgnKSB8fCAkcm91dGVQYXJhbXNbXCJkYXNoYm9hcmRJbmRleFwiXTtcbiAgICAgICAgaWYgKCRzY29wZS5pZCkge1xuICAgICAgICAgICRzY29wZS4kZW1pdCgnbG9hZERhc2hib2FyZHMnKTtcbiAgICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LmdldERhc2hib2FyZCgkc2NvcGUuaWQsIG9uRGFzaGJvYXJkTG9hZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5nZXREYXNoYm9hcmRzKChkYXNoYm9hcmRzKSA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkcyk7XG5cbiAgICAgICAgICAgIHZhciBpZHggPSAkc2NvcGUuaWR4ID8gcGFyc2VJbnQoJHNjb3BlLmlkeCkgOiAwO1xuICAgICAgICAgICAgdmFyIGlkID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChkYXNoYm9hcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgdmFyIGRhc2hib2FyZCA9IGRhc2hib2FyZHMubGVuZ3RoID4gaWR4ID8gZGFzaGJvYXJkc1tpZHhdIDogZGFzaGJvYXJkWzBdO1xuICAgICAgICAgICAgICBpZCA9IGRhc2hib2FyZC5pZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgkc2NvcGUuJGV2YWwoJ2Rhc2hib2FyZEVtYmVkZGVkJykpIHtcbiAgICAgICAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkKSB7XG4gICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9pZC9cIiArIGlkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKFwiL2Rhc2hib2FyZC9lZGl0XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ29yZS4kYXBwbHkoJHNjb3BlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBvbkRhc2hib2FyZExvYWQoZGFzaGJvYXJkKSB7XG4gICAgICAgICRzY29wZS5kYXNoYm9hcmQgPSBkYXNoYm9hcmQ7XG4gICAgICAgIHZhciB3aWRnZXRzID0gKChkYXNoYm9hcmQpID8gZGFzaGJvYXJkLndpZGdldHMgOiBudWxsKSB8fCBbXTtcblxuICAgICAgICB2YXIgbWluSGVpZ2h0ID0gMTA7XG4gICAgICAgIHZhciBtaW5XaWR0aCA9IDY7XG5cbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKHdpZGdldHMsICh3aWRnZXQpID0+IHtcbiAgICAgICAgICBpZiAoIXdpZGdldCkge1xuICAgICAgICAgICAgbG9nLmRlYnVnKFwiVW5kZWZpbmVkIHdpZGdldCwgc2tpcHBpbmdcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZCh3aWRnZXQucm93KSAmJiBtaW5IZWlnaHQgPCB3aWRnZXQucm93KSB7XG4gICAgICAgICAgICBtaW5IZWlnaHQgPSB3aWRnZXQucm93ICsgMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHdpZGdldC5zaXplX3hcbiAgICAgICAgICAgICAgJiYgYW5ndWxhci5pc0RlZmluZWQod2lkZ2V0LmNvbCkpKSB7XG4gICAgICAgICAgICB2YXIgcmlnaHRFZGdlID0gd2lkZ2V0LmNvbCArIHdpZGdldC5zaXplX3g7XG4gICAgICAgICAgICBpZiAocmlnaHRFZGdlID4gbWluV2lkdGgpIHtcbiAgICAgICAgICAgICAgbWluV2lkdGggPSByaWdodEVkZ2UgKyAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGdyaWRzdGVyID0gJGVsZW1lbnQuZ3JpZHN0ZXIoe1xuICAgICAgICAgIHdpZGdldF9tYXJnaW5zOiBbZ3JpZE1hcmdpbiwgZ3JpZE1hcmdpbl0sXG4gICAgICAgICAgd2lkZ2V0X2Jhc2VfZGltZW5zaW9uczogW2dyaWRYLCBncmlkWV0sXG4gICAgICAgICAgZXh0cmFfcm93czogbWluSGVpZ2h0LFxuICAgICAgICAgIGV4dHJhX2NvbHM6IG1pbldpZHRoLFxuICAgICAgICAgIG1heF9zaXplX3g6IG1pbldpZHRoLFxuICAgICAgICAgIG1heF9zaXplX3k6IG1pbkhlaWdodCxcbiAgICAgICAgICBkcmFnZ2FibGU6IHtcbiAgICAgICAgICAgIHN0b3A6IChldmVudCwgdWkpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHNlcmlhbGl6ZURhc2hib2FyZCgpKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIkNoYW5naW5nIGRhc2hib2FyZCBsYXlvdXRcIik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pLmRhdGEoJ2dyaWRzdGVyJyk7XG5cbiAgICAgICAgdmFyIHRlbXBsYXRlID0gJHRlbXBsYXRlQ2FjaGUuZ2V0KFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsIFwid2lkZ2V0VGVtcGxhdGUuaHRtbFwiKSk7XG4gICAgICAgIHZhciByZW1haW5pbmcgPSB3aWRnZXRzLmxlbmd0aDtcblxuICAgICAgICBmdW5jdGlvbiBtYXliZUZpbmlzaFVwKCkge1xuICAgICAgICAgIHJlbWFpbmluZyA9IHJlbWFpbmluZyAtIDE7XG4gICAgICAgICAgaWYgKHJlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgICAgbWFrZVJlc2l6YWJsZSgpO1xuICAgICAgICAgICAgZ2V0R3JpZHN0ZXIoKS5lbmFibGUoKTtcbiAgICAgICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZG9SZW1vdmVXaWRnZXQoJG1vZGFsLCB3aWRnZXQpIHtcbiAgICAgICAgICBsb2cuZGVidWcoXCJSZW1vdmUgd2lkZ2V0OiBcIiwgd2lkZ2V0KTtcbiAgICAgICAgICB2YXIgbW9kYWwgPSAkbW9kYWwub3Blbih7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ2RlbGV0ZVdpZGdldE1vZGFsLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRtb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAgICAgJHNjb3BlLndpZGdldCA9IHdpZGdldDtcbiAgICAgICAgICAgICAgJHNjb3BlLm9rID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgcmVtb3ZlV2lkZ2V0KCRzY29wZS53aWRnZXQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgbW9kYWwuZGlzbWlzcygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZG9SZW5hbWVXaWRnZXQoJG1vZGFsLCB3aWRnZXQpIHtcbiAgICAgICAgICBsb2cuZGVidWcoXCJSZW5hbWUgd2lkZ2V0OiBcIiwgd2lkZ2V0KTtcbiAgICAgICAgICB2YXIgbW9kYWwgPSAkbW9kYWwub3Blbih7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSGVscGVycy5qb2luKHRlbXBsYXRlUGF0aCwgJ3JlbmFtZVdpZGdldE1vZGFsLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRtb2RhbEluc3RhbmNlJywgKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UpID0+IHtcbiAgICAgICAgICAgICAgJHNjb3BlLndpZGdldCA9IHdpZGdldDtcbiAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpZyA9IHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAndGl0bGUnOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB3aWRnZXQudGl0bGVcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICRzY29wZS5vayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBtb2RhbC5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIG9uV2lkZ2V0UmVuYW1lZCgkc2NvcGUud2lkZ2V0KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIG1vZGFsLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfV1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaCh3aWRnZXRzLCAod2lkZ2V0KSA9PiB7XG4gICAgICAgICAgdmFyIHR5cGUgPSAnaW50ZXJuYWwnO1xuICAgICAgICAgIGlmICgnaWZyYW1lJyBpbiB3aWRnZXQpIHtcbiAgICAgICAgICAgIHR5cGUgPSAnZXh0ZXJuYWwnO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2V4dGVybmFsJzpcbiAgICAgICAgICAgICAgbG9nLmRlYnVnKFwiUmVuZGVyaW5nIGV4dGVybmFsIChpZnJhbWUpIHdpZGdldDogXCIsIHdpZGdldC50aXRsZSB8fCB3aWRnZXQuaWQpO1xuICAgICAgICAgICAgICB2YXIgc2NvcGUgPSAkc2NvcGUuJG5ldygpO1xuICAgICAgICAgICAgICBzY29wZS53aWRnZXQgPSB3aWRnZXQ7XG4gICAgICAgICAgICAgIHNjb3BlLnJlbW92ZVdpZGdldCA9ICh3aWRnZXQpID0+IGRvUmVtb3ZlV2lkZ2V0KCRtb2RhbCwgd2lkZ2V0KTtcbiAgICAgICAgICAgICAgc2NvcGUucmVuYW1lV2lkZ2V0ID0gKHdpZGdldCkgPT4gZG9SZW5hbWVXaWRnZXQoJG1vZGFsLCB3aWRnZXQpO1xuICAgICAgICAgICAgICB2YXIgd2lkZ2V0Qm9keTphbnkgPSBhbmd1bGFyLmVsZW1lbnQoJHRlbXBsYXRlQ2FjaGUuZ2V0KFVybEhlbHBlcnMuam9pbih0ZW1wbGF0ZVBhdGgsICdpZnJhbWVXaWRnZXRUZW1wbGF0ZS5odG1sJykpKTtcbiAgICAgICAgICAgICAgdmFyIG91dGVyRGl2ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldChVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAnd2lkZ2V0QmxvY2tUZW1wbGF0ZS5odG1sJykpKTtcbiAgICAgICAgICAgICAgd2lkZ2V0Qm9keS5maW5kKCdpZnJhbWUnKS5hdHRyKCdzcmMnLCB3aWRnZXQuaWZyYW1lKTtcbiAgICAgICAgICAgICAgb3V0ZXJEaXYuYXBwZW5kKCRjb21waWxlKHdpZGdldEJvZHkpKHNjb3BlKSk7XG4gICAgICAgICAgICAgIHZhciB3ID0gZ3JpZHN0ZXIuYWRkX3dpZGdldChvdXRlckRpdiwgd2lkZ2V0LnNpemVfeCwgd2lkZ2V0LnNpemVfeSwgd2lkZ2V0LmNvbCwgd2lkZ2V0LnJvdyk7XG4gICAgICAgICAgICAgIHdpZGdldE1hcFt3aWRnZXQuaWRdID0ge1xuICAgICAgICAgICAgICAgIHdpZGdldDogd1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICBtYXliZUZpbmlzaFVwKCk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnaW50ZXJuYWwnOiBcbiAgICAgICAgICAgICAgbG9nLmRlYnVnKFwiUmVuZGVyaW5nIGludGVybmFsIHdpZGdldDogXCIsIHdpZGdldC50aXRsZSB8fCB3aWRnZXQuaWQpO1xuICAgICAgICAgICAgICB2YXIgcGF0aCA9IHdpZGdldC5wYXRoO1xuICAgICAgICAgICAgICB2YXIgc2VhcmNoID0gbnVsbDtcbiAgICAgICAgICAgICAgaWYgKHdpZGdldC5zZWFyY2gpIHtcbiAgICAgICAgICAgICAgICBzZWFyY2ggPSBEYXNoYm9hcmQuZGVjb2RlVVJJQ29tcG9uZW50UHJvcGVydGllcyh3aWRnZXQuc2VhcmNoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAod2lkZ2V0LnJvdXRlUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgXy5leHRlbmQoc2VhcmNoLCBhbmd1bGFyLmZyb21Kc29uKHdpZGdldC5yb3V0ZVBhcmFtcykpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHZhciBoYXNoID0gd2lkZ2V0Lmhhc2g7IC8vIFRPRE8gZGVjb2RlIG9iamVjdD9cbiAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gbmV3IFJlY3RhbmdsZUxvY2F0aW9uKCRsb2NhdGlvbiwgcGF0aCwgc2VhcmNoLCBoYXNoKTtcbiAgICAgICAgICAgICAgaWYgKCF3aWRnZXQuc2l6ZV94IHx8IHdpZGdldC5zaXplX3ggPCAxKSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0LnNpemVfeCA9IDE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKCF3aWRnZXQuc2l6ZV95IHx8IHdpZGdldC5zaXplX3kgPCAxKSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0LnNpemVfeSA9IDE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdmFyIHRtcE1vZHVsZU5hbWUgPSAnZGFzaGJvYXJkLScgKyB3aWRnZXQuaWQ7XG4gICAgICAgICAgICAgIHZhciBwbHVnaW5zID0gXy5maWx0ZXIoaGF3dGlvUGx1Z2luTG9hZGVyLmdldE1vZHVsZXMoKSwgKG1vZHVsZSkgPT4gYW5ndWxhci5pc1N0cmluZyhtb2R1bGUpKTtcbiAgICAgICAgICAgICAgdmFyIHRtcE1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKHRtcE1vZHVsZU5hbWUsIHBsdWdpbnMpO1xuXG4gICAgICAgICAgICAgIGZ1bmN0aW9uIGdldFNlcnZpY2VzKG1vZHVsZTpzdHJpbmcsIGFuc3dlcj86YW55KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFhbnN3ZXIpIHtcbiAgICAgICAgICAgICAgICAgIGFuc3dlciA9IDxhbnk+e307XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF8uZm9yRWFjaChhbmd1bGFyLm1vZHVsZShtb2R1bGUpLnJlcXVpcmVzLCAobSkgPT4gZ2V0U2VydmljZXMobSwgYW5zd2VyKSk7XG4gICAgICAgICAgICAgICAgXy5mb3JFYWNoKCg8YW55PmFuZ3VsYXIubW9kdWxlKG1vZHVsZSkpLl9pbnZva2VRdWV1ZSwgKGEpID0+IHtcbiAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGFuc3dlclthWzJdWzBdXSA9IEhhd3Rpb0NvcmUuaW5qZWN0b3IuZ2V0KGFbMl1bMF0pO1xuICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vbm90aGluZyB0byBkb1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBhbnN3ZXI7XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIHZhciBzZXJ2aWNlcyA9IHt9O1xuICAgICAgICAgICAgICBfLmZvckVhY2gocGx1Z2lucywgKHBsdWdpbjpzdHJpbmcpID0+IHBsdWdpbiA/IGdldFNlcnZpY2VzKHBsdWdpbiwgc2VydmljZXMpIDogY29uc29sZS5sb2coXCJudWxsIHBsdWdpbiBuYW1lXCIpKTtcbiAgICAgICAgICAgICAgLy9sb2cuZGVidWcoXCJzZXJ2aWNlczogXCIsIHNlcnZpY2VzKTtcblxuICAgICAgICAgICAgICB0bXBNb2R1bGUuY29uZmlnKFsnJHByb3ZpZGUnLCAoJHByb3ZpZGUpID0+IHtcbiAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IoJ0hhd3Rpb0Rhc2hib2FyZCcsIFsnJGRlbGVnYXRlJywgJyRyb290U2NvcGUnLCAoJGRlbGVnYXRlLCAkcm9vdFNjb3BlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAkZGVsZWdhdGUuaW5EYXNoYm9hcmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuICRkZWxlZ2F0ZTtcbiAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKCckbG9jYXRpb24nLCBbJyRkZWxlZ2F0ZScsICgkZGVsZWdhdGUpID0+IHtcbiAgICAgICAgICAgICAgICAgIC8vbG9nLmRlYnVnKFwiVXNpbmcgJGxvY2F0aW9uOiBcIiwgbG9jYXRpb24pO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxvY2F0aW9uO1xuICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IoJyRyb3V0ZScsIFsnJGRlbGVnYXRlJywgKCRkZWxlZ2F0ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgLy8gcmVhbGx5IGhhbmR5IGZvciBkZWJ1Z2dpbmcsIG1vc3RseSB0byB0ZWxsIGlmIGEgd2lkZ2V0J3Mgcm91dGVcbiAgICAgICAgICAgICAgICAgIC8vIGlzbid0IGFjdHVhbGx5IGF2YWlsYWJsZSBpbiB0aGUgY2hpbGQgYXBwXG4gICAgICAgICAgICAgICAgICAvL2xvZy5kZWJ1ZyhcIlVzaW5nICRyb3V0ZTogXCIsICRkZWxlZ2F0ZSk7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gJGRlbGVnYXRlO1xuICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IoJyRyb3V0ZVBhcmFtcycsIFsnJGRlbGVnYXRlJywgKCRkZWxlZ2F0ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgLy9sb2cuZGVidWcoXCJVc2luZyAkcm91dGVQYXJhbXM6IFwiLCBzZWFyY2gpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlYXJjaDtcbiAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgXy5mb3JJbihzZXJ2aWNlcywgKHNlcnZpY2UsIG5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICAgIHN3aXRjaChuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJyRsb2NhdGlvbic6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJyRyb3V0ZSc6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJyRyb3V0ZVBhcmFtcyc6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ0hhd3Rpb0Rhc2hib2FyZCc6XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2Rhc2hib2FyZFJlcG9zaXRvcnknOlxuICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IobmFtZSwgWygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdIYXd0aW9EYXNoYm9hcmRUYWInOlxuICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IobmFtZSwgWygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgZW1iZWRkZWQ6IHRydWUgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcblxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnQnVpbGRlckZhY3RvcnlQcm92aWRlcic6XG4gICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcihuYW1lLCBbKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2V0RHVtbXlCdWlsZGVyRmFjdG9yeSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfV0pO1xuICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXNlICdIYXd0aW9OYXYnOlxuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcHJvdmlkZS5kZWNvcmF0b3IobmFtZSwgWygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdldER1bW15SGF3dGlvTmF2KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBub3RoaW5nIHRvIGRvXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgIC8vbG9nLmRlYnVnKFwibmFtZTogXCIsIG5hbWUsIFwiIHNlcnZpY2U6IFwiLCBzZXJ2aWNlKTtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoXy5zdGFydHNXaXRoKG5hbWUsICckJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwcm92aWRlLmRlY29yYXRvcihuYW1lLCBbKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBsb2cuZGVidWcoXCJSZXR1cm5pbmcgZXhpc3Rpbmcgc2VydmljZSBmb3I6IFwiLCBuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlcnZpY2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpZ25vcmUsIHRoaXMnbGwgaGFwcGVuIGZvciBjb25zdGFudHMgYW5kIHN0dWZmXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XSk7XG4gICAgICAgICAgICAgIHRtcE1vZHVsZS5jb250cm9sbGVyKCdIYXd0aW9EYXNoYm9hcmQuVGl0bGUnLCBbXCIkc2NvcGVcIiwgXCIkbW9kYWxcIiwgKCRzY29wZSwgJG1vZGFsKSA9PiB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLndpZGdldCA9IHdpZGdldDtcbiAgICAgICAgICAgICAgICAkc2NvcGUucmVtb3ZlV2lkZ2V0ID0gKHdpZGdldCkgPT4gZG9SZW1vdmVXaWRnZXQoJG1vZGFsLCB3aWRnZXQpO1xuICAgICAgICAgICAgICAgICRzY29wZS5yZW5hbWVXaWRnZXQgPSAod2lkZ2V0KSA9PiBkb1JlbmFtZVdpZGdldCgkbW9kYWwsIHdpZGdldCk7XG4gICAgICAgICAgICAgIH1dKTtcblxuICAgICAgICAgICAgICB2YXIgZGl2OmFueSA9ICQodGVtcGxhdGUpO1xuICAgICAgICAgICAgICBkaXYuYXR0cih7ICdkYXRhLXdpZGdldElkJzogd2lkZ2V0LmlkIH0pO1xuICAgICAgICAgICAgICB2YXIgYm9keSA9IGRpdi5maW5kKCcud2lkZ2V0LWJvZHknKTtcbiAgICAgICAgICAgICAgbG9nLmRlYnVnKFwiaW5jbHVkZTogXCIsIHdpZGdldC5pbmNsdWRlKTtcbiAgICAgICAgICAgICAgdmFyIHdpZGdldEJvZHkgPSAkdGVtcGxhdGVDYWNoZS5nZXQod2lkZ2V0LmluY2x1ZGUpO1xuICAgICAgICAgICAgICAkdGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdmFyIG91dGVyRGl2ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldChVcmxIZWxwZXJzLmpvaW4odGVtcGxhdGVQYXRoLCAnd2lkZ2V0QmxvY2tUZW1wbGF0ZS5odG1sJykpKTtcbiAgICAgICAgICAgICAgICBib2R5Lmh0bWwod2lkZ2V0Qm9keSk7XG4gICAgICAgICAgICAgICAgb3V0ZXJEaXYuaHRtbChkaXYpO1xuICAgICAgICAgICAgICAgIGFuZ3VsYXIuYm9vdHN0cmFwKGRpdiwgW3RtcE1vZHVsZU5hbWVdKTtcbiAgICAgICAgICAgICAgICB3aWRnZXRNYXBbd2lkZ2V0LmlkXSA9IHtcbiAgICAgICAgICAgICAgICAgIHdpZGdldDogZ3JpZHN0ZXIuYWRkX3dpZGdldChvdXRlckRpdiwgd2lkZ2V0LnNpemVfeCwgd2lkZ2V0LnNpemVfeSwgd2lkZ2V0LmNvbCwgd2lkZ2V0LnJvdylcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIG1heWJlRmluaXNoVXAoKTtcbiAgICAgICAgICAgICAgfSwgNTApO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBzZXJpYWxpemVEYXNoYm9hcmQoKSB7XG4gICAgICAgIHZhciBncmlkc3RlciA9IGdldEdyaWRzdGVyKCk7XG4gICAgICAgIGlmIChncmlkc3Rlcikge1xuICAgICAgICAgIHZhciBkYXRhID0gZ3JpZHN0ZXIuc2VyaWFsaXplKCk7XG4gICAgICAgICAgLy9jb25zb2xlLmxvZyhcImdvdCBkYXRhOiBcIiArIEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcblxuICAgICAgICAgIHZhciB3aWRnZXRzID0gJHNjb3BlLmRhc2hib2FyZC53aWRnZXRzIHx8IFtdO1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiV2lkZ2V0czogXCIsIHdpZGdldHMpO1xuXG4gICAgICAgICAgLy8gbGV0cyBhc3N1bWUgdGhlIGRhdGEgaXMgaW4gdGhlIG9yZGVyIG9mIHRoZSB3aWRnZXRzLi4uXG4gICAgICAgICAgYW5ndWxhci5mb3JFYWNoKHdpZGdldHMsICh3aWRnZXQsIGlkeCkgPT4ge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gZGF0YVtpZHhdO1xuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHdpZGdldCkge1xuICAgICAgICAgICAgICAvLyBsZXRzIGNvcHkgdGhlIHZhbHVlcyBhY3Jvc3NcbiAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKHZhbHVlLCAoYXR0ciwga2V5KSA9PiB3aWRnZXRba2V5XSA9IGF0dHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gbWFrZVJlc2l6YWJsZSgpIHtcbiAgICAgICAgdmFyIGJsb2NrczphbnkgPSAkKCcuZ3JpZC1ibG9jaycpO1xuICAgICAgICBibG9ja3MucmVzaXphYmxlKCdkZXN0cm95Jyk7XG5cbiAgICAgICAgYmxvY2tzLnJlc2l6YWJsZSh7XG4gICAgICAgICAgZ3JpZDogW2dyaWRTaXplICsgKGdyaWRNYXJnaW4gKiAyKSwgZ3JpZFNpemUgKyAoZ3JpZE1hcmdpbiAqIDIpXSxcbiAgICAgICAgICBhbmltYXRlOiBmYWxzZSxcbiAgICAgICAgICBtaW5XaWR0aDogZ3JpZFNpemUsXG4gICAgICAgICAgbWluSGVpZ2h0OiBncmlkU2l6ZSxcbiAgICAgICAgICBhdXRvSGlkZTogZmFsc2UsXG4gICAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uKGV2ZW50LCB1aSkge1xuICAgICAgICAgICAgZ3JpZEhlaWdodCA9IGdldEdyaWRzdGVyKCkuJGVsLmhlaWdodCgpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVzaXplOiBmdW5jdGlvbihldmVudCwgdWkpIHtcbiAgICAgICAgICAgIC8vc2V0IG5ldyBncmlkIGhlaWdodCBhbG9uZyB0aGUgZHJhZ2dpbmcgcGVyaW9kXG4gICAgICAgICAgICB2YXIgZyA9IGdldEdyaWRzdGVyKCk7XG4gICAgICAgICAgICB2YXIgZGVsdGEgPSBncmlkU2l6ZSArIGdyaWRNYXJnaW4gKiAyO1xuICAgICAgICAgICAgaWYgKGV2ZW50Lm9mZnNldFkgPiBnLiRlbC5oZWlnaHQoKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdmFyIGV4dHJhID0gTWF0aC5mbG9vcigoZXZlbnQub2Zmc2V0WSAtIGdyaWRIZWlnaHQpIC8gZGVsdGEgKyAxKTtcbiAgICAgICAgICAgICAgdmFyIG5ld0hlaWdodCA9IGdyaWRIZWlnaHQgKyBleHRyYSAqIGRlbHRhO1xuICAgICAgICAgICAgICBnLiRlbC5jc3MoJ2hlaWdodCcsIG5ld0hlaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzdG9wOiBmdW5jdGlvbihldmVudCwgdWkpIHtcbiAgICAgICAgICAgIHZhciByZXNpemVkID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJlc2l6ZUJsb2NrKHJlc2l6ZWQpO1xuICAgICAgICAgICAgfSwgMzAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgICQoJy51aS1yZXNpemFibGUtaGFuZGxlJykuaG92ZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZ2V0R3JpZHN0ZXIoKS5kaXNhYmxlKCk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGdldEdyaWRzdGVyKCkuZW5hYmxlKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICB9XG5cblxuICAgICAgZnVuY3Rpb24gcmVzaXplQmxvY2soZWxtT2JqKSB7XG4gICAgICAgIHZhciBhcmVhID0gZWxtT2JqLmZpbmQoJy53aWRnZXQtYXJlYScpO1xuICAgICAgICB2YXIgdyA9IGVsbU9iai53aWR0aCgpIC0gZ3JpZFNpemU7XG4gICAgICAgIHZhciBoID0gZWxtT2JqLmhlaWdodCgpIC0gZ3JpZFNpemU7XG5cbiAgICAgICAgZm9yICh2YXIgZ3JpZF93ID0gMTsgdyA+IDA7IHcgLT0gKGdyaWRTaXplICsgKGdyaWRNYXJnaW4gKiAyKSkpIHtcbiAgICAgICAgICBncmlkX3crKztcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGdyaWRfaCA9IDE7IGggPiAwOyBoIC09IChncmlkU2l6ZSArIChncmlkTWFyZ2luICogMikpKSB7XG4gICAgICAgICAgZ3JpZF9oKys7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgd2lkZ2V0ID0ge1xuICAgICAgICAgIGlkOiBhcmVhLmF0dHIoJ2RhdGEtd2lkZ2V0SWQnKVxuICAgICAgICB9O1xuXG4gICAgICAgIGNoYW5nZVdpZGdldFNpemUod2lkZ2V0LCBmdW5jdGlvbih3aWRnZXQpIHtcbiAgICAgICAgICB3aWRnZXQuc2l6ZV94ID0gZ3JpZF93O1xuICAgICAgICAgIHdpZGdldC5zaXplX3kgPSBncmlkX2g7XG4gICAgICAgIH0sIGZ1bmN0aW9uKHdpZGdldCkge1xuICAgICAgICAgIGlmIChzZXJpYWxpemVEYXNoYm9hcmQoKSkge1xuICAgICAgICAgICAgdXBkYXRlRGFzaGJvYXJkUmVwb3NpdG9yeShcIkNoYW5nZWQgc2l6ZSBvZiB3aWRnZXQ6IFwiICsgd2lkZ2V0LmlkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZURhc2hib2FyZFJlcG9zaXRvcnkobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgICAgIGlmICgkc2NvcGUuZGFzaGJvYXJkKSB7XG4gICAgICAgICAgdmFyIGNvbW1pdE1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgICAgIGlmICgkc2NvcGUuZGFzaGJvYXJkICYmICRzY29wZS5kYXNoYm9hcmQudGl0bGUpIHtcbiAgICAgICAgICAgIGNvbW1pdE1lc3NhZ2UgKz0gXCIgb24gZGFzaGJvYXJkIFwiICsgJHNjb3BlLmRhc2hib2FyZC50aXRsZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGFzaGJvYXJkUmVwb3NpdG9yeS5wdXREYXNoYm9hcmRzKFskc2NvcGUuZGFzaGJvYXJkXSwgY29tbWl0TWVzc2FnZSwgRGFzaGJvYXJkLm9uT3BlcmF0aW9uQ29tcGxldGUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGdldEdyaWRzdGVyKCkge1xuICAgICAgICByZXR1cm4gJGVsZW1lbnQuZ3JpZHN0ZXIoKS5kYXRhKCdncmlkc3RlcicpO1xuICAgICAgfVxuXG4gICAgfV07XG5cbiAgfVxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcbiAgX21vZHVsZS5jb250cm9sbGVyKFwiRGFzaGJvYXJkLkltcG9ydENvbnRyb2xsZXJcIiwgW1wiJHNjb3BlXCIsIFwiJGxvY2F0aW9uXCIsIFwiJHJvdXRlUGFyYW1zXCIsIFwiZGFzaGJvYXJkUmVwb3NpdG9yeVwiLCAoJHNjb3BlLCAkbG9jYXRpb24sICRyb3V0ZVBhcmFtcywgZGFzaGJvYXJkUmVwb3NpdG9yeTpEYXNoYm9hcmRSZXBvc2l0b3J5KSA9PiB7XG4gICAgJHNjb3BlLnBsYWNlaG9sZGVyID0gXCJQYXN0ZSB0aGUgSlNPTiBoZXJlIGZvciB0aGUgZGFzaGJvYXJkIGNvbmZpZ3VyYXRpb24gdG8gaW1wb3J0Li4uXCI7XG4gICAgJHNjb3BlLnNvdXJjZSA9ICRzY29wZS5wbGFjZWhvbGRlcjtcblxuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgbW9kZToge1xuICAgICAgICBuYW1lOiBcImphdmFzY3JpcHRcIlxuICAgICAgfVxuICAgIH07XG4gICAgLy8kc2NvcGUuY29kZU1pcnJvck9wdGlvbnMgPSBDb2RlRWRpdG9yLmNyZWF0ZUVkaXRvclNldHRpbmdzKG9wdGlvbnMpO1xuXG5cbiAgICAkc2NvcGUuaXNWYWxpZCA9ICgpID0+ICRzY29wZS5zb3VyY2UgJiYgJHNjb3BlLnNvdXJjZSAhPT0gJHNjb3BlLnBsYWNlaG9sZGVyO1xuXG4gICAgJHNjb3BlLmltcG9ydEpTT04gPSAoKSA9PiB7XG4gICAgICB2YXIganNvbiA9IFtdO1xuICAgICAgLy8gbGV0cyBwYXJzZSB0aGUgSlNPTi4uLlxuICAgICAgdHJ5IHtcbiAgICAgICAganNvbiA9IEpTT04ucGFyc2UoJHNjb3BlLnNvdXJjZSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vSGF3dGlvQ29yZS5ub3RpZmljYXRpb24oXCJlcnJvclwiLCBcIkNvdWxkIG5vdCBwYXJzZSB0aGUgSlNPTlxcblwiICsgZSk7XG4gICAgICAgIGpzb24gPSBbXTtcbiAgICAgIH1cbiAgICAgIHZhciBhcnJheSA9IFtdO1xuICAgICAgaWYgKGFuZ3VsYXIuaXNBcnJheShqc29uKSkge1xuICAgICAgICBhcnJheSA9IGpzb247XG4gICAgICB9IGVsc2UgaWYgKGFuZ3VsYXIuaXNPYmplY3QoanNvbikpIHtcbiAgICAgICAgYXJyYXkucHVzaChqc29uKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFycmF5Lmxlbmd0aCkge1xuICAgICAgICAvLyBsZXRzIGVuc3VyZSB3ZSBoYXZlIHNvbWUgdmFsaWQgaWRzIGFuZCBzdHVmZi4uLlxuICAgICAgICBhbmd1bGFyLmZvckVhY2goYXJyYXksIChkYXNoLCBpbmRleCkgPT4ge1xuICAgICAgICAgIGFuZ3VsYXIuY29weShkYXNoLCBkYXNoYm9hcmRSZXBvc2l0b3J5LmNyZWF0ZURhc2hib2FyZChkYXNoKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBkYXNoYm9hcmRSZXBvc2l0b3J5LnB1dERhc2hib2FyZHMoYXJyYXksIFwiSW1wb3J0ZWQgZGFzaGJvYXJkIEpTT05cIiwgRGFzaGJvYXJkLm9uT3BlcmF0aW9uQ29tcGxldGUpO1xuICAgICAgICAkbG9jYXRpb24ucGF0aChcIi9kYXNoYm9hcmQvZWRpdFwiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1dKTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkYXNoYm9hcmRQbHVnaW4udHNcIi8+XG4vKipcbiAqIEBtb2R1bGUgRGFzaGJvYXJkXG4gKi9cbm1vZHVsZSBEYXNoYm9hcmQge1xuICBfbW9kdWxlLmNvbnRyb2xsZXIoXCJEYXNoYm9hcmQuTmF2QmFyQ29udHJvbGxlclwiLCBbXCIkc2NvcGVcIiwgXCIkcm91dGVQYXJhbXNcIiwgXCIkcm9vdFNjb3BlXCIsIFwiZGFzaGJvYXJkUmVwb3NpdG9yeVwiLCAoJHNjb3BlLCAkcm91dGVQYXJhbXMsICRyb290U2NvcGUsIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSkgPT4ge1xuXG4gICAgJHNjb3BlLl9kYXNoYm9hcmRzID0gW107XG5cbiAgICAkc2NvcGUuYWN0aXZlRGFzaGJvYXJkID0gJHJvdXRlUGFyYW1zWydkYXNoYm9hcmRJZCddO1xuXG4gICAgJHNjb3BlLiRvbignbG9hZERhc2hib2FyZHMnLCBsb2FkRGFzaGJvYXJkcyk7XG5cbiAgICAkc2NvcGUuJG9uKCdkYXNoYm9hcmRzVXBkYXRlZCcsIGRhc2hib2FyZExvYWRlZCk7XG5cbiAgICAkc2NvcGUuZGFzaGJvYXJkcyA9ICgpID0+IHtcbiAgICAgIHJldHVybiAkc2NvcGUuX2Rhc2hib2FyZHNcbiAgICB9O1xuXG4gICAgJHNjb3BlLm9uVGFiUmVuYW1lZCA9IGZ1bmN0aW9uKGRhc2gpIHtcbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkucHV0RGFzaGJvYXJkcyhbZGFzaF0sIFwiUmVuYW1lZCBkYXNoYm9hcmRcIiwgKGRhc2hib2FyZHMpID0+IHtcbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGRhc2hib2FyZExvYWRlZChldmVudCwgZGFzaGJvYXJkcykge1xuICAgICAgbG9nLmRlYnVnKFwibmF2YmFyIGRhc2hib2FyZExvYWRlZDogXCIsIGRhc2hib2FyZHMpO1xuICAgICAgJHNjb3BlLl9kYXNoYm9hcmRzID0gZGFzaGJvYXJkcztcbiAgICAgIGlmIChldmVudCA9PT0gbnVsbCkge1xuICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2Rhc2hib2FyZHNVcGRhdGVkJywgZGFzaGJvYXJkcyk7XG4gICAgICAgIENvcmUuJGFwcGx5KCRzY29wZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbG9hZERhc2hib2FyZHMoZXZlbnQpIHtcbiAgICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkcygoZGFzaGJvYXJkcykgPT4ge1xuICAgICAgICAvLyBwcmV2ZW50IHRoZSBicm9hZGNhc3QgZnJvbSBoYXBwZW5pbmcuLi5cbiAgICAgICAgZGFzaGJvYXJkTG9hZGVkKG51bGwsIGRhc2hib2FyZHMpO1xuICAgICAgICBDb3JlLiRhcHBseSgkc2NvcGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XSk7XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGFzaGJvYXJkUGx1Z2luLnRzXCIvPlxuLyoqXG4gKiBAbW9kdWxlIERhc2hib2FyZFxuICovXG5tb2R1bGUgRGFzaGJvYXJkIHtcbiAgZXhwb3J0IHZhciBTaGFyZUNvbnRyb2xsZXIgPSBfbW9kdWxlLmNvbnRyb2xsZXIoXCJEYXNoYm9hcmQuU2hhcmVDb250cm9sbGVyXCIsIFtcIiRzY29wZVwiLCBcIiRsb2NhdGlvblwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcImRhc2hib2FyZFJlcG9zaXRvcnlcIiwgKCRzY29wZSwgJGxvY2F0aW9uLCAkcm91dGVQYXJhbXMsIGRhc2hib2FyZFJlcG9zaXRvcnk6RGFzaGJvYXJkUmVwb3NpdG9yeSkgPT4ge1xuICAgIHZhciBpZCA9ICRyb3V0ZVBhcmFtc1tcImRhc2hib2FyZElkXCJdO1xuICAgIGRhc2hib2FyZFJlcG9zaXRvcnkuZ2V0RGFzaGJvYXJkKGlkLCBvbkRhc2hib2FyZExvYWQpO1xuXG4gICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICBtb2RlOiB7XG4gICAgICAgICAgbmFtZTogXCJqYXZhc2NyaXB0XCJcbiAgICAgIH1cbiAgICB9O1xuICAgIC8vJHNjb3BlLmNvZGVNaXJyb3JPcHRpb25zID0gQ29kZUVkaXRvci5jcmVhdGVFZGl0b3JTZXR0aW5ncyhvcHRpb25zKTtcblxuICAgIGZ1bmN0aW9uIG9uRGFzaGJvYXJkTG9hZChkYXNoYm9hcmQpIHtcbiAgICAgICRzY29wZS5kYXNoYm9hcmQgPSBEYXNoYm9hcmQuY2xlYW5EYXNoYm9hcmREYXRhKGRhc2hib2FyZCk7XG5cbiAgICAgICRzY29wZS5qc29uID0ge1xuICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiaGF3dGlvIGRhc2hib2FyZHNcIixcbiAgICAgICAgXCJwdWJsaWNcIjogdHJ1ZSxcbiAgICAgICAgXCJmaWxlc1wiOiB7XG4gICAgICAgICAgXCJkYXNoYm9hcmRzLmpzb25cIjoge1xuICAgICAgICAgICAgXCJjb250ZW50XCI6IEpTT04uc3RyaW5naWZ5KCRzY29wZS5kYXNoYm9hcmQsIG51bGwsIFwiICBcIilcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5zb3VyY2UgPSBKU09OLnN0cmluZ2lmeSgkc2NvcGUuZGFzaGJvYXJkLCBudWxsLCBcIiAgXCIpO1xuICAgICAgQ29yZS4kYXBwbHlOb3dPckxhdGVyKCRzY29wZSk7XG4gICAgfVxuICB9XSk7XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

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