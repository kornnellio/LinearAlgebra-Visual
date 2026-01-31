// Module auto-registration
import { registry } from './registry.js';
import { module04 } from './04-matrices-as-maps/index.js';
import { module05 } from './05-eigenvalues/index.js';
import { module06 } from './06-degenerate-matrices/index.js';
import { module07 } from './07-affine-combinations/index.js';
import { module08 } from './08-convex-combinations/index.js';
import { module09 } from './09-complex-eigenvalues/index.js';

// Register all modules
registry.register(module04);
registry.register(module05);
registry.register(module06);
registry.register(module07);
registry.register(module08);
registry.register(module09);

// Export registry and modules
export { registry };
export { module04 };
export { module05 };
export { module06 };
export { module07 };
export { module08 };
export { module09 };

// Re-export types
export type { Module, Scene, LayerConfig, ModuleInfo } from '../types/module.js';
