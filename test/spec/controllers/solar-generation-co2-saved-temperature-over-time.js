'use strict';

describe('Controller: SolarGenerationCo2SavedTemperatureOverTimeCtrl', function () {

  // load the controller's module
  beforeEach(module('d3App'));

  var SolarGenerationCo2SavedTemperatureOverTimeCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    SolarGenerationCo2SavedTemperatureOverTimeCtrl = $controller('SolarGenerationCo2SavedTemperatureOverTimeCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
