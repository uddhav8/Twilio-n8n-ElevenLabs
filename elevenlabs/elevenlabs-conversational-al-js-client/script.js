import { Conversation } from '@11labs/client';

const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');

let conversation;

startButton.addEventListener('click', startConversation);
stopButton.addEventListener('click', stopConversation);

window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

async function startConversation() {
    try {
        // Request microphone permission
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            alert('Microphone permission is required for the conversation.');
            return;
        }

        const signedUrl = await getSignedUrl();
        //const agentId = await getAgentId(); // You can switch to agentID for public agents

        // Start the conversation
        conversation = await Conversation.startSession({
            signedUrl: signedUrl,
            //agentId: agentId, // You can switch to agentID for public agents
            onConnect: () => {
                console.log('Connected');
                updateConnectionStatus(true);
                startButton.disabled = true;
                stopButton.disabled = false;
            },
            onDisconnect: () => {
                console.log('Disconnected');
                updateConnectionStatus(false);
                startButton.disabled = false;
                stopButton.disabled = true;
                updateAgentStatus({ mode: 'listening' }); // Reset to listening mode on disconnect
            },
            onError: (error) => {
                console.error('Conversation error:', error);
                alert('An error occurred during the conversation.');
            },
            onModeChange: (mode) => {
                console.log('Mode changed:', mode); // Debug log to see exact mode object
                updateAgentStatus(mode);
            },
        });
    } catch (error) {
        console.error('Failed to start conversation:', error);
        alert('Failed to start conversation. Please try again.');
    }
}

async function stopConversation() {
    if (conversation) {
        await conversation.endSession();
        conversation = null;
    }
}

async function requestMicrophonePermission() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        return true;
    } catch (error) {
        console.error('Microphone permission denied:', error);
        return false;
    }
}

async function getSignedUrl() {
    try {
        const response = await fetch('http://localhost:3001/api/get-signed-url');
        if (!response.ok) throw new Error('Failed to get signed URL: ${response.statusText}');
        //const data = await response.json();
        //return data.signedUrl;
        const { signedUrl } = await response.json();
        return signedUrl;
    } catch (error) {
        console.error('Error getting signed URL:', error);
        throw error;
    }
}

async function getAgentId() {
    const response = await fetch('http://localhost:3001/api/getAgentId');
    const { agentId } = await response.json();
    return agentId;
    //return process.env.agentId;
}

function updateConnectionStatus(isConnected) {
    const connectionStatus = document.getElementById('connectionStatus');
    connectionStatus.textContent = isConnected ? 'Connected' : 'Disconnected';
    connectionStatus.classList.toggle('connected', isConnected);
}

function updateAgentStatus(mode) {
    const agentStatus = document.getElementById('speakingStatus');
    // Update based on the exact mode string we receive
    const isSpeaking = mode.mode === 'speaking';
    agentStatus.textContent = isSpeaking ? 'Agent Speaking' : 'Agent Silent';
    agentStatus.classList.toggle('speaking', isSpeaking);
    console.log('Speaking status updated:', { mode, isSpeaking }); // Debug log
}