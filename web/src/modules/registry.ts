import { Module, ModuleInfo, Scene } from '../types/module.js';

class ModuleRegistry {
  private modules: Map<string, Module> = new Map();

  register(module: Module): void {
    if (this.modules.has(module.id)) {
      console.warn(`Module ${module.id} already registered, overwriting`);
    }
    this.modules.set(module.id, module);
  }

  get(id: string): Module | undefined {
    return this.modules.get(id);
  }

  has(id: string): boolean {
    return this.modules.has(id);
  }

  list(): ModuleInfo[] {
    return Array.from(this.modules.values()).map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      prerequisites: m.prerequisites,
      sceneCount: m.scenes.length,
    }));
  }

  getPrerequisites(id: string): string[] {
    const module = this.modules.get(id);
    return module?.prerequisites ?? [];
  }

  getScene(moduleId: string, sceneIndex: number): Scene | undefined {
    const module = this.modules.get(moduleId);
    if (!module || sceneIndex < 0 || sceneIndex >= module.scenes.length) {
      return undefined;
    }
    return module.scenes[sceneIndex];
  }

  getSceneCount(moduleId: string): number {
    const module = this.modules.get(moduleId);
    return module?.scenes.length ?? 0;
  }

  // Get modules that depend on a given module
  getDependents(id: string): string[] {
    const dependents: string[] = [];
    for (const module of this.modules.values()) {
      if (module.prerequisites.includes(id)) {
        dependents.push(module.id);
      }
    }
    return dependents;
  }

  // Check if all prerequisites are met
  canAccess(id: string, completedModules: Set<string>): boolean {
    const prereqs = this.getPrerequisites(id);
    return prereqs.every((p) => completedModules.has(p));
  }

  // Get all modules in topological order (respecting prerequisites)
  getOrderedModules(): Module[] {
    const result: Module[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (id: string) => {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        console.warn(`Circular dependency detected for module ${id}`);
        return;
      }

      visiting.add(id);
      const module = this.modules.get(id);
      if (module) {
        for (const prereq of module.prerequisites) {
          visit(prereq);
        }
        result.push(module);
      }
      visiting.delete(id);
      visited.add(id);
    };

    for (const id of this.modules.keys()) {
      visit(id);
    }

    return result;
  }
}

// Global registry instance
export const registry = new ModuleRegistry();

// Export the class for testing
export { ModuleRegistry };
