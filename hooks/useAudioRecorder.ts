import { useState, useRef } from 'react';

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error('Failed to convert blob to base64 string.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper function to resample audio buffer to a target sample rate (e.g., 16kHz)
const resampleBuffer = (audioBuffer: AudioBuffer, targetSampleRate: number): Float32Array => {
    const sourceData = audioBuffer.getChannelData(0);
    const sourceSampleRate = audioBuffer.sampleRate;

    if (sourceSampleRate === targetSampleRate) {
        return sourceData;
    }

    const ratio = sourceSampleRate / targetSampleRate;
    const newLength = Math.round(sourceData.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetSource = 0;

    while (offsetResult < newLength) {
        const nextSourceOffset = Math.round((offsetResult + 1) * ratio);
        let accum = 0;
        let count = 0;
        for (let i = offsetSource; i < nextSourceOffset && i < sourceData.length; i++) {
            accum += sourceData[i];
            count++;
        }
        result[offsetResult] = count > 0 ? accum / count : 0;
        offsetResult++;
        offsetSource = nextSourceOffset;
    }
    return result;
};

// List of supported MIME types, with the preferred one for Xunfei (MP3) first.
const SUPPORTED_MIME_TYPES = [
    'audio/mpeg',
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
];

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    if (isRecording) {
      console.warn('Recording is already in progress.');
      return;
    }
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media Devices API not supported in this browser.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        sampleRate: 16000 
    }});
    
    // Find the best supported MIME type, preferring MP3.
    const supportedMimeType = SUPPORTED_MIME_TYPES.find(type => MediaRecorder.isTypeSupported(type));
    
    if (!supportedMimeType) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error('No supported audio recording format found for this browser.');
    }
    
    console.log(`Using MIME type: ${supportedMimeType}`);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: supportedMimeType });

    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstart = () => {
      setIsRecording(true);
    };

    mediaRecorder.start();
  };

  const stopRecording = (): Promise<{ url: string; base64: string; mimeType: string; }> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current || !isRecording) {
        console.warn('Recording not started or already stopped.');
        reject(new Error('录音尚未开始或已停止。'));
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        try {
            const finalMimeType = mediaRecorderRef.current?.mimeType || 'audio/mpeg';
            const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
            
            // PREFERRED PATH: If the browser recorded directly to MP3, send it.
            if (finalMimeType === 'audio/mpeg') {
                const audioUrl = URL.createObjectURL(audioBlob);
                const base64 = await blobToBase64(audioBlob);
                resolve({ url: audioUrl, base64, mimeType: 'audio/mpeg' });
            } else {
                // FALLBACK PATH: If MP3 wasn't supported, convert to raw PCM as a last resort.
                console.warn(`Recorded in unsupported format (${finalMimeType}). Falling back to PCM conversion.`);
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const arrayBuffer = await audioBlob.arrayBuffer();
                const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
                
                const pcmSamples = resampleBuffer(decodedBuffer, 16000);

                const samples = new Int16Array(pcmSamples.length);
                for (let i = 0; i < pcmSamples.length; i++) {
                    const s = Math.max(-1, Math.min(1, pcmSamples[i]));
                    samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }

                const pcmBlob = new Blob([samples.buffer], { type: 'audio/pcm' });
                const audioUrl = URL.createObjectURL(pcmBlob);
                const base64 = await blobToBase64(pcmBlob);
                
                resolve({ url: audioUrl, base64, mimeType: 'audio/pcm' });
            }
        } catch (error) {
            console.error("Error during audio processing:", error);
            reject(new Error('处理录音时出错，您的浏览器可能录制了不支持的音频格式。'));
        } finally {
            setIsRecording(false);
            mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorderRef.current.stop();
    });
  };

  return { isRecording, startRecording, stopRecording };
};