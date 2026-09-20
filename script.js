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
  let typingTimer = null;

  /* =========================================
     UTILITY FUNCTIONS
  ========================================= */

  const isMobile = () =>
    window.innerWidth <= MOBILE_BREAKPOINT;

  const prefersReducedMotion = () =>
    motionQuery.matches;

  const getScrollBehavior = () =>
    prefersReducedMotion() ? "auto" : "smooth";

  const getHeaderHeight = () =>
    header
      ? Math.ceil(header.getBoundingClientRect().height)
      : 0;

  const isValidTheme = (theme) =>
    theme === "light" || theme === "dark";

  const getCurrentTheme = () =>
    html.dataset.theme === "light" ? "light" : "dark";

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
      const storedTheme = localStorage.getItem(
        THEME_KEY
      );

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
      // Storage may be unavailable.
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

    const label = isLight
      ? "Switch to dark theme"
      : "Switch to light theme";

    themeToggle.type = "button";
    themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("title", label);
    themeToggle.setAttribute(
      "aria-pressed",
      String(isLight)
    );

    themeToggle.dataset.theme = theme;
    themeToggle.dataset.nextTheme = isLight
      ? "dark"
      : "light";

    updateThemeIcons(theme);
  };

  const applyTheme = (
    theme,
    shouldSave = true
  ) => {
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

  const toggleTheme = () => {
    const nextTheme =
      getCurrentTheme() === "light"
        ? "dark"
        : "light";

    applyTheme(nextTheme);
  };

  applyTheme(
    getStoredTheme() || "dark",
    false
  );

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

    menuToggle.type = "button";

    menuToggle.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

    menuToggle.setAttribute(
      "aria-label",
      label
    );

    menuToggle.setAttribute(
      "title",
      label
    );

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

    if (isMobile()) {
      navLinks.setAttribute(
        "aria-hidden",
        String(!shouldOpen)
      );
    } else {
      navLinks.removeAttribute("aria-hidden");
    }

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
    if (!navLinks || !isMobile()) return;

    const isOpen =
      navLinks.classList.contains("open");

    setMenuState(!isOpen);
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
        link.addEventListener(
          "click",
          () => closeMenu()
        );
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
              (currentScroll / documentHeight) *
                100
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
      backToTop.tabIndex = shouldShow
        ? 0
        : -1;

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
   PREMIUM CONTINUOUS PROJECT CAROUSEL
  ========================================= */

  const initializeProjectCarousel = () => {
    const carousel = document.querySelector(
      '[data-carousel="projects"]'
    );

    if (!carousel) return;

    const viewport = carousel.querySelector(
      ".project-carousel-viewport"
    );

    const track = carousel.querySelector(
      ".project-carousel-track"
    );

    const originalCards = [
      ...carousel.querySelectorAll(
        ".project-carousel-item"
      ),
    ];

    if (
      !viewport ||
      !track ||
      originalCards.length <= 1
    ) {
      return;
    }

    const SCROLL_SPEED = 35;

    let animationFrameId = null;
    let lastTimestamp = null;
    let offset = 0;
    let isPaused = false;
    let isPageHidden = document.hidden;
    let resizeTimer = null;

    const originalCount = originalCards.length;

    const clonedCards = originalCards.map((card) => {
      const clone = card.cloneNode(true);

      clone.setAttribute("aria-hidden", "true");

      clone
        .querySelectorAll("a, button, input, textarea, select")
        .forEach((element) => {
          element.setAttribute("tabindex", "-1");
        });

      return clone;
    });

    clonedCards.forEach((clone) => {
      track.appendChild(clone);
    });

    const getGap = () => {
      const styles = window.getComputedStyle(track);

      return (
        parseFloat(styles.columnGap) ||
        parseFloat(styles.gap) ||
        0
      );
    };

    const getOriginalTrackWidth = () => {
      const firstCard = originalCards[0];

      if (!firstCard) return 0;

      const cardWidth =
        firstCard.getBoundingClientRect().width;

      return (
        originalCount * cardWidth +
        (originalCount - 1) * getGap() +
        getGap()
      );
    };

    const applyTransform = () => {
      track.style.transform =
        `translate3d(-${offset}px, 0, 0)`;
    };

    const resetOffsetIfNeeded = () => {
      const loopWidth = getOriginalTrackWidth();

      if (loopWidth <= 0) return;

      if (offset >= loopWidth) {
        offset -= loopWidth;
      }
    };

    const animate = (timestamp) => {
      if (lastTimestamp === null) {
        lastTimestamp = timestamp;
      }

      const elapsed = Math.min(
        timestamp - lastTimestamp,
        50
      );

      lastTimestamp = timestamp;

      if (
        !isPaused &&
        !isPageHidden &&
        !prefersReducedMotion()
      ) {
        offset +=
          (SCROLL_SPEED * elapsed) / 1000;

        resetOffsetIfNeeded();
        applyTransform();
      }

      animationFrameId =
        window.requestAnimationFrame(animate);
    };

    const stopAnimation = () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(
          animationFrameId
        );

        animationFrameId = null;
      }

      lastTimestamp = null;
    };

    const startAnimation = () => {
      stopAnimation();

      if (prefersReducedMotion()) {
        offset = 0;
        applyTransform();
        return;
      }

      animationFrameId =
        window.requestAnimationFrame(animate);
    };

    const pauseCarousel = () => {
      isPaused = true;
    };

    const resumeCarousel = () => {
      isPaused = false;
      lastTimestamp = null;
    };

    carousel.addEventListener(
      "mouseenter",
      pauseCarousel
    );

    carousel.addEventListener(
      "mouseleave",
      resumeCarousel
    );

    carousel.addEventListener(
      "focusin",
      pauseCarousel
    );

    carousel.addEventListener(
      "focusout",
      (event) => {
        if (
          !carousel.contains(
            event.relatedTarget
          )
        ) {
          resumeCarousel();
        }
      }
    );

    document.addEventListener(
      "visibilitychange",
      () => {
        isPageHidden = document.hidden;

        if (!isPageHidden) {
          lastTimestamp = null;
        }
      }
    );

    window.addEventListener(
      "resize",
      () => {
        window.clearTimeout(resizeTimer);

        resizeTimer = window.setTimeout(() => {
          resetOffsetIfNeeded();
          applyTransform();
        }, 150);
      }
    );

    const handleMotionChange = () => {
      if (prefersReducedMotion()) {
        offset = 0;
        applyTransform();
      }

      lastTimestamp = null;
    };

    if (
      typeof motionQuery.addEventListener ===
      "function"
    ) {
      motionQuery.addEventListener(
        "change",
        handleMotionChange
      );
    } else if (
      typeof motionQuery.addListener ===
      "function"
    ) {
      motionQuery.addListener(
        handleMotionChange
      );
    }

    track.style.transition = "none";

    applyTransform();
    startAnimation();
  };

  initializeProjectCarousel();

  /* =========================================
     SCROLL REVEAL ANIMATION
  ========================================= */

  const revealSelector = [
    ".skill-card",
    ".project-card:not(.project-carousel-item)",
    ".career-grid > div",
    ".career-grid > article",
    ".timeline article",
    ".contact-box",
  ].join(", ");

  const revealItems = [
    ...document.querySelectorAll(
      revealSelector
    ),
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

    const activationLine =
      window.scrollY +
      getHeaderHeight() +
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
  }

  /* =========================================
     TYPING ANIMATION
  ========================================= */

  const typingText =
    document.querySelector("#typingText");

  const typingCursor =
    document.querySelector(".typing-cursor");

  const typingRoles = [
    "Web Development",
    "Backend Development",
    "Software Development",
    "Database Integration",
  ];

  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const stopTyping = () => {
    if (typingTimer !== null) {
      window.clearTimeout(typingTimer);
    }

    typingTimer = null;
  };

  const typeNext = () => {
    if (
      !typingText ||
      prefersReducedMotion()
    ) {
      return;
    }

    const currentRole =
      typingRoles[roleIndex];

    if (
      !deleting &&
      charIndex === currentRole.length
    ) {
      deleting = true;

      typingTimer = window.setTimeout(
        typeNext,
        1700
      );

      return;
    }

    if (
      deleting &&
      charIndex === 0
    ) {
      deleting = false;

      roleIndex =
        (roleIndex + 1) %
        typingRoles.length;

      typingTimer = window.setTimeout(
        typeNext,
        420
      );

      return;
    }

    charIndex += deleting ? -1 : 1;

    typingText.textContent =
      currentRole.slice(0, charIndex);

    typingTimer = window.setTimeout(
      typeNext,
      deleting ? 42 : 82
    );
  };

  const initializeTyping = () => {
    if (!typingText) return;

    stopTyping();

    if (prefersReducedMotion()) {
      typingText.textContent =
        typingRoles[0];

      if (typingCursor) {
        typingCursor.hidden = true;
      }

      return;
    }

    if (typingCursor) {
      typingCursor.hidden = false;
    }

    roleIndex = 0;
    charIndex = 0;
    deleting = false;

    typingText.textContent = "";

    typingTimer = window.setTimeout(
      typeNext,
      500
    );
  };

  initializeTyping();

  /* =========================================
     DYNAMIC MOTION PREFERENCE
  ========================================= */

  const handleMotionPreferenceChange = () => {
    if (prefersReducedMotion()) {
      stopTyping();
      showAllRevealItems();

      if (typingText) {
        typingText.textContent =
          typingRoles[0];
      }

      if (typingCursor) {
        typingCursor.hidden = true;
      }
    } else {
      initializeRevealAnimations();
      initializeTyping();
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