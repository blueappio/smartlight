var app;
(function () {
    app = angular.module('smartLight', ['ngMaterial'])
        .config(function ($mdThemingProvider) {
            $mdThemingProvider.theme('default')
                .primaryPalette('blue')
                .accentPalette('indigo');
            $mdThemingProvider.theme('success-toast');
            $mdThemingProvider.theme('error-toast');

            $mdThemingProvider.alwaysWatchTheme(true);
        })
})();

app.run(['$document', '$window', function ($document, $window) {
    var document = $document[0];
    document.addEventListener('click', function (event) {
        var hasFocus = document.hasFocus();
        if (!hasFocus) $window.focus();
    });
}]);

app.service('smartlightService', function () {
    return new SmartLight(navigator.bluetooth);
});

app.controller('mainController', function ($scope, $mdToast, $mdDialog, smartlightService) {

    $scope.smartlight = smartlightService;
    $scope.powerChanged = true;

    function goodToast(message) {
        $mdToast.show(
            $mdToast.simple()
                .textContent(message)
                .position('top')
                .theme("success-toast")
                .hideDelay(2500)
        );
    };

    function badToast(message) {
        $mdToast.show(
            $mdToast.simple()
                .textContent(message)
                .position('top')
                .theme('error-toast')
                .hideDelay(2500)
        );
    };

    function showLoadingIndicator($event, text) {
        var parentEl = angular.element(document.body);
        $mdDialog.show({
            parent: parentEl,
            targetEvent: $event,
            clickOutsideToClose: false,
            template: '<md-dialog style="width: 250px;top:95px;margin-top: -170px;" aria-label="loadingDialog" ng-cloak>' +
            '<md-dialog-content>' +
            '<div layout="row" layout-align="center" style="padding: 40px;">' +
            '<div style="padding-bottom: 20px;">' +
            '<md-progress-circular md-mode="indeterminate" md-diameter="40" style="right: 20px;bottom: 10px;">' +
            '</md-progress-circular>' +
            '</div>' +
            '</div>' +
            '<div layout="row" layout-align="center" style="padding-bottom: 20px;">' +
            '<label>' + text + '</label>' +
            '</div>' +
            '</md-dialog-content>' +
            '</md-dialog>',
            controller: DialogController
        });

        function DialogController($scope, $mdDialog) {
            $scope.closeDialog = function () {
                $mdDialog.hide();
            }
        }
    }

    function dismissLoadingIndicator() {
        $mdDialog.cancel();
    };

    $scope.toggleSmartLight = function () {
        $scope.powerChanged = false;
        $scope.smartlight.writeData($scope.smartlight.powerStatus, 'powerStatus')
        .then(function(){
            $scope.powerChanged = true;
            $scope.$apply();
        });
    };

    $scope.dimSliderChange = function () {
        $scope.smartlight.writeData($scope.smartlight.dimValue, 'dimValue');
    };

    $scope.lightNameChange = function () {
        if ($scope.smartlight.lightName != '')
            $scope.smartlight.writeData($scope.smartlight.lightName, 'lightName');
    };

    $scope.roomNameChange = function () {
        if ($scope.smartlight.roomName != '')
            $scope.smartlight.writeData($scope.smartlight.roomName, 'roomName');
    };

    $scope.groupNameChange = function () {
        if ($scope.smartlight.groupName != '')
            $scope.smartlight.writeData($scope.smartlight.groupName, 'groupName');
    };

    $scope.onConnect = function () {
        showLoadingIndicator('', 'Connecting ....');
        $scope.smartlight.connect()
            .then(function () {
                dismissLoadingIndicator();
                goodToast('Connected...');
            })
            .catch(function (error) {
                dismissLoadingIndicator();
                console.error('Argh!', error, error.stack ? error.stack : '');
                badToast('Unable to connect.');
            });
    }

    if (!navigator.bluetooth) {
        badToast('Bluetooth not supported, which is required.');
    } else if (navigator.bluetooth.referringDevice) {
        $scope.onConnect();
    }

});
