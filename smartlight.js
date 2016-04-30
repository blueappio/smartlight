(function() {
  'use strict';

    var util = new Util();

    var PUBLIC_SERVICE_UUID   = 0xFF10;

    var LIGHT_SWITCH_UUID   = 0xFF11;
    var DIMMER_SETTING_UUID = 0xFF12;
    var POWER_CONSUME_UUID  = 0xFF16;
    var LIGHT_NAME_PUB_UUID = 0xFF17;
    var GROUP_NAME_PUB_UUID = 0xFF18;
    var ROOM_NAME_PUB_UUID  = 0xFF19;
    var DISCONNECT_UUID     = 0xFF1A;

  class SmartLight {
    constructor() {
      this.isOn = '';
      this.lightName = '';
      this.roomName = '';
      this.groupName = '';
      this.dimValue = 0;
      this.powerConsumed = '';
      this.characteristics = new Map();
      
      if(!navigator.bluetooth) {
      	console.error('bluetooth not supported');
      }
    }

    connect() {
      var options = {filters:[{name: 'Smart Light',}]};
      return navigator.bluetooth.requestDevice(options).then(function (device) {
        window.smartLight.device = device;
        return device.connectGATT();
      }).then(function (server) {
        window.smartLight.server = server;
        return Promise.all([
          server.getPrimaryService(PUBLIC_SERVICE_UUID).then(function (service) {
          return Promise.all([
            window.smartLight._cacheCharacteristic(service, LIGHT_SWITCH_UUID),
            window.smartLight._cacheCharacteristic(service, DIMMER_SETTING_UUID),
            window.smartLight._cacheCharacteristic(service, POWER_CONSUME_UUID),
            window.smartLight._cacheCharacteristic(service, LIGHT_NAME_PUB_UUID),
            window.smartLight._cacheCharacteristic(service, GROUP_NAME_PUB_UUID),
            window.smartLight._cacheCharacteristic(service, ROOM_NAME_PUB_UUID),
            window.smartLight._cacheCharacteristic(service, DISCONNECT_UUID)]);
        })]);
      });
    }

    /* Smart Light Services */
   
    getLightStatus(){
        return this._readCharacteristicValue(LIGHT_SWITCH_UUID)
      .then(this._lightStatus);
    };

    toggleSmartLight(status){
        if(status){
            this.turnON();
            setTimeout(function () {
                smartLight.setDimValue(smartLight.dimValue);
            }, 1000);
        }else{
            this.turnOFF();
        }
    };

    turnON(){
        var data = [0x01];
        return this._writeCharacteristicValue(LIGHT_SWITCH_UUID, new Uint8Array(data));
    };

    turnOFF(){
        var data = [0x00];
        return this._writeCharacteristicValue(LIGHT_SWITCH_UUID, new Uint8Array(data));
    };

    setDimValue(dimValue){
        var data = [dimValue];
        return this._writeCharacteristicValue(DIMMER_SETTING_UUID, new Uint8Array(data));
    };

    getDimValue(){
        return this._readCharacteristicValue(DIMMER_SETTING_UUID).then(function (data) {
              return data.getUint8(0);
        });
    };

    setLightName(lightName){
        lightName = util.stringToDecArray(lightName);
        return this._writeCharacteristicValue(LIGHT_NAME_PUB_UUID, new Uint8Array(lightName));
    };

    getLightName(){
        return this._readCharacteristicValue(LIGHT_NAME_PUB_UUID)
      .then(this._decodeString);
    };

    setGroupName(groupName){
        groupName = util.stringToDecArray(groupName);
        return this._writeCharacteristicValue(GROUP_NAME_PUB_UUID, new Uint8Array(groupName));
    };

    getGroupName(){
        return this._readCharacteristicValue(GROUP_NAME_PUB_UUID)
      .then(this._decodeString);
    };

    setRoomName(roomName){
        roomName = util.stringToDecArray(roomName);
        return this._writeCharacteristicValue(ROOM_NAME_PUB_UUID, new Uint8Array(roomName));
    };

    getRoomName(){
        return this._readCharacteristicValue(ROOM_NAME_PUB_UUID)
      .then(this._decodeString);
    };

    getPowerConsume(){
        return this._readCharacteristicValue(POWER_CONSUME_UUID)
      .then(this._decodeString);
    };

    /* Utils */

    _cacheCharacteristic(service, characteristicUuid) {
      return service.getCharacteristic(characteristicUuid).then(function (characteristic) {
        window.smartLight.characteristics.set(characteristicUuid, characteristic);
      });
    }

    _readCharacteristicValue(characteristicUuid) {
      var characteristic = this.characteristics.get(characteristicUuid);
      return characteristic.readValue().then(function (value) {
        value = value.buffer ? value : new DataView(value);
        return value;
      });
    }

    _writeCharacteristicValue(characteristicUuid, value) {
      var characteristic = this.characteristics.get(characteristicUuid);
      if (this._debug) {
        console.debug('WRITE', characteristic.uuid, value);
      }
      return characteristic.writeValue(value);
    }

    _lightStatus(data){
      if(data.getUint8(0) == 0){
        return false;
      }else{
        return true;
      }
    }

    _decodeString(data){
      var value = '';
      for (var i = 0; i < data.byteLength; i++) {
        value = value + String.fromCharCode(data.getUint8(i));
      };
      value = value.replace (/\0000/g, '');
      value = value.trim();
      return value;
    }
  }

  window.smartLight = new SmartLight();

})();

function Util()
{
    this.stringToDecArray = function(str){
        var dec, i;
        var dec_arr = [];
        if(str){
            for (i=0; i<str.length; i++) {
                dec = str.charCodeAt(i).toString(10);
                dec_arr.push(Number(dec));
            }
        }
        return dec_arr;
    };
    
    return this;
}