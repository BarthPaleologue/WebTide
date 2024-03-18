precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 world;
uniform mat4 worldViewProjection;

uniform sampler2D heightMap;

varying vec3 vNormal;
varying vec3 vNormalW;
varying vec2 vUV;
varying vec3 vPosition;
varying vec3 vPositionW;

float sampleHeight(vec2 point) {
    return texture(heightMap, point).r / 20000.0;
}

void main(void) {
    vec3 waterPosition = position;
    float height = sampleHeight(uv);
    waterPosition.y = height;

    // normal using central difference
    float dx = sampleHeight(uv + vec2(0.01, 0.0)) - sampleHeight(uv - vec2(0.01, 0.0));
    float dy = sampleHeight(uv + vec2(0.0, 0.01)) - sampleHeight(uv - vec2(0.0, 0.01));
    vec3 normal = normalize(vec3(-dx, 0.02, -dy));

    vPosition = waterPosition;
    vPositionW = vec3(world * vec4(waterPosition, 1.0));
    vNormal = normal;
    vNormalW = vec3(world * vec4(normal, 0.0));
    vUV = uv;
    gl_Position = worldViewProjection * vec4(waterPosition, 1.0);
}