///<reference path="../defs.d.ts"/>

///<reference path="../../includes.ts"/>
var DatatableTest;
(function (DatatableTest) {
    var pluginName = "datatable-test";
    DatatableTest.templatePath = "test-plugins/datatable/html";
    DatatableTest._module = angular.module(pluginName, []);
    DatatableTest._module.config(["$routeProvider", function ($routeProvider) {
        $routeProvider.when('/datatable/test', { templateUrl: UrlHelpers.join(DatatableTest.templatePath, 'test.html') });
    }]);
    DatatableTest._module.run(['HawtioNav', function (nav) {
        var builder = nav.builder();
        nav.add(builder.id(pluginName).href(function () { return '/datatable/test'; }).title(function () { return 'Tables'; }).build());
    }]);
    hawtioPluginLoader.addModule(pluginName);
})(DatatableTest || (DatatableTest = {}));

/// <reference path="datatablePlugin.ts"/>
var DatatableTest;
(function (DatatableTest) {
    DatatableTest._module.controller('DatatableTest.SimpleTableTestController', ['$scope', '$location', function ($scope, $location) {
        $scope.myData = [
            { name: "James", twitter: "jstrachan" },
            { name: "Stan", twitter: "gashcrumb" },
            { name: "Claus", twitter: "davsclaus" }
        ];
        $scope.mygrid = {
            data: 'myData',
            showFilter: false,
            showColumnMenu: false,
            multiSelect: ($location.search()["multi"] || "").startsWith("f") ? false : true,
            filterOptions: {
                filterText: "",
                useExternalFilter: false
            },
            selectedItems: [],
            rowHeight: 32,
            selectWithCheckboxOnly: true,
            columnDefs: [
                {
                    field: 'name',
                    displayName: 'Name',
                    width: "***"
                },
                {
                    field: 'twitter',
                    displayName: 'Twitter',
                    cellTemplate: '<div class="ngCellText">@{{row.entity.twitter}}</div>',
                    //width: 400
                    width: "***"
                }
            ]
        };
    }]);
})(DatatableTest || (DatatableTest = {}));

/// <reference path="../../includes.ts"/>
var UITest;
(function (UITest) {
    UITest.templatePath = 'test-plugins/ui/html';
    var path = UITest.templatePath;
    UITest.pluginName = 'hawtio-ui-test-pages';
    UITest._module = angular.module(UITest.pluginName, []);
    var tab1 = null;
    var tab2 = null;
    var editorTab = null;
    UITest._module.config(['$routeProvider', 'HawtioNavBuilderProvider', function ($routeProvider, builder) {
        editorTab = builder.create().id(builder.join(UITest.pluginName, 'editor')).href(function () { return '/ui'; }).title(function () { return 'Editor'; }).subPath('Editor', 'editor', builder.join(path, 'editor.html')).build();
        tab2 = builder.create().id(builder.join(UITest.pluginName, 'tab2')).href(function () {
            return '/ui2';
        }).title(function () {
            return "UI Components 2";
        }).subPath('Tags', 'tags', builder.join(path, 'tags.html')).subPath('Expandable', 'expandable', builder.join(path, 'expandable.html')).subPath('Auto Columns', 'auto-columns', builder.join(path, 'auto-columns.html')).subPath('Template Popover', 'template-popover', builder.join(path, 'template-popover.html')).subPath('Auto Dropdown', 'auto-dropdown', builder.join(path, 'auto-dropdown.html')).build();
        tab1 = builder.create().id(builder.join(UITest.pluginName, 'tab1')).href(function () {
            return '/ui1';
        }).title(function () {
            return "UI Components 1";
        }).subPath('Icons', 'icons', builder.join(path, 'icon.html')).subPath('Breadcrumbs', 'breadcrumbs', builder.join(path, 'breadcrumbs.html')).subPath('Color Picker', 'color-picker', builder.join(path, 'color-picker.html')).subPath('Confirm Dialog', 'confirm-dialog', builder.join(path, 'confirm-dialog.html')).subPath('Drop Down', 'drop-down', builder.join(path, 'drop-down.html')).subPath('Editable Property', 'editable-property', builder.join(path, 'editable-property.html')).subPath('Expandable', 'expandable', builder.join(path, 'expandable.html')).subPath('JSPlumb', 'jsplumb', builder.join(path, 'jsplumb.html')).subPath('Pager', 'pager', builder.join(path, 'pager.html')).subPath('Slideout', 'slideout', builder.join(path, 'slideout.html')).subPath('Zero Clipboard', 'zero-clipboard', builder.join(path, 'zero-clipboard.html')).build();
        builder.configureRouting($routeProvider, tab1);
        builder.configureRouting($routeProvider, tab2);
        builder.configureRouting($routeProvider, editorTab);
    }]);
    UITest._module.run(['HawtioNav', function (nav) {
        nav.add(tab1);
        nav.add(tab2);
        nav.add(editorTab);
        nav.add({
            id: 'project-link',
            isSelected: function () {
                return false;
            },
            title: function () {
                return 'github';
            },
            attributes: {
                class: 'pull-right'
            },
            linkAttributes: {
                target: '_blank'
            },
            href: function () {
                return 'https://github.com/hawtio/hawtio-ui';
            }
        });
        nav.add({
            id: 'hawtio-link',
            isSelected: function () {
                return false;
            },
            title: function () {
                return 'hawtio';
            },
            attributes: {
                class: 'pull-right'
            },
            linkAttributes: {
                target: '_blank'
            },
            href: function () {
                return 'http://hawt.io';
            }
        });
    }]);
    hawtioPluginLoader.addModule(UITest.pluginName);
})(UITest || (UITest = {}));

///<reference path="uiTestPlugin.ts"/>
var UITest;
(function (UITest) {
    UITest._module.controller("UITest.TagsController", ["$scope", "$templateCache", function ($scope, $templateCache) {
        $scope.toJson = angular.toJson;
        $scope.tags = [];
        $scope.selected = [];
        var data = [
            {
                id: 'one',
                tags: ['tag1', 'tag2', 'tag3']
            },
            {
                id: 'two',
                tags: ['tag2', 'tag3']
            },
            {
                id: 'three',
                tags: ['tag1', 'tag2']
            },
            {
                id: 'four',
                tags: ['tag1', 'tag3']
            },
            {
                id: 'five',
                tags: ['tag4']
            }
        ];
        $scope.data = data;
        $scope.template = $templateCache.get('tag-ex-template.html');
    }]);
})(UITest || (UITest = {}));

/// <reference path="uiTestPlugin.ts"/>
/// <reference path="../../includes.ts"/>
var UITest;
(function (UITest) {
    UITest._module.controller("UI.UITestController2", ["$scope", "$templateCache", function ($scope, $templateCache) {
        $scope.fileUploadExMode = 'text/html';
        $scope.menuItems = [];
        $scope.divs = [];
        for (var i = 0; i < 20; i++) {
            $scope.menuItems.push("Some Item " + i);
        }
        for (var i = 0; i < 20; i++) {
            $scope.divs.push(i + 1);
        }
        $scope.things = [
            {
                'name': 'stuff1',
                'foo1': 'bar1',
                'foo2': 'bar2'
            },
            {
                'name': 'stuff2',
                'foo3': 'bar3',
                'foo4': 'bar4'
            }
        ];
        $scope.someVal = 1;
        $scope.dropDownConfig = {
            icon: 'fa fa-cogs',
            title: 'My Awesome Menu',
            items: [{
                title: 'Some Item',
                action: 'someVal=2'
            }, {
                title: 'Some other stuff',
                icon: 'fa fa-twitter',
                action: 'someVal=3'
            }, {
                title: "I've got children",
                icon: 'fa fa-file-text',
                items: [{
                    title: 'Hi!',
                    action: 'someVal=4'
                }, {
                    title: 'Yo!',
                    items: [{
                        title: 'More!',
                        action: 'someVal=5'
                    }, {
                        title: 'Child',
                        action: 'someVal=6'
                    }, {
                        title: 'Menus!',
                        action: 'someVal=7'
                    }]
                }]
            }, {
                title: "Call a function!",
                action: function () {
                    Core.notification("info", "Function called!");
                }
            }]
        };
        $scope.dropDownConfigTxt = angular.toJson($scope.dropDownConfig, true);
        $scope.$watch('dropDownConfigTxt', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                $scope.dropDownConfig = angular.fromJson($scope.dropDownConfigTxt);
            }
        });
        $scope.breadcrumbSelection = 1;
        $scope.breadcrumbConfig = {
            path: '/root/first child',
            icon: 'fa fa-cogs',
            title: 'root',
            items: [{
                title: 'first child',
                icon: 'fa fa-folder-close-alt',
                items: [{
                    title: "first child's first child",
                    icon: 'fa fa-file-text'
                }]
            }, {
                title: 'second child',
                icon: 'fa fa-file'
            }, {
                title: "third child",
                icon: 'fa fa-folder-close-alt',
                items: [{
                    title: "third child's first child",
                    icon: 'fa fa-file-text'
                }, {
                    title: "third child's second child",
                    icon: 'fa fa-file-text'
                }, {
                    title: "third child's third child",
                    icon: 'fa fa-folder-close-alt',
                    items: [{
                        title: 'More!',
                        icon: 'fa fa-file-text'
                    }, {
                        title: 'Child',
                        icon: 'fa fa-file-text'
                    }, {
                        title: 'Menus!',
                        icon: 'fa fa-file-text'
                    }]
                }]
            }]
        };
        $scope.breadcrumbConfigTxt = angular.toJson($scope.breadcrumbConfig, true);
        $scope.$watch('breadcrumbConfigTxt', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                $scope.breadcrumbconfig = angular.toJson($scope.breadcrumbConfigTxt);
            }
        });
        $scope.breadcrumbEx = $templateCache.get("breadcrumbTemplate");
        $scope.dropDownEx = $templateCache.get("dropDownTemplate");
        $scope.autoDropDown = $templateCache.get("autoDropDownTemplate");
        $scope.zeroClipboard = $templateCache.get("zeroClipboardTemplate");
        $scope.popoverEx = $templateCache.get("myTemplate");
        $scope.popoverUsageEx = $templateCache.get("popoverExTemplate");
        $scope.autoColumnEx = $templateCache.get("autoColumnTemplate");
    }]);
    UITest._module.controller("UI.UITestController1", ["$scope", "$templateCache", function ($scope, $templateCache) {
        $scope.jsplumbEx = $templateCache.get("jsplumbTemplate");
        $scope.nodes = ["node1", "node2"];
        $scope.otherNodes = ["node4", "node5", "node6"];
        $scope.anchors = ["Top", "Right", "Bottom", "Left"];
        $scope.createEndpoint = function (nodeId) {
            var node = $scope.jsPlumbNodesById[nodeId];
            if (node) {
                var anchors = $scope.anchors.subtract(node.anchors);
                console.log("anchors: ", anchors);
                if (anchors && anchors.length > 0) {
                    var anchor = anchors.first();
                    node.anchors.push(anchor);
                    node.endpoints.push($scope.jsPlumb.addEndpoint(node.el, {
                        anchor: anchor,
                        isSource: true,
                        isTarget: true,
                        maxConnections: -1
                    }));
                }
            }
        };
        $scope.expandableEx = '' + '<div class="expandable closed">\n' + '   <div title="The title" class="title">\n' + '     <i class="expandable-indicator"></i> Expandable title\n' + '   </div>\n' + '   <div class="expandable-body well">\n' + '     This is the expandable content...  Note that adding the "well" class isn\'t necessary but makes for a nice inset look\n' + '   </div>\n' + '</div>';
        $scope.editablePropertyEx1 = '<editable-property ng-model="editablePropertyModelEx1" property="property"></editable-property>';
        $scope.editablePropertyModelEx1 = {
            property: "This is editable (hover to edit)"
        };
        $scope.showDeleteOne = new UI.Dialog();
        $scope.showDeleteTwo = new UI.Dialog();
        $scope.fileUploadEx1 = '<div hawtio-file-upload="files" target="test1"></div>';
        $scope.fileUploadEx2 = '<div hawtio-file-upload="files" target="test2" show-files="false"></div>';
        $scope.fileUploadExMode = 'text/html';
        $scope.colorPickerEx = 'My Color ({{myColor}}): <div hawtio-color-picker="myColor"></div>';
        $scope.confirmationEx1 = '' + '<button class="btn" ng-click="showDeleteOne.open()">Delete stuff</button>\n' + '\n' + '<div hawtio-confirm-dialog="showDeleteOne.show"\n' + 'title="Delete stuff?"\n' + 'ok-button-text="Yes, Delete the Stuff"\n' + 'cancel-button-text="No, Keep the Stuff"\n' + 'on-cancel="onCancelled(\'One\')"\n' + 'on-ok="onOk(\'One\')">\n' + '  <div class="dialog-body">\n' + '    <p>\n' + '        Are you sure you want to delete all the stuff?\n' + '    </p>\n' + '  </div>\n' + '</div>\n';
        $scope.confirmationEx2 = '' + '<button class="btn" ng-click="showDeleteTwo.open()">Delete other stuff</button>\n' + '\n' + '<!-- Use more defaults -->\n' + '<div hawtio-confirm-dialog="showDeleteTwo.show\n"' + '  on-cancel="onCancelled(\'Two\')"\n' + '  on-ok="onOk(\'Two\')">\n' + '  <div class="dialog-body">\n' + '    <p>\n' + '      Are you sure you want to delete all the other stuff?\n' + '    </p>\n' + '  </div>\n' + '</div>';
        $scope.sliderEx1 = '' + '<button class="btn" ng-click="showSlideoutRight = !showSlideoutRight">Show slideout right</button>\n' + '<div hawtio-slideout="showSlideoutRight" title="Hey look a slider!">\n' + '   <div class="dialog-body">\n' + '     <div>\n' + '       Here is some content or whatever {{transcludedValue}}\n' + '     </div>\n' + '   </div>\n' + '</div>';
        $scope.sliderEx2 = '' + '<button class="btn" ng-click="showSlideoutLeft = !showSlideoutLeft">Show slideout left</button>\n' + '<div hawtio-slideout="showSlideoutLeft" direction="left" title="Hey, another slider!">\n' + '   <div class="dialog-body">\n' + '     <div hawtio-editor="someText" mode="javascript"></div>\n' + '   </div>\n' + '</div>\n';
        $scope.editorEx1 = '' + 'Instance 1\n' + '<div class="row-fluid">\n' + '   <div hawtio-editor="someText" mode="mode" dirty="dirty"></div>\n' + '   <div>Text : {{someText}}</div>\n' + '</div>\n' + '\n' + 'Instance 2 (readonly)\n' + '<div class="row-fluid">\n' + '   <div hawtio-editor="someText" read-only="true" mode="mode" dirty="dirty"></div>\n' + '   <div>Text : {{someText}}</div>\n' + '</div>';
        $scope.transcludedValue = "and this is transcluded";
        $scope.onCancelled = function (number) {
            Core.notification('info', 'cancelled ' + number);
        };
        $scope.onOk = function (number) {
            Core.notification('info', number + ' ok!');
        };
        $scope.showSlideoutRight = false;
        $scope.showSlideoutLeft = false;
        $scope.dirty = false;
        $scope.mode = 'javascript';
        $scope.someText = "var someValue = 0;\n" + "var someFunc = function() {\n" + "  return \"Hello World!\";\n" + "}\n";
        $scope.myColor = "#FF887C";
        $scope.showColorDialog = false;
        $scope.files = [];
        $scope.$watch('files', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                console.log("Files: ", $scope.files);
            }
        }, true);
    }]);
})(UITest || (UITest = {}));

angular.module("hawtio-ui-test-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("test-plugins/datatable/html/test.html","<div ng-controller=\"DatatableTest.SimpleTableTestController\">\n  <div class=\"row\">\n    <div class=\"section-header\">\n\n      <div class=\"section-filter\">\n        <input type=\"text\" class=\"search-query\" placeholder=\"Filter...\" ng-model=\"mygrid.filterOptions.filterText\">\n        <i class=\"fa fa-remove clickable\" title=\"Clear filter\" ng-click=\"mygrid.filterOptions.filterText = \'\'\"></i>\n      </div>\n\n    </div>\n  </div>\n\n  <h3>hawtio-simple-table example</h3>\n\n  <table class=\"table table-striped\" hawtio-simple-table=\"mygrid\"></table>\n\n  <div class=\"row\">\n    <p>Selected folks:</p>\n    <ul>\n      <li ng-repeat=\"person in mygrid.selectedItems\">{{person.name}}</li>\n    </ul>\n\n    <p>\n       <a class=\"btn\" href=\"\" ng-click=\"mygrid.multiSelect = !mygrid.multiSelect\">multi select is: {{mygrid.multiSelect}}</a>\n    </p>\n  </div>\n</div>\n");
$templateCache.put("test-plugins/ui/html/auto-columns.html","<div ng-controller=\"UI.UITestController2\">\n\n  <div>\n    <div class=\"row\">\n      <h3>Auto Columns</h3>\n      <p>Lays out a bunch of inline-block child elements into columns automatically based on the size of the parent container.  Specify the selector for the child items as an argument</p>\n\n      <script type=\"text/ng-template\" id=\"autoColumnTemplate\">\n<div id=\"container\"\n     style=\"height: 225px;\n            width: 785px;\n            background: lightgrey;\n            border-radius: 4px;\"\n     hawtio-auto-columns=\".ex-children\"\n     min-margin=\"5\">\n  <div class=\"ex-children\"\n       style=\"display: inline-block;\n              width: 64px; height: 64px;\n              border-radius: 4px;\n              background: lightgreen;\n              text-align: center;\n              vertical-align: middle;\n              margin: 5px;\"\n       ng-repeat=\"div in divs\">{{div}}</div>\n</div>\n      </script>\n      <div hawtio-editor=\"autoColumnEx\" mode=\"fileUploadExMode\"></div>\n      <div class=\"directive-example\">\n        <div compile=\"autoColumnEx\"></div>\n      </div>\n    </div>\n  </div>\n</div>\n");
$templateCache.put("test-plugins/ui/html/auto-dropdown.html","<div ng-controller=\"UI.UITestController2\">\n\n  <div>\n    <div class=\"row\">\n      <h3>Auto Drop Down</h3>\n      <p>Handy for horizontal lists of things like menus, if the width of the element is smaller than the items inside any overflowing elements will be collected into a special dropdown element that\'s required at the end of the list</p>\n      <script type=\"text/ng-template\" id=\"autoDropDownTemplate\">\n        <ul class=\"nav nav-tabs\" hawtio-auto-dropdown>\n          <!-- All of our menu items -->\n          <li ng-repeat=\"item in menuItems\">\n            <a href=\"\">{{item}}</a>\n          </li>\n          <!-- The dropdown that will collect overflow elements -->\n          <li class=\"dropdown overflow\" style=\"float: right !important; visibility: hidden;\">\n            <a href=\"\" class=\"dropdown-toggle\" data-toggle=\"dropdown\">\n              <i class=\"fa fa-chevron-down\"></i>\n            </a>\n            <ul class=\"dropdown-menu right\"></ul>\n          </li>\n        </ul>\n      </script>\n      <div hawtio-editor=\"autoDropDown\" mode=\"fileUploadExMode\"></div>\n      <div class=\"directive-example\">\n        <div compile=\"autoDropDown\"></div>\n      </div>\n    </div>\n  </div>\n</div>\n");
$templateCache.put("test-plugins/ui/html/breadcrumbs.html","<div ng-controller=\"UI.UITestController2\">\n\n  <div>\n\n    <div class=\"row\">\n      <h3>BreadCrumbs</h3>\n      <p>A breadcrumb implementation that supports dropdowns for each node.  The data structure is a tree structure with a single starting node.  When the user makes a selection the directive will update the \'path\' property of the config object.  The directive also watches the \'path\' property, allowing you to also set the initial state of the breadcrumbs.</p>\n      <script type=\"text/ng-template\" id=\"breadcrumbTemplate\">\n<p>path: {{breadcrumbConfig.path}}</p>\n<ul class=\"nav nav-tabs\">\n<hawtio-breadcrumbs config=\"breadcrumbConfig\"></hawtio-breadcrumbs>\n</ul>\n      </script>\n      <h5>HTML</h5>\n      <div hawtio-editor=\"breadcrumbEx\" mode=\"fileUploadExMode\"></div>\n      <h5>JSON</h5>\n      <div hawtio-editor=\"breadcrumbConfigTxt\" mode=\"javascript\"></div>\n      <div class=\"directive-example\">\n        <div compile=\"breadcrumbEx\"></div>\n      </div>\n    </div>\n\n  </div>\n</div>\n");
$templateCache.put("test-plugins/ui/html/color-picker.html","<div ng-controller=\"UI.UITestController1\">\n\n  <div class=\"row\">\n    <h3>Color picker</h3>\n\n    <p>Currently used on the preferences page to associate a color with a given URL regex</p>\n\n    <div hawtio-editor=\"colorPickerEx\" mode=\"fileUploadExMode\"></div>\n    <div class=\"directive-example\">\n      <div compile=\"colorPickerEx\"></div>\n    </div>\n    <hr>\n  </div>\n\n\n</div>\n");
$templateCache.put("test-plugins/ui/html/confirm-dialog.html","<div ng-controller=\"UI.UITestController1\">\n\n  <div class=\"row\">\n    <h3>Confirmation Dialog</h3>\n\n    <p>Displays a simple confirmation dialog with a standard title and buttons, just the dialog body needs to be\n      provided. The buttons can be customized as well as the actions when the ok or cancel button is clicked</p>\n\n    <div hawtio-editor=\"confirmationEx1\" mode=\"fileUploadExMode\"></div>\n    <div class=\"directive-example\">\n      <div compile=\"confirmationEx1\"></div>\n    </div>\n\n    <div hawtio-editor=\"confirmationEx2\" mode=\"fileUploadExMode\"></div>\n    <div class=\"directive-example\">\n      <div compile=\"confirmationEx2\"></div>\n    </div>\n    <hr>\n  </div>\n\n</div>\n");
$templateCache.put("test-plugins/ui/html/drop-down.html","<div ng-controller=\"UI.UITestController2\">\n\n  <div>\n\n    <div class=\"row\">\n      <h3>Drop Down</h3>\n      <p>A bootstrap.js drop-down widget driven by a simple json structure</p>\n      <script type=\"text/ng-template\" id=\"dropDownTemplate\">\n<p>someVal: {{someVal}}</p>\n  <div hawtio-drop-down=\"dropDownConfig\"></div>\n      </script>\n      <h5>HTML</h5>\n      <div hawtio-editor=\"dropDownEx\" mode=\"fileUploadExMode\"></div>\n      <h5>JSON</h5>\n      <div hawtio-editor=\"dropDownConfigTxt\" mode=\"javascript\"></div>\n      <div class=\"directive-example\">\n        <div compile=\"dropDownEx\"></div>\n      </div>\n    </div>\n  </div>\n</div>\n");
$templateCache.put("test-plugins/ui/html/editable-property.html","<div ng-controller=\"UI.UITestController1\">\n\n  <div class=\"row\">\n    <h3>Editable Property</h3>\n\n    <p>Use to display a value that the user can edit at will</p>\n\n    <div hawtio-editor=\"editablePropertyEx1\" mode=\"fileUploadExMode\"></div>\n    <div class=\"directive-example\">\n      <div compile=\"editablePropertyEx1\"></div>\n    </div>\n    <hr>\n  </div>\n\n</div>\n");
$templateCache.put("test-plugins/ui/html/editor.html","<div ng-controller=\"UI.UITestController1\">\n\n  <div>\n    <div class=\"row\">\n        <h3>CodeMirror</h3>\n\n        <p>A directive that wraps the codeMirror editor.</p>\n\n        <div hawtio-editor=\"editorEx1\" mode=\"fileUploadExMode\"></div>\n        <div class=\"directive-example\">\n          <div compile=\"editorEx1\"></div>\n        </div>\n      </div>\n  </div>\n\n\n</div>\n");
$templateCache.put("test-plugins/ui/html/expandable.html","<div ng-controller=\"UI.UITestController1\">\n\n  <div class=\"row\">\n    <h3>Expandable</h3>\n\n    <p>Use to hide content under a header that a user can display when necessary</p>\n\n    <div hawtio-editor=\"expandableEx\" mode=\"fileUploadExMode\"></div>\n    <div class=\"directive-example\">\n      <div compile=\"expandableEx\"></div>\n    </div>\n    <hr>\n  </div>\n\n</div>\n");
$templateCache.put("test-plugins/ui/html/file-upload.html","<div ng-controller=\"UI.UITestController1\">\n\n  <div class=\"row\">\n    <h3>File upload</h3>\n\n    <p>Use to upload files to the hawtio webapp backend. Files are stored in a temporary directory and managed via the\n      UploadManager JMX MBean</p>\n\n    <p>Showing files:</p>\n\n    <div hawtio-editor=\"fileUploadEx1\" mode=\"fileUploadExMode\"></div>\n    <div class=\"directive-example\">\n      <div compile=\"fileUploadEx1\"></div>\n    </div>\n    <hr>\n    <p>Not showing files:</p>\n\n    <div hawtio-editor=\"fileUploadEx2\" mode=\"fileUploadExMode\"></div>\n    <div class=\"directive-example\">\n      <div compile=\"fileUploadEx2\"></div>\n    </div>\n  </div>\n  <hr>\n</div>\n\n</div>\n");
$templateCache.put("test-plugins/ui/html/icon.html","<div ng-controller=\"UI.IconTestController\">\n\n  <script type=\"text/ng-template\" id=\"example-html\">\n\n<style>\n\n/* Define icon sizes in CSS\n   use the \'class\' attribute\n   to handle icons that are\n   wider than they are tall */\n.fa fa-example i:before,\n.fa fa-example img {\n  vertical-align: middle;\n  line-height: 32px;\n  font-size: 32px;\n  height: 32px;\n  width: auto;\n}\n\n.fa fa-example img.girthy {\n  height: auto;\n  width: 32px;\n}\n</style>\n\n<!-- Here we turn an array of\n     simple objects into icons! -->\n<ul class=\"fa fa-example list-inline\">\n  <li ng-repeat=\"icon in icons\">\n    <hawtio-icon config=\"icon\"></hawtio-icon>\n  </li>\n</ul>\n  </script>\n\n  <script type=\"text/ng-template\" id=\"example-config-json\">\n[{\n  \"title\": \"Awesome!\",\n  \"src\": \"fa fa-thumbs-up\"\n},\n{\n  \"title\": \"Apache Karaf\",\n  \"type\": \"icon\",\n  \"src\": \"fa fa-beaker\"\n},\n{\n  \"title\": \"Fabric8\",\n  \"type\": \"img\",\n  \"src\": \"img/icons/fabric8_icon.svg\"\n},\n{\n  \"title\": \"Apache Cassandra\",\n  \"src\": \"img/icons/cassandra.svg\",\n  \"class\": \"girthy\"\n}]\n  </script>\n\n\n  <div class=\"row\">\n    <h3>Icons</h3>\n    <p>A simple wrapper to handle arbitrarily using FontAwesome icons or images via a simple configuration</p>\n    <h5>HTML</h5>\n    <p>The icon sizes are specified in CSS, we can also pass a \'class\' field to the icon as well to handle icons that are wider than they are tall for certain layouts</p>\n    <div hawtio-editor=\"exampleHtml\" mode=\"html\"></div>\n    <h5>JSON</h5>\n    <p>Here we define the configuration for our icons, in this case we\'re just creating a simple array of icon definitions to show in a list</p>\n    <div hawtio-editor=\"exampleConfigJson\" mode=\"javascript\"></div>\n    <div class=\"directive-example\">\n      <div compile=\"exampleHtml\"></div>\n    </div>\n  </div>\n\n\n</div>\n");
$templateCache.put("test-plugins/ui/html/jsplumb.html","<div ng-controller=\"UI.UITestController1\">\n\n  <div>\n\n    <div class=\"row\">\n      <h3>JSPlumb</h3>\n      <p>Use to create an instance of JSPlumb</p>\n      <script type=\"text/ng-template\" id=\"jsplumbTemplate\">\n<div>\n  <div class=\"ex-node-container\" hawtio-jsplumb>\n    <!-- Nodes just need to have an ID and the jsplumb-node class -->\n    <div ng-repeat=\"node in nodes\"\n         id=\"{{node}}\"\n         anchors=\"AutoDefault\"\n         class=\"jsplumb-node ex-node\">\n      <i class=\"fa fa-plus clickable\" ng-click=\"createEndpoint(node)\"></i> Node: {{node}}\n    </div>\n    <!-- You can specify a connect-to attribute and a comma separated list of IDs to connect nodes -->\n    <div id=\"node3\"\n         class=\"jsplumb-node ex-node\"\n         anchors=\"Left,Right\"\n         connect-to=\"node1,node2\">\n      <i class=\"fa fa-plus clickable\" ng-click=\"createEndpoint(\'node3\')\"></i> Node 3\n    </div>\n    <!-- Expressions and stuff will work too -->\n    <div ng-repeat=\"node in otherNodes\"\n         id=\"{{node}}\"\n         class=\"jsplumb-node ex-node\"\n         anchors=\"Continuous\"\n         connect-to=\"{{otherNodes[$index - 1]}}\"><i class=\"fa fa-plus clickable\" ng-click=\"createEndpoint(node)\"></i> Node: {{node}}</div>\n  </div>\n\n</div>\n      </script>\n      <div hawtio-editor=\"jsplumbEx\" mode=\"fileUploadExMode\"></div>\n\n      <div class=\"directive-example\">\n        <div compile=\"jsplumbEx\"></div>\n      </div>\n    </div>\n</div>\n");
$templateCache.put("test-plugins/ui/html/pager.html","<div ng-controller=\"UI.UITestController1\">\n\n  <div>\n    <div class=\"row\">\n      <h3>Pager</h3>\n      <hr>\n    </div>\n  </div>\n\n</div>\n");
$templateCache.put("test-plugins/ui/html/slideout.html","<div ng-controller=\"UI.UITestController1\">\n\n  <div class=\"row\">\n    <h3>Slideout</h3>\n    <p>Displays a panel that slides out from either the left or right and immediately disappears when closed</p>\n\n    <div hawtio-editor=\"sliderEx1\" mode=\"fileUploadExMode\"></div>\n    <div class=\"directive-example\">\n      <div compile=\"sliderEx1\"></div>\n    </div>\n\n    <div hawtio-editor=\"sliderEx2\" mode=\"fileUploadExMode\"></div>\n    <div class=\"directive-example\">\n      <div compile=\"sliderEx2\"></div>\n    </div>\n    <hr>\n  </div>\n\n</div>\n");
$templateCache.put("test-plugins/ui/html/tags.html","<div class=\"row\">\n  <div class=\"col-md-12\">\n    <h2>Tags</h2>\n  </div>\n</div>\n<div class=\"row\" ng-controller=\"UITest.TagsController\">\n  <div class=\"col-md-4\">\n    <p>Directives that can be helpful for providing the user a way to narrow down the number of items in a list.  Tags are handled via 2 directives and a filter.  The hawtioTagList directive will will display a list of tags for an item, and provide click handlers to update a list of selected tabs.  The hawtioTagFilter directive builds an available list of tags, and manages the list of selected tags, providing the user a way of managing which tags are selectedTags.  Finally the selectedTags filter is used to hide list elements.</p>\n    <h5>Example Markup</h5>\n    <script type=\"text/ng-template\" id=\"tag-ex-template.html\">\n      <div class=\"row\">\n        <div class=\"col-md-6\">\n          <ul>\n            <li ng-repeat=\"item in data | selectedTags:\'tags\':selected\">\n              {{item.id}}\n              <hawtio-tag-list tags=\"item.tags\" selected=\"selected\"></hawtio-tag-list>\n            </li>\n          </ul>\n        </div>\n        <div class=\"col-md-6\">\n          <hawtio-tag-filter tags=\"tags\"\n                             selected=\"selected\"\n                             collection=\"data\"\n                             collection-property=\"tags\"></hawtio-tag-filter>\n         </div>\n      </div>\n    </script>\n    <div hawtio-editor=\"template\" mode=\"html\"></div>\n  </div>\n  <div class=\"col-md-4\">\n    <div class=\"row\">\n      <h5>Example Data</h5>\n      <div hawtio-editor=\"toJson(data, true)\" read-only=\"true\" mode=\"javascript\"></div>\n    </div>\n  </div>\n  <div class=\"col-md-4\">\n    <p>Click on any of the tags below to limit the visible items in the list</p>\n    <div class=\"directive-example\">\n      <div compile=\"template\"></div>\n    </div>\n  </div>\n</div>\n");
$templateCache.put("test-plugins/ui/html/template-popover.html","<div ng-controller=\"UI.UITestController2\">\n\n  <div>\n    <div class=\"row\">\n      <h3>Template Popover</h3>\n      <p>Uses bootstrap popover but lets you supply an angular template to render as the popover body.  For example here\'s a simple template for the popover body:</p>\n      <script type=\"text/ng-template\" id=\"myTemplate\">\n<table>\n  <tbody>\n    <tr ng-repeat=\"(k, v) in stuff track by $index\">\n      <td>{{k}}</td>\n      <td>{{v}}</td>\n    </tr>\n  </tbody>\n</table>\n      </script>\n      <div hawtio-editor=\"popoverEx\" mode=\"fileUploadExMode\"></div>\n\n      <p>\n      You can then supply this template as an argument to hawtioTemplatePopover.  By default it will look for a template in $templateCache called \"popoverTemplate\", or specify a templte for the \"content\" argument.  You can specify \"placement\" if you want the popover to appear on a certain side, or \"auto\" and the directive will calculate an appropriate side (\"right\" or \"left\") depending on where the element is in the window.\n      </p>\n\n      <script type=\"text/ng-template\" id=\"popoverExTemplate\">\n<ul>\n  <li ng-repeat=\"stuff in things\" hawtio-template-popover content=\"myTemplate\">{{stuff.name}}</li>\n</ul>\n      </script>\n      <div hawtio-editor=\"popoverUsageEx\" mode=\"fileUploadExMode\"></div>\n      <div class=\"directive-example\">\n        <div compile=\"popoverUsageEx\"></div>\n      </div>\n    </div>\n\n  </div>\n</div>\n");
$templateCache.put("test-plugins/ui/html/zero-clipboard.html","<div ng-controller=\"UI.UITestController2\">\n\n  <div>\n    <div class=\"row\">\n      <h3>Zero Clipboard</h3>\n      <p>Directive that attaches a zero clipboard instance to an element so a user can click on a button to copy some text to the clipboard</p>\n      <p>Best way to use this is next to a readonly input that displays the same data to be copied, that way folks that have Flash disabled can still copy the text.</p>\n      <script type=\"text/ng-template\" id=\"zeroClipboardTemplate\">\n        <input type=\"text\" class=\"no-bottom-margin\" readonly value=\"Some Text!\">\n        <button class=\"btn\" zero-clipboard data-clipboard-text=\"Some Text!\" title=\"Click to copy!\">\n          <i class=\"fa fa-copy\"></i>\n        </button>\n      </script>\n      <div hawtio-editor=\"zeroClipboard\" mode=\"fileUploadExMode\"></div>\n      <div class=\"directive-example\">\n        <div compile=\"zeroClipboard\"></div>\n      </div>\n    </div>\n\n\n  </div>\n</div>\n");}]); hawtioPluginLoader.addModule("hawtio-ui-test-templates");