import { Plus, Trash2, HelpCircle, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { QuizQuestion } from "./types";

interface QuizEditorProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
}

export function QuizEditor({ questions, onChange }: QuizEditorProps) {
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      question: "",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      correctIndex: 0,
    };
    onChange([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updated: QuizQuestion) => {
    const copy = [...questions];
    copy[index] = updated;
    onChange(copy);
  };

  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  const moveQuestion = (from: number, to: number) => {
    if (to < 0 || to >= questions.length) return;
    const copy = [...questions];
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    onChange(copy);
  };

  const updateOption = (qIndex: number, optIndex: number, val: string) => {
    const q = questions[qIndex];
    const newOptions = [...q.options];
    newOptions[optIndex] = val;
    updateQuestion(qIndex, { ...q, options: newOptions });
  };

  const addOption = (qIndex: number) => {
    const q = questions[qIndex];
    if (q.options.length >= 6) return;
    updateQuestion(qIndex, {
      ...q,
      options: [...q.options, `Option ${q.options.length + 1}`],
    });
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    const q = questions[qIndex];
    if (q.options.length <= 2) return;
    const newOptions = q.options.filter((_, i) => i !== optIndex);
    let newCorrect = q.correctIndex;
    if (newCorrect === optIndex) newCorrect = 0;
    else if (newCorrect > optIndex) newCorrect -= 1;
    updateQuestion(qIndex, { ...q, options: newOptions, correctIndex: newCorrect });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle size={18} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Lesson Assessment Quiz</h3>
        </div>
        <Button type="button" size="sm" onClick={addQuestion} className="gap-1.5 h-8">
          <Plus size={14} /> Add Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-[var(--text-muted)]">
          No quiz questions configured. Click &quot;Add Question&quot; to build an interactive knowledge check.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="rounded-xl border border-[var(--border)] bg-white/[0.03] p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Question #{qIndex + 1}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={qIndex === 0}
                    onClick={() => moveQuestion(qIndex, qIndex - 1)}
                    className="h-7 w-7"
                    title="Move up"
                  >
                    <ChevronUp size={14} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={qIndex === questions.length - 1}
                    onClick={() => moveQuestion(qIndex, qIndex + 1)}
                    className="h-7 w-7"
                    title="Move down"
                  >
                    <ChevronDown size={14} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(qIndex)}
                    className="h-7 w-7 text-danger hover:bg-danger/10"
                    title="Delete question"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <Input
                  value={q.question}
                  onChange={(e) => updateQuestion(qIndex, { ...q, question: e.target.value })}
                  placeholder="e.g. Which hook is used to manage side-effects in React?"
                  className="font-medium text-sm"
                />
              </div>

              {/* Options */}
              <div className="space-y-2 pt-1">
                <span className="text-xs text-[var(--text-muted)] block">
                  Options (select radio for correct answer):
                </span>
                {q.options.map((opt, optIndex) => (
                  <div key={optIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={q.correctIndex === optIndex}
                      onChange={() => updateQuestion(qIndex, { ...q, correctIndex: optIndex })}
                      className="h-4 w-4 text-emerald-500 focus:ring-0 cursor-pointer"
                      title="Mark as correct answer"
                    />
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                      placeholder={`Option ${optIndex + 1}`}
                      className="h-9 text-xs flex-1"
                    />
                    {q.options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(qIndex, optIndex)}
                        className="h-7 w-7 text-[var(--text-muted)] hover:text-danger"
                      >
                        <Trash2 size={13} />
                      </Button>
                    )}
                  </div>
                ))}

                {q.options.length < 6 && (
                  <button
                    type="button"
                    onClick={() => addOption(qIndex)}
                    className="text-xs text-primary hover:underline pt-1 inline-flex items-center gap-1"
                  >
                    <Plus size={12} /> Add option
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
