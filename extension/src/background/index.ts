import { authService } from '../services/auth';
import { wsClient } from '../services/websocket';

// State
console.log('Background Service Worker Starting...');

// Listen for transcription results from WebSocket and forward to content script
wsClient.on('transcript:chunk', async (data: any) => {
    console.log('📝 Received transcript from server:', data.payload?.text?.substring(0, 50));

    const state = await getState();
    if (state.currentTabId) {
        chrome.tabs.sendMessage(state.currentTabId, {
            type: 'TRANSCRIPT_RESULT',
            data: {
                text: data.payload?.text,
                isFinal: data.payload?.isFinal ?? true,
                timestamp: Date.now()
            }
        }).catch((err) => {
            console.warn('Failed to send transcript to content script:', err.message);
        });
    }
});

// State Management Helpers
async function getState() {
    const data = await chrome.storage.session.get(['streamId', 'currentTabId', 'isRecording']);
    return {
        streamId: data.streamId as string | null,
        currentTabId: data.currentTabId as number | null,
        isRecording: !!data.isRecording
    };
}

async function setState(updates: { streamId?: string | null, currentTabId?: number | null, isRecording?: boolean }) {
    await chrome.storage.session.set(updates);
}

let offscreenDocument: string | null = null;

// Icon Click Handler
chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;

    console.log('Extension icon clicked (v2 - lazy capture)...');
    // We only save the tab ID. validation and capture will happen flow starts.
    await setState({ currentTabId: tab.id });

    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' }).catch((err) => {
        console.log('Content script not injected yet:', err);
    });
});

let isProcessing = false;

// Listeners
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`📩 Background received message: ${message.type}`, { senderId: sender.id, senderUrl: sender.url });

    if (message.type === 'START_CAPTURE') {
        startCapture();
    } else if (message.type === 'STOP_CAPTURE') {
        stopCapture();
    } else if (message.type === 'OFFSCREEN_READY') {
        console.log('✅ [Event]: OFFSCREEN_READY - Generating fresh StreamID...');
        handleOffscreenReady();
    } else if (message.type === 'OFFSCREEN_LOG') {
        console.log('🖥️ [Offscreen]:', message.message);
    } else if (message.type === 'AUDIO_CHUNK') {
        // Legacy handler - kept for compatibility
        wsClient.send('audio:chunk', { audio: message.data });
    } else if (message.type === 'AUDIO_SEGMENT') {
        // New handler - complete WebM segment
        console.log(`📤 Sending complete audio segment: ${message.size} bytes, Speaker: ${message.speaker}`);
        wsClient.send('audio:segment', {
            audio: message.data,
            size: message.size,
            speaker: message.speaker // Pass speaker info (seller/lead)
        });
    } else if (message.type === 'TRANSCRIPT_RESULT') {
        wsClient.send('transcript:chunk', message.data);
        getState().then(state => {
            if (state.currentTabId) {
                chrome.tabs.sendMessage(state.currentTabId, {
                    type: 'TRANSCRIPT_RESULT',
                    data: message.data
                }).catch(() => { });
            }
        });
    }

    return false;
});

async function handleOffscreenReady() {
    // This handler stays empty or just logs.
    // The main flow in startCapture waits for the 'OFFSCREEN_READY' message via Promise.
    console.log('✅ [Event]: OFFSCREEN_READY signal received.');
}

async function startCapture() {
    if (isProcessing) {
        console.warn('⚠️ startCapture ignored: already processing');
        return;
    }

    const state = await getState();
    if (state.isRecording) {
        console.log('⚠️ startCapture ignored: already recording');
        return;
    }

    // Validation
    if (!state.currentTabId) {
        console.error('❌ No currentTabId available. Icon must be clicked first.');
        broadcastStatus('ERROR');
        return;
    }

    isProcessing = true;
    try {
        const tab = await chrome.tabs.get(state.currentTabId);
        console.log('🚀 Initiating capture flow for:', tab.url);

        // 1. Update Status
        await setState({ isRecording: true });
        broadcastStatus('RECORDING');

        // 2. Connect WebSocket FIRST (Bug 3 Fix)
        const session = await authService.getSession() as any;

        // 🔍 DEBUG: Token Info
        console.log('🔑 Token Debug:', {
            sessionPresent: !!session,
            accessTokenPresent: !!session?.access_token,
            accessTokenLength: session?.access_token?.length,
            accessTokenPrefix: session?.access_token?.substring(0, 30) + '...',
            expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A'
        });

        if (!session?.access_token) {
            console.error('❌ No access token available! User may need to log in.');
            broadcastStatus('ERROR');
            await setState({ isRecording: false });
            isProcessing = false;
            return;
        }

        console.log('🔌 Connecting WebSocket...');
        wsClient.connect(session.access_token);

        // 3. Ensure Offscreen Document Exists & Wait for Ready
        const existingContexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType]
        });

        if (existingContexts.length === 0) {
            console.log('Creating offscreen document...');
            await chrome.offscreen.createDocument({
                url: 'src/offscreen/index.html',
                reasons: ['USER_MEDIA' as chrome.offscreen.Reason],
                justification: 'Recording tab audio for real-time transcription'
            });

            // Wait for OFFSCREEN_READY signal
            console.log('⏳ Waiting for OFFSCREEN_READY...');
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    chrome.runtime.onMessage.removeListener(listener);
                    reject(new Error('Timeout waiting for OFFSCREEN_READY'));
                }, 5000);

                const listener = (msg: any) => {
                    if (msg.type === 'OFFSCREEN_READY') {
                        console.log('✅ OFFSCREEN_READY received (Promise resolved)');
                        chrome.runtime.onMessage.removeListener(listener);
                        clearTimeout(timeout);
                        resolve();
                    }
                };
                chrome.runtime.onMessage.addListener(listener);
            });
        } else {
            console.log('✅ Offscreen document already exists');
        }
        offscreenDocument = 'src/offscreen/index.html';

        // 4. Generate StreamID (Single Source of Truth - Bug 2 Fix)
        console.log('🎥 Requesting MediaStreamId for tab:', state.currentTabId);
        const streamId = await new Promise<string>((resolve, reject) => {
            chrome.tabCapture.getMediaStreamId({ targetTabId: state.currentTabId! }, (id) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else if (!id) {
                    reject(new Error('Got empty streamId'));
                } else {
                    resolve(id);
                }
            });
        });

        console.log('✅ Fresh StreamID generated:', streamId);

        // 5. Send INIT_RECORDING Immediately
        console.log('📤 Sending INIT_RECORDING to offscreen...');
        await chrome.runtime.sendMessage({
            type: 'INIT_RECORDING',
            streamId: streamId
        });

        // 6. Send Call Start Metadata
        if (session?.access_token) {
            wsClient.send('call:start', {
                platform: urlToPlatform(tab.url),
                scriptId: 'default-script-id'
            });
        }

    } catch (err: any) {
        console.error('❌ startCapture failed:', err);
        broadcastStatus('ERROR');
        await setState({ isRecording: false });

        // Clean up if failed
        if (offscreenDocument) {
            await stopCapture();
        }
    } finally {
        isProcessing = false;
    }
}

async function stopCapture() {
    if (isProcessing) {
        console.warn('⚠️ stopCapture ignored: already processing');
        return;
    }

    const state = await getState();
    if (!state.isRecording) {
        console.log('⚠️ stopCapture ignored: not currently recording');
        return;
    }

    isProcessing = true;
    console.log('⏹️ Stopping capture...');
    try {
        chrome.runtime.sendMessage({ type: 'STOP_RECORDING' }).catch(() => {
            console.log('Offscreen not reachable (already closed?)');
        });

        if (offscreenDocument) {
            await chrome.offscreen.closeDocument();
            offscreenDocument = null;
        }

        await setState({ isRecording: false });
        broadcastStatus('PROGRAMMED');
        wsClient.send('call:end', {});
    } catch (err) {
        console.error('❌ stopCapture failed:', err);
    } finally {
        isProcessing = false;
    }
}

async function broadcastStatus(status: string) {
    const state = await getState();
    console.log('Broadcasting status:', status);

    if (state.currentTabId) {
        chrome.tabs.sendMessage(state.currentTabId, {
            type: 'STATUS_UPDATE',
            status
        }).catch(() => { });
    }
    chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', status }).catch(() => { });
}

function urlToPlatform(url?: string): string {
    if (!url) return 'OTHER';
    if (url.includes('meet.google.com')) return 'GOOGLE_MEET';
    if (url.includes('zoom.us')) return 'ZOOM_WEB';
    return 'OTHER';
}
