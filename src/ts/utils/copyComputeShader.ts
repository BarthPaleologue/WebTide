import { ComputeShader } from "@babylonjs/core/Compute/computeShader";
import { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";
import { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import copyTexture2 from "../../shaders/copyTexture2.wgsl";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";

export class CopyComputeShader {
    readonly computeShader: ComputeShader;
    private readonly params: UniformBuffer;
    constructor(engine: WebGPUEngine) {
        this.computeShader = new ComputeShader(
            `copyTextureCompute`,
            engine,
            {
                computeSource: copyTexture2
            },
            {
                bindingsMapping: {
                    dest: { group: 0, binding: 0 },
                    src: { group: 0, binding: 1 },
                    params: { group: 0, binding: 2 }
                }
            }
        );

        this.params = new UniformBuffer(engine);

        this.params.addUniform("width", 1);
        this.params.addUniform("height", 1);

        this.computeShader.setUniformBuffer("params", this.params);
    }

    makeCopy(source: BaseTexture, destination: BaseTexture): void {
        this.computeShader.setTexture("src", source, false);
        this.computeShader.setStorageTexture("dest", destination);

        const { width, height } = source.getSize();

        this.params.updateInt("width", width);
        this.params.updateInt("height", height);

        this.params.update();

        this.computeShader.dispatch(Math.ceil(width / 8), Math.ceil(height / 8), 1);
    }
}
