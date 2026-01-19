var buttonManager = require('buttons');
var network = require('network');

var logButtonEvents = true;

var indentedString = function(lines, padding) {

	if (!lines || lines.length == 0) {
		return "";
	}

	if (padding == undefined) {
		padding = 5;
	}
	var cols = [];
	var wordLengths = [];

	for (var i = 0; i < lines[0].length; i++) {
		cols.push(0);
		wordLengths.push(0);
	}

	for (var i = 0; i < lines.length; i++) {
		var words = lines[i];
		for (var j = 0; j < words.length; j++) { 
			var word = words[j];
			
			if (wordLengths[j] < word.length) {
				wordLengths[j] = word.length;
			}
		}
	}

	for (var i = 0; i < wordLengths.length; i++) {
		cols[i] = wordLengths[i] + padding;
		if (i > 0) {
			cols[i] += cols[i-1];
		}
	}

	var str = "";

	for (var i = 0; i < lines.length; i++) {
		var words = lines[i];
		var lineStr = ""
		for (var j = 0; j < words.length; j++) { 
			var word = words[j];
			if (j == 0) {
				lineStr += word;
			} else {
				var ind = cols[j-1];

				for (var k = lineStr.length; k < ind; k++) {
					lineStr += " ";
				}

				lineStr += word;
			}

		}
		str += lineStr + (i < lines.length-1 ? "\n" : "");
	}

	return str;
};

buttonEventsOn = function() {
	logButtonEvents = true;
	console.log("Button events ON");
	return "NO_PRINT";
}

buttonEventsOff = function() {
	logButtonEvents = false;
	console.log("Button events OFF");
	return "NO_PRINT";
}

buttonManager.on("buttonSingleOrDoubleClickOrHold", function(obj) {

	if (logButtonEvents) {
		var button = buttonManager.getButton(obj.bdaddr);
		var clickType = obj.isSingleClick ? "click" : obj.isDoubleClick ? "double_click" : "hold";
		if (button) {
			console.log(button.bdaddr + " " + button.serialNumber + " " + clickType);
		}
	}

});
	
knownButtons = function() {
	
	var buttons = buttonManager.getButtons();
	
	var buttonsInfo = [];

	if (buttons.length == 0) {
		console.log("No buttons");
	} else {
		console.log("Buttons (" + buttons.length + ")");
		for (var i = 0; i < buttons.length; i++) {
			var button = buttonManager.getButton(buttons[i].bdaddr);

			buttonsInfo.push([button.serialNumber, "bdaddr: " + button.bdaddr, "batteryStatus: " + button.batteryStatus, "connected: " + (button.connected ? "yes" : "no")]);
		}
	}

	var str = indentedString(buttonsInfo);
	if (str) {
		console.log(str);	
	}
	
	
	return "NO_PRINT";
}

var scanWizard = null;
var restartScanAfterComplete = false;

initBulkScan = function() {

	if (scanWizard) {
		console.log("Already scanning");
		return "NO_PRINT";
	}

	console.log("Bulk scan started - Press and hold Flic to pair...");
	
	startScan(true);
	
	return "NO_PRINT";
};

initScan = function() {
	if (scanWizard) {
		console.log("Already scanning");
		return "NO_PRINT";
	}

	console.log("Scan started - Press and hold Flic to pair...");
	
	startScan(false);
	
	return "NO_PRINT";
};

stopScan = function() {
	restartScanAfterComplete = false;
	if (scanWizard) {
		scanWizard.cancel();		
		scanWizard = null;
		console.log("Scan stopped");
	} else {
		console.log("Not scanning");
	}
	


	return "NO_PRINT";
};


var startScan = function(restart) {

	if (restart) {
		restartScanAfterComplete = true;
	} else {
		restartScanAfterComplete = false;
	}

	scanWizard = buttonManager.startScanWizard();

	scanWizard.on("complete", function (bdaddr) {

		var button = buttonManager.getButton(bdaddr);
		console.log("Found button: " + (button && button.serialNumber ? button.serialNumber : bdaddr));		
		
		if (restartScanAfterComplete) {
			startScan(true);	
		} else {
			scanWizard = null;
		}

	});
	
	scanWizard.on("fail", function (err) {
		
		if (
			err != "ButtonIsPrivate" && 
			err != "FailedTimeout" &&
			err != "CancelledByUser"
		) {
			console.log("Bulk scan error: " + err);
		}
		
		if (restartScanAfterComplete) {
			startScan(true);			
		} else {
			scanWizard = null;
		}
	});

	return "NO_PRINT";
};

deleteButton = function(obj) {

	buttonManager.deleteButton(obj.bdaddr);
	console.log("Button deleted");

	return "NO_PRINT";

};

clearAllButtons = function() {


	var buttons = buttonManager.getButtons();

	for (var i = 0; i < buttons.length; i++) {
		var button = buttons[i];
		buttonManager.deleteButton(button.bdaddr);
	}

	console.log("All buttons deleted");

	return "NO_PRINT";
}

wifiScan = function() {

	console.log("Scanning for WiFi networks...");

	setTimeout(function() {
		network.scan(function (err, networks) {
		
			if (err) {
				console.log(err);
			} else {
				var networkInfo = [];
				for (var i = 0; i < networks.length; i++) {
					var network = networks[i];
					var ssid = new TextDecoder().decode(new Uint8Array(network.ssid));
					
					if (ssid) {
						networkInfo.push([ssid, "open: " + (network.open ? "yes" : "no ") + " rssi: " + network.rssi + "dB"]);
					}

				}
				
				var str = indentedString(networkInfo);
				console.log(str);
			}
			
		});
	}, 100);

	return "NO_PRINT";
};

var ssidToString = function(ssid) {
	if (!ssid) {
		return "Unknown";
	}
	var str = "";
	for (var i = 0; i < ssid.length; i++) {
		str += String.fromCharCode(ssid[i]);
	}
	return str;
}

var ssidToByteArray = function(ssid) {

	var ba = new Uint8Array(ssid.length);

	for (var i = 0; i < ssid.length; i++) {
		ba[i] = ssid[i];
	}

	return ba;
}

wifiList = function() {

	var wifis = network.getNetworks();

	if (wifis.length == 0) {
		console.log("No WiFis configured");
		return "NO_PRINT";
	}

	var wifiInfo = [];

	for (var i = 0; i < wifis.length; i++) {
		var wifi = wifis[i];
		
		wifiInfo.push(["ssid: " + ssidToString(wifi.ssid), "open: " + (wifi.open ? "yes" : "no")]);

	}

	console.log(indentedString(wifiInfo));

	


	return "NO_PRINT";
};

wifiClear = function() {

	var wifis = network.getNetworks();	

	for (var i = 0; i < wifis.length; i++) {
		var wifi = wifis[i];

		
		network.removeNetwork(wifi);
	}

	console.log("WiFis cleared");

	return "NO_PRINT";
}

wifiConnect = function(obj) {
	
	console.log("Connecting...");
	
	network.connect(obj, function (err) {
		if (err) {
			console.log("WiFi error: " + err);			
		} else {
			console.log("Connected to " + obj.ssid);			
		}

	});
	
	return "NO_PRINT";	
};

wifiAdd = function(obj) {
	network.addNetwork(obj);
	console.log("Network added");
	
	return "NO_PRINT";	
};


networkState = function() {
	var obj = network.getState();
		
	console.log("Ethernet:");
	console.log("    connected: " + (obj.dhcp.ethernet.connected ? "yes" : "no"));
	console.log("    ip: " + obj.dhcp.ethernet.ip);
	console.log("    mac: " + obj.dhcp.ethernet.mac);
	console.log(" ");
	console.log("WiFi:");
	console.log("    ssid: " + (obj.wifiState.ssid ? ssidToString(obj.wifiState.ssid) : "None"));
	console.log("    connected: " + (obj.dhcp.wifi.connected ? "yes" : "no"));
	console.log("    state: " + obj.wifiState.state);
	console.log("    ip: " + obj.dhcp.wifi.ip);
	console.log("    mac: " + obj.dhcp.wifi.mac);

	
	return "NO_PRINT";	
};



wifiRemove = function(obj) {
	network.removeNetwork(obj);
	console.log("Network removed");
	return "NO_PRINT";
}

exportPairings = function() {
	var buttons = buttonManager.getButtons();

	var pairings = buttons.filter(function (b) {
		return b.serialNumber[0] == 'B';
	}).map(function (b) {
		return {
			"bdaddr": b.bdaddr,
			"color": b.color,
			"firmwareVersion": b.firmwareVersion,
			"uuid": b.uuid,
			"key": b.key,
			"serialNumber": b.serialNumber
		}
	});

	return "EXPORT_PAIRINGS " + JSON.stringify(pairings);
}

importPairings = function(pairings) {
	buttonManager.importFlic2Pairings(pairings, function() {
		console.log("Buttons imported");
	});
	return "NO_PRINT";
}


var inspectObj = function (obj) {
	for (var key in obj) {
		console.log(key + ": " + obj[key]);
	}
}