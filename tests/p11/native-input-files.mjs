/** Original generated per-user media, consumed by Chromium native fake devices. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
export function createNativeInputs(directory){
 fs.mkdirSync(directory,{recursive:true,mode:0o700});const files=[];
 for(let index=0;index<8;index++){
  const rate=48000,count=rate*2,wav=Buffer.alloc(44+count*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(count*2,40);
  for(let n=0;n<count;n++)wav.writeInt16LE(Math.round(Math.sin(2*Math.PI*(400+index*100)*n/rate)*12000),44+n*2);
  const width=320,height=180,y=width*height,base=Buffer.alloc(y*3/2,128);base.fill(50,0,y);
  const [red,green,blue]=[index&1?210:40,index&2?210:40,index&4?210:40],Y=Math.round(16+.257*red+.504*green+.098*blue),U=Math.round(128-.148*red-.291*green+.439*blue),V=Math.round(128+.439*red-.368*green-.071*blue);
  for(let row=0;row<32;row++)base.fill(Y,row*width,row*width+32);
  for(let row=0;row<16;row++){base.fill(U,y+row*width/2,y+row*width/2+16);base.fill(V,y+y/4+row*width/2,y+y/4+row*width/2+16);}
  const parts=[Buffer.from('YUV4MPEG2 W320 H180 F15:1 Ip A1:1 C420jpeg\n')];
  for(let n=0;n<30;n++){const frame=Buffer.from(base),x=32+n*8%256;for(let row=84;row<88;row++)frame.fill(220,row*width+x,row*width+x+24);parts.push(Buffer.from('FRAME\n'),frame);}
  const video=Buffer.concat(parts),audio=path.join(directory,index+'.wav'),camera=path.join(directory,index+'.y4m');fs.writeFileSync(audio,wav);fs.writeFileSync(camera,video);files.push({index,audio,camera,audio_sha256:createHash('sha256').update(wav).digest('hex'),camera_sha256:createHash('sha256').update(video).digest('hex'),audio_bytes:wav.length,camera_bytes:video.length});
 }return files;
}
