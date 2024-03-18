import { ComputeShader, Constants, UniformBuffer, WebGPUEngine } from "@babylonjs/core";

import spectrumWGSL from "../shaders/spectrum.wgsl";
import { createGaussianRandomTexture, createStorageTexture } from "./utils";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

export class BaseSpectrum {
    private cs: ComputeShader;

    readonly noise: Texture;
    h0: Texture;
    readonly h0k: Texture;

    private readonly settings: UniformBuffer;

    private readonly textureSize;
    private readonly lengthScale = 500;

    constructor(textureSize: number, engine: WebGPUEngine) {
        this.textureSize = textureSize;

        this.cs = new ComputeShader("computeSpectrum", engine, { computeSource: spectrumWGSL }, {
            bindingsMapping: {
                "H0K": { group: 0, binding: 0 },
                "Noise": { group: 0, binding: 1 },
                "params": { group: 0, binding: 2 }
            },
            entryPoint: "computeSpectrum"
        });

        this.noise = createGaussianRandomTexture(textureSize, engine);
        this.h0 = createStorageTexture("h0", engine, textureSize, textureSize, Constants.TEXTUREFORMAT_RGBA);
        this.h0k = createStorageTexture("h0k", engine, textureSize, textureSize, Constants.TEXTUREFORMAT_RG);

        this.settings = new UniformBuffer(engine);

        this.settings.addUniform("Size", 1);
        this.settings.addUniform("LengthScale", 1);

        this.cs.setStorageTexture("H0K", this.h0k);
        this.cs.setTexture("Noise", this.noise, false);
        this.cs.setUniformBuffer("params", this.settings);
    }

    generate() {
        this.settings.updateInt("Size", this.textureSize);
        this.settings.updateFloat("LengthScale", this.lengthScale);

        this.settings.update();

        this.cs.dispatch(Math.ceil(this.textureSize / 8), Math.ceil(this.textureSize / 8), 1);
    }
}