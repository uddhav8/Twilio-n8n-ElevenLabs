//const WebSocket = require('ws');
const wsServerAddress = "ws://localhost:3002";

const ws = new WebSocket(wsServerAddress);

const startButton = document.getElementById('startButton').addEventListener("click", startConversation);;
const stopButton = document.getElementById('stopButton').addEventListener("click", stopConversation);

let conversation;

window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

ws.onmessage = (event) => {
    console.log ('message recieved' + event)
    const data = JSON.parse(event.data);
    if (data.audio) {
        playAudio(data.audio);
    }
};

function playAudio(base64Audio) {
    const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
    audio.play().catch((error) => console.error("Audio playback error:", error));
}

// Capture microphone input
async function startConversation() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

    mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
            const arrayBuffer = await event.data.arrayBuffer();
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            ws.send(JSON.stringify({ audio_chunk: base64Audio }));
        }
    };
    
    /*try {
        // Request microphone permission
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            alert('Microphone permission is required for the conversation.');
            return;
        }
    
        //const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(hasPermission, { mimeType: "audio/webm" });

        mediaRecorder.ondataavailable = async (event) => {
            if (event.data.size > 0) {
                const arrayBuffer = await event.data.arrayBuffer();
                const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
                ws.send(JSON.stringify({ audio_chunk: base64Audio }));
            }
        };
    
        mediaRecorder.start(500); // Send audio every 500ms
    } catch (error) {
        console.error('Failed to start conversation:', error);
        alert('Failed to start conversation. Please try again.');
    }*/
}

async function requestMicrophonePermission() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        return true;
    } catch (error) {
        console.error('Error getting Microphone permission:', error);
        return false;
    }
}