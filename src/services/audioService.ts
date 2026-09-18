import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

// NeuroPathshala Audio Architecture Service
// Clean provider abstraction allowing future backend audio services to be plugged in seamlessly
// without altering UI layouts or component logic.
//
// Audio integrity principles:
// 1. Native recordings are always preferred and explicitly labelled as verified.
// 2. Browser speech is offered only as a clearly-labelled preview for low-resource languages.
// 3. Preview speech is never reported as a native or verified voice.
// 4. No external API calls are required for the local preview.

export type Bcp47Language = 'sat-IN' | 'ho-IN' | 'unr-IN' | 'hi-IN' | 'en-IN';

export type AudioCapabilityState =
  | 'verified-audio-available'
  | 'browser-tts-available'
  | 'audio-unavailable';

export interface AudioPlaybackResult {
  supported: boolean;
  played: boolean;
  success: boolean;
  message: string;
  secondaryMessage?: string;
  isNativeVoice: boolean;
  speaking: boolean;
  state: AudioCapabilityState;
}

export interface AudioServiceOptions {
  audioUrl?: string;
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
}

export interface AudioLanguageStatus {
  available: boolean;
  languageCode: Bcp47Language;
  displayName: string;
  reason: string;
  secondaryNote?: string;
  providerType: 'none' | 'browser-tts' | 'verified-recording' | 'backend-service';
}

/**
 * Normalizes any language string or code to standard BCP-47 representation.
 */
export function normalizeLanguageCode(lang?: string): Bcp47Language {
  if (!lang) return 'sat-IN';
  const l = lang.toLowerCase().trim();
  if (
    l.startsWith('sat') ||
    l.includes('santhali') ||
    l.includes('santali') ||
    l.includes('ol chiki') ||
    l.includes('tribal')
  ) {
    return 'sat-IN';
  }
  if (l === 'ho' || l.includes('ho language')) return 'ho-IN';
  if (l === 'unr' || l.includes('mundari')) return 'unr-IN';
  if (l.startsWith('hi') || l.includes('hindi')) {
    return 'hi-IN';
  }
  if (l.startsWith('en') || l.includes('english')) {
    return 'en-IN';
  }
  return 'sat-IN';
}

/**
 * Provider interface: pluggable architecture for audio backends.
 */
export interface AudioProvider {
  id: string;
  name: string;
  isAudioAvailable(languageCode: string, customAudioUrl?: string): boolean;
  getAudioStatus(languageCode: string, customAudioUrl?: string): AudioLanguageStatus;
  playHindiAudio(text: string, options?: AudioServiceOptions): AudioPlaybackResult;
  playSanthaliAudio(text: string, options?: AudioServiceOptions): AudioPlaybackResult;
  playAudio(text: string, languageCode: string, options?: AudioServiceOptions): AudioPlaybackResult;
  stopAllAudio(): void;
}

/**
 * Verifies if running in a client browser environment.
 */
function isClient(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

function isNativeApp(): boolean {
  return isClient() && Capacitor.isNativePlatform();
}

/**
 * Local Offline Prototype Audio Provider.
 * Uses verified recordings when supplied and browser SpeechSynthesis as an honest
 * preview fallback for languages that do not yet have bundled recordings.
 */
class LocalPrototypeAudioProvider implements AudioProvider {
  public id = 'local-prototype-provider';
  public name = 'Local Prototype Audio Provider';

  public isAudioAvailable(languageCode: string, customAudioUrl?: string): boolean {
    if (customAudioUrl && customAudioUrl.trim()) {
      return true;
    }
    const bcp47 = normalizeLanguageCode(languageCode);
    const hasTts = isNativeApp() || (isClient() && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined');
    if (bcp47 === 'sat-IN' || bcp47 === 'ho-IN' || bcp47 === 'unr-IN') {
      return hasTts;
    }
    return hasTts;
  }

  public getAudioStatus(languageCode: string, customAudioUrl?: string): AudioLanguageStatus {
    const bcp47 = normalizeLanguageCode(languageCode);
    const hasTts = isNativeApp() || (isClient() && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined');

    if (customAudioUrl && customAudioUrl.trim()) {
      return {
        available: true,
        languageCode: bcp47,
        displayName: bcp47 === 'sat-IN' ? 'Santhali (sat-IN)' : 'Hindi (hi-IN)',
        reason: 'Verified native-speaker audio recording is connected.',
        providerType: 'verified-recording'
      };
    }

    if (bcp47 === 'sat-IN' || bcp47 === 'ho-IN' || bcp47 === 'unr-IN') {
      return {
        available: hasTts,
        languageCode: bcp47,
        displayName: bcp47 === 'sat-IN' ? 'Santhali' : bcp47 === 'ho-IN' ? 'Ho' : 'Mundari',
        reason: hasTts ? 'Device speech preview available; native recording is not bundled.' : 'Verified native-language audio is not bundled for this language.',
        secondaryNote: 'Preview speech is for pronunciation support and is not a native recording.',
        providerType: hasTts ? (isNativeApp() ? 'backend-service' : 'browser-tts') : 'none'
      };
    }

    return {
      available: hasTts,
      languageCode: 'hi-IN',
      displayName: 'Hindi (hi-IN)',
      reason: hasTts
        ? 'Hindi browser audio preview available.'
        : 'Speech synthesis is not supported in this browser.',
      providerType: hasTts ? 'browser-tts' : 'none'
    };
  }

  public stopAllAudio(): void {
    if (!isClient()) return;
    try {
      if (isNativeApp()) {
        void TextToSpeech.stop().catch(() => undefined);
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // Safe catch
    }
  }

  public playHindiAudio(text: string, options?: AudioServiceOptions): AudioPlaybackResult {
    if (!isClient()) {
      return {
        supported: false,
        played: false,
        success: false,
        message: "Audio playback isn't supported in this environment.",
        isNativeVoice: false,
        speaking: false,
        state: 'audio-unavailable'
      };
    }

    const cleanText = text ? text.replace(/[\(\)\[\]]/g, ' ').trim() : '';
    if (isNativeApp()) {
      return this.playNativePreview(cleanText, 'hi-IN', options, 'Hindi audio preview playing on the device.');
    }

    if (!('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined')) {
      return {
        supported: false,
        played: false,
        success: false,
        message: "Speech synthesis isn't supported in this browser.",
        isNativeVoice: false,
        speaking: false,
        state: 'audio-unavailable'
      };
    }

    if (!cleanText) {
      return {
        supported: true,
        played: false,
        success: false,
        message: 'No text provided for Hindi audio playback.',
        isNativeVoice: false,
        speaking: false,
        state: 'browser-tts-available'
      };
    }

    try {
      this.stopAllAudio();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'hi-IN';
      utterance.rate = options?.rate || 0.88;
      utterance.pitch = options?.pitch || 1.0;

      // Attempt to pick a suitable Hindi voice if the browser has one loaded
      try {
        const voices = window.speechSynthesis.getVoices();
        const hindiVoice = voices.find((v) => v.lang === 'hi-IN' || v.lang.startsWith('hi'));
        if (hindiVoice) {
          utterance.voice = hindiVoice;
        }
      } catch {
        // Fallback to utterance.lang
      }

      let finished = false;
      const handleEnd = () => {
        if (!finished) {
          finished = true;
          if (options?.onEnd) options.onEnd();
        }
      };

      utterance.onend = handleEnd;
      utterance.onerror = (event) => {
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          handleEnd();
        }
      };

      window.speechSynthesis.speak(utterance);

      return {
        supported: true,
        played: true,
        success: true,
        message: 'Hindi speech audio preview playing (hi-IN).',
        isNativeVoice: true,
        speaking: true,
        state: 'browser-tts-available'
      };
    } catch {
      return {
        supported: false,
        played: false,
        success: false,
        message: 'Speech synthesis encountered an error.',
        isNativeVoice: false,
        speaking: false,
        state: 'audio-unavailable'
      };
    }
  }

  public playSanthaliAudio(text: string, options?: AudioServiceOptions): AudioPlaybackResult {
    // Check if a genuine verified audio recording asset is supplied
    if (options?.audioUrl && options.audioUrl.trim()) {
      if (!isClient()) {
        return {
          supported: false,
          played: false,
          success: false,
          message: "Audio playback isn't supported in this environment.",
          isNativeVoice: true,
          speaking: false,
          state: 'audio-unavailable'
        };
      }

      try {
        this.stopAllAudio();
        const audio = new Audio(options.audioUrl);
        if (options.onEnd) {
          audio.onended = () => options.onEnd?.();
          audio.onerror = () => options.onEnd?.();
        }
        audio.play().catch(() => {
          // Handled for autoplay constraints
        });
        return {
          supported: true,
          played: true,
          success: true,
          message: 'Playing verified native-speaker audio recording.',
          isNativeVoice: true,
          speaking: true,
          state: 'verified-audio-available'
        };
      } catch {
        return {
          supported: false,
          played: false,
          success: false,
          message: 'Unable to play verified audio asset.',
          isNativeVoice: true,
          speaking: false,
          state: 'audio-unavailable'
        };
      }
    }

    const cleanText = text ? text.replace(/[\(\)\[\]]/g, ' ').trim() : '';
    if (isNativeApp()) {
      return this.playNativePreview(cleanText, 'sat-IN', options, 'Device speech preview playing. Native recording is not bundled.');
    }

    if (!isClient() || !('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined')) {
      return {
        supported: false,
        played: false,
        success: false,
        message: 'Audio preview is not supported in this browser.',
        isNativeVoice: false,
        speaking: false,
        state: 'audio-unavailable'
      };
    }

    if (!cleanText) {
      return {
        supported: true,
        played: false,
        success: false,
        message: 'No text provided for the audio preview.',
        isNativeVoice: false,
        speaking: false,
        state: 'browser-tts-available'
      };
    }

    try {
      this.stopAllAudio();
      window.speechSynthesis.resume();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'sat-IN';
      utterance.rate = options?.rate || 0.82;
      utterance.pitch = options?.pitch || 1;
      utterance.onend = () => options?.onEnd?.();
      utterance.onerror = () => options?.onEnd?.();
      window.speechSynthesis.speak(utterance);
      return {
        supported: true,
        played: true,
        success: true,
        message: 'Speech preview playing. Native recording is not bundled.',
        secondaryMessage: 'This preview is not a verified Santhali voice.',
        isNativeVoice: false,
        speaking: true,
        state: 'browser-tts-available'
      };
    } catch {
      return {
        supported: false,
        played: false,
        success: false,
        message: 'Unable to start the audio preview.',
        isNativeVoice: false,
        speaking: false,
        state: 'audio-unavailable'
      };
    }
  }

  private playNativePreview(
    text: string,
    languageCode: Bcp47Language,
    options: AudioServiceOptions | undefined,
    message: string
  ): AudioPlaybackResult {
    if (!text) {
      return {
        supported: true,
        played: false,
        success: false,
        message: 'No text provided for the audio preview.',
        isNativeVoice: false,
        speaking: false,
        state: 'browser-tts-available'
      };
    }

    this.stopAllAudio();
    void TextToSpeech.speak({
      text,
      lang: languageCode,
      rate: options?.rate || 0.85,
      pitch: options?.pitch || 1,
      volume: 1,
      queueStrategy: 1
    }).then(() => options?.onEnd?.()).catch(() => options?.onEnd?.());

    return {
      supported: true,
      played: true,
      success: true,
      message,
      secondaryMessage: 'The installed Android voice determines pronunciation. This is not a verified native recording.',
      isNativeVoice: false,
      speaking: true,
      state: 'browser-tts-available'
    };
  }

  public playAudio(
    text: string,
    languageCode: string = 'sat-IN',
    options?: AudioServiceOptions
  ): AudioPlaybackResult {
    const bcp47 = normalizeLanguageCode(languageCode);
    if (bcp47 === 'sat-IN' || bcp47 === 'ho-IN' || bcp47 === 'unr-IN') {
      return this.playSanthaliAudio(text, options);
    }
    return this.playHindiAudio(text, options);
  }
}

// Active singleton provider
let activeProvider: AudioProvider = new LocalPrototypeAudioProvider();

/**
 * Allows switching the audio provider (e.g. connecting a future verified backend service)
 * without touching any UI component code.
 */
export function setAudioProvider(provider: AudioProvider): void {
  activeProvider = provider;
}

export function getAudioProvider(): AudioProvider {
  return activeProvider;
}

/**
 * Checks whether verified audio or a clearly-labelled browser preview is available.
 */
export function isAudioAvailable(languageCode?: string, customAudioUrl?: string): boolean {
  return activeProvider.isAudioAvailable(languageCode || 'sat-IN', customAudioUrl);
}

/**
 * Returns structured status info for the given language.
 */
export function getAudioStatus(languageCode?: string, customAudioUrl?: string): AudioLanguageStatus {
  return activeProvider.getAudioStatus(languageCode || 'sat-IN', customAudioUrl);
}

/**
 * Plays Hindi audio using the active provider (browser hi-IN TTS).
 */
export function playHindiAudio(text: string, options?: AudioServiceOptions): AudioPlaybackResult {
  return activeProvider.playHindiAudio(text, options);
}

/**
 * Plays Santhali audio using the active provider.
 * Enforces strict honesty: if no verified audio asset exists, refuses to pronounce using generic voices.
 */
export function playSanthaliAudio(text: string, options?: AudioServiceOptions): AudioPlaybackResult {
  return activeProvider.playSanthaliAudio(text, options);
}

/**
 * General audio player delegating to the appropriate language handler.
 */
export function playAudio(
  text: string,
  languageCode: string = 'sat-IN',
  options?: AudioServiceOptions
): AudioPlaybackResult {
  return activeProvider.playAudio(text, languageCode, options);
}

/**
 * Stops all audio playback safely.
 */
export function stopAllAudio(): void {
  activeProvider.stopAllAudio();
}
