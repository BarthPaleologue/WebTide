import { BaseTexture, ComputeShader, Constants, UniformBuffer } from "@babylonjs/core";
import { Engine } from "@babylonjs/core/Engines/engine";

import copyTexture2 from "../shaders/copyTexture2.wgsl";
import copyTexture4 from "../shaders/copyTexture4.wgsl";

export class CopyTexture {
    static copy2ChannelsComputeShader: ComputeShader;
    static copy4ChannelsComputeShader: ComputeShader;

    static params: UniformBuffer;

    static Copy(source: BaseTexture, dest: BaseTexture, engine: Engine): void {
        const numChannels = source.getInternalTexture()?.format === Constants.TEXTUREFORMAT_RG ? 2 : 4;
        if (!CopyTexture.copy4ChannelsComputeShader && numChannels === 4 || !CopyTexture.copy2ChannelsComputeShader && numChannels === 2) {
            const cs1 = new ComputeShader(`copyTexture${numChannels}Compute`, engine, {
                computeSource: numChannels === 4 ?
                    copyTexture4 :
                    copyTexture2
            }, {
                bindingsMapping:
                    {
                        "dest": { group: 0, binding: 0 },
                        "src": { group: 0, binding: 1 },
                        "params": { group: 0, binding: 2 }
                    }
            });

            const uBuffer0 = new UniformBuffer(engine);

            uBuffer0.addUniform("width", 1);
            uBuffer0.addUniform("height", 1);

            cs1.setUniformBuffer("params", uBuffer0);

            if (numChannels === 4) {
                CopyTexture.copy4ChannelsComputeShader = cs1;
                CopyTexture.params = uBuffer0;
            } else {
                CopyTexture.copy2ChannelsComputeShader = cs1;
                CopyTexture.params = uBuffer0;
            }
        }

        const cs = numChannels === 4 ? CopyTexture.copy4ChannelsComputeShader : CopyTexture.copy2ChannelsComputeShader;
        const params = CopyTexture.params;

        cs.setTexture("src", source, false);
        cs.setStorageTexture("dest", dest);

        const { width, height } = source.getSize();

        params.updateInt("width", width);
        params.updateInt("height", height);
        params.update();

        cs.dispatch(Math.ceil(width / 8), Math.ceil(height / 8), 1);
    }
}