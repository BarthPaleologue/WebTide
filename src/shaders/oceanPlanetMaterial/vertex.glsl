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

const float scalingFactor = 2e-6;

#define inline
vec3 triplanarSample(vec3 position, sampler2D textureToSample, float scale, float blend) {
    vec3 x = texture2D(textureToSample, position.yz).xyz;
    vec3 y = texture2D(textureToSample, position.zx).xyz;
    vec3 z = texture2D(textureToSample, position.xy).xyz;

    vec3 result = x * (1.0 - blend) + y * blend;
    result = mix(result, z, blend);

    return result * scale;
}

vec3 sampleHeightAndGradient(vec3 point) {
    float height = triplanarSample(point, heightMap, 1.0, 0.5).r;
    vec2 gradient = triplanarSample(point, gradientMap, 1.0, 0.5).rg * 0.1; // the 0.1 here is just for artistic reasons
    vec3 heightAndGradient = vec3(height, gradient);

    return heightAndGradient * scalingFactor * 0.5;
}

void main() {
    vec3 positionWorldSpace = vec3(world * vec4(position, 1.0));
    vec3 positionPlanetSpace = vec3(planetInverseWorld * vec4(positionWorldSpace, 1.0));

    vec3 planetNormal = normalize(positionPlanetSpace);

    vec3 waterPosition = positionWorldSpace;
    vec3 planetNormalW = normalize(positionWorldSpace);

    vec2 displacement = triplanarSample(positionPlanetSpace, displacementMap, 1.0, 0.5).rg * scalingFactor;
    //waterPosition.x += displacement.x;
    //waterPosition.z += displacement.y;

    vec3 heightAndGradient = sampleHeightAndGradient(positionPlanetSpace);
    waterPosition += planetNormalW * heightAndGradient.x;

    // normal using central difference
    /*float epsilon = 0.001;
    vec3 tangent1 = normalize(vec3(uv.x + epsilon, sampleHeightAndGradient(uv + vec2(epsilon, 0.0)).x, uv.y) - vec3(uv.x - epsilon, sampleHeightAndGradient(uv - vec2(epsilon, 0.0)).x, uv.y));
    vec3 tangent2 = normalize(vec3(uv.x, sampleHeightAndGradient(uv + vec2(0.0, epsilon)).x, uv.y + epsilon) - vec3(uv.x, sampleHeightAndGradient(uv - vec2(0.0, epsilon)).x, uv.y - epsilon));
    vec3 normal = -normalize(cross(tangent1, tangent2));*/

    vPositionW = waterPosition;
    //vNormalW = normal;
    vPositionClip = projection * view * vec4(waterPosition, 1.0);

    gl_Position = vPositionClip;
}