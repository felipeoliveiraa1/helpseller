/// <reference lib="dom" />

let mediaStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;
let audioContext: AudioContext | null = null;
let playbackContext: AudioContext | null = null;
let isRecording = false;

const RECORDING_INTERVAL_MS = 3000; // 3 seconds per segment

function log(...args: any[]) {
    console.log(...args);
    chrome.runtime.sendMessage({
        type: 'OFFSCREEN_LOG',
        message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
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

async function startTranscription(streamId: string) {
    if (isRecording) {
        log('⚠️ Already recording, stopping previous session...');
        stopTranscription();
    }

    try {
        // === 1. Capture Tab Audio ===
        log('🎤 Capturing tab audio...');
        let tabStream: MediaStream | null = null;

        try {
            tabStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: {
                        chromeMediaSource: 'tab',
                        chromeMediaSourceId: streamId
                    }
                } as any,
                video: false
            });
            log('✅ Tab audio captured');
        } catch (errA: any) {
            log('⚠️ Tab capture method A failed:', errA.message);
            // Fallback method
            tabStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    // @ts-ignore
                    chromeMediaSource: 'tab',
                    chromeMediaSourceId: streamId
                },
                video: false
            });
            log('✅ Tab audio captured (fallback)');
        }

        if (!tabStream) throw new Error('Failed to acquire tab stream');

        // === 2. Route tab audio back to speakers ===
        playbackContext = new AudioContext();
        const tabPlayback = playbackContext.createMediaStreamSource(tabStream);
        tabPlayback.connect(playbackContext.destination);
        await playbackContext.resume();
        log('🔊 Tab audio routed back to speakers');

        // === 3. Capture Microphone (optional) ===
        let micStream: MediaStream | null = null;
        try {
            micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            log('✅ Microphone captured');
        } catch (err: any) {
            log('⚠️ Microphone unavailable:', err.message);
        }

        // === 4. Mix Streams ===
        let finalStream: MediaStream;
        if (micStream) {
            audioContext = new AudioContext();
            const tabSource = audioContext.createMediaStreamSource(tabStream);
            const micSource = audioContext.createMediaStreamSource(micStream);
            const destination = audioContext.createMediaStreamDestination();
            tabSource.connect(destination);
            micSource.connect(destination);
            await audioContext.resume();
            finalStream = destination.stream;
            log('✅ Streams mixed (Tab + Mic)');
        } else {
            finalStream = tabStream;
            log('✅ Using tab audio only');
        }

        mediaStream = finalStream;
        isRecording = true;

        // === 5. Detect supported mimeType ===
        const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
            .find(type => MediaRecorder.isTypeSupported(type)) || '';
        log('📋 Using mimeType:', mimeType || 'default');

        // === 6. Setup Volume Analysis for Silence Detection & Diarization ===
        // We need TWO analysers: one for Tab (Lead), one for Mic (Seller)

        let tabAnalyser: AnalyserNode | null = null;
        let micAnalyser: AnalyserNode | null = null;
        const analysisContext = audioContext || new AudioContext();

        // Setup Tab Analyser
        if (tabStream) {
            tabAnalyser = analysisContext.createAnalyser();
            tabAnalyser.fftSize = 2048;
            const source = analysisContext.createMediaStreamSource(tabStream);
            source.connect(tabAnalyser);
        }

        // Setup Mic Analyser (if available)
        if (micStream) {
            micAnalyser = analysisContext.createAnalyser();
            micAnalyser.fftSize = 2048;
            const source = analysisContext.createMediaStreamSource(micStream);
            source.connect(micAnalyser);
        }

        // === 7. Start recording cycle (Stop/Restart approach) ===
        startRecordingCycle(finalStream, mimeType, tabAnalyser, micAnalyser);

        chrome.runtime.sendMessage({ type: 'RECORDING_STARTED' }).catch(() => { });

    } catch (err: any) {
        log('❌ Failed to start:', err.name, err.message, err.stack);
        chrome.runtime.sendMessage({
            type: 'TRANSCRIPTION_ERROR',
            error: `${err.name}: ${err.message}`
        }).catch(() => { });
    }
}

function startRecordingCycle(stream: MediaStream, mimeType: string, tabAnalyser: AnalyserNode | null, micAnalyser: AnalyserNode | null) {
    // Creates a new MediaRecorder, records for N seconds,
    // stops, sends the complete blob, and restarts

    function getAudioLevel(analyser: AnalyserNode | null): number {
        if (!analyser) return 0;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        // Calculate RMS
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i] * data[i];
        }
        return Math.sqrt(sum / data.length);
    }

    function recordSegment() {
        if (!isRecording) return;

        const recorder = new MediaRecorder(
            stream,
            mimeType ? { mimeType } : {}
        );

        const chunks: Blob[] = [];

        // Volume tracking for both channels
        let maxTabLevel = 0;
        let maxMicLevel = 0;
        let tabEnergy = 0;
        let micEnergy = 0;
        let samples = 0;

        // Sample audio level during recording
        const volumeChecker = setInterval(() => {
            const tabLevel = getAudioLevel(tabAnalyser);
            const micLevel = getAudioLevel(micAnalyser);

            if (tabLevel > maxTabLevel) maxTabLevel = tabLevel;
            if (micLevel > maxMicLevel) maxMicLevel = micLevel;

            tabEnergy += tabLevel;
            micEnergy += micLevel;
            samples++;
        }, 100);

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        recorder.onstop = async () => {
            clearInterval(volumeChecker);

            if (chunks.length === 0) {
                if (isRecording) recordSegment();
                return;
            }

            // Determine Dominant Speaker
            // We use average energy (more robust than max)
            const avgTab = samples > 0 ? tabEnergy / samples : 0;
            const avgMic = samples > 0 ? micEnergy / samples : 0;

            // Adjusted threshold: User requested 5 (Balanced).
            const SILENCE_THRESHOLD = 5;
            const maxLevel = Math.max(maxTabLevel, maxMicLevel);

            if (maxLevel < SILENCE_THRESHOLD) {
                // Log strictly if debugging, otherwise generic
                if (samples % 10 === 0) { // Log occasionally to avoid spam
                    log(`⏭️ Silent segment skipped (Max: ${maxLevel.toFixed(1)})`);
                }
                if (isRecording) recordSegment();
                return;
            }

            // Classification Logic (Refined)
            let speaker = 'unknown';

            // Check if mic is missing
            if (!micAnalyser) {
                if (samples % 50 === 0) log('⚠️ Mic Analyser missing - defaulting to lead/unknown');
            }

            // Case 1: Clear Separation (Only one channel active above threshold)
            if (maxMicLevel >= SILENCE_THRESHOLD && maxTabLevel < SILENCE_THRESHOLD) {
                speaker = 'seller';
            } else if (maxTabLevel >= SILENCE_THRESHOLD && maxMicLevel < SILENCE_THRESHOLD) {
                speaker = 'lead';
            }
            // Case 2: Both active - Compare Volume
            else {
                // Favor Seller (Mic) - if Mic is active, it's likely the user speaking.
                // We relax the requirement: if Mic is at least 70% of Tab volume, assume Seller.
                // This helps when Tab volume is high (e.g. loud video) but User is also speaking.
                if (maxMicLevel > maxTabLevel * 0.7) {
                    speaker = 'seller';
                } else {
                    speaker = 'lead';
                }
            }

            log(`🗣️ Speaker: ${speaker} (Mic: ${maxMicLevel.toFixed(0)}/${avgMic.toFixed(0)}, Tab: ${maxTabLevel.toFixed(0)}/${avgTab.toFixed(0)})`);

            // Create a COMPLETE blob (with valid WebM header)
            const completeBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
            log(`📦 Complete segment: ${completeBlob.size} bytes`);

            // Convert to Base64 and send
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                chrome.runtime.sendMessage({
                    type: 'AUDIO_SEGMENT',  // Complete segment, not chunk!
                    data: base64,
                    size: completeBlob.size,
                    speaker: speaker // 🏷️ SEND SPEAKER INFO
                }).catch(err => log('❌ Error sending segment:', err.message));
            };
            reader.readAsDataURL(completeBlob);

            // Start next segment
            if (isRecording) {
                recordSegment();
            }
        };

        recorder.onerror = (event: any) => {
            log('❌ MediaRecorder error:', event.error?.message);
            // Try to restart
            if (isRecording) {
                setTimeout(() => recordSegment(), 500);
            }
        };

        // Record WITHOUT timeslice (record everything into a single blob)
        recorder.start();
        mediaRecorder = recorder;

        // Stop after N seconds to generate the complete blob
        setTimeout(() => {
            if (recorder.state === 'recording') {
                recorder.stop();
            }
        }, RECORDING_INTERVAL_MS);
    }

    // Start the first segment
    recordSegment();
    log(`🚀 Recording cycle started (${RECORDING_INTERVAL_MS / 1000}s segments)`);
}

function stopTranscription() {
    log('🛑 Stopping transcription...');
    isRecording = false;

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder = null;
    }

    if (audioContext) {
        audioContext.close().catch(() => { });
        audioContext = null;
    }

    if (playbackContext) {
        playbackContext.close().catch(() => { });
        playbackContext = null;
    }

    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }

    log('✅ Transcription stopped');
    chrome.runtime.sendMessage({ type: 'RECORDING_STOPPED' }).catch(() => { });
}
