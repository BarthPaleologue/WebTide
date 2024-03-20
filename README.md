# WebTide

[![NodeJS with Webpack](https://github.com/BarthPaleologue/babylonjs-template/actions/workflows/webpack.yml/badge.svg)](https://github.com/BarthPaleologue/babylonjs-template/actions/workflows/webpack.yml)

![img.png](cover.png)

WebTide is an ocean simulation based on [Jerry Tessendorf's paper](https://people.computing.clemson.edu/~jtessen/reports/papers_files/coursenotes2004.pdf), implemented on WebGPU with BabylonJS.

This was my final project for the INF585 "Computer Animation" course at École Polytechnique.

An online demo is available [here](https://barthpaleologue.github.io/WebTide/).

## Features

- [x] GPU-based FFT
- [x] Phillips spectrum
- [x] Wave vertices vertical displacement
- [x] Choppy waves (waves vertices horizontal displacement)
- [x] Physically based ocean shading
- [x] Wrapping on a sphere with triplanar mapping
- [ ] Jacobian-based foam

## How to use

Using the ocean in your own project is straightforward:

```ts
const textureSize = 512;
const tileSize = 10;

const initialSpectrum = new PhillipsSpectrum(textureSize, tileSize, engine);
const waterMaterial = new WaterMaterial("waterMaterial", initialSpectrum, scene);

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

## Build

```
npm run build
```

or

```
yarn build
```

to bundle your application
