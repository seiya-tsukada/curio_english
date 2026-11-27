export interface SpeechController {
  stop: () => void;
}

export function speakSentence(
  text: string,
  options: {
    rate?: number;
    durationSeconds?: number;
    onProgress?: (progress: number, elapsedSec: number) => void;
    onEnd?: () => void;
  } = {}
): SpeechController {
  const rate = options.rate ?? 0.95;
  const estimatedDuration = Math.max(
    2.5,
    (options.durationSeconds ?? text.split(/\s+/).length * 0.45) / rate
  );

  let cancelled = false;
  let timerId: ReturnType<typeof setInterval> | null = null;
  const startTime = Date.now();

  const cleanup = () => {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  };

  // Drive smooth progress updates regardless of whether browser voices fire events
  timerId = setInterval(() => {
    if (cancelled) {
      cleanup();
      return;
    }
    const elapsed = (Date.now() - startTime) / 1000;
    const progress = Math.min(1, elapsed / estimatedDuration);
    options.onProgress?.(progress, Math.min(elapsed, estimatedDuration));

    if (progress >= 1) {
      cleanup();
      options.onEnd?.();
    }
  }, 80);

  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) => v.lang.startsWith('en-US')) ??
        voices.find((v) => v.lang.startsWith('en'));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        if (!cancelled) {
          cancelled = true;
          cleanup();
          options.onProgress?.(1, estimatedDuration);
          options.onEnd?.();
        }
      };

      utterance.onerror = () => {
        // Let fallback progress timer complete gracefully
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      // Fallback progress timer still runs smoothly
    }
  }

  return {
    stop: () => {
      cancelled = true;
      cleanup();
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    },
  };
}
