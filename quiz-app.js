// Place next to index.html. Remove the OLD inline module and old bank/score logic.
import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import {getAuth, signInAnonymously, onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
const firebaseConfig = {
 apiKey:'AIzaSyAlZDbC_J0lQiZLUlQj3A1Fo6bD0Ual9O0', authDomain:'vendingmachinefe.firebaseapp.com',
 databaseURL:'https://vendingmachinefe-default-rtdb.asia-southeast1.firebasedatabase.app',
 projectId:'vendingmachinefe',storageBucket:'vendingmachinefe.firebasestorage.app',
 messagingSenderId:'1009493391574',appId:'1:1009493391574:web:e98f9991d43e93ea7c7177'
};
const API='https://vendingmachine-api.zh9muting.workers.dev';
const app=initializeApp(firebaseConfig), auth=getAuth(app), el=id=>document.getElementById(id);
let sessionId='',questions=[],answers=[],index=0,busy=false;
function show(which){for(const id of ['welcome','game','finish']) el(id).classList.toggle('hidden',id!==which);}
function message(txt){el('firebase-status').textContent=txt;}
onAuthStateChanged(auth,u=>{el('start').disabled=!u;message(u?'Firebase Authentication successful!':'Signing in...');});
signInAnonymously(auth).catch(e=>message('Sign-in failed: '+e.message));
async function request(path,body){
 const user=auth.currentUser;if(!user)throw new Error('Please wait for Firebase sign-in');
 const token=await user.getIdToken();
 const r=await fetch(API+path,{method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body||{})});
 const data=await r.json();if(!r.ok)throw new Error(data.error||('HTTP '+r.status));return data;
}
async function start(){if(busy)return;busy=true;el('start').disabled=true;el('again').disabled=true;
 try{const d=await request('/api/start',{});sessionId=d.sessionId;questions=d.questions;answers=[];index=0;show('game');render();}
 catch(e){alert('Cannot start quiz: '+e.message);}
 finally{busy=false;el('start').disabled=false;el('again').disabled=false;}
}
function render(){const item=questions[index];el('category').textContent=item.cat;el('counter').textContent=`Question ${index+1} of 7`;el('progress').style.width=`${(index/7)*100}%`;
 el('question').textContent=item.q;el('scoreline').textContent=`Answered: ${answers.length} / 7`;el('feedback').classList.add('hidden');el('next').classList.add('hidden');el('answers').replaceChildren();
 item.a.forEach((label,i)=>{const b=document.createElement('button');b.type='button';b.className='answer';const letter=document.createElement('span');letter.className='letter';letter.textContent='ABCD'[i];b.append(letter,document.createTextNode(label));b.addEventListener('click',()=>choose(i));el('answers').appendChild(b);});
}
function choose(choice){if(answers.length>index)return;answers.push(choice);[...el('answers').children].forEach((b,i)=>{b.disabled=true;if(i===choice)b.classList.add('correct');});
 el('feedback').textContent='Answer recorded. Correct answers are revealed after the quiz.';el('feedback').classList.remove('hidden');
 el('scoreline').textContent=`Answered: ${answers.length} / 7`;el('next').textContent=index===6?'Verify result →':'Next question →';el('next').classList.remove('hidden');
}
async function next(){if(answers.length!==index+1||busy)return;if(index<6){index++;render();return;}
 busy=true;el('next').disabled=true;el('next').textContent='Verifying...';
 try{const result=await request('/api/submit',{sessionId,answers});
 el('finalscore').textContent=`You answered ${result.score} out of 7 questions correctly.`;
 el('rewardname').textContent=result.rewardName;
 el('rewarddetail').textContent=`Reward: Slot ${result.channel+1}. Status: ${result.status}.`;
 // The API returns explanations only AFTER final server validation.
 const details=result.correctAnswers.map((a,i)=>`Q${i+1}: ${answers[i]===a.right?'Correct':'Incorrect'}. ${a.why}`).join('\n');
 let info=el('answer-review');if(!info){info=document.createElement('pre');info.id='answer-review';info.style.cssText='white-space:pre-wrap;color:#b3ccd0';el('finish').appendChild(info);}info.textContent=details;
 show('finish');
 }catch(e){alert('Verification failed: '+e.message+'; do not restart until checked.');}
 finally{busy=false;el('next').disabled=false;el('next').textContent='Verify result →';}
}
el('start').addEventListener('click',start);el('next').addEventListener('click',next);el('again').addEventListener('click',start);
el('start').disabled=true;
