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
        // Request 16kHz sample rate, though browser may not respect it
        sampleRate: 16000 
    }});
    const mediaRecorder = new MediaRecorder(stream);
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

  const stopRecording = (): Promise<{ url: string; base64: string; mimeType: string; } | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        console.warn('Recording not started or already stopped.');
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        try {
            const originalMimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunksRef.current, { type: originalMimeType });
            
            // --- RAW PCM Processing ---
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const arrayBuffer = await audioBlob.arrayBuffer();
            const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Resample to 16kHz as required by Xunfei API
            const pcmSamples = resampleBuffer(decodedBuffer, 16000);

            // Convert Float32 PCM to Int16 PCM
            const samples = new Int16Array(pcmSamples.length);
            for (let i = 0; i < pcmSamples.length; i++) {
                const s = Math.max(-1, Math.min(1, pcmSamples[i]));
                samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            const pcmBlob = new Blob([samples.buffer], { type: 'audio/pcm' });
            const audioUrl = URL.createObjectURL(pcmBlob);
            const base64 = await blobToBase64(pcmBlob);
            
            resolve({ url: audioUrl, base64, mimeType: 'audio/pcm' });
        } catch (error) {
            console.error("Error during PCM processing:", error);
            // Resolve with null or an error state if encoding fails
            resolve(null);
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