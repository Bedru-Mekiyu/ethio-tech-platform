import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Hook to automatically scroll the window to the top and shift keyboard/screen reader focus
 * to the main content area (#main-content) on every route change.
 * This satisfies Accessibility Requirement AC1.
 */
export function useFocusOnRouteChange() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll window to top on route changes
    window.scrollTo(0, 0);

    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      // Ensure element is focusable
      if (!mainContent.hasAttribute("tabIndex")) {
        mainContent.setAttribute("tabIndex", "-1");
      }
      // Focus it to allow screen readers to start reading the page from the beginning
      mainContent.focus();
      // Style cleanup (typically CSS handles outline: none on focus when tabIndex is -1)
      mainContent.style.outline = "none";
    }
  }, [pathname]);
}
