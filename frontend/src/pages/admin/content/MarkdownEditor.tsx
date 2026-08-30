import { useState, useRef } from "react";
import type { ReactNode, KeyboardEvent } from "react";
import {
  Code2,
  FileCode2,
  Sparkles,
  Link2,
  Image as ImageIcon,
  Eye,
  Edit3,
  Columns,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownPreview } from "./MarkdownPreview";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

type EditorMode = "write" | "preview" | "split";

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write comprehensive lesson instructions, markdown formatting, diagrams, and explanations…",
  minHeight = "360px",
  className,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<EditorMode>("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (prefix: string, suffix: string = "", defaultText: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;
    const selectedText = currentVal.substring(start, end) || defaultText;

    const replacement = `${prefix}${selectedText}${suffix}`;
    const nextVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);

    onChange(nextVal);

    setTimeout(() => {
      textarea.focus();
      const newCursor = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 10);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key indentation
    if (e.key === "Tab") {
      e.preventDefault();
      insertText("  ");
      return;
    }
    // Ctrl+B / Cmd+B for Bold
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      insertText("**", "**", "bold text");
      return;
    }
    // Ctrl+I / Cmd+I for Italic
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      insertText("*", "*", "italic text");
      return;
    }
    // Ctrl+K / Cmd+K for Link
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      insertText("[", "](https://example.com)", "link title");
      return;
    }
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div className={cn("flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden shadow-sm", className)}>
      {/* Top Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-white/[0.02] p-2.5 sm:px-4">
        {/* Formatting actions */}
        <div className="flex flex-wrap items-center gap-1">
          <ToolbarButton
            icon={<span className="font-bold text-xs font-mono">H1</span>}
            label="H1 Heading"
            onClick={() => insertText("\n# ", "\n", "Heading 1")}
          />
          <ToolbarButton
            icon={<span className="font-bold text-xs font-mono">H2</span>}
            label="H2 Heading"
            onClick={() => insertText("\n## ", "\n", "Heading 2")}
          />
          <ToolbarButton
            icon={<span className="font-bold text-xs font-mono">H3</span>}
            label="H3 Heading"
            onClick={() => insertText("\n### ", "\n", "Heading 3")}
          />
          <div className="mx-1 h-4 w-px bg-white/10" />
          <ToolbarButton
            icon={<span className="font-bold text-sm font-serif">B</span>}
            label="Bold (Ctrl+B)"
            onClick={() => insertText("**", "**", "bold text")}
          />
          <ToolbarButton
            icon={<span className="italic text-sm font-serif">I</span>}
            label="Italic (Ctrl+I)"
            onClick={() => insertText("*", "*", "italic text")}
          />
          <ToolbarButton
            icon={<span className="line-through text-sm font-serif">S</span>}
            label="Strikethrough"
            onClick={() => insertText("~~", "~~", "strikethrough text")}
          />
          <div className="mx-1 h-4 w-px bg-white/10" />
          <ToolbarButton
            icon={<span className="font-mono text-xs">• List</span>}
            label="Bullet List"
            onClick={() => insertText("\n- ", "\n", "List item")}
          />
          <ToolbarButton
            icon={<span className="font-mono text-xs">1. List</span>}
            label="Numbered List"
            onClick={() => insertText("\n1. ", "\n", "Step 1")}
          />
          <ToolbarButton
            icon={<span className="font-mono text-xs">☑ Task</span>}
            label="Task Checkbox"
            onClick={() => insertText("\n- [ ] ", "\n", "Task to complete")}
          />
          <div className="mx-1 h-4 w-px bg-white/10" />
          <ToolbarButton
            icon={<Code2 size={14} />}
            label="Inline Code"
            onClick={() => insertText("`", "`", "code")}
          />
          <ToolbarButton
            icon={<FileCode2 size={14} />}
            label="Code Block"
            onClick={() => insertText("\n```typescript\n", "\n```\n", "// your code here")}
          />
          <ToolbarButton
            icon={<span className="font-serif text-sm font-bold">&quot;&quot;</span>}
            label="Blockquote"
            onClick={() => insertText("\n> ", "\n", "Important takeaway or quote")}
          />
          <ToolbarButton
            icon={<Sparkles size={14} className="text-amber-400" />}
            label="Alert Callout"
            onClick={() => insertText("\n> [!NOTE]\n> ", "\n", "Highlight important context here")}
          />
          <div className="mx-1 h-4 w-px bg-white/10" />
          <ToolbarButton
            icon={<Link2 size={14} />}
            label="Link (Ctrl+K)"
            onClick={() => insertText("[", "](https://...)", "Link text")}
          />
          <ToolbarButton
            icon={<ImageIcon size={14} />}
            label="Image"
            onClick={() => insertText("![", "](https://...)", "Alt description")}
          />
          <ToolbarButton
            icon={<span className="font-mono text-xs">Table</span>}
            label="Table"
            onClick={() =>
              insertText(
                "\n| Topic | Objective | XP |\n|---|---|---|\n| Module 1 | Core Concept | +50 XP |\n"
              )
            }
          />
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center rounded-xl bg-black/40 p-1 border border-white/5">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
              mode === "write"
                ? "bg-primary text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-white"
            )}
          >
            <Edit3 size={13} />
            Write
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
              mode === "preview"
                ? "bg-primary text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-white"
            )}
          >
            <Eye size={13} />
            Preview
          </button>
          <button
            type="button"
            onClick={() => setMode("split")}
            className={cn(
              "hidden md:flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
              mode === "split"
                ? "bg-primary text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-white"
            )}
          >
            <Columns size={13} />
            Split
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="grid grid-cols-1 md:grid-cols-12 flex-1 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
        {/* Write Pane */}
        {(mode === "write" || mode === "split") && (
          <div className={cn(mode === "split" ? "md:col-span-6" : "md:col-span-12", "flex flex-col")}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              style={{ minHeight }}
              className="w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        )}

        {/* Preview Pane */}
        {(mode === "preview" || mode === "split") && (
          <div
            className={cn(
              mode === "split" ? "md:col-span-6" : "md:col-span-12",
              "overflow-y-auto bg-black/20 p-4 sm:p-6"
            )}
            style={{ minHeight }}
          >
            {mode === "split" && (
              <div className="mb-3 flex items-center justify-between border-b border-white/5 pb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <span>Live Markdown Preview</span>
                <span className="text-[10px] text-[var(--text-muted)]">Real-time render</span>
              </div>
            )}
            <MarkdownPreview content={value} />
          </div>
        )}
      </div>

      {/* Status Footer */}
      <div className="flex items-center justify-between border-t border-[var(--border)] bg-white/[0.01] px-4 py-2 text-[11px] text-[var(--text-muted)]">
        <span className="flex items-center gap-3">
          <span>{wordCount} words</span>
          <span>·</span>
          <span>{charCount} characters</span>
        </span>
        <span className="hidden sm:inline-block">Markdown formatted with GitHub alerts & table support</span>
      </div>
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="h-7 w-7 rounded-lg text-[var(--text-muted)] hover:bg-white/10 hover:text-white"
    >
      {icon}
    </Button>
  );
}
