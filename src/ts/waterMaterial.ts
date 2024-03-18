import { Effect, ShaderMaterial } from "@babylonjs/core";

import fragment from "../shaders/waterMaterial/fragment.glsl";
import vertex from "../shaders/waterMaterial/vertex.glsl";
import { Scene } from "@babylonjs/core/scene";

export class WaterMaterial extends ShaderMaterial {
    constructor(name: string, scene: Scene) {
        if(Effect.ShadersStore["oceanVertexShader"] === undefined) {
            Effect.ShadersStore["oceanVertexShader"] = vertex;
        }
        if(Effect.ShadersStore["oceanFragmentShader"] === undefined) {
            Effect.ShadersStore["oceanFragmentShader"] = fragment;
        }
        super(name, scene, "ocean", {
            attributes: ["position", "normal", "uv"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "cameraPositionW", "lightDirection", "lengthScale"],
            samplers: ["heightMap", "gradientMap"]
        });
    }
}