import React from "react";
import { Trash2, GraduationCap, Sparkles, BookOpen, Volume2, Plus, Calendar, BookmarkCheck } from "lucide-react";
import { DictionaryResult } from "../types";
import { speak } from "../utils/speech";

interface NotebookProps {
  notebook: DictionaryResult[];
  onDelete: (index: number) => void;
  onClearAll: () => void;
  onStartStudy: () => void;
  onStartStory: () => void;
}

export default function Notebook({
  notebook,
  onDelete,
  onClearAll,
  onStartStudy,
  onStartStory,
}: NotebookProps) {
  const triggerSpeech = (text: string, locale: string) => {
    // Attempt to map targetLanguage name to speechLocale
    // Find the voice setting based on language name
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

    const targetLocale = languageLocaleMap[locale] || "en-US";
    speak(text, targetLocale);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-12">
      {/* Top Banner and Quick Actions */}
      <div className="bg-lime-300 border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-black tracking-tight flex items-center gap-2">
            My Study Notebook 📚
          </h2>
          <p className="font-bold text-black/80 mt-1">
            You've locked in <span className="underline decoration-2">{notebook.length} words & phrases</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onStartStudy}
            disabled={notebook.length === 0}
            className="px-5 py-3 bg-rose-400 text-black font-extrabold border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-rose-500 transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <GraduationCap className="w-5 h-5" />
            Study Flashcards
          </button>

          <button
            onClick={onStartStory}
            disabled={notebook.length < 2}
            className="px-5 py-3 bg-purple-400 text-white font-extrabold border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-purple-500 transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-yellow-300" />
            Story Time!
          </button>

          {notebook.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to clear your entire notebook?")) {
                  onClearAll();
                }
              }}
              className="px-4 py-3 bg-white hover:bg-gray-100 text-rose-600 font-bold border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {notebook.length === 0 ? (
        <div className="bg-white border-4 border-black rounded-2xl p-12 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-2xl mx-auto">
          <div className="text-6xl mb-4">🔮</div>
          <h3 className="text-2xl font-black text-black">Your Notebook is Empty!</h3>
          <p className="text-gray-600 font-bold mt-2 leading-relaxed">
            Whenever you search for a word, phrase, or sentence, click the{" "}
            <span className="bg-pink-200 border border-black px-1.5 py-0.5 rounded font-black text-xs">
              Save to Notebook
            </span>{" "}
            button to add it here. Once saved, you can study them as flashcards or have the AI build a wacky story!
          </p>
        </div>
      ) : (
        /* Notebook Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {notebook.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border-4 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all relative overflow-hidden"
            >
              {/* Corner language banner */}
              <div className="absolute top-0 right-0 bg-yellow-300 text-black border-l-2 border-b-2 border-black text-[10px] font-black px-2.5 py-1 uppercase tracking-wide">
                {item.targetLanguage}
              </div>

              <div>
                {/* Header info */}
                <div className="flex items-center gap-2 mb-3">
                  <BookmarkCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">
                    Locked in {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>

                {/* Word & Audio */}
                <div className="flex items-center gap-2.5 mb-2.5">
                  <h3 className="text-2xl font-black text-black tracking-tight uppercase">
                    {item.wordOrPhrase}
                  </h3>
                  <button
                    onClick={() => triggerSpeech(item.wordOrPhrase, item.targetLanguage)}
                    className="p-1.5 bg-sky-100 hover:bg-sky-200 text-black border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
                    title="Pronounce"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono font-bold text-purple-600">
                    {item.ipaPronunciation}
                  </span>
                </div>

                {/* Definition */}
                <p className="text-sm font-bold text-gray-700 leading-relaxed mb-4">
                  <span className="bg-lime-200 border border-black px-1.5 py-0.5 rounded text-xs text-lime-900 font-bold mr-1.5">
                    Def:
                  </span>
                  {item.definition}
                </p>

                {/* Two sentences or visual */}
                <div className="flex gap-4 items-start border-t-2 border-dashed border-gray-200 pt-4 mt-4">
                  {/* Miniature concept preview */}
                  <div className="w-16 h-16 shrink-0 bg-amber-50 border-2 border-black rounded-lg overflow-hidden flex items-center justify-center">
                    {item.generatedImage ? (
                      <img
                        src={item.generatedImage}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : item.fallbackSvg ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: item.fallbackSvg }}
                        className="w-4/5 h-4/5 flex items-center justify-center"
                      />
                    ) : (
                      <img
                        src={`https://picsum.photos/seed/${encodeURIComponent(item.wordOrPhrase)}/100/100`}
                        alt="backup"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Sample Sentence preview */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-black truncate italic">
                      "{item.exampleSentences[0]?.sentence || "No examples"}"
                    </p>
                    <p className="text-[10px] font-bold text-gray-500 truncate mt-0.5">
                      {item.exampleSentences[0]?.translation || ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Card Utilities */}
              <div className="flex justify-end border-t border-gray-100 pt-3 mt-4">
                <button
                  onClick={() => onDelete(idx)}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold border border-black rounded-lg text-xs flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
                  title="Remove from Notebook"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
