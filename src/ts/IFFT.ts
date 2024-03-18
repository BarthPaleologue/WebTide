import { BaseTexture, ComputeShader, Constants, UniformBuffer } from "@babylonjs/core";
import { Engine } from "@babylonjs/core/Engines/engine";
import { createStorageTexture } from "./utils";

import twiddleFactors from "../shaders/twiddleFactors.wgsl";
import horizontalStep from "../shaders/horizontalStepIfft.wgsl";
import verticalStep from "../shaders/verticalStepIfft.wgsl";
import permutation from "../shaders/permutation.wgsl";
import { CopyTexture } from "./copyTexture";

export class IFFT {
    private readonly engine: Engine;

    private readonly textureSize: number;

    private readonly precompute: ComputeShader;
    private readonly twiddleTable: BaseTexture;

    private readonly settings: UniformBuffer;
    private readonly horizontalStepIFFT: ComputeShader;
    private readonly verticalStepIFFT: ComputeShader;

    private readonly permutation: ComputeShader;

    constructor(engine: Engine, textureSize: number) {
        this.engine = engine;
        this.textureSize = textureSize;

        this.precompute = new ComputeShader("computeTwiddleFactors", this.engine, { computeSource: twiddleFactors }, {
            bindingsMapping: {
                "PrecomputeBuffer": { group: 0, binding: 0 },
                "params": { group: 0, binding: 1 }
            },
            entryPoint: "precomputeTwiddleFactorsAndInputIndices"
        });

        const logSize = Math.log2(textureSize) | 0;

        this.twiddleTable = createStorageTexture("precomputeTwiddle", this.engine, logSize, this.textureSize, Constants.TEXTUREFORMAT_RGBA);

        this.settings = new UniformBuffer(this.engine);

        this.settings.addUniform("Step", 1);
        this.settings.addUniform("Size", 1);

        this.precompute.setStorageTexture("PrecomputeBuffer", this.twiddleTable);
        this.precompute.setUniformBuffer("params", this.settings);

        this.settings.updateInt("Size", this.textureSize);
        this.settings.update();

        this.precompute.dispatch(logSize, this.textureSize / 2 / 8, 1);

        this.horizontalStepIFFT = new ComputeShader("horizontalStepIFFT", this.engine, { computeSource: horizontalStep }, {
            bindingsMapping: {
                "params": { group: 0, binding: 0 },
                "PrecomputedData": { group: 0, binding: 1 },
                "InputBuffer": { group: 0, binding: 2 },
                "OutputBuffer": { group: 0, binding: 3 }
            },
            entryPoint: "horizontalStepInverseFFT"
        });

        this.horizontalStepIFFT.setUniformBuffer("params", this.settings);
        this.horizontalStepIFFT.setTexture("PrecomputedData", this.twiddleTable, false);

        this.verticalStepIFFT = new ComputeShader("verticalStepIFFT", this.engine, { computeSource: verticalStep }, {
            bindingsMapping: {
                "params": { group: 0, binding: 0 },
                "PrecomputedData": { group: 0, binding: 1 },
                "InputBuffer": { group: 0, binding: 2 },
                "OutputBuffer": { group: 0, binding: 3 }
            },
            entryPoint: "verticalStepInverseFFT"
        });

        this.verticalStepIFFT.setUniformBuffer("params", this.settings);
        this.verticalStepIFFT.setTexture("PrecomputedData", this.twiddleTable, false);

        this.permutation = new ComputeShader("permute", this.engine, { computeSource: permutation }, {
            bindingsMapping: {
                "InputBuffer": { group: 0, binding: 0 },
                "OutputBuffer": { group: 0, binding: 1 }
            },
            entryPoint: "permute"
        });
    }

    /**
     * Apply the inverse fast fourier transform to the input texture and store the result in the output texture
     * The input texture will also be modified as part of the process
     * @param input
     * @param output
     */
    public applyToTexture(input: BaseTexture, output: BaseTexture): void {
        const logSize = Math.log2(this.textureSize) | 0;

        let pingPong = false;
        for (let i = 0; i < logSize; ++i) {
            pingPong = !pingPong;

            this.settings.updateInt("Step", i);
            this.settings.update();

            this.horizontalStepIFFT.setTexture("InputBuffer", pingPong ? input : output, false);
            this.horizontalStepIFFT.setStorageTexture("OutputBuffer", pingPong ? output : input);

            this.horizontalStepIFFT.dispatch(Math.ceil(this.textureSize / 8), Math.ceil(this.textureSize / 8), 1);
        }

        for (let i = 0; i < logSize; ++i) {
            pingPong = !pingPong;

            this.settings.updateInt("Step", i);
            this.settings.update();

            this.verticalStepIFFT.setTexture("InputBuffer", pingPong ? input : output, false);
            this.verticalStepIFFT.setStorageTexture("OutputBuffer", pingPong ? output : input);

            this.verticalStepIFFT.dispatch(Math.ceil(this.textureSize / 8), Math.ceil(this.textureSize / 8), 1);
        }

        if (pingPong) {
            CopyTexture.Copy(output, input, this.engine);
        }

        this.permutation.setTexture("InputBuffer", input, false);
        this.permutation.setStorageTexture("OutputBuffer", output);

        this.permutation.dispatch(Math.ceil(this.textureSize / 8), Math.ceil(this.textureSize / 8), 1);

        CopyTexture.Copy(output, input, this.engine);
    }

    public dispose(): void {
        this.twiddleTable.dispose();
        this.settings.dispose();
    }
}