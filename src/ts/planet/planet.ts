import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Direction, PlanetChunk } from "./planetChunk";
import { Material } from "@babylonjs/core/Materials/material";

export class Planet {
    readonly transform: TransformNode;
    readonly chunks: PlanetChunk[];
    readonly material: Material;

    constructor(radius: number, material: Material, scene: Scene) {
        this.transform = new TransformNode("planet", scene);

        this.chunks = [
            new PlanetChunk(Direction.TOP, radius, scene),
            new PlanetChunk(Direction.BOTTOM, radius, scene),
            new PlanetChunk(Direction.LEFT, radius, scene),
            new PlanetChunk(Direction.RIGHT, radius, scene),
            new PlanetChunk(Direction.FRONT, radius, scene),
            new PlanetChunk(Direction.BACK, radius, scene)
        ];

        this.material = material;

        this.chunks.forEach(async (chunk) => {
            chunk.mesh.parent = this.transform;
            chunk.mesh.material = this.material;
            await chunk.init(scene);
        });
    }
}
