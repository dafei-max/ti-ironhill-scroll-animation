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

  // 向上滚动时遮罩从下往上覆盖，图片消失（progress 增加 = 更多区域被遮罩覆盖）
  // displacement 扰动: (displacementValue - 0.5) 使边缘呈有机波浪状
  float dissolveEdge = uv.y - uProgress;
  float d = dissolveEdge + (displacementValue - 0.5) * uSpread;

  float pixelSize = 1.0 / uResolution.y;
  float alpha = 1.0 - smoothstep(-pixelSize, pixelSize, d);

  gl_FragColor = vec4(uColor, alpha);
}
`;