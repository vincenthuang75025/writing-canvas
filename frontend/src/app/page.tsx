"use client";

import dynamic from "next/dynamic";
import HealthCheck from "@/components/HealthCheck";

const Canvas = dynamic(() => import("@/components/Canvas"), { ssr: false });

export default function Home() {
  return (
    <>
      <HealthCheck />
      <Canvas />
    </>
  );
}
