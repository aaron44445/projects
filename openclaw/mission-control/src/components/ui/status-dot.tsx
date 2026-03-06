interface StatusDotProps {
  status: "online" | "offline" | "error" | "warning" | "running";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

const colors: Record<StatusDotProps["status"], string> = {
  online: "bg-green-500 shadow-green-500/50",
  offline: "bg-gray-500",
  error: "bg-red-500 shadow-red-500/50",
  warning: "bg-amber-500 shadow-amber-500/50",
  running: "bg-blue-500 shadow-blue-500/50",
};

const sizes: Record<NonNullable<StatusDotProps["size"]>, string> = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

export function StatusDot({
  status,
  size = "md",
  pulse = true,
}: StatusDotProps) {
  return (
    <span className="relative inline-flex">
      <span
        className={`inline-block rounded-full ${sizes[size]} ${colors[status]} shadow-sm`}
      />
      {pulse && status !== "offline" && (
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${colors[status]} opacity-75 animate-ping`}
        />
      )}
    </span>
  );
}
