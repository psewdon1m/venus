/* global window,document,navigator,MediaStream,AudioContext,performance */
/** Native Chromium file-backed synthetic identities. Observe real browser
 * permissions/tracks without post-capture AudioContext/canvas transformation. */
export function installDeviceMarkers(){
 window.p11PCs=[];window.p11Grants=[];window.p11Inputs=[];window.p11Requests=[];
 const NativePC=window.RTCPeerConnection;window.RTCPeerConnection=class extends NativePC{constructor(...args){super(...args);window.p11PCs.push(this);}};
 const originalFetch=window.fetch;window.fetch=async(...args)=>{const response=await originalFetch(...args);const url=String(args[0]);if(url.includes('/calls/')&&response.ok)void response.clone().json().then(v=>{if(v.lease_id&&v.token)window.p11Grants.push(v);});return response;};
 const native=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
 navigator.mediaDevices.getUserMedia=async constraints=>{
  window.p11Requests.push({audio:!!constraints.audio,video:!!constraints.video,echo:constraints.audio?.echoCancellation===true,noise:constraints.audio?.noiseSuppression===true});
  const stream=await native(constraints);for(const raw of stream.getTracks())window.p11Inputs.push({kind:raw.kind,raw,output:raw});
  if(window.p11HoldCapture)await new Promise(resolve=>{window.p11ReleaseCapture=resolve;});return stream;
 };
}
export async function readCallStats(){
 const inbound=[],rtt=[],upstream=[],outbound=[],inspectSource=(window.p11StatsReads=(window.p11StatsReads??0)+1)%10===1;window.p11RRSeen??=new Map();for(let i=0;i<window.p11PCs.length;i++){const pc=window.p11PCs[i];if(pc.connectionState==='closed')continue;const stats=await pc.getStats();for(const r of stats.values()){
  if(r.type==='inbound-rtp'&&!r.isRemote&&r.packetsReceived>0)inbound.push({id:i+':'+r.id,ssrc:r.ssrc,kind:r.kind,received:r.packetsReceived,lost:r.packetsLost,jitter:r.jitter,...(r.kind==='video'?{frames:r.framesDecoded}:{})});
  if(r.type==='remote-inbound-rtp'){const key=i+':'+r.id,version=r.reportsReceived??r.totalRoundTripTime??r.timestamp;if(window.p11RRSeen.get(key)!==version){window.p11RRSeen.set(key,version);const source=stats.get(r.localId);upstream.push({pc:i,id:r.id,local_id:r.localId,ssrc:r.ssrc,kind:r.kind??source?.kind,jitter_seconds:r.jitter??null,packets_lost:r.packetsLost??null,reports_received:r.reportsReceived??null,timestamp_ms:r.timestamp,round_trip_seconds:r.roundTripTime??null});}}
  if(inspectSource&&r.type==='outbound-rtp'&&!r.isRemote&&r.packetsSent>0)outbound.push({pc:i,id:r.id,ssrc:r.ssrc,kind:r.kind,packets_sent:r.packetsSent,total_packet_send_delay_seconds:r.totalPacketSendDelay??null,frames_encoded:r.framesEncoded??null,total_encode_seconds:r.totalEncodeTime??null,frames_per_second:r.framesPerSecond??null,quality_limitation_reason:r.qualityLimitationReason??null,bytes_sent:r.bytesSent});
  if(r.type==='transport'&&r.selectedCandidatePairId){const pair=stats.get(r.selectedCandidatePairId),candidate=pair&&stats.get(pair.localCandidateId);if(pair&&typeof pair.currentRoundTripTime==='number')rtt.push({pc:i,ms:pair.currentRoundTripTime*1000,protocol:candidate?.protocol??null});}
 }}return {at:performance.now(),inbound,rtt,upstream,outbound,connections:window.p11PCs.map((pc,index)=>({pc:index,state:pc.connectionState,ice:pc.iceConnectionState}))};
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
