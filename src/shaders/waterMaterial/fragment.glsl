precision highp float;

varying vec3 vNormal;
varying vec2 vUV;
varying vec3 vPosition;

uniform sampler2D heightMap;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDirection = normalize(vec3(2.0, 1.0, 0.0));
    float ndl = dot(normal, lightDirection);

    vec3 diffuseColor = vec3(0.3, 0.3, 1.0);

    gl_FragColor = vec4(diffuseColor * ndl, 1.0);
}