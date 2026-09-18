"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

// The real-phone width every button/text/logo size in lib/landing-catalog.ts is chosen
// against (a title of 28px, a button of 52px tall, etc. all assume "this renders on a ~390px
// wide phone"). Scaling this whole box as one image, instead of letting the outer frame resize
// while these stay fixed px, is what keeps a shrunk frame looking like an actual smaller photo
// of a phone instead of a differently-proportioned box with oversized text crammed into it.
const DESIGN_WIDTH = 390;

export default function ScaledPhoneCanvas({
  children,
  className,
  designWidth = DESIGN_WIDTH,
  fit = "width",
  onScaleChange,
}: {
  children: ReactNode;
  className: string;
  designWidth?: number;
  /** "width" (default): scale so content fills the container's width — taller-than-container
   *  content overflows and the container scrolls (see .scaled-phone-canvas's own overflow-y).
   *  "contain": scale so the WHOLE thing (however tall) fits inside the container on both axes
   *  at once, centered, no scrolling — the entire landing is always visible in one shot, however
   *  small it has to shrink. Used for "Vista previa" on mobile, where scrolling a phone-shaped
   *  box that already spans most of the real screen feels redundant. */
  fit?: "width" | "contain";
  onScaleChange?: (scale: number) => void;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const content = contentRef.current;
    if (!outer || !content) return;
    const apply = () => {
      const outerRect = outer.getBoundingClientRect();
      if (outerRect.width <= 0) return;
      const byWidth = outerRect.width / designWidth;
      let next = byWidth;
      if (fit === "contain" && outerRect.height > 0) {
        // content.offsetHeight is the element's own layout-box height — CSS `transform` never
        // affects layout, so this is always the true, unscaled height, regardless of whatever
        // transform is currently applied to this same element from the previous run.
        const naturalHeight = content.offsetHeight;
        if (naturalHeight > 0) next = Math.min(byWidth, outerRect.height / naturalHeight);
      }
      setScale(next);
      onScaleChange?.(next);
    };
    // Measured synchronously here (useLayoutEffect, before paint) so the very first frame is
    // already at the right scale — an initial scale-of-1 render would otherwise flash at the
    // wrong size for one frame whenever the available space isn't exactly ~390px.
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(outer);
    ro.observe(content);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designWidth, fit]);

  return (
    <div ref={outerRef} className={className} data-fit={fit} style={fit === "contain" ? { display: "flex", alignItems: "center", justifyContent: "center" } : undefined}>
      <div
        ref={contentRef}
        style={{
          width: designWidth,
          flex: "none",
          transform: `scale(${scale})`,
          transformOrigin: fit === "contain" ? "center" : "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
