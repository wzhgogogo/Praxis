from pathlib import Path
import copy,hashlib,json

out=Path('.eval-artifacts/phase3b/semantic-gold-review')
source=Path('src/eval/restaurant/semantic/cases/restaurant-semantic-regression.gold4.json')
dataset=json.loads(source.read_text());turns={t['id']:t for s in dataset['sessions'] for t in s['turns']}
core={'SR01-T01':['yakiniku'],'SR04-T01':['Japanese food'],'SR07-T01':['Korean food'],
      'SR08-T01':['sushi','omakase'],'SR08-T02':['sushi'],'SR09-T01':['Italian food'],'SR09-T02':['Italian food']}
windows={'SR05-T01':{'earliest':'18:00','latest':'23:00'},'SR06-T01':{'earliest':'12:00','latest':'17:00'},
         'SR08-T01':{'earliest':'18:00','latest':'23:00'},'SR08-T02':{'earliest':'18:00','latest':'23:00'},
         'SR09-T01':{'earliest':'18:00','latest':'23:00'},'SR09-T02':{'earliest':'18:00','latest':'23:00'},
         'SR10-T01':{'earliest':'17:30','latest':'22:00'}}
bases={
 'strength':{'adr':'docs/decisions/0029-criterion-strength-and-nonblocking-preferences.md#decision',
             'rule':'HARD is a core requested object/type, explicit exclusion/restriction, explicit mandatory language, or existing firm numeric semantics.',
             'prompt':'src/domains/restaurant/semantic-interpreter.ts / CRITERIA and STRENGTH'},
 'time':{'adr':'docs/decisions/0026-concrete-visit-goal-and-reception-semantics.md / Decision2',
         'domain':'docs/domains/RESTAURANT-BOOKING.md / visit window semantics',
         'implementation':'src/domains/restaurant/temporal-materialization.ts',
         'rule':'Code materializes broad temporal directives; preserve user raw words. AFTERNOON12:00-17:00, EVENING18:00-23:00, AFTER_WORK17:30-22:00.'},
 'confirm':{'adr':'docs/decisions/0007-semantic-proposal-compiler-and-decision-kernel.md',
            'contract':'src/domains/restaurant/semantic-proposal.ts / validateRestaurantSemanticProposal',
            'prompt':'src/domains/restaurant/semantic-interpreter.ts / OPERATIONS and OUTPUT SHAPES',
            'rule':'CRITERION is a collection: ASSERT adds; CORRECT replaces only on explicit replacement; NEGATE removes. CONFIRM is only for singletons, has no value; CRITERION CONFIRM is not allowed.'}}
rows=[]
for n in range(1,16):
    p=Path(f'.eval-artifacts/phase3a-boundary/batch3/continuation/rows/{n:03}.main.json');observed=json.loads(p.read_text());tid=observed['turnId'];turn=turns[tid]
    proposals=[];gold=turn['expectedDraft'];suggested=copy.deepcopy(gold)
    for text in core.get(tid,[]):
        current=next(c for c in gold['criteria'] if c['text']==text)
        change={'field':f'criteria[{text}].strength','current':current['strength'],'proposed':'HARD','basis':bases['strength'],
                'reason':'Core requested cuisine/type, or explicit exclusion for omakase; this follows accepted semantics rather than matching a model vote.',
                'status':'AWAITING_USER_CONFIRMATION'}
        proposals.append(change)
    if tid in windows:
        proposals.append({'field':'timeWindow','current':gold.get('timeWindow'),'proposed':windows[tid],'basis':bases['time'],
                          'reason':'Align the frozen draft with the current documented code materialization. This is a query interpretation, not a user-stated exact time.',
                          'status':'AWAITING_USER_CONFIRMATION'})
    if tid=='SR05-T01':
        proposals.append({'field':'criteria[smoking].text/polarity/strength','current':gold['criteria'][0],
                          'proposed':gold['criteria'][0],'status':'KEEP_GOLD_REVIEW_MODEL_WORDING',
                          'basis':bases['strength'],'reason':'Keep smoking / NEGATIVE / HARD. Model text no smoking with NEGATIVE risks inverting meaning; do not copy it into Gold. Quiet room stays SOFT.'})
    if tid=='SR03-T02':
        proposals.append({'field':'target.query','current':'Sushi Dai','proposed':'Sushi Dai','status':'KEEP_GOLD_FIX_SEMANTIC_PROPOSAL',
                          'basis':'ADR0044 current-target context plus current prompt TARGET preservation; explicit user3b named-outlet requirement',
                          'reason':'Named outlet must survive supplemental time/party/area. Goal AVAILABILITY already approved in Gold4; generic model query is the defect.'})
    if tid=='SR08-T02':
        proposals.append({'field':'CRITERION CONFIRM model operation','current':'Gold expects omakase restriction removed and sushi retained',
                          'proposed':'Keep that expected state; NEGATE the existing omakase restriction, omit unchanged sushi; do not accept collection CONFIRM or value-bearing CONFIRM.',
                          'basis':bases['confirm'],'status':'KEEP_GOLD_STATE_MODEL_CONTRACT_FIX_REQUIRES_REVIEW',
                          'reason':'Invalid proposal is an execution/contract failure, not evidence to relabel Gold to the failed state. Any inherited sushi strength/window change needs its own confirmation above.'})
    rows.append({'turnId':tid,'message':turn['message'],'goldVersion':'4','capturedPrompt':'v24','observationPath':str(p),
                 'observationSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'modelStatus':observed['interpreted']['status'],
                 'recordedNonTargetValueDifferences':observed['evaluation'].get('nonTargetValueDifferences',[]),
                 'recordedDiagnosticDifferences':observed['evaluation'].get('diagnosticDifferences',[]),
                 'modelErrors':observed['interpreted'].get('errors',[]),'proposals':proposals,
                 'previousV23Control':f'.eval-artifacts/phase3a-boundary/batch3/continuation/rows/{tid}.control.json' if Path(f'.eval-artifacts/phase3a-boundary/batch3/continuation/rows/{tid}.control.json').exists() else None})
result={'schema':'phase3b-development-gold-review@1','status':'DRAFT_NOT_INTEGRATED_AWAITING_ITEMWISE_USER_CONFIRMATION',
        'currentDatasetId':dataset['id'],'currentDatasetVersion':'4','currentGoldSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
        'goldModified':False,'newRealCalls':0,'privateHoldout':'NOT_READ','futureVersionRule':'Only after explicit itemwise review create Gold5 retaining4; no historical scoring rewrite. Prompt/result exposure stays declared.',
        'annotationChangesProposed':sum(x['status']=='AWAITING_USER_CONFIRMATION' for r in rows for x in r['proposals']),
        'separateModelProblems':'Generic named-target query, collection CONFIRM and negative-text wording are not automatic Gold changes. Provenance/raw expression/selectionScope absent from old labels remain separate diagnostics.',
        'bases':bases,'rows':rows}
(out/'inventory.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('Gold changes proposed, not applied:',result['annotationChangesProposed'],'; all15 turns inventoried; immutableGold4 SHA',result['currentGoldSha256'])
