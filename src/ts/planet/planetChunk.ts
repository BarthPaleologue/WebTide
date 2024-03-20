import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { computeVertexData } from "./computeVertexData";

export enum Direction {
    FRONT,
    BACK,
    LEFT,
    RIGHT,
    TOP,
    BOTTOM
}

function rotationFromDirection(direction: Direction) {
    switch (direction) {
        case Direction.BACK:
            return Quaternion.RotationAxis(new Vector3(0, 1, 0), Math.PI);
        case Direction.LEFT:
            return Quaternion.RotationAxis(new Vector3(0, 1, 0), Math.PI / 2);
        case Direction.RIGHT:
            return Quaternion.RotationAxis(new Vector3(0, 1, 0), -Math.PI / 2);
        case Direction.TOP:
            return Quaternion.RotationAxis(new Vector3(1, 0, 0), Math.PI / 2);
        case Direction.BOTTOM:
            return Quaternion.RotationAxis(new Vector3(1, 0, 0), -Math.PI / 2);
        default:
            return Quaternion.Identity();
    }
}

export class PlanetChunk {
    readonly mesh: Mesh;

    private readonly nbVerticesPerRow = 256;
    private readonly size: number;
    private readonly direction: Direction;

    constructor(direction: Direction, planetRadius: number, scene: Scene) {
        this.mesh = new Mesh("chunk", scene);
        this.size = planetRadius * 2;
        this.direction = direction;
    }

    async init(scene: Scene) {
        if (!scene.getEngine().getCaps().supportComputeShaders) throw new Error("Compute shaders are not supported");

        const vertexData = await computeVertexData(this.nbVerticesPerRow, this.mesh.position, rotationFromDirection(this.direction), this.size, scene.getEngine());
        vertexData.applyToMesh(this.mesh);
    }
}
