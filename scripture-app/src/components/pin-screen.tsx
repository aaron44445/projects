"use client";

import { useState, useEffect } from "react";

interface PinScreenProps {
  onSuccess: () => void;
}

export default function PinScreen({ onSuccess }: PinScreenProps) {
  const [pin, setPin] = useState("");
  const [isSetup, setIsSetup] = useState(false);
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pin")
      .then((r) => r.json())
      .then((data) => {
        setIsSetup(!data.hasPin);
        setLoading(false);
      });
  }, []);

  const handleDigit = (d: string) => {
    setError("");
    if (step === "enter" && pin.length < 4) {
      const newPin = pin + d;
      setPin(newPin);
      if (newPin.length === 4) {
        if (isSetup) {
          setStep("confirm");
          setPin(newPin);
        } else {
          verifyPin(newPin);
        }
      }
    } else if (step === "confirm" && confirmPin.length < 4) {
      const newConfirm = confirmPin + d;
      setConfirmPin(newConfirm);
      if (newConfirm.length === 4) {
        if (newConfirm === pin) {
          setupPin(pin);
        } else {
          setError("Doesn't match");
          setConfirmPin("");
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === "confirm") {
      setConfirmPin((p) => p.slice(0, -1));
    } else {
      setPin((p) => p.slice(0, -1));
    }
    setError("");
  };

  async function verifyPin(p: string) {
    const res = await fetch("/api/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: p, action: "verify" }),
    });
    const data = await res.json();
    if (data.valid) {
      onSuccess();
    } else {
      setError("Wrong PIN");
      setPin("");
    }
  }

  async function setupPin(p: string) {
    const res = await fetch("/api/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: p, action: "setup" }),
    });
    const data = await res.json();
    if (data.success) {
      onSuccess();
    } else {
      setError("Setup failed");
      setPin("");
      setConfirmPin("");
      setStep("enter");
    }
  }

  if (loading) return <div className="min-h-dvh" />;

  const activePin = step === "confirm" ? confirmPin : pin;
  const title = isSetup
    ? step === "confirm" ? "Confirm" : "Create PIN"
    : "Enter PIN";

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6">
      <p className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-10">
        {title}
      </p>

      <div className="flex gap-6 mb-12">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
              i < activePin.length ? "bg-[var(--accent)]" : "bg-[var(--muted)]/30"
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-[var(--slip)] text-sm mb-6">{error}</p>
      )}

      <div className="grid grid-cols-3 gap-x-12 gap-y-6 w-full max-w-[240px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => handleDigit(n.toString())}
            className="h-14 text-2xl font-light text-[var(--fg)] active:text-[var(--accent)] transition-colors duration-150"
          >
            {n}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleDigit("0")}
          className="h-14 text-2xl font-light text-[var(--fg)] active:text-[var(--accent)] transition-colors duration-150"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="h-14 text-lg text-[var(--muted)] active:text-[var(--fg)] transition-colors duration-150"
        >
          &#x232B;
        </button>
      </div>
    </div>
  );
}
