angular.module('app').controller('membersCtrl', function($scope, $sce, memberService) {
  $scope.selectedMember = undefined;
  $scope.selectedMemberHtml = "";
  memberService.getMembers().then(function(members) {
    $scope.allMembers = members;
    $scope.membersColumn1 = members.slice(0, (members.length / 2));
    $scope.membersColumn2 = members.slice((members.length / 2), members.length);
    for (var i = 0; i < members.length; i++) {
      if (members[i].name === "Adam Driscoll") {
        $scope.selectMember(members[i]);
      }
    }
  })

  $scope.selectMember = function(member) {
    $scope.selectedMember = member;
    memberService.getMember(member.name).then(function(memberHtml) {
      // use $sce.trustAsHtml to tell angular that the html received is 'safe' to display
      $scope.selectedMemberHtml = $sce.trustAsHtml(memberHtml);
    })
  }
});
