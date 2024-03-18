const PI : f32 = 3.1415926;

@group(0) @binding(0) var H0: texture_2d<f32>;
@group(0) @binding(1) var HT: texture_storage_2d<rg32float, write>;

struct Params {
    Size: u32,
    LengthScale: f32,
    ElapsedSeconds: f32,
};

@group(0) @binding(2) var<uniform> params: Params;

fn omega(k: vec2<f32>) -> f32 {
    return sqrt(length(k) * 9.81);
}

fn complexMult(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
	return vec2<f32>(a.r * b.r - a.g * b.g, a.r * b.g + a.g * b.r);
}

@compute @workgroup_size(8,8,1)
fn computeSpectrum(@builtin(global_invocation_id) id: vec3<u32>) {
    let iid = vec3<i32>(id);

    let deltaK = 2.0 * PI / params.LengthScale;
    let nx = f32(id.x) - f32(params.Size) / 2.0;
    let nz = f32(id.y) - f32(params.Size) / 2.0;
    let k = vec2<f32>(nx, nz) * deltaK;

	let theta = params.ElapsedSeconds * omega(k);
	let exponent = vec2<f32>(cos(theta), sin(theta));
    let h0: vec4<f32> = textureLoad(H0, iid.xy, 0);

	let h = complexMult(h0.xy, exponent) + complexMult(h0.zw, vec2<f32>(exponent.x, -exponent.y));

    textureStore(HT, iid.xy, vec4<f32>(h.x, h.y, 0.0, 0.0));
}