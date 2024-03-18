import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import { RawTexture } from "@babylonjs/core/Materials/Textures/rawTexture";
import { Constants } from "@babylonjs/core/Engines/constants";
import { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";

export function createStorageTexture(name: string, engine: ThinEngine, width: number, height: number, textureFormat: number): Texture {
    const texture = new RawTexture(
        null,
        width,
        height,
        textureFormat,
        engine,
        false,
        false,
        Constants.TEXTURE_NEAREST_SAMPLINGMODE,
        Constants.TEXTURETYPE_FLOAT,
        Constants.TEXTURE_CREATIONFLAG_STORAGE
    );
    texture.name = name;
    texture.wrapU = Constants.TEXTURE_WRAP_ADDRESSMODE;
    texture.wrapV = Constants.TEXTURE_WRAP_ADDRESSMODE;

    return texture;
}

/**
 * Generate a random number following a gaussian distribution
 */
export function gaussianRandom() {
    return Math.cos(2 * Math.PI * Math.random()) * Math.sqrt(-2 * Math.log(Math.random()));
}

export function createGaussianRandomTexture(textureSize: number, engine: ThinEngine) {
    const dataArray = new Uint8Array(textureSize * textureSize * 2);
    for (let i = 0; i < dataArray.length; i += 2) {
        dataArray[i] = gaussianRandom();
        dataArray[i + 1] = gaussianRandom();
    }

    return new RawTexture(dataArray, textureSize, textureSize, Constants.TEXTUREFORMAT_RG, engine, false, false, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
}

export function createTexturedPlane(texture: BaseTexture, scene: Scene): Mesh {
    const plane = MeshBuilder.CreateGround("plane", { width: 1, height: 1 }, scene);
    const material = new StandardMaterial("planeMaterial", scene);
    material.emissiveTexture = texture;
    material.disableLighting = true;
    plane.material = material;
    return plane;
}
