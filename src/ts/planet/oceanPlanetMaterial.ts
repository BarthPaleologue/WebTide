import fragment from "../../shaders/oceanPlanetMaterial/fragment.glsl";
import vertex from "../../shaders/oceanPlanetMaterial/vertex.glsl";

import { Scene } from "@babylonjs/core/scene";
import { IFFT } from "../utils/IFFT";
import { createStorageTexture } from "../utils/utils";
import { DynamicSpectrum } from "../spectrum/dynamicSpectrum";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Constants } from "@babylonjs/core/Engines/constants";
import { InitialSpectrum } from "../spectrum/initialSpectrum";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import "@babylonjs/core/Rendering/depthRendererSceneComponent";
import { DepthRenderer } from "@babylonjs/core/Rendering/depthRenderer";
import { RenderTargetTexture } from "@babylonjs/core/Materials/Textures/renderTargetTexture";

import TropicalSunnyDay_ny from "../../assets/skybox/TropicalSunnyDay_ny.jpg";

import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

/**
 * This material wraps the ocean around a sphere using triplanar mapping.
 * It works in the same way as the WaterMaterial but with a different shader.
 */
export class OceanPlanetMaterial extends ShaderMaterial {
    /**
     * The size of the textures used in the simulation. Higher values are more accurate but slower to compute.
     */
    readonly textureSize: number;

    /**
     * The scale of the ocean tiles. A higher value will make the waves smaller and more frequent.
     */
    readonly tileScale: number;

    readonly reflectionTexture: CubeTexture;

    /**
     * The spectrum describing the simulation at time t=0.
     */
    readonly initialSpectrum: InitialSpectrum;

    /**
     * The spectrum describing the simulation at the current time.
     */
    readonly dynamicSpectrum: DynamicSpectrum;

    /**
     * The IFFT calculator used to compute the height map, gradient map and displacement map.
     */
    readonly ifft: IFFT;

    /**
     * The height map is used to translate vertically the water vertices.
     * It is computed using the IFFT of the dynamic spectrum.
     */
    readonly heightMap: BaseTexture;

    /**
     * The gradient map is used to compute the normals of the water mesh in order to shade it properly.
     * It is computed using the IFFT of the dynamic spectrum.
     */
    readonly gradientMap: BaseTexture;

    /**
     * The displacement map is used to achieve the "Choppy waves" effect described in Tessendorf's paper.
     * It helps to make sharper wave crests and smoother troughs.
     * It is computed using the IFFT of the dynamic spectrum.
     */
    readonly displacementMap: BaseTexture;

    readonly depthRenderer: DepthRenderer;

    readonly screenRenderTarget: RenderTargetTexture;

    /**
     * The elapsed time in seconds since the simulation started.
     * Starting at 0 creates some visual artefacts, so we start at 1 hour to avoid them.
     * @private
     */
    private elapsedSeconds = 3600;

    constructor(name: string, initialSpectrum: InitialSpectrum, scene: Scene) {
        if (Effect.ShadersStore["oceanPlanetVertexShader"] === undefined) {
            Effect.ShadersStore["oceanPlanetVertexShader"] = vertex;
        }
        if (Effect.ShadersStore["oceanPlanetFragmentShader"] === undefined) {
            Effect.ShadersStore["oceanPlanetFragmentShader"] = fragment;
        }
        super(name, scene, "oceanPlanet", {
            attributes: ["position", "normal"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "cameraPositionW", "lightDirection", "planetWorld", "planetInverseWorld", "tileScale"],
            samplers: ["heightMap", "gradientMap", "displacementMap", "reflectionSampler", "depthSampler", "textureSampler"]
        });
        this.depthRenderer = scene.enableDepthRenderer(scene.activeCamera, false, true);
        this.setTexture("depthSampler", this.depthRenderer.getDepthMap());

        // create render target texture
        this.screenRenderTarget = new RenderTargetTexture("screenTexture", { ratio: scene.getEngine().getRenderWidth() / scene.getEngine().getRenderHeight() }, scene);
        scene.customRenderTargets.push(this.screenRenderTarget);

        this.setTexture("textureSampler", this.screenRenderTarget);

        this.reflectionTexture = new CubeTexture("", scene, null, false, [
            TropicalSunnyDay_ny, TropicalSunnyDay_ny, TropicalSunnyDay_ny,
            TropicalSunnyDay_ny, TropicalSunnyDay_ny, TropicalSunnyDay_ny
        ]);
        //this.reflectionTexture.coordinatesMode = Constants.TEXTURE_CUBE_MAP;
        this.setTexture("reflectionSampler", this.reflectionTexture);

        if (initialSpectrum.h0.textureFormat != Constants.TEXTUREFORMAT_RGBA) {
            throw new Error("The base spectrum must have a texture format of RGBA");
        }

        this.textureSize = initialSpectrum.textureSize;
        this.tileScale = initialSpectrum.tileScale;

        this.initialSpectrum = initialSpectrum;
        this.dynamicSpectrum = new DynamicSpectrum(this.initialSpectrum, scene.getEngine());

        this.ifft = new IFFT(scene.getEngine(), this.textureSize);
        this.heightMap = createStorageTexture("heightBuffer", scene.getEngine(), this.textureSize, this.textureSize, Constants.TEXTUREFORMAT_RG);
        this.gradientMap = createStorageTexture("gradientBuffer", scene.getEngine(), this.textureSize, this.textureSize, Constants.TEXTUREFORMAT_RG);
        this.displacementMap = createStorageTexture("displacementBuffer", scene.getEngine(), this.textureSize, this.textureSize, Constants.TEXTUREFORMAT_RG);

        this.setTexture("heightMap", this.heightMap);
        this.setTexture("gradientMap", this.gradientMap);
        this.setTexture("displacementMap", this.displacementMap);
    }

    /**
     * Update the material with the new state of the ocean simulation.
     * IFFT will be used to compute the height map, gradient map and displacement map for the current time.
     * @param deltaSeconds The time elapsed since the last update in seconds
     * @param planetTransform
     * @param lightDirection The direction of the light in the scene
     */
    public update(deltaSeconds: number, planetTransform: TransformNode, lightDirection: Vector3) {
        this.elapsedSeconds += deltaSeconds;
        this.dynamicSpectrum.generate(this.elapsedSeconds);

        const allNonWaterMeshes = this.getScene().meshes.filter(mesh => mesh.material !== this);

        this.depthRenderer.getDepthMap().renderList = allNonWaterMeshes;
        this.screenRenderTarget.renderList = allNonWaterMeshes;

        this.ifft.applyToTexture(this.dynamicSpectrum.ht, this.heightMap);
        this.ifft.applyToTexture(this.dynamicSpectrum.dht, this.gradientMap);
        this.ifft.applyToTexture(this.dynamicSpectrum.displacement, this.displacementMap);

        const activeCamera = this.getScene().activeCamera;
        if (activeCamera === null) throw new Error("No active camera found");
        this.setVector3("cameraPositionW", activeCamera.globalPosition);

        this.setVector3("lightDirection", lightDirection);

        this.setFloat("tileScale", this.tileScale);

        this.setMatrix("planetWorld", planetTransform.getWorldMatrix());
        this.setMatrix("planetInverseWorld", planetTransform.getWorldMatrix().clone().invert());
    }

    public dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean, notBoundToMesh?: boolean) {
        this.dynamicSpectrum.dispose();
        this.ifft.dispose();
        this.heightMap.dispose();
        this.gradientMap.dispose();
        this.displacementMap.dispose();

        super.dispose(forceDisposeEffect, forceDisposeTextures, notBoundToMesh);
    }
}