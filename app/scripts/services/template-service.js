'use strict';

var TemplateService = function ($http, UrlService) {

  var service = {
    serviceId: "TemplateService"
  };

  service.getDefaultTemplatesSummary = function () {
    return $http.get(UrlService.getDefaultTemplatesSummary(3, 0)).then(function (response) {
      return response.data;
    }).catch(function (err) {
      console.log(err);
    });
  };

  service.getAllTemplatesSummary = function() {
    return $http.get(UrlService.getAllTemplatesSummary()).then(function (response) {
      return response.data;
    }).catch(function (err) {
      console.log(err);
    });
  };

  service.getTemplate = function (id) {
    return $http.get(UrlService.getTemplate(id)).then(function (response) {
      return response.data;
    }).catch(function (err) {
      console.log(err);
    });
  };

  service.removeTemplate = function (id) {
    return $http.delete(UrlService.getTemplate(id));
  };

  service.saveTemplate = function (template) {
    return $http.post(UrlService.templates(), angular.toJson(template));
  };

  service.updateTemplate = function (id, template) {
    return $http.put(UrlService.getTemplate(id), angular.toJson(template));
  };

  return service;

};

TemplateService.$inject = ["$http", "UrlService"];
angularApp.service('TemplateService', TemplateService);