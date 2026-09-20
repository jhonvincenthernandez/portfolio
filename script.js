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
    let timeoutId = null;

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
    yearElement.textContent =
      String(new Date().getFullYear());
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

  const applyTheme = (theme, shouldSave = true) => {
    const selectedTheme =
      theme === "light" ? "light" : "dark";

    html.dataset.theme = selectedTheme;
    body.dataset.activeTheme = selectedTheme;

    updateThemeButton(selectedTheme);

    if (shouldSave) {
      saveTheme(selectedTheme);
    }
  };

  applyTheme(getStoredTheme() || "dark", false);

  themeToggle?.addEventListener("click", () => {
    applyTheme(
      getCurrentTheme() === "light"
        ? "dark"
        : "light"
    );
  });

  /* =========================================
     MOBILE NAVIGATION
  ========================================= */

  const updateMenuButton = (isOpen) => {
    if (!menuToggle) return;

    const label = isOpen
      ? "Close navigation menu"
      : "Open navigation menu";

    menuToggle.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute(
      "aria-expanded",
      String(isOpen)
    );
    menuToggle.setAttribute("aria-label", label);
    menuToggle.setAttribute("title", label);
  };

  const setMenuState = (isOpen) => {
    if (!menuToggle || !navLinks) return;

    const shouldOpen =
      Boolean(isOpen) && isMobile();

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
    const wasOpen =
      navLinks?.classList.contains("open");

    setMenuState(false);

    if (restoreFocus && wasOpen) {
      safeFocus(menuToggle);
    }
  };

  if (menuToggle && navLinks) {
    setMenuState(false);

    menuToggle.addEventListener("click", () => {
      setMenuState(
        !navLinks.classList.contains("open")
      );
    });

    $$("a", navLinks).forEach((link) => {
      link.addEventListener("click", () => {
        closeMenu();
      });
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
      if (!isMobile()) {
        closeMenu();
      }
    },
    { passive: true }
  );

  /* =========================================
     PAGE SCROLL UI
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

    window.requestAnimationFrame(updateScrollUI);
  };

  window.addEventListener(
    "scroll",
    requestScrollUpdate,
    { passive: true }
  );

  window.addEventListener(
    "resize",
    requestScrollUpdate,
    { passive: true }
  );

  window.addEventListener(
    "load",
    requestScrollUpdate
  );

  backToTop?.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: getScrollBehavior(),
    });
  });

  /* =========================================
     PROJECT CAROUSEL
     INFINITE CONTINUOUS MOVEMENT
     SYNCHRONIZED COUNTER, DOTS, OUTLINE
     BUTTON, WHEEL, TOUCH AND DRAG SUPPORT
  ========================================= */

  const initializeProjectCarousel = () => {
    const carousel =
      $('[data-carousel="projects"]');

    if (!carousel) return;

    const viewport =
      $(".project-carousel-viewport", carousel);

    const track =
      $(".project-carousel-track", carousel);

    const previousButton =
      $("#projectCarouselPrevious", carousel);

    const nextButton =
      $("#projectCarouselNext", carousel);

    const currentCounter =
      $("#projectCarouselCurrent", carousel);

    const totalCounter =
      $("#projectCarouselTotal", carousel);

    const dots =
      $$(".project-carousel-dot", carousel);

    const originalCards =
      $$(".project-carousel-item", track);

    if (
      !viewport ||
      !track ||
      originalCards.length <= 1
    ) {
      return;
    }

    const totalProjects = originalCards.length;

    const AUTO_SPEED = 150;
    const RESUME_DELAY = 1000;
    const SNAP_DELAY = 120;

    /* -----------------------------------------
       CREATE CLONES
    ----------------------------------------- */

    const fragment =
      document.createDocumentFragment();

    originalCards.forEach((card) => {
      const clone = card.cloneNode(true);

      clone.dataset.carouselClone = "true";
      clone.setAttribute("aria-hidden", "true");

      fragment.appendChild(clone);
    });

    track.appendChild(fragment);

    const cards =
      $$(".project-carousel-item", track);

    let currentOffset = 0;
    let activeIndex = 0;
    let lastCardIndex = -1;

    let animationFrameId = null;
    let lastTimestamp = 0;

    let isRunning = false;
    let isPaused = false;
    let isPageHidden = document.hidden;
    let isUserInteracting = false;

    let resumeTimer = null;
    let snapTimer = null;

    let pointerId = null;
    let pointerStartX = 0;
    let pointerStartOffset = 0;
    let isDragging = false;
    let hasDragged = false;

    /* -----------------------------------------
       CAROUSEL METRICS
    ----------------------------------------- */

    const getGap = () => {
      const styles =
        window.getComputedStyle(track);

      return (
        parseFloat(styles.columnGap) ||
        parseFloat(styles.gap) ||
        0
      );
    };

    const getStepWidth = () => {
      const firstCard = cards[0];

      if (!firstCard) return 0;

      return (
        firstCard.getBoundingClientRect().width +
        getGap()
      );
    };

    const getLoopWidth = () =>
      getStepWidth() * totalProjects;

    const normalizeOffset = () => {
      const loopWidth = getLoopWidth();

      if (loopWidth <= 0) return;

      while (currentOffset >= loopWidth) {
        currentOffset -= loopWidth;
      }

      while (currentOffset < 0) {
        currentOffset += loopWidth;
      }
    };

    const getNearestCardIndex = () => {
      const stepWidth = getStepWidth();

      if (stepWidth <= 0) return 0;

      const rawIndex = Math.round(
        currentOffset / stepWidth
      );

      return Math.min(
        cards.length - 1,
        Math.max(0, rawIndex)
      );
    };

    const getNearestProjectIndex = () => {
      const cardIndex =
        getNearestCardIndex();

      return cardIndex % totalProjects;
    };

    /* -----------------------------------------
       SINGLE SOURCE OF TRUTH
    ----------------------------------------- */

    const getCurrentCard = () => {
      const cardIndex =
        getNearestCardIndex();

      return cards[cardIndex] || null;
    };

    const updateCounter = () => {
      if (currentCounter) {
        currentCounter.textContent =
          String(activeIndex + 1).padStart(2, "0");
      }

      if (totalCounter) {
        totalCounter.textContent =
          String(totalProjects).padStart(2, "0");
      }
    };

    const updateDots = () => {
      dots.forEach((dot, index) => {
        const isActive =
          index === activeIndex;

        dot.classList.toggle(
          "active",
          isActive
        );

        dot.classList.toggle(
          "is-active",
          isActive
        );

        if (isActive) {
          dot.setAttribute(
            "aria-current",
            "true"
          );
        } else {
          dot.removeAttribute("aria-current");
        }
      });
    };

    const updateActiveClasses = () => {
      const currentCard =
        getCurrentCard();

      cards.forEach((card) => {
        card.classList.toggle(
          "is-active",
          card === currentCard
        );
      });
    };

    const updateAccessibility = () => {
      const currentCard =
        getCurrentCard();

      cards.forEach((card) => {
        const isCurrent =
          card === currentCard;

        const isClone =
          card.dataset.carouselClone === "true";

        /*
          The visible clone can receive focus.
          This prevents the outline and logical
          project state from becoming desynchronized.
        */

        card.setAttribute(
          "aria-hidden",
          String(!isCurrent)
        );

        if ("inert" in card) {
          card.inert = !isCurrent;
        }

        if (!isCurrent || isClone) {
          card.setAttribute("tabindex", "-1");
        } else {
          card.removeAttribute("tabindex");
        }
      });
    };

    const updateUI = (force = false) => {
      const nextIndex =
        getNearestProjectIndex();

      const currentCard =
        getCurrentCard();

      const currentCardIndex =
        getNearestCardIndex();

      const projectChanged =
        nextIndex !== activeIndex;

      const cardChanged =
        currentCardIndex !== lastCardIndex;

      activeIndex = nextIndex;

      if (force || projectChanged) {
        updateCounter();
        updateDots();
      }

      if (force || cardChanged) {
        updateActiveClasses();
        updateAccessibility();
      }

      lastCardIndex = currentCardIndex;
    };

    /* -----------------------------------------
       TRACK RENDERING
    ----------------------------------------- */

    const renderTrack = () => {
      track.style.transition = "none";

      track.style.transform =
        `translate3d(-${currentOffset}px, 0, 0)`;
    };

    const renderAndSync = () => {
      normalizeOffset();
      renderTrack();
      updateUI();
    };

    /* -----------------------------------------
       ANIMATION
    ----------------------------------------- */

    const stopAnimation = () => {
      isRunning = false;
      lastTimestamp = 0;

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(
          animationFrameId
        );

        animationFrameId = null;
      }
    };

    const animationLoop = (timestamp) => {
      if (!isRunning) return;

      if (
        isPaused ||
        isPageHidden ||
        isUserInteracting ||
        prefersReducedMotion()
      ) {
        lastTimestamp = timestamp;

        animationFrameId =
          window.requestAnimationFrame(
            animationLoop
          );

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

      currentOffset +=
        (AUTO_SPEED * elapsed) / 1000;

      renderAndSync();

      animationFrameId =
        window.requestAnimationFrame(
          animationLoop
        );
    };

    const startAnimation = () => {
      if (prefersReducedMotion()) return;
      if (isPageHidden || isRunning) return;

      isRunning = true;
      lastTimestamp = 0;

      animationFrameId =
        window.requestAnimationFrame(
          animationLoop
        );
    };

    const pauseAnimation = () => {
      isPaused = true;
    };

    const resumeAnimation = () => {
      isPaused = false;
    };

    /* -----------------------------------------
       INTERACTION TIMERS
    ----------------------------------------- */

    const clearResumeTimer = () => {
      if (resumeTimer !== null) {
        window.clearTimeout(resumeTimer);
        resumeTimer = null;
      }
    };

    const clearSnapTimer = () => {
      if (snapTimer !== null) {
        window.clearTimeout(snapTimer);
        snapTimer = null;
      }
    };

    const scheduleResume = () => {
      clearResumeTimer();

      resumeTimer = window.setTimeout(() => {
        isUserInteracting = false;
        resumeTimer = null;
      }, RESUME_DELAY);
    };

    const scheduleSnap = () => {
      clearSnapTimer();

      snapTimer = window.setTimeout(() => {
        snapToNearestProject();
        snapTimer = null;
      }, SNAP_DELAY);
    };

    const markUserInteraction = () => {
      isUserInteracting = true;
      scheduleResume();
    };

    /* -----------------------------------------
       SNAP TO CURRENT PROJECT
    ----------------------------------------- */

    const snapToNearestProject = () => {
      const stepWidth = getStepWidth();

      if (stepWidth <= 0) return;

      currentOffset =
        Math.round(currentOffset / stepWidth) *
        stepWidth;

      normalizeOffset();
      renderAndSync();
    };

    /* -----------------------------------------
       BUTTON AND DOT NAVIGATION
    ----------------------------------------- */

    const moveToProject = (targetIndex) => {
      const stepWidth = getStepWidth();

      if (stepWidth <= 0) return;

      const normalizedIndex =
        ((targetIndex % totalProjects) +
          totalProjects) %
        totalProjects;

      const currentProject =
        getNearestProjectIndex();

      let difference =
        normalizedIndex - currentProject;

      if (
        difference >
        totalProjects / 2
      ) {
        difference -= totalProjects;
      }

      if (
        difference <
        -totalProjects / 2
      ) {
        difference += totalProjects;
      }

      currentOffset +=
        difference * stepWidth;

      renderAndSync();
      markUserInteraction();
    };

    previousButton?.addEventListener(
      "click",
      () => {
        moveToProject(
          getNearestProjectIndex() - 1
        );
      }
    );

    nextButton?.addEventListener(
      "click",
      () => {
        moveToProject(
          getNearestProjectIndex() + 1
        );
      }
    );

    dots.forEach((dot, index) => {
      dot.type = "button";

      dot.addEventListener("click", () => {
        moveToProject(index);
      });
    });

    /* -----------------------------------------
       POINTER DRAG / TOUCH SWIPE
    ----------------------------------------- */

    const handlePointerDown = (event) => {
      if (event.pointerType === "mouse" &&
          event.button !== 0) {
        return;
      }

      pointerId = event.pointerId;
      pointerStartX = event.clientX;
      pointerStartOffset = currentOffset;

      isDragging = false;
      hasDragged = false;

      clearSnapTimer();
      markUserInteraction();

      viewport.setPointerCapture?.(
        event.pointerId
      );
    };

    const handlePointerMove = (event) => {
      if (event.pointerId !== pointerId) {
        return;
      }

      const deltaX =
        event.clientX - pointerStartX;

      if (!isDragging && Math.abs(deltaX) < 6) {
        return;
      }

      isDragging = true;
      hasDragged = true;

      event.preventDefault();

      currentOffset =
        pointerStartOffset - deltaX;

      renderAndSync();
      markUserInteraction();
    };

    const finishPointerInteraction = (event) => {
      if (event.pointerId !== pointerId) {
        return;
      }

      if (isDragging) {
        snapToNearestProject();
      }

      viewport.releasePointerCapture?.(
        event.pointerId
      );

      pointerId = null;
      isDragging = false;

      scheduleResume();
    };

    viewport.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    viewport.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: false }
    );

    viewport.addEventListener(
      "pointerup",
      finishPointerInteraction
    );

    viewport.addEventListener(
      "pointercancel",
      finishPointerInteraction
    );

    viewport.addEventListener(
      "lostpointercapture",
      () => {
        pointerId = null;
        isDragging = false;
      }
    );

    viewport.addEventListener(
      "click",
      (event) => {
        if (hasDragged) {
          event.preventDefault();
          event.stopPropagation();
          hasDragged = false;
        }
      },
      true
    );

    /* -----------------------------------------
       WHEEL SCROLL OVERRIDE
    ----------------------------------------- */

    viewport.addEventListener(
      "wheel",
      (event) => {
        const horizontalDelta =
          Math.abs(event.deltaX) >
          Math.abs(event.deltaY)
            ? event.deltaX
            : event.shiftKey
              ? event.deltaY
              : 0;

        if (!horizontalDelta) return;

        event.preventDefault();

        currentOffset += horizontalDelta;

        renderAndSync();
        markUserInteraction();
        scheduleSnap();
      },
      { passive: false }
    );

    /* -----------------------------------------
       HOVER AND FOCUS
    ----------------------------------------- */

    carousel.addEventListener(
      "mouseenter",
      pauseAnimation
    );

    carousel.addEventListener(
      "mouseleave",
      resumeAnimation
    );

    carousel.addEventListener(
      "focusin",
      pauseAnimation
    );

    carousel.addEventListener(
      "focusout",
      (event) => {
        if (
          !carousel.contains(event.relatedTarget)
        ) {
          resumeAnimation();
        }
      }
    );

    /* -----------------------------------------
       PAGE VISIBILITY
    ----------------------------------------- */

    document.addEventListener(
      "visibilitychange",
      () => {
        isPageHidden = document.hidden;

        if (isPageHidden) {
          stopAnimation();
        } else {
          startAnimation();
        }
      }
    );

    /* -----------------------------------------
       RESPONSIVE RESIZE
    ----------------------------------------- */

    const handleResize = debounce(() => {
      const currentProject =
        getNearestProjectIndex();

      const stepWidth = getStepWidth();

      if (stepWidth > 0) {
        currentOffset =
          currentProject * stepWidth;
      }

      renderAndSync();
    }, 150);

    window.addEventListener(
      "resize",
      handleResize,
      { passive: true }
    );

    /* -----------------------------------------
       REDUCED MOTION
    ----------------------------------------- */

    const handleCarouselMotionChange = () => {
      if (prefersReducedMotion()) {
        stopAnimation();
        renderAndSync();
      } else {
        startAnimation();
      }
    };

    if (
      typeof motionQuery.addEventListener ===
      "function"
    ) {
      motionQuery.addEventListener(
        "change",
        handleCarouselMotionChange
      );
    } else if (
      typeof motionQuery.addListener ===
      "function"
    ) {
      motionQuery.addListener(
        handleCarouselMotionChange
      );
    }

    /* -----------------------------------------
       INITIALIZE
    ----------------------------------------- */

    renderTrack();
    updateUI(true);

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
      item.classList.add(
        "reveal-item",
        "is-visible"
      );

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

          entry.target.classList.add(
            "is-visible"
          );

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
          document.querySelector(targetId);
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

    link.setAttribute(
      "rel",
      [...relValues].join(" ")
    );
  });

  /* =========================================
     ACTIVE NAVIGATION
  ========================================= */

  const sections = $$("main section[id]");

  const navigationLinks =
    $$('.nav-links a[href^="#"]');

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

  const setActiveNavigation = (sectionId) => {
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
        link.removeAttribute("aria-current");
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
    window.addEventListener(
      "scroll",
      requestNavigationUpdate,
      { passive: true }
    );

    window.addEventListener(
      "resize",
      requestNavigationUpdate,
      { passive: true }
    );

    window.addEventListener(
      "load",
      requestNavigationUpdate
    );
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
        (roleIndex + 1) % typingRoles.length;

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
     MOTION PREFERENCE
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
      "change",
      handleMotionPreferenceChange
    );
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

    backToTop.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  updateScrollUI();
  updateActiveNavigation();
});