@group(0) @binding(0) var dest : texture_storage_2d<rgba32float, write>;
@group(0) @binding(1) var src : texture_2d<f32>;

struct Params {
    width : u32,
    height : u32,
};
@group(0) @binding(2) var<uniform> params : Params;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
    if (global_id.x >= params.width || global_id.y >= params.height) {
        return;
    }
    let pixel: vec4<f32> = textureLoad(src, vec2<i32>(global_id.xy), 0);
    textureStore(dest, vec2<i32>(global_id.xy), pixel);
}