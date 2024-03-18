precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 world;
uniform mat4 worldViewProjection;

uniform sampler2D heightMap;
uniform sampler2D gradientMap;

uniform float lengthScale;

varying vec3 vNormalW;
varying vec2 vUV;
varying vec3 vPosition;
varying vec3 vPositionW;

float sampleHeight(vec2 point) {
    return texture(heightMap, point).r / 100000.0;
}

vec3 sampleHeightAndGradient(vec2 point) {
    float height = texture(heightMap, point).r;
    vec2 gradient = texture(gradientMap, point).rg;
    gradient *= lengthScale;
    vec3 heightAndGradient = vec3(height, gradient);

    return heightAndGradient / 100000.0;
}

void main(void) {
    vec3 waterPosition = position;
    /*float height = sampleHeight(uv);
    waterPosition.y = height;

    // normal using central difference
    float dx = sampleHeight(uv + vec2(0.01, 0.0)) - sampleHeight(uv - vec2(0.01, 0.0));
    float dy = sampleHeight(uv + vec2(0.0, 0.01)) - sampleHeight(uv - vec2(0.0, 0.01));
    vec3 normal = normalize(vec3(-dx, 0.02, -dy));*/

    vec3 heightAndGradient = sampleHeightAndGradient(uv);
    waterPosition.y = heightAndGradient.x;
    vec3 normal = normalize(vec3(-heightAndGradient.y, 1.0, -heightAndGradient.z));

    vPosition = waterPosition;
    vPositionW = vec3(world * vec4(waterPosition, 1.0));
    vNormalW = vec3(world * vec4(normal, 0.0));
    vUV = uv;
    gl_Position = worldViewProjection * vec4(waterPosition, 1.0);
}