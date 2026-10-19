import React, { useState, useEffect } from "react";
import { Sparkles, Loader2, Volume2, ArrowLeft, RefreshCw, BookOpen, Check, Pause, Play, Square } from "lucide-react";
import { DictionaryResult, StoryResult } from "../types";
import { speak, pauseSpeaking, resumeSpeaking, stopSpeaking } from "../utils/speech";

interface StoryGeneratorProps {
  notebook: DictionaryResult[];
  onExit: () => void;
}

const languageLocaleMap: Record<string, string> = {
  English: "en-US",
  Spanish: "es-ES",
  "Mandarin Chinese": "zh-CN",
  Japanese: "ja-JP",
  Korean: "ko-KR",
  Hindi: "hi-IN",
  French: "fr-FR",
  Arabic: "ar-SA",
  Bengali: "bn-BD",
  Portuguese: "pt-PT",
  Russian: "ru-RU",
  Urdu: "ur-PK"
};

interface SpeechChunk {
  text: string;
  locale: string;
  isTarget: boolean;
  rawText: string;
}

export default function StoryGenerator({ notebook, onExit }: StoryGeneratorProps) {
  const [selectedWords, setSelectedWords] = useState<string[]>(
    notebook.map((item) => item.wordOrPhrase)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [story, setStory] = useState<StoryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSpeechKey, setActiveSpeechKey] = useState<string | null>(null);
  const activeSpeechKeyRef = React.useRef<string | null>(null);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);
  const [activeSpeechChunkIndex, setActiveSpeechChunkIndex] = useState<number | null>(null);

  const speechChunksRef = React.useRef<SpeechChunk[]>([]);
  const currentChunkIndexRef = React.useRef<number>(-1);

  const changeActiveSpeechKey = (key: string | null) => {
    setActiveSpeechKey(key);
    activeSpeechKeyRef.current = key;
  };

  // Stop speaking when leaving this component
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Pick target language and native language details from first word
  const defaultItem = notebook[0];
  const targetLanguageName = defaultItem ? defaultItem.targetLanguage : "Spanish";
  const nativeLanguageName = defaultItem ? defaultItem.nativeLanguage : "English";

  const handleToggleWord = (word: string) => {
    if (selectedWords.includes(word)) {
      if (selectedWords.length > 2) {
        setSelectedWords(selectedWords.filter((w) => w !== word));
      }
    } else {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const generateStory = async () => {
    if (selectedWords.length < 2) return;

    setIsLoading(true);
    setError(null);
    setStory(null);

    try {
      const response = await fetch("/api/dictionary/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          words: selectedWords,
          nativeLanguage: nativeLanguageName,
          targetLanguage: targetLanguageName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate story from server. Let's try again!");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setStory(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Oops! Failed to summon the storyteller.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStoryChunks = (text: string): SpeechChunk[] => {
    if (!text) return [];
    const regex = /(\*\*.*?\*\*)/g;
    const parts = text.split(regex);
    const targetLocale = languageLocaleMap[targetLanguageName] || "en-US";
    const nativeLocale = languageLocaleMap[nativeLanguageName] || "zh-CN";

    const chunks: SpeechChunk[] = [];
    for (const part of parts) {
      if (!part) continue;
      if (part.startsWith("**") && part.endsWith("**")) {
        const cleanText = part.slice(2, -2).trim();
        if (cleanText) {
          chunks.push({ text: cleanText, locale: targetLocale, isTarget: true, rawText: part });
        }
      } else {
        chunks.push({ text: part, locale: nativeLocale, isTarget: false, rawText: part });
      }
    }
    return chunks;
  };

  const playNextChunk = () => {
    const idx = currentChunkIndexRef.current + 1;
    if (idx >= speechChunksRef.current.length) {
      // Finished all chunks!
      changeActiveSpeechKey(null);
      setIsSpeechPaused(false);
      setActiveSpeechChunkIndex(null);
      return;
    }

    currentChunkIndexRef.current = idx;
    setActiveSpeechChunkIndex(idx);

    const chunk = speechChunksRef.current[idx];
    
    // Check if chunk has speakable content
    const cleanText = chunk.text.trim();
    // Support basic letters/numbers and CJK/international character sets
    const hasLetters = /[\p{L}\p{N}]/u.test(cleanText);
    
    if (!hasLetters) {
      // Skip non-speakable chunk immediately to keep momentum
      setTimeout(() => {
        if (activeSpeechKeyRef.current === "story_full" && currentChunkIndexRef.current === idx) {
          playNextChunk();
        }
      }, 0);
      return;
    }

    speak(
      cleanText,
      chunk.locale,
      () => {},
      () => {
        // onEnd - play next chunk!
        if (activeSpeechKeyRef.current === "story_full" && currentChunkIndexRef.current === idx) {
          playNextChunk();
        }
      },
      (err) => {
        // onError - skip to next chunk
        console.warn("Speech chunk error:", err);
        if (activeSpeechKeyRef.current === "story_full" && currentChunkIndexRef.current === idx) {
          playNextChunk();
        }
      }
    );
  };

  const triggerSpeech = (text: string, voiceKey: string) => {
    stopSpeaking();
    setIsSpeechPaused(false);

    if (voiceKey === "story_full") {
      const chunks = getStoryChunks(text);
      speechChunksRef.current = chunks;
      currentChunkIndexRef.current = -1;
      changeActiveSpeechKey("story_full");
      playNextChunk();
    } else {
      const speechLocale = languageLocaleMap[targetLanguageName] || "en-US";
      changeActiveSpeechKey(voiceKey);
      setActiveSpeechChunkIndex(null);
      
      const cleanedText = text.replace(/\*\*|__|\*|_/g, "");
      speak(
        cleanedText,
        speechLocale,
        () => {},
        () => {
          changeActiveSpeechKey(null);
          setIsSpeechPaused(false);
        },
        () => {
          changeActiveSpeechKey(null);
          setIsSpeechPaused(false);
        }
      );
    }
  };

  const handlePauseResume = () => {
    if (!activeSpeechKey) return;
    if (isSpeechPaused) {
      resumeSpeaking();
      setIsSpeechPaused(false);
    } else {
      pauseSpeaking();
      setIsSpeechPaused(true);
    }
  };

  const handleStop = () => {
    stopSpeaking();
    changeActiveSpeechKey(null);
    setIsSpeechPaused(false);
    setActiveSpeechChunkIndex(null);
    speechChunksRef.current = [];
    currentChunkIndexRef.current = -1;
  };

  const renderStoryChunks = (chunks: SpeechChunk[]) => {
    return chunks.map((chunk, idx) => {
      const isCurrentlySpeaking = activeSpeechKey === "story_full" && activeSpeechChunkIndex === idx;
      if (chunk.isTarget) {
        const cleanWord = chunk.rawText.slice(2, -2);
        return (
          <span
            key={idx}
            className={`bg-yellow-200 border-2 border-black rounded-lg px-2 py-0.5 mx-1 font-black text-black inline-block shadow-[1.5px_1.5px_0px_0px_#000000] hover:scale-105 transition-all duration-200 ${
              isCurrentlySpeaking ? "ring-4 ring-pink-400 bg-yellow-300 scale-110 shadow-[3px_3px_0px_0px_#000000]" : ""
            }`}
          >
            {cleanWord}
          </span>
        );
      }
      return (
        <span
          key={idx}
          className={`transition-all duration-200 ${
            isCurrentlySpeaking ? "bg-purple-100 text-purple-950 font-black px-1.5 py-0.5 rounded border-2 border-black shadow-[2px_2px_0px_0px_#000000] mx-0.5 inline-block" : ""
          }`}
        >
          {chunk.rawText}
        </span>
      );
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-16">
      {/* Header utility */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onExit}
          className="px-4 py-2 bg-white text-black font-bold border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000000] hover:bg-gray-50 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Notebook
        </button>

        <div className="flex items-center gap-2 bg-purple-100 border-2 border-black px-3 py-1.5 rounded-xl font-black text-xs uppercase text-purple-950">
          <Sparkles className="w-4 h-4 text-purple-600" />
          Story Playground
        </div>
      </div>

      {/* Word selection list panel */}
      {!story && !isLoading && (
        <div className="bg-purple-100 border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black text-black mb-1 flex items-center gap-2">
            🎭 Choose Words for Your Story
          </h2>
          <p className="text-sm font-bold text-gray-700 mb-6">
            Pick which words you want the AI to weave into a custom, funny narrative. Select at least 2!
          </p>

          <div className="flex flex-wrap gap-3 mb-6 bg-white p-4 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] max-h-60 overflow-y-auto">
            {notebook.map((item, i) => {
              const isChecked = selectedWords.includes(item.wordOrPhrase);
              return (
                <button
                  key={i}
                  onClick={() => handleToggleWord(item.wordOrPhrase)}
                  className={`px-3 py-2 border-2 border-black rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer transition-all ${
                    isChecked
                      ? "bg-purple-300 text-black shadow-[2.5px_2.5px_0px_0px_#000000] translate-x-[-1px] translate-y-[-1px]"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <div className={`w-4 h-4 border-2 border-black rounded flex items-center justify-center text-xs ${isChecked ? "bg-black text-white" : "bg-white"}`}>
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  {item.wordOrPhrase}
                </button>
              );
            })}
          </div>

          <button
            onClick={generateStory}
            disabled={selectedWords.length < 2}
            className="w-full py-4 bg-yellow-300 hover:bg-yellow-400 text-black font-black border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] transition-all text-lg disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-purple-700 animate-spin" />
            Write My Vocabulary Story! 🪄
          </button>
        </div>
      )}

      {/* Story Loading view */}
      {isLoading && (
        <div className="bg-white border-4 border-black rounded-2xl p-10 shadow-[6px_6px_0px_0px_#000000] text-center flex flex-col items-center">
          <div className="p-4 bg-purple-200 border-2 border-black rounded-full mb-4 animate-bounce">
            <Sparkles className="w-8 h-8 text-black" />
          </div>
          <h3 className="text-2xl font-black text-black">Weaving the tale...</h3>
          <p className="text-gray-700 font-bold mt-2 max-w-md">
            Gemini is drafting a bizarre, hilarious adventure that binds your target vocabulary together. Prepare to laugh and learn!
          </p>
          <div className="mt-4 flex gap-1.5">
            <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping"></span>
            <span className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-ping [animation-delay:0.2s]"></span>
            <span className="w-2.5 h-2.5 bg-lime-400 rounded-full animate-ping [animation-delay:0.4s]"></span>
          </div>
        </div>
      )}

      {/* Story Error message */}
      {error && (
        <div className="bg-rose-100 border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_#000000] text-center">
          <p className="text-rose-950 font-black text-lg">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-4 px-4 py-2 bg-white border-2 border-black rounded-xl font-bold shadow-[2px_2px_0px_0px_#000000] hover:bg-gray-50 active:translate-y-0.5"
          >
            Retry Selection
          </button>
        </div>
      )}

      {/* Story Result Showcase */}
      {story && (
        <div className="flex flex-col gap-8">
          {/* Main Story Box */}
          <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-6">
              <div>
                <span className="text-[10px] font-black uppercase text-purple-600 bg-purple-100 border-2 border-black px-2.5 py-0.5 rounded-full tracking-wider">
                  AI Original Story ({targetLanguageName})
                </span>
                <h2 className="text-3xl font-black text-black mt-2 tracking-tight uppercase">
                  {story.title}
                </h2>
              </div>

              <div className="flex gap-2 shrink-0">
                <div className="flex items-center gap-2 bg-gray-50 border-2 border-black p-1.5 rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {activeSpeechKey === "story_full" ? (
                    <>
                      <button
                        onClick={handlePauseResume}
                        className={`p-2.5 border-2 border-black rounded-xl cursor-pointer transition-all active:translate-y-0.5 flex items-center justify-center ${
                          isSpeechPaused ? "bg-green-300 hover:bg-green-400" : "bg-yellow-300 hover:bg-yellow-400"
                        }`}
                        title={isSpeechPaused ? "Resume narrative" : "Pause narrative"}
                      >
                        {isSpeechPaused ? <Play className="w-4 h-4 fill-black text-black" /> : <Pause className="w-4 h-4 fill-black text-black" />}
                      </button>
                      <button
                        onClick={handleStop}
                        className="p-2.5 bg-rose-300 hover:bg-rose-400 border-2 border-black rounded-xl cursor-pointer transition-all active:translate-y-0.5 flex items-center justify-center"
                        title="Stop reading aloud"
                      >
                        <Square className="w-4 h-4 fill-black text-black" />
                      </button>
                      <span className="text-[10px] font-black uppercase text-rose-600 px-2 animate-pulse">
                        {isSpeechPaused ? "Paused" : "Playing"}
                      </span>
                    </>
                  ) : (
                    <button
                      onClick={() => triggerSpeech(story.storyText, "story_full")}
                      className="px-4 py-2 bg-sky-200 hover:bg-sky-300 text-black font-bold border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer transition-all flex items-center gap-1.5 text-xs uppercase"
                      title="Read story aloud"
                    >
                      <Volume2 className="w-4 h-4 text-black animate-bounce" />
                      Read Aloud
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Story text body */}
            <div className="text-lg font-bold text-gray-900 leading-relaxed bg-amber-50/50 p-5 border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 whitespace-pre-wrap">
              {renderStoryChunks(getStoryChunks(story.storyText))}
            </div>

            {/* Translation helper block */}
            <div className="bg-lime-50 border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h4 className="text-xs font-black uppercase text-lime-900/60 tracking-wider mb-2">
                Bilingual Translation ({nativeLanguageName})
              </h4>
              <p className="text-sm font-bold text-lime-950 leading-relaxed whitespace-pre-wrap">
                {story.translationText}
              </p>
            </div>
          </div>

          {/* Interactive Vocabulary Context Deck */}
          <div className="bg-yellow-100 border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black text-black mb-4 flex items-center gap-1.5 uppercase">
              <BookOpen className="w-5 h-5 text-black" />
              Story Vocabulary Role-Call
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {story.vocabHighlighted.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-sm font-bold text-gray-400 uppercase">
                        #{idx + 1}
                      </span>
                      <button
                        onClick={() => {
                          if (activeSpeechKey === `vocab_${idx}`) {
                            handleStop();
                          } else {
                            triggerSpeech(item.word, `vocab_${idx}`);
                          }
                        }}
                        className={`p-1 border border-black rounded-full cursor-pointer transition-colors ${
                          activeSpeechKey === `vocab_${idx}` ? "bg-rose-300 animate-pulse" : "bg-sky-100 hover:bg-sky-200"
                        }`}
                        title={activeSpeechKey === `vocab_${idx}` ? "Stop pronouncing" : "Pronounce"}
                      >
                        {activeSpeechKey === `vocab_${idx}` ? (
                          <Square className="w-3.5 h-3.5 text-black fill-black" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-black" />
                        )}
                      </button>
                    </div>

                    <h4 className="text-xl font-black text-black uppercase mb-1">
                      {item.word}
                    </h4>
                    <p className="text-sm font-extrabold text-purple-800 italic">
                      Meaning: {item.meaning}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-dashed border-gray-200 text-xs text-gray-600 font-bold">
                    <span className="text-black font-extrabold block">Context:</span>
                    {item.roleInStory}
                  </div>
                </div>
              ))}
            </div>

            {/* Try again buttons */}
            <div className="flex justify-center mt-8">
              <button
                onClick={() => {
                  setStory(null);
                  setSelectedWords(notebook.map((item) => item.wordOrPhrase));
                }}
                className="px-6 py-3 bg-white hover:bg-gray-50 text-black font-black border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Change Words / Write Another Story
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
