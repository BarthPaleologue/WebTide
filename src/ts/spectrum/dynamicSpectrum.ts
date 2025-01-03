import { createStorageTexture } from "../utils/utils";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { ComputeShader } from "@babylonjs/core/Compute/computeShader";
import { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";
import { Constants } from "@babylonjs/core/Engines/constants";
import { InitialSpectrum } from "./initialSpectrum";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";

import spectrumWGSL from "../../shaders/dynamicSpectrum.wgsl";

export class DynamicSpectrum {
    private initialSpectrum: InitialSpectrum;

    private computeShader: ComputeShader;

    readonly ht: Texture;
    readonly dht: Texture;
    readonly displacement: Texture;

    private readonly settings: UniformBuffer;

    constructor(initialSpectrum: InitialSpectrum, engine: WebGPUEngine) {
        this.initialSpectrum = initialSpectrum;

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

        this.ht = createStorageTexture("ht", engine, initialSpectrum.textureSize, initialSpectrum.textureSize, Constants.TEXTUREFORMAT_RG);
        this.dht = createStorageTexture("dht", engine, initialSpectrum.textureSize, initialSpectrum.textureSize, Constants.TEXTUREFORMAT_RG);
        this.displacement = createStorageTexture("displacement", engine, initialSpectrum.textureSize, initialSpectrum.textureSize, Constants.TEXTUREFORMAT_RG);

        this.settings = new UniformBuffer(engine);

        this.settings.addUniform("textureSize", 1);
        this.settings.addUniform("tileSize", 1);
        this.settings.addUniform("elapsedSeconds", 1);

        this.computeShader.setStorageTexture("H0", this.initialSpectrum.h0);
        this.computeShader.setTexture("HT", this.ht, false);
        this.computeShader.setTexture("DHT", this.dht, false);
        this.computeShader.setTexture("Displacement", this.displacement, false);
        this.computeShader.setUniformBuffer("params", this.settings);
    }

    generate(elapsedSeconds: number) {
        this.settings.updateInt("textureSize", this.initialSpectrum.textureSize);
        this.settings.updateFloat("tileSize", this.initialSpectrum.tileSize);
        this.settings.updateFloat("elapsedSeconds", elapsedSeconds);

        this.settings.update();

        this.computeShader.dispatch(Math.ceil(this.initialSpectrum.textureSize / 8), Math.ceil(this.initialSpectrum.textureSize / 8), 1);
    }

    dispose() {
        this.ht.dispose();
        this.settings.dispose();
    }
}
