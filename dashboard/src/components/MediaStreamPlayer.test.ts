import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    parseBinaryMediaChunk,
    detectCodecFromInit,
    isLikelyInitSegment,
} from '../lib/webm-parser';

function makeArrayBuffer(bytes: number[]): ArrayBuffer {
    const u8 = new Uint8Array(bytes);
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
}

describe('parseBinaryMediaChunk', () => {
    it('returns null for buffers shorter than 2 bytes', () => {
        assert.equal(parseBinaryMediaChunk(new ArrayBuffer(0)), null);
        assert.equal(parseBinaryMediaChunk(new ArrayBuffer(1)), null);
    });

    it('parses a header frame (flag 0x01)', () => {
        const buf = makeArrayBuffer([0x01, 0xde, 0xad, 0xbe, 0xef]);
        const parsed = parseBinaryMediaChunk(buf);
        assert.ok(parsed);
        assert.equal(parsed!.isHeader, true);
        assert.deepEqual(Array.from(parsed!.bytes), [0xde, 0xad, 0xbe, 0xef]);
    });

    it('parses a data frame (flag 0x00)', () => {
        const buf = makeArrayBuffer([0x00, 0x01, 0x02, 0x03]);
        const parsed = parseBinaryMediaChunk(buf);
        assert.ok(parsed);
        assert.equal(parsed!.isHeader, false);
        assert.deepEqual(Array.from(parsed!.bytes), [0x01, 0x02, 0x03]);
    });

    it('treats any non-0x01 flag as data', () => {
        const buf = makeArrayBuffer([0xff, 0xaa]);
        const parsed = parseBinaryMediaChunk(buf);
        assert.ok(parsed);
        assert.equal(parsed!.isHeader, false);
    });

    it('handles 1-byte payloads (malformed heartbeats from the seller)', () => {
        const buf = makeArrayBuffer([0x01, 0x1a]);
        const parsed = parseBinaryMediaChunk(buf);
        assert.ok(parsed);
        assert.equal(parsed!.isHeader, true);
        assert.equal(parsed!.bytes.length, 1);
    });
});

describe('detectCodecFromInit', () => {
    it('detects vp9 via ASCII string V_VP9', () => {
        const bytes = new TextEncoder().encode('...V_VP9...');
        assert.equal(detectCodecFromInit(bytes), 'vp9');
    });

    it('detects vp8 via ASCII string V_VP8', () => {
        const bytes = new TextEncoder().encode('...V_VP8...');
        assert.equal(detectCodecFromInit(bytes), 'vp8');
    });

    it('detects vp9 via binary codec ID pattern', () => {
        // 0x56 0x5F 0x56 0x50 0x39 -> "V_VP9"
        const bytes = new Uint8Array([0x00, 0x56, 0x5f, 0x56, 0x50, 0x39, 0x00]);
        assert.equal(detectCodecFromInit(bytes), 'vp9');
    });

    it('detects vp8 via binary codec ID pattern', () => {
        // 0x56 0x5F 0x56 0x50 0x38 -> "V_VP8"
        const bytes = new Uint8Array([0x00, 0x56, 0x5f, 0x56, 0x50, 0x38, 0x00]);
        assert.equal(detectCodecFromInit(bytes), 'vp8');
    });

    it('defaults to vp8 when no codec pattern is present', () => {
        const bytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
        assert.equal(detectCodecFromInit(bytes), 'vp8');
    });

    it('defaults to vp8 on empty input', () => {
        assert.equal(detectCodecFromInit(new Uint8Array(0)), 'vp8');
    });
});

describe('isLikelyInitSegment', () => {
    it('rejects chunks shorter than 10 bytes', () => {
        assert.equal(isLikelyInitSegment(new Uint8Array(0)), false);
        assert.equal(isLikelyInitSegment(new Uint8Array(9)), false);
    });

    it('accepts chunks >= 10 bytes', () => {
        assert.equal(isLikelyInitSegment(new Uint8Array(10)), true);
        assert.equal(isLikelyInitSegment(new Uint8Array(500)), true);
    });
});
