/**
 * @license AngularJS v1.0.2
 * (c) 2010-2012 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular, undefined) {
'use strict';

var directive = {};


  directive.tabbable = function() {
    return {
      restrict: 'C',
      compile: function(element) {
        var navTabs = angular.element('<ul class="nav nav-tabs"></ul>'),
        tabContent = angular.element('<div class="tab-content"></div>');

        tabContent.append(element.contents());
        element.append(navTabs).append(tabContent);
      },
      controller: ['$scope', '$element', function($scope, $element) {
        var navTabs = $element.contents().eq(0),
        ngModel = $element.controller('ngModel') || {},
        tabs = [],
        selectedTab;

        ngModel.$render = function() {
          var $viewValue = this.$viewValue;

          if (selectedTab ? (selectedTab.value != $viewValue) : $viewValue) {
            if(selectedTab) {
              selectedTab.paneElement.removeClass('active');
              selectedTab.tabElement.removeClass('active');
              selectedTab = null;
            }
            if($viewValue) {
              for(var i = 0, ii = tabs.length; i < ii; i++) {
                if ($viewValue == tabs[i].value) {
                  selectedTab = tabs[i];
                  break;
                }
              }
              if (selectedTab) {
                selectedTab.paneElement.addClass('active');
                selectedTab.tabElement.addClass('active');
              }
            }

          }
        };

        this.addPane = function(element, attr) {
          var li = angular.element('<li><a href></a></li>'),
          a = li.find('a'),
          tab = {
            paneElement: element,
            paneAttrs: attr,
            tabElement: li
          };

          tabs.push(tab);

          attr.$observe('value', update)();
          attr.$observe('title', function(){ update(); a.text(tab.title); })();

          function update() {
            tab.title = attr.title;
            tab.value = attr.value || attr.title;
            if (!ngModel.$setViewValue && (!ngModel.$viewValue || tab == selectedTab)) {
              // we are not part of angular
              ngModel.$viewValue = tab.value;
            }
            ngModel.$render();
          }

          navTabs.append(li);
          li.bind('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            if (ngModel.$setViewValue) {
              $scope.$apply(function() {
                ngModel.$setViewValue(tab.value);
                ngModel.$render();
              });
            } else {
              // we are not part of angular
              ngModel.$viewValue = tab.value;
              ngModel.$render();
            }
          });

          return function() {
            tab.tabElement.remove();
            for(var i = 0, ii = tabs.length; i < ii; i++ ) {
              if (tab == tabs[i]) {
                tabs.splice(i, 1);
              }
            }
          };
        }
      }]
    };
  };


  directive.tabPane = function() {
    return {
      require: '^tabbable',
      restrict: 'C',
      link: function(scope, element, attrs, tabsCtrl) {
        element.bind('$remove', tabsCtrl.addPane(element, attrs));
      }
    };
  };

  var pluginName = 'hawtio-tabbable';
  angular.module(pluginName, []).directive(directive);
  hawtioPluginLoader.addModule(pluginName);
})(window, window.angular);
