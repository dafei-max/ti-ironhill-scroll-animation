import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis();
function raf(time) {
  lenis.raf(time);
  ScrollTrigger.update();
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);
lenis.on("scroll", ScrollTrigger.update);

// vh intro: frame animation + scroll-driven nav
function initVhIntro() {
  const vhNav = document.querySelector(".vh-nav");
  const vhCanvas = document.querySelector(".vh-canvas");
  if (!vhCanvas) return;

  const ctx = vhCanvas.getContext("2d");
  const frameCount = 198;
  const currentFrame = (i) => `/vh/frames/Image${i + 1}.jpg`;

  const setCanvasSize = () => {
    const pixelRatio = window.devicePixelRatio || 1;
    vhCanvas.width = window.innerWidth * pixelRatio;
    vhCanvas.height = window.innerHeight * pixelRatio;
    vhCanvas.style.width = window.innerWidth + "px";
    vhCanvas.style.height = window.innerHeight + "px";
    ctx.scale(pixelRatio, pixelRatio);
  };
  setCanvasSize();

  const images = [];
  const videoFrames = { frame: 0 };
  let imagesToLoad = frameCount;

  const onLoad = () => {
    imagesToLoad--;
    if (!imagesToLoad) {
      render();
      setupVhScrollTrigger();
    }
  };

  for (let i = 0; i < frameCount; i++) {
    const img = new Image();
    img.onload = onLoad;
    img.onerror = onLoad;
    img.src = currentFrame(i);
    images.push(img);
  }

  const render = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    const img = images[videoFrames.frame];
    if (img?.complete && img.naturalWidth > 0) {
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = w / h;
      let dw, dh, dx, dy;
      if (imgAspect > canvasAspect) {
        dh = h; dw = dh * imgAspect; dx = (w - dw) / 2; dy = 0;
      } else {
        dw = w; dh = dw / imgAspect; dx = 0; dy = (h - dh) / 2;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
    }
  };

  const setupVhScrollTrigger = () => {
    ScrollTrigger.create({
      trigger: ".vh-hero",
      start: "top top",
      end: `+=${window.innerHeight * 10}px`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onLeave: () => {
        gsap.to(vhNav, { opacity: 1, duration: 0.4, clearProps: "opacity" });
      },
      onEnterBack: () => {
        gsap.set(vhNav, { opacity: 0 });
      },
      onUpdate: (self) => {
        const progress = self.progress;
        videoFrames.frame = Math.round(Math.min(progress, 1) * (frameCount - 1));
        render();

        if (progress <= 0.1) {
          gsap.set(vhNav, { opacity: 1 - progress / 0.1 });
        } else {
          gsap.set(vhNav, { opacity: 0 });
        }
      },
    });
  };

  window.addEventListener("resize", () => {
    setCanvasSize();
    render();
    ScrollTrigger.refresh();
  });
}
initVhIntro();

function initCrossfadeSection() {
  const section = document.querySelector(".crossfade-section");
  const image1 = document.querySelector(".crossfade-image-1");
  const image2 = document.querySelector(".crossfade-image-2");
  if (!section || !image1 || !image2) return;

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: `+=${window.innerHeight * 2}px`,
    pin: true,
    pinSpacing: true,
    scrub: 1,
    onUpdate: (self) => {
      const progress = self.progress;
      gsap.set(image1, { opacity: 1 - progress });
      gsap.set(image2, { opacity: progress });
    },
  });
}

initCrossfadeSection();