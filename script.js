"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const html = document.documentElement;
  const body = document.body;

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  const menuToggle = $("#menuToggle");
  const navLinks = $("#navLinks");
  const themeToggle = $("#themeToggle");
  const yearElement = $("#year");
  const scrollProgress = $("#scrollProgress");
  const backToTop = $("#backToTop");
  const header = $(".site-header");

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
  let revealObserver = null;

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

  const safeFocus = (element) => {
    if (!element) return;

    try {
      element.focus({ preventScroll: true });
    } catch {
      element.focus();
    }
  };

  const debounce = (callback, delay = 150) => {
    let timeoutId;

    return (...args) => {
      window.clearTimeout(timeoutId);

      timeoutId = window.setTimeout(() => {
        callback(...args);
      }, delay);
    };
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

  const isValidTheme = (theme) =>
    theme === "light" || theme === "dark";

  const getCurrentTheme = () =>
    html.dataset.theme === "light"
      ? "light"
      : "dark";

  const getStoredTheme = () => {
    try {
      const theme = localStorage.getItem(THEME_KEY);

      return isValidTheme(theme) ? theme : null;
    } catch {
      return null;
    }
  };

  const saveTheme = (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Storage may be unavailable.
    }
  };

  const updateThemeIcons = (theme) => {
    if (!themeToggle) return;

    const isLight = theme === "light";
    const sunIcon = $(".theme-icon-sun", themeToggle);
    const moonIcon = $(".theme-icon-moon", themeToggle);

    if (sunIcon) {
      sunIcon.hidden = !isLight;
      sunIcon.setAttribute("aria-hidden", String(!isLight));
    }

    if (moonIcon) {
      moonIcon.hidden = isLight;
      moonIcon.setAttribute("aria-hidden", String(isLight));
    }
  };

  const updateThemeButton = (theme) => {
    if (!themeToggle) return;

    const isLight = theme === "light";
    const label = isLight
      ? "Switch to dark theme"
      : "Switch to light theme";

    themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("title", label);
    themeToggle.setAttribute("aria-pressed", String(isLight));
    themeToggle.dataset.theme = theme;
    themeToggle.dataset.nextTheme = isLight ? "dark" : "light";

    updateThemeIcons(theme);
  };

  const applyTheme = (theme, shouldSave = true) => {
    const selectedTheme = theme === "light" ? "light" : "dark";

    html.dataset.theme = selectedTheme;
    body.dataset.activeTheme = selectedTheme;

    updateThemeButton(selectedTheme);

    if (shouldSave) {
      saveTheme(selectedTheme);
    }
  };

  const toggleTheme = () => {
    applyTheme(
      getCurrentTheme() === "light" ? "dark" : "light"
    );
  };

  applyTheme(getStoredTheme() || "dark", false);
  themeToggle?.addEventListener("click", toggleTheme);

  /* =========================================
     MOBILE NAVIGATION
  ========================================= */

  const updateMenuButton = (isOpen) => {
    if (!menuToggle) return;

    const label = isOpen
      ? "Close navigation menu"
      : "Open navigation menu";

    menuToggle.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", label);
    menuToggle.setAttribute("title", label);
  };

  const setMenuState = (isOpen) => {
    if (!menuToggle || !navLinks) return;

    const shouldOpen = Boolean(isOpen) && isMobile();

    navLinks.classList.toggle("open", shouldOpen);

    if (isMobile()) {
      navLinks.setAttribute(
        "aria-hidden",
        String(!shouldOpen)
      );
    } else {
      navLinks.removeAttribute("aria-hidden");
    }

    updateMenuButton(shouldOpen);
  };

  const closeMenu = (restoreFocus = false) => {
    const wasOpen = navLinks?.classList.contains("open");

    setMenuState(false);

    if (restoreFocus && wasOpen) {
      safeFocus(menuToggle);
    }
  };

  if (menuToggle && navLinks) {
    setMenuState(false);

    menuToggle.addEventListener("click", () => {
      setMenuState(!navLinks.classList.contains("open"));
    });

    $$("a", navLinks).forEach((link) => {
      link.addEventListener("click", () => closeMenu());
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu(true);
    }
  });

  window.addEventListener(
    "resize",
    () => {
      if (!isMobile()) closeMenu();
    },
    { passive: true }
  );

  /* =========================================
     SCROLL PROGRESS AND BACK TO TOP
  ========================================= */

  const updateScrollUI = () => {
    const documentHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    const currentScroll = window.scrollY || window.pageYOffset || 0;

    const percentage =
      documentHeight > 0
        ? Math.min(
            100,
            Math.max(0, (currentScroll / documentHeight) * 100)
          )
        : 0;

    if (scrollProgress) {
      scrollProgress.style.width = `${percentage}%`;
      scrollProgress.setAttribute(
        "aria-valuenow",
        String(Math.round(percentage))
      );
    }

    if (backToTop) {
      const shouldShow = currentScroll > SCROLL_TOP_THRESHOLD;

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
    window.requestAnimationFrame(updateScrollUI);
  };

  window.addEventListener("scroll", requestScrollUpdate, {
    passive: true,
  });

  window.addEventListener("resize", requestScrollUpdate, {
    passive: true,
  });

  window.addEventListener("load", requestScrollUpdate);

  backToTop?.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: getScrollBehavior(),
    });
  });

  /* =========================================
     PROJECT CAROUSEL
     SYNCHRONIZED COUNTER + ACTIVE OUTLINE
  ========================================= */

  const initializeProjectCarousel = () => {
    const carousel = $('[data-carousel="projects"]');

    if (!carousel) return;

    const viewport = $(".project-carousel-viewport", carousel);
    const track = $(".project-carousel-track", carousel);

    const previousButton = $("#projectCarouselPrevious", carousel);
    const nextButton = $("#projectCarouselNext", carousel);

    const currentCounter = $("#projectCarouselCurrent", carousel);
    const totalCounter = $("#projectCarouselTotal", carousel);

    const dots = $$(".project-carousel-dot", carousel);
    const originalCards = $$(".project-carousel-item", track);

    if (!viewport || !track || originalCards.length <= 1) {
      return;
    }

    const totalProjects = originalCards.length;
    const AUTO_SPEED = 150;
    const BUTTON_RESUME_DELAY = 850;

    const fragment = document.createDocumentFragment();

    originalCards.forEach((card) => {
      const clone = card.cloneNode(true);

      clone.dataset.carouselClone = "true";
      clone.setAttribute("aria-hidden", "true");

      fragment.appendChild(clone);
    });

    track.appendChild(fragment);

    const cards = $$(".project-carousel-item", track);

    let currentOffset = 0;
    let activeIndex = 0;
    let animationFrameId = null;
    let lastTimestamp = 0;
    let isRunning = false;
    let isPaused = false;
    let isPageHidden = document.hidden;
    let isButtonOverride = false;
    let resumeTimer = null;

    const getGap = () => {
      const styles = window.getComputedStyle(track);

      return (
        parseFloat(styles.columnGap) ||
        parseFloat(styles.gap) ||
        0
      );
    };

    const getStepWidth = () => {
      const firstCard = cards[0];

      if (!firstCard) return 0;

      return firstCard.getBoundingClientRect().width + getGap();
    };

    const getOriginalTrackWidth = () =>
      getStepWidth() * totalProjects;

    const normalizeOffset = () => {
      const width = getOriginalTrackWidth();

      if (width <= 0) return;

      currentOffset =
        ((currentOffset % width) + width) % width;
    };

    const getNearestProjectIndex = () => {
      const stepWidth = getStepWidth();

      if (stepWidth <= 0) return 0;

      const rawIndex = Math.round(currentOffset / stepWidth);

      return (
        ((rawIndex % totalProjects) + totalProjects) %
        totalProjects
      );
    };

    const updateCounter = () => {
      if (currentCounter) {
        currentCounter.textContent = String(
          activeIndex + 1
        ).padStart(2, "0");
      }

      if (totalCounter) {
        totalCounter.textContent = String(
          totalProjects
        ).padStart(2, "0");
      }
    };

    const updateDots = () => {
      dots.forEach((dot, index) => {
        const isActive = index === activeIndex;

        dot.classList.toggle("active", isActive);
        dot.classList.toggle("is-active", isActive);

        if (isActive) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });
    };

    /*
      Important fix:
      The active outline is synchronized with the
      current project index. Both original cards
      and cloned cards are updated.
    */

    const updateActiveClasses = () => {
      cards.forEach((card, index) => {
        const originalIndex = index % totalProjects;
        const isClone = card.dataset.carouselClone === "true";

        const isActive =
          originalIndex === activeIndex && !isClone;

        card.classList.toggle("is-active", isActive);
      });
    };

    const updateAccessibility = () => {
      cards.forEach((card, index) => {
        const originalIndex = index % totalProjects;
        const isOriginal = !card.dataset.carouselClone;

        const isActive =
          originalIndex === activeIndex && isOriginal;

        card.setAttribute("aria-hidden", String(!isActive));

        if (isActive) {
          card.removeAttribute("tabindex");
        } else {
          card.setAttribute("tabindex", "-1");
        }
      });
    };

    const updateActiveProject = () => {
      const nextIndex = getNearestProjectIndex();

      if (nextIndex === activeIndex) return;

      activeIndex = nextIndex;

      updateCounter();
      updateDots();
      updateActiveClasses();
      updateAccessibility();
    };

    const updateUI = () => {
      activeIndex = getNearestProjectIndex();

      updateCounter();
      updateDots();
      updateActiveClasses();
      updateAccessibility();
    };

    const renderTrack = () => {
      track.style.transition = "none";
      track.style.transform =
        `translate3d(-${currentOffset}px, 0, 0)`;
    };

    const stopAnimation = () => {
      isRunning = false;

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      lastTimestamp = 0;
    };

    const animationLoop = (timestamp) => {
      if (
        !isRunning ||
        isPaused ||
        isPageHidden ||
        isButtonOverride ||
        prefersReducedMotion()
      ) {
        lastTimestamp = timestamp;

        if (isRunning) {
          animationFrameId =
            window.requestAnimationFrame(animationLoop);
        }

        return;
      }

      if (!lastTimestamp) {
        lastTimestamp = timestamp;
      }

      const elapsed = Math.min(
        timestamp - lastTimestamp,
        50
      );

      lastTimestamp = timestamp;
      currentOffset += (AUTO_SPEED * elapsed) / 1000;

      normalizeOffset();
      renderTrack();
      updateActiveProject();

      animationFrameId =
        window.requestAnimationFrame(animationLoop);
    };

    const startAnimation = () => {
      if (prefersReducedMotion() || isPageHidden) return;
      if (isRunning) return;

      isRunning = true;
      lastTimestamp = 0;

      animationFrameId =
        window.requestAnimationFrame(animationLoop);
    };

    const pauseAnimation = () => {
      isPaused = true;
    };

    const resumeAnimation = () => {
      isPaused = false;
    };

    const clearResumeTimer = () => {
      if (resumeTimer !== null) {
        window.clearTimeout(resumeTimer);
        resumeTimer = null;
      }
    };

    const scheduleResume = () => {
      clearResumeTimer();

      isButtonOverride = true;

      resumeTimer = window.setTimeout(() => {
        isButtonOverride = false;
        resumeTimer = null;
      }, BUTTON_RESUME_DELAY);
    };

    const moveToProject = (targetIndex) => {
      const stepWidth = getStepWidth();

      if (stepWidth <= 0) return;

      const normalizedIndex =
        ((targetIndex % totalProjects) + totalProjects) %
        totalProjects;

      const currentProject = getNearestProjectIndex();

      let difference = normalizedIndex - currentProject;

      if (difference > totalProjects / 2) {
        difference -= totalProjects;
      }

      if (difference < -totalProjects / 2) {
        difference += totalProjects;
      }

      currentOffset += difference * stepWidth;

      normalizeOffset();
      renderTrack();

      activeIndex = normalizedIndex;

      updateUI();
      scheduleResume();
    };

    previousButton?.addEventListener("click", () => {
      moveToProject(getNearestProjectIndex() - 1);
    });

    nextButton?.addEventListener("click", () => {
      moveToProject(getNearestProjectIndex() + 1);
    });

    dots.forEach((dot, index) => {
      dot.type = "button";

      dot.addEventListener("click", () => {
        moveToProject(index);
      });
    });

    carousel.addEventListener("mouseenter", pauseAnimation);
    carousel.addEventListener("mouseleave", resumeAnimation);
    carousel.addEventListener("focusin", pauseAnimation);

    carousel.addEventListener("focusout", (event) => {
      if (!carousel.contains(event.relatedTarget)) {
        resumeAnimation();
      }
    });

    document.addEventListener("visibilitychange", () => {
      isPageHidden = document.hidden;

      if (isPageHidden) {
        stopAnimation();
      } else {
        startAnimation();
      }
    });

    const handleResize = debounce(() => {
      normalizeOffset();
      renderTrack();
      updateUI();
    }, 150);

    window.addEventListener("resize", handleResize, {
      passive: true,
    });

    const handleMotionChange = () => {
      if (prefersReducedMotion()) {
        stopAnimation();
        renderTrack();
      } else {
        startAnimation();
      }
    };

    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", handleMotionChange);
    } else if (typeof motionQuery.addListener === "function") {
      motionQuery.addListener("change", handleMotionChange);
    }

    updateUI();
    renderTrack();

    if (!prefersReducedMotion()) {
      startAnimation();
    }
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

  const revealItems = $$(revealSelector);

  const showAllRevealItems = () => {
    revealItems.forEach((item) => {
      item.classList.add("reveal-item", "is-visible");
      item.style.removeProperty("--reveal-delay");
    });
  };

  const initializeRevealAnimations = () => {
    if (!revealItems.length) return;

    if (
      prefersReducedMotion() ||
      !("IntersectionObserver" in window)
    ) {
      showAllRevealItems();
      return;
    }

    revealObserver?.disconnect();

    revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    revealItems.forEach((item, index) => {
      item.classList.add("reveal-item");
      item.classList.remove("is-visible");

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

    const targetTop =
      target.getBoundingClientRect().top +
      window.scrollY -
      getHeaderHeight() -
      12;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: getScrollBehavior(),
    });
  };

  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#" || targetId.length < 2) {
        return;
      }

      let targetElement;

      try {
        targetElement = document.querySelector(targetId);
      } catch {
        return;
      }

      if (!targetElement) return;

      event.preventDefault();

      closeMenu();
      scrollToTarget(targetElement);

      if (window.history?.pushState) {
        window.history.pushState(null, "", targetId);
      }
    });
  });

  /* =========================================
     EXTERNAL LINK SECURITY
  ========================================= */

  $$('a[target="_blank"]').forEach((link) => {
    const relValues = new Set(
      (link.getAttribute("rel") || "")
        .split(/\s+/)
        .filter(Boolean)
    );

    relValues.add("noopener");
    relValues.add("noreferrer");

    link.setAttribute("rel", [...relValues].join(" "));
  });

  /* =========================================
     ACTIVE NAVIGATION
  ========================================= */

  const sections = $$("main section[id]");
  const navigationLinks = $$('.nav-links a[href^="#"]');

  const trackedSections = sections.filter((section) =>
    navigationLinks.some(
      (link) =>
        link.getAttribute("href") === `#${section.id}`
    )
  );

  const getSectionTop = (section) =>
    section.getBoundingClientRect().top + window.scrollY;

  const setActiveNavigation = (sectionId) => {
    if (!sectionId || sectionId === activeSectionId) return;

    activeSectionId = sectionId;

    navigationLinks.forEach((link) => {
      const isActive =
        link.getAttribute("href") === `#${sectionId}`;

      link.classList.toggle("active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const updateActiveNavigation = () => {
    if (!trackedSections.length) return;

    const activationLine =
      window.scrollY +
      getHeaderHeight() +
      Math.min(window.innerHeight * 0.28, 220);

    let currentSection = trackedSections[0];

    trackedSections.forEach((section) => {
      if (getSectionTop(section) <= activationLine) {
        currentSection = section;
      }
    });

    setActiveNavigation(currentSection.id);
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
    window.addEventListener("scroll", requestNavigationUpdate, {
      passive: true,
    });

    window.addEventListener("resize", requestNavigationUpdate, {
      passive: true,
    });

    window.addEventListener("load", requestNavigationUpdate);
  }

  /* =========================================
     TYPING ANIMATION
  ========================================= */

  const typingText = $("#typingText");
  const typingCursor = $(".typing-cursor");

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
    if (!typingText || prefersReducedMotion()) return;

    const currentRole = typingRoles[roleIndex];

    if (!deleting && charIndex === currentRole.length) {
      deleting = true;

      typingTimer = window.setTimeout(typeNext, 1700);
      return;
    }

    if (deleting && charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % typingRoles.length;

      typingTimer = window.setTimeout(typeNext, 420);
      return;
    }

    charIndex += deleting ? -1 : 1;
    typingText.textContent = currentRole.slice(0, charIndex);

    typingTimer = window.setTimeout(
      typeNext,
      deleting ? 42 : 82
    );
  };

  const initializeTyping = () => {
    if (!typingText) return;

    stopTyping();

    if (prefersReducedMotion()) {
      typingText.textContent = typingRoles[0];

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

    typingTimer = window.setTimeout(typeNext, 500);
  };

  initializeTyping();

  /* =========================================
     MOTION PREFERENCE
  ========================================= */

  const handleMotionPreferenceChange = () => {
    if (prefersReducedMotion()) {
      stopTyping();
      showAllRevealItems();

      if (typingText) {
        typingText.textContent = typingRoles[0];
      }

      if (typingCursor) {
        typingCursor.hidden = true;
      }
    } else {
      initializeRevealAnimations();
      initializeTyping();
    }
  };

  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener(
      "change",
      handleMotionPreferenceChange
    );
  } else if (typeof motionQuery.addListener === "function") {
    motionQuery.addListener(handleMotionPreferenceChange);
  }

  /* =========================================
     INITIAL STATE
  ========================================= */

  updateThemeButton(getCurrentTheme());

  if (menuToggle && navLinks) {
    setMenuState(false);
  }

  if (backToTop) {
    backToTop.hidden = true;
    backToTop.tabIndex = -1;
    backToTop.setAttribute("aria-hidden", "true");
  }

  updateScrollUI();
  updateActiveNavigation();
});