import { createGaussianNoiseTexture, createStorageTexture } from "./utils";
import { ComputeShader } from "@babylonjs/core/Compute/computeShader";
import { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { Constants } from "@babylonjs/core/Engines/constants";
import { InitialSpectrum } from "./initialSpectrum";

import spectrumWGSL from "../shaders/phillipsSpectrum.wgsl";
import { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";

export class PhillipsSpectrum implements InitialSpectrum {
    private computeShader: ComputeShader;

    readonly gaussianNoise: BaseTexture;
    readonly h0: BaseTexture;

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
                    H0: { group: 0, binding: 1 },
                    Noise: { group: 0, binding: 2 },
                    params: { group: 0, binding: 3 }
                },
                entryPoint: "computeSpectrum"
            }
        );

        this.gaussianNoise = createGaussianNoiseTexture(textureSize, engine);
        this.h0 = createStorageTexture("h0", engine, textureSize, textureSize, Constants.TEXTUREFORMAT_RGBA);

        this.settings = new UniformBuffer(engine);

        this.settings.addUniform("textureSize", 1);
        this.settings.addUniform("tileScale", 1);

        this.computeShader.setStorageTexture("H0", this.h0);
        this.computeShader.setTexture("Noise", this.gaussianNoise, false);
        this.computeShader.setUniformBuffer("params", this.settings);

        this.settings.updateInt("textureSize", this.textureSize);
        this.settings.updateFloat("tileScale", this.tileScale);

        this.settings.update();

        this.computeShader.dispatch(Math.ceil(this.textureSize / 8), Math.ceil(this.textureSize / 8), 1);
    }
}
