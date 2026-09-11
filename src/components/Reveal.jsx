import { useEffect, useRef, useState } from "react";

/**
 * Scroll-reveal wrapper — fades and slides its children into place the
 * first time they scroll into view, using IntersectionObserver (no
 * animation library / bundle weight needed). Used across the public pages
 * to give the site a sense of movement as you scroll, instead of
 * everything just being static and present from the first paint.
 *
 * Respects prefers-reduced-motion by rendering fully visible immediately.
 */
export default function Reveal({
  children,
  className = "",
  as: Tag = "div",
  delay = 0,
  direction = "up", // "up" | "down" | "left" | "right" | "none"
  distance = 28,
  once = true,
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(node);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  const axis = direction === "left" || direction === "right" ? "X" : "Y";
  const sign = direction === "down" || direction === "right" ? 1 : -1;
  const hiddenTransform =
    direction === "none" ? "none" : `translate${axis}(${sign * distance}px)`;

  return (
    <Tag
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out will-change-transform ${
        visible ? "opacity-100" : "opacity-0"
      } ${className}`}
      style={{
        transform: visible ? "translate(0,0)" : hiddenTransform,
        transitionDelay: visible ? `${delay}ms` : "0ms",
      }}
    >
      {children}
    </Tag>
  );
}
