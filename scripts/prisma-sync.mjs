#!/usr/bin/env node
/**
 * Copies the generated Prisma client files into every service that has
 * @prisma/client installed locally. This avoids symlink issues inside Docker
 * images and ensures each service ships real client files.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const rootNodeModules = path.join(repoRoot, 'node_modules');
const prismaClientDir = path.join(rootNodeModules, '@prisma', 'client');
const prismaSource = path.join(prismaClientDir, '.prisma');
const enginesSource = path.join(rootNodeModules, '@prisma', 'engines');
const globalPrismaTarget = path.join(rootNodeModules, '.prisma');
const servicesDir = path.join(repoRoot, 'services');
const serviceDirs = readdirSync(servicesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

if (!existsSync(prismaSource) || !statSync(prismaSource).isDirectory()) {
  console.error(
    `[prisma-sync] Generated client not found at ${prismaSource}. Run "pnpm exec prisma generate" first.`
  );
  process.exit(1);
}

const copyDir = (sourceDir, destinationDir) => {
  rmSync(destinationDir, { recursive: true, force: true });
  mkdirSync(path.dirname(destinationDir), { recursive: true });
  cpSync(sourceDir, destinationDir, { recursive: true, dereference: true });
};

copyDir(prismaSource, globalPrismaTarget);

let synced = 0;
for (const serviceName of serviceDirs) {
  const serviceNodeModules = path.join(servicesDir, serviceName, 'node_modules');
  if (!existsSync(serviceNodeModules)) {
    continue;
  }

  const servicePrismaTarget = path.join(serviceNodeModules, '.prisma');
  copyDir(globalPrismaTarget, servicePrismaTarget);

  if (existsSync(enginesSource) && statSync(enginesSource).isDirectory()) {
    const serviceEnginesTarget = path.join(serviceNodeModules, '@prisma', 'engines');
    copyDir(enginesSource, serviceEnginesTarget);
  }

  synced += 1;
}

console.log(
  `[prisma-sync] Synced Prisma engines + generated client into ${synced} service${synced === 1 ? '' : 's'}.`
);
