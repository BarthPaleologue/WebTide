import { createStorageTexture } from "./utils";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { ComputeShader } from "@babylonjs/core/Compute/computeShader";
import { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { Constants } from "@babylonjs/core/Engines/constants";

import spectrumWGSL from "../shaders/dynamicSpectrum.wgsl";
import { Spectrum } from "./spectrum";

export class DynamicSpectrum {
    private baseSpectrum: Spectrum;

    private computeShader: ComputeShader;

    readonly ht: Texture;
    readonly dht: Texture;
    readonly displacement: Texture;

    private readonly settings: UniformBuffer;

    constructor(baseSpectrum: Spectrum, engine: WebGPUEngine) {
        this.baseSpectrum = baseSpectrum;

        this.computeShader = new ComputeShader(
            "computeSpectrum",
            engine,
            { computeSource: spectrumWGSL },
            {
                bindingsMapping: {
                    H0: { group: 0, binding: 0 },
                    HT: { group: 0, binding: 1 },
                    DHT: { group: 0, binding: 2 },
                    Displacement: { group: 0, binding: 3 },
                    params: { group: 0, binding: 4 }
                },
                entryPoint: "computeSpectrum"
            }
        );

        this.ht = createStorageTexture("ht", engine, baseSpectrum.textureSize, baseSpectrum.textureSize, Constants.TEXTUREFORMAT_RG);
        this.dht = createStorageTexture("dht", engine, baseSpectrum.textureSize, baseSpectrum.textureSize, Constants.TEXTUREFORMAT_RG);
        this.displacement = createStorageTexture("displacement", engine, baseSpectrum.textureSize, baseSpectrum.textureSize, Constants.TEXTUREFORMAT_RG);

        this.settings = new UniformBuffer(engine);

        this.settings.addUniform("textureSize", 1);
        this.settings.addUniform("tileScale", 1);
        this.settings.addUniform("elapsedSeconds", 1);

        this.computeShader.setStorageTexture("H0", this.baseSpectrum.h0);
        this.computeShader.setTexture("HT", this.ht, false);
        this.computeShader.setTexture("DHT", this.dht, false);
        this.computeShader.setTexture("Displacement", this.displacement, false);
        this.computeShader.setUniformBuffer("params", this.settings);
    }

    generate(elapsedSeconds: number) {
        this.settings.updateInt("textureSize", this.baseSpectrum.textureSize);
        this.settings.updateFloat("tileScale", this.baseSpectrum.tileScale);
        this.settings.updateFloat("elapsedSeconds", elapsedSeconds);

        this.settings.update();

        this.computeShader.dispatch(Math.ceil(this.baseSpectrum.textureSize / 8), Math.ceil(this.baseSpectrum.textureSize / 8), 1);
    }

    dispose() {
        this.ht.dispose();
        this.settings.dispose();
    }
}
