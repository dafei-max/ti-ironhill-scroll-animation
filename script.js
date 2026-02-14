import { vertexShader, fragmentShader } from "./shaders";
import displacementUrl from "./displacement.jpg";

import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

const lenis = new Lenis();
function raf(time) {
  lenis.raf(time);
  ScrollTrigger.update();
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);
lenis.on("scroll", ScrollTrigger.update);

// vh intro: frame animation + scroll-driven effects
function initVhIntro() {
  const vhNav = document.querySelector(".vh-nav");
  const vhHeader = document.querySelector(".vh-header");
  const vhHeroImg = document.querySelector(".vh-hero-img");
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
        dh = h;
        dw = dh * imgAspect;
        dx = (w - dw) / 2;
        dy = 0;
      } else {
        dw = w;
        dh = dw / imgAspect;
        dx = 0;
        dy = (h - dh) / 2;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
    }
  };

  const setupVhScrollTrigger = () => {
    ScrollTrigger.create({
      trigger: ".vh-hero",
      start: "top top",
      end: `+=${window.innerHeight * 7}px`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        const animProgress = Math.min(progress / 0.9, 1);
        videoFrames.frame = Math.round(animProgress * (frameCount - 1));
        render();

        if (progress <= 0.1) {
          gsap.set(vhNav, { opacity: 1 - progress / 0.1 });
        } else {
          gsap.set(vhNav, { opacity: 0 });
        }
        if (progress <= 0.25) {
          const zProgress = progress / 0.25;
          let opacity = 1;
          if (progress >= 0.2) {
            opacity = 1 - Math.min((progress - 0.2) / 0.05, 1);
          }
          gsap.set(vhHeader, {
            transform: `translate(-50%, -50%) translateZ(${-zProgress * 500}px)`,
            opacity,
          });
        } else {
          gsap.set(vhHeader, { opacity: 0 });
        }
        if (progress < 0.6) {
          gsap.set(vhHeroImg, { transform: "translateZ(1000px)", opacity: 0 });
        } else if (progress <= 0.9) {
          const imgProgress = (progress - 0.6) / 0.3;
          const translateZ = 1000 - imgProgress * 1000;
          const opacity = progress <= 0.8 ? (progress - 0.6) / 0.2 : 1;
          gsap.set(vhHeroImg, { transform: `translateZ(${translateZ}px)`, opacity });
        } else {
          gsap.set(vhHeroImg, { transform: "translateZ(0px)", opacity: 1 });
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

const CONFIG = {
  color: "#ebf5df",
  spread: 0.5,
  speed: 2,
};

const canvas = document.querySelector(".hero-canvas");
const hero = document.querySelector(".hero");

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: false,
});

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0.89, g: 0.89, b: 0.89 };
}

function resize() {
  const width = hero.offsetWidth;
  const height = hero.offsetHeight;
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

resize();
window.addEventListener("resize", resize);

const rgb = hexToRgb(CONFIG.color);
const geometry = new THREE.PlaneGeometry(2, 2);

const textureLoader = new THREE.TextureLoader();
const displacementTexture = textureLoader.load(displacementUrl);
displacementTexture.wrapS = displacementTexture.wrapT = THREE.RepeatWrapping;

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uProgress: { value: 0 },
    uResolution: {
      value: new THREE.Vector2(hero.offsetWidth, hero.offsetHeight),
    },
    uColor: { value: new THREE.Vector3(rgb.r, rgb.g, rgb.b) },
    uSpread: { value: CONFIG.spread },
    uDisplacement: { value: displacementTexture },
  },
  transparent: true,
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

let scrollProgress = 0;

const heroImg = document.querySelector(".hero .hero-img");
const parallaxTarget = new THREE.Vector2(0, 0);
const parallaxCurrent = new THREE.Vector2(0, 0);
const PARALLAX_STRENGTH = 30;

window.addEventListener("pointermove", (e) => {
  const x = (e.clientX / window.innerWidth) * 2 - 1;
  const y = (e.clientY / window.innerHeight) * 2 - 1;
  parallaxTarget.set(x, -y);
});

function animate() {
  parallaxCurrent.lerp(parallaxTarget, 0.08);
  if (heroImg) {
    heroImg.style.transform = `scale(1.15) translate(${parallaxCurrent.x * PARALLAX_STRENGTH}px, ${parallaxCurrent.y * PARALLAX_STRENGTH}px)`;
  }
  material.uniforms.uProgress.value = scrollProgress;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

lenis.on("scroll", ({ scroll }) => {
  const heroHeight = hero.offsetHeight;
  const windowHeight = window.innerHeight;
  const maxScroll = heroHeight - windowHeight;
  scrollProgress = Math.min((scroll / maxScroll) * CONFIG.speed, 1.1);
});

window.addEventListener("resize", () => {
  material.uniforms.uResolution.value.set(hero.offsetWidth, hero.offsetHeight);
});

const heroH2 = document.querySelector(".hero-content h2");
const split = new SplitText(heroH2, { type: "words" });
const words = split.words;

gsap.set(words, { opacity: 0 });

ScrollTrigger.create({
  trigger: ".hero-content",
  start: "top 25%",
  end: "bottom 100%",
  onUpdate: (self) => {
    const progress = self.progress;
    const totalWords = words.length;

    words.forEach((word, index) => {
      const wordProgress = index / totalWords;
      const nextWordProgress = (index + 1) / totalWords;

      let opacity = 0;

      if (progress >= nextWordProgress) {
        opacity = 1;
      } else if (progress >= wordProgress) {
        const fadeProgress =
          (progress - wordProgress) / (nextWordProgress - wordProgress);
        opacity = fadeProgress;
      }

      gsap.to(word, {
        opacity: opacity,
        duration: 0.1,
        overwrite: true,
      });
    });
  },
});