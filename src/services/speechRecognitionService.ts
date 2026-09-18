// NeuroPathshala Speech Recognition Architecture Service
// Clean provider abstraction allowing future backend speech-to-text models (e.g. Santhali ASR)
// to be connected seamlessly without breaking UI logic.
//
// LINGUISTIC ACCURACY:
// 1. Browser SpeechRecognition does not support native Santhali (sat-IN).
// 2. We do not pretend browser SpeechRecognition provides reliable Santhali support.
// 3. For Hindi (hi-IN), browser SpeechRecognition is used when supported.
// 4. Text input is always active as a 100% resilient fallback.
// 5. Voice failure or missing mic never crashes the app.

import {
  SafeSpeechRecognizer,
  SafeSpeechRecognizerOptions,
  SpeechRecognitionState,
  getSpeechCapabilities
} from '../utils/speech';
import { normalizeLanguageCode, Bcp47Language } from './audioService';

export interface VoiceInputSupportStatus {
  supported: boolean;
  languageCode: Bcp47Language;
  message: string;
  providerType: 'browser-speech-recognition' | 'none' | 'backend-service';
}

export interface SpeechRecognitionProvider {
  id: string;
  name: string;
  isVoiceInputSupported(languageCode: string): boolean;
  getVoiceInputStatus(languageCode: string): VoiceInputSupportStatus;
  createRecognizer(options: SafeSpeechRecognizerOptions): {
    start: (lang?: string) => void;
    stop: () => void;
    destroy: () => void;
    getState: () => SpeechRecognitionState;
  };
}

class LocalPrototypeSpeechRecognitionProvider implements SpeechRecognitionProvider {
  public id = 'local-speech-recognition-provider';
  public name = 'Local Speech Recognition Provider';

  public isVoiceInputSupported(languageCode: string): boolean {
    const bcp47 = normalizeLanguageCode(languageCode);
    if (bcp47 === 'sat-IN') {
      // In this prototype, browser SpeechRecognition cannot reliably transcribe Santhali.
      // We do not fake mother-tongue recognition.
      return false;
    }
    const caps = getSpeechCapabilities();
    return caps.speechRecognitionSupported;
  }

  public getVoiceInputStatus(languageCode: string): VoiceInputSupportStatus {
    const bcp47 = normalizeLanguageCode(languageCode);
    if (bcp47 === 'sat-IN') {
      return {
        supported: false,
        languageCode: 'sat-IN',
        message: 'Santhali voice input will be available when the language service is connected.',
        providerType: 'none'
      };
    }

    const caps = getSpeechCapabilities();
    if (caps.speechRecognitionSupported) {
      return {
        supported: true,
        languageCode: 'hi-IN',
        message: 'Hindi browser speech recognition available (hi-IN).',
        providerType: 'browser-speech-recognition'
      };
    }

    return {
      supported: false,
      languageCode: 'hi-IN',
      message: "Voice input isn't supported in this browser. Please use text input.",
      providerType: 'none'
    };
  }

  public createRecognizer(options: SafeSpeechRecognizerOptions) {
    const bcp47 = normalizeLanguageCode(options.lang);

    if (bcp47 === 'sat-IN') {
      // Santhali: notify gracefully and return safe mock
      return {
        start: () => {
          if (options.onError) {
            options.onError(
              'Santhali voice input will be available when the language service is connected. Please type instead.'
            );
          }
          if (options.onEnd) {
            options.onEnd();
          }
        },
        stop: () => {},
        destroy: () => {},
        getState: () => 'idle' as SpeechRecognitionState
      };
    }

    // Hindi/English: use SafeSpeechRecognizer
    const recognizer = new SafeSpeechRecognizer(options);
    return {
      start: (customLang?: string) => recognizer.start(customLang || 'hi-IN'),
      stop: () => recognizer.stop(),
      destroy: () => recognizer.destroy(),
      getState: () => recognizer.getState()
    };
  }
}

// Active provider instance
let activeSpeechRecognitionProvider: SpeechRecognitionProvider =
  new LocalPrototypeSpeechRecognitionProvider();

export function setSpeechRecognitionProvider(provider: SpeechRecognitionProvider): void {
  activeSpeechRecognitionProvider = provider;
}

export function getSpeechRecognitionProvider(): SpeechRecognitionProvider {
  return activeSpeechRecognitionProvider;
}

export function isVoiceInputSupported(languageCode: string): boolean {
  return activeSpeechRecognitionProvider.isVoiceInputSupported(languageCode);
}

export function getVoiceInputStatus(languageCode: string): VoiceInputSupportStatus {
  return activeSpeechRecognitionProvider.getVoiceInputStatus(languageCode);
}

export function createSpeechRecognizer(options: SafeSpeechRecognizerOptions) {
  return activeSpeechRecognitionProvider.createRecognizer(options);
}
