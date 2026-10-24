from pathlib import Path
import json,copy,hashlib,collections
root=Path.cwd();folder=root/'.docs/implementation/evidence/p05/topic-map-candidate-01';path=folder/'validate_candidate.py';source=path.read_text('utf-8');marker="(OUT / 'validation-report.json').write_text";assert source.count(marker)==1;prefix=source[:source.index(marker)];env={'__file__':str(path),'__name__':'independent_readonly_validation'};exec(compile(prefix,str(path),'exec'),env);assert len(env['results'])==24
before=json.loads(Path('.docs/implementation/reviews/p05/topic-map-round-01.candidate-before.json').read_text('utf-8'));assert {p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in folder.iterdir() if p.is_file()}==before
idx=json.loads((folder/'artifact-index.json').read_text('utf-8'))
for item in idx['files']:
 raw=(folder/item['path']).read_bytes();assert len(raw)==item['bytes'] and hashlib.sha256(raw).hexdigest()==item['sha256']
additional=[]
def reject(name,change):
 d=copy.deepcopy(env['mapping']);change(d)
 try:env['check'](d)
 except (AssertionError,KeyError,TypeError):additional.append({'name':name,'status':'REJECTED'});return
 raise AssertionError('Unexpected acceptance:'+name)
reject('empty_family_list',lambda d:d['entries'][0].__setitem__('semantic_family_ids',[]))
reject('duplicate_family',lambda d:d['entries'][0]['semantic_family_ids'].append(d['entries'][0]['semantic_family_ids'][0]))
reject('known_but_wrong_family_ref',lambda d:d['entries'][0].__setitem__('semantic_family_ids',['P04-SEM-01']))
reject('remove_claimed_all_side_read',lambda d:d['entries'][0]['locale_review'].__setitem__('all_fields_read',False))
reject('wrong_source_path',lambda d:d['entries'][0].__setitem__('source_path','.docs/content/p04/cards/Q-1001.json'))
# Meaningful limitation control: a mechanically known but wrong subject assignment is not detected by the declared binding validator.
d=copy.deepcopy(env['mapping']);d['entries'][0]['topic_ids']=['music_sound'];accepted=env['check'](d);assert accepted;additional.append({'name':'known_wrong_subject_is_not_a_mechanical_check','status':'ACCEPTED_AS_EXPECTED_MECHANICAL_ONLY_LIMIT'})
entries=env['mapping']['entries'];topic_counts=collections.Counter(t for e in entries for t in e['topic_ids']);private=[e for e in entries if e['interaction']=='pair_private'];private_counts=collections.Counter(t for e in private for t in e['topic_ids']);remaining={topic:{'all':450-count,'private':len(private)-private_counts[topic]} for topic,count in topic_counts.items()}
result={'scope':'CANDIDATE_READONLY_MECHANICAL_BINDING_NOT_SEMANTIC_APPROVAL','status':'PASS','original_checks':env['results'],'additional_controls':additional,'cards':len(env['cards']),'fields':sum(len(v) for c,p in env['cards'].values() for v in c['text'].values()),'multi_tag':sum(len(e['topic_ids'])>1 for e in entries),'single_tag':[e['card_id'] for e in entries if len(e['topic_ids'])==1],'private_count':len(private),'excluded_topic_remaining':remaining,'all13_candidate_hashes_unchanged':True};Path('.docs/implementation/reviews/p05/topic-map-round-01.mechanical-replay.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result))