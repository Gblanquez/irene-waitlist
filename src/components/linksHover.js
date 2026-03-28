import { gsap } from "gsap";

export default function globalLinkHover() {
  const links = document.querySelectorAll('.cta');
  if (!links.length) return;

  links.forEach((link) => {
    const line = link.querySelector(".cta-line");
    if (!line) return;


    gsap.set(line, {
      width: "0%",
      scaleX: 1,
      transformOrigin: "left center",
    });

    link.addEventListener("mouseenter", () => {
      gsap.killTweensOf(line);

      gsap.fromTo(
        line,
        { width: "0%", scaleX: 1, transformOrigin: "left center" },
        {
          width: "100%",
          duration: 0.6,
          ease: "power3.out",
        }
      );
    });

    link.addEventListener("mouseleave", () => {
      gsap.killTweensOf(line);

      gsap.fromTo(
        line,
        { scaleX: 1, transformOrigin: "right center" },
        {
          scaleX: 0,
          duration: 0.6,
          ease: "expo.out",
        }
      );
    });
  });
}

