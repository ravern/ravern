import { format } from "https://deno.land/std@0.160.0/datetime/mod.ts";
import * as fs from "https://deno.land/std@0.220.1/fs/mod.ts";
import { dirname } from "https://deno.land/std@0.220.1/path/mod.ts";
import { Eta } from "https://deno.land/x/eta@v3.1.0/src/index.ts";
import { parse as frontmatter } from "https://deno.land/x/frontmatter@v0.1.5/mod.ts";
import { marky } from "https://deno.land/x/marky@v1.1.6/mod.ts";

import { OUTPUT_DIR, STATIC_FILE_DIRS } from "../constants.ts";
import { Context } from "../context.ts";
import { getOutputPath, getPath, getRelativePath } from "../helpers.ts";

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
  const output = eta.render("landing.eta", { path: "" });
  const outputPath = getOutputPath("index.html");
  await Deno.writeTextFile(outputPath, output);
}

async function buildMarkdownPage(
  { eta, logger }: BuildContext,
  pagePath: string,
  templatePath: string = pagePath,
) {
  logger.info(`Building page '${pagePath}'...`);
  const fullPagePath = getRelativePath("content", `${pagePath}.md`);
  const markdown = await Deno.readTextFile(fullPagePath);
  const { meta, html } = renderMarkdown(markdown);
  const page = {
    head: meta.head ?? {},
    path: pagePath,
    title: meta.title,
    date: meta.date ? format(new Date(meta.date), "yyyy-MM-dd") : undefined,
    html,
  };
  const output = eta.render(`${templatePath}.eta`, page);
  const outputPath = getOutputPath(`${pagePath}.html`);
  await fs.ensureDir(dirname(outputPath));
  await Deno.writeTextFile(outputPath, output);
  return page;
}

async function buildPageCollection(
  context: BuildContext,
  collectionName: string,
  collectionPath: string,
  singleTemplatePath: string,
  collectionTemplatePath: string = collectionPath,
) {
  const { logger } = context;
  logger.info(`Building page collection '${collectionPath}'...`);
  const fullCollectionPath = getRelativePath("content", collectionPath);
  const pages = [];
  for await (const entry of fs.walk(fullCollectionPath)) {
    if (!entry.isFile || !entry.name.endsWith(".md")) {
      continue;
    }
    const fullPagePath = entry.path;
    const pagePath = getPath(
      collectionPath,
      fullPagePath
        .replace(fullCollectionPath, "")
        .replace(/\.md$/, ""),
    );
    const page = await buildMarkdownPage(context, pagePath, singleTemplatePath);
    pages.push(page);
  }
  pages.sort((pages.))
  const output = context.eta.render(`${collectionTemplatePath}.eta`, {
    head: {
      title: collectionName,
    },
    path: collectionPath,
    pages,
  });
  const outputPath = getOutputPath(`${collectionPath}.html`);
  await fs.ensureDir(dirname(outputPath));
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
  await copyStaticFiles(buildContext);
  await buildMarkdownPage(buildContext, "about", "article");
  await buildPageCollection(buildContext, "Writing", "writing", "article");
  await buildLandingPage(buildContext);

  logger.info("Success.");
}
