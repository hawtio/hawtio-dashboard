var UITestPages;
(function (UITestPages) {
  UITestPages.templatePath = 'plugins/ui/html/test';
  var path = UITestPages.templatePath;
  UITestPages.pluginName = 'hawtio-ui-test-pages';
  UITestPages._module = angular.module(UITestPages.pluginName, []);

  var tab = null;

  UITestPages._module.config(['$routeProvider', 'HawtioNavBuilderProvider', function($routeProvider, builder) {

    tab = builder.create()
                   .id(UITestPages.pluginName)
                   .href(function () { return '/ui'; })
                   .title(function () { return "UI Components"; })
                     .subPath('Icons', 'icons', builder.join(path, 'icon.html'))
                     .subPath('Auto Columns', 'auto-columns', builder.join(path, 'auto-columns.html'))
                     .subPath('Auto Dropdown', 'auto-dropdown', builder.join(path, 'auto-dropdown.html'))
                     .subPath('Breadcrumbs', 'breadcrumbs', builder.join(path, 'breadcrumbs.html'))
                     .subPath('Color Picker', 'color-picker', builder.join(path, 'color-picker.html'))
                     .subPath('Confirm Dialog', 'confirm-dialog', builder.join(path, 'confirm-dialog.html'))
                     .subPath('Drop Down', 'drop-down', builder.join(path, 'drop-down.html'))
                     .subPath('Editable Property', 'editable-property', builder.join(path, 'editable-property.html'))
                     .subPath('Editor', 'editor', builder.join(path, 'editor.html'))
                     .subPath('Expandable', 'expandable', builder.join(path, 'expandable.html'))
                     .subPath('File Upload', 'file-upload', builder.join(path, 'file-upload.html'))
                     .subPath('JSPlumb', 'jsplumb', builder.join(path, 'jsplumb.html'))
                     .subPath('Pager', 'pager', builder.join(path, 'pager.html'))
                     .subPath('Slideout', 'slideout', builder.join(path, 'slideout.html'))
                     .subPath('Template Popover', 'template-popover', builder.join(path, 'template-popover.html'))
                     .subPath('Zero Clipboard', 'zero-clipboard', builder.join(path, 'zero-clipboard.html'))
                   .build();

    builder.configureRouting($routeProvider, tab);
  }]);

  UITestPages._module.run(['HawtioNav', function(nav) {
    nav.add(tab);
  }]);


  hawtioPluginLoader.addModule(UITestPages.pluginName);

})(UITestPages || (UITestPages = {}));

var Test;
(function (Test) {
    // simple test plugin for messing with the nav bar
    Test.pluginName = 'test';
    Test.templatePath = 'test/html';
    Test.log = Logger.get(Test.pluginName);
    Test._module = angular.module(Test.pluginName, []);
    var tab = null;
    var tab2 = null;
    var tabs = [];
    Test._module.config(['$routeProvider', 'HawtioNavBuilderProvider', '$locationProvider', function ($routeProvider, builder, $locationProvider) {
        $locationProvider.html5Mode(true);
        tab = builder.create()
                     .id(Test.pluginName)
                     .title(function () { return "Test"; })
                     .href(function () { return "/test1"; })
                     .subPath("Sub Page 1", "page1", builder.join(Test.templatePath, 'page1.html'))
                     .subPath("Sub Page 2", "page2", builder.join(Test.templatePath, 'page2.html'))
                     .subPath("Sub Page 3", "page3", builder.join(Test.templatePath, 'page3.html'))
                     .build();

        tab2 = builder.create()
                      .id(builder.join(Test.pluginName, '2'))
                      .title(function () { return "Test2"; })
                      .href(function () { return "/test2"; })
                      .page(function () { return builder.join(Test.templatePath, 'page1.html'); })
                      .build();

        ['1', '2', '3', '4'].forEach(function(index) {
          tabs.push(builder.create()
                           .id(builder.join('test', index))
                           .title( function() { return 'Test ' + index; })
                           .href( function() { return '/many/' + index; })
                           .build());
        });

        console.log("Tabs:", tabs);


        builder.configureRouting($routeProvider, tab);
        builder.configureRouting($routeProvider, tab2);
        $routeProvider.when('/many/:index', { templateUrl: builder.join(Test.templatePath, 'page1.html') });

        // Manually configured route
        $routeProvider.when('/foo/bar', { templateUrl: builder.join(Test.templatePath, 'page1.html') });
    }]);
    Test._module.run(["HawtioNav", function (HawtioNav) {
        Test.log.debug('loaded');
        HawtioNav.add(tab);
        HawtioNav.add(tab2);
        tabs.forEach(function(tab) { HawtioNav.add(tab); });

        var builder = HawtioNav.builder();

        var subTab1 = builder.id('fooSubTab')
                            .href(function() { return '/foo/bar'; })
                            .title(function() { return 'My Sub Tab 2'; })
                            .build();

        var subTab2 = builder.id('fooSubTab')
                            .href(function() { return '/foo/barBaz'; })
                            .title(function() { return 'My Sub Tab 2'; })
                            .build();

        var tab3 = builder.id('foo')
                          .href(function() { return '/foo'; })
                          .title(function() { return 'My Tab'; })
                          .tabs(subTab1, subTab2)
                          .build();
        
        HawtioNav.add(tab3);


        

    }]);
    hawtioPluginLoader.addModule(Test.pluginName);
})(Test || (Test = {}));
