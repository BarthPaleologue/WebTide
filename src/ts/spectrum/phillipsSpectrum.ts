import { createGaussianNoiseTexture, createStorageTexture } from "../utils/utils";
import { ComputeShader } from "@babylonjs/core/Compute/computeShader";
import { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";
import { Constants } from "@babylonjs/core/Engines/constants";
import { InitialSpectrum } from "./initialSpectrum";

import spectrumWGSL from "../../shaders/phillipsSpectrum.wgsl";
import { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import { Engine } from "@babylonjs/core/Engines/engine";

/**
 * The Phillips spectrum is a common choice for the initial spectrum in ocean simulation.
 * It is described in Tessendorf's paper "Simulating Ocean Water".
 * @see https://people.computing.clemson.edu/~jtessen/reports/papers_files/coursenotes2004.pdf
 */
export class PhillipsSpectrum implements InitialSpectrum {
    private computeShader: ComputeShader;

    /**
     * A texture containing random numbers following a gaussian distribution with mean 0 and standard deviation 1.
     */
    readonly gaussianNoise: BaseTexture;

    readonly h0: BaseTexture;

    private readonly settings: UniformBuffer;

    readonly textureSize;

    readonly tileSize;

    constructor(textureSize: number, tileSize: number, engine: Engine) {
        this.textureSize = textureSize;
        this.tileSize = tileSize;

        this.computeShader = new ComputeShader(
            "computeSpectrum",
            engine,
            { computeSource: spectrumWGSL },
            {
                bindingsMapping: {
                    H0: { group: 0, binding: 0 },
                    Noise: { group: 0, binding: 1 },
                    params: { group: 0, binding: 2 }
                },
                entryPoint: "computeSpectrum"
            }
        );

        this.gaussianNoise = createGaussianNoiseTexture(textureSize, engine);
        this.h0 = createStorageTexture("h0", engine, textureSize, textureSize, Constants.TEXTUREFORMAT_RGBA);

        this.settings = new UniformBuffer(engine);

        this.settings.addUniform("textureSize", 1);
        this.settings.addUniform("tileSize", 1);

        this.computeShader.setStorageTexture("H0", this.h0);
        this.computeShader.setTexture("Noise", this.gaussianNoise, false);
        this.computeShader.setUniformBuffer("params", this.settings);

        this.settings.updateInt("textureSize", this.textureSize);
        this.settings.updateFloat("tileSize", this.tileSize);

        this.settings.update();

        this.computeShader.dispatch(Math.ceil(this.textureSize / 8), Math.ceil(this.textureSize / 8), 1);
    }
}
