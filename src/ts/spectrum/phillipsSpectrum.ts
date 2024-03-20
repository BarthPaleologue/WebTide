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

    private readonly uniformBuffer: UniformBuffer;

    readonly textureSize;

    readonly tileSize;

    readonly settings = {
        windTheta: 0.0,
        windSpeed: 31.0,
        smallWaveLengthCutOff: 0.01
    }

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

        this.uniformBuffer = new UniformBuffer(engine);

        this.uniformBuffer.addUniform("textureSize", 1);
        this.uniformBuffer.addUniform("tileSize", 1);
        this.uniformBuffer.addUniform("windTheta", 1);
        this.uniformBuffer.addUniform("windSpeed", 1);
        this.uniformBuffer.addUniform("smallWaveLengthCutOff", 1);

        this.computeShader.setStorageTexture("H0", this.h0);
        this.computeShader.setTexture("Noise", this.gaussianNoise, false);
        this.computeShader.setUniformBuffer("params", this.uniformBuffer);

        this.uniformBuffer.updateInt("textureSize", this.textureSize);
        this.uniformBuffer.updateFloat("tileSize", this.tileSize);
        this.uniformBuffer.updateFloat("windTheta", this.settings.windTheta);
        this.uniformBuffer.updateFloat("windSpeed", this.settings.windSpeed);
        this.uniformBuffer.updateFloat("smallWaveLengthCutOff", this.settings.smallWaveLengthCutOff);

        this.uniformBuffer.update();

        this.computeShader.dispatch(Math.ceil(this.textureSize / 8), Math.ceil(this.textureSize / 8), 1);
    }

    /**
     * Every time a setting is changed on the CPU, the GPU settings must be updated. Call this method to do so.
     */
    public updateSettingsGPU() {
        this.uniformBuffer.update();
    }
}
