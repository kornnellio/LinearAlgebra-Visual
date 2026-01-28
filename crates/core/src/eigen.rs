use wasm_bindgen::prelude::*;
use std::f32::consts::PI;

/// Compute the trace of a 3x3 matrix (sum of diagonal elements)
#[wasm_bindgen]
pub fn trace_3x3(matrix: &[f32]) -> f32 {
    if matrix.len() != 9 {
        return 0.0;
    }
    // Column-major: [m00, m10, m20, m01, m11, m21, m02, m12, m22]
    // Diagonal: m00 (index 0), m11 (index 4), m22 (index 8)
    matrix[0] + matrix[4] + matrix[8]
}

/// Compute the sum of 2x2 principal minors (for characteristic polynomial)
fn sum_principal_minors(m: &[f32]) -> f32 {
    // M01 = m00*m11 - m01*m10 (indices: 0,4 - 3,1)
    // M02 = m00*m22 - m02*m20 (indices: 0,8 - 6,2)
    // M12 = m11*m22 - m12*m21 (indices: 4,8 - 7,5)
    let m01 = m[0] * m[4] - m[3] * m[1];
    let m02 = m[0] * m[8] - m[6] * m[2];
    let m12 = m[4] * m[8] - m[7] * m[5];
    m01 + m02 + m12
}

/// Compute characteristic polynomial coefficients
/// Returns [a0, a1, a2, a3] for λ³ + a2*λ² + a1*λ + a0 = 0
/// (where a3 = 1 for monic polynomial)
#[wasm_bindgen]
pub fn characteristic_polynomial(matrix: &[f32]) -> Vec<f32> {
    if matrix.len() != 9 {
        return vec![0.0, 0.0, 0.0, 1.0];
    }

    let trace = trace_3x3(matrix);
    let minors = sum_principal_minors(matrix);
    let det = crate::matrix::determinant3(matrix);

    // λ³ - trace*λ² + minors*λ - det = 0
    vec![-det, minors, -trace, 1.0]
}

/// Solve cubic equation x³ + ax² + bx + c = 0 using Cardano's formula
/// Returns up to 3 roots as (real, imaginary) pairs: [re1, im1, re2, im2, re3, im3]
fn solve_cubic(a: f32, b: f32, c: f32) -> [f32; 6] {
    // Convert to depressed cubic t³ + pt + q = 0
    // Substitution: x = t - a/3
    let p = b - a * a / 3.0;
    let q = 2.0 * a * a * a / 27.0 - a * b / 3.0 + c;

    let discriminant = q * q / 4.0 + p * p * p / 27.0;
    let offset = -a / 3.0;

    if discriminant > 1e-10 {
        // One real root, two complex conjugates
        let sqrt_d = discriminant.sqrt();
        let u = (-q / 2.0 + sqrt_d).cbrt();
        let v = (-q / 2.0 - sqrt_d).cbrt();

        let real1 = u + v + offset;
        let real_part = -(u + v) / 2.0 + offset;
        let imag_part = (u - v) * 3.0_f32.sqrt() / 2.0;

        [real1, 0.0, real_part, imag_part, real_part, -imag_part]
    } else if discriminant.abs() <= 1e-10 {
        // All real, at least two equal
        if p.abs() < 1e-10 && q.abs() < 1e-10 {
            // Triple root
            [offset, 0.0, offset, 0.0, offset, 0.0]
        } else {
            let u = if q >= 0.0 { -(-q / 2.0).cbrt() } else { (-q / 2.0).cbrt() };
            let root1 = 2.0 * u + offset;
            let root2 = -u + offset;
            [root1, 0.0, root2, 0.0, root2, 0.0]
        }
    } else {
        // Three distinct real roots (discriminant < 0)
        // Use trigonometric method
        let r = (-p / 3.0).sqrt();
        let cos_arg = (-q / 2.0) / (r * r * r);
        let cos_arg = cos_arg.clamp(-1.0, 1.0);
        let theta = cos_arg.acos();

        let root1 = 2.0 * r * (theta / 3.0).cos() + offset;
        let root2 = 2.0 * r * ((theta + 2.0 * PI) / 3.0).cos() + offset;
        let root3 = 2.0 * r * ((theta + 4.0 * PI) / 3.0).cos() + offset;

        [root1, 0.0, root2, 0.0, root3, 0.0]
    }
}

/// Compute eigenvalues of a 3x3 matrix
/// Returns [re1, im1, re2, im2, re3, im3] (real and imaginary parts)
#[wasm_bindgen]
pub fn eigenvalues_3x3(matrix: &[f32]) -> Vec<f32> {
    if matrix.len() != 9 {
        return vec![0.0; 6];
    }

    let poly = characteristic_polynomial(matrix);
    // poly = [a0, a1, a2, 1] for x³ + a2*x² + a1*x + a0 = 0
    let roots = solve_cubic(poly[2], poly[1], poly[0]);
    roots.to_vec()
}

/// Check if an eigenvalue is real (imaginary part near zero)
fn is_real_eigenvalue(im: f32) -> bool {
    im.abs() < 1e-6
}

/// Compute eigenvector for a real eigenvalue using null space of (A - λI)
fn compute_eigenvector(matrix: &[f32], eigenvalue: f32) -> [f32; 3] {
    // Form A - λI
    let mut m = [0.0_f32; 9];
    m.copy_from_slice(matrix);
    m[0] -= eigenvalue;
    m[4] -= eigenvalue;
    m[8] -= eigenvalue;

    // Find null space by row reduction
    // Try to find a non-trivial solution to (A - λI)v = 0

    // Use cross product of two rows (if linearly independent)
    let row0 = [m[0], m[3], m[6]];
    let row1 = [m[1], m[4], m[7]];
    let row2 = [m[2], m[5], m[8]];

    // Try cross product of row0 and row1
    let mut v = cross(&row0, &row1);
    let len = (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).sqrt();

    if len > 1e-6 {
        return [v[0] / len, v[1] / len, v[2] / len];
    }

    // Try cross product of row0 and row2
    v = cross(&row0, &row2);
    let len = (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).sqrt();

    if len > 1e-6 {
        return [v[0] / len, v[1] / len, v[2] / len];
    }

    // Try cross product of row1 and row2
    v = cross(&row1, &row2);
    let len = (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).sqrt();

    if len > 1e-6 {
        return [v[0] / len, v[1] / len, v[2] / len];
    }

    // Fallback: return unit vector
    [1.0, 0.0, 0.0]
}

fn cross(a: &[f32; 3], b: &[f32; 3]) -> [f32; 3] {
    [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ]
}

/// Compute eigenvectors of a 3x3 matrix (only for real eigenvalues)
/// Returns 9 floats [v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z]
/// For complex eigenvalues, returns zero vectors
#[wasm_bindgen]
pub fn eigenvectors_3x3(matrix: &[f32]) -> Vec<f32> {
    if matrix.len() != 9 {
        return vec![0.0; 9];
    }

    let eigenvalues = eigenvalues_3x3(matrix);
    let mut result = Vec::with_capacity(9);

    for i in 0..3 {
        let re = eigenvalues[i * 2];
        let im = eigenvalues[i * 2 + 1];

        if is_real_eigenvalue(im) {
            let v = compute_eigenvector(matrix, re);
            result.extend_from_slice(&v);
        } else {
            // Complex eigenvalue - return zero vector
            result.extend_from_slice(&[0.0, 0.0, 0.0]);
        }
    }

    result
}

/// Check if a 3x3 matrix is diagonalizable
/// A matrix is diagonalizable if it has 3 linearly independent eigenvectors
#[wasm_bindgen]
pub fn is_diagonalizable(matrix: &[f32]) -> bool {
    if matrix.len() != 9 {
        return false;
    }

    let eigenvalues = eigenvalues_3x3(matrix);

    // Count real eigenvalues
    let mut real_count = 0;
    for i in 0..3 {
        if is_real_eigenvalue(eigenvalues[i * 2 + 1]) {
            real_count += 1;
        }
    }

    // If all eigenvalues are real and distinct, it's diagonalizable
    if real_count == 3 {
        let e1 = eigenvalues[0];
        let e2 = eigenvalues[2];
        let e3 = eigenvalues[4];

        if (e1 - e2).abs() > 1e-6 && (e2 - e3).abs() > 1e-6 && (e1 - e3).abs() > 1e-6 {
            return true;
        }

        // For repeated eigenvalues, need to check geometric multiplicity
        // This is a simplified check - assumes diagonalizable if symmetric
        let is_symmetric =
            (matrix[1] - matrix[3]).abs() < 1e-6 &&
            (matrix[2] - matrix[6]).abs() < 1e-6 &&
            (matrix[5] - matrix[7]).abs() < 1e-6;

        return is_symmetric;
    }

    // One real, two complex conjugate eigenvalues
    // The matrix is diagonalizable over C but not over R
    // We return false for real diagonalizability
    false
}

/// Compute the rank of a 3x3 matrix
#[wasm_bindgen]
pub fn rank_3x3(matrix: &[f32]) -> u32 {
    if matrix.len() != 9 {
        return 0;
    }

    let det = crate::matrix::determinant3(matrix);
    if det.abs() > 1e-6 {
        return 3;
    }

    // Check 2x2 minors
    let minors = [
        matrix[0] * matrix[4] - matrix[3] * matrix[1],
        matrix[0] * matrix[7] - matrix[6] * matrix[1],
        matrix[3] * matrix[7] - matrix[6] * matrix[4],
        matrix[0] * matrix[5] - matrix[3] * matrix[2],
        matrix[0] * matrix[8] - matrix[6] * matrix[2],
        matrix[3] * matrix[8] - matrix[6] * matrix[5],
        matrix[1] * matrix[5] - matrix[4] * matrix[2],
        matrix[1] * matrix[8] - matrix[7] * matrix[2],
        matrix[4] * matrix[8] - matrix[7] * matrix[5],
    ];

    for minor in minors.iter() {
        if minor.abs() > 1e-6 {
            return 2;
        }
    }

    // Check if any element is non-zero
    for &val in matrix.iter() {
        if val.abs() > 1e-6 {
            return 1;
        }
    }

    0
}

/// Compute null space basis vectors of a 3x3 matrix
/// Returns flattened array of basis vectors: [v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z]
/// Unused slots are filled with zeros
#[wasm_bindgen]
pub fn null_space_3x3(matrix: &[f32]) -> Vec<f32> {
    if matrix.len() != 9 {
        return vec![0.0; 9];
    }

    let rank = rank_3x3(matrix);
    let nullity = 3 - rank;

    if nullity == 0 {
        return vec![0.0; 9];
    }

    let mut result = vec![0.0; 9];

    // For rank 2 (nullity 1): find one null space vector
    // For rank 1 (nullity 2): find two null space vectors
    // For rank 0 (nullity 3): entire R^3 is null space

    if rank == 0 {
        // Entire space is null space - return standard basis
        result[0] = 1.0; // e1
        result[4] = 1.0; // e2
        result[8] = 1.0; // e3
        return result;
    }

    if rank == 1 {
        // Find two vectors orthogonal to the single non-zero row/column
        // First, find the non-zero column
        let col0 = [matrix[0], matrix[1], matrix[2]];
        let col1 = [matrix[3], matrix[4], matrix[5]];
        let col2 = [matrix[6], matrix[7], matrix[8]];

        let len0 = (col0[0]*col0[0] + col0[1]*col0[1] + col0[2]*col0[2]).sqrt();
        let len1 = (col1[0]*col1[0] + col1[1]*col1[1] + col1[2]*col1[2]).sqrt();
        let len2 = (col2[0]*col2[0] + col2[1]*col2[1] + col2[2]*col2[2]).sqrt();

        // Use the column with largest magnitude to find orthogonal vectors
        let (dominant, _) = if len0 >= len1 && len0 >= len2 {
            (col0, 0)
        } else if len1 >= len0 && len1 >= len2 {
            (col1, 1)
        } else {
            (col2, 2)
        };

        // Normalize dominant
        let len = (dominant[0]*dominant[0] + dominant[1]*dominant[1] + dominant[2]*dominant[2]).sqrt();
        if len < 1e-6 {
            return vec![0.0; 9];
        }
        let d = [dominant[0]/len, dominant[1]/len, dominant[2]/len];

        // Find two vectors orthogonal to d
        // Use Gram-Schmidt on a convenient starting vector
        let start = if d[0].abs() < 0.9 { [1.0, 0.0, 0.0] } else { [0.0, 1.0, 0.0] };

        // v1 = start - (start . d) * d
        let dot = start[0]*d[0] + start[1]*d[1] + start[2]*d[2];
        let mut v1 = [start[0] - dot*d[0], start[1] - dot*d[1], start[2] - dot*d[2]];
        let v1_len = (v1[0]*v1[0] + v1[1]*v1[1] + v1[2]*v1[2]).sqrt();
        if v1_len > 1e-6 {
            v1 = [v1[0]/v1_len, v1[1]/v1_len, v1[2]/v1_len];
        }

        // v2 = d x v1 (cross product)
        let v2 = cross(&d, &v1);

        result[0] = v1[0]; result[1] = v1[1]; result[2] = v1[2];
        result[3] = v2[0]; result[4] = v2[1]; result[5] = v2[2];
        return result;
    }

    if rank == 2 {
        // Find one null space vector - the eigenvector for eigenvalue 0
        // This is the cross product of two linearly independent rows (or columns)

        // Get rows from column-major matrix
        let row0 = [matrix[0], matrix[3], matrix[6]];
        let row1 = [matrix[1], matrix[4], matrix[7]];
        let row2 = [matrix[2], matrix[5], matrix[8]];

        // Try cross products to find non-zero result
        let mut v = cross(&row0, &row1);
        let mut len = (v[0]*v[0] + v[1]*v[1] + v[2]*v[2]).sqrt();

        if len < 1e-6 {
            v = cross(&row0, &row2);
            len = (v[0]*v[0] + v[1]*v[1] + v[2]*v[2]).sqrt();
        }

        if len < 1e-6 {
            v = cross(&row1, &row2);
            len = (v[0]*v[0] + v[1]*v[1] + v[2]*v[2]).sqrt();
        }

        if len > 1e-6 {
            result[0] = v[0]/len;
            result[1] = v[1]/len;
            result[2] = v[2]/len;
        }

        return result;
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_trace() {
        let identity = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0];
        assert!((trace_3x3(&identity) - 3.0).abs() < 1e-6);
    }

    #[test]
    fn test_eigenvalues_identity() {
        let identity = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0];
        let eigs = eigenvalues_3x3(&identity);
        // All eigenvalues should be 1
        assert!((eigs[0] - 1.0).abs() < 1e-5);
        assert!((eigs[2] - 1.0).abs() < 1e-5);
        assert!((eigs[4] - 1.0).abs() < 1e-5);
    }

    #[test]
    fn test_eigenvalues_diagonal() {
        // Diagonal matrix with eigenvalues 2, 3, 5
        let diag = [2.0, 0.0, 0.0, 0.0, 3.0, 0.0, 0.0, 0.0, 5.0];
        let eigs = eigenvalues_3x3(&diag);
        let mut vals = [eigs[0], eigs[2], eigs[4]];
        vals.sort_by(|a, b| a.partial_cmp(b).unwrap());
        assert!((vals[0] - 2.0).abs() < 1e-5);
        assert!((vals[1] - 3.0).abs() < 1e-5);
        assert!((vals[2] - 5.0).abs() < 1e-5);
    }

    #[test]
    fn test_rank() {
        let identity = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0];
        assert_eq!(rank_3x3(&identity), 3);

        let rank2 = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0];
        assert_eq!(rank_3x3(&rank2), 2);

        let zeros = [0.0; 9];
        assert_eq!(rank_3x3(&zeros), 0);
    }
}
