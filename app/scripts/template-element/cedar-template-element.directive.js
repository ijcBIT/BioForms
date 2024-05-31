'use strict';

define([
  'angular'
], function (angular) {
  angular.module('cedar.templateEditor.templateElement.cedarTemplateElementDirective', [])
      .directive('cedarTemplateElement', cedarTemplateElementDirective);

  cedarTemplateElementDirective.$inject = ['$rootScope', 'DataManipulationService', 'schemaService','DataUtilService',
                                           'SpreadsheetService', 'UIUtilService'];

  function cedarTemplateElementDirective($rootScope, DataManipulationService, schemaService,DataUtilService, SpreadsheetService,
                                         UIUtilService) {

    var directive = {
      restrict   : 'EA',
      scope      : {
        key           : '=',
        element       : '=',
        delete        : '&',
        model         : '=',
        isEditData    : "=",
        renameChildKey: "=",
        parentElement : '=',
        nested        : '='
      },
      templateUrl: 'scripts/template-element/cedar-template-element.directive.html',
      link       : linker
    };

    return directive;


    function linker(scope, element, attrs) {

      var tabSet = ["options",  "cardinality"];
      scope.activeTab;


      var dms = DataManipulationService;

      scope.directiveName = 'cedarTemplateElement';
      scope.elementSchema = dms.schemaOf(scope.element);
      scope.elementLabel = dms.getPropertyLabels(scope.parentElement);
      scope.elementDescription = dms.getPropertyDescriptions(scope.parentElement);



      scope.isRoot = function () {
        return !schemaService.getId(scope.element) || (schemaService.getId(scope.element) === $rootScope.keyOfRootElement);
      };

      scope.getIdentifier = function () {
        return schemaService.getIdentifier(scope.element);
      };

      scope.isCardinal = function () {
        return schemaService.isCardinalElement(scope.element);
      };

      scope.isPublished = function () {
        return schemaService.isPublished(scope.element);
      };

      scope.getVersion = function () {
        return schemaService.getVersion(scope.element);
      };

      scope.getTitle = function () {
        return schemaService.getTitle(scope.element);
      };

      scope.hasDescription = function () {
        return schemaService.hasDescription(scope.element);
      };

      scope.getDescription = function () {
        return schemaService.getDescription(scope.element);
      };

      scope.getId = function () {
        return schemaService.getId(scope.element);
      };

      scope.isFirstLevel = function () {
        return (scope.$parent.directiveName === 'form');
      };

      scope.getKeyFromId = function () {
        return dms.getKeyFromId(scope.element);
      };

      scope.getPropertyDescription = function () {
        var descriptions = dms.getPropertyDescriptions(scope.parentElement);
        return  descriptions ?  descriptions[scope.key] : false;
      };

      scope.hasPropertyDescription = function () {
        var descriptions = dms.getPropertyDescriptions(scope.parentElement);
        return descriptions &&  descriptions[scope.key] && descriptions[scope.key].length > 0;
      };


      scope.getHelp = function () {
        return scope.getDescription() || scope.getPropertyDescription();
      };

      scope.hasHelp = function () {
        return scope.hasDescription() || scope.hasPropertyDescription();
      };



      scope.getDomId = function (node) {
        return dms.getDomId(node);
      };

      scope.isNested = function () {
        return scope.nested == true;
      };

      scope.isSortable = function () {
        return !scope.isNested() && !scope.isRoot();
      };

      scope.isEditState = function () {
        return (UIUtilService.isEditState(scope.element) && scope.isEditable());
      };

      scope.isEditable = function () {
        return false;
      };


      scope.isSelectable = function () {
        return !scope.isNested() && !scope.isRoot();
      };

      // try to select this element
      scope.canSelect = function (selectable) {
        if (selectable) {
          UIUtilService.canSelect(scope.element);
        }
      };

      scope.canEditProperty = function () {

        var result =
            !scope.isRoot() &&
            !UIUtilService.isRuntime() &&
            !scope.isNested() &&
            UIUtilService.isEditState(scope.element);

        return result;
      };

      scope.elementId = dms.idOf(scope.element) || dms.generateGUID();

      var resetElement = function (el, settings) {
        angular.forEach(el, function (model, key) {
          if (settings[key] && settings[key].minItems && angular.isArray(model)) {
            model.splice(settings[key].minItems, model.length);
          }
          if (!DataUtilService.isSpecialKey(key)) {
            if (key == '@value') {
              if (angular.isArray(model)) {
                if (dms.schemaOf(settings)._ui.inputType == "list") {
                  model.splice(0, model.length);
                } else {
                  for (var i = 0; i < model.length; i++) {
                    if (typeof(model[i]['@value']) == "string") {
                      model[i]['@value'] = "";
                    } else if (angular.isArray(model[i]['@value'])) {
                      model[i]['@value'] = [];
                    } else if (angular.isObject(model[i]['@value'])) {
                      model[i]['@value'] = {};
                    }
                  }
                }
              } else if (typeof(model) == "string") {
                el[key] = "";
              } else if (angular.isArray(model)) {
                el[key] = [];
              } else if (angular.isObject(model)) {
                el[key] = {};
              }
            } else {
              if (settings[key]) {
                resetElement(model, settings[key]);
              } else {
                // This case el is an array
                angular.forEach(model, function (v, k) {
                  if (k == '@value') {
                    if (angular.isArray(v)) {
                      if (dms.schemaOf(settings)._ui.inputType == "list") {
                        v.splice(0, v.length);
                      } else {
                        for (var i = 0; i < v.length; i++) {

                          if (typeof(v[i]['@value']) == "string") {
                            v[i]['@value'] = "";
                          } else if (angular.isArray(v[i]['@value'])) {
                            v[i]['@value'] = [];
                          } else if (angular.isObject(v[i]['@value'])) {
                            v[i]['@value'] = {};
                          }

                        }
                      }
                    } else if (typeof(v) == "string") {
                      model[k] = "";
                    } else if (angular.isArray(v)) {
                      model[k] = [];
                    } else if (angular.isObject(v)) {
                      model[k] = {};
                    }
                  }
                  else if (k == 'rdfs:label') {
                    delete model[k];
                  }
                  else if (k !== '@type') {
                    if (settings[k]) {
                      resetElement(v, settings[k]);
                    }
                  }
                });
              }
            }
          }
        });
      };

      scope.getPropertyLabel = function () {
        return dms.getPropertyLabels(scope.parentElement)[scope.key];
      };

      scope.getProperty = function () {
        return dms.getProperty(scope.parentElement, scope.element);
      };

      scope.getPreferredLabel = function () {
        return schemaService.getPreferredLabel(scope.element);
      };

      scope.getLabel = function() {
        return scope.getPreferredLabel() || scope.getPropertyLabel() || scope.getTitle();
      };

      var setLabels = function () {
        if (scope.parentElement) {
          scope.labels = dms.getPropertyLabels(scope.parentElement);
        }
      };

      var parseElement = function () {
        if (!UIUtilService.isRuntime() && scope.element) {
          if (angular.isArray(scope.model)) {
            angular.forEach(scope.model, function (m) {
              dms.findChildren(dms.propertiesOf(scope.element), m);
            });
          } else {
            dms.findChildren(dms.propertiesOf(scope.element), scope.model);
          }
        }
      };

      if (!UIUtilService.isRuntime()) {
        if (!scope.model) {
          if (scope.element.items) {
            scope.model = [];
          } else {
            scope.model = {};
          }
        }

        parseElement();
        setLabels();
      }

      if (!scope.state) {
        if (scope.element && schemaService.schemaOf(scope.element)._ui && schemaService.getTitle(scope.element)) {
          scope.state = "completed";
        } else {
          scope.state = "creating";
        }
      }

      scope.selectedTab = scope.selectedTab || 0;
      scope.selectTab = function (index) {
        scope.selectedTab = index;
      };


      scope.isEditState = function () {
        return (UIUtilService.isEditState(scope.element));
      };


      // add a multiple cardinality element
      scope.selectedTab = 0;
      scope.addElement = function () {
        if (UIUtilService.isRuntime()) {
          if ((!scope.element.maxItems || scope.model.length < scope.element.maxItems)) {
            var seed = {};

            if (scope.model.length > 0) {
              seed = angular.copy(scope.model[0]);
              resetElement(seed, scope.element);
              scope.model.push(seed);
            } else {

              scope.model.push(seed);
              if (angular.isArray(scope.model)) {
                angular.forEach(scope.model, function (m) {
                  dms.findChildren(dms.propertiesOf(scope.element), m);
                });
              } else {
                dms.findChildren(dms.propertiesOf(scope.element), scope.model);
              }
              resetElement(seed, scope.element);
            }
            scope.selectedTab = scope.model.length - 1;
          }
        }
      };

      // remove a multiple cardinality element
      scope.removeElement = function (index) {
        if (scope.model.length > scope.element.minItems) {
          scope.model.splice(index, 1);
          if (index + 1 > scope.model.length) {
            scope.selectedTab = scope.model.length - 1;
          }
        }
      };

      scope.switchToSpreadsheet = function () {
        SpreadsheetService.switchToSpreadsheetElement(scope, element);
      };

      scope.isExpanded = function () {
        return dms.isExpanded(scope.element);
      };

      scope.switchExpandedState = function () {
        dms.setExpanded(scope.element, !dms.isExpanded(scope.element));
        //UIUtilService.toggleElement(scope.getDomId(scope.element));
      };

      // remove the element from the form
      scope.ckDelete = function () {
        dms.removeChild(scope.parentElement, scope.element, scope.key);
        dms.updateAdditionalProperties(scope.parentElement);
        scope.$emit("invalidElementState",
            ["remove", scope.getTitle(), scope.getId()]);
      };

      scope.isTabActive = function (item) {
        return scope.activeTab === item;
      };

      scope.setTab = function (item) {
        if (tabSet.indexOf(item) > -1) {
          scope.activeTab = item;
        }
      };



      // try to deselect this element
      scope.canDeselect = function (element) {
        return UIUtilService.canDeselect(element);
      };

      // when element is deseleted, look at errors and parse if none
      scope.$on('deselect', function (event, element, errorMessages) {
        if (element == scope.element) {
          scope.errorMessages = errorMessages;
          if (errorMessages.length == 0) parseElement();
        }
      });

      // try to deselect this field
      scope.canDeselect = function (field) {
        return UIUtilService.canDeselect(field, scope.renameChildKey);
      };

      scope.elementIsMultiInstance = function (node) {
        return schemaService.elementIsMultiInstance(node);
      };

      scope.$on('saveForm', function (event) {
        // if (scope.isFirstLevel()) {
        //   var schema = dms.schemaOf($rootScope.jsonToSave);
        //   dms.relabel(schema, scope.key, scope.labels[scope.key]);
        // }

        if (scope.isEditState() && !scope.canDeselect(scope.element)) {

          scope.$emit("invalidElementState",
              ["add", scope.getTitle(), scope.getId()]);
        } else {
          scope.$emit("invalidElementState",
              ["remove", scope.getTitle(), scope.getId()]);
        }
      });

      scope.$watchCollection("element.properties['@context'].properties", function () {
        parseElement();
      });

      scope.$watchCollection("element.properties", function () {
        setLabels();
        parseElement();
      });

      scope.$watchCollection("element.items.properties", function () {
        setLabels();
        parseElement();
      });


      scope.defaultMinMax = function () {
        scope.element.minItems = 1;
        scope.element.maxItems = 0;
      };


      scope.clearMinMax = function () {
        delete scope.element.minItems;
        delete scope.element.maxItems;
      };

      scope.isMultiple = function () {
        return scope.element.minItems != null;
      };

      scope.isCardinalElement = function () {
        return schemaService.isCardinalElement(scope.element);
      };

      scope.getIconClass = function () {
        return 'fa fa-cubes';
      };


      //
      // controlled terms modal
      //

      scope.modalType;

      // create an id for the controlled terms modal
      scope.getModalId = function (type) {
        return UIUtilService.getModalId(scope.getId(), type);
      };

      // show the controlled terms modal
      scope.showModal = function (type, searchScope) {
          // $rootScope.finalTitle = scope.getTitle();
          // scope.modalType = type;
          var options = {"filterSelection":type, "searchScope": searchScope,"modalId":"controlled-term-modal", "model": scope.element, "id":scope.getId(), "q": scope.getTitle(),'source': null,'termType': null, 'term': null, "advanced": false,"permission": ["read","write"]};
          UIUtilService.showModal(options);
      };

      // $scope.showModal = function (type, searchScope) {
      //   var options = {"filterSelection":type, "searchScope": searchScope, "modalId":"controlled-term-modal", "model": $scope.element, "id":scope.getId(),  "q": scope.getTitle(),'source': null,'termType': null, 'term': null, "advanced": false, "permission": ["read","write"]};
      //   UIUtilService.showModal(options);
      // };

      // show the controlled terms modal
      scope.hideModal = function () {
        UIUtilService.hideModal();
      };

      scope.$on("property:propertyAdded", function (event, args) {

        let id = args[1];
        if (scope.getId() == id) {

          scope.hideModal();

          let propertyId = args[0];
          let propertyLabel = args[2];
          let propertyDescription = args[3];

          dms.updateProperty(propertyId, propertyLabel, propertyDescription, id, scope.parentElement);
        }
      });


      // get the propertyLabel for this node from its parent
      scope.getPropertyLabel = function () {
        return dms.getPropertyLabels(scope.parentElement)[scope.key];
      };

      // get the propertyId for this node from its parent
      scope.getPropertyId = function () {
        return dms.getPropertyId(scope.parentElement, scope.element);
      };

      // get the propertyId for this node from its parent
      scope.hasPropertyId = function () {
        return dms.getPropertyId(scope.parentElement, scope.element).length > 0;
      };

      // scope.hasProperty = function () {
      //   return (scope.parentElement && scope.element && dms.getProperty(scope.parentElement, scope.element));
      // };

      // delete propertyId and propertyLabel for this node
      scope.deleteProperty = function () {
        dms.deletePropertyId(scope.parentElement, scope.element);
        dms.updateProperty('', '', '', scope.getId(), scope.parentElement);
      };

      scope.getMinItems = function () {
        return schemaService.getMinItems(scope.element);
      };

      scope.getMaxItems = function () {
        return schemaService.getMaxItems(scope.element);
      };

    }

  };

});
