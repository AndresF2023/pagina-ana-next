"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error.message, error.digest);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-5 max-w-lg w-full text-center">
        <p className="text-sm font-semibold text-red-700 mb-1">Ocurrió un error</p>
        <p className="text-xs text-red-600 font-mono break-all mb-1">{error.message}</p>
        {error.digest && (
          <p className="text-xs text-red-400 font-mono">digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-4 text-sm text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
