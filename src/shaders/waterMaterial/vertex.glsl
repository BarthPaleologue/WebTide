precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 world;
uniform mat4 worldViewProjection;

uniform sampler2D heightMap;
uniform sampler2D gradientMap;
uniform sampler2D displacementMap;

varying vec3 vNormalW;
varying vec2 vUV;
varying vec3 vPosition;
varying vec3 vPositionW;
varying vec4 vPositionClip;

const float scalingFactor = 1e-5;

vec3 sampleHeightAndGradient(vec2 point) {
    float height = texture(heightMap, point).r;
    vec2 gradient = texture(gradientMap, point).rg * 0.1; // the 0.1 here is just for artistic reasons
    vec3 heightAndGradient = vec3(height, gradient);

    return heightAndGradient * scalingFactor * 0.5;
}

void main() {
    vec3 waterPosition = position;

    vec2 displacement = texture(displacementMap, uv).rg * scalingFactor;
    waterPosition.x += displacement.x;
    waterPosition.z += displacement.y;

    vec3 heightAndGradient = sampleHeightAndGradient(uv);
    waterPosition.y += heightAndGradient.x;
    vec3 normal = normalize(vec3(-heightAndGradient.y, 1.0, -heightAndGradient.z));

    // normal using central difference
    /*float epsilon = 0.001;
    vec3 tangent1 = normalize(vec3(uv.x + epsilon, sampleHeightAndGradient(uv + vec2(epsilon, 0.0)).x, uv.y) - vec3(uv.x - epsilon, sampleHeightAndGradient(uv - vec2(epsilon, 0.0)).x, uv.y));
    vec3 tangent2 = normalize(vec3(uv.x, sampleHeightAndGradient(uv + vec2(0.0, epsilon)).x, uv.y + epsilon) - vec3(uv.x, sampleHeightAndGradient(uv - vec2(0.0, epsilon)).x, uv.y - epsilon));
    vec3 normal = -normalize(cross(tangent1, tangent2));*/

    vPosition = waterPosition;
    vPositionW = vec3(world * vec4(waterPosition, 1.0));
    vNormalW = vec3(world * vec4(normal, 0.0));
    vUV = uv;
    vPositionClip = worldViewProjection * vec4(waterPosition, 1.0);

    gl_Position = vPositionClip;
}