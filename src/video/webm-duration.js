// Chrome's MediaRecorder writes WebM without a Duration element, so desktop
// players cannot seek the file. This inserts Segment > Info > Duration.
// Pure function over bytes (no DOM), so scripts/verify-video.mjs can test it in Node.

const ID_SEGMENT = 0x18538067;
const ID_INFO = 0x1549a966;
const ID_TIMECODE_SCALE = 0x2ad7b1;
const ID_DURATION = 0x4489;

function vintLength(first) {
  for (let i = 0; i < 8; i += 1) if (first & (0x80 >> i)) return i + 1;
  throw new Error('Invalid EBML variable-length integer');
}

function readId(bytes, pos) {
  const length = vintLength(bytes[pos]);
  let id = 0;
  for (let i = 0; i < length; i += 1) id = id * 256 + bytes[pos + i];
  return { id, length };
}

function readSize(bytes, pos) {
  const length = vintLength(bytes[pos]);
  let value = bytes[pos] & (0xff >> length);
  let unknown = value === (0xff >> length);
  for (let i = 1; i < length; i += 1) {
    value = value * 256 + bytes[pos + i];
    if (bytes[pos + i] !== 0xff) unknown = false;
  }
  return { value, length, unknown };
}

function writeSize(value, length) {
  const out = new Uint8Array(length);
  let v = value;
  for (let i = length - 1; i >= 0; i -= 1) {
    out[i] = v % 256;
    v = Math.floor(v / 256);
  }
  if (v > 0 || value >= 2 ** (7 * length) - 1) throw new Error('EBML size does not fit');
  out[0] |= 0x80 >> (length - 1);
  return out;
}

function readUint(bytes, pos, length) {
  let value = 0;
  for (let i = 0; i < length; i += 1) value = value * 256 + bytes[pos + i];
  return value;
}

// Returns a new Uint8Array; throws if the bytes are not a WebM layout it understands.
export function setWebmDuration(input, durationMs) {
  const bytes = new Uint8Array(input);
  let pos = 0;
  // EBML header
  const header = readId(bytes, pos);
  const headerSize = readSize(bytes, pos + header.length);
  pos += header.length + headerSize.length + headerSize.value;

  const segment = readId(bytes, pos);
  if (segment.id !== ID_SEGMENT) throw new Error('WebM Segment not found');
  const segmentSizePos = pos + segment.length;
  const segmentSize = readSize(bytes, segmentSizePos);
  pos = segmentSizePos + segmentSize.length;

  while (pos < bytes.length) {
    const child = readId(bytes, pos);
    const sizePos = pos + child.length;
    const size = readSize(bytes, sizePos);
    const contentStart = sizePos + size.length;
    if (child.id !== ID_INFO) {
      if (size.unknown) break;
      pos = contentStart + size.value;
      continue;
    }

    let scale = 1_000_000;
    let durationPos = -1;
    for (let p = contentStart; p < contentStart + size.value;) {
      const el = readId(bytes, p);
      const elSize = readSize(bytes, p + el.length);
      const data = p + el.length + elSize.length;
      if (el.id === ID_TIMECODE_SCALE) scale = readUint(bytes, data, elSize.value);
      if (el.id === ID_DURATION && elSize.value === 8) durationPos = data;
      p = data + elSize.value;
    }
    const ticks = (durationMs * 1_000_000) / scale;

    if (durationPos >= 0) {
      const out = bytes.slice();
      new DataView(out.buffer).setFloat64(durationPos, ticks);
      return out;
    }

    const element = new Uint8Array(11);
    element.set([0x44, 0x89, 0x88]);
    new DataView(element.buffer).setFloat64(3, ticks);
    const parts = [
      bytes.subarray(0, segmentSizePos),
      segmentSize.unknown ? bytes.subarray(segmentSizePos, segmentSizePos + segmentSize.length) : writeSize(segmentSize.value + element.length, segmentSize.length),
      bytes.subarray(segmentSizePos + segmentSize.length, sizePos),
      writeSize(size.value + element.length, size.length),
      bytes.subarray(contentStart, contentStart + size.value),
      element,
      bytes.subarray(contentStart + size.value),
    ];
    const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
    let offset = 0;
    for (const part of parts) {
      out.set(part, offset);
      offset += part.length;
    }
    return out;
  }
  throw new Error('WebM Info element not found');
}

// Reads Duration back in milliseconds (used by the verifier).
export function getWebmDuration(input) {
  const bytes = new Uint8Array(input);
  let scale = 1_000_000;
  let duration = null;
  for (let p = 0; p < bytes.length - 11; p += 1) {
    if (bytes[p] === 0x2a && bytes[p + 1] === 0xd7 && bytes[p + 2] === 0xb1) {
      const size = readSize(bytes, p + 3);
      scale = readUint(bytes, p + 3 + size.length, size.value);
    }
    if (bytes[p] === 0x44 && bytes[p + 1] === 0x89 && bytes[p + 2] === 0x88) {
      duration = new DataView(bytes.buffer, bytes.byteOffset).getFloat64(p + 3);
      break;
    }
  }
  return duration === null ? null : (duration * scale) / 1_000_000;
}
