import { evaluateArtifactFile } from "../diagnostic-evaluator.js";

const inputPath = process.argv[2];
if (!inputPath) throw new Error("Pass an existing Hybrid Live .result.json artifact path as the only argument");

const { evaluation, outputPath } = await evaluateArtifactFile(inputPath);
console.log(JSON.stringify({ outputPath, execution: evaluation.execution, evaluatorVersion: evaluation.evaluatorVersion }, null, 2));
