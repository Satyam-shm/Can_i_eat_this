"use client"

import { useState } from "react"
import { FoodInput } from "@/components/food-input"
import { ResultCard } from "@/components/result-card"
import { LoadingState } from "@/components/loading-state"



export interface AnalysisResult {
  decision: "good" | "okay" | "avoid"
  explanation: string
  caution: string[]
}



export default function Home() {
  const [inputText, setInputText] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const handleAnalyze = async () => {
    if (!inputText && !selectedImage) return;

  setLoading(true);
  setResult(null);

  try {
    const formData = new FormData();

    if (inputText) formData.append("prompt", inputText);
    if (selectedImage) formData.append("image", selectedImage);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    console.log('Making request to:', `${apiUrl}/search`);
    const response = await fetch(`${apiUrl}/search`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("SERVER ERROR:", err);
      // throw new Error(err || "Failed to analyze");
    }

    const data = await response.json();
    const normalizeCaution = (caution: any): string[] => {
    if (!caution) return [];
    if (Array.isArray(caution)) {
      return caution
        .map(item => cleanText(item))
        .filter(Boolean);
    }
    if (typeof caution === "string") {
      try {
        const parsed = JSON.parse(caution);
        if (Array.isArray(parsed)) {
          return parsed.map(item => cleanText(item)).filter(Boolean);
        }
      } catch (_) {}
      return [cleanText(caution)];
    }
    return [];
  };

  const cleanText = (text: string): string => {
    return text
      ?.replace(/[\[\]\\"]/g, "")
      ?.replace(/\n/g, " ")       
      ?.trim() || "";
  };

  setResult({
    decision: data.decision,
    explanation: data.explanation,
    caution: normalizeCaution(data.caution),
  });
  } catch (error) {
    console.error("CLIENT ERROR:", error);
    alert("Something went wrong. Check console.");
  } finally {
    setLoading(false);
  }
}


  const handleReset = () => {
    setInputText("")
    setSelectedImage(null)
    setResult(null)
  }

  return (
    <main className="min-h-screen px-4 py-12 md:py-20">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
            Can I Eat This?
          </h1>
          <p className="text-lg text-muted-foreground">Get a clear answer in seconds.</p>
        </header>

        {/* Main Content */}
        {!loading && !result && (
          <FoodInput
            inputText={inputText}
            setInputText={setInputText}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            onAnalyze={handleAnalyze}
          />
        )}

        {loading && <LoadingState />}

        {result && !loading && <ResultCard result={result} onReset={handleReset} />}
      </div>
    </main>
  )
}
