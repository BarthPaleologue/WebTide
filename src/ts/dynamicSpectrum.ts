import { ComputeShader, Constants, UniformBuffer, WebGPUEngine } from "@babylonjs/core";

import spectrumWGSL from "../shaders/dynamicSpectrum.wgsl";

import { createStorageTexture } from "./utils";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { BaseSpectrum } from "./baseSpectrum";

export class DynamicSpectrum {
    private baseSpectrum: BaseSpectrum;

    private computeShader: ComputeShader;

    readonly ht: Texture;

    private readonly settings: UniformBuffer;

    constructor(baseSpectrum: BaseSpectrum, engine: WebGPUEngine) {
        this.baseSpectrum = baseSpectrum;

        this.computeShader = new ComputeShader("computeSpectrum", engine, { computeSource: spectrumWGSL }, {
            bindingsMapping: {
                "H0": { group: 0, binding: 0 },
                "HT": { group: 0, binding: 1 },
                "params": { group: 0, binding: 2 },
            },
            entryPoint: "computeSpectrum"
        });

        this.ht = createStorageTexture("ht", engine, baseSpectrum.textureSize, baseSpectrum.textureSize, Constants.TEXTUREFORMAT_RG);

        this.settings = new UniformBuffer(engine);

        this.settings.addUniform("Size", 1);
        this.settings.addUniform("LengthScale", 1);
        this.settings.addUniform("ElapsedSeconds", 1);

        this.computeShader.setStorageTexture("H0", this.baseSpectrum.h0);
        this.computeShader.setTexture("HT", this.ht, false);
        this.computeShader.setUniformBuffer("params", this.settings);
    }

    generate(elapsedSeconds: number) {
        this.settings.updateInt("Size", this.baseSpectrum.textureSize);
        this.settings.updateFloat("LengthScale", this.baseSpectrum.lengthScale);
        this.settings.updateFloat("ElapsedSeconds", elapsedSeconds);

        this.settings.update();

        this.computeShader.dispatch(Math.ceil(this.baseSpectrum.textureSize / 8), Math.ceil(this.baseSpectrum.textureSize / 8), 1);
    }

    dispose() {
        this.ht.dispose();
        this.settings.dispose();
    }
}