use wasm_bindgen::prelude::*;

/// Generate 3D axis lines (X=red, Y=green, Z=blue)
#[wasm_bindgen]
pub fn generate_axes(length: f32) -> Vec<f32> {
    vec![
        // X axis
        0.0, 0.0, 0.0,
        length, 0.0, 0.0,
        // Y axis
        0.0, 0.0, 0.0,
        0.0, length, 0.0,
        // Z axis
        0.0, 0.0, 0.0,
        0.0, 0.0, length,
    ]
}

/// Colors for axes (X=red, Y=green, Z=blue) - subtle
#[wasm_bindgen]
pub fn generate_axes_colors() -> Vec<f32> {
    vec![
        // X axis - muted red
        0.4, 0.2, 0.2,
        0.4, 0.2, 0.2,
        // Y axis - muted green
        0.2, 0.4, 0.2,
        0.2, 0.4, 0.2,
        // Z axis - muted blue
        0.2, 0.25, 0.4,
        0.2, 0.25, 0.4,
    ]
}

/// Generate a grid on the XZ plane
#[wasm_bindgen]
pub fn generate_grid(size: f32, divisions: u32) -> Vec<f32> {
    let mut positions = Vec::new();
    let step = size / divisions as f32;
    let half = size / 2.0;

    for i in 0..=divisions {
        let pos = -half + i as f32 * step;
        // Lines parallel to Z
        positions.extend_from_slice(&[pos, 0.0, -half, pos, 0.0, half]);
        // Lines parallel to X
        positions.extend_from_slice(&[-half, 0.0, pos, half, 0.0, pos]);
    }

    positions
}

/// Grid colors (subtle gray for dark theme)
#[wasm_bindgen]
pub fn generate_grid_colors(vertex_count: u32) -> Vec<f32> {
    let gray = 0.2;
    (0..vertex_count).flat_map(|_| vec![gray, gray, gray]).collect()
}

/// Generate basis vectors (unit vectors from origin)
#[wasm_bindgen]
pub fn generate_basis_vectors() -> Vec<f32> {
    vec![
        // e1 (x)
        0.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        // e2 (y)
        0.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        // e3 (z)
        0.0, 0.0, 0.0,
        0.0, 0.0, 1.0,
    ]
}

/// Generate transformed basis vectors
#[wasm_bindgen]
pub fn generate_transformed_basis(matrix: &[f32]) -> Vec<f32> {
    if matrix.len() != 9 {
        return generate_basis_vectors();
    }

    // Matrix is column-major: [m00, m10, m20, m01, m11, m21, m02, m12, m22]
    // Column 0 = transformed e1, Column 1 = transformed e2, Column 2 = transformed e3
    vec![
        // transformed e1
        0.0, 0.0, 0.0,
        matrix[0], matrix[1], matrix[2],
        // transformed e2
        0.0, 0.0, 0.0,
        matrix[3], matrix[4], matrix[5],
        // transformed e3
        0.0, 0.0, 0.0,
        matrix[6], matrix[7], matrix[8],
    ]
}

/// Bright colors for basis vectors
#[wasm_bindgen]
pub fn generate_basis_colors() -> Vec<f32> {
    vec![
        // e1 - bright red
        1.0, 0.4, 0.4,
        1.0, 0.4, 0.4,
        // e2 - bright green
        0.4, 1.0, 0.4,
        0.4, 1.0, 0.4,
        // e3 - bright blue
        0.4, 0.6, 1.0,
        0.4, 0.6, 1.0,
    ]
}

/// Generate a unit cube wireframe
#[wasm_bindgen]
pub fn generate_unit_cube() -> Vec<f32> {
    vec![
        // Bottom face
        0.0, 0.0, 0.0,  1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,  1.0, 0.0, 1.0,
        1.0, 0.0, 1.0,  0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,  0.0, 0.0, 0.0,
        // Top face
        0.0, 1.0, 0.0,  1.0, 1.0, 0.0,
        1.0, 1.0, 0.0,  1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,  0.0, 1.0, 1.0,
        0.0, 1.0, 1.0,  0.0, 1.0, 0.0,
        // Vertical edges
        0.0, 0.0, 0.0,  0.0, 1.0, 0.0,
        1.0, 0.0, 0.0,  1.0, 1.0, 0.0,
        1.0, 0.0, 1.0,  1.0, 1.0, 1.0,
        0.0, 0.0, 1.0,  0.0, 1.0, 1.0,
    ]
}

/// Transform cube vertices by a 3x3 matrix
#[wasm_bindgen]
pub fn transform_vertices(vertices: &[f32], matrix: &[f32]) -> Vec<f32> {
    if matrix.len() != 9 {
        return vertices.to_vec();
    }

    vertices
        .chunks(3)
        .flat_map(|v| {
            if v.len() == 3 {
                vec![
                    matrix[0] * v[0] + matrix[3] * v[1] + matrix[6] * v[2],
                    matrix[1] * v[0] + matrix[4] * v[1] + matrix[7] * v[2],
                    matrix[2] * v[0] + matrix[5] * v[1] + matrix[8] * v[2],
                ]
            } else {
                v.to_vec()
            }
        })
        .collect()
}

/// Cube colors (cyan/teal for visibility on dark theme)
#[wasm_bindgen]
pub fn generate_cube_colors(vertex_count: u32) -> Vec<f32> {
    (0..vertex_count).flat_map(|_| vec![0.3, 0.8, 0.8]).collect()
}

/// Generate arrow head vertices for a vector
#[wasm_bindgen]
pub fn generate_arrow_head(tip: &[f32], direction: &[f32], size: f32) -> Vec<f32> {
    if tip.len() != 3 || direction.len() != 3 {
        return vec![];
    }

    // Normalize direction
    let len = (direction[0].powi(2) + direction[1].powi(2) + direction[2].powi(2)).sqrt();
    if len < 0.001 {
        return vec![];
    }

    let d = [direction[0] / len, direction[1] / len, direction[2] / len];

    // Find perpendicular vector
    let perp = if d[0].abs() < 0.9 {
        [1.0, 0.0, 0.0]
    } else {
        [0.0, 1.0, 0.0]
    };

    // Cross product for perpendicular
    let p1 = [
        d[1] * perp[2] - d[2] * perp[1],
        d[2] * perp[0] - d[0] * perp[2],
        d[0] * perp[1] - d[1] * perp[0],
    ];

    let base = [
        tip[0] - d[0] * size * 2.0,
        tip[1] - d[1] * size * 2.0,
        tip[2] - d[2] * size * 2.0,
    ];

    vec![
        // Line from tip to base+offset1
        tip[0], tip[1], tip[2],
        base[0] + p1[0] * size, base[1] + p1[1] * size, base[2] + p1[2] * size,
        // Line from tip to base-offset1
        tip[0], tip[1], tip[2],
        base[0] - p1[0] * size, base[1] - p1[1] * size, base[2] - p1[2] * size,
    ]
}
