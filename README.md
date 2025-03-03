# dev-ars
ARS software and related materials, temporary dev repo

## How to get Alena's code to work

1. Log in to the Flic Hub SDK (you will also need the phone Flic app for this)  
2. Copy the contents of the Flic Hub SDK module folder from this repo into a module in the Flic Hub SDK  
   (If you are using the same hub I used, it is possible everything is already there)  
3. Run the module on the Flic Hub SDK  
   (This connects to the Flic Hub and sends button click information to an MQTT server)  
5. Run get_button_clicks.py on your machine  
   (This subscribes to the same topic on the MQTT server where the button clicks are being published and records the button click information into a JSON file)  
4. Test the clickers and look at the output data  
5. Modify and test more as you see fit  

There is some delay, based on what you want to do you might need to measure the exact delay + see if the delay is consistent or not.

Resources I used to get this to work (in case you need them):

https://github.com/50ButtonsEach/flic-hub-sdk-mqtt-js

https://pypi.org/project/paho-mqtt/
