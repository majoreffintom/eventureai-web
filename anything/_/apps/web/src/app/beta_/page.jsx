"use client";

import { useEffect } from "react";

export default function BetaUnderscoreRedirect() {
  useEffect(() => {
    window.location.href = "/beta";
  }, []);

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="text-2xl">Redirecting…</div>
        <div className="mt-2 text-black/70">
          If you’re not redirected, go to{" "}
          <a className="underline" href="/beta">
            /beta
          </a>
          .
        </div>
      </div>
    </div>
  );
}
