import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface WordsPullUpProps {
  text: string;
  className?: string;
  gradientWords?: string[];
}

export function WordsPullUp({ text, className = "", gradientWords }: WordsPullUpProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const words = text.split(" ");

  return (
    <span ref={ref} className={`inline-flex flex-wrap gap-x-[0.3em] ${className}`}>
      {words.map((word, i) => {
        const isGradient = gradientWords?.includes(
          word.replace(/[^a-zA-Z-]/g, "")
        );
        return (
          <span key={i} className="inline-block overflow-hidden">
            <motion.span
              className={`inline-block ${isGradient ? "text-gradient" : ""}`}
              initial={{ y: 20, opacity: 0 }}
              animate={
                inView
                  ? { y: 0, opacity: 1, transition: { duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] } }
                  : {}
              }
            >
              {word}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}
