// Host a WebSocket server and once Twilio connects with it.
//  Connect Twillio with ElevenLabs and let ElevenLabs play its audio.
// Recieve messages from Twilio and send messages to Eleven Labs
// Listen to Media messages and send them to Eleven Labs.

const WebSocket = require('ws');
require("dotenv").config();

const PORT = process.env.PORT || 3000;

// Create a WebSocket server
const wsServer = new WebSocket.Server({ port: PORT });
console.log((new Date()) + `[ws] WebSocket server listening on port ${PORT}`);

wsServer.on('connection', (ws) => {
    console.log(`[ws] New connection from ${ws.remoteAddress}`);
    let streamSid = null; // Keep track of stream ID
    let callSid = null;
    let customParameters = null;  

    let wsElevenLabs;
    let conversationId = null; // Keep track of conversation ID

    // Set up ElevenLabs connection
    //async function setupElevenLabs() {
    const setupElevenLabs = async () => {
        try {
            // Connect to ElevenLabs Conversational AI WebSocket
            const signedUrl = await getSignedUrl();
            if (!signedUrl) throw new Error("Failed to get signed URL");
            console.log("[wsElevenLabs] Connecting to:", signedUrl);
            //const wsElevenLabs = new WebSocket(`wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${process.env.ELEVENLABS_AGENT_ID}`);
            wsElevenLabs = new WebSocket(signedUrl);

            // Handle errors from ElevenLabs WebSocket
            wsElevenLabs.on("error", (error) => {
                console.error("[wsElevenLabs] WebSocket error:", error);
            });

            // Handle open event for ElevenLabs WebSocket
            wsElevenLabs.on("open", () => {
                console.log("[wsElevenLabs] WebSocket connected to ElevenLabs Conversational AI.");
                console.log("[wsElevenLabs] Sending User Name to Eleven Labs: " + customParameters_user_name);

                // Send required dynamic variables first
                const initMessage = {
                    type: "conversation_initiation",
                    dynamic_variables: {
                        user_name: customParameters_user_name,
                    }
                };

                wsElevenLabs.send(JSON.stringify(initMessage));

                /*// Send an initial silent audio chunk
                setTimeout(() => {
                    if (wsElevenLabs.readyState === WebSocket.OPEN) {
                        console.log("[wsElevenLabs] Sending initial silent audio to keep connection open.");
                        const silentAudio = {
                            type: "audio",
                            user_audio_chunk: "UklGRgAIAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=",
                        };
                        wsElevenLabs.send(JSON.stringify(silentAudio));
                    }
                }, 1000); // Delay to allow connection setup

                // ✅ Add Keep-Alive Ping
                setInterval(() => {
                    if (wsElevenLabs && wsElevenLabs.readyState === WebSocket.OPEN) {
                        console.log("[wsElevenLabs] Sending ping to keep connection alive.");
                        wsElevenLabs.send(JSON.stringify({ type: "ping" }));
                    }
                }, 5000); // Ping every 5 seconds*/
            });

            // Handle messages from ElevenLabs
            wsElevenLabs.on("message", (message) => {
                try {
                    //console.log("[wsElevenLabs] Message recieved: " + message);
                    const msg = JSON.parse(message);
                    switch (msg.type) {
                        case "conversation_initiation_metadata": // Provides initial metadata about the conversation.
                            conversationId = msg.conversation_initiation_metadata_event.conversation_id
                            console.info(`[ElevenLabs] Received conversation initiation metadata - ConversationID: ${conversationId}`);
                            break;
                        case "user_transcript": // Transcriptions of the user’s speech
                            console.info("[ElevenLabs] Received user transcript.");
                            break;
                        case "agent_response": // Agent’s textual response
                            console.info("[ElevenLabs] Received agent’s textual response.");
                            break;
                        case "audio": // Chunks of the agent’s audio response
                            console.info("[ElevenLabs] Received agent's audio response.");
                            if (msg.audio_event?.audio_base_64) {

                                // Send audio data to Twilio
                                const payload = msg.audio_event.audio_base_64;
                                const audioData = {
                                    event: "media",
                                    streamSid,
                                    media: {
                                        payload: payload,
                                    },
                                };
                                ws.send(JSON.stringify(audioData));
                            }
                            break;
                        case "interruption": // Indicates that the agent’s response was interrupted
                            console.info("[ElevenLabs] agent’s response was interrupted.");
                            ws.send(JSON.stringify({ event: "clear", streamSid }));
                            break;
                        case "ping": // Server pings to measure latency
                            console.info("[ElevenLabs] agent’s response was interrupted.");
                            // Respond to ping events from ElevenLabs
                            if (msg.ping_event?.event_id) {
                                const pongResponse = {
                                    type: "pong",
                                    event_id: msg.ping_event?.event_id,
                                };
                                wsElevenLabs.send(JSON.stringify(pongResponse));
                            }
                            break;
                        case "client-tool-call": // Initiate client tool call
                            console.info("[ElevenLabs] Initiate client tool call.");
                            break;
                        case "client-tool-result": // Response for the client tool call
                            console.info("[ElevenLabs] Response for the client tool call.");
                            break;
                        default:
                            console.warn("[ElevenLabs] Unknown event type received:", msg.type);
                            break;
                    }
                } catch (error) {
                    console.error("[ERROR] Error parsing Eleven Labs message:", error);
                }
            });

            // Handle close event for ElevenLabs WebSocket
            wsElevenLabs.on("close", (event, code, reason) => {
                console.log(`[wsElevenLabs] Connection closed. Event: ${event}, Code: ${code}, Reason: ${reason}`);
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            });
        } catch (error) {
            console.error("[ERROR] Failed to set up ElevenLabs WebSocket:", error);
        }
    };

    // Start the WebSocket connection to ElevenLabs
    setupElevenLabs();

    // Handle incoming messages from ws client (Twilio)
    ws.on('error', async (error) => {
        console.error("[ws] WebSocket Error:", error);
        //wsElevenLabs.close();
    });

    ws.on('message', async (message) => {
        //console.log("[ws] Received message:", message);  // Log full message
        try {
            const msg = JSON.parse(message);
            //console.log("[ws] Message recieved" + msg.event);

            switch (msg.event) {
                case "connected":
                    console.log("[Twilio] Stream connected");
                    break;
                case "start":
                    streamSid = msg.start.streamSid;
                    callSid = msg.start.callSid;
                    customParameters = msg.start.customParameters || {};  // Ensure it's an object
                    customParameters_user_name = customParameters.user_name || "Unknown";  // Store parameters

                    console.log(`[Twilio] Stream started - StreamSid: ${streamSid}, CallSid: ${callSid}`);
                    console.log("[Twilio] Custom Parameters:", customParameters);  // Log full object
                    console.log(`[Twilio] Extracted User Name: ${customParameters_user_name}`);
                    break;
                case "media":
                    //console.log("[Twilio] Media event received");

                    // Route audio from Twilio to ElevenLabs
                    if (wsElevenLabs && wsElevenLabs.readyState === WebSocket.OPEN) {
                        // msg.media.payload is base64 encoded
                        const rawAudio = {
                            user_audio_chunk: Buffer.from(
                                msg.media.payload,
                                "base64"
                            ).toString("base64"),
                        };
                        wsElevenLabs.send(JSON.stringify(rawAudio));
                    } else {
                        console.warn("[Twilio] wsElevenLabs is not ready. Skipping media event.");
                    }
                    break;
                case "mark":
                        console.log("[Twilio] Mark event received");
                        break;    
                case "dtmf":
                        console.log("[Twilio] DTFM event received.");
                        break;
                case "stop":
                    console.log("[Twilio] Stop event received.");
                    // Close ElevenLabs WebSocket when Twilio stream stops
                    wsElevenLabs.close();
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
        if (wsElevenLabs && wsElevenLabs.readyState === WebSocket.OPEN) {
            wsElevenLabs.close();
          }
    });
});

// Helper function to get signed URL for authenticated conversations
async function getSignedUrl() {
    try {
        const response = await fetch('http://localhost:3001/api/get-signed-url');
        if (!response.ok) throw new Error(`Failed to get signed URL: ${response.statusText}`);
        const data = await response.json();
        console.log("[server] Signed URL Response:", data); // Debugging output
        return data.signedUrl;
    } catch (error) {
        console.error('Error getting signed URL:', error);
        throw error;
    }
};