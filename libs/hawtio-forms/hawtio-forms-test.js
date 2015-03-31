
var HawtioFormsTests;
(function(HawtioFormsTests) {
  var pluginName = HawtioFormsTests.pluginName = 'hawtio-forms-tests';
  var tp = HawtioFormsTests.templatePath = 'test';
  var log = HawtioFormsTests.log = Logger.get(pluginName);
  var _module = HawtioFormsTests._module = angular.module(HawtioFormsTests.pluginName, []);
  var welcomeTab = null;
  var tab = null;
  var tab2 = null;

  _module.config(['$routeProvider', 'HawtioNavBuilderProvider', function($routeProvider, builder) {
    welcomeTab = builder.create()
            .id('welcome')
            .rank(10)
            .title( function() { return "Documentation"; })
            .href( function() { return "/docs"; })
            .subPath("Welcome", "welcome", builder.join(tp, "welcome.html"), 1)
            .build();

    tab = builder.create()
            .id(pluginName)
            .rank(1)
            .title( function() { return "Forms"; } )
            .href( function () { return "/forms"; })
            .subPath("Simple Form", "simple_form", builder.join(tp, "test.html"), 1)
            .subPath("Form Table", "form_table", builder.join(tp, "testTable.html"), 2)
            .subPath("Wizard", "form_wizard", builder.join(tp, "wizard.html"), 3)
            .build();

    tab2 = builder.create()
              .id(pluginName + '-form2')
              .rank(2)
              .title( function() { return "Forms2"; } )
              .href( function() { return "/forms2"; } )
              .subPath("Simple Form", "simple_form", builder.join(tp, "simpleForm2.html"), 9)
              .subPath("Map", "map", builder.join(tp, "map.html"), 9)
              .subPath("Tabbed Form", "tabbed_form", builder.join(tp, "tabbedForm2.html"), 8)
              .subPath("Wizard Form", "wizard_form", builder.join(tp, "wizardForm2.html"), 7)
              .subPath("Nested Form", "nested_form", builder.join(tp, "nestedForm2.html"), 6)
              .subPath("Schema Test", "from_schema", builder.join(tp, "fromSchema.html"), 3)
              .build();

    builder.configureRouting($routeProvider, welcomeTab);        
    builder.configureRouting($routeProvider, tab);        
    builder.configureRouting($routeProvider, tab2);        
  }]);

  _module.run(["HawtioNav", "SchemaRegistry", function(nav, schemas) {
    nav.add(welcomeTab);
    nav.add(tab);
    nav.add(tab2);
    schemas.addSchema('kubernetes', Kubernetes.schema);
    schemas.addSchema('testObject', {
      "description": "Object from registry",
      properties: {
        "Attr1": {
          "type": "number",
          "label": "Attribute 1"
        }
      }
    });

    schemas.addSchema('ArrayObject', {
      description: 'Some object with a username and password',
      javaType: 'com.foo.ArrayObject',
      properties: {
        "Field1": {
          "type": "string",
          "label": "Username",
          "input-attributes": {
            placeholder: "Username..."
          }
        },
        "Field2": {
          "type": "password",
          "label": "Password",
          "input-attributes": {
            placeholder: "Password..."
          }
        },
        "Field3": {
          "type": "string",
          "label": "Type",
          "enum": {
            "label1": "value1",
            "label2": "value2",
            "label3": "value3"
          }
        }
      }
    });

    schemas.addSchema('StringArray', {
      description: 'Array of strings',
      properties: {
        values: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      }
    });

    schemas.addSchema('ObjectWithArrayObject', {
      desription: 'Some object with an embedded object',
      javaType: 'com.foo.ObjectWithArrayObject',
      properties: {
        arg1: {
          type: 'string'
        },
        arg2: {
          type: 'ArrayObject'
        }
      }
    });
  }]);

  var baseConfig = {
      "id": 'myForm',
      "style": HawtioForms.FormStyle.HORIZONTAL,
      "mode": HawtioForms.FormMode.EDIT,
      "disableHumanizeLabel": false,
      hideLegend: false,
      "properties": {
        "fromSchemaRegistry": {
          "type": "testObject"
        },
        "key": {
          "label": "The Argument",
          "type": "java.lang.String",
          "description": "Enter the argument key",
          "input-attributes": {
            "value": "This is an initial value",
            "placeholder": "Enter in some value"
          },
          "control-group-attributes": {
            "ng-show": "entity.booleanArg == true"
          }
        },
        "RequiredThing": {
          type: 'text',
          'input-attributes': {
            'required': 'true'
          }
        },
        array1: {
          items: {
            type: 'string'
          },
          type: 'array'
        },
        array2: {
          items: {
            type: 'number'
          },
          type: 'array'
        },
        array3: {
          items: {
            type: 'ArrayObject'
          },
          type: 'array'
        },
        scheme: {
          type: "java.lang.String",
          tooltip: "HTTP or HTTPS",
          enum: ["http", "https"],
          default: "http",
        },
        nestedObject: {
          style: HawtioForms.FormStyle.HORIZONTAL,
          label: "A Nested Object",
          type: 'object',
          properties: {
            'Attribute1': {
              type: 'text',
              'label-attributes': {
                'style': 'color: green'
              }
            },
            'Attribute2': {
              type: 'java.lang.Integer',
              label: 'A Number'
            } 
          }
        },
        "ObjectSelect": {
          type: "java.lang.String",
          enum: {
            "label1": "value1",
            "label2": "value2",
            "label3": "value3"
          },
          default: "value3"
        },
        "value": {
          "description": "Enter the argument value",
          "label": "The Value",
          "type": "java.lang.String",
          "tooltip": "This is the tooltip",
          "input-attributes": {
            "placeholder": "Hello World!",
            "value": "This is also an initial value"
          }
        },
        "staticText": {
          "type": "static",
          "description": "This is some static text, use this type to add a description in your form that's properly formatted"
        },
        "templatedThing": {
          "formTemplate": "<p class=\"alert alert-info\">Hi, I'm a custom template and I like warm hugs!</p>"
        },
        "passwordField": {
          "type": "password",
          "input-attributes": {
            placeholder: "Password..."
          }
        },
        "longArg": {
          "description": "Long argument",
          "type": "Long",
          "label-attributes": {
            "style": "color: red"
          },
          "input-attributes": {
            "min": "5",
            "max": "10"
          }
        },
        "intArg": {
          "description": "Int argument",
          "type": "Integer",
          "hidden": true,
          "input-attributes": {
            "value": 5
          }
        },
        "booleanArg": {
          "description": "Toggles whether or not you want to enter the argument key",
          "type": "java.lang.Boolean"
        }
      },
      "description": "This is my awesome form",
      "type": "java.lang.String"
    };

    var baseModel ={
      "scheme": "http",
      "array1": ["foo", "bar", "cheese"],
      "array2": [
        20,
        13
      ],
      "array3": [
        {
          "Field1": "test1",
          "Field2": "test1",
          "Field3": "value2"
        },
        {
          "Field1": "test2",
          "Field2": "test2",
          "Field3": "value3"
        }, 
        {
          "Field1": "test3",
          "Field2": "test3",
          "Field3": "value1"
        } 
      ]
    };

  _module.controller("WelcomePageController", ["$scope", "marked", "$http", "$timeout", function ($scope, marked, $http, $timeout) {
    $timeout(function() {
      $http.get('README.md').success(function(data) {
        log.debug("Fetched README.md, data: ", data);
        $scope.readme = marked(data);
      }).error(function(data) {
        log.debug("Failed to fetch README.md: ", data); 
      });
    }, 500);
    
  }]);

  _module.controller("HawtioFormsTests.Forms2SchemaController", ["$scope", "$templateCache", "SchemaRegistry", function($scope, $templateCache, schemas) {

    $scope.config = schemas.cloneSchema("os_build_BuildConfig");
    $scope.config.style = HawtioForms.FormStyle.STANDARD;
    $scope.config.mode = HawtioForms.FormMode.EDIT;
    $scope.model = {};
    $scope.configStr = angular.toJson($scope.config, true);
    $scope.markup = $templateCache.get("markup.html");
    $scope.$watch('model', _.debounce(function() {
      $scope.modelStr = angular.toJson($scope.model, true);
      Core.$apply($scope);
    }, 500), true);
    $scope.$watch('configStr', _.debounce(function() {
      try {
        $scope.config = angular.fromJson($scope.configStr);
        log.debug("Updated config...");
        Core.$apply($scope);
      } catch (e) {
      }
    }, 1000));
  }]);
  
  _module.controller("HawtioFormsTests.Forms2WizardController", ["$scope", "$templateCache", function($scope, $templateCache) {
    var config = _.clone(baseConfig, true);
    config.wizard = {
        onChange: function(current, next, pageIds) {
          log.debug("page changed, current page: ", current, " next: ", next);
          // can manipulate what page the wizard goes to
          /*
          if (next < current) {
            return current;
          }
          return next;
          */
        },
        onFinish: function () {
          log.debug("On finish clicked, model: ", $scope.model);
          Core.notification('success', 'Finished!');
        },
        pages: {
          "Welcome to my awesome wizard!": {
            controls: ["RequiredThing", "array1", "booleanArg", "key"]
          },
          "Fill in these cool form controls...": {
            controls: ["scheme", "nestedObject"]
          },
          "And these too, because forms are great!": {
            controls: ["fromSchemaRegistry", "array3"]
          },
          "If you're happy with what you've entered, click finish!": {
            controls: ['*']
          }
        }
      };
    $scope.config = config;
    var model = _.clone(baseModel, true);
    $scope.model = model;
    $scope.configStr = angular.toJson($scope.config, true);
    $scope.markup = $templateCache.get("markup.html");
    $scope.$watch('model', _.debounce(function() {
      $scope.modelStr = angular.toJson($scope.model, true);
      Core.$apply($scope);
    }, 500), true);
    $scope.$watch('configStr', _.debounce(function() {
      try {
        $scope.config = angular.fromJson($scope.configStr);
        log.debug("Updated config...");
        Core.$apply($scope);
      } catch (e) {
      }
    }, 1000));
  }]);

  _module.controller("HawtioFormsTests.Forms2NestedController", ["$scope", "$templateCache", function($scope, $templateCache) {
    var config = {
      properties: {
        array3: {
          items: {
            type: 'ArrayObject'
          },
          type: 'array'
        },
        collection: {
          type: 'array',
          items: {
            type: 'ObjectWithArrayObject'
          }
        }
      }
    };
    $scope.config = config;
    var model = {
      "collection": [
        {
          "arg2": {
            "Field1": "one",
            "Field2": "two",
            "Field3": "value2"
          },
          "arg1": "An argument!"
        },
        {
          arg1: 'Another thing!',
          arg2: {
            "Field1": "three",
            "Field2": "four",
            "Field3": "value1"
          }
        }
      ],
      "array3": [
        {
          "Field1": "test1",
          "Field2": "test1",
          "Field3": "value2"
        },
        {
          "Field1": "test2",
          "Field2": "test2",
          "Field3": "value3"
        }, 
        {
          "Field1": "test3",
          "Field2": "test3",
          "Field3": "value1"
        } 
      ]
    };
    $scope.model = model;
    $scope.configStr = angular.toJson($scope.config, true);
    $scope.markup = $templateCache.get("markup.html");
    $scope.$watch('model', _.debounce(function() {
      $scope.modelStr = angular.toJson($scope.model, true);
      Core.$apply($scope);
    }, 500), true);
    $scope.$watch('configStr', _.debounce(function() {
      try {
        $scope.config = angular.fromJson($scope.configStr);
        log.debug("Updated config...");
        Core.$apply($scope);
      } catch (e) {
      }
    }, 1000));
  }]);

  _module.controller("HawtioFormsTests.Forms2MapController", ["$scope", "$templateCache", "SchemaRegistry", function($scope, $templateCache, schemas) {
    /*
    schemas.addListener('mapControllerListener', function (name, schema) {
        _.forIn(schema.properties, function (property, id) {
          if (property.type === 'map') {
            log.debug("Property: ", id, " is a map, key type: ", property.items.key, " value type: ", property.items.value);
          }
        });
      });
      */
    var config = {
      label: 'Various Maps',
      properties: {
        simpleMap: {
          type: 'map',
          items: {
            key: {
              type: 'string'
            },
            value: {
              type: 'string'
            }
          }
        },
        mapWithObject: {
          type: 'map',
          items: {
            key: {
              type: 'string'
            },
            value: {
              type: 'ArrayObject'
            }
          }
        },
        mapWithArrayObject: {
          type: 'map',
          items: {
            key: {
              type: 'string'
            },
            value: {
              type: 'StringArray'
            }
          }
        },
        mapWithArray: {
          type: 'map',
          items: {
            key: {
              type: 'string'
            },
            value: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          } 
        },
        mapWithArrayOfObject: {
          type: 'map',
          items: {
            key: {
              type: 'string'
            },
            value: {
              type: 'array',
              items: {
                type: 'ArrayObject'
              }
            }
          }
        }
      }
    };
    var model = {
      simpleMap: {
        'foo': 'bar',
        'one': 'two',
        'three': 'four'
      },
      mapWithObject: {
        'One': {
          "Field1": "test1",
          "Field2": "test1",
          "Field3": "value2"
        },
        Two: {
          "Field1": "test2",
          "Field2": "test2",
          "Field3": "value3"
        }, 
        Three: {
          "Field1": "test3",
          "Field2": "test3",
          "Field3": "value1"
        } 
      },
      mapWithArrayObject: {
        one: {
          values: ['one', 'two', 'three']
        },
        two: {
          values: ['one', 'two', 'three']
        }
      },
      mapWithArray: {
        one: ['one', 'two', 'three'],
        two: ['one', 'three', 'two']
      },
      mapWithArrayOfObject: {
        one: [
        {
          "Field1": "test1",
          "Field2": "test1",
          "Field3": "value2"
        },
        {
          "Field1": "test2",
          "Field2": "test2",
          "Field3": "value3"
        }, 
        {
          "Field1": "test3",
          "Field2": "test3",
          "Field3": "value1"
        } 
      ],
        two: [
        {
          "Field1": "test1",
          "Field2": "test1",
          "Field3": "value2"
        },
        {
          "Field1": "test2",
          "Field2": "test2",
          "Field3": "value3"
        }, 
        {
          "Field1": "test3",
          "Field2": "test3",
          "Field3": "value1"
        } 
      ]

      }
    };
    $scope.config = config;
    $scope.model = model;
    $scope.configStr = angular.toJson($scope.config, true);
    $scope.markup = $templateCache.get("markup.html");
    $scope.$watch('model', _.debounce(function() {
      $scope.modelStr = angular.toJson($scope.model, true);
      Core.$apply($scope);
    }, 500), true);
    $scope.$watch('configStr', _.debounce(function() {
      try {
        $scope.config = angular.fromJson($scope.configStr);
        log.debug("Updated config...");
        Core.$apply($scope);
      } catch (e) {
      }
    }, 1000));
  }]);

  _module.controller("HawtioFormsTests.Forms2TabsController", ["$scope", "$templateCache", function($scope, $templateCache) {
    var config = _.clone(baseConfig, true);
    config.tabs = {
        "Tab One": ["scheme", "array3", "key", "value"],
        "Tab Two": ["*"],
        "Tab Three": ["booleanArg"]
      };
    var model = _.clone(baseModel, true);
    $scope.config = config;
    $scope.model = model;
    $scope.configStr = angular.toJson($scope.config, true);
    $scope.markup = $templateCache.get("markup.html");
    $scope.$watch('model', _.debounce(function() {
      $scope.modelStr = angular.toJson($scope.model, true);
      Core.$apply($scope);
    }, 500), true);
    $scope.$watch('configStr', _.debounce(function() {
      try {
        $scope.config = angular.fromJson($scope.configStr);
        log.debug("Updated config...");
        Core.$apply($scope);
      } catch (e) {
      }
    }, 1000));
  }]);

  _module.controller("HawtioFormsTests.Forms2Controller", ["$scope", "$templateCache", "SchemaRegistry", function($scope, $templateCache, schemas) {
    var config = _.clone(baseConfig, true);
    config.controls = ["scheme", "nestedObject", "fromSchemaRegistry", "*", "array2", "array1"];
    $scope.config = config;
    var model = _.clone(baseModel, true);
    $scope.model = model;
    $scope.configStr = angular.toJson($scope.config, true);
    $scope.markup = $templateCache.get("markup.html");
    $scope.$watch('model', _.debounce(function() {
      $scope.modelStr = angular.toJson($scope.model, true);
      Core.$apply($scope);
    }, 500), true);
    $scope.$watch('configStr', _.debounce(function() {
      try {
        $scope.config = angular.fromJson($scope.configStr);
        log.debug("Updated config...");
        Core.$apply($scope);
      } catch (e) {
      }
    }, 1000));
  }]);

  _module.controller("HawtioFormsTests.WizardController", ["$scope", "$templateCache", function($scope, $templateCache) {
    $scope.wizardConfig = {
      "properties": {
        "key": {
          "description": "Argument key",
          "type": "java.lang.String"
        },
        "value": {
          "description": "Argument Value",
          "type": "java.lang.String"
        },
        "longArg": {
          "description": "Long argument",
          "type": "Long",
          "minimum": "5",
          "maximum": "10"
        },
        "intArg": {
          "description": "Int argument",
          "type": "Integer"
        },
        "objectArg": {
          "description": "some object",
          "type": "object"
        },
        "booleanArg": {
          "description": "Some boolean value",
          "type": "java.lang.Boolean"
        }
      },
      "description": "My awesome wizard!",
      "type": "java.lang.String",
      "wizard": {
        "Page One": ["key", "value"],
        "Page Two": ["*"],
        "Page Three": ["booleanArg"]
      }
    };
    $scope.wizardConfigStr = angular.toJson($scope.wizardConfig, true);
    $scope.wizardMarkup = $templateCache.get("wizardMarkup.html");
    $scope.$watch('wizardConfigStr', _.debounce(function() {
      try {
        $scope.wizardConfig = angular.fromJson($scope.wizardConfigStr);
        log.debug("Updated config...");
        Core.$apply($scope);
      } catch (e) {
      }
    }, 1000));

  }]);

  _module.controller("Forms.FormTestController", ["$scope", function ($scope) {
    $scope.editing = false;
    $scope.html = "text/html";
    $scope.javascript = "javascript";
    $scope.basicFormEx1Entity = {
      'key': 'Some key',
      'value': 'Some value'
    };
    $scope.basicFormEx1EntityString = angular.toJson($scope.basicFormEx1Entity, true);
    $scope.basicFormEx1Result = '';
    $scope.toggleEdit = function () {
      $scope.editing = !$scope.editing;
    };
    $scope.view = function () {
      if (!$scope.editing) {
        return "view";
      }
      return "edit";
    };
    $scope.basicFormEx1 = '<div simple-form name="some-form" action="#/forms/test" method="post" data="basicFormEx1SchemaObject" entity="basicFormEx1Entity" onSubmit="callThis()"></div>';
    $scope.toObject = function (str) {
      return angular.fromJson(str.replace("'", "\""));
    };
    $scope.fromObject = function (str) {
      return angular.toJson($scope[str], true);
    };
    
    $scope.basicFormEx1Config ={
      "properties": {
        "key": {
          "description": "Argument key",
          "type": "java.lang.String"
        },
        "value": {
          "description": "Argument Value",
          "type": "java.lang.String"
        },
        "longArg": {
          "description": "Long argument",
          "type": "Long",
          "minimum": "5",
          "maximum": "10"
        },
        "intArg": {
          "description": "Int argument",
          "type": "Integer"
        },
        "objectArg": {
          "description": "some object",
          "type": "object"
        },
        "booleanArg": {
          "description": "Some boolean value",
          "type": "java.lang.Boolean"
        }
      },
      "description": "Show some stuff in a form",
      "type": "java.lang.String",
      "tabs": {
        "Tab One": ["key", "value"],
        "Tab Two": ["*"],
        "Tab Three": ["booleanArg"]
      }
    };

    $scope.basicFormEx1Schema = angular.toJson($scope.basicFormEx1Config, true);
    $scope.basicFormEx1SchemaObject = $scope.toObject($scope.basicFormEx1Schema);
    $scope.updateSchema = function () {
      $scope.basicFormEx1SchemaObject = $scope.toObject($scope.basicFormEx1Schema);
    };
    $scope.updateEntity = function () {
      $scope.basicFormEx1Entity = angular.fromJson($scope.basicFormEx1EntityString);
    };
    $scope.hawtioResetEx = '<a class="btn" href="" hawtio-reset="some-form"><i class="icon-refresh"></i> Clear</a>';
    $scope.hawtioSubmitEx = '      <a class="btn" href="" hawtio-submit="some-form"><i class="icon-save"></i> Save</a>';
    $scope.callThis = function (json, form) {
      $scope.basicFormEx1Result = angular.toJson(json, true);
      Core.notification('success', 'Form "' + form.get(0).name + '" submitted...');
      Core.$apply($scope);
    };
    $scope.config = {
      name: 'form-with-config-object',
      action: "/some/url",
      method: "post",
      data: 'setVMOption',
      showtypes: 'false'
    };
    $scope.cheese = {
      key: "keyABC",
      value: "valueDEF",
      intArg: 999
    };
    $scope.onCancel = function (form) {
      Core.notification('success', 'Cancel clicked on form "' + form.get(0).name + '"');
    };
    $scope.onSubmit = function (json, form) {
      Core.notification('success', 'Form "' + form.get(0).name + '" submitted... (well not really), data:' + JSON.stringify(json));
    };
    $scope.derp = function (json, form) {
      Core.notification('error', 'derp with json ' + JSON.stringify(json));
    };
    $scope.inputTableData = {
      rows: [
        { id: "object1", name: 'foo' },
        { id: "object2", name: 'bar' }
      ]
    };
    $scope.inputTableConfig = {
      data: 'inputTableData.rows',
      displayFooter: false,
      showFilter: false,
      showSelectionCheckbox: false,
      enableRowClickSelection: true,
      primaryKeyProperty: 'id',
      properties: {
        'rows': { items: { type: 'string', properties: {
          'id': {
            description: 'Object ID',
            type: 'java.lang.String'
          },
          'name': {
            description: 'Object Name',
            type: 'java.lang.String'
          }
        } } }
      },
      columnDefs: [
        {
        field: 'id',
        displayName: 'ID'
      },
      {
        field: 'name',
        displayName: 'Name'
      }
      ]
    };
  }]);

  hawtioPluginLoader.addModule(HawtioFormsTests.pluginName);
})(HawtioFormsTests || (HawtioFormsTests = {}));



