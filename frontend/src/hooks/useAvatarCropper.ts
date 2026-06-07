import { useCallback, useState } from "react";

export function useAvatarCropper() {
  const [cropperState, setCropperState] = useState<{
    open: boolean;
    src: string;
    onComplete: (file: File) => void;
  }>({ open: false, src: "", onComplete: () => {} });

  const openCropper = useCallback((src: string, onComplete: (file: File) => void) => {
    setCropperState({ open: true, src, onComplete });
  }, []);

  const closeCropper = useCallback(() => {
    setCropperState({ open: false, src: "", onComplete: () => {} });
  }, []);

  return { cropperState, openCropper, closeCropper };
}
