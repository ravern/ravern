import { SERVE_PORT } from "../constants.ts";
import { Context } from "../context.ts";
import { getOutputPath } from "../helpers.ts";

async function getFileFromFilePath(filePath: string) {
  const file = await Deno.open(getOutputPath(filePath));
  const stat = await file.stat();
  if (stat.isDirectory) {
    throw new Error("Is a directory");
  }
  return file;
}

async function handleHttp(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);
  for await (const requestEvent of httpConn) {
    const url = new URL(requestEvent.request.url);
    const filePath = decodeURIComponent(url.pathname);
    let file;
    try {
      file = await getFileFromFilePath(filePath);
    } catch {
      try {
        file = await getFileFromFilePath(filePath + ".html");
      } catch {
        try {
          file = await getFileFromFilePath(filePath + "/index.html");
        } catch {
          const notFoundResponse = new Response("404 Not Found", {
            status: 404,
          });
          await requestEvent.respondWith(notFoundResponse);
          continue;
        }
      }
    }
    const readableStream = file.readable;
    const response = new Response(readableStream);
    await requestEvent.respondWith(response);
  }
}

export async function serve({ logger }: Context) {
  const server = Deno.listen({ port: SERVE_PORT });
  logger.info(`Server listening on port ${SERVE_PORT}...`);
  for await (const conn of server) {
    try {
      await handleHttp(conn);
    } catch (error) {
      logger.error(`Failed to handle: ${error.message}.`);
    }
  }
}
