'use strict';

define([
  'angular',
  'json!config/data-manipulation-service.conf.json'
], function (angular, config) {
  angular.module('cedar.templateEditor.service.dataManipulationService', [])
      .service('DataManipulationService', DataManipulationService);

  DataManipulationService.$inject = ['DataTemplateService', 'DataUtilService', 'UrlService', 'FieldTypeService', '$rootScope'];

  function DataManipulationService(DataTemplateService, DataUtilService, UrlService, FieldTypeService, $rootScope) {

    // Base path to generate field ids
    // TODO: fields will be saved as objects on server, they will get their id there
    // TODO: need to assign a temporary id, which will be replaced on server side
    var idBasePath = null;

    var service = {
      serviceId: "DataManipulationService"
    };

    service.init = function () {
      idBasePath = config.idBasePath;
    };

    // Function that generates a basic field definition
    service.generateField = function (fieldType) {
      var valueType = "string";
      if (fieldType == "numeric") {
        valueType = "number";
      } else if (fieldType == "checkbox") {
        valueType = "object";
      } else if (fieldType == "list") {
        valueType = "array";
      }

      var field;
      if (FieldTypeService.isStaticField(fieldType)) {
        field = DataTemplateService.getStaticField(this.generateTempGUID());
      } else {
        field = DataTemplateService.getField(this.generateTempGUID());
        field.properties._value.type = valueType;
      }
      field._ui.inputType = fieldType;
      //field.properties._value.type = valueType;
      return field;
    };

    // Function that generates the @context for an instance, based on the schema @context definition
    service.generateInstanceContext = function (schemaContext) {
      var context = {};
      angular.forEach(schemaContext.properties, function (value, key) {
        if (value.enum) {
          context[key] = value.enum[0];
        } else {
          console.log('generateInstanceContext empty value');
          console.log(value);
        }
      });
      return context;
    };


    // Function that generates the @type for an instance, based on the schema @type definition
    service.generateInstanceType = function (schemaType) {
      // If there is no type defined at the schema level
      if (angular.isUndefined(schemaType.oneOf[0].enum)) {
        return null;
      } else {
        if (schemaType.oneOf[0].enum.length === 0) {
          return null;
          // If only one type has been defined, a string is returned
        } else if (schemaType.oneOf[0].enum.length == 1) {
          return schemaType.oneOf[0].enum[0];
          // If more than one types have been defined for the template/element/field, an array is returned
        } else {
          return schemaType.oneOf[0].enum;
        }
      }
    };

    service.cardinalizeField = function (field) {
      if (typeof(field.minItems) != 'undefined' && !field.items) {

        field.items = {
          '$schema'             : field.$schema,
          'type'                : field.type,
          '@id'                 : field['@id'],
          '@type'               : field['@type'],
          '@context'            : field['@context'],
          'title'               : field._ui.title + ' field schema',
          'description'         : field._ui.title + ' field schema autogenerated by the CEDAR Template Editor',
          '_ui'                 : field._ui,
          '_valueConstraints'   : field._valueConstraints,
          'properties'          : field.properties,
          'required'            : field.required,
          'additionalProperties': field.additionalProperties
        };
        field.type = 'array';

        delete field.$schema;
        delete field['@id'];
        delete field['@type'];
        delete field['@context'];
        delete field.properties;
        delete field.title;
        delete field.description;
        delete field._ui;
        delete field._valueConstraints;
        delete field.required;
        delete field.additionalProperties;

        return true;
      } else {
        return false;
      }
    };

    service.uncardinalizeField = function (field) {
      if (typeof field.minItems == 'undefined' && field.items) {

        field.$schema = field.items.$schema;
        field.type = 'object';
        field['@id'] = field.items["@id"];
        field['@type'] = field.items["@type"];
        field['@context'] = field.items["@context"];
        field.title = field.items.title;
        field.description = field.items.description;
        field._ui = field.items._ui;
        field._valueConstraints = field.items._valueConstraints;
        field.properties = field.items.properties;
        field.required = field.items.required;
        field.additionalProperties = field.items.additionalProperties;

        delete field.items;
        delete field.maxItems;


        return true;
      } else {
        return false;
      }
    };

    service.isCardinalElement = function (element) {
      return element.type == 'array';
    };

    // If Max Items is N, its value will be 0, then need to remove it from schema
    // if Min and Max are both 1, remove them
    service.removeUnnecessaryMaxItems = function (properties) {
      angular.forEach(properties, function (value, key) {
        if (!DataUtilService.isSpecialKey(key)) {
          if ((value.minItems == 1 && value.maxItems == 1)) {
            delete value.minItems;
            delete value.maxItems;
          }
          if (value.maxItems == 0) {
            delete value.maxItems;
          }
        }
      });
    };

    service.getDivId = function (node) {

      var elProperties = service.getFieldProperties(node);
      return elProperties._tmp.divId;

    };

    service.getFieldProperties = function (field) {
      if (field) {
        if (field.type == 'array' && field.items && field.items.properties) {
          return field.items.properties;
        } else {
          return field.properties;
        }
      }
    };

    // Returns the field schema. If the field is defined as an array, this function will return field.items, because the schema is defined at that level.
    service.getFieldSchema = function (field) {
      if (field) {
        if (field.type == 'array' && field.items) {
          return field.items;
        } else {
          return field;
        }
      }
    };

    service.addOption = function (field) {
      var emptyOption = {
        "text": ""
      };
      field._ui.options.push(emptyOption);
    };

    service.generateCardinalities = function (min, max,  addUnlimited) {
      var results = [];
      for (var i = min; i <= max; i++) {
        results.push({value: i, label: i});
      }
      if (addUnlimited) {
        results.push({value: 0, label: "N"});
      }
      results.push({value: -1, label: ""});

      return results;
    };

    // TODO: remove this if not needed
    // Generating a RFC4122 version 4 compliant GUID
    service.generateGUID = function () {
      var d = Date.now();
      var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
      return guid;
    };

    service.generateTempGUID = function () {
      return "tmp-" + Date.now() + "-" + (window.performance.now() | 0);
    };

    service.elementIsMultiInstance = function (element) {
      return element.hasOwnProperty('minItems') && !angular.isUndefined(element.minItems);
    };

    // Transform string to obtain JSON field name
    service.getFieldName = function (string) {
      // Using Camel case format
      return string.replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
        return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
      }).replace(/\s+/g, '');

      //// Using underscore format
      //return string
      //  .replace(/'|"|(|)/g, '')
      //  .replace(/ +/g, "_")
      //  .toLowerCase();
    };

    service.getEnumOf = function (fieldName) {
      return UrlService.schemaProperty(fieldName);
    };

    service.generateFieldContextProperties = function (fieldName) {
      var c = {};
      c.enum = new Array(service.getEnumOf(fieldName));
      return c;
    };

    service.getAcceptableKey = function (obj, suggestedKey) {
      if (!obj || typeof(obj) != "object") {
        return;
      }

      var key = suggestedKey;
      if (obj[key]) {
        var idx = 1;
        while (obj["" + key + idx]) {
          idx += 1;
        }

        key = "" + key + idx;
      }

      return key;
    };

    service.addKeyToObject = function (obj, key, value) {
      if (!obj || typeof(obj) != "object") {
        return;
      }

      key = service.getAcceptableKey(obj, key);
      obj[key] = value;
      return obj;
    };

    service.renameKeyOfObject = function (obj, currentKey, newKey) {
      if (!obj || !obj[currentKey]) {
        return;
      }

      newKey = service.getAcceptableKey(obj, newKey);
      Object.defineProperty(obj, newKey, Object.getOwnPropertyDescriptor(obj, currentKey));
      delete obj[currentKey];

      return obj;
    };

    service.idOf = function (fieldOrElement) {
      if (fieldOrElement) {
        return service.getFieldSchema(fieldOrElement)['@id'];
      }
    };

    /**
     * strip tmps for node and children
     * @param node
     */
    service.stripTmps = function (node) {
      service.stripTmpIfPresent(node);

      angular.forEach(node.properties, function (value, key) {
        if (!DataUtilService.isSpecialKey(key)) {
          service.stripTmps(value);
        }
      });
    };

    /**
     * remove the _tmp field from the node and its properties
     * @param node
     */
    service.stripTmpIfPresent = function (node) {

      if (node.hasOwnProperty("_tmp")) {
        delete node._tmp;
      }

      var p = $rootScope.propertiesOf(node);
      if (p && p.hasOwnProperty("_tmp")) {
        delete p._tmp;
      }

    };

    /**
     * create domIds for node and children
     * @param node
     */
    service.createDomIds = function (node) {

      service.addDomIdIfNotPresent(node, service.createDomId());

      angular.forEach(node.properties, function (value, key) {
        if (!DataUtilService.isSpecialKey(key)) {
          service.createDomIds(value);
        }
      });
    };

    /**
     * add a domId to the node if there is not one present
     * @param node
     */
    service.addDomIdIfNotPresent = function (node, id) {

      if (!node.hasOwnProperty("_tmp")) {
        node._tmp = {};
      }
      if (!node._tmp.hasOwnProperty("domId")) {
        node._tmp.domId = id;
      }

      return node._tmp.domId;

    };


    /**
     * add a domId to the node if there is not one present
     * @param node
     */
    service.defaultTitle = function (node) {

      node._ui.title = "Untitled";

    };

    /**
     * get the domId of the node if there is one present
     * @param node
     */
    service.getDomId = function (node) {

      var domId = null;

      if (node.hasOwnProperty("_tmp")) {
        domId = node._tmp.domId;
      }

      return domId;
    };


    /**
     * make a unique string that we can use for dom ids
     */
    service.createDomId = function () {
      return 'id' + Math.random().toString().replace(/\./g, '');
    };


    /**
     * get the controlled terms list for field types
     * @returns {Array}
     */
    service.getFieldControlledTerms = function (node) {

      var properties = service.getFieldProperties(node);
      return properties['@type'].oneOf[1].items['enum'];

    };

    /**
     * parse the ontology code from the source
     * @param itemData
     * @returns {*}
     */
    service.parseOntologyCode = function (itemData) {
      var re = new RegExp('\((.+)\)');
      var m;
      var result;
      if ((m = re.exec(itemData)) !== null) {
        if (m.index === re.lastIndex) {
          re.lastIndex++;
        }
        result = m[1];
      }
      return result;
    };

    /**
     * parse the class from the selfUrl
     * @param itemData
     * @returns {*}
     */
    service.parseClassLabel = function (itemData) {
      var re = new RegExp('\/classes\/(.+)');
      var m;
      var result;
      if ((m = re.exec(itemData)) !== null) {
        if (m.index === re.lastIndex) {
          re.lastIndex++;
        }
        result = m[1];
      }
      return result;
    };



    /**
     * parse the ontology code from the selfUrl
     * @param itemData
     * @returns {*}
     */
    service.parseOntologyName = function (itemData) {
      var re = new RegExp('\/ontologies\/(.+)\/classes\/');
      var m;
      var result;
      if ((m = re.exec(itemData)) !== null) {
        if (m.index === re.lastIndex) {
          re.lastIndex++;
        }
        result = m[1];
      }
      return result;
    };

    /**
     * delete both the oneOf copies of the class id for the question type
     * @param itemDataId
     */
    service.deleteFieldControlledTerm = function (itemDataId, node) {


      var properties = service.getFieldProperties(node);
      var idx = properties["@type"].oneOf[0].enum.indexOf(itemDataId);

      if (idx >= 0) {
        properties["@type"].oneOf[0].enum.splice(idx, 1);
        if (properties["@type"].oneOf[0].enum.length == 0) {
          delete properties["@type"].oneOf[0].enum;
          console.log('delete');
        }
      }

      idx = properties['@type'].oneOf[1].items.enum.indexOf(itemDataId);

      if (idx >= 0) {
        properties['@type'].oneOf[1].items.enum.splice(idx, 1);
        if (properties["@type"].oneOf[1].items.enum.length == 0) {
          delete properties["@type"].oneOf[1].items.enum;
          console.log('delete');
        }
      }
    };

    /**
     * delete the branch in valueConstraints
     * @param branch
     */
    service.deleteFieldAddedBranch = function (branch, node) {

      var valueConstraints = $rootScope.schemaOf(node)._valueConstraints;
      for (var i = 0, len = valueConstraints.branches.length; i < len; i += 1) {
        if (valueConstraints.branches[i]['uri'] == branch['uri']) {
          valueConstraints.branches.splice(i, 1);
          break;
        }
      }
    };

    /**
     * delete the ontologyCLass in valueConstraints
     * @param ontologyClass
     */
    service.deleteFieldAddedClass = function (ontologyClass, node) {

      var valueConstraints = $rootScope.schemaOf(node)._valueConstraints;
      for (var i = 0, len = valueConstraints.classes.length; i < len; i += 1) {
        if (valueConstraints.classes[i] == ontologyClass) {
          valueConstraints.classes.splice(i, 1);
          break;
        }
      }
    };


    /**
     * delete the ontology in valueConstraints
     * @param ontology
     */
    service.deleteFieldAddedOntology = function (ontology, node) {

      var valueConstraints = $rootScope.schemaOf(node)._valueConstraints;
      for (var i = 0, len = valueConstraints.ontologies.length; i < len; i += 1) {
        if (valueConstraints.ontologies[i]['uri'] == ontology['uri']) {
          valueConstraints.ontologies.splice(i, 1);
          break;
        }
      }
    };

    /**
     * delete the valueSet in valueConstraints
     * @param valueSet
     */
    service.deleteFieldAddedValueSet = function (valueSet, node) {

      var valueConstraints = $rootScope.schemaOf(node)._valueConstraints;
      for (var i = 0, len = valueConstraints.valueSets.length; i < len; i += 1) {
        if (valueConstraints.valueSets[i]['uri'] == valueSet['uri']) {
          valueConstraints.valueSets.splice(i, 1);
          break;
        }
      }
    };

    return service;
  };

});
