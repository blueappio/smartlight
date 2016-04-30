var app;
(function () {
    app = angular.module('smartLight', ['ngMaterial'])
        .config(function ($mdThemingProvider) {
            $mdThemingProvider.theme('default')
                .primaryPalette('blue')
                .accentPalette('pink');
            $mdThemingProvider.theme('success-toast');
            $mdThemingProvider.theme('error-toast');

            $mdThemingProvider.alwaysWatchTheme(true);
        })
})();

app.controller('mainController', function ($scope, $mdToast) {

    function setLightSwitch(lightStatus) {
        console.log('got the light status : ' + lightStatus);
        $scope.smartLight.onSuccess('Connected with Smart Light');
        if (lightStatus == 0) {
            smartLight.isOn = lightStatus;
        } else {
            smartLight.isOn = true;
        }
        $scope.$apply();
    }


    $scope.smartLight = smartLight;

    $scope.smartLight.onSuccess = function (message) {
        $mdToast.show(
            $mdToast.simple()
                .content(message)
                .position('top right')
                .hideDelay(2500)
                .theme("success-toast")
        );
    };

    $scope.smartLight.onError = function (message) {
        $mdToast.show(
            $mdToast.simple()
                .content(message)
                .position('top right')
                .hideDelay(2500)
                .theme("error-toast")
        );
    };

    $scope.toggleSmartLight = function () {
        $scope.smartLight.toggleSmartLight($scope.smartLight.isOn);
    };

    $scope.dimSliderChange = function () {
        $scope.smartLight.setDimValue($scope.smartLight.dimValue);
    };

    $scope.lightNameChange = function () {
        $scope.smartLight.setLightName($scope.smartLight.lightName);
    };

    $scope.roomNameChange = function () {
        $scope.smartLight.setRoomName($scope.smartLight.roomName);
    };

    $scope.groupNameChange = function () {
        $scope.smartLight.setGroupName($scope.smartLight.groupName);
    };

    $scope.connectClick = function () {
        $scope.smartLight.onSuccess('Connecting ....');
        smartLight.connect().then(function () {
            return smartLight.getPowerConsume().then(function (powerConsume) {
                return smartLight.powerConsumed = powerConsume + ' Wh';
            }).then(function () {
                return smartLight.getLightName().then(function (lightName) {
                    return smartLight.lightName = lightName;
                }).then(function () {
                    return smartLight.getRoomName().then(function (roomName) {
                        return smartLight.roomName = roomName;
                    }).then(function () {
                        return smartLight.getGroupName().then(function (groupName) {
                            return smartLight.groupName = groupName;
                        }).then(function () {
                            return smartLight.getDimValue().then(function (dimValue) {
                                return smartLight.dimValue = dimValue;
                            }).then(function () {
                                return smartLight.getLightStatus().then(setLightSwitch);
                            });
                        });
                    });
                });
            });
        }).catch(function (error) {
            console.error('Argh!', error, error.stack ? error.stack : '');
        });
    }

    if (navigator.bluetooth == undefined) {
        console.log("No navigator.bluetooth found.");
        $scope.smartLight.onError("No navigator.bluetooth found.");
    } else if (navigator.bluetooth.referringDevice) {
        $scope.connectClick();
    }

});
