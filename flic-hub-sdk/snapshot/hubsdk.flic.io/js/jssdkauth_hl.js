//document.write("starting... ");
var jssdk_scrypt = null;
var jssdk_ = new Promise(function(resolve) {
	JsSDKAuth().then(Module => {
		function stringToUint8Array(str) {
			if (TextEncoder) {
				return new TextEncoder('utf-8').encode(str);
			}
			var str = unescape(encodeURIComponent(str)),
			charList = str.split(''),
			uintArray = [];
			for (var i = 0; i < charList.length; i++) {
				uintArray.push(charList[i].charCodeAt(0));
			}
			return new Uint8Array(uintArray);
		}
		function uint8ArrayToString(uint8Array) {
			if (TextDecoder) {
				return new TextDecoder('utf-8').decode(uint8Array);
			}
			var str = '';
			for (var i = 0; i < arr.length; i++) {
				str += String.fromCharCode(arr[i]);
			}
			return decodeURIComponent(escape(str));
		}
		
		function scrypt(passwordStr, salt) {
			var password = stringToUint8Array(passwordStr);
			//var salt = new Uint8Array(16);
			//window.crypto.getRandomValues(salt);

			//console.log(performance.now() + " starting");
			var retPtr = Module.ccall('scrypt', 'number', ['array', 'number', 'array'], [password, password.length, salt]);
			//console.log(performance.now());
			var ret = Module.HEAPU8.slice(retPtr, retPtr + 64);
			//console.log("auth " + ret);
			//document.write("done scrypt");
			return ret;
		}

		jssdk_scrypt = scrypt;

		//console.log(performance.now());
		function cpake(secretKey, w, serverEncryptedPublicKey) {
			var randomSeed = new Uint8Array(64);
			window.crypto.getRandomValues(randomSeed);
			var ret = Module.ccall('crypto_cpake_client1', 'number', ['array','array','array','array'], [secretKey, w, serverEncryptedPublicKey, randomSeed]);
			var ret1 = Module.HEAPU8.subarray(ret, ret + 2*32 + 32);
			var ret2 = Module.HEAPU8.subarray(ret + 2*32 + 32, ret + 2*32 + 32 + 32);
			//console.log(performance.now());
			//console.log(ret1);
			//document.write("auth COMPLETE");
			return [ret1, ret2];
		}
		
		function cpake2(sharedSecretRaw, verifier) {
			var ret = Module.ccall('crypto_cpake_client2', 'number', ['array','array'], [sharedSecretRaw, verifier]);
			if (!ret) return null;
			var ret1 = Module.HEAPU8.subarray(ret, ret + 32);
			return ret1;
			//console.log(performance.now());
			//console.log(ret1);
			//document.write("auth COMPLETE");
		}
		
		function derive_key(firstChar, sharedSecret) {
			var ret = Module.ccall('derive_key', 'number', ['number', 'array'], [firstChar, sharedSecret]);
			return Module.HEAPU8.slice(ret, ret + 32);
		}
		
		function writeInt(b, pos, i) { b[pos + 3] = i >>> 24; b[pos + 2] = i >>> 16; b[pos + 1] = i >>> 8; b[pos + 0] = i; }
		function writeLong(b, pos, high, low) { writeInt(b, pos + 4, high); writeInt(b, pos, low); }
		
		function EncMac(ctrKey, macKey) {
			var counterHigh = 0, counterLow = 0;
			function increaseCounter() {
				if (++counterLow >>> 0 == 0) {
					++counterHigh;
				}
			}
			function enc(data) {
				var ch = counterHigh, cl = counterLow;
				increaseCounter();
				var keyPtr = Module._malloc(48);
				Module.HEAPU8.set(ctrKey, keyPtr);
				Module.HEAPU8.set(macKey, keyPtr + 32);
				var noncePtr = Module._malloc(16);
				writeLong(Module.HEAPU8, noncePtr + 8, ch, cl);
				writeLong(Module.HEAPU8, noncePtr, 0, 0);
				var dataPtr = Module._malloc(data.length + 16);
				Module.HEAPU8.set(data, dataPtr);
				Module._encrypt_and_sign(keyPtr, noncePtr, dataPtr, data.length);
				var ret = Module.HEAPU8.slice(dataPtr, dataPtr + data.length + 16);
				Module._free(dataPtr);
				Module._free(noncePtr);
				Module._free(keyPtr);
				return ret;
			}
			function dec(data) {
				var ch = counterHigh, cl = counterLow;
				increaseCounter();
				var keyPtr = Module._malloc(48);
				Module.HEAPU8.set(ctrKey, keyPtr);
				Module.HEAPU8.set(macKey, keyPtr + 32);
				var noncePtr = Module._malloc(16);
				writeLong(Module.HEAPU8, noncePtr + 8, ch, cl);
				writeLong(Module.HEAPU8, noncePtr, 0, 0);
				var dataPtr = Module._malloc(data.length);
				Module.HEAPU8.set(data, dataPtr);
				var ok = Module._verify_and_decrypt(keyPtr, noncePtr, dataPtr, data.length);
				var ret = ok ? Module.HEAPU8.slice(dataPtr, dataPtr + data.length - 16) : null;
				Module._free(dataPtr);
				Module._free(noncePtr);
				Module._free(keyPtr);
				return ret;
			}
			this.encrypt = enc;
			this.decrypt = dec;
		}
		
		window.EncMac = EncMac;
		
		function Client(passwordRequestFn, sendFn, authComplete, onDecryptedMessage) {
			var STATE_NONE = 0;
			var STATE_REQUESTING_PASSWORD = 2;
			var STATE_WAIT_VERIFIER = 3;
			var STATE_AUTHENTICATED = 4;
			var STATE_FAILED = 5;
			var secretKey;
			var sharedSecretRaw;
			var saltSaved;
			var wSaved;
			
			var state = STATE_NONE;
			var decryptor;
			var encryptor;
			
			this.onMessage = function onMessage(uint8Array) {
				if (state == STATE_NONE) {
					if (uint8Array.length != 16 + 32) {
						console.log("invalid length1");
						state = STATE_FAILED;
						return;
					}
					var salt = uint8Array.slice(0, 16);
					var serverEncryptedPublicKey = uint8Array.slice(16, 16 + 32);
					state = STATE_REQUESTING_PASSWORD;
					passwordRequestFn(salt, function(passwordStr, w) {
						if (state != STATE_REQUESTING_PASSWORD) {
							return;
						}
						if (passwordStr) {
							w = scrypt(passwordStr, salt);
							w[63] &= 0x7f;
						}
						saltSaved = salt;
						wSaved = w;
						secretKey = new Uint8Array(32);
						window.crypto.getRandomValues(secretKey);
						var res = cpake(secretKey, w, serverEncryptedPublicKey);
						var toSend = res[0];
						sharedSecretRaw = res[1];
						state = STATE_WAIT_VERIFIER;
						sendFn(toSend);
					});
					return;
				} else if (state == STATE_WAIT_VERIFIER) {
					if (uint8Array.length != 16) {
						console.log("invalid length2");
						state = STATE_FAILED;
						return;
					}
					var sharedSecret = cpake2(sharedSecretRaw, uint8Array);
					if (!sharedSecret) {
						state = STATE_FAILED;
						authComplete(false);
					} else {
						decryptor = new EncMac(derive_key('A'.charCodeAt(0), sharedSecret),
							derive_key('C'.charCodeAt(0), sharedSecret).slice(0, 16));
						encryptor = new EncMac(derive_key('B'.charCodeAt(0), sharedSecret),
							derive_key('D'.charCodeAt(0), sharedSecret).slice(0, 16));
						
						state = STATE_AUTHENTICATED;
						authComplete(true, saltSaved, wSaved);
						saltSaved = null;
						wSaved = null;
					}
				} else if (state == STATE_AUTHENTICATED) {
					var decrypted = decryptor.decrypt(uint8Array);
					if (decrypted !== null) {
						onDecryptedMessage(uint8ArrayToString(decrypted));
					}
					
				}
			}
			
			this.sendMessage = function sendMessage(str) {
				var uint8Array = stringToUint8Array(str);
				if (state == STATE_AUTHENTICATED) {
					var encrypted = encryptor.encrypt(uint8Array);
					sendFn(encrypted);
				}
			};
		}
		
		resolve(Client);
	});
});

function JsSDKAuthClient(passwordRequestFn, sendFn, authComplete, onDecryptedMessage) {
	var client = jssdk_.then(Client => {
		return new Client(passwordRequestFn, sendFn, authComplete, onDecryptedMessage);
	});
	
	this.onMessage = function onMessage(uint8Array) {
		client.then(client => client.onMessage(uint8Array));
	};
	this.sendMessage = function sendMessage(str) {
		client.then(client => client.sendMessage(str));
	};
}
