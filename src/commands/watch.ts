import { basename } from "https://deno.land/std@0.220.1/path/mod.ts";

import { Context } from "../context.ts";
import { getOutputPath, getRelativePath } from "../helpers.ts";
import { build } from "./build.ts";

async function tryBuild(context: Context) {
  const { logger } = context;

  try {
    await build(context);
  } catch (error) {
    logger.error(`Failed to build: ${error.message}.`);
  }
}

export async function watch(context: Context) {
  const { logger } = context;

  const paths = [];
  for await (const entry of Deno.readDir(getRelativePath())) {
    if (entry.name !== basename(getOutputPath())) {
      paths.push(getRelativePath(entry.name));
    }
  }

  await tryBuild(context);
  logger.info(`Watching for changes...`);
  for await (const _ of Deno.watchFs(paths, { recursive: true })) {
    await tryBuild(context);
  }
}
