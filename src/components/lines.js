import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

export default function globalLinesReveal() {
  const lines = gsap.utils.toArray(".line");
  if (!lines.length) return;

  lines.forEach((line) => {
    gsap.set(line, {
      scaleX: 0,
      transformOrigin: "100% 50%",
      willChange: "transform",
    });

    gsap.to(line, {
      scaleX: 1,
      duration: 2.2,
      ease: "expo.out",
      scrollTrigger: {
        trigger: line,
        start: "top bottom",
        toggleActions: "play none none none",
      },
    });
  });
}

