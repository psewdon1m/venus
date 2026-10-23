import fs from'node:fs';
let code=fs.readFileSync('.docs/implementation/reviews/p05/a14-ui-wire-native-bindings-independent-round01/audit.mjs','utf8');
const replacements=[
 ["const author='.docs/implementation/reviews/p05/a14-ui-wire-native-bindings-author-round01'","const author='.docs/implementation/reviews/p05/a15-ui-wire-native-bindings-author-round01'"],
 ['11140a73c616933cae327164d7eff9b25600e028cdaadb6f2f43c81b17caa2d9','70663e0895440fa6b0e40251b14a6fb88f6020ad295fdb61d544b544ecb7bd89'],
 ["assert.equal(b.source_identity,'c481761fbecfadf77883c5ab4c8a851ab201c092b57e6994ced431dccefd4193')","assert.equal(b.source_identity,'658b710bdca35b678421a51c1c276028305f28362901b2c065a3867aa754f4de')"],
 ['Object.keys(freeze.files).length,1865','Object.keys(freeze.files).length,1869'],
 ['.docs/implementation/reviews/p05/a14-image-host-backend-carry-independent-round01/INDEX.json',' .docs/implementation/reviews/p05/a15-image-host-pure-n4-preparation-independent-round01/INDEX.json'.trim()],
 ['b12fe07a2cd58eca933ac983cdd3b477ec4dd89051aa1f70dd8a3ac27af7a5e0','129465903374b210d6e93e29ed0898dac761424b7259de6581f8d2f34784e582'],
 ['sha256:6a0336c782fde807fed24d0b0e4325bc387d0cd5d72d232340911fd28d68aee1','sha256:d3e515f5729af2306e5e62e9b92a50fe9dbf574e8a3451f8d22031bad519ac30'],
 ['5be635651557399fb9ef865ebd17c813fdf0c0eda8fc96f76a3840894cef039a','c481761fbecfadf77883c5ab4c8a851ab201c092b57e6994ced431dccefd4193'],
 ["['1863,','1865,']","['1865,','1869,']"],
 ["['p05-browser23-a13-root-ack01.json','p05-browser23-a14-root-ack01.json']","['p05-browser23-a14-root-ack01.json','p05-browser23-a15-root-ack01.json']"],
 ['a13-ui-wire-native-bindings-author-round01/browser-pending-ACK.json','a14-ui-wire-native-bindings-author-round01/browser-ACK.pending.json'],
 ['binding.included_files,1865','binding.included_files,1869'],
 ['PENDING_ROOT_MUST_VERIFY_ON_FINAL_A14_APP','PENDING_ROOT_MUST_VERIFY_ON_FINAL_A15_APP'],
 ["prior.replaceAll('resume09','resume10').replaceAll('FINAL_A13','FINAL_A14')","prior.replaceAll('resume10','resume11').replaceAll('FINAL_A14','FINAL_A15')"],
 ["prior.replace('binding.included_files,1863','binding.included_files,1869')","prior.replace('binding.included_files,1865','binding.included_files,1869')"],
 ['2224f9ad6041b3480bdf90bd00d0f84ca30095a21a0c84b3aa1ab046527e7969','7e3f9d97cfde447dc0dac434cde78af55f94618abbe4e4f50bbedf79ec7e945f'],
 ['A14_BROWSER23_LAYOUT10_WIRE04_BINDINGS_ONLY_NOT_ACTUAL','A15_BROWSER23_LAYOUT11_WIRE05_BINDINGS_ONLY_NOT_ACTUAL'],
 ['author_children:ai.files.length','author_children:Object.keys(ai.files).length']
];for(const[a,b]of replacements){if(!code.includes(a))throw Error('MISSING_EXPECTED_PARENT_AUDIT_SPAN');code=code.replaceAll(a,b);}fs.writeFileSync('.docs/implementation/reviews/p05/a15-ui-wire-native-bindings-independent-round01/audit.mjs',code);
