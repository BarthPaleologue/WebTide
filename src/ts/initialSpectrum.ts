import { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";

export interface InitialSpectrum {
    readonly textureSize: number;
    readonly tileScale: number;

    readonly h0: BaseTexture;
}