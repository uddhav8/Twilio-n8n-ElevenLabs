// Connect to WSS and send a message.

// Defining constants
const WebSocket = require('ws');
const wsServerAddress = "ws://127.0.0.1:5000"; // Use for localhost.
//const wsServerAddress = "wss://echo-wsserver.glitch.me"; // Switch to this and add your URL for hosted server,

// Connect to WS Server
const ws = new WebSocket(wsServerAddress, {
    headers: {
        "user-agent": "Mozilla"
    }
}) // Glitch.com requires for any incoming calls a user agents specified 

ws.on('open', function () {
    //console.log("WebSocket connection opened");
    
    // Sending a message to the server
    ws.send('Hello from the server!');
});

ws.on('message', function (msg) {
    console.log("Server responded: " + msg);
});
