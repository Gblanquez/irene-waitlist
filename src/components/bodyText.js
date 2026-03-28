import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

export default function bodyTextReveal() {
  const targets = gsap.utils.toArray('[data-a="body-text"]');
  if (!targets.length) return;

  let splitInstances = [];
  let resizeTimer = null;

  const waitForFonts = () => {
    if (document.fonts && document.fonts.ready) return document.fonts.ready;
    return Promise.resolve();
  };

  const cleanup = () => {
    ScrollTrigger.getAll().forEach((st) => {
      if (st.vars?.id === "body-text") st.kill();
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
            },
          });

          tl.to(self.lines, {
            yPercent: 0,
            duration: 1.05,
            ease: "power3.out",
            stagger: 0.06,
          });

          ScrollTrigger.create({
            id: "body-text",
            trigger: el,
            start: "top bottom",
            toggleActions: "play none none none",
            animation: tl,
          });

          return tl;
        },
      });

      split._isReverted = false;
      splitInstances.push(split);
    });

    ScrollTrigger.refresh();
  };

  waitForFonts().then(() => {
    requestAnimationFrame(build);
  });

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      waitForFonts().then(() => requestAnimationFrame(build));
    }, 200);
  });
}