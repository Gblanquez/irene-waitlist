import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

export default function titleTextReveal() {
  const targets = gsap.utils.toArray('[data-a="title-text"]');
  if (!targets.length) return;

  let splitInstances = [];
  let resizeTimer = null;
  let hasBuilt = false;

  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  const waitForFonts = () => {
    if (document.fonts && document.fonts.ready) return document.fonts.ready;
    return Promise.resolve();
  };

  const cleanup = () => {
    ScrollTrigger.getAll().forEach((st) => {
      if (st.vars?.id === "title-text") st.kill();
    });

    splitInstances.forEach((inst) => {
      if (inst && !inst._isReverted) {
        inst.revert();
      }
    });

    splitInstances = [];
  };

  const build = () => {
    cleanup();

    targets.forEach((el) => {
      // prevent re-animating same element on mobile
      if (isMobile && el._animated) return;

      const split = SplitText.create(el, {
        type: "lines,words",
        autoSplit: true,
        mask: "lines",
        onSplit: (self) => {
          gsap.set(self.lines, { yPercent: 100, willChange: "transform" });

          const tl = gsap.timeline({
            paused: true,
            onComplete: () => {
              self.revert();
              self._isReverted = true;
              el._animated = true; // mark as done
            },
          });

          tl.to(self.lines, {
            yPercent: 0,
            duration: 1.2,
            ease: "power3.out",
            stagger: 0.04,
          });

          ScrollTrigger.create({
            id: "body-text",
            trigger: el,
            start: "top bottom",
            toggleActions: "play none none none",
            animation: tl,
            once: isMobile, 
          });

          return tl;
        },
      });

      split._isReverted = false;
      splitInstances.push(split);
    });

    ScrollTrigger.refresh();
    hasBuilt = true;
  };

  waitForFonts().then(() => {
    requestAnimationFrame(build);
  });


  if (!isMobile) {
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        waitForFonts().then(() => requestAnimationFrame(build));
      }, 200);
    });
  }
}