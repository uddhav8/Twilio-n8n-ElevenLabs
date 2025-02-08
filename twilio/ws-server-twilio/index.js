// https://www.twilio.com/docs/voice/media-streams/websocket-messages#dtmf-message
// Recieve messages from Twilio and send messages back to twilio
// Listen to Media messages and send them back to twilio.

const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;

// Create a WebSocket server
const wsServer = new WebSocket.Server({ port: PORT });
console.log((new Date()) + `[ws] WebSocket server listening on port ${PORT}`);

wsServer.on('connection', (ws) => {
    console.log(`[ws] New connection from ${ws.remoteAddress}`);
    let streamSid = null; // Keep track of stream ID

    // Handle incoming messages from ws client (Twilio)
    ws.on('error', async (error) => {
        console.error("[ws] WebSocket Error:", error);
    });
    ws.on('message', async (message) => {
        try {
            const msg = JSON.parse(message);
            console.log("[ws] Message recieved");

            switch (msg.event) {
                case "connected":
                    console.log("[Twilio] Stream connected");
                    break;
                case "start":
                    streamSid = msg.start.streamSid
                    console.log("[Twilio] Stream started with ID:", streamSid);
                    break;
                case "media":
                    console.log("[Twilio] Media event received");
                    // Forward audio to bavk to twilio
                    const payload = msg.media.payload;
                    const rawAudio = {
                        event: "media",
                        streamSid,
                        media: {
                            payload: payload,
                        },
                    };
                    ws.send(JSON.stringify(rawAudio));
                    break;
                case "mark":
                        console.log("[Twilio] Mark event received");
                        break;    
                case "dtmf":
                        console.log("[Twilio] DTFM event received.");
                        break;
                case "stop":
                    console.log("[Twilio] Stop event received.");
                    break;
                default:
                    console.warn("[Twilio] Unknown event type received:", msg.event);
                    break;
            }
        } catch (error) {
            console.error("[ERROR] Error parsing Twilio message:", error.message);
        }
    });
    ws.on('close', async () => {
        console.log("[ws] Connection closed");
    });
});