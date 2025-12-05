import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;

export async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }

  ffmpegInstance = new FFmpeg();
  
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  
  ffmpegInstance.on('log', ({ message }) => {
    console.log('[FFmpeg]:', message);
  });

  ffmpegInstance.on('progress', ({ progress, time }) => {
    console.log('[FFmpeg Progress]:', `${(progress * 100).toFixed(2)}% - ${time}ms`);
  });

  try {
    await ffmpegInstance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    console.log('FFmpeg loaded successfully');
    return ffmpegInstance;
  } catch (error) {
    console.error('Failed to load FFmpeg:', error);
    throw error;
  }
}

export async function generateVideoThumbnail(
  videoFile: File,
  timeInSeconds: number = 1
): Promise<string> {
  const ffmpeg = await loadFFmpeg();

  // Write the video file to FFmpeg's virtual filesystem
  await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

  // Generate thumbnail at specified time
  await ffmpeg.exec([
    '-i', 'input.mp4',
    '-ss', timeInSeconds.toString(),
    '-vframes', '1',
    '-vf', 'scale=320:-1',
    'thumbnail.jpg'
  ]);

  // Read the thumbnail
  const data = await ffmpeg.readFile('thumbnail.jpg');
  const blob = new Blob([data], { type: 'image/jpeg' });
  const thumbnailUrl = URL.createObjectURL(blob);

  // Cleanup
  await ffmpeg.deleteFile('input.mp4');
  await ffmpeg.deleteFile('thumbnail.jpg');

  return thumbnailUrl;
}

export async function extractAudioFromVideo(videoFile: File): Promise<Blob> {
  const ffmpeg = await loadFFmpeg();

  await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

  await ffmpeg.exec([
    '-i', 'input.mp4',
    '-vn',
    '-acodec', 'libmp3lame',
    '-b:a', '192k',
    'output.mp3'
  ]);

  const data = await ffmpeg.readFile('output.mp3');
  const audioBlob = new Blob([data], { type: 'audio/mpeg' });

  await ffmpeg.deleteFile('input.mp4');
  await ffmpeg.deleteFile('output.mp3');

  return audioBlob;
}

export async function trimVideo(
  videoFile: File,
  startTime: number,
  duration: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ffmpeg = await loadFFmpeg();

  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(progress * 100);
    });
  }

  await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

  await ffmpeg.exec([
    '-i', 'input.mp4',
    '-ss', startTime.toString(),
    '-t', duration.toString(),
    '-c', 'copy',
    'output.mp4'
  ]);

  const data = await ffmpeg.readFile('output.mp4');
  const trimmedBlob = new Blob([data], { type: 'video/mp4' });

  await ffmpeg.deleteFile('input.mp4');
  await ffmpeg.deleteFile('output.mp4');

  return trimmedBlob;
}

export async function compressVideo(
  videoFile: File,
  quality: 'low' | 'medium' | 'high' = 'medium',
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ffmpeg = await loadFFmpeg();

  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(progress * 100);
    });
  }

  const bitrateMap = {
    low: '500k',
    medium: '1000k',
    high: '2000k'
  };

  await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

  await ffmpeg.exec([
    '-i', 'input.mp4',
    '-c:v', 'libx264',
    '-b:v', bitrateMap[quality],
    '-c:a', 'aac',
    '-b:a', '128k',
    'output.mp4'
  ]);

  const data = await ffmpeg.readFile('output.mp4');
  const compressedBlob = new Blob([data], { type: 'video/mp4' });

  await ffmpeg.deleteFile('input.mp4');
  await ffmpeg.deleteFile('output.mp4');

  return compressedBlob;
}

export async function getVideoDuration(videoFile: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.src = URL.createObjectURL(videoFile);
  });
}
