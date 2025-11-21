/**
 * Adapter Index
 *
 * Central export point for all editor adapters
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-21
 */

export * from './base-adapter';
export * from './polotno-adapter';
export * from './layerhub-adapter';

import { AdapterManager } from './base-adapter';
import { createPolotnoAdapter } from './polotno-adapter';
import { createLayerHubAdapter } from './layerhub-adapter';

// Register adapter factories
AdapterManager.register('polotno', createPolotnoAdapter);
AdapterManager.register('layerhub', createLayerHubAdapter);

// Export the manager for convenience
export { AdapterManager };