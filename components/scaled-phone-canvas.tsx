"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

// The real-phone width every button/text/logo size in lib/landing-catalog.ts is chosen against
// (a title of 28px, a button of 52px tall, etc. all assume "this renders on a ~390px wide
// phone"). Callers pass the ACTUAL width of the device being mocked (Chico 360 / Común 390 /
// Grande 430) as `designWidth`, so the landing lays out — wraps, pads, centers — exactly as it
// would in a browser that wide, and that whole box is then scaled as one image to fit the frame.
const DESIGN_WIDTH = 390;

// A phone shows no permanent scrollbar: an indicator appears while you scroll and fades away.
// The native scrollbar can't do that here (it also steals layout width, which would change the
// scale, which changes the content height, which can toggle the scrollbar again), so the
// scroller hides it and this thin overlay thumb stands in for it.
const THUMB_FADE_MS = 900;

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
  /** "width" (default): scale so content fills the container's width. A landing shorter than the
   *  phone's screen is stretched to fill it (background reaches the bottom edge, NO scrolling —
   *  like a short real page on a real phone); a taller one scrolls — also like a real phone.
   *  "contain": scale so the WHOLE landing fits inside the container on both axes at once,
   *  centered, no scrolling. Used by "Vista previa" on mobile. */
  fit?: "width" | "contain";
  onScaleChange?: (scale: number) => void;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const onScaleChangeRef = useRef(onScaleChange);
  onScaleChangeRef.current = onScaleChange;

  // Starts hidden and stays hidden through the first paint on purpose: `useLayoutEffect` can't
  // stop the browser from painting the server-rendered HTML (unscaled) before hydration, which
  // showed up as the phone appearing too big and then shrinking. The first real measurement
  // reveals it, so the first thing anyone SEES is already correctly scaled.
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const spacer = spacerRef.current;
    const content = contentRef.current;
    if (!outer || !content) return;

    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    let raf = 0;

    const updateThumb = () => {
      const thumb = thumbRef.current;
      if (!thumb || fit !== "width") return;
      const visible = outer.clientHeight;
      const total = outer.scrollHeight;
      if (total <= visible + 1) { thumb.style.opacity = "0"; return; }
      const trackPad = 6;
      const track = visible - trackPad * 2;
      const height = Math.max(28, (visible / total) * track);
      const progress = outer.scrollTop / (total - visible);
      thumb.style.height = `${height}px`;
      thumb.style.transform = `translateY(${trackPad + progress * (track - height)}px)`;
    };
    const flashThumb = () => {
      const thumb = thumbRef.current;
      if (!thumb) return;
      updateThumb();
      if (outer.scrollHeight <= outer.clientHeight + 1) return;
      thumb.style.opacity = "1";
      clearTimeout(fadeTimer);
      fadeTimer = setTimeout(() => { thumb.style.opacity = "0"; }, THUMB_FADE_MS);
    };

    // Everything is written straight to the DOM (never via React state) so a measurement is
    // applied in the very same tick it's taken: no render in between, no one-frame flash of a
    // stale size, and no stale closure over an old scale.
    const apply = () => {
      const outerRect = outer.getBoundingClientRect();
      if (outerRect.width <= 0) return;
      const byWidth = outerRect.width / designWidth;
      let scale = byWidth;
      const flow = getComputedStyle(outer).overflowY === "visible";
      const screenHeight = flow ? (outer.closest(".v2-stage")?.clientHeight ?? window.innerHeight) : outerRect.height;
      content.style.setProperty("--landing-viewport-height", `${screenHeight / byWidth}px`);

      if (fit === "contain") {
        // offsetHeight is the layout-box height: CSS transform never affects it, so it's always
        // the true unscaled height regardless of the transform applied on the previous run.
        content.style.width = `${designWidth}px`;
        const naturalHeight = content.offsetHeight;
        if (outerRect.height > 0 && naturalHeight > 0) scale = Math.min(byWidth, outerRect.height / naturalHeight);
        // Shrunk to fit the height, the landing would end up narrower than the screen and leave
        // bare frame showing down both sides. Laying it out at the width that exactly fills the
        // screen at this scale makes its background run edge to edge; the content itself stays
        // centered and capped by the landing's own max width, so nothing else moves.
        content.style.width = `${Math.max(designWidth, outerRect.width / scale)}px`;
      } else if (spacer) {
        // The landing's OWN height, measured with the stretch we impose (below) lifted — otherwise
        // we'd be measuring our own previous min-height and could never shrink again after
        // buttons are deleted.
        content.style.minHeight = "0px";
        const naturalHeight = content.offsetHeight;
        // How tall the phone's screen is. Normally that's this element's own box. On the
        // full-bleed mobile layout the canvas isn't a scroll container (its height just follows
        // the spacer), so the room to fill is the stage that page-scrolls around it instead.
        const flow = getComputedStyle(outer).overflowY === "visible";
        const available = flow ? (outer.closest(".v2-stage")?.clientHeight ?? window.innerHeight) : outerRect.height;
        // Fill the phone when the landing is shorter than its screen (min-height in the SAME
        // pre-scale units as the content: after `scale()` shrinks it, it paints out to exactly the
        // screen height) — the equivalent of `.public { min-height: 100vh }` on a real page.
        // The scroller scrolls THIS plain, untransformed box, never the transformed content:
        // scrollHeight of a scaled child isn't reliably its painted height, which used to leave
        // spurious scrollbars or an overscroll gap. Rounded up so a fractional pixel can never
        // create a phantom 1px scroll.
        const spacerHeight = Math.max(Math.ceil(naturalHeight * scale), Math.round(available));
        spacer.style.height = `${spacerHeight}px`;
        // The content is stretched to paint out to exactly that same height (not merely to
        // `available`), so the landing's background never stops a fraction of a pixel short of
        // the end of the scroll range.
        content.style.minHeight = `${spacerHeight / scale}px`;
      }

      content.style.transform = `scale(${scale})`;
      updateThumb();
      onScaleChangeRef.current?.(scale);
      setReady(true);
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };

    apply();

    // Resizes of the frame itself and of the content.
    const ro = new ResizeObserver(apply);
    ro.observe(outer);
    ro.observe(content);
    // Content that changes size WITHOUT `content` resizing — deleting buttons while our own
    // min-height is still holding it tall is exactly that case — plus text/size edits. Records
    // targeting `content` itself are our own style writes and are ignored (no feedback loop).
    const mo = new MutationObserver((records) => {
      if (records.every((record) => record.target === content)) return;
      schedule();
    });
    mo.observe(content, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["style", "class"] });
    // Images and web fonts settle after the DOM does.
    const onLoad = () => schedule();
    content.addEventListener("load", onLoad, true);
    document.fonts?.ready.then(schedule);
    outer.addEventListener("scroll", flashThumb, { passive: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
      content.removeEventListener("load", onLoad, true);
      outer.removeEventListener("scroll", flashThumb);
      cancelAnimationFrame(raf);
      clearTimeout(fadeTimer);
    };
  }, [designWidth, fit]);

  if (fit === "contain") {
    return (
      <div ref={outerRef} className={className} data-fit={fit} style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: ready ? 1 : 0 }}>
        <div ref={contentRef} style={{ width: designWidth, flex: "none", transformOrigin: "center" }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div ref={outerRef} className={className} data-fit={fit} style={{ opacity: ready ? 1 : 0 }}>
      {/* Zero-height sticky anchor so the scroll indicator stays put while the content scrolls
          under it, without taking any layout space. */}
      <div className="scaled-phone-thumb-anchor" aria-hidden="true"><div ref={thumbRef} className="scaled-phone-thumb" /></div>
      <div ref={spacerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
        <div
          ref={contentRef}
          style={{ position: "absolute", top: 0, left: 0, width: designWidth, display: "flex", flexDirection: "column", transformOrigin: "top left" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
