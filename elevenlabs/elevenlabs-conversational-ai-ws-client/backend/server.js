//require("dotenv").config(); // Same as below
const dotenv = require('dotenv');
dotenv.config();

const WebSocket = require('ws');

// Connect to ElevenLabs Conversational AI WebSocket
const wsElevenLabs = new WebSocket(`wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${process.env.ELEVENLABS_AGENT_ID}`);

// Connect to ElevenLabs Conversational AI WebSocket
//setupElevenLabs()
/*async () => {
    const signedUrl = await getSignedUrl();
    const wsElevenLabs = new WebSocket(signedUrl);

    wsElevenLabs.on("open", () => {
        console.log("[ElevenLabs] Connected to Conversational AI");
    });
};*/

let conversationId = null; // Keep track of conversation ID

// Handle open event for ElevenLabs WebSocket
wsElevenLabs.on("open", () => {
    console.log("[wsElevenLabs] WebSocket connected to ElevenLabs Conversational AI.");
});

// Handle errors from ElevenLabs WebSocket
wsElevenLabs.on("error", (error) => {
    console.error("[wsElevenLabs] WebSocket error:", error);
});

// Handle messages from ElevenLabs
wsElevenLabs.on("message", (message) => {
    try {
        const msg = JSON.parse(message);
        console.log("[wsElevenLabs] Message recieved");
        
        switch (msg.type) {
            case "conversation_initiation_metadata": // Provides initial metadata about the conversation.
                conversationId = msg.conversation_initiation_metadata_event.conversation_id
                console.info("[ElevenLabs] Received conversation initiation metadata: " + msg);
                break;
            case "user_transcript": // Transcriptions of the user’s speech
                //console.info("[ElevenLabs] Received user transcript: " + msg);
                break;
            case "agent_response": // Agent’s textual response
                //console.info("[ElevenLabs] Received agent’s textual response: " + msg);
                break;
            case "audio": // Chunks of the agent’s audio response
                console.info("[ElevenLabs] Received user transcript: " + msg);
                if (msg.audio_event?.audio_base_64) {
                    // Send audio data back to Eleven Labs
                    wsElevenLabs.send(JSON.stringify(user_audio_chunk = msg.audio_event?.audio_base_64));
                }
                break;
            case "interruption": // Indicates that the agent’s response was interrupted
                //console.info("[ElevenLabs] agent’s response was interrupted: " + msg);
                break;
            case "ping": // Server pings to measure latency
                //console.info("[ElevenLabs] agent’s response was interrupted: " + msg);
                // Respond to ping events from ElevenLabs
                if (message.ping_event?.event_id) {
                    const pongResponse = {
                        type: "pong",
                        event_id: message.ping_event.event_id,
                    };
                    wsElevenLabs.send(JSON.stringify(pongResponse));
                }
                break;
            case "client-tool-call": // Initiate client tool call
                //console.info("[ElevenLabs] Initiate client tool call: " + msg);
                break;
            case "client-tool-result": // Response for the client tool call
                //console.info("[ElevenLabs] Response for the client tool call: " + msg);
                break;
            default:
                console.warn("[ElevenLabs] Unknown event type received:", msg.event);
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

// Helper function to get signed URL for authenticated conversations with ElevenLabs
async function getSignedUrl() {
    try {
        const response = await fetch(
            'https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${process.env.AGENT_ID}',
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
        //const { signedUrl } = await response.json();
        //return signedUrl;
    } catch (error) {
        console.error('Error getting signed URL:', error);
        throw error;
    }
}