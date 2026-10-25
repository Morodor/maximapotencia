import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function uploadFiles() {
  const docsPath = path.join(process.cwd(), "docs");
  const cachePath = path.join(docsPath, "uris.json");
  const uris = {};

  if (!fs.existsSync(docsPath)) {
    console.log("No docs folder found.");
    return;
  }

  const files = fs.readdirSync(docsPath);
  for (const file of files) {
    if (file.toLowerCase().endsWith(".pdf")) {
      const filePath = path.join(docsPath, file);
      console.log(`Subiendo ${file} a Gemini... (esto puede tardar por el tamaño)`);
      try {
        const uploadResult = await ai.files.upload({
          file: filePath,
          mimeType: "application/pdf",
        });
        console.log(`✅ Subido con éxito: ${uploadResult.uri}`);
        uris[file] = uploadResult.uri;
      } catch (error) {
        console.error(`❌ Error subiendo ${file}:`, error);
      }
    }
  }

  fs.writeFileSync(cachePath, JSON.stringify(uris, null, 2));
  console.log("¡Todos los URIs guardados en docs/uris.json!");
}

uploadFiles();
