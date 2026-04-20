(function () {
    "use strict";

    const yesBtn = document.getElementById("yesBtn");
    const noBtn = document.getElementById("noBtn");
    const messageEl = document.getElementById("message");
    const titleEl = document.getElementById("title");
    const card = document.getElementById("card");
    const celebration = document.getElementById("celebration");
    const confetti = document.getElementById("confetti");
    const sceneEl = document.getElementById("cuteScene");
    const sceneSlots = sceneEl ? sceneEl.querySelectorAll(".scene-emoji") : [];

    // Each stage has a pleading message and a tiny 3-emoji scene that swaps in.
    const stages = [
        { msg: "Pookie, you sure? 🥺",                     scene: ["🥺", "💕", "🧸"] },
        { msg: "Don't do this to me...",                   scene: ["😟", "💕", "🥀"] },
        { msg: "I'll cry 😭",                              scene: ["😭", "💧", "😭"] },
        { msg: "You'll break my heart 💔",                 scene: ["💔", "🩹", "💔"] },
        { msg: "Please reconsider 🥹",                     scene: ["🥹", "🙏", "🥹"] },
        { msg: "Think of us together 💑",                  scene: ["👫", "💑", "👭"] },
        { msg: "I made this just for you!",                scene: ["🎨", "✨", "💌"] },
        { msg: "I'll give you chocolate 🍫",               scene: ["🍫", "🍬", "🍭"] },
        { msg: "Ice cream too? 🍦",                         scene: ["🍦", "🍨", "🍧"] },
        { msg: "A puppy? I'll get you a puppy 🐶",         scene: ["🐶", "🐾", "🐕"] },
        { msg: "Kitten option also available 🐱",          scene: ["🐱", "🐈", "🐾"] },
        { msg: "Flowers. All the flowers 💐",              scene: ["💐", "🌷", "🌹"] },
        { msg: "I memorized your coffee order ☕",          scene: ["☕", "💗", "🥐"] },
        { msg: "I'll do the dishes. Forever. 🧽",          scene: ["🧽", "🍽️", "✨"] },
        { msg: "I'll stop stealing your fries 🍟",         scene: ["🍟", "🤞", "😇"] },
        { msg: "Okay that last one was a lie 😅",          scene: ["😅", "🍟", "😋"] },
        { msg: "My mom already likes you 👵",              scene: ["👵", "💕", "🫶"] },
        { msg: "I told my friends about us 😳",            scene: ["📱", "💬", "😳"] },
        { msg: "Look how cute I am though 🐰",             scene: ["🐰", "✨", "🥹"] },
        { msg: "Puppy-dog-eyes mode: 🥺🥺🥺",              scene: ["🥺", "🥺", "🥺"] },
        { msg: "Last chance... 🙏",                        scene: ["🙏", "💗", "🙏"] },
        { msg: "I'll love you forever 🌷",                 scene: ["🌷", "💞", "🌷"] },
        { msg: "Pretty please? 💐",                         scene: ["💐", "🥹", "💐"] },
        { msg: "Okay you're stuck with me now 💘",         scene: ["💘", "💖", "💘"] },
        { msg: "Fine, I'll keep asking forever 💕",         scene: ["💖", "💕", "💗"] }
    ];

    const MAX_LEVEL = 10;
    let stageIndex = 0;
    let level = 0;
    let floating = false;

    function setMessage(text) {
        messageEl.classList.remove("flash");
        // Force reflow so the animation can restart.
        void messageEl.offsetWidth;
        messageEl.textContent = text;
        messageEl.classList.add("flash");
    }

    function amplifyYes() {
        for (let i = 1; i <= MAX_LEVEL; i++) {
            yesBtn.classList.remove("yes-lvl-" + i);
        }
        const lvl = Math.min(level, MAX_LEVEL);
        if (lvl > 0) yesBtn.classList.add("yes-lvl-" + lvl);
    }

    function dullNo() {
        // Apply the highest matching even-level class.
        for (let i = 2; i <= MAX_LEVEL; i += 2) {
            noBtn.classList.remove("no-lvl-" + i);
        }
        const stepped = Math.min(level - (level % 2), MAX_LEVEL);
        if (stepped >= 2) noBtn.classList.add("no-lvl-" + stepped);
    }

    function ensureFloating() {
        if (floating) return;
        const rect = noBtn.getBoundingClientRect();
        noBtn.classList.add("floating");
        noBtn.style.left = rect.left + "px";
        noBtn.style.top = rect.top + "px";
        floating = true;
    }

    function pickNewPosition() {
        const rect = noBtn.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        const margin = 12;
        const maxX = Math.max(margin, window.innerWidth - w - margin);
        const maxY = Math.max(margin, window.innerHeight - h - margin);

        // Try to pick a spot at least ~25% of viewport distance from current pos.
        const cx = rect.left;
        const cy = rect.top;
        const minDist = Math.min(window.innerWidth, window.innerHeight) * 0.25;

        let x, y;
        for (let i = 0; i < 12; i++) {
            x = margin + Math.random() * (maxX - margin);
            y = margin + Math.random() * (maxY - margin);
            const dx = x - cx;
            const dy = y - cy;
            if (Math.hypot(dx, dy) >= minDist) break;
        }
        return { x, y };
    }

    function setScene(emojis) {
        if (!emojis || !sceneSlots.length) return;
        sceneSlots.forEach((slot, i) => {
            const next = emojis[i % emojis.length];
            if (slot.textContent === next) return;
            slot.classList.remove("scene-swap");
            void slot.offsetWidth;
            slot.textContent = next;
            slot.classList.add("scene-swap");
        });
    }

    function dodge() {
        ensureFloating();

        const { x, y } = pickNewPosition();
        noBtn.style.left = x + "px";
        noBtn.style.top = y + "px";

        const stage = stages[stageIndex % stages.length];
        setMessage(stage.msg);
        setScene(stage.scene);
        stageIndex++;

        if (level < MAX_LEVEL) level++;
        amplifyYes();
        dullNo();
    }

    // Desktop: dodge on hover/focus.
    noBtn.addEventListener("mouseenter", dodge);
    noBtn.addEventListener("focus", dodge);

    // Mobile: dodge on touch before the tap registers as a click.
    noBtn.addEventListener("touchstart", function (e) {
        e.preventDefault();
        dodge();
    }, { passive: false });

    // Also dodge if finger/pointer just gets near (pointermove within a radius).
    const NEAR_RADIUS = 90;
    document.addEventListener("pointermove", function (e) {
        if (e.pointerType === "mouse") return; // mouseenter already handles this
        const rect = noBtn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        if (Math.hypot(e.clientX - cx, e.clientY - cy) < NEAR_RADIUS) {
            dodge();
        }
    });

    // If the user actually clicks No (unlikely), treat it like a dodge too.
    noBtn.addEventListener("click", function (e) {
        e.preventDefault();
        dodge();
    });

    // Keep the floating No button on-screen when the window resizes.
    window.addEventListener("resize", function () {
        if (!floating) return;
        const rect = noBtn.getBoundingClientRect();
        const margin = 12;
        const maxX = Math.max(margin, window.innerWidth - rect.width - margin);
        const maxY = Math.max(margin, window.innerHeight - rect.height - margin);
        const x = Math.min(Math.max(rect.left, margin), maxX);
        const y = Math.min(Math.max(rect.top, margin), maxY);
        noBtn.style.left = x + "px";
        noBtn.style.top = y + "px";
    });

    // -------- Yes click: celebration --------
    function spawnConfetti() {
        const emojis = ["💖", "💕", "💗", "💝", "💓", "💞", "💘", "❤️"];
        const count = 60;
        const frag = document.createDocumentFragment();
        for (let i = 0; i < count; i++) {
            const h = document.createElement("span");
            h.className = "heart";
            h.textContent = emojis[i % emojis.length];
            h.style.left = Math.random() * 100 + "vw";
            h.style.animationDuration = (3 + Math.random() * 4) + "s";
            h.style.animationDelay = (Math.random() * 3) + "s";
            h.style.fontSize = (1.2 + Math.random() * 1.6) + "rem";
            frag.appendChild(h);
        }
        confetti.appendChild(frag);
    }

    yesBtn.addEventListener("click", function () {
        celebration.classList.remove("hidden");
        celebration.setAttribute("aria-hidden", "false");
        titleEl.textContent = "You said YES! 💖";
        spawnConfetti();
    });
})();
