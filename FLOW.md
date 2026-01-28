# VisualAlgebra - Detailed Code Flow

> **Note**: Line number references are approximate and may drift as code evolves. Use function/class names to locate code.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [Initialization Flow](#initialization-flow)
4. [Render Pipeline](#render-pipeline)
5. [User Interaction Flow](#user-interaction-flow)
6. [Module System](#module-system)
7. [WASM/Rust Backend](#wasmrust-backend)
8. [State Management](#state-management)
9. [Data Formats](#data-formats)

---

## Project Overview

VisualAlgebra is a 3D linear algebra visualization tool with:
- **Rust/WebAssembly backend** - High-performance numerical computations
- **TypeScript/WebGL2 frontend** - Interactive 3D rendering and UI
- **Module-based architecture** - Pluggable educational content

```
┌────────────────────────────────────────────────────────────────────────┐
│                              Browser                                    │
├────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐ │
│  │  index.html  │───▶│   main.ts    │───▶│  WASM (Rust compiled)    │ │
│  │  - Canvas    │    │  - State     │    │  - Matrix math           │ │
│  │  - Controls  │    │  - Render    │    │  - Eigenvalues           │ │
│  │  - Navbar    │    │  - Events    │    │  - WebGL Renderer        │ │
│  └──────────────┘    └──────────────┘    └──────────────────────────┘ │
│         │                   │                        │                 │
│         ▼                   ▼                        ▼                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐ │
│  │ controls.ts  │    │  modules/*   │    │  WebGL2RenderingContext  │ │
│  │ - Inputs     │    │  - Scenes    │    │  - Shaders               │ │
│  │ - Presets    │    │  - Registry  │    │  - Buffers               │ │
│  └──────────────┘    └──────────────┘    └──────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
VisualAlgebra/
├── crates/core/src/           # Rust WASM source
│   ├── lib.rs                 # Entry point, module exports
│   ├── matrix.rs              # Matrix operations (lerp, rotate, scale, etc.)
│   ├── eigen.rs               # Eigenvalue/eigenvector computation
│   ├── dynamics.rs            # Power iteration, spectral radius
│   ├── scene.rs               # Geometry generation (grid, cube, axes)
│   └── renderer.rs            # WebGL2 wrapper (shaders, draw calls)
│
├── web/
│   ├── index.html             # Main HTML with canvas and control panels
│   ├── pkg/                   # WASM build output (generated)
│   │   ├── visual_algebra_core.js
│   │   ├── visual_algebra_core.d.ts
│   │   └── visual_algebra_core_bg.wasm
│   │
│   └── src/
│       ├── main.ts            # Application entry, render loop, state
│       ├── controls.ts        # UI control handlers
│       ├── style.css          # Styling
│       │
│       ├── types/
│       │   ├── state.ts       # AppState interface definition
│       │   └── module.ts      # Module/Scene type definitions
│       │
│       └── modules/
│           ├── index.ts       # Module auto-registration
│           ├── registry.ts    # ModuleRegistry class
│           ├── 04-matrices-as-maps/index.ts
│           ├── 05-eigenvalues/index.ts
│           └── 06-degenerate-matrices/index.ts
```

---

## Initialization Flow

### Step 1: HTML Load (`index.html`)
```
Browser loads index.html
         │
         ├─▶ Parse DOM structure
         │   ├─ <canvas id="gl-canvas">     → WebGL rendering target
         │   ├─ <aside class="controls">    → Sidebar with inputs
         │   └─ <nav class="module-navbar"> → Module tab buttons
         │
         └─▶ Load script: <script type="module" src="/src/main.ts">
```

### Step 2: WASM Initialization (`main.ts:137-166`)
```typescript
async function main() {
  // 1. Initialize WASM module
  await init();  // Loads visual_algebra_core_bg.wasm

  // 2. Get canvas element
  const canvas = document.getElementById('gl-canvas');

  // 3. Create Rust Renderer (initializes WebGL2)
  state.renderer = new Renderer('gl-canvas');

  // 4. Setup event listeners (mouse, keyboard)
  setupEventListeners();

  // 5. Setup UI controls
  setupControls(state, applyPreset);

  // 6. Setup module navigation
  setupModuleNavigation();

  // 7. Connect matrix change callback
  setOnMatrixChange(updateInvariants);

  // 8. Start render loop
  requestAnimationFrame(render);
}
```

### Step 3: Renderer Creation (`renderer.rs:43-64`)
```rust
pub fn new(canvas_id: &str) -> Result<Renderer, JsValue> {
    // 1. Get DOM elements
    let canvas = document.get_element_by_id(canvas_id)?;

    // 2. Get WebGL2 context
    let gl = canvas.get_context("webgl2")?;

    // 3. Compile shaders and create program
    let program = create_program(&gl)?;

    // 4. Set initial GL state
    gl.clear_color(0.08, 0.08, 0.12, 1.0);  // Dark theme
    gl.enable(DEPTH_TEST);

    Ok(Renderer { gl, program })
}
```

### Step 4: Controls Setup (`controls.ts:31-125`)
```
setupControls(state, applyPreset)
         │
         ├─▶ createMatrixInputs()
         │   └─ Generate 9 <input> elements in 3x3 grid
         │
         ├─▶ Attach input event listeners
         │   └─ On change: state.targetMatrix = getMatrixFromInputs()
         │
         ├─▶ Attach preset button listeners
         │   └─ On click: applyPreset(preset)
         │
         ├─▶ Attach Apply/Reset button listeners
         │
         ├─▶ Attach checkbox listeners (Grid, Cube, Basis, etc.)
         │
         └─▶ setupIterationControls() / setupDegenerateControls()
```

---

## Render Pipeline

### Frame-by-Frame Flow (`main.ts:727-888`)

```
requestAnimationFrame(render)
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    render(time)                              │
├─────────────────────────────────────────────────────────────┤
│  1. UPDATE ANIMATION                                         │
│     if (isPlaying && animationProgress < 1)                  │
│         animationProgress += 0.016 * animationSpeed          │
│                                                              │
│  2. INTERPOLATE MATRIX                                       │
│     interpolated = lerp_matrix3(currentMatrix,               │
│                                 targetMatrix,                │
│                                 easeInOutCubic(progress))    │
│                                                              │
│  3. COMPUTE CAMERA                                           │
│     eyeX = distance * cos(phi) * sin(theta)                  │
│     eyeY = distance * sin(phi)                               │
│     eyeZ = distance * cos(phi) * cos(theta)                  │
│     projMatrix = perspective(PI/4, aspect, 0.1, 100)         │
│     viewMatrix = look_at([eye], [0,0,0], [0,1,0])            │
│                                                              │
│  4. SETUP GL STATE                                           │
│     renderer.clear()                                         │
│     renderer.use_program()                                   │
│     renderer.set_projection(projMatrix)                      │
│     renderer.set_view(viewMatrix)                            │
│                                                              │
│  5. DRAW STATIC ELEMENTS (identity model matrix)             │
│     if (showGrid) draw grid                                  │
│     draw axes                                                │
│                                                              │
│  6. DRAW TRANSFORMED ELEMENTS (interpolated model matrix)    │
│     modelMat4 = mat3_to_mat4(interpolated)                   │
│     renderer.set_model(modelMat4)                            │
│     if (showBasis) draw basis vectors                        │
│     if (showCube) draw unit cube                             │
│                                                              │
│  7. DRAW MODULE-SPECIFIC (back to identity model)            │
│     MATRICES MODULE:                                         │
│       if (showVector) draw v and Av                          │
│     EIGENVALUES MODULE:                                      │
│       if (showEigenspace) drawEigenspace()                   │
│       if (showPointCloud) drawPointCloud()                   │
│     DEGENERATE MODULE:                                       │
│       if (showNullSpace) drawNullSpace()                     │
│       if (showColumnSpace) drawColumnSpace()                 │
│       if (showDegenPointCloud) drawDegenPointCloud()         │
│                                                              │
│  8. REQUEST NEXT FRAME                                       │
│     requestAnimationFrame(render)                            │
└─────────────────────────────────────────────────────────────┘
```

### WebGL Draw Call Flow (`renderer.rs:95-134`)

```
draw_lines(positions: &[f32], colors: &[f32])
         │
         ├─▶ Create VAO (Vertex Array Object)
         │
         ├─▶ Create position buffer
         │   ├─ gl.create_buffer()
         │   ├─ gl.bind_buffer(ARRAY_BUFFER)
         │   ├─ gl.buffer_data(positions)
         │   └─ gl.vertex_attrib_pointer(location=0, size=3)
         │
         ├─▶ Create color buffer
         │   ├─ gl.create_buffer()
         │   ├─ gl.bind_buffer(ARRAY_BUFFER)
         │   ├─ gl.buffer_data(colors)
         │   └─ gl.vertex_attrib_pointer(location=1, size=3)
         │
         ├─▶ Draw
         │   └─ gl.draw_arrays(LINES, 0, vertex_count)
         │
         └─▶ Cleanup buffers and VAO
```

### Shader Pipeline (`renderer.rs:4-32`)

```glsl
// VERTEX SHADER
layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_color;

uniform mat4 u_projection;  // Perspective matrix
uniform mat4 u_view;        // Camera look-at matrix
uniform mat4 u_model;       // Object transform (3x3 → 4x4)

void main() {
    gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
    v_color = a_color;
    gl_PointSize = 6.0;
}

// FRAGMENT SHADER
in vec3 v_color;
out vec4 fragColor;

void main() {
    fragColor = vec4(v_color, 1.0);
}
```

---

## User Interaction Flow

### Matrix Input Change

```
User types in matrix input
         │
         ▼
controls.ts: input event listener (line 38-44)
         │
         ├─▶ getMatrixFromInputs()
         │   └─ Read all 9 inputs, parse floats, create Float32Array
         │
         ├─▶ state.targetMatrix = newMatrix
         │
         ├─▶ updateDeterminant(newMatrix)
         │   └─ Call WASM determinant3(), update DOM
         │
         └─▶ onMatrixChangeCallback(newMatrix)
                    │
                    ▼
            main.ts: updateInvariants(matrix) (line 339-385)
                    │
                    ├─▶ trace_3x3(matrix) → update #trace-value
                    ├─▶ rank_3x3(matrix) → update #rank-value
                    ├─▶ eigenvalues_3x3(matrix) → update #eigenvalues-value
                    ├─▶ eigenvectors_3x3(matrix) → update #evec-1,2,3
                    │
                    └─▶ if (degenerate module)
                            updateDegenerateInvariants(matrix)
                            ├─▶ rank_3x3(matrix)
                            ├─▶ nullity = 3 - rank
                            └─▶ null_space_3x3(matrix)
```

### Preset Button Click

```
User clicks preset button (e.g., "Rx" for rotation X)
         │
         ▼
controls.ts: preset button listener (line 47-52)
         │
         └─▶ applyPreset(preset) in main.ts (line 211-265)
                    │
                    ├─▶ switch(preset)
                    │   ├─ 'rotateX' → matrix = rotation_x(PI/4)
                    │   ├─ 'scale'   → matrix = scale(2, 2, 2)
                    │   ├─ 'shear'   → matrix = shear_xy(0.5, 0.3)
                    │   └─ etc.
                    │
                    ├─▶ state.targetMatrix = new Float32Array(matrix)
                    ├─▶ setMatrixToInputs(matrix)  // Update UI inputs
                    ├─▶ updateDeterminant(matrix)
                    └─▶ updateInvariants(matrix)
```

### Apply Transform Button

```
User clicks "Apply Transform"
         │
         ▼
controls.ts: apply button listener (line 55-61)
         │
         ├─▶ state.currentMatrix = identity3()  // Reset to identity
         ├─▶ state.animationProgress = 0        // Start animation
         └─▶ state.isPlaying = true
                    │
                    ▼
         render loop detects isPlaying
                    │
                    ├─▶ Increment animationProgress each frame
                    ├─▶ lerp_matrix3(identity, targetMatrix, progress)
                    └─▶ Draw with interpolated matrix
```

### Camera Orbit (Mouse Drag)

```
User drags on canvas
         │
         ▼
main.ts: mousedown listener (line 181-186)
         │
         ├─▶ state.isDragging = true
         └─▶ state.lastMouseX/Y = event position
                    │
                    ▼
         mousemove listener (line 193-200)
                    │
                    ├─▶ dx = currentX - lastMouseX
                    ├─▶ dy = currentY - lastMouseY
                    ├─▶ state.cameraTheta -= dx * 0.01   // Horizontal orbit
                    ├─▶ state.cameraPhi += dy * 0.01    // Vertical orbit
                    └─▶ Update lastMouseX/Y
                              │
                              ▼
                    render loop uses theta/phi
                              │
                              └─▶ eye = spherical_to_cartesian(theta, phi, distance)
                                  look_at(eye, [0,0,0], [0,1,0])
```

### Module Tab Switch

```
User clicks module tab (e.g., "Eigenvalues")
         │
         ▼
main.ts: module tab listener (line 271-289)
         │
         ├─▶ state.currentModule = moduleId
         │
         └─▶ updateModuleUI() (line 295-335)
                    │
                    ├─▶ Show/hide control sections
                    │   └─ sections.forEach: display = (module matches) ? '' : 'none'
                    │
                    └─▶ Set module-specific state flags
                        │
                        ├─ 'matrices-as-maps':
                        │   showCube=true, showVector=true, showNullSpace=false
                        │
                        ├─ 'eigenvalues':
                        │   showEigenspace=true, showPointCloud=true, showCube=false
                        │
                        └─ 'degenerate-matrices':
                            showNullSpace=true, showColumnSpace=true, showDegenPointCloud=true
```

---

## Module System

### Type Definitions (`types/module.ts`)

```typescript
// A Scene is a single visualization configuration
interface Scene {
  id: string;
  title: string;
  description: string;
  layers: LayerConfig[];      // What to show (grid, axes, cube, etc.)
  controls: ControlConfig[];  // UI elements needed
  invariants: InvariantDisplay[];
  setup: (state) => void;     // Called when scene activates
  update: (state, dt) => void;
  teardown: (state) => void;  // Called when scene deactivates
}

// A Module groups related scenes
interface Module {
  id: string;
  title: string;
  description: string;
  prerequisites: string[];    // Required prior modules
  scenes: Scene[];
  conceptConnections: ConceptConnection[];
}
```

### Module Registration (`modules/index.ts`)

```typescript
import { registry } from './registry.js';
import { module04 } from './04-matrices-as-maps/index.js';
import { module05 } from './05-eigenvalues/index.js';
import { module06 } from './06-degenerate-matrices/index.js';

// Auto-register all modules at import time
registry.register(module04);
registry.register(module05);
registry.register(module06);
```

### Registry Operations (`modules/registry.ts`)

```typescript
class ModuleRegistry {
  private modules: Map<string, Module>;

  register(module)           // Add module to registry
  get(id): Module            // Retrieve by ID
  list(): ModuleInfo[]       // Get lightweight info for navigation
  getScene(moduleId, index)  // Get specific scene
  getOrderedModules()        // Topological sort by prerequisites
  canAccess(id, completed)   // Check if prerequisites met
}
```

---

## WASM/Rust Backend

### Module Structure (`lib.rs`)

```rust
mod matrix;     // Matrix ops: lerp, rotate, scale, multiply
mod renderer;   // WebGL2 wrapper
mod scene;      // Geometry generation
mod eigen;      // Eigenvalue computation
mod dynamics;   // Power iteration

pub use matrix::*;
pub use renderer::*;
// ... all functions exported to JS
```

### Matrix Operations (`matrix.rs`)

| Function | Signature | Purpose |
|----------|-----------|---------|
| `identity3()` | `() -> Vec<f32>` | 3x3 identity matrix |
| `rotation_x/y/z(angle)` | `(f32) -> Vec<f32>` | Rotation matrices |
| `scale(sx,sy,sz)` | `(f32,f32,f32) -> Vec<f32>` | Scale matrix |
| `shear_xy(shx,shy)` | `(f32,f32) -> Vec<f32>` | Shear matrix |
| `multiply3(a,b)` | `(&[f32],&[f32]) -> Vec<f32>` | Matrix multiplication |
| `lerp_matrix3(from,to,t)` | `(&[f32],&[f32],f32) -> Vec<f32>` | Linear interpolation |
| `mat3_to_mat4(m)` | `(&[f32]) -> Vec<f32>` | Convert for WebGL |
| `determinant3(m)` | `(&[f32]) -> f32` | Compute determinant |
| `perspective(fov,aspect,near,far)` | `(f32,f32,f32,f32) -> Vec<f32>` | Projection matrix |
| `look_at(eye,target,up)` | `(&[f32],&[f32],&[f32]) -> Vec<f32>` | View matrix |

### Eigenvalue Computation (`eigen.rs`)

```
eigenvalues_3x3(matrix)
         │
         ├─▶ characteristic_polynomial(matrix)
         │   ├─ trace = m[0] + m[4] + m[8]
         │   ├─ minors = sum of 2x2 principal minors
         │   ├─ det = determinant3(matrix)
         │   └─ return [-det, minors, -trace, 1.0]
         │
         └─▶ solve_cubic(a, b, c)  // Cardano's formula
             │
             ├─ Convert to depressed cubic: t³ + pt + q = 0
             ├─ Compute discriminant
             │
             ├─ if discriminant > 0:
             │   └─ One real root, two complex conjugates
             │
             ├─ if discriminant ≈ 0:
             │   └─ All real, at least two equal
             │
             └─ if discriminant < 0:
                 └─ Three distinct real roots (trigonometric method)
```

```
eigenvectors_3x3(matrix)
         │
         ├─▶ Get eigenvalues
         │
         └─▶ For each real eigenvalue λ:
             └─▶ compute_eigenvector(matrix, λ)
                 │
                 ├─▶ Form (A - λI)
                 ├─▶ Extract rows
                 └─▶ Cross product of rows to find null space
                     └─ v = row0 × row1 (or row0 × row2, or row1 × row2)
```

```
null_space_3x3(matrix)
         │
         ├─▶ rank = rank_3x3(matrix)
         ├─▶ nullity = 3 - rank
         │
         ├─ if rank == 3: return zeros (no null space)
         │
         ├─ if rank == 2 (nullity 1):
         │   └─▶ Cross product of two rows
         │
         ├─ if rank == 1 (nullity 2):
         │   └─▶ Find two vectors orthogonal to dominant column
         │
         └─ if rank == 0 (nullity 3):
             └─▶ Return standard basis (entire R³)
```

### Geometry Generation (`scene.rs`)

| Function | Output | Description |
|----------|--------|-------------|
| `generate_axes(length)` | 18 floats | 6 vertices for X,Y,Z axes |
| `generate_grid(size, divisions)` | Variable | Grid lines on XZ plane |
| `generate_basis_vectors()` | 18 floats | Unit vectors e1,e2,e3 |
| `generate_unit_cube()` | 72 floats | 24 vertices for 12 edges |
| `transform_vertices(verts, matrix)` | Same size | Apply 3x3 transform |

---

## State Management

### AppState Interface (`types/state.ts:23-86`)

```typescript
interface AppState {
  // Navigation
  currentModule: string;
  currentSceneIndex: number;

  // Rendering
  renderer: Renderer | null;
  canvas: HTMLCanvasElement | null;

  // Matrix state
  matrices: Map<string, Float32Array>;  // Named matrices
  currentMatrix: Float32Array;          // Animation start
  targetMatrix: Float32Array;           // Animation end

  // Animation
  animationProgress: number;  // 0 to 1
  isPlaying: boolean;
  animationSpeed: number;

  // Camera (spherical coordinates)
  cameraTheta: number;    // Horizontal angle
  cameraPhi: number;      // Vertical angle
  cameraDistance: number; // Zoom level

  // Visibility flags per module
  showGrid, showCube, showBasis, showVector: boolean;  // Matrices
  showEigenspace, showPointCloud: boolean;             // Eigenvalues
  showNullSpace, showColumnSpace, showDegenPointCloud: boolean;  // Degenerate

  // Eigenvalue animation
  iterationCount: number;
  eigenAnimTarget: number;
  eigenAnimProgress: number;

  // User input
  customVector: [number, number, number];
  isDragging: boolean;
  lastMouseX, lastMouseY: number;
}
```

### State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            AppState                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────────┐   │
│  │   Inputs    │────▶│   Target    │────▶│     Interpolated        │   │
│  │  (UI/DOM)   │     │   Matrix    │     │       Matrix            │   │
│  └─────────────┘     └─────────────┘     └─────────────────────────┘   │
│        │                   │                        │                   │
│        │                   │                        ▼                   │
│        │                   │              ┌─────────────────────────┐   │
│        │                   │              │     WebGL Renderer      │   │
│        │                   │              │   - set_model(mat)      │   │
│        │                   │              │   - draw_lines()        │   │
│        │                   │              └─────────────────────────┘   │
│        │                   │                                            │
│        │                   ▼                                            │
│        │         ┌─────────────────────────────────────────────────┐   │
│        │         │              Invariants Computation              │   │
│        │         │  trace, rank, det, eigenvalues, null_space      │   │
│        │         └─────────────────────────────────────────────────┘   │
│        │                   │                                            │
│        │                   ▼                                            │
│        │         ┌─────────────────────────────────────────────────┐   │
│        └────────▶│              DOM Updates                         │   │
│                  │  #determinant, #trace-value, #evec-1, etc.      │   │
│                  └─────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Formats

### Matrix Storage (Column-Major)

All 3x3 matrices are stored in **column-major order** (WebGL standard):

```
Visual representation:     Memory layout (Float32Array):
┌         ┐
│ a  b  c │                [a, d, g, b, e, h, c, f, i]
│ d  e  f │                 ↑     ↑     ↑     ↑     ↑
│ g  h  i │                col0  col0  col0  col1  col1 ...
└         ┘
                           Index:  0  1  2  3  4  5  6  7  8
```

**Accessing elements:**
```typescript
// Row i, Column j
matrix[j * 3 + i]

// Column j (as vector)
[matrix[j*3], matrix[j*3+1], matrix[j*3+2]]

// Row i (scattered)
[matrix[i], matrix[3+i], matrix[6+i]]
```

### Color Format

Colors are RGB floats in range [0, 1]:
```typescript
// Per-vertex colors: [r1,g1,b1, r2,g2,b2, ...]
const colors = new Float32Array([
  1.0, 0.0, 0.0,  // Vertex 1: red
  0.0, 1.0, 0.0,  // Vertex 2: green
]);
```

### Position Format

Positions are XYZ floats:
```typescript
// Line from origin to (1,0,0)
const positions = new Float32Array([
  0.0, 0.0, 0.0,  // Start point
  1.0, 0.0, 0.0,  // End point
]);
```

### Eigenvalue Format

```typescript
// eigenvalues_3x3 returns: [re1, im1, re2, im2, re3, im3]
const eigenvals = eigenvalues_3x3(matrix);
// Eigenvalue 1: eigenvals[0] + eigenvals[1]*i
// Eigenvalue 2: eigenvals[2] + eigenvals[3]*i
// Eigenvalue 3: eigenvals[4] + eigenvals[5]*i
```

### Eigenvector Format

```typescript
// eigenvectors_3x3 returns: [v1x,v1y,v1z, v2x,v2y,v2z, v3x,v3y,v3z]
const eigenvecs = eigenvectors_3x3(matrix);
// Vector 1: [eigenvecs[0], eigenvecs[1], eigenvecs[2]]
// Vector 2: [eigenvecs[3], eigenvecs[4], eigenvecs[5]]
// Vector 3: [eigenvecs[6], eigenvecs[7], eigenvecs[8]]
```
