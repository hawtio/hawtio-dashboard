/// <reference path="dashboardPlugin.ts"/>
/**
 * @module Dashboard
 */
module Dashboard {

  _module.controller("Dashboard.EditDashboardsController", ["$scope", "$routeParams", "$route", "$location", "$rootScope", "dashboardRepository", "HawtioNav", "$timeout", "$templateCache", "$uibModal", "HawtioDashboardTab", ($scope, $routeParams, $route, $location, $rootScope, dashboardRepository:DashboardRepository, nav, $timeout, $templateCache, $uibModal, tab) => {

    $scope._dashboards = [];

    $rootScope.$on('dashboardsUpdated', dashboardLoaded);

    $scope.hasUrl = () => {
      return ($scope.url) ? true : false;
    };

    $scope.hasSelection = () => {
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
          cellTemplate: $templateCache.get(UrlHelpers.join(templatePath, 'editDashboardTitleCell.html'))
        },
        {
          field: 'group',
          displayName: 'Group'
        }
      ],
    };

    var doUpdate = _.debounce(updateData, 10);

    // helpers so we can enable/disable parts of the UI depending on how
    // dashboard data is stored
    /*
    $scope.usingGit = () => {
      return dashboardRepository.getType() === 'git';
    };

    $scope.usingFabric = () => {
      return dashboardRepository.getType() === 'fabric';
    };

    $scope.usingLocal = () => {
      return dashboardRepository.getType() === 'container';
    };

    if ($scope.usingFabric()) {
      $scope.gridOptions.columnDefs.add([{
        field: 'versionId',
        displayName: 'Version'
      }, {
        field: 'profileId',
        displayName: 'Profile'
      }, {
        field: 'fileName',
        displayName: 'File Name'
      }]);
    }
    */

    $timeout(doUpdate, 10);

    $scope.$on("$routeChangeSuccess", function (event, current, previous) {
      // lets do this asynchronously to avoid Error: $digest already in progress
      $timeout(doUpdate, 10);
    });

    $scope.addViewToDashboard = () => {
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
      } else if (iframe) {
        iframe = URI.decode(iframe);
        type = 'iframe';
      }
      var widgetURI = <any> undefined;
      switch(type) {
        case 'href':
          log.debug("href: ", href);
          widgetURI = new URI(href);
          break;
        case 'iframe':
          log.debug("iframe: ", iframe);
          widgetURI = new URI(iframe);
          break;
        default:
          log.debug("type unknown");
          return;
      }
      var sizeStr = <any> config['size'];
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
      }
      angular.forEach(selected, (selectedItem) => {

        var widget = _.cloneDeep(templateWidget);

        if (!selectedItem.widgets) {
          selectedItem.widgets = [];
        }

        switch (type) {
          case 'iframe': 
            widget = <any>_.extend({
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
                  widget = <any> _.extend({
                    path: text,
                    include: templateUrl,
                    search: search,
                    hash: ""
                  }, widget);
                }
              } else {
                // TODO we need to be able to match URI templates...
                return;
              }
            }
            break;
        }
        // figure out the width of the dash
        var gridWidth = 0;

        selectedItem.widgets.forEach((w) => {
          var rightSide = w.col + w.size_x;
          if (rightSide > gridWidth) {
            gridWidth = rightSide;
          }
        });

        var found = false;

        var left = (w) => {
          return w.col;
        };

        var right = (w)  => {
          return w.col + w.size_x - 1;
        };

        var top = (w) => {
          return w.row;
        };

        var bottom = (w) => {
          return w.row + w.size_y - 1;
        };

        var collision = (w1, w2) => {
          return !( left(w2) > right(w1) ||
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
            // let's not look for a place next to existing widget
            selectedItem.widgets.forEach(function(w, idx) {
              if (widget.row <= w.row) {
                widget.row++;
              }
            });
            found = true;
          }
          for (; (widget.col + widget.size_x) <= gridWidth; widget.col++) {
            if (!_.some(selectedItem.widgets, (w) => {
              var c = collision(w, widget);
              return c
            })) {
              found = true;
              break;
            }
          }
          if (!found) {
            widget.row = widget.row + 1
          }
          // just in case, keep the script from running away...
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

      // now lets update the actual dashboard config
      var commitMessage = "Add widget";
      dashboardRepository.putDashboards(selected, commitMessage, (dashboards) => {
        /*
        log.debug("Put dashboards: ", dashboards);
        log.debug("Next href: ", nextHref.toString());
        */
        if (nextHref) {
          $location.path(nextHref.path()).search(nextHref.query(true));
          Core.$apply($scope);
        }
      });

    };

    $scope.create = () => {

      var counter = dashboards().length + 1;
      var title = "Untitled" + counter;

      var modal = $uibModal.open({
        templateUrl: UrlHelpers.join(templatePath, 'createDashboardModal.html'),
        controller: ['$scope', '$uibModalInstance', ($scope, $uibModalInstance) => {
          $scope.entity = {
            title: title
          }
          $scope.config = {
            properties: {
              'title': {
                type: 'string',
              }
            }
          };
          $scope.ok = () => {
            modal.close();
            var title = $scope.entity.title
            var newDash = dashboardRepository.createDashboard({ title: title });
            dashboardRepository.putDashboards([newDash], "Created new dashboard: " + title, (dashboards) => {
              // let's just be safe and ensure there's no selections
              deselectAll();
              setSubTabs(tab, nav.builder(), dashboards, $rootScope);
              dashboardLoaded(null, dashboards);
            });
          }
          $scope.cancel = () => {
            modal.dismiss();
          }
        }]
      });
      /*
      var counter = dashboards().length + 1;
      var title = "Untitled" + counter;
      var newDash = dashboardRepository.createDashboard({title: title});

      dashboardRepository.putDashboards([newDash], "Created new dashboard: " + title, (dashboards) => {
        // let's just be safe and ensure there's no selections
        deselectAll();
        setSubTabs(nav.builder(), dashboards, $rootScope);
        dashboardLoaded(null, dashboards);
      });
      */

    };

    $scope.duplicate = () => {
      var newDashboards = [];
      var commitMessage = "Duplicated dashboard(s) ";
      angular.forEach($scope.gridOptions.selectedItems, (item, idx) => {
        // lets unselect this item
        var commitMessage = "Duplicated dashboard " + item.title;
        var newDash = dashboardRepository.cloneDashboard(item);
        newDashboards.push(newDash);
      });

      // let's just be safe and ensure there's no selections
      deselectAll();

      commitMessage = commitMessage + newDashboards.map((d) => { return d.title }).join(',');
      dashboardRepository.putDashboards(newDashboards, commitMessage, (dashboards) => {
        setSubTabs(tab, nav.builder(), dashboards, $rootScope);
        dashboardLoaded(null, dashboards);
      });
    };

    $scope.renameDashboard = () => {
      if ($scope.gridOptions.selectedItems.length === 1) {
        var selected = <any>_.first($scope.gridOptions.selectedItems);
        var modal = $uibModal.open({
          templateUrl: UrlHelpers.join(templatePath, 'renameDashboardModal.html'),
          controller: ['$scope', '$uibModalInstance', ($scope, $uibModalInstance) => {
            $scope.config = {
              properties: {
                'title': {
                  type: 'string',
                  default: selected.title
                }
              }
            };
            $scope.selected = selected;
            $scope.ok = () => {
              modal.close();
              dashboardRepository.putDashboards([$scope.selected], 'renamed dashboard', (dashboards) => {
                // let's just be safe and ensure there's no selections
                deselectAll();
                setSubTabs(tab, nav.builder(), dashboards, $rootScope);
                dashboardLoaded(null, dashboards);
              });
            }
            $scope.cancel = () => {
              modal.dismiss();
            }
          }]
        });
      }
    };

    $scope.deleteDashboard = () => {
      if ($scope.hasSelection()) {
        var selected = $scope.gridOptions.selectedItems;
        var modal = $uibModal.open({
          templateUrl: UrlHelpers.join(templatePath, 'deleteDashboardModal.html'),
          controller: ['$scope', '$uibModalInstance', ($scope, $uibModalInstance) => {
            $scope.selected = selected;
            $scope.ok = () => {
              modal.close();
              dashboardRepository.deleteDashboards($scope.selected, (dashboards) => {
                // let's just be safe and ensure there's no selections
                deselectAll();
                setSubTabs(tab, nav.builder(), dashboards, $rootScope);
                dashboardLoaded(null, dashboards);
              });
            }
            $scope.cancel = () => {
              modal.dismiss();
            }
          }]
        });
      }
    };

    $scope.gist = () => {
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
      var size:any = $routeParams["size"];
      if (size) {
        size = decodeURIComponent(size);
        $scope.preferredSize = angular.fromJson(size);
      }
      var title:any = $routeParams["title"];
      if (title) {
        title = decodeURIComponent(title);
        $scope.widgetTitle = title;
      }

      dashboardRepository.getDashboards((dashboards) => {
        log.debug("Loaded dashboards: ", dashboards);
        dashboardLoaded(null, dashboards);
      });
    }

    function dashboardLoaded(event, dashboards) {
      dashboards.forEach((dashboard) => {
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
}
