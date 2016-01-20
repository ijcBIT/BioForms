'use strict';

var TemplateElementService = function ($http, UrlService) {

  var service = {
    serviceId: "TemplateElementService"
  };

  service.getDefaultTemplateElementsSummary = function () {
    return $http.get(UrlService.getDefaultTemplateElementsSummary(3, 0));
  };

  service.getAllTemplateElementsSummary = function () {
    return $http.get(UrlService.getAllTemplateElementsSummary());
  };

  service.getTemplateElement = function (id) {
    return $http.get(UrlService.getTemplateElement(id));
  };

  service.deleteTemplateElement = function (id) {
    return $http.delete(UrlService.getTemplateElement(id));
  };

  service.saveTemplateElement = function (element) {
    return $http.post(UrlService.templateElements(), angular.toJson(element));
  };

  service.updateTemplateElement = function (id, element) {
    return $http.put(UrlService.getTemplateElement(id), angular.toJson(element));
  };

  return service;

};

TemplateElementService.$inject = ["$http", "UrlService"];
angularApp.service('TemplateElementService', TemplateElementService);