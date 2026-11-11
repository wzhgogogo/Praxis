import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { verifyHoldoutCommitment } from "./holdout-commitment.js";

test("G6 commitment matches independently fixed user hashes without reading private text", async () => {
  const saved = JSON.parse(await readFile(new URL("../../../../.eval-artifacts/phase3b-holdout/commitment.json", import.meta.url), "utf8"));
  assert.equal(saved.fileSha256, "3c1a400868fe469113d82399794179bbd82e67a736dc9e4668a7080ae7bcacad");
  assert.deepEqual(saved.cases, [
    {id:"p3b-holdout-01",sha256:"9f15b723d7c7177e96ed874d4a763baf755714738613a50b5f2ab86097eaeb5a"},
    {id:"p3b-holdout-02",sha256:"e47a042ed1fab381946049886678e849a78f8db685b12bbfa292fd661c90d4b2"},
    {id:"p3b-holdout-03",sha256:"09c467db53a05bef26129cd9f887988fcd0b92aecd8bbbc2469f39ddf26b3fd3"},
    {id:"p3b-holdout-04a",sha256:"eebcca7de79d9197654be5d92951452a76288d732bd44bfdb22f0d1c81fbe1d2"},
    {id:"p3b-holdout-04b",sha256:"e7f14b6e880c735ae4c0a08b633b296edb994c3a963aee68212ac5f4c1cde67d"},
    {id:"p3b-holdout-05",sha256:"c6959e226cde0b88d1ae8fd952e4cc568d5c52e5a540322574f5d7c95d19ec62"},
  ]);
  assert.throws(() => verifyHoldoutCommitment(Buffer.from("unrelated local control\n"), saved), /HOLDOUT_FILE_SHA_MISMATCH/);
});

test("G6 checksum controls reject tampered bytes, changed order and splitting mistakes before execution", () => {
  // Local construction only; deliberately unrelated to restaurant cases.
  const sha = (text: string) => createHash("sha256").update(text).digest("hex");
  const raw = "# Local constructed preamble\n\n---\nalpha: 1\n\n---\n\nbeta: 2\n";
  const expected = {fileSha256:sha(raw),cases:[{id:"local-a",sha256:sha("alpha: 1\n")},{id:"local-b",sha256:sha("beta: 2\n")}]};
  assert.equal(verifyHoldoutCommitment(Buffer.from(raw), expected).status, "VERIFIED");
  assert.throws(() => verifyHoldoutCommitment(Buffer.from(raw+"\n"), expected), /HOLDOUT_FILE_SHA_MISMATCH/);
  assert.throws(() => verifyHoldoutCommitment(Buffer.from(raw), {...expected,cases:[...expected.cases].reverse()}), /HOLDOUT_CASE_SHA_MISMATCH/);
  assert.throws(() => verifyHoldoutCommitment(Buffer.from(raw), {...expected,cases:expected.cases.slice(0,1)}), /HOLDOUT_CASE_COUNT_MISMATCH/);
  assert.throws(() => verifyHoldoutCommitment(Buffer.from(raw), {...expected,cases:[{id:"local-a",sha256:sha("alpha: 1")},expected.cases[1]!]}), /HOLDOUT_CASE_SHA_MISMATCH/);
  assert.throws(() => verifyHoldoutCommitment(Buffer.from(raw), {...expected,cases:[expected.cases[0]!,expected.cases[0]!]}), /INVALID_COMMITMENT/);
});

test("comment-only or empty preambles are excluded from case hashes, never from whole-file hashes",()=>{
 const sha=(s:string)=>createHash("sha256").update(s).digest("hex"),docs=["alpha: 1","beta: 2"];
 const cases=docs.map((s,i)=>({id:`fiction-${i}`,sha256:sha(s+"\n")}));
 for(const preamble of ["# Local only\n# no private case\n\n",""]){
  const raw=preamble+"---\n"+docs.join("\n---\n")+"\n",c={fileSha256:sha(raw),cases};
  assert.equal(verifyHoldoutCommitment(Buffer.from(raw),c).status,"VERIFIED");
  for(let i=0;i<Buffer.byteLength(raw);i++){const b=Buffer.from(raw);b[i]=b[i]!^1;assert.throws(()=>verifyHoldoutCommitment(b,c),/HOLDOUT_FILE_SHA_MISMATCH/);}
 }
 for(const raw of ["not a comment\n---\n"+docs.join("\n---\n")," # indented content\n---\n"+docs.join("\n---\n")])assert.throws(()=>verifyHoldoutCommitment(Buffer.from(raw),{fileSha256:sha(raw),cases}),/HOLDOUT_PREAMBLE_INVALID/);
 for(const values of [docs.slice(1),[...docs,"gamma: 3"]]){const raw="---\n"+values.join("\n---\n")+"\n";assert.throws(()=>verifyHoldoutCommitment(Buffer.from(raw),{fileSha256:sha(raw),cases}),/HOLDOUT_CASE_COUNT_MISMATCH/);}
});
