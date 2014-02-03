'use strict';

angular.module('d3App')
.controller('MainCtrl', function ($scope, $location) {
	//$scope.$route = $location;
	$scope.isActive = function(route){
		return route === $location.path();
	};
});
