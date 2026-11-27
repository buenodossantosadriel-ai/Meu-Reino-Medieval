// Camada 4D: clima vivo, vento, água, relâmpagos e áudio ambiente.
// Mantém o ciclo solar original do jogo e acrescenta efeitos locais de baixo custo.
export function createImmersive4D(THREE, scene) {
  const state = { weather: 'clear', sound: false, audio: null, elapsed: 0, lightning: 0, wind: 0.35 };
  const weatherOptions = [
    ['clear','☀️ Limpo'], ['cloudy','☁️ Nublado'], ['rain','🌧️ Chuva'], ['storm','⛈️ Tempestade'], ['snow','❄️ Neve'], ['fog','🌫️ Neblina']
  ];
  const panel = document.createElement('div');
  panel.id = 'immersive4dPanel';
  panel.style.cssText = 'position:fixed;right:12px;top:150px;z-index:6;pointer-events:auto;background:#142019e8;border:1px solid #d3b775;border-radius:12px;padding:9px;color:#fff2d0;font:12px system-ui;box-shadow:0 4px 16px #0008;max-width:155px';
  panel.innerHTML = '<div style="font-weight:800;color:#f0cc78;margin-bottom:6px">🌍 MUNDO 4D</div><label for="weather4d">Clima</label><select id="weather4d" style="display:block;width:100%;margin:4px 0 7px;padding:7px;border-radius:7px;background:#293b2d;color:#fff;border:1px solid #c5a96b"></select><button id="sound4d" type="button" style="width:100%;padding:8px;font-size:11px">🔇 Som ambiente</button><div id="weatherStatus4d" style="margin-top:6px;opacity:.8">Ciclo solar ativo</div>';
  document.body.appendChild(panel);
  const select = panel.querySelector('#weather4d');
  for (const [value,label] of weatherOptions) { const option=document.createElement('option'); option.value=value; option.textContent=label; select.appendChild(option); }
  select.addEventListener('change', () => setWeather(select.value));
  panel.querySelector('#sound4d').addEventListener('click', async () => {
    try {
      if (!state.audio) state.audio = makeAudio();
      if (state.audio.ctx.state === 'suspended') await state.audio.ctx.resume();
      state.sound = !state.sound;
      state.audio.master.gain.setTargetAtTime(state.sound ? 0.16 : 0, state.audio.ctx.currentTime, 0.25);
      panel.querySelector('#sound4d').textContent = state.sound ? '🔊 Som ligado' : '🔇 Som ambiente';
    } catch (e) { panel.querySelector('#weatherStatus4d').textContent='Áudio indisponível neste aparelho'; }
  });
  function makeAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) throw new Error('Web Audio não disponível');
    const ctx = new Ctx(), master = ctx.createGain(); master.gain.value=0; master.connect(ctx.destination);
    const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate), data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*0.22;
    const noise=ctx.createBufferSource(); noise.buffer=buffer; noise.loop=true;
    const filter=ctx.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=520;
    const windGain=ctx.createGain(); windGain.gain.value=.22; noise.connect(filter); filter.connect(windGain); windGain.connect(master); noise.start();
    const osc=ctx.createOscillator(), birdGain=ctx.createGain(); osc.type='sine'; osc.frequency.value=660; birdGain.gain.value=.012; osc.connect(birdGain); birdGain.connect(master); osc.start();
    return {ctx,master,windGain,filter,birdGain,osc};
  }
  const maxParticles = Math.min(1100, Math.max(260, Math.floor((innerWidth*innerHeight)/1500)));
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
  let scanTimer=0;
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
    particleMat.size=snow?.22:.12;
    particleMat.opacity=rain?.68:snow?.9;
    particleMat.sizeAttenuation=!rain;
    for(let i=0;i<maxParticles;i++) velocities[i*3+1]=snow?-(.7+Math.random()*1.3):-(10+Math.random()*13);
    if(value==='fog'){scene.fog.near=8;scene.fog.far=105;}
    else if(value==='storm'){scene.fog.near=28;scene.fog.far=185;}
    else if(value==='cloudy'){scene.fog.near=85;scene.fog.far=245;}
    else {scene.fog.near=145;scene.fog.far=340;}
    panel.querySelector('#weatherStatus4d').textContent=({clear:'Céu aberto e ciclo solar',cloudy:'Nuvens e luz difusa',rain:'Chuva sobre o reino',storm:'Tempestade: cuidado com raios',snow:'Neve caindo no reino',fog:'Neblina reduzindo a visibilidade'})[value];
    if(state.audio) state.audio.filter.frequency.setTargetAtTime(rain?1100:420,state.audio.ctx.currentTime,.5);
  }
  function update(dt,time,playerPosition,worldLight) {
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
    state.wind=.35+Math.abs(gust)*.8+(storm?1.25:0)+(rain?.25:0);
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
    if(storm && Math.random()<dt*.16) state.lightning=.18+Math.random()*.28;
    state.lightning=Math.max(0,state.lightning-dt);
    lightningLight.position.set(playerPosition.x+8,28,playerPosition.z-12);
    lightningLight.intensity=state.lightning>0?state.lightning*38:0;
    if(state.audio && state.sound) {
      state.audio.windGain.gain.setTargetAtTime(rain?.12:.22,state.audio.ctx.currentTime,.4);
      state.audio.birdGain.gain.setTargetAtTime((worldLight?.day>.45 && !rain)? .014 : 0,state.audio.ctx.currentTime,1);
      state.audio.osc.frequency.setTargetAtTime(520+Math.sin(state.elapsed*.7)*90,state.audio.ctx.currentTime,1);
    }
  }
  setWeather('clear');
  return {update,setWeather};
}
