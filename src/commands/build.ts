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

async function buildLandingPage(
  { eta, logger }: BuildContext,
) {
  logger.info(`Building landing page...`);
  const output = eta.render("landing-page.eta", { pagePath: "" });
  const outputPath = getOutputPath("index.html");
  await Deno.writeTextFile(outputPath, output);
}

async function buildPage(
  { eta, logger }: BuildContext,
  pagePath: string,
  templatePath: string = pagePath,
) {
  logger.info(`Building page '${pagePath}'...`);
  const fullPagePath = getRelativePath("content", `${pagePath}.md`);
  const markdown = await Deno.readTextFile(fullPagePath);
  const { meta, html } = renderMarkdown(markdown);
  const output = eta.render(`${templatePath}.eta`, {
    pagePath,
    title: meta.title,
    html,
  });
  const outputPath = getOutputPath(`${pagePath}.html`);
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
  const eta = new Eta({ views: templatesPath });

  const buildContext = {
    ...context,
    eta,
  };

  await ensureOutputDir();
  await buildPage(buildContext, "about", "article-page");
  await buildLandingPage(buildContext);
  await copyStaticFiles(buildContext);

  logger.info("Success.");
}
