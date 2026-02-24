"use client";

import { useEffect, useState } from "react";

export default function HealthCheck() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">(
    "checking"
  );

  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") setStatus("connected");
        else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-full text-sm font-medium shadow-md bg-white/80 backdrop-blur">
      {status === "checking" && (
        <span className="text-gray-500">Backend: checking...</span>
      )}
      {status === "connected" && (
        <span className="text-green-600">Backend: connected</span>
      )}
      {status === "error" && (
        <span className="text-red-600">Backend: disconnected</span>
      )}
    </div>
  );
}
