var types = require("../lib/HAP-NodeJS/accessories/types.js");
var request = require("request");


function Light(veraIP, device) {
	this.device = device;
	this.veraIP = veraIP;
	this.name = device.name;
}

Light.prototype = {

	/**
	 *  This method is called when the light is turned on or off
	 */
	onSetPowerState: function(powerOn) {

		if (powerOn) {
			console.log("Turning on the " + this.device.name);
		} else {
			console.log("Turning off the " + this.device.name);
		}

		var binaryState = powerOn ? 1 : 0;
		var self = this;
		request.get({url: "http://" + this.veraIP + ":3480/data_request?id=lu_action&output_format=xml&DeviceNum=" + this.device.id + "&serviceId=urn:upnp-org:serviceId:SwitchPower1&action=SetTarget&newTargetValue=" + binaryState},
			function(err, response, body) {
				if (!err && response.statusCode == 200) {
					if (powerOn) {
						console.log("The " + self.device.name + " has been turned on");
					} else {
						console.log("The " + self.device.name + " has been turned off");
					}
				} else {
					console.log("Error '" + err + "' turning the " + self.device.name + " on/off:  " + body);
				}
			}
		);
	},

	/**
	 *  This method is called when the light is to be read
	 */
	onGetPowerState: function(callback) {

		console.log("Reading status on " + this.device.name);
		var self = this;

		request.get({url: "http://" + this.veraIP + ":3480/data_request?id=variableget&output_format=xml&DeviceNum=" + this.device.id + "&serviceId=urn:upnp-org:serviceId:SwitchPower1&Variable=Status"},
			function(err, response, body) {
				if (!err && response.statusCode == 200) {

					var powerOn = parseInt(body) == 1;

					if (powerOn) {
						console.log("The " + self.device.name + " is turned on");
					} else {
						console.log("The " + self.device.name + " is turned off");
					}

					callback(powerOn);
				} else {
					console.log("Error '" + err + "' reading the " + self.device.name + " on/off:  " + body);
				}
			}
		);
	},

	/**
	 *  This method is called when the user tries to identify this accessory
	 */
	onIdentify: function(identify) {
		if (identify) {
			console.log("User wants to identify this accessory");
		} else {
			console.log("User is finished identifying this accessory");
		}
	},

  getServices: function() {
    var that = this;
    return [{
      sType: types.ACCESSORY_INFORMATION_STYPE,
      characteristics: [{
        cType: types.NAME_CTYPE,
        onUpdate: null,
        perms: ["pr"],
        format: "string",
        initialValue: this.name,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Name of the accessory",
        designedMaxLength: 255
      },{
        cType: types.MANUFACTURER_CTYPE,
        onUpdate: null,
        perms: ["pr"],
        format: "string",
        initialValue: "Z-Wave",
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Manufacturer",
        designedMaxLength: 255
      },{
        cType: types.MODEL_CTYPE,
        onUpdate: null,
        perms: ["pr"],
        format: "string",
        initialValue: "Light",
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Model",
        designedMaxLength: 255
      },{
        cType: types.SERIAL_NUMBER_CTYPE,
        onUpdate: null,
        perms: ["pr"],
        format: "string",
        initialValue: "" + this.device.id,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "SN",
        designedMaxLength: 255
      },{
        cType: types.IDENTIFY_CTYPE,
        onUpdate: function(value) { that.onIdentify(value); },
        perms: ["pw"],
        format: "bool",
        initialValue: false,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Identify Accessory",
        designedMaxLength: 1
      }]
    },{
      sType: types.SWITCH_STYPE,
      characteristics: [{
        cType: types.NAME_CTYPE,
        onUpdate: null,
        perms: ["pr"],
        format: "string",
        initialValue: this.name,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Name of service",
        designedMaxLength: 255
      },
      {
        cType: types.POWER_STATE_CTYPE,
        onUpdate: function(value) { that.onSetPowerState(value); },
		    onRead: function(callback) { that.onGetPowerState(callback); },
        perms: ["pw","pr","ev"],
        format: "bool",
        initialValue: false,
        supportEvents: false,
        supportBonjour: false,
        manfDescription: "Change the power state",
        designedMaxLength: 1
      }]
    }];
  }
};

module.exports.initializeWithDevice = Light;
