import { useEffect, useRef, useState } from "react";

export function useSpeechRecognition() {
  const recognitionRef = useRef(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    setSpeechSupported(true);
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event) => {
      let nextFinal = "";
      let nextInterim = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript || "";
        if (result?.isFinal) {
          nextFinal += transcript;
        } else {
          nextInterim += transcript;
        }
      }

      const finalTrimmed = nextFinal.trim();
      if (finalTrimmed) {
        setFinalTranscript((prev) => {
          const base = typeof prev === "string" ? prev : "";
          const combined = `${base} ${finalTrimmed}`.trim();
          return combined;
        });
      }

      setInterimTranscript(nextInterim.trim());
    };

    rec.onerror = (e) => {
      console.error("Speech recognition error", e);
      setSpeechError(e?.error || "Speech recognition failed");
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = rec;

    return () => {
      try {
        rec.abort();
      } catch (_e) {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, []);

  const startDictation = () => {
    setSpeechError(null);

    const rec = recognitionRef.current;
    if (!rec) {
      setSpeechError("Speech recognition not available in this browser");
      return;
    }

    try {
      rec.start();
      setIsListening(true);
    } catch (e) {
      console.error(e);
      setSpeechError(e?.message || "Could not start dictation");
      setIsListening(false);
    }
  };

  const stopDictation = () => {
    const rec = recognitionRef.current;
    if (!rec) {
      setIsListening(false);
      return;
    }

    try {
      rec.stop();
    } catch (e) {
      console.error(e);
    } finally {
      setIsListening(false);
      setInterimTranscript("");
    }
  };

  const clearDictation = () => {
    setFinalTranscript("");
    setInterimTranscript("");
    setSpeechError(null);
  };

  const setTranscript = (value) => {
    setFinalTranscript(value);
    setInterimTranscript("");
  };

  return {
    speechSupported,
    speechError,
    isListening,
    finalTranscript,
    interimTranscript,
    startDictation,
    stopDictation,
    clearDictation,
    setTranscript,
  };
}
