const pet=document.getElementById('pet'), img=document.getElementById('pet-img'), bubble=document.getElementById('bubble'), text=document.getElementById('bubble-text'), actions=document.getElementById('bubble-actions'), checkin=document.getElementById('checkin'), chat=document.getElementById('chat'), confetti=document.getElementById('confetti');
let state=null, leaveTimer=null, wanderTimer=null, blinkTimer=null;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function setMood(){ pet.classList.remove('sad','sleepy'); if(state?.petMood==='sad') pet.classList.add('sad'); if(state?.petMood==='sleepy') pet.classList.add('sleepy'); }
function showBubble(msg, withCheckin=false){ text.textContent=msg; bubble.classList.remove('hidden'); actions.classList.toggle('hidden',!withCheckin); }
function hideBubble(){ bubble.classList.add('hidden'); }
function scheduleBlink(){ clearTimeout(blinkTimer); blinkTimer=setTimeout(()=>{pet.classList.add('blink');setTimeout(()=>pet.classList.remove('blink'),130);scheduleBlink()},2800+Math.random()*4200)}
function scheduleWander(){ clearTimeout(wanderTimer); wanderTimer=setTimeout(()=>{if(!pet.classList.contains('idle'))return scheduleWander(); const dir=Math.random()<.5?'wander-left':'wander-right'; pet.classList.remove('wander-left','wander-right');pet.classList.add(dir);setTimeout(()=>{pet.classList.remove(dir);pet.classList.add('idle')},2200);scheduleWander()},6000+Math.random()*9000)}
function confettiBurst(){ confetti.innerHTML=''; for(let i=0;i<18;i++){const p=document.createElement('i');p.className='confetti-piece';p.style.setProperty('--x',`${(Math.random()-.5)*260}px`);p.style.setProperty('--y',`${-50-Math.random()*150}px`);p.style.transform=`rotate(${Math.random()*180}deg)`;confetti.appendChild(p)} setTimeout(()=>confetti.innerHTML='',1100); }
async function enter(){ pet.classList.remove('leave'); pet.classList.add('enter','walk'); await sleep(750); pet.classList.remove('enter','walk'); pet.classList.add('idle'); }
function leave(){ clearTimeout(leaveTimer); hideBubble(); pet.classList.remove('idle','walk'); pet.classList.add('leave'); setTimeout(()=>{pet.classList.remove('leave'); window.petAPI.hidePet();},900); }
pet.addEventListener('click',()=>window.petAPI.openChat());
checkin.addEventListener('click',()=>{window.petAPI.confirmCheckin(); showBubble('Nice check-in. Keep going.',false)});
chat.addEventListener('click',()=>window.petAPI.openChat());
window.petAPI.on('state-updated',s=>{state=s;setMood()});
window.petAPI.on('pet-event',async e=>{
 if(e.type==='enter'){await enter();}
 if(e.type==='show-message'){
   let msg=e.event.text;
   if(!msg){const cat=e.event.category; const defaults={greeting:'Hi, checking in.',water:'Want some water?',stretch:'Quick stretch?',break:'Need a break?',mood:'Still doing okay?',longSession:'Please stop, rest, and drink some water.'}; msg=defaults[cat]||defaults.greeting;}
   showBubble(msg,!!e.event.checkin);
 }
 if(e.type==='leave') leave();
 if(e.type==='celebrate'){pet.classList.add('celebrate');showBubble(e.text||'Nice! Tiny victory.',false);confettiBurst();setTimeout(()=>pet.classList.remove('celebrate'),800)}
});
window.petAPI.getState().then(s=>{state=s;setMood();scheduleBlink();scheduleWander()});
