import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { diagnosticRecording } from "../../../src/eval/restaurant/agent-loop/fixtures/recording-diagnostic.js";
const root = await mkdtemp(join(tmpdir(), "praxis-diagnostic-baseline-"));
try {
 const result = await diagnosticRecording(root);
 const manifest = JSON.parse(await readFile(join(result.path, "recording.json"), "utf8"));
 const files: Record<string,string> = {};
 for (const name of ["replay.har", ...manifest.documents.map((d: any) => d.file)]) files[name] = createHash("sha256").update(await readFile(join(result.path, name))).digest("hex");
 await writeFile(new URL("./baseline.json", import.meta.url), JSON.stringify({ baselineCommit: "03a9c645b591731a47fdad598d739621fcee24d6", pages: manifest.pages, files }, null, 2)+"\n");
} finally { await rm(root,{recursive:true,force:true}); }
