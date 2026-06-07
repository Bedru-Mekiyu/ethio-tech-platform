import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import { X, Minus, Plus, RotateCw, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AvatarCropperProps {
  src: string;
  onComplete: (croppedFile: File) => void;
  onCancel: () => void;
  aspect?: number;
  minWidth?: number;
}

const MIN_CROP_SIZE = 128;
const MAX_ZOOM = 3;
const MIN_ZOOM = 0.5;

export function AvatarCropper({ src, onComplete, onCancel, aspect = 1, minWidth = MIN_CROP_SIZE }: AvatarCropperProps) {
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, width: 0, height: 0, unit: "px" });
  const [zoom, setZoom] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const cropRef = useRef<ReactCrop>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const initCrop = useCallback(() => {
    if (imgRef.current?.naturalWidth) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      const size = Math.min(naturalWidth, naturalHeight);
      setCrop({
        x: (naturalWidth - size) / 2,
        y: (naturalHeight - size) / 2,
        width: size,
        height: size,
        unit: "px",
      });
      setZoom(1);
      setImageLoaded(true);
    }
  }, []);

  useEffect(() => {
    initCrop();
  }, [src, initCrop]);

  const handleCropChange = useCallback((pixelCrop: PixelCrop) => {
    setCrop(pixelCrop);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.1, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.1, MIN_ZOOM));
  }, []);

  const handleRotate = useCallback(() => {
    if (imgRef.current) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { naturalWidth, naturalHeight } = imgRef.current;
      canvas.width = naturalHeight;
      canvas.height = naturalWidth;
      ctx.translate(naturalHeight / 2, naturalWidth / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(imgRef.current, -naturalWidth / 2, -naturalHeight / 2);

      imgRef.current.src = canvas.toDataURL("image/png");
    }
  }, []);

  const generateCroppedImage = useCallback(async (): Promise<File | null> => {
    if (!imgRef.current || !previewCanvasRef.current) return null;

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelCrop: PixelCrop = {
      x: crop.x * scaleX,
      y: crop.y * scaleY,
      width: crop.width * scaleX,
      height: crop.height * scaleY,
      unit: "px",
    };

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const file = new File([blob], "avatar-cropped.webp", { type: "image/webp" });
          resolve(file);
        },
        "image/webp",
        0.9,
      );
    });
  }, [crop]);

  const handleConfirm = useCallback(async () => {
    setProcessing(true);
    try {
      const file = await generateCroppedImage();
      if (file) {
        onComplete(file);
      }
    } finally {
      setProcessing(false);
    }
  }, [generateCroppedImage, onComplete]);

  if (!imageLoaded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 text-white">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Loading image...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-white">Crop Avatar</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
              aria-label="Zoom out"
            >
              <Minus size={18} />
            </Button>
            <span className="text-sm font-mono text-[var(--text-secondary)] w-16 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in">
              <Plus size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRotate} aria-label="Rotate 90°">
              <RotateCw size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Cancel">
              <X size={18} />
            </Button>
          </div>
        </div>

        <div className="relative flex-1 overflow-auto p-4 flex items-center justify-center bg-[var(--bg-base)]">
          <ReactCrop
            ref={cropRef}
            crop={crop}
            onChange={handleCropChange}
            aspect={aspect}
            minWidth={minWidth}
            minHeight={minWidth}
            ruleOfThirds
            circularCrop
          >
            <img
              ref={imgRef}
              src={src}
              alt="Avatar preview"
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
              }}
              onLoad={initCrop}
            />
          </ReactCrop>
          <canvas ref={previewCanvasRef} className="hidden" />
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-[var(--border)]">
          <Button variant="outline" onClick={onCancel} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={processing} className="bg-primary hover:bg-primary/90">
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Check size={16} className="mr-2" />
                Use This
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
