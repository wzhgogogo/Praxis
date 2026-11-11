import {readFile} from "node:fs/promises";
import {runG6DevelopmentPreflight} from "../../../src/eval/restaurant/agent-loop/g6-development-preflight.js";
const fixture=JSON.parse(await readFile(new URL("../../../src/eval/restaurant/agent-loop/cases/g6-development/cancellation-question.json",import.meta.url),"utf8"));
await runG6DevelopmentPreflight(new URL("./admitted-artifact/",import.meta.url).pathname,"P4",0,"TABELOG",fixture);
