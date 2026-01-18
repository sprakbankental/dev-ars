import paho.mqtt.client as mqtt
import json
import datetime
import os

timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
folder = "data"

# make folder for button click data
os.makedirs(folder, exist_ok=True)

FILE_PATH = os.path.join(folder, f"button_press_data_{timestamp}.json")

# The callback for when the client receives a CONNACK response from the server. (when the client connects to the broker)
def on_connect(client, userdata, flags, reason_code, properties):
		print(f"Connected with result code {reason_code}")
		print("Type 'reset' to reset the timer for 'elapsedTime'.")
		with open(FILE_PATH, 'a') as f:
						f.write(json.dumps("Keep in mind that the recorded timestamp is 1 hour early.") + "\n")
		# Subscribing in on_connect() means that if we lose the connection and
		# reconnect then subscriptions will be renewed.
		client.subscribe("flic/button")

# The callback for when a PUBLISH message is received from the server.
def on_message(client, userdata, msg):
		try:
				button_data = json.loads(msg.payload.decode("utf-8"))
				with open(FILE_PATH, 'a') as f:
						f.write(json.dumps(button_data) + "\n")
				print("Button press data saved:", button_data)
		except Exception as e:
				print("Error processing message:", e)

# create an MQTT client instance and assign callbacks
mqttc = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
mqttc.on_connect = on_connect
mqttc.on_message = on_message

# connect to broker
mqttc.connect("test.mosquitto.org", 1883, 60)

# Blocking call that processes network traffic, dispatches callbacks and
# handles reconnecting.
# Other loop*() functions are available that give a threaded interface and a
# manual interface.
# this part is for functioning without timer reset
# mqttc.loop_forever() # starts the MQTT client loop to listen for messages

# for reset timer
# start network loop in a background thread
mqttc.loop_start()

# allow terminal input to send commands
while True:
		command = input()
		if command.strip().lower() == "reset":
				mqttc.publish("flic/reset", "reset")
				print("Reset command sent!")
