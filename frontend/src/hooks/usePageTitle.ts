import { useEffect } from "react";

const BASE_TITLE = "EthioTech";

/**
 * Sets the document title for SEO and tab identification.
 * Automatically resets to the base title on unmount.
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
