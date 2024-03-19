import { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";

/**
 * Ocean simulation using FFT are based on an initial spectrum configuration that is used later to generate the state of the ocean at each frame (dynamic spectrum).
 * Common choices are the Phillips spectrum or the JONSWAP spectrum, but any initial spectrum can be used.
 */
export interface InitialSpectrum {
    /**
     * The size used for the textures in the ocean simulation. Usually a power of 2 between 128 and 2048.
     * A higher resolution will give more precise results at the expense of performance.
     * It corresponds to the M and N values in Tessendorf's paper.
     */
    readonly textureSize: number;

    /**
     * The scale of the ocean tiles. A higher value will make the waves smaller and more frequent.
     * It corresponds to the Lx and Ly values in Tessendorf's paper.
     */
    readonly tileScale: number;

    /**
     * The textures containing the initial spectrum data.
     * It must be a 2D texture with a texture format of RGBA.
     * The first 2 channels are the h0(k) part of the spectrum while the last 2 channels are the h0*(-k) part of the spectrum.
     */
    readonly h0: BaseTexture;
}