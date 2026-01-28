# Visual Algebra

**Making abstract linear algebra concepts visible and dynamic.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-visual--algebra--app.web.app-blue?style=for-the-badge)](https://visual-algebra-app.web.app)
[![Rust](https://img.shields.io/badge/Rust-WebAssembly-orange?style=for-the-badge&logo=rust)](https://www.rust-lang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Vite-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## Overview

Visual Algebra is an interactive 3D educational tool designed to help students and enthusiasts **see** linear algebra in action. Instead of just computing eigenvalues or determinants, watch matrices transform space in real-time.

Built with **Rust/WebAssembly** for high-performance mathematical computations and **WebGL2** for smooth 3D rendering.

---

## Key Features

### Interactive 3D Visualization
- Real-time transformation of 3D space as you modify matrices
- Smooth animated transitions between matrix states
- Orbit camera controls (drag to rotate, scroll to zoom)

### Learning Modules

| Module | Concepts Covered |
|--------|-----------------|
| **Matrices as Maps** | Column picture, transformation gallery, matrix composition |
| **Eigenvalues** | Invariant directions, power iteration, eigenvalue scaling |
| **Degenerate Matrices** | Null space, column space, rank-nullity theorem |

### Preset Transformations
Instantly apply and visualize:
- Rotations (X, Y, Z axes)
- Scaling (uniform and non-uniform)
- Shearing
- Reflection
- Projection

### Computed Invariants
- Real-time determinant calculation
- Eigenvalue/eigenvector computation (handles complex roots)
- Rank and nullity display
- Diagonalizability check

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Core Math** | Rust + nalgebra | High-performance matrix operations |
| **Bridge** | wasm-pack | Compile Rust to WebAssembly |
| **Rendering** | WebGL2 (web-sys) | Hardware-accelerated 3D graphics |
| **Frontend** | TypeScript + Vite | Modern, fast development |
| **Hosting** | Firebase | Global CDN deployment |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://rustup.rs/) (latest stable)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)

### Installation

```bash
# Clone the repository
git clone https://github.com/kornnellio/LinearAlgebra-Visual.git
cd LinearAlgebra-Visual

# Install dependencies
cd web
npm install

# Build the WebAssembly module
npm run wasm

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Development

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run wasm` | Rebuild WASM module (after Rust changes) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |

### Project Structure

```
LinearAlgebra-Visual/
├── crates/core/src/          # Rust WASM backend
│   ├── matrix.rs             # Matrix operations (lerp, rotate, scale)
│   ├── eigen.rs              # Eigenvalue/eigenvector computation
│   ├── dynamics.rs           # Power iteration algorithms
│   ├── scene.rs              # Geometry generation
│   └── renderer.rs           # WebGL2 rendering wrapper
│
├── web/                      # TypeScript frontend
│   ├── src/
│   │   ├── main.ts           # App core & render loop
│   │   ├── controls.ts       # UI event handlers
│   │   ├── modules/          # Educational module definitions
│   │   └── store/            # State management
│   └── index.html
│
└── README.md
```

---

## How It Works

### Architecture

```
User Input (matrix values, presets)
         │
         ▼
    TypeScript UI ──────► State Store
         │                    │
         ▼                    ▼
    Rust/WASM  ◄──────  Matrix Operations
    (nalgebra)          (eigenvalues, rank)
         │
         ▼
    WebGL2 Renderer
         │
         ▼
    Canvas (60 FPS)
```

### Matrix Format

All matrices use **column-major** storage (standard for graphics):

```
Visual display:     Memory layout:
┌─────────┐
│ a  b  c │         [a, d, g, b, e, h, c, f, i]
│ d  e  f │
│ g  h  i │
└─────────┘
```

### Eigenvalue Computation

Uses **Cardano's formula** for exact cubic root solving:
- Discriminant analysis to handle all cases
- Real roots via trigonometric method (Δ < 0)
- Complex conjugate pairs when applicable
- Eigenvectors computed via null space of (A - λI)

---

## Visualization Guide

### Color Coding

| Element | Color | Meaning |
|---------|-------|---------|
| Grid | Subtle teal | Reference plane |
| Basis vectors | White | Original coordinate axes |
| Input vector | White | User-defined vector **v** |
| Output vector | Purple | Transformed result **Av** |
| Eigenvectors | Red-orange | Invariant directions |
| Null space | Purple | Vectors mapping to zero |
| Column space | Teal | Image of transformation |

### Determinant Indicator

- **Green**: det > 0 (orientation preserved)
- **Yellow**: det = 0 (singular matrix)
- **Red**: det < 0 (orientation reversed)

---

## Deployment

### Firebase Hosting

```bash
# Login (first time)
firebase login

# Build and deploy
npm run build
firebase deploy --only hosting
```

---

## Educational Goals

This tool helps students understand:

1. **Geometric intuition** for matrix multiplication
2. **Why eigenvectors matter** - they're the directions that don't rotate
3. **What determinant means** - volume scaling factor
4. **How rank affects transformations** - dimension collapse
5. **Power iteration convergence** - finding dominant eigenvectors numerically

---

## Contributing

Contributions are welcome! Areas of interest:

- Additional learning modules (SVD, orthogonalization, etc.)
- Mobile touch controls
- Guided tutorials/walkthroughs
- Accessibility improvements

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>See linear algebra. Understand linear algebra.</strong>
</p>
