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
  /** "width" (default): scale so content fills the container's width. If the landing's content
   *  is shorter than the phone's own screen height, it's stretched to fill the phone (so the
   *  background reaches the bottom edge) with NO scrolling — exactly like a short real webpage
   *  on a real phone. If it's taller, it scrolls — also exactly like a real phone.
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
  // "width" mode only — see the long comment in the effect below for why this exists. It's the
  // real, untransformed pixel height of the scroll spacer: never a CSS min-height on the
  // transformed content itself, and never left for the browser to infer from a scaled child's
  // own layout size.
  const [spacerHeightPx, setSpacerHeightPx] = useState<number | null>(null);

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
      } else if (fit === "width") {
        // Content's OWN natural height, with any min-height we previously imposed cleared first
        // — otherwise we'd be measuring a height we ourselves inflated last run.
        const prevMinHeight = content.style.minHeight;
        content.style.minHeight = "0px";
        const naturalHeight = content.offsetHeight;
        content.style.minHeight = prevMinHeight;

        // THE bug this whole rewrite exists for: a plain `overflow-y: auto` directly on the
        // canvas, scrolling a CHILD that itself carries `transform: scale()`, relies on the
        // browser computing that child's scrollHeight post-transform — and it doesn't, reliably.
        // Measured directly: a child whose real painted height was, say, 568px (matching the
        // canvas exactly) still reported a scrollHeight in the hundreds of px *more* than that
        // (its pre-scale layout size) — so with few buttons, a scrollbar appeared for a phone
        // with nothing left to scroll to, and with many buttons, scrolling to the reported
        // "end" overscrolled PAST the real (scaled-down) content into bare background beyond it
        // (reported first as "no debería salir un scroll" with few buttons, then reproduced with
        // a screenshot showing the overscroll gap with many). Toggling overflow-y by hand fixed
        // the first case but not the second — the scroll RANGE itself was still wrong.
        // The fix: never let the browser derive scrollHeight from the transformed element at
        // all. `content` (transformed, scaled) is `position: absolute` inside a plain, ordinary,
        // UNTRANSFORMED spacer div — see the JSX below — whose height is a real pixel number we
        // set ourselves: `naturalHeight * scale` (the content's true PAINTED height), floored at
        // the canvas's own height so a short landing never comes up short of filling the phone.
        // This spacer is what .scaled-phone-canvas actually scrolls; its scrollHeight is exact
        // because nothing about it is transformed — normal layout, normal (correct) metrics.
        const visualHeight = naturalHeight * next;
        setSpacerHeightPx(Math.max(visualHeight, outerRect.height));
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

  if (fit === "contain") {
    return (
      <div ref={outerRef} className={className} data-fit={fit} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div ref={contentRef} style={{ width: designWidth, flex: "none", transform: `scale(${scale})`, transformOrigin: "center" }}>
          {children}
        </div>
      </div>
    );
  }

  // The spacer's height (real px, no transform) is what the canvas actually scrolls against —
  // see the effect above. The content div inside it is the one that's visually scaled AND
  // absolutely positioned, so its own layout size never feeds back into the spacer's height (no
  // circular dependency) or into the canvas's scrollHeight (no more mismatched scroll range).
  // Its `min-height` (in the SAME local, pre-scale units as its width) is `spacerHeightPx /
  // scale` — after the same `scale(...)` shrinks it back down, that always paints out to exactly
  // `spacerHeightPx`, so LandingRenderer's `.public` (set to `flex: 1 1 auto` in globals.css)
  // has real space to grow into and paint its background over, right down to the phone's actual
  // bottom edge, even when there's only one or two buttons.
  return (
    <div ref={outerRef} className={className} data-fit={fit}>
      <div style={{ position: "relative", width: "100%", height: spacerHeightPx ?? "100%" }}>
        <div
          ref={contentRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: designWidth,
            display: "flex",
            flexDirection: "column",
            minHeight: spacerHeightPx != null ? spacerHeightPx / scale : undefined,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
