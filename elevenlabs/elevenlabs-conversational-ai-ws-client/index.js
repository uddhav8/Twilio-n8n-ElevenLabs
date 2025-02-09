const WebSocket = require('ws');

//require("dotenv").config(); // Same as below
const dotenv = require('dotenv');
dotenv.config();

const {ELEVENLABS_AGENT_ID} = process.env;

// Check for the required ElevenLabs Agent ID
if (!ELEVENLABS_AGENT_ID) {
    console.error("Missing ELEVENLABS_AGENT_ID in environment variables");
    process.exit(1);
};

let wsElevenLabs;
let conversationId = null; // Keep track of conversation ID

// Start the WebSocket connection
setupElevenLabs();

async function setupElevenLabs() {
    try {
        // Connect to ElevenLabs Conversational AI WebSocket
        //const wsElevenLabs = new WebSocket(`wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${process.env.ELEVENLABS_AGENT_ID}`);
        const signedUrl = await getSignedUrl();
        if (!signedUrl) throw new Error("Failed to get signed URL");

        wsElevenLabs = new WebSocket(signedUrl);

        // Handle errors from ElevenLabs WebSocket
        wsElevenLabs.on("error", (error) => {
            console.error("[wsElevenLabs] WebSocket error:", error);
        });

        // Handle open event for ElevenLabs WebSocket
        wsElevenLabs.on("open", () => {
            console.log("[wsElevenLabs] WebSocket connected to ElevenLabs Conversational AI.");
        });

        // Handle messages from ElevenLabs
        wsElevenLabs.on("message", (message) => {
            try {
                console.log("[wsElevenLabs] Message recieved: " + message);
                const msg = JSON.parse(message);
                switch (msg.type) {
                    case "conversation_initiation_metadata": // Provides initial metadata about the conversation.
                        conversationId = msg.conversation_initiation_metadata_event.conversation_id
                        console.info("[ElevenLabs] Received conversation initiation metadata.");
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
                            // Send audio data back to Eleven Labs
                            wsElevenLabs.send(JSON.stringify(user_audio_chunk = msg.audio_event?.audio_base_64));
                        }
                        break;
                    case "interruption": // Indicates that the agent’s response was interrupted
                        console.info("[ElevenLabs] agent’s response was interrupted.");
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
        wsElevenLabs.on("close", () => {
            console.log("[wsElevenLabs] Connection closed.");
        });
    } catch (error) {
        console.error("[ERROR] Failed to set up ElevenLabs WebSocket:", error);
    }
}

/*// Helper function to get signed URL for authenticated conversations with ElevenLabs
async function getSignedUrl() {
    try {
        const response = await fetch(
            'https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${process.env.ELEVENLABS_AGENT_ID}',
            {
                method: 'GET',
                headers: {
                  'xi-api-key': process.env.ELEVENLABS_API_KEY
                }
            }
        );
        if (!response.ok) throw new Error('Failed to get signed URL: ${response.statusText}');
        const data = await response.json();
        return data.signedUrl;
    } catch (error) {
        console.error('Error getting signed URL:', error);
        throw error;
    }
};*/

async function getSignedUrl() {
    try {
        const response = await fetch('http://localhost:3001/api/get-signed-url');
        if (!response.ok) throw new Error(`Failed to get signed URL: ${response.statusText}`);
        const data = await response.json();
        return data.signedUrl;
    } catch (error) {
        console.error('Error getting signed URL:', error);
        throw error;
    }
};