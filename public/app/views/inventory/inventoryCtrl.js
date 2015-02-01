angular.module('app').controller('inventoryCtrl', inventoryCtrl);
inventoryCtrl.$inject = ['$scope', 'inventoryService', 'notifierService', 'identityService'];
function inventoryCtrl($scope, inventoryService, notifierService, identityService) {
  $scope.inventoryItems = {};
  $scope.newItem = newItem();

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

  $scope.createItem = function() {
    inventoryService.save($scope.newItem).then(function(item) {
      notifierService.notify('New item was created');
      $scope.getInventoryItems();
    }, function(reason) {
      notifierService.error(reason);
    });
  };

  $scope.resetForm = function() {
    $scope.newItem = newItem();
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
    $scope.newItem.img = $files[0];
  };

  function newItem() {
    return {
      name: '',
      category: '',
      quantity: 0,
      price: 0,
      salePrice: undefined,
      img: undefined
    }
  };

  $scope.getInventoryItems();
}

