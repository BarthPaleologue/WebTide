precision highp float;

attribute vec3 position;
attribute vec3 normal;

uniform mat4 world;
uniform mat4 worldViewProjection;
uniform mat4 view;
uniform mat4 projection;

uniform mat4 planetWorld;
uniform mat4 planetInverseWorld;

uniform sampler2D heightMap;
uniform sampler2D gradientMap;
uniform sampler2D displacementMap;

uniform float tileSize;

varying vec3 vNormalW;
varying vec3 vPositionW;
varying vec4 vPositionClip;

float scalingFactor = 1.0 / tileSize;

float triPlanarScale = 0.5 / tileSize;

#define inline
vec3 triplanarSample(vec3 position, sampler2D textureToSample, vec3 normal , float scale, float blend) {
    vec3 blendFactors = abs(normal);
    blendFactors /= (blendFactors.x + blendFactors.y + blendFactors.z);

    vec3 x = texture2D(textureToSample, position.yz * scale).xyz;
    vec3 y = texture2D(textureToSample, position.xz * scale).xyz;
    vec3 z = texture2D(textureToSample, position.xy * scale).xyz;

    return x * blendFactors.x + y * blendFactors.y + z * blendFactors.z;
}

vec3 sampleHeightAndGradient(vec3 point, vec3 normal) {
    float height = triplanarSample(point, heightMap, normal, triPlanarScale, 0.5).r;
    vec2 gradient = triplanarSample(point, gradientMap, normal, triPlanarScale, 0.5).rg;
    vec3 heightAndGradient = vec3(height, gradient);

    return heightAndGradient * scalingFactor * 0.5;
}

void main() {
    vec3 positionWorldSpace = vec3(world * vec4(position, 1.0));
    vec3 positionPlanetSpace = vec3(planetInverseWorld * vec4(positionWorldSpace, 1.0));

    float planetRadius = length(positionPlanetSpace);

    vec3 planetNormal = normalize(positionPlanetSpace);

    vec3 waterPosition = positionPlanetSpace;

    // find theta and phi from spherical coords
    float theta = acos(planetNormal.y);
    float phi = atan(planetNormal.z, planetNormal.x);

    vec3 tangent1 = vec3(-sin(phi), 0.0, cos(phi));
    vec3 tangent2 = vec3(cos(theta) * cos(phi), -sin(theta), cos(theta) * sin(phi));

    vec2 displacement = triplanarSample(positionPlanetSpace, displacementMap, planetNormal, triPlanarScale, 0.5).rg * scalingFactor * 0.2;
    waterPosition += tangent1 * displacement.x + tangent2 * displacement.y;

    vec3 heightAndGradient = sampleHeightAndGradient(positionPlanetSpace, planetNormal);
    waterPosition += planetNormal * heightAndGradient.x;

    vec3 normal = normalize(planetNormal - heightAndGradient.y * tangent1 - heightAndGradient.z * tangent2);

    vPositionW = vec3(planetWorld * vec4(waterPosition, 1.0));
    vNormalW = vec3(planetWorld * vec4(normal, 0.0));
    vPositionClip = projection * view * planetWorld * vec4(waterPosition, 1.0);

    gl_Position = vPositionClip;
}