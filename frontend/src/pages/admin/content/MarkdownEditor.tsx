import { useState, useRef } from "react";
import type { ReactNode, KeyboardEvent } from "react";
import { Code2, FileCode2, Sparkles, Link2, Image as ImageIcon, Eye, Edit3, Columns } from "lucide-react";
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
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-sm",
        className,
      )}
    >
      {/* Top Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/80 bg-zinc-50/70 p-2.5 sm:px-4">
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
          <div className="mx-1 h-4 w-px bg-zinc-200" />
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
          <div className="mx-1 h-4 w-px bg-zinc-200" />
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
          <div className="mx-1 h-4 w-px bg-zinc-200" />
          <ToolbarButton icon={<Code2 size={14} />} label="Inline Code" onClick={() => insertText("`", "`", "code")} />
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
            icon={<Sparkles size={14} className="text-amber-500" />}
            label="Alert Callout"
            onClick={() => insertText("\n> [!NOTE]\n> ", "\n", "Highlight important context here")}
          />
          <div className="mx-1 h-4 w-px bg-zinc-200" />
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
              insertText("\n| Topic | Objective | XP |\n|---|---|---|\n| Module 1 | Core Concept | +50 XP |\n")
            }
          />
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center rounded-xl bg-zinc-200/60 p-1 border border-zinc-200">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
              mode === "write" ? "bg-white text-zinc-900 font-semibold shadow-xs" : "text-zinc-600 hover:text-zinc-900",
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
                ? "bg-white text-zinc-900 font-semibold shadow-xs"
                : "text-zinc-600 hover:text-zinc-900",
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
              mode === "split" ? "bg-white text-zinc-900 font-semibold shadow-xs" : "text-zinc-600 hover:text-zinc-900",
            )}
          >
            <Columns size={13} />
            Split
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="grid grid-cols-1 md:grid-cols-12 flex-1 divide-y md:divide-y-0 md:divide-x divide-zinc-200/80">
        {/* Write Pane */}
        {(mode === "write" || mode === "split") && (
          <div className={cn(mode === "split" ? "md:col-span-6" : "md:col-span-12", "flex flex-col bg-white")}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              style={{ minHeight }}
              className="w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        )}

        {/* Preview Pane */}
        {(mode === "preview" || mode === "split") && (
          <div
            className={cn(
              mode === "split" ? "md:col-span-6" : "md:col-span-12",
              "overflow-y-auto bg-zinc-50/40 p-4 sm:p-6",
            )}
            style={{ minHeight }}
          >
            {mode === "split" && (
              <div className="mb-3 flex items-center justify-between border-b border-zinc-200 pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-900">
                <span>Live Markdown Preview</span>
                <span className="text-[10px] text-zinc-500 font-medium">Real-time render</span>
              </div>
            )}
            <MarkdownPreview content={value} />
          </div>
        )}
      </div>

      {/* Status Footer */}
      <div className="flex items-center justify-between border-t border-zinc-200/80 bg-zinc-50/50 px-4 py-2 text-[11px] text-zinc-500">
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

function ToolbarButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="h-7 w-7 rounded-lg text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900"
    >
      {icon}
    </Button>
  );
}
