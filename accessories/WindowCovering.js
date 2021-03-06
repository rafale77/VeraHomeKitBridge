var types = require("../lib/HAP-NodeJS/accessories/types.js");
var request = require("request");

var settingOpening = false;
var nextOpeningLevel = null;

function WindowCovering(veraIP, device) {
	this.device = device;
	this.veraIP = veraIP;
	this.name = device.name;
}

WindowCovering.prototype = {

	/**
	 *  This method is called when the opening level changes
	 */
	onSetOpening: function(opening) {

		if (settingOpening) {
			nextOpeningLevel = opening;
			return;
		} else {
			settingOpening = true;

		}

		console.log("Setting the " + this.device.name + " opening to " + opening + "%");
        var result = opening;

		var self = this;
		request.get({url: "http://" + this.veraIP + ":3480/data_request?id=lu_action&output_format=xml&DeviceNum=" + this.device.id + "&serviceId=urn:upnp-org:serviceId:Dimming1&action=SetLoadLevelTarget&newLoadlevelTarget=" + opening},
			function(err, response, body) {
				if (!err && response.statusCode == 200) {
					console.log("The " + self.device.name + " opening has been changed to " + result + "%");
				} else {
					console.log("Error '" + err + "' changing the " + self.device.name + " opening:  " + body);
				}
				settingOpening = false;
				if (nextOpeningLevel) {
					var opening = nextOpeningLevel;
					nextOpeningLevel = null;
					self.onSetOpening(opening);
				}
			}
		);

	},

    /**
     *  This method is called when the Window is to be read
     */
    onGetOpening: function(callback) {

        var self = this;

        request.get({url: "http://" + this.veraIP + ":3480/data_request?id=variableget&output_format=xml&DeviceNum=" + this.device.id + "&serviceId=urn:upnp-org:serviceId:Dimming1&Variable=LoadLevelStatus"},
            function(err, response, body) {
                if (!err && response.statusCode == 200) {

                    console.log("The " + self.device.name + " opening is at " + body + "%");

                    callback(parseFloat(body));
                } else {
                    console.log("Error '" + err + "' reading the " + self.device.name + " opening:  " + body);
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
    		onUpdate: function(value) { that.onSetOpening(value); },
    		perms: ["pw","pr","ev"],
				format: "UINT8",
				initialValue: 0,
				supportEvents: false,
				supportBonjour: false,
				manfDescription: "Adjust the opening",
				designedMinValue: 0,
				designedMaxValue: 100,
				designedMinStep: 10,
				unit: "%"
    	},
    	{
    		cType: types.WINDOW_COVERING_CURRENT_POSITION_CTYPE,
    		onRead: function(callback) { that.onGetOpening(callback); },
    		//onUpdate: function(value) { execute("Window Covering", "Current Position", value); },
    		onUpdate: function(value) { that.onSetOpening(value); },
    		perms: ["pr","ev"],
    		format: "UINT8",
    		initialValue: 0,
    		supportEvents: false,
    		supportBonjour: false,
    		manfDescription: "Opening Position",
    		designedMinValue: 0,
    		designedMaxValue: 100,
    		designedMinStep: 1,
    		unit: "%"
			},{
				cType: types.WINDOW_COVERING_OPERATION_STATE_CTYPE,
				onUpdate: null,
				onRead: null, //function(callback) { that.onGetOpening(callback); },
				perms: ["pr", "ev"],
				format: "int",
				initialValue: 0,
				supportEvents: false,
				supportBonjour: false,
				manfDescription: "Window cover operation state",
				designedMinValue: 0,
				designedMaxValue: 2,
				designedMinStep: 1
			}]
    }];
  }
};

module.exports.initializeWithDevice = WindowCovering;
