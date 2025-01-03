# WebTide

[![NodeJS with Webpack](https://github.com/BarthPaleologue/babylonjs-template/actions/workflows/webpack.yml/badge.svg)](https://github.com/BarthPaleologue/babylonjs-template/actions/workflows/webpack.yml)

[![img.png](cover.png)](https://barthpaleologue.github.io/WebTide/)

WebTide is an ocean simulation based on [Jerry Tessendorf's paper](https://people.computing.clemson.edu/~jtessen/reports/papers_files/coursenotes2004.pdf), implemented on WebGPU with BabylonJS.

This was my final project for the INF585 "Computer Animation" course at École Polytechnique. The report is online [on my blog](https://barthpaleologue.github.io/Blog/posts/ocean-simulation-webgpu/).

An online demo is available [here](https://barthpaleologue.github.io/WebTide/), and the spherical version is available [here](https://barthpaleologue.github.io/WebTide/planet.html).

## Features

- [x] GPU-based FFT
- [x] Phillips spectrum
- [ ] JONSWAP spectrum
- [x] Wave vertices vertical displacement
- [x] Choppy waves (waves vertices horizontal displacement)
- [x] Physically based ocean shading
- [x] Wrapping on a sphere with triplanar mapping
- [ ] Jacobian-based foam

## How to use

Using the ocean in your own project is straightforward:

```ts
// This is the resolution of the wave spectrum. Bigger is better but slower.
const textureSize = 512;
// This is the size of the water plane in meters.
const tileSize = 10;

// Define your base spectrum
const initialSpectrum = new PhillipsSpectrum(textureSize, tileSize, engine);

// Create the water material
const waterMaterial = new WaterMaterial("waterMaterial", initialSpectrum, scene);

// Create a subdivided plane
const water = MeshBuilder.CreateGround(
    "water",
    {
        width: tileSize,
        height: tileSize,
        subdivisions: textureSize
    },
    scene
);

// Assign the water material to the plane
water.material = waterMaterial;

// The method to update the material every frame
function updateScene() {
    const deltaSeconds = engine.getDeltaTime() / 1000;
    waterMaterial.update(deltaSeconds, light.direction);
}

// Register the update method to the scene
scene.executeWhenReady(() => {
    scene.registerBeforeRender(() => updateScene());
    engine.runRenderLoop(() => scene.render());
});
```

You can have a look at the code in `src/ts/minimal.ts` for the simplest example possible.

## Create your own Spectrum

You might want to use a custom spectrum for your ocean. No worries, I got you covered.

The `WaterMaterial` class takes any object that implements the `InitialSpectrum` interface for the `initialSpectrum` parameter.

You can copy and paste the code for the Phillips Spectrum (the typescript class and the wgsl shader code) and start from there.

## Related works

I made this simulation using many different resources found online:

- [Simulating Ocean Water](https://people.computing.clemson.edu/~jtessen/reports/papers_files/coursenotes2004.pdf) by Jerry Tessendorf

- GPU-based FFT from [BabylonJS Ocean Demo](https://github.com/Popov72/OceanDemo) by Popov72

- Nice specular coefficients from [Shadertoy](https://www.shadertoy.com/view/MdXyzX) by afl_ext

- Acerola's excellent [video breakdown](https://www.youtube.com/watch?v=yPfagLeUa7k) of Tessendorf's paper

- [Tangent calculations](https://fileadmin.cs.lth.se/cs/Education/EDAF80/seminars/2022/sem_4.pdf) by Rikard Olajos

## Assets used

- Tropical sunny day skybox from the [BabylonJS Asset Library](https://doc.babylonjs.com/toolsAndResources/assetLibraries/availableTextures)

- Sand texture from [Engin Akyurt](https://unsplash.com/fr/photos/personne-portant-une-chaussure-en-cuir-noir-0uiRqKME5N4)

## Run locally

To run the project locally, you need to have Node.js installed. Then, run the following commands:

```bash
pnpm install
pnpm run serve
```

If you don't have `pnpm` installed, you can install it with `npm install -g pnpm`.
