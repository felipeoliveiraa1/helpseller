/// <reference lib="dom" />

let mediaStream = null;
let mediaRecorder = null;

// Remote logging for easier debugging
function log(...args) {
    console.log(...args);
    chrome.runtime.sendMessage({
        type: 'OFFSCREEN_LOG',
        message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')
    }).catch(() => { });
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'INIT_RECORDING') {
        log('📩 INIT_RECORDING received');
        startTranscription(message.streamId);
    } else if (message.type === 'STOP_RECORDING') {
        log('📩 STOP_RECORDING received');
        stopTranscription();
    }
});

// Signal that we are ready to receive messages
chrome.runtime.sendMessage({ type: 'OFFSCREEN_READY' }).catch(() => { });

async function startTranscription(streamId) {
    try {
        log('🎤 Starting dual audio capture with streamId:', streamId);

        // 1. Capture Tab Audio
        const tabStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                mandatory: {
                    chromeMediaSource: 'tab',
                    chromeMediaSourceId: streamId
                }
            },
            video: false
        });
        log('✅ Tab audio captured');

        // 2. Capture Microphone Audio
        let micStream;
        try {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            log('✅ Microphone capture successful');
        } catch (err) {
            log('⚠️ Microphone access denied:', err.message);
        }

        // 3. Mix Streams
        let finalStream = tabStream;
        if (micStream) {
            const audioContext = new AudioContext();
            const tabSource = audioContext.createMediaStreamSource(tabStream);
            const micSource = audioContext.createMediaStreamSource(micStream);
            const destination = audioContext.createMediaStreamDestination();

            tabSource.connect(destination);
            micSource.connect(destination);

            await audioContext.resume();
            finalStream = destination.stream;
            log('✅ Audio streams mixed (Tab + Mic)');
        }

        mediaStream = finalStream;

        // 4. Setup MediaRecorder with Fallbacks
        const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
        let supportedType = '';
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                supportedType = type;
                break;
            }
        }

        log('📋 Using mimeType:', supportedType || 'default');
        mediaRecorder = new MediaRecorder(mediaStream, supportedType ? { mimeType: supportedType } : {});

        mediaRecorder.ondataavailable = async (event) => {
            if (event.data.size > 0) {
                // Legacy path: do not send AUDIO_CHUNK (invalid WebM when concatenated).
                // Transcription uses AUDIO_SEGMENT from the main offscreen (src/offscreen).
            }
        };

        mediaRecorder.start(3000); // 3 second chunks
        log('🚀 MediaRecorder started with 3s interval');

    } catch (err) {
        console.error('❌ Failed to start dual capture:', err);
        chrome.runtime.sendMessage({
            type: 'TRANSCRIPTION_ERROR',
            error: err.message
        }).catch(e => console.error('Error sending error message:', e));
    }
}

function stopTranscription() {
    console.log('Stopping transcription...');

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder = null;
    }

    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }

    console.log('✅ Transcription stopped');
}
