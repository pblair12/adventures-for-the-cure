angular.module('app', ['ngResource', 'ngRoute', 'ui.bootstrap', 'angularFileUpload']);

angular.module('app').config(function($routeProvider, $locationProvider) {
  var routeRoleChecks = {
    admin: { auth: function(authorizationService) {
      return authorizationService.authorizeAuthorizedMemberForRoute('admin');
    }},
    board: { auth: function(authorizationService) {
      return authorizationService.authorizeAuthorizedMemberForRoute('board');
    }},
    inventory: { auth: function(authorizationService) {
      return authorizationService.authorizeAuthorizedMemberForRoute('inventory');
    }},
    member: { auth: function($route, authorizationService) {
      return authorizationService.authorizeAuthorizedMemberForRoute();
    }}
  };

  $locationProvider.html5Mode(true);

  // configure the available routes
  $routeProvider
    .when('/', { redirectTo: '/home'
    })
    .when('/home', { templateUrl: '/partials/home/home'
    })
    .when('/donate', { templateUrl: '/partials/donate/donate'
    })
    .when('/events', { templateUrl: '/partials/events/events'
    })
    .when('/rides', { templateUrl: '/partials/rides/rides'
    })
    .when('/members', { templateUrl: '/partials/members/members'
    })
    .when('/results', { templateUrl: '/partials/results/results'
    })
    .when('/campaigns', { templateUrl: '/partials/campaigns/campaigns'
    })
    .when('/inventory', { templateUrl: '/partials/inventory/inventory'
    })
    .when('/inventory_old', { templateUrl: '/partials/inventory/inventory_old.html'
    })
    .when('/contact', { templateUrl: '/partials/contact/contact'
    })
    .when('/join', { templateUrl: '/partials/join/join'
    })
    .when('/login', { templateUrl: '/partials/login/login',
      controller: 'loginCtrl'
    })
    .when('/member-edit/:id', { templateUrl: '/partials/memberEdit/member-edit',
      resolve: routeRoleChecks.member
    })
    .when('/member-list', { templateUrl: '/partials/memberList/member-list',
      resolve: routeRoleChecks.admin
    })
    .when('/member-create', { templateUrl: '/partials/memberCreate/member-create',
      resolve: routeRoleChecks.admin
    })
    .when('/volunteer-event-create', { templateUrl: '/partials/volunteerEventCreate/volunteer-event-create',
      resolve: routeRoleChecks.board
    })
    .when('/volunteer-event-edit/:id', { templateUrl: '/partials/volunteerEventEdit/volunteer-event-edit',
      resolve: routeRoleChecks.board
    })
    .when('/volunteer-event-list', { templateUrl: '/partials/volunteerEventList/volunteer-event-list',
      resolve: routeRoleChecks.board
    })
    .when('/member-only', { templateUrl: '/partials/memberOnly/member-only',
      resolve: routeRoleChecks.member
    })
    .otherwise({
      templateUrl: '/partials/invalidPage/invalidPage'
    });
});

/**
 * If any route is attempted that the user is not authorized for then send
 * the user back to the home page
 */
angular.module('app').run(function($rootScope, $location, notifierService) {
  $rootScope.$on('$routeChangeError', function(evt, current, previous, rejection) {
    if (rejection === 'not authorized') {
      notifierService.error('You are not authorized to view this page.');
    }
  });
});
angular.module('app').factory('authorizationService',
  ['$http', '$q', 'identityService', 'Member', authorizationService]);
function authorizationService($http, $q, identityService, Member) {
  return {
    authenticateMember: function(username, password) {
      var deferred = $q.defer();
      $http.post('/login', {username: username, password: password}).then(function(response) {
        if (response.data.success) {
          var member = new Member();
          angular.extend(member, response.data.member);
          identityService.currentMember = member;
          deferred.resolve(true);
        } else {
          deferred.resolve(false);
        }
      } );
      return deferred.promise;
    },

    logoutMember: function() {
      var deferred = $q.defer();
      $http.post('/logout', {logout:true}).then(function() {
        identityService.currentMember = undefined;
        deferred.resolve();
      });
      return deferred.promise;
    },

    authorizeAuthorizedMemberForRoute: function(role) {
      if (!role && identityService.isAuthenticated()) {
        return true;
      } else if (identityService.isAuthorized(role)) {
        return true;
      } else {
        return $q.reject('not authorized');
      }
    },

    authorizeAuthenticatedMemberForRoute: function($route) {
      if (identityService.isAuthenticated() &&
        ($route.current.params.id === identityService.currentMember._id ||
          identityService.isAuthorized('admin'))) {
        return true;
      } else {
        return $q.reject('not authorized');
      }
    },

    createMember: function(newMemberData) {
      var newMember = new Member(newMemberData);
      var deferred = $q.defer();

      newMember.$save().then(function() {
        identityService.currentMember = newMember;
        deferred.resolve();
      }, function(response) {
        deferred.reject(response.data.reason);
      });

      return deferred.promise;
    }
  };
}
angular.module('app').factory('campaignService', ['$q', '$http', campaignService]);
function campaignService($q, $http, Campaign) {
  return {
    getCampaigns: function() {
      var dfd = $q.defer();
      $http.get('/api/campaigns/')
        .success(function(data, status, headers, config) {
          dfd.resolve(data);
        })
        .error(function(error, status, headers, config) {
          dfd.reject(error.reason);
        });
      return dfd.promise;
    },
    getCampaign: function(name) {
      var dfd = $q.defer();
      $http.get('/api/campaigns/' + name)
        .success(function(data, status, headers, config) {
          dfd.resolve(data);
        }).error(function(error, status, headers, config) {
          dfd.reject(error.reason);
        });
      return dfd.promise;
    }
  };
}
angular.module('app').factory('identityService', ['$window', 'Member', identityService]);
function identityService($window, Member) {
  var currentMember;
  if ($window.bootstrappedMemberObject) {
    currentMember = new Member();
    angular.extend(currentMember, $window.bootstrappedMemberObject);
  }
  return {
    currentMember: currentMember,
    isAuthenticated: function() {
      return !!this.currentMember;
    },
    isAuthorized: function(role) {
      return !!this.currentMember && this.currentMember.isRole(role);
    },
    isAdmin: function() {
      return !!this.currentMember && this.currentMember.isRole('admin');
    },
    isBoard: function() {
      return !!this.currentMember && this.currentMember.isRole('board');
    },
    isInventory: function() {
      return !!this.currentMember && this.currentMember.isRole('inventory');
    }
  };
}
angular.module('app').factory('inventoryService', ['$q', '$http', inventoryService]);
function inventoryService($q, $http, InventoryItem) {
  return {
    getInventoryItems: function() {
      var dfd = $q.defer();
      $http.get('/api/inventoryItems/')
        .success(function(data, status, headers, config) {
          dfd.resolve(data);
        })
        .error(function(error, status, headers, config) {
          dfd.reject(error.reason);
        });
      return dfd.promise;
    },

    save: function(inventoryItem) {
      var dfd = $q.defer();

      // if the inventoryItem has an id then it is an 'update'
      // otherwise it is a 'create new'
      var url = '/api/inventoryItems/';
      if (inventoryItem._id) {
        url = '/api/inventoryItems/' + inventoryItem._id;
      }

      $http.post(url, inventoryItem)
        .success(function(data, status, headers, config) {
          dfd.resolve(data);
        })
        .error(function(error, status, headers, config) {
          console.log(error);
          dfd.reject(error.reason);
        });

      return dfd.promise;
    },

    delete: function(inventoryItem) {
      var dfd = $q.defer();
      $http.delete('/api/inventoryItems/' + inventoryItem._id)
        .success(function(data, status, headers, config) {
          dfd.resolve();
        })
        .error(function(error, status, headers, config) {
          dfd.reject(error.reason);
        });
      return dfd.promise;
    }
  };
}
angular.module('app').factory('memberService', ['$q', '$http', '$upload', 'Member', memberService]);
function memberService($q, $http, $upload, Member) {
  function transformResponse(data) {
    data = JSON.parse(data);
    var members = [];
    for (var i = 0; i < data.length; i++) {
      members[i] = new Member(data[i]);
    }
    return members;
  }

  return {
    deleteMember: function(member) {
      var dfd = $q.defer();
      $http.delete('/api/members/' + member._id)
        .success(function(data, status, headers, config) {
          dfd.resolve();
        })
        .error(function(error, status, headers, config) {
          dfd.reject(error.reason);
        });
      return dfd.promise;
    },

    getMembers: function() {
      var dfd = $q.defer();
      var config = {
        transformResponse: transformResponse
      };
      $http.get('/api/members/', config)
        .success(function (data, status, headers, config) {
          dfd.resolve(data);
        })
        .error(function (error, status, headers, config) {
          dfd.reject(error.reason);
        });
      return dfd.promise;
    },

    getMember: function(name) {
      // because we need to get a html file as the content for a given member
      // we must use the $http.get method and not the Member resource.  The Member
      // resource will only give us json as a $resource result but $http.get will give us
      // our desired html in the response.
      var dfd = $q.defer();
      $http.get('/api/members/' + name)
        .success(function(data, status, headers, config) {
          dfd.resolve(data);
        })
        .error(function(error, status, headers, config) {
          dfd.reject(error.reason);
        });
      return dfd.promise;
    },

    saveMember: function(member) {
      var dfd = $q.defer();

      // if the member has an id then it is an 'update'
      // otherwise it is a 'create new'
      var url = '/api/members/';
      if (member._id) {
        url = '/api/members/' + member._id;
      }

      $upload.upload({
        url: url,
        data: member,
        file: member.img
      }).progress(function(evt) {
        console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
      }).success(function(data, status, headers, config) {
        // file is uploaded successfully
        console.log(data);
        dfd.resolve(data);
      }).error(function(error, status, headers, config) {
        console.log(error);
        dfd.reject(error.reason);
      });

      return dfd.promise;
    },

    saveMemberTmpImg: function(member) {
      var dfd = $q.defer();
      var url = '/api/members/tmpImg/' + member._id;

      $upload.upload({
        url: url,
        file: member.imgTmp
      }).progress(function(evt) {
        console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
      }).success(function(data, status, headers, config) {
        // file is uploaded successfully
        console.log(data);
        dfd.resolve(data);
      }).error(function(error, status, headers, config) {
        console.log(error);
        dfd.reject(error.reason);
      });

      return dfd.promise;
    }
  };
}
angular.module('app').factory('notifierService', ['toastrService', notifierService]);
function notifierService(toastrService) {
  return {
    notify: function(msg) {
      toastrService.success(msg);
    },
    error: function(msg) {
      toastrService.error(msg);
    }
  };
}
/**
 * An angular wrapper around toastr so that it is available as an injectible service
 */
angular.module('app').service('toastrService', ToastrWrapper);

function ToastrWrapper() {
  toastr.options = {
    'closeButton': true,
    'debug': false,
    'positionClass': 'toast-top-full-width',
    'onclick': null,
    'showDuration': '3000',
    'hideDuration': '1000',
    'timeOut': '10000',
    'extendedTimeOut': '2000',
    'showEasing': 'swing',
    'hideEasing': 'linear',
    'showMethod': 'fadeIn',
    'hideMethod': 'fadeOut'
  };
  return toastr;
}
angular.module('app').factory('videoService', ['$q', '$http', videoService]);
function videoService($q, $http) {
  return {
    getVideos: function() {
      var dfd = $q.defer();
      $http.get('/api/videos')
        .success(function(data, status, headers, config) {
          dfd.resolve(data);
        })
        .error(function(error, status, headers, config) {
          dfd.reject(error.reason);
        });
      return dfd.promise;
    },
    getVideo: function(name) {
      var dfd = $q.defer();
      $http.get('/api/videos/' + name)
        .success(function(data, status, headers, config) {
          dfd.resolve(data);
        })
        .error(function(error, status, headers, config) {
          dfd.reject(error.reason);
        });
      return dfd.promise;
    }
  };
}
angular.module('app').factory('volunteerEventService', ['$q', '$http', '$upload', volunteerEventService]);

function formatDate(data) {
  if (data && data.date) {
    data.date = new Date(Date.parse(data.date));
  }
}

function volunteerEventService($q, $http, $upload) {
  var volunteerEvents;

  function transformResponse(data) {
    data = JSON.parse(data);
    for (var i = 0; i < data.length; i++) {
      formatDate(data);
    }
    return data;
  }

  return {
    deleteVolunteerEvent: function(volunteerEvent) {
      var dfd = $q.defer();
      $http.delete('/api/volunteerEvents/' + volunteerEvent._id)
        .success(function(data, status, headers, config) {
          dfd.resolve();
        })
        .error(function(error, status, headers, config) {
          dfd.reject(error.reason);
        });
      return dfd.promise;
    },

    getVolunteerEvents: function() {
      var dfd = $q.defer();
      var config = {
        transformResponse: transformResponse
      };
      $http.get('/api/volunteerEvents/', config)
        .success(function (data, status, headers, config) {
          dfd.resolve(data);
        })
        .error(function (error, status, headers, config) {
          dfd.reject(error.reason);
        });
      return dfd.promise;
    },

    getVolunteerEvent: function(name) {
      var dfd = $q.defer();
      var config = {
        transformResponse: transformResponse
      };
      $http.get('/api/volunteerEvents/' + name, config)
        .success(function(data, status, headers, config) {
          formatDate(data);
          dfd.resolve(data);
        })
        .error(function(error, status, headers, config) {
          dfd.reject(error.reason);
        });
      return dfd.promise;
    },

    saveVolunteerEvent: function(volunteerEvent) {
      var dfd = $q.defer();

      // if the volunteerEvent has an id then it is an 'update'
      // otherwise it is a 'create new'
      var url = '/api/volunteerEvents/';
      if (volunteerEvent._id) {
        url = '/api/volunteerEvents/' + volunteerEvent._id;
      }

      $upload.upload({
        url: url,
        data: volunteerEvent,
        file: volunteerEvent.img
      }).progress(function(evt) {
      }).success(function(data, status, headers, config) {
        // file is uploaded successfully
        formatDate(data);
        dfd.resolve(data);
      }).error(function(error, status, headers, config) {
        dfd.reject(error.reason);
      });

      return dfd.promise;
    },

    saveVolunteerEventTmpImg: function(volunteerEvent) {
      var dfd = $q.defer();
      var url = '/api/volunteerEvents/tmpImg/' + volunteerEvent._id;

      $upload.upload({
        url: url,
        file: volunteerEvent.imgTmp
      }).progress(function(evt) {
      }).success(function(data, status, headers, config) {
        // file is uploaded successfully
        formatDate(data);
        dfd.resolve(data);
      }).error(function(error, status, headers, config) {
        dfd.reject(error.reason);
      });

      return dfd.promise;
    }
  };
}
angular.module('app').factory('Member', ['$resource', Member]);
function Member($resource) {
  var member = $resource('/api/members', {}, {});

  member.prototype.isAdmin = function() {
    return this.isRole('admin');
  };
  member.prototype.setAdmin = function(isSet) {
    this.setRole('admin', isSet);
  };

  member.prototype.isInventory = function() {
    return this.isRole('inventory');
  };
  member.prototype.setInventory = function(isSet) {
    this.setRole('inventory', isSet);
  };

  member.prototype.isBoard = function() {
    return this.isRole('board');
  };
  member.prototype.setBoard = function(isSet) {
    this.setRole('board', isSet);
  };

  member.prototype.isRole = function(roleName) {
    return this.roles && this.roles.indexOf(roleName) > -1;
  };
  member.prototype.setRole = function(roleName, isSet) {
    if (isSet && this.roles.indexOf(roleName) === -1) {
      this.roles.push(roleName);
    } else {
      var roleIndex = this.roles.indexOf(roleName);
      this.roles.splice(roleIndex, 1);
    }
  };
  return member;
}
angular.module('app').controller('adminCtrl', adminCtrl);
adminCtrl.$inject = ['$scope', '$location', 'notifierService', 'authorizationService'];
function adminCtrl($scope, $location, notifierService, authorizationService) {
  $scope.createMember = function () {
    var newMemberData = {
      username: $scope.username,
      password: $scope.password,
      firstName: $scope.firstName,
      lastName: $scope.lastName
    };

    authorizationService.createMember(newMemberData).then(function () {
      notifierService.notify('Member account created!');
      $location.path('/');
    }, function (reason) {
      notifierService.error(reason);
    });
  };
}
angular.module('app').controller('campaignsCtrl', campaignsCtrl);
campaignsCtrl.$inject = ['$scope', '$sce', '$location', 'campaignService'];
function campaignsCtrl($scope, $sce, $location, campaignService) {
  $scope.selectedCampaign = undefined;
  $scope.selectedCampaignHtml = '';

  campaignService.getCampaigns().then(function(campaigns) {
    $scope.campaigns = campaigns;
    var selectedCampaignName = $location.hash();
    if (selectedCampaignName === '') {
      $scope.selectCampaign(campaigns[campaigns.length-1]);
    } else {
      var campaign;
      for (var i = 0; i < campaigns.length; i++) {
        if (campaigns[i].name === selectedCampaignName) {
          campaign = campaigns[i];
        }
      }
      if (campaign) {
        campaignService.getCampaign(campaign.name).then(function (campaignHtml) {
          // use $sce.trustAsHtml to tell angular that the html received is 'safe' to display
          $scope.selectedCampaign = campaign;
          $scope.selectedCampaignHtml = $sce.trustAsHtml(campaignHtml);
        });
      }
    }
  });

  $scope.selectCampaign = function(campaign) {
    campaignService.getCampaign(campaign.name).then(function(campaignHtml) {
      // use $sce.trustAsHtml to tell angular that the html received is 'safe' to display
      $scope.selectedCampaign = campaign;
      $scope.selectedCampaignHtml = $sce.trustAsHtml(campaignHtml);
      $location.hash($scope.selectedCampaign.name);
    });
  };
}


angular.module('app').controller('inventoryCtrl', inventoryCtrl);
inventoryCtrl.$inject = ['$scope', 'inventoryService', 'notifierService', 'identityService'];
function inventoryCtrl($scope, inventoryService, notifierService, identityService) {
  $scope.inventoryItems = {};
  $scope.newItem = {
    name: 'Adventures For the Cure: The Doc',
    category: 'General',
    quantity: 0,
    price: 10.00
  }
  $scope.showImgTmp = false;
  $scope.loadingTmpImg = false;

  $scope.getInventoryItems = function() {
    inventoryService.getInventoryItems().then(function(inventoryItems) {
      $scope.inventoryItems = {};
      for (var i = 0; i < inventoryItems.length; i++) {
        var inventoryItem = inventoryItems[i];
        if (angular.isUndefined($scope.inventoryItems[inventoryItem.category])) {
          $scope.inventoryItems[inventoryItem.category] = [];
        }
        $scope.inventoryItems[inventoryItem.category].push(inventoryItem);
      }
    }, function(reason) {
      notifierService.error(reason);
    });
  };

  $scope.ableToEdit = function() {
    if (identityService.currentMember && identityService.currentMember.isInventory()) {
      return true;
    } else {
      return false;
    }
  };

  $scope.update = function(inventoryItem) {
    inventoryService.save(inventoryItem).then(function(item) {
      notifierService.notify('Inventory item was update');
    }, function(reason) {
      notifierService.error(reason);
    });
  };

  $scope.create = function() {
    inventoryService.save(newInventoryItemData).then(function(item) {
      notifierService.notify('New item was created');
      $scope.getInventoryItems();
    }, function(reason) {
      notifierService.error(reason);
    });
  };

  $scope.delete = function(inventoryItem) {
    inventoryService.delete(inventoryItem).then(function(item) {
      $scope.getInventoryItems();
      notifierService.notify('Inventory item was deleted');
    }, function(reason) {
      notifierService.error(reason);
    });
  };

  $scope.onFileSelect = function($files) {
    $scope.memberToEdit.imgTmp = $files[0];
    $scope.loadingTmpImg = true;
    memberService.saveMemberTmpImg($scope.memberToEdit).then(function(member) {
      $scope.showImgTmp = true;
      $scope.loadingTmpImg = false;
      $scope.memberToEdit.imgPathTmp = member.imgPathTmp;
      $scope.memberToEdit.img = $files[0];
    }, function(reason) {
      $scope.showImgTmp = false;
      $scope.loadingTmpImg = false;
      notifierService.error('Error uploading image, please try again...');
    });
  };

  $scope.getInventoryItems();
}


angular.module('app').controller('loginCtrl', loginCtrl);
loginCtrl.$inject = ['$scope', '$location', 'notifierService', 'authorizationService'];
function loginCtrl($scope, $location, notifierService, authorizationService) {
  $scope.login = function() {
    authorizationService.authenticateMember($scope.loginUsername, $scope.loginPassword).then(function(success) {
      if (success) {
        notifierService.notify('You have successfully signed in!');
        $location.path('/');
      } else {
        notifierService.error('Username/Password combination incorrect');
      }
    });
  };
}
angular.module('app').controller('memberCreateCtrl', memberCreateCtrl);
memberCreateCtrl.$inject = ['$scope', '$location', 'notifierService', 'memberService'];
function memberCreateCtrl($scope, $location, notifierService, memberService) {
  $scope.name = '';
  $scope.username = '';
  $scope.password = '';
  $scope.confirmPassword = '';
  $scope.bio = '';
  $scope.roles = [];
  $scope.img = undefined;
  $scope.notifierService = notifierService;

  $scope.createMember = function() {
    // if the form is valid then submit to the server
    if ($scope.createMemberForm.$valid) {
      var newMember = {
        name: $scope.name,
        username: $scope.username,
        roles: $scope.roles,
        bio: $scope.bio,
        img: $scope.img
      };
      if($scope.password && $scope.password.length > 0) {
        newMember.password = $scope.password;
      }

      memberService.saveMember(newMember).then(function() {
        notifierService.notify('Member ' + newMember.username + ' has been created');
        $location.path('/member-list');
      }, function(reason) {
        notifierService.error(reason);
      });
    }
  };

  $scope.onFileSelect = function($files) {
    $scope.img = $files[0];
  };
}
angular.module('app').controller('memberEditCtrl', memberEditCtrl);
memberEditCtrl.$inject = ['$scope', '$route', 'notifierService', 'memberService', 'identityService'];
function memberEditCtrl($scope, $route, notifierService, memberService, identityService) {
  $scope.identityService = identityService;
  $scope.memberToEdit = undefined;
  $scope.showImgTmp = false;
  $scope.loadingTmpImg = false;

  memberService.getMember($route.current.params.id).then(function(member) {
    $scope.memberToEdit = member;
  });

  $scope.saveMember = function() {
    memberService.saveMember($scope.memberToEdit).then(function(member) {
      $scope.memberToEdit = member;
      if (identityService.currentMember._id === $scope.memberToEdit._id) {
        angular.extend(identityService.currentMember, $scope.memberToEdit);
      }
      notifierService.notify('Member has been updated');
    }, function(reason) {
      notifierService.error('Error saving member data, please try again...');
    });
  };

  $scope.onFileSelect = function($files) {
    $scope.memberToEdit.imgTmp = $files[0];
    $scope.loadingTmpImg = true;
    memberService.saveMemberTmpImg($scope.memberToEdit).then(function(member) {
      $scope.showImgTmp = true;
      $scope.loadingTmpImg = false;
      $scope.memberToEdit.imgPathTmp = member.imgPathTmp;
      $scope.memberToEdit.img = $files[0];
    }, function(reason) {
      $scope.showImgTmp = false;
      $scope.loadingTmpImg = false;
      notifierService.error('Error uploading image, please try again...');
    });
  };

  $scope.isInvalid = function() {
    var invalid = false;
    if ($scope.memberEditForm.$invalid || $scope.loadingTmpImg) {
      invalid = true;
    }
    return invalid;
  };
}
angular.module('app').controller('memberListCtrl', memberListCtrl);
memberListCtrl.$inject = ['$scope', '$location', '$modal', 'memberService', 'identityService'];
function memberListCtrl($scope, $location, $modal, memberService, identityService) {
  $scope.identity = identityService;

  function getMembers() {
    memberService.getMembers().then(function (members) {
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

  getMembers();
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
angular.module('app').controller('memberOnlyCtrl', memberOnlyCtrl);
memberOnlyCtrl.$inject = ['$scope'];
function memberOnlyCtrl($scope) {}
angular.module('app').controller('membersCtrl', membersCtrl);
membersCtrl.$inject = ['$scope', '$location', '$window', 'memberService', 'notifierService', 'identityService'];
function membersCtrl($scope, $location, $window, memberService, notifierService, identityService) {
  $scope.selectedMember = {};
  $scope.selectedMemberHtml = '';
  $scope.editMode = false;
  $scope.showImgTmp = false;
  $scope.notifierService = notifierService;

  memberService.getMembers().then(function(members) {
    $scope.allMembers = members;
    $scope.membersColumn1 = members.slice(0, (members.length / 2) + 1);
    $scope.membersColumn2 = members.slice((members.length / 2) + 1, members.length);
    var urlMemberName = $location.hash();
    for (var i = 0; i < members.length; i++) {
      if (members[i].name === urlMemberName) {
        $scope.selectMember(members[i]);
      } else if (urlMemberName === '' && identityService.isAuthenticated() && identityService.currentMember.name === members[i].name) {
          $scope.selectMember(members[i]);
      } else if (urlMemberName === '' && !identityService.isAuthenticated() && members[i].name === 'Adam Driscoll') {
          $scope.selectMember(members[i]);
      }
    }
  });

  $scope.ableToEdit = function() {
    if ($scope.selectedMember &&
        identityService.isAuthenticated() &&
       ($scope.selectedMember.username === identityService.currentMember.username ||
        identityService.currentMember.isAdmin())) {
      return true;
    } else {
      return false;
    }
  };

  $scope.selectMember = function(member) {
    $scope.selectedMember = member;
    var currHash = $window.location.hash.substring(1, $window.location.hash.length);
    if (currHash !== encodeURIComponent($scope.selectedMember.name)) {
      $window.location.hash = $scope.selectedMember.name;
    }
  };

  $scope.saveMember = function() {
    var member = $scope.selectedMember;
    memberService.saveMember($scope.selectedMember).then(function(member) {
      $scope.selectMember(member);
      $scope.editMode = false;
      $scope.showImgTmp = false;
    });
  };

  $scope.onFileSelect = function($files) {
    $scope.selectedMember.imgTmp = $files[0];
    memberService.saveMemberTmpImg($scope.selectedMember).then(function(member) {
      $scope.selectMember(member);
      $scope.selectedMember.img = $files[0];
      $scope.showImgTmp = true;
    });
  };

  $scope.enableEditMode = function() {
    $scope.editMode = true;
  };

  $scope.cancel = function() {
    $scope.editMode = false;
    $scope.showImgTmp = false;
  };
}

angular.module('app').controller('navbarLoginCtrl', navbarLoginCtrl);
navbarLoginCtrl.$inject = ['$scope', '$location', 'identityService', 'notifierService', 'authorizationService'];
function navbarLoginCtrl($scope, $location, identityService, notifierService, authorizationService) {
  $scope.identityService = identityService;

  $scope.signout = function() {
    authorizationService.logoutMember().then(function() {
      $scope.username = '';
      $scope.password = '';
      notifierService.notify('You have successfully signed out!');
      $location.path('/');
    });
  };

  $scope.isActive = function (viewLocation) {
    return viewLocation === $location.path();
  };
}

angular.module('app').controller('resultsCtrl', resultsCtrl);
resultsCtrl.$inject = ['$scope', '$sce', 'videoService'];
function resultsCtrl($scope, $sce, videoService) {
  $scope.selectedVideoHtml = '';

  videoService.getVideos().then(function(videos) {
    $scope.videos = videos;
    for (var i = 0; i < videos.length; i++) {
      if (videos[i].name === '2014--04-06 AFC Sugar Hill XC') {
        $scope.selectVideo(videos[i]);
      }
    }
  });

  $scope.selectVideo = function(video) {
    videoService.getVideo(video.name).then(function(videoHtml) {
      // use $sce.trustAsHtml to tell angular that the html received is 'safe' to display
      $scope.selectedVideoHtml = $sce.trustAsHtml(videoHtml);
    });
  };
}


angular.module('app').controller('volunteerEventCreateCtrl', volunteerEventCreateCtrl);
volunteerEventCreateCtrl.$inject = ['$scope', '$location', 'notifierService', 'volunteerEventService'];
function volunteerEventCreateCtrl($scope, $location, notifierService, volunteerEventService) {
  $scope.name = '';
  $scope.date = '';
  $scope.isAfcEvent = true;
  $scope.img = undefined;

  $scope.notifierService = notifierService;

  $scope.createVolunteerEvent = function() {
    // if the form is valid then submit to the server
    if ($scope.createVolunteerEventForm.$valid) {
      var newVolunteerEvent = {
        name: $scope.name,
        date: $scope.date,
        isAfcEvent: $scope.isAfcEvent,
        img: $scope.img
      };

      volunteerEventService.saveVolunteerEvent(newVolunteerEvent).then(function() {
        notifierService.notify('VolunteerEvent ' + newVolunteerEvent.username + ' has been created');
        $location.path('/volunteer-event-list');
      }, function(reason) {
        notifierService.error(reason);
      });
    }
  };

  $scope.onFileSelect = function($files) {
    $scope.img = $files[0];
  };
}
angular.module('app').controller('volunteerEventEditCtrl', volunteerEventEditCtrl);
volunteerEventEditCtrl.$inject = ['$scope', '$route', 'notifierService', 'volunteerEventService', 'identityService'];
function volunteerEventEditCtrl($scope, $route, notifierService, volunteerEventService, identityService) {
  $scope.identityService = identityService;
  $scope.volunteerEventToEdit = undefined;
  $scope.showImgTmp = false;

  volunteerEventService.getVolunteerEvent($route.current.params.id).then(function(volunteerEvent) {
    $scope.volunteerEventToEdit = volunteerEvent;
  });

  $scope.saveVolunteerEvent = function() {
    volunteerEventService.saveVolunteerEvent($scope.volunteerEventToEdit).then(function(volunteerEvent) {
      $scope.volunteerEventToEdit = volunteerEvent;
      notifierService.notify('Volunteer event has been updated');
    }, function(reason) {
      notifierService.error(reason);
    });
  };

  $scope.onFileSelect = function($files) {
    $scope.volunteerEventToEdit.imgTmp = $files[0];
    volunteerEventService.saveVolunteerEventTmpImg($scope.volunteerEventToEdit).then(function(volunteerEvent) {
      $scope.volunteerEventToEdit = volunteerEvent;
      $scope.volunteerEventToEdit.img = $files[0];
      $scope.showImgTmp = true;
    });
  };
}
angular.module('app').controller('volunteerEventListCtrl', volunteerEventListCtrl);
volunteerEventListCtrl.$inject = ['$scope', '$location', '$modal', 'volunteerEventService', 'identityService'];
function volunteerEventListCtrl($scope, $location, $modal, volunteerEventService, identityService) {
  $scope.identity = identityService;

  getVolunteerEvents();

  function getVolunteerEvents() {
    volunteerEventService.getVolunteerEvents().then(function (volunteerEvents) {
      $scope.volunteerEvents = volunteerEvents;
    });
  }

  $scope.editVolunteerEvent = function(volunteerEvent) {
    $location.path('/volunteer-event-edit/' + volunteerEvent._id);
  };

  $scope.deleteVolunteerEvent = function(volunteerEvent) {
    var modalInstance = $modal.open({
      templateUrl: '/partials/volunteerEventList/confirm-delete-volunteer-event-modal',
      controller: confirmDeleteVolunteerEventCtrl,
      resolve: {
        volunteerEvent: function () {
          return volunteerEvent;
        }
      }
    });
    modalInstance.result.then(function() {
      getVolunteerEvents();
    });
  };
}

function confirmDeleteVolunteerEventCtrl($scope, $modalInstance, volunteerEventService, notifierService, volunteerEvent) {
  $scope.volunteerEvent = volunteerEvent;
  $scope.confirm = function () {
    volunteerEventService.deleteVolunteerEvent(volunteerEvent).then(function() {
      notifierService.notify('Volunteer event ' + volunteerEvent.username + ' has been deleted');
    }, function(reason) {
      notifierService.error(reason);
    });
    $modalInstance.close();
  };

  $scope.cancel = function () {
    $modalInstance.dismiss();
  };
}