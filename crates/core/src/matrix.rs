use nalgebra::{Matrix3, Matrix4, Vector3};
use wasm_bindgen::prelude::*;

/// Interpolate between two 3x3 matrices
#[wasm_bindgen]
pub fn lerp_matrix3(from: &[f32], to: &[f32], t: f32) -> Vec<f32> {
    let t = t.clamp(0.0, 1.0);
    from.iter()
        .zip(to.iter())
        .map(|(a, b)| a + (b - a) * t)
        .collect()
}

/// Convert 3x3 matrix to 4x4 for WebGL (column-major)
#[wasm_bindgen]
pub fn mat3_to_mat4(m: &[f32]) -> Vec<f32> {
    if m.len() != 9 {
        return vec![1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0];
    }
    vec![
        m[0], m[1], m[2], 0.0,
        m[3], m[4], m[5], 0.0,
        m[6], m[7], m[8], 0.0,
        0.0,  0.0,  0.0,  1.0,
    ]
}

/// Calculate determinant of 3x3 matrix
#[wasm_bindgen]
pub fn determinant3(m: &[f32]) -> f32 {
    if m.len() != 9 {
        return 0.0;
    }
    let mat = Matrix3::from_column_slice(m);
    mat.determinant()
}

/// Create rotation matrix around X axis
#[wasm_bindgen]
pub fn rotation_x(angle: f32) -> Vec<f32> {
    let c = angle.cos();
    let s = angle.sin();
    vec![
        1.0, 0.0, 0.0,
        0.0, c,   s,
        0.0, -s,  c,
    ]
}

/// Create rotation matrix around Y axis
#[wasm_bindgen]
pub fn rotation_y(angle: f32) -> Vec<f32> {
    let c = angle.cos();
    let s = angle.sin();
    vec![
        c,   0.0, -s,
        0.0, 1.0, 0.0,
        s,   0.0, c,
    ]
}

/// Create rotation matrix around Z axis
#[wasm_bindgen]
pub fn rotation_z(angle: f32) -> Vec<f32> {
    let c = angle.cos();
    let s = angle.sin();
    vec![
        c,   s,   0.0,
        -s,  c,   0.0,
        0.0, 0.0, 1.0,
    ]
}

/// Create uniform scale matrix
#[wasm_bindgen]
pub fn scale_uniform(s: f32) -> Vec<f32> {
    vec![
        s,   0.0, 0.0,
        0.0, s,   0.0,
        0.0, 0.0, s,
    ]
}

/// Create scale matrix
#[wasm_bindgen]
pub fn scale(sx: f32, sy: f32, sz: f32) -> Vec<f32> {
    vec![
        sx,  0.0, 0.0,
        0.0, sy,  0.0,
        0.0, 0.0, sz,
    ]
}

/// Create shear matrix (xy shear)
#[wasm_bindgen]
pub fn shear_xy(shx: f32, shy: f32) -> Vec<f32> {
    vec![
        1.0, shy, 0.0,
        shx, 1.0, 0.0,
        0.0, 0.0, 1.0,
    ]
}

/// Identity matrix
#[wasm_bindgen]
pub fn identity3() -> Vec<f32> {
    vec![
        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.0, 1.0,
    ]
}

/// Multiply two 3x3 matrices
#[wasm_bindgen]
pub fn multiply3(a: &[f32], b: &[f32]) -> Vec<f32> {
    if a.len() != 9 || b.len() != 9 {
        return identity3();
    }
    let ma = Matrix3::from_column_slice(a);
    let mb = Matrix3::from_column_slice(b);
    let result = ma * mb;
    result.as_slice().to_vec()
}

/// Create a perspective projection matrix
#[wasm_bindgen]
pub fn perspective(fov_y: f32, aspect: f32, near: f32, far: f32) -> Vec<f32> {
    let f = 1.0 / (fov_y / 2.0).tan();
    let nf = 1.0 / (near - far);
    vec![
        f / aspect, 0.0, 0.0,                       0.0,
        0.0,        f,   0.0,                       0.0,
        0.0,        0.0, (far + near) * nf,        -1.0,
        0.0,        0.0, 2.0 * far * near * nf,     0.0,
    ]
}

/// Create a look-at view matrix
#[wasm_bindgen]
pub fn look_at(eye: &[f32], target: &[f32], up: &[f32]) -> Vec<f32> {
    let eye = Vector3::new(eye[0], eye[1], eye[2]);
    let target = Vector3::new(target[0], target[1], target[2]);
    let up = Vector3::new(up[0], up[1], up[2]);

    let f = (target - eye).normalize();
    let s = f.cross(&up).normalize();
    let u = s.cross(&f);

    vec![
        s.x,           u.x,           -f.x,          0.0,
        s.y,           u.y,           -f.y,          0.0,
        s.z,           u.z,           -f.z,          0.0,
        -s.dot(&eye),  -u.dot(&eye),  f.dot(&eye),   1.0,
    ]
}
