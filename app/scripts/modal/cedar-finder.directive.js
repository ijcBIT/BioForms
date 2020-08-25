'use strict';

define([
      'angular',
      'cedar/template-editor/service/cedar-user'
    ], function (angular) {
      angular.module('cedar.templateEditor.modal.cedarFinderDirective', [
        'cedar.templateEditor.service.cedarUser'
      ]).directive('cedarFinder', cedarFinderDirective);

      cedarFinderDirective.$inject = ['CedarUser'];

      function cedarFinderDirective(CedarUser) {

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
          'DataManipulationService',
          'QueryParamUtilsService',
          'FrontendUrlService',
          'CategoryService',
          'schemaService',
          'CONST',
          '$sce'
        ];

        function cedarFinderController($location, $timeout, $scope, $rootScope, $translate, CedarUser, resourceService,
                                       UIMessageService, UISettingsService,DataManipulationService,
                                       QueryParamUtilsService, FrontendUrlService, CategoryService, schemaService, CONST, $sce) {

          var vm = this;
          vm.id = 'finder-modal';

          vm.currentPath = "";
          vm.currentFolderId = "";
          vm.offset = 0;
          vm.totalCount = -1;

          vm.isSearching = false;
          vm.pathInfo = [];
          vm.selectedPathInfo = [];

          vm.params = {};
          vm.params.folderId = QueryParamUtilsService.getFolderId();
          vm.params.search = $location.search().search;

          vm.resources = [];
          vm.selectedResource = null;

          // Categories
          vm.categoryTreeAvailable = false;
          vm.categoryTreeEnabled = true;
          vm.categoryTree;
          vm.loadingCategoryTree = false;

          vm.breadcrumbTitle = null;

          /*
           * public functions
           */

          vm.breadcrumbName = breadcrumbName;
          vm.hasSelection = hasSelection;
          vm.getSelection = getSelection;
          vm.doSearch = doSearch;

          vm.getResourceIconClass = getResourceIconClass;
          vm.getResourceTypeClass = getResourceTypeClass;
          vm.canBeVersioned = canBeVersioned;
          vm.goToResource = goToResource;
          vm.goToFolder = goToFolder;
          vm.isResourceTypeActive = isResourceTypeActive;
          vm.goToMyWorkspace = goToMyWorkspace;
          vm.goToSharedWithMe = goToSharedWithMe;
          vm.goToSharedWithEverybody = goToSharedWithEverybody;
          vm.goToSpecialFolders = goToSpecialFolders;

          vm.isHomeMode = isHomeMode;
          vm.isSharedWithMeMode = isSharedWithMeMode;
          vm.isSharedWithEverybodyMode = isSharedWithEverybodyMode;
          vm.isSpecialFoldersMode = isSpecialFoldersMode;
          vm.isSearchMode = isSearchMode;
          vm.isCategorySearchMode = isCategorySearchMode;

          vm.setSortByName = setSortByName;
          vm.setSortByCreated = setSortByCreated;
          vm.setSortByUpdated = setSortByUpdated;
          vm.sortName = sortName;
          vm.sortCreated = sortCreated;
          vm.sortUpdated = sortUpdated;

          vm.isGridView = isGridView;
          vm.isListView = isListView;
          vm.toggleView = toggleView;

          vm.getId = getId;
          vm.isOverflow = isOverflow;

          vm.isTemplate = isTemplate;
          vm.isElement = isElement;
          vm.isFolder = isFolder;
          vm.isMeta = isMeta;

          vm.search = search;
          vm.categorySearch = categorySearch;
          vm.openResource = openResource;

          vm.hasFolders = hasFolders;
          vm.getFolders = getFolders;
          vm.hasElementsOrFields = hasElementsOrFields;
          vm.getElementsAndFields = getElementsAndFields;
          vm.resourceListIsEmpty =  resourceListIsEmpty;

          vm.selectResource = selectResource;
          vm.isResourceSelected = isResourceSelected;
          vm.getResourceDetails = getResourceDetails;
          vm.loadMore = loadMore;
          vm.searchMore = searchMore;

          vm.canRead = canRead;
          vm.canWrite = canWrite;
          vm.canChangeOwner = canChangeOwner;
          vm.getResourceVersion = getResourceVersion;
          vm.isPublished = isPublished;
          vm.buildBreadcrumbTitle = buildBreadcrumbTitle;
          vm.getTitle = getTitle;
          vm.linkFolder = linkFolder;
          vm.getResourceTypeClass = getResourceTypeClass;


          //*********** ENTRY POINT


          init();
          initCategories();

          function init() {
            vm.resourceTypes = {
              element : true,
              field   : true,
              instance: false,
              template: false
            };
            vm.isSearching = false;
            vm.searchTerm = null;
            if (vm.params.search) {
              vm.isSearching = true;
              doSearch(vm.params.search);
            } else if (vm.params.folderId) {
              getFolderContentsById(decodeURIComponent(vm.params.folderId));
            } else {
              goToFolder(CedarUser.getHomeFolderId());
            }
          };

          function initSearch() {
            if (vm.params.search) {
              vm.isSearching = true;
              doSearch(vm.params.search);
            } else {
              vm.isSearching = false;
              if (vm.params.folderId) {
                goToFolder(vm.params.folderId);
              } else {
                goToFolder(CedarUser.getHomeFolderId());
              }
            }
          };

          function breadcrumbName(folderName) {
            if (folderName == '/') {
              return 'All';
            }
            return folderName;
          };

          function buildBreadcrumbTitle(searchTerm) {
            console.log(searchTerm, vm.nodeListQueryType);
            if (isSharedWithMeMode()) {
              return $translate.instant("BreadcrumbTitle.sharedWithMe");
            } else if (isSharedWithEverybodyMode()) {
              return $translate.instant("BreadcrumbTitle.sharedWithEverybody");
            } else if (isSpecialFoldersMode()) {
              return $translate.instant("BreadcrumbTitle.specialFolders");
            } else if (isFolderContentMode()) {
              return $translate.instant("BreadcrumbTitle.viewAll");
            } else if (isSearchMode()) {
              console.log('is search mode');
              return $translate.instant("BreadcrumbTitle.searchResult", {searchTerm: searchTerm});
            } else if (vm.nodeListQueryType == 'search-category-id') {
              return $translate.instant("BreadcrumbTitle.categorySearchResult", {searchTerm: searchTerm});
            } else {
              return "";
            }
          };

          function isHomeMode() {
            return (vm.nodeListQueryType === 'folder-content');
          };

          function isSharedWithMeMode() {
            return (vm.nodeListQueryType === 'view-shared-with-me');
          };

          function isSharedWithEverybodyMode() {
            return (vm.nodeListQueryType === 'view-shared-with-everybody');
          };

          function isSpecialFoldersMode() {
            return (vm.nodeListQueryType === 'view-special-folders');
          };

          function isFolderContentMode() {
            return (vm.nodeListQueryType == 'folder-content');
          };

          function isSearchMode() {
            return (vm.nodeListQueryType === 'search-term');
          };

          function isCategorySearchMode() {
            return (vm.nodeListQueryType == 'search-category-id');
          };

          function doSearch(term) {
            let resourceTypes = activeResourceTypes();
            let limit = UISettingsService.getRequestLimit();
            // vm.offset = 0;
            // let offset = vm.offset;
            let offset = 0;
            resourceService.searchResources(
                term,
                {
                  resourceTypes    : resourceTypes,
                  sort             : sortField(),
                  limit            : limit,
                  offset           : offset,
                  version          : getFilterVersion(),
                  publicationStatus: getFilterStatus()
                },
                function (response) {
                  vm.searchTerm = term;
                  vm.isSearching = true;
                  vm.resources = response.resources;
                  vm.nodeListQueryType = response.nodeListQueryType;
                  vm.breadcrumbTitle = vm.buildBreadcrumbTitle(term);
                  vm.selectedResource = null;
                  vm.totalCount = response.totalCount;
                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.SEARCH.error', error);
                }
            );
          };

          function doSharedWithMe() {

            vm.offset = 0;
            vm.nextOffset = null;
            vm.totalCount = -1;
            let offset = vm.offset;

            resourceService.sharedWithMeResources(
                {
                  resourceTypes    : activeResourceTypes(),
                  sort             : sortField(),
                  limit            : vm.requestLimit,
                  offset           : vm.offset,
                  version          : getFilterVersion(),
                  publicationStatus: getFilterStatus()
                },
                function (response) {
                  vm.isSearching = true;
                  vm.resources = response.resources;
                  console.log(vm.resources)
                  vm.nodeListQueryType = response.nodeListQueryType;
                  vm.breadcrumbTitle = vm.buildBreadcrumbTitle();
                  vm.nextOffset = getNextOffset(response.paging.next);
                  vm.totalCount = response.totalCount;
                  vm.loading = false;

                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.SEARCH.error', error);
                }
            );
          };


          function doSharedWithEverybody() {

            vm.offset = 0;
            vm.nextOffset = null;
            vm.totalCount = -1;
            let offset = vm.offset;

            resourceService.sharedWithEverybodyResources(
                {
                  resourceTypes    : activeResourceTypes(),
                  sort             : sortField(),
                  limit            : vm.requestLimit,
                  offset           : vm.offset,
                  version          : getFilterVersion(),
                  publicationStatus: getFilterStatus()
                },
                function (response) {
                  vm.isSearching = true;
                  vm.resources = response.resources;
                  console.log(vm.resources);
                  vm.nodeListQueryType = response.nodeListQueryType;
                  vm.breadcrumbTitle = vm.buildBreadcrumbTitle();

                  vm.nextOffset = getNextOffset(response.paging.next);
                  vm.totalCount = response.totalCount;
                  vm.loading = false;
                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.SEARCH.error', error);
                }
            );
          }

          function doSpecialFolders() {

            vm.offset = 0;
            vm.nextOffset = null;
            vm.totalCount = -1;
            let offset = vm.offset;

            resourceService.specialFolders(
                {
                  resourceTypes    : activeResourceTypes(),
                  sort             : sortField(),
                  limit            : vm.requestLimit,
                  offset           : vm.offset,
                  version          : getFilterVersion(),
                  publicationStatus: getFilterStatus()
                },
                function (response) {
                  vm.isSearching = true;
                  vm.resources = response.resources;
                  vm.nodeListQueryType = response.nodeListQueryType;
                  vm.breadcrumbTitle = vm.buildBreadcrumbTitle();

                  vm.nextOffset = getNextOffset(response.paging.next);
                  vm.totalCount = response.totalCount;
                  vm.loading = false;

                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.SEARCH.error', error);
                }
            );
          };

          function getNextOffset(next) {
            let result = null;
            if (next) {
              result = [];
              next.split("&").forEach(function(part) {
                let item = part.split("=");
                result[item[0]] = decodeURIComponent(item[1]);
              });
              result = parseInt(result['offset']);
            }
            return result;
          };

          function openResource(resource) {
            var r = resource;
            if (!r && vm.selectedResource) {
              r = vm.selectedResource;
            }

            vm.params.search = null;

            if (r.resourceType == 'folder') {
              goToFolder(r['@id']);
            } else {
              if (typeof vm.pickResourceCallback === 'function') {
                vm.pickResourceCallback(r);
              }

              $scope.hideModal(vm.id);
            }
          }

          function goToResource(resource) {
            var r = resource;
            if (!r && vm.selectedResource) {
              r = vm.selectedResource;
            }

            vm.params.search = null;

            if (r.resourceType == 'folder') {
              goToFolder(r['@id']);
            } else {
              if (typeof vm.pickResourceCallback === 'function') {
                vm.pickResourceCallback(r);
              }
            }
          }

          function getFolderContentsById(folderId) {
            var resourceTypes = activeResourceTypes();
            vm.offset = 0;
            var offset = vm.offset;
            var limit = UISettingsService.getRequestLimit();

            if (resourceTypes.length > 0) {
              return resourceService.getResources(
                  {
                    folderId         : folderId,
                    resourceTypes    : resourceTypes,
                    sort             : sortField(),
                    limit            : limit,
                    offset           : offset,
                    version          : getFilterVersion(),
                    publicationStatus: getFilterStatus()
                  },
                  function (response) {
                    vm.currentFolderId = folderId;
                    vm.resources = response.resources;
                    vm.nodeListQueryType = response.nodeListQueryType;
                    vm.pathInfo = response.pathInfo;
                    vm.currentPath = vm.pathInfo.pop();
                    vm.totalCount = response.totalCount;
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
            var result = '';
            if (resource) {

              switch (resource.resourceType) {
                case CONST.resourceType.FOLDER:
                  result += "fa-folder";
                  break;
                case CONST.resourceType.TEMPLATE:
                  result += " fa-file-text";
                  break;
                case CONST.resourceType.INSTANCE:
                  result += "fa-tag";
                  break;
                case CONST.resourceType.ELEMENT:
                  result += "fa-cubes";
                  break;
                case CONST.resourceType.FIELD:
                  result += "fa-cube";
                  break;
              }
              result += ' ' + resource.resourceType;
            }
            return result;
          }

          function getResourceTypeClass(resource) {
            var result = '';
            if (resource) {
              switch (resource.resourceType) {
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

          function canBeVersioned(resource) {
            if (resource) {
              switch (resource.resourceType) {
                case CONST.resourceType.TEMPLATE:
                  return true;
                case CONST.resourceType.ELEMENT:
                  return true;
              }
            }
            return false;
          }

          function isTemplate() {
            return (hasSelection() && (vm.selectedResource.resourceType == CONST.resourceType.TEMPLATE));
          }

          function isElement() {
            return (hasSelection() && (vm.selectedResource.resourceType == CONST.resourceType.ELEMENT));
          }

          function isFolder(resource) {
            var result = false;
            if (resource) {
              result = (resource.resourceType == CONST.resourceType.FOLDER);
            } else {
              result = (hasSelection() && (vm.selectedResource.resourceType == CONST.resourceType.FOLDER))
            }
            return result;
          }

          function isMeta() {
            return (hasSelection() && (vm.selectedResource.resourceType == CONST.resourceType.INSTANCE));
          }

          function goToFolder(folderId) {
            vm.params.search = null;
            vm.selectedResource = null;
            vm.params.folderId = folderId;

            if (vm.params.folderId) {
              getFolderContentsById(decodeURIComponent(vm.params.folderId));
            }
          }

          function isResourceTypeActive(type) {
            return vm.resourceTypes[type];
          }

          function selectResource(resource) {

            if (vm.selectedResource == null || vm.selectedResource['@id'] != resource['@id']) {
              vm.getResourceDetails(resource);
            }
            if (typeof vm.selectResourceCallback === 'function') {
              vm.selectResourceCallback(resource);
            }
          };

          function isResourceSelected(resource) {
            if (resource == null || vm.selectedResource == null) {
              return false;
            } else {
              return vm.selectedResource['@id'] == resource['@id'];
            }
          };

          function getResourceDetails(resource) {
            if (!resource && vm.hasSelection()) {
              resource = vm.getSelection();
            }
            var id = resource['@id'];
            resourceService.getResourceReport(
                resource,
                function (response) {
                  vm.selectedResource = response;

                  // TODO get path info for this resource
                  //getPathInfo(response.parentFolderId);

                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.' + resource.resourceType.toUpperCase() + '.load.error',
                      error);
                }
            );
          };

          function canRead() {
            return resourceService.canRead(vm.selectedResource);
          };

          function canWrite() {
            return resourceService.canWrite(vm.selectedResource);
          };

          function canChangeOwner() {
            return resourceService.canChangeOwner(vm.selectedResource);
          };

          function isPublished(resource) {
            let r = resource || vm.selectedResource;
            return (r[CONST.publication.STATUS] == CONST.publication.PUBLISHED);
          };

          function getResourceVersion(resource) {
            let r = resource || vm.selectedResource;
            let resourceId = schemaService.getId(r);
            if (r.versions) {
              for (let i = 0; i < r.versions.length; i++) {
                if (resourceId === r.versions[i]['@id']) {
                  return r.versions[i]['pav:version'];
                }
              }
            }
          };

          function getTitle(node) {
            if (node) {
              return DataManipulationService.getTitle(node);
            }
          };

          function linkFolder(node) {
            return node['activeUserCanRead']
          };

          function getResourceTypeClass(resource) {
            var result = '';
            if (resource) {
              switch (resource.resourceType) {
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

          // callback to load more resources for the current folder or search
          function loadMore() {

            if (vm.isSearching) {
              vm.searchMore();
            } else {

              let limit = UISettingsService.getRequestLimit();
              vm.offset += limit;
              let offset = vm.offset;
              let folderId = vm.currentFolderId;
              let resourceTypes = activeResourceTypes();

              // are there more?
              if (offset < vm.totalCount) {

                if (resourceTypes.length > 0) {
                  return resourceService.getResources(
                      {
                        folderId         : folderId,
                        resourceTypes    : resourceTypes,
                        sort             : sortField(),
                        limit            : limit,
                        offset           : offset,
                        version          : getFilterVersion(),
                        publicationStatus: getFilterStatus()
                      },
                      function (response) {
                        vm.resources = vm.resources.concat(response.resources);
                      },
                      function (error) {
                        UIMessageService.showBackendError('SERVER.FOLDER.load.error', error);
                      }
                  );
                } else {
                  vm.resources = [];
                }
              }
            }
          };

          function resourceListIsEmpty() {
            return vm.totalCount === 0;
          };

          // callback to load more resources for the current folder
          function searchMore() {

            var limit = UISettingsService.getRequestLimit();
            //vm.offset += limit;
            var offset = vm.offset;
            offset += limit;
            var term = vm.searchTerm;
            var resourceTypes = activeResourceTypes();

            // Temporary fix to load more results if the totalCount can't be computed by the backend
            if (vm.totalCount == -1) {
              // Search for more results
              vm.totalCount = Number.MAX_VALUE;
            } else if (vm.totalCount == 0) {
              // No more results available. Stop searching
              vm.totalCount = -2;
            }

            // are there more?
            if (offset < vm.totalCount) {
              return resourceService.searchResources(term,
                  {
                    resourceTypes    : resourceTypes,
                    sort             : sortField(),
                    limit            : limit,
                    offset           : offset,
                    ersion           : getFilterVersion(),
                    publicationStatus: getFilterStatus()
                  },
                  function (response) {
                    vm.resources = vm.resources.concat(response.resources);
                    vm.totalCount = response.totalCount;
                    vm.offset = offset;
                  },
                  function (error) {
                    UIMessageService.showBackendError('SERVER.SEARCH.error', error);
                  }
              );
            }
          };

          /**
           * Watch functions.
           */

          $scope.$on('search-finder', function (event, searchTerm) {
            vm.params.search = searchTerm;
            initSearch();
          });

          $scope.hideModal = function (id) {
            jQuery('#' + id).modal('hide');
          };

          function search(searchTerm) {
            vm.searchTerm = searchTerm;
            $rootScope.$broadcast('search-finder', vm.searchTerm || '');
          };

          // modal open
          $scope.$on('finderModalVisible', function (event, params) {
            vm.modalVisible = true;
            vm.finderResource = null;
            vm.params.search = null;
            vm.params.folderId = null;
            vm.selectedResource = null;
          });


          /**
           * Private functions.
           */

          function activeResourceTypes() {
            let activeResourceTypes = ['element', 'field', 'folder'];
            return activeResourceTypes;
          }

          function resetSelected() {
            vm.selectedResource = null;
          }

          function getSelection() {
            return vm.selectedResource;
          }

          function hasSelection() {
            return vm.selectedResource != null;
          }

          function sortField() {
            return (CedarUser.isSortByName() ? '' : '-') + CedarUser.getSort();
          }

          function setSortByCreated() {
            UISettingsService.saveSort(CedarUser.setSortByCreated());
            init();
          }

          function setSortByName() {
            UISettingsService.saveSort(CedarUser.setSortByName());
            init();
          }

          function setSortByUpdated() {
            UISettingsService.saveSort(CedarUser.setSortByUpdated());
            init();
          }

          function sortName() {
            return CedarUser.isSortByName() ? "" : 'invisible';
          }

          function sortCreated() {
            return CedarUser.isSortByCreated() ? "" : 'invisible';
          }

          function sortUpdated() {
            return CedarUser.isSortByUpdated() ? "" : 'invisible';
          }

          function isGridView() {
            return CedarUser.isGridView();
          }

          function isListView() {
            return CedarUser.isListView();
          }

          function getFilterVersion() {
            return CedarUser.getVersion();
          };

          function getFilterStatus() {
            return CedarUser.getStatus();
          };

          function toggleView() {
            UISettingsService.saveView(CedarUser.toggleView());
          };

          function getId(node, label) {
            if (node) {
              let id = schemaService.getId(node);
              return id.substr(id.lastIndexOf('/') + 1) + label;
            }
          };

          function isOverflow(node, label) {
            let id = '#' + vm.getId(node, label);
            let elm = jQuery(id);
            return (elm[0].offsetWidth < elm[0].scrollWidth);
          };

          function getFolders() {
            var result = [];

            if (vm.resources) {
              var result = vm.resources.filter(function (obj) {
                return obj.resourceType == CONST.resourceType.FOLDER;
              });
            }
            return result;
          }

          function hasFolders() {
            return getFolders().length > 0;
          }

          function getElements() {
            var result = [];

            if (vm.resources) {
              var result = vm.resources.filter(function (obj) {
                return obj.resourceType == CONST.resourceType.ELEMENT;
              });
            }
            return result;
          }

          function hasElementsOrFields() {
            return getElementsAndFields().length > 0;
          }

          function getElementsAndFields() {
            var result = [];

            if (vm.resources) {
              var result = vm.resources.filter(function (obj) {
                return obj.resourceType == CONST.resourceType.FIELD || obj.resourceType == CONST.resourceType.ELEMENT;
              });
            }
            return result;
          }

          function hasFields() {
            return getFields().length > 0;
          };


          /**
           * Category-related functions
           */
          function initCategories() {
            if (!doShowCategoryTree()) {
              return;
            }
            CategoryService.initCategories(
                function (response) {
                  vm.categoryTreeAvailable = true;
                  vm.categoryTree = response;
                },
                function (error) {
                  UIMessageService.showBackendError('CATEGORYSERVICE.errorReadingCategoryTree', error);
                  //vm.loading = false;
                });
          };

          function doShowCategoryTree() {
            return vm.categoryTreeEnabled;
          };

          function categorySearch(categoryId) {
            doCategorySearch(categoryId);
          };

          function doCategorySearch(categoryId) {
            console.log('doing category search');
            let offset = vm.offset;
            //vm.nextOffset = null;
            vm.totalCount = -1;
            vm.loading = true;

            resourceService.categorySearchResources(
                categoryId,
                {
                  resourceTypes    : activeResourceTypes(),
                  sort             : sortField(),
                  limit            : vm.requestLimit,
                  offset           : vm.offset,
                  version          : getFilterVersion(),
                  publicationStatus: getFilterStatus()
                },
                function (response) {

                  vm.categoryId = categoryId;
                  vm.isSearching = true;
                  vm.resources = response.resources;
                  vm.nextOffset = getNextOffset(response.paging.next);
                  vm.totalCount = response.totalCount;
                  vm.loading = false;

                  vm.nodeListQueryType = response.nodeListQueryType;
                  var title = '';
                  var separator = '';
                  for (var ti in response.categoryPath) {
                    if (ti > 0) {
                      var name = response.categoryPath[ti]['schema:name']
                      title += separator + name;
                      separator = ' &raquo; ';
                    }
                  }
                  vm.breadcrumbTitle = $sce.trustAsHtml(vm.buildBreadcrumbTitle(title));
                  //UIProgressService.complete();
                },
                function (error) {
                  UIMessageService.showBackendError('SERVER.CATEGORYSEARCH.error', error);
                  vm.loading = false;
                }
            );
          };

          /**
           * Quick access links
           */

          function goToMyWorkspace() {
            vm.isSearching = false;
            goToFolder(CedarUser.getHomeFolderId());
          }

          function goToSharedWithMe() {
            doSharedWithMe();
          };

          function goToSharedWithEverybody() {
            doSharedWithEverybody();
          };

          function goToSpecialFolders() {
            doSpecialFolders();
          };

        }

        let directive = {
          bindToController: {
            modalVisible          : '=',
            selectResourceCallback: '=',
            pickResourceCallback  : '='
          },
          controller      : cedarFinderController,
          controllerAs    : 'finder',
          restrict        : 'E',
          templateUrl     : 'scripts/modal/cedar-finder.directive.html'
        };

        return directive;

      }
    }
);
