(function () {
  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile nav toggle
  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close menu when clicking a link (mobile)
    nav.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => {
        if (nav.classList.contains("is-open")) {
          nav.classList.remove("is-open");
          navToggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  // HERO slider (index only)
  const slider = document.querySelector("[data-hero-slider]");
  if (slider) {
    const slides = Array.from(slider.querySelectorAll(".hero-slide"));
    const dotsWrap = slider.querySelector("[data-hero-dots]");
    let index = slides.findIndex(s => s.classList.contains("is-active"));
    if (index < 0) index = 0;

    // Build dots
    const dots = slides.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "hero-dot" + (i === index ? " is-active" : "");
      b.setAttribute("aria-label", `Go to slide ${i + 1}`);
      b.addEventListener("click", () => {
        setSlide(i);
        restart();
      });
      dotsWrap?.appendChild(b);
      return b;
    });

    function setSlide(next) {
      slides[index].classList.remove("is-active");
      dots[index]?.classList.remove("is-active");

      index = next;

      slides[index].classList.add("is-active");
      dots[index]?.classList.add("is-active");
    }

    function nextSlide() {
      setSlide((index + 1) % slides.length);
    }

    // Auto rotate every 4 seconds
    let timer = setInterval(nextSlide, 4000);

    function restart() {
      clearInterval(timer);
      timer = setInterval(nextSlide, 4000);
    }

    // Pause on hover/focus for a more premium feel
    slider.addEventListener("mouseenter", () => clearInterval(timer));
    slider.addEventListener("mouseleave", restart);
    slider.addEventListener("focusin", () => clearInterval(timer));
    slider.addEventListener("focusout", restart);
  }

  // Simple Gallery filter/search (gallery only)
  const grid = document.querySelector("[data-gallery-grid]");
  const search = document.querySelector("[data-gallery-search]");
  const chipsWrap = document.querySelector("[data-gallery-chips]");

  if (grid && search && chipsWrap) {
    const items = Array.from(grid.querySelectorAll(".gallery-item"));
    let filter = "all";

    function apply() {
      const q = (search.value || "").trim().toLowerCase();
      items.forEach(item => {
        const tags = (item.getAttribute("data-tags") || "").toLowerCase();
        const matchFilter = filter === "all" || tags.includes(filter);
        const matchSearch = !q || tags.includes(q);
        item.style.display = matchFilter && matchSearch ? "" : "none";
      });
    }

    chipsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-filter]");
      if (!btn) return;
      filter = btn.getAttribute("data-filter") || "all";
      chipsWrap.querySelectorAll(".chip").forEach(c => c.classList.remove("is-active"));
      btn.classList.add("is-active");
      apply();
    });

    search.addEventListener("input", apply);
    apply();
  }

  // Contact form (front-end demo)
  const contactForm = document.querySelector("[data-contact-form]");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const status = document.querySelector("[data-contact-status]");
      if (status) {
        status.textContent = "Thanks! Your message is ready to send (connect this form to email/Firebase next).";
      }
      contactForm.reset();
    });
  }
})();
