import { existsSync, readdirSync, symlinkSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { config } from './config.js';
import { logger } from './log.js';

const log = logger('setup');

export function ensurePlatformSkills() {
  const runtimeDir = join(config.projectDir, '.claude', 'skills');
  const synapseDir = resolve(import.meta.dirname, '..'); // always Synapse's own dir
  const sourceDir = join(synapseDir, 'skills');

  if (!existsSync(sourceDir)) return; // no platform skills to link

  mkdirSync(runtimeDir, { recursive: true });

  for (const skill of readdirSync(sourceDir)) {
    const target = join(runtimeDir, skill);
    const source = join(sourceDir, skill);
    if (!existsSync(target)) {
      symlinkSync(source, target);
      log.debug(`Linked platform skill: ${skill}`);
    }
  }
}
