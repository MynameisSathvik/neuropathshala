import { useState, useEffect, useRef, useCallback } from 'react';
import {
  SafeSpeechRecognizer,
  SpeechRecognitionState,
  getSpeechCapabilities,
  stopSpeechAudio
} from './speech';

interface UseSpeechRecognitionOptions {
  lang?: string;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (friendlyMessage: string) => void;
}

export function useSpeechRecognition({
  lang = 'hi-IN',
  onTranscript,
  onError
}: UseSpeechRecognitionOptions = {}) {
  const [status, setStatus] = useState<SpeechRecognitionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const capabilities = getSpeechCapabilities();
  const isSupported = capabilities.speechRecognitionSupported;

  const recognizerRef = useRef<SafeSpeechRecognizer | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Initialize recognizer once
  useEffect(() => {
    const recognizer = new SafeSpeechRecognizer({
      lang,
      onStateChange: (newState) => {
        setStatus(newState);
      },
      onInterimResult: (transcript) => {
        if (onTranscriptRef.current) {
          onTranscriptRef.current(transcript, false);
        }
      },
      onFinalResult: (transcript) => {
        if (onTranscriptRef.current) {
          onTranscriptRef.current(transcript, true);
        }
      },
      onError: (friendlyMsg) => {
        setErrorMessage(friendlyMsg);
        if (onErrorRef.current) {
          onErrorRef.current(friendlyMsg);
        }
      },
      onEnd: () => {
        setStatus('idle');
      }
    });

    recognizerRef.current = recognizer;

    return () => {
      recognizer.destroy();
      recognizerRef.current = null;
      stopSpeechAudio();
    };
  }, [lang]);

  const startListening = useCallback(
    (customLang?: string) => {
      setErrorMessage(null);
      const targetLang = (customLang || lang).toLowerCase();
      if (
        targetLang.startsWith('sat') ||
        targetLang.includes('santhali') ||
        targetLang.includes('santali')
      ) {
        const msg =
          'Santhali voice input will be available when the language service is connected. Text input is active.';
        setErrorMessage(msg);
        if (onErrorRef.current) {
          onErrorRef.current(msg);
        }
        return;
      }

      if (recognizerRef.current) {
        recognizerRef.current.start(customLang || lang);
      }
    },
    [lang]
  );

  const stopListening = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
  }, []);

  const toggleListening = useCallback(
    (customLang?: string) => {
      if (status === 'listening') {
        stopListening();
      } else {
        startListening(customLang);
      }
    },
    [status, startListening, stopListening]
  );

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    isSupported,
    status,
    errorMessage,
    startListening,
    stopListening,
    toggleListening,
    clearError
  };
}
