// Echo + Broadcast WebSocket Server.
// Client can connect and send messages back to them.
// Server will broadcast messages to all connected clients when a new message recieved on the server. 

// Defining constants
const WebSocket = require('ws');

const PORT = 5000;

// WebSocket server setup
const wsServer = new WebSocket.Server({port: PORT});

console.log ((new Date()) + "Serve is listening on port " + PORT);

// Function will be executed whenever a client connects to the server
// Client connecting to the server is an object that is called a socket 
wsServer.on('connection', function (socket) {
  console.log('Client connected');
  
  // Function to handle incoming socket
  socket.on('message', function (msg) {
    console.log('Received message from client: '+ msg);
    // Handle the incoming message here
    socket.send('Client message: ' + msg);

    // Broadcast this message to all connected clients
    wsServer.clients.forEach(function (client) {
        if (client !== socket) {
          client.send("Incoming Broadcast:" + msg);
      }
    });
  });
});