"use client";

import { useEffect } from "react";

export function ImageResponsiveFixer() {
  useEffect(() => {
    const fixImages = () => {
      const articleContent = document.querySelector(".article-content");
      if (!articleContent) return;

      const images = articleContent.querySelectorAll("img");
      images.forEach((img) => {
        // Force responsive styles with !important
        img.style.setProperty("max-width", "100%", "important");
        img.style.setProperty("height", "auto", "important");
        img.style.setProperty("width", "100%", "important");
        img.style.setProperty("display", "block", "important");
        img.style.setProperty("object-fit", "contain", "important");
        // Remove any width/height attributes
        img.removeAttribute("width");
        img.removeAttribute("height");
      });
    };

    // Run immediately
    fixImages();

    // Run after images load
    window.addEventListener("load", fixImages);

    // Run after a delay to ensure images are loaded
    const timeout1 = setTimeout(fixImages, 100);
    const timeout2 = setTimeout(fixImages, 500);
    const timeout3 = setTimeout(fixImages, 1000);

    // Run on window resize
    window.addEventListener("resize", fixImages);

    return () => {
      window.removeEventListener("load", fixImages);
      window.removeEventListener("resize", fixImages);
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, []);

  return null;
}
