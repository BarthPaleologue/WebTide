precision highp float;

varying vec2 vUV;

uniform sampler2D textureSampler;
uniform sampler2D depthSampler;

uniform mat4 cameraInverseProjection;
uniform mat4 cameraInverseView;
uniform vec3 cameraPosition;

// compute the world position of a pixel from its uv coordinates
// This is an evolution from the code found here
// https://forum.babylonjs.com/t/pixel-position-in-world-space-from-fragment-postprocess-shader-issue/30232
// also see https://www.babylonjs-playground.com/#1PHYB0#318 for smaller scale testing
// This is a revised version that works with the reverse depth buffer
vec3 worldFromUV(vec2 pos, mat4 inverseProjection, mat4 inverseView) {
    vec4 ndc = vec4(pos.xy * 2.0 - 1.0, 1.0, 1.0); // get ndc position (z = 1 because the depth buffer is reversed)
    vec4 posVS = inverseProjection * ndc; // unproject the ndc coordinates : we are now in view space if i understand correctly
    vec4 posWS = inverseView * posVS; // then we use inverse view to get to world space, division by w to get actual coordinates
    return  posWS.xyz / posWS.w;
}

vec3 aces_tonemap(vec3 color) {
    mat3 m1 = mat3(
    0.59719, 0.07600, 0.02840,
    0.35458, 0.90834, 0.13383,
    0.04823, 0.01566, 0.83777
    );
    mat3 m2 = mat3(
    1.60475, -0.10208, -0.00327,
    -0.53108, 1.10813, -0.07276,
    -0.07367, -0.00605, 1.07602
    );
    vec3 v = m1 * color;
    vec3 a = v * (v + 0.0245786) - 0.000090537;
    vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
    return pow(clamp(m2 * (a / b), 0.0, 1.0), vec3(1.0 / 2.2));
}

float getFogFactor(float d, vec3 rayDir) {
    const float LOG2 = 1.442695;
    const float density = 400.0;
    const float start = 0.3;
    const float end = 1.0;
    float fogFactor = exp2(-density * density * d * d * LOG2);
    fogFactor = 1.0 - clamp((fogFactor - start) / (end - start), 0.0, 1.0);

    fogFactor *= pow(1.0 - abs(rayDir.y), 4.0); // fog is not applied to the sky (upwards direction

    return fogFactor;
}

void main() {
    vec3 color = texture(textureSampler, vUV).rgb;
    float depth = texture(depthSampler, vUV).r;

    vec3 rayDir = normalize(worldFromUV(vUV, cameraInverseProjection, cameraInverseView) - cameraPosition);

    float fogFactor = getFogFactor(depth, rayDir);
    vec3 fogColor = vec3(0.8);

    //color = aces_tonemap(color);

    const float exposure = 1.0;
    const float contrast = 1.0;
    const float brightness = 0.0;
    const float saturation = 1.3;

    color *= exposure;
    color = clamp(color, 0.0, 1.0);

    color = (color - 0.5) * contrast + 0.5 + brightness;
    color = clamp(color, 0.0, 1.0);

    vec3 grayscale = vec3(0.299, 0.587, 0.114) * color;
    color = mix(grayscale, color, saturation);
    color = clamp(color, 0.0, 1.0);

    color = mix(color, fogColor, fogFactor);

    gl_FragColor = vec4(color, 1.0);
}