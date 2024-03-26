import * as path from "https://deno.land/std@0.220.1/path/mod.ts";
import * as log from "https://deno.land/std@0.220.1/log/mod.ts";

import { OUTPUT_DIR } from "./constants.ts";

export function getPath(...paths: string[]) {
  return path.join(...paths);
}

export function getRelativePath(...paths: string[]) {
  return getPath(Deno.cwd(), ...paths);
}

export function getOutputPath(...paths: string[]) {
  return getRelativePath(OUTPUT_DIR, ...paths);
}

export function buildLogger() {
  return log.getLogger();
}
