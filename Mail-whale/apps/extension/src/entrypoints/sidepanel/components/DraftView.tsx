import React from "react";

interface DraftViewProps {
  draft: string;
  onEdit: (text: string) => void;
  onInsert: () => void;
  onRegenerate: () => void;
  onBack: () => void;
  loading: boolean;
}

export function DraftView({
  draft,
  onEdit,
  onInsert,
  onRegenerate,
  onBack,
  loading,
}: DraftViewProps) {
  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div className="logo">Draft</div>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#64748b",
          }}
        >
          Back
        </button>
      </div>

      <textarea
        className="draft-area"
        value={draft}
        onChange={(e) => onEdit(e.target.value)}
        style={{ minHeight: 250 }}
      />

      <div className="action-row">
        <button
          className="btn btn-secondary"
          onClick={onRegenerate}
          disabled={loading}
        >
          {loading ? "..." : "Regenerate"}
        </button>
        <button className="btn btn-primary" onClick={onInsert}>
          Insert
        </button>
      </div>

      <p
        style={{
          marginTop: 12,
          fontSize: 12,
          color: "#94a3b8",
          textAlign: "center",
        }}
      >
        Click "Insert" to paste this draft into your email compose window.
      </p>
    </div>
  );
}
