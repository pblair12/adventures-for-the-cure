angular.module('app').controller('memberListCtrl', memberListCtrl);
memberListCtrl.$inject = ['$scope', '$location', '$modal', 'memberService', 'identityService'];
function memberListCtrl($scope, $location, $modal, memberService, identityService) {
  $scope.identity = identityService;

  getMembers();

  function getMembers() {
    memberService.getMembersAsAdmin().then(function (members) {
      $scope.members = members;
    });
  }

  $scope.editMember = function(member) {
    $location.path('/member-edit/' + member._id);
  };

  $scope.deleteMember = function(member) {
    var modalInstance = $modal.open({
      templateUrl: '/partials/memberList/confirm-delete-member-modal',
      controller: confirmDeleteMemberCtrl,
      resolve: {
        member: function () {
          return member;
        }
      }
    });
    modalInstance.result.then(function() {
      getMembers();
    });
  };
}

function confirmDeleteMemberCtrl($scope, $modalInstance, memberService, notifierService, member) {
  $scope.member = member;
  $scope.confirm = function () {
    memberService.deleteMember(member).then(function() {
      notifierService.notify('Member ' + member.username + ' has been deleted');
    }, function(reason) {
      notifierService.error(reason);
    });
    $modalInstance.close();
  };

  $scope.cancel = function () {
    $modalInstance.dismiss();
  };
}