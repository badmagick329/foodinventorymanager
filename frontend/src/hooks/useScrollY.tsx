import { debounce } from "@/lib/utils";
import { useEffect, useMemo } from "react";

export default function useScrollY(localStorageKey: string) {
  const saveScrollPosition = useMemo(
    () =>
      debounce(() => {
        localStorage.setItem(localStorageKey, window.scrollY.toString());
      }, 50),
    [localStorageKey]
  );

  useEffect(() => {
    const onScroll = () => {
      saveScrollPosition();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    saveScrollPosition();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [localStorageKey, saveScrollPosition]);

  return {
    getY: () =>
      localStorageKey
        ? parseFloat(localStorage.getItem(localStorageKey) || "0")
        : 0,
  };
}
