"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const html = document.documentElement;
  const body = document.body;

  const menuToggle = document.querySelector("#menuToggle");
  const navLinks = document.querySelector("#navLinks");
  const themeToggle = document.querySelector("#themeToggle");
  const yearElement = document.querySelector("#year");
  const scrollProgress = document.querySelector("#scrollProgress");
  const backToTop = document.querySelector("#backToTop");
  const header = document.querySelector(".site-header");

  const THEME_KEY = "portfolio-theme";
  const MOBILE_BREAKPOINT = 900;
  const SCROLL_TOP_THRESHOLD = 500;

  const motionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let activeSectionId = "";
  let scrollTicking = false;
  let navigationTicking = false;

  /* =========================================
     UTILITY FUNCTIONS
  ========================================= */

  const isMobile = () =>
    window.innerWidth <= MOBILE_BREAKPOINT;

  const prefersReducedMotion = () =>
    motionQuery.matches;

  const getScrollBehavior = () =>
    prefersReducedMotion() ? "auto" : "smooth";

  const isValidTheme = (theme) =>
    theme === "light" || theme === "dark";

  const getCurrentTheme = () =>
    html.dataset.theme === "light" ? "light" : "dark";

  const getHeaderHeight = () =>
    header
      ? Math.ceil(header.getBoundingClientRect().height)
      : 0;

  const safeFocus = (element) => {
    if (!element) return;

    try {
      element.focus({
        preventScroll: true,
      });
    } catch {
      element.focus();
    }
  };

  /* =========================================
     CURRENT YEAR
  ========================================= */

  if (yearElement) {
    yearElement.textContent = String(
      new Date().getFullYear()
    );
  }

  /* =========================================
     THEME MANAGEMENT
  ========================================= */

  const getStoredTheme = () => {
    try {
      const storedTheme = localStorage.getItem(THEME_KEY);

      return isValidTheme(storedTheme)
        ? storedTheme
        : null;
    } catch {
      return null;
    }
  };

  const saveTheme = (theme) => {
    if (!isValidTheme(theme)) return;

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Local storage may be unavailable.
    }
  };

  const updateThemeIcons = (theme) => {
    if (!themeToggle) return;

    const isLight = theme === "light";

    const sunIcon = themeToggle.querySelector(
      ".theme-icon-sun"
    );

    const moonIcon = themeToggle.querySelector(
      ".theme-icon-moon"
    );

    if (sunIcon) {
      sunIcon.hidden = !isLight;
      sunIcon.setAttribute(
        "aria-hidden",
        String(!isLight)
      );
    }

    if (moonIcon) {
      moonIcon.hidden = isLight;
      moonIcon.setAttribute(
        "aria-hidden",
        String(isLight)
      );
    }
  };

  const updateThemeButton = (theme) => {
    if (!themeToggle) return;

    const isLight = theme === "light";
    const nextTheme = isLight ? "dark" : "light";

    const label = isLight
      ? "Switch to dark theme"
      : "Switch to light theme";

    themeToggle.setAttribute("type", "button");
    themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("title", label);
    themeToggle.setAttribute(
      "aria-pressed",
      String(isLight)
    );

    themeToggle.dataset.theme = theme;
    themeToggle.dataset.nextTheme = nextTheme;

    updateThemeIcons(theme);
  };

  const applyTheme = (theme, shouldSave = true) => {
    const selectedTheme =
      theme === "light" ? "light" : "dark";

    if (selectedTheme === "light") {
      html.dataset.theme = "light";
    } else {
      delete html.dataset.theme;
    }

    body.dataset.activeTheme = selectedTheme;

    updateThemeButton(selectedTheme);

    if (shouldSave) {
      saveTheme(selectedTheme);
    }
  };

  const initializeTheme = () => {
    applyTheme(getStoredTheme() || "dark", false);
  };

  const toggleTheme = () => {
    const nextTheme =
      getCurrentTheme() === "light"
        ? "dark"
        : "light";

    applyTheme(nextTheme);
  };

  initializeTheme();

  themeToggle?.addEventListener(
    "click",
    toggleTheme
  );

  /* =========================================
     MOBILE NAVIGATION
  ========================================= */

  const updateMenuIcon = (isOpen) => {
    if (!menuToggle) return;

    const menuIcon = menuToggle.querySelector(
      ".menu-icon"
    );

    const closeIcon = menuToggle.querySelector(
      ".close-icon"
    );

    if (menuIcon) {
      menuIcon.hidden = isOpen;
      menuIcon.setAttribute(
        "aria-hidden",
        String(isOpen)
      );
    }

    if (closeIcon) {
      closeIcon.hidden = !isOpen;
      closeIcon.setAttribute(
        "aria-hidden",
        String(!isOpen)
      );
    }

    menuToggle.classList.toggle(
      "is-open",
      isOpen
    );
  };

  const updateMenuButton = (isOpen) => {
    if (!menuToggle) return;

    const label = isOpen
      ? "Close navigation menu"
      : "Open navigation menu";

    menuToggle.setAttribute("type", "button");
    menuToggle.setAttribute(
      "aria-expanded",
      String(isOpen)
    );
    menuToggle.setAttribute("aria-label", label);
    menuToggle.setAttribute("title", label);

    updateMenuIcon(isOpen);
  };

  const setMenuState = (
    isOpen,
    restoreFocus = false
  ) => {
    if (!menuToggle || !navLinks) return;

    const shouldOpen =
      Boolean(isOpen) && isMobile();

    navLinks.classList.toggle(
      "open",
      shouldOpen
    );

    navLinks.setAttribute(
      "aria-hidden",
      String(!shouldOpen)
    );

    updateMenuButton(shouldOpen);

    if (restoreFocus && !shouldOpen) {
      safeFocus(menuToggle);
    }
  };

  const closeMenu = (restoreFocus = false) => {
    const wasOpen =
      navLinks?.classList.contains("open") ||
      false;

    setMenuState(false, false);

    if (restoreFocus && wasOpen) {
      safeFocus(menuToggle);
    }
  };

  const toggleMenu = () => {
    if (!navLinks) return;

    const isOpen =
      navLinks.classList.contains("open");

    if (isOpen) {
      closeMenu();
    } else {
      setMenuState(true);
    }
  };

  if (menuToggle && navLinks) {
    menuToggle.setAttribute(
      "aria-controls",
      "navLinks"
    );

    setMenuState(false);

    menuToggle.addEventListener(
      "click",
      toggleMenu
    );

    navLinks
      .querySelectorAll("a")
      .forEach((link) => {
        link.addEventListener("click", () => {
          closeMenu();
        });
      });
  }

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        closeMenu(true);
      }
    }
  );

  window.addEventListener(
    "resize",
    () => {
      if (!isMobile()) {
        closeMenu();
      }
    }
  );

  /* =========================================
     SCROLL PROGRESS AND BACK TO TOP
  ========================================= */

  const updateScrollUI = () => {
    const documentHeight =
      document.documentElement.scrollHeight -
      window.innerHeight;

    const currentScroll =
      window.scrollY ||
      window.pageYOffset ||
      0;

    const percentage =
      documentHeight > 0
        ? Math.min(
            100,
            Math.max(
              0,
              (currentScroll / documentHeight) * 100
            )
          )
        : 0;

    if (scrollProgress) {
      scrollProgress.style.width =
        `${percentage}%`;

      scrollProgress.setAttribute(
        "aria-valuenow",
        String(Math.round(percentage))
      );
    }

    if (backToTop) {
      const shouldShow =
        currentScroll > SCROLL_TOP_THRESHOLD;

      backToTop.hidden = !shouldShow;
      backToTop.tabIndex = shouldShow ? 0 : -1;

      backToTop.setAttribute(
        "aria-hidden",
        String(!shouldShow)
      );
    }

    scrollTicking = false;
  };

  const requestScrollUpdate = () => {
    if (scrollTicking) return;

    scrollTicking = true;

    window.requestAnimationFrame(
      updateScrollUI
    );
  };

  window.addEventListener(
    "scroll",
    requestScrollUpdate,
    { passive: true }
  );

  window.addEventListener(
    "resize",
    requestScrollUpdate
  );

  window.addEventListener(
    "load",
    requestScrollUpdate
  );

  updateScrollUI();

  backToTop?.addEventListener(
    "click",
    () => {
      window.scrollTo({
        top: 0,
        behavior: getScrollBehavior(),
      });
    }
  );

  /* =========================================
     SCROLL REVEAL ANIMATION
  ========================================= */

  const revealSelector = [
    ".skill-card",
    ".project-card",
    ".career-grid > div",
    ".career-grid > article",
    ".timeline article",
    ".contact-box",
  ].join(", ");

  const revealItems = [
    ...document.querySelectorAll(revealSelector),
  ];

  const showAllRevealItems = () => {
    revealItems.forEach((item) => {
      item.classList.add(
        "reveal-item",
        "is-visible"
      );

      item.style.removeProperty(
        "--reveal-delay"
      );
    });
  };

  const initializeRevealAnimations = () => {
    if (
      prefersReducedMotion() ||
      !("IntersectionObserver" in window)
    ) {
      showAllRevealItems();
      return;
    }

    const revealObserver =
      new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add(
              "is-visible"
            );

            observer.unobserve(
              entry.target
            );
          });
        },
        {
          threshold: 0.12,
          rootMargin: "0px 0px -40px 0px",
        }
      );

    revealItems.forEach((item, index) => {
      item.classList.add("reveal-item");

      item.style.setProperty(
        "--reveal-delay",
        `${Math.min(index * 45, 240)}ms`
      );

      revealObserver.observe(item);
    });
  };

  initializeRevealAnimations();

  /* =========================================
     SMOOTH ANCHOR NAVIGATION
  ========================================= */

  const scrollToTarget = (target) => {
    if (!target) return;

    const headerOffset = getHeaderHeight();
    const targetTop =
      target.getBoundingClientRect().top +
      window.scrollY -
      headerOffset -
      12;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: getScrollBehavior(),
    });
  };

  document
    .querySelectorAll('a[href^="#"]')
    .forEach((link) => {
      link.addEventListener(
        "click",
        (event) => {
          const targetId =
            link.getAttribute("href");

          if (
            !targetId ||
            targetId === "#" ||
            targetId.length < 2
          ) {
            return;
          }

          let targetElement;

          try {
            targetElement =
              document.querySelector(
                targetId
              );
          } catch {
            return;
          }

          if (!targetElement) return;

          event.preventDefault();

          closeMenu();
          scrollToTarget(targetElement);

          if (window.history?.pushState) {
            window.history.pushState(
              null,
              "",
              targetId
            );
          }
        }
      );
    });

  /* =========================================
     EXTERNAL LINK SECURITY
  ========================================= */

  document
    .querySelectorAll('a[target="_blank"]')
    .forEach((link) => {
      const relValues = new Set(
        (link.getAttribute("rel") || "")
          .split(/\s+/)
          .filter(Boolean)
      );

      relValues.add("noopener");
      relValues.add("noreferrer");

      link.setAttribute(
        "rel",
        [...relValues].join(" ")
      );
    });

  /* =========================================
     ACTIVE NAVIGATION
  ========================================= */

  const sections = [
    ...document.querySelectorAll(
      "main section[id]"
    ),
  ];

  const navigationLinks = [
    ...document.querySelectorAll(
      '.nav-links a[href^="#"]'
    ),
  ];

  const trackedSections = sections.filter(
    (section) =>
      navigationLinks.some(
        (link) =>
          link.getAttribute("href") ===
          `#${section.id}`
      )
  );

  const getSectionTop = (section) =>
    section.getBoundingClientRect().top +
    window.scrollY;

  const setActiveNavigation = (
    sectionId
  ) => {
    if (
      !sectionId ||
      sectionId === activeSectionId
    ) {
      return;
    }

    activeSectionId = sectionId;

    navigationLinks.forEach((link) => {
      const isActive =
        link.getAttribute("href") ===
        `#${sectionId}`;

      link.classList.toggle(
        "active",
        isActive
      );

      if (isActive) {
        link.setAttribute(
          "aria-current",
          "page"
        );
      } else {
        link.removeAttribute(
          "aria-current"
        );
      }
    });
  };

  const updateActiveNavigation = () => {
    if (!trackedSections.length) return;

    const headerOffset = getHeaderHeight();

    const activationLine =
      window.scrollY +
      headerOffset +
      Math.min(
        window.innerHeight * 0.28,
        220
      );

    let currentSection =
      trackedSections[0];

    trackedSections.forEach((section) => {
      if (
        getSectionTop(section) <=
        activationLine
      ) {
        currentSection = section;
      }
    });

    setActiveNavigation(
      currentSection.id
    );
  };

  const requestNavigationUpdate = () => {
    if (navigationTicking) return;

    navigationTicking = true;

    window.requestAnimationFrame(() => {
      updateActiveNavigation();
      navigationTicking = false;
    });
  };

  if (trackedSections.length) {
    window.addEventListener(
      "scroll",
      requestNavigationUpdate,
      { passive: true }
    );

    window.addEventListener(
      "resize",
      requestNavigationUpdate
    );

    window.addEventListener(
      "load",
      requestNavigationUpdate
    );

    updateActiveNavigation();
  }

  /* =========================================
     DYNAMIC MOTION PREFERENCE
  ========================================= */

  const handleMotionPreferenceChange = () => {
    if (prefersReducedMotion()) {
      showAllRevealItems();
    }
  };

  if (
    typeof motionQuery.addEventListener ===
    "function"
  ) {
    motionQuery.addEventListener(
      "change",
      handleMotionPreferenceChange
    );
  } else if (
    typeof motionQuery.addListener ===
    "function"
  ) {
    motionQuery.addListener(
      handleMotionPreferenceChange
    );
  }

  /* =========================================
     INITIAL ACCESSIBILITY STATE
  ========================================= */

  updateThemeButton(getCurrentTheme());

  if (menuToggle && navLinks) {
    setMenuState(false);
  }

  if (backToTop) {
    backToTop.hidden = true;
    backToTop.tabIndex = -1;

    backToTop.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  updateScrollUI();
  updateActiveNavigation();
});