export interface Language {
  code: string;
  name: string;
  flag: string;
  speechLocale: string; // The locale code used for window.speechSynthesis, e.g. "en-US", "es-ES"
}

export interface ExampleSentence {
  sentence: string;
  translation: string;
}

export interface DictionaryResult {
  wordOrPhrase: string;
  ipaPronunciation: string;
  definition: string;
  imagePrompt: string;
  fallbackSvg: string;
  exampleSentences: ExampleSentence[];
  usageNote: string;
  generatedImage: string | null;
  nativeLanguage: string;
  targetLanguage: string;
  timestamp: number;
}

export interface StoryVocab {
  word: string;
  meaning: string;
  roleInStory: string;
}

export interface StoryResult {
  title: string;
  storyText: string;
  translationText: string;
  vocabHighlighted: StoryVocab[];
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸", speechLocale: "en-US" },
  { code: "es", name: "Spanish", flag: "🇪🇸", speechLocale: "es-ES" },
  { code: "zh", name: "Mandarin Chinese", flag: "🇨🇳", speechLocale: "zh-CN" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", speechLocale: "ja-JP" },
  { code: "ko", name: "Korean", flag: "🇰🇷", speechLocale: "ko-KR" },
  { code: "hi", name: "Hindi", flag: "🇮🇳", speechLocale: "hi-IN" },
  { code: "fr", name: "French", flag: "🇫🇷", speechLocale: "fr-FR" },
  { code: "ar", name: "Arabic", flag: "🇸🇦", speechLocale: "ar-SA" },
  { code: "bn", name: "Bengali", flag: "🇧🇩", speechLocale: "bn-BD" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹", speechLocale: "pt-PT" },
  { code: "ru", name: "Russian", flag: "🇷🇺", speechLocale: "ru-RU" },
  { code: "ur", name: "Urdu", flag: "🇵🇰", speechLocale: "ur-PK" }
];
