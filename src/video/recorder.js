// Records the WebGL canvas plus the soundtrack with MediaRecorder.
import { setWebmDuration } from './webm-duration.js';

// Chrome/Edge take the first entry; Firefox usually lands on VP8; Safari records MP4
// and reports codecs as full avc1/mp4a profile strings.
const TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4;codecs=avc1,mp4a',
  'video/mp4',
];

export function pickMimeType() {
  if (typeof MediaRecorder === 'undefined' || typeof HTMLCanvasElement.prototype.captureStream !== 'function') return '';
  return TYPES.find(type => MediaRecorder.isTypeSupported(type)) ?? '';
}

// Safari only records MP4, so the file name follows the container actually used.
export const extensionFor = mimeType => (mimeType.startsWith('video/mp4') ? 'mp4' : 'webm');

export function createRecording({ canvas, audioStream, mimeType, fps = 60 }) {
  const video = canvas.captureStream(fps);
  const stream = new MediaStream([...video.getVideoTracks(), ...(audioStream ? audioStream.getAudioTracks() : [])]);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 16_000_000, audioBitsPerSecond: 192_000 });
  const chunks = [];
  // Active time excludes pauses (tab hidden), matching what the file contains.
  let activeMs = 0;
  let resumedAt = 0;
  recorder.addEventListener('dataavailable', event => {
    if (event.data.size > 0) chunks.push(event.data);
  });

  return {
    start() {
      recorder.start(1000);
      resumedAt = performance.now();
    },
    pause() {
      if (recorder.state !== 'recording') return;
      recorder.pause();
      activeMs += performance.now() - resumedAt;
    },
    resume() {
      if (recorder.state !== 'paused') return;
      recorder.resume();
      resumedAt = performance.now();
    },
    stop() {
      return new Promise((resolve, reject) => {
        recorder.addEventListener('stop', async () => {
          // Only the canvas track belongs to this recording; the audio destination is reused.
          video.getVideoTracks().forEach(track => track.stop());
          const type = mimeType.split(';')[0];
          const blob = new Blob(chunks, { type });
          if (type !== 'video/webm') {
            resolve(blob);
            return;
          }
          try {
            resolve(new Blob([setWebmDuration(await blob.arrayBuffer(), activeMs)], { type }));
          } catch (error) {
            // The file still plays; players just cannot seek it.
            console.warn('Could not write WebM duration; saving the file without it.', error);
            resolve(blob);
          }
        }, { once: true });
        recorder.addEventListener('error', event => reject(event.error ?? new Error('MediaRecorder error')), { once: true });
        if (recorder.state === 'inactive') {
          reject(new Error('Recorder is not running'));
          return;
        }
        if (recorder.state === 'recording') activeMs += performance.now() - resumedAt;
        recorder.stop();
      });
    },
  };
}
