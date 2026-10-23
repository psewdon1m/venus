/** Exact P03 functions, isolated from legacy fixture/CLI. */
function assert(ok,code) {if(!ok) throw new Error(code);}
export function pairedRatioCI(counts) {
  assert(Object.keys(counts).sort().join(',')==='both,f_only,g_only,neither'&&Object.values(counts).every(n=>Number.isSafeInteger(n)&&n>=0),'INVALID_PAIRED_COUNTS');
  const {both,g_only,f_only,neither}=counts,n=both+g_only+f_only+neither,pG=(both+g_only)/n,pF=(both+f_only)/n;
  if(n<2||pG===0||pF===0) return {status:'FAIL',reason:'ZERO_COUNT_OR_DENOMINATOR',n,counts};
  const varianceG=n/(n-1)*pG*(1-pG),varianceF=n/(n-1)*pF*(1-pF),covariance=n/(n-1)*(both/n-pG*pF);
  const variance=(varianceG/pG**2+varianceF/pF**2-2*covariance/(pG*pF))/n;
  if(!Number.isFinite(variance)||variance< -1e-14) return {status:'FAIL',reason:'NONFINITE_VARIANCE',n,counts};
  const se=Math.sqrt(Math.max(0,variance)),ratio=pG/pF,ci=[Math.exp(Math.log(ratio)-1.96*se),Math.exp(Math.log(ratio)+1.96*se)];
  return {status:ci[0]>1?'PASS':'FAIL',n,counts,pG,pF,sG2:varianceG,sF2:varianceF,sGF:covariance,variance_log_ratio:variance,ratio,log_ratio_se:se,ci95:ci};
}
export function aucCI(negative,positive) {
  assert(negative.length>1&&positive.length>1&&negative.every(Number.isFinite)&&positive.every(Number.isFinite),'INVALID_AUC_INPUT');
  const ordered=[...negative.map(score=>({score,label:0})),...positive.map(score=>({score,label:1}))].sort((a,b)=>a.score-b.score);let rankSum=0;
  for(let a=0;a<ordered.length;) {let b=a+1;while(b<ordered.length&&ordered[b].score===ordered[a].score) b++;const rank=(a+1+b)/2;for(let i=a;i<b;i++) if(ordered[i].label) rankSum+=rank;a=b;}
  const n0=negative.length,n1=positive.length,auc=(rankSum-n1*(n1+1)/2)/(n0*n1),q1=auc/(2-auc),q2=2*auc*auc/(1+auc),variance=(auc*(1-auc)+(n1-1)*(q1-auc*auc)+(n0-1)*(q2-auc*auc))/(n0*n1),se=Math.sqrt(Math.max(0,variance)),ci=[Math.max(0,auc-1.96*se),Math.min(1,auc+1.96*se)];
  return {n_negative:n0,n_positive:n1,auc,se,ci95:ci,status:Number.isFinite(auc)&&ci[1]<=.65?'PASS':'FAIL'};
}
export function trainLDA(negative,positive) {
  assert(negative.length>1&&positive.length>1&&negative[0]?.length>0&&[...negative,...positive].every(row=>row.length===negative[0].length&&row.every(Number.isFinite)),'INVALID_LDA_INPUT');
  const dimension=negative[0].length,moments=rows=>{const mean=new Float64Array(dimension),sq=new Float64Array(dimension);for(const row of rows) for(let i=0;i<dimension;i++) {mean[i]+=row[i];sq[i]+=row[i]**2;}for(let i=0;i<dimension;i++) {mean[i]/=rows.length;sq[i]=Math.max(0,(sq[i]-rows.length*mean[i]**2)/(rows.length-1));}return {mean,variance:sq};},a=moments(negative),b=moments(positive),weights=Float64Array.from(a.mean,(_,i)=>(b.mean[i]-a.mean[i])/((a.variance[i]+b.variance[i])/2+1e-9));
  const intercept=-weights.reduce((sum,w,i)=>sum+w*(a.mean[i]+b.mean[i])/2,0);
  return {weights,intercept,score:row=>row.reduce((sum,x,i)=>sum+x*weights[i],intercept)};
}
export function deterministicDecoders(training,holdout,featureNames) {
  const hits=[];for(let feature=0;feature<featureNames.length;feature++) {
    // Fixed exact-value decoder learned on training; report only if it classifies
    // every held-out sample of both classes. No holdout orientation selection.
    const a=new Set(training[0].map(row=>row[feature])),b=new Set(training[1].map(row=>row[feature]));if([...a].some(v=>b.has(v))) continue;
    if(holdout[0].every(row=>a.has(row[feature]))&&holdout[1].every(row=>b.has(row[feature]))) hits.push(featureNames[feature]);
  }return hits;
}
