import React from "react";
import { BookOpen, BookMarked, Sparkles, GraduationCap } from "lucide-react";

interface HeaderProps {
  currentTab: "search" | "notebook" | "study" | "story";
  setTab: (tab: "search" | "notebook" | "study" | "story") => void;
  notebookCount: number;
}

export default function Header({ currentTab, setTab, notebookCount }: HeaderProps) {
  return (
    <header className="w-full max-w-5xl mx-auto mb-8 px-4">
      <div className="bg-yellow-300 border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-center gap-4 transition-all duration-300">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setTab("search")}>
          <div className="bg-black text-yellow-300 p-2.5 rounded-xl border-2 border-black rotate-[-3deg] hover:rotate-[3deg] transition-transform duration-300 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-black flex items-center gap-1.5 leading-none">
              AI DICTIONARY <span className="text-xl animate-bounce">⚡</span>
            </h1>
            <p className="text-sm font-bold text-black/75 mt-1">
              Learn faster. Play harder. Speak natural!
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap items-center gap-3">
          <button
            id="nav-search-btn"
            onClick={() => setTab("search")}
            className={`px-4 py-2 rounded-xl font-bold border-2 border-black transition-all flex items-center gap-2 ${
              currentTab === "search"
                ? "bg-lime-400 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                : "bg-white text-black hover:bg-gray-100 active:translate-y-[1px]"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Search
          </button>

          <button
            id="nav-notebook-btn"
            onClick={() => setTab("notebook")}
            className={`px-4 py-2 rounded-xl font-bold border-2 border-black transition-all flex items-center gap-2 relative ${
              currentTab === "notebook"
                ? "bg-cyan-400 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                : "bg-white text-black hover:bg-gray-100 active:translate-y-[1px]"
            }`}
          >
            <BookMarked className="w-4 h-4" />
            Notebook
            {notebookCount > 0 && (
              <span className="absolute -top-2.5 -right-2.5 bg-rose-500 text-white border-2 border-black font-black text-xs px-2 py-0.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {notebookCount}
              </span>
            )}
          </button>

          <button
            id="nav-study-btn"
            onClick={() => setTab("study")}
            className={`px-4 py-2 rounded-xl font-bold border-2 border-black transition-all flex items-center gap-2 ${
              currentTab === "study"
                ? "bg-rose-400 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                : "bg-white text-black hover:bg-gray-100 active:translate-y-[1px] disabled:opacity-50 disabled:pointer-events-none"
            }`}
            disabled={notebookCount === 0}
            title={notebookCount === 0 ? "Save words to your Notebook to unlock Study mode!" : "Practice flashcards!"}
          >
            <GraduationCap className="w-4 h-4" />
            Study Mode
          </button>

          <button
            id="nav-story-btn"
            onClick={() => setTab("story")}
            className={`px-4 py-2 rounded-xl font-bold border-2 border-black transition-all flex items-center gap-2 ${
              currentTab === "story"
                ? "bg-purple-400 text-white border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                : "bg-white text-black hover:bg-gray-100 active:translate-y-[1px] disabled:opacity-50 disabled:pointer-events-none"
            }`}
            disabled={notebookCount < 2}
            title={notebookCount < 2 ? "Add at least 2 words to Notebook to unlock AI Story mode!" : "Generate a wild vocabulary story!"}
          >
            <Sparkles className="w-4 h-4" />
            Story Time
          </button>
        </nav>
      </div>
    </header>
  );
}
