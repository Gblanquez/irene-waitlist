export const vertexShader = `
varying vec2 vUv;
varying vec2 vSize;

uniform vec2 uQuadSize;

void main() {
  vUv = uv;
  vSize = uQuadSize;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;