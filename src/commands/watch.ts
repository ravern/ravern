import { basename } from "https://deno.land/std@0.220.1/path/mod.ts";

import { Context } from "../context.ts";
import { getOutputPath, getRelativePath } from "../helpers.ts";
import { build } from "./build.ts";

export async function watch(context: Context) {
  const { logger } = context;

  const paths = [];
  for await (const entry of Deno.readDir(getRelativePath())) {
    if (entry.name !== basename(getOutputPath())) {
      paths.push(getRelativePath(entry.name));
    }
  }

  await build(context);
  logger.info(`Watching for changes...`);
  for await (const _ of Deno.watchFs(paths, { recursive: true })) {
    await build(context);
  }
}
