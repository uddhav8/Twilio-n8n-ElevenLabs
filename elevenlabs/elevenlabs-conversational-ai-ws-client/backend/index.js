const WebSocket = require('ws');
//require("dotenv").config(); // Same as below
const dotenv = require('dotenv');
dotenv.config();

const express = require("express");
const app = express();
const server = require("http").createServer(app);

// WebSocket server for frontend clients
const wssFrontend = new WebSocket.Server({ server });

/*const mic = require("mic");
const fs = require("fs");
const path = require("path");
const player = require("play-sound");
const fetch = require("node-fetch");
const { channel } = require('diagnostics_channel');*/

const {ELEVENLABS_AGENT_ID} = process.env;

// Check for the required ElevenLabs Agent ID
if (!ELEVENLABS_AGENT_ID) {
    console.error("Missing ELEVENLABS_AGENT_ID in environment variables");
    process.exit(1);
};

let wsElevenLabs;
let conversationId = null; // Keep track of conversation ID

/*const micInstance = mic({
    rate: "16000",
    channels: "1",
    encoding: "wav",
});

// 🎤 Start recording
micInstance.start();*/
// Start the WebSocket connection
setupElevenLabs();

// Start the server
const PORT = 3000; // WebSocket server for frontend
server.listen(PORT, () => console.log(`WebSocket server running on ws://localhost:${PORT}`));

//const micInputStream = micInstance.getAudioStream();

async function setupElevenLabs() {
    try {
        // Connect to ElevenLabs Conversational AI WebSocket
        const signedUrl = await getSignedUrl();
        if (!signedUrl) throw new Error("Failed to get signed URL");
        //const wsElevenLabs = new WebSocket(`wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${process.env.ELEVENLABS_AGENT_ID}`);

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
                            // Broadcast audio data to all frontend clients
                            wssFrontend.clients.forEach((client) => {
                                if (client.readyState === WebSocket.OPEN) {
                                    client.send(JSON.stringify({ audio: msg.audio_event.audio_base_64 }));
                                }
                            });
                            
                            //playAudio(msg.audio_event.audio_base_64);

                            // Send audio data back to Eleven Labs
                            //wsElevenLabs.send(JSON.stringify(user_audio_chunk = msg.audio_event?.audio_base_64));
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

        // Handle microphone input from frontend
        wssFrontend.on("connection", (client) => {
            console.log("[Frontend] Client connected.");

            client.on("message", (message) => {
                try {
                    const data = JSON.parse(message);
                    if (data.audio_chunk) {
                        console.log("[Frontend] Received audio from user, forwarding to ElevenLabs.");
                        wsElevenLabs.send(JSON.stringify({ audio_chunk: data.audio_chunk }));
                    }
                } catch (error) {
                    console.error("[ERROR] Error processing client message:", error);
                }
            });

            client.on("close", () => {
                console.log("[Frontend] Client disconnected.");
            });
        });

        /*// 🎤 Start recording and send to ElevenLabs
        micInputStream.on("data", (data) => {
            console.log("[Microphone] Captured audio chunk...");
            const base64Audio = data.toString("base64");

            if (wsElevenLabs.readyState === WebSocket.OPEN) {
                wsElevenLabs.send(
                    JSON.stringify({
                    type: "user_audio_chunk",
                    conversation_id: conversationId,
                    audio_chunk: base64Audio,
                    })
                );
            }
        });*/
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

/*// 🎵 Function to play AI audio response
function playAudio(base64Audio) {
    const audioBuffer = Buffer.from(base64Audio, "base64");
    const filePath = path.join(__dirname, "response.mp3");

    fs.writeFileSync(filePath, audioBuffer);
    console.log(`[Audio] Playing AI response...`);

    player.play(filePath, (err) => {
        if (err) console.error("[Audio] Error playing file:", err);
    });
}*/