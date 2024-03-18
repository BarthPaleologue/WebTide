import { Texture } from "@babylonjs/core/Materials/Textures/texture";

export interface Spectrum {
    readonly textureSize: number;
    readonly tileScale: number;

    readonly h0: Texture;
}