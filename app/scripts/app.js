/*jslint node: true */
/*global define */
'use strict';

define([
  // angular modules
  'angular',
  'lib/angucomplete-alt/angucomplete-alt',
  'lib/angular-animate/angular-animate.min',
  'lib/angular-bootstrap/ui-bootstrap-tpls.min',
  // 'lib/ngHandsontable/dist/ngHandsontable.min',
  'lib/ng-tags-input/ng-tags-input.min',
  'lib/angular-route/angular-route.min',
  'lib/angular-sanitize/angular-sanitize.min',
  'lib/angular-ui-select/dist/select.min',
  'lib/angular-ui-sortable/sortable.min',
  'lib/angular-ui-switch/angular-ui-switch.min',
  'lib/angular-ui-keypress/keypress.min',
  'lib/angular-translate/angular-translate.min',
  'lib/angular-translate-loader-static-files/angular-translate-loader-static-files.min',
  'lib/angular-toasty/dist/angular-toasty.min',

  // non-angular 3rd party libraries
  'lib/bootstrap/dist/js/bootstrap.min',
  'lib/bootstrap-select/dist/js/bootstrap-select.min',
  'lib/ng-ckeditor/ng-ckeditor.min',
  'ckeditor',
  'lib/handsontable/dist/handsontable.full',
  'jquery',
  'lib/jquery-ui/jquery-ui.min',
  'lib/perfnow-polyfill/perfnow-polyfill',
  'lib/sweetalert/dist/sweetalert.min',
  '3rdparty/angular-fitvids/angular-fitvids',
  'lib/angulartics/dist/angulartics.min',
  'lib/angulartics-google-analytics/dist/angulartics-google-analytics.min',
  'lib/ngprogress/build/ngprogress.min',
  'jsonld',
  'flow',

  // custom libraries
  'cedar/template-editor/handsontable/SpreadsheetContext',
  'cedar/template-editor/handsontable/MultiCheckboxEditor',

  // cedar template editor modules
  'cedar/template-editor/core/core.module',
  'cedar/template-editor/dashboard/dashboard.module',
  'cedar/template-editor/layout/layout.module',
  'cedar/template-editor/service/service.module',
  'cedar/template-editor/template/template.module',
  'cedar/template-editor/template-element/template-element.module',
  'cedar/template-editor/template-field/template-field.module',
  'cedar/template-editor/template-instance/template-instance.module',
  'cedar/template-editor/profile/profile.module',
  'cedar/template-editor/messaging/messaging.module',

  // classic javascript, app data
  'cedar/template-editor/classic/app-data'
], function (angular, jsonld, flow) {
  return angular.module('cedar.templateEditor', [
    'ui.bootstrap',
    'ui.keypress',
    'ngRoute',
    'ngAnimate',
    'ngSanitize',
    'ui.select',
    'ui.sortable',
    'pascalprecht.translate',
    'angular-toasty',
    'ngCkeditor',
    'fitVids',
    'angulartics',
    'angulartics.google.analytics',
    'ngProgress',
    'flow',

    'cedar.templateEditor.core',
    'cedar.templateEditor.dashboard',
    'cedar.templateEditor.layout',
    'cedar.templateEditor.service',
    'cedar.templateEditor.template',
    'cedar.templateEditor.templateElement',
    'cedar.templateEditor.templateField',
    'cedar.templateEditor.templateInstance',
    'cedar.templateEditor.profile',
    'cedar.templateEditor.messaging',
    'cedar.templateEditor.profile',

  ])
      .config(['flowFactoryProvider', function (flowFactoryProvider) {
        flowFactoryProvider.defaults = {
          target: 'https://httpbin.org/post',
          permanentErrors: [404, 500, 501],
          testChunks:false,
          maxChunkRetries: 1,
          chunkRetryInterval: 5000,
          simultaneousUploads: 4,
          singleFile: false
        };
        flowFactoryProvider.on('catchAll', function (event) {
          //console.log('catchAll', arguments);
        });
        // Can be used with different implementations of Flow.js
        // flowFactoryProvider.factory = fustyFlowFactory;

        //migrating from angular v1.5.8 to 1.7.0 angular.lowercase is not supported anymore
        //following redefinition is used as a workaround
        angular.lowercase = function(text) {
          return text.toLowerCase();
        };
      }]);
});
