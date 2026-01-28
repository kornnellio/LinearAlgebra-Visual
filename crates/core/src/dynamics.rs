use wasm_bindgen::prelude::*;

/// Apply a 3x3 matrix to a 3D vector (single step)
fn apply_matrix(matrix: &[f32], v: &[f32]) -> [f32; 3] {
    // Column-major: [m00, m10, m20, m01, m11, m21, m02, m12, m22]
    [
        matrix[0] * v[0] + matrix[3] * v[1] + matrix[6] * v[2],
        matrix[1] * v[0] + matrix[4] * v[1] + matrix[7] * v[2],
        matrix[2] * v[0] + matrix[5] * v[1] + matrix[8] * v[2],
    ]
}

/// Normalize a 3D vector, returns the original if length is near zero
fn normalize(v: &[f32; 3]) -> [f32; 3] {
    let len = (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).sqrt();
    if len < 1e-10 {
        return *v;
    }
    [v[0] / len, v[1] / len, v[2] / len]
}

/// Compute the length of a 3D vector
fn length(v: &[f32; 3]) -> f32 {
    (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).sqrt()
}

/// Iterate a vector through a matrix n times
/// Returns all iterations as a flat array: [x0, y0, z0, x1, y1, z1, ..., xn, yn, zn]
#[wasm_bindgen]
pub fn iterate_vector(matrix: &[f32], v: &[f32], n: u32) -> Vec<f32> {
    if matrix.len() != 9 || v.len() != 3 {
        return vec![];
    }

    let mut result = Vec::with_capacity(((n + 1) * 3) as usize);
    let mut current = [v[0], v[1], v[2]];

    // Include initial vector
    result.extend_from_slice(&current);

    for _ in 0..n {
        current = apply_matrix(matrix, &current);
        result.extend_from_slice(&current);
    }

    result
}

/// Single step of the power method: normalize(A * v)
/// Returns the normalized result vector
#[wasm_bindgen]
pub fn power_method_step(matrix: &[f32], v: &[f32]) -> Vec<f32> {
    if matrix.len() != 9 || v.len() != 3 {
        return vec![0.0, 0.0, 0.0];
    }

    let result = apply_matrix(matrix, v);
    let normalized = normalize(&result);
    normalized.to_vec()
}

/// Run the power method for n iterations
/// Returns all normalized iterations: [x0, y0, z0, ..., xn, yn, zn]
#[wasm_bindgen]
pub fn power_method(matrix: &[f32], v: &[f32], n: u32) -> Vec<f32> {
    if matrix.len() != 9 || v.len() != 3 {
        return vec![];
    }

    let mut result = Vec::with_capacity(((n + 1) * 3) as usize);
    let mut current = normalize(&[v[0], v[1], v[2]]);

    result.extend_from_slice(&current);

    for _ in 0..n {
        let next = apply_matrix(matrix, &current);
        current = normalize(&next);
        result.extend_from_slice(&current);
    }

    result
}

/// Estimate the dominant eigenvalue using the Rayleigh quotient: (Av · v) / (v · v)
#[wasm_bindgen]
pub fn rayleigh_quotient(matrix: &[f32], v: &[f32]) -> f32 {
    if matrix.len() != 9 || v.len() != 3 {
        return 0.0;
    }

    let av = apply_matrix(matrix, v);
    let dot_av_v = av[0] * v[0] + av[1] * v[1] + av[2] * v[2];
    let dot_v_v = v[0] * v[0] + v[1] * v[1] + v[2] * v[2];

    if dot_v_v < 1e-10 {
        return 0.0;
    }

    dot_av_v / dot_v_v
}

/// Compute the spectral radius (absolute value of largest eigenvalue)
/// Uses power method iteration
#[wasm_bindgen]
pub fn spectral_radius(matrix: &[f32]) -> f32 {
    if matrix.len() != 9 {
        return 0.0;
    }

    // Start with a random-ish vector
    let mut v = [1.0_f32, 0.5, 0.25];
    v = normalize(&v);

    // Iterate power method
    for _ in 0..50 {
        let next = apply_matrix(matrix, &v);
        v = normalize(&next);
    }

    // Estimate eigenvalue
    rayleigh_quotient(matrix, &v).abs()
}

/// Compute the trajectory of a point under matrix iteration with scaling
/// Useful for visualizing exponential growth/decay
/// Returns normalized points along with their actual distances from origin
/// Format: [x0, y0, z0, d0, x1, y1, z1, d1, ...]
#[wasm_bindgen]
pub fn iterate_with_scaling(matrix: &[f32], v: &[f32], n: u32) -> Vec<f32> {
    if matrix.len() != 9 || v.len() != 3 {
        return vec![];
    }

    let mut result = Vec::with_capacity(((n + 1) * 4) as usize);
    let mut current = [v[0], v[1], v[2]];

    // Initial point
    let dist = length(&current);
    let normalized = if dist > 1e-10 {
        [current[0] / dist, current[1] / dist, current[2] / dist]
    } else {
        current
    };
    result.extend_from_slice(&normalized);
    result.push(dist);

    for _ in 0..n {
        current = apply_matrix(matrix, &current);
        let dist = length(&current);
        let normalized = if dist > 1e-10 {
            [current[0] / dist, current[1] / dist, current[2] / dist]
        } else {
            current
        };
        result.extend_from_slice(&normalized);
        result.push(dist);
    }

    result
}

/// Check if iteration is converging (spectral radius < 1)
#[wasm_bindgen]
pub fn is_converging(matrix: &[f32]) -> bool {
    spectral_radius(matrix) < 1.0
}

/// Check if iteration is diverging (spectral radius > 1)
#[wasm_bindgen]
pub fn is_diverging(matrix: &[f32]) -> bool {
    spectral_radius(matrix) > 1.0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_iterate_identity() {
        let identity = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0];
        let v = [1.0, 2.0, 3.0];
        let result = iterate_vector(&identity, &v, 3);

        // Should have 4 points (initial + 3 iterations)
        assert_eq!(result.len(), 12);

        // All points should be the same
        for i in 0..4 {
            assert!((result[i * 3] - 1.0).abs() < 1e-6);
            assert!((result[i * 3 + 1] - 2.0).abs() < 1e-6);
            assert!((result[i * 3 + 2] - 3.0).abs() < 1e-6);
        }
    }

    #[test]
    fn test_iterate_scale() {
        let scale2 = [2.0, 0.0, 0.0, 0.0, 2.0, 0.0, 0.0, 0.0, 2.0];
        let v = [1.0, 0.0, 0.0];
        let result = iterate_vector(&scale2, &v, 3);

        assert!((result[0] - 1.0).abs() < 1e-6);  // Initial
        assert!((result[3] - 2.0).abs() < 1e-6);  // After 1
        assert!((result[6] - 4.0).abs() < 1e-6);  // After 2
        assert!((result[9] - 8.0).abs() < 1e-6);  // After 3
    }

    #[test]
    fn test_spectral_radius_identity() {
        let identity = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0];
        let sr = spectral_radius(&identity);
        assert!((sr - 1.0).abs() < 1e-4);
    }

    #[test]
    fn test_spectral_radius_scale() {
        let scale3 = [3.0, 0.0, 0.0, 0.0, 3.0, 0.0, 0.0, 0.0, 3.0];
        let sr = spectral_radius(&scale3);
        assert!((sr - 3.0).abs() < 1e-4);
    }

    #[test]
    fn test_power_method() {
        // Dominant eigenvector of [[2, 0, 0], [0, 1, 0], [0, 0, 0.5]] is [1, 0, 0]
        let matrix = [2.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.5];
        let v = [1.0, 1.0, 1.0];
        let result = power_method(&matrix, &v, 20);

        // Final vector should be close to [1, 0, 0] or [-1, 0, 0]
        let last_idx = result.len() - 3;
        let last = [result[last_idx], result[last_idx + 1], result[last_idx + 2]];
        assert!(last[0].abs() > 0.99);
        assert!(last[1].abs() < 0.01);
        assert!(last[2].abs() < 0.01);
    }
}
