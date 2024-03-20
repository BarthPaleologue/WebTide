const PI: f32 = 3.1415926;

@group(0) @binding(0) var H0: texture_storage_2d<rgba32float, write>;
@group(0) @binding(1) var Noise: texture_2d<f32>;

struct Params {
    textureSize: u32,
    tileSize: f32,
    windTheta: f32,
    windSpeed: f32,
    smallWaveLengthCutoff: f32,
};

@group(0) @binding(2) var<uniform> params: Params;

fn phillipsSpectrum2D(k: vec2<f32>) -> f32 {
    if(length(k) < 0.0001) {
        return 0.0;
    }

    let A: f32 = 1.0;
    let windDir = vec2<f32>(cos(params.windTheta), sin(params.windTheta));
    let g: f32 = 9.81;
    let L: f32 = params.windSpeed * params.windSpeed / g;
    let k2: f32 = dot(k, k);
    let kL2: f32 = k2 * L * L;
    let k4: f32 = k2 * k2;
    var kw2: f32 = dot(normalize(k), normalize(windDir));
    kw2 *= kw2;

    let l: f32 = params.smallWaveLengthCutoff;
    let cutoff: f32 = exp(-k2 * l * l);

    return A * exp(-1.0 / kL2) * kw2 * cutoff / k4;
}

@compute @workgroup_size(8,8,1)
fn computeSpectrum(@builtin(global_invocation_id) id: vec3<u32>)
{
	let deltaK = 2.0 * PI / params.tileSize;
	let nx = f32(id.x) - f32(params.textureSize) / 2.0;
	let nz = f32(id.y) - f32(params.textureSize) / 2.0;
	let k = vec2<f32>(nx, nz) * deltaK;

    let noise_k = textureLoad(Noise, vec2<i32>(id.xy), 0).xy;
    let h0_k = noise_k * sqrt(phillipsSpectrum2D(k) / 2.0);

    let noise_minus_k = textureLoad(Noise, vec2<i32>(params.textureSize - id.xy), 0).xy;
    let h0_minus_k = noise_minus_k * sqrt(phillipsSpectrum2D(-k) / 2.0);
    let h0_minus_k_conj = vec2<f32>(h0_minus_k.x, -h0_minus_k.y);

    textureStore(H0, vec2<i32>(id.xy), vec4<f32>(h0_k, h0_minus_k_conj));
}