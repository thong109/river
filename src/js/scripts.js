"use strict";

(() => {
  let __scrollY = 0;
  let __normalScrollY = 0;
  const isDesktop = () => window.innerWidth >= 1024.98;
  const tabletBreak = 1280;
  const mobileBreak = 767.98;
  const mobileXSBreak = 414;
  const Mask = document.querySelector('.mask'),
    WindBody = document.body,
    HTML = document.documentElement;
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  window.addEventListener('beforeunload', () => {
    window.scrollTo(0, 0);
  });

  const delay = (time, callback) => setTimeout(callback, time);

  window.__APP_STATE__ = {
    observer: null,
  };

  const detectDevice = () => {
    const html = document.documentElement;

    const init = () => {
      const viewport = document.querySelector('meta[name="viewport"]');
      const userAgent = navigator.userAgent.toLowerCase();
      const orientation = window.matchMedia("(orientation: portrait)").matches;

      html.classList.toggle("is-device-mac", userAgent.includes("mac"));
      html.classList.toggle("is-device-macos", userAgent.includes("mac"));
      html.classList.toggle("is-device-iphone", /iphone/.test(userAgent));
      html.classList.toggle("is-device-ipod", /ipod/.test(userAgent));
      html.classList.toggle("is-device-ipad", /ipad/.test(userAgent));
      html.classList.toggle(
        "is-device-ios",
        /(iphone|ipod|ipad)/.test(userAgent),
      );
      html.classList.toggle("is-device-android", userAgent.includes("android"));

      if (navigator.maxTouchPoints === 1 && !userAgent.includes("mobile")) {
        html.classList.add("is-device-emulation");
      } else {
        html.classList.remove("is-device-emulation");
      }

      if (
        (html.classList.contains("is-device-mac") ||
          html.classList.contains("is-device-ios") ||
          html.classList.contains("is-device-android")) &&
        navigator.maxTouchPoints >= 1
      ) {
        html.classList.add("is-device-touchable");
      } else {
        html.classList.remove("is-device-touchable");
      }

      if (window.innerWidth < mobileBreak) {
        if (window.screen.width < mobileXSBreak) {
          viewport?.setAttribute(
            "content",
            `width=${mobileXSBreak}, user-scalable=0`,
          );
        } else {
          viewport?.setAttribute(
            "content",
            "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
          );
        }
        html.classList.add("is-device-mobile");
        html.classList.remove("is-device-desktop", "is-device-tablet");
      } else {
        html.classList.add("is-device-desktop");
        html.classList.remove("is-device-mobile");

        if (
          (window.screen.width >= mobileBreak &&
            window.screen.width <= tabletBreak) ||
          (window.screen.width < mobileBreak &&
            window.screen.height >= mobileBreak &&
            !orientation)
        ) {
          html.classList.add("is-device-tablet");
        } else {
          html.classList.remove("is-device-tablet");
        }

        viewport?.setAttribute(
          "content",
          "width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=0",
        );
      }
    };

    window.addEventListener("load", init);
    window.addEventListener("resize", init);
    init();
  };

  const app = () => {
    if (window.innerWidth < 1024.98) return;
    const isTablet = () => window.innerWidth < 1024.98;
    gsap.registerPlugin(Observer);

    const panels = Array.from(document.querySelectorAll(".panel"));
    const outers = panels.map((p) => p.querySelector(".group-central"));
    const inners = panels.map((p) => p.querySelector(".inner"));
    const images = panels.map((p) => p.querySelector(".group-bg"));
    const headings = panels.map((p) =>
      Array.from(p.querySelectorAll(".hero-title")).filter(
        (el) => !el.classList.contains("js-title-fade"),
      ),
    );
    const subs = panels.map((p) => Array.from(p.querySelectorAll(".hero-sub")).filter(Boolean));
    const stage = document.querySelector(".slider-stage");
    const navEl = document.getElementById("nav");
    const navItems = navEl.querySelectorAll(".nav-item");
    const headerLogo = document.getElementById("logo-primary");

    if (
      !headerLogo ||
      !navEl ||
      !stage ||
      !navItems.length ||
      !panels ||
      !outers ||
      !inners ||
      !images ||
      !headings ||
      !subs
    )
      return;

    const s = {
      cur: -1,
      lastPanel: 0,
      animating: false,
      active: true,
      switching: false,
      hidden: false,
      wheelLock: false,
      navLock: false,
      touchY: 0,
    };

    window.__APP_STATE__.sliderState = s;

    const updateLogo = (i) => {
      if (!headerLogo) return;
      const visible = isTablet() || i === 0;
      headerLogo.classList.toggle("is-visible", visible);
    };

    const SLIDER_COUNT = panels.length;

    const updateNav = (i) =>
      navItems.forEach((n, j) =>
        n.classList.toggle("active", j === i && j < SLIDER_COUNT),
      );

    const updateNavByTarget = (targetId) =>
      navItems.forEach((n) =>
        n.classList.toggle("active", n.dataset.target === targetId),
      );

    const showUI = () => {
      if (isTablet()) return;
      gsap.set(stage, {
        autoAlpha: 1,
        pointerEvents: "auto",
      });
    };

    const getOffset = (el, container) => {
      let top = 0;
      let current = el;
      while (current && current !== container) {
        top += current.offsetTop;
        current = current.offsetParent;
      }
      return top;
    };

    /* ---------------- NAV ---------------- */
    navItems.forEach((item, idx) => {
      item.addEventListener("click", () => {
        if (s.navLock) return;

        if (isTablet()) {
          const target = document.getElementById(item.dataset.target);
          if (!target) return;
          target.scrollIntoView({
            behavior: "smooth",
          });
          return;
        }

        if (idx < SLIDER_COUNT) {
          if (!s.active) {
            s.navLock = true;
            relock(idx, () => (s.navLock = false));
          } else {
            if (s.animating) return;
            goto(idx, idx > s.cur ? 1 : -1);
          }
        } else {
          const target = document.getElementById(item.dataset.target);
          if (!target) return;

          s.navLock = true;
          updateNavByTarget(item.dataset.target);

          const normalScroll = document.querySelector(".normal-scroll");

          release(() => {
            if (normalScroll) {
              const y = getOffset(target, normalScroll);

              window.scrollTo({
                top: y,
                behavior: "smooth",
              });
            } else {
              target.scrollIntoView({
                behavior: "smooth",
              });
            }

            setTimeout(() => (s.navLock = false), 1000);
          });
        }
      });
    });

    const mobileLinks = document.querySelectorAll(
      ".navigation-menu .item-link",
    );

    mobileLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();

        const hash = (link.getAttribute("href") || "").split("#")[1];
        const panelIndex = panels.findIndex((panel) => panel.id === hash);
        const navItem = Array.from(navItems).find(
          (item) => item.dataset.target === hash,
        );
        if (!navItem && panelIndex < 0) return;

        window.dispatchEvent(new CustomEvent("header:close-menu"));

        setTimeout(() => {
          if (s.active) {
            observer?.enable();
          }

          if (panelIndex >= 0 && !s.active) {
            s.navLock = true;
            relock(panelIndex, () => (s.navLock = false));
          } else if (panelIndex >= 0 && !s.animating) {
            goto(panelIndex, panelIndex > s.cur ? 1 : -1);
          } else if (navItem) {
            navItem.click();
          }
        }, 550);
      });
    });

    /* ---------------- GOTO ---------------- */
    const goto = (i, dir, cb) => {
      if (isTablet()) return;

      if (i >= panels.length) {
        s.animating = false;
        cb?.();
        return;
      }

      i = Math.max(i, 0);
      const d = dir === -1 ? -1 : 1;
      const same = i === s.cur;

      showUI();
      updateLogo(i);

      if (same) {
        gsap.set(panels[i], {
          autoAlpha: 1,
          zIndex: 1,
        });

        const sameTargets = [outers[i], inners[i], images[i]].filter(Boolean);
        if (sameTargets.length)
          gsap.set(sameTargets, {
            clearProps: "transform",
          });

        if (headings[i]?.length)
          headings[i].forEach((h) =>
            gsap.set(h, {
              autoAlpha: 1,
              yPercent: 0
            }),
          );
        if (subs[i]?.length)
          subs[i].forEach((sub) =>
            gsap.set(sub, {
              autoAlpha: 1,
              yPercent: 0
            }),
          );

        panels.forEach((p, idx) => p.classList.toggle("is-active", idx === i));
        s.animating = false;
        cb?.();
        return;
      }

      s.animating = true;
      const prev = s.cur;

      const tl = gsap.timeline({
        defaults: {
          duration: 1.05,
          ease: "power1.inOut",
        },
        onStart: () => {
          gsap.set(panels[i], {
            autoAlpha: 1,
            zIndex: 1,
          });
          panels[i].classList.add("is-active");

          if (prev >= 0 && prev !== i) {
            setTimeout(() => {
              panels[prev].classList.remove("is-active");
            }, 500);
          }
        },
        onComplete: () => {
          s.animating = false;
          panels.forEach((p, idx) => {
            if (idx !== i)
              gsap.set(p, {
                autoAlpha: 0,
                zIndex: 0,
              });
          });
          panels[i].querySelectorAll(".swiper").forEach((el) => {
            if (el.swiper) el.swiper.update();
          });
          cb?.();
        },
      });

      if (prev >= 0) {
        gsap.set(panels[s.cur], {
          zIndex: 0,
        });

        if (images[s.cur]) {
          tl.to(
            images[s.cur], {
              yPercent: -14 * d,
            },
            0,
          );
        }
      }

      const curTargets = [outers[i], inners[i]].filter(Boolean);
      if (curTargets.length) {
        tl.fromTo(
          curTargets, {
            yPercent: (j) => (j ? -100 * d : 100 * d),
            immediateRender: false,
          }, {
            yPercent: 0,
          },
          0,
        );
      }

      if (images[i]) {
        tl.fromTo(
          images[i], {
            yPercent: 14 * d,
          }, {
            yPercent: 0,
          },
          0,
        );
      }

      if (headings[i]?.length) {
        headings[i].forEach((h, j) => {
          tl.fromTo(
            h, {
              autoAlpha: 0,
              yPercent: 200 * d,
            }, {
              autoAlpha: 1,
              yPercent: 0,
              duration: 0.9,
              ease: "power2.out",
            },
            0.18,
          );
        });
      }

      if (subs[i]?.length) {
        subs[i].forEach((sub, j) => {
          tl.fromTo(
            sub, {
              autoAlpha: 0,
              yPercent: 200 * d,
            }, {
              autoAlpha: 1,
              yPercent: 0,
              duration: 0.8,
              ease: "power2.out",
            },
            0.28,
          );
        });
      }

      s.cur = i;

      /* Update dark bg for panel with .js-bg */
      const currentPanel = panels[i];
      if (currentPanel) {
        const isBg = currentPanel.classList.contains("js-bg");
        const isLocation = currentPanel.id === "section-location";
        document.documentElement.classList.toggle("is-dark-bg", isBg && !isLocation);
        document.documentElement.classList.toggle("is-dark-bg-02", isBg && isLocation);
      }
    };

    /* ---------------- RELEASE ---------------- */
    const release = (onDone) => {
      if (!s.active) {
        onDone?.();
        return;
      }

      s.lastPanel = s.cur;
      s.active = false;
      observer?.disable();
      document.documentElement.classList.remove("is-dark-bg", "is-dark-bg-02");
      const normalScroll = document.querySelector(".normal-scroll");

      gsap.to(stage, {
        autoAlpha: 0,
        duration: 0.6,
        ease: "power1.inOut",
        onComplete: () => {
          document.body.style.overflow = "";
          gsap.set(stage, {
            pointerEvents: "none",
            zIndex: -1,
          });

          window.scrollTo(0, 0);
          window.dispatchEvent(new Event("slider:released"));

          gsap.to(normalScroll, {
            autoAlpha: 1,
            duration: 0.5,
            onComplete: () => {
              onDone?.();
            },
          });
        },
      });
    };

    /* ---------------- RELOCK ---------------- */
    const relock = (targetPanel, onDone) => {
      if (isTablet()) return;
      if (s.active || s.switching) return;

      s.switching = true;
      const normalScroll = document.querySelector(".normal-scroll");

      const savedScrollTop = normalScroll ? normalScroll.scrollTop : 0;

      gsap.to(normalScroll, {
        autoAlpha: 0,
        duration: 0.6,
        onComplete: () => {
          document.body.style.overflow = "hidden";

          gsap.set(stage, {
            zIndex: "",
            pointerEvents: "auto",
            autoAlpha: 1,
          });

          const target = targetPanel ?? 0;

          panels.forEach((p, idx) => {
            gsap.set(p, {
              autoAlpha: idx === target ? 1 : 0,
              zIndex: idx === target ? 1 : 0,
            });
          });

          s.cur = target;
          s.active = true;
          s.switching = false;
          s.animating = false;
          panels.forEach((p, idx) =>
            p.classList.toggle("is-active", idx === target),
          );
          updateLogo(target);
          observer?.enable();
          onDone?.();

          setTimeout(() => {
            window.dispatchEvent(new Event("scroll"));
          }, 50);
        },
      });
    };

    /* ---------------- OBSERVER (DESKTOP ONLY) ---------------- */
    let observer = null;

    const initObserver = () => {
      if (isTablet()) return;

      observer = Observer.create({
        type: "wheel,touch",
        wheelSpeed: -1,
        tolerance: 14,
        preventDefault: true,

        onDown: (self) => {
          if (!s.animating && s.active && !s.switching) {
            goto(s.cur - 1, -1);
          }
        },

        onUp: (self) => {
          if (!s.animating && s.active && !s.switching) {
            goto(s.cur + 1, 1);
          }
        },
      });

      window.__APP_STATE__.observer = observer;
    };


    /* ---------------- START ---------------- */
    if (!isTablet()) {
      const hash = window.location.hash?.replace("#", "");

      goto(0, 1, () => {
        if (!hash) return;

        history.replaceState(null, "", window.location.pathname);

        const matchedPanelIndex = panels.findIndex((panel) => panel.id === hash);
        const matchedNavItem = Array.from(navItems).find(
          (item) => item.dataset.target === hash,
        );

        setTimeout(() => {
          if (matchedPanelIndex >= 0) {
            goto(matchedPanelIndex, matchedPanelIndex > s.cur ? 1 : -1);
          } else if (matchedNavItem) {
            matchedNavItem.click();
          } else {
            const target = document.getElementById(hash);
            if (!target) return;
            if (s.active) {
              release(() =>
                target.scrollIntoView({
                  behavior: "smooth",
                }),
              );
            } else {
              target.scrollIntoView({
                behavior: "smooth",
              });
            }
          }
        }, 100);
      });

      initObserver();
    } else {
      gsap.set(stage, {
        clearProps: "all",
      });
      panels.forEach((p) =>
        gsap.set(p, {
          clearProps: "all",
        }),
      );
    }

    const sectionIds = Array.from(navItems)
      .map((n) => n.dataset.target)
      .filter(Boolean);

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (sections.length) {
      const scrollSections = sections.filter(
        (sec) => !sec.classList.contains("panel"),
      );
      const bgSections = scrollSections.filter((sec) =>
        sec.classList.contains("js-bg"),
      );

      const updateDarkBg = () => {
        if (window.__APP_STATE__?.sliderState?.active) {
          return;
        }
        const anyVisible = bgSections.some((sec) => {
          const rect = sec.getBoundingClientRect();
          return rect.top < window.innerHeight && rect.bottom > 0;
        });
        document.documentElement.classList.toggle("is-dark-bg", anyVisible);
      };

      const updateNavOnScroll = () => {
        if (window.__APP_STATE__?.sliderState?.active) return;
        if (s.navLock) return;

        let best = null;
        let bestDist = Infinity;
        scrollSections.forEach((sec) => {
          const rect = sec.getBoundingClientRect();
          if (rect.bottom > 0) {
            const dist = Math.abs(rect.top);
            if (dist < bestDist) {
              bestDist = dist;
              best = sec;
            }
          }
        });
        if (best) updateNavByTarget(best.id);
      };

      window.addEventListener("scroll", updateDarkBg, {
        passive: true,
      });
      window.addEventListener("scroll", updateNavOnScroll, {
        passive: true,
      });

      const origRelease = release;
      window.addEventListener("slider:released", () => {
        setTimeout(() => {
          updateDarkBg();
          updateNavOnScroll();
        }, 650);
      });
    }
  };

  const slideKeyvisual = () => {
    const sliders = document.querySelectorAll('.js-slider-keyvisual');
    if (!sliders.length) return;

    updateParallax(sliders);

    sliders.forEach((element) => {
      const swiper = new Swiper(element, {
        loop: true,
        parallax: true,
        speed: 2000,
        autoplay: {
          delay: 3000,
          disableOnInteraction: false
        },
        pagination: {
          el: element.querySelector('.swiper-pagination'),
          clickable: true
        },
        grabCursor: true
      });

      kvSliders.push(swiper);
    });

    window.addEventListener('resize', () => updateParallax(sliders));
  }

  let kvSliders = [];
  const updateParallax = (sliders) => {
    const isPC = window.matchMedia('(min-width: 768px)').matches;
    const parallaxValue = isPC ? 365 : 300;

    sliders.forEach((element) => {
      const slideImages = element.querySelectorAll('.slider-image');
      slideImages.forEach((img) => {
        img.dataset.swiperParallax = parallaxValue;
        img.dataset.swiperParallaxOpacity = 1;
      });
    });
  }

  // Helper

  const freezeWindow = (lock) => {
    const normalScroll = document.querySelector(".normal-scroll");

    if (lock) {
      __scrollY = window.scrollY || window.pageYOffset;
      __normalScrollY = normalScroll ? normalScroll.scrollTop : 0;

      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.position = "fixed";
      document.body.style.top = `-${__scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = scrollbarWidth + "px";
      }
    } else {
      const y = __scrollY;

      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      document.body.removeAttribute("style");

      if (y > 0) {
        window.scrollTo(0, y);
      }

      if (normalScroll) {
        normalScroll.scrollTop = __normalScrollY;
      }
    }
  };

  const getPopupElements = (id) => {
    const popup = document.getElementById(id);
    if (!popup) return null;

    return {
      popup,
      body: popup.querySelector(".popup-body"),
      title: popup.querySelector(".popup-title"),
      closeBtn: popup.querySelector(".popup-close"),
      overlay: popup.querySelector(".popup-overlay"),
    };
  };

  const initMobileAnimations = () => {
    if (isDesktop()) return;

    gsap.registerPlugin(ScrollTrigger);

    const targets = document.querySelectorAll(".js-title");
    if (!targets.length) return;

    targets.forEach((el) => {
      gsap.fromTo(
        el, {
          autoAlpha: 0,
          y: 100,
        }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        },
      );
    });
  };

  const topVideoPlayOnScroll = () => {
    const section = document.querySelector(".section-top-video");
    if (!section) return;

    const video = section.querySelector("video");
    if (!video) return;

    const bgVideo = section.querySelector(".bg-video");
    const controls = section.querySelector(".controls");
    const playbackButton = section.querySelector(".playback-button");
    const pauseIcon = section.querySelector(".pause-icon");
    const playIcon = section.querySelector(".play-icon");
    const volumeButton = section.querySelector(".volume-button");
    const volumeMuteIcon = section.querySelector(".volume-mute");
    const volumeHighIcon = section.querySelector(".volume-high");
    const fullscreenButton = section.querySelector(".fullscreen-button");
    const fullscreenIcon = section.querySelector(".fullscreen-icon");
    const fullscreenExitIcon = section.querySelector(".fullscreen-exit-icon");
    const videoProgress = section.querySelector(".video-progress");
    const progressbar = section.querySelector(".progressbar");
    const seek = section.querySelector(".seek");
    const timeElapsed = section.querySelector(".time-elapsed");
    const duration = section.querySelector(".duration");
    const playerVid = section.querySelector(".player-vid");
    const playerPauseIcon = playerVid?.querySelector(".pause-icon");
    const playerPlayIcon = playerVid?.querySelector(".play-icon");
    let playDelayTimer = null;
    let isSectionVisible = false;

    const formatTime = (seconds) => {
      const value = Number.isFinite(seconds) ? Math.floor(seconds) : 0;
      const mins = Math.floor(value / 60);
      const secs = value % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const updatePlaybackIcon = () => {
      pauseIcon?.classList.toggle("display-none", video.paused);
      playIcon?.classList.toggle("display-none", !video.paused);
    };

    const updateVolumeIcon = () => {
      const isMuted = video.muted || video.volume === 0;
      volumeMuteIcon?.classList.toggle("display-none", !isMuted);
      volumeHighIcon?.classList.toggle("display-none", isMuted);
    };

    const updateFullscreenIcon = () => {
      const isFullscreen = document.fullscreenElement === section;
      fullscreenIcon?.classList.toggle("display-none", isFullscreen);
      fullscreenExitIcon?.classList.toggle("display-none", !isFullscreen);
    };

    const updatePlayerIcon = () => {
      playerPauseIcon?.classList.toggle("display-none", true);
      playerPlayIcon?.classList.toggle("display-none", false);
    };

    const showPlayerButton = () => {
      updatePlayerIcon();
      playerVid?.classList.remove("hide");
    };

    const hidePlayerButton = () => {
      playerVid?.classList.add("hide");
    };

    const updateProgress = () => {
      const videoDuration = video.duration || 0;
      const currentTime = video.currentTime || 0;
      const progress = videoDuration ? (currentTime / videoDuration) * 100 : 0;

      videoProgress?.style.setProperty("--video-progress", `${progress}%`);

      if (progressbar) {
        progressbar.max = videoDuration;
        progressbar.value = currentTime;
      }

      if (seek) {
        seek.max = videoDuration;
        seek.value = currentTime;
      }

      if (timeElapsed) timeElapsed.textContent = formatTime(currentTime);
      if (duration) duration.textContent = formatTime(videoDuration);
    };

    const resetVideo = () => {
      clearTimeout(playDelayTimer);
      playDelayTimer = null;
      isSectionVisible = false;
      pauseVideo();
      video.currentTime = 0;
      bgVideo?.classList.remove("hide");
      controls?.classList.add("hide");
      hidePlayerButton();
      updateProgress();
      updatePlaybackIcon();
    };

    const pauseToPoster = () => {
      clearTimeout(playDelayTimer);
      playDelayTimer = null;
      pauseVideo();
      bgVideo?.classList.remove("hide");
      controls?.classList.add("hide");
      showPlayerButton();
      updatePlaybackIcon();
    };

    const playVideo = () => {
      hidePlayerButton();
      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(() => {});
      }
    };

    const pauseVideo = () => {
      video.pause();
    };

    const updateVideoState = (isVisible) => {
      if (isVisible) {
        if (isSectionVisible) return;

        isSectionVisible = true;
        bgVideo?.classList.remove("hide");
        controls?.classList.add("hide");
        showPlayerButton();
        clearTimeout(playDelayTimer);
        playDelayTimer = setTimeout(() => {
          if (!isSectionVisible) return;
          bgVideo?.classList.add("hide");
          controls?.classList.remove("hide");
          playVideo();
        }, 1000);
      } else {
        resetVideo();
      }
    };

    const usesPanelState = () =>
      isDesktop() &&
      section.classList.contains("panel");

    const checkPanelState = () => {
      if (usesPanelState()) {
        updateVideoState(section.classList.contains("is-active"));
      }
    };

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (usesPanelState() && !section.classList.contains("is-active")) {
            resetVideo();
            return;
          }

          updateVideoState(entry.isIntersecting);
        }, {
          threshold: 0.35,
        },
      );

      observer.observe(section);
    } else {
      window.addEventListener(
        "scroll",
        () => {
          const rect = section.getBoundingClientRect();
          updateVideoState(rect.top < window.innerHeight * 0.65 && rect.bottom > window.innerHeight * 0.35);
        }, {
          passive: true,
        },
      );
    }

    const panelObserver = new MutationObserver(checkPanelState);
    panelObserver.observe(section, {
      attributes: true,
      attributeFilter: ["class"],
    });

    playbackButton?.addEventListener("click", () => {
      if (video.paused) {
        playVideo();
      } else {
        pauseToPoster();
      }
    });

    video.addEventListener("click", () => {
      if (!video.paused) pauseToPoster();
    });

    playerVid?.addEventListener("click", () => {
      if (!isSectionVisible) return;
      bgVideo?.classList.add("hide");
      controls?.classList.remove("hide");
      playVideo();
    });

    volumeButton?.addEventListener("click", () => {
      video.muted = !video.muted;
      updateVolumeIcon();
    });

    seek?.addEventListener("input", () => {
      video.currentTime = Number(seek.value) || 0;
      updateProgress();
    });

    fullscreenButton?.addEventListener("click", () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      } else {
        section.requestFullscreen?.();
      }
    });

    video.addEventListener("play", updatePlaybackIcon);
    video.addEventListener("pause", updatePlaybackIcon);
    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("loadedmetadata", updateProgress);
    video.addEventListener("volumechange", updateVolumeIcon);
    document.addEventListener("fullscreenchange", updateFullscreenIcon);

    updateProgress();
    updatePlaybackIcon();
    updateVolumeIcon();
    updateFullscreenIcon();
    updatePlayerIcon();
    if (section.classList.contains("is-active")) showPlayerButton();
    checkPanelState();
  };

  // End helper

  const initIntro = () => {
    const isTablet = () => window.innerWidth < 1024.98;

    const revealTitleFade = () => {
      document.querySelectorAll('.js-title-fade').forEach((el, i) => {
        el.classList.remove('is-show');
        gsap.set(el, {
          clearProps: "opacity,visibility,transform",
        });
        void el.offsetHeight;

        setTimeout(() => {
          el.classList.add('is-show');
        }, i * 50);
      });
    };

    if (!isTablet()) {
      document.body.style.overflow = "hidden";
    }

    delay(1000, () => {
      Mask?.classList.add('showed');
    });
    delay(3000, () => {
      Mask?.classList.add('hide');
    });
    delay(3800, () => {
      Mask?.remove();
      setTimeout(() => {
        WindBody.classList.add('showed');
        revealTitleFade();
      }, 50);
    });

    setTimeout(() => {
      setTimeout(() => {
        if (!isTablet()) {
          document.body.style.overflow = "hidden";
        }
        app();
        initMobileAnimations();
      }, 600);
    }, 1200);
  };

  const sliderIntroduction = () => {
    const sliders = document.querySelectorAll(".js-slider-introduction");
    if (!sliders.length) return;

    sliders.forEach((slider) => {
      const sliderThumbnailsDOM = slider.querySelector(
        '.swiper[data-slider-role="slider-thumbnails"]',
      );
      const sliderMainDOM = slider.querySelector(
        '.swiper[data-slider-role="slider-main"]',
      );

      if (!sliderThumbnailsDOM || !sliderMainDOM) return;

      const sliderThumbnailsWrapper =
        sliderThumbnailsDOM.querySelector(".swiper-wrapper");
      sliderThumbnailsWrapper.innerHTML = "";
      const slideMainSlides = sliderMainDOM.querySelectorAll(".swiper-slide");
      slideMainSlides.forEach((slide) => {
        const thumbnail = slide.querySelector(".thumbnail-introduction img");
        if (thumbnail) {
          const nextThumbSrc = thumbnail.dataset.nextThumb || thumbnail.src;
          const thumbnailItem = document.createElement("div");
          thumbnailItem.className = "swiper-slide";
          thumbnailItem.innerHTML = `<figure><img class="object-common" src="${nextThumbSrc}" alt="${thumbnail.alt || ""}" /></figure>`;
          sliderThumbnailsWrapper.appendChild(thumbnailItem);
        }
      });

      const sliderThumbnails = new Swiper(sliderThumbnailsDOM, {
        loop: true,
        speed: 500,
        direction: "vertical",
        slidesPerView: 1,
        spaceBetween: 0,
        allowTouchMove: false,
        slideToClickedSlide: false,
        simulateTouch: false,
        keyboard: false,
        mousewheel: false,
      });

      const sliderMain = new Swiper(sliderMainDOM, {
        loop: true,
        speed: 1500,
        slidesPerView: 1,
        spaceBetween: 0,
        effect: "fade",
        fadeEffect: {
          crossFade: true,
        },
        pagination: {
          el: slider.querySelector('[data-slider-role="pagination"]'),
          clickable: true,
          type: "fraction",
          renderFraction: function (currentClass, totalClass) {
            return `<span class="${currentClass}" data-slider-role="pagination-current"></span>
                  <span class="${totalClass}" data-slider-role="pagination-total"></span>`;
          },
        },
        navigation: {
          nextEl: slider.querySelector('[data-slider-role="arrow-next"]'),
        },
      });

      sliderMain.on("realIndexChange", () => {
        sliderThumbnails.slideToLoop(sliderMain.realIndex);
      });
    });
  };

  const scrollPage = () => {
    const $header = $("header.header-common");
    let lastScroll = window.scrollY;

    const onScroll = () => {
      if (window.__APP_STATE__.forceHideHeader) return;
      if (document.body.style.position === "fixed") return;

      if (isDesktop() && window.__APP_STATE__?.sliderState?.active) {
        lastScroll = window.scrollY;
        $header.removeClass("is-hide");
        return;
      }

      const currentScroll = window.scrollY;

      if (currentScroll <= 0) {
        $header.removeClass("is-hide");
        lastScroll = 0;
        return;
      }

      if (currentScroll > lastScroll) {
        $header.addClass("is-hide");
      } else {
        $header.removeClass("is-hide");
      }

      lastScroll = currentScroll;
    };

    $(window).on("scroll", onScroll);
  };

  const triggerClick = () => {
    const classClickActive = 'is-click-active';

    const classClosing = 'is-closing';

    const header = document.querySelector('.header-common');

    const overlayMenu = document.querySelector('.overlay-menu');

    const navigationWrapper = document.querySelector('.navigation-wrapper');

    const clickElements = document.querySelectorAll('.js-click');

    // const buttonClose = document.querySelector('.js-button-close');

    if (
      !header ||
      !overlayMenu ||
      !navigationWrapper ||
      !clickElements.length
      // !buttonClose
    ) {
      return;
    }

    let isOpen = false;

    // OPEN
    const openMenu = (element) => {
      // RESET
      overlayMenu.classList.remove(classClosing);

      navigationWrapper.classList.remove(classClosing);

      clickElements.forEach((el) => {
        el.classList.remove(classClosing);
        el.classList.remove(classClickActive);
      });

      // Remove is-menu-closing → CSS transitions width 0 → 100%
      header.classList.remove('is-menu-closing');

      // ACTIVE
      header.classList.add('is-menu-open');
      element.classList.add(classClickActive);
      overlayMenu.classList.add(classClickActive);
      navigationWrapper.classList.add(classClickActive);

      // LOCK SCROLL
      document.body.style.overflow = 'hidden';
      // WinScroll.stop();
      freezeWindow(true);
      window.__APP_STATE__?.observer?.disable();

      isOpen = true;
    };

    // CLOSE
    const closeMenu = () => {
      isOpen = false;

      header.classList.add('is-menu-closing');

      overlayMenu.classList.remove(classClickActive);
      navigationWrapper.classList.remove(classClickActive);

      clickElements.forEach((el) => {
        el.classList.remove(classClickActive);
      });

      navigationWrapper.classList.add(classClosing);
      overlayMenu.classList.add(classClosing);

      clickElements.forEach((el) => {
        el.classList.add(classClosing);
      });

      setTimeout(() => {
        header.classList.remove('is-menu-open');

        header.classList.remove('is-menu-closing');

        overlayMenu.classList.remove(classClickActive, classClosing);

        navigationWrapper.classList.remove(classClickActive, classClosing);

        clickElements.forEach((el) => {
          el.classList.remove(classClickActive, classClosing);
        });

        document.body.style.overflow = '';
        freezeWindow(false);
        if (window.__APP_STATE__?.sliderState?.active) {
          window.__APP_STATE__?.observer?.enable();
        }
      }, 500);
    };

    window.addEventListener('header:close-menu', closeMenu);

    // TOGGLE
    clickElements.forEach((element) => {
      element.addEventListener('click', (e) => {
        e.stopPropagation();

        if (isOpen) {
          closeMenu();
        } else {
          openMenu(element);
        }
      });
    });

    // OVERLAY CLOSE
    overlayMenu.addEventListener('click', closeMenu);

    // BUTTON CLOSE
    // buttonClose.addEventListener('click', closeMenu);
  };

  const fadeInAnimation = () => {
    const fadeInElements = document.querySelectorAll(".js-fadein");
    if (!fadeInElements.length) return;

    fadeInElements.forEach((element) => {
      gsap.fromTo(
        element, {
          opacity: 0,
          y: 50,
        }, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        },
      );
    });
  };

  const initMobileNavLinks = () => {
    if (isDesktop()) return;

    const mobileLinks = document.querySelectorAll(
      ".navigation-menu .item-link",
    );

    const getTargetSection = (hash) => {
      if (!hash) return null;
      return document.getElementById(hash);
    };

    mobileLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href") || "";
        const hash = href.split("#")[1];
        const linkPath = href.split("#")[0];

        const isSamePage = !linkPath ||
          linkPath === window.location.pathname ||
          linkPath === window.location.origin + window.location.pathname ||
          linkPath.endsWith(window.location.pathname);

        if (!isSamePage) return;

        e.preventDefault();

        window.dispatchEvent(new CustomEvent("header:close-menu"));

        const target = getTargetSection(hash);
        if (target) {
          setTimeout(() => {
            target.scrollIntoView({
              behavior: "smooth",
            });
          }, 550);
        }
      });
    });

    const hash = window.location.hash?.replace("#", "");
    if (!hash) return;

    const target = getTargetSection(hash);

    if (target) {
      setTimeout(() => {
        target.scrollIntoView({
          behavior: "smooth",
        });
        history.replaceState(null, "", window.location.pathname);
      }, 500);
    }
  };

  const measureAndAnimate = (el, wrapper, originalCount, speed, reverse) => {
    const allSlides = Array.from(wrapper.children);

    const firstSlide = allSlides[0];
    const firstOfSecondSet = allSlides[originalCount];

    const firstRect = firstSlide.getBoundingClientRect();
    const firstOfSecondRect = firstOfSecondSet.getBoundingClientRect();

    const oneSetWidth = firstOfSecondRect.left - firstRect.left;

    wrapper.style.willChange = "transform";
    wrapper.style.backfaceVisibility = "hidden";
    wrapper.style.webkitBackfaceVisibility = "hidden";

    const prefix = reverse ? "marquee-rev-px" : "marquee-px";
    const keyframeName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const style = document.createElement("style");

    style.textContent = reverse ?
      `@keyframes ${keyframeName} { from { transform: translate3d(-${oneSetWidth}px, 0, 0); } to { transform: translate3d(0, 0, 0); } }` :
      `@keyframes ${keyframeName} { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(-${oneSetWidth}px, 0, 0); } }`;
    document.head.appendChild(style);

    wrapper.style.width = "max-content";

    requestAnimationFrame(() => {
      wrapper.style.animation = `${keyframeName} ${speed}ms linear infinite`;
    });
  };

  const handleDarkBg = () => {
    if (window.innerWidth > mobileBreak) {
      return;
    }

    const bgSections = Array.from(document.querySelectorAll(".js-bg"));

    document.documentElement.classList.toggle(
      "is-dark-bg",
      bgSections.some((sec) => {
        const {
          top,
          bottom
        } = sec.getBoundingClientRect();
        return top < window.innerHeight && bottom > 0;
      }),
    );
  };

  const sliderProjects = () => {
    const sliders = document.querySelectorAll(".js-top-projects");
    if (!sliders.length) return;

    sliders.forEach((container) => {
      const slider = container.querySelectorAll(".swiper")[0];

      new Swiper(slider, {
        loop: true,
        speed: 500,
        slidesPerView: 'auto',
        autoplay: {
          delay: 3000,
          disableOnInteraction: false,
        },
      });
    });
  };

  const dragProjectsImage = () => {
    const wrappers = document.querySelectorAll(".section-top-projects .projects-wrapper");
    if (!wrappers.length) return;

    const minVisibleWidth = 50;
    const maxVisibleWidth = 100;
    const isDragDesktop = () => window.innerWidth >= 1024.98;
    const clamp = (value) => Math.min(maxVisibleWidth, Math.max(minVisibleWidth, value));

    wrappers.forEach((wrapper) => {
      const image = wrapper.querySelector(".projects-image");
      if (!image) return;

      const setImageClip = (clientX) => {
        const rect = wrapper.getBoundingClientRect();
        const visibleWidth = clamp(((rect.right - clientX) / rect.width) * 100);
        const clipLeft = 100 - visibleWidth;
        wrapper.style.setProperty("--projects-image-clip-left", `${clipLeft}%`);
        image.classList.toggle("is-active", visibleWidth > minVisibleWidth);
      };

      image.addEventListener("pointerdown", (event) => {
        if (!isDragDesktop()) return;

        const rect = wrapper.getBoundingClientRect();
        const clipLeft = parseFloat(getComputedStyle(wrapper).getPropertyValue("--projects-image-clip-left")) || 50;
        const handleX = rect.left + (rect.width * clipLeft) / 100;
        const handleArea = Math.max(36, rect.width * 0.04);
        const isHandle = Math.abs(event.clientX - handleX) <= handleArea;
        if (!isHandle) return;

        event.preventDefault();
        image.classList.add("is-dragging");
        image.setPointerCapture?.(event.pointerId);
        setImageClip(event.clientX);

        const onPointerMove = (moveEvent) => {
          setImageClip(moveEvent.clientX);
        };

        const onPointerUp = () => {
          image.classList.remove("is-dragging");
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("pointerup", onPointerUp);
          window.removeEventListener("pointercancel", onPointerUp);
        };

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);
      });
    });
  };

  const partnersSlider = () => {
    const sliders = document.querySelectorAll('.js-partnet-slider');
    if (!sliders.length) return;

    sliders.forEach((slider) => {
      const groupNum = Number(slider.dataset.group) || 1;

      new Swiper(slider, {
        loop: true,
        speed: 1500,
        slidesPerGroup: groupNum,
        slidesPerView: 'auto',
        autoplay: {
          delay: 3000,
          disableOnInteraction: false,
        },
        pagination: {
          el: slider.querySelector('.swiper-pagination'),
          clickable: true,
        },
        breakpoints: {
          0: {
            slidesPerGroup: 2,
            autoplay: {
              delay: 0,
              disableOnInteraction: false,
            },
            speed: 3000,
          },
          768: {
            slidesPerGroup: 3,
          },
          1025: {
            slidesPerGroup: groupNum,
          },
        },
      });
    });
  };

  const initMapZoom = () => {
    const mapWrapper = document.querySelector(".js-map");
    const zoomInBtn = document.querySelector(".map-controller .button-plus");
    const zoomOutBtn = document.querySelector(
      ".map-controller .button-negative",
    );

    if (!mapWrapper || !zoomInBtn || !zoomOutBtn) return;

    const MIN_ZOOM = 1.2;
    const MAX_ZOOM = 2;

    let currentZoom = 1.2;
    let translateX = 0;
    let translateY = 0;

    let isDragging = false;
    let startX = 0;
    let startY = 0;

    let rafId = null;

    const updateUI = () => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        if (currentZoom === 1.2) {
          translateX = 0;
          translateY = 0;
        }

        mapWrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;

        mapWrapper.classList.toggle("is-draggable", currentZoom > 1.2);

        zoomInBtn.classList.toggle("is-disabled", currentZoom >= MAX_ZOOM);
        zoomOutBtn.classList.toggle("is-disabled", currentZoom <= MIN_ZOOM);

        rafId = null;
      });
    };

    zoomInBtn.addEventListener("click", (e) => {
      e.preventDefault();
      currentZoom = Math.min(currentZoom + 0.5, MAX_ZOOM);
      updateUI();
    });

    zoomOutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      currentZoom = Math.max(currentZoom - 0.5, MIN_ZOOM);
      updateUI();
    });

    mapWrapper.addEventListener("mousedown", (e) => {
      if (currentZoom === 1.2) return;
      isDragging = true;
      startX = e.clientX / currentZoom - translateX;
      startY = e.clientY / currentZoom - translateY;
      mapWrapper.style.cursor = "grabbing";
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging || currentZoom === 1.2) return;
      translateX = e.clientX / currentZoom - startX;
      translateY = e.clientY / currentZoom - startY;
      updateUI();
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
      mapWrapper.style.cursor = currentZoom > 1.2 ? "grab" : "default";
    });

    mapWrapper.addEventListener("touchstart", (e) => {
      if (currentZoom === 1.2) return;
      const touch = e.touches[0];
      isDragging = true;
      startX = touch.clientX / currentZoom - translateX;
      startY = touch.clientY / currentZoom - translateY;
    });

    window.addEventListener(
      "touchmove",
      (e) => {
        if (!isDragging || currentZoom === 1.2) return;
        e.preventDefault();
        const touch = e.touches[0];
        translateX = touch.clientX / currentZoom - startX;
        translateY = touch.clientY / currentZoom - startY;
        updateUI();
      }, {
        passive: false,
      },
    );

    window.addEventListener("touchend", () => {
      isDragging = false;
    });

    updateUI();
  };

  window.WebFontConfig = {
    custom: {
      families: [
        "Montserrat:n3,n4,n5,n6,n7",
      ],
      urls: [
        "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap",
      ],
    },
  };

  (() => {
    const wf = document.createElement("script");
    wf.src = "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js";
    wf.type = "text/javascript";
    wf.async = "true";
    const s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(wf, s);
  })();

  detectDevice();
  initIntro();
  triggerClick();
  fadeInAnimation();
  scrollPage();
  initMobileNavLinks();
  slideKeyvisual();
  window.addEventListener("scroll", handleDarkBg, {
    passive: true
  });
  sliderProjects();
  dragProjectsImage();
  partnersSlider();
  topVideoPlayOnScroll();
  initMapZoom();
})();
