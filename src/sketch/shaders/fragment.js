export const fragmentShader = `
varying vec2 vUv;
varying vec2 vSize;

uniform sampler2D uTexture;
uniform vec2 uTextureSize;
uniform float uOpacity;

vec2 getUV(vec2 uv, vec2 textureSize, vec2 quadSize){
    vec2 tempUV = uv - vec2(0.5);

    float quadAspect = quadSize.x / quadSize.y;
    float textureAspect = textureSize.x / textureSize.y;

    if(quadAspect < textureAspect){
        tempUV *= vec2(quadAspect / textureAspect, 1.0);
    } else {
        tempUV *= vec2(1.0, textureAspect / quadAspect);
    }

    tempUV += 0.5;
    return tempUV;
}

void main() {
    vec2 uv = getUV(vUv, uTextureSize, vSize);

    vec4 color = texture2D(uTexture, uv);
    color.a *= uOpacity;

gl_FragColor = color;
}
`;