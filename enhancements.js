(function () {
    const SECTION_SELECTOR = "#main-content > section";
    const MOTION_SELECTOR = [
        ".intro-content",
        ".resume-button",
        ".thm-banner",
        ".profile-photo",
        ".about-text",
        ".about-tab",
        ".about-panel",
        ".tech-card",
        ".service-card",
        ".job-card",
        ".company-card",
        ".feature-item",
        ".features-image",
        ".cert-shell",
        ".cert-card",
        ".contact-item",
        ".contact-photo"
    ].join(", ");

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function init() {
        document.body.classList.add("js-ready");
        stampMotionItems();
        initScrollProgress();
        initSectionObserver();
        initMobileNav();
        createBackdropCanvas();
    }

    function stampMotionItems() {
        const sections = Array.from(document.querySelectorAll(SECTION_SELECTOR));

        sections.forEach((section) => {
            const seen = new Set();
            const items = Array.from(section.querySelectorAll(MOTION_SELECTOR)).filter((item) => {
                if (seen.has(item)) return false;
                seen.add(item);
                return true;
            });

            items.forEach((item, index) => {
                item.classList.add("motion-item");
                item.style.setProperty("--stagger-index", String(index));
            });
        });
    }

    function initMobileNav() {
        const nav = document.querySelector(".main-nav");
        const toggleBtn = document.querySelector(".mobile-nav-toggle");
        const navLinks = document.querySelectorAll(".nav-link");

        if (toggleBtn && nav) {
            toggleBtn.addEventListener("click", () => {
                nav.classList.toggle("menu-open");
            });
        }

        // Close menu when a link is clicked
        navLinks.forEach(link => {
            link.addEventListener("click", () => {
                if (nav && nav.classList.contains("menu-open")) {
                    nav.classList.remove("menu-open");
                }
            });
        });
    }

    function initScrollProgress() {
        const nav = document.querySelector(".main-nav");

        function update() {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const ratio = max > 0 ? window.scrollY / max : 0;
            document.body.style.setProperty("--scroll-progress", (ratio * 100).toFixed(2) + "%");
            if (nav) {
                nav.classList.toggle("is-scrolled", window.scrollY > 12);
            }
        }

        update();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
    }

    function initSectionObserver() {
        const sections = Array.from(document.querySelectorAll(SECTION_SELECTOR));
        const navLinks = Array.from(document.querySelectorAll(".nav-link"));
        if (!sections.length) return;

        const ratios = new Map();

        sections.forEach((section) => {
            section.classList.add("reveal-section", "out-view");
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                ratios.set(entry.target.id, entry.intersectionRatio);
                const active = entry.intersectionRatio >= 0.28;
                entry.target.classList.toggle("in-view", active);
                entry.target.classList.toggle("out-view", !active);
            });

            let bestId = sections[0].id;
            let bestRatio = 0;

            sections.forEach((section) => {
                const ratio = ratios.get(section.id) || 0;
                if (ratio > bestRatio) {
                    bestRatio = ratio;
                    bestId = section.id;
                }
            });

            navLinks.forEach((link) => {
                link.classList.toggle("active", link.getAttribute("href") === "#" + bestId);
            });
        }, {
            threshold: [0, 0.12, 0.28, 0.5, 0.72],
            rootMargin: "-8% 0px -14% 0px"
        });

        sections.forEach((section) => observer.observe(section));
    }

    function createBackdropCanvas() {
        const container = document.querySelector(".portfolio-container");
        if (!container || container.querySelector(".cyber-backdrop")) return;

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.className = "cyber-backdrop";
        canvas.setAttribute("aria-hidden", "true");
        container.insertBefore(canvas, container.firstChild);

        let width = 0;
        let height = 0;
        let dpr = 1;
        let animationFrame = 0;
        const nodeCount = 40; // Increased from 18 to 40 for a denser network
        const connectionDistance = 220;
        const nodes = [];

        const mouse = {
            x: null,
            y: null,
            radius: 250
        };

        window.addEventListener("mousemove", (event) => {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        });

        window.addEventListener("mouseout", () => {
            mouse.x = null;
            mouse.y = null;
        });

        function seedNodes() {
            nodes.length = 0;
            for (let index = 0; index < nodeCount; index += 1) {
                nodes.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.28,
                    vy: (Math.random() - 0.5) * 0.28,
                    pulse: Math.random() * Math.PI * 2
                });
            }
        }

        function resize() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = width + "px";
            canvas.style.height = height + "px";
            context.setTransform(dpr, 0, 0, dpr, 0, 0);
            seedNodes();
        }

        function draw(time) {
            context.clearRect(0, 0, width, height);

            const bloom = context.createRadialGradient(width * 0.8, height * 0.15, 0, width * 0.8, height * 0.15, width * 0.55);
            bloom.addColorStop(0, "rgba(180, 0, 255, 0.18)");
            bloom.addColorStop(1, "rgba(180, 0, 255, 0)");
            context.fillStyle = bloom;
            context.fillRect(0, 0, width, height);

            for (let i = 0; i < nodes.length; i += 1) {
                const node = nodes[i];
                node.x += node.vx;
                node.y += node.vy;
                node.pulse += 0.015;

                if (node.x <= 0 || node.x >= width) node.vx *= -1;
                if (node.y <= 0 || node.y >= height) node.vy *= -1;

                if (mouse.x !== null && mouse.y !== null) {
                    const dx = node.x - mouse.x;
                    const dy = node.y - mouse.y;
                    const distance = Math.hypot(dx, dy);

                    if (distance < mouse.radius) {
                        const alpha = 1 - distance / mouse.radius;
                        context.strokeStyle = "rgba(180, 0, 255, " + (alpha * 0.6).toFixed(3) + ")";
                        context.lineWidth = 1.5;
                        context.beginPath();
                        context.moveTo(node.x, node.y);
                        context.lineTo(mouse.x, mouse.y);
                        context.stroke();

                        // Repulse nodes away from the mouse like a collision
                        if (distance > 0) {
                            const force = (mouse.radius - distance) / mouse.radius;
                            const pushStrength = 5.0; // How hard the mouse pushes nodes away
                            node.x += (dx / distance) * force * pushStrength;
                            node.y += (dy / distance) * force * pushStrength;

                            // Prevent nodes from being pushed completely off-screen
                            if (node.x < 0) node.x = 0;
                            if (node.x > width) node.x = width;
                            if (node.y < 0) node.y = 0;
                            if (node.y > height) node.y = height;
                        }
                    }
                }

                for (let j = i + 1; j < nodes.length; j += 1) {
                    const other = nodes[j];
                    const dx = node.x - other.x;
                    const dy = node.y - other.y;
                    const distance = Math.hypot(dx, dy);

                    if (distance > connectionDistance) continue;

                    const alpha = 1 - distance / connectionDistance;
                    context.strokeStyle = "rgba(180, 0, 255, " + (alpha * 0.4).toFixed(3) + ")"; // Lowered opacity
                    context.lineWidth = 1.5; // Slightly thinner lines
                    context.beginPath();
                    context.moveTo(node.x, node.y);
                    context.lineTo(other.x, other.y);
                    context.stroke();
                }

                const radius = 2.0 + Math.sin(node.pulse + time * 0.0012) * 1.0; // Slightly smaller dots
                context.fillStyle = "rgba(214, 166, 255, 0.7)"; // Restored semi-transparent dots
                context.beginPath();
                context.arc(node.x, node.y, radius, 0, Math.PI * 2);
                context.fill();
            }

            animationFrame = window.requestAnimationFrame(draw);
        }

        resize();
        draw(0);
        window.addEventListener("resize", resize);
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                window.cancelAnimationFrame(animationFrame);
                return;
            }
            draw(0);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
