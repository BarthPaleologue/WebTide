import "../styles/index.scss";

import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import "@babylonjs/core/Loading/loadingScreen";
import { WebGPUEngine } from "@babylonjs/core/Engines";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";

import { WaterMaterial } from "./waterMaterial";
import { PhillipsSpectrum } from "./spectrum/phillipsSpectrum";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { Effect } from "@babylonjs/core/Materials/effect";

import "@babylonjs/core/Rendering/depthRendererSceneComponent";

import sandTexture from "../assets/sand.jpg";

import postProcessCode from "../shaders/smallPostProcess.glsl";
//import { OceanPlanetMaterial } from "./planet/oceanPlanetMaterial";
//import { Planet } from "./planet/planet";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

if (!(await WebGPUEngine.IsSupportedAsync)) {
    alert(
        "WebGPU is not supported in your browser. Please check the compatibility here: https://github.com/gpuweb/gpuweb/wiki/Implementation-Status#implementation-status");
}

const engine = new WebGPUEngine(canvas, { antialias: true });
engine.loadingScreen.displayLoadingUI();
await engine.initAsync();

const scene = new Scene(engine);

const camera = new ArcRotateCamera("camera", 3.14 / 3, 0.02 + 3.14 / 2, 5, new Vector3(0, 0.8, 0), scene);
camera.wheelPrecision = 100;
camera.angularSensibilityX = 3000;
camera.angularSensibilityY = 3000;
camera.lowerRadiusLimit = 2;
//camera.upperBetaLimit = 3.14 / 2;
camera.attachControl();

const light = new DirectionalLight("light", new Vector3(1, -1, 3).normalize(), scene);

const textureSize = 256;
const tileSize = 10;

const depthRenderer = scene.enableDepthRenderer(camera, false, true);
const initialSpectrum = new PhillipsSpectrum(textureSize, tileSize, engine);
const waterMaterial = new WaterMaterial("waterMaterial", initialSpectrum, scene);

/*const oceanPlanetMaterial = new OceanPlanetMaterial("oceanPlanet", initialSpectrum, scene);
const planetRadius = 2;
const planet = new Planet(planetRadius, oceanPlanetMaterial, scene);
planet.transform.position.y = planetRadius + 1;
planet.transform.position.x = -10;
planet.transform.position.z = -5;*/

const skybox = MeshBuilder.CreateBox("skyBox", { size: camera.maxZ / 2 }, scene);
const skyboxMaterial = new StandardMaterial("skyBox", scene);
skyboxMaterial.backFaceCulling = false;
skyboxMaterial.reflectionTexture = waterMaterial.reflectionTexture;
skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
skyboxMaterial.disableLighting = true;
skybox.material = skyboxMaterial;

const groundMaterial = new StandardMaterial("groundMaterial", scene);
groundMaterial.diffuseTexture = new Texture(sandTexture, scene);
groundMaterial.specularColor.scaleInPlace(0);

const radius = 3;

const ground = MeshBuilder.CreateGround(
    "ground",
    {
        width: tileSize * radius * 4,
        height: tileSize * radius * 4
    },
    scene
);
ground.material = groundMaterial;
ground.position.y = -2;

for (let x = -radius; x <= radius; x++) {
    for (let z = -radius; z <= radius; z++) {
        const water = MeshBuilder.CreateGround(
            "water",
            {
                width: tileSize,
                height: tileSize,
                subdivisions: textureSize
            },
            scene
        );
        water.material = waterMaterial;
        water.position.x = x * tileSize;
        water.position.z = z * tileSize;
    }
}

Effect.ShadersStore[`PostProcess1FragmentShader`] = postProcessCode;
const postProcess = new PostProcess(
    "postProcess1",
    "PostProcess1",
    ["cameraInverseView", "cameraInverseProjection", "cameraPosition"],
    ["textureSampler", "depthSampler"],
    1,
    camera,
    Texture.BILINEAR_SAMPLINGMODE,
    engine
);
postProcess.onApplyObservable.add((effect) => {
    effect.setTexture("depthSampler", depthRenderer.getDepthMap());
    effect.setMatrix("cameraInverseView", camera.getViewMatrix().clone().invert());
    effect.setMatrix("cameraInverseProjection", camera.getProjectionMatrix().clone().invert());
});

function updateScene() {
    const deltaSeconds = engine.getDeltaTime() / 1000;
    waterMaterial.update(deltaSeconds, light.direction);
    //oceanPlanetMaterial.update(deltaSeconds, planet.transform, light.direction);
}

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    scene.registerBeforeRender(() => updateScene());
    engine.runRenderLoop(() => scene.render());
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize(true);
});
