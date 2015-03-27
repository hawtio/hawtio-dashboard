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

/// <reference path="../../includes.ts"/>
/// <reference path="exampleGlobals.ts"/>
module DevExample {

  export var _module = angular.module(DevExample.pluginName, []);

  var tab = undefined;

  var testDashboards ='[{"title":"Test Dashboard One","group":"Personal","widgets":[{"id":"w1","title":"","row":1,"col":1,"size_x":2,"size_y":2,"path":"/test_example/page1","include":"test-plugins/example/html/page1.html","search":{"main-tab":"hawtio-test-plugin"},"hash":""},{"id":"w2","title":"","row":1,"col":3,"size_x":2,"size_y":2,"path":"/test_example/page2","include":"test-plugins/example/html/page2.html","search":{"main-tab":"hawtio-test-plugin","sub-tab":"hawtio-test-plugin-page2"},"hash":""}],"id":"5120d5d69a0cf19ae6","hash":"?main-tab=dashboard&sub-tab=dashboard-5120d5d69a0cf19ae6"},{"title":"Test Dashboard Two","group":"Personal","widgets":[{"id":"w1","title":"A thing.  With a name.","row":1,"col":1,"size_x":2,"size_y":2,"path":"/test_example/page1","include":"test-plugins/example/html/page1.html","search":{"main-tab":"hawtio-test-plugin"},"hash":""},{"id":"w2","title":"Some Instance of Something","row":1,"col":3,"size_x":2,"size_y":2,"path":"/test_example/page1","include":"test-plugins/example/html/page1.html","search":{"main-tab":"hawtio-test-plugin"},"hash":""},{"id":"w3","title":"","row":1,"col":5,"size_x":2,"size_y":2,"path":"/test_example/page1","include":"test-plugins/example/html/page1.html","search":{"main-tab":"hawtio-test-plugin"},"hash":""},{"id":"w4","title":"","row":3,"col":3,"size_x":2,"size_y":2,"path":"/test_example/page1","include":"test-plugins/example/html/page1.html","search":{"main-tab":"hawtio-test-plugin"},"hash":""},{"id":"w5","title":"","row":1,"col":7,"size_x":2,"size_y":2,"path":"/test_example/page2","include":"test-plugins/example/html/page2.html","search":{"main-tab":"hawtio-test-plugin","sub-tab":"hawtio-test-plugin-page2"},"hash":""}],"id":"5120d5ef26e661afe4","hash":"?main-tab=dashboard&sub-tab=dashboard-5120d5ef26e661afe4"},{"title":"Test Dashboard Three","group":"Personal","widgets":[{"id":"w1","title":"I have a name!","row":1,"col":1,"size_x":2,"size_y":2,"path":"/test_example/page1","include":"test-plugins/example/html/page1.html","search":{"main-tab":"hawtio-test-plugin"},"hash":""},{"id":"w2","title":"","row":1,"col":3,"size_x":2,"size_y":2,"path":"/test_example/page1","include":"test-plugins/example/html/page1.html","search":{"main-tab":"hawtio-test-plugin"},"hash":""},{"id":"w3","title":"This is my title","row":1,"col":5,"size_x":2,"size_y":2,"path":"/test_example/page2","include":"test-plugins/example/html/page2.html","search":{"main-tab":"hawtio-test-plugin","sub-tab":"hawtio-test-plugin-page2"},"hash":""}],"id":"5120d5fa6488911695","hash":"?main-tab=dashboard&sub-tab=dashboard-5120d5fa6488911695"}]' 

  _module.config(["$locationProvider", "$routeProvider", "HawtioNavBuilderProvider",
    ($locationProvider, $routeProvider: ng.route.IRouteProvider, builder: HawtioMainNav.BuilderFactory) => {
    tab = builder.create()
      .id(DevExample.pluginName)
      .title(() => "Test DevExample")
      .href(() => "/test_example")
      .subPath("Page 1", "page1", builder.join(DevExample.templatePath, "page1.html"))
      .subPath("Page 2", "page2", builder.join(DevExample.templatePath, "page2.html"))
      .subPath("Embed IFrame", "page3", builder.join(DevExample.templatePath, "page3.html"))
      .build();
    builder.configureRouting($routeProvider, tab);
  }]);

  _module.run(["HawtioNav", 'DefaultDashboards', (HawtioNav: HawtioMainNav.Registry, defaults:Dashboard.DefaultDashboards) => {
    
    var myDefaults = angular.fromJson(testDashboards);
    myDefaults.forEach((dashboard) => {
      defaults.add(dashboard);
    })
    HawtioNav.add(tab);
    HawtioNav.add({
      id: 'project-link',
      isSelected: function() { return false; },
      title: function() { return 'github'; },
      click: function() { window.location.href = 'https://github.com/hawtio/hawtio-dashboard'; },
      href: function() { return 'https://github.com/hawtio/hawtio-dashboard'; }
    });
    HawtioNav.add({
      id: 'hawtio-link',
      isSelected: function() { return false; },
      title: function() { return 'hawtio'; },
      click: function() { window.location.href = 'http://hawt.io'; },
      href: function() { return 'http://hawt.io'; }
    });
    log.debug("loaded");
  }]);


  hawtioPluginLoader.addModule(DevExample.pluginName);
}
