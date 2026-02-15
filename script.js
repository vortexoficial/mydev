import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { Flip } from 'gsap/Flip';
import { Observer } from 'gsap/Observer';
import { CustomEase } from 'gsap/CustomEase';
import { initCareer } from './career.js';

document.addEventListener('DOMContentLoaded', () => {
    // Always start from the very top on first load / refresh.
    // Prevents ScrollTrigger pinned states from restoring mid-page.
    const forceScrollTop = () => {
        const prevBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        document.documentElement.style.scrollBehavior = prevBehavior;
    };

    try {
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
    } catch (_) {
        // ignore
    }

    forceScrollTop();
    window.addEventListener('beforeunload', forceScrollTop);
    window.addEventListener('pageshow', () => {
        // Handles BFCache restores on mobile/Safari/Chrome.
        forceScrollTop();
        // Refresh triggers once they exist.
        window.setTimeout(() => {
            try { ScrollTrigger.refresh(); } catch (_) { /* ignore */ }
        }, 50);
    });

    // Safety: never trap the user on the loader
    const preloaderEl = document.querySelector('.preloader');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const loaderFailsafe = window.setTimeout(() => {
        if (preloaderEl) {
            preloaderEl.style.transform = 'translateY(-100%)';
            preloaderEl.style.transition = 'transform 0.8s ease';
        }
    }, 6000);

    try {
        // 1. Register Plugins
        gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Flip, Observer, CustomEase);
        gsap.config({ force3D: true, nullTargetWarn: false });
        ScrollTrigger.config({ ignoreMobileResize: true });

    const rafThrottle = (fn) => {
        let frame = null;
        return (...args) => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = null;
                fn(...args);
            });
        };
    };

    // 2. Helper: SplitText Simulator (since SplitText is paid)
    const splitTextToSpans = (selector) => {
        const elements = document.querySelectorAll(selector);

        // NOTE: `innerText` is layout-aware and can include *automatic* line wraps
        // as `\n` on narrow screens. That was causing words like "Fature" to become
        // "Fatur\ne" on mobile. We only want to preserve *manual* <br> breaks.
        const getTextPreservingBr = (el) => {
            const htmlWithNewlines = (el.innerHTML || '').replace(/<br\s*\/?>/gi, '\n');
            const tmp = document.createElement('div');
            tmp.innerHTML = htmlWithNewlines;
            return (tmp.textContent || '').replace(/\r\n/g, '\n');
        };

        elements.forEach(el => {
            const text = getTextPreservingBr(el);
            el.innerHTML = '';

            const isMobile = window.matchMedia('(max-width: 768px)').matches;

            // Special case: Hero 1 right title should break only on mobile (Fature / Alto)
            let lines = text.split('\n');
            if (isMobile && el.classList.contains('hero-title-right') && lines.length <= 1) {
                const words = text.trim().split(/\s+/).filter(Boolean);
                if (words.length >= 2) {
                    lines = [words[0], words.slice(1).join(' ')];
                }
            }

            lines.forEach((line, lineIndex) => {
                const words = line.trim().split(/\s+/).filter(Boolean);
                words.forEach((word, i) => {
                    const wordSpan = document.createElement('span');
                    if (el.classList.contains('hero-secondary-title')) {
                        const normalized = word.toLowerCase();
                        if (normalized === 'mais' || normalized === 'completa') {
                            wordSpan.classList.add('accent-elite');
                        }
                    }
                    // Use inline-flex + nowrap so characters don't become wrap points.
                    // (Each character is an element; without this, mobile can wrap inside a word: "Fatur" + "e".)
                    wordSpan.style.display = 'inline-flex';
                    wordSpan.style.whiteSpace = 'nowrap';
                    wordSpan.style.flexWrap = 'nowrap';
                    wordSpan.style.overflow = 'hidden';
                    wordSpan.style.verticalAlign = 'bottom'; // Fix for alignment

                    // Split by chars
                    const chars = word.split('');
                    chars.forEach(char => {
                        const charSpan = document.createElement('span');
                        charSpan.classList.add('char');
                        charSpan.innerText = char;
                        charSpan.style.display = 'inline-block';
                        charSpan.style.transform = 'translateY(100%)'; // Initial state for reveal
                        wordSpan.appendChild(charSpan);
                    });

                    el.appendChild(wordSpan);
                    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
                });

                if (lineIndex < lines.length - 1) {
                    el.appendChild(document.createElement('br'));
                }
            });
        });
    };

    // 3. Initialize Everything
    function init() {
        console.log("My Dev Academy: Initializing...");
        
        // Prepare DOM for animations
        splitTextToSpans('.split-text');

        initPreloader();
        initHeader();
        initHero();
        initHeroWindowTransition();
        initHeroSecondaryReveal();
        initSessionTransition();
        initSession2Immersive();
        initScrollStory();
        initServices();
        initHorizontalScroll();
        initFlipLayout();
        // GSAP effects requested only for the final CTA (not the previous section)
        initMagneticButtons();
        initSmoothScrollAnchors();
        initCareer();
        initFinalCta();

        // Keep Hero 1 right headline aligned to the window edge
        const syncHero1HeadlineAnchorRaf = rafThrottle(syncHero1HeadlineAnchor);
        syncHero1HeadlineAnchor();
        window.addEventListener('resize', syncHero1HeadlineAnchorRaf, { passive: true });
        window.addEventListener('orientationchange', syncHero1HeadlineAnchorRaf, { passive: true });
        window.addEventListener('load', () => {
            syncHero1HeadlineAnchor();
            ScrollTrigger.refresh();
        }, { once: true });
        ScrollTrigger.addEventListener('refreshInit', syncHero1HeadlineAnchorRaf);
        ScrollTrigger.addEventListener('refresh', syncHero1HeadlineAnchorRaf);
        
        // Refresh ScrollTrigger to ensure correct positions
        requestAnimationFrame(() => ScrollTrigger.refresh());
    }

    function syncHero1HeadlineAnchor() {
        const hero1 = document.querySelector('.hero.hero-window[data-hero="1"]');
        if (!hero1) return;

        const container = hero1.querySelector('.hero-container');
        const headlines = hero1.querySelector('.hero-headlines');
        const frameImg = hero1.querySelector('.window-frame-img');
        const frame = hero1.querySelector('.window-frame');
        const frameEl = frameImg || frame;
        if (!container || !headlines || !frameEl) return;

        const frameRect = frameEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Right edge of the window, in the hero container coordinate space
        const rightInContainer = Math.max(0, frameRect.right - containerRect.left);
        hero1.style.setProperty('--window-right-in-headlines', `${rightInContainer}px`);

        // Keep the right headline visible and positioned below (desktop + mobile)
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const rightHeadline = hero1.querySelector('.hero-headline-right');
        if (!rightHeadline) return;

        const gapPx = isMobile ? 10 : 18; // similar to the CSS clamp gaps
        const headlineRect = rightHeadline.getBoundingClientRect();
        const headlineWidth = Math.max(rightHeadline.scrollWidth || 0, headlineRect.width || 0);
        const headlineHeight = Math.max(headlineRect.height || 0, rightHeadline.scrollHeight || 0);

        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;

        // Keep the right headline aligned to the same "content margin" as the container padding,
        // so it doesn't hug the viewport edge on wide screens.
        const containerStyles = window.getComputedStyle(container);
        const paddingRightPx = Number.parseFloat(containerStyles.paddingRight || '0') || 0;
        const minRightGap = Math.max(16, paddingRightPx);

        // Horizontal: to the right of the window, clamped inside container
        const desiredLeft = rightInContainer + gapPx;
        const maxLeft = Math.max(0, containerWidth - headlineWidth - minRightGap);
        const clampedLeft = Math.min(Math.max(0, desiredLeft), maxLeft);
        hero1.style.setProperty('--right-headline-left', `${clampedLeft}px`);

        // Right edge gap (container-right -> headline-right), used to align SCROLL DOWN
        const rightHeadlineRightGap = Math.max(0, containerWidth - (clampedLeft + headlineWidth));
        hero1.style.setProperty('--right-headline-right-gap', `${rightHeadlineRightGap}px`);

        // Vertical: below the window center, clamped inside container
        const desiredTop = (frameRect.top - containerRect.top) + (frameRect.height * (isMobile ? 0.58 : 0.62));
        const maxTop = Math.max(0, containerHeight - headlineHeight - 4);
        const clampedTop = Math.min(Math.max(0, desiredTop), maxTop);
        hero1.style.setProperty('--right-headline-top', `${clampedTop}px`);
    }

    function playLogoIntro() {
        const logo = document.querySelector('.site-logo');
        if (!logo) return;

        if (prefersReducedMotion) {
            gsap.set(logo, { autoAlpha: 1, filter: 'blur(0px)', scale: 1 });
            return;
        }

        // Always intro from the window center
        gsap.set(logo, {
            left: '50%',
            top: '50%',
            xPercent: -50,
            yPercent: -50
        });

        // Don't kill ScrollTrigger-driven tweens (top/scale). Only drive the "film intro" look.
        gsap.killTweensOf(logo, 'opacity,filter');

        gsap.fromTo(
            logo,
            { autoAlpha: 0, filter: 'blur(18px)' },
            {
                autoAlpha: 1,
                filter: 'blur(0px)',
                duration: 1.25,
                ease: 'power3.out',
                overwrite: 'auto'
            }
        );
    }

    // --- A. Preloader ---
    function initPreloader() {
        const tl = gsap.timeline();
        const counter = document.querySelector('.counter');
        const progressFill = document.querySelector('.progress-fill');
        const preloader = document.querySelector('.preloader');

        // Guard: if any preloader piece is missing, don't break the whole app.
        // Still hide the loader and reveal Hero 1.
        if (!preloader || !counter || !progressFill) {
            if (preloader) {
                gsap.to(preloader, { yPercent: -100, duration: 0.8, ease: 'power4.inOut' });
            }
            playLogoIntro();
            const hero1 = document.querySelector('[data-hero="1"]');
            playHeroReveal(hero1);
            return;
        }

        // Simulate progress
        let count = { val: 0 };
        
        tl.to(count, {
            val: 100,
            duration: 2,
            ease: "power2.inOut",
            onUpdate: () => {
                counter.innerText = Math.floor(count.val) + "%";
                progressFill.style.width = Math.floor(count.val) + "%";
            }
        })
        .to(counter, { opacity: 0, duration: 0.5, y: -20 })
        .to(preloader, { 
            yPercent: -100, 
            duration: 1, 
            ease: "power4.inOut" 
        }, "-=0.2")
        // Film-like logo intro ONLY after the black loader is gone
        .add(() => {
            playLogoIntro();
        })
        // Start Hero Animations
        .add(() => {
            const hero1 = document.querySelector('[data-hero="1"]');
            playHeroReveal(hero1);
        }, "-=0.5");
    }

    // --- B. Header ---
    function initHeader() {
        const header = document.querySelector('.header');
        if (!header) return;
        
        ScrollTrigger.create({
            start: "top -80",
            end: 99999,
            toggleClass: { className: "scrolled", targets: header }
        });

        // Mobile Menu (GSAP)
        const toggle = document.querySelector('.menu-toggle');
        const nav = document.querySelector('.nav');
        const navLinks = gsap.utils.toArray('.nav .nav-link');

        if (!toggle || !nav) return;

        let isMenuOpen = false;

        // Initial state
        gsap.set(nav, { autoAlpha: 0, display: 'none' });
        gsap.set(navLinks, { yPercent: 120 });

        const menuTl = gsap.timeline({
            paused: true,
            defaults: { ease: 'power4.out' },
            onReverseComplete: () => {
                gsap.set(nav, { display: 'none' });
                gsap.set(navLinks, { yPercent: 120 });
            }
        });

        menuTl
            .set(nav, { display: 'flex' })
            .to(nav, { autoAlpha: 1, duration: 0.35, ease: 'power2.inOut' })
            .to(navLinks, { yPercent: 0, duration: 0.9, stagger: 0.08 }, '-=0.08');

        const openMenu = () => {
            if (isMenuOpen) return;
            isMenuOpen = true;
            toggle.classList.add('active');
            toggle.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
            menuTl.play(0);
        };

        const closeMenu = () => {
            if (!isMenuOpen) return;
            isMenuOpen = false;
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            menuTl.reverse();
        };

        toggle.addEventListener('click', () => {
            if (isMenuOpen) closeMenu();
            else openMenu();
        });

        // Close on link click (works together with smooth-scroll handler)
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeMenu();
            });
        });
    }

    // --- C. Hero ---
    function initHero() {
        // Parallax Effect (per hero section)
        gsap.utils.toArray('.hero').forEach((heroSection) => {
            const heroBg = heroSection.querySelector('.hero-bg');
            if (!heroBg) return;

            const heroId = heroSection.getAttribute('data-hero');
            const bgY = heroId === '2' ? -20 : 30;

            gsap.to(heroBg, {
                scrollTrigger: {
                    trigger: heroSection,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true
                },
                yPercent: bgY,
                scale: 1.1
            });
        });

        // Mouse Parallax (Desktop Only)
        if (!prefersReducedMotion && window.matchMedia("(min-width: 1024px)").matches) {
            const setHeroX = gsap.quickTo('.hero .hero-container', 'x', { duration: 0.7, ease: 'power2.out' });
            const setHeroY = gsap.quickTo('.hero .hero-container', 'y', { duration: 0.7, ease: 'power2.out' });

            document.addEventListener('mousemove', (e) => {
                const moveX = (e.clientX - window.innerWidth / 2) * 0.02;
                const moveY = (e.clientY - window.innerHeight / 2) * 0.02;
                setHeroX(moveX);
                setHeroY(moveY);
            }, { passive: true });
        }
    }

    // --- C1. Hero Window Transition (Hero 1 -> Hero 2) ---
    function initHeroWindowTransition() {
        const hero1 = document.querySelector('.hero.hero-window[data-hero="1"]');
        const hero2 = document.querySelector('.hero[data-hero="2"]');
        if (!hero1 || !hero2) return;

        const siteLogo = document.querySelector('.site-logo');

        const scene = hero1.querySelector('.hero-window-scene');
        const portal = hero1.querySelector('.window-portal');
        const cloudsLayer = hero1.querySelector('.window-clouds');
        const frame = hero1.querySelector('.window-frame');
        const vignette = hero1.querySelector('.hero-window-vignette');
        const hero1Container = hero1.querySelector('.hero-container');
        const hero1IntroTop = hero1.querySelector('.hero-intro-top');
        const hero1IntroBottom = hero1.querySelector('.hero-intro-bottom');
        const hero1HeadlineRight = hero1.querySelector('.hero-headline-right');
        const hero1Subtitle = hero1.querySelector('.hero-bottom-left .hero-subtitle');
        if (!scene || !portal || !frame || !hero1Container) return;

        const hero1Bg = hero1.querySelector('.hero-bg');

        gsap.set(scene, { transformPerspective: 1200, transformStyle: 'preserve-3d' });
        gsap.set(scene, { scale: 1, rotateX: 0, y: 0, transformOrigin: '50% 50%' });
        gsap.set(portal, { scale: 1, yPercent: 0, filter: 'blur(0px)', transformOrigin: '50% 50%' });
        gsap.set(frame, { autoAlpha: 1, scale: 1, transformOrigin: '50% 50%' });
        gsap.set(hero1Container, { transformOrigin: '50% 50%', scale: 1, autoAlpha: 1 });
        if (hero1IntroTop) gsap.set(hero1IntroTop, { xPercent: 0, yPercent: 0 });
        if (hero1IntroBottom) gsap.set(hero1IntroBottom, { xPercent: 0, yPercent: 0 });
        if (hero1HeadlineRight) gsap.set(hero1HeadlineRight, { xPercent: 0, yPercent: 0 });
        if (hero1Subtitle) gsap.set(hero1Subtitle, { x: 0, yPercent: 0 });
        if (siteLogo) {
            gsap.set(siteLogo, {
                left: '50%',
                top: '50%',
                xPercent: -50,
                yPercent: -50
            });
        }
        if (vignette) gsap.set(vignette, { opacity: 0 });
        gsap.set(hero1, { opacity: 1 });
        if (hero1Bg) gsap.set(hero1Bg, { opacity: 1 });

        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const endDistance = isMobile ? '+=230%' : '+=185%';

        // Text should zoom and drift away from center (exit through edges)
        const textOut = {
            topX: isMobile ? -14 : -26,
            topY: isMobile ? -18 : -34,
            bottomX: isMobile ? 16 : 30,
            bottomY: isMobile ? 18 : 32,
            rightX: isMobile ? 16 : 30,
            subtitleX: isMobile ? -120 : -220
        };

        // Final dock (slightly bigger and a bit lower from the very top)
        const logoTargetTop = isMobile ? 24 : 28;
        const logoTargetScale = isMobile ? 0.46 : 0.40;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: hero1,
                start: 'top top',
                end: endDistance,
                // Numeric scrub adds subtle catch-up (feels less "seco" without hijacking scroll)
                scrub: isMobile ? 0.9 : 1.05,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true
            }
        });

        // Hold
        tl.to({}, { duration: 0.12 });

                // Phase 1: REAL zoom (stable) until the frame edges leave the viewport
                tl.addLabel('zoom');

                // Logo motion is controlled by this SAME timeline (single source of truth)
                // and synchronized exactly with the zoom phase.
                if (siteLogo) {
                    tl.to(siteLogo, {
                        top: `${logoTargetTop}px`,
                        scale: logoTargetScale,
                        yPercent: 0,
                        duration: 0.70,
                        ease: 'none'
                    }, 'zoom');
                }

                tl
                    .to(scene, {
                            scale: isMobile ? 2.85 : 2.7,
                            duration: 0.70,
                            ease: 'none'
                    }, 'zoom')
                    .to(cloudsLayer, { yPercent: -6, duration: 0.70, ease: 'none' }, 'zoom')
                    // Keep text sharp: it should zoom with the window (no blur)
                    .to(hero1Container, {
                        scale: isMobile ? 2.85 : 2.7,
                        duration: 0.70,
                        ease: 'none'
                    }, 'zoom');

                if (hero1IntroTop) {
                    tl.to(hero1IntroTop, {
                        xPercent: textOut.topX,
                        yPercent: textOut.topY,
                        duration: 0.70,
                        ease: 'none'
                    }, 'zoom');
                }

                if (hero1IntroBottom) {
                    tl.to(hero1IntroBottom, {
                        xPercent: textOut.bottomX,
                        yPercent: textOut.bottomY,
                        duration: 0.70,
                        ease: 'none'
                    }, 'zoom');
                }

                if (hero1Subtitle) {
                    tl.to(hero1Subtitle, {
                        x: textOut.subtitleX,
                        duration: 0.70,
                        ease: 'none'
                    }, 'zoom');
                }

                if (hero1HeadlineRight) {
                    tl.to(hero1HeadlineRight, {
                        xPercent: textOut.rightX,
                        duration: 0.70,
                        ease: 'none'
                    }, 'zoom');
                }

                // Phase 2: only AFTER zoom, hide the frame (we "passed through")
                tl.addLabel('cross')
                    .to(frame, { autoAlpha: 0, duration: 0.16, ease: 'none' }, 'cross')
                    .to(portal, { filter: 'blur(0px)', duration: 0.16, ease: 'none' }, 'cross')
                    // Fade text out only when we cross the frame
                    .to(hero1Container, { autoAlpha: 0, duration: 0.18, ease: 'none' }, 'cross');

                // Phase 3: look down / descend (after we are inside)
                tl.addLabel('down')
                    .to(scene, {
                            rotateX: 16,
                            y: 240,
                            scale: isMobile ? 3.25 : 3.6,
                            duration: 0.65,
                            ease: 'none'
                    }, 'down')
                    .to(portal, {
                            yPercent: -18,
                            duration: 0.65,
                            ease: 'none'
                    }, 'down');

                tl.to(cloudsLayer, { yPercent: -18, duration: 0.65, ease: 'none' }, 'down');

                if (vignette) tl.to(vignette, { opacity: 1, duration: 0.40, ease: 'none' }, 'down');

                // Reveal Hero 2 text while the portal/bg is still visible
                tl.addLabel('preReveal')
                    .to(hero1, { opacity: 0.65, duration: 0.22, ease: 'none' }, 'down+=0.38')
                    .add(() => {
                        const nextHero = document.querySelector('.hero[data-hero="2"]');
                        // No intro animation on Hero 2: keep content visible immediately.
                        if (nextHero && nextHero.dataset.revealed !== '1') {
                            setHeroRevealImmediate(nextHero);
                        }
                    }, 'down+=0.40');

                // Phase 4: reveal next section underneath while still pinned
                tl.addLabel('revealNext')
                    .to([scene, hero1Bg].filter(Boolean), { autoAlpha: 0, duration: 0.20, ease: 'none' }, 'revealNext')
                    .to(hero1, { opacity: 0, duration: 0.20, ease: 'none' }, 'revealNext');

        // Clean state when scrolling back
        tl.eventCallback('onReverseComplete', () => {
            gsap.set(frame, { autoAlpha: 1, scale: 1 });
            gsap.set(portal, { scale: 1, yPercent: 0, filter: 'blur(0px)' });
            gsap.set(scene, { scale: 1, rotateX: 0, y: 0, autoAlpha: 1 });
            if (cloudsLayer) gsap.set(cloudsLayer, { yPercent: 0 });
            gsap.set(hero1Container, { scale: 1, yPercent: 0, autoAlpha: 1 });
            if (hero1IntroTop) gsap.set(hero1IntroTop, { xPercent: 0, yPercent: 0 });
            if (hero1IntroBottom) gsap.set(hero1IntroBottom, { xPercent: 0, yPercent: 0 });
            if (hero1HeadlineRight) gsap.set(hero1HeadlineRight, { xPercent: 0, yPercent: 0 });
            if (hero1Subtitle) gsap.set(hero1Subtitle, { x: 0, yPercent: 0 });
            if (siteLogo) gsap.set(siteLogo, { top: '50%', left: '50%', xPercent: -50, yPercent: -50, scale: 1 });
            if (vignette) gsap.set(vignette, { opacity: 0 });
            if (hero1Bg) gsap.set(hero1Bg, { opacity: 1, autoAlpha: 1 });
            gsap.set(hero1, { opacity: 1 });
        });
    }

    function initHeroSecondaryReveal() {
        const hero2 = document.querySelector('.hero[data-hero="2"]');
        if (!hero2) return;

        // Requirement: remove the intro animation on the second fold (Hero 2).
        // Keep only the exit animation (handled in the transition to Session 2).
        setHeroRevealImmediate(hero2);
    }

    function setHeroRevealImmediate(heroRoot) {
        if (!heroRoot) return;

        heroRoot.dataset.revealed = '1';

        const chars = heroRoot.querySelectorAll('.char');
        const subtitle = heroRoot.querySelectorAll('.hero-subtitle');
        const actions = heroRoot.querySelectorAll('.hero-actions');

        if (chars.length) gsap.set(chars, { y: 0 });
        gsap.set([...subtitle, ...actions], { opacity: 1, y: 0 });
    }

    // --- C2. Session Transition (Hero -> Session 2) ---
    function initSessionTransition() {
        const hero = document.querySelector('.hero[data-hero="2"]');
        if (!hero) return;

        const heroContainer = hero.querySelector('.hero-container');
        const heroBg = hero.querySelector('.hero-bg');
        const flyer = hero.querySelector('.transition-flyer');
        const session2 = document.querySelector('.session-2');
        const session2Inner = document.querySelector('.session2-container');

        if (!heroContainer || !session2 || !session2Inner) return;

        // Guarantee starfield stays present during the whole transition.
        // (Some moments were going fully black when the bg layer faded out.)
        gsap.set(hero, {
            backgroundColor: '#000',
            backgroundImage: 'var(--starfield-layers)',
            backgroundSize: 'var(--starfield-sizes)',
            backgroundPosition: 'var(--starfield-positions)',
            backgroundRepeat: 'var(--starfield-repeats)'
        });

        // Prepare 3D feel (subtle)
        gsap.set(heroContainer, {
            transformPerspective: 1000,
            transformStyle: 'preserve-3d'
        });

        // Session 2 base state (visible but "in the distance")
        // The dedicated Session 2 timeline will handle the immersive intro/outro.
        gsap.set(session2Inner, { autoAlpha: 1, y: 120, scale: 1.12, rotateX: 18, rotateY: -10, z: -260, filter: 'blur(18px)' });

        const isMobile = window.matchMedia('(max-width: 768px)').matches;

        const getFlyerWidth = () => (flyer ? Math.max(1, flyer.getBoundingClientRect().width) : 1);
        const getFlyerStartX = () => -(window.innerWidth / 2 + getFlyerWidth() / 2 + 80);
        const getFlyerEndX = () => (window.innerWidth / 2 + getFlyerWidth() / 2 + 80);

        if (flyer) {
            // Start off-screen on the LEFT (relative to center) and travel to the RIGHT
            gsap.set(flyer, { x: getFlyerStartX, y: 0, autoAlpha: 0, rotate: isMobile ? 0 : -4 });
        }

        // Shorter transition between Session 1 and 2
        const transitionEnd = isMobile ? '+=98%' : '+=66%';
        const scrubValue = isMobile ? 0.95 : true; // smooth out mobile scroll jumps
        const flyerCrossDuration = isMobile ? 0.85 : 0.55;
        const flyerFadeDuration = isMobile ? 0.14 : 0.10;
        const session2Parts = gsap.utils.toArray('.session2-container .section-tag, .session2-title, .session2-text, .session2-container .btn');

        // Pin hero and animate it receding into the background
        // Requirement: PNG crosses when blur starts, and BEFORE session 2 begins to appear.
        const heroToSessionTl = gsap.timeline({
            scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: transitionEnd,
                scrub: scrubValue,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true
            }
        });

        // 1) Hold (no visible changes) for the first part of the scroll
        heroToSessionTl.to({}, { duration: 0.04 });

        // 2) Start blur/recede
        heroToSessionTl
            .to(heroContainer, {
                scale: 0.72,
                z: -380,
                rotateX: 10,
                filter: 'blur(14px)',
                autoAlpha: 0.15,
                yPercent: -8,
                duration: 0.55,
                ease: 'none'
            }, 'blurStart')
            .to(heroBg, {
                // Keep stars visible (do not fade to pure black)
                opacity: 1,
                duration: 0.55,
                ease: 'none'
            }, 'blurStart')
            .to(hero, {
                backgroundColor: 'rgba(0, 0, 0, 1)',
                duration: 0.55,
                ease: 'none'
            }, 'blurStart');

        // 3) PNG crosses RIGHT WHEN blur starts (and finishes before session 2 reveal)
        if (flyer) {
            heroToSessionTl
                // Pop in right as blur starts
                .to(flyer, { autoAlpha: 1, duration: 0.02, ease: 'none' }, 'blurStart')
                // Cross the entire viewport (left -> right)
                .to(flyer, {
                    x: getFlyerEndX,
                    rotate: isMobile ? 0 : 4,
                    duration: flyerCrossDuration,
                    ease: 'none'
                }, 'blurStart')
                // Fade out only after it has already passed the right side
                .to(flyer, { autoAlpha: 0, duration: flyerFadeDuration, ease: 'none' }, `blurStart+=${flyerCrossDuration}`);
        }

            // 4) Subtle pre-reveal to remove dead-scroll feel before Session 2 pin takes over
            // Use .session2-anim-item instead of hardcoded specific classes
            const session2AnimItems = gsap.utils.toArray('.session2-anim-item');

            heroToSessionTl.to(session2Inner, {
                y: isMobile ? 72 : 78,
                scale: isMobile ? 1.08 : 1.07,
                rotateX: isMobile ? 11 : 13,
                rotateY: isMobile ? -5 : -7,
                z: isMobile ? -130 : -190,
                filter: 'blur(8px)',
                duration: 0.30,
                ease: 'none'
            }, `blurStart+=${Math.max(0.14, flyerCrossDuration * 0.58)}`)
            .to(session2AnimItems, {
                autoAlpha: 0.72,
                y: 10,
                duration: 0.24,
                stagger: 0.03,
                ease: 'none'
            }, `blurStart+=${Math.max(0.16, flyerCrossDuration * 0.62)}`);

        // Reset positions if user scrolls back up
        heroToSessionTl.eventCallback('onReverseComplete', () => {
            if (flyer) gsap.set(flyer, { x: getFlyerStartX, y: 0, autoAlpha: 0, rotate: isMobile ? 0 : -4 });
            gsap.set(session2Inner, { autoAlpha: 1, y: 120, scale: 1.12, rotateX: 18, rotateY: -10, z: -260, filter: 'blur(18px)' });
            gsap.set(session2AnimItems, { autoAlpha: 0, y: 34 });
        });

    }

    // --- C3. Session 2 Immersive Intro/Outro ---
    function initSession2Immersive() {
        const section = document.querySelector('.session-2');
        const inner = document.querySelector('.session2-container');
        const vignette = document.querySelector('.session2-vignette');
        // Add animated light
        const cinematicLight = document.querySelector('.session2-cinematic-light');

        if (!section || !inner) return;

        // Select the new semantic elements
        const parts = gsap.utils.toArray('.session2-anim-item');

        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const pinEnd = isMobile ? '+=128%' : '+=108%';
        const scrubValue = isMobile ? 0.95 : 0.65;


        // Start state: "portal" depth
        gsap.set(section, { transformPerspective: 1200 });
        gsap.set(inner, { transformStyle: 'preserve-3d', transformOrigin: '50% 55%' });

        const introRotateX = isMobile ? 14 : 20;
        const introRotateY = isMobile ? -6 : -12;
        const introZ = isMobile ? -180 : -320;
        const outroRotateX = isMobile ? -10 : -16;
        const outroZ = isMobile ? -260 : -420;

        // Ensure a consistent base (in case the user lands here)
        gsap.set(inner, { y: 120, scale: 1.12, rotateX: introRotateX, rotateY: introRotateY, z: introZ, filter: 'blur(18px)' });
        gsap.set(parts, { autoAlpha: 0, y: 34 });
        if (vignette) gsap.set(vignette, { opacity: 0 });
        if (cinematicLight) gsap.set(cinematicLight, { opacity: 0, scale: 0.92 });

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: 'top top',
                end: pinEnd,
                scrub: scrubValue,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true
            }
        });

        // Session 2 background must stay pure black + stars (no glow/vignette)

        tl.to(inner, {
            y: 0,
            scale: 1,
            rotateX: 0,
            rotateY: 0,
            z: 0,
            filter: 'blur(0px)',
            duration: 0.55,
            ease: 'none'
        }, 0)
        .to(parts, {
            autoAlpha: 1,
            y: 0,
            duration: 0.28,
            stagger: 0.07,
            ease: 'none'
        }, 0.12);

        // Cinematic Light (bem leve): fade in junto com o conteúdo
        if (cinematicLight) {
            tl.to(cinematicLight, {
                opacity: 0.35,
                scale: 1,
                duration: 0.38,
                ease: 'none'
            }, 0.12);
        }

        // --- Number Counting Animations ---
        // Important: counters must NOT be tied to the scrubbed timeline.
        // Otherwise they can remain at 0 when the scroll settles mid-progress.
        const salaryEl = inner.querySelector('.session2-salary-value');
        const statEls = Array.from(inner.querySelectorAll('.session2-stat-value'));

        // Cache end values once (so they don't get lost if we set text to 0)
        const getEndInt = (el) => {
            const fromDataset = el?.dataset?.count;
            if (fromDataset != null && fromDataset !== '') {
                const n = parseInt(fromDataset, 10);
                return Number.isFinite(n) ? n : 0;
            }
            const n = parseInt(String(el?.innerText || '').replace(/\D/g, ''), 10);
            return Number.isFinite(n) ? n : 0;
        };

        const parseBrlToNumber = (el) => {
            const fromDataset = el?.dataset?.count;
            if (fromDataset != null && fromDataset !== '') {
                const n = Number(fromDataset);
                return Number.isFinite(n) ? n : 0;
            }
            const raw = String(el?.innerText || '');
            const cleaned = raw.replace(/[^0-9,.-]/g, '').trim();
            if (!cleaned) return 0;
            // pt-BR: thousands '.' and decimals ','
            const normalized = cleaned.replace(/\./g, '').replace(',', '.');
            const n = parseFloat(normalized);
            return Number.isFinite(n) ? n : 0;
        };

        const salaryEnd = salaryEl ? parseBrlToNumber(salaryEl) : 0;
        const statsEnd = statEls.map((el) => getEndInt(el));

        const setFinalValues = () => {
            if (salaryEl) {
                salaryEl.innerText = salaryEnd.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
            statEls.forEach((el, i) => {
                el.innerText = String(statsEnd[i] ?? 0);
            });
        };

        const runCountUp = () => {
            try {
                if (prefersReducedMotion) {
                    setFinalValues();
                    return;
                }

                // Start from 0 visually
                if (salaryEl) salaryEl.innerText = (0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                statEls.forEach((el) => { el.innerText = '0'; });

                // Salary count-up
                if (salaryEl) {
                    const currencyProxy = { val: 0 };
                    gsap.to(currencyProxy, {
                        val: salaryEnd,
                        duration: 0.95,
                        ease: 'power2.out',
                        onUpdate: () => {
                            salaryEl.innerText = currencyProxy.val.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                            });
                        },
                        onComplete: () => {
                            salaryEl.innerText = salaryEnd.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                        }
                    });
                }

                // Stats count-up (same style / totals from the print)
                statEls.forEach((el, i) => {
                    const statProxy = { val: 0 };
                    const endVal = statsEnd[i] ?? 0;
                    gsap.to(statProxy, {
                        val: endVal,
                        duration: 0.95,
                        ease: 'power2.out',
                        delay: 0.08 + (i * 0.07),
                        onUpdate: () => {
                            el.innerText = String(Math.floor(statProxy.val));
                        },
                        onComplete: () => {
                            el.innerText = String(endVal);
                        }
                    });
                });

                // Absolute fallback: never leave zeros on screen
                gsap.delayedCall(1.3, setFinalValues);
            } catch (e) {
                setFinalValues();
            }
        };

        // Trigger via the pinned timeline (reliable with pin + scrub)
        tl.call(runCountUp, [], 0.22);

                // Hold (no extra animation after it settles)
                tl.to({}, { duration: 0.18 });

        // Immersive outro: content recedes into darkness
        tl.addLabel('out')
                    .to(parts, { autoAlpha: 0, y: -10, duration: 0.30, stagger: 0.03, ease: 'none' }, 'out')
                    .to(cinematicLight, { opacity: 0, scale: 0.92, duration: 0.30, ease: 'none' }, 'out')
          .to(inner, {
              y: -70,
              scale: 0.90,
              rotateX: outroRotateX,
              rotateY: 6,
              z: outroZ,
              filter: 'blur(14px)',
              duration: 0.55,
              ease: 'none'
          }, 'out')

                    .to(section, { backgroundColor: 'rgba(0, 0, 0, 1)', duration: 0.55, ease: 'none' }, 'out');
    }

    function playHeroReveal() {
        // Back-compat: if called with no arg, reveal the first hero
        const heroRoot = arguments.length ? arguments[0] : document.querySelector('.hero');
        if (!heroRoot) return;

        heroRoot.dataset.revealed = '1';

        const chars = heroRoot.querySelectorAll('.char');
        const subtitle = heroRoot.querySelectorAll('.hero-subtitle');
        const actions = heroRoot.querySelectorAll('.hero-actions');

        gsap.set([...subtitle, ...actions], { opacity: 0, y: 18 });

        const tl = gsap.timeline();

        // Reveal Title Chars
        if (chars.length) {
            tl.to(chars, {
                y: 0,
                duration: 1,
                stagger: 0.02,
                ease: 'power4.out'
            });
        }

        // Reveal Subtitle & Buttons
        tl.to([...subtitle, ...actions], {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.2,
            ease: 'power2.out'
        }, chars.length ? '-=0.5' : 0);
    }

    // --- D. Storytelling (Scroll) ---
    function initScrollStory() {
        const sections = gsap.utils.toArray(".story-step");
        if (!sections.length) return;

        let activeIndex = -1;
        gsap.set(sections, { opacity: 0.2 });
        
        // Pin the section
        ScrollTrigger.create({
            trigger: ".about",
            start: "top top",
            end: "+=200%", // Pin for 200% viewport height
            pin: true,
            scrub: 1,
            // Determine active step based on scroll progress
            onUpdate: (self) => {
                const index = Math.min(
                    Math.floor(self.progress * sections.length), 
                    sections.length - 1
                );

                if (index === activeIndex || !sections[index]) return;

                if (activeIndex >= 0 && sections[activeIndex]) {
                    sections[activeIndex].classList.remove('active');
                    gsap.to(sections[activeIndex], { opacity: 0.2, duration: 0.25, overwrite: true });
                }

                activeIndex = index;
                sections[activeIndex].classList.add('active');
                gsap.to(sections[activeIndex], { opacity: 1, duration: 0.25, overwrite: true });
            }
        });
    }

    // --- E. Services (Cards Reveal) ---
    function initServices() {
        const section = document.querySelector('#cursos');
        if (!section) return;

        const cards = gsap.utils.toArray('#cursos [data-arsenal-card]');
        if (!cards.length) return;

        const isDesktop = window.matchMedia('(min-width: 901px)').matches;

        // Mobile/tablet: layout em lista + reveal leve (sem pin)
        if (!isDesktop) {
            cards.forEach((card, i) => {
                gsap.fromTo(card,
                    { opacity: 0, y: 18 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.65,
                        delay: i * 0.06,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: card,
                            start: "top 88%",
                            toggleActions: "play none none reverse"
                        }
                    }
                );
            });
            return;
        }

        // Desktop: coreografia substitutiva (um card por vez), com blur + empurrão
        gsap.set(cards, {
            opacity: 0,
            x: 120,
            y: 70,
            rotate: 1.2,
            scale: 0.985,
            filter: 'blur(18px)'
        });

        gsap.set(cards[0], {
            opacity: 1,
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
            filter: 'blur(0px)'
        });

        const tl = gsap.timeline({
            defaults: { ease: "power2.out" }
        });

        for (let i = 1; i < cards.length; i++) {
            const prev = cards[i - 1];
            const cur = cards[i];

            tl.to(prev, {
                opacity: 0,
                x: -180,
                y: -90,
                rotate: -2,
                scale: 0.98,
                filter: 'blur(22px)',
                duration: 0.55
            }, '+=0.35');

            tl.to(cur, {
                opacity: 1,
                x: 0,
                y: 0,
                rotate: 0,
                scale: 1,
                filter: 'blur(0px)',
                duration: 0.65
            }, '<0.06');
        }

        ScrollTrigger.create({
            trigger: section,
            start: "top top",
            end: () => `+=${Math.max(1, cards.length) * 120}%`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            animation: tl
        });
    }

    // --- F. Horizontal Scroll ---
    function initHorizontalScroll() {
        const wrapper = document.querySelector(".showcase-wrapper");
        if (!wrapper) return;

        function getOverflow() {
            return Math.max(0, wrapper.scrollWidth - window.innerWidth);
        }

        if (getOverflow() <= 0) {
            gsap.set(wrapper, { x: 0 });
            return;
        }

        const tween = gsap.to(wrapper, {
            x: () => -getOverflow(),
            duration: 3,
            ease: "none",
        });

        ScrollTrigger.create({
            trigger: ".showcase",
            start: "top top",
            end: () => `+=${getOverflow()}`,
            pin: true,
            animation: tween,
            scrub: 1,
            invalidateOnRefresh: true,
            markers: false
        });
    }

    // --- G. Flip Layout ---
    function initFlipLayout() {
        const toggleBtn = document.querySelector("#layout-toggle");
        const container = document.querySelector(".projects-container");
        const items = gsap.utils.toArray(".project-item");
        
        if(!toggleBtn || !container) return;

        let isGrid = true;
        
        toggleBtn.addEventListener('click', () => {
            // Get state
            const state = Flip.getState(items);
            
            // Toggle classes
            isGrid = !isGrid;
            container.classList.toggle("grid-view", isGrid);
            container.classList.toggle("list-view", !isGrid);
            
            // Animate
            Flip.from(state, {
                duration: 0.7,
                ease: "power2.inOut",
                stagger: 0.05,
                onEnter: elements => gsap.fromTo(elements, {opacity: 0, scale: 0}, {opacity: 1, scale: 1, duration: 1}),
                onLeave: elements => gsap.to(elements, {opacity: 0, scale: 0, duration: 1})
            });
            
            // Refresh ScrollTrigger since layout changed height
            ScrollTrigger.refresh();
        });
    }

    // --- H. Testimonials ---
    function initTestimonials() {
        // Intencionalmente sem animação.
        // O pedido atual é aplicar efeitos GSAP apenas na última dobra (CTA).
        return;
    }

    // --- H2. Final CTA ---
    function initFinalCta() {
        const section = document.querySelector('#contact.cta-final');
        if (!section) return;

        // Hide top logo when entering the final section (mobile + desktop)
        const siteLogo = document.querySelector('.site-logo');
        if (siteLogo) {
            const setLogoHidden = (hidden) => {
                if (prefersReducedMotion) {
                    gsap.set(siteLogo, { autoAlpha: hidden ? 0 : 1 });
                    return;
                }

                gsap.to(siteLogo, {
                    autoAlpha: hidden ? 0 : 1,
                    duration: 0.25,
                    ease: 'power2.out',
                    overwrite: true
                });
            };

            ScrollTrigger.create({
                trigger: section,
                start: 'top 70%',
                end: 'bottom top',
                onEnter: () => setLogoHidden(true),
                onEnterBack: () => setLogoHidden(true),
                onLeaveBack: () => setLogoHidden(false)
            });
        }

        if (prefersReducedMotion) return;

        const content = section.querySelector('.cta-content');
        const title = section.querySelector('.cta-title');
        const text = section.querySelector('.cta-text');
        const button = section.querySelector('.btn');
        if (!content || !title || !text || !button) return;

        const titleChars = title.querySelectorAll('.char');

        // Split effect only on title; other elements are simple fades.
        if (titleChars.length) {
            gsap.set(titleChars, { autoAlpha: 0, x: -70, y: 0 });
        } else {
            gsap.set(title, { autoAlpha: 0, x: -40, y: 0 });
        }
        gsap.set([text, button], { autoAlpha: 0, y: 14 });
        gsap.set(content, { autoAlpha: 1 });

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: 'top 75%',
                toggleActions: 'play none none reverse'
            }
        });

        // 1) Title appears big and horizontal (left -> right)
        if (titleChars.length) {
            tl.to(titleChars, {
                autoAlpha: 1,
                x: 0,
                duration: 0.9,
                stagger: 0.02,
                ease: 'power4.out'
            }, 0);
        } else {
            tl.to(title, { autoAlpha: 1, x: 0, duration: 0.75, ease: 'power4.out' }, 0);
        }

        // 2) Supporting text
        tl.to(text, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out' }, 0.55);

        // 3) CTA button after
        tl.to(button, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out' }, 0.78);
    }

    // --- I. Magnetic Buttons & Smooth Scroll ---
    function initMagneticButtons() {
        const buttons = document.querySelectorAll('.magnetic');
        const canUsePointerHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

        if (!buttons.length || prefersReducedMotion || !canUsePointerHover) return;
        
        buttons.forEach(btn => {
            const setX = gsap.quickTo(btn, 'x', { duration: 0.24, ease: 'power2.out' });
            const setY = gsap.quickTo(btn, 'y', { duration: 0.24, ease: 'power2.out' });

            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                setX(x * 0.3);
                setY(y * 0.3);
            }, { passive: true });
            
            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
            });
        });
    }

    function initSmoothScrollAnchors() {
        let activeScrollTween = null;

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                
                if(targetId === '#') return;

                const targetEl = document.querySelector(targetId);
                if (!targetEl) return;

                e.preventDefault();

                if (activeScrollTween) activeScrollTween.kill();
                
                activeScrollTween = gsap.to(window, {
                    duration: 1.5,
                    scrollTo: {
                        y: targetId,
                        offsetY: 70 // Header offset
                    },
                    ease: "power4.inOut",
                    onComplete: () => { activeScrollTween = null; },
                    onInterrupt: () => { activeScrollTween = null; }
                });
            });
        });
    }

        // Start
        init();
        window.clearTimeout(loaderFailsafe);
    } catch (err) {
        console.error('Erro ao inicializar animações/GSAP:', err);
        // Let the failsafe hide the loader, but do it ASAP too.
        if (preloaderEl) {
            preloaderEl.style.transform = 'translateY(-100%)';
            preloaderEl.style.transition = 'transform 0.8s ease';
        }
    }
});