/* global window,document,navigator,MediaStream,AudioContext,Event,performance */
/** Real browser getUserMedia/permissions first; own synthetic identity markers
 * are then added. This is not physical-device or hardware echo evidence. */
export function installDeviceMarkers(index){
 window.p11PCs=[];window.p11Grants=[];window.p11Inputs=[];window.p11Requests=[];
 const NativePC=window.RTCPeerConnection;window.RTCPeerConnection=class extends NativePC{constructor(...args){super(...args);window.p11PCs.push(this);}};
 const originalFetch=window.fetch;window.fetch=async(...args)=>{const response=await originalFetch(...args);const url=String(args[0]);if(url.includes('/calls/')&&response.ok)void response.clone().json().then(v=>{if(v.lease_id&&v.token)window.p11Grants.push(v);});return response;};
 const native=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
 navigator.mediaDevices.getUserMedia=async constraints=>{
  window.p11Requests.push({audio:!!constraints.audio,video:!!constraints.video,echo:constraints.audio?.echoCancellation===true,noise:constraints.audio?.noiseSuppression===true});
  const stream=await native(constraints),tracks=[];
  for(const raw of stream.getTracks()){
   let output,dispose;
   if(raw.kind==='audio'){
    const context=new AudioContext(),source=context.createMediaStreamSource(new MediaStream([raw])),gain=context.createGain(),tone=context.createOscillator(),level=context.createGain(),destination=context.createMediaStreamDestination();gain.gain.value=.005;level.gain.value=.15;tone.frequency.value=400+index*100;source.connect(gain).connect(destination);tone.connect(level).connect(destination);tone.start();await context.resume();output=destination.stream.getAudioTracks()[0];dispose=()=>{tone.stop();source.disconnect();void context.close();};
   }else{
    const video=document.createElement('video');video.muted=true;video.playsInline=true;video.srcObject=new MediaStream([raw]);await video.play();const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;const context=canvas.getContext('2d');const draw=()=>{context.drawImage(video,0,0,320,180);context.fillStyle=`rgb(${index&1?210:40},${index&2?210:40},${index&4?210:40})`;context.fillRect(0,0,32,32);context.fillStyle='white';context.fillText(String(Date.now()%1000000),48,170);};draw();const timer=setInterval(draw,66);output=canvas.captureStream(15).getVideoTracks()[0];dispose=()=>{clearInterval(timer);video.pause();video.srcObject=null;};
   }
   const record={kind:raw.kind,raw,output};window.p11Inputs.push(record);const stop=output.stop.bind(output);let stopped=false;output.stop=()=>{if(stopped)return;stopped=true;raw.stop();stop();dispose();};raw.addEventListener('ended',()=>{output.stop();output.dispatchEvent(new Event('ended'));},{once:true});tracks.push(output);
  }if(window.p11HoldCapture)await new Promise(resolve=>{window.p11ReleaseCapture=resolve;});return new MediaStream(tracks);
 };
}
export async function readCallStats(){
 const inbound=[],rtt=[];for(let i=0;i<window.p11PCs.length;i++){const pc=window.p11PCs[i];if(pc.connectionState==='closed')continue;const stats=await pc.getStats();for(const r of stats.values()){
  if(r.type==='inbound-rtp'&&!r.isRemote&&r.packetsReceived>0)inbound.push({id:i+':'+r.id,ssrc:r.ssrc,kind:r.kind,received:r.packetsReceived,lost:r.packetsLost,jitter:r.jitter,...(r.kind==='video'?{frames:r.framesDecoded}:{})});
  if(r.type==='transport'&&r.selectedCandidatePairId){const pair=stats.get(r.selectedCandidatePairId),candidate=pair&&stats.get(pair.localCandidateId);if(pair&&typeof pair.currentRoundTripTime==='number')rtt.push({pc:i,ms:pair.currentRoundTripTime*1000,protocol:candidate?.protocol??null});}
 }}return {at:performance.now(),inbound,rtt};
}
export async function readCallIdentities(){
 const values=[];window.p11Analysis??={context:new AudioContext(),tracks:new Map()};const analysis=window.p11Analysis;await analysis.context.resume();
 for(const video of document.querySelectorAll('video[data-call-peer]')){
  const stream=video.srcObject;if(!stream)continue;const hasVideo=stream.getVideoTracks().some(t=>t.readyState==='live'),audio=stream.getAudioTracks().find(t=>t.readyState==='live');let marker=null,hz=null;
  if(hasVideo&&video.readyState>=2){const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;const context=canvas.getContext('2d');context.drawImage(video,0,0);const pixel=context.getImageData(8,8,1,1).data;marker=(pixel[0]>125?1:0)|(pixel[1]>125?2:0)|(pixel[2]>125?4:0);}
  if(audio){let entry=analysis.tracks.get(audio.id);if(!entry){const source=analysis.context.createMediaStreamSource(new MediaStream([audio])),analyser=analysis.context.createAnalyser();analyser.fftSize=4096;source.connect(analyser);entry={source,analyser};analysis.tracks.set(audio.id,entry);}const bins=new Uint8Array(entry.analyser.frequencyBinCount);entry.analyser.getByteFrequencyData(bins);let peak=0;for(let i=1;i<bins.length;i++)if(bins[i]>bins[peak])peak=i;if(bins[peak]>20)hz=peak*analysis.context.sampleRate/entry.analyser.fftSize;}
  values.push({lease_id:video.dataset.callPeer,has_video:hasVideo,has_audio:!!audio,marker,frequency_hz:hz,playing:!video.paused});
 }return values;
}
