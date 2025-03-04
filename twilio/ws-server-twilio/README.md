This is a websocket server for Twilio 

1. run cmd at ws-server-twilio foler
2. run command node .
3. WebSocket server is now accessible at localhost:3000
4. To make it accessible to Twilio's website (websocket endpoint client), run ngrok at port 3000
5. now add the provided url in the twilio client (in my case n8n)
    5.1 replace the https:// in the URL with wss://
6. This Twilio client will make HTTPS request to Twilio server and twilio will redirect the call to my this WebSocket server.