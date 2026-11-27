// Camada 4D: clima vivo, vento, água, relâmpagos e áudio ambiente.
// Mantém o ciclo solar original do jogo e acrescenta efeitos locais de baixo custo.
export function createImmersive4D(THREE, scene) {
  const state={weather:'clear',sound:false,audio:null,elapsed:0,lightning:0,wind:.35,stepClock:0,birdClock:0,musicClock:0,lastPosition:null,lastMoving:false,lastMounted:false,lastRunning:false};
  const weatherOptions=[['clear','☀️ Limpo'],['cloudy','☁️ Nublado'],['rain','🌧️ Chuva'],['storm','⛈️ Tempestade'],['snow','❄️ Neve'],['fog','🌫️ Neblina']];
  const panel=document.createElement('div');panel.id='immersive4dPanel';
  panel.style.cssText='position:fixed;right:10px;top:112px;z-index:6;pointer-events:auto;background:#142019ee;border:1px solid #d3b775;border-radius:12px;padding:7px;color:#fff2d0;font:12px system-ui;box-shadow:0 4px 16px #0008;width:154px;max-width:45vw;transition:width .18s ease';
  panel.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;font-weight:800;color:#f0cc78"><span>🌍 MUNDO 4D</span><button id="collapse4d" type="button" aria-label="Recolher painel 4D" style="padding:2px 7px;font-size:13px">⌃</button></div><div id="body4d"><label for="weather4d">Clima</label><select id="weather4d" style="display:block;width:100%;margin:4px 0 7px;padding:7px;border-radius:7px;background:#293b2d;color:#fff;border:1px solid #c5a96b"></select><button id="sound4d" type="button" style="width:100%;padding:8px;font-size:11px">🔇 Ativar sons</button><div id="audioControls4d" style="display:none;margin-top:8px"><label>Música <input data-audio="music" type="range" min="0" max="100" value="24" style="width:100%"></label><label>Ambiente <input data-audio="ambient" type="range" min="0" max="100" value="55" style="width:100%"></label><label>Efeitos <input data-audio="effects" type="range" min="0" max="100" value="70" style="width:100%"></label></div><div id="weatherStatus4d" style="margin-top:6px;opacity:.8">Ciclo solar ativo</div></div>';
  document.body.appendChild(panel);
  const body4d=panel.querySelector('#body4d'),collapse4d=panel.querySelector('#collapse4d');
  panel.classList.add('collapsed');body4d.style.display='none';panel.style.width='116px';
  collapse4d.addEventListener('click',()=>{const collapsed=panel.classList.toggle('collapsed');body4d.style.display=collapsed?'none':'block';panel.style.width=collapsed?'116px':'154px';collapse4d.textContent=collapsed?'⌄':'⌃';collapse4d.setAttribute('aria-label',collapsed?'Expandir painel 4D':'Recolher painel 4D');});
  const select=panel.querySelector('#weather4d');
  for(const [value,label] of weatherOptions){const option=document.createElement('option');option.value=value;option.textContent=label;select.appendChild(option);}
  select.addEventListener('change',()=>setWeather(select.value));
  panel.querySelector('#sound4d').addEventListener('click',async()=>{
    try{
      if(!state.audio)state.audio=makeAudio();
      if(state.audio.ctx.state==='suspended')await state.audio.ctx.resume();
      state.sound=!state.sound;const a=state.audio;
      a.master.gain.setTargetAtTime(state.sound?1:0,a.ctx.currentTime,.25);
      panel.querySelector('#sound4d').textContent=state.sound?'🔊 Sons ligados':'🔇 Ativar sons';
      panel.querySelector('#audioControls4d').style.display=state.sound?'block':'none';
      panel.querySelector('#weatherStatus4d').textContent=state.sound?'Ambiente sonoro imersivo ativo':'Som desativado';
      if(state.sound)play('birds');
    }catch(e){panel.querySelector('#weatherStatus4d').textContent='Áudio indisponível neste aparelho';}
  });
  panel.querySelectorAll('[data-audio]').forEach(input=>input.addEventListener('input',()=>{
    if(!state.audio)return;const a=state.audio,v=Number(input.value)/100;
    const target=input.dataset.audio==='music'?a.musicGain:input.dataset.audio==='ambient'?a.ambientGain:a.effectsGain;
    target.gain.setTargetAtTime(v,a.ctx.currentTime,.08);
  }));
  function makeAudio(){
    const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)throw new Error('Web Audio não disponível');
    const ctx=new Ctx(),master=ctx.createGain(),musicGain=ctx.createGain(),ambientGain=ctx.createGain(),effectsGain=ctx.createGain();
    master.gain.value=0;musicGain.gain.value=.24;ambientGain.gain.value=.55;effectsGain.gain.value=.7;
    musicGain.connect(master);ambientGain.connect(master);effectsGain.connect(master);master.connect(ctx.destination);
    const makeNoise=(type,freq,volume)=>{
      const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),d=buffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
      const src=ctx.createBufferSource();src.buffer=buffer;src.loop=true;const filter=ctx.createBiquadFilter();filter.type=type;filter.frequency.value=freq;
      const gain=ctx.createGain();gain.gain.value=volume;src.connect(filter);filter.connect(gain);gain.connect(ambientGain);src.start();return {src,filter,gain};
    };
    const wind=makeNoise('lowpass',360,.20),rain=makeNoise('lowpass',1800,0),fire=makeNoise('bandpass',950,.018);
    const drone=ctx.createOscillator(),drone2=ctx.createOscillator(),mg=ctx.createGain();
    drone.type='triangle';drone.frequency.value=110;drone2.type='sine';drone2.frequency.value=164.81;mg.gain.value=.035;
    drone.connect(mg);drone2.connect(mg);mg.connect(musicGain);drone.start();drone2.start();
    return {ctx,master,musicGain,ambientGain,effectsGain,wind,rain,fire,drone,drone2};
  }
  function playMusicNote(){
    if(!state.audio||!state.sound)return;
    const a=state.audio,ctx=a.ctx,notes=[146.83,174.61,220,293.66,349.23,440,293.66,220],freq=notes[Math.floor(Math.random()*notes.length)];
    const o=ctx.createOscillator(),g=ctx.createGain(),filter=ctx.createBiquadFilter(),now=ctx.currentTime;
    o.type='triangle';o.frequency.setValueAtTime(freq,now);filter.type='lowpass';filter.frequency.value=1500;
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.045,now+.025);g.gain.exponentialRampToValueAtTime(.0001,now+1.05);
    o.connect(filter);filter.connect(g);g.connect(a.musicGain);o.start(now);o.stop(now+1.1);
  }
  function play(name,position){
    if(!state.audio||!state.sound)return;const a=state.audio,ctx=a.ctx,now=ctx.currentTime;
    const panner=ctx.createPanner();panner.panningModel='HRTF';panner.distanceModel='inverse';panner.refDistance=2;panner.maxDistance=42;panner.rolloffFactor=1.25;
    const pos=position||{x:0,y:1,z:0};panner.positionX.setValueAtTime(pos.x||0,now);panner.positionY.setValueAtTime((pos.y||0)+.8,now);panner.positionZ.setValueAtTime(pos.z||0,now);
    const out=ctx.createGain();out.gain.value=.0001;out.connect(panner);panner.connect(a.effectsGain);
    const tone=(freq,type,duration,volume,endFreq)=>{
      const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,now);if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(25,endFreq),now+duration);
      g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(volume,now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+duration);
      o.connect(g);g.connect(out);o.start(now);o.stop(now+duration+.03);
    };
    const noise=(duration,volume,filterFreq)=>{
      const n=ctx.createBufferSource(),buf=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),d=buf.getChannelData(0);
      for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length*.45);
      n.buffer=buf;const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=filterFreq;const g=ctx.createGain();
      g.gain.setValueAtTime(volume,now);g.gain.exponentialRampToValueAtTime(.0001,now+duration);n.connect(f);f.connect(g);g.connect(out);n.start(now);n.stop(now+duration);
    };
    if(name==='sword'){noise(.28,.22,1500);tone(520,'sawtooth',.19,.08,105);}
    else if(name==='hit'){tone(115,'triangle',.22,.34,48);noise(.12,.12,650);}
    else if(name==='jump')tone(180,'sine',.22,.14,390);
    else if(name==='dodge')noise(.24,.16,1250);
    else if(name==='footstep'){tone(72,'sine',.09,.19,42);noise(.055,.08,320);}
    else if(name==='hoof'){tone(105,'triangle',.11,.22,58);noise(.07,.1,500);}
    else if(name==='wood'){tone(185,'triangle',.18,.24,95);noise(.08,.09,900);}
    else if(name==='stone'){tone(260,'square',.13,.13,120);tone(95,'sine',.2,.16,55);}
    else if(name==='mount'){tone(240,'sine',.32,.13,360);tone(360,'sine',.28,.09,260);}
    else if(name==='birds'){tone(1500,'sine',.12,.055,2100);setTimeout(()=>{if(state.sound)tone(1900,'sine',.16,.045,1250)},125);}
    else if(name==='thunder'){noise(.95,.26,240);tone(58,'sine',.9,.22,32);}
    else if(name==='fire')noise(.16,.1,2400);
    else if(name==='chicken'){tone(880,'triangle',.16,.16,1180);tone(620,'sawtooth',.22,.08,430);noise(.12,.07,1700);}
    else if(name==='cow'){tone(92,'sawtooth',.62,.22,68);tone(138,'triangle',.48,.12,92);}
    else if(name==='egg'){tone(520,'sine',.12,.12,780);tone(760,'sine',.18,.07,920);}
    else if(name==='milk'){noise(.42,.11,1050);tone(310,'sine',.24,.045,220);}
    else if(name==='cannon'){noise(.72,.34,420);tone(64,'sawtooth',.62,.28,32);tone(38,'sine',.9,.2,25);}
    else if(name==='dragon'){noise(.8,.22,720);tone(72,'sawtooth',.7,.2,38);tone(115,'triangle',.5,.1,62);}
    else if(name==='enemy'){noise(.34,.16,680);tone(105,'sawtooth',.28,.12,58);}
    else return;
    out.gain.setTargetAtTime(1,now,.008);out.gain.setTargetAtTime(.0001,now+(name==='thunder' ? 0.85 : 0.3),.08);
    setTimeout(()=>{try{out.disconnect();panner.disconnect();}catch(_){}},1400);
  }
  const mobile=innerWidth<=700;
  const maxParticles = Math.min(mobile?360:760, Math.max(mobile?140:260, Math.floor((innerWidth*innerHeight)/(mobile?3200:2100))));
  const positions = new Float32Array(maxParticles*3), velocities = new Float32Array(maxParticles*3);
  const particleGeo = new THREE.BufferGeometry(); particleGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const particleMat = new THREE.PointsMaterial({color:0xb9d7e8,size:.13,transparent:true,opacity:0,depthWrite:false,sizeAttenuation:true});
  const particles = new THREE.Points(particleGeo,particleMat); particles.frustumCulled=false; scene.add(particles);
  const lightningLight=new THREE.PointLight(0xdceaff,0,125,1.5); lightningLight.position.set(0,28,0); scene.add(lightningLight);
  for(let i=0;i<maxParticles;i++) respawn(i,true);
  function respawn(i,initial=false) {
    const p=particleGeo.attributes.position.array, v=velocities, k=i*3;
    p[k]=(Math.random()-.5)*95; p[k+1]=initial?Math.random()*34:24+Math.random()*12; p[k+2]=(Math.random()-.5)*95;
    v[k]=(Math.random()-.5)*.8; v[k+1]=state.weather==='snow'?-(.7+Math.random()*1.3):-(10+Math.random()*13); v[k+2]=(Math.random()-.5)*.8;
  }
  const waterTargets=[];
  const foliage=[];
  let scanTimer=0,sceneEffectsTimer=0;
  function scanScene() {
    waterTargets.length=0; foliage.length=0;
    scene.traverse(obj=>{
      if(!obj.isMesh || !obj.material) return;
      const mats=Array.isArray(obj.material)?obj.material:[obj.material];
      for(const m of mats) {
        if(m.color) {
          const c=m.color;
          if(c.b>c.r*1.08 && c.g>c.r*1.12 && c.b>.16 && c.g>.18) { waterTargets.push(obj); break; }
          if(c.g>c.r*1.16 && c.g>c.b*1.08 && c.g>.12 && obj.position.y>.15) { foliage.push(obj); break; }
        }
      }
    });
  }
  function setWeather(value) {
    state.weather=value;
    const rain=value==='rain'||value==='storm', snow=value==='snow';
    particles.visible=rain||snow;
    particleMat.color.set(snow?0xf4f7ff:0x9ecbe8);
    particleMat.size=snow ? 0.22 : 0.12;
    particleMat.opacity=rain ? 0.68 : (snow ? 0.9 : particleMat.opacity);
    particleMat.sizeAttenuation=!rain;
    for(let i=0;i<maxParticles;i++) velocities[i*3+1]=snow?-(.7+Math.random()*1.3):-(10+Math.random()*13);
    if(value==='fog'){scene.fog.near=8;scene.fog.far=105;}
    else if(value==='storm'){scene.fog.near=28;scene.fog.far=185;}
    else if(value==='cloudy'){scene.fog.near=85;scene.fog.far=245;}
    else {scene.fog.near=145;scene.fog.far=340;}
    panel.querySelector('#weatherStatus4d').textContent=({clear:'Céu aberto e ciclo solar',cloudy:'Nuvens e luz difusa',rain:'Chuva sobre o reino',storm:'Tempestade: cuidado com raios',snow:'Neve caindo no reino',fog:'Neblina reduzindo a visibilidade'})[value];
    if(state.audio){const a=state.audio,now=a.ctx.currentTime;a.rain.gain.gain.setTargetAtTime(rain ? 0.20 : 0,now,.7);a.wind.gain.gain.setTargetAtTime(value==='storm' ? 0.32 : (value==='fog' ? 0.24 : 0.16),now,.8);a.fire.gain.gain.setTargetAtTime(value==='clear' ? 0.025 : 0.012,now,1);}
  }
  function update(dt,time,playerPosition,worldLight,camera,movement) {
    state.elapsed+=dt; scanTimer-=dt;
    if(scanTimer<=0){scanTimer=5;scanScene();}
    const storm=state.weather==='storm', rain=state.weather==='rain'||storm, snow=state.weather==='snow';
    particles.position.set(playerPosition.x,0,playerPosition.z);
    if(rain||snow) {
      const p=particleGeo.attributes.position.array;
      for(let i=0;i<maxParticles;i++){
        const k=i*3; p[k]+=velocities[k]*dt+Math.sin(state.elapsed*.7+i)*dt*.12;
        p[k+1]+=velocities[k+1]*dt; p[k+2]+=velocities[k+2]*dt;
        if(p[k+1]<.1||Math.abs(p[k])>52||Math.abs(p[k+2])>52) respawn(i);
      }
      particleGeo.attributes.position.needsUpdate=true;
    }
    const gust=(Math.sin(state.elapsed*.47)+Math.sin(state.elapsed*.19+1.7)*.55)*.5;
    state.wind=.35+Math.abs(gust)*.8+(storm?1.25:0)+(rain ? 0.25 : 0);
    sceneEffectsTimer-=dt;
    if(sceneEffectsTimer<=0){
      sceneEffectsTimer=mobile?.12:.08;
      for(let i=0;i<foliage.length;i++){
        const obj=foliage[i], base=obj.userData.windBase??(obj.userData.windBase=obj.rotation.z);
        obj.rotation.z=base+Math.sin(state.elapsed*1.6+i*.73)*.025*state.wind;
        obj.rotation.x=Math.sin(state.elapsed*1.1+i*.41)*.012*state.wind;
      }
      for(let i=0;i<waterTargets.length;i++){
        const obj=waterTargets[i];
        if(obj.geometry?.type==='RingGeometry') obj.rotation.z=Math.sin(state.elapsed*1.3+i)*.012;
        else if(obj.material && !Array.isArray(obj.material) && obj.material.transparent) obj.material.opacity=.78+Math.sin(state.elapsed*2+i)*.08;
      }
    }
    if(storm && Math.random()<dt*.16){state.lightning=.18+Math.random()*.28;play('thunder',playerPosition);}
    state.lightning=Math.max(0,state.lightning-dt);
    lightningLight.position.set(playerPosition.x+8,28,playerPosition.z-12);
    lightningLight.intensity=state.lightning>0?state.lightning*38:0;
    state.lastMoving=!!movement?.moving;state.lastMounted=!!movement?.mounted;state.lastRunning=!!movement?.running;
    if(state.audio && state.sound) {
      const a=state.audio,now=a.ctx.currentTime;
      if(camera && a.ctx.listener.positionX){const l=a.ctx.listener,dir=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);l.positionX.setTargetAtTime(camera.position.x,now,.08);l.positionY.setTargetAtTime(camera.position.y,now,.08);l.positionZ.setTargetAtTime(camera.position.z,now,.08);l.forwardX.setTargetAtTime(dir.x,now,.08);l.forwardY.setTargetAtTime(dir.y,now,.08);l.forwardZ.setTargetAtTime(dir.z,now,.08);}
      a.drone.frequency.setTargetAtTime(worldLight?.night>.5?82:110,now,2);a.drone2.frequency.setTargetAtTime(worldLight?.night>.5?123:164.81,now,2);
      state.musicClock-=dt;if(state.musicClock<=0){playMusicNote();state.musicClock=1.7+Math.random()*1.8;}
      state.birdClock-=dt;if(state.birdClock<=0 && worldLight?.day>.35 && !rain){play('birds',{x:playerPosition.x+(Math.random()-.5)*18,y:5,z:playerPosition.z-8-Math.random()*12});state.birdClock=7+Math.random()*11;}
      state.stepClock-=dt;if(state.stepClock<=0 && state.lastMoving){play(state.lastMounted?'hoof':'footstep',playerPosition);state.stepClock=state.lastMounted ? .31 : state.lastRunning ? .27 : .43;}
      state.lastPosition=playerPosition.clone();
    }
  }
  setWeather('clear');
  return {update,setWeather,play};
}
