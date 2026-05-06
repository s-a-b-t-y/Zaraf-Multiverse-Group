document.addEventListener("DOMContentLoaded", () => {
  // If there's any specific interactivity required for the services page, it can be added here.
  // The global nav, modal, and scroll animations are handled by 1.Home_Page/script.js
  
  // Optionally re-triggering intersection observer or any other specific logic
  // if not handled properly by global script due to path differences.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.1 }
  );

  const animatedElements = document.querySelectorAll("[data-animate]");
  animatedElements.forEach((el) => {
    observer.observe(el);
  });
});
