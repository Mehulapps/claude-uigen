"use client";

import { Loader2 } from "lucide-react";

function basename(path: string): string {
  return path.split("/").filter(Boolean).pop() ?? path;
}

export function getToolLabel(toolName: string, args: Record<string, unknown>): string {
  if (toolName === "str_replace_editor") {
    const command = args.command as string;
    const file = basename(args.path as string);
    switch (command) {
      case "create":     return `Creating ${file}`;
      case "str_replace":
      case "insert":     return `Editing ${file}`;
      case "view":       return `Viewing ${file}`;
      case "undo_edit":  return `Undoing edit on ${file}`;
    }
  }

  if (toolName === "file_manager") {
    const command = args.command as string;
    const file = basename(args.path as string);
    if (command === "rename" && args.new_path) {
      return `Renaming ${file} → ${basename(args.new_path as string)}`;
    }
    if (command === "delete") {
      return `Deleting ${file}`;
    }
  }

  return toolName;
}

interface ToolCallBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
}

export function ToolCallBadge({ toolName, args, state, result }: ToolCallBadgeProps) {
  const label = getToolLabel(toolName, args);
  const isDone = state === "result" && result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
