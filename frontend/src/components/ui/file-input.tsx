import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";
import { forwardRef, useRef, useState } from "react";

export interface FileInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  error?: string;
  maxSize?: number;
  preview?: boolean;
  onFileSelect?: (file: File | null) => void;
}

export const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      className,
      label,
      description,
      error,
      maxSize = 5 * 1024 * 1024,
      preview = false,
      onFileSelect,
      accept = "image/*",
      id,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLInputElement | null>(null);
    const fileRef = ref || internalRef;
    const [fileName, setFileName] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const inputId = id || `file-input-${Math.random().toString(36).substr(2, 9)}`;

    const applyFile = (file: File | undefined) => {
      if (!file) {
        setFileName(null);
        setPreviewUrl(null);
        onFileSelect?.(null);
        return;
      }
      if (maxSize && file.size > maxSize) {
        onFileSelect?.(null);
        return;
      }
      setFileName(file.name);
      onFileSelect?.(file);
      if (preview && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => setPreviewUrl(event.target?.result as string);
        reader.readAsDataURL(file);
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      applyFile(file);
    };

    const handleClear = () => {
      setFileName(null);
      setPreviewUrl(null);
      if (fileRef && "current" in fileRef) {
        fileRef.current!.value = "";
      }
      onFileSelect?.(null);
    };

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-white">
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={fileRef as React.Ref<HTMLInputElement>}
            id={inputId}
            type="file"
            accept={accept}
            className="sr-only"
            onChange={handleFileChange}
            {...props}
          />

          <label
            htmlFor={inputId}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              applyFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-elevated)]/50 px-4 py-6 text-center transition-[border-color,background-color] duration-200 hover:border-primary/40 hover:bg-primary/5",
              dragOver && "border-primary/60 bg-primary/5",
              error && "border-danger/40",
              fileName && "border-primary/60 bg-primary/5",
              className
            )}
          >
            <Upload size={24} className="text-[var(--text-muted)]" />
            {fileName ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">{fileName}</p>
                <p className="text-xs text-[var(--text-secondary)]">Click to replace</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {accept === "image/*" ? "PNG, JPG up to " : "Files up to "}
                  {maxSize ? `${(maxSize / 1024 / 1024).toFixed(1)}MB` : "any size"}
                </p>
              </div>
            )}
          </label>
        </div>

        {previewUrl && preview && (
          <div className="relative mt-2 inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-24 w-24 rounded-lg border border-[var(--border)] object-cover"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute -right-2 -top-2 rounded-full bg-danger p-1 text-white hover:brightness-110 transition-all"
              aria-label="Remove file"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {fileName && !preview && (
          <div className="flex items-center justify-between rounded-lg bg-[var(--bg-elevated)]/50 px-3 py-2">
            <p className="text-sm text-[var(--text-secondary)]">{fileName}</p>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-primary hover:underline"
            >
              Clear
            </button>
          </div>
        )}

        {description && (
          <p className="text-xs text-[var(--text-secondary)]">{description}</p>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

FileInput.displayName = "FileInput";
