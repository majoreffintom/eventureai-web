"use client";

import { useEffect, useState } from "react";
import { RenderPublishedApp } from "@/components/RenderPublishedApp";

export function PreviewClient({ initialElements, env }: { initialElements: any, env: string }) {
  const [elements, setElements] = useState<any[]>([]);
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    const parseElements = (data: any): any[] => {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          return parseElements(parsed);
        } catch (e) {
          console.error("Failed to parse elements", e);
          return [];
        }
      }
      return [];
    };

    setElements(parseElements(initialElements));
    
    // Check for debug flag in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') === 'true') setDebug(true);
    }
  }, [initialElements]);

  useEffect(() => {
    console.log("PreviewClient effect, env:", env);
    if (env === 'dev') {
      const stored = localStorage.getItem('builder-dev-preview');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setElements(parsed);
          }
        } catch (e) {
          console.error("Failed to parse local preview data", e);
        }
      }

      const bc = new BroadcastChannel('builder-preview');
      bc.onmessage = (event) => {
        console.log("Received broadcast update:", event.data);
        if (event.data && event.data.type === 'UPDATE_ELEMENTS') {
          setElements(event.data.elements);
        }
      };

      return () => {
        bc.close();
      };
    }
  }, [env]);

  if (debug) {
    return (
      <div className="p-8 bg-zinc-900 text-zinc-300 font-mono text-xs overflow-auto h-screen">
        <h1 className="text-xl font-bold mb-4 text-white">Debug: Elements JSON</h1>
        <pre>{JSON.stringify(elements, null, 2)}</pre>
      </div>
    );
  }

  if (!elements || elements.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-6 border border-zinc-800">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        </div>
        <h2 className="text-xl font-medium text-zinc-100 mb-2">No Preview Available</h2>
        <p className="max-w-xs text-sm text-zinc-500">
          We couldn't find any content for the <span className="text-indigo-400 font-mono">{env}</span> environment.
          Try publishing from the builder or ensure your dev server is syncing.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-md text-sm transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <RenderPublishedApp elements={elements} />
    </div>
  );
}