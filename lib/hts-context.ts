import fs from "fs";
import path from "path";

const DEFAULT_HTS_PATH = path.join(process.cwd(), "hts-document.txt");
const HTS_DOCUMENT_PATH = process.env.HTS_DOCUMENT_PATH ?? DEFAULT_HTS_PATH;

/**
 * Loads the full HTS document from the configured local file path and returns
 * it as a string to be injected into the Claude prompt context.
 *
 * TODO: For large HTS documents (>100k tokens), replace this with a chunked
 * retrieval approach:
 *   1. Pre-process: chunk the HTS document by chapter/heading/subheading.
 *   2. Embed: generate vector embeddings for each chunk (e.g. via
 *      Anthropic's embeddings API or OpenAI text-embedding-3-small).
 *   3. Store: index chunks in a vector DB (Pinecone, pgvector, Weaviate, etc.).
 *   4. Retrieve: at query time, embed the user's image description (from a
 *      first-pass Claude call) and fetch the top-K most relevant HTS chunks.
 *   5. Inject: include only the retrieved chunks in the classification prompt.
 *
 * The function signature and return type are intentionally simple so this
 * swap requires no changes to the calling code in route.ts.
 */
export function loadHtsContext(): string {
  try {
    const content = fs.readFileSync(HTS_DOCUMENT_PATH, "utf-8");
    console.log(
      `[hts-context] Loaded ${content.length.toLocaleString()} chars from ${HTS_DOCUMENT_PATH}`
    );
    return content;
  } catch {
    console.warn(
      `[hts-context] Could not read HTS document at "${HTS_DOCUMENT_PATH}". ` +
        "Proceeding without HTS context — classification accuracy may be reduced."
    );
    return "";
  }
}
