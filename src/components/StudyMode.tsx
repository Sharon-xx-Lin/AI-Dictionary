import React, { useState } from "react";
import { Volume2, ArrowLeft, ArrowRight, RotateCw, CheckCircle, GraduationCap } from "lucide-react";
import { DictionaryResult } from "../types";
import { speak } from "../utils/speech";

interface StudyModeProps {
  notebook: DictionaryResult[];
  onExit: () => void;
}

export default function StudyMode({ notebook, onExit }: StudyModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [markedCards, setMarkedCards] = useState<Set<number>>(new Set());

  if (notebook.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 pb-12 text-center">
        <p className="text-xl font-black">No cards to study! Save some words first.</p>
        <button onClick={onExit} className="mt-4 px-4 py-2 bg-yellow-300 border-2 border-black rounded-xl">
          Go Back
        </button>
      </div>
    );
  }

  const currentItem = notebook[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIndex < notebook.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const toggleMarkLearned = (idx: number) => {
    const next = new Set(markedCards);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setMarkedCards(next);
  };

  const triggerSpeech = (text: string, localeName: string) => {
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
    const targetLocale = languageLocaleMap[localeName] || "en-US";
    speak(text, targetLocale);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-16">
      {/* Flashcards Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onExit}
          className="px-4 py-2 bg-white text-black font-bold border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000000] hover:bg-gray-50 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Notebook
        </button>

        <div className="flex items-center gap-2 bg-rose-100 border-2 border-black px-3 py-1.5 rounded-xl font-black text-xs uppercase text-rose-950">
          <GraduationCap className="w-4 h-4 text-rose-600" />
          Study Session
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-xs font-black text-gray-500 uppercase mb-2">
          <span>Card {currentIndex + 1} of {notebook.length}</span>
          <span>{markedCards.size} Learned</span>
        </div>
        <div className="w-full h-4 bg-gray-200 border-2 border-black rounded-full overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div
            className="h-full bg-rose-400 transition-all duration-300 border-r-2 border-black"
            style={{ width: `${((currentIndex + 1) / notebook.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* 3D Flashcard container with Neobrutalism card styling */}
      <div className="perspective-1000 w-full aspect-[4/3] max-h-[380px] min-h-[300px] mb-8 relative">
        {/* FRONT OF THE CARD */}
        <div
          onClick={handleFlip}
          className={`absolute w-full h-full backface-hidden bg-amber-50 border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between overflow-hidden transition-all duration-500 cursor-pointer ${
            isFlipped ? "rotate-y-180 opacity-0 pointer-events-none" : "rotate-y-0 opacity-100 pointer-events-auto"
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="bg-yellow-300 text-black text-[10px] border-2 border-black font-black px-2 py-0.5 rounded uppercase tracking-wider">
              {currentItem.targetLanguage}
            </span>

            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerSpeech(currentItem.wordOrPhrase, currentItem.targetLanguage);
                }}
                className="p-2 bg-white hover:bg-sky-100 text-black border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
                title="Pronounce"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Word in Target Language & Concept Art */}
          <div className="flex flex-col items-center justify-center gap-4 my-auto">
            <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight uppercase text-center break-words max-w-full">
              {currentItem.wordOrPhrase}
            </h2>

            {/* Centered card image representing word */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white border-4 border-black rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
              {currentItem.generatedImage ? (
                <img
                  src={currentItem.generatedImage}
                  alt="Visualization"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : currentItem.fallbackSvg ? (
                <div
                  dangerouslySetInnerHTML={{ __html: currentItem.fallbackSvg }}
                  className="w-4/5 h-4/5 flex items-center justify-center"
                />
              ) : (
                <img
                  src={`https://picsum.photos/seed/${encodeURIComponent(currentItem.wordOrPhrase)}/150/150`}
                  alt="concept backup"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          {/* Hint to flip */}
          <div className="flex justify-center items-center gap-1.5 text-xs font-black text-gray-500 uppercase animate-pulse">
            <RotateCw className="w-3.5 h-3.5" />
            Click to Flip & Reveal
          </div>
        </div>

        {/* BACK OF THE CARD */}
        <div
          onClick={handleFlip}
          className={`absolute w-full h-full backface-hidden bg-lime-50 border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between overflow-y-auto transition-all duration-500 cursor-pointer ${
            isFlipped ? "rotate-y-0 opacity-100 pointer-events-auto" : "-rotate-y-180 opacity-0 pointer-events-none"
          }`}
        >
            <div className="flex items-start justify-between border-b-2 border-black pb-2 mb-2">
              <div>
                <h3 className="text-xl font-black text-black uppercase leading-none">
                  {currentItem.wordOrPhrase}
                </h3>
                <span className="text-xs font-mono font-bold text-purple-700">
                  {currentItem.ipaPronunciation}
                </span>
              </div>

              <span className="bg-lime-200 text-lime-900 text-[10px] border-2 border-black font-black px-2 py-0.5 rounded uppercase tracking-wider">
                Native Explanation
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-4">
              {/* Natural language Definition in native */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-wider mb-0.5">
                  Definition ({currentItem.nativeLanguage})
                </h4>
                <p className="text-lg font-bold text-black leading-snug">
                  {currentItem.definition}
                </p>
              </div>

              {/* Example sentence */}
              {currentItem.exampleSentences[0] && (
                <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-black text-purple-700 uppercase">
                      Example
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerSpeech(currentItem.exampleSentences[0].sentence, currentItem.targetLanguage);
                      }}
                      className="p-1 bg-sky-100 hover:bg-sky-200 text-black border border-black rounded-full cursor-pointer"
                      title="Pronounce Example"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-sm font-black text-black italic">
                    "{currentItem.exampleSentences[0].sentence}"
                  </p>
                  <p className="text-xs font-bold text-gray-600 mt-1">
                    {currentItem.exampleSentences[0].translation}
                  </p>
                </div>
              )}
            </div>

            {/* Hint to flip back */}
            <div className="flex justify-center items-center gap-1.5 text-xs font-black text-gray-500 uppercase mt-2">
              <RotateCw className="w-3.5 h-3.5" />
              Click to Flip Back
            </div>
          </div>
        </div>

      {/* Card Controls */}
      <div className="flex justify-between items-center gap-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-4 py-2.5 bg-white border-2 border-black rounded-xl font-bold text-sm shadow-[2px_2px_0px_0px_#000000] active:translate-y-0.5 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        {/* Mark Learned button */}
        <button
          onClick={() => toggleMarkLearned(currentIndex)}
          className={`px-5 py-2.5 border-2 border-black rounded-xl font-black text-sm shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000] transition-all flex items-center gap-1.5 cursor-pointer ${
            markedCards.has(currentIndex)
              ? "bg-emerald-300 text-black"
              : "bg-purple-100 text-black hover:bg-purple-200"
          }`}
        >
          <CheckCircle className={`w-4 h-4 ${markedCards.has(currentIndex) ? "text-emerald-800 fill-emerald-800" : ""}`} />
          {markedCards.has(currentIndex) ? "Learned!" : "Mark Learned"}
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === notebook.length - 1}
          className="px-4 py-2.5 bg-white border-2 border-black rounded-xl font-bold text-sm shadow-[2px_2px_0px_0px_#000000] active:translate-y-0.5 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
        >
          Next
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Study guidelines info card */}
      <div className="mt-12 bg-rose-50 border-2 border-dashed border-black rounded-xl p-4 text-center">
        <p className="text-xs font-bold text-rose-950">
          🧠 TIP: Click on the audio icons to test your listing comprehension! Keep reviewing until you've marked all cards as learned!
        </p>
      </div>
    </div>
  );
}
