import json,re,subprocess,pathlib
root=pathlib.Path('/private/tmp/praxis-premerge-scope-main-20261115')
base='a66a2edcb2ffe8e3eaa42f4c0e79680382539c9d'
def git(*args):return subprocess.check_output(['git','-C',str(root),*args],text=True)
files=git('diff','--name-only',base,'HEAD','--','src','web-skills').splitlines()
production=[p for p in files if not any(s in p for s in ['.test.','/harness/','/fixtures/','/eval/'])]
patterns={'new URL/domain literal':r'https?://|(?:tablecheck|tabelog)\.com','business example/ID':r'\b(?:Nakamata|Kiwami|Hanare|Ginza|Nakano|Nagano|Sumika|robatayaki|13186922|13309182)\b','new DOM selector':r'querySelector|locator\(|getByRole\('}
rows=[];hits=[]
for p in production:
 d=git('diff','--unified=0',base,'HEAD','--',p)
 added=[line[1:]for line in d.splitlines()if line.startswith('+')and not line.startswith('+++')]
 matched=[{'line':line,'rule':name}for line in added for name,pattern in patterns.items()if re.search(pattern,line,re.I)]
 rows.append({'path':p,'addedLines':len(added),'hits':matched});hits.extend(matched)
out={'sourceSHA':git('rev-parse','HEAD').strip(),'baseline':base,'mode':'Added-production-line deterministic scan plus reviewed full diff; repository scan-hardcoded.sh is absent in this baseline. Test/recorded fixtures are excluded, not product exceptions.','files':rows,'newProductHits':len(hits),'manualReview':'New branch logic uses only observed group identity, full normalized label and generic actionability. Non-submitting tag set reuses existing DIV/LI/SPAN values. Source skill is obtained from existing source-pack metadata; no new website URL, outlet/cuisine lexicon, candidate ID or action sequence.'}
pathlib.Path(__file__).with_name('hardcoded-audit.json').write_text(json.dumps(out,indent=2)+'\n')
assert not hits,hits
print(json.dumps({'newProductHits':len(hits),'files':production}))
