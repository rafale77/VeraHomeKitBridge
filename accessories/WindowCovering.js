var types = require("../lib/HAP-NodeJS/accessories/types.js");
var request = require("request");

var settingBrightness = false;
var nextBrightnessLevel = null;

function WindowCovering(veraIP, device) {
	this.device = device;
	this.veraIP = veraIP;
	this.name = device.name;
}

WindowCovering.prototype = {

	/**
	 *  This method is called when the brightness level changes
	 */
	onSetBrightness: function(brightness) {

		if (settingBrightness) {
			nextBrightnessLevel = brightness;
			return;
		} else {
			settingBrightness = true;

		}

		console.log("Setting the " + this.device.name + " brightness to " + brightness + "%");
        var result = brightness

		var self = this;
		request.get({url: "http://" + this.veraIP + ":3480/data_request?id=lu_action&output_format=xml&DeviceNum=" + this.device.id + "&serviceId=urn:upnp-org:serviceId:Dimming1&action=SetLoadLevelTarget&newLoadlevelTarget=" + brightness},
			function(err, response, body) {
				if (!err && response.statusCode == 200) {
					console.log("The " + self.device.name + " brightness has been changed to " + result + "%");
				} else {
					console.log("Error '" + err + "' changing the " + self.device.name + " brightness:  " + body);
				}
				settingBrightness = false;
				if (nextBrightnessLevel) {
					var brightness = nextBrightnessLevel;
					nextBrightnessLevel = null;
					self.onSetBrightness(brightness);
				}
			}
		);

	},

    /**
     *  This method is called when the Window is to be read
     */
    onGetBrightness: function(callback) {

        var self = this;

        request.get({url: "http://" + this.veraIP + ":3480/data_request?id=variableget&output_format=xml&DeviceNum=" + this.device.id + "&serviceId=urn:upnp-org:serviceId:Dimming1&Variable=LoadLevelStatus"},
            function(err, response, body) {
                if (!err && response.statusCode == 200) {

                    console.log("The " + self.device.name + " brightness is at " + body + "%");

                    callback(parseFloat(body));
                } else {
                    console.log("Error '" + err + "' reading the " + self.device.name + " brightness:  " + body);
                }
            }
        );
    },

	/**
	 *  This method is called when the Window is turned on or off
	 */
	onSetPowerState: function(powerOn) {

		if (powerOn) {
			console.log("Opening the " + this.device.name);
		} else {
			console.log("Closing the " + this.device.name);
		}

		var binaryState = powerOn ? 1 : 0;
		var self = this;
		request.get({url: "http://" + this.veraIP + ":3480/data_request?id=lu_action&output_format=xml&DeviceNum=" + this.device.id + "&serviceId=urn:upnp-org:serviceId:SwitchPower1&action=SetTarget&newTargetValue=" + binaryState},
			function(err, response, body) {
				if (!err && response.statusCode == 200) {
					if (powerOn) {
						console.log("The " + self.device.name + " has been open");
					} else {
						console.log("The " + self.device.name + " has been closed");
					}
				} else {
					console.log("Error '" + err + "' turning the " + self.device.name + " on/off:  " + body);
				}
			}
		);
	},

    /**
     *  This method is called when the Window is to be read
     */
    onGetPowerState: function(callback) {

        console.log("Reading status on " + this.device.name);
        var self = this;

        request.get({url: "http://" + this.veraIP + ":3480/data_request?id=variableget&output_format=xml&DeviceNum=" + this.device.id + "&serviceId=urn:upnp-org:serviceId:SwitchPower1&Variable=Status"},
            function(err, response, body) {
                if (!err && response.statusCode == 200) {

                    console.log("Window Covering body :"+body);

                    var powerOn = parseInt(body) == 1;

                    if (powerOn) {
                        console.log("The " + self.device.name + " has been opened");
                    } else {
                        console.log("The " + self.device.name + " has been closed");
                    }

                    callback(powerOn ? 1 : 0);
                } else {
                    console.log("Error '" + err + "' reading " + self.device.name + " on/off:  " + body);
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
        initialValue: "Window Covering",
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
      sType: types.WINDOW_COVERING_STYPE,
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
    	cType: types.WINDOW_COVERING_TARGET_POSITION_CTYPE,
    	onUpdate: function(value) { that.onSetBrightness(value); },
    	perms: ["pw","pr","ev"],
		format: "int",
		initialValue: 0,
		supportEvents: false,
		supportBonjour: false,
		manfDescription: "Adjust the opening",
		designedMinValue: 0,
		designedMaxValue: 100,
		designedMinStep: 1,
		unit: "%"
    },
    {
    cType: types.WINDOW_COVERING_CURRENT_POSITION_CTYPE,
    onRead: function(callback) { that.onGetBrightness(callback); },
    onUpdate: function(value) { execute("Window Covering", "Current State", value); },
    //onUpdate: function(value) { that.onSetBrightness(value); },
    perms: ["pr","ev"],
  format: "int",
  initialValue: 0,
  supportEvents: false,
  supportBonjour: false,
  manfDescription: "Adjust the opening",
  designedMinValue: 0,
  designedMaxValue: 100,
  designedMinStep: 1,
  unit: "%"
  }]
    }];
  }
};

module.exports.initializeWithDevice = WindowCovering;
