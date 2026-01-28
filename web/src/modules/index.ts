// Module auto-registration
import { registry } from './registry.js';
import { module04 } from './04-matrices-as-maps/index.js';
import { module05 } from './05-eigenvalues/index.js';
import { module06 } from './06-degenerate-matrices/index.js';

// Register all modules
registry.register(module04);
registry.register(module05);
registry.register(module06);

// Export registry and modules
export { registry };
export { module04 };
export { module05 };
export { module06 };

// Re-export types
export type { Module, Scene, LayerConfig, ModuleInfo } from '../types/module.js';
