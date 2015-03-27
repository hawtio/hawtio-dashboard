/// <reference path="../libs/hawtio-utilities/defs.d.ts"/>

/// <reference path="../../includes.ts"/>
/**
 * @module DataTable
 * @main DataTable
 */
var DataTable;
(function (DataTable) {
    DataTable.pluginName = 'datatable';
    DataTable.log = Logger.get("DataTable");
    DataTable._module = angular.module(DataTable.pluginName, []);
    DataTable._module.config(["$routeProvider", function ($routeProvider) {
        $routeProvider.when('/datatable/test', { templateUrl: 'plugins/datatable/html/test.html' });
    }]);
    hawtioPluginLoader.addModule(DataTable.pluginName);
})(DataTable || (DataTable = {}));

/// <reference path="datatablePlugin.ts"/>
/**
 * @module DataTable
 */
var DataTable;
(function (DataTable) {
    var SimpleDataTable = (function () {
        function SimpleDataTable($compile) {
            var _this = this;
            this.$compile = $compile;
            this.restrict = 'A';
            this.scope = {
                config: '=hawtioSimpleTable',
                target: '@',
                showFiles: '@'
            };
            // necessary to ensure 'this' is this object <sigh>
            this.link = function ($scope, $element, $attrs) {
                return _this.doLink($scope, $element, $attrs);
            };
        }
        SimpleDataTable.prototype.doLink = function ($scope, $element, $attrs) {
            var defaultPrimaryKeyFn = function (entity, idx) {
                // default function to use id/_id/name as primary key, and fallback to use index
                return entity["id"] || entity["_id"] || entity["name"] || idx;
            };
            var config = $scope.config;
            var dataName = config.data || "data";
            // need to remember which rows has been selected as the config.data / config.selectedItems
            // so we can re-select them when data is changed/updated, and entity may be new instances
            // so we need a primary key function to generate a 'primary key' of the entity
            var primaryKeyFn = config.primaryKeyFn || defaultPrimaryKeyFn;
            $scope.rows = [];
            var scope = $scope.$parent || $scope;
            var listener = function (otherValue) {
                var value = Core.pathGet(scope, dataName);
                if (value && !angular.isArray(value)) {
                    value = [value];
                    Core.pathSet(scope, dataName, value);
                }
                if (!('sortInfo' in config) && 'columnDefs' in config) {
                    // an optional defaultSort can be used to indicate a column
                    // should not automatic be the default sort
                    var ds = config.columnDefs.first()['defaultSort'];
                    var sortField;
                    if (angular.isUndefined(ds) || ds === true) {
                        sortField = config.columnDefs.first()['field'];
                    }
                    else {
                        sortField = config.columnDefs.slice(1).first()['field'];
                    }
                    config['sortInfo'] = {
                        sortBy: sortField,
                        ascending: true
                    };
                }
                else {
                    config['sortInfo'] = {
                        sortBy: '',
                        ascending: true
                    };
                }
                var sortInfo = $scope.config.sortInfo;
                // enrich the rows with information about their index
                var idx = -1;
                $scope.rows = (value || []).sortBy(sortInfo.sortBy, !sortInfo.ascending).map(function (entity) {
                    idx++;
                    return {
                        entity: entity,
                        index: idx,
                        getProperty: function (name) {
                            return entity[name];
                        }
                    };
                });
                Core.pathSet(scope, ['hawtioSimpleTable', dataName, 'rows'], $scope.rows);
                // okay the data was changed/updated so we need to re-select previously selected items
                // and for that we need to evaluate the primary key function so we can match new data with old data.
                var reSelectedItems = [];
                $scope.rows.forEach(function (row, idx) {
                    var rpk = primaryKeyFn(row.entity, row.index);
                    var selected = config.selectedItems.some(function (s) {
                        var spk = primaryKeyFn(s, s.index);
                        return angular.equals(rpk, spk);
                    });
                    if (selected) {
                        // need to enrich entity with index, as we push row.entity to the re-selected items
                        row.entity.index = row.index;
                        reSelectedItems.push(row.entity);
                        DataTable.log.debug("Data changed so keep selecting row at index " + row.index);
                    }
                });
                config.selectedItems = reSelectedItems;
            };
            scope.$watchCollection(dataName, listener);
            // lets add a separate event so we can force updates
            // if we find cases where the delta logic doesn't work
            // (such as for nested hawtioinput-input-table)
            scope.$on("hawtio.datatable." + dataName, listener);
            function getSelectionArray() {
                var selectionArray = config.selectedItems;
                if (!selectionArray) {
                    selectionArray = [];
                    config.selectedItems = selectionArray;
                }
                if (angular.isString(selectionArray)) {
                    var name = selectionArray;
                    selectionArray = Core.pathGet(scope, name);
                    if (!selectionArray) {
                        selectionArray = [];
                        scope[name] = selectionArray;
                    }
                }
                return selectionArray;
            }
            function isMultiSelect() {
                var multiSelect = $scope.config.multiSelect;
                if (angular.isUndefined(multiSelect)) {
                    multiSelect = true;
                }
                return multiSelect;
            }
            $scope.toggleAllSelections = function () {
                var allRowsSelected = $scope.config.allRowsSelected;
                var newFlag = allRowsSelected;
                var selectionArray = getSelectionArray();
                selectionArray.splice(0, selectionArray.length);
                angular.forEach($scope.rows, function (row) {
                    row.selected = newFlag;
                    if (allRowsSelected) {
                        selectionArray.push(row.entity);
                    }
                });
            };
            $scope.toggleRowSelection = function (row) {
                if (row) {
                    var selectionArray = getSelectionArray();
                    if (!isMultiSelect()) {
                        // lets clear all other selections
                        selectionArray.splice(0, selectionArray.length);
                        angular.forEach($scope.rows, function (r) {
                            if (r !== row) {
                                r.selected = false;
                            }
                        });
                    }
                    var entity = row.entity;
                    if (entity) {
                        var idx = selectionArray.indexOf(entity);
                        if (row.selected) {
                            if (idx < 0) {
                                selectionArray.push(entity);
                            }
                        }
                        else {
                            // clear the all selected checkbox
                            $scope.config.allRowsSelected = false;
                            if (idx >= 0) {
                                selectionArray.splice(idx, 1);
                            }
                        }
                    }
                }
            };
            $scope.sortBy = function (field) {
                if ($scope.config.sortInfo.sortBy === field) {
                    $scope.config.sortInfo.ascending = !$scope.config.sortInfo.ascending;
                }
                else {
                    $scope.config.sortInfo.sortBy = field;
                    $scope.config.sortInfo.ascending = true;
                }
                $scope.$emit("hawtio.datatable." + dataName);
            };
            $scope.getClass = function (field) {
                if ('sortInfo' in $scope.config) {
                    if ($scope.config.sortInfo.sortBy === field) {
                        if ($scope.config.sortInfo.ascending) {
                            return 'asc';
                        }
                        else {
                            return 'desc';
                        }
                    }
                }
                return '';
            };
            $scope.showRow = function (row) {
                var filter = Core.pathGet($scope, ['config', 'filterOptions', 'filterText']);
                if (Core.isBlank(filter)) {
                    return true;
                }
                var data = null;
                try {
                    data = row['entity']['title'];
                }
                catch (e) {
                }
                if (!data) {
                    // use the row as-is
                    data = row.entity;
                }
                var match = FilterHelpers.search(data, filter);
                return match;
            };
            $scope.isSelected = function (row) {
                return config.selectedItems.some(row.entity);
            };
            $scope.onRowSelected = function (row) {
                var idx = config.selectedItems.indexOf(row.entity);
                if (idx >= 0) {
                    DataTable.log.debug("De-selecting row at index " + row.index);
                    config.selectedItems.splice(idx, 1);
                }
                else {
                    if (!config.multiSelect) {
                        config.selectedItems.length = 0;
                    }
                    DataTable.log.debug("Selecting row at index " + row.index);
                    // need to enrich entity with index, as we push row.entity to the selected items
                    row.entity.index = row.index;
                    config.selectedItems.push(row.entity);
                }
            };
            // lets add the header and row cells
            var rootElement = $element;
            rootElement.empty();
            var showCheckBox = firstValueDefined(config, ["showSelectionCheckbox", "displaySelectionCheckbox"], true);
            var enableRowClickSelection = firstValueDefined(config, ["enableRowClickSelection"], false);
            var onMouseDown;
            if (enableRowClickSelection) {
                onMouseDown = "ng-mousedown='onRowSelected(row)' ";
            }
            else {
                onMouseDown = "";
            }
            var headHtml = "<thead><tr>";
            // use a function to check if a row is selected so the UI can be kept up to date asap
            var bodyHtml = "<tbody><tr ng-repeat='row in rows track by $index' ng-show='showRow(row)' " + onMouseDown + "ng-class=\"{'selected': isSelected(row)}\" >";
            var idx = 0;
            if (showCheckBox) {
                var toggleAllHtml = isMultiSelect() ? "<input type='checkbox' ng-show='rows.length' ng-model='config.allRowsSelected' ng-change='toggleAllSelections()'>" : "";
                headHtml += "\n<th class='simple-table-checkbox'>" + toggleAllHtml + "</th>";
                bodyHtml += "\n<td class='simple-table-checkbox'><input type='checkbox' ng-model='row.selected' ng-change='toggleRowSelection(row)'></td>";
            }
            angular.forEach(config.columnDefs, function (colDef) {
                var field = colDef.field;
                var cellTemplate = colDef.cellTemplate || '<div class="ngCellText" title="{{row.entity.' + field + '}}">{{row.entity.' + field + '}}</div>';
                headHtml += "\n<th class='clickable no-fade table-header' ng-click=\"sortBy('" + field + "')\" ng-class=\"getClass('" + field + "')\">{{config.columnDefs[" + idx + "].displayName}}<span class='indicator'></span></th>";
                bodyHtml += "\n<td>" + cellTemplate + "</td>";
                idx += 1;
            });
            var html = headHtml + "\n</tr></thead>\n" + bodyHtml + "\n</tr></tbody>";
            var newContent = this.$compile(html)($scope);
            rootElement.html(newContent);
        };
        return SimpleDataTable;
    })();
    DataTable.SimpleDataTable = SimpleDataTable;
    /**
     * Returns the first property value defined in the given object or the default value if none are defined
     *
     * @param object the object to look for properties
     * @param names the array of property names to look for
     * @param defaultValue the value if no property values are defined
     * @return {*} the first defined property value or the defaultValue if none are defined
     */
    function firstValueDefined(object, names, defaultValue) {
        var answer = defaultValue;
        var found = false;
        angular.forEach(names, function (name) {
            var value = object[name];
            if (!found && angular.isDefined(value)) {
                answer = value;
                found = true;
            }
        });
        return answer;
    }
    DataTable._module.directive('hawtioSimpleTable', ["$compile", function ($compile) { return new DataTable.SimpleDataTable($compile); }]);
})(DataTable || (DataTable = {}));

/// <reference path="datatablePlugin.ts"/>
var DataTable;
(function (DataTable) {
    DataTable._module.controller('DataTable.SimpleTableTestController', ['$scope', '$location', function ($scope, $location) {
        $scope.myData = [
            { name: "James", twitter: "jstrachan" },
            { name: "Stan", twitter: "gashcrumb" },
            { name: "Claus", twitter: "davsclaus" }
        ];
        $scope.selectedItems = [];
        $scope.mygrid = {
            data: 'myData',
            showFilter: false,
            showColumnMenu: false,
            multiSelect: ($location.search()["multi"] || "").startsWith("f") ? false : true,
            filterOptions: {
                filterText: "",
                useExternalFilter: false
            },
            selectedItems: $scope.selectedItems,
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
})(DataTable || (DataTable = {}));

/// <reference path="../../includes.ts"/>
/**
 * Module that contains several helper functions related to hawtio's code editor
 *
 * @module CodeEditor
 * @main CodeEditor
 */
var CodeEditor;
(function (CodeEditor) {
    /**
     * @property GlobalCodeMirrorOptions
     * @for CodeEditor
     * @type CodeMirrorOptions
     */
    CodeEditor.GlobalCodeMirrorOptions = {
        theme: "default",
        tabSize: 4,
        lineNumbers: true,
        indentWithTabs: true,
        lineWrapping: true,
        autoCloseTags: true
    };
    /**
     * Tries to figure out what kind of text we're going to render in the editor, either
     * text, javascript or XML.
     *
     * @method detectTextFormat
     * @for CodeEditor
     * @static
     * @param value
     * @returns {string}
     */
    function detectTextFormat(value) {
        var answer = "text";
        if (value) {
            answer = "javascript";
            var trimmed = value.toString().trimLeft().trimRight();
            if (trimmed && trimmed.first() === '<' && trimmed.last() === '>') {
                answer = "xml";
            }
        }
        return answer;
    }
    CodeEditor.detectTextFormat = detectTextFormat;
    /**
     * Auto formats the CodeMirror editor content to pretty print
     *
     * @method autoFormatEditor
     * @for CodeEditor
     * @static
     * @param {CodeMirrorEditor} editor
     * @return {void}
     */
    function autoFormatEditor(editor) {
        if (editor) {
            var totalLines = editor.lineCount();
            //var totalChars = editor.getValue().length;
            var start = { line: 0, ch: 0 };
            var end = { line: totalLines - 1, ch: editor.getLine(totalLines - 1).length };
            editor.autoFormatRange(start, end);
            editor.setSelection(start, start);
        }
    }
    CodeEditor.autoFormatEditor = autoFormatEditor;
    /**
     * Used to configures the default editor settings (per Editor Instance)
     *
     * @method createEditorSettings
     * @for CodeEditor
     * @static
     * @param {Object} options
     * @return {Object}
     */
    function createEditorSettings(options) {
        if (options === void 0) { options = {}; }
        options.extraKeys = options.extraKeys || {};
        // Handle Mode
        (function (mode) {
            mode = mode || { name: "text" };
            if (typeof mode !== "object") {
                mode = { name: mode };
            }
            var modeName = mode.name;
            if (modeName === "javascript") {
                angular.extend(mode, {
                    "json": true
                });
            }
        })(options.mode);
        // Handle Code folding folding
        (function (options) {
            var javascriptFolding = CodeMirror.newFoldFunction(CodeMirror.braceRangeFinder);
            var xmlFolding = CodeMirror.newFoldFunction(CodeMirror.tagRangeFinder);
            // Mode logic inside foldFunction to allow for dynamic changing of the mode.
            // So don't have to listen to the options model and deal with re-attaching events etc...
            var foldFunction = function (codeMirror, line) {
                var mode = codeMirror.getOption("mode");
                var modeName = mode["name"];
                if (!mode || !modeName)
                    return;
                if (modeName === 'javascript') {
                    javascriptFolding(codeMirror, line);
                }
                else if (modeName === "xml" || modeName.startsWith("html")) {
                    xmlFolding(codeMirror, line);
                }
                ;
            };
            options.onGutterClick = foldFunction;
            options.extraKeys = angular.extend(options.extraKeys, {
                "Ctrl-Q": function (codeMirror) {
                    foldFunction(codeMirror, codeMirror.getCursor().line);
                }
            });
        })(options);
        var readOnly = options.readOnly;
        if (!readOnly) {
            /*
             options.extraKeys = angular.extend(options.extraKeys, {
             "'>'": function (codeMirror) {
             codeMirror.closeTag(codeMirror, '>');
             },
             "'/'": function (codeMirror) {
             codeMirror.closeTag(codeMirror, '/');
             }
             });
             */
            options.matchBrackets = true;
        }
        // Merge the global config in to this instance of CodeMirror
        angular.extend(options, CodeEditor.GlobalCodeMirrorOptions);
        return options;
    }
    CodeEditor.createEditorSettings = createEditorSettings;
})(CodeEditor || (CodeEditor = {}));

/// <reference path="../../includes.ts"/>
var HawtioEditor;
(function (HawtioEditor) {
    HawtioEditor.pluginName = "hawtio-editor";
    HawtioEditor.templatePath = "plugins/editor/html";
    HawtioEditor.log = Logger.get(HawtioEditor.pluginName);
})(HawtioEditor || (HawtioEditor = {}));

/// <reference path="editorGlobals.ts"/>
/// <reference path="CodeEditor.ts"/>
var HawtioEditor;
(function (HawtioEditor) {
    HawtioEditor._module = angular.module(HawtioEditor.pluginName, []);
    HawtioEditor._module.run(function () {
        HawtioEditor.log.debug("loaded");
    });
    hawtioPluginLoader.addModule(HawtioEditor.pluginName);
})(HawtioEditor || (HawtioEditor = {}));

/// <reference path="editorPlugin.ts"/>
/// <reference path="CodeEditor.ts"/>
/**
 * @module HawtioEditor
 */
var HawtioEditor;
(function (HawtioEditor) {
    HawtioEditor._module.directive('hawtioEditor', ["$parse", function ($parse) {
        return HawtioEditor.Editor($parse);
    }]);
    function Editor($parse) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: UrlHelpers.join(HawtioEditor.templatePath, "editor.html"),
            scope: {
                text: '=hawtioEditor',
                mode: '=',
                outputEditor: '@',
                name: '@'
            },
            controller: ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {
                $scope.codeMirror = null;
                $scope.doc = null;
                $scope.options = [];
                UI.observe($scope, $attrs, 'name', 'editor');
                $scope.applyOptions = function () {
                    if ($scope.codeMirror) {
                        $scope.options.each(function (option) {
                            $scope.codeMirror.setOption(option.key, option['value']);
                        });
                        $scope.options = [];
                    }
                };
                $scope.$watch('doc', function () {
                    if ($scope.doc) {
                        $scope.codeMirror.on('change', function (changeObj) {
                            $scope.text = $scope.doc.getValue();
                            $scope.dirty = !$scope.doc.isClean();
                            Core.$apply($scope);
                        });
                    }
                });
                $scope.$watch('codeMirror', function () {
                    if ($scope.codeMirror) {
                        $scope.doc = $scope.codeMirror.getDoc();
                    }
                });
                $scope.$watch('text', function (oldValue, newValue) {
                    if ($scope.codeMirror && $scope.doc) {
                        if (!$scope.codeMirror.hasFocus()) {
                            var text = $scope.text || "";
                            if (angular.isArray(text) || angular.isObject(text)) {
                                text = JSON.stringify(text, null, "  ");
                                $scope.mode = "javascript";
                                $scope.codeMirror.setOption("mode", "javascript");
                            }
                            $scope.doc.setValue(text);
                        }
                    }
                });
            }],
            link: function ($scope, $element, $attrs) {
                if ('dirty' in $attrs) {
                    $scope.dirtyTarget = $attrs['dirty'];
                    $scope.$watch("$parent['" + $scope.dirtyTarget + "']", function (newValue, oldValue) {
                        if (newValue !== oldValue) {
                            $scope.dirty = newValue;
                        }
                    });
                }
                var config = _.cloneDeep($attrs);
                delete config['$$element'];
                delete config['$attr'];
                delete config['class'];
                delete config['hawtioEditor'];
                delete config['mode'];
                delete config['dirty'];
                delete config['outputEditor'];
                if ('onChange' in $attrs) {
                    var onChange = $attrs['onChange'];
                    delete config['onChange'];
                    $scope.options.push({
                        onChange: function (codeMirror) {
                            var func = $parse(onChange);
                            if (func) {
                                func($scope.$parent, { codeMirror: codeMirror });
                            }
                        }
                    });
                }
                angular.forEach(config, function (value, key) {
                    $scope.options.push({
                        key: key,
                        'value': value
                    });
                });
                $scope.$watch('mode', function () {
                    if ($scope.mode) {
                        if (!$scope.codeMirror) {
                            $scope.options.push({
                                key: 'mode',
                                'value': $scope.mode
                            });
                        }
                        else {
                            $scope.codeMirror.setOption('mode', $scope.mode);
                        }
                    }
                });
                $scope.$watch('dirty', function (newValue, oldValue) {
                    if ($scope.dirty && !$scope.doc.isClean()) {
                        $scope.doc.markClean();
                    }
                    if (newValue !== oldValue && 'dirtyTarget' in $scope) {
                        $scope.$parent[$scope.dirtyTarget] = $scope.dirty;
                    }
                });
                $scope.$watch(function () {
                    return $element.is(':visible');
                }, function (newValue, oldValue) {
                    if (newValue !== oldValue && $scope.codeMirror) {
                        $scope.codeMirror.refresh();
                    }
                });
                $scope.$watch('text', function () {
                    if (!$scope.codeMirror) {
                        var options = {
                            value: $scope.text
                        };
                        options = CodeEditor.createEditorSettings(options);
                        $scope.codeMirror = CodeMirror.fromTextArea($element.find('textarea').get(0), options);
                        var outputEditor = $scope.outputEditor;
                        if (outputEditor) {
                            var outputScope = $scope.$parent || $scope;
                            Core.pathSet(outputScope, outputEditor, $scope.codeMirror);
                        }
                        $scope.applyOptions();
                    }
                });
            }
        };
    }
    HawtioEditor.Editor = Editor;
})(HawtioEditor || (HawtioEditor = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="forceGraphDirective.ts"/>
/**
 * Force Graph plugin & directive
 *
 * @module ForceGraph
 */
var ForceGraph;
(function (ForceGraph) {
    var pluginName = 'forceGraph';
    ForceGraph._module = angular.module(pluginName, []);
    ForceGraph._module.directive('hawtioForceGraph', function () {
        return new ForceGraph.ForceGraphDirective();
    });
    hawtioPluginLoader.addModule(pluginName);
})(ForceGraph || (ForceGraph = {}));

///<reference path="forceGraphPlugin.ts"/>
var ForceGraph;
(function (ForceGraph) {
    var log = Logger.get("ForceGraph");
    var ForceGraphDirective = (function () {
        function ForceGraphDirective() {
            this.restrict = 'A';
            this.replace = true;
            this.transclude = false;
            this.scope = {
                graph: '=graph',
                nodesize: '@',
                selectedModel: '@',
                linkDistance: '@',
                markerKind: '@',
                charge: '@'
            };
            this.link = function ($scope, $element, $attrs) {
                $scope.trans = [0, 0];
                $scope.scale = 1;
                $scope.$watch('graph', function (oldVal, newVal) {
                    updateGraph();
                });
                $scope.redraw = function () {
                    $scope.trans = d3.event.translate;
                    $scope.scale = d3.event.scale;
                    $scope.viewport.attr("transform", "translate(" + $scope.trans + ")" + " scale(" + $scope.scale + ")");
                };
                // This is a callback for the animation
                $scope.tick = function () {
                    // provide curvy lines as curves are kind of hawt
                    $scope.graphEdges.attr("d", function (d) {
                        var dx = d.target.x - d.source.x, dy = d.target.y - d.source.y, dr = Math.sqrt(dx * dx + dy * dy);
                        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
                    });
                    // apply the translates coming from the layouter
                    $scope.graphNodes.attr("transform", function (d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    });
                    $scope.graphLabels.attr("transform", function (d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    });
                    // Only run this in IE
                    if (Object.hasOwnProperty.call(window, "ActiveXObject") || !window.ActiveXObject) {
                        $scope.svg.selectAll(".link").each(function () {
                            this.parentNode.insertBefore(this, this);
                        });
                    }
                };
                $scope.mover = function (d) {
                    if (d.popup != null) {
                        $("#pop-up").fadeOut(100, function () {
                            // Popup content
                            if (d.popup.title != null) {
                                $("#pop-up-title").html(d.popup.title);
                            }
                            else {
                                $("#pop-up-title").html("");
                            }
                            if (d.popup.content != null) {
                                $("#pop-up-content").html(d.popup.content);
                            }
                            else {
                                $("#pop-up-content").html("");
                            }
                            // Popup position
                            var popLeft = (d.x * $scope.scale) + $scope.trans[0] + 20;
                            var popTop = (d.y * $scope.scale) + $scope.trans[1] + 20;
                            $("#pop-up").css({ "left": popLeft, "top": popTop });
                            $("#pop-up").fadeIn(100);
                        });
                    }
                };
                $scope.mout = function (d) {
                    $("#pop-up").fadeOut(50);
                    //d3.select(this).attr("fill","url(#ten1)");
                };
                var updateGraph = function () {
                    var canvas = $($element);
                    // TODO: determine the canvas size dynamically
                    var h = $($element).parent().height();
                    var w = $($element).parent().width();
                    var i = 0;
                    canvas.children("svg").remove();
                    // First we create the top level SVG object
                    // TODO maybe pass in the width/height
                    $scope.svg = d3.select(canvas[0]).append("svg").attr("width", w).attr("height", h);
                    // The we add the markers for the arrow tips
                    var linkTypes = null;
                    if ($scope.graph) {
                        linkTypes = $scope.graph.linktypes;
                    }
                    if (!linkTypes) {
                        return;
                    }
                    $scope.svg.append("svg:defs").selectAll("marker").data(linkTypes).enter().append("svg:marker").attr("id", String).attr("viewBox", "0 -5 10 10").attr("refX", 15).attr("refY", -1.5).attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto").append("svg:path").attr("d", "M0,-5L10,0L0,5");
                    // The bounding box can't be zoomed or scaled at all
                    $scope.svg.append("svg:g").append("svg:rect").attr("class", "graphbox.frame").attr('width', w).attr('height', h);
                    $scope.viewport = $scope.svg.append("svg:g").call(d3.behavior.zoom().on("zoom", $scope.redraw)).append("svg:g");
                    $scope.viewport.append("svg:rect").attr("width", 1000000).attr("height", 1000000).attr("class", "graphbox").attr("transform", "translate(-50000, -500000)");
                    // Only do this if we have a graph object
                    if ($scope.graph) {
                        var ownerScope = $scope.$parent || $scope;
                        var selectedModel = $scope.selectedModel || "selectedNode";
                        // kick off the d3 forced graph layout
                        $scope.force = d3.layout.force().nodes($scope.graph.nodes).links($scope.graph.links).size([w, h]).on("tick", $scope.tick);
                        if (angular.isDefined($scope.linkDistance)) {
                            $scope.force.linkDistance($scope.linkDistance);
                        }
                        if (angular.isDefined($scope.charge)) {
                            $scope.force.charge($scope.charge);
                        }
                        var markerTypeName = $scope.markerKind || "marker-end";
                        // Add all edges to the viewport
                        $scope.graphEdges = $scope.viewport.append("svg:g").selectAll("path").data($scope.force.links()).enter().append("svg:path").attr("class", function (d) {
                            return "link " + d.type;
                        }).attr(markerTypeName, function (d) {
                            return "url(#" + d.type + ")";
                        });
                        // add all nodes to the viewport
                        $scope.graphNodes = $scope.viewport.append("svg:g").selectAll("circle").data($scope.force.nodes()).enter().append("a").attr("xlink:href", function (d) {
                            return d.navUrl;
                        }).on("mouseover.onLink", function (d, i) {
                            var sel = d3.select(d3.event.target);
                            sel.classed('selected', true);
                            ownerScope[selectedModel] = d;
                            Core.pathSet(ownerScope, selectedModel, d);
                            Core.$apply(ownerScope);
                        }).on("mouseout.onLink", function (d, i) {
                            var sel = d3.select(d3.event.target);
                            sel.classed('selected', false);
                        });
                        function hasImage(d) {
                            return d.image && d.image.url;
                        }
                        // Add the images if they are set
                        $scope.graphNodes.filter(function (d) {
                            return d.image != null;
                        }).append("image").attr("xlink:href", function (d) {
                            return d.image.url;
                        }).attr("x", function (d) {
                            return -(d.image.width / 2);
                        }).attr("y", function (d) {
                            return -(d.image.height / 2);
                        }).attr("width", function (d) {
                            return d.image.width;
                        }).attr("height", function (d) {
                            return d.image.height;
                        });
                        // if we don't have an image add a circle
                        $scope.graphNodes.filter(function (d) { return !hasImage(d); }).append("circle").attr("class", function (d) {
                            return d.type;
                        }).attr("r", function (d) {
                            return d.size || $scope.nodesize;
                        });
                        // Add the labels to the viewport
                        $scope.graphLabels = $scope.viewport.append("svg:g").selectAll("g").data($scope.force.nodes()).enter().append("svg:g");
                        // A copy of the text with a thick white stroke for legibility.
                        $scope.graphLabels.append("svg:text").attr("x", 8).attr("y", ".31em").attr("class", "shadow").text(function (d) {
                            return d.name;
                        });
                        $scope.graphLabels.append("svg:text").attr("x", 8).attr("y", ".31em").text(function (d) {
                            return d.name;
                        });
                        // animate, then stop
                        $scope.force.start();
                        $scope.graphNodes.call($scope.force.drag).on("mouseover", $scope.mover).on("mouseout", $scope.mout);
                    }
                };
            };
        }
        return ForceGraphDirective;
    })();
    ForceGraph.ForceGraphDirective = ForceGraphDirective;
})(ForceGraph || (ForceGraph = {}));

/// <reference path="../../includes.ts"/>
var ForceGraph;
(function (ForceGraph) {
    /**
     * GraphBuilder
     *
     * @class GraphBuilder
     */
    var GraphBuilder = (function () {
        function GraphBuilder() {
            this.nodes = {};
            this.links = [];
            this.linkTypes = {};
        }
        /**
         * Adds a node to this graph
         * @method addNode
         * @param {Object} node
         */
        GraphBuilder.prototype.addNode = function (node) {
            if (!this.nodes[node.id]) {
                this.nodes[node.id] = node;
            }
        };
        GraphBuilder.prototype.getNode = function (id) {
            return this.nodes[id];
        };
        GraphBuilder.prototype.hasLinks = function (id) {
            var _this = this;
            var result = false;
            this.links.forEach(function (link) {
                if (link.source.id == id || link.target.id == id) {
                    result = result || (_this.nodes[link.source.id] != null && _this.nodes[link.target.id] != null);
                }
            });
            return result;
        };
        GraphBuilder.prototype.addLink = function (srcId, targetId, linkType) {
            if ((this.nodes[srcId] != null) && (this.nodes[targetId] != null)) {
                this.links.push({
                    source: this.nodes[srcId],
                    target: this.nodes[targetId],
                    type: linkType
                });
                if (!this.linkTypes[linkType]) {
                    this.linkTypes[linkType] = {
                        used: true
                    };
                }
                ;
            }
        };
        GraphBuilder.prototype.nodeIndex = function (id, nodes) {
            var result = -1;
            var index = 0;
            for (index = 0; index < nodes.length; index++) {
                var node = nodes[index];
                if (node.id == id) {
                    result = index;
                    break;
                }
            }
            return result;
        };
        GraphBuilder.prototype.filterNodes = function (filter) {
            var filteredNodes = {};
            var newLinks = [];
            d3.values(this.nodes).forEach(function (node) {
                if (filter(node)) {
                    filteredNodes[node.id] = node;
                }
            });
            this.links.forEach(function (link) {
                if (filteredNodes[link.source.id] && filteredNodes[link.target.id]) {
                    newLinks.push(link);
                }
            });
            this.nodes = filteredNodes;
            this.links = newLinks;
        };
        GraphBuilder.prototype.buildGraph = function () {
            var _this = this;
            var graphNodes = [];
            var linktypes = d3.keys(this.linkTypes);
            var graphLinks = [];
            d3.values(this.nodes).forEach(function (node) {
                if (node.includeInGraph == null || node.includeInGraph) {
                    node.includeInGraph = true;
                    graphNodes.push(node);
                }
            });
            this.links.forEach(function (link) {
                if (_this.nodes[link.source.id] != null && _this.nodes[link.target.id] != null && _this.nodes[link.source.id].includeInGraph && _this.nodes[link.target.id].includeInGraph) {
                    graphLinks.push({
                        source: _this.nodeIndex(link.source.id, graphNodes),
                        target: _this.nodeIndex(link.target.id, graphNodes),
                        type: link.type
                    });
                }
            });
            return {
                nodes: graphNodes,
                links: graphLinks,
                linktypes: linktypes
            };
        };
        return GraphBuilder;
    })();
    ForceGraph.GraphBuilder = GraphBuilder;
})(ForceGraph || (ForceGraph = {}));

/// <reference path="../../includes.ts"/>
var Toastr;
(function (Toastr) {
    var pluginName = 'hawtio-toastr';
    var _module = angular.module(pluginName, []);
    hawtioPluginLoader.addModule(pluginName);
})(Toastr || (Toastr = {}));
var Core;
(function (Core) {
    /**
     * Displays an alert message which is typically the result of some asynchronous operation
     *
     * @method notification
     * @static
     * @param type which is usually "success" or "error" and matches css alert-* css styles
     * @param message the text to display
     *
     */
    function notification(type, message, options) {
        if (options === void 0) { options = null; }
        if (options === null) {
            options = {};
        }
        if (type === 'error' || type === 'warning') {
            if (!angular.isDefined(options.onclick)) {
                options.onclick = window['showLogPanel'];
            }
        }
        toastr[type](message, '', options);
    }
    Core.notification = notification;
    /**
     * Clears all the pending notifications
     * @method clearNotifications
     * @static
     */
    function clearNotifications() {
        toastr.clear();
    }
    Core.clearNotifications = clearNotifications;
})(Core || (Core = {}));

/// <reference path="../../includes.ts"/>
var UIBootstrap;
(function (UIBootstrap) {
    var pluginName = "hawtio-ui-bootstrap";
    angular.module(pluginName, ["ui.bootstrap"]);
    hawtioPluginLoader.addModule(pluginName);
    hawtioPluginLoader.addModule("hawtio-compat.transition");
    hawtioPluginLoader.addModule("hawtio-compat.dialog");
    hawtioPluginLoader.addModule("hawtio-compat.modal");
})(UIBootstrap || (UIBootstrap = {}));

/**
 * @module UI
 */
/// <reference path="../../includes.ts"/>
var UI;
(function (UI) {
    UI.log = Logger.get("UI");
    UI.scrollBarWidth = null;
    UI.pluginName = 'hawtio-ui';
    UI.templatePath = 'plugins/ui/html/';
})(UI || (UI = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="uiHelpers.ts"/>
/**
 * Module that contains a bunch of re-usable directives to assemble into pages in hawtio
 *
 * @module UI
 * @main UI
 */
var UI;
(function (UI) {
    UI._module = angular.module(UI.pluginName, []);
    UI._module.factory('UI', function () {
        return UI;
    });
    UI._module.factory('marked', function () {
        marked.setOptions({
            gfm: true,
            tables: true,
            breaks: false,
            pedantic: true,
            sanitize: false,
            smartLists: true,
            langPrefix: 'language-'
        });
        return marked;
    });
    UI._module.directive('compile', ['$compile', function ($compile) {
        return function (scope, element, attrs) {
            scope.$watch(function (scope) {
                // watch the 'compile' expression for changes
                return scope.$eval(attrs.compile);
            }, function (value) {
                // when the 'compile' expression changes
                // assign it into the current DOM
                element.html(value);
                // compile the new DOM and link it to the current
                // scope.
                // NOTE: we only compile .childNodes so that
                // we don't get into infinite loop compiling ourselves
                $compile(element.contents())(scope);
            });
        };
    }]);
    /*
    UI._module.controller("CodeEditor.PreferencesController", ["$scope", "localStorage", "$templateCache", ($scope, localStorage, $templateCache) => {
      $scope.exampleText = $templateCache.get("exampleText");
      $scope.codeMirrorEx = $templateCache.get("codeMirrorExTemplate");
      $scope.javascript = "javascript";
  
      $scope.preferences = CodeEditor.GlobalCodeMirrorOptions;
  
      // If any of the preferences change, make sure to save them automatically
      $scope.$watch("preferences", function(newValue, oldValue) {
        if (newValue !== oldValue) {
          // such a cheap and easy way to update the example view :-)
          $scope.codeMirrorEx += " ";
          localStorage['CodeMirrorOptions'] = angular.toJson(angular.extend(CodeEditor.GlobalCodeMirrorOptions, $scope.preferences));
        }
      }, true);
  
    }]);
    */
    UI._module.run([function () {
        UI.log.debug("loaded");
        /*
        var opts = localStorage['CodeMirrorOptions'];
        if (opts) {
          opts = angular.fromJson(opts);
          CodeEditor.GlobalCodeMirrorOptions = angular.extend(CodeEditor.GlobalCodeMirrorOptions, opts);
        }
        */
    }]);
    hawtioPluginLoader.addModule(UI.pluginName);
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="./uiPlugin.ts"/>
var UI;
(function (UI) {
    UI._module.directive('hawtioAutoColumns', function () {
        return new UI.AutoColumns();
    });
    /**
     * Directive class that organizes child elements into columns automatically
     *
     * @class AutoColumns
     */
    var AutoColumns = (function () {
        function AutoColumns() {
            this.restrict = 'A';
            this.link = function ($scope, $element, $attr) {
                var selector = UI.getIfSet('hawtioAutoColumns', $attr, 'div');
                var minMargin = UI.getIfSet('minMargin', $attr, '3').toNumber();
                var go = Core.throttled(function () {
                    var containerWidth = $element.innerWidth();
                    var childWidth = 0;
                    var children = $element.children(selector);
                    if (children.length === 0) {
                        //log.debug("No children, skipping calculating column margins");
                        return;
                    }
                    // find the biggest child, though really they should all be the same size...
                    children.each(function (child) {
                        var self = $(this);
                        if (!self.is(':visible')) {
                            return;
                        }
                        if (self.outerWidth() > childWidth) {
                            childWidth = self.outerWidth();
                        }
                    });
                    if (childWidth === 0) {
                        return;
                    }
                    childWidth = childWidth + (minMargin * 2);
                    var columns = Math.floor(containerWidth / childWidth);
                    if (children.length < columns) {
                        columns = children.length;
                    }
                    var margin = (containerWidth - (columns * childWidth)) / columns / 2;
                    //log.debug("child width: ", childWidth);
                    //log.debug("Inner width: ", containerWidth);
                    //log.debug("columns: ", columns);
                    //log.debug("margin: ", margin);
                    children.each(function (child) {
                        $(this).css({
                            'margin-left': margin,
                            'margin-right': margin
                        });
                    });
                }, 500);
                setTimeout(go, 300);
                $scope.$watch(go);
                $(window).resize(go);
            };
        }
        return AutoColumns;
    })();
    UI.AutoColumns = AutoColumns;
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="./uiPlugin.ts"/>
var UI;
(function (UI) {
    UI._module.directive('hawtioAutoDropdown', function () {
        return UI.AutoDropDown;
    });
    /**
     * TODO turn this into a normal directive function
     *
     * @property AutoDropDown
     * @type IAutoDropDown
     */
    UI.AutoDropDown = {
        restrict: 'A',
        link: function ($scope, $element, $attrs) {
            function locateElements(event) {
                var el = $element.get(0);
                if (event && event.relatedNode !== el && event.type) {
                    if (event && event.type !== 'resize') {
                        return;
                    }
                }
                var overflowEl = $($element.find('.overflow'));
                var overflowMenu = $(overflowEl.find('ul.dropdown-menu'));
                /*
                Logger.info("element inner width: ", $element.innerWidth());
                Logger.info("element position: ", $element.position());
                Logger.info("element offset: ", $element.offset());
                Logger.info("overflowEl offset: ", overflowEl.offset());
                Logger.info("overflowEl position: ", overflowEl.position());
                */
                var margin = 0;
                var availableWidth = 0;
                try {
                    margin = overflowEl.outerWidth() - overflowEl.innerWidth();
                    availableWidth = overflowEl.position().left - $element.position().left - 50;
                }
                catch (e) {
                    UI.log.debug("caught " + e);
                }
                $element.children('li:not(.overflow):not(.pull-right):not(:hidden)').each(function () {
                    var self = $(this);
                    availableWidth = availableWidth - self.outerWidth(true);
                    if (availableWidth < 0) {
                        self.detach();
                        self.prependTo(overflowMenu);
                    }
                });
                if (overflowMenu.children().length > 0) {
                    overflowEl.css({ visibility: "visible" });
                }
                if (availableWidth > 130) {
                    var noSpace = false;
                    overflowMenu.children('li:not(.overflow):not(.pull-right)').filter(function () {
                        return $(this).css('display') !== 'none';
                    }).each(function () {
                        if (noSpace) {
                            return;
                        }
                        var self = $(this);
                        if (availableWidth > self.outerWidth()) {
                            availableWidth = availableWidth - self.outerWidth();
                            self.detach();
                            self.insertBefore(overflowEl);
                        }
                        else {
                            noSpace = true;
                        }
                    });
                }
                if (overflowMenu.children().length === 0) {
                    overflowEl.css({ visibility: "hidden" });
                }
            }
            $(window).resize(locateElements);
            $element.get(0).addEventListener("DOMNodeInserted", locateElements);
            $scope.$watch(setTimeout(locateElements, 500));
        }
    };
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="uiPlugin.ts"/>
var UI;
(function (UI) {
    function hawtioBreadcrumbs() {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: UI.templatePath + 'breadcrumbs.html',
            require: 'hawtioDropDown',
            scope: {
                config: '='
            },
            controller: ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {
                $scope.action = "itemClicked(config, $event)";
                $scope.levels = {};
                $scope.itemClicked = function (config, $event) {
                    //log.debug("Item clicked: ", config);
                    if (config.level && angular.isNumber(config.level)) {
                        $scope.levels[config.level] = config;
                        var keys = _.keys($scope.levels).sortBy("");
                        var toRemove = keys.from(config.level + 1);
                        toRemove.forEach(function (i) {
                            if (i in $scope.levels) {
                                $scope.levels[i] = {};
                                delete $scope.levels[i];
                            }
                        });
                        // reset any previously deleted action
                        angular.forEach($scope.levels, function (value, key) {
                            if (value.items && value.items.length > 0) {
                                value.items.forEach(function (i) {
                                    //log.debug("Resetting action: ", i);
                                    i['action'] = $scope.action;
                                });
                            }
                        });
                        if (config.items) {
                            config.open = true;
                            config.items.forEach(function (i) {
                                i['action'] = $scope.action;
                            });
                            delete config.action;
                        }
                        else {
                            //ooh we picked a thing!
                            var keys = _.keys($scope.levels).keys().sortBy("");
                            var path = [];
                            keys.forEach(function (key) {
                                path.push($scope.levels[key]['title']);
                            });
                            var pathString = '/' + path.join("/");
                            $scope.config.path = pathString;
                        }
                        // for some reason levels > 1 get two click events :-S
                        if (config.level > 1) {
                            $event.preventDefault();
                            $event.stopPropagation();
                        }
                    }
                };
                function addAction(config, level) {
                    config.level = level;
                    if (level > 0) {
                        config.breadcrumbAction = config.action;
                        config.action = $scope.action;
                    }
                    if (config.items) {
                        config.items.forEach(function (item) {
                            addAction(item, level + 1);
                        });
                    }
                }
                function setLevels(config, pathParts, level) {
                    if (pathParts.length === 0) {
                        return;
                    }
                    var part = pathParts.removeAt(0)[0];
                    //log.debug("config: ", config, " checking part: ", part, " pathParts: ", pathParts);
                    if (config && config.items) {
                        var matched = false;
                        config.items.forEach(function (item) {
                            //log.debug("checking item: ", item, " against part: ", part);
                            if (!matched && item['title'] === part) {
                                //log.debug("Found match");
                                matched = true;
                                $scope.levels[level] = item;
                                setLevels(item, pathParts, level + 1);
                            }
                        });
                    }
                }
                // watch to see if the parent scope changes the path
                $scope.$watch('config.path', function (newValue, oldValue) {
                    if (!Core.isBlank(newValue)) {
                        var pathParts = newValue.split('/').exclude(function (p) {
                            return Core.isBlank(p);
                        });
                        //log.debug("path: ", newValue);
                        //log.debug("pathParts: ", pathParts);
                        var matches = true;
                        pathParts.forEach(function (part, index) {
                            //log.debug("Checking part: ", part, " index: ", index)
                            if (!matches) {
                                return;
                            }
                            if (!$scope.levels[index] || Core.isBlank($scope.levels[index]['title']) || $scope.levels[index]['title'] !== part) {
                                matches = false;
                            }
                        });
                        //log.debug("matches: ", matches);
                        if (matches) {
                            return;
                        }
                        // adjust $scope.levels to match the path
                        $scope.levels = [];
                        $scope.levels['0'] = $scope.config;
                        setLevels($scope.config, pathParts.from(0), 1);
                    }
                });
                $scope.$watch('config', function (newValue, oldValue) {
                    addAction($scope.config, 0);
                    $scope.levels['0'] = $scope.config;
                });
            }]
        };
    }
    UI.hawtioBreadcrumbs = hawtioBreadcrumbs;
    UI._module.directive('hawtioBreadcrumbs', UI.hawtioBreadcrumbs);
})(UI || (UI = {}));

var UI;
(function (UI) {
    /**
     * Pre defined colors used in the color picker
     * @property colors
     * @for UI
     * @type Array
     */
    UI.colors = ["#5484ED", "#A4BDFC", "#46D6DB", "#7AE7BF", "#51B749", "#FBD75B", "#FFB878", "#FF887C", "#DC2127", "#DBADFF", "#E1E1E1"];
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="./colors.ts"/>
/// <reference path="./uiPlugin.ts"/>
var UI;
(function (UI) {
    UI._module.directive('hawtioColorPicker', function () {
        return new UI.ColorPicker();
    });
    UI.selected = "selected";
    UI.unselected = "unselected";
    /**
  Directive that allows the user to pick a color from a pre-defined pallete of colors.
  
  Use it like:
  
  ```html
  <div hawtio-color-picker="myModel"></div>
  ```
  
  'myModel' will be bound to the color the user clicks on
  
  @class ColorPicker
     */
    var ColorPicker = (function () {
        function ColorPicker() {
            this.restrict = 'A';
            this.replace = true;
            this.scope = {
                property: '=hawtioColorPicker'
            };
            this.templateUrl = UI.templatePath + "colorPicker.html";
            this.compile = function (tElement, tAttrs, transclude) {
                return {
                    post: function postLink(scope, iElement, iAttrs, controller) {
                        scope.colorList = [];
                        angular.forEach(UI.colors, function (color) {
                            var select = UI.unselected;
                            if (scope.property === color) {
                                select = UI.selected;
                            }
                            scope.colorList.push({
                                color: color,
                                select: select
                            });
                        });
                    }
                };
            };
            this.controller = ["$scope", "$element", "$timeout", function ($scope, $element, $timeout) {
                $scope.popout = false;
                $scope.$watch('popout', function () {
                    $element.find('.color-picker-popout').toggleClass('popout-open', $scope.popout);
                });
                $scope.selectColor = function (color) {
                    for (var i = 0; i < $scope.colorList.length; i++) {
                        $scope.colorList[i].select = UI.unselected;
                        if ($scope.colorList[i] === color) {
                            $scope.property = color.color;
                            $scope.colorList[i].select = UI.selected;
                        }
                    }
                };
            }];
        }
        return ColorPicker;
    })();
    UI.ColorPicker = ColorPicker;
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="./uiPlugin.ts"/>
var UI;
(function (UI) {
    UI._module.directive('hawtioConfirmDialog', function () {
        return new UI.ConfirmDialog();
    });
    /**
     * Directive that opens a simple standard confirmation dialog.  See ConfigDialogConfig
     * for configuration properties
     *
     * @class ConfirmDialog
     */
    var ConfirmDialog = (function () {
        function ConfirmDialog() {
            this.restrict = 'A';
            this.replace = true;
            this.transclude = true;
            this.templateUrl = UI.templatePath + 'confirmDialog.html';
            /**
             * @property scope
             * @type ConfirmDialogConfig
             */
            this.scope = {
                show: '=hawtioConfirmDialog',
                title: '@',
                okButtonText: '@',
                showOkButton: '@',
                cancelButtonText: '@',
                onCancel: '&?',
                onOk: '&?',
                onClose: '&?'
            };
            this.controller = ["$scope", "$element", "$attrs", "$transclude", "$compile", function ($scope, $element, $attrs, $transclude, $compile) {
                $scope.clone = null;
                $transclude(function (clone) {
                    $scope.clone = $(clone).filter('.dialog-body');
                });
                $scope.$watch('show', function () {
                    if ($scope.show) {
                        setTimeout(function () {
                            $scope.body = $('.modal-body');
                            $scope.body.html($compile($scope.clone.html())($scope.$parent));
                            Core.$apply($scope);
                        }, 50);
                    }
                });
                $attrs.$observe('okButtonText', function (value) {
                    if (!angular.isDefined(value)) {
                        $scope.okButtonText = "OK";
                    }
                });
                $attrs.$observe('cancelButtonText', function (value) {
                    if (!angular.isDefined(value)) {
                        $scope.cancelButtonText = "Cancel";
                    }
                });
                $attrs.$observe('title', function (value) {
                    if (!angular.isDefined(value)) {
                        $scope.title = "Are you sure?";
                    }
                });
                function checkClosed() {
                    setTimeout(function () {
                        // lets make sure we don't have a modal-backdrop hanging around!
                        var backdrop = $("div.modal-backdrop");
                        if (backdrop && backdrop.length) {
                            Logger.get("ConfirmDialog").debug("Removing the backdrop div! " + backdrop);
                            backdrop.remove();
                        }
                    }, 200);
                }
                $scope.cancel = function () {
                    $scope.show = false;
                    $scope.$parent.$eval($scope.onCancel);
                    checkClosed();
                };
                $scope.submit = function () {
                    $scope.show = false;
                    $scope.$parent.$eval($scope.onOk);
                    checkClosed();
                };
                $scope.close = function () {
                    $scope.$parent.$eval($scope.onClose);
                    checkClosed();
                };
            }];
        }
        return ConfirmDialog;
    })();
    UI.ConfirmDialog = ConfirmDialog;
})(UI || (UI = {}));

/// <reference path="uiPlugin.ts"/>
/**
 * @module UI
 */
var UI;
(function (UI) {
    UI._module.controller("UI.DeveloperPageController", ["$scope", "$http", function ($scope, $http) {
        $scope.getContents = function (filename, cb) {
            var fullUrl = UrlHelpers.join(UI.templatePath, "test", filename);
            $http({ method: 'GET', url: fullUrl }).success(function (data, status, headers, config) {
                cb(data);
            }).error(function (data, status, headers, config) {
                cb("Failed to fetch " + filename + ": " + data);
            });
        };
    }]);
})(UI || (UI = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="uiHelpers.ts"/>
/**
 * @module UI
 */
var UI;
(function (UI) {
    /**
     * Simple helper class for creating <a href="http://angular-ui.github.io/bootstrap/#/modal">angular ui bootstrap modal dialogs</a>
     * @class Dialog
     */
    var Dialog = (function () {
        function Dialog() {
            this.show = false;
            this.options = {
                backdropFade: true,
                dialogFade: true
            };
        }
        /**
         * Opens the dialog
         * @method open
         */
        Dialog.prototype.open = function () {
            this.show = true;
        };
        /**
         * Closes the dialog
         * @method close
         */
        Dialog.prototype.close = function () {
            this.show = false;
            // lets make sure and remove any backgroup fades
            this.removeBackdropFadeDiv();
            setTimeout(this.removeBackdropFadeDiv, 100);
        };
        Dialog.prototype.removeBackdropFadeDiv = function () {
            $("div.modal-backdrop").remove();
        };
        return Dialog;
    })();
    UI.Dialog = Dialog;
    function multiItemConfirmActionDialog(options) {
        var $dialog = HawtioCore.injector.get("$dialog");
        return $dialog.dialog({
            resolve: {
                options: function () {
                    return options;
                }
            },
            templateUrl: UrlHelpers.join(UI.templatePath, 'multiItemConfirmActionDialog.html'),
            controller: ["$scope", "dialog", "options", function ($scope, dialog, options) {
                $scope.options = options;
                $scope.close = function (result) {
                    dialog.close();
                    options.onClose(result);
                };
            }]
        });
    }
    UI.multiItemConfirmActionDialog = multiItemConfirmActionDialog;
})(UI || (UI = {}));

///<reference path="uiPlugin.ts"/>
var UI;
(function (UI) {
    UI.hawtioDrag = UI._module.directive("hawtioDrag", [function () {
        return {
            replace: false,
            transclude: true,
            restrict: 'A',
            template: '<span ng-transclude></span>',
            scope: {
                data: '=hawtioDrag'
            },
            link: function (scope, element, attrs) {
                element.attr({
                    draggable: 'true'
                });
                //log.debug("hawtioDrag, data: ", scope.data);
                var el = element[0];
                el.draggable = true;
                el.addEventListener('dragstart', function (event) {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('data', scope.data);
                    element.addClass('drag-started');
                    return false;
                }, false);
                el.addEventListener('dragend', function (event) {
                    element.removeClass('drag-started');
                }, false);
            }
        };
    }]);
    UI.hawtioDrop = UI._module.directive("hawtioDrop", [function () {
        return {
            replace: false,
            transclude: true,
            restrict: 'A',
            template: '<span ng-transclude></span>',
            scope: {
                onDrop: '&?hawtioDrop',
                ngModel: '=',
                property: '@',
                prefix: '@'
            },
            link: function (scope, element, attrs) {
                //log.debug("hawtioDrop, onDrop: ", scope.onDrop);
                //log.debug("hawtioDrop, ngModel: ", scope.ngModel);
                //log.debug("hawtioDrop, property: ", scope.property);
                var dragEnter = function (event) {
                    if (event.preventDefault) {
                        event.preventDefault();
                    }
                    element.addClass('drag-over');
                    return false;
                };
                var el = element[0];
                el.addEventListener('dragenter', dragEnter, false);
                el.addEventListener('dragover', dragEnter, false);
                el.addEventListener('dragleave', function (event) {
                    element.removeClass('drag-over');
                    return false;
                }, false);
                el.addEventListener('drop', function (event) {
                    if (event.stopPropagation) {
                        event.stopPropagation();
                    }
                    element.removeClass('drag-over');
                    var data = event.dataTransfer.getData('data');
                    if (scope.onDrop) {
                        scope.$eval(scope.onDrop, {
                            data: data,
                            model: scope.ngModel,
                            property: scope.property
                        });
                    }
                    var eventName = 'hawtio-drop';
                    if (!Core.isBlank(scope.prefix)) {
                        eventName = scope.prefix + '-' + eventName;
                    }
                    // let's emit this too so parent scopes can watch for the data
                    scope.$emit(eventName, {
                        data: data,
                        model: scope.ngModel,
                        property: scope.property
                    });
                    Core.$apply(scope);
                    return false;
                }, false);
            }
        };
    }]);
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="uiPlugin.ts"/>
var UI;
(function (UI) {
    function hawtioDropDown($templateCache) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: UI.templatePath + 'dropDown.html',
            scope: {
                config: '=hawtioDropDown'
            },
            controller: ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {
                if (!$scope.config) {
                    $scope.config = {};
                }
                if (!('open' in $scope.config)) {
                    $scope.config['open'] = false;
                }
                $scope.action = function (config, $event) {
                    //log.debug("doAction on : ", config, "event: ", $event);
                    if ('items' in config && !('action' in config)) {
                        config.open = !config.open;
                        $event.preventDefault();
                        $event.stopPropagation();
                    }
                    else if ('action' in config) {
                        //log.debug("executing action: ", config.action);
                        var action = config['action'];
                        if (angular.isFunction(action)) {
                            action();
                        }
                        else if (angular.isString(action)) {
                            $scope.$parent.$eval(action, {
                                config: config,
                                '$event': $event
                            });
                        }
                    }
                };
                $scope.$watch('config.items', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        // just add some space to force a redraw
                        $scope.menuStyle = $scope.menuStyle + " ";
                    }
                }, true);
                $scope.submenu = function (config) {
                    if (config && config.submenu) {
                        return "sub-menu";
                    }
                    return "";
                };
                $scope.icon = function (config) {
                    if (config && !Core.isBlank(config.icon)) {
                        return config.icon;
                    }
                    else {
                        return 'fa fa-spacer';
                    }
                };
                $scope.open = function (config) {
                    if (config && !config.open) {
                        return '';
                    }
                    return 'open';
                };
            }],
            link: function ($scope, $element, $attrs) {
                $scope.menuStyle = $templateCache.get("withsubmenus.html");
                if ('processSubmenus' in $attrs) {
                    if (!Core.parseBooleanValue($attrs['processSubmenus'])) {
                        $scope.menuStyle = $templateCache.get("withoutsubmenus.html");
                    }
                }
            }
        };
    }
    UI.hawtioDropDown = hawtioDropDown;
    UI._module.directive('hawtioDropDown', ["$templateCache", UI.hawtioDropDown]);
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="uiPlugin.ts"/>
var UI;
(function (UI) {
    UI._module.directive('editableProperty', ["$parse", function ($parse) {
        return new UI.EditableProperty($parse);
    }]);
    var EditableProperty = (function () {
        function EditableProperty($parse) {
            this.$parse = $parse;
            this.restrict = 'E';
            this.scope = true;
            this.templateUrl = UI.templatePath + 'editableProperty.html';
            this.require = 'ngModel';
            this.link = null;
            this.link = function (scope, element, attrs, ngModel) {
                scope.inputType = attrs['type'] || 'text';
                scope.min = attrs['min'];
                scope.max = attrs['max'];
                scope.getText = function () {
                    if (!scope.text) {
                        return '';
                    }
                    if (scope.inputType === 'password') {
                        return StringHelpers.obfusicate(scope.text);
                    }
                    else {
                        return scope.text;
                    }
                };
                scope.editing = false;
                $(element.find(".fa fa-pencil")[0]).hide();
                scope.getPropertyName = function () {
                    var propertyName = $parse(attrs['property'])(scope);
                    if (!propertyName && propertyName !== 0) {
                        propertyName = attrs['property'];
                    }
                    return propertyName;
                };
                ngModel.$render = function () {
                    if (!ngModel.$viewValue) {
                        return;
                    }
                    scope.text = ngModel.$viewValue[scope.getPropertyName()];
                };
                scope.getInputStyle = function () {
                    if (!scope.text) {
                        return {};
                    }
                    var calculatedWidth = (scope.text + "").length / 1.2;
                    if (calculatedWidth < 5) {
                        calculatedWidth = 5;
                    }
                    return {
                        width: calculatedWidth + 'em'
                    };
                };
                scope.showEdit = function () {
                    $(element.find(".fa fa-pencil")[0]).show();
                };
                scope.hideEdit = function () {
                    $(element.find(".fa fa-pencil")[0]).hide();
                };
                function inputSelector() {
                    return ':input[type=' + scope.inputType + ']';
                }
                scope.$watch('editing', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        if (newValue) {
                            $(element.find(inputSelector())).focus().select();
                        }
                    }
                });
                scope.doEdit = function () {
                    scope.editing = true;
                };
                scope.stopEdit = function () {
                    $(element.find(inputSelector())[0]).val(ngModel.$viewValue[scope.getPropertyName()]);
                    scope.editing = false;
                };
                scope.saveEdit = function () {
                    var value = $(element.find(inputSelector())[0]).val();
                    var obj = ngModel.$viewValue;
                    obj[scope.getPropertyName()] = value;
                    ngModel.$setViewValue(obj);
                    ngModel.$render();
                    scope.editing = false;
                    scope.$parent.$eval(attrs['onSave']);
                };
            };
        }
        return EditableProperty;
    })();
    UI.EditableProperty = EditableProperty;
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="./uiPlugin.ts"/>
var UI;
(function (UI) {
    UI._module.directive('expandable', function () {
        return new UI.Expandable();
    });
    var Expandable = (function () {
        function Expandable() {
            var _this = this;
            this.log = Logger.get("Expandable");
            this.restrict = 'C';
            this.replace = false;
            this.link = null;
            this.link = function (scope, element, attrs) {
                var self = _this;
                var expandable = element;
                var modelName = null;
                var model = null;
                if (angular.isDefined(attrs['model'])) {
                    modelName = attrs['model'];
                    model = scope[modelName];
                    if (!angular.isDefined(scope[modelName]['expanded'])) {
                        model['expanded'] = expandable.hasClass('opened');
                    }
                    else {
                        if (model['expanded']) {
                            self.forceOpen(model, expandable, scope);
                        }
                        else {
                            self.forceClose(model, expandable, scope);
                        }
                    }
                    if (modelName) {
                        scope.$watch(modelName + '.expanded', function (newValue, oldValue) {
                            if (asBoolean(newValue) !== asBoolean(oldValue)) {
                                if (newValue) {
                                    self.open(model, expandable, scope);
                                }
                                else {
                                    self.close(model, expandable, scope);
                                }
                            }
                        });
                    }
                }
                var title = expandable.find('.title');
                var button = expandable.find('.cancel');
                button.bind('click', function () {
                    model = scope[modelName];
                    self.forceClose(model, expandable, scope);
                    return false;
                });
                title.bind('click', function () {
                    model = scope[modelName];
                    if (isOpen(expandable)) {
                        self.close(model, expandable, scope);
                    }
                    else {
                        self.open(model, expandable, scope);
                    }
                    return false;
                });
            };
        }
        Expandable.prototype.open = function (model, expandable, scope) {
            expandable.find('.expandable-body').slideDown(400, function () {
                if (!expandable.hasClass('opened')) {
                    expandable.addClass('opened');
                }
                expandable.removeClass('closed');
                if (model) {
                    model['expanded'] = true;
                }
                Core.$apply(scope);
            });
        };
        Expandable.prototype.close = function (model, expandable, scope) {
            expandable.find('.expandable-body').slideUp(400, function () {
                expandable.removeClass('opened');
                if (!expandable.hasClass('closed')) {
                    expandable.addClass('closed');
                }
                if (model) {
                    model['expanded'] = false;
                }
                Core.$apply(scope);
            });
        };
        Expandable.prototype.forceClose = function (model, expandable, scope) {
            expandable.find('.expandable-body').slideUp(0, function () {
                if (!expandable.hasClass('closed')) {
                    expandable.addClass('closed');
                }
                expandable.removeClass('opened');
                if (model) {
                    model['expanded'] = false;
                }
                Core.$apply(scope);
            });
        };
        Expandable.prototype.forceOpen = function (model, expandable, scope) {
            expandable.find('.expandable-body').slideDown(0, function () {
                if (!expandable.hasClass('opened')) {
                    expandable.addClass('opened');
                }
                expandable.removeClass('closed');
                if (model) {
                    model['expanded'] = true;
                }
                Core.$apply(scope);
            });
        };
        return Expandable;
    })();
    UI.Expandable = Expandable;
    function isOpen(expandable) {
        return expandable.hasClass('opened') || !expandable.hasClass("closed");
    }
    function asBoolean(value) {
        return value ? true : false;
    }
})(UI || (UI = {}));

/// <reference path="uiPlugin.ts"/>
var UI;
(function (UI) {
    var hawtioFileDrop = UI._module.directive("hawtioFileDrop", [function () {
        return {
            restrict: 'A',
            replace: false,
            link: function (scope, element, attr) {
                var fileName = attr['hawtioFileDrop'];
                var downloadURL = attr['downloadUrl'];
                var mimeType = attr['mimeType'] || 'application/octet-stream';
                if (Core.isBlank(fileName) || Core.isBlank(downloadURL)) {
                    return;
                }
                // DownloadURL needs an absolute URL
                if (!downloadURL.startsWith("http")) {
                    var uri = new URI();
                    downloadURL = uri.path(downloadURL).toString();
                }
                var fileDetails = mimeType + ":" + fileName + ":" + downloadURL;
                element.attr({
                    draggable: true
                });
                element[0].addEventListener("dragstart", function (event) {
                    if (event.dataTransfer) {
                        UI.log.debug("Drag started, event: ", event, "File details: ", fileDetails);
                        event.dataTransfer.setData("DownloadURL", fileDetails);
                    }
                    else {
                        UI.log.debug("Drag event object doesn't contain data transfer: ", event);
                    }
                });
            }
        };
    }]);
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="./uiPlugin.ts"/>
var UI;
(function (UI) {
    UI.hawtioFilter = UI._module.directive("hawtioFilter", [function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: UI.templatePath + 'filter.html',
            scope: {
                placeholder: '@',
                cssClass: '@',
                saveAs: '@?',
                ngModel: '='
            },
            controller: ["$scope", "localStorage", "$location", "$element", function ($scope, localStorage, $location, $element) {
                $scope.getClass = function () {
                    var answer = [];
                    if (!Core.isBlank($scope.cssClass)) {
                        answer.push($scope.cssClass);
                    }
                    if (!Core.isBlank($scope.ngModel)) {
                        answer.push("has-text");
                    }
                    return answer.join(' ');
                };
                // sync with local storage and the location bar, maybe could refactor this into a helper function
                if (!Core.isBlank($scope.saveAs)) {
                    if ($scope.saveAs in localStorage) {
                        var val = localStorage[$scope.saveAs];
                        if (!Core.isBlank(val)) {
                            $scope.ngModel = val;
                        }
                        else {
                            $scope.ngModel = '';
                        }
                    }
                    else {
                        $scope.ngModel = '';
                    }
                    /*
                     // input loses focus when we muck with the search, at least on firefox
                    var search = $location.search();
                    if ($scope.saveAs in search) {
                      $scope.ngModel = search[$scope.saveAs];
                    }
                    */
                    var updateFunc = function () {
                        localStorage[$scope.saveAs] = $scope.ngModel;
                        // input loses focus when we do this
                        //$location.search($scope.saveAs, $scope.ngModel);
                    };
                    $scope.$watch('ngModel', updateFunc);
                }
            }]
        };
    }]);
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="./uiPlugin.ts"/>
var UI;
(function (UI) {
    UI._module.directive('gridster', function () {
        return new UI.GridsterDirective();
    });
    var GridsterDirective = (function () {
        function GridsterDirective() {
            this.restrict = 'A';
            this.replace = true;
            this.controller = ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {
            }];
            this.link = function ($scope, $element, $attrs) {
                var widgetMargins = [6, 6];
                var widgetBaseDimensions = [150, 150];
                var gridSize = [150, 150];
                var extraRows = 10;
                var extraCols = 6;
                /*
                if (angular.isDefined($attrs['dimensions'])) {
                  var dimension = $attrs['dimensions'].toNumber();
                  widgetBaseDimensions = [dimension, dimension];
                }
          
          
                if (angular.isDefined($attrs['margins'])) {
                  var margins = $attrs['margins'].toNumber();
                  widgetMargins = [margins, margins];
                }
          
                if (angular.isDefined($attrs['gridSize'])) {
                  var size = $attrs['gridSize'].toNumber();
                  gridSize = [size, size];
                }
                */
                if (angular.isDefined($attrs['extraRows'])) {
                    extraRows = $attrs['extraRows'].toNumber();
                }
                if (angular.isDefined($attrs['extraCols'])) {
                    extraCols = $attrs['extraCols'].toNumber();
                }
                var grid = $('<ul style="margin: 0"></ul>');
                var styleStr = '<style type="text/css">';
                var styleStr = styleStr + '</style>';
                $element.append($(styleStr));
                $element.append(grid);
                $scope.gridster = grid.gridster({
                    widget_margins: widgetMargins,
                    grid_size: gridSize,
                    extra_rows: extraRows,
                    extra_cols: extraCols
                }).data('gridster');
            };
        }
        return GridsterDirective;
    })();
    UI.GridsterDirective = GridsterDirective;
})(UI || (UI = {}));

/// <reference path="./uiPlugin.ts"/>
var UI;
(function (UI) {
    function groupBy() {
        return function (list, group) {
            if (list.length === 0) {
                return list;
            }
            if (Core.isBlank(group)) {
                return list;
            }
            var newGroup = 'newGroup';
            var endGroup = 'endGroup';
            var currentGroup = undefined;
            function createNewGroup(list, item, index) {
                item[newGroup] = true;
                item[endGroup] = false;
                currentGroup = item[group];
                if (index > 0) {
                    list[index - 1][endGroup] = true;
                }
            }
            function addItemToExistingGroup(item) {
                item[newGroup] = false;
                item[endGroup] = false;
            }
            list.forEach(function (item, index) {
                var createGroup = item[group] !== currentGroup;
                if (angular.isArray(item[group])) {
                    if (currentGroup === undefined) {
                        createGroup = true;
                    }
                    else {
                        var targetGroup = item[group];
                        if (targetGroup.length !== currentGroup.length) {
                            createGroup = true;
                        }
                        else {
                            createGroup = false;
                            targetGroup.forEach(function (item) {
                                if (!createGroup && !currentGroup.any(function (i) {
                                    return i === item;
                                })) {
                                    createGroup = true;
                                }
                            });
                        }
                    }
                }
                if (createGroup) {
                    createNewGroup(list, item, index);
                }
                else {
                    addItemToExistingGroup(item);
                }
            });
            return list;
        };
    }
    UI.groupBy = groupBy;
    UI._module.filter('hawtioGroupBy', UI.groupBy);
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="./uiPlugin.ts"/>
var UI;
(function (UI) {
    /**
     * Test controller for the icon help page
     * @param $scope
     * @param $templateCache
     * @constructor
     */
    UI.IconTestController = UI._module.controller("UI.IconTestController", ["$scope", "$templateCache", function ($scope, $templateCache) {
        $scope.exampleHtml = $templateCache.get('example-html');
        $scope.exampleConfigJson = $templateCache.get('example-config-json');
        $scope.$watch('exampleConfigJson', function (newValue, oldValue) {
            $scope.icons = angular.fromJson($scope.exampleConfigJson);
            //log.debug("Icons: ", $scope.icons);
        });
    }]);
    /**
     * The hawtio-icon directive
     * @returns {{}}
     */
    function hawtioIcon() {
        UI.log.debug("Creating icon directive");
        return {
            restrict: 'E',
            replace: true,
            templateUrl: UI.templatePath + 'icon.html',
            scope: {
                icon: '=config'
            },
            link: function ($scope, $element, $attrs) {
                if (!$scope.icon) {
                    return;
                }
                if (!('type' in $scope.icon) && !Core.isBlank($scope.icon.src)) {
                    if ($scope.icon.src.startsWith("fa fa-")) {
                        $scope.icon.type = "icon";
                    }
                    else {
                        $scope.icon.type = "img";
                    }
                }
                //log.debug("Created icon: ", $scope.icon);
            }
        };
    }
    UI.hawtioIcon = hawtioIcon;
    UI._module.directive('hawtioIcon', UI.hawtioIcon);
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="./uiPlugin.ts"/>
var UI;
(function (UI) {
    UI._module.directive('hawtioJsplumb', ["$timeout", "$window", function ($timeout, $window) {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {
                $window.addEventListener("resize", function () {
                    if ($scope.jsPlumb) {
                        $scope.jsPlumb.recalculateOffsets($element);
                        $scope.jsPlumb.repaintEverything();
                    }
                });
                // Whether or not each node in the graph can be dragged around
                var enableDragging = true;
                if (angular.isDefined($attrs['draggable'])) {
                    enableDragging = Core.parseBooleanValue($attrs['draggable']);
                }
                var useLayout = true;
                if (angular.isDefined($attrs['layout'])) {
                    useLayout = Core.parseBooleanValue($attrs['layout']);
                }
                var direction = 'TB';
                if (angular.isDefined($attrs['direction'])) {
                    switch ($attrs['direction']) {
                        case 'down':
                            direction = 'LR';
                            break;
                        default:
                            direction = 'TB';
                    }
                }
                var nodeSep = 50;
                var edgeSep = 10;
                var rankSep = 50;
                if (angular.isDefined($attrs['nodeSep'])) {
                    nodeSep = Core.parseIntValue($attrs['nodeSep']);
                }
                if (angular.isDefined($attrs['edgeSep'])) {
                    edgeSep = Core.parseIntValue($attrs['edgeSep']);
                }
                if (angular.isDefined($attrs['rankSep'])) {
                    rankSep = Core.parseIntValue($attrs['rankSep']);
                }
                var timeout = 100;
                if (angular.isDefined($attrs['timeout'])) {
                    timeout = Core.parseIntValue($attrs['timeout'], "timeout");
                }
                var endpointStyle = ["Dot", { radius: 10, cssClass: 'jsplumb-circle', hoverClass: 'jsplumb-circle-hover' }];
                var labelStyles = ["Label"];
                var arrowStyles = ["Arrow", {
                    location: 1,
                    id: "arrow",
                    length: 8,
                    width: 8,
                    foldback: 0.8
                }];
                var connectorStyle = ["Flowchart", { cornerRadius: 4, gap: 8 }];
                if (angular.isDefined($scope.connectorStyle)) {
                    connectorStyle = $scope.connectorStyle;
                }
                // Given an element, create a node data structure
                function createNode(nodeEl) {
                    var el = $(nodeEl);
                    var id = el.attr('id');
                    var anchors = el.attr('anchors');
                    if (!Core.isBlank(anchors) && (anchors.has("{{") || anchors.has("}}"))) {
                        // we don't want to add this yet...
                        return null;
                    }
                    if (!Core.isBlank(anchors)) {
                        anchors = anchors.split(',').map(function (anchor) {
                            return anchor.trim();
                        });
                    }
                    else {
                        anchors = ["Continuous"];
                    }
                    var node = {
                        id: id,
                        label: 'node ' + id,
                        el: el,
                        width: el.outerWidth(),
                        height: el.outerHeight(),
                        edges: [],
                        connections: [],
                        endpoints: [],
                        anchors: anchors
                    };
                    return node;
                }
                ;
                function createEndpoint(jsPlumb, node) {
                    var options = {
                        isSource: true,
                        isTarget: true,
                        anchor: node.anchors,
                        connector: connectorStyle,
                        maxConnections: -1
                    };
                    if (angular.isFunction($scope.customizeEndpointOptions)) {
                        $scope.customizeEndpointOptions(jsPlumb, node, options);
                    }
                    var endpoint = jsPlumb.addEndpoint(node.el, options);
                    node.endpoints.push(endpoint);
                    //$scope.jsPlumbEndpoints[node.id] = endpoint
                    if (enableDragging) {
                        jsPlumb.draggable(node.el, {
                            containment: $element
                        });
                    }
                }
                ;
                var nodes = [];
                var transitions = [];
                var nodesById = {};
                function gatherElements() {
                    var nodeEls = $element.find('.jsplumb-node');
                    if (nodes.length > 0) {
                    }
                    angular.forEach(nodeEls, function (nodeEl) {
                        if (!nodesById[nodeEl.id]) {
                            var node = createNode(nodeEl);
                            if (node) {
                                nodes.push(node);
                                nodesById[node.id] = node;
                            }
                        }
                    });
                    angular.forEach(nodes, function (sourceNode) {
                        var targets = sourceNode.el.attr('connect-to');
                        if (targets) {
                            targets = targets.split(',');
                            angular.forEach(targets, function (target) {
                                var targetNode = nodesById[target.trim()];
                                if (targetNode) {
                                    var edge = {
                                        source: sourceNode,
                                        target: targetNode
                                    };
                                    transitions.push(edge);
                                    sourceNode.edges.push(edge);
                                    targetNode.edges.push(edge);
                                }
                            });
                        }
                    });
                }
                ;
                $scope.$on('jsplumbDoWhileSuspended', function (event, op) {
                    if ($scope.jsPlumb) {
                        var jsPlumb = $scope.jsPlumb;
                        jsPlumb.doWhileSuspended(function () {
                            UI.log.debug("Suspended jsplumb");
                            $scope.jsPlumb.reset();
                            op();
                            nodes = [];
                            nodesById = {};
                            transitions = [];
                            go();
                        });
                    }
                });
                function go() {
                    if (!$scope.jsPlumb) {
                        $scope.jsPlumb = jsPlumb.getInstance({
                            Container: $element
                        });
                        var defaultOptions = {
                            Anchor: "AutoDefault",
                            Connector: "Flowchart",
                            ConnectorStyle: connectorStyle,
                            DragOptions: { cursor: "pointer", zIndex: 2000 },
                            Endpoint: endpointStyle,
                            PaintStyle: { strokeStyle: "#42a62c", lineWidth: 4 },
                            HoverPaintStyle: { strokeStyle: "#42a62c", lineWidth: 4 },
                            ConnectionOverlays: [
                                arrowStyles,
                                labelStyles
                            ]
                        };
                        if (!enableDragging) {
                            defaultOptions['ConnectionsDetachable'] = false;
                        }
                        if (angular.isFunction($scope.customizeDefaultOptions)) {
                            $scope.customizeDefaultOptions(defaultOptions);
                        }
                        $scope.jsPlumb.importDefaults(defaultOptions);
                    }
                    gatherElements();
                    $scope.jsPlumbNodes = nodes;
                    $scope.jsPlumbNodesById = nodesById;
                    $scope.jsPlumbTransitions = transitions;
                    // First we'll lay out the graph and then later apply jsplumb to all
                    // of the nodes and connections
                    if (useLayout) {
                        $scope.layout = dagre.layout().nodeSep(nodeSep).edgeSep(edgeSep).rankSep(rankSep).rankDir(direction).nodes(nodes).edges(transitions).run();
                    }
                    angular.forEach($scope.jsPlumbNodes, function (node) {
                        if (useLayout) {
                            var divWidth = node.el.width();
                            var divHeight = node.el.height();
                            var y = node.dagre.y - (divHeight / 2);
                            var x = node.dagre.x - (divWidth / 2);
                            node.el.css({ top: y, left: x });
                        }
                        createEndpoint($scope.jsPlumb, node);
                    });
                    angular.forEach($scope.jsPlumbTransitions, function (edge) {
                        var options = {
                            connector: connectorStyle,
                            maxConnections: -1
                        };
                        var params = {
                            source: edge.source.el,
                            target: edge.target.el
                        };
                        if (angular.isFunction($scope.customizeConnectionOptions)) {
                            $scope.customizeConnectionOptions($scope.jsPlumb, edge, params, options);
                        }
                        var connection = $scope.jsPlumb.connect(params, options);
                        edge.source.connections.push(connection);
                        edge.target.connections.push(connection);
                    });
                    $scope.jsPlumb.recalculateOffsets($element);
                    if (!$scope.jsPlumb.isSuspendDrawing()) {
                        $scope.jsPlumb.repaintEverything();
                    }
                    if (angular.isDefined($scope.jsPlumbCallback) && angular.isFunction($scope.jsPlumbCallback)) {
                        $scope.jsPlumbCallback($scope.jsPlumb, $scope.jsPlumbNodes, $scope.jsPlumbNodesById, $scope.jsPlumbTransitions);
                    }
                }
                // Kick off the initial layout of elements in the container
                $timeout(go, timeout);
            }
        };
    }]);
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="./uiPlugin.ts"/>
var UI;
(function (UI) {
    function hawtioList($templateCache, $compile) {
        return {
            restrict: '',
            replace: true,
            templateUrl: UI.templatePath + 'list.html',
            scope: {
                'config': '=hawtioList'
            },
            link: function ($scope, $element, $attr) {
                $scope.rows = [];
                $scope.name = "hawtioListScope";
                if (!$scope.config.selectedItems) {
                    $scope.config.selectedItems = [];
                }
                $scope.$watch('rows', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        $scope.config.selectedItems.length = 0;
                        var selected = $scope.rows.findAll(function (row) {
                            return row.selected;
                        });
                        selected.forEach(function (row) {
                            $scope.config.selectedItems.push(row.entity);
                        });
                    }
                }, true);
                $scope.cellTemplate = $templateCache.get('cellTemplate.html');
                $scope.rowTemplate = $templateCache.get('rowTemplate.html');
                var columnDefs = $scope.config['columnDefs'];
                var fieldName = 'name';
                var displayName = 'Name';
                if (columnDefs && columnDefs.length > 0) {
                    var def = columnDefs.first();
                    fieldName = def['field'] || fieldName;
                    displayName = def['displayName'] || displayName;
                    if (def['cellTemplate']) {
                        $scope.cellTemplate = def['cellTemplate'];
                    }
                }
                var configName = $attr['hawtioList'];
                var dataName = $scope.config['data'];
                if (Core.isBlank(configName) || Core.isBlank(dataName)) {
                    return;
                }
                $scope.listRoot = function () {
                    return $element.find('.list-root');
                };
                $scope.getContents = function (row) {
                    //first make our row
                    var innerScope = $scope.$new();
                    innerScope.row = row;
                    var rowEl = $compile($scope.rowTemplate)(innerScope);
                    //now compile the cell but use the parent scope
                    var innerParentScope = $scope.parentScope.$new();
                    innerParentScope.row = row;
                    innerParentScope.col = {
                        field: fieldName
                    };
                    var cellEl = $compile($scope.cellTemplate)(innerParentScope);
                    $(rowEl).find('.list-row-contents').append(cellEl);
                    return rowEl;
                };
                $scope.setRows = function (data) {
                    $scope.rows = [];
                    var list = $scope.listRoot();
                    list.empty();
                    if (data) {
                        data.forEach(function (row) {
                            var newRow = {
                                entity: row,
                                getProperty: function (name) {
                                    if (!angular.isDefined(name)) {
                                        return null;
                                    }
                                    return row[name];
                                }
                            };
                            list.append($scope.getContents(newRow));
                            $scope.rows.push(newRow);
                        });
                    }
                };
                // find the parent scope that has our configuration
                var parentScope = UI.findParentWith($scope, configName);
                if (parentScope) {
                    $scope.parentScope = parentScope;
                    parentScope.$watch(dataName, $scope.setRows, true);
                }
            }
        };
    }
    UI.hawtioList = hawtioList;
    UI._module.directive('hawtioList', ["$templateCache", "$compile", UI.hawtioList]);
})(UI || (UI = {}));

/// <reference path="uiPlugin.ts"/>
var UI;
(function (UI) {
    var objectView = UI._module.directive("hawtioObject", ["$templateCache", "$interpolate", "$compile", function ($templateCache, $interpolate, $compile) {
        return {
            restrict: "A",
            replace: true,
            templateUrl: UI.templatePath + "object.html",
            scope: {
                "entity": "=?hawtioObject",
                "config": "=?",
                "path": "=?",
                "row": "=?"
            },
            link: function ($scope, $element, $attr) {
                function interpolate(template, path, key, value) {
                    var interpolateFunc = $interpolate(template);
                    if (!key) {
                        return interpolateFunc({
                            data: value,
                            path: path
                        });
                    }
                    else {
                        return interpolateFunc({
                            key: key.titleize(),
                            data: value,
                            path: path
                        });
                    }
                }
                function getEntityConfig(path, config) {
                    var answer = undefined;
                    var properties = Core.pathGet(config, ['properties']);
                    if (!answer && properties) {
                        angular.forEach(properties, function (config, propertySelector) {
                            var regex = new RegExp(propertySelector);
                            if (regex.test(path)) {
                                // log.debug("Matched selector: ", propertySelector, " for path: ", path);
                                if (answer && !answer.override && !config.override) {
                                    // log.debug("Merged config");
                                    answer = _.merge(answer, config);
                                }
                                else {
                                    // log.debug("Set config");
                                    answer = _.clone(config, true);
                                }
                            }
                        });
                    }
                    // log.debug("Answer for path: ", path, " : ", answer);
                    return answer;
                }
                function getTemplate(path, config, def) {
                    var answer = def;
                    var config = getEntityConfig(path, config);
                    if (config && config.template) {
                        answer = config.template;
                    }
                    return answer;
                }
                function compile(template, path, key, value, config) {
                    var config = getEntityConfig(path, config);
                    if (config && config.hidden) {
                        return;
                    }
                    var interpolated = null;
                    // avoid interpolating custom templates
                    if (config && config.template) {
                        interpolated = config.template;
                    }
                    else {
                        interpolated = interpolate(template, path, key, value);
                    }
                    var scope = $scope.$new();
                    scope.row = $scope.row;
                    scope.entityConfig = config;
                    scope.data = value;
                    scope.path = path;
                    return $compile(interpolated)(scope);
                }
                function renderPrimitiveValue(path, entity, config) {
                    var template = getTemplate(path, config, $templateCache.get('primitiveValueTemplate.html'));
                    return compile(template, path, undefined, entity, config);
                }
                function renderDateValue(path, entity, config) {
                    var template = getTemplate(path, config, $templateCache.get('dateValueTemplate.html'));
                    return compile(template, path, undefined, entity, config);
                }
                function renderObjectValue(path, entity, config) {
                    var isArray = false;
                    var el = undefined;
                    angular.forEach(entity, function (value, key) {
                        if (angular.isNumber(key) && "length" in entity) {
                            isArray = true;
                        }
                        if (isArray) {
                            return;
                        }
                        if (key.startsWith("$")) {
                            return;
                        }
                        if (!el) {
                            el = angular.element('<span></span>');
                        }
                        if (angular.isArray(value)) {
                            el.append(renderArrayAttribute(path + '/' + key, key, value, config));
                        }
                        else if (angular.isObject(value)) {
                            if (_.size(value) === 0) {
                                el.append(renderPrimitiveAttribute(path + '/' + key, key, 'empty', config));
                            }
                            else {
                                el.append(renderObjectAttribute(path + '/' + key, key, value, config));
                            }
                        }
                        else if (StringHelpers.isDate(value)) {
                            el.append(renderDateAttribute(path + '/' + key, key, Date.create(value), config));
                        }
                        else {
                            el.append(renderPrimitiveAttribute(path + '/' + key, key, value, config));
                        }
                    });
                    if (el) {
                        return el.children();
                    }
                    else {
                        return el;
                    }
                }
                function getColumnHeaders(path, entity, config) {
                    var answer = undefined;
                    if (!entity) {
                        return answer;
                    }
                    var hasPrimitive = false;
                    entity.forEach(function (item) {
                        if (!hasPrimitive && angular.isObject(item)) {
                            if (!answer) {
                                answer = [];
                            }
                            answer = _.keys(item).filter(function (key) {
                                return !angular.isFunction(item[key]);
                            }).filter(function (key) {
                                var conf = getEntityConfig(path + '/' + key, config);
                                if (conf && conf.hidden) {
                                    return false;
                                }
                                return true;
                            }).union(answer);
                        }
                        else {
                            answer = undefined;
                            hasPrimitive = true;
                        }
                    });
                    if (answer) {
                        answer = answer.exclude(function (item) {
                            return ("" + item).startsWith('$');
                        });
                    }
                    //log.debug("Column headers: ", answer);
                    return answer;
                }
                function renderTable(template, path, key, value, headers, config) {
                    var el = angular.element(interpolate(template, path, key, value));
                    var thead = el.find('thead');
                    var tbody = el.find('tbody');
                    var headerTemplate = $templateCache.get('headerTemplate.html');
                    var cellTemplate = $templateCache.get('cellTemplate.html');
                    var rowTemplate = $templateCache.get('rowTemplate.html');
                    var headerRow = angular.element(interpolate(rowTemplate, path, undefined, undefined));
                    headers.forEach(function (header) {
                        headerRow.append(interpolate(headerTemplate, path + '/' + header, header, undefined));
                    });
                    thead.append(headerRow);
                    value.forEach(function (item, index) {
                        var tr = angular.element(interpolate(rowTemplate, path + '/' + index, undefined, undefined));
                        headers.forEach(function (header) {
                            var td = angular.element(interpolate(cellTemplate, path + '/' + index + '/' + header, undefined, undefined));
                            td.append(renderThing(path + '/' + index + '/' + header, item[header], config));
                            tr.append(td);
                        });
                        tbody.append(tr);
                    });
                    return el;
                }
                function renderArrayValue(path, entity, config) {
                    var headers = getColumnHeaders(path, entity, config);
                    if (!headers) {
                        var template = getTemplate(path, config, $templateCache.get('arrayValueListTemplate.html'));
                        return compile(template, path, undefined, entity, config);
                    }
                    else {
                        var template = getTemplate(path, config, $templateCache.get('arrayValueTableTemplate.html'));
                        return renderTable(template, path, undefined, entity, headers, config);
                    }
                }
                function renderPrimitiveAttribute(path, key, value, config) {
                    var template = getTemplate(path, config, $templateCache.get('primitiveAttributeTemplate.html'));
                    return compile(template, path, key, value, config);
                }
                function renderDateAttribute(path, key, value, config) {
                    var template = getTemplate(path, config, $templateCache.get('dateAttributeTemplate.html'));
                    return compile(template, path, key, value, config);
                }
                function renderObjectAttribute(path, key, value, config) {
                    var template = getTemplate(path, config, $templateCache.get('objectAttributeTemplate.html'));
                    return compile(template, path, key, value, config);
                }
                function renderArrayAttribute(path, key, value, config) {
                    var headers = getColumnHeaders(path, value, config);
                    if (!headers) {
                        var template = getTemplate(path, config, $templateCache.get('arrayAttributeListTemplate.html'));
                        return compile(template, path, key, value, config);
                    }
                    else {
                        var template = getTemplate(path, config, $templateCache.get('arrayAttributeTableTemplate.html'));
                        return renderTable(template, path, key, value, headers, config);
                    }
                }
                function renderThing(path, entity, config) {
                    if (angular.isArray(entity)) {
                        return renderArrayValue(path, entity, config);
                    }
                    else if (angular.isObject(entity)) {
                        return renderObjectValue(path, entity, config);
                    }
                    else if (StringHelpers.isDate(entity)) {
                        return renderDateValue(path, Date.create(entity), config);
                    }
                    else {
                        return renderPrimitiveValue(path, entity, config);
                    }
                }
                $scope.$watch('entity', function (entity) {
                    if (!entity) {
                        $element.empty();
                        return;
                    }
                    if (!$scope.path) {
                        // log.debug("Setting entity: ", $scope.entity, " as the root element");
                        $scope.path = "";
                    }
                    /*
                    if (angular.isDefined($scope.$index)) {
                      log.debug("$scope.$index: ", $scope.$index);
                    }
                    */
                    if (!angular.isDefined($scope.row)) {
                        // log.debug("Setting entity: ", entity);
                        $scope.row = {
                            entity: entity
                        };
                    }
                    $element.html(renderThing($scope.path, entity, $scope.config));
                }, true);
            }
        };
    }]);
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="./uiPlugin.ts"/>
var UI;
(function (UI) {
    function hawtioPane() {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: UI.templatePath + 'pane.html',
            scope: {
                position: '@',
                width: '@',
                header: '@'
            },
            controller: ["$scope", "$element", "$attrs", "$transclude", "$document", "$timeout", "$compile", "$templateCache", "$window", function ($scope, $element, $attrs, $transclude, $document, $timeout, $compile, $templateCache, $window) {
                $scope.moving = false;
                $transclude(function (clone) {
                    $element.find(".pane-content").append(clone);
                    if (Core.isBlank($scope.header)) {
                        return;
                    }
                    var headerTemplate = $templateCache.get($scope.header);
                    var wrapper = $element.find(".pane-header-wrapper");
                    wrapper.html($compile(headerTemplate)($scope));
                    $timeout(function () {
                        $element.find(".pane-viewport").css("top", wrapper.height());
                    }, 500);
                });
                $scope.setViewportTop = function () {
                    var wrapper = $element.find(".pane-header-wrapper");
                    $timeout(function () {
                        $element.find(".pane-viewport").css("top", wrapper.height());
                    }, 10);
                };
                $scope.setWidth = function (width) {
                    if (width < 6) {
                        return;
                    }
                    $element.width(width);
                    $element.parent().css($scope.padding, $element.width() + "px");
                    $scope.setViewportTop();
                };
                $scope.open = function () {
                    $scope.setWidth($scope.width);
                };
                $scope.close = function () {
                    $scope.width = $element.width();
                    $scope.setWidth(6);
                };
                $scope.$on('pane.close', $scope.close);
                $scope.$on('pane.open', $scope.open);
                $scope.toggle = function () {
                    if ($scope.moving) {
                        return;
                    }
                    if ($element.width() > 6) {
                        $scope.close();
                    }
                    else {
                        $scope.open();
                    }
                };
                $scope.startMoving = function ($event) {
                    $event.stopPropagation();
                    $event.preventDefault();
                    $event.stopImmediatePropagation();
                    $document.on("mouseup.hawtio-pane", function ($event) {
                        $timeout(function () {
                            $scope.moving = false;
                        }, 250);
                        $event.stopPropagation();
                        $event.preventDefault();
                        $event.stopImmediatePropagation();
                        $document.off(".hawtio-pane");
                        Core.$apply($scope);
                    });
                    $document.on("mousemove.hawtio-pane", function ($event) {
                        $scope.moving = true;
                        $event.stopPropagation();
                        $event.preventDefault();
                        $event.stopImmediatePropagation();
                        if ($scope.position === 'left') {
                            $scope.setWidth($event.pageX + 2);
                        }
                        else {
                            $scope.setWidth($window.innerWidth - $event.pageX + 2);
                        }
                        Core.$apply($scope);
                    });
                };
            }],
            link: function ($scope, $element, $attr) {
                var parent = $element.parent();
                var position = "left";
                if ($scope.position) {
                    position = $scope.position;
                }
                $element.addClass(position);
                var width = $element.width();
                var padding = "padding-" + position;
                $scope.padding = padding;
                var original = parent.css(padding);
                parent.css(padding, width + "px");
                $scope.$on('$destroy', function () {
                    parent.css(padding, original);
                });
            }
        };
    }
    UI.hawtioPane = hawtioPane;
    UI._module.directive('hawtioPane', UI.hawtioPane);
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="./uiPlugin.ts"/>
var UI;
(function (UI) {
    UI._module.directive('hawtioMessagePanel', function () {
        return new UI.MessagePanel();
    });
    var MessagePanel = (function () {
        function MessagePanel() {
            this.restrict = 'A';
            this.link = function ($scope, $element, $attrs) {
                var height = "100%";
                if ('hawtioMessagePanel' in $attrs) {
                    var wantedHeight = $attrs['hawtioMessagePanel'];
                    if (wantedHeight && !wantedHeight.isBlank()) {
                        height = wantedHeight;
                    }
                }
                var speed = "1s";
                if ('speed' in $attrs) {
                    var wantedSpeed = $attrs['speed'];
                    if (speed && !speed.isBlank()) {
                        speed = wantedSpeed;
                    }
                }
                $element.css({
                    position: 'absolute',
                    bottom: 0,
                    height: 0,
                    'min-height': 0,
                    transition: 'all ' + speed + ' ease-in-out'
                });
                $element.parent().mouseover(function () {
                    $element.css({
                        height: height,
                        'min-height': 'auto'
                    });
                });
                $element.parent().mouseout(function () {
                    $element.css({
                        height: 0,
                        'min-height': 0
                    });
                });
            };
        }
        return MessagePanel;
    })();
    UI.MessagePanel = MessagePanel;
    UI._module.directive('hawtioInfoPanel', function () {
        return new UI.InfoPanel();
    });
    var InfoPanel = (function () {
        function InfoPanel() {
            this.restrict = 'A';
            this.link = function ($scope, $element, $attrs) {
                var validDirections = {
                    'left': {
                        side: 'right',
                        out: 'width'
                    },
                    'right': {
                        side: 'left',
                        out: 'width'
                    },
                    'up': {
                        side: 'bottom',
                        out: 'height'
                    },
                    'down': {
                        side: 'top',
                        out: 'height'
                    }
                };
                var direction = "right";
                if ('hawtioInfoPanel' in $attrs) {
                    var wantedDirection = $attrs['hawtioInfoPanel'];
                    if (wantedDirection && !wantedDirection.isBlank()) {
                        if (_.keys(validDirections).any(wantedDirection)) {
                            direction = wantedDirection;
                        }
                    }
                }
                var speed = "1s";
                if ('speed' in $attrs) {
                    var wantedSpeed = $attrs['speed'];
                    if (speed && !speed.isBlank()) {
                        speed = wantedSpeed;
                    }
                }
                var toggle = "open";
                if ('toggle' in $attrs) {
                    var wantedToggle = $attrs['toggle'];
                    if (toggle && !toggle.isBlank()) {
                        toggle = wantedToggle;
                    }
                }
                var initialCss = {
                    position: 'absolute',
                    transition: 'all ' + speed + ' ease-in-out'
                };
                var openCss = {};
                openCss[validDirections[direction]['out']] = '100%';
                var closedCss = {};
                closedCss[validDirections[direction]['out']] = 0;
                initialCss[validDirections[direction]['side']] = 0;
                initialCss[validDirections[direction]['out']] = 0;
                $element.css(initialCss);
                $scope.$watch(toggle, function (newValue, oldValue) {
                    if (Core.parseBooleanValue(newValue)) {
                        $element.css(openCss);
                    }
                    else {
                        $element.css(closedCss);
                    }
                });
                $element.click(function () {
                    $scope[toggle] = false;
                    Core.$apply($scope);
                });
            };
        }
        return InfoPanel;
    })();
    UI.InfoPanel = InfoPanel;
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="./uiPlugin.ts"/>
var UI;
(function (UI) {
    UI._module.directive('hawtioRow', function () {
        return new UI.DivRow();
    });
    // expand the element to accomodate a group of elements to prevent them from wrapping
    var DivRow = (function () {
        function DivRow() {
            this.restrict = 'A';
            this.link = function ($scope, $element, $attrs) {
                $element.get(0).addEventListener("DOMNodeInserted", function () {
                    var targets = $element.children();
                    var width = 0;
                    angular.forEach(targets, function (target) {
                        var el = angular.element(target);
                        switch (el.css('display')) {
                            case 'none':
                                break;
                            default:
                                width = width + el.outerWidth(true) + 5;
                        }
                    });
                    $element.width(width);
                });
            };
        }
        return DivRow;
    })();
    UI.DivRow = DivRow;
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="./uiPlugin.ts"/>
var UI;
(function (UI) {
    UI._module.directive('hawtioSlideout', function () {
        return new UI.SlideOut();
    });
    var SlideOut = (function () {
        function SlideOut() {
            this.restrict = 'A';
            this.replace = true;
            this.transclude = true;
            this.templateUrl = UI.templatePath + 'slideout.html';
            this.scope = {
                show: '=hawtioSlideout',
                direction: '@',
                top: '@',
                height: '@',
                title: '@'
            };
            this.controller = ["$scope", "$element", "$attrs", "$transclude", "$compile", function ($scope, $element, $attrs, $transclude, $compile) {
                $scope.clone = null;
                $transclude(function (clone) {
                    $scope.clone = $(clone).filter('.dialog-body');
                });
                UI.observe($scope, $attrs, 'direction', 'right');
                UI.observe($scope, $attrs, 'top', '10%', function (value) {
                    $element.css('top', value);
                });
                UI.observe($scope, $attrs, 'height', '80%', function (value) {
                    $element.css('height', value);
                });
                UI.observe($scope, $attrs, 'title', '');
                $scope.$watch('show', function () {
                    if ($scope.show) {
                        $scope.body = $element.find('.slideout-body');
                        $scope.body.html($compile($scope.clone.html())($scope.$parent));
                    }
                });
                $scope.hidePanel = function ($event) {
                    UI.log.debug("Event: ", $event);
                    $scope.show = false;
                };
            }];
            this.link = function ($scope, $element, $attrs) {
                $scope.$watch('show', function () {
                    if ($scope.show) {
                        $element.addClass('out');
                        $element.focus();
                    }
                    else {
                        $element.removeClass('out');
                    }
                });
            };
        }
        return SlideOut;
    })();
    UI.SlideOut = SlideOut;
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="./uiPlugin.ts"/>
var UI;
(function (UI) {
    UI._module.directive('hawtioPager', function () {
        return new UI.TablePager();
    });
    var TablePager = (function () {
        function TablePager() {
            var _this = this;
            this.restrict = 'A';
            this.scope = true;
            this.templateUrl = UI.templatePath + 'tablePager.html';
            this.$scope = null;
            this.element = null;
            this.attrs = null;
            this.tableName = null;
            this.setRowIndexName = null;
            this.rowIndexName = null;
            // necessary to ensure 'this' is this object <sigh>
            this.link = function (scope, element, attrs) {
                return _this.doLink(scope, element, attrs);
            };
        }
        TablePager.prototype.doLink = function (scope, element, attrs) {
            var _this = this;
            this.$scope = scope;
            this.element = element;
            this.attrs = attrs;
            this.tableName = attrs["hawtioPager"] || attrs["array"] || "data";
            this.setRowIndexName = attrs["onIndexChange"] || "onIndexChange";
            this.rowIndexName = attrs["rowIndex"] || "rowIndex";
            scope.first = function () {
                _this.goToIndex(0);
            };
            scope.last = function () {
                _this.goToIndex(scope.tableLength() - 1);
            };
            scope.previous = function () {
                _this.goToIndex(scope.rowIndex() - 1);
            };
            scope.next = function () {
                _this.goToIndex(scope.rowIndex() + 1);
            };
            scope.isEmptyOrFirst = function () {
                var idx = scope.rowIndex();
                var length = scope.tableLength();
                return length <= 0 || idx <= 0;
            };
            scope.isEmptyOrLast = function () {
                var idx = scope.rowIndex();
                var length = scope.tableLength();
                return length < 1 || idx + 1 >= length;
            };
            scope.rowIndex = function () {
                return Core.pathGet(scope.$parent, _this.rowIndexName.split('.'));
            };
            scope.tableLength = function () {
                var data = _this.tableData();
                return data ? data.length : 0;
            };
        };
        TablePager.prototype.tableData = function () {
            return Core.pathGet(this.$scope.$parent, this.tableName.split('.')) || [];
        };
        TablePager.prototype.goToIndex = function (idx) {
            var name = this.setRowIndexName;
            var fn = this.$scope[name];
            if (angular.isFunction(fn)) {
                fn(idx);
            }
            else {
                console.log("No function defined in scope for " + name + " but was " + fn);
                this.$scope[this.rowIndexName] = idx;
            }
        };
        return TablePager;
    })();
    UI.TablePager = TablePager;
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="uiPlugin.ts"/>
var UI;
(function (UI) {
    UI.hawtioTagFilter = UI._module.directive("hawtioTagFilter", [function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: UI.templatePath + 'tagFilter.html',
            scope: {
                selected: '=',
                tags: '=',
                collection: '=?',
                collectionProperty: '@',
                saveAs: '@'
            },
            controller: ["$scope", "localStorage", "$location", function ($scope, localStorage, $location) {
                SelectionHelpers.decorate($scope);
                if (!Core.isBlank($scope.saveAs)) {
                    var search = $location.search();
                    if ($scope.saveAs in search) {
                        $scope.selected.add(angular.fromJson(search[$scope.saveAs]));
                    }
                    else if ($scope.saveAs in localStorage) {
                        $scope.selected.add(angular.fromJson(localStorage[$scope.saveAs]));
                    }
                }
                function maybeFilterVisibleTags() {
                    if ($scope.collection && $scope.collectionProperty) {
                        if (!$scope.selected.length) {
                            $scope.visibleTags = $scope.tags;
                            $scope.filteredCollection = $scope.collection;
                        }
                        else {
                            filterVisibleTags();
                        }
                        $scope.visibleTags = $scope.visibleTags.map(function (t) {
                            return {
                                id: t,
                                count: $scope.filteredCollection.map(function (c) {
                                    return c[$scope.collectionProperty];
                                }).reduce(function (count, c) {
                                    if (c.any(t)) {
                                        return count + 1;
                                    }
                                    return count;
                                }, 0)
                            };
                        });
                    }
                    else {
                        $scope.visibleTags = $scope.tags;
                    }
                }
                function filterVisibleTags() {
                    $scope.filteredCollection = $scope.collection.filter(function (c) {
                        return SelectionHelpers.filterByGroup($scope.selected, c[$scope.collectionProperty]);
                    });
                    $scope.visibleTags = [];
                    $scope.filteredCollection.forEach(function (c) {
                        $scope.visibleTags = $scope.visibleTags.union(c[$scope.collectionProperty]);
                    });
                }
                $scope.$watch('tags', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        SelectionHelpers.syncGroupSelection($scope.selected, $scope.tags);
                        maybeFilterVisibleTags();
                    }
                });
                $scope.$watch('selected', function (newValue, oldValue) {
                    if (!Core.isBlank($scope.saveAs)) {
                        var saveAs = angular.toJson($scope.selected);
                        localStorage[$scope.saveAs] = saveAs;
                        $location.search($scope.saveAs, saveAs);
                    }
                    maybeFilterVisibleTags();
                }, true);
            }]
        };
    }]);
})(UI || (UI = {}));

/// <reference path="uiPlugin.ts"/>
var UI;
(function (UI) {
    UI.hawtioTagList = UI._module.directive("hawtioTagList", ['$interpolate', '$compile', function ($interpolate, $compile) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                ngModel: '=?',
                property: '@',
                onChange: '&'
            },
            link: function (scope, $element, attr) {
                if (!scope.ngModel || !scope.property || !scope.ngModel[scope.property]) {
                    // bail out
                    return;
                }
                scope.collection = scope.ngModel[scope.property];
                scope.removeTag = function (tag) {
                    //log.debug("Removing: ", tag);
                    scope.ngModel[scope.property].remove(tag);
                    if (scope.onChange) {
                        scope.$eval(scope.onChange);
                    }
                };
                scope.$watch('collection', function (newValue, oldValue) {
                    if (!scope.ngModel || !scope.property || !scope.ngModel[scope.property]) {
                        // bail out
                        return;
                    }
                    var tags = scope.ngModel[scope.property];
                    //log.debug("Collection changed: ", tags);
                    var tmp = angular.element("<div></div>");
                    tags.forEach(function (tag) {
                        var func = $interpolate('<span class="badge badge-success mouse-pointer">{{tag}} <i class="fa fa-remove" ng-click="removeTag(\'{{tag}}\')"></i></span>&nbsp;');
                        tmp.append(func({
                            tag: tag
                        }));
                    });
                    $element.html($compile(tmp.children())(scope));
                }, true);
            }
        };
    }]);
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="./uiPlugin.ts"/>
var UI;
(function (UI) {
    function TemplatePopover($templateCache, $compile, $document) {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attr) {
                var title = UI.getIfSet('title', $attr, undefined);
                var trigger = UI.getIfSet('trigger', $attr, 'hover');
                var html = true;
                var contentTemplate = UI.getIfSet('content', $attr, 'popoverTemplate');
                var placement = UI.getIfSet('placement', $attr, 'auto');
                var delay = UI.getIfSet('delay', $attr, '100');
                var container = UI.getIfSet('container', $attr, 'body');
                var selector = UI.getIfSet('selector', $attr, 'false');
                if (container === 'false') {
                    container = false;
                }
                if (selector === 'false') {
                    selector = false;
                }
                var template = $templateCache.get(contentTemplate);
                if (!template) {
                    return;
                }
                $element.on('$destroy', function () {
                    $element.popover('destroy');
                });
                $element.popover({
                    title: title,
                    trigger: trigger,
                    html: html,
                    content: function () {
                        var res = $compile(template)($scope);
                        Core.$digest($scope);
                        return res;
                    },
                    delay: delay,
                    container: container,
                    selector: selector,
                    placement: function (tip, element) {
                        if (placement !== 'auto') {
                            return placement;
                        }
                        var el = $element;
                        var offset = el.offset();
                        /* not sure on auto bottom/top
            
                        var elVerticalCenter = offset['top'] + (el.outerHeight() / 2);
                        if (elVerticalCenter < 300) {
                          return 'bottom';
                        }
            
                        var height = window.innerHeight;
                        if (elVerticalCenter > window.innerHeight - 300) {
                          return 'top';
                        }
                        */
                        var width = $document.innerWidth();
                        var elHorizontalCenter = offset['left'] + (el.outerWidth() / 2);
                        var midpoint = width / 2;
                        if (elHorizontalCenter < midpoint) {
                            return 'right';
                        }
                        else {
                            return 'left';
                        }
                    }
                });
            }
        };
    }
    UI.TemplatePopover = TemplatePopover;
    UI._module.directive('hawtioTemplatePopover', ["$templateCache", "$compile", "$document", UI.TemplatePopover]);
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="uiPlugin.ts"/>
/// <reference path="dropDown.ts"/>
/// <reference path="../../includes.ts"/>
var UI;
(function (UI) {
    UI._module.controller("UI.UITestController2", ["$scope", "$templateCache", function ($scope, $templateCache) {
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
    UI._module.controller("UI.UITestController1", ["$scope", "$templateCache", function ($scope, $templateCache) {
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
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="./uiPlugin.ts"/>
var UI;
(function (UI) {
    function HawtioTocDisplay(marked, $location, $anchorScroll, $compile) {
        var log = Logger.get("UI");
        return {
            restrict: 'A',
            scope: {
                getContents: '&'
            },
            controller: ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {
                $scope.remaining = -1;
                $scope.render = false;
                $scope.chapters = [];
                $scope.addChapter = function (item) {
                    console.log("Adding: ", item);
                    $scope.chapters.push(item);
                    if (!angular.isDefined(item['text'])) {
                        $scope.fetchItemContent(item);
                    }
                };
                $scope.getTarget = function (id) {
                    if (!id) {
                        return '';
                    }
                    return id.replace(".", "_");
                };
                $scope.getFilename = function (href, ext) {
                    var filename = href.split('/').last();
                    if (ext && !filename.endsWith(ext)) {
                        filename = filename + '.' + ext;
                    }
                    return filename;
                };
                $scope.$watch('remaining', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        var renderIfPageLoadFails = false;
                        if (newValue === 0 || renderIfPageLoadFails) {
                            $scope.render = true;
                        }
                    }
                });
                $scope.fetchItemContent = function (item) {
                    var me = $scope;
                    $scope.$eval(function (parent) {
                        parent.getContents({
                            filename: item['filename'],
                            cb: function (data) {
                                if (data) {
                                    if (item['filename'].endsWith(".md")) {
                                        item['text'] = marked(data);
                                    }
                                    else {
                                        item['text'] = data;
                                    }
                                    $scope.remaining--;
                                    Core.$apply(me);
                                }
                            }
                        });
                    });
                };
            }],
            link: function ($scope, $element, $attrs) {
                var offsetTop = 0;
                var logbar = $('.logbar');
                var contentDiv = $("#toc-content");
                if (logbar.length) {
                    offsetTop = logbar.height() + logbar.offset().top;
                }
                else if (contentDiv.length) {
                    var offsetContentDiv = contentDiv.offset();
                    if (offsetContentDiv) {
                        offsetTop = offsetContentDiv.top;
                    }
                }
                if (!offsetTop) {
                    // set to a decent guestimate
                    offsetTop = 90;
                }
                var previousHtml = null;
                var html = $element;
                if (!contentDiv || !contentDiv.length) {
                    contentDiv = $element;
                }
                var ownerScope = $scope.$parent || $scope;
                var scrollDuration = 1000;
                var linkFilter = $attrs["linkFilter"];
                var htmlName = $attrs["html"];
                if (htmlName) {
                    ownerScope.$watch(htmlName, function () {
                        var htmlText = ownerScope[htmlName];
                        if (htmlText && htmlText !== previousHtml) {
                            previousHtml = htmlText;
                            var markup = $compile(htmlText)(ownerScope);
                            $element.children().remove();
                            $element.append(markup);
                            loadChapters();
                        }
                    });
                }
                else {
                    loadChapters();
                }
                // make the link active for the first panel on the view
                $(window).scroll(setFirstChapterActive);
                function setFirstChapterActive() {
                    // lets find the first panel which is visible...
                    var cutoff = $(window).scrollTop();
                    $element.find("li a").removeClass("active");
                    $('.panel-body').each(function () {
                        var offset = $(this).offset();
                        if (offset && offset.top >= cutoff) {
                            // lets make the related TOC link active
                            var id = $(this).attr("id");
                            if (id) {
                                var link = html.find("a[chapter-id='" + id + "']");
                                link.addClass("active");
                                // stop iterating and just make first one active
                                return false;
                            }
                        }
                    });
                }
                function findLinks() {
                    var answer = html.find('a');
                    if (linkFilter) {
                        answer = answer.filter(linkFilter);
                    }
                    return answer;
                }
                function loadChapters() {
                    if (!html.get(0).id) {
                        html.get(0).id = 'toc';
                    }
                    $scope.tocId = '#' + html.get(0).id;
                    $scope.remaining = findLinks().length;
                    findLinks().each(function (index, a) {
                        log.debug("Found: ", a);
                        var filename = $scope.getFilename(a.href, a.getAttribute('file-extension'));
                        var item = {
                            filename: filename,
                            title: a.textContent,
                            link: a
                        };
                        $scope.addChapter(item);
                    });
                    // TODO this doesn't seem to have any effect ;)
                    setTimeout(function () {
                        setFirstChapterActive();
                    }, 100);
                }
                $scope.$watch('render', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        if (newValue) {
                            if (!contentDiv.next('.hawtio-toc').length) {
                                var div = $('<div class="hawtio-toc"></div>');
                                div.appendTo(contentDiv);
                                var selectedChapter = $location.search()["chapter"];
                                // lets load the chapter panels
                                $scope.chapters.forEach(function (chapter, index) {
                                    log.debug("index:", index);
                                    var panel = $('<div></div>');
                                    var panelHeader = null;
                                    var chapterId = $scope.getTarget(chapter['filename']);
                                    var link = chapter["link"];
                                    if (link) {
                                        link.setAttribute("chapter-id", chapterId);
                                    }
                                    if (index > 0) {
                                        panelHeader = $('<div class="panel-title"><a class="toc-back" href="">Back to Top</a></div>');
                                    }
                                    var panelBody = $('<div class="panel-body" id="' + chapterId + '">' + chapter['text'] + '</div>');
                                    if (panelHeader) {
                                        panel.append(panelHeader).append($compile(panelBody)($scope));
                                    }
                                    else {
                                        panel.append($compile(panelBody)($scope));
                                    }
                                    panel.hide().appendTo(div).fadeIn(1000);
                                    if (chapterId === selectedChapter) {
                                        // lets scroll on startup to allow for bookmarking
                                        scrollToChapter(chapterId);
                                    }
                                });
                                var pageTop = contentDiv.offset().top - offsetTop;
                                div.find('a.toc-back').each(function (index, a) {
                                    $(a).click(function (e) {
                                        e.preventDefault();
                                        $('body,html').animate({
                                            scrollTop: pageTop
                                        }, 2000);
                                    });
                                });
                                // handle clicking links in the TOC
                                findLinks().each(function (index, a) {
                                    var href = a.href;
                                    var filename = $scope.getFilename(href, a.getAttribute('file-extension'));
                                    $(a).click(function (e) {
                                        log.debug("Clicked: ", e);
                                        e.preventDefault();
                                        var chapterId = $scope.getTarget(filename);
                                        $location.search("chapter", chapterId);
                                        Core.$apply(ownerScope);
                                        scrollToChapter(chapterId);
                                        return true;
                                    });
                                });
                            }
                        }
                    }
                });
                // watch for back / forward / url changes
                ownerScope.$on("$locationChangeSuccess", function (event, current, previous) {
                    // lets do this asynchronously to avoid Error: $digest already in progress
                    setTimeout(function () {
                        // lets check if the chapter selection has changed
                        var currentChapter = $location.search()["chapter"];
                        scrollToChapter(currentChapter);
                    }, 50);
                });
                /**
                 * Lets scroll to the given chapter ID
                 *
                 * @param chapterId
                 */
                function scrollToChapter(chapterId) {
                    log.debug("selected chapter changed: " + chapterId);
                    if (chapterId) {
                        var target = '#' + chapterId;
                        var top = 0;
                        var targetElements = $(target);
                        if (targetElements.length) {
                            var offset = targetElements.offset();
                            if (offset) {
                                top = offset.top - offsetTop;
                            }
                            $('body,html').animate({
                                scrollTop: top
                            }, scrollDuration);
                        }
                    }
                }
            }
        };
    }
    UI.HawtioTocDisplay = HawtioTocDisplay;
    UI._module.directive('hawtioTocDisplay', ["marked", "$location", "$anchorScroll", "$compile", UI.HawtioTocDisplay]);
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="./uiPlugin.ts"/>
var UI;
(function (UI) {
    UI._module.directive('hawtioViewport', function () {
        return new UI.ViewportHeight();
    });
    var ViewportHeight = (function () {
        function ViewportHeight() {
            this.restrict = 'A';
            this.link = function ($scope, $element, $attrs) {
                var lastHeight = 0;
                var resizeFunc = function () {
                    var neighbor = angular.element($attrs['hawtioViewport']);
                    var container = angular.element($attrs['containingDiv']);
                    var start = neighbor.position().top + neighbor.height();
                    var myHeight = container.height() - start;
                    if (angular.isDefined($attrs['heightAdjust'])) {
                        var heightAdjust = $attrs['heightAdjust'].toNumber();
                    }
                    myHeight = myHeight + heightAdjust;
                    $element.css({
                        height: myHeight,
                        'min-height': myHeight
                    });
                    if (lastHeight !== myHeight) {
                        lastHeight = myHeight;
                        $element.trigger('resize');
                    }
                };
                resizeFunc();
                $scope.$watch(resizeFunc);
                $().resize(function () {
                    resizeFunc();
                    Core.$apply($scope);
                    return false;
                });
            };
        }
        return ViewportHeight;
    })();
    UI.ViewportHeight = ViewportHeight;
    UI._module.directive('hawtioHorizontalViewport', function () {
        return new UI.HorizontalViewport();
    });
    var HorizontalViewport = (function () {
        function HorizontalViewport() {
            this.restrict = 'A';
            this.link = function ($scope, $element, $attrs) {
                var adjustParent = angular.isDefined($attrs['adjustParent']) && Core.parseBooleanValue($attrs['adjustParent']);
                $element.get(0).addEventListener("DOMNodeInserted", function () {
                    var canvas = $element.children();
                    $element.height(canvas.outerHeight(true));
                    if (adjustParent) {
                        $element.parent().height($element.outerHeight(true) + UI.getScrollbarWidth());
                    }
                });
            };
        }
        return HorizontalViewport;
    })();
    UI.HorizontalViewport = HorizontalViewport;
})(UI || (UI = {}));

/**
 * @module UI
 */
/// <reference path="./uiPlugin.ts"/>
var UI;
(function (UI) {
    UI._module.directive('zeroClipboard', ["$parse", function ($parse) {
        return UI.ZeroClipboardDirective($parse);
    }]);
    function ZeroClipboardDirective($parse) {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attr) {
                var clip = new ZeroClipboard($element.get(0), {
                    moviePath: "img/ZeroClipboard.swf"
                });
                clip.on('complete', function (client, args) {
                    if (args.text && angular.isString(args.text)) {
                        Core.notification('info', "Copied text to clipboard: " + args.text.truncate(20));
                    }
                    Core.$apply($scope);
                });
                if ('useCallback' in $attr) {
                    var func = $parse($attr['useCallback']);
                    if (func) {
                        func($scope, { clip: clip });
                    }
                }
            }
        };
    }
    UI.ZeroClipboardDirective = ZeroClipboardDirective;
})(UI || (UI = {}));

angular.module("hawtio-ui-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("plugins/datatable/html/test.html","<div ng-controller=\"DataTable.SimpleTableTestController\">\n  <div class=\"row\">\n    <div class=\"section-header\">\n\n      <div class=\"section-filter\">\n        <input type=\"text\" class=\"search-query\" placeholder=\"Filter...\" ng-model=\"mygrid.filterOptions.filterText\">\n        <i class=\"fa fa-remove clickable\" title=\"Clear filter\" ng-click=\"mygrid.filterOptions.filterText = \'\'\"></i>\n      </div>\n\n    </div>\n  </div>\n\n  <h3>hawtio-simple-table example</h3>\n\n  <table class=\"table table-striped\" hawtio-simple-table=\"mygrid\"></table>\n\n  <div class=\"row\">\n    <p>Selected folks:</p>\n    <ul>\n      <li ng-repeat=\"person in selectedItems\">{{person.name}}</li>\n    </ul>\n\n    <p>\n       <a class=\"btn\" href=\"#/datatable/test?multi={{!mygrid.multiSelect}}\">multi select is: {{mygrid.multiSelect}}</a>\n    </p>\n  </div>\n</div>\n");
$templateCache.put("plugins/editor/html/editor.html","<div class=\"editor-autoresize\">\n  <textarea name=\"{{name}}\" ng-model=\"text\"></textarea>\n</div>\n");
$templateCache.put("plugins/ui/html/breadcrumbs.html","<span class=\"hawtio-breadcrumb\">\n  <li ng-repeat=\"(level, config) in levels track by level\" ng-show=\"config\">\n    <div hawtio-drop-down=\"config\" process-submenus=\"false\"></div>\n  </li>\n</span>\n");
$templateCache.put("plugins/ui/html/colorPicker.html","<div class=\"color-picker\">\n  <div class=\"wrapper\">\n    <div class=\"selected-color\" style=\"background-color: {{property}};\" ng-click=\"popout = !popout\"></div>\n  </div>\n  <div class=\"color-picker-popout\">\n    <table>\n      <tr>\n        <td ng-repeat=\"color in colorList\">\n          <div class=\"{{color.select}}\" style=\"background-color: {{color.color}};\"\n               ng-click=\"selectColor(color)\">\n          </div>\n        <td>\n        <td>\n          <i class=\"fa fa-remove clickable\" ng-click=\"popout = !popout\"></i>\n        </td>\n      </tr>\n    </table>\n  </div>\n</div>\n");
$templateCache.put("plugins/ui/html/confirmDialog.html","<div modal=\"show\">\n  <form class=\"form-horizontal no-bottom-margin\">\n    <div class=\"modal-header\"><h4>{{title}}</h4></div>\n    <div class=\"modal-body\">\n    </div>\n    <div class=\"modal-footer\">\n      <input class=\"btn btn-danger\" ng-show=\"{{showOkButton != \'false\'}}\" type=\"submit\" value=\"{{okButtonText}}\" ng-click=\"submit()\">\n      <button class=\"btn btn-primary\" ng-click=\"cancel()\">{{cancelButtonText}}</button>\n    </div>\n  </form>\n</div>\n");
$templateCache.put("plugins/ui/html/developerPage.html","<div ng-controller=\"UI.DeveloperPageController\">\n\n  <div class=\"tocify\" wiki-href-adjuster>\n    <div hawtio-toc-display\n         get-contents=\"getContents(filename, cb)\">\n      <ul>\n        <li>\n          <a href=\"plugins/ui/html/test/icon.html\" chapter-id=\"icons\">icons</a>\n        </li>\n        <li>\n          <a href=\"plugins/ui/html/test/auto-columns.html\" chapter-id=\"auto-columns\">auto-columns</a>\n        </li>\n        <li>\n          <a href=\"plugins/ui/html/test/auto-dropdown.html\" chapter-id=\"auto-dropdown\">auto-dropdown</a>\n        </li>\n        <li>\n          <a href=\"plugins/ui/html/test/breadcrumbs.html\" chapter-id=\"breadcrumbs\">breadcrumbs</a>\n        </li>\n        <li>\n          <a href=\"plugins/ui/html/test/color-picker.html\" chapter-id=\"color-picker\">color-picker</a>\n        </li>\n        <li>\n          <a href=\"plugins/ui/html/test/confirm-dialog.html\" chapter-id=\"confirm-dialog\">confirm-dialog</a>\n        </li>\n        <li>\n          <a href=\"plugins/ui/html/test/drop-down.html\" chapter-id=\"drop-down\">drop-down</a>\n        </li>\n        <li>\n          <a href=\"plugins/ui/html/test/editable-property.html\" chapter-id=\"editableProperty\">editable-property</a>\n        </li>\n        <li>\n          <a href=\"plugins/ui/html/test/editor.html\" chapter-id=\"editor\">editor</a>\n        </li>\n        <li>\n          <a href=\"plugins/ui/html/test/expandable.html\" chapter-id=\"expandable\">expandable</a>\n        </li>\n        <li>\n          <a href=\"plugins/ui/html/test/file-upload.html\" chapter-id=\"file-upload\">file-upload</a>\n        </li>\n        <li>\n          <a href=\"plugins/ui/html/test/jsplumb.html\" chapter-id=\"jsplumb\">jsplumb</a>\n        </li>\n        <li>\n          <a href=\"plugins/ui/html/test/pager.html\" chapter-id=\"pager\">pager</a>\n        </li>\n        <li>\n          <a href=\"plugins/ui/html/test/slideout.html\" chapter-id=\"slideout\">slideout</a>\n        </li>\n        <li>\n          <a href=\"plugins/ui/html/test/template-popover.html\" chapter-id=\"template-popover\">template-popover</a>\n        </li>\n        <li>\n          <a href=\"plugins/ui/html/test/zero-clipboard.html\" chapter-id=\"zero-clipboard\">zero-clipboard</a>\n        </li>\n      </ul>\n    </div>\n  </div>\n  <div class=\"toc-content\" id=\"toc-content\"></div>\n</div>\n");
$templateCache.put("plugins/ui/html/dropDown.html","<span>\n\n  <script type=\"text/ng-template\" id=\"withsubmenus.html\">\n    <span class=\"hawtio-dropdown dropdown\" ng-class=\"open(config)\" ng-click=\"action(config, $event)\">\n      <p ng-show=\"config.heading\" ng-bind=\"config.heading\"></p>\n      <span ng-show=\"config.title\">\n        <i ng-class=\"icon(config)\"></i>&nbsp;<span ng-bind=\"config.title\"></span>\n        <span ng-show=\"config.items\" ng-hide=\"config.submenu\" class=\"caret\"></span>\n        <span ng-show=\"config.items && config.submenu\" class=\"submenu-caret\"></span>\n      </span>\n\n      <ul ng-hide=\"config.action\" ng-show=\"config.items\" class=\"dropdown-menu\" ng-class=\"submenu(config)\">\n        <li ng-repeat=\"item in config.items track by $index\" ng-init=\"config=item; config[\'submenu\']=true\" ng-include=\"\'withsubmenus.html\'\" hawtio-show object-name=\"{{item.objectName}}\" method-name=\"{{item.methodName}}\" argument-types=\"{{item.argumentTypes}}\" mode=\"remove\">\n        </li>\n      </ul>\n    </span>\n  </script>\n\n  <script type=\"text/ng-template\" id=\"withoutsubmenus.html\">\n    <span class=\"hawtio-dropdown dropdown\" ng-class=\"open(config)\" ng-click=\"action(config, $event)\">\n      <p ng-show=\"config.heading\" ng-bind=\"config.heading\"></p>\n      <span ng-show=\"config.title\">\n        <i ng-class=\"icon(config)\"></i>&nbsp;<span ng-bind=\"config.title\"></span>\n        <span ng-show=\"config.items && config.items.length > 0\" class=\"caret\"></span>\n     </span>\n\n      <ul ng-hide=\"config.action\" ng-show=\"config.items\" class=\"dropdown-menu\" ng-class=\"submenu(config)\">\n        <li ng-repeat=\"item in config.items track by $index\" hawtio-show object-name=\"{{item.objectName}}\" method-name=\"{{item.methodName}}\" argument-types=\"{{item.argumentTypes}}\" mode=\"remove\">\n          <span class=\"menu-item\" ng-click=\"action(item, $event)\">\n            <i ng-class=\"icon(item)\"></i>&nbsp;<span ng-bind=\"item.title\"></span>\n            <span ng-show=\"item.items\" class=\"submenu-caret\"></span>\n          </span>\n        </li>\n      </ul>\n\n    </span>\n  </script>\n\n  <span compile=\"menuStyle\"></span>\n\n</span>\n");
$templateCache.put("plugins/ui/html/editableProperty.html","<div ng-mouseenter=\"showEdit()\" ng-mouseleave=\"hideEdit()\" class=\"ep\" ng-dblclick=\"doEdit()\">\n  {{getText()}}&nbsp;<i class=\"ep-edit fa fa-pencil\" title=\"Edit this item\" ng-click=\"doEdit()\" no-click></i>\n</div>\n<div class=\"ep editing\" ng-show=\"editing\" no-click>\n  <form class=\"form-inline no-bottom-margin\" ng-submit=\"saveEdit()\">\n    <fieldset>\n      <span ng-switch=\"inputType\">\n        <span ng-switch-when=\"number\">\n          <input type=\"number\" size=\"{{text.length}}\" ng-style=\"getInputStyle()\" value=\"{{text}}\" max=\"{{max}}\" min=\"{{min}}\">\n        </span>\n        <span ng-switch-when=\"password\">\n          <input type=\"password\" size=\"{{text.length}}\" ng-style=\"getInputStyle()\" value=\"{{text}}\">\n        </span>\n        <span ng-switch-default>\n          <input type=\"text\" size=\"{{text.length}}\" ng-style=\"getInputStyle()\" value=\"{{text}}\">\n        </span>\n      </span>\n      <i class=\"green clickable fa fa-ok icon1point5x\" title=\"Save changes\" ng-click=\"saveEdit()\"></i>\n      <i class=\"red clickable fa fa-remove icon1point5x\" title=\"Discard changes\" ng-click=\"stopEdit()\"></i>\n    </fieldset>\n  </form>\n</div>\n");
$templateCache.put("plugins/ui/html/editor.html","<div class=\"editor-autoresize\">\n  <textarea name=\"{{name}}\" ng-model=\"text\"></textarea>\n</div>\n");
$templateCache.put("plugins/ui/html/editorPreferences.html","<div ng-controller=\"CodeEditor.PreferencesController\">\n  <form class=\"form-horizontal\">\n    <div class=\"control-group\">\n      <label class=\"control-label\" for=\"theme\" title=\"The default theme to be used by the code editor\">Theme</label>\n\n      <div class=\"controls\">\n        <select id=\"theme\" ng-model=\"preferences.theme\">\n          <option value=\"default\">Default</option>\n          <option value=\"ambiance\">Ambiance</option>\n          <option value=\"blackboard\">Blackboard</option>\n          <option value=\"cobalt\">Cobalt</option>\n          <option value=\"eclipse\">Eclipse</option>\n          <option value=\"monokai\">Monokai</option>\n          <option value=\"neat\">Neat</option>\n          <option value=\"twilight\">Twilight</option>\n          <option value=\"vibrant-ink\">Vibrant ink</option>\n        </select>\n      </div>\n    </div>\n  </form>\n\n  <form name=\"editorTabForm\" class=\"form-horizontal\">\n    <div class=\"control-group\">\n      <label class=\"control-label\" for=\"tabSIze\">Tab size</label>\n\n      <div class=\"controls\">\n        <input type=\"number\" id=\"tabSize\" name=\"tabSize\" ng-model=\"preferences.tabSize\" ng-required=\"ng-required\" min=\"1\" max=\"10\"/>\n        <span class=\"help-block\"\n            ng-hide=\"editorTabForm.tabSize.$valid\">Please specify correct size (1-10).</span>\n      </div>\n    </div>\n  </form>\n\n  <div compile=\"codeMirrorEx\"></div>\n\n<!-- please do not change the tabs into spaces in the following script! -->\n<script type=\"text/ng-template\" id=\"exampleText\">\nvar foo = \"World!\";\n\nvar myObject = {\n	message: \"Hello\",\n		getMessage: function() {\n		return message + \" \";\n 	}\n};\n\nwindow.alert(myObject.getMessage() + foo);\n</script>\n\n<script type=\"text/ng-template\" id=\"codeMirrorExTemplate\">\n  <div hawtio-editor=\"exampleText\" mode=\"javascript\"></div>\n</script>\n</div>\n\n</div>\n");
$templateCache.put("plugins/ui/html/filter.html","<div class=\"inline-block section-filter\">\n  <input type=\"text\"\n         class=\"search-query\"\n         ng-class=\"getClass()\"\n         ng-model=\"ngModel\"\n         placeholder=\"{{placeholder}}\">\n  <i class=\"fa fa-remove clickable\"\n     title=\"Clear Filter\"\n     ng-click=\"ngModel = \'\'\"></i>\n</div>\n");
$templateCache.put("plugins/ui/html/icon.html","<span>\n  <span ng-show=\"icon && icon.type && icon.src\" title=\"{{icon.title}}\" ng-switch=\"icon.type\">\n    <i ng-switch-when=\"icon\" class=\"{{icon.src}} {{icon.class}}\"></i>\n    <img ng-switch-when=\"img\" ng-src=\"{{icon.src}}\" class=\"{{icon.class}}\">\n  </span>\n  <span ng-hide=\"icon && icon.type && icon.src\">\n    &nbsp;\n  </span>\n</span>\n\n");
$templateCache.put("plugins/ui/html/layoutUI.html","<div ng-view></div>\n");
$templateCache.put("plugins/ui/html/list.html","<div>\n\n  <!-- begin cell template -->\n  <script type=\"text/ng-template\" id=\"cellTemplate.html\">\n    <div class=\"ngCellText\">\n      {{row.entity}}\n    </div>\n  </script>\n  <!-- end cell template -->\n\n  <!-- begin row template -->\n  <script type=\"text/ng-template\" id=\"rowTemplate.html\">\n    <div class=\"list-row\">\n      <div ng-show=\"config.showSelectionCheckbox\"\n           class=\"list-row-select\">\n        <input type=\"checkbox\" ng-model=\"row.selected\">\n      </div>\n      <div class=\"list-row-contents\"></div>\n    </div>\n  </script>\n  <!-- end row template -->\n\n  <!-- must have a little margin in the top -->\n  <div class=\"list-root\" style=\"margin-top: 15px\"></div>\n\n</div>\n");
$templateCache.put("plugins/ui/html/multiItemConfirmActionDialog.html","<div>\n  <form class=\"no-bottom-margin\">\n    <div class=\"modal-header\">\n      <span>{{options.title || \'Are you sure?\'}}</span>\n    </div>\n    <div class=\"modal-body\">\n      <p ng-show=\'options.action\'\n         ng-class=\'options.actionClass\'\n         ng-bind=\'options.action\'></p>\n      <ul>\n        <li ng-repeat=\"item in options.collection\">{{item[options.index]}}</li>\n      </ul>\n      <p ng-show=\"options.custom\" \n         ng-class=\"options.customClass\" \n         ng-bind=\"options.custom\"></p>\n    </div>\n    <div class=\"modal-footer\">\n      <button class=\"btn\" \n              ng-class=\"options.okClass\" \n              ng-click=\"close(true)\">{{options.okText || \'Ok\'}}</button>\n      <button class=\"btn\" \n              ng-class=\"options.cancelClass\"\n              ng-click=\"close(false)\">{{options.cancelText || \'Cancel\'}}</button>\n    </div>\n  </form>\n</div>\n");
$templateCache.put("plugins/ui/html/object.html","<div>\n  <script type=\"text/ng-template\" id=\"primitiveValueTemplate.html\">\n    <span ng-show=\"data\" object-path=\"{{path}}\">{{data}}</span>\n  </script>\n  <script type=\"text/ng-template\" id=\"arrayValueListTemplate.html\">\n    <ul class=\"zebra-list\" ng-show=\"data\" object-path=\"{{path}}\">\n      <li ng-repeat=\"item in data\">\n        <div hawtio-object=\"item\" config=\"config\" path=\"path\" row=\"row\"></div>\n      </li>\n    </ul>\n  </script>\n  <script type=\"text/ng-template\" id=\"arrayValueTableTemplate.html\">\n    <table class=\"table table-striped\" object-path=\"{{path}}\">\n      <thead>\n      </thead>\n      <tbody>\n      </tbody>\n    </table>\n  </script>\n  <script type=\"text/ng-template\" id=\"dateAttributeTemplate.html\">\n    <dl class=\"\" ng-show=\"data\" object-path=\"{{path}}\">\n      <dt>{{key}}</dt>\n      <dd ng-show=\"data && data.getTime() > 0\">{{data | date:\"EEEE, MMMM dd, yyyy \'at\' hh : mm : ss a Z\"}}</dd>\n      <dd ng-show=\"data && data.getTime() <= 0\"></dd>\n\n    </dl>\n  </script>\n  <script type=\"text/ng-template\" id=\"dateValueTemplate.html\">\n    <span ng-show=\"data\">\n      <span ng-show=\"data && data.getTime() > 0\" object-path=\"{{path}}\">{{data | date:\"EEEE, MMMM dd, yyyy \'at\' hh : mm : ss a Z\"}}</span>\n      <span ng-show=\"data && data.getTime() <= 0\" object-path=\"{{path}}\"></span>\n    </span>\n  </script>\n  <script type=\"text/ng-template\" id=\"primitiveAttributeTemplate.html\">\n    <dl class=\"\" ng-show=\"data\" object-path=\"{{path}}\">\n      <dt>{{key}}</dt>\n      <dd>{{data}}</dd>\n    </dl>\n  </script>\n  <script type=\"text/ng-template\" id=\"objectAttributeTemplate.html\">\n    <dl class=\"\" ng-show=\"data\" object-path=\"{{path}}\">\n      <dt>{{key}}</dt>\n      <dd>\n        <div hawtio-object=\"data\" config=\"config\" path=\"path\" row=\"row\"></div>\n      </dd>\n    </dl>\n  </script>\n  <script type=\"text/ng-template\" id=\"arrayAttributeListTemplate.html\">\n    <dl class=\"\" ng-show=\"data\" object-path=\"{{path}}\">\n      <dt>{{key}}</dt>\n      <dd>\n        <ul class=\"zebra-list\">\n          <li ng-repeat=\"item in data\" ng-init=\"path = path + \'/\' + $index\">\n            <div hawtio-object=\"item\" config=\"config\" path=\"path\" row=\"row\"></div>\n          </li>\n        </ul>\n      </dd>\n    </dl>\n  </script>\n  <script type=\"text/ng-template\" id=\"arrayAttributeTableTemplate.html\">\n    <dl class=\"\" ng-show=\"data\" object-path=\"{{path}}\">\n      <dt>{{key}}</dt>\n      <dd>\n        <table class=\"table table-striped\">\n          <thead>\n          </thead>\n          <tbody>\n          </tbody>\n        </table>\n      </dd>\n    </dl>\n  </script>\n  <script type=\"text/ng-template\" id=\"headerTemplate.html\">\n    <th object-path=\"{{path}}\">{{key}}</th>\n  </script>\n  <script type=\"text/ng-template\" id=\"rowTemplate.html\">\n    <tr object-path=\"{{path}}\"></tr>\n  </script>\n  <script type=\"text/ng-template\" id=\"cellTemplate.html\">\n    <td object-path=\"{{path}}\"></td>\n  </script>\n</div>\n");
$templateCache.put("plugins/ui/html/pane.html","<div class=\"pane\">\n  <div class=\"pane-wrapper\">\n    <div class=\"pane-header-wrapper\">\n    </div>\n    <div class=\"pane-viewport\">\n      <div class=\"pane-content\">\n      </div>\n    </div>\n    <div class=\"pane-bar\"\n         ng-mousedown=\"startMoving($event)\"\n         ng-click=\"toggle()\"></div>\n  </div>\n</div>\n");
$templateCache.put("plugins/ui/html/slideout.html","<div class=\"slideout {{direction || \'right\'}}\">\n  <div class=slideout-title>\n    <div class=\"mouse-pointer pull-right\" ng-click=\"hidePanel($event)\" title=\"Close panel\">\n      <i class=\"fa fa-remove\"></i>\n    </div>\n    <span>{{title}}</span>\n  </div>\n  <div class=\"slideout-content\">\n    <div class=\"slideout-body\"></div>\n  </div>\n</div>\n");
$templateCache.put("plugins/ui/html/tablePager.html","<div class=\"hawtio-pager clearfix\">\n  <label>{{rowIndex() + 1}} / {{tableLength()}}</label>\n  <div class=btn-group>\n    <button class=\"btn\" ng-disabled=\"isEmptyOrFirst()\" ng-click=\"first()\"><i class=\"fa fa-fast-backward\"></i></button>\n    <button class=\"btn\" ng-disabled=\"isEmptyOrFirst()\" ng-click=\"previous()\"><i class=\"fa fa-step-backward\"></i></button>\n    <button class=\"btn\" ng-disabled=\"isEmptyOrLast()\" ng-click=\"next()\"><i class=\"fa fa-step-forward\"></i></button>\n    <button class=\"btn\" ng-disabled=\"isEmptyOrLast()\" ng-click=\"last()\"><i class=\"fa fa-fast-forward\"></i></button>\n  </div>\n</div>\n");
$templateCache.put("plugins/ui/html/tagFilter.html","<div>\n  <ul class=\"list-unstyled label-list\">\n    <li ng-repeat=\"tag in visibleTags | orderBy:\'tag.id || tag\'\"\n        class=\"mouse-pointer\"\n        ng-click=\"toggleSelectionFromGroup(selected, tag.id || tag)\">\n              <span class=\"badge\"\n                    ng-class=\"isInGroup(selected, tag.id || tag, \'badge-success\', \'\')\"\n                      >{{tag.id || tag}}</span>\n              <span class=\"pull-right\"\n                    ng-show=\"tag.count\">{{tag.count}}&nbsp;</span>\n    </li>\n  </ul>\n  <div class=\"mouse-pointer\"\n       ng-show=\"selected.length\"\n       ng-click=\"clearGroup(selected)\">\n    <i class=\"fa fa-remove\" ></i> Clear Tags\n  </div>\n</div>\n");
$templateCache.put("plugins/ui/html/toc.html","<div>\n  <div ng-repeat=\"item in myToc\">\n    <div id=\"{{item[\'href\']}}Target\" ng-bind-html=\"item.text\">\n    </div>\n  </div>\n</div>\n");
$templateCache.put("plugins/ui-bootstrap/html/message.html","<div class=\"modal-header\">\n	<h3>{{ title }}</h3>\n</div>\n<div class=\"modal-body\">\n	<p>{{ message }}</p>\n</div>\n<div class=\"modal-footer\">\n	<button ng-repeat=\"btn in buttons\" ng-click=\"close(btn.result)\" class=\"btn\" ng-class=\"btn.cssClass\">{{ btn.label }}</button>\n</div>\n");
$templateCache.put("plugins/ui/html/test/auto-columns.html","<div ng-controller=\"UI.UITestController2\">\n\n  <div>\n    <div class=\"row\">\n      <h3>Auto Columns</h3>\n      <p>Lays out a bunch of inline-block child elements into columns automatically based on the size of the parent container.  Specify the selector for the child items as an argument</p>\n\n      <script type=\"text/ng-template\" id=\"autoColumnTemplate\">\n<div id=\"container\"\n     style=\"height: 225px;\n            width: 785px;\n            background: lightgrey;\n            border-radius: 4px;\"\n     hawtio-auto-columns=\".ex-children\"\n     min-margin=\"5\">\n  <div class=\"ex-children\"\n       style=\"display: inline-block;\n              width: 64px; height: 64px;\n              border-radius: 4px;\n              background: lightgreen;\n              text-align: center;\n              vertical-align: middle;\n              margin: 5px;\"\n       ng-repeat=\"div in divs\">{{div}}</div>\n</div>\n      </script>\n      <div hawtio-editor=\"autoColumnEx\" mode=\"fileUploadExMode\"></div>\n      <div class=\"directive-example\">\n        <div compile=\"autoColumnEx\"></div>\n      </div>\n    </div>\n  </div>\n</div>\n");
$templateCache.put("plugins/ui/html/test/auto-dropdown.html","<div ng-controller=\"UI.UITestController2\">\n\n  <div>\n    <div class=\"row\">\n      <h3>Auto Drop Down</h3>\n      <p>Handy for horizontal lists of things like menus, if the width of the element is smaller than the items inside any overflowing elements will be collected into a special dropdown element that\'s required at the end of the list</p>\n      <script type=\"text/ng-template\" id=\"autoDropDownTemplate\">\n        <ul class=\"nav nav-tabs\" hawtio-auto-dropdown>\n          <!-- All of our menu items -->\n          <li ng-repeat=\"item in menuItems\">\n            <a href=\"\">{{item}}</a>\n          </li>\n          <!-- The dropdown that will collect overflow elements -->\n          <li class=\"dropdown overflow\" style=\"float: right !important; visibility: hidden;\">\n            <a href=\"\" class=\"dropdown-toggle\" data-toggle=\"dropdown\">\n              <i class=\"fa fa-chevron-down\"></i>\n            </a>\n            <ul class=\"dropdown-menu right\"></ul>\n          </li>\n        </ul>\n      </script>\n      <div hawtio-editor=\"autoDropDown\" mode=\"fileUploadExMode\"></div>\n      <div class=\"directive-example\">\n        <div compile=\"autoDropDown\"></div>\n      </div>\n    </div>\n  </div>\n</div>\n");
$templateCache.put("plugins/ui/html/test/breadcrumbs.html","<div ng-controller=\"UI.UITestController2\">\n\n  <div>\n\n    <div class=\"row\">\n      <h3>BreadCrumbs</h3>\n      <p>A breadcrumb implementation that supports dropdowns for each node.  The data structure is a tree structure with a single starting node.  When the user makes a selection the directive will update the \'path\' property of the config object.  The directive also watches the \'path\' property, allowing you to also set the initial state of the breadcrumbs.</p>\n      <script type=\"text/ng-template\" id=\"breadcrumbTemplate\">\n<p>path: {{breadcrumbConfig.path}}</p>\n<ul class=\"nav nav-tabs\">\n<hawtio-breadcrumbs config=\"breadcrumbConfig\"></hawtio-breadcrumbs>\n</ul>\n      </script>\n      <h5>HTML</h5>\n      <div hawtio-editor=\"breadcrumbEx\" mode=\"fileUploadExMode\"></div>\n      <h5>JSON</h5>\n      <div hawtio-editor=\"breadcrumbConfigTxt\" mode=\"javascript\"></div>\n      <div class=\"directive-example\">\n        <div compile=\"breadcrumbEx\"></div>\n      </div>\n    </div>\n\n  </div>\n</div>\n");
$templateCache.put("plugins/ui/html/test/color-picker.html","<div ng-controller=\"UI.UITestController1\">\n\n  <div class=\"row\">\n    <h3>Color picker</h3>\n\n    <p>Currently used on the preferences page to associate a color with a given URL regex</p>\n\n    <div hawtio-editor=\"colorPickerEx\" mode=\"fileUploadExMode\"></div>\n    <div class=\"directive-example\">\n      <div compile=\"colorPickerEx\"></div>\n    </div>\n    <hr>\n  </div>\n\n\n</div>\n");
$templateCache.put("plugins/ui/html/test/confirm-dialog.html","<div ng-controller=\"UI.UITestController1\">\n\n  <div class=\"row\">\n    <h3>Confirmation Dialog</h3>\n\n    <p>Displays a simple confirmation dialog with a standard title and buttons, just the dialog body needs to be\n      provided. The buttons can be customized as well as the actions when the ok or cancel button is clicked</p>\n\n    <div hawtio-editor=\"confirmationEx1\" mode=\"fileUploadExMode\"></div>\n    <div class=\"directive-example\">\n      <div compile=\"confirmationEx1\"></div>\n    </div>\n\n    <div hawtio-editor=\"confirmationEx2\" mode=\"fileUploadExMode\"></div>\n    <div class=\"directive-example\">\n      <div compile=\"confirmationEx2\"></div>\n    </div>\n    <hr>\n  </div>\n\n</div>\n");
$templateCache.put("plugins/ui/html/test/drop-down.html","<div ng-controller=\"UI.UITestController2\">\n\n  <div>\n\n    <div class=\"row\">\n      <h3>Drop Down</h3>\n      <p>A bootstrap.js drop-down widget driven by a simple json structure</p>\n      <script type=\"text/ng-template\" id=\"dropDownTemplate\">\n<p>someVal: {{someVal}}</p>\n  <div hawtio-drop-down=\"dropDownConfig\"></div>\n      </script>\n      <h5>HTML</h5>\n      <div hawtio-editor=\"dropDownEx\" mode=\"fileUploadExMode\"></div>\n      <h5>JSON</h5>\n      <div hawtio-editor=\"dropDownConfigTxt\" mode=\"javascript\"></div>\n      <div class=\"directive-example\">\n        <div compile=\"dropDownEx\"></div>\n      </div>\n    </div>\n  </div>\n</div>\n");
$templateCache.put("plugins/ui/html/test/editable-property.html","<div ng-controller=\"UI.UITestController1\">\n\n  <div class=\"row\">\n    <h3>Editable Property</h3>\n\n    <p>Use to display a value that the user can edit at will</p>\n\n    <div hawtio-editor=\"editablePropertyEx1\" mode=\"fileUploadExMode\"></div>\n    <div class=\"directive-example\">\n      <div compile=\"editablePropertyEx1\"></div>\n    </div>\n    <hr>\n  </div>\n\n</div>\n");
$templateCache.put("plugins/ui/html/test/editor.html","<div ng-controller=\"UI.UITestController1\">\n\n  <div>\n    <div class=\"row\">\n        <h3>CodeMirror</h3>\n\n        <p>A directive that wraps the codeMirror editor.</p>\n\n        <div hawtio-editor=\"editorEx1\" mode=\"fileUploadExMode\"></div>\n        <div class=\"directive-example\">\n          <div compile=\"editorEx1\"></div>\n        </div>\n      </div>\n  </div>\n\n\n</div>\n");
$templateCache.put("plugins/ui/html/test/expandable.html","<div ng-controller=\"UI.UITestController1\">\n\n  <div class=\"row\">\n    <h3>Expandable</h3>\n\n    <p>Use to hide content under a header that a user can display when necessary</p>\n\n    <div hawtio-editor=\"expandableEx\" mode=\"fileUploadExMode\"></div>\n    <div class=\"directive-example\">\n      <div compile=\"expandableEx\"></div>\n    </div>\n    <hr>\n  </div>\n\n</div>\n");
$templateCache.put("plugins/ui/html/test/file-upload.html","<div ng-controller=\"UI.UITestController1\">\n\n  <div class=\"row\">\n    <h3>File upload</h3>\n\n    <p>Use to upload files to the hawtio webapp backend. Files are stored in a temporary directory and managed via the\n      UploadManager JMX MBean</p>\n\n    <p>Showing files:</p>\n\n    <div hawtio-editor=\"fileUploadEx1\" mode=\"fileUploadExMode\"></div>\n    <div class=\"directive-example\">\n      <div compile=\"fileUploadEx1\"></div>\n    </div>\n    <hr>\n    <p>Not showing files:</p>\n\n    <div hawtio-editor=\"fileUploadEx2\" mode=\"fileUploadExMode\"></div>\n    <div class=\"directive-example\">\n      <div compile=\"fileUploadEx2\"></div>\n    </div>\n  </div>\n  <hr>\n</div>\n\n</div>\n");
$templateCache.put("plugins/ui/html/test/icon.html","<div ng-controller=\"UI.IconTestController\">\n\n  <script type=\"text/ng-template\" id=\"example-html\">\n\n<style>\n\n/* Define icon sizes in CSS\n   use the \'class\' attribute\n   to handle icons that are\n   wider than they are tall */\n.fa fa-example i:before,\n.fa fa-example img {\n  vertical-align: middle;\n  line-height: 32px;\n  font-size: 32px;\n  height: 32px;\n  width: auto;\n}\n\n.fa fa-example img.girthy {\n  height: auto;\n  width: 32px;\n}\n</style>\n\n<!-- Here we turn an array of\n     simple objects into icons! -->\n<ul class=\"fa fa-example list-inline\">\n  <li ng-repeat=\"icon in icons\">\n    <hawtio-icon config=\"icon\"></hawtio-icon>\n  </li>\n</ul>\n  </script>\n\n  <script type=\"text/ng-template\" id=\"example-config-json\">\n[{\n  \"title\": \"Awesome!\",\n  \"src\": \"fa fa-thumbs-up\"\n},\n{\n  \"title\": \"Apache Karaf\",\n  \"type\": \"icon\",\n  \"src\": \"fa fa-beaker\"\n},\n{\n  \"title\": \"Fabric8\",\n  \"type\": \"img\",\n  \"src\": \"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgNjAwIDYwMCI+PHBhdGggZmlsbD0iIzE3NTY5RSIgZD0iTTIyOS45MDggMzUyLjE5MnMtNi40NCAxMi45MjItMzEuNjggNy4xMmMtMjUuMjItNS44MDQtNzAuNDk4LTMyLjk3OC04Mi43OC00NS4yNzgtMTIuMjgtMTIuMjgyLTQ5LjE0NS0zOC43OTgtMjkuNzQ2LTU4LjIxNiAwIDAtMTAuOTg4LTMuMjEyLTE5LjQtMTEuNjQ0LTguNDEyLTguMzk0LTExLjY2LTI1Ljg0LTQuNTI1LTMyLjk1OGwyMC4wMzggOC4zOTZzLTcuMSAxNi4xNy42NTYgMTguNzRjNy43NTcgMi41OTMgMTQuODczLTQuNTA2IDE4LjEwNS03Ljc1NSAzLjI1LTMuMjMgMTQuMjM1LTE1LjUxIDYuNDYtMjMuMjY3LTcuNzU1LTcuNzU2LTEwLjk4Ni42MzgtMTAuOTg2LjYzOGwtOS42OS05LjY5czE2LjgwOC0xMC4zNDcgMzIuMzIgNS4xNjVjMTUuNTMgMTUuNTMgMTAuOTg2IDMwLjQwNCAxMC45ODYgMzAuNDA0bDEwMC4yNDIgMTE4LjM0NXoiLz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMTg2LjM2NyAzNDQuNzEyYy0yMS4wOTctNC44NTQtNTktMjcuNjEzLTY5LjI3Ni0zNy44ODYtMTAuMjktMTAuMjkzLTQxLjEzMy0zMi40ODQtMjQuODktNDguNzI3IDAgMCAxNS40MzctLjM0OCAyMS4zODctNi4yOTcgMCAwLTguNzIzIDI3LjY1IDE4Ljg5IDUyLjAxMiAyNy42MSAyNC4zNjMgNTMuODkgNDAuODk3IDUzLjg5IDQwLjg5N3oiLz48cGF0aCBmaWxsPSIjMTc1NjlFIiBkPSJNMzk1LjcwOCAzNzQuODk2czUuNDcyIDEwLjk1IDI2LjkzNyA2LjAyMmMyMS40NTgtNC45MjcgNTkuOTI3LTI4LjA2OCA3MC4zNy0zOC41MDYgMTAuNDM4LTEwLjQyMyA0MS43NTUtMzIuOTc4IDI1LjMzLTQ5LjQ1OCAwIDAgOS4zNDQtMi43NTUgMTYuNDI1LTkuOTEgNy4xNS03LjEzNCA5LjkyOC0yMS45OSAzLjg2NC0yOC4wM2wtMTcuMDA0IDcuMTU0czYuMDYgMTMuNzQyLS41ODQgMTUuOTMyYy02LjU3MyAyLjIwOC0xMi42My0zLjgzMy0xNS40MDctNi42MDctMi42OTctMi43MzctMTIuMDQtMTMuMTkzLTUuNDc1LTE5Ljc4IDYuNjQyLTYuNjA4IDkuMzQ0LjU0NiA5LjM0NC41NDZsOC4yNS04LjI1cy0xNC4zMDctOC43OTYtMjcuNTIyIDQuMzk3Yy0xMy4xNCAxMy4yMTMtOS4yNjggMjUuODYtOS4yNjggMjUuODZsLTg1LjI2MiAxMDAuNjN6Ii8+PGcgZmlsbD0iI0Q1RDVENSI+PHBhdGggZD0iTTQzNS44NTMgNTczLjM4YzAtMTQuMTY1LTUwLjgwNy0yNS42MjQtMTEzLjM5Ny0yNS42MjQtNjIuNjM0IDAtMTEzLjQyNSAxMS40Ni0xMTMuNDI1IDI1LjYyMyAwIDE0LjE1OCA1MC43OTIgMjUuNjIgMTEzLjQyNiAyNS42MiA2Mi41OSAwIDExMy4zOTctMTEuNDYyIDExMy4zOTctMjUuNjJ6TTI0OC4wNSA1NzAuNzVjMC02Ljc5LTE5LjYzNy0xMi4zNzQtNDMuODktMTIuMzc0LTI0LjIzNiAwLTQzLjg5MyA1LjU4NS00My44OTMgMTIuMzc1IDAgNi44NiAxOS42NTcgMTIuNDA4IDQzLjg5MiAxMi40MDggMjQuMjU0IDAgNDMuODktNS41NDggNDMuODktMTIuNDA3ek00NTIuOTM4IDU1Ny4zNTVjMC02LjgyNi0xOC4wMy0xMi4zNzQtNDAuMjIyLTEyLjM3NC0yMi4yNjUgMC00MC4yOTUgNS41NS00MC4yOTUgMTIuMzc1IDAgNi44MjMgMTguMDMgMTIuMzcgNDAuMjk2IDEyLjM3IDIyLjE5Mi4wMDIgNDAuMjIyLTUuNTQ2IDQwLjIyMi0xMi4zN3oiLz48L2c+PHBhdGggZmlsbD0iIzE3NTY5RSIgZD0iTTM0Mi44NTcgNDk3LjM1czMuNTc3IDI0Ljc0Ni0uMDc2IDY1LjAwNmMwIDAgMTcuMzc4IDguMjEgMzEuMTAyIDE3LjM3MyAwIDAgMzkuMzQ2LTMuNjUgNDkuNDE1LTEuODI3VjU2NC4xOGwtMjMuNzkzLTEzLjcyNVY1MDAuMTZsLTU2LjY0Ny0yLjgxek0zNzcuNjA0IDMxMy4xNThjMCAzMS41OS0zMS41MzUgNTcuMTc1LTcwLjQxIDU3LjE3NS0zOC44OSAwLTcwLjQyNS0yNS41ODQtNzAuNDI1LTU3LjE3NSAwLTMxLjU3MiAzMS41MzQtNTcuMTU4IDcwLjQyNS01Ny4xNTggMzguODc0IDAgNzAuNDEgMjUuNTg2IDcwLjQxIDU3LjE1OHoiLz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMzQ0LjIwNCAyOTUuMjJjLTEuMzQ3IDcuODI3LTEyLjYyNCAxMi40MjctMjUuMTk4IDEwLjI3Mi0xMi41NTYtMi4xNzItMjEuNjgyLTEwLjI3My0yMC4zMTQtMTguMTAzIDEuMzMzLTcuODMgMTIuNjMtMTIuNDQ2IDI1LjE4Ny0xMC4yOTMgMTIuNTcyIDIuMTUzIDIxLjY4IDEwLjI3NCAyMC4zMjQgMTguMTIyeiIvPjxwYXRoIGZpbGw9IiMxNzU2OUUiIGQ9Ik00MzEuMjU1IDMzNS41NjdzMS4yNDQgOTMuOTMtMTguMjQ2IDE2MC45OGMwIDAtNzguMDc1IDI4LjAzLTE4NC4xNzctMy42NSAwIDAtMTkuNDktMTIuMjMtMjYuODI2LTEyLjIzIDAgMC04LjU0Mi0xNTkuNzItMjMuMTYtMTgyLjg3NiAwIC4wMDIgMTI1LjYxMi00My45MDYgMjUyLjQwOCAzNy43Nzd6Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTQwNi44MDQgNDQ1Ljg4NmMtLjgwMyAxMC04Ljc2IDE5LjQyLTE4LjEwNCAyMC42OTYtMzUuNTUgNC41NjItNzEuNTk2IDQuNTYyLTEwNy4yLjA3LTExLjg2Mi0xLjYwMy0yMi4xLTEyLjc3Mi0yMi43Mi0yNC4yMzQtMS40NC0yNS4wNzQtMi44ODUtNDkuODItNC4zNDUtNzQuMjM4LS43My0xMy4xNCA5LjU4My0yNS41ODYgMjIuODUtMjYuNDI1IDM5LjUyNy0yLjA0NCA3OS42NiAyLjM3MyAxMTkuMTQ4IDEwLjU4NiAxMC4yMiAyLjI2MyAxNy41OTQgMTMuNDcgMTYuNjQ0IDI0LjY3Mi0yLjExMiAyMi41Mi00LjE1NiA0NS40NzgtNi4yNzMgNjguODc0eiIvPjxwYXRoIGZpbGw9IiNFQzc5MjkiIGQ9Ik0zNTguNTUgNDIzLjU1di4xOGMuOCAxLjQ2IDEuMTY3IDMuMTc3IDEuMjQzIDUuMDQgMCA1Ljc2NS00LjIzOCAxMC41ODUtOS40OTQgMTAuNzI4LTUuMTgzLjExLTkuNDUtNC41OTgtOS40NS0xMC40MzggMC0yLjYyOC44NC00Ljk2NCAyLjIyNC02LjgyNiAwLS4xMDcgMjMuMDY3LTM1LjgwNS05LjIzLTYwLjAwMy4wMTguMDM4IDkuMzggMjguNDM0LTEyLjk4IDQwLjM3IDAgMC02LjE2OCA0Ljg5LjY0LTExLjMxNyAwIDAtMTguOTc4IDEyLjA4Mi0xOC45NiA0MC4zMyAwIDEyLjgxMyA2LjAyIDI0LjQ1NyAxNS4wOSAzMS4zOTMtLjI3Mi0xLjIwNS0uNDMzLTIuNTU3LS40MzMtNC4xNjIgMC0xMS40NjIgOS4yMy0yNC44MiAxMi4wOTYtMjQuODItLjAyIDAgLjcxNiAxMy43MjUgNCAyMC4yMjMgMi41NzQgNS40NzQgMSAxMS41My0yLjQwOCAxNC41MjUgMS41MTUuMjkyIDMuMDguNDc0IDQuNjcyLjQzOCA4Ljc2IDAgMTYuNzE3LTQuMTYgMjIuNjI1LTEwLjU4M2wtLjA2OC0uMDM3YzExLjAyLTE2LjYwOCA0LjY3LTI5LjIzNy40MzItMzUuMDR6Ii8+PHBhdGggZmlsbD0iI0Q1RDVENSIgZD0iTTI3NS40NiAzNTMuNTQ1Yy4zMS0uMDM2LjY0LS4wMzYuOTY4LS4wNzMgMzkuNTI3LTEuMTMgNzkuNjQzIDMuMTc1IDExOS4xMyAxMC4yNTcgMi4wNDQuMzYyIDMuNDM2IDEuNzUgNC4yMzggMi44NDUgMS44MjUgMi4zMzYgMi42MjggNS40MDIgMi40MSA4LjU3OC0yLjExOCAyMy4yNS00LjE2MiA0Ni45LTYuMjgyIDcwLjkxOFY0NDYuMjE0Yy0uMzY2IDQuMjM3LTMuNjQ2IDguMjUtNy4yMjQgOC42NTMtMzUuNTUgMy42ODYtNzEuNTk2IDMuNjg2LTEwNy4xOC4wMzYtNi4xMzMtLjY1Ni0xMS41MzUtNi4yMDQtMTEuODI3LTEyLjA0NC0xLjQ3OC0yNS43Ny0yLjkyLTUxLjI0Ny00LjM2LTc2LjQ2Ni0uMTg0LTMuMjg1LjgtNi4zOSAyLjczNi04Ljc5NiAxLjg2LTIuMjY0IDQuNDg4LTMuNzIzIDcuMzktNC4wNW0tLjAxNy0xMS42MWMtMTIuMzc1IDEuODYzLTIxLjcgMTMuNjktMjEuMDA4IDI2LjI0NCAxLjQ2IDI0LjQyIDIuOTA0IDQ5LjE2NCA0LjM0NiA3NC4yMzguNjIgMTEuNDYyIDEwLjg1OCAyMi42MzIgMjIuNzIgMjQuMjM1IDM1LjYwNSA0LjQ5IDcxLjY1IDQuNDkgMTA3LjItLjA3IDkuMzQ0LTEuMzE1IDE3LjMtMTAuNjk2IDE4LjEwNC0yMC42OTcgMi4xMTctMjMuMzk2IDQuMTYtNDYuMzU0IDYuMjczLTY4Ljg3NC45NS0xMS4yMDMtNi40MjQtMjIuNDEtMTYuNjQ0LTI0LjY3LTM5LjQ4Ny04LjIxNC03OS42Mi0xMi42My0xMTkuMTQ4LTEwLjU4Ny0uNjIgMC0xLjIyMy4wNzQtMS44NDIuMTgyeiIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0xOTUuNiAzMDAuODJzNDEuMTctMi43MzYgNDEuMTcgMTQ1LjM5NGMwIDAgMzUuNjYtMTQ4LjEzLTQxLjE3LTE0NS4zOTN6TTIyMy45NiAzMTYuMzdzMTQ0LjUxNy0zLjY1IDE4My44NiAyNS42MDNjMCAwLTg1Ljk4Ni0yMy43NzctMTgwLjE5Mi0xMS44OTdsLTMuNjY4LTEzLjcwNnpNMjUyLjMyIDI4Mi45NzRoMTIuMzM1czUuNTg1LTE0Ljg5MiAyNC4xMjctMjEuMjQzYzAgMC0xOC44NTIgMy42NS0zNi40NjIgMjEuMjQ0eiIvPjxwYXRoIGZpbGw9IiMxNzU2OUUiIGQ9Ik0yMzAuMzY1IDQ4Mi44MjRzMCA0Mi45Ni01LjQ5MyA3OS41NjZjMCAwIDI5LjI3IDkuMTYyIDM1LjY4IDIwLjExIDAgMCA1Mi4xMTctNS40NzUgNjAuMzQ4LTMuNjQ4di0xNy4zNzRsLTI0LjY3Mi0xMC45ODYgMS44MDctNTIuMTItNjcuNjctMTUuNTQ4eiIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0yNTcuNSA1MjIuMTMybDIuNDMgNDMuOTQ3czI4LjY2OC0zLjA3IDQwLjI0LTMuMDdjMCAwLTIzLjE3Ny01LjQ3My0zNC4xMjYtNS40NzMgMCAwLTQuMjctMjguNjktOC41NDMtMzUuNDA1ek0zNzYuMzYgNTM3LjVsLjU4NCAyOC4wNjZzMjUuNjItMS44MjMgMzQuNzQ3LS42MmMwIDAtMTEuMjM3LTMuOTgtMjkuNTY0LTMuOThMMzc2LjM2IDUzNy41eiIvPjxnIGZpbGw9IiMxNzU2OUUiPjxwYXRoIGQ9Ik05MC44MyA3MC44NnYxMDYuMDQ2aDExNi4zNzdWNzAuODZIOTAuODN6bTEwNi41MiA5Ni4xOTNoLTk2LjY2NHYtODYuMzJoOTYuNjY1djg2LjMyek0xMzAuODMzIDE2Mi4wMzR2LTc2LjMiLz48cGF0aCBkPSJNMTMwLjgzMyAxNjQuMjQyYy0xLjIyNSAwLTIuMTktLjk4NS0yLjE5LTIuMjA4di03Ni4zYzAtMS4yMjQuOTY1LTIuMjEgMi4xOS0yLjIxIDEuMjA1IDAgMi4xOS45ODYgMi4xOSAyLjIxdjc2LjNjMCAxLjIyMy0uOTg1IDIuMjA4LTIuMTkgMi4yMDh6TTExMi44NzUgMTYyLjAzNHYtNzYuMyIvPjxwYXRoIGQ9Ik0xMTIuODc1IDE2NC4yNDJjLTEuMjI1IDAtMi4yMDgtLjk4NS0yLjIwOC0yLjIwOHYtNzYuM2MwLTEuMjI0Ljk4NC0yLjIxIDIuMjA4LTIuMjEgMS4yMDUgMCAyLjE5Ljk4NiAyLjE5IDIuMjF2NzYuM2MwIDEuMjIzLS45ODUgMi4yMDgtMi4xOSAyLjIwOHpNMTQ4Ljc5IDE2Mi4wMzR2LTc2LjMiLz48cGF0aCBkPSJNMTQ4Ljc5IDE2NC4yNDJjLTEuMjA0IDAtMi4yMDctLjk4NS0yLjIwNy0yLjIwOHYtNzYuM2MwLTEuMjI0IDEuMDAzLTIuMjEgMi4yMDgtMi4yMSAxLjIwNiAwIDIuMjEuOTg2IDIuMjEgMi4yMXY3Ni4zYzAgMS4yMjMtMS4wMDUgMi4yMDgtMi4yMSAyLjIwOHpNMTY2Ljc0OCAxNjIuMDM0di03Ni4zIi8+PHBhdGggZD0iTTE2Ni43NDggMTY0LjI0MmMtMS4yMDUgMC0yLjE5LS45ODUtMi4xOS0yLjIwOHYtNzYuM2MwLTEuMjI0Ljk4NS0yLjIxIDIuMTktMi4yMSAxLjIyMyAwIDIuMTkuOTg2IDIuMTkgMi4yMXY3Ni4zYzAgMS4yMjMtLjk2NyAyLjIwOC0yLjE5IDIuMjA4ek0xODQuNzA2IDE2Mi4wMzR2LTc2LjMiLz48cGF0aCBkPSJNMTg0LjcwNiAxNjQuMjQyYy0xLjIwNSAwLTIuMTktLjk4NS0yLjE5LTIuMjA4di03Ni4zYzAtMS4yMjQuOTg1LTIuMjEgMi4xOS0yLjIxIDEuMjIzIDAgMi4yMDguOTg2IDIuMjA4IDIuMjF2NzYuM2MwIDEuMjIzLS45ODUgMi4yMDgtMi4yMDggMi4yMDh6Ii8+PC9nPjxnIGZpbGw9IiMxNzU2OUUiPjxwYXRoIGQ9Ik0yNDUuODc4IDF2MTA2LjAxMkgzNjIuMjdWMUgyNDUuODh6bTEwNi41NCA5Ni4xNTZoLTk2LjY4NVYxMC44NTRoOTYuNjg0djg2LjMwMnpNMjg1Ljg4IDkyLjE3NXYtNzYuMzQiLz48cGF0aCBkPSJNMjg1Ljg4IDk0LjM2NGMtMS4yMDQgMC0yLjIwNy0xLjAwNC0yLjIwNy0yLjE5VjE1LjgzN2MwLTEuMjIyIDEuMDAzLTIuMjA4IDIuMjA4LTIuMjA4IDEuMjA2IDAgMi4xOS45ODYgMi4xOSAyLjIwOHY3Ni4zMzhjMCAxLjE4Ni0uOTg1IDIuMTktMi4xOSAyLjE5ek0yNjcuOTA1IDkyLjE3NXYtNzYuMzQiLz48cGF0aCBkPSJNMjY3LjkwNSA5NC4zNjRjLTEuMjA2IDAtMi4xOS0xLjAwNC0yLjE5LTIuMTlWMTUuODM3YzAtMS4yMjIuOTg0LTIuMjA4IDIuMTktMi4yMDggMS4yMjMgMCAyLjIwOC45ODYgMi4yMDggMi4yMDh2NzYuMzM4YzAgMS4xODYtLjk4NSAyLjE5LTIuMjA4IDIuMTl6TTMwMy44NCA5Mi4xNzV2LTc2LjM0Ii8+PHBhdGggZD0iTTMwMy44NCA5NC4zNjRjLTEuMjA2IDAtMi4xOS0xLjAwNC0yLjE5LTIuMTlWMTUuODM3YzAtMS4yMjIuOTg0LTIuMjA4IDIuMTktMi4yMDggMS4yMiAwIDIuMTg3Ljk4NiAyLjE4NyAyLjIwOHY3Ni4zMzhjMCAxLjE4Ni0uOTY2IDIuMTktMi4xODggMi4xOXpNMzIxLjc5NSA5Mi4xNzV2LTc2LjM0Ii8+PHBhdGggZD0iTTMyMS43OTUgOTQuMzY0Yy0xLjIwNSAwLTIuMTg3LTEuMDA0LTIuMTg3LTIuMTlWMTUuODM3YzAtMS4yMjIuOTgtMi4yMDggMi4xODctMi4yMDggMS4yMDcgMCAyLjE5My45ODYgMi4xOTMgMi4yMDh2NzYuMzM4YzAgMS4xODYtLjk4NiAyLjE5LTIuMTkzIDIuMTl6TTMzOS43NTYgOTIuMTc1di03Ni4zNCIvPjxwYXRoIGQ9Ik0zMzkuNzU2IDk0LjM2NGMtMS4yMDUgMC0yLjE5My0xLjAwNC0yLjE5My0yLjE5VjE1LjgzN2MwLTEuMjIyLjk4OC0yLjIwOCAyLjE5My0yLjIwOCAxLjIgMCAyLjIyNi45ODYgMi4yMjYgMi4yMDh2NzYuMzM4YzAgMS4xODYtMS4wMjcgMi4xOS0yLjIyNiAyLjE5eiIvPjwvZz48ZyBmaWxsPSIjMTc1NjlFIj48cGF0aCBkPSJNNDAwLjk2NCAxMTEuNjY1djEwNi4wMTJoMTE2LjM1NFYxMTEuNjY1SDQwMC45NjR6bTEwNi41IDk2LjE1NmgtOTYuNjQ4di04Ni4zaDk2LjY1djg2LjN6TTQ0MC45NjcgMjAyLjgyMnYtNzYuMzQiLz48cGF0aCBkPSJNNDQwLjk2NyAyMDUuMDEyYy0xLjI0NCAwLTIuMTk0LS45NjgtMi4xOTQtMi4xOXYtNzYuMzM4YzAtMS4yMDQuOTUtMi4xNzIgMi4xOTQtMi4xNzIgMS4xNjggMCAyLjExNy45NjggMi4xMTcgMi4xNzJ2NzYuMzM4YzAgMS4yMi0uOTUgMi4xOS0yLjExNyAyLjE5ek00MjIuOTM3IDIwMi44MjJ2LTc2LjM0Ii8+PHBhdGggZD0iTTQyMi45MzcgMjA1LjAxMmMtMS4xNjggMC0yLjE5My0uOTY4LTIuMTkzLTIuMTl2LTc2LjMzOGMwLTEuMjA0IDEuMDI1LTIuMTcyIDIuMTkzLTIuMTcyIDEuMjM2IDAgMi4yNjMuOTY4IDIuMjYzIDIuMTcydjc2LjMzOGMwIDEuMjItMS4wMjcgMi4xOS0yLjI2MyAyLjE5ek00NTguOTIgMjAyLjgyMnYtNzYuMzQiLz48cGF0aCBkPSJNNDU4LjkyIDIwNS4wMTJjLTEuMjM2IDAtMi4yNjItLjk2OC0yLjI2Mi0yLjE5di03Ni4zMzhjMC0xLjIwNCAxLjAyNS0yLjE3MiAyLjI2Mi0yLjE3MiAxLjE2OCAwIDIuMTk0Ljk2OCAyLjE5NCAyLjE3MnY3Ni4zMzhjMCAxLjIyLTEuMDI2IDIuMTktMi4xOTQgMi4xOXpNNDc2Ljg4MiAyMDIuODIydi03Ni4zNCIvPjxwYXRoIGQ9Ik00NzYuODgyIDIwNS4wMTJjLTEuMjQ0IDAtMi4xOTQtLjk2OC0yLjE5NC0yLjE5di03Ni4zMzhjMC0xLjIwNC45NS0yLjE3MiAyLjE5NC0yLjE3MiAxLjE2OCAwIDIuMTg2Ljk2OCAyLjE4NiAyLjE3MnY3Ni4zMzhjMCAxLjIyLTEuMDE4IDIuMTktMi4xODYgMi4xOXpNNDk0LjgzNSAyMDIuODIydi03Ni4zNCIvPjxwYXRoIGQ9Ik00OTQuODM1IDIwNS4wMTJjLTEuMjM2IDAtMi4xODYtLjk2OC0yLjE4Ni0yLjE5di03Ni4zMzhjMC0xLjIwNC45NDgtMi4xNzIgMi4xODUtMi4xNzIgMS4xNjggMCAyLjE5NC45NjggMi4xOTQgMi4xNzJ2NzYuMzM4YzAgMS4yMi0xLjAyNyAyLjE5LTIuMTk1IDIuMTl6Ii8+PC9nPjwvc3ZnPg==\"\n},\n{\n  \"title\": \"Apache Cassandra\",\n  \"src\": \"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNzkuMTg0IiBoZWlnaHQ9IjE4Ny40NzciPjx0aXRsZT5BcGFjaGUgQ2Fzc2FuZHJhPC90aXRsZT48ZGVmcz48Y2xpcFBhdGggaWQ9ImIiPjxwYXRoIGQ9Ik0wIDc5Mmg2MTJWMEgwdjc5MnoiLz48L2NsaXBQYXRoPjxjbGlwUGF0aCBpZD0iYyI+PHBhdGggZD0iTTAgNzkyaDYxMlYwSDB2NzkyeiIvPjwvY2xpcFBhdGg+PGNsaXBQYXRoIGlkPSJkIj48cGF0aCBkPSJNOTYuMDA4IDcxNS45M2g4OC4yOXYtNjIuMTc2aC04OC4yOXY2Mi4xNzZ6Ii8+PC9jbGlwUGF0aD48Y2xpcFBhdGggaWQ9ImUiPjxwYXRoIGQ9Ik0wIDc5Mmg2MTJWMEgwdjc5MnoiLz48L2NsaXBQYXRoPjxjbGlwUGF0aCBpZD0iZiI+PHBhdGggZD0iTTAgNzkyaDYxMlYwSDB2NzkyeiIvPjwvY2xpcFBhdGg+PGNsaXBQYXRoIGlkPSJnIj48cGF0aCBkPSJNMCA3OTJoNjEyVjBIMHY3OTJ6Ii8+PC9jbGlwUGF0aD48Y2xpcFBhdGggaWQ9ImgiPjxwYXRoIGQ9Ik0wIDc5Mmg2MTJWMEgwdjc5MnoiLz48L2NsaXBQYXRoPjxjbGlwUGF0aCBpZD0iaSI+PHBhdGggZD0iTTEyMS4yMDIgNzA4LjM3OGg0NS45di00NS44NmgtNDUuOXY0NS44NnoiLz48L2NsaXBQYXRoPjxjbGlwUGF0aCBpZD0iaiI+PHBhdGggZD0iTTAgNzkyaDYxMlYwSDB2NzkyeiIvPjwvY2xpcFBhdGg+PGNsaXBQYXRoIGlkPSJrIj48cGF0aCBkPSJNNDAuNDAzIDcyNi4xODhoMjEyLjQwMlY2NjQuMzdINDAuNDAzdjYxLjgxOHoiLz48L2NsaXBQYXRoPjxjbGlwUGF0aCBpZD0ibCI+PHBhdGggZD0iTTAgNzkyaDYxMlYwSDB2NzkyeiIvPjwvY2xpcFBhdGg+PGNsaXBQYXRoIGlkPSJtIj48cGF0aCBkPSJNMzkuNTIgNjg4LjY0NEgyMzguOXYtNzMuODE4SDM5LjUydjczLjgxOHoiLz48L2NsaXBQYXRoPjxjbGlwUGF0aCBpZD0iYSI+PHBhdGggZD0iTTAgNzkyaDYxMlYwSDB2NzkyeiIvPjwvY2xpcFBhdGg+PC9kZWZzPjxnPjxnPjxnIGNsaXAtcGF0aD0idXJsKCNhKSIgdHJhbnNmb3JtPSJtYXRyaXgoMS4yNSAwIDAgLTEuMjUgLTQzLjU1MSA5MTUuOTM2KSI+PGc+PHBhdGggZD0iTTYxLjQ5IDYwOS4xMzdjMS44MjUgMCAzLjU1My0uNDMyIDQuNDE4LTEuMjk2LjE0NC0xLjM0NC0xLjA1Ny0zLjUwNC0xLjgyNS0zLjUwNC0uOTEyLjMzNi0xLjc3Ni41My0yLjgzMi41My00LjM2NyAwLTYuNTI4LTQuNTE0LTYuNTI4LTguOTc4IDAtMi43ODQuOTYtNC40NjUgMy4xNy00LjQ2NSAyLjM1IDAgNC43NSAxLjU4NCA2LjA5NSAyLjc4NC4zMzYtLjI0Ljc2OC0xLjAwOC43NjgtMS44NzIgMC0uOTYtLjI4OC0xLjg3Mi0xLjE1Mi0yLjczNi0xLjUzNi0xLjUzNy00LjEyOC0yLjgzMy03Ljg3My0yLjgzMy00LjMyIDAtNy4yOTYgMi40NDgtNy4yOTYgOC4xNiAwIDcuNDkgNC45NDQgMTQuMjEgMTMuMDEgMTQuMjFoLjA0N3oiIGZpbGw9IiMzNzM1MzUiLz48L2c+PGc+PHBhdGggZD0iTTc1LjYwMiA1OTEuNjY0YzIuMzUyIDAgNi42MjUgNC4xMyA3LjgyNSAxMiAuMDQ4LjQ4LjA5Ni42MjUuMTkyIDEuMTA1LS41My4xOS0xLjI1LjMzNS0xLjk3LjMzNS0xLjc3NiAwLTMuNi0uNTI4LTUuMjMyLTIuNzM2LTEuNjgtMi4zNTMtMi40LTUuMjgtMi40LTcuNjM0IDAtMi4wMTUuNTc2LTMuMDcyIDEuNTM2LTMuMDcyaC4wNDh6bS03LjczIDIuMTZjMCAyLjgzMi45NiA3Ljc3NyA0LjU2MiAxMS4zNzcgMy4wNzIgMy4xNyA2LjgxNiAzLjkzOCAxMC4yMjUgMy45MzggMi4yNTUgMCA1LjMyNy0uNzIgNy4yNDctMS4xMDUtLjQ4LTIuMTEyLTEuNjMyLTEwLjA4LTIuMTYtMTQuNjg4LS4yNC0xLjk3LS4zMzYtNC43MDUtLjI0LTUuNzEzLTEuNTg0LS42NzItNC41Ni0uODY0LTUuMzc3LS44NjQtLjQzIDAtLjUyOCAxLjk2OC0uMzgzIDMuODQuMDQ3LjYyNC4xNDQgMS41MzYuMTkgMS45Mi0xLjg3LTMuMTItNS41NjctNS43Ni05LjQ1NS01Ljc2LTIuNzg0IDAtNC42MSAyLjMwNC00LjYxIDcuMDA4di4wNDh6IiBmaWxsPSIjMzczNTM1Ii8+PC9nPjxnPjxwYXRoIGQ9Ik0xMDEuODU4IDYwOS4xMzdjMS45NjggMCAzLjg0LS43MiA0LjcwNS0xLjYzMi0uMDQ4LTEuMzQ1LTEuMTA0LTMuNi0yLjc4NS0yLjk3Ni0uNzIuMjQtMS40NC40My0yLjQuNDMtMS4yOTYgMC0yLjQtLjU3Ni0yLjQtMS43NzUgMC0uOTEyLjY3Mi0xLjU4NSAzLjg4OC0zLjg0IDIuMzA1LTEuNjggMy4yMTctMy4xNyAzLjIxNy01LjI4IDAtMy41MDYtMy4zMTMtNy4yOTgtOS4wNzMtNy4yOTgtMi4zNTIgMC00LjQxNy45MTItNS4wOSAxLjg3Mi0uODYzIDEuNDQtLjE5IDQuMjcuNzcgMy43OTIgMS4yNDgtLjYyNCAzLjMxMi0xLjI5NyA0Ljk5Mi0xLjI5NyAxLjU4NCAwIDIuNTkyLjcyIDIuNTkyIDEuNjggMCAuODE2LS43MiAxLjUzNy0zLjY0OCAzLjYtMi40NSAxLjgyNS0zLjIxNyAzLjUwNS0zLjIxNyA1LjQyNSAwIDMuOTg0IDMuNDA4IDcuMjk3IDguNCA3LjI5N2guMDQ4eiIgZmlsbD0iIzM3MzUzNSIvPjwvZz48Zz48cGF0aCBkPSJNMTE4LjQxNyA2MDkuMTM3YzEuOTcgMCAzLjg0LS43MiA0LjcwNS0xLjYzMi0uMDQ4LTEuMzQ1LTEuMTAzLTMuNi0yLjc4NC0yLjk3Ni0uNzIuMjQtMS40NC40My0yLjQuNDMtMS4yOTYgMC0yLjQtLjU3Ni0yLjQtMS43NzUgMC0uOTEyLjY3Mi0xLjU4NSAzLjg4OC0zLjg0IDIuMzA0LTEuNjggMy4yMTYtMy4xNyAzLjIxNi01LjI4IDAtMy41MDYtMy4zMTMtNy4yOTgtOS4wNzMtNy4yOTgtMi4zNTMgMC00LjQxNy45MTItNS4wOSAxLjg3Mi0uODYzIDEuNDQtLjE5IDQuMjcuNzcgMy43OTIgMS4yNDctLjYyNCAzLjMxLTEuMjk3IDQuOTktMS4yOTcgMS41ODUgMCAyLjU5My43MiAyLjU5MyAxLjY4IDAgLjgxNi0uNzIgMS41MzctMy42NDggMy42LTIuNDQ4IDEuODI1LTMuMjE2IDMuNTA1LTMuMjE2IDUuNDI1IDAgMy45ODQgMy40MDcgNy4yOTcgOC40IDcuMjk3aC4wNDd6IiBmaWxsPSIjMzczNTM1Ii8+PC9nPjxnPjxwYXRoIGQ9Ik0xMzMuNTM2IDU5MS42NjRjMi4zNTMgMCA2LjYyNSA0LjEzIDcuODI1IDEyIC4wNS40OC4wOTguNjI1LjE5NCAxLjEwNS0uNTMuMTktMS4yNDguMzM1LTEuOTcuMzM1LTEuNzc1IDAtMy42LS41MjgtNS4yMzItMi43MzYtMS42OC0yLjM1My0yLjQtNS4yOC0yLjQtNy42MzQgMC0yLjAxNS41NzYtMy4wNzIgMS41MzctMy4wNzJoLjA0NnptLTcuNzMgMi4xNmMwIDIuODMyLjk2MiA3Ljc3NyA0LjU2MiAxMS4zNzcgMy4wNzIgMy4xNyA2LjgxNiAzLjkzOCAxMC4yMjUgMy45MzggMi4yNTYgMCA1LjMzLS43MiA3LjI1LTEuMTA1LS40OC0yLjExMi0xLjYzMy0xMC4wOC0yLjE2LTE0LjY4OC0uMjQyLTEuOTctLjMzNy00LjcwNS0uMjQyLTUuNzEzLTEuNTgzLS42NzItNC41NTgtLjg2NC01LjM3NS0uODY0LS40MyAwLS41MjggMS45NjgtLjM4NCAzLjg0LjA1LjYyNC4xNDUgMS41MzYuMTkzIDEuOTItMS44NzItMy4xMi01LjU2OC01Ljc2LTkuNDU2LTUuNzYtMi43ODUgMC00LjYxIDIuMzA0LTQuNjEgNy4wMDh2LjA0OHoiIGZpbGw9IiMzNzM1MzUiLz48L2c+PGc+PHBhdGggZD0iTTE1OC42ODggNjAyLjg5N2MyLjIxIDMuNTUyIDUuMDg4IDYuMjQgOS4xMiA2LjI0IDMuNDEgMCA0LjUxMy0zLjE2OCAzLjg5LTcuNjgtLjMzNi0yLjExMy0uOTEyLTUuMTM3LTEuMjk3LTcuOTItLjMzNS0yLjM1NC0uNTc1LTQuNDY1LS41MjYtNS45MDYtMS4yNDgtLjYyMy00Ljg5Ny0uODYzLTUuNzEzLS44NjMtLjMzNSAwLS4zODQgMi42NC4wNSA1LjQyNS4zODIgMi4zMDQgMS4yIDYuNDggMS41ODMgOC44OC4yNCAxLjM5Mi4xOTIgMy4wNzMtMS4xNTIgMy4wNzMtMS43NzYgMC02LTIuODMzLTguMTEyLTE0LjQ1LS4xNDUtLjk2LS41MjgtMS41MzUtMS4wNTctMS44Ny0uNzE4LS40MzQtMi4yNTUtLjgxOC01LjM3NC0uODY2LjU3NiAyLjkyNyAxLjQ4OCA4LjkyOCAyLjE2IDEzLjM0NC42MjMgNC4wMzIuODY0IDYuNjI1LjcyIDcuNjMzLjgxNi4yODggNS4wOSAxLjIgNS41NjcgMS4yLjUzIDAgLjYyNS0xLjQ4OC4xNDUtNS4wOS0uMDQ3LS4zMzUtLjA5Ni0uODYyLS4xNDUtMS4xNWguMTQ1eiIgZmlsbD0iIzM3MzUzNSIvPjwvZz48Zz48cGF0aCBkPSJNMTgzLjA3MyA1OTEuNzFjMi4xMSAwIDYuMzg1IDMuOTM4IDcuNTg0IDEwLjg5OC4wNS4zODQuMTkzIDEuMTA0LjI5IDEuNTM3LS42MjYuNTc2LTEuNDQyLjk2LTIuNzM3Ljk2LTQuODUgMC03LjAxLTUuODEtNy4wMS05Ljk4NiAwLTIuMjU3Ljc3LTMuNDEgMS44MjQtMy40MWguMDV6bS0zLjE2OC00Ljk0M2MtMy4wNzIgMC00Ljk5MiAyLjczNi00Ljk5MiA3LjQ0IDAgNy43NzcgNC44NDcgMTQuOTMgMTMuMDA4IDE0LjkzIDEuNDQyIDAgMi43MzctLjM4NCAzLjU1My0uODY0LjQzMiAyLjIwOCAxLjQ0IDkuMDI1IDEuNDkgMTEuMDQgMS4zNDIuMjQgNC4yMjMuNjcyIDUuNTE4LjY3Mi41MyAwIC42NzUtLjUyNy40ODItMS43MjctMS4xNTMtNy4yLTMuMjE1LTIxLjAyNi0zLjYtMjQuMS0uMjktMi41OS0uMzM2LTUuMTM1LS4yOS02LjU3NS0xLjUzNC0uNjcyLTQuNjU1LS44MTYtNS40Ny0uODE2LS4zMzggMC0uNTMgMi4yMDgtLjQzMyA0LjE3Ni4wNDguNjI0LjE0MyAxLjUzNy4xNDMgMS42OC0yLjQtMy45MzYtNS43MTMtNS44NTYtOS4zNi01Ljg1NmgtLjA0OHoiIGZpbGw9IiMzNzM1MzUiLz48L2c+PGc+PHBhdGggZD0iTTIwOC4wMzIgNjAyLjIyNGMyLjU0NSA1LjY2NSA1LjU2OCA2LjkxMyA3LjUzNyA2LjkxMy42MjQgMCAxLjU4My0uMzg0IDIuMDE1LS44NjQuMTkzLTEuNTg0LTEuMDU1LTQuNzUyLTIuMTYtNS45NTItLjU3Ny4yOS0xLjI5NS41NzctMi4xMTIuNTc3LTEuNjMzIDAtNC44NS0yLjU0NS02Ljg2NS0xMy40OS0uMTQ1LS45MTItLjQzMi0xLjI5Ni0uOTYtMS41MzYtLjgxNS0uNDgtNC4wMzItLjg2My01LjU2Ny0uOTEuNzIgMy45MzYgMS45NjcgMTEuOTUyIDIuNDQ4IDE2LjY1Ny4xNDQgMS4yLjE5IDMuNDA4LjA5NiA0LjI3Mi45MTIuNDMgNC41MTMgMS4yNDcgNS4zMjggMS4yNDcuNDMzIDAgLjc3LTIuNjQuMDk1LTYuOTEzaC4xNDV6IiBmaWxsPSIjMzczNTM1Ii8+PC9nPjxnPjxwYXRoIGQ9Ik0yMjQuOTc1IDU5MS42NjRjMi4zNTQgMCA2LjYyNSA0LjEzIDcuODI2IDEyIC4wNDguNDguMDk3LjYyNS4xOTMgMS4xMDUtLjUyOC4xOS0xLjI0OC4zMzUtMS45Ny4zMzUtMS43NzUgMC0zLjYtLjUyOC01LjIzMi0yLjczNi0xLjY3OC0yLjM1My0yLjQtNS4yOC0yLjQtNy42MzQgMC0yLjAxNS41NzctMy4wNzIgMS41MzgtMy4wNzJoLjA0N3ptLTcuNzMgMi4xNmMwIDIuODMyLjk2MiA3Ljc3NyA0LjU2MiAxMS4zNzcgMy4wNzIgMy4xNyA2LjgxNiAzLjkzOCAxMC4yMjUgMy45MzggMi4yNTYgMCA1LjMyOC0uNzIgNy4yNS0xLjEwNS0uNDgtMi4xMTItMS42MzMtMTAuMDgtMi4xNi0xNC42ODgtLjI0LTEuOTctLjMzOC00LjcwNS0uMjQtNS43MTMtMS41ODUtLjY3Mi00LjU2LS44NjQtNS4zNzgtLjg2NC0uNDMgMC0uNTI3IDEuOTY4LS4zODQgMy44NC4wNDguNjI0LjE0NCAxLjUzNi4xOTMgMS45Mi0xLjg3My0zLjEyLTUuNTY4LTUuNzYtOS40NTctNS43Ni0yLjc4NSAwLTQuNjEgMi4zMDQtNC42MSA3LjAwOHYuMDQ4eiIgZmlsbD0iIzM3MzUzNSIvPjwvZz48L2c+PC9nPjwvZz48Zz48Zz48Zz48ZyBjbGlwLXBhdGg9InVybCgjYikiIHRyYW5zZm9ybT0ibWF0cml4KDEuMjUgMCAwIC0xLjI1IC00My41NTEgOTE1LjkzNikiPjxnPjxwYXRoIGQ9Ik0yMTAuODc4IDY5MC40ODNjMS41ODQtMTguNDUyLTI3LjQ1NS0zNi4wMTQtNjQuODYtMzkuMjIzLTM3LjQwMy0zLjIxLTY5LjAxIDkuMTUtNzAuNTkgMjcuNjAyLTEuNTg1IDE4LjQ1NSAyNy40NTQgMzYuMDE2IDY0Ljg1OCAzOS4yMjUgMzcuNDA0IDMuMjA4IDY5LjAxLTkuMTUgNzAuNTkyLTI3LjYwNCIgZmlsbD0iI2JiZTZmYiIvPjwvZz48L2c+PC9nPjxnPjxnIGNsaXAtcGF0aD0idXJsKCNjKSIgdHJhbnNmb3JtPSJtYXRyaXgoMS4yNSAwIDAgLTEuMjUgLTQzLjU1MSA5MTUuOTM2KSI+PGc+PGc+PGcgY2xpcC1wYXRoPSJ1cmwoI2QpIiBvcGFjaXR5PSIuMzUiPjxnPjxwYXRoIGQ9Ik0xNDEuMzg0IDcxNS45MjNjLTE0LjI2OC4yMzItMzAuOTY0LTUuNDMzLTQzLjM4Ny0xMC43MzgtMS4yOTMtMy43MjYtMS45OS03LjY5LTEuOTktMTEuNzk3IDAtMjEuODg4IDE5Ljc2NS0zOS42MzQgNDQuMTQ2LTM5LjYzNCAyNC4zOCAwIDQ0LjE0NSAxNy43NDYgNDQuMTQ1IDM5LjYzNCAwIDYuOTI3LTEuOTg0IDEzLjQzNS01LjQ2MyAxOS4xLTkuOTQgMS41NDYtMjMuNjEgMy4yMS0zNy40NSAzLjQzNSIgZmlsbD0iI2ZmZiIvPjwvZz48L2c+PC9nPjwvZz48L2c+PC9nPjxnPjxnIGNsaXAtcGF0aD0idXJsKCNlKSIgdHJhbnNmb3JtPSJtYXRyaXgoMS4yNSAwIDAgLTEuMjUgLTQzLjU1MSA5MTUuOTM2KSI+PGc+PHBhdGggZD0iTTE0MC4xNTMgNzE1LjkyOGMtNy45LjQ4Mi0yMS41MTQtMy42NC0zMi44NjctNy43NS0xLjcyNS00LjA3LTIuNjgzLTguNTI2LTIuNjgzLTEzLjIgMC0xOS4xOCAxNy4zODgtMzQuNzI2IDM1Ljc4Mi0zNC43MjYgMTguMjczIDAgMzQuNDQgMTUuNTcyIDM1Ljc4MiAzNC43MjUuNDM2IDYuMjM3LTEuNzEgMTIuMTE0LTQuNjkyIDE3LjE4LTExLjc3IDIuMDc0LTI0LjI2IDMuMzQtMzEuMzIyIDMuNzciIGZpbGw9IiNmZmYiLz48L2c+PC9nPjwvZz48Zz48ZyBjbGlwLXBhdGg9InVybCgjZikiIHRyYW5zZm9ybT0ibWF0cml4KDEuMjUgMCAwIC0xLjI1IC00My41NTEgOTE1LjkzNikiPjxnPjxwYXRoIGQ9Ik0xMTkuODgyIDY5Ny40OTVjLjk3IDIuMTQ2IDIuNDM3IDMuMTk3IDMuODYgNC45OTYtLjE2LjQyNy0uNTA1IDEuODItLjUwNSAyLjMwMyAwIDIuMTU2IDEuNzUgMy45MDYgMy45MDYgMy45MDYuNTEgMCAuOTk1LS4xMDIgMS40NC0uMjggNi40NjUgNC45MjggMTQuOTc2IDcuMDc2IDIzLjUzIDUuMTY0Ljc4LS4xNzYgMS41NDYtLjM5IDIuMjk4LS42MjMtOC40NTIgMS4xNzMtMTcuOTgtMS44Mi0yNC40Ni03LjA1Mi4xOTctLjQ2Ny43NDYtMS44MDIuNzQ2LTIuMzQgMC0yLjE1Ni0xLjM5Ni0yLjY4LTMuNTUzLTIuNjgtLjQ5IDAtLjk1OC4wOTMtMS4zOS4yNTgtMS40NjUtMS45NjYtMy4yNi01LjcxLTQuMTM3LTguMDUyIDMuNTg0LTMuMjA2IDYuODIyLTQuMzY4IDExLjA0Mi01Ljk0NS0uMDEuMi4xNDUuMzg2LjE0NS41OSAwIDYuNTA0IDUuNzI1IDExLjc5IDEyLjIzIDExLjc5IDUuODI3IDAgMTAuNjUzLTQuMjQgMTEuNTk1LTkuOCAyLjkwOCAxLjg1IDUuNzIgMy4yNyA3Ljg2MyA2LjAxLS41LjYxLTEuMDM4IDIuMzM4LTEuMDM4IDMuMTg4IDAgMS45NTcgMS41ODggMy41NDQgMy41NDUgMy41NDQuMjc3IDAgLjU0My0uMDQuODAyLS4xIDEuMDg3IDIuMjM2IDEuOTA4IDQuNjA2IDIuNDMzIDcuMDUtMTAuMTcgNy41My0yOS44NDcgNi41MDItMjkuODQ3IDYuNTAycy0xNS42NTguODE3LTI2LjI1OC00LjM1Yy43MDctNS4xMSAyLjc0Ni05Ljk3IDUuNzU0LTE0LjA4IiBmaWxsPSIjMzczNTM1Ii8+PC9nPjxnPjxwYXRoIGQ9Ik0xNjguNDkgNzAwLjQyOGMuNzItLjY0OCAxLjExMi0xLjIxNyAxLjQyLTEuNzcuOTUyLTEuNzEtLjk1Ni0zLjI3Ni0yLjkxMy0zLjI3Ni0uMiAwLS4zOS4wMjctLjU4Mi4wNi0yLjIwNS0zLjQ0Ny02LjA2Ny03Ljg2Ni05LjQ5OC0xMC4wOSA1LjI2LS44NjIgMTAuMjIyLTIuOTcgMTQuMTctNi4yMjUgMi44NzUgNS4xNSA1LjA4IDEyLjU5IDUuMDggMTguOTA3IDAgNC44MS0yLjEyMyA4LjMzNC01LjMyOCAxMC45Mi0uMTctMi41NzYtMS41NDQtNi4xOC0yLjM1LTguNTI2IiBmaWxsPSIjMzczNTM1Ii8+PC9nPjxnPjxwYXRoIGQ9Ik0xMjUuNzg0IDY2Ny44MDNjMS43NTMgNC44NCA2LjA2NSA4LjU5MiAxMC4xNDQgMTEuODkyLS41OTcuODE3LTEuNDkyIDIuODQtMS44NjUgMy43OTgtNC45NzUgMS41MTMtOS4zNzcgNC4zNDUtMTIuNzkgOC4wOTQtLjAyNi0uMTEtLjA1Ny0uMjE1LS4wODMtLjMyNC0uNjQzLTIuODgtLjc2LTUuNzY4LS40NC04LjU4NCAyLjM4LS40NDUgNC4xODQtMi41MzIgNC4xODQtNS4wNDMgMC0xLjQ5LTEuMzA1LTMuNjQ3LTIuMzE4LTQuNTg2IDEuMS0yLjM3NSAxLjg1Mi0zLjUyIDMuMTY4LTUuMjQ3IiBmaWxsPSIjMzczNTM1Ii8+PC9nPjxnPjxwYXRoIGQ9Ik0xMjUuNDc2IDY2My43NGMtMi4wOSAyLjA3OC0zLjUzNyA2LjIyNS00Ljg5NCA4LjgzLS4yNTQtLjA0LS41MTQtLjA2Ny0uNzgtLjA2Ny0yLjgzNiAwLTUuODA3IDIuMzgtNS4xMzUgNS4xMzQuMzcyIDEuNTI0IDEuNDI0IDIuNTIgMy4xMzcgMy4zNTMtLjM5IDMuMTU3LS40OTYgNy42OTUuMjM3IDEwLjk3Ny4yMS45NC42NTYgMS4zOC45NSAyLjI3My0zLjEyOCA0LjU4LTUuMTUgMTAuNTktNS4xNSAxNi41NTIgMCAuMjE4LjAxLjQzMy4wMTYuNjUtNS4yODgtMi42NTMtOS4yNTMtNi44My05LjI1My0xMy40MDggMC0xNC41NDggOC4zOC0yOC44MiAyMC44NDYtMzQuNDEzLjAwOC4wNC4wMTYuMDguMDI2LjEyIiBmaWxsPSIjMzczNTM1Ii8+PC9nPjxnPjxwYXRoIGQ9Ik0xNTYuMTMgNjgzLjg1Yy0xLjYxLTQuNTgtNS45NjYtNy44NzItMTEuMS03Ljg3Mi0yLjc0NSAwLTUuMjY0Ljk0Ny03LjI2NiAyLjUyLTQuMTI3LTMuMjEzLTcuODctOC44Ni05Ljc3NC0xMy43NTcuODU0LS45MTggMS40NS0xLjY3NCAyLjQwNy0yLjQ5IDIuODg3LS43NSA2Ljg2MyAwIDkuOTg4IDAgMTIuNTcgMCAyMy43MDMgNS41OTMgMzAuMDg2IDE1LjQtNC4yNDMgMi45MzgtOS4yNSA1LjczNS0xNC4zNCA2LjIiIGZpbGw9IiMzNzM1MzUiLz48L2c+PC9nPjwvZz48Zz48ZyBjbGlwLXBhdGg9InVybCgjZykiIHRyYW5zZm9ybT0ibWF0cml4KDEuMjUgMCAwIC0xLjI1IC00My41NTEgOTE1LjkzNikiPjxnPjxwYXRoIGQ9Ik0xMTkuNTYgNjk1Ljc5NGMuOTcgMi4xNDYgMi4xODQgNC4xMzIgMy42MDUgNS45My0uMTU4LjQyNi0uMjUuODg1LS4yNSAxLjM2OCAwIDIuMTU2IDEuNzUgMy45MDYgMy45MDYgMy45MDYuNTEgMCAuOTk2LS4xIDEuNDQtLjI3OCA2LjQ2NiA0LjkyNyAxNC45NzcgNy4wNzUgMjMuNTMgNS4xNjMuNzgtLjE3NiAxLjU0Ny0uMzkgMi4zLS42MjMtOC40NTQgMS4xNzItMTcuMTg4LTEuNDItMjMuNjctNi42NS4yLS40NjcuMzA3LS45OC4zMDctMS41MTggMC0yLjE1Ny0xLjc1LTMuOTA2LTMuOTA2LTMuOTA2LS40OSAwLS45NTcuMDk0LTEuMzkuMjYtMS40NjQtMS45NjctMi42Ni00LjE0LTMuNTQtNi40OCAzLjA4LTMuMzE4IDYuODU3LTUuOTQgMTEuMDc2LTcuNTE4LS4wMS4yLS4wMy40LS4wMy42MDUgMCA2LjUwMyA1LjI3IDExLjc3NSAxMS43NzQgMTEuNzc1IDUuODI4IDAgMTAuNjU0LTQuMjM4IDExLjU5Ni05Ljc5OCAyLjkwOCAxLjg1IDUuNDkyIDQuMjI2IDcuNjM0IDYuOTY4LS41LjYxLS44MSAxLjM4LS44MSAyLjIzIDAgMS45NTYgMS41ODggMy41NDMgMy41NDUgMy41NDMuMjc3IDAgLjU0My0uMDQuODAyLS4xIDEuMDg4IDIuMjM3IDEuOTEgNC42MDcgMi40MzQgNy4wNS0xMC4xNyA3LjUzLTI5Ljg0NiA2LjUwMy0yOS44NDYgNi41MDNzLTE1LjY1OC44MTctMjYuMjU4LTQuMzVjLjcwNy01LjExIDIuNzQ2LTkuOTcgNS43NTQtMTQuMDgiIGZpbGw9IiMxMjg3YjEiLz48L2c+PGc+PHBhdGggZD0iTTE2OS4wNCA2OTkuODQ4Yy43Mi0uNjQ4IDEuMTgtMS41NzcgMS4xOC0yLjYyIDAtMS45NTgtMS41ODgtMy41NDYtMy41NDUtMy41NDYtLjIgMC0uMzkuMDI3LS41ODIuMDYtMi4yMDUtMy40NDctNS4xMjctNi4zODUtOC41Ni04LjYxIDUuMDczLS43OTIgOS44NDctMi45NDQgMTMuNzk0LTYuMiAyLjg3NSA1LjE1IDQuNTE4IDExLjA4NCA0LjUxOCAxNy40MDIgMCA0LjgxLTIuMTIzIDguMzM0LTUuMzI4IDEwLjkyLS4xNjgtMi41NzYtLjY3Mi01LjA2LTEuNDc3LTcuNDA2IiBmaWxsPSIjMTI4N2IxIi8+PC9nPjxnPjxwYXRoIGQ9Ik0xMjYuMzI1IDY2Ni42NGMxLjc1MyA0Ljg0IDQuOCA5LjE4NSA4Ljg3OCAxMi40ODQtLjU5Ny44MTgtMS4wOSAxLjcxLTEuNDYyIDIuNjctNC45NzUgMS41MTItOS4zNzYgNC4zNDQtMTIuNzkgOC4wOTMtLjAyNS0uMTEtLjA1Ny0uMjE1LS4wODItLjMyNC0uNjQ0LTIuODgtLjc2Mi01Ljc2OC0uNDQtOC41ODQgMi4zOC0uNDQ1IDQuMTg0LTIuNTMyIDQuMTg0LTUuMDQzIDAtMS40OS0uNjQtMi44MjgtMS42NTItMy43NjcuOTItMS45NDggMi4wNS0zLjgwNCAzLjM2NS01LjUzIiBmaWxsPSIjMTI4N2IxIi8+PC9nPjxnPjxwYXRoIGQ9Ik0xMjUuNDYyIDY2My43OThjLTIuMDkgMi4wOC0zLjg0NiA0LjQ2Ny01LjIwMiA3LjA3LS4yNTUtLjA0LS41MTUtLjA2NS0uNzgtLjA2NS0yLjgzNiAwLTUuMTM1IDIuMy01LjEzNSA1LjEzNCAwIDIuMDMyIDEuMTg0IDMuNzg0IDIuODk3IDQuNjE2LS4zOSAzLjE1Ni0uMjU3IDYuNDMyLjQ3NyA5LjcxNC4yMS45MzguNDY1IDEuODU0Ljc2IDIuNzUtMy4xMyA0LjU3Ny00Ljk2MiAxMC4xMTItNC45NjIgMTYuMDc1IDAgLjIxOC4wMS40MzMuMDE1LjY0OC01LjI4OC0yLjY1LTkuMjUzLTYuODMtOS4yNTMtMTMuNDA2IDAtMTQuNTUgOC42ODgtMjcuMDYgMjEuMTU1LTMyLjY1NC4wMS4wNC4wMTcuMDguMDI3LjExOCIgZmlsbD0iIzEyODdiMSIvPjwvZz48Zz48cGF0aCBkPSJNMTU1LjgxIDY4Mi4xNWMtMS42MTItNC41OC01Ljk2OC03Ljg3Mi0xMS4xLTcuODcyLTIuNzQ3IDAtNS4yNjYuOTQ3LTcuMjY4IDIuNTItNC4xMjctMy4yMTMtNy4yNDItNy41OTQtOS4xNDQtMTIuNDkzLjg1My0uOTIgMS43NjUtMS43ODUgMi43MjMtMi42IDIuODktLjc1IDUuOTE4LTEuMTU0IDkuMDQzLTEuMTU0IDEyLjU3IDAgMjMuNjIgNi40OSAzMC4wMDQgMTYuMjk2LTQuMjQ0IDIuOTQtOS4xNjggNC44NC0xNC4yNTggNS4zMDUiIGZpbGw9IiMxMjg3YjEiLz48L2c+PC9nPjwvZz48Zz48ZyBjbGlwLXBhdGg9InVybCgjaCkiIHRyYW5zZm9ybT0ibWF0cml4KDEuMjUgMCAwIC0xLjI1IC00My41NTEgOTE1LjkzNikiPjxnPjxnPjxnIGNsaXAtcGF0aD0idXJsKCNpKSI+PGc+PHBhdGggZD0iTTE1Ni4yMjIgNjg1LjE4N2wxMC44OCAyLjU5NS0xMC45Mi41NTcgOC44ODYgNi43OS0xMC4wODQtMy42MTQgNi44NTMgOS40OTctOS40NjUtNi4yOSAzLjMxIDExLjExNi02LjUtOS4xNjQtLjE1IDExLjU4LTQuMjc2LTEwLjMxNS0zLjU2NiAxMC40MzguMTkzLTEyLjI5NS02LjE2MyAxMS4wMiAzLjMzNS0xMS43LTkuOTk3IDcuMjcgNy44My05Ljg0LTEyLjQxIDQuNTYzIDkuNzk1LTcuMjQ3LTEyLjU2LS4zODcgMTIuODQyLTMuMzE0LTEyLjg1My0yLjc4IDEyLjY4Ny0uOTItMTAuNy02Ljg1IDExLjAxNyAzLjk5My03LjY0NC05LjY4IDkuNjYgNy43OS0zLjQ4LTEyLjk5MiA3LjQ1OCAxMC41NzMtMS4wNDQtMTIuNDg2IDQuMjMzIDExLjMyIDMuNjAyLTExLjg5OC44NzYgMTEuOTMyIDUuMzQ4LTEwLjE4LTMuMTYgMTEuNjQ0IDkuNzkzLTcuNTg2LTYuMzIzIDkuNjcyIDEwLjc0NC00LjE4Ni04LjIxNCA4LjA3MyAxMS4wMTYtLjg2Ny0xMC44NSA0LjE2NHoiIGZpbGw9IiNmZmYiLz48L2c+PC9nPjwvZz48L2c+PC9nPjwvZz48Zz48ZyBjbGlwLXBhdGg9InVybCgjaikiIHRyYW5zZm9ybT0ibWF0cml4KDEuMjUgMCAwIC0xLjI1IC00My41NTEgOTE1LjkzNikiPjxnPjxnPjxnIGNsaXAtcGF0aD0idXJsKCNrKSIgb3BhY2l0eT0iLjM1Ij48Zz48cGF0aCBkPSJNNDAuNDAzIDY2NC4zN2MzMy43NCAzMy43NCA2MC42ODcgNDQuMTU1IDg1LjE0MyA0OC45MSAzLjIzNi42MyAzLjg0OCA3LjcgMy44NDggNy43cy40NTMtNS4yMDggMi43MTgtNS44ODdjMi4yNjQtLjY4IDUuMjA3IDguMTUyIDUuMjA3IDguMTUycy0yLjcxOC03LjkyNiAwLTguMzhjMi43MTctLjQ1MiA3LjY5OCA3LjcgNy42OTggNy43cy0yLjAzNy03LjAyLS42NzgtNy40NzJjMS4zNTctLjQ1MyA4LjE1IDEwLjE5IDguMTUgMTAuMTlzLTQuMDc2LTcuMDItLjIyNi03LjdjMy44NS0uNjggOS40NjcgNC43OSA5LjQ2NyA0Ljc5cy00LjQxNS01LjAwNC0yLjQ0Ny01LjY5NWM4LjM4LTIuOTQ1IDE1LjE2IDcuOTQ1IDE1LjE2IDcuOTQ1cy0xLjU3Mi00Ljc3NS01LjY0OC05Ljk4M2M4LjgzLTIuMjY0IDE1LjM5IDExLjA0IDE1LjM5IDExLjA0bC02LjU2LTEzLjMwNGMzLjM5Ny0xLjgxMyAxNi45ODUgMTMuODEyIDE2Ljk4NSAxMy44MTJzLTcuMDItMTIuMjI4LTExLjA5Ni0xNC43MThjMi4yNjQtMS44MTIgMTAuNDE2IDUuNDM0IDEwLjQxNiA1LjQzNHMtNi41NjctOC4xNS00LjA3Ni04LjYwNGMzLjYyMy0yLjk0NCAxNi45ODIgMTUuMTcgMTYuOTgyIDE1LjE3cy01LjIwNy0xMC42NC0xMi45MDYtMTkuMDJjNi40MzUtMy4yMiAyMi40MTggMTcuNDM2IDIyLjQxOCAxNy40MzZzLS40NTMtNi41NjctMTIuMDAyLTE2Ljk4M2M4LjYwNSAxLjEzMiAxOS43IDE3LjQzNiAxOS43IDE3LjQzNnMtNC4wNzUtMTIuMjMtMTMuODEzLTIwLjgzM2M4LjQ1Ljg4IDIxLjk2NCAyMS43MzggMjEuOTY0IDIxLjczOHMtNS4yMDctMTQuNDkyLTE1Ljg1LTIyLjg3YzExLjc3Ni0yLjYwNSAyOC43NiAxNC45NDQgMjguNzYgMTQuOTQ0cy02LjY4LTEyLjQ1Ni0xNS40LTE3LjU1YzkuNzM4LTMuNzM2IDIzLjA5OCAxMS42NjIgMjMuMDk4IDExLjY2MnMtMTMuMzYtMjAuNjA3LTM0LjY0NS0xOS43Yy02Ljk4NC4yOTYtMjguMTEgMjEuMTg3LTczLjM2OCAxOS40NzMtNTkuNzgtMi4yNjUtNzIuNDYtMjcuNjI2LTEwNC4zOS00NC44MzUiIGZpbGw9IiMzNzM1MzUiLz48L2c+PC9nPjwvZz48L2c+PGc+PHBhdGggZD0iTTQxLjc4NiA2NjYuOTMzYzMzLjc0IDMzLjc0IDYwLjY4NiA0NC4xNTQgODUuMTQyIDQ4LjkxIDMuMjM3LjYzIDMuODUgNy43IDMuODUgNy43cy40NS01LjIxIDIuNzE3LTUuODg4YzIuMjY0LS42OCA1LjIwNyA4LjE1IDUuMjA3IDguMTVzLTIuNzE3LTcuOTI1IDAtOC4zNzdjMi43MTgtLjQ1MiA3LjcgNy43IDcuNyA3LjdzLTIuMDM4LTcuMDItLjY4LTcuNDczYzEuMzU4LS40NTMgOC4xNSAxMC4xOSA4LjE1IDEwLjE5cy00LjA3NS03LjAyLS4yMjUtNy43YzMuODUtLjY4IDkuNDY3IDQuNzkgOS40NjcgNC43OXMtNC40MTYtNS4wMDQtMi40NDgtNS42OTVjOC4zOC0yLjk0NCAxNS4xNTcgNy45NDUgMTUuMTU3IDcuOTQ1cy0xLjU3LTQuNzc1LTUuNjQ1LTkuOTgzYzguODMtMi4yNjUgMTUuMzkgMTEuMDQgMTUuMzkgMTEuMDRsLTYuNTYtMTMuMzA1YzMuMzk3LTEuODEgMTYuOTgzIDEzLjgxMiAxNi45ODMgMTMuODEycy03LjAxNy0xMi4yMjctMTEuMDkzLTE0LjcxOGMyLjI2NC0xLjgxMiAxMC40MTYgNS40MzQgMTAuNDE2IDUuNDM0cy02LjU2Ny04LjE1Mi00LjA3Ni04LjYwNGMzLjYyMy0yLjk0NSAxNi45ODIgMTUuMTcgMTYuOTgyIDE1LjE3cy01LjIxLTEwLjY0Mi0xMi45MDctMTkuMDJjNi40MzUtMy4yMiAyMi40MTggMTcuNDM2IDIyLjQxOCAxNy40MzZzLS40NTItNi41NjgtMTItMTYuOTg0YzguNjA0IDEuMTMzIDE5LjcgMTcuNDM3IDE5LjcgMTcuNDM3cy00LjA3Ni0xMi4yMjctMTMuODE0LTIwLjgzMmM4LjQ1Ljg4IDIxLjk2NCAyMS43MzggMjEuOTY0IDIxLjczOHMtNS4yMDctMTQuNDkyLTE1Ljg1LTIyLjg3YzExLjc3Ni0yLjYwNCAyOC43NiAxNC45NDQgMjguNzYgMTQuOTQ0cy02LjY4LTEyLjQ1My0xNS40LTE3LjU0OGM5LjczOC0zLjczNiAyMy4wOTggMTEuNjYyIDIzLjA5OCAxMS42NjJzLTEzLjM2LTIwLjYwNy0zNC42NDctMTkuN2MtNi45OC4yOTctMjguMTA2IDIxLjE4OC03My4zNjYgMTkuNDczLTU5Ljc4LTIuMjY0LTcyLjQ2LTI3LjYyNS0xMDQuMzg4LTQ0LjgzNCIgZmlsbD0iIzM3MzUzNSIvPjwvZz48L2c+PC9nPjxnPjxnIGNsaXAtcGF0aD0idXJsKCNsKSIgdHJhbnNmb3JtPSJtYXRyaXgoMS4yNSAwIDAgLTEuMjUgLTQzLjU1MSA5MTUuOTM2KSI+PGc+PGc+PGcgY2xpcC1wYXRoPSJ1cmwoI20pIiBvcGFjaXR5PSIuMzUiPjxnPjxwYXRoIGQ9Ik0zOS41MiA2NjAuNjhjMTcuODMxLTguOTQ1IDM0LjEzNiAxLjM1OCA1NC42ODUtNC40MzMgMTUuNjI0LTQuNDA0IDM0LjY0Ni05LjgzMyA2MC40NTktNi4wOTYgMjUuODE0IDMuNzM2IDQ3Ljg5MyAxNC45NDUgNTguNDI0IDM0Ljk4NiAzLjI4MyA4Ljk0MyAxNi42NDItMi4wNCAxNi42NDItMi4wNHMtOS43MzYgNC4wNzctOS41MSAyLjE1MmMuMjI3LTEuOTI0IDE0LjYwNi04LjYwNCAxNC42MDYtOC42MDRzLTEzLjAyIDQuMDc2LTEyLjIyOCAxLjAyYy43OTItMy4wNTggMTYuMy0xNS4yODYgMTYuMy0xNS4yODZzLTE3LjU0NyAxMy4zNi0xOS4wMTggMTEuNTVjLTEuNDczLTEuODEzIDcuNDcyLTkuMTczIDcuNDcyLTkuMTczcy0xNC44MzIgOS4xNzItMjAuMDQgNi40NjdjLTMuNzQ3LTEuOTQzIDE1LjM5OC0xNC41MDYgMTUuMzk4LTE0LjUwNnMtMTIuNDU1IDkuNTEyLTE1LjQgNy4wMmMtMi45NDItMi40OSAxNC4wNC0yMi44NyAxNC4wNC0yMi44N3MtMTkuMjQ4IDIwLjgzMy0yMS4xNyAxOS44MTRjLTEuOTI3LTEuMDIgNS4zMi0xMC45ODMgNS4zMi0xMC45ODNzLTkuNTEgMTAuNDE3LTEyLjExNCA4LjYwNWMtMi42MDQtMS44MTIgMTMuNTg2LTI4Ljg3IDEzLjU4Ni0yOC44N3MtMTcuNTUgMjcuNzM3LTI0Ljc5NSAyMy4wOTdjMTEuMzgtMjQuOTY3IDcuMTM0LTI4LjUzNCA3LjEzNC0yOC41MzRzLTEuNDUgMjUuNDctMTUuNjI0IDI0Ljc5NmMtNy4xMzMtLjM0IDMuMzk2LTE5LjAyIDMuMzk2LTE5LjAycy05LjY5IDE3LjA2LTE2LjE0NSAxNi43MmMxMS44OTQtMjIuNTEgNy42NTQtMzEuNjY2IDcuNjU0LTMxLjY2NnMxLjk2OCAxOS4yMjYtMTQuMTY1IDI5LjkyNWM2LjExMy01LjQzMi0zLjgzNi0yOS45MjQtMy44MzYtMjkuOTI0czguNzUgMzYuMDktNi40NTYgMjkuMjFjLTIuNDAzLTEuMDg1LS4xNy0xOC4wMDItLjE3LTE4LjAwMnMtMy4wNTcgMTkuMzYyLTcuNjQgMTguMzQyYy0yLjY3NC0uNTkzLTE2Ljk4NS0yNi44MzMtMTYuOTg1LTI2LjgzM3MxMS43MTggMjguMzYyIDguMTUyIDI3LjE3M2MtMi41OTgtLjg2Ny03LjQ3My0xMi41NjgtNy40NzMtMTIuNTY4czIuMzc2IDExLjU1IDAgMTIuMjI4Yy0yLjM3OC42OC0xNS42MjYtMTIuMjI4LTE1LjYyNi0xMi4yMjhzOS44NSAxMS41NSA4LjE1MiAxMy45MjdjLTIuNTc0IDMuNjAzLTUuNTkgMy43NzItOS4xNyAyLjM3Ny01LjIxLTIuMDMtMTIuMjI4LTExLjU0OC0xMi4yMjgtMTEuNTQ4czYuOTk2IDkuNjM3IDUuNzczIDEzLjI0N2MtMS45NjIgNS44LTIyLjA3Ni0xMS4yMDgtMjIuMDc2LTExLjIwOHMxMS44ODggMTEuMjEgOS4xNyAxMy41ODdjLTIuNzE2IDIuMzc2LTE3LjQ3IDEuNjQtMjIuMDc3IDEuNjU0LTEzLjU4Ni4wNDItMTguMjk0IDMuMjMtMjIuNDE4IDYuNDk2IiBmaWxsPSIjMzczNTM1Ii8+PC9nPjwvZz48L2c+PC9nPjxnPjxwYXRoIGQ9Ik0zOC44NCA2NjIuNzE4YzE3LjgzMy04Ljk0NSAzNC4xMzcgMS4zNTggNTQuNjg2LTQuNDM0IDE1LjYyMy00LjQwMiAzNC42NDYtOS44MzIgNjAuNDYtNi4wOTUgMjUuODE0IDMuNzM1IDQ3Ljg5IDE0Ljk0NCA1OC40MjIgMzQuOTgzIDMuMjgzIDguOTQ0IDE2LjY0Mi0yLjAzNyAxNi42NDItMi4wMzdzLTkuNzM2IDQuMDc1LTkuNTEgMi4xNWMuMjI3LTEuOTI0IDE0LjYwNi04LjYwNCAxNC42MDYtOC42MDRzLTEzLjAyIDQuMDc1LTEyLjIyOCAxLjAxOGMuNzkzLTMuMDU2IDE2LjMwNC0xNS4yODQgMTYuMzA0LTE1LjI4NHMtMTcuNTUgMTMuMzYtMTkuMDIgMTEuNTQ4Yy0xLjQ3Mi0xLjgxIDcuNDcyLTkuMTcgNy40NzItOS4xN3MtMTQuODMzIDkuMTctMjAuMDQgNi40NjdjLTMuNzQ4LTEuOTQzIDE1LjM5Ny0xNC41MDUgMTUuMzk3LTE0LjUwNXMtMTIuNDU0IDkuNTEtMTUuMzk3IDcuMDJjLTIuOTQ0LTIuNDkyIDE0LjA0LTIyLjg3IDE0LjA0LTIyLjg3cy0xOS4yNSAyMC44MzItMjEuMTczIDE5LjgxM2MtMS45MjQtMS4wMiA1LjMyMi0xMC45ODIgNS4zMjItMTAuOTgycy05LjUxMiAxMC40MTYtMTIuMTE1IDguNjA0Yy0yLjYwNC0xLjgxIDEzLjU4Ni0yOC44NyAxMy41ODYtMjguODdzLTE3LjU1IDI3LjczOC0yNC43OTUgMjMuMDk2YzExLjM4LTI0Ljk2NSA3LjEzMy0yOC41MzIgNy4xMzMtMjguNTMycy0xLjQ1IDI1LjQ3LTE1LjYyNCAyNC43OTVjLTcuMTMzLS4zNCAzLjM5Ni0xOS4wMiAzLjM5Ni0xOS4wMnMtOS42OSAxNy4wNjItMTYuMTQ0IDE2LjcyMmMxMS44OTYtMjIuNTEyIDcuNjU0LTMxLjY2OCA3LjY1NC0zMS42NjhzMS45NjcgMTkuMjI3LTE0LjE2NiAyOS45MjZjNi4xMTMtNS40MzQtMy44MzYtMjkuOTI2LTMuODM2LTI5LjkyNnM4Ljc1NCAzNi4wOS02LjQ1MyAyOS4yMWMtMi40MDMtMS4wODYtLjE3LTE4LjAwMi0uMTctMTguMDAycy0zLjA2IDE5LjM2LTcuNjQyIDE4LjM0MmMtMi42NzQtLjU5My0xNi45ODUtMjYuODMzLTE2Ljk4NS0yNi44MzNzMTEuNzIgMjguMzYzIDguMTUzIDI3LjE3M2MtMi41OTgtLjg2NS03LjQ3My0xMi41NjYtNy40NzMtMTIuNTY2czIuMzc4IDExLjU0OCAwIDEyLjIyN2MtMi4zNzcuNjgtMTUuNjI0LTEyLjIyNy0xNS42MjQtMTIuMjI3czkuODUgMTEuNTQ4IDguMTUgMTMuOTI2Yy0yLjU3MyAzLjYwMy01LjU5IDMuNzctOS4xNyAyLjM3Ni01LjIxLTIuMDMtMTIuMjI3LTExLjU0OC0xMi4yMjctMTEuNTQ4czYuOTk1IDkuNjM4IDUuNzczIDEzLjI0N2MtMS45NjQgNS43OTgtMjIuMDc3LTExLjIxLTIyLjA3Ny0xMS4yMXMxMS44ODggMTEuMjEgOS4xNyAxMy41ODZjLTIuNzE3IDIuMzc4LTE3LjQ3IDEuNjQyLTIyLjA3OCAxLjY1Ni0xMy41ODYuMDQzLTE4LjI5MyAzLjIzLTIyLjQxNyA2LjQ5NiIgZmlsbD0iIzM3MzUzNSIvPjwvZz48L2c+PC9nPjwvZz48L2c+PC9zdmc+\",\n  \"class\": \"girthy\"\n}]\n  </script>\n\n\n  <div class=\"row\">\n    <h3>Icons</h3>\n    <p>A simple wrapper to handle arbitrarily using FontAwesome icons or images via a simple configuration</p>\n    <h5>HTML</h5>\n    <p>The icon sizes are specified in CSS, we can also pass a \'class\' field to the icon as well to handle icons that are wider than they are tall for certain layouts</p>\n    <div hawtio-editor=\"exampleHtml\" mode=\"html\"></div>\n    <h5>JSON</h5>\n    <p>Here we define the configuration for our icons, in this case we\'re just creating a simple array of icon definitions to show in a list</p>\n    <div hawtio-editor=\"exampleConfigJson\" mode=\"javascript\"></div>\n    <div class=\"directive-example\">\n      <div compile=\"exampleHtml\"></div>\n    </div>\n  </div>\n\n\n</div>\n");
$templateCache.put("plugins/ui/html/test/jsplumb.html","<div ng-controller=\"UI.UITestController1\">\n\n  <div>\n\n    <div class=\"row\">\n      <h3>JSPlumb</h3>\n      <p>Use to create an instance of JSPlumb</p>\n      <script type=\"text/ng-template\" id=\"jsplumbTemplate\">\n<div>\n  <div class=\"ex-node-container\" hawtio-jsplumb>\n    <!-- Nodes just need to have an ID and the jsplumb-node class -->\n    <div ng-repeat=\"node in nodes\"\n         id=\"{{node}}\"\n         anchors=\"AutoDefault\"\n         class=\"jsplumb-node ex-node\">\n      <i class=\"fa fa-plus clickable\" ng-click=\"createEndpoint(node)\"></i> Node: {{node}}\n    </div>\n    <!-- You can specify a connect-to attribute and a comma separated list of IDs to connect nodes -->\n    <div id=\"node3\"\n         class=\"jsplumb-node ex-node\"\n         anchors=\"Left,Right\"\n         connect-to=\"node1,node2\">\n      <i class=\"fa fa-plus clickable\" ng-click=\"createEndpoint(\'node3\')\"></i> Node 3\n    </div>\n    <!-- Expressions and stuff will work too -->\n    <div ng-repeat=\"node in otherNodes\"\n         id=\"{{node}}\"\n         class=\"jsplumb-node ex-node\"\n         anchors=\"Continuous\"\n         connect-to=\"{{otherNodes[$index - 1]}}\"><i class=\"fa fa-plus clickable\" ng-click=\"createEndpoint(node)\"></i> Node: {{node}}</div>\n  </div>\n\n</div>\n      </script>\n      <div hawtio-editor=\"jsplumbEx\" mode=\"fileUploadExMode\"></div>\n\n      <div class=\"directive-example\">\n        <div compile=\"jsplumbEx\"></div>\n      </div>\n    </div>\n</div>\n");
$templateCache.put("plugins/ui/html/test/pager.html","<div ng-controller=\"UI.UITestController1\">\n\n  <div>\n    <div class=\"row\">\n      <h3>Pager</h3>\n      <hr>\n    </div>\n  </div>\n\n</div>\n");
$templateCache.put("plugins/ui/html/test/slideout.html","<div ng-controller=\"UI.UITestController1\">\n\n  <div class=\"row\">\n    <h3>Slideout</h3>\n    <p>Displays a panel that slides out from either the left or right and immediately disappears when closed</p>\n\n    <div hawtio-editor=\"sliderEx1\" mode=\"fileUploadExMode\"></div>\n    <div class=\"directive-example\">\n      <div compile=\"sliderEx1\"></div>\n    </div>\n\n    <div hawtio-editor=\"sliderEx2\" mode=\"fileUploadExMode\"></div>\n    <div class=\"directive-example\">\n      <div compile=\"sliderEx2\"></div>\n    </div>\n    <hr>\n  </div>\n\n</div>\n");
$templateCache.put("plugins/ui/html/test/template-popover.html","<div ng-controller=\"UI.UITestController2\">\n\n  <div>\n    <div class=\"row\">\n      <h3>Template Popover</h3>\n      <p>Uses bootstrap popover but lets you supply an angular template to render as the popover body.  For example here\'s a simple template for the popover body:</p>\n      <script type=\"text/ng-template\" id=\"myTemplate\">\n<table>\n  <tbody>\n    <tr ng-repeat=\"(k, v) in stuff track by $index\">\n      <td>{{k}}</td>\n      <td>{{v}}</td>\n    </tr>\n  </tbody>\n</table>\n      </script>\n      <div hawtio-editor=\"popoverEx\" mode=\"fileUploadExMode\"></div>\n\n      <p>\n      You can then supply this template as an argument to hawtioTemplatePopover.  By default it will look for a template in $templateCache called \"popoverTemplate\", or specify a templte for the \"content\" argument.  You can specify \"placement\" if you want the popover to appear on a certain side, or \"auto\" and the directive will calculate an appropriate side (\"right\" or \"left\") depending on where the element is in the window.\n      </p>\n\n      <script type=\"text/ng-template\" id=\"popoverExTemplate\">\n<ul>\n  <li ng-repeat=\"stuff in things\" hawtio-template-popover content=\"myTemplate\">{{stuff.name}}</li>\n</ul>\n      </script>\n      <div hawtio-editor=\"popoverUsageEx\" mode=\"fileUploadExMode\"></div>\n      <div class=\"directive-example\">\n        <div compile=\"popoverUsageEx\"></div>\n      </div>\n    </div>\n\n  </div>\n</div>\n");
$templateCache.put("plugins/ui/html/test/zero-clipboard.html","<div ng-controller=\"UI.UITestController2\">\n\n  <div>\n    <div class=\"row\">\n      <h3>Zero Clipboard</h3>\n      <p>Directive that attaches a zero clipboard instance to an element so a user can click on a button to copy some text to the clipboard</p>\n      <p>Best way to use this is next to a readonly input that displays the same data to be copied, that way folks that have Flash disabled can still copy the text.</p>\n      <script type=\"text/ng-template\" id=\"zeroClipboardTemplate\">\n        <input type=\"text\" class=\"no-bottom-margin\" readonly value=\"Some Text!\">\n        <button class=\"btn\" zero-clipboard data-clipboard-text=\"Some Text!\" title=\"Click to copy!\">\n          <i class=\"fa fa-copy\"></i>\n        </button>\n      </script>\n      <div hawtio-editor=\"zeroClipboard\" mode=\"fileUploadExMode\"></div>\n      <div class=\"directive-example\">\n        <div compile=\"zeroClipboard\"></div>\n      </div>\n    </div>\n\n\n  </div>\n</div>\n");}]); hawtioPluginLoader.addModule("hawtio-ui-templates");