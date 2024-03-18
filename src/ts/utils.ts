import { Constants, Mesh, Nullable, RawTexture, StandardMaterial, ThinEngine } from "@babylonjs/core";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

export function createStorageTexture(name: string, engine: ThinEngine, nwidth: number, nheight: number, textureFormat = Constants.TEXTUREFORMAT_RGBA, textureType = Constants.TEXTURETYPE_FLOAT,
    filterMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE, generateMipMaps = false, wrapMode = Constants.TEXTURE_WRAP_ADDRESSMODE, texture: Nullable<Texture> = null): Texture
{
    const { width, height } = texture ? texture.getSize() : { width: 0, height: 0 };
    let type = texture ? (texture.getInternalTexture()!.type ?? -1) : -2;
    let format = texture ? (texture.getInternalTexture()!.format ?? -1) : -2;
    if (type === -1) {
        type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
    }
    if (format === -1) {
        format = Constants.TEXTUREFORMAT_RGBA;
    }
    if (!texture || width !== nwidth || height !== nheight || textureType !== type || textureFormat !== format) {
        /*texture = new RenderTargetTexture(name, { width: nwidth, height: nheight }, scene, false, undefined, textureType, false, filterMode, false, false, false,
            textureFormat, false, undefined, Constants.TEXTURE_CREATIONFLAG_STORAGE);*/
        texture = new RawTexture(null, nwidth, nheight, textureFormat, engine, generateMipMaps, false, filterMode, textureType, Constants.TEXTURE_CREATIONFLAG_STORAGE);
        texture.name = name;
    }
    texture.wrapU = wrapMode;
    texture.wrapV = wrapMode;
    texture.updateSamplingMode(filterMode);

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

export function createTexturedPlane(texture: Texture, scene: Scene): Mesh {
    const plane = MeshBuilder.CreateGround("plane", { width: 1, height: 1 }, scene);
    const material = new StandardMaterial("planeMaterial", scene);
    material.emissiveTexture = texture;
    material.disableLighting = true;
    plane.material = material;
    return plane;
}