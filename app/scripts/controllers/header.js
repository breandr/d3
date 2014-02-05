'use strict';

angular.module('d3App')
  .controller('HeaderCtrl', function ($scope, $location) {
    $scope.isActive = function (viewLocation) {
      return viewLocation === $location.path();
    };
  });