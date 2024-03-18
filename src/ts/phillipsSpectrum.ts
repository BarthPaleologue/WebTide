import { createGaussianRandomTexture, createStorageTexture } from "./utils";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { ComputeShader } from "@babylonjs/core/Compute/computeShader";
import { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { Constants } from "@babylonjs/core/Engines/constants";
import { Spectrum } from "./spectrum";

import spectrumWGSL from "../shaders/phillipsSpectrum.wgsl";

export class PhillipsSpectrum implements Spectrum {
    private computeShader: ComputeShader;

    readonly noise: Texture;
    readonly h0: Texture;
    readonly h0k: Texture;

    private readonly settings: UniformBuffer;

    readonly textureSize;
    readonly tileScale;

    constructor(textureSize: number, tileScale: number, engine: WebGPUEngine) {
        this.textureSize = textureSize;
        this.tileScale = tileScale;

        this.computeShader = new ComputeShader(
            "computeSpectrum",
            engine,
            { computeSource: spectrumWGSL },
            {
                bindingsMapping: {
                    H0K: { group: 0, binding: 0 },
                    H0: { group: 0, binding: 1 },
                    Noise: { group: 0, binding: 2 },
                    params: { group: 0, binding: 3 }
                },
                entryPoint: "computeSpectrum"
            }
        );

        this.noise = createGaussianRandomTexture(textureSize, engine);
        this.h0 = createStorageTexture("h0", engine, textureSize, textureSize, Constants.TEXTUREFORMAT_RGBA);
        this.h0k = createStorageTexture("h0k", engine, textureSize, textureSize, Constants.TEXTUREFORMAT_RG);

        this.settings = new UniformBuffer(engine);

        this.settings.addUniform("textureSize", 1);
        this.settings.addUniform("tileScale", 1);

        this.computeShader.setStorageTexture("H0K", this.h0k);
        this.computeShader.setStorageTexture("H0", this.h0);
        this.computeShader.setTexture("Noise", this.noise, false);
        this.computeShader.setUniformBuffer("params", this.settings);

        this.settings.updateInt("textureSize", this.textureSize);
        this.settings.updateFloat("tileScale", this.tileScale);

        this.settings.update();

        this.computeShader.dispatch(Math.ceil(this.textureSize / 8), Math.ceil(this.textureSize / 8), 1);
    }
}
