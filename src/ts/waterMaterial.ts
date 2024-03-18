import { Effect, ShaderMaterial } from "@babylonjs/core";

import fragment from "../shaders/waterMaterial/fragment.glsl";
import vertex from "../shaders/waterMaterial/vertex.glsl";
import { Scene } from "@babylonjs/core/scene";

export class WaterMaterial extends ShaderMaterial {
    constructor(name: string, scene: Scene) {
        if(Effect.ShadersStore["waterVertexShader"] === undefined) {
            Effect.ShadersStore["waterVertexShader"] = vertex;
        }
        if(Effect.ShadersStore["waterFragmentShader"] === undefined) {
            Effect.ShadersStore["waterFragmentShader"] = fragment;
        }
        super(name, scene, "water", {
            attributes: ["position", "normal", "uv"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "cameraPositionW"],
            samplers: ["heightMap"]
        });
    }
}