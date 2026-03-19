"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PinScreen from "@/components/pin-screen";
import { validateSession, createSession } from "@/lib/session";

export default function Home() {
  const router = useRouter();
  const [needsPin, setNeedsPin] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (validateSession()) {
      router.replace("/study");
    } else {
      setNeedsPin(true);
      setChecking(false);
    }
  }, [router]);

  function handlePinSuccess() {
    createSession();
    router.replace("/study");
  }

  if (checking) return null;
  if (needsPin) return <PinScreen onSuccess={handlePinSuccess} />;
  return null;
}
