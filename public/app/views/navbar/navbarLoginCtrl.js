angular.module('app').controller('navbarLoginCtrl', function($scope, $location, identityService, notifierService, authorizationService) {
  $scope.identityService = identityService;

  $scope.signout = function() {
    authorizationService.logoutUser().then(function() {
      $scope.username = "";
      $scope.password = "";
      notifierService.notify('You have successfully signed out!');
      $location.path('/');
    })
  }

  $scope.isActive = function (viewLocation) {
    return viewLocation === $location.path();
  };
});
