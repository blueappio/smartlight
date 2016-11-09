"use strict";
var GATTIP = require('gatt-ip').GATTIP;

var SmartLight = function () {

    var util = new Util();

    var PUBLIC_SERVICE_UUID = 0xff10;

    var LIGHT_STATUS_UUID = 0xff11;
    var DIMMER_SETTING_UUID = 0xff12;
    var POWER_CONSUME_UUID = 0xff16;
    var LIGHT_NAME_PUB_UUID = 0xff17;
    var GROUP_NAME_PUB_UUID = 0xff18;
    var ROOM_NAME_PUB_UUID = 0xff19;
    var DISCONNECT_UUID = 0xff1A;

    function SmartLight(bluetooth) {
        this.connected = false;

        this.lightStatusCharacteristic = undefined;
        this.dimmerSettingCharacteristic = undefined;
        this.powerConsumeCharacteristic = undefined;
        this.lightNameCharacteristic = undefined;
        this.groupNameCharacteristic = undefined;
        this.roomNameCharacteristic = undefined;

        this.powerStatus = undefined;
        this.dimValue = undefined;
        this.powerConsumed = undefined;
        this.lightName = undefined;
        this.groupName = undefined;
        this.roomName = undefined;

        this.bluetooth = bluetooth;
        this.bluetoothDevice = undefined;
    }

    SmartLight.prototype.connect = function connect() {
        var self = this;

        var options = {
            filters: [{services: [PUBLIC_SERVICE_UUID]}],
            optionalServices: [0x1800, 0x1801, 0x180A, PUBLIC_SERVICE_UUID, 0xff20, 0xff40, "f000ffc0-0451-4000-b000-000000000000"]
        };

        return this.bluetooth.requestDevice(options)
            .then(function (device) {
                self.bluetoothDevice = device;
                return device.gatt.connect();
            })
            .then(function (server) {
                server.getPrimaryService(PUBLIC_SERVICE_UUID)
                    .then(function (service) {
                        return Promise.all([
                            service.getCharacteristic(LIGHT_STATUS_UUID)
                                .then(function (characteristic) {
                                    self.lightStatusCharacteristic = characteristic;
                                    characteristic.readValue()
                                        .then(function (data) {
                                            data = data.buffer ? data : new DataView(data);
                                            if (data.getUint8(0)) {
                                                self.powerStatus = true;
                                            }
                                            else {
                                                self.powerStatus = false;
                                            }
                                            console.log(self.powerStatus);
                                        });
                                }),
                            service.getCharacteristic(DIMMER_SETTING_UUID)
                                .then(function (characteristic) {
                                    self.dimmerSettingCharacteristic = characteristic;
                                    characteristic.readValue()
                                        .then(function (data) {
                                            data = data.buffer ? data : new DataView(data);
                                            self.dimValue = data.getUint8(0);
                                            console.log(self.dimValue);
                                        });
                                }),
                            service.getCharacteristic(POWER_CONSUME_UUID)
                                .then(function (characteristic) {
                                    self.powerConsumeCharacteristic = characteristic;
                                    characteristic.readValue()
                                        .then(function (data) {
                                            var value = '';
                                            for (var i = 0; i < data.byteLength; i++) {
                                                value = value + String.fromCharCode(data.getUint8(i));
                                            }
                                            value = value.trim();
                                            self.powerConsumed = value + ' Wh';
                                            console.log(self.powerConsumed);
                                        });
                                }),
                            service.getCharacteristic(LIGHT_NAME_PUB_UUID)
                                .then(function (characteristic) {
                                    self.lightNameCharacteristic = characteristic;
                                    characteristic.readValue()
                                        .then(function (data) {
                                            var value = '';
                                            for (var i = 0; i < data.byteLength; i++) {
                                                if (data.getUint8(i) != 0) {
                                                    value = value + String.fromCharCode(data.getUint8(i));
                                                }
                                            }
                                            value = value.trim();
                                            self.lightName = value;
                                            console.log(self.lightName);
                                        });
                                }),
                            service.getCharacteristic(GROUP_NAME_PUB_UUID)
                                .then(function (characteristic) {
                                    self.groupNameCharacteristic = characteristic;
                                    characteristic.readValue()
                                        .then(function (data) {
                                            var value = '';
                                            for (var i = 0; i < data.byteLength; i++) {
                                                if (data.getUint8(i) != 0) {
                                                    value = value + String.fromCharCode(data.getUint8(i));
                                                }
                                            }
                                            value = value.trim();
                                            self.groupName = value;
                                            console.log(self.groupName);
                                        });
                                }),
                            service.getCharacteristic(ROOM_NAME_PUB_UUID)
                                .then(function (characteristic) {
                                    self.roomNameCharacteristic = characteristic;
                                    characteristic.readValue()
                                        .then(function (data) {
                                            var value = '';
                                            for (var i = 0; i < data.byteLength; i++) {
                                                if (data.getUint8(i) != 0) {
                                                    value = value + String.fromCharCode(data.getUint8(i));
                                                }
                                            }
                                            value = value.trim();
                                            self.roomName = value;
                                            console.log(self.roomName);
                                        });
                                })
                        ])
                    }, function (error) {
                        console.warn('PUBLIC_SERVICE_UUID Service not found');
                    })
            })
            .then(function () {
                self.connected = true;
            });
    }

    SmartLight.prototype.writeData = function writeData(sendData, charac_type) {
        if (charac_type == 'powerStatus' && this.lightStatusCharacteristic) {
            if (sendData) {
                this.powerStatus = true;
                var data = [0x01];
            } else {
                this.powerStatus = false;
                var data = [0x00];
            }
            return this.lightStatusCharacteristic.writeValue(new Uint8Array(data));
        } else if (charac_type == 'dimValue' && this.dimmerSettingCharacteristic) {
            return this.dimmerSettingCharacteristic.writeValue(new Uint8Array([sendData]));
        } else if (charac_type == 'lightName' && this.lightNameCharacteristic) {
            return this.lightNameCharacteristic.writeValue(sendData.split('').map(function (c) {
                return c.charCodeAt(0);
            }));
        } else if (charac_type == 'groupName' && this.groupNameCharacteristic) {
            return this.groupNameCharacteristic.writeValue(sendData.split('').map(function (c) {
                return c.charCodeAt(0);
            }));
        } else if (charac_type == 'roomName' && this.roomNameCharacteristic) {
            return this.roomNameCharacteristic.writeValue(sendData.split('').map(function (c) {
                return c.charCodeAt(0);
            }));
        }

        return Promise.reject();
    }

    SmartLight.prototype.disconnect = function disconnect() {
        if (!this.bluetoothDevice) {
            return Promise.reject();
        }

        var self = this;

        return this.bluetoothDevice.disconnect()
            .then(function () {
                self.connected = false;
                self.lightStatusCharacteristic = undefined;
                self.dimmerSettingCharacteristic = undefined;
                self.powerConsumeCharacteristic = undefined;
                self.lightNameCharacteristic = undefined;
                self.groupNameCharacteristic = undefined;
                self.roomNameCharacteristic = undefined;

                self.powerStatus = undefined;
                self.dimValue = undefined;
                self.powerConsumed = undefined;
                self.lightName = undefined;
                self.groupName = undefined;
                self.roomName = undefined;

                return Promise.resolve();
            });

    }

    return SmartLight;

}();

if (window === undefined) {
    module.exports.SmartLight = SmartLight;
}

function Util() {
    this.a2hex = function (asci) {
        var str = '';
        for (var a = 0; a < asci.length; a++) {
            str = str + asci.charCodeAt(a).toString(16);
        }
        return str;
    };

    return this;
}

