import React, { useState, useRef, useEffect } from "react";
import { Search, Volume2, Save, Check, Sparkles, Loader2, ArrowRightLeft, BookOpen, XCircle } from "lucide-react";
import { DictionaryResult, SUPPORTED_LANGUAGES } from "../types";
import { speak } from "../utils/speech";

interface MainDictionaryProps {
  onSaveToNotebook: (result: DictionaryResult) => void;
  savedWordsKeys: Set<string>; // Set of targetLanguage + "_" + wordOrPhrase
  onNavigateToNotebook: () => void;
}

export default function MainDictionary({
  onSaveToNotebook,
  savedWordsKeys,
  onNavigateToNotebook,
}: MainDictionaryProps) {
  const [nativeCode, setNativeCode] = useState(() => {
    try {
      return localStorage.getItem("ai_dict_native_code") || "en";
    } catch {
      return "en";
    }
  });
  const [targetCode, setTargetCode] = useState(() => {
    try {
      return localStorage.getItem("ai_dict_target_code") || "es";
    } catch {
      return "es";
    }
  });
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sound active state trackers
  const [activeVoiceKey, setActiveVoiceKey] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const nativeLanguage = SUPPORTED_LANGUAGES.find((l) => l.code === nativeCode)!;
  const targetLanguage = SUPPORTED_LANGUAGES.find((l) => l.code === targetCode)!;

  const changeNativeCode = (code: string) => {
    setNativeCode(code);
    try {
      localStorage.setItem("ai_dict_native_code", code);
    } catch (e) {
      console.error(e);
    }
  };

  const changeTargetCode = (code: string) => {
    setTargetCode(code);
    try {
      localStorage.setItem("ai_dict_target_code", code);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwapLanguages = () => {
    const temp = nativeCode;
    changeNativeCode(targetCode);
    changeTargetCode(temp);
    setResult(null);
  };

  const handleCancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/dictionary/define", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputText: inputText.trim(),
          nativeLanguage: nativeLanguage.name,
          targetLanguage: targetLanguage.name,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch definition from our server. Please try again!");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const fullResult: DictionaryResult = {
        wordOrPhrase: data.wordOrPhrase || inputText,
        ipaPronunciation: data.ipaPronunciation || "",
        definition: data.definition || "",
        imagePrompt: data.imagePrompt || "",
        fallbackSvg: data.fallbackSvg || "",
        exampleSentences: data.exampleSentences || [],
        usageNote: data.usageNote || "",
        generatedImage: data.generatedImage || null,
        nativeLanguage: nativeLanguage.name,
        targetLanguage: targetLanguage.name,
        timestamp: Date.now(),
      };

      setResult(fullResult);
    } catch (err: any) {
      if (err.name === "AbortError") {
        setError("Search canceled by user.");
      } else {
        console.error(err);
        setError(err.message || "Oops! Something went wrong while searching.");
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsLoading(false);
      }
    }
  };

  const triggerSpeech = (text: string, voiceKey: string) => {
    setActiveVoiceKey(voiceKey);
    speak(
      text,
      targetLanguage.speechLocale,
      () => {},
      () => setActiveVoiceKey(null),
      (err) => {
        console.error("SpeechSynthesis error:", err);
        setActiveVoiceKey(null);
      }
    );
  };

  const isSaved = result
    ? savedWordsKeys.has(`${result.targetLanguage.toLowerCase()}_${result.wordOrPhrase.toLowerCase()}`)
    : false;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-12">
      {/* Search Console */}
      <div className="bg-cyan-100 border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8">
        <h2 className="text-2xl font-black text-black mb-4 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-black" />
          Word Explorer
        </h2>

        <form onSubmit={handleSearch} className="flex flex-col gap-6">
          {/* Language Selectors */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex-1 w-full">
              <label className="block text-xs font-black uppercase text-gray-500 mb-1">
                My Native Language
              </label>
              <select
                id="native-lang-select"
                value={nativeCode}
                onChange={(e) => {
                  changeNativeCode(e.target.value);
                  setResult(null);
                }}
                className="w-full bg-transparent border-0 font-bold text-lg text-black focus:ring-0 focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              id="swap-lang-btn"
              onClick={handleSwapLanguages}
              className="p-2 bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5"
              title="Swap Languages"
            >
              <ArrowRightLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 w-full">
              <label className="block text-xs font-black uppercase text-gray-500 mb-1">
                Target Language to Learn
              </label>
              <select
                id="target-lang-select"
                value={targetCode}
                onChange={(e) => {
                  changeTargetCode(e.target.value);
                  setResult(null);
                }}
                className="w-full bg-transparent border-0 font-bold text-lg text-black focus:ring-0 focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Bar Input */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                id="search-word-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Type a word, phrase, or sentence in ${targetLanguage.name}...`}
                className="w-full bg-white border-2 border-black rounded-xl py-3.5 pl-4 pr-12 text-black font-semibold placeholder:text-gray-400 focus:outline-none focus:ring-0 shadow-[3px_3px_0px_0px_#000000] focus:shadow-[1px_1px_0px_0px_#000000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
                disabled={isLoading}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {targetLanguage.flag}
              </span>
            </div>

            <button
              type="submit"
              id="search-submit-btn"
              disabled={isLoading || !inputText.trim()}
              className="px-6 py-3.5 bg-yellow-300 hover:bg-yellow-400 text-black font-extrabold border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000000] active:shadow-[1px_1px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              Explore
            </button>
          </div>
        </form>
      </div>

      {/* Loading Screen */}
      {isLoading && (
        <div className="bg-white border-4 border-black rounded-2xl p-10 shadow-[6px_6px_0px_0px_#000000] text-center flex flex-col items-center">
          <div className="p-4 bg-purple-200 border-2 border-black rounded-2xl rotate-[-6deg] mb-4">
            <Loader2 className="w-10 h-10 animate-spin text-black" />
          </div>
          <h3 className="text-2xl font-black text-black">Consulting the AI Gods...</h3>
          <p className="text-gray-700 font-bold mt-2 max-w-md">
            Translating, drafting funny culture insights, and sketching a custom visualization concept. Hang tight!
          </p>
          <div className="flex gap-2 mt-4 mb-6">
            <span className="w-3 h-3 rounded-full bg-pink-400 animate-bounce delay-100"></span>
            <span className="w-3 h-3 rounded-full bg-cyan-400 animate-bounce delay-200"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce delay-300"></span>
          </div>

          <button
            type="button"
            onClick={handleCancelSearch}
            className="px-5 py-2.5 bg-rose-200 hover:bg-rose-300 text-black font-extrabold border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000000] active:shadow-[1px_1px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-1.5 text-xs uppercase"
            title="Cancel search"
          >
            <XCircle className="w-4 h-4 text-black" />
            Cancel Search
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-rose-100 border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_#000000] text-center">
          <div className="inline-block p-2 bg-rose-200 border-2 border-black rounded-xl mb-3 text-2xl">
            💥
          </div>
          <p className="text-rose-950 font-black text-lg">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-4 px-4 py-1.5 bg-white border-2 border-black rounded-lg font-bold text-sm shadow-[2px_2px_0px_0px_#000000] hover:bg-gray-50 active:translate-y-0.5"
          >
            Clear Error
          </button>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative transition-all duration-300">
          {/* Top Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-black">
            <div className="flex items-center gap-2">
              <span className="bg-yellow-200 text-xs px-3 py-1 border-2 border-black rounded-full font-black uppercase tracking-wider">
                {result.targetLanguage} ➜ {result.nativeLanguage}
              </span>
            </div>

            <button
              onClick={() => onSaveToNotebook(result)}
              className={`px-4 py-2 border-2 border-black rounded-xl font-black text-sm flex items-center gap-2 transition-all ${
                isSaved
                  ? "bg-emerald-300 text-black shadow-[2px_2px_0px_0px_#000000]"
                  : "bg-pink-300 text-black hover:bg-pink-400 shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-800" />
                  Saved to Notebook
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save to Notebook
                </>
              )}
            </button>
          </div>

          {/* Main Visual Title Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Word Definition + Audio */}
            <div className="md:col-span-7 flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-4xl font-black text-black tracking-tight uppercase leading-tight">
                    {result.wordOrPhrase}
                  </h3>

                  <button
                    onClick={() => triggerSpeech(result.wordOrPhrase, "main")}
                    className={`p-2.5 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000000] transition-all cursor-pointer ${
                      activeVoiceKey === "main"
                        ? "bg-rose-400 animate-pulse translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0px_0px_#000000]"
                        : "bg-sky-200 hover:bg-sky-300 hover:scale-105"
                    }`}
                    title="Play pronunciation"
                  >
                    <Volume2 className="w-5 h-5 text-black" />
                  </button>

                  {activeVoiceKey === "main" && (
                    <div className="flex gap-1 items-center bg-gray-100 px-2 py-1 rounded-full border border-black text-xs font-bold animate-pulse">
                      <span className="w-1.5 h-3 bg-rose-500 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-4 bg-rose-500 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                      <span className="w-1.5 h-3 bg-rose-500 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                      Speaking
                    </div>
                  )}
                </div>

                <div className="font-mono text-sm text-gray-500 font-bold mt-1.5 flex items-center gap-1.5">
                  <span className="bg-gray-100 border border-gray-300 px-2 py-0.5 rounded text-xs font-black">
                    IPA
                  </span>
                  <span className="text-purple-600">{result.ipaPronunciation}</span>
                </div>
              </div>

              {/* Natural Definition */}
              <div className="bg-lime-50 border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_#000000]">
                <h4 className="text-xs font-black uppercase text-lime-900/60 tracking-wider mb-1">
                  Definition
                </h4>
                <p className="text-lg font-bold text-lime-950 leading-relaxed">
                  {result.definition}
                </p>
              </div>
            </div>

            {/* AI Concept Visualization */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="w-full bg-amber-50 border-4 border-black rounded-xl p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col items-center justify-center">
                <span className="absolute top-1.5 left-1.5 bg-black text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest z-10">
                  Concept Art
                </span>

                {result.generatedImage ? (
                  <img
                    src={result.generatedImage}
                    alt={result.wordOrPhrase}
                    referrerPolicy="no-referrer"
                    className="w-full aspect-square object-cover rounded-lg border-2 border-black"
                  />
                ) : result.fallbackSvg ? (
                  <div className="w-full aspect-square rounded-lg border-2 border-black bg-white flex items-center justify-center relative overflow-hidden">
                    <div
                      dangerouslySetInnerHTML={{ __html: result.fallbackSvg }}
                      className="w-3/4 h-3/4 flex items-center justify-center"
                    />
                    <img
                      src={`https://picsum.photos/seed/${encodeURIComponent(result.wordOrPhrase)}/400/400`}
                      alt="backup"
                      className="hidden"
                    />
                    <div className="absolute bottom-1 right-1 bg-yellow-300 text-black border border-black rounded px-1.5 text-[8px] font-bold">
                      SVG Generated
                    </div>
                  </div>
                ) : (
                  <img
                    src={`https://picsum.photos/seed/${encodeURIComponent(result.wordOrPhrase)}/400/400`}
                    alt={result.wordOrPhrase}
                    referrerPolicy="no-referrer"
                    className="w-full aspect-square object-cover rounded-lg border-2 border-black"
                  />
                )}
                <p className="text-[10px] font-mono text-gray-500 mt-2 text-center truncate w-full italic" title={result.imagePrompt}>
                  "{result.imagePrompt.slice(0, 50)}..."
                </p>
              </div>
            </div>
          </div>

          {/* Example Sentences */}
          <div className="mt-8">
            <h4 className="text-xl font-black text-black mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Real-world Examples
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.exampleSentences.map((ex, i) => (
                <div
                  key={i}
                  className="bg-purple-50 border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_#000000] flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base font-extrabold text-black leading-relaxed italic">
                      "{ex.sentence}"
                    </p>
                    <button
                      onClick={() => triggerSpeech(ex.sentence, `ex_${i}`)}
                      className={`p-2 rounded-full border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000000] cursor-pointer transition-all shrink-0 ${
                        activeVoiceKey === `ex_${i}`
                          ? "bg-rose-400 animate-pulse scale-95"
                          : "bg-white hover:bg-purple-100"
                      }`}
                    >
                      <Volume2 className="w-4 h-4 text-black" />
                    </button>
                  </div>
                  <div className="border-t border-purple-200 pt-2 text-sm font-bold text-purple-900">
                    {ex.translation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chatty, Casual Usage Note */}
          <div className="mt-8 bg-amber-100 border-4 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-2xl">🗣️</span>
              <h4 className="text-lg font-black text-black uppercase tracking-tight">
                TUTOR INSIGHT (Strictly Off-The-Record)
              </h4>
            </div>
            <p className="text-black font-bold leading-relaxed whitespace-pre-wrap">
              {result.usageNote}
            </p>
          </div>

          {/* Prompting action to Notebook if not saved */}
          {!isSaved && (
            <div className="mt-8 text-center bg-gray-50 border-2 border-dashed border-black rounded-xl p-4">
              <p className="text-sm font-bold text-gray-600">
                Loved this explanation? Save it to review later or generate high-quality AI memory stories!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
