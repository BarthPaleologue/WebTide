precision highp float;

varying vec3 vNormalW;
varying vec3 vPositionW;
varying vec4 vPositionClip;

uniform vec3 cameraPositionW;
uniform vec3 lightDirection;

uniform sampler2D depthSampler;
uniform sampler2D textureSampler;
uniform samplerCube reflectionSampler;

void main() {
    vec3 normal = -normalize(cross(dFdx(vPositionW), dFdy(vPositionW)));

    vec2 screenUV = vPositionClip.xy / vPositionClip.w;
    screenUV = screenUV * 0.5 + 0.5;

    vec3 backgroundColor = texture2D(textureSampler, screenUV).rgb;

    float surfaceDepth = vPositionClip.z;
    float backgroundDepth = texture2D(depthSampler, screenUV).r;

    float distanceThroughWater = max(surfaceDepth - backgroundDepth, 0.0);

    float ndl = max(0.0, dot(normal, -lightDirection));
    vec3 diffuseColor = vec3(0.011126082368383245, 0.05637409755197975, 0.09868919754109445);

    diffuseColor = mix(diffuseColor, backgroundColor, exp(-distanceThroughWater * 0.1));

    vec3 viewRayW = normalize(vPositionW - cameraPositionW);
    vec3 viewRayRefractedW = refract(viewRayW, normal, 0.75);
    vec3 viewRayReflectedW = reflect(viewRayW, normal);

    // water fresnel (https://fileadmin.cs.lth.se/cs/Education/EDAF80/seminars/2022/sem_4.pdf)
    float fresnel = 0.02 + 0.98 * pow(1.0 - dot(-viewRayW, normal), 5.0);

    vec3 reflectedColor = textureCube(reflectionSampler, viewRayReflectedW).rgb;

    float specular = pow(max(0.0, dot(reflect(-lightDirection, normal), viewRayW)), 720.0) * 210.0;

    vec3 finalColor = mix(diffuseColor * ndl, reflectedColor + specular, fresnel);

    gl_FragColor = vec4(finalColor, 1.0);
}