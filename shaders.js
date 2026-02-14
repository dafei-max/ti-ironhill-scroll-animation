export const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const fragmentShader = `
uniform float uProgress;
uniform vec2 uResolution;
uniform vec3 uColor;
uniform float uSpread;
uniform vec2 uParallax;
uniform float uParallaxStrength;
uniform sampler2D uDisplacement;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  uv += -uParallax * uParallaxStrength;

  float dissolveEdge = uv.y - uProgress * 1.2;
  float displacementValue = texture2D(uDisplacement, uv).r;
  float d = dissolveEdge + displacementValue * uSpread;

  float pixelSize = 1.0 / uResolution.y;
  float alpha = 1.0 - smoothstep(-pixelSize, pixelSize, d);

  gl_FragColor = vec4(uColor, alpha);
}
`;