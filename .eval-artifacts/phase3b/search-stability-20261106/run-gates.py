import datetime,json,os,pathlib,subprocess,time
root=pathlib.Path(__file__).parent/'final-gates';root.mkdir(exist_ok=True)
sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
commands=[('typecheck',['npm','run','typecheck']),('arch',['npm','run','arch:check']),('test',['npm','test']),('build',['npm','run','build']),('browser-and-g6',['npm','run','test:browser:fixture']),('strict-g2',['npm','run','test:dom-change'])]
rows=[]
for name,cmd in commands:
 before=subprocess.check_output(['git','status','--porcelain'],text=True)
 if before:raise SystemExit('Unexpected dirty tree before '+name)
 start=time.monotonic();stamp=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()
 print('START '+name+' '+stamp,flush=True)
 with (root/(name+'.log')).open('w') as log:
  result=subprocess.run(cmd,stdout=log,stderr=subprocess.STDOUT,env={**os.environ,**({'PRAXIS_G2_REQUIRE_PASS':'1'} if name=='strict-g2' else {})})
 after=subprocess.check_output(['git','status','--porcelain'],text=True)
 rows.append(dict(name=name,command=cmd,environment={'PRAXIS_G2_REQUIRE_PASS':'1'} if name=='strict-g2' else {},sourceSHA=sha,startedAtCET=stamp,elapsedMs=(time.monotonic()-start)*1000,exitCode=result.returncode,gitStatusBefore=before,gitStatusAfter=after))
 (root/'results.json').write_text(json.dumps(dict(sourceSHA=sha,model=0,websiteGET=0,Google=0,Live=0,rows=rows),indent=2)+'\n')
 print('END '+name+' '+str(result.returncode),flush=True)
 if result.returncode or after:raise SystemExit(2)
