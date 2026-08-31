import { useState } from "react";
import { Code2, Sparkles, Copy, Check, ExternalLink } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";

interface CodeSandboxStarterEditorProps {
  codeSandboxUrl: string;
  onCodeSandboxUrlChange: (val: string) => void;
  starterCode: string;
  onStarterCodeChange: (val: string) => void;
  challengeTask?: string;
  onChallengeTaskChange?: (val: string) => void;
}

const TEMPLATES: Array<{ label: string; lang: string; code: string }> = [
  {
    label: "TypeScript / React",
    lang: "typescript",
    code: `import { useState } from "react";\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <main className="p-8 font-sans max-w-md mx-auto">\n      <h1 className="text-2xl font-bold">Interactive Lab</h1>\n      <p className="mt-2 text-slate-600">Complete the implementation below:</p>\n      <button\n        onClick={() => setCount((c) => c + 1)}\n        className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg"\n      >\n        Count: {count}\n      </button>\n    </main>\n  );\n}`,
  },
  {
    label: "Node.js / Express API",
    lang: "javascript",
    code: `import express from "express";\nconst app = express();\napp.use(express.json());\n\n// TODO: Implement the authenticated route\napp.get("/api/v1/students", (req, res) => {\n  res.json({ message: "Student records retrieved", data: [] });\n});\n\nconst PORT = process.env.PORT || 3000;\napp.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));`,
  },
  {
    label: "Python / Data Science",
    lang: "python",
    code: `import numpy as np\nimport pandas as pd\n\ndef analyze_telemetry(data_records):\n    """\n    Analyze Ethiopian agricultural sensor telemetry.\n    Calculate moving averages and identify soil anomalies.\n    """\n    df = pd.DataFrame(data_records)\n    # TODO: Calculate soil moisture index\n    return df.describe()\n\nif __name__ == "__main__":\n    sample_data = [{"sensor_id": 101, "moisture": 42.5}]\n    print(analyze_telemetry(sample_data))`,
  },
];

export function CodeSandboxStarterEditor({
  codeSandboxUrl,
  onCodeSandboxUrlChange,
  starterCode,
  onStarterCodeChange,
  challengeTask,
  onChallengeTaskChange,
}: CodeSandboxStarterEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!starterCode) return;
    try {
      await navigator.clipboard.writeText(starterCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const applyTemplate = (code: string) => {
    if (starterCode && !window.confirm("Replace current starter code with selected template?")) {
      return;
    }
    onStarterCodeChange(code);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 size={18} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Code Lab & Sandbox Environment</h3>
        </div>
        {codeSandboxUrl && (
          <a
            href={codeSandboxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Launch Sandbox <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Sandbox URL */}
      <div className="space-y-1.5">
        <label htmlFor="sandbox-url" className="block text-xs font-medium text-[var(--text-secondary)]">
          CodeSandbox or StackBlitz URL
        </label>
        <Input
          id="sandbox-url"
          value={codeSandboxUrl}
          onChange={(e) => onCodeSandboxUrlChange(e.target.value)}
          placeholder="https://codesandbox.io/p/sandbox/... or https://stackblitz.com/edit/..."
        />
        <p className="text-[11px] text-[var(--text-muted)]">
          Students can open this link to launch a cloud container pre-configured with dependencies.
        </p>
      </div>

      {/* Starter Code */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="starter-code" className="block text-xs font-medium text-[var(--text-secondary)]">
            Starter Code Snippet
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--text-muted)]">Templates:</span>
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.label}
                type="button"
                onClick={() => applyTemplate(tmpl.code)}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                {tmpl.label}
              </button>
            ))}
            {starterCode && (
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] text-primary hover:underline"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>
        </div>

        <Textarea
          id="starter-code"
          value={starterCode}
          onChange={(e) => onStarterCodeChange(e.target.value)}
          placeholder="Paste or write starter boilerplate for this lesson..."
          rows={6}
          className="font-mono text-xs leading-relaxed"
        />
      </div>

      {/* Challenge Task */}
      {onChallengeTaskChange && (
        <div className="space-y-1.5">
          <label htmlFor="challenge-task" className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
            <Sparkles size={13} />
            Challenge / Hands-On Task Prompt
          </label>
          <Input
            id="challenge-task"
            value={challengeTask ?? ""}
            onChange={(e) => onChallengeTaskChange(e.target.value)}
            placeholder="e.g. Refactor the authentication middleware to support JWT claims verification..."
          />
        </div>
      )}
    </div>
  );
}
