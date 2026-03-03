import { vertexShader, fragmentShader } from "./shaders";
import displacementUrl from "./displacement.jpg";

import * as THREE from "three";
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
      end: `+=${window.innerHeight * 10}px`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onLeave: () => {
        // restore nav when pin section ends
        gsap.to(vhNav, { opacity: 1, duration: 0.4, clearProps: "opacity" });
      },
      onEnterBack: () => {
        gsap.set(vhNav, { opacity: 0 });
      },
      onUpdate: (self) => {
        const progress = self.progress;
        const animProgress = Math.min(progress / 0.85, 1);
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
        // 溶解从 progress 0.75 开始，横跨 25% 滚动行程，cap 至 1.5 确保完全覆盖
        if (progress >= 0.75) {
          scrollProgress = Math.min((progress - 0.75) / 0.25, 1.5);
        } else {
          scrollProgress = 0;
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

const dissolveCanvas = document.querySelector(".hero-canvas");
const vhHero = document.querySelector(".vh-hero");
if (!dissolveCanvas || !vhHero) throw new Error("Missing dissolve canvas or vh-hero");

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer({
  canvas: dissolveCanvas,
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
  const width = vhHero.offsetWidth;
  const height = vhHero.offsetHeight;
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
      value: new THREE.Vector2(vhHero.offsetWidth, vhHero.offsetHeight),
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

function animate() {
  material.uniforms.uProgress.value = scrollProgress;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
  material.uniforms.uResolution.value.set(vhHero.offsetWidth, vhHero.offsetHeight);
});