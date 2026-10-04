// Records the WebGL canvas plus the soundtrack with MediaRecorder.

const TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
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
  recorder.addEventListener('dataavailable', event => {
    if (event.data.size > 0) chunks.push(event.data);
  });

  return {
    start() {
      recorder.start(1000);
    },
    pause() {
      if (recorder.state === 'recording') recorder.pause();
    },
    resume() {
      if (recorder.state === 'paused') recorder.resume();
    },
    stop() {
      return new Promise((resolve, reject) => {
        recorder.addEventListener('stop', () => {
          // Only the canvas track belongs to this recording; the audio destination is reused.
          video.getVideoTracks().forEach(track => track.stop());
          resolve(new Blob(chunks, { type: mimeType.split(';')[0] }));
        }, { once: true });
        recorder.addEventListener('error', event => reject(event.error ?? new Error('MediaRecorder error')), { once: true });
        if (recorder.state === 'inactive') reject(new Error('Recorder is not running'));
        else recorder.stop();
      });
    },
  };
}
