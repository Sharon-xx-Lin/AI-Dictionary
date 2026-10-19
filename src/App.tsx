import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import MainDictionary from "./components/MainDictionary";
import Notebook from "./components/Notebook";
import StudyMode from "./components/StudyMode";
import StoryGenerator from "./components/StoryGenerator";
import { DictionaryResult } from "./types";
import { Sparkles, BookMarked } from "lucide-react";

export default function App() {
  const [tab, setTab] = useState<"search" | "notebook" | "study" | "story">("search");
  const [notebook, setNotebook] = useState<DictionaryResult[]>([]);

  // Load Notebook from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ai_dictionary_notebook");
      if (saved) {
        setNotebook(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load notebook from localStorage:", e);
    }
  }, []);

  // Save Notebook to localStorage whenever it changes
  const saveNotebookToLocalStorage = (updatedNotebook: DictionaryResult[]) => {
    setNotebook(updatedNotebook);
    try {
      localStorage.setItem("ai_dictionary_notebook", JSON.stringify(updatedNotebook));
    } catch (e) {
      console.error("Failed to save notebook to localStorage:", e);
    }
  };

  const handleSaveToNotebook = (result: DictionaryResult) => {
    const key = `${result.targetLanguage.toLowerCase()}_${result.wordOrPhrase.toLowerCase()}`;
    const exists = notebook.some(
      (item) => `${item.targetLanguage.toLowerCase()}_${item.wordOrPhrase.toLowerCase()}` === key
    );

    if (exists) {
      // Remove it if it already exists (Toggle behavior for user convenience)
      const filtered = notebook.filter(
        (item) => `${item.targetLanguage.toLowerCase()}_${item.wordOrPhrase.toLowerCase()}` !== key
      );
      saveNotebookToLocalStorage(filtered);
    } else {
      // Add it to the top
      const updated = [result, ...notebook];
      saveNotebookToLocalStorage(updated);
    }
  };

  const handleDeleteFromNotebook = (idx: number) => {
    const updated = [...notebook];
    updated.splice(idx, 1);
    saveNotebookToLocalStorage(updated);
  };

  const handleClearAllNotebook = () => {
    saveNotebookToLocalStorage([]);
    setTab("search");
  };

  // Pre-generate helper keys for faster search result styling
  const savedWordsKeys = new Set<string>(
    notebook.map((item) => `${item.targetLanguage.toLowerCase()}_${item.wordOrPhrase.toLowerCase()}`)
  );

  return (
    <div className="min-h-screen bg-[#fcf8f2] text-black font-sans pb-16 transition-all duration-300">
      {/* Decorative Top Accent Rail */}
      <div className="h-2 bg-gradient-to-r from-pink-400 via-yellow-400 to-cyan-400 border-b-2 border-black"></div>

      {/* Hero Welcome banner on very first load */}
      <div className="w-full max-w-5xl mx-auto pt-6 px-4 flex justify-between items-center text-xs font-black uppercase text-gray-500 tracking-wider">
        <span>🤖 AI LANGUAGE WORKSPACE</span>
        <span className="flex items-center gap-1">
          LIVE DEMO <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black animate-pulse"></span>
        </span>
      </div>

      <div className="pt-6">
        <Header
          currentTab={tab}
          setTab={setTab}
          notebookCount={notebook.length}
        />

        <main className="transition-all duration-300">
          {tab === "search" && (
            <MainDictionary
              onSaveToNotebook={handleSaveToNotebook}
              savedWordsKeys={savedWordsKeys}
              onNavigateToNotebook={() => setTab("notebook")}
            />
          )}

          {tab === "notebook" && (
            <Notebook
              notebook={notebook}
              onDelete={handleDeleteFromNotebook}
              onClearAll={handleClearAllNotebook}
              onStartStudy={() => setTab("study")}
              onStartStory={() => setTab("story")}
            />
          )}

          {tab === "study" && (
            <StudyMode
              notebook={notebook}
              onExit={() => setTab("notebook")}
            />
          )}

          {tab === "story" && (
            <StoryGenerator
              notebook={notebook}
              onExit={() => setTab("notebook")}
            />
          )}
        </main>
      </div>

      {/* Small floating footer */}
      <footer className="mt-12 text-center text-xs font-bold text-gray-400">
        <p>AI Dictionary Workspace © 2026. Made with 💛 for bright minds.</p>
      </footer>
    </div>
  );
}
