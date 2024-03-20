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

varying vec3 vNormalW;
varying vec3 vPositionW;
varying vec4 vPositionClip;

const float scalingFactor = 1e-5;

const float triPlanarScale = 1.0;

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
    float height = triplanarSample(point, heightMap, triPlanarScale, 0.5).r;
    vec2 gradient = triplanarSample(point, gradientMap, triPlanarScale, 0.5).rg * 0.1; // the 0.5 here is just for artistic reasons
    vec3 heightAndGradient = vec3(height, gradient);

    return heightAndGradient * scalingFactor * 0.2;
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

    vec2 displacement = triplanarSample(positionPlanetSpace, displacementMap, triPlanarScale, 0.5).rg * scalingFactor * 0.5;
    waterPosition += tangent1 * displacement.x + tangent2 * displacement.y;
    //waterPosition.x += displacement.x;
    //waterPosition.z += displacement.y;

    vec3 heightAndGradient = sampleHeightAndGradient(positionPlanetSpace);
    waterPosition += planetNormal * heightAndGradient.x;

    vec3 normal = normalize(planetNormal - heightAndGradient.y * tangent1 - heightAndGradient.z * tangent2);

    vPositionW = vec3(planetWorld * vec4(waterPosition, 1.0));
    vNormalW = vec3(planetWorld * vec4(normal, 0.0));
    vPositionClip = projection * view * planetWorld * vec4(waterPosition, 1.0);

    gl_Position = vPositionClip;
}