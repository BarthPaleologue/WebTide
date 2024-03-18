precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 world;
uniform mat4 worldViewProjection;

uniform sampler2D heightMap;
uniform sampler2D gradientMap;
uniform sampler2D displacementMap;

uniform float tileScale;

varying vec3 vNormalW;
varying vec2 vUV;
varying vec3 vPosition;
varying vec3 vPositionW;

const float scalingFactor = 1e-5;

vec3 sampleHeightAndGradient(vec2 point) {
    float height = texture(heightMap, point).r;
    vec2 gradient = texture(gradientMap, point).rg;
    vec3 heightAndGradient = vec3(height, gradient);

    return heightAndGradient * scalingFactor * 0.8;
}

void main(void) {
    vec3 waterPosition = position;

    vec2 displacement = texture(displacementMap, uv).rg * scalingFactor;
    waterPosition.x += displacement.x;
    waterPosition.z += displacement.y;

    vec3 heightAndGradient = sampleHeightAndGradient(uv);
    waterPosition.y = heightAndGradient.x;
    vec3 normal = normalize(vec3(-heightAndGradient.y, 1.0, -heightAndGradient.z));

    vPosition = waterPosition;
    vPositionW = vec3(world * vec4(waterPosition, 1.0));
    vNormalW = vec3(world * vec4(normal, 0.0));
    vUV = uv;
    gl_Position = worldViewProjection * vec4(waterPosition, 1.0);
}