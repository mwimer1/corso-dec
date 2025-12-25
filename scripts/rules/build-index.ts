import path from "node:path";
import { buildDetailedIndex, writeIndex } from "./lib/build-index";

const ROOT = path.resolve(".cursor", "rules");
const OUT = path.join(ROOT, "_index.json");

const index = buildDetailedIndex(ROOT);
writeIndex(OUT, index);

console.log(`✅ Wrote ${OUT} with ${index.count} rules`);

