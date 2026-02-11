/**
 * Extrai nomes dos participantes do Google Meet (Lead = não é o usuário local).
 * Evita tooltips de botões e nomes duplicados/concatenados.
 */

const INVALID_PATTERNS = [
    /microfone/i,
    /câmera/i,
    /camera/i,
    /desativar/i,
    /ativar/i,
    /ctrl\s*\+/i,
    /alt\s*\+/i,
    /devices?$/i,
    /configurações/i,
    /settings/i,
    /mute/i,
    /unmute/i,
    /turn\s+(on|off)/i,
    /apresentar/i,
    /present/i,
    /chat/i,
    /meet\.google/i,
    /participants/i,
    /participantes/i,
    /legendas/i,
    /captions/i,
    /mais\s+opções/i,
    /more\s+options/i,
    /sair/i,
    /leave/i,
    /^\d+$/,
    /^[a-z]$/i,
];

function isValidName(text: string): boolean {
    const t = text.trim();
    if (t.length < 2 || t.length > 50) return false;
    for (const pattern of INVALID_PATTERNS) {
        if (pattern.test(t)) return false;
    }
    if (t.length > 10) {
        const half = Math.floor(t.length / 2);
        const first = t.substring(0, half).toLowerCase().trim();
        const second = t.substring(half).toLowerCase().trim();
        if (first === second) return false;
    }
    return true;
}

function cleanName(rawName: string): string {
    let name = rawName.trim();
    name = name.replace(/devices$/i, '').trim();
    for (let splitPoint = Math.floor(name.length / 2) - 2; splitPoint <= Math.ceil(name.length / 2) + 2; splitPoint++) {
        if (splitPoint > 0 && splitPoint < name.length) {
            const first = name.substring(0, splitPoint).trim();
            const second = name.substring(splitPoint).trim();
            if (first.toLowerCase() === second.toLowerCase()) return first;
        }
    }
    return name;
}

const NAME_SELECTORS = [
    '[data-self-name]',
    '.zWGUib',
    '.adnwBd',
    '.YTbUzc',
    '.cS7aqe',
];

export function getParticipantNames(): { selfName: string; otherNames: string[] } {
    let selfName = '';
    const foundNames = new Set<string>();

    for (const selector of NAME_SELECTORS) {
        try {
            document.querySelectorAll(selector).forEach((el) => {
                let name = '';
                const htmlEl = el as HTMLElement;

                if (htmlEl.hasAttribute('data-self-name')) {
                    name = (htmlEl.getAttribute('data-self-name') || '').trim();
                    if (name) selfName = name;
                } else {
                    const textNodes = Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE);
                    if (textNodes.length > 0) {
                        name = (textNodes[0].textContent || '').trim();
                    } else {
                        name = (htmlEl.innerText || '').split('\n')[0]?.trim() || '';
                    }
                }

                if (name && isValidName(name)) {
                    foundNames.add(name);
                }
            });
        } catch (_) { }
    }

    const otherNames: string[] = [];
    foundNames.forEach((n) => {
        if (n !== selfName && !otherNames.includes(n)) otherNames.push(n);
    });

    if (otherNames.length === 0) {
        const title = document.title;
        const titleMatch = title.replace(/\s*[-–]\s*Google Meet.*$/i, '').trim();
        if (titleMatch && titleMatch !== 'Meeting' && isValidName(titleMatch)) {
            otherNames.push(titleMatch);
        }
    }

    return { selfName, otherNames };
}

export function getSelfName(): string {
    const { selfName } = getParticipantNames();
    if (selfName) return selfName;
    const selfEl = document.querySelector('[data-self-name]');
    if (selfEl) return ((selfEl as HTMLElement).getAttribute('data-self-name') || '').trim();
    const profileBtn =
        document.querySelector('[aria-label*="conta"]') || document.querySelector('[aria-label*="account"]');
    const label = (profileBtn?.getAttribute('aria-label') || '').trim();
    return label.replace(/.*conta de /i, '').replace(/.*account/i, '').trim() || '';
}

export function getLeadName(): string | null {
    const { selfName, otherNames } = getParticipantNames();
    const cleaned = otherNames
        .filter((n) => n !== selfName)
        .map(cleanName)
        .filter((n) => n.length > 1);
    return cleaned[0] || null;
}

export function sendParticipantInfoNow(): void {
    const { selfName, otherNames } = getParticipantNames();
    const cleaned = otherNames
        .filter((n) => n !== selfName)
        .map(cleanName)
        .filter((n) => n.length > 1);
    const leadName = cleaned[0] || null;
    if (leadName || cleaned.length > 0) {
        chrome.runtime.sendMessage({
            type: 'PARTICIPANT_INFO',
            leadName: leadName || 'Lead',
            selfName,
            allParticipants: cleaned,
        }).catch(() => { });
    }
}

let intervalId: ReturnType<typeof setInterval> | null = null;
let observer: MutationObserver | null = null;

function checkAndSend(lastLeadName: { value: string }) {
    const { selfName, otherNames } = getParticipantNames();
    const cleaned = otherNames
        .filter((n) => n !== selfName)
        .map(cleanName)
        .filter((n) => n.length > 1);
    const leadName = cleaned[0] || null;

    if (leadName && leadName !== lastLeadName.value) {
        lastLeadName.value = leadName;
        chrome.runtime.sendMessage({
            type: 'PARTICIPANT_INFO',
            leadName,
            selfName,
            allParticipants: cleaned,
        }).catch(() => { });
    }
}

export function startParticipantMonitoring(): void {
    if (intervalId) return;

    const lastLeadName = { value: '' };

    function run() {
        checkAndSend(lastLeadName);
    }

    run();
    intervalId = setInterval(run, 2000);

    observer = new MutationObserver(() => checkAndSend(lastLeadName));
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

export function stopParticipantMonitoring(): void {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    if (observer) {
        observer.disconnect();
        observer = null;
    }
}

/** Detecta se o microfone está mutado no Google Meet (botão de mic do usuário). */
export function isMicMuted(): boolean {
    // Target ONLY the user's mic button in the bottom control bar
    // The control bar is typically in a container with specific classes or the main meeting controls

    // Strategy 1: Look for the mic button by its specific jsname in the control bar area
    const controlBarSelectors = [
        // Bottom control bar containers
        '[jsname="RKGaOc"]', // Main control bar container
        '[jsname="EaZ7Me"]', // Alternative control container  
        'div[role="region"]', // Accessibility region for controls
    ];

    // Try to find the mic button within the control bar containers first
    for (const containerSelector of controlBarSelectors) {
        const container = document.querySelector(containerSelector);
        if (container) {
            // Look for mic button within this container
            const micBtn = container.querySelector('[aria-label*="microphone" i], [aria-label*="microfone" i], [data-tooltip*="microphone" i], [data-tooltip*="microfone" i]');
            if (micBtn) {
                return checkMicButtonState(micBtn, `${containerSelector} > mic button`);
            }
        }
    }

    // Strategy 2: Find mic button by jsname directly (Google Meet specific)
    const micByJsname = document.querySelector('button[jsname="BOHaEe"]') || document.querySelector('div[jsname="BOHaEe"]');
    if (micByJsname) {
        return checkMicButtonState(micByJsname, 'jsname BOHaEe');
    }

    // Strategy 3: Find by aria-label but EXCLUDE participant list items
    const allMicButtons = document.querySelectorAll('[aria-label*="microphone" i], [aria-label*="microfone" i]');
    for (const btn of allMicButtons) {
        // Skip if this is inside a participant list (usually has specific parent containers)
        const isInParticipantList = btn.closest('[role="listitem"], [role="list"], [jsname="jrQDbd"], [data-participant-id]');
        if (isInParticipantList) continue;

        // Skip if this is a status indicator (not a button)
        const role = btn.getAttribute('role');
        if (role !== 'button' && btn.tagName.toLowerCase() !== 'button') continue;

        return checkMicButtonState(btn, 'aria-label mic button');
    }

    // No mic button found - assume unmuted (fail safe)
    console.log('🎤 [MIC DEBUG] No mic button found, assuming unmuted');
    return false;
}

/** Helper to check mic button mute state */
function checkMicButtonState(micBtn: Element, source: string): boolean {
    // Check data-is-muted attribute (most reliable for Google Meet)
    const dataMuted = micBtn.getAttribute('data-is-muted');
    if (dataMuted === 'true') {
        console.log(`🎤 [MIC DEBUG] MUTED via data-is-muted on ${source}`);
        return true;
    }
    if (dataMuted === 'false') {
        console.log(`🎤 [MIC DEBUG] UNMUTED via data-is-muted on ${source}`);
        return false;
    }

    // Check aria-pressed (toggle button state)
    const ariaPressed = micBtn.getAttribute('aria-pressed');
    if (ariaPressed === 'true') {
        console.log(`🎤 [MIC DEBUG] MUTED via aria-pressed on ${source}`);
        return true;
    }
    if (ariaPressed === 'false') {
        console.log(`🎤 [MIC DEBUG] UNMUTED via aria-pressed on ${source}`);
        return false;
    }

    // Check label text
    const label = (
        micBtn.getAttribute('aria-label') ||
        micBtn.getAttribute('data-tooltip') ||
        ''
    ).toLowerCase();

    // "turn on" / "ativar" means currently OFF (muted)
    if (label.includes('ativar') || label.includes('turn on') || label.includes('unmute') || label.includes('ligar')) {
        console.log(`🎤 [MIC DEBUG] MUTED via label "${label}" on ${source}`);
        return true;
    }

    // "turn off" / "desativar" means currently ON (unmuted)
    if (label.includes('desativar') || label.includes('turn off') || label.includes('mute') || label.includes('desligar')) {
        console.log(`🎤 [MIC DEBUG] UNMUTED via label "${label}" on ${source}`);
        return false;
    }

    console.log(`🎤 [MIC DEBUG] Could not determine state for ${source}, assuming unmuted`);
    return false;
}

let micStateIntervalId: ReturnType<typeof setInterval> | null = null;

/** Monitora estado do mic no Meet e envia MIC_STATE ao background. */
export function startMicStateMonitoring(): void {
    if (micStateIntervalId) return;
    let lastMuted: boolean | null = null;

    console.log('🎤 [MIC MONITOR] Started mic state monitoring');

    micStateIntervalId = setInterval(() => {
        const muted = isMicMuted();
        if (muted !== lastMuted) {
            lastMuted = muted;
            console.log(`🎤 [MIC MONITOR] State changed: ${muted ? 'MUTED' : 'UNMUTED'}`);
            chrome.runtime.sendMessage({ type: 'MIC_STATE', muted }).catch(() => { });
        }
    }, 1000);
}

export function stopMicStateMonitoring(): void {
    if (micStateIntervalId) {
        clearInterval(micStateIntervalId);
        micStateIntervalId = null;
    }
}
