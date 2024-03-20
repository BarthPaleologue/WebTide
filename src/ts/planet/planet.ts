import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Direction, PlanetChunk } from "./planetChunk";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";

export class Planet {
    readonly transform: TransformNode;
    readonly chunks: PlanetChunk[];
    readonly material: StandardMaterial;

    constructor(radius: number, scene: Scene) {
        this.transform = new TransformNode("planet", scene);

        this.chunks = [
            new PlanetChunk(Direction.TOP, radius, scene),
            new PlanetChunk(Direction.BOTTOM, radius, scene),
            new PlanetChunk(Direction.LEFT, radius, scene),
            new PlanetChunk(Direction.RIGHT, radius, scene),
            new PlanetChunk(Direction.FRONT, radius, scene),
            new PlanetChunk(Direction.BACK, radius, scene)
        ];

        this.material = new StandardMaterial("planetMaterial", scene);
        this.material.specularColor.scaleInPlace(0);

        this.chunks.forEach(async (chunk) => {
            chunk.mesh.parent = this.transform;
            chunk.mesh.material = this.material;
            await chunk.init(scene);
        });
    }
}
