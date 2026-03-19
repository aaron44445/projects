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
          setError("PINs don't match");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[var(--text-secondary)]">Loading...</div>
      </div>
    );
  }

  const activePin = step === "confirm" ? confirmPin : pin;

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6">
      <h1 className="text-2xl font-semibold mb-2">
        {isSetup ? (step === "confirm" ? "Confirm PIN" : "Create PIN") : "Enter PIN"}
      </h1>
      <p className="text-[var(--text-secondary)] text-sm mb-8">
        {isSetup
          ? step === "confirm"
            ? "Enter your PIN again to confirm"
            : "Choose a 4-digit PIN to protect your app"
          : "Enter your 4-digit PIN"}
      </p>

      <div className="flex gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 border-[var(--accent-gold)] ${
              i < activePin.length ? "bg-[var(--accent-gold)]" : ""
            }`}
          />
        ))}
      </div>

      {error && <p className="text-[var(--accent-red)] text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => handleDigit(n.toString())}
            className="h-16 rounded-xl bg-[var(--bg-secondary)] text-2xl font-medium active:bg-[var(--accent-blue)] transition-colors"
          >
            {n}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleDigit("0")}
          className="h-16 rounded-xl bg-[var(--bg-secondary)] text-2xl font-medium active:bg-[var(--accent-blue)] transition-colors"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="h-16 rounded-xl bg-[var(--bg-secondary)] text-lg active:bg-[var(--accent-red)] transition-colors"
        >
          ←
        </button>
      </div>
    </div>
  );
}
