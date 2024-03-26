import * as fs from "https://deno.land/std@0.220.1/fs/mod.ts";
import { dirname } from "https://deno.land/std@0.220.1/path/mod.ts";
import { Eta } from "https://deno.land/x/eta@v3.1.0/src/index.ts";
import { parse as frontmatter } from "https://deno.land/x/frontmatter@v0.1.5/mod.ts";
import { marky } from "https://deno.land/x/marky@v1.1.6/mod.ts";

import { OUTPUT_DIR, STATIC_FILE_DIRS } from "../constants.ts";
import { getOutputPath, getRelativePath } from "../helpers.ts";
import { Context } from "../context.ts";

interface BuildContext extends Context {
  eta: Eta;
}

function renderMarkdown(content: string) {
  const result = frontmatter(content);
  const { data: meta, content: markdown } = result as {
    data: Record<string, string>;
    content: string;
  };
  return {
    meta,
    html: marky(markdown),
  };
}

async function copyStaticFiles({ logger }: BuildContext) {
  logger.info(`Copying static files...`);
  for (const dirPath of STATIC_FILE_DIRS) {
    const sourcePath = getRelativePath(dirPath);
    const destPath = getOutputPath(dirPath);
    await fs.ensureDir(dirname(destPath));
    await fs.copy(sourcePath, destPath);
  }
}

async function buildPage({ eta, logger }: BuildContext, name: string) {
  logger.info(`Building page '${name}'...`);
  const pagePath = getRelativePath("content", `${name}.md`);
  const markdown = await Deno.readTextFile(pagePath);
  const { meta, html } = renderMarkdown(markdown);
  const output = eta.render(`${name}.eta`, { ...meta, html });
  const outputPath = getOutputPath(`${name}.html`);
  await Deno.writeTextFile(outputPath, output);
}

async function ensureOutputDir() {
  await fs.ensureDir(OUTPUT_DIR);
  await Deno.remove(OUTPUT_DIR, { recursive: true });
  await fs.ensureDir(OUTPUT_DIR);
}

export async function build(context: Context) {
  const { logger } = context;

  const templatesPath = getRelativePath("templates");
  const eta = new Eta({ views: templatesPath, useWith: true });

  const buildContext = {
    ...context,
    eta,
  };

  await ensureOutputDir();
  await buildPage(buildContext, "about");
  await copyStaticFiles(buildContext);

  logger.info("Success.");
}
