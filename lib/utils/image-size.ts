/**
 * Read the pixel dimensions of a JPEG or PNG from its header, without
 * decoding the image.
 */
export function getImageSize(buffer: Buffer): { width: number; height: number } | null {
  // PNG: IHDR chunk follows the 8-byte signature
  if (buffer.length > 24 && buffer.readUInt32BE(0) === 0x89504e47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
  }

  // JPEG: walk the markers until a start-of-frame (SOF0-SOF15, except DHT/JPG/DAC)
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null
  let offset = 2
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) return null
    const marker = buffer[offset + 1]
    const length = buffer.readUInt16BE(offset + 2)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) }
    }
    offset += 2 + length
  }
  return null
}
