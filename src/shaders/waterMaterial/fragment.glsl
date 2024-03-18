precision highp float;

varying vec3 vNormalW;
varying vec2 vUV;
varying vec3 vPosition;
varying vec3 vPositionW;

uniform vec3 cameraPositionW;
uniform vec3 lightDirection;

void main() {
    float ndl = max(0.0, dot(vNormalW, lightDirection));

    vec3 diffuseColor = vec3(0.011126082368383245, 0.05637409755197975, 0.09868919754109445);

    vec3 viewRayW = normalize(vPositionW - cameraPositionW);
    vec3 viewRayRefractedW = refract(viewRayW, vNormalW, 1.0 / 1.33);
    vec3 viewRayReflectedW = reflect(viewRayW, vNormalW);

    // water fresnel (https://fileadmin.cs.lth.se/cs/Education/EDAF80/seminars/2022/sem_4.pdf)
    float fresnel = 0.02 + 0.98 * pow(1.0 - dot(-viewRayW, vNormalW), 5.0);

    vec3 reflectedColor = vec3(30.0, 76.0, 126.0) / 255.0;

    float specular = pow(max(0.0, dot(reflect(lightDirection, vNormalW), viewRayW)), 32.0);

    vec3 finalColor = mix(diffuseColor * ndl, reflectedColor, fresnel) + specular;

    gl_FragColor = vec4(finalColor, 1.0);
}