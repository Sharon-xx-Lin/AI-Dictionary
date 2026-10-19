/**
 * Text-to-Speech (TTS) Pronunciation Helper
 * Uses window.speechSynthesis to read target language phrases naturally.
 */

export function speak(
  text: string,
  locale: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    if (onError) onError("Speech synthesis is not supported in this browser.");
    return;
  }

  // Cancel any active speech first
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  
  // Set some options for natural, warm pacing
  utterance.rate = 0.9;  // Slightly slower for learning clarity
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Try to find a premium or natural voice matching the locale
  const voices = window.speechSynthesis.getVoices();
  const matchingVoices = voices.filter(
    (v) => v.lang.toLowerCase() === locale.toLowerCase() || v.lang.toLowerCase().startsWith(locale.split("-")[0].toLowerCase())
  );

  if (matchingVoices.length > 0) {
    // Prefer Google, Premium, or Neural voices if available for a natural sound
    const premiumVoice = matchingVoices.find(
      (v) =>
        v.name.includes("Google") ||
        v.name.includes("Natural") ||
        v.name.includes("Neural") ||
        v.name.includes("Premium")
    );
    utterance.voice = premiumVoice || matchingVoices[0];
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  utterance.onerror = (e) => {
    // 'interrupted' and 'canceled' are standard events when switching between audio elements
    if (e.error === "interrupted" || e.error === "canceled") {
      if (onEnd) onEnd();
      return;
    }
    console.warn("Speech synthesis info:", e.error, e);
    if (onEnd) onEnd();
    if (onError) onError(e);
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function pauseSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.resume();
  }
}

