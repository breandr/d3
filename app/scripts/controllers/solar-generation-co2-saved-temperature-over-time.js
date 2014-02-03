'use strict';

angular.module('d3App')
.controller('SolarGenerationCo2SavedTemperatureOverTimeCtrl', function ($scope, $location) {
	$scope.isActive = function(route){
		return route === $location.path();
	};
});
