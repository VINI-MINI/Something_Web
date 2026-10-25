"use client";

import { useEffect, useState } from "react";

/**
 * 모바일 가상 키보드(Virtual Keyboard)의 열림 상태와 높이를 감지하는 훅
 * - VisualViewport API를 활용하여 가상 키보드가 차지한 높이를 실시간 계산
 * - 주소창 축소/확대 등 미세 변동(100px 미만)은 키보드로 오인하지 않도록 필터링
 */
export function useVirtualKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) {
      return;
    }

    const vv = window.visualViewport;

    const handleViewportChange = () => {
      const rawHeight = window.innerHeight - vv.height;
      if (rawHeight > 100) {
        setKeyboardHeight(Math.round(rawHeight));
      } else {
        setKeyboardHeight(0);
      }
      setViewportHeight(Math.round(vv.height));
    };

    vv.addEventListener("resize", handleViewportChange);
    vv.addEventListener("scroll", handleViewportChange);
    handleViewportChange();

    return () => {
      vv.removeEventListener("resize", handleViewportChange);
      vv.removeEventListener("scroll", handleViewportChange);
    };
  }, []);

  return {
    keyboardHeight,
    viewportHeight,
    isKeyboardOpen: keyboardHeight > 0,
  };
}
