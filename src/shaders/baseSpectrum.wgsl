const PI : f32 = 3.1415926;

@group(0) @binding(0) var H0K : texture_storage_2d<rg32float, write>;
@group(0) @binding(1) var Noise : texture_2d<f32>;

struct Params {
    Size : u32,
    LengthScale : f32
};

@group(0) @binding(2) var<uniform> params : Params;

fn phillipsSpectrum2D(k: vec2<f32>) -> f32 {
    if(length(k) < 0.0001) {
        return 0.0;
    }

    let A: f32 = 1.0;
    let windSpeed: f32 = 31.0;
    let windDir = normalize(vec2<f32>(1.0, 0.0));
    let g: f32 = 9.81;
    let L: f32 = windSpeed * windSpeed / g;
    let kL2: f32 = dot(k, k) * L * L;
    let k4: f32 = dot(k, k) * dot(k, k);
    var kw2: f32 = dot(normalize(k), normalize(windDir));
    kw2 *= kw2;

    let l: f32 = 1.0;
    let cutoff: f32 = exp(-dot(k, k) * l * l);

    return A * exp(-1.0 / kL2) * kw2 * cutoff / k4;
}

@compute @workgroup_size(8,8,1)
fn computeSpectrum(@builtin(global_invocation_id) id : vec3<u32>)
{
	let deltaK = 2.0 * PI / params.LengthScale;
	let nx = f32(id.x) - f32(params.Size) / 2.0;
	let nz = f32(id.y) - f32(params.Size) / 2.0;
	let k = vec2<f32>(nx, nz) * deltaK;

    let spectrum = phillipsSpectrum2D(k);
    let noise = textureLoad(Noise, vec2<i32>(id.xy), 0).xy;
    textureStore(H0K, vec2<i32>(id.xy), vec4<f32>(noise * sqrt(spectrum / 2.0), vec2(0.0)));
}