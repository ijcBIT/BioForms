'use strict';
var WorkspacePage = require('../pages/workspace-new-page.js');
var MetadataPage = require('../pages/metadata-page.js');
var TemplatePage = require('../pages/template-creator-page.js');
var ToastyPage = require('../pages/toasty-page.js');
var SweetAlertPage = require('../pages/sweet-alert-page.js');

var _ = require('../libs/lodash.min.js');
var sampleTitle;
var sampleDescription;
var sampleTemplateUrl;
var sampleMetadataUrl;
var pageName = 'template';

describe('workspace', function () {
  var EC = protractor.ExpectedConditions;
  var metadataPage;
  var workspacePage;
  var templatePage;
  var toastyPage;
  var sweetAlertPage;
  var firstTimeOnly = true;


  // before each test, load a new page and create a template
  // maximize the window area for clicking
  beforeEach(function () {

    workspacePage = WorkspacePage;
    metadataPage = MetadataPage;
    templatePage = TemplatePage;
    toastyPage = ToastyPage;
    sweetAlertPage = SweetAlertPage;
    browser.driver.manage().window().maximize();

    //TODO local needs sleep here, staging can handle sleep in the onPrepare
    if (firstTimeOnly) {
      browser.sleep(1000);
      firstTimeOnly = false;
    }

  });

  afterEach(function () {
  });

  it("should have a logo", function () {

    browser.wait(EC.presenceOf(workspacePage.createLogo()));

  });

  for (var j = 0; j < 1; j++) {
    (function () {

      // functioning trash and options buttons
      it("should create a folder", function () {

        sampleTitle = workspacePage.createTitle('folder');

        // create the folder
        workspacePage.createResource('folder', sampleTitle);
        toastyPage.isSuccess();

      });

      // functioning trash and options buttons
      it("should have trash and options buttons hidden, search, breadcrumbs, and create buttons visible", function () {

        browser.wait(EC.invisibilityOf(workspacePage.createTrashButton()));
        browser.wait(EC.invisibilityOf(workspacePage.createMoreOptionsButton()));

        browser.wait(EC.visibilityOf(workspacePage.createSearchNav()));
        workspacePage.createSearchNavInput().getText().then(function (value) {
          expect(value).toBe('');
        });

        browser.wait(EC.visibilityOf(workspacePage.createBreadcrumb()));
        browser.wait(EC.visibilityOf(workspacePage.createButton()));

      });

      it("should open the folder in the bread crumb", function () {

        workspacePage.clickBreadcrumb(1);
        workspacePage.clickLogo();

      });

      // functioning trash and options buttons
      it("should have trash and options button visible if folder is selected", function () {

        browser.wait(EC.elementToBeClickable(workspacePage.createFirstFolder()));
        workspacePage.createFirstFolder().click();

        expect(workspacePage.createTrashButton().isPresent()).toBe(true);
        expect(workspacePage.createMoreOptionsButton().isPresent()).toBe(true);

      });

      it("should delete the sample folder", function () {

        workspacePage.deleteResource(sampleTitle, 'folder');
        sweetAlertPage.confirm();
        toastyPage.isSuccess();

      });
    })
    (j);
  }

});


