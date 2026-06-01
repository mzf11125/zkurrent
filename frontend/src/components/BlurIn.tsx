import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { ReactNode } from "react";

interface BlurInProps {
  children: ReactNode;
  className?: string;
  duration?: number;
}

export function BlurIn({ children, className = "", duration = 1.1 }: BlurInProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ filter: "blur(20px)", opacity: 0, y: 20 }}
      animate={
        inView
          ? { filter: "blur(0px)", opacity: 1, y: 0, transition: { duration, ease: [0.16, 1, 0.3, 1] } }
          : {}
      }
    >
      {children}
    </motion.div>
  );
}
