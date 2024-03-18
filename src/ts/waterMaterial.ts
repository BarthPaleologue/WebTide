import fragment from "../shaders/waterMaterial/fragment.glsl";
import vertex from "../shaders/waterMaterial/vertex.glsl";
import { Scene } from "@babylonjs/core/scene";
import { IFFT } from "./IFFT";
import { createStorageTexture } from "./utils";
import { PhillipsSpectrum } from "./phillipsSpectrum";
import { DynamicSpectrum } from "./dynamicSpectrum";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Constants } from "@babylonjs/core/Engines/constants";
import { InitialSpectrum } from "./initialSpectrum";

export class WaterMaterial extends ShaderMaterial {
    readonly textureSize: number;
    readonly tileScale: number;

    readonly initialSpectrum: InitialSpectrum;
    readonly dynamicSpectrum: DynamicSpectrum;

    readonly ifft: IFFT;
    readonly heightMap: BaseTexture;
    readonly gradientMap: BaseTexture;
    readonly displacementMap: BaseTexture;

    private elapsedSeconds = 3600;

    constructor(name: string, textureSize: number, tileScale: number, scene: Scene, engine: WebGPUEngine, baseSpectrum: InitialSpectrum = new PhillipsSpectrum(textureSize, tileScale, engine)) {
        if (Effect.ShadersStore["oceanVertexShader"] === undefined) {
            Effect.ShadersStore["oceanVertexShader"] = vertex;
        }
        if (Effect.ShadersStore["oceanFragmentShader"] === undefined) {
            Effect.ShadersStore["oceanFragmentShader"] = fragment;
        }
        super(name, scene, "ocean", {
            attributes: ["position", "normal", "uv"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "cameraPositionW", "lightDirection", "tileScale"],
            samplers: ["heightMap", "gradientMap", "displacementMap"]
        });

        this.textureSize = textureSize;
        this.tileScale = tileScale;

        if(baseSpectrum.h0.textureFormat != Constants.TEXTUREFORMAT_RGBA) {
            throw new Error("The base spectrum must have a texture format of RGBA");
        }

        this.initialSpectrum = baseSpectrum;
        this.dynamicSpectrum = new DynamicSpectrum(this.initialSpectrum, engine);

        this.ifft = new IFFT(engine, textureSize);
        this.heightMap = createStorageTexture("heightBuffer", engine, textureSize, textureSize, Constants.TEXTUREFORMAT_RG);
        this.gradientMap = createStorageTexture("gradientBuffer", engine, textureSize, textureSize, Constants.TEXTUREFORMAT_RG);
        this.displacementMap = createStorageTexture("displacementBuffer", engine, textureSize, textureSize, Constants.TEXTUREFORMAT_RG);

        this.setTexture("heightMap", this.heightMap);
        this.setTexture("gradientMap", this.gradientMap);
        this.setTexture("displacementMap", this.displacementMap);
    }

    public update(deltaSeconds: number, lightDirection: Vector3) {
        this.elapsedSeconds += deltaSeconds;
        this.dynamicSpectrum.generate(this.elapsedSeconds);

        this.ifft.applyToTexture(this.dynamicSpectrum.ht, this.heightMap);
        this.ifft.applyToTexture(this.dynamicSpectrum.dht, this.gradientMap);
        this.ifft.applyToTexture(this.dynamicSpectrum.displacement, this.displacementMap);

        const activeCamera = this.getScene().activeCamera;
        if (activeCamera === null) throw new Error("No active camera found");
        this.setVector3("cameraPositionW", activeCamera.globalPosition);

        this.setFloat("tileScale", this.tileScale);
        this.setVector3("lightDirection", lightDirection);
    }
}
