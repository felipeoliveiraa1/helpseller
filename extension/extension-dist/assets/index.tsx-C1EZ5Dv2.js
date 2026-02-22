import{c as M,r as c,j as e,T,B as Q,a as R,b as v,d as K,R as F,e as S,M as Ne,A as Ie,N as B,f as Te,g as Re}from"./theme-UeVto8tc.js";import{a as ae}from"./auth-DmuFIzIA.js";/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ae=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],_e=M("check",Ae);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Le=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]],De=M("circle-question-mark",Le);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ze=[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]],Oe=M("copy",ze);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Be=[["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M17 20v2",key:"1rnc9c"}],["path",{d:"M17 2v2",key:"11trls"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M2 17h2",key:"7oei6x"}],["path",{d:"M2 7h2",key:"asdhe0"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"M20 17h2",key:"1fpfkl"}],["path",{d:"M20 7h2",key:"1o8tra"}],["path",{d:"M7 20v2",key:"4gnj0m"}],["path",{d:"M7 2v2",key:"1i4yhu"}],["rect",{x:"4",y:"4",width:"16",height:"16",rx:"2",key:"1vbyd7"}],["rect",{x:"8",y:"8",width:"8",height:"8",rx:"1",key:"z9xiuo"}]],le=M("cpu",Be);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pe=[["circle",{cx:"9",cy:"12",r:"1",key:"1vctgf"}],["circle",{cx:"9",cy:"5",r:"1",key:"hp0tcf"}],["circle",{cx:"9",cy:"19",r:"1",key:"fkjjf6"}],["circle",{cx:"15",cy:"12",r:"1",key:"1tmaij"}],["circle",{cx:"15",cy:"5",r:"1",key:"19l28e"}],["circle",{cx:"15",cy:"19",r:"1",key:"f4zoj3"}]],ce=M("grip-vertical",Pe);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $e=[["path",{d:"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",key:"1sd12s"}]],Ue=M("message-circle",$e);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ge=[["path",{d:"M5 12h14",key:"1ays0h"}]],He=M("minus",Ge);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const We=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],Fe=M("triangle-alert",We);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ye=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],qe=M("x",Ye),Ve=4,Xe=18,q="#22c55e",A="#3b82f6";function Qe({text:n,animate:t,cursorColor:r}){const[i,s]=c.useState(t?0:n.length),d=c.useRef(n);c.useEffect(()=>{if(!t){s(n.length);return}const g=d.current;d.current=n,n.startsWith(g)?s(j=>Math.min(j,g.length)):s(0)},[n,t]),c.useEffect(()=>{if(!t||i>=n.length)return;const g=setTimeout(()=>s(j=>j+1),Xe);return()=>clearTimeout(g)},[i,n,t]);const h=t&&i<n.length;return e.jsxs(e.Fragment,{children:[e.jsx("span",{children:n.slice(0,i)}),h&&e.jsx("span",{style:{display:"inline-block",width:2,height:13,backgroundColor:r,marginLeft:1,verticalAlign:"text-bottom",animation:"cursorBlink 0.6s step-end infinite"}})]})}function de({text:n}){const[t,r]=c.useState(!1),i=()=>{navigator.clipboard.writeText(n).then(()=>{r(!0),setTimeout(()=>r(!1),2e3)}).catch(()=>{})};return e.jsxs("button",{onClick:i,title:"Copiar",style:{padding:4,background:"transparent",border:"none",color:t?q:S,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontSize:10,flexShrink:0},children:[t?e.jsx(_e,{size:12}):e.jsx(Oe,{size:12}),t?"Copiado":"Copiar"]})}var ve;const pe=typeof chrome<"u"&&((ve=chrome.runtime)!=null&&ve.getURL)?chrome.runtime.getURL("logo.svg"):"",Y=360,Ke="80vh",ue=48,fe=56;function Je(n){const t=n.target.getRootNode();return t&&"host"in t?t.host:document.getElementById("sales-copilot-root")}function P(){return document.getElementById("sales-copilot-root")}function Ze(){const[n,t]=c.useState(null),[r,i]=c.useState(!0),[s,d]=c.useState([]),[h,g]=c.useState([]),[j,L]=c.useState(!1),[Z,ee]=c.useState(null),[U,te]=c.useState(!1),[rt,ne]=c.useState(null),[w,oe]=c.useState(!1),N=c.useRef({startX:0,startY:0,startLeft:0,startTop:0,panelW:Y,panelH:300}),se=c.useRef(null);c.useEffect(()=>{const o=P();o&&chrome.storage.local.get(["sidebarPosition","sidebarMinimized","sidebarOpen"],a=>{const l=a.sidebarPosition,x=Math.max(0,window.innerWidth-Y-16);o.style.left=((l==null?void 0:l.left)??x)+"px",o.style.top=((l==null?void 0:l.top)??16)+"px";const p=a.sidebarMinimized??!1,b=a.sidebarOpen===!0;oe(p),b||(o.style.width="0",o.style.height="0",o.style.visibility="hidden",o.style.pointerEvents="none")})},[]),c.useEffect(()=>{const o=P();o&&(o.style.width=w?ue+"px":Y+"px",o.style.height=w?fe+"px":Ke,chrome.storage.local.set({sidebarMinimized:w}))},[w]),c.useEffect(()=>{if(r||n)return;chrome.storage.local.set({sidebarOpen:!1}).catch(()=>{});const o=P();o&&(o.style.width="0",o.style.height="0",o.style.visibility="hidden",o.style.pointerEvents="none")},[r,n]);const ie=o=>{if(o.target.closest("button"))return;const a=Je(o);if(!a)return;o.preventDefault();const l=w?ue:Y,x=a.style.left||"",p=a.style.top||"",b=x?parseFloat(x):window.innerWidth-l-16,f=p?parseFloat(p):16,k=Number.isNaN(b)?0:Math.max(0,b),D=Number.isNaN(f)?0:Math.max(0,f);N.current={startX:o.clientX,startY:o.clientY,startLeft:k,startTop:D,panelW:l,panelH:w?fe:200};const G=m=>{const E=m.clientX-N.current.startX,z=m.clientY-N.current.startY,I=P();if(I){const C=window.innerWidth-N.current.panelW-8,O=window.innerHeight-N.current.panelH-8,W=Math.max(0,Math.min(C,N.current.startLeft+E)),we=Math.max(0,Math.min(O,N.current.startTop+z));I.style.left=W+"px",I.style.top=we+"px"}},H=()=>{document.removeEventListener("mousemove",G),document.removeEventListener("mouseup",H);const m=P();m&&chrome.storage.local.set({sidebarPosition:{left:parseFloat(m.style.left||"0")||0,top:parseFloat(m.style.top||"0")||0}})};document.addEventListener("mousemove",G),document.addEventListener("mouseup",H)},re=()=>oe(o=>!o);c.useEffect(()=>{Me()},[]);const Me=async()=>{const o=await ae.getSession();t(o),i(!1)},Ce=async()=>{await ae.logout(),t(null),te(!1)};c.useEffect(()=>{var o;(o=se.current)==null||o.scrollIntoView({behavior:"smooth"})},[s,h]),c.useEffect(()=>{const o=a=>{var l,x,p,b;if(a.type==="TRANSCRIPT_RESULT"){const{text:f,isFinal:k,timestamp:D,speaker:G,role:H}=a.data||{};if(!f)return;const m={text:f,speaker:G||"unknown",role:H||"unknown",isFinal:k??!0,timestamp:D||Date.now()};d(E=>{if(!k){const C=E.length-1,O=C>=0?E[C]:null;if(O&&!O.isFinal&&O.role===m.role){const W=[...E];return W[C]=m,W}return[...E,m]}const z=E.length-1,I=z>=0?E[z]:null;if(I&&!I.isFinal&&I.role===m.role){const C=[...E];return C[z]=m,C}return[...E,m]})}else if(a.type==="STATUS_UPDATE")te(a.status==="RECORDING"),a.status==="RECORDING"&&typeof a.micAvailable=="boolean"&&ne(a.micAvailable),a.status!=="RECORDING"&&ne(null),a.status==="PERMISSION_REQUIRED"&&alert("Permissão necessária. Clique no ícone da extensão na barra do navegador para autorizar a captura da aba.");else if(a.type==="MANAGER_WHISPER")ee({content:a.data.content,urgency:a.data.urgency,timestamp:a.data.timestamp});else if(a.type==="COACH_THINKING")L(!0);else if(a.type==="COACH_IDLE")L(!1);else if(a.type==="COACHING_MESSAGE"){L(!1);const f=a.data,k={phase:((l=f.metadata)==null?void 0:l.phase)||"S",tip:f.content||"",objection:((x=f.metadata)==null?void 0:x.objection)||null,suggestedResponse:((p=f.metadata)==null?void 0:p.suggested_response)||null,suggestedQuestion:((b=f.metadata)==null?void 0:b.suggested_question)||null,urgency:f.urgency||"medium",timestamp:Date.now()};g(D=>[k,...D].slice(0,Ve))}};return chrome.runtime.onMessage.addListener(o),()=>chrome.runtime.onMessage.removeListener(o)},[]);const X={width:"100%",minHeight:0,flex:1,display:"flex",flexDirection:"column",backgroundColor:Q,fontFamily:"system-ui, -apple-system, sans-serif",color:T};return r?e.jsx("div",{style:{...X,height:"100%",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx("span",{style:{color:R,fontSize:13},children:"Carregando..."})}):n?w?e.jsx("div",{onMouseDown:ie,style:{width:"100%",height:"100%",backgroundColor:Q,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui, -apple-system, sans-serif",borderRight:`1px solid ${v}`,cursor:"move",userSelect:"none"},children:e.jsx("button",{onClick:re,title:"Expandir",style:{width:32,height:32,borderRadius:F,border:`1px solid ${v}`,background:K,color:R,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(ce,{size:16,style:{transform:"rotate(-90deg)"}})})}):e.jsxs("div",{style:{...X,height:"100%"},children:[e.jsxs("div",{onMouseDown:ie,style:{padding:"8px 12px",borderBottom:`1px solid ${v}`,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"move",userSelect:"none",flexShrink:0},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[e.jsx(ce,{size:14,style:{color:S}}),pe?e.jsx("img",{src:pe,alt:"HelpSeller",style:{height:18,width:"auto"}}):e.jsx(Ne,{size:14,style:{color:U?Ie:S}}),e.jsx("div",{style:{fontSize:10,fontWeight:600,color:R},children:U?"Ao Vivo":"Parado"})]}),e.jsxs("div",{style:{display:"flex",gap:4,alignItems:"center"},onClick:o=>o.stopPropagation(),children:[e.jsx("button",{onClick:re,title:"Minimizar",style:{padding:4,background:"transparent",border:`1px solid ${v}`,borderRadius:F,color:R,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(He,{size:12})}),e.jsx("button",{onClick:Ce,style:{padding:4,fontSize:10,background:"transparent",border:`1px solid ${v}`,borderRadius:F,color:R,cursor:"pointer"},children:"Sair"})]})]}),Z&&e.jsxs("div",{style:{padding:"8px 12px",background:"#1a1a2e",borderBottom:`1px solid ${v}`,flexShrink:0},children:[e.jsxs("div",{style:{fontSize:10,fontWeight:600,marginBottom:4,color:A,textTransform:"uppercase",display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsx("span",{children:"Gestor diz:"}),e.jsx("button",{onClick:()=>ee(null),style:{background:"none",border:"none",color:S,cursor:"pointer",padding:0,display:"flex"},children:e.jsx(qe,{size:12})})]}),e.jsx("div",{style:{fontSize:12,lineHeight:1.5,color:T},children:Z.content})]}),j&&e.jsxs("div",{style:{padding:"6px 12px",borderBottom:`1px solid ${v}`,flexShrink:0,display:"flex",alignItems:"center",gap:8},children:[e.jsx(le,{size:12,style:{color:B,animation:"spin 1.5s linear infinite"}}),e.jsx("span",{style:{fontSize:11,color:S},children:"Analisando conversa..."})]}),h.length>0&&e.jsx("div",{style:{flexShrink:0,maxHeight:"50%",overflowY:"auto",borderBottom:`1px solid ${v}`},children:h.map((o,a)=>{const l=a===0,x=l?1:.45;return e.jsxs("div",{style:{opacity:x,borderBottom:a<h.length-1?`1px solid ${v}`:"none",animation:l?"coachPop 0.4s ease":"none"},children:[o.objection&&e.jsx("div",{style:{padding:"8px 12px",background:"rgba(239,68,68,0.12)",borderBottom:"1px solid rgba(239,68,68,0.3)"},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6},children:[e.jsx(Fe,{size:12,style:{color:"#ef4444"}}),e.jsxs("span",{style:{fontSize:11,fontWeight:700,color:"#ef4444",textTransform:"uppercase"},children:["Objeção: ",o.objection]})]})}),o.suggestedResponse&&e.jsxs("div",{style:{padding:"10px 12px",background:l?"rgba(34,197,94,0.10)":"transparent",borderLeft:l?`3px solid ${q}`:"none"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6},children:[e.jsx(Ue,{size:13,style:{color:q,animation:l?"pulse 1.5s ease-in-out 3":"none"}}),e.jsx("span",{style:{fontSize:11,fontWeight:800,color:q,textTransform:"uppercase",letterSpacing:"0.04em"},children:"Diga Agora"})]}),l&&e.jsx(de,{text:o.suggestedResponse})]}),e.jsxs("div",{style:{fontSize:l?14:11,fontWeight:600,lineHeight:1.5,color:T},children:['"',o.suggestedResponse,'"']})]}),o.suggestedQuestion&&e.jsxs("div",{style:{padding:"8px 12px",background:l?"rgba(59,130,246,0.08)":"transparent",borderLeft:l?`3px solid ${A}`:"none"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6},children:[e.jsx(De,{size:12,style:{color:A}}),e.jsx("span",{style:{fontSize:10,fontWeight:700,color:A,textTransform:"uppercase"},children:"Pergunte"})]}),l&&e.jsx(de,{text:o.suggestedQuestion})]}),e.jsxs("div",{style:{fontSize:l?13:11,fontWeight:500,lineHeight:1.4,color:T},children:['"',o.suggestedQuestion,'"']})]}),!o.suggestedResponse&&!o.suggestedQuestion&&!o.objection&&e.jsxs("div",{style:{padding:"6px 12px",background:l?K:"transparent"},children:[e.jsx("div",{style:{fontSize:10,fontWeight:600,marginBottom:3,color:B,textTransform:"uppercase"},children:"Dica"}),e.jsx("div",{style:{fontSize:11,lineHeight:1.4,color:R},children:o.tip.split(/(\*\*.*?\*\*)/).map((p,b)=>p.startsWith("**")&&p.endsWith("**")?e.jsx("strong",{style:{color:T,fontWeight:600},children:p.slice(2,-2)},b):p)})]})]},`cf-${o.timestamp}-${a}`)})}),e.jsxs("div",{style:{flex:"1 1 0",minHeight:0,overflowY:"auto",padding:"8px 10px",display:"flex",flexDirection:"column",gap:6,backgroundColor:Q},children:[e.jsxs("div",{style:{fontSize:10,fontWeight:600,marginBottom:2,color:S,textTransform:"uppercase",letterSpacing:"0.05em",flexShrink:0,display:"flex",justifyContent:"space-between"},children:[e.jsx("span",{style:{color:A},children:"Cliente"}),e.jsx("span",{children:"Transcrição"}),e.jsx("span",{style:{color:B},children:"Você"})]}),s.length===0?e.jsxs("div",{style:{fontSize:12,color:S,display:"flex",alignItems:"center",justifyContent:"center",gap:6,flex:1},children:[e.jsx("span",{children:"Aguardando áudio"}),e.jsxs("span",{style:{display:"inline-flex",gap:3},children:[e.jsx("span",{style:{width:4,height:4,borderRadius:"50%",backgroundColor:S,animation:"aiPulse 1.4s infinite 0s"}}),e.jsx("span",{style:{width:4,height:4,borderRadius:"50%",backgroundColor:S,animation:"aiPulse 1.4s infinite 0.3s"}}),e.jsx("span",{style:{width:4,height:4,borderRadius:"50%",backgroundColor:S,animation:"aiPulse 1.4s infinite 0.6s"}})]})]}):s.map((o,a)=>{const l=a===s.length-1,x=l,p=o.role==="lead",b=p?"rgba(59,130,246,0.12)":"rgba(255,0,122,0.10)",f=p?"rgba(59,130,246,0.25)":"rgba(255,0,122,0.25)",k=p?A:B;return e.jsx("div",{style:{display:"flex",justifyContent:p?"flex-start":"flex-end",animation:l&&o.isFinal?"slideIn 0.2s ease":"none"},children:e.jsxs("div",{style:{maxWidth:"85%",padding:"5px 10px",borderRadius:p?"10px 10px 10px 2px":"10px 10px 2px 10px",backgroundColor:b,border:`1px solid ${f}`,opacity:o.isFinal?1:.7,transition:"opacity 0.2s ease"},children:[e.jsx("div",{style:{fontSize:8,fontWeight:700,color:k,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:1},children:p?"CLIENTE":"VOCÊ"}),e.jsx("div",{style:{fontSize:11,lineHeight:1.45,color:T},children:e.jsx(Qe,{text:o.text,animate:x,cursorColor:k})})]})},`${o.timestamp}-${a}`)}),e.jsx("div",{ref:se})]}),e.jsx("div",{style:{padding:"6px 12px",borderTop:`1px solid ${v}`,flexShrink:0},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",backgroundColor:K,border:`1px solid ${v}`,borderRadius:F,fontSize:10,color:S},children:[e.jsx(le,{size:10,style:U?{animation:"spin 2s linear infinite",color:B}:{}}),U?j?"Analisando...":"Escutando ao vivo":"Aguardando gravação"]})}),e.jsx("style",{children:`
                @keyframes cursorBlink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                @keyframes aiPulse {
                    0%, 100% { opacity: 0.3; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes coachPop {
                    0% { opacity: 0; transform: translateY(-8px) scale(0.97); }
                    60% { transform: translateY(1px) scale(1.01); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.25); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `})]}):e.jsxs("div",{style:{...X,height:"100%",padding:24,justifyContent:"center",alignItems:"center",textAlign:"center"},children:[e.jsx("p",{style:{fontSize:13,color:R,marginBottom:8},children:"Este painel só funciona quando você está logado."}),e.jsx("p",{style:{fontSize:14,fontWeight:600,color:T},children:"Faça login no ícone da extensão na barra de ferramentas do navegador."})]})}const et=[/microfone/i,/câmera/i,/camera/i,/desativar/i,/ativar/i,/ctrl\s*\+/i,/alt\s*\+/i,/devices?$/i,/configurações/i,/settings/i,/mute/i,/unmute/i,/turn\s+(on|off)/i,/apresentar/i,/present/i,/chat/i,/meet\.google/i,/participants/i,/participantes/i,/legendas/i,/captions/i,/mais\s+opções/i,/more\s+options/i,/sair/i,/leave/i,/^\d+$/,/^[a-z]$/i];function he(n){const t=n.trim();if(t.length<2||t.length>50)return!1;for(const r of et)if(r.test(t))return!1;if(t.length>10){const r=Math.floor(t.length/2),i=t.substring(0,r).toLowerCase().trim(),s=t.substring(r).toLowerCase().trim();if(i===s)return!1}return!0}function Se(n){let t=n.trim();t=t.replace(/devices$/i,"").trim();for(let r=Math.floor(t.length/2)-2;r<=Math.ceil(t.length/2)+2;r++)if(r>0&&r<t.length){const i=t.substring(0,r).trim(),s=t.substring(r).trim();if(i.toLowerCase()===s.toLowerCase())return i}return t}const tt=["[data-self-name]",".zWGUib",".adnwBd",".YTbUzc",".cS7aqe"];function Ee(){let n="";const t=new Set;for(const i of tt)try{document.querySelectorAll(i).forEach(s=>{var g;let d="";const h=s;if(h.hasAttribute("data-self-name"))d=(h.getAttribute("data-self-name")||"").trim(),d&&(n=d);else{const j=Array.from(s.childNodes).filter(L=>L.nodeType===Node.TEXT_NODE);j.length>0?d=(j[0].textContent||"").trim():d=((g=(h.innerText||"").split(`
`)[0])==null?void 0:g.trim())||""}d&&he(d)&&t.add(d)})}catch{}const r=[];if(t.forEach(i=>{i!==n&&!r.includes(i)&&r.push(i)}),r.length===0){const s=document.title.replace(/\s*[-–]\s*Google Meet.*$/i,"").trim();s&&s!=="Meeting"&&he(s)&&r.push(s)}return{selfName:n,otherNames:r}}function nt(){const{selfName:n,otherNames:t}=Ee(),r=t.filter(s=>s!==n).map(Se).filter(s=>s.length>1),i=r[0]||null;(n||i||r.length>0)&&chrome.runtime.sendMessage({type:"PARTICIPANT_INFO",leadName:i||"Lead",selfName:n||"",allParticipants:r}).catch(()=>{})}let ge=null,me=null;function ye(n){const{selfName:t,otherNames:r}=Ee(),i=r.filter(g=>g!==t).map(Se).filter(g=>g.length>1),s=i[0]||null,d=s&&s!==n.leadName,h=t&&t!==n.selfName;(d||h)&&(d&&(n.leadName=s||""),h&&(n.selfName=t||""),chrome.runtime.sendMessage({type:"PARTICIPANT_INFO",leadName:s||"Lead",selfName:t||"",allParticipants:i}).catch(()=>{}))}function xe(){if(ge)return;const n={leadName:"",selfName:""};function t(){ye(n)}t(),ge=setInterval(t,2e3),me=new MutationObserver(()=>ye(n)),me.observe(document.body,{childList:!0,subtree:!0})}function ot(){const n=['[jsname="RKGaOc"]','[jsname="EaZ7Me"]','div[role="region"]'];for(const i of n){const s=document.querySelector(i);if(s){const d=s.querySelector('[aria-label*="microphone" i], [aria-label*="microfone" i], [data-tooltip*="microphone" i], [data-tooltip*="microfone" i]');if(d)return J(d,`${i} > mic button`)}}const t=document.querySelector('button[jsname="BOHaEe"]')||document.querySelector('div[jsname="BOHaEe"]');if(t)return J(t,"jsname BOHaEe");const r=document.querySelectorAll('[aria-label*="microphone" i], [aria-label*="microfone" i]');for(const i of r)if(!(i.closest('[role="listitem"], [role="list"], [jsname="jrQDbd"], [data-participant-id]')||i.getAttribute("role")!=="button"&&i.tagName.toLowerCase()!=="button"))return J(i,"aria-label mic button");return console.log("🎤 [MIC DEBUG] No mic button found, assuming unmuted"),!1}function J(n,t){const r=n.getAttribute("data-is-muted");if(r==="true")return console.log(`🎤 [MIC DEBUG] MUTED via data-is-muted on ${t}`),!0;if(r==="false")return console.log(`🎤 [MIC DEBUG] UNMUTED via data-is-muted on ${t}`),!1;const i=n.getAttribute("aria-pressed");if(i==="true")return console.log(`🎤 [MIC DEBUG] MUTED via aria-pressed on ${t}`),!0;if(i==="false")return console.log(`🎤 [MIC DEBUG] UNMUTED via aria-pressed on ${t}`),!1;const s=(n.getAttribute("aria-label")||n.getAttribute("data-tooltip")||"").toLowerCase();return s.includes("ativar")||s.includes("turn on")||s.includes("unmute")||s.includes("ligar")?(console.log(`🎤 [MIC DEBUG] MUTED via label "${s}" on ${t}`),!0):s.includes("desativar")||s.includes("turn off")||s.includes("mute")||s.includes("desligar")?(console.log(`🎤 [MIC DEBUG] UNMUTED via label "${s}" on ${t}`),!1):(console.log(`🎤 [MIC DEBUG] Could not determine state for ${t}, assuming unmuted`),!1)}let be=null;function st(){if(be)return;let n=null;console.log("🎤 [MIC MONITOR] Started mic state monitoring"),be=setInterval(()=>{const t=ot();t!==n&&(n=t,console.log(`🎤 [MIC MONITOR] State changed: ${t?"MUTED":"UNMUTED"}`),chrome.runtime.sendMessage({type:"MIC_STATE",muted:t}).catch(()=>{}))},1e3)}console.log("HelpSeller Content Script Loaded");if(window.location.hostname==="meet.google.com"){xe(),st(),document.readyState!=="complete"&&window.addEventListener("load",()=>xe());const n=()=>{chrome.runtime.sendMessage({type:"TRY_END_CALL"}).catch(()=>{})};window.addEventListener("beforeunload",n),window.addEventListener("pagehide",n)}const u=document.createElement("div");u.id="sales-copilot-root";u.style.cssText="position:fixed;width:0;height:0;z-index:2147483647;transition: width 0.2s ease, height 0.2s ease;border-radius:12px;overflow:hidden;visibility:hidden;pointer-events:none;";document.body.appendChild(u);function _(){u.style.width="0",u.style.height="0",u.style.visibility="hidden",u.style.pointerEvents="none",u.style.boxShadow="none",u.style.border="none"}function V(){u.style.width="360px",u.style.height="80vh",u.style.visibility="visible",u.style.pointerEvents="auto",u.style.boxShadow="0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,0,122,0.1)"}chrome.storage.local.get(["sidebarPosition","sidebarOpen"],n=>{const t=n.sidebarPosition,r=Math.max(0,window.innerWidth-360-16);if(u.style.left=((t==null?void 0:t.left)??r)+"px",u.style.top=((t==null?void 0:t.top)??16)+"px",!(n.sidebarOpen===!0)){_();return}chrome.runtime.sendMessage({type:"GET_SESSION"},s=>{if(!(s!=null&&s.session)){chrome.storage.local.set({sidebarOpen:!1}).catch(()=>{}),_();return}y=!0,V()})});chrome.storage.onChanged.addListener((n,t)=>{var r;t==="local"&&((r=n.sidebarOpen)==null?void 0:r.newValue)===!1&&(y=!1,_())});const je=u.attachShadow({mode:"open"}),ke=document.createElement("style");ke.textContent=`
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    :host {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 0;
    }

    :host > div {
        min-height: 0;
        height: 100%;
    }

    body, div, span, button, input, p, h1, h2, h3, h4 {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.5;
    }
    
    /* Container base */
    .h-full { height: 100%; }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .space-x-2 > * + * { margin-left: 0.5rem; }
    .space-x-3 > * + * { margin-left: 0.75rem; }
    .space-y-1 > * + * { margin-top: 0.25rem; }
    .space-y-2 > * + * { margin-top: 0.5rem; }
    
    /* Colors - black + pink theme */
    .bg-\\[\\#1A1B2E\\] { background-color: #0d0d0d; }
    .bg-\\[\\#252640\\] { background-color: #1a1a1a; }
    .text-white { color: white; }
    .text-blue-400 { color: #ff007a; }
    .text-slate-400 { color: #a1a1aa; }
    .text-slate-300 { color: #d4d4d8; }
    .text-emerald-400 { color: #ff007a; }
    
    /* Borders */
    .border-b { border-bottom-width: 1px; }
    .border-white\\/10 { border-color: rgba(255, 0, 122, 0.15); }
    .border-white\\/5 { border-color: rgba(255, 0, 122, 0.08); }
    
    /* Padding & Margin */
    .p-1 { padding: 0.25rem; }
    .p-2 { padding: 0.5rem; }
    .p-3 { padding: 0.75rem; }
    .p-4 { padding: 1rem; }
    .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    
    /* Sizing */
    .h-14 { height: 3.5rem; }
    .w-2 { width: 0.5rem; }
    .w-3 { width: 0.75rem; }
    .h-2 { height: 0.5rem; }
    .h-3 { height: 0.75rem; }
    .shrink-0 { flex-shrink: 0; }
    .flex-1 { flex: 1 1 0%; }
    
    /* Text */
    .text-xs { font-size: 0.75rem; }
    .text-sm { font-size: 0.875rem; }
    .text-lg { font-size: 1.125rem; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .font-mono { font-family: ui-monospace, monospace; }
    .uppercase { text-transform: uppercase; }
    .tracking-tight { letter-spacing: -0.025em; }
    .tracking-wider { letter-spacing: 0.05em; }
    .leading-tight { line-height: 1.25; }
    .leading-relaxed { line-height: 1.625; }
    
    /* Effects */
    .rounded { border-radius: 0.25rem; }
    .rounded-lg { border-radius: 0.5rem; }
    .rounded-full { border-radius: 9999px; }
    .opacity-50 { opacity: 0.5; }
    .opacity-80 { opacity: 0.8; }
    .opacity-90 { opacity: 0.9; }
    
    /* Transitions */
    .transition-colors { transition-property: color, background-color, border-color; transition-duration: 150ms; }
    .transition-all { transition-property: all; transition-duration: 150ms; }
    .duration-300 { transition-duration: 300ms; }
    
    /* Hover states */
    .hover\\:bg-white\\/10:hover { background-color: rgba(255, 255, 255, 0.1); }
    .hover\\:bg-white\\/5:hover { background-color: rgba(255, 255, 255, 0.05); }
    
    /* Cursor */
    .cursor-pointer { cursor: pointer; }
    
    /* Overflow */
    .overflow-y-auto { overflow-y: auto; }
    .overflow-hidden { overflow: hidden; }
    
    /* Position */
    .relative { position: relative; }
    .fixed { position: fixed; }
    
    /* Animations */
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    
    .bg-green-500 { background-color: #22c55e; }
    .bg-yellow-500 { background-color: #eab308; }
    .bg-red-500 { background-color: #ef4444; }
    
    /* Scrollbar */
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 0, 122, 0.35);
        border-radius: 3px;
    }
`;je.appendChild(ke);const it=Te.createRoot(je);let y=!1;function $(n){chrome.storage.local.set({sidebarOpen:n}).catch(()=>{})}chrome.runtime.onMessage.addListener((n,t,r)=>{if(console.log("Content script received message:",n.type),n.type==="TOGGLE_SIDEBAR_TRUSTED")y=!y,y?V():_(),$(y),console.log("Sidebar toggled (trusted):",y?"OPEN":"CLOSED");else if(n.type==="TOGGLE_SIDEBAR")y?(y=!1,_(),$(!1),console.log("Sidebar toggled: CLOSED")):chrome.runtime.sendMessage({type:"GET_SESSION"},i=>{i!=null&&i.session&&(y=!0,V(),$(!0),console.log("Sidebar toggled: OPEN"))});else if(n.type==="OPEN_SIDEBAR")chrome.runtime.sendMessage({type:"GET_SESSION"},i=>{i!=null&&i.session&&(y=!0,V(),$(!0),console.log("Sidebar opened"))});else if(n.type==="CLOSE_SIDEBAR")y=!1,_(),$(!1),console.log("Sidebar closed");else{if(n.type==="GET_SIDEBAR_OPEN")return r({open:y}),!0;n.type==="STATUS_UPDATE"&&n.status==="RECORDING"&&window.location.hostname==="meet.google.com"&&nt()}});console.log("Rendering Sidebar component...");it.render(e.jsx(Re.StrictMode,{children:e.jsx(Ze,{})}));console.log("Sidebar component rendered. Host element:",u);
