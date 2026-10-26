const b=document.getElementById('summon');
let dragging=false,last=null,moved=false;
b.addEventListener('mousedown',e=>{dragging=true;moved=false;last={x:e.screenX,y:e.screenY};});
window.addEventListener('mousemove',e=>{if(!dragging||!last)return;const dx=e.screenX-last.x,dy=e.screenY-last.y;if(Math.abs(dx)+Math.abs(dy)>2)moved=true;if(dx||dy)window.petAPI.moveSummon({dx,dy});last={x:e.screenX,y:e.screenY};});
window.addEventListener('mouseup',()=>{dragging=false;last=null;});
b.addEventListener('click',e=>{if(!moved)window.petAPI.summon();});
window.petAPI.on('state-updated',s=>{b.title=s.pausedUntil>Date.now()?'Summon pet (paused visits)':'Summon pet'});
