/**
 * @module Dashboard
 */
/// <reference path="dashboardPlugin.ts"/>
/// <reference path="dashboardRepository.ts"/>
/// <reference path="rectangleLocation.ts"/>
module Dashboard {

  var modules:Array<string> = undefined;

  _module.directive('hawtioDashboard', function() {
    modules = hawtioPluginLoader['modules'].filter((name) => {
      return _.isString(name) && name !== 'ng';
    });
    return new Dashboard.GridsterDirective();
  });

  export class GridsterDirective {
    public restrict = 'A';
    public replace = true;

    public controller = ["$scope", "$element", "$attrs", "$location", "$routeParams", "$templateCache", "dashboardRepository", "$compile", "$templateRequest", "$interpolate", "$modal", "$sce", "$timeout", ($scope, $element, $attrs, $location, $routeParams, $templateCache, dashboardRepository:DashboardRepository, $compile, $templateRequest, $interpolate, $modal, $sce, $timeout) => {

      var gridSize = 150;
      var gridMargin = 6;
      var gridHeight;

      var gridX = gridSize;
      var gridY = gridSize;

      var widgetMap = {};

      var dashboardRepository:DashboardRepository = $scope.$eval('dashboardRepository') || dashboardRepository;

      $scope.$on('$destroy', () => {
        angular.forEach(widgetMap, (value, key) => {
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

        // lets destroy the widgets's scope
        var widgetData = widgetMap[widget.id];
        if (widgetData) {
          delete widgetMap[widget.id];
          widgetElem = widgetData.widget;
        }
        if (!widgetElem) {
          // lets get the li parent element of the template
          widgetElem = $element.find("[data-widgetId='" + widget.id + "']").parent();
        }
        if (gridster && widgetElem) {
          gridster.remove_widget(widgetElem);
        }
        // lets trash the JSON metadata
        if ($scope.dashboard) {
          var widgets = $scope.dashboard.widgets;
          if (widgets) {
            widgets.remove(widget);
          }
        }

        updateDashboardRepository("Removed widget " + widget.title);
      };

      function changeWidgetSize(widget, sizefunc, savefunc) {
        if (!widget) {
          log.debug("widget undefined");
          return;
        }
        var gridster = getGridster();
        log.debug("Widget ID: ", widget.id, " widgetMap: ", widgetMap);
        var entry = widgetMap[widget.id];
        var w = entry.widget;
        sizefunc(entry);
        gridster.resize_widget(w, entry.size_x, entry.size_y);
        gridster.set_dom_grid_height();
        setTimeout(() => {
          savefunc(widget);
        }, 50);
      }

      function onWidgetRenamed(widget) {
        updateDashboardRepository("Renamed widget to " + widget.title);
      };

      function updateWidgets() {
        $scope.id = $scope.$eval('dashboardId') || $routeParams["dashboardId"];
        $scope.idx = $scope.$eval('dashboardIndex') || $routeParams["dashboardIndex"];
        if ($scope.id) {
          $scope.$emit('loadDashboards');
          dashboardRepository.getDashboard($scope.id, onDashboardLoad);
        } else {
          dashboardRepository.getDashboards((dashboards) => {
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
            } else {
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

        angular.forEach(widgets, (widget) => {
          if (!widget) {
            log.debug("Undefined widget, skipping");
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
            stop: (event, ui) => {
              if (serializeDashboard()) {
                updateDashboardRepository("Changing dashboard layout");
              }
            }
          }
        }).data('gridster');

        var template = $templateCache.get(UrlHelpers.join(templatePath, "widgetTemplate.html"));
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
          log.debug("Remove widget: ", widget);
          var modal = $modal.open({
            templateUrl: UrlHelpers.join(templatePath, 'deleteWidgetModal.html'),
            controller: ['$scope', '$modalInstance', ($scope, $modalInstance) => {
              $scope.widget = widget;
              $scope.ok = () => {
                modal.close();
                removeWidget($scope.widget);
              }
              $scope.cancel = () => {
                modal.dismiss();
              }
            }]
          });
        }

        function doRenameWidget($modal, widget) {
          log.debug("Rename widget: ", widget);
          var modal = $modal.open({
            templateUrl: UrlHelpers.join(templatePath, 'renameWidgetModal.html'),
            controller: ['$scope', '$modalInstance', ($scope, $modalInstance) => {
              $scope.widget = widget;
              $scope.config = {
                properties: {
                  'title': {
                    type: 'string',
                    default: widget.title
                  }
                }
              };
              $scope.ok = () => {
                modal.close();
                onWidgetRenamed($scope.widget);
              }
              $scope.cancel = () => {
                modal.dismiss();
              }
            }]
          });
        }

        angular.forEach(widgets, (widget) => {
          var type = 'internal';
          if ('iframe' in widget) {
            type = 'external';
          }
          switch (type) {
            case 'external':
              log.debug("Rendering external (iframe) widget: ", widget.title || widget.id);
              var scope = $scope.$new();
              scope.widget = widget;
              scope.removeWidget = (widget) => doRemoveWidget($modal, widget);
              scope.renameWidget = (widget) => doRenameWidget($modal, widget);
              var widgetBody:any = angular.element($templateCache.get(UrlHelpers.join(templatePath, 'iframeWidgetTemplate.html')));
              var outerDiv = angular.element($templateCache.get(UrlHelpers.join(templatePath, 'widgetBlockTemplate.html')));
              widgetBody.find('iframe').attr('src', widget.iframe);
              outerDiv.append($compile(widgetBody)(scope));
              var w = gridster.add_widget(outerDiv, widget.size_x, widget.size_y, widget.col, widget.row);
              widgetMap[widget.id] = {
                widget: w
              };
              maybeFinishUp();
              break;
            case 'internal': 
              log.debug("Rendering internal widget: ", widget.title || widget.id);
              var path = widget.path;
              var search = null;
              if (widget.search) {
                search = Dashboard.decodeURIComponentProperties(widget.search);
              }
              if (widget.routeParams) {
                _.extend(search, angular.fromJson(widget.routeParams));
              }
              var hash = widget.hash; // TODO decode object?
              var location = new RectangleLocation($location, path, search, hash);
              if (!widget.size_x || widget.size_x < 1) {
                widget.size_x = 1;
              }
              if (!widget.size_y || widget.size_y < 1) {
                widget.size_y = 1;
              }
              var tmpModuleName = 'dashboard-' + widget.id;
              var tmpModule = angular.module(tmpModuleName, modules);
              tmpModule.config(['$provide', ($provide) => {
                $provide.decorator('HawtioDashboard', ['$delegate', '$rootScope', ($delegate, $rootScope) => {
                  $delegate.inDashboard = true;
                  return $delegate;
                }]);
                $provide.decorator('$location', ['$delegate', ($delegate) => {
                  //log.debug("Using $location: ", location);
                  return location;
                }]);
                $provide.decorator('$route', ['$delegate', ($delegate) => {
                  // really handy for debugging, mostly to tell if a widget's route
                  // isn't actually available in the child app
                  //log.debug("Using $route: ", $delegate);
                  return $delegate;
                }]);
                $provide.decorator('$routeParams', ['$delegate', ($delegate) => {
                  //log.debug("Using $routeParams: ", search);
                  return search;
                }]);
              }]);
              tmpModule.controller('HawtioDashboard.Title', ["$scope", "$modal", ($scope, $modal) => {
                $scope.widget = widget;
                $scope.removeWidget = (widget) => doRemoveWidget($modal, widget);
                $scope.renameWidget = (widget) => doRenameWidget($modal, widget);
              }]);

              var div:any = $(template);
              div.attr({ 'data-widgetId': widget.id });
              var body = div.find('.widget-body');
              log.debug("include: ", widget.include);
              var widgetBody = $templateCache.get(widget.include);
              $timeout(() => {
                var outerDiv = angular.element($templateCache.get(UrlHelpers.join(templatePath, 'widgetBlockTemplate.html')));
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
          //console.log("got data: " + JSON.stringify(data));

          var widgets = $scope.dashboard.widgets || [];
          // console.log("Widgets: ", widgets);

          // lets assume the data is in the order of the widgets...
          angular.forEach(widgets, (widget, idx) => {
            var value = data[idx];
            if (value && widget) {
              // lets copy the values across
              angular.forEach(value, (attr, key) => widget[key] = attr);
            }
          });
          return true;
        }
        return false;
      }

      function makeResizable() {
        var blocks:any = $('.grid-block');
        blocks.resizable('destroy');

        blocks.resizable({
          grid: [gridSize + (gridMargin * 2), gridSize + (gridMargin * 2)],
          animate: false,
          minWidth: gridSize,
          minHeight: gridSize,
          autoHide: false,
          start: function(event, ui) {
            gridHeight = getGridster().$el.height();
          },
          resize: function(event, ui) {
            //set new grid height along the dragging period
            var g = getGridster();
            var delta = gridSize + gridMargin * 2;
            if (event.offsetY > g.$el.height())
            {
              var extra = Math.floor((event.offsetY - gridHeight) / delta + 1);
              var newHeight = gridHeight + extra * delta;
              g.$el.css('height', newHeight);
            }
          },
          stop: function(event, ui) {
            var resized = $(this);
            setTimeout(function() {
              resizeBlock(resized);
            }, 300);
          }
        });

        $('.ui-resizable-handle').hover(function() {
          getGridster().disable();
        }, function() {
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

        changeWidgetSize(widget, function(widget) {
          widget.size_x = grid_w;
          widget.size_y = grid_h;
        }, function(widget) {
          if (serializeDashboard()) {
            updateDashboardRepository("Changed size of widget: " + widget.id);
          }
        });

      }

      function updateDashboardRepository(message: string) {
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

}
