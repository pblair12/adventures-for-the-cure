angular.module('app').controller('memberEditCtrl', memberEditCtrl);
memberEditCtrl.$inject = ['$scope', '$route', '$location', 'notifierService', 'memberService', 'identityService'];
function memberEditCtrl($scope, $route, $location, notifierService, memberService, identityService) {
  $scope.identityService = identityService;
  $scope.memberToEdit = undefined;
  $scope.showImgTmp = false;

  memberService.getMember($route.current.params.id).then(function(member) {
    $scope.memberToEdit = member;
  });

  $scope.saveMember = function() {
    memberService.saveMember($scope.memberToEdit).then(function(member) {
      $scope.memberToEdit = member;
      if (identityService.currentUser._id === $scope.memberToEdit._id) {
        angular.extend(identityService.currentUser, $scope.memberToEdit);
      }
      notifierService.notify('Member has been updated');
      $location.path('/member-list');
    }, function(reason) {
      notifierService.error(reason);
    });
  };

  $scope.onFileSelect = function($files) {
    $scope.memberToEdit.imgTmp = $files[0];
    memberService.saveMemberTmpImg($scope.memberToEdit).then(function(member) {
      $scope.memberToEdit = member;
      $scope.memberToEdit.img = $files[0];
      $scope.showImgTmp = true;
    })
  };
}