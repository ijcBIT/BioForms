'use strict';


define([
      'angular'

    ], function (angular) {
      angular.module('cedar.templateEditor.form.flowModal', []).directive('flowModal', flowModal);


      /* new folder modal  */
      function flowModal() {

        var directive = {
          bindToController: {
            modalVisible: '=',
            files       : '=',
            instance    : '='
          },
          controller      : flowModalController,
          controllerAs    : 'flowCntl',
          restrict        : 'E',
          templateUrl     : 'scripts/form/flow-modal.directive.html',
        };
        return directive;

        flowModalController.$inject = [
          '$scope',
          '$rootScope',
          '$timeout',
          'QueryParamUtilsService',
          'UISettingsService',
          'UIMessageService',
          'resourceService',
          'TemplateInstanceService',
          'AuthorizedBackendService'
        ];


        // TODO
        //
        // 1. fix the way the code is loaded and configed from app.cs.  it should be loaded here instead
        //    1.1. change the way scope.flow is initialized
        // 2. clean up css
        //    2.1. change tabs to wizard
        //    2.2. clean up css for typeahead inputs, maybe first change typeahead to ui-select
        //    2.3. fix progress button css
        // 3. change they way the queue gets cleaned after submission is complete
        // 4. invoke the dialog from a workspace menu item
        // 5. why doesn't the close x work?
        //


        function flowModalController($scope, $rootScope, $timeout, QueryParamUtilsService, UISettingsService,
                                     UIMessageService, resourceService, TemplateInstanceService, AuthorizedBackendService) {
          var vm = this;
          var vm = $scope;

          vm.url = "https://httpbin.org/post";
          //vm.url =  UrlService.airrSubmission();
          // var config = {
          //   headers: {
          //     "Content-Type": undefined
          //   }
          // };
          $scope.flow;


          // $scope.flow = require('ngFlow');
          // $scope.uploader = {};
          // $scope.uploader.opts = {target: 'another-upload-path.php'};

          $scope.init = function (flow) {
            $scope.flow = flow;
          };


          $scope.instanceName;
          $scope.resources = [];

          //
          // tabs
          //
          $scope.modes = ['ImmPort', 'AIRR', 'LINCS'];
          $scope.selectedMode = 0;
          $scope.setMode = function (mode) {
            $scope.selectedMode = mode;
          };

          //
          // workspaces
          //
          $scope.selectedWorkspace = undefined;
          $scope.loadingWorkspace;
          $scope.workspaces = ['Test Environment for CEDAR', 'cedaruser_cedaruser_Workspace'];
          $scope.dummyWorkspaceResponse = {
            "success"   : true,
            "workspaces": [
              {
                "workspaceID"  : "100001",
                "workspaceName": "Test Environment for CEDAR"
              },
              {
                "workspaceID"  : "5733",
                "workspaceName": "cedaruser_cedaruser_Workspace"
              }
            ]
          };

          //
          // metadata instances
          //
          $scope.selectedInstance = undefined;
          $scope.loadingInstances;
          $scope.instances = function (term) {

            var limit = UISettingsService.getRequestLimit();
            var offset = 0;
            var resourceTypes = ['instance'];
            var sort = 'name';

            return resourceService.getSearchResourcesPromise(term,
                {
                  resourceTypes: resourceTypes,
                  sort         : sort,
                  limit        : limit,
                  offset       : offset
                },
                function (response) {

                  // keep the full data in the resources array
                  // give the name map back to the typeahead directive
                  $scope.resources = response.data.resources;
                  return $scope.resources.map(function (item) {
                    return item.name;
                  });
                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.SEARCH.error', error);
                }
            );
          };

          // load and add the instances to the flow queue
          $scope.insertItems = function (flow, name) {
            for (var i = 0; i < $scope.resources.length; i++) {
              if ($scope.resources[i].name === name) {

                // get this instance
                var instanceId = $scope.resources[i]['@id'];
                AuthorizedBackendService.doCall(
                    TemplateInstanceService.getTemplateInstance(instanceId),
                    function (instanceResponse) {

                      // this needs a timeout or flow vomits
                      $timeout(function () {
                        var blob = new Blob([JSON.stringify(instanceResponse.data, null, 2)], {type: 'application/json'});
                        blob.name = name + '.json';
                        flow.addFile(blob);
                      }, 0);

                    },
                    function (instanceErr) {
                      UIMessageService.showBackendError('SERVER.INSTANCE.load.error', instanceErr);
                    }
                );
              }
            }
          };

          // start the upload
          $scope.startUpload = function (flow) {
            var fileCount = flow.files.length;
            var uid = Math.random().toString().replace('.', '');
            flow.opts.query = {submissionId: uid, numberOfFiles: fileCount};
            flow.upload();
          };

          $scope.cancelAll = function (flow) {
            flow.cancel();
          };

          $scope.pauseAll = function (flow) {
            flow.pause();
          };

          $scope.resumeAll = function (flow) {
            flow.resume();
          };

          $scope.$on('flow::fileAdded', function (event, $flow, flowFile) {
            console.log('flow::fileAdded');
          });

          $scope.$on('flow::progress', function (event, $flow, flowFile) {
            console.log('flow::progress');
          });

          $scope.flowProgress = function (flow) {
            console.log('flowProgress ');
          };

          $scope.flowFileProgress = function (flow, file) {
            console.log('flowFileProgress ');
          };

          $scope.$on('flow::complete', function (event, $flow, flowFile) {
            console.log('flow::complete');
          });

          $scope.$on('flow::uploadStart', function (event, $flow, flowFile) {
            console.log('flow::complete');
          });

          // TODO not seeing this event coming through
          $scope.$on('flow::complete', function (event, $flow) {
            console.log('flow::complete');
            $timeout(function () {
              $flow.cancel();
            }, 5000);
          });


          // modal open or closed
          $scope.$on('flowModalVisible', function (event, params) {

            if (params && params[0]) {
              $timeout(function () {
                // modal just opened
                $scope.flow.cancel();
                jQuery('#flow-modal input').focus().select();
              }, 0);
            }
          });
        }
      }
    }
);

