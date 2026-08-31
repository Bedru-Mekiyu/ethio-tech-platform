import { useState } from "react";
import type { ReactNode } from "react";
import { Copy, Check, ExternalLink, Info, AlertTriangle, Lightbulb, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  if (!content || !content.trim()) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-[var(--text-muted)]">
        No content written yet. Switch to &quot;Write&quot; tab to draft markdown.
      </div>
    );
  }

  const renderedBlocks = parseMarkdownToReact(content);

  return (
    <div
      className={cn(
        "prose prose-invert max-w-none space-y-4 text-sm sm:text-base leading-relaxed text-slate-300",
        className,
      )}
    >
      {renderedBlocks}
    </div>
  );
}

function parseMarkdownToReact(md: string): ReactNode[] {
  const lines = md.split("\n");
  const nodes: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code blocks ```lang
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim() || "text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const codeText = codeLines.join("\n");
      nodes.push(<CodeBlock key={`code-${nodes.length}`} code={codeText} language={lang} />);
      continue;
    }

    // Callout alert quotes: > [!NOTE], > [!TIP], > [!WARNING], > [!IMPORTANT], > [!CAUTION]
    if (line.trim().startsWith("> [!")) {
      const match = line.trim().match(/^>\s*\[!([A-Z]+)\]/i);
      const alertType = match ? match[1].toUpperCase() : "NOTE";
      const quoteLines: string[] = [];
      const remainder = line.replace(/^>\s*\[![A-Z]+\]\s*/i, "").trim();
      if (remainder) quoteLines.push(remainder);
      i++;
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      nodes.push(<CalloutBlock key={`callout-${nodes.length}`} type={alertType} content={quoteLines.join(" ")} />);
      continue;
    }

    // Standard Blockquote: > text
    if (line.trim().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      nodes.push(
        <blockquote
          key={`quote-${nodes.length}`}
          className="border-l-4 border-primary/60 bg-primary/5 pl-4 py-2 my-2 rounded-r-lg italic text-[var(--text-secondary)]"
        >
          {renderInlineMarkdown(quoteLines.join(" "))}
        </blockquote>,
      );
      continue;
    }

    // Markdown Table (| header | header |)
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      nodes.push(<TableBlock key={`table-${nodes.length}`} tableLines={tableLines} />);
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      nodes.push(
        <h1
          key={`h1-${nodes.length}`}
          className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-6 mb-3 border-b border-white/10 pb-2"
        >
          {renderInlineMarkdown(line.slice(2))}
        </h1>,
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      nodes.push(
        <h2
          key={`h2-${nodes.length}`}
          className="text-xl sm:text-2xl font-semibold tracking-tight text-white mt-5 mb-2.5"
        >
          {renderInlineMarkdown(line.slice(3))}
        </h2>,
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={`h3-${nodes.length}`} className="text-lg sm:text-xl font-semibold text-slate-100 mt-4 mb-2">
          {renderInlineMarkdown(line.slice(4))}
        </h3>,
      );
      i++;
      continue;
    }
    if (line.startsWith("#### ")) {
      nodes.push(
        <h4 key={`h4-${nodes.length}`} className="text-base font-semibold text-slate-200 mt-3 mb-1.5">
          {renderInlineMarkdown(line.slice(5))}
        </h4>,
      );
      i++;
      continue;
    }

    // Horizontal Rule
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
      nodes.push(<hr key={`hr-${nodes.length}`} className="my-6 border-t border-white/10" />);
      i++;
      continue;
    }

    // Unordered List (- or * or +)
    if (/^\s*[-*+]\s+/.test(line)) {
      const listItems: { text: string; checked?: boolean }[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        const raw = lines[i].replace(/^\s*[-*+]\s+/, "");
        // Check for task checkbox [ ] or [x]
        const taskMatch = raw.match(/^\[([ xX])\]\s+(.*)/);
        if (taskMatch) {
          listItems.push({
            checked: taskMatch[1].toLowerCase() === "x",
            text: taskMatch[2],
          });
        } else {
          listItems.push({ text: raw });
        }
        i++;
      }
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="my-3 space-y-1.5 pl-5 list-disc marker:text-primary">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {item.checked !== undefined ? (
                <label className="inline-flex items-center gap-2 cursor-default">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    readOnly
                    className="rounded border-white/20 bg-white/5 text-primary focus:ring-0"
                  />
                  <span className={item.checked ? "line-through text-[var(--text-muted)]" : ""}>
                    {renderInlineMarkdown(item.text)}
                  </span>
                </label>
              ) : (
                renderInlineMarkdown(item.text)
              )}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered List (1. 2. 3.)
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      nodes.push(
        <ol key={`ol-${nodes.length}`} className="my-3 space-y-1.5 pl-5 list-decimal marker:text-primary font-medium">
          {listItems.map((item, idx) => (
            <li key={idx} className="font-normal text-slate-300">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith("#") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("|") &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }

    if (paragraphLines.length > 0) {
      nodes.push(
        <p key={`p-${nodes.length}`} className="leading-relaxed text-slate-300">
          {renderInlineMarkdown(paragraphLines.join(" "))}
        </p>,
      );
    }
  }

  return nodes;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative my-4 overflow-hidden rounded-2xl border border-white/10 bg-[#090d16] font-mono text-xs shadow-lg">
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.03] px-4 py-2 text-[11px] text-[var(--text-muted)]">
        <span className="font-semibold uppercase tracking-wider text-primary">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-white/10 hover:text-white text-[var(--text-muted)]"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 leading-relaxed text-slate-200">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

function CalloutBlock({ type, content }: { type: string; content: string }) {
  const styles: Record<string, { bg: string; border: string; text: string; icon: ReactNode; label: string }> = {
    NOTE: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-300",
      icon: <Info size={16} className="text-blue-400" />,
      label: "Note",
    },
    TIP: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-300",
      icon: <Lightbulb size={16} className="text-emerald-400" />,
      label: "Tip",
    },
    WARNING: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-300",
      icon: <AlertTriangle size={16} className="text-amber-400" />,
      label: "Warning",
    },
    IMPORTANT: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
      text: "text-purple-300",
      icon: <AlertCircle size={16} className="text-purple-400" />,
      label: "Important",
    },
    CAUTION: {
      bg: "bg-rose-500/10",
      border: "border-rose-500/30",
      text: "text-rose-300",
      icon: <AlertTriangle size={16} className="text-rose-400" />,
      label: "Caution",
    },
  };

  const style = styles[type] || styles.NOTE;

  return (
    <div className={cn("my-4 rounded-2xl border p-4", style.bg, style.border)}>
      <div className="flex items-center gap-2 mb-1">
        {style.icon}
        <span className="text-xs font-bold uppercase tracking-wider text-white">{style.label}</span>
      </div>
      <div className={cn("text-xs sm:text-sm leading-relaxed", style.text)}>{renderInlineMarkdown(content)}</div>
    </div>
  );
}

function TableBlock({ tableLines }: { tableLines: string[] }) {
  if (tableLines.length < 2) return null;

  const parseRow = (rowStr: string) => {
    return rowStr
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((c) => c.trim());
  };

  const headers = parseRow(tableLines[0]);
  const dataRows = tableLines.slice(2).map(parseRow);

  return (
    <div className="my-4 overflow-x-auto rounded-2xl border border-white/10 shadow-sm">
      <table className="w-full text-left text-xs sm:text-sm">
        <thead className="bg-white/[0.04] text-white border-b border-white/10">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 font-semibold">
                {renderInlineMarkdown(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {dataRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-white/[0.02]">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-4 py-2.5 text-slate-300">
                  {renderInlineMarkdown(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderInlineMarkdown(text: string): ReactNode {
  if (!text) return null;

  // Split tokens for inline codes, links, bold, italic
  const parts: ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // 1. Inline code: `code`
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)$/s);
    // 2. Link: [text](url)
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)(.*)$/s);
    // 3. Image: ![alt](url)
    const imgMatch = remaining.match(/^(.*?)!\[([^\]]*)\]\(([^)]+)\)(.*)$/s);
    // 4. Bold: **text** or __text__
    const boldMatch = remaining.match(/^(.*?)(\*\*|__)(.*?)\2(.*)$/s);
    // 5. Italic: *text* or _text_
    const italicMatch = remaining.match(/^(.*?)(\*|_)(.*?)\2(.*)$/s);
    // 6. Strikethrough: ~~text~~
    const strikeMatch = remaining.match(/^(.*?)~~(.*?)~~(.*)$/s);

    // Find earliest match
    const candidates = [
      imgMatch && { type: "img", match: imgMatch, index: imgMatch[1].length },
      linkMatch && { type: "link", match: linkMatch, index: linkMatch[1].length },
      codeMatch && { type: "code", match: codeMatch, index: codeMatch[1].length },
      boldMatch && { type: "bold", match: boldMatch, index: boldMatch[1].length },
      strikeMatch && { type: "strike", match: strikeMatch, index: strikeMatch[1].length },
      italicMatch && { type: "italic", match: italicMatch, index: italicMatch[1].length },
    ]
      .filter((c): c is { type: string; match: RegExpMatchArray; index: number } => Boolean(c))
      .sort((a, b) => a.index - b.index);

    if (candidates.length === 0) {
      parts.push(<span key={keyIdx}>{remaining}</span>);
      break;
    }

    const first = candidates[0];
    const prefix = first.match[1];
    if (prefix) {
      parts.push(<span key={keyIdx++}>{prefix}</span>);
    }

    if (first.type === "code") {
      parts.push(
        <code
          key={keyIdx++}
          className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-xs text-primary font-semibold border border-white/5"
        >
          {first.match[2]}
        </code>,
      );
      remaining = first.match[3];
    } else if (first.type === "img") {
      parts.push(
        <img
          key={keyIdx++}
          src={first.match[3]}
          alt={first.match[2] || "Image"}
          className="my-3 rounded-xl border border-white/10 max-h-96 object-cover shadow-md"
        />,
      );
      remaining = first.match[4];
    } else if (first.type === "link") {
      const href = first.match[3];
      const isExternal = /^https?:\/\//i.test(href);
      parts.push(
        <a
          key={keyIdx++}
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
        >
          {first.match[2]}
          {isExternal && <ExternalLink size={12} className="shrink-0 inline" />}
        </a>,
      );
      remaining = first.match[4];
    } else if (first.type === "bold") {
      parts.push(
        <strong key={keyIdx++} className="font-bold text-white">
          {renderInlineMarkdown(first.match[3])}
        </strong>,
      );
      remaining = first.match[4];
    } else if (first.type === "strike") {
      parts.push(
        <del key={keyIdx++} className="line-through text-[var(--text-muted)]">
          {renderInlineMarkdown(first.match[2])}
        </del>,
      );
      remaining = first.match[3];
    } else if (first.type === "italic") {
      parts.push(
        <em key={keyIdx++} className="italic text-slate-200">
          {renderInlineMarkdown(first.match[3])}
        </em>,
      );
      remaining = first.match[4];
    }
  }

  return <>{parts}</>;
}
