/**
 * Client-side audio extraction: fetches an MP4 (through our proxy), decodes it
 * with the Web Audio API and encodes the PCM data as a WAV file. Everything
 * happens in the browser – nothing is uploaded or stored.
 */

function encodeWav(buffer: AudioBuffer): Blob {
  const numChannels = Math.min(2, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = length * blockAlign;
  const out = new ArrayBuffer(44 + dataSize);
  const view = new DataView(out);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([out], { type: "audio/wav" });
}

export async function extractAudioToWav(
  mediaUrl: string,
  onProgress?: (stage: "downloading" | "decoding" | "encoding") => void,
): Promise<Blob> {
  onProgress?.("downloading");
  const res = await fetch(mediaUrl);
  if (!res.ok) throw new Error("Could not download the video for audio extraction.");
  const data = await res.arrayBuffer();

  onProgress?.("decoding");
  const AudioCtx: typeof AudioContext | undefined =
    typeof window !== "undefined"
      ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined;
  if (!AudioCtx) throw new Error("Your browser does not support in‑browser audio extraction. Download the MP4 instead.");

  const ctx = new AudioCtx();
  try {
    const decoded = await ctx.decodeAudioData(data.slice(0));
    onProgress?.("encoding");
    return encodeWav(decoded);
  } catch {
    throw new Error("Your browser couldn't decode this video's audio. Try downloading the MP4 instead.");
  } finally {
    void ctx.close();
  }
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
