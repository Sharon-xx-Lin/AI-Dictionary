import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini AI client to prevent crash if key is missing on start
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. Definition API
app.post("/api/dictionary/define", async (req, res) => {
  try {
    const { inputText, nativeLanguage, targetLanguage } = req.body;

    if (!inputText || !nativeLanguage || !targetLanguage) {
      return res.status(400).json({ error: "Missing required parameters (inputText, nativeLanguage, targetLanguage)" });
    }

    const ai = getAi();

    const systemInstruction = `You are a lively, fun, and extremely engaging language tutor and dictionary assistant.
Your goal is to define the word, phrase, or sentence provided in the target language, explaining it in the user's native language.

Write the definition and the usageNote in the user's native language (${nativeLanguage}).
The explanation must be fun, lively, and in casual language—like you're talking to a friend! Do not sound like a boring textbook. Use conversational phrases and a warm, inviting tone.

Provide:
1. wordOrPhrase: The exact, normalized word or phrase being defined (cleaned up, e.g. capitalized nicely).
2. ipaPronunciation: A simple pronunciation guide or IPA in the target language (${targetLanguage}).
3. definition: A clear, natural language definition in ${nativeLanguage}.
4. imagePrompt: A highly detailed, colorful, vibrant prompt to generate an image visualizing the concept. Keep it positive and bright.
5. fallbackSvg: A highly customized, modern, beautifully styled inline SVG representing the concept visually. It must use vibrant colors, look high-quality, include proper viewBox="0 0 100 100", and use clean geometric paths, circles, gradients or rects.
6. exampleSentences: Exactly 2 natural example sentences in ${targetLanguage}, each paired with a translation in ${nativeLanguage}.
7. usageNote: Explain cultural nuance, how/when it is used, its tone/voice (formal, casual, slang), or related words (synonyms/words that look similar and are often confused) and how they differ in usage. Be funny, friendly, and informal! Use casual, warm, conversational phrasing.`;

    const prompt = `Define the input "${inputText}" where:
- Target Language (the language of the word/phrase/sentence): ${targetLanguage}
- Native Language (the language used for explanations and definitions): ${nativeLanguage}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            wordOrPhrase: { type: Type.STRING },
            ipaPronunciation: { type: Type.STRING },
            definition: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
            fallbackSvg: { type: Type.STRING },
            exampleSentences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sentence: { type: Type.STRING, description: "The example sentence in the target language" },
                  translation: { type: Type.STRING, description: "The translation of the example sentence in the native language" }
                },
                required: ["sentence", "translation"]
              }
            },
            usageNote: { type: Type.STRING }
          },
          required: ["wordOrPhrase", "ipaPronunciation", "definition", "imagePrompt", "fallbackSvg", "exampleSentences", "usageNote"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");

    // 2. Try to generate an image using gemini-3.1-flash-lite-image
    let generatedImageBase64: string | null = null;
    try {
      if (parsedData.imagePrompt) {
        const imgResponse = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite-image",
          contents: {
            parts: [{ text: parsedData.imagePrompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1"
            }
          }
        });

        if (imgResponse.candidates?.[0]?.content?.parts) {
          for (const part of imgResponse.candidates[0].content.parts) {
            if (part.inlineData) {
              generatedImageBase64 = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
              break;
            }
          }
        }
      }
    } catch (imgError) {
      console.log("Image generation fell back to custom SVG/Picsum successfully.");
    }

    res.json({
      ...parsedData,
      generatedImage: generatedImageBase64
    });

  } catch (error: any) {
    console.error("Error in define route:", error);
    res.status(500).json({ error: error.message || "An error occurred while generating the definition." });
  }
});

// 2. Story API
app.post("/api/dictionary/story", async (req, res) => {
  try {
    const { words, nativeLanguage, targetLanguage } = req.body;

    if (!words || !Array.isArray(words) || words.length === 0 || !nativeLanguage || !targetLanguage) {
      return res.status(400).json({ error: "Missing or invalid parameters (words, nativeLanguage, targetLanguage)" });
    }

    const ai = getAi();

    const systemInstruction = `You are a humorous, clever, and creative storyteller who loves to help people learn languages.
Your goal is to write an engaging, fun, and memorable short story in the user's native language (${nativeLanguage}) that integrates ALL the target vocabulary words/phrases (which must remain in the target language ${targetLanguage}) provided in the list.

The story must:
1. Be written primarily in the user's native language (${nativeLanguage}) so they can easily follow the plot.
2. Incorporate every single target vocabulary word or phrase (in its target language: ${targetLanguage}) naturally and smoothly into the narrative.
3. Every target language word or phrase MUST be wrapped in double asterisks, e.g., **target_word**, so it can be highlighted in the UI.
4. Be highly engaging, funny, or slightly dramatic to help the vocabulary stick.
5. In the "translationText" property, write a short friendly reflection/advice in ${nativeLanguage} about how these target words are used or a summary of why they fit well in this scenario.

Provide the output in JSON matching the requested schema.`;

    const prompt = `Create a story using these target language vocabulary words: ${words.join(", ")}
- The story narrative language: ${nativeLanguage} (primarily written in ${nativeLanguage})
- The target vocabulary words must remain in: ${targetLanguage} (wrapped in **double asterisks** in the story text)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Title of the story in the native language" },
            storyText: { type: Type.STRING, description: "The full story in the native language, with the target words integrated in the target language and wrapped in **bold** asterisks" },
            translationText: { type: Type.STRING, description: "Lively advice or custom wrap-up notes in the native language about using these target words" },
            vocabHighlighted: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING, description: "The target vocabulary word" },
                  meaning: { type: Type.STRING, description: "The meaning/definition in native language" },
                  roleInStory: { type: Type.STRING, description: "How this word fitted into the story context" }
                },
                required: ["word", "meaning", "roleInStory"]
              }
            }
          },
          required: ["title", "storyText", "translationText", "vocabHighlighted"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);

  } catch (error: any) {
    console.error("Error in story route:", error);
    res.status(500).json({ error: error.message || "An error occurred while generating the story." });
  }
});

// Serve frontend application with Vite in dev, static files in prod
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupServer();
