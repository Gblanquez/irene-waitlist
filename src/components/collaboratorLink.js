import { gsap } from "gsap";

export default function collabLinkPageHover() {
  const links = document.querySelectorAll('.collaborator-link');
  if (!links.length) return;

  links.forEach((link) => {
    const line = link.querySelectorAll(".collaborator-line");
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
          duration: 1.1,
          ease: "power3.out",
          stagger: 0.04,
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
          stagger: 0.04,
        }
      );
    });
  });
}

