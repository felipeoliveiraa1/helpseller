/**
 * Pure helpers for the WebM live stream pipeline.
 * Extracted from MediaStreamPlayer so they can be imported by the component
 * AND by node:test unit tests without pulling in React / 'use client' modules.
 */

/** Check if bytes are large enough to be a valid init segment. */
export function isLikelyInitSegment(bytes: Uint8Array): boolean {
    return bytes.length >= 10;
}

/** Detect codec from a WebM init segment by scanning for codec IDs. */
export function detectCodecFromInit(bytes: Uint8Array): string {
    const str = new TextDecoder('ascii', { fatal: false }).decode(bytes);
    if (str.includes('V_VP9')) return 'vp9';
    if (str.includes('V_VP8')) return 'vp8';
    for (let i = 0; i < bytes.length - 4; i++) {
        // VP9 codec ID: 0x56 0x5F 0x56 0x50 0x39
        if (bytes[i] === 0x56 && bytes[i + 1] === 0x5F && bytes[i + 2] === 0x56 && bytes[i + 3] === 0x50 && bytes[i + 4] === 0x39) return 'vp9';
        // VP8 codec ID: 0x56 0x5F 0x56 0x50 0x38
        if (bytes[i] === 0x56 && bytes[i + 1] === 0x5F && bytes[i + 2] === 0x56 && bytes[i + 3] === 0x50 && bytes[i + 4] === 0x38) return 'vp8';
    }
    return 'vp8';
}

/**
 * Binary frame from backend: 1 byte flag (0x01=header, 0x00=data) + chunk bytes.
 * Returns null if the buffer is too short to contain even the flag + 1 byte of payload.
 */
export function parseBinaryMediaChunk(data: ArrayBuffer): { bytes: Uint8Array; isHeader: boolean } | null {
    if (data.byteLength < 2) return null;
    const view = new Uint8Array(data);
    const isHeader = view[0] === 0x01;
    const chunkLen = view.length - 1;
    const chunk = new Uint8Array(chunkLen);
    for (let i = 0; i < chunkLen; i++) chunk[i] = view[i + 1];
    return { bytes: chunk, isHeader };
}
