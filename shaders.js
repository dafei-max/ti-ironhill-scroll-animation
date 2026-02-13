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
uniform sampler2D uDisplacement;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  // 采样 displacement 纹理的灰度值用于边缘扰动
  float displacementValue = texture2D(uDisplacement, uv).r;

  // 从下往上溶解: uv.y 越小越先溶解，progress 增加时溶解线从下往上移动
  // displacement 扰动: (displacementValue - 0.5) 使边缘呈有机波浪状
  float dissolveEdge = uProgress - uv.y;
  float d = dissolveEdge + (displacementValue - 0.5) * uSpread;

  float pixelSize = 1.0 / uResolution.y;
  float alpha = 1.0 - smoothstep(-pixelSize, pixelSize, d);

  gl_FragColor = vec4(uColor, alpha);
}
`;