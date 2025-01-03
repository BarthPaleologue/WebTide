import heightMapComputeSource from "./vertexData.wgsl";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { ComputeShader } from "@babylonjs/core/Compute/computeShader";
import { StorageBuffer } from "@babylonjs/core/Buffers/storageBuffer";
import { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";

export async function computeVertexData(nbVerticesPerRow: number, position: Vector3, rotation: Quaternion, size: number, engine: WebGPUEngine): Promise<VertexData> {
    const computeShader = new ComputeShader(
        "heightMap",
        engine,
        { computeSource: heightMapComputeSource },
        {
            bindingsMapping: {
                positions: { group: 0, binding: 0 },
                normals: { group: 0, binding: 1 },
                indices: { group: 0, binding: 2 },
                params: { group: 0, binding: 3 }
            }
        }
    );

    const positions = new Float32Array(nbVerticesPerRow * nbVerticesPerRow * 3);
    const normals = new Float32Array(nbVerticesPerRow * nbVerticesPerRow * 3);
    const indices = new Uint32Array((nbVerticesPerRow - 1) * (nbVerticesPerRow - 1) * 6);

    const positionsBuffer = new StorageBuffer(engine, positions.byteLength);
    positionsBuffer.update(positions);
    computeShader.setStorageBuffer("positions", positionsBuffer);

    const normalsBuffer = new StorageBuffer(engine, normals.byteLength);
    normalsBuffer.update(normals);
    computeShader.setStorageBuffer("normals", normalsBuffer);

    const indicesBuffer = new StorageBuffer(engine, indices.byteLength);
    indicesBuffer.update(indices);
    computeShader.setStorageBuffer("indices", indicesBuffer);

    const paramsBuffer = new UniformBuffer(engine);

    paramsBuffer.addUniform("nbVerticesPerRow", 1);
    paramsBuffer.addUniform("size", 1);
    paramsBuffer.addUniform("position", 3);
    paramsBuffer.addUniform("rotationMatrix", 16);

    paramsBuffer.updateUInt("nbVerticesPerRow", nbVerticesPerRow);
    paramsBuffer.updateFloat("size", size);
    paramsBuffer.updateVector3("position", position);
    paramsBuffer.updateMatrix("rotationMatrix", rotation.toRotationMatrix(new Matrix()));
    paramsBuffer.update();

    computeShader.setUniformBuffer("params", paramsBuffer);

    return new Promise((resolve, reject) => {
        computeShader
            .dispatchWhenReady(nbVerticesPerRow, nbVerticesPerRow, 1)
            .then(async () => {
                try {
                    const [positionsBufferView, normalsBufferView, indicesBufferView] = await Promise.all([positionsBuffer.read(), normalsBuffer.read(), indicesBuffer.read()]);

                    const positions = new Float32Array(positionsBufferView.buffer);
                    positionsBuffer.dispose();

                    const normals = new Float32Array(normalsBufferView.buffer);
                    normalsBuffer.dispose();

                    const indices = new Uint32Array(indicesBufferView.buffer);
                    indicesBuffer.dispose();

                    const vertexData = new VertexData();
                    vertexData.positions = positions;
                    vertexData.indices = indices;
                    vertexData.normals = normals;

                    resolve(vertexData);
                } catch (error) {
                    reject(new Error("Error: " + error));
                }
            })
            .catch((error) => {
                reject(new Error("Error: " + error));
            });
    });
}
