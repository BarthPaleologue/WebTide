precision highp float;

varying vec3 vNormalW;
varying vec2 vUV;
varying vec3 vPosition;
varying vec3 vPositionW;

uniform vec3 cameraPositionW;
uniform vec3 lightDirection;

// see https://farside.ph.utexas.edu/teaching/em/lectures/node104.html
float fractionReflected(float cosThetaI, float cosThetaT, float n1, float n2) {
    float alpha = abs(cosThetaI) > 0.01 ? cosThetaT / cosThetaI : 0.0;
    float beta = n2 / n1;
    return (1.0 - alpha * beta) * (1.0 - alpha * beta) / ((1.0 + alpha * beta) * (1.0 + alpha * beta));
}

void main() {
    float ndl = max(0.02, dot(vNormalW, lightDirection));

    vec3 diffuseColor = vec3(0.011126082368383245, 0.05637409755197975, 0.09868919754109445);

    vec3 viewRayW = normalize(vPositionW - cameraPositionW);
    vec3 viewRayRefractedW = refract(viewRayW, vNormalW, 1.0 / 1.33);
    vec3 viewRayReflectedW = reflect(viewRayW, vNormalW);

    float fresnel = fractionReflected(dot(viewRayW, vNormalW), dot(viewRayRefractedW, vNormalW), 1.0, 1.33);
    fresnel /= 2.0;

    vec3 reflectedColor = vec3(30.0, 76.0, 126.0) / 255.0;

    vec3 finalColor = mix(diffuseColor * ndl, reflectedColor, fresnel);

    gl_FragColor = vec4(finalColor, 1.0);
}