'use strict';

define([
      'angular',
      'cedar/template-editor/service/cedar-user',
    ], function (angular) {
      angular.module('cedar.templateEditor.finder.cedarFinderDirective', [
        'cedar.templateEditor.service.cedarUser'
      ]).directive('cedarFinder', cedarFinderDirective);

      cedarFinderDirective.$inject = ['CedarUser'];

      function cedarFinderDirective(CedarUser) {

        var directive = {
          bindToController: {
            selectResourceCallback: '=',
            pickResourceCallback  : '=',
            mode                  : '='
          },
          controller      : cedarFinderController,
          controllerAs    : 'finder',
          restrict        : 'E',
          scope           : {},
          templateUrl     : 'scripts/finder/cedar-finder.directive.html'
        };

        return directive;

        cedarFinderController.$inject = [
          '$location',
          '$timeout',
          '$scope',
          '$rootScope',
          '$translate',
          'CedarUser',
          'resourceService',
          'UIMessageService',
          'UISettingsService',
          'UrlService',
          'AuthorizedBackendService',
          'TemplateInstanceService',
          'TemplateElementService',
          'TemplateService',
          'CONST'
        ];

        function cedarFinderController($location, $timeout, $scope, $rootScope, $translate, CedarUser, resourceService,
                                                   UIMessageService, UISettingsService, UrlService,
                                                   AuthorizedBackendService, TemplateInstanceService,
                                                   TemplateElementService, TemplateService, CONST) {
          var vm = this;

          vm.breadcrumbName = breadcrumbName;
          vm.cancelCreateEditFolder = cancelCreateEditFolder;
          vm.currentPath = "";
          vm.currentFolderId = "";
          vm.deleteResource = deleteResource;
          vm.doCreateEditFolder = doCreateEditFolder;
          vm.doSearch = doSearch;
          vm.editResource = editResource;
          vm.facets = {};
          vm.forms = [];
          vm.formFolder = null;
          vm.formFolderName = null;
          vm.formFolderDescription = null;
          vm.getFacets = getFacets;
          vm.getForms = getForms;
          vm.getFolderContents = getFolderContents;
          vm.getFolderContentsById = getFolderContentsById;
          vm.getResourceIconClass = getResourceIconClass;
          vm.getResourceTypeClass = getResourceTypeClass;
          vm.goToResource = goToResource;
          vm.goToFolder = goToFolder;
          vm.isResourceTypeActive = isResourceTypeActive;
          vm.isSearching = false;
          vm.launchInstance = launchInstance;
          vm.copyToWorkspace = copyToWorkspace;
          vm.setResourceInfoVisibility = setResourceInfoVisibility;
          vm.onDashboard = onDashboard;
          vm.narrowContent = narrowContent;
          vm.pathInfo = [];
          vm.params = $location.search();
          vm.resources = [];
          vm.selectedResource = null;
          vm.hasSelection = hasSelection;
          vm.getSelection = getSelection;
          vm.setSortOption = setSortOption;
          vm.sortName = sortName;
          vm.sortCreated = sortCreated;
          vm.sortUpdated = sortUpdated;
          vm.showCreateFolder = showCreateFolder;
          vm.showFilters = true;
          vm.filterShowing = filterShowing;
          vm.resetFilters = resetFilters;
          vm.filterSections = {};
          vm.isFilterSection = isFilterSection;
          vm.getArrowIcon = getArrowIcon;
          vm.showFloatingMenu = false;
          vm.infoShowing = infoShowing;
          vm.showOrHide = showOrHide;
          vm.sortOptionLabel = $translate.instant('DASHBOARD.sort.name');
          vm.toggleFavorites = toggleFavorites;
          vm.toggleFilters = toggleFilters;
          vm.workspaceClass = workspaceClass;


          vm.toggleResourceInfo = toggleResourceInfo;
          vm.toggleResourceType = toggleResourceType;
          vm.setResourceViewMode = setResourceViewMode;
          vm.isResourceViewMode = isResourceViewMode;
          vm.isTemplate = isTemplate;
          vm.isElement = isElement;
          vm.isFolder = isFolder;
          vm.isMeta = isMeta;

          vm.finderModalId = 'finder-modal';

          vm.search = search;
          vm.openResource = openResource;
          vm.hideFinder = hideFinder;

          vm.editingDescription = false;

          vm.startDescriptionEditing = function () {
            var resource = vm.getSelection();
            if (resource != null) {
              if (resource.nodeType == 'folder') {
                vm.showEditFolder(resource, true);
              } else {
                vm.editingDescription = true;
                $timeout(function () {
                  var jqDescriptionField = $('#edit-description');
                  jqDescriptionField.focus();
                  var l = jqDescriptionField.val().length;
                  jqDescriptionField[0].setSelectionRange(0, l);
                });
              }
            }
          };

          vm.showEditFolder = function (resource, selectDescription) {
            vm.formFolder = resource;
            vm.formFolderName = resource.name;
            vm.formFolderDescription = resource.description;
            $('#editFolderModal').modal('show');
            $timeout(function () {
              var selector = '#formFolderName';
              if (selectDescription) {
                selector = '#formFolderDescription';
              }
              var jqFolderProperty = $(selector);
              jqFolderProperty.focus();
              var l = jqFolderProperty.val().length;
              jqFolderProperty[0].setSelectionRange(0, l);
            });
          };

          vm.cancelDescriptionEditing = function () {
            vm.editingDescription = false;
          };

          vm.selectResource = function (resource) {
            vm.cancelDescriptionEditing();
            if (vm.selectedResource == null || vm.selectedResource['@id'] != resource['@id']) {
              vm.getResourceDetails(resource);
            }
            if (typeof vm.selectResourceCallback === 'function') {
              vm.selectResourceCallback(resource);
            }
          };

          // show the info panel with this resource or find one
          vm.showInfoPanel = function (resource) {
          };

          vm.isResourceSelected = function (resource) {
            if (resource == null || vm.selectedResource == null) {
              return false;
            } else {
              return vm.selectedResource['@id'] == resource['@id'];
            }
          };

          // toggle the info panel with this resource or find one
          vm.toggleInfoPanel = function (resource) {
            if (!vm.showResourceInfo) {
              vm.showInfoPanel(resource);
            } else {
              vm.setResourceInfoVisibility(false);
            }
          };


          vm.getResourceDetails = function (resource) {
            if (!resource && vm.hasSelection()) {
              resource = vm.getSelection();
            }
            var id = resource['@id'];
            resourceService.getResourceDetail(
                resource,
                function (response) {
                  vm.selectedResource = response;
                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.' + resource.nodeType.toUpperCase() + '.load.error', error);
                }
            );
          };

          vm.updateDescription = function () {
            vm.editingDescription = false;
            var resource = vm.getSelection();
            if (resource != null) {
              var postData = {};
              var id = resource['@id'];
              var nodeType = resource.nodeType;
              var description = resource.description;

              if (nodeType == 'instance') {
                AuthorizedBackendService.doCall(
                    TemplateInstanceService.updateTemplateInstance(id, {'_ui.description': description}),
                    function (response) {
                      UIMessageService.flashSuccess('SERVER.INSTANCE.update.success', null, 'GENERIC.Updated');
                    },
                    function (err) {
                      UIMessageService.showBackendError('SERVER.INSTANCE.update.error', err);
                    }
                );
              } else if (nodeType == 'element') {
                AuthorizedBackendService.doCall(
                    TemplateElementService.updateTemplateElement(id, {'_ui.description': description}),
                    function (response) {
                      UIMessageService.flashSuccess('SERVER.ELEMENT.update.success', {"title": response.data._ui.title},
                          'GENERIC.Updated');
                    },
                    function (err) {
                      UIMessageService.showBackendError('SERVER.ELEMENT.update.error', err);
                    }
                );
              } else if (nodeType == 'template') {
                AuthorizedBackendService.doCall(
                    TemplateService.updateTemplate(id, {'_ui.description': description}),
                    function (response) {
                      $scope.form = response.data;
                      UIMessageService.flashSuccess('SERVER.TEMPLATE.update.success',
                          {"title": response.data._ui.title}, 'GENERIC.Updated');
                    },
                    function (err) {
                      UIMessageService.showBackendError('SERVER.TEMPLATE.update.error', err);
                    }
                );
              }
            }
          };

          //*********** ENTRY POINT

          setUIPreferences();
          init();

          function setUIPreferences() {
            var uip = CedarUser.getUIPreferences();
            //vm.showFavorites = CedarUser.getUIPreferences().populateATemplate.opened;
            vm.resourceTypes = {
              element : uip.resourceTypeFilters.element,
              field   : uip.resourceTypeFilters.field,
              instance: uip.resourceTypeFilters.instance,
              template: uip.resourceTypeFilters.template
            };
            vm.filterSections = {
              type  : false,
              author: false,
              status: false,
              term  : false
            };
            var option = CedarUser.getUIPreferences().folderView.sortBy;
            setSortOptionUI(option);
            vm.resourceViewMode = uip.folderView.viewMode;
            if (uip.hasOwnProperty('infoPanel')) {
              vm.showResourceInfo = uip.infoPanel.opened;
            } else {
              vm.showResourceInfo = false;
            }
          }

          function init() {
            vm.isSearching = false;
            if (vm.params.search) {
              vm.isSearching = true;
              if (vm.showFavorites) {
                vm.showFavorites = false;
                updateFavorites();
              }
              getFacets();
              doSearch(vm.params.search);
            } else if (vm.params.folderId) {
              getFacets();
              getFolderContentsById(decodeURIComponent(vm.params.folderId));
            } else {
              goToFolder(CedarUser.getHomeFolderId());
            }
            if (vm.showFavorites) {
              getForms();
            }
            updateFavorites(false);
          }

          function initSearch() {
            if (vm.params.search) {
              vm.isSearching = true;
              getFacets();
              doSearch(vm.params.search);
            } else {
              goToFolder(CedarUser.getHomeFolderId());
            }
          }

          function breadcrumbName(folderName) {
            if (folderName == '/') {
              return 'All';
            }
            return folderName;
          }

          function cancelCreateEditFolder() {
            vm.formFolderName = 'Untitled';
            vm.formFolderDescription = 'Untitled';
            vm.formFolder = null;
            $('#editFolderModal').modal('hide');
          }

          function showCreateFolder() {
            vm.showFloatingMenu = false;
            vm.formFolderName = 'Untitled';
            vm.formFolderDescription = 'Untitled';
            vm.formFolder = null;
            $('#editFolderModal').modal('show');
            $timeout(function () {
              var jqFolderName = $('#formFolderName');
              jqFolderName.focus();
              var l = jqFolderName.val().length;
              jqFolderName[0].setSelectionRange(0, l);
            });
          }

          function doCreateEditFolder() {
            $('#editFolderModal').modal('hide');
            if (vm.formFolder) {
              vm.formFolder.name = vm.formFolderName;
              vm.formFolder.description = vm.formFolderDescription;
              resourceService.updateFolder(
                  vm.formFolder,
                  function (response) {
                    init();
                    UIMessageService.flashSuccess('SERVER.FOLDER.update.success', {"title": vm.formFolderName},
                        'GENERIC.Updated');
                  },
                  function (response) {
                    UIMessageService.showBackendError('SERVER.FOLDER.update.error', response);
                  }
              );
              // edit
            } else {
              resourceService.createFolder(
                  vm.params.folderId,
                  vm.formFolderName,
                  vm.formFolderDescription,
                  function (response) {
                    init();
                    UIMessageService.flashSuccess('SERVER.FOLDER.create.success', {"title": vm.formFolderName},
                        'GENERIC.Created');
                  },
                  function (response) {
                    if (response.status == 400) {
                      UIMessageService.showWarning(
                          'GENERIC.Warning',
                          'SERVER.FOLDER.create.' + response.data.errorSubType,
                          'GENERIC.Ok',
                          response.data.errorParams
                      );
                    } else {
                      UIMessageService.showBackendError('SERVER.FOLDER.create.error', response);
                    }
                  }
              );
            }
          }

          function doSearch(term) {
            var resourceTypes = activeResourceTypes();
            resourceService.searchResources(
                term,
                {resourceTypes: resourceTypes, sort: sortField(), limit: 100, offset: 0},
                function (response) {
                  vm.searchTerm = term;
                  vm.isSearching = true;
                  vm.resources = response.resources;
                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.SEARCH.error', error);
                }
            );
          }

          function copyToWorkspace(resource) {
            if (!resource) {
              resource = getSelection();
            }
            resourceService.copyResourceToWorkspace(
                resource,
                function (response) {

                  // TODO refresh the current page just in case you copied to the current page
                  vm.params = $location.search();
                  init();

                  UIMessageService.flashSuccess('SERVER.RESOURCE.copyToWorkspace.success', {"title": resource.name},
                      'GENERIC.Copied');
                },
                function (response) {
                  UIMessageService.showBackendError('SERVER.RESOURCE.copyToWorkspace.error', response);
                }
            );
          }

          function launchInstance(resource) {
            if (!resource) {
              resource = getSelection();
            }


            var params = $location.search();
            var folderId;
            if (params.folderId) {
              folderId = params.folderId;
            } else {
              folderId = vm.currentFolderId
            }
            var url = UrlService.getInstanceCreate(resource['@id'], folderId);
            $location.url(url);
          }

          function openResource(resource) {
            var r = resource;
            if (!r && vm.selectedResource) {
              r = vm.selectedResource;
            }

            vm.params.search = null;

            if (r.nodeType == 'folder') {
              goToFolder(r['@id']);
            } else {
              editResource(r);
              hideFinder();
            }
          }

          function goToResource(resource) {
            var r = resource;
            if (!r && vm.selectedResource) {
              r = vm.selectedResource;
            }

            vm.params.search = null;

            if (r.nodeType == 'folder') {
              goToFolder(r['@id']);
            } else {
              if (r.nodeType == 'template') {
                launchInstance(r);
              } else {

                editResource(r);
              }

            }
          }

          function editResource(resource) {
            var id = resource['@id'];
            if (typeof vm.pickResourceCallback === 'function') {
              vm.pickResourceCallback(resource);
            }
            switch (resource.nodeType) {
              case CONST.resourceType.TEMPLATE:
                $location.path(UrlService.getTemplateEdit(id));
                break;
              case CONST.resourceType.ELEMENT:
                break;
              case CONST.resourceType.INSTANCE:
                $location.path(UrlService.getInstanceEdit(id));
                break;
              case CONST.resourceType.LINK:
                $location.path(scope.href);
                break;
              case CONST.resourceType.FOLDER:
                vm.showEditFolder(resource);
                break;
            }
          }

          function deleteResource(resource) {
            if (!resource && hasSelection()) {
              resource = getSelection();
            }
            UIMessageService.confirmedExecution(
                function () {
                  resourceService.deleteResource(
                      resource,
                      function (response) {
                        // remove resource from list
                        var index = vm.resources.indexOf(resource);
                        vm.resources.splice(index, 1);
                        resetSelected();
                        UIMessageService.flashSuccess('SERVER.' + resource.nodeType.toUpperCase() + '.delete.success',
                            {"title": resource.nodeType},
                            'GENERIC.Deleted');
                      },
                      function (error) {
                        UIMessageService.showBackendError('SERVER.' + resource.nodeType.toUpperCase() + '.delete.error',
                            error);
                      }
                  );
                },
                'GENERIC.AreYouSure',
                'DASHBOARD.delete.confirm.' + resource.nodeType,
                'GENERIC.YesDeleteIt'
            );
          }

          function getFacets() {
            resourceService.getFacets(
                function (response) {
                  vm.facets = response.facets;
                },
                function (error) {
                }
            );
          }

          function getForms() {
            return resourceService.searchResources(
                null,
                {resourceTypes: ['template'], sort: '-lastUpdatedOnTS', limit: 4, offset: 0},
                function (response) {
                  vm.forms = response.resources;
                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.SEARCH.error', error);
                }
            );
          }

          // TODO: merge this with getFolderContents below
          function getFolderContentsById(folderId) {
            var resourceTypes = activeResourceTypes();
            if (resourceTypes.length > 0) {
              return resourceService.getResources(
                  {folderId: folderId, resourceTypes: resourceTypes, sort: sortField(), limit: 100, offset: 0},
                  function (response) {
                    vm.currentFolderId = folderId;
                    vm.resources = response.resources;
                    vm.pathInfo = response.pathInfo;
                    vm.currentPath = vm.pathInfo.pop();
                  },
                  function (error) {
                    UIMessageService.showBackendError('SERVER.FOLDER.load.error', error);
                  }
              );
            } else {
              vm.resources = [];
            }
          }

          // TODO: merge this with getFolderContentsById above
          function getFolderContents(path) {
            var resourceTypes = activeResourceTypes();
            if (resourceTypes.length > 0) {
              return resourceService.getResources(
                  {path: path, resourceTypes: resourceTypes, sort: sortField(), limit: 100, offset: 0},
                  function (response) {
                    vm.resources = response.resources;
                    vm.pathInfo = response.pathInfo;
                    vm.currentPath = vm.pathInfo.pop();
                    vm.currentFolderId = vm.currentPath['@id'];
                  },
                  function (error) {
                    UIMessageService.showBackendError('SERVER.FOLDER.load.error', error);
                  }
              );
            } else {
              vm.resources = [];
            }
          }

          function getResourceIconClass(resource) {
            var result = "";
            if (resource) {
              result += resource.nodeType + " ";

              switch (resource.nodeType) {
                case CONST.resourceType.FOLDER:
                  result += "fa-folder-o";
                  break;
                case CONST.resourceType.TEMPLATE:
                  result += "fa-file-o";
                  break;
                case CONST.resourceType.INSTANCE:
                  result += "fa-tags";
                  break;
                case CONST.resourceType.ELEMENT:
                  result += "fa-file-text-o";
                  break;
                case CONST.resourceType.FIELD:
                  result += "fa-file-code-o";
                  break;
                  result += "fa-file-text-o";
                  break;

              }
            }
            return result;
          }

          function getResourceTypeClass(resource) {
            var result = '';
            if (resource) {
              switch (resource.nodeType) {
                case CONST.resourceType.FOLDER:
                  result += "folder";
                  break;
                case CONST.resourceType.TEMPLATE:
                  result += "template";
                  break;
                case CONST.resourceType.METADATA:
                  result += "metadata";
                  break;
                case CONST.resourceType.INSTANCE:
                  result += "metadata";
                  break;
                case CONST.resourceType.ELEMENT:
                  result += "element";
                  break;
                case CONST.resourceType.FIELD:
                  result += "field";
                  break;
              }

            }
            return result;
          }

          function isTemplate() {
            return (hasSelection() && (vm.selectedResource.nodeType == CONST.resourceType.TEMPLATE));
          }

          function isElement() {
            return (hasSelection() && (vm.selectedResource.nodeType == CONST.resourceType.ELEMENT));
          }

          function isFolder(resource) {
            var result = false;
            if (resource) {
              result = (resource.nodeType == CONST.resourceType.FOLDER);
            } else {
              result = (hasSelection() && (vm.selectedResource.nodeType == CONST.resourceType.FOLDER))
            }
            return result;
          }

          function isMeta() {
            return (hasSelection() && (vm.selectedResource.nodeType == CONST.resourceType.INSTANCE));
          }


          function goToFolder(folderId) {
              vm.selectedResource = null;
              vm.params.folderId = folderId;
              init();
          };

          function isResourceTypeActive(type) {
            return vm.resourceTypes[type];
          }

          function showOrHide(type) {
            return isResourceTypeActive(type) ? 'hide' : 'show';
          }

          function onDashboard() {
            return vm.mode == 'dashboard';
          }

          function filterShowing() {
            return vm.showFilters && onDashboard();
          }

          // TBD this blows up the current user, not sure why
          function resetFilters() {
            var updates = {};
            for (var nodeType in vm.resourceTypes) {
              vm.resourceTypes[nodeType] = true;
              var key = 'resourceTypeFilters.' + nodeType;
              updates[key] = true;
            }
            UISettingsService.saveUIPreferences(updates);
            init();
          }

          function infoShowing() {
            return vm.showResourceInfo && onDashboard();
          }

          function narrowContent() {
            return vm.showFilters || vm.showResourceInfo || !onDashboard();
          }

          function setResourceInfoVisibility(b) {
            vm.showResourceInfo = b;
            UISettingsService.saveUIPreference('infoPanel.opened', vm.showResourceInfo);
          }

          function setSortOptionUI(option) {
            vm.sortOptionLabel = $translate.instant('DASHBOARD.sort.' + option);
            vm.sortOptionField = option;
          }

          function setSortOption(option) {
            setSortOptionUI(option);
            UISettingsService.saveUIPreference('folderView.sortBy', vm.sortOptionField);
            init();
          }

          function toggleFavorites() {
            vm.showFavorites = !vm.showFavorites;
            updateFavorites();
          }

          // toggle the faceted filter panel and the various sections within it
          function toggleFilters(section) {
            if (!section) {
              vm.showFilters = !vm.showFilters;
            } else {
              if (vm.filterSections.hasOwnProperty(section)) {
                vm.filterSections[section] = !vm.filterSections[section];
              }
            }
          }

          function workspaceClass() {
            return 'col-sm-12'
          }


          function getArrowIcon(value) {
            return value ? 'fa-caret-left' : 'fa-caret-down';
          }

          function isFilterSection(section) {
            var result = false;
            if (!section) {
              result = vm.showFilters;
            } else {
              if (vm.filterSections.hasOwnProperty(section)) {
                result = vm.filterSections[section];
              }
            }
            return result;
          }

          function toggleResourceInfo() {
            vm.setResourceInfoVisibility(!vm.showResourceInfo);
          }

          function toggleResourceType(type) {
            vm.resourceTypes[type] = !vm.resourceTypes[type];
            UISettingsService.saveUIPreference('resourceTypeFilters.' + type, vm.resourceTypes[type]);
            init();
          }

          /**
           * Watch functions.
           */

          $scope.$on('$routeUpdate', function () {
            vm.params = $location.search();
            init();
          });

          $scope.$on('search', function (event, searchTerm) {
              vm.params.search = searchTerm;
              initSearch();
          });

          $scope.hideModal = function (id) {
            jQuery('#' + id).modal('hide');
          };

          function search  (searchTerm) {
            vm.searchTerm = searchTerm;
            $rootScope.$broadcast('search', vm.searchTerm || '');
          };


          /**
           * Private functions.
           */

          function activeResourceTypes() {
            var activeResourceTypes = [];
            angular.forEach(Object.keys(vm.resourceTypes), function (value, key) {
              if (vm.resourceTypes[value]) {

                  // just elements can be selected
                  if (value == 'element') {
                    activeResourceTypes.push(value);
                  }

              }
            });
            // always want to show folders
            activeResourceTypes.push('folder');
            return activeResourceTypes;
          }

          function resetSelected() {
            vm.selectedResource = null;
            vm.setResourceInfoVisibility(false);
          }

          function getSelection() {
            return vm.selectedResource;
          }

          function hasSelection() {
            return vm.selectedResource != null;
          }

          function sortField() {
            if (vm.sortOptionField == 'name') {
              return 'name';
            } else {
              return '-' + vm.sortOptionField;
            }
          }

          function sortName() {
            return (vm.sortOptionField == 'name') ? "" : 'invisible';
          };

          function sortCreated() {
            return (vm.sortOptionField == 'createdOnTS') ? "" : 'invisible';
          };

          function sortUpdated() {
            return (vm.sortOptionField == 'lastUpdatedOnTS') ? "" : 'invisible';
          };

          $scope.$on('$routeUpdate', function () {
            vm.params = $location.search();
            init();
          });


          function updateFavorites(saveData) {
            $timeout(function () {
              if (vm.showFavorites) {
                angular.element('#favorites').collapse('show');
                getForms();
              } else {
                angular.element('#favorites').collapse('hide');
              }
            });
            if (saveData == null || saveData) {
              UISettingsService.saveUIPreference('populateATemplate.opened', vm.showFavorites);
            }
          }

          function setResourceViewMode(mode) {
            vm.resourceViewMode = mode;
            UISettingsService.saveUIPreference('folderView.viewMode', mode);
          }

          function isResourceViewMode(mode) {
            return mode === vm.resourceViewMode;
          }


          // finder
          function showFinder() {
            jQuery("body").trigger("click");
            jQuery("#" + vm.finderModalId).modal("show");
          }

          function addElementFromFinder() {
            if (vm.finderResource) {
              addElementToElement(vm.finderResource);
            }
            hideFinder();
          }

          function pickElementFromFinder (resource) {
            vm.addElementToElement(resource);
            hideFinder();
          }

          function selectElementFromFinder  (resource) {
            vm.finderResource = resource;
          }

          function showSFinder() {
            vm.finderResource = null;
          }

          function hideFinder () {
            jQuery("#" + vm.finderModalId).modal('hide');
            vm.finderResource = null;
            vm.params.search = null;
            vm.params.folderId = null;
            vm.selectedResource = null;
            init();
          }

        }
      }

    }
);
