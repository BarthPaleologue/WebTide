precision highp float;

attribute vec3 position;
attribute vec3 normal;

uniform mat4 world;
uniform mat4 worldViewProjection;
uniform mat4 view;
uniform mat4 projection;

uniform mat4 planetInverseWorld;

uniform sampler2D heightMap;
uniform sampler2D gradientMap;
uniform sampler2D displacementMap;

varying vec3 vNormalW;
varying vec3 vPositionW;
varying vec4 vPositionClip;

const float scalingFactor = 1e-5;

#define inline
vec3 triplanarSample(vec3 position, vec3 surfaceNormal, sampler2D textureToSample, float scale, float sharpness) {
    vec2 uvX = vec3(position).zy * scale;
    vec2 uvY = vec3(position).xz * scale;
    vec2 uvZ = vec3(position).xy * scale;

    vec3 xSample = texture(textureToSample, uvX).xyz;
    vec3 ySample = texture(textureToSample, uvY).xyz;
    vec3 zSample = texture(textureToSample, uvZ).xyz;

    vec3 result = xSample * surfaceNormal.x + ySample * surfaceNormal.y + zSample * surfaceNormal.z;
    return mix(vec3(1.0), result, sharpness);
}

vec3 sampleHeightAndGradient(vec3 point) {
    float height = triplanarSample(point, normalize(point), heightMap, 1.0, 1.0).r;
    vec2 gradient = triplanarSample(point, normalize(point), gradientMap, 1.0, 1.0).rg * 0.1; // the 0.1 here is just for artistic reasons
    vec3 heightAndGradient = vec3(height, gradient);

    return heightAndGradient * scalingFactor * 0.5;
}

void main() {
    vec3 positionWorldSpace = vec3(world * vec4(position, 1.0));
    vec3 positionPlanetSpace = vec3(planetInverseWorld * vec4(positionWorldSpace, 1.0));

    vec3 planetNormal = normalize(positionPlanetSpace);

    vec3 waterPosition = positionWorldSpace;
    vec3 planetNormalW = normalize(positionWorldSpace);

    vec2 displacement = triplanarSample(positionPlanetSpace, planetNormal, displacementMap, 1.0, 1.0).rg * scalingFactor;
    //waterPosition.x += displacement.x;
    //waterPosition.z += displacement.y;

    vec3 heightAndGradient = sampleHeightAndGradient(positionPlanetSpace);
    waterPosition += planetNormalW * heightAndGradient.x;
    vec3 normal = normalize(vec3(-heightAndGradient.y, 1.0, -heightAndGradient.z));

    // normal using central difference
    /*float epsilon = 0.001;
    vec3 tangent1 = normalize(vec3(uv.x + epsilon, sampleHeightAndGradient(uv + vec2(epsilon, 0.0)).x, uv.y) - vec3(uv.x - epsilon, sampleHeightAndGradient(uv - vec2(epsilon, 0.0)).x, uv.y));
    vec3 tangent2 = normalize(vec3(uv.x, sampleHeightAndGradient(uv + vec2(0.0, epsilon)).x, uv.y + epsilon) - vec3(uv.x, sampleHeightAndGradient(uv - vec2(0.0, epsilon)).x, uv.y - epsilon));
    vec3 normal = -normalize(cross(tangent1, tangent2));*/

    vPositionW = waterPosition;
    vNormalW = normal;
    vPositionClip = projection * view * vec4(waterPosition, 1.0);

    gl_Position = vPositionClip;
}