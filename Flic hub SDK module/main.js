var mqtt = require("./mqtt").create("test.mosquitto.org", { // Change this if you need to use another MQTT broker
		client_id: "your_client_id", // Optional: a unique client id
		keep_alive: 60,              // Optional: keep alive time in seconds
		port: 1883,                  // Optional: MQTT broker port (default 1883)
		clean_session: true,         // Optional: whether to use a clean session
		//username: "your_username",   // Optional: username (if your broker requires it)
		//password: "your_password",   // Optional: password (if your broker requires it)
		protocol_name: "MQTT",       // Optional: protocol name
		protocol_level: 4            // Optional: protocol level
});

var startTime = new Date(); // This will hold the time when you start the experiment

// Function to reset the timer when the synthesized speech starts
function resetTimer() {
		startTime = new Date();
		console.log("Timer reset at: " + startTime.toISOString());
}

// Function to get the elapsed time
function formatElapsedTime(ms) {
		var totalSeconds = Math.floor(ms / 1000);
		var hours = Math.floor(totalSeconds / 3600);
		var minutes = Math.floor((totalSeconds % 3600) / 60);
		var seconds = totalSeconds % 60;
		return (
				String(hours).padStart(2, '0') + ':' +
				String(minutes).padStart(2, '0') + ':' +
				String(seconds).padStart(2, '0')
		);
}

// When connected, subscribe to a topic
mqtt.on('connected', function() {
		console.log("Connected to MQTT broker.");
		mqtt.subscribe("flic/button"); // Subscribe to button presses
		mqtt.subscribe("flic/reset")
});

// Handle incoming messages
mqtt.on('publish', function(pub) {
	if (pub.topic == "flic/reset") {
		console.log("Resetting timer.");
		resetTimer();
		return;
	}

		console.log("Received message:");
		console.log("Topic: " + pub.topic);
		console.log("Message: " + pub.message);
});

// Log disconnections
mqtt.on('disconnected', function() {
		console.log("Disconnected from MQTT broker.");
		// Optionally, try to reconnect:
		mqtt.connect();
});

// Handle errors and try to reconnect after a short delay
mqtt.on('error', function(err) {
		console.log("MQTT error:", err);
		setTimeout(function() {
				mqtt.connect();
		}, 1000);
});

// Example: function to publish a message
function publishMessage(buttonId, pressTime, clickType) {
		var topic = "flic/button";
		var elapsedMs = startTime ? new Date(pressTime) - startTime : null;
		var elapsedTime = elapsedMs !== null ? formatElapsedTime(elapsedMs) : null;
		// Create a message object that includes the event and timestamp
		var messageObj = {
				event: "Button pressed!",
				button: buttonId,
				pressTimestamp: pressTime, // Using the timestamp from the event
				elapsedTime: elapsedTime,
				click: clickType

		};

		// Convert the object to a JSON string
		var message = JSON.stringify(messageObj);
		mqtt.publish(topic, message);
}
// Assuming you have a button event from your hardware
var buttonManager = require("buttons");

buttonManager.on("buttonSingleOrDoubleClickOrHold", function(obj) {
		// Retrieve the button object using its bdaddr
		var button = buttonManager.getButton(obj.bdaddr);
		// Use button.serialNumber if available or fallback to bdaddr
		var buttonId = button.serialNumber || obj.bdaddr;
		var pressTime = new Date().toISOString();

		// Optionally, you can also determine the click type:
		var clickType = obj.isSingleClick ? "single" :
										obj.isDoubleClick ? "double" : "hold";

		// Log additional information if needed
		console.log("Button " + buttonId + " pressed with a " + clickType + " click.");

		// Publish a message including the button identifier
		publishMessage(buttonId, pressTime, clickType);
});



// Now call connect() to initiate the connection
mqtt.connect();
