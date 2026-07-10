import { useEffect } from "react";

export function useSecurityRestrictions(
  isEnabled: boolean,
  onViolation: (message: string) => void,
  onTabSwitch?: (state: "hidden" | "visible") => void
) {
  useEffect(() => {
    if (!isEnabled) return;

    const handleBlockAction = (e: Event) => {
      e.preventDefault();
      onViolation("Copying and pasting is disabled during the interview session.");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (
        isCmdOrCtrl &&
        (e.key === "c" ||
          e.key === "v" ||
          e.key === "x" ||
          e.key === "C" ||
          e.key === "V" ||
          e.key === "X")
      ) {
        e.preventDefault();
        e.stopPropagation(); // Stop Monaco editor or browser from handling this shortcut
        onViolation("Keyboard shortcuts for copy, cut, and paste are disabled.");
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      onViolation("Right-click context menu is disabled.");
    };

    const handleVisibilityChange = () => {
      if (onTabSwitch) {
        onTabSwitch(document.visibilityState as "hidden" | "visible");
      }
    };

    // Use capturing phase (true) to intercept events before child elements handle them
    document.addEventListener("copy", handleBlockAction, true);
    document.addEventListener("cut", handleBlockAction, true);
    document.addEventListener("paste", handleBlockAction, true);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("drop", handleBlockAction, true);
    document.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("copy", handleBlockAction, true);
      document.removeEventListener("cut", handleBlockAction, true);
      document.removeEventListener("paste", handleBlockAction, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("drop", handleBlockAction, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isEnabled, onViolation, onTabSwitch]);
}
