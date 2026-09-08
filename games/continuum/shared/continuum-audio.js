(()=>{
'use strict';
const STORE='continuum.audio.enabled';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
class ContinuumAudioEngine{
  constructor(opts={}){
    this.opts=opts; this.profile=opts.profile||'forest'; this.ctx=null; this.master=null; this.ambient=null; this.sfx=null;
    this.enabled=localStorage.getItem(STORE)!=='0'; this.started=false; this.noiseBuffer=null; this.nodes=[]; this.timers=[]; this.lastCue=new Map();
    if(opts.toggle!==false) this.makeToggle(opts.right||'70px',opts.top||'10px');
    const wake=()=>this.start();
    addEventListener('pointerdown',wake,{once:true,capture:true}); addEventListener('keydown',wake,{once:true,capture:true});
  }
  makeToggle(right,top){
    const b=document.createElement('button'); b.type='button'; b.className='caudio-toggle'; b.setAttribute('aria-label','Geluid aan of uit');
    b.textContent=this.enabled?'♪':'×';
    Object.assign(b.style,{position:'fixed',zIndex:'60',right,top,width:'44px',height:'44px',borderRadius:'50%',border:'1px solid rgba(235,220,184,.22)',background:'rgba(8,12,13,.38)',backdropFilter:'blur(7px)',color:'rgba(244,235,214,.88)',fontSize:'19px',display:'grid',placeItems:'center',cursor:'pointer',padding:'0',lineHeight:'1',boxShadow:'0 4px 18px rgba(0,0,0,.16)'});
    b.addEventListener('pointerdown',e=>e.stopPropagation());
    b.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation(); await this.start(); this.setEnabled(!this.enabled); b.textContent=this.enabled?'♪':'×';});
    document.body.appendChild(b); this.button=b;
  }
  async start(){
    if(this.started){ if(this.ctx?.state==='suspended') try{await this.ctx.resume()}catch{} return; }
    const C=window.AudioContext||window.webkitAudioContext; if(!C)return;
    this.ctx=new C(); this.master=this.ctx.createGain(); this.ambient=this.ctx.createGain(); this.sfx=this.ctx.createGain();
    this.master.gain.value=this.enabled?.34:0; this.ambient.gain.value=.52; this.sfx.gain.value=.82;
    this.ambient.connect(this.master); this.sfx.connect(this.master); this.master.connect(this.ctx.destination);
    this.noiseBuffer=this.makeNoiseBuffer(2.5); this.started=true; this.startAmbience();
  }
  setEnabled(v){this.enabled=!!v;localStorage.setItem(STORE,this.enabled?'1':'0');if(this.master&&this.ctx)this.master.gain.setTargetAtTime(this.enabled?.34:0,this.ctx.currentTime,.06);}
  makeNoiseBuffer(seconds=2){const n=Math.max(1,Math.floor(this.ctx.sampleRate*seconds)),b=this.ctx.createBuffer(1,n,this.ctx.sampleRate),d=b.getChannelData(0);let x=0;for(let i=0;i<n;i++){x=.985*x+(Math.random()*2-1)*.15;d[i]=x*.72}return b;}
  loopNoise({gain=.025,low=900,high=0,pan=0}={}){const s=this.ctx.createBufferSource();s.buffer=this.noiseBuffer;s.loop=true;let node=s;if(high){const hp=this.ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=high;node.connect(hp);node=hp}if(low){const lp=this.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=low;node.connect(lp);node=lp}if(this.ctx.createStereoPanner){const p=this.ctx.createStereoPanner();p.pan.value=pan;node.connect(p);node=p}const g=this.ctx.createGain();g.gain.value=gain;node.connect(g).connect(this.ambient);s.start();this.nodes.push(s,g);return g;}
  drone(freq,gain=.012,type='sine',pan=0){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=gain;if(this.ctx.createStereoPanner){const p=this.ctx.createStereoPanner();p.pan.value=pan;o.connect(g);g.connect(p);p.connect(this.ambient);this.nodes.push(p)}else{o.connect(g).connect(this.ambient)}o.start();this.nodes.push(o,g);return {o,g};}
  periodic(fn,min=3500,max=9000){const schedule=()=>{const t=min+Math.random()*(max-min);const id=setTimeout(()=>{if(this.started&&this.enabled)fn();schedule()},t);this.timers.push(id)};schedule()}
  startAmbience(){
    switch(this.profile){
      case 'mirror': this.loopNoise({gain:.018,low:650,pan:.55});this.drone(174,.008,'sine',-.55);this.drone(261.6,.004,'sine',-.35);this.periodic(()=>this.cue('drop',.35),4200,9000);break;
      case 'forge': this.loopNoise({gain:.032,low:1200});this.drone(73.4,.010,'triangle',0);this.periodic(()=>this.cue('crackle',.28),1400,3900);break;
      case 'lock': this.loopNoise({gain:.035,low:720,pan:.15});this.drone(58,.005,'sine',0);this.periodic(()=>this.cue('drop',.35),2800,7200);break;
      case 'garden': this.loopNoise({gain:.020,low:1300});this.drone(98,.004,'sine',0);this.periodic(()=>this.cue(Math.random()>.45?'leaf':'drop',.28),3500,8200);break;
      case 'web': this.loopNoise({gain:.017,low:1800});this.drone(110,.0025,'sine',0);this.periodic(()=>this.cue('insect',.22),3800,9000);break;
      default: this.loopNoise({gain:.018,low:1100});
    }
  }
  allowed(name,ms=70){const now=performance.now(),last=this.lastCue.get(name)||-1e9;if(now-last<ms)return false;this.lastCue.set(name,now);return true;}
  tone(freq=440,dur=.16,gain=.08,type='sine',delay=0,pan=0,endFreq=null){if(!this.started||!this.enabled)return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);if(this.ctx.createStereoPanner){const p=this.ctx.createStereoPanner();p.pan.value=pan;o.connect(g);g.connect(p);p.connect(this.sfx)}else{o.connect(g).connect(this.sfx)}o.start(t);o.stop(t+dur+.03);}
  burst({dur=.16,gain=.08,low=1800,high=0,pan=0}={}){if(!this.started||!this.enabled)return;const s=this.ctx.createBufferSource();s.buffer=this.noiseBuffer;let node=s;if(high){const hp=this.ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=high;s.connect(hp);node=hp}const lp=this.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=low;node.connect(lp);node=lp;if(this.ctx.createStereoPanner){const p=this.ctx.createStereoPanner();p.pan.value=pan;node.connect(p);node=p}const g=this.ctx.createGain(),t=this.ctx.currentTime;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);node.connect(g).connect(this.sfx);s.start(t);s.stop(t+dur+.02);}
  cue(name,strength=.6,data={}){
    if(!this.started||!this.enabled)return; strength=clamp(Number(strength)||.5,.05,1);
    if(name==='drag'&&!this.allowed(name,95))return;
    if(name==='crackle'&&!this.allowed(name,350))return;
    switch(name){
      case 'grab': this.tone(210,.055,.035*strength,'triangle',0,0,185);break;
      case 'drag': this.burst({dur:.055,gain:.025*strength,low:700});break;
      case 'release': this.tone(185,.09,.032*strength,'triangle',0,0,150);break;
      case 'good': this.tone(392,.12,.045*strength,'sine');this.tone(523.25,.16,.040*strength,'sine',.055);break;
      case 'warn': this.tone(196,.16,.045*strength,'triangle',0,0,155);this.burst({dur:.09,gain:.025*strength,low:650});break;
      case 'solve': [261.63,392,523.25].forEach((f,i)=>this.tone(f,.34,.055*strength,'sine',i*.095));break;
      case 'mirror': this.tone(659.25,.13,.042*strength,'sine',0,-.35);this.tone(440,.17,.034*strength,'sine',.025,.4);break;
      case 'water': this.burst({dur:.28,gain:.072*strength,low:1500});this.tone(150,.16,.018*strength,'sine');break;
      case 'drop': this.tone(930+Math.random()*230,.11,.025*strength,'sine',0,.45,520);break;
      case 'stone': this.burst({dur:.19,gain:.055*strength,low:520});this.tone(82,.18,.055*strength,'triangle',0,0,62);break;
      case 'fish': this.burst({dur:.11,gain:.045*strength,low:1900,high:280});this.tone(520,.09,.025*strength,'sine');break;
      case 'fire': this.burst({dur:.24,gain:.065*strength,low:2300,high:180});this.tone(122,.22,.023*strength,'triangle');break;
      case 'crackle': this.burst({dur:.035+Math.random()*.04,gain:.035*strength,low:3300,high:500});break;
      case 'leather': this.tone(155,.20,.035*strength,'sawtooth',0,0,115);this.burst({dur:.12,gain:.019*strength,low:850});break;
      case 'bellows': this.burst({dur:.36,gain:.055*strength,low:1250,high:70});break;
      case 'growth': [330,415.3,523.25].forEach((f,i)=>this.tone(f,.26,.038*strength,'sine',i*.07));this.burst({dur:.33,gain:.022*strength,low:2100});break;
      case 'leaf': this.burst({dur:.12,gain:.018*strength,low:2600,high:480});break;
      case 'machine': this.tone(116,.19,.044*strength,'triangle',0,0,92);this.burst({dur:.15,gain:.035*strength,low:800});break;
      case 'pluck': {const f=clamp(data.freq||440,150,1200),d=clamp(data.dur||.42,.14,.8);this.tone(f,d,.052*strength,'sine');this.tone(f*2.01,d*.46,.018*strength,'sine',.006);break;}
      case 'probe': this.tone(280,.11,.032*strength,'triangle');this.tone(330,.16,.028*strength,'triangle',.08);break;
      case 'moth': this.burst({dur:.16,gain:.025*strength,low:4200,high:900});break;
      case 'insect': {const f=1700+Math.random()*600;this.tone(f,.045,.012*strength,'sine');this.tone(f*1.08,.045,.009*strength,'sine',.075);break;}
    }
  }
}
window.ContinuumAudio={create:opts=>new ContinuumAudioEngine(opts)};
})();
