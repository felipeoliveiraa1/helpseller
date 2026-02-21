import{c as j,r as c,j as e,T,B as Y,a as C,b as v,d as V,R as H,e as E,M as Ne,A as Ie,N as X,f as Te,g as Re,h as Ae}from"./theme-B8ZLJM22.js";import{a as ae}from"./auth-DmuFIzIA.js";/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _e=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],De=j("check",_e);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ze=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]],Le=j("circle-question-mark",ze);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oe=[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]],Be=j("copy",Oe);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pe=[["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M17 20v2",key:"1rnc9c"}],["path",{d:"M17 2v2",key:"11trls"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M2 17h2",key:"7oei6x"}],["path",{d:"M2 7h2",key:"asdhe0"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"M20 17h2",key:"1fpfkl"}],["path",{d:"M20 7h2",key:"1o8tra"}],["path",{d:"M7 20v2",key:"4gnj0m"}],["path",{d:"M7 2v2",key:"1i4yhu"}],["rect",{x:"4",y:"4",width:"16",height:"16",rx:"2",key:"1vbyd7"}],["rect",{x:"8",y:"8",width:"8",height:"8",rx:"1",key:"z9xiuo"}]],le=j("cpu",Pe);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $e=[["circle",{cx:"9",cy:"12",r:"1",key:"1vctgf"}],["circle",{cx:"9",cy:"5",r:"1",key:"hp0tcf"}],["circle",{cx:"9",cy:"19",r:"1",key:"fkjjf6"}],["circle",{cx:"15",cy:"12",r:"1",key:"1tmaij"}],["circle",{cx:"15",cy:"5",r:"1",key:"19l28e"}],["circle",{cx:"15",cy:"19",r:"1",key:"f4zoj3"}]],ce=j("grip-vertical",$e);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ue=[["path",{d:"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",key:"1sd12s"}]],Ge=j("message-circle",Ue);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const He=[["path",{d:"M5 12h14",key:"1ays0h"}]],We=j("minus",He);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fe=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],qe=j("triangle-alert",Fe);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ye=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],Ve=j("x",Ye),Xe=4,Qe=18,J="#22c55e",Q="#3b82f6";function Ke({text:n,animate:t,cursorColor:r}){const[s,i]=c.useState(t?0:n.length),d=c.useRef(n);c.useEffect(()=>{if(!t){i(n.length);return}const h=d.current;d.current=n,n.startsWith(h)?i(k=>Math.min(k,h.length)):i(0)},[n,t]),c.useEffect(()=>{if(!t||s>=n.length)return;const h=setTimeout(()=>i(k=>k+1),Qe);return()=>clearTimeout(h)},[s,n,t]);const f=t&&s<n.length;return e.jsxs(e.Fragment,{children:[e.jsx("span",{children:n.slice(0,s)}),f&&e.jsx("span",{style:{display:"inline-block",width:2,height:13,backgroundColor:r,marginLeft:1,verticalAlign:"text-bottom",animation:"cursorBlink 0.6s step-end infinite"}})]})}function de({text:n}){const[t,r]=c.useState(!1),s=()=>{navigator.clipboard.writeText(n).then(()=>{r(!0),setTimeout(()=>r(!1),2e3)}).catch(()=>{})};return e.jsxs("button",{onClick:s,title:"Copiar",style:{padding:4,background:"transparent",border:"none",color:t?J:E,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontSize:10,flexShrink:0},children:[t?e.jsx(De,{size:12}):e.jsx(Be,{size:12}),t?"Copiado":"Copiar"]})}var ve;const ue=typeof chrome<"u"&&((ve=chrome.runtime)!=null&&ve.getURL)?chrome.runtime.getURL("logo.svg"):"",W=360,Je="80vh",pe=48,fe=56;function Ze(n){const t=n.target.getRootNode();return t&&"host"in t?t.host:document.getElementById("sales-copilot-root")}function O(){return document.getElementById("sales-copilot-root")}function et(){const[n,t]=c.useState(null),[r,s]=c.useState(!0),[i,d]=c.useState([]),[f,h]=c.useState([]),[k,_]=c.useState(!1),[Z,ee]=c.useState(null),[P,te]=c.useState(!1),[at,ne]=c.useState(null),[w,oe]=c.useState(!1),N=c.useRef({startX:0,startY:0,startLeft:0,startTop:0,panelW:W,panelH:300}),ie=c.useRef(null);c.useEffect(()=>{const o=O();o&&chrome.storage.local.get(["sidebarPosition","sidebarMinimized","sidebarOpen"],a=>{const l=a.sidebarPosition,b=Math.max(0,window.innerWidth-W-16);o.style.left=((l==null?void 0:l.left)??b)+"px",o.style.top=((l==null?void 0:l.top)??16)+"px";const p=a.sidebarMinimized??!1,y=a.sidebarOpen===!0;oe(p),y||(o.style.width="0",o.style.height="0",o.style.visibility="hidden",o.style.pointerEvents="none")})},[]),c.useEffect(()=>{const o=O();o&&(o.style.width=w?pe+"px":W+"px",o.style.height=w?fe+"px":Je,chrome.storage.local.set({sidebarMinimized:w}))},[w]),c.useEffect(()=>{if(r||n)return;chrome.storage.local.set({sidebarOpen:!1}).catch(()=>{});const o=O();o&&(o.style.width="0",o.style.height="0",o.style.visibility="hidden",o.style.pointerEvents="none")},[r,n]);const se=o=>{if(o.target.closest("button"))return;const a=Ze(o);if(!a)return;o.preventDefault();const l=w?pe:W,b=a.style.left||"",p=a.style.top||"",y=b?parseFloat(b):window.innerWidth-l-16,x=p?parseFloat(p):16,R=Number.isNaN(y)?0:Math.max(0,y),D=Number.isNaN(x)?0:Math.max(0,x);N.current={startX:o.clientX,startY:o.clientY,startLeft:R,startTop:D,panelW:l,panelH:w?fe:200};const $=g=>{const S=g.clientX-N.current.startX,z=g.clientY-N.current.startY,I=O();if(I){const M=window.innerWidth-N.current.panelW-8,L=window.innerHeight-N.current.panelH-8,G=Math.max(0,Math.min(M,N.current.startLeft+S)),we=Math.max(0,Math.min(L,N.current.startTop+z));I.style.left=G+"px",I.style.top=we+"px"}},U=()=>{document.removeEventListener("mousemove",$),document.removeEventListener("mouseup",U);const g=O();g&&chrome.storage.local.set({sidebarPosition:{left:parseFloat(g.style.left||"0")||0,top:parseFloat(g.style.top||"0")||0}})};document.addEventListener("mousemove",$),document.addEventListener("mouseup",U)},re=()=>oe(o=>!o);c.useEffect(()=>{Me()},[]);const Me=async()=>{const o=await ae.getSession();t(o),s(!1)},Ce=async()=>{await ae.logout(),t(null),te(!1)};c.useEffect(()=>{var o;(o=ie.current)==null||o.scrollIntoView({behavior:"smooth"})},[i,f]),c.useEffect(()=>{const o=a=>{var l,b,p,y;if(a.type==="TRANSCRIPT_RESULT"){const{text:x,isFinal:R,timestamp:D,speaker:$,role:U}=a.data||{};if(!x)return;const g={text:x,speaker:$||"unknown",role:U||"unknown",isFinal:R??!0,timestamp:D||Date.now()};d(S=>{if(!R){const M=S.length-1,L=M>=0?S[M]:null;if(L&&!L.isFinal&&L.role===g.role){const G=[...S];return G[M]=g,G}return[...S,g]}const z=S.length-1,I=z>=0?S[z]:null;if(I&&!I.isFinal&&I.role===g.role){const M=[...S];return M[z]=g,M}return[...S,g]})}else if(a.type==="STATUS_UPDATE")te(a.status==="RECORDING"),a.status==="RECORDING"&&typeof a.micAvailable=="boolean"&&ne(a.micAvailable),a.status!=="RECORDING"&&ne(null),a.status==="PERMISSION_REQUIRED"&&alert("Permissão necessária. Clique no ícone da extensão na barra do navegador para autorizar a captura da aba.");else if(a.type==="MANAGER_WHISPER")ee({content:a.data.content,urgency:a.data.urgency,timestamp:a.data.timestamp});else if(a.type==="COACH_THINKING")_(!0);else if(a.type==="COACH_IDLE")_(!1);else if(a.type==="COACHING_MESSAGE"){_(!1);const x=a.data,R={phase:((l=x.metadata)==null?void 0:l.phase)||"S",tip:x.content||"",objection:((b=x.metadata)==null?void 0:b.objection)||null,suggestedResponse:((p=x.metadata)==null?void 0:p.suggested_response)||null,suggestedQuestion:((y=x.metadata)==null?void 0:y.suggested_question)||null,urgency:x.urgency||"medium",timestamp:Date.now()};h(D=>[R,...D].slice(0,Xe))}};return chrome.runtime.onMessage.addListener(o),()=>chrome.runtime.onMessage.removeListener(o)},[]);const q={width:"100%",minHeight:0,flex:1,display:"flex",flexDirection:"column",backgroundColor:Y,fontFamily:"system-ui, -apple-system, sans-serif",color:T};return r?e.jsx("div",{style:{...q,height:"100%",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx("span",{style:{color:C,fontSize:13},children:"Carregando..."})}):n?w?e.jsx("div",{onMouseDown:se,style:{width:"100%",height:"100%",backgroundColor:Y,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui, -apple-system, sans-serif",borderRight:`1px solid ${v}`,cursor:"move",userSelect:"none"},children:e.jsx("button",{onClick:re,title:"Expandir",style:{width:32,height:32,borderRadius:H,border:`1px solid ${v}`,background:V,color:C,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(ce,{size:16,style:{transform:"rotate(-90deg)"}})})}):e.jsxs("div",{style:{...q,height:"100%"},children:[e.jsxs("div",{onMouseDown:se,style:{padding:"8px 12px",borderBottom:`1px solid ${v}`,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"move",userSelect:"none",flexShrink:0},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[e.jsx(ce,{size:14,style:{color:E}}),ue?e.jsx("img",{src:ue,alt:"HelpSeller",style:{height:18,width:"auto"}}):e.jsx(Ne,{size:14,style:{color:P?Ie:E}}),e.jsx("div",{style:{fontSize:10,fontWeight:600,color:C},children:P?"Ao Vivo":"Parado"})]}),e.jsxs("div",{style:{display:"flex",gap:4,alignItems:"center"},onClick:o=>o.stopPropagation(),children:[e.jsx("button",{onClick:re,title:"Minimizar",style:{padding:4,background:"transparent",border:`1px solid ${v}`,borderRadius:H,color:C,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(We,{size:12})}),e.jsx("button",{onClick:Ce,style:{padding:4,fontSize:10,background:"transparent",border:`1px solid ${v}`,borderRadius:H,color:C,cursor:"pointer"},children:"Sair"})]})]}),Z&&e.jsxs("div",{style:{padding:"8px 12px",background:"#1a1a2e",borderBottom:`1px solid ${v}`,flexShrink:0},children:[e.jsxs("div",{style:{fontSize:10,fontWeight:600,marginBottom:4,color:Q,textTransform:"uppercase",display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsx("span",{children:"Gestor diz:"}),e.jsx("button",{onClick:()=>ee(null),style:{background:"none",border:"none",color:E,cursor:"pointer",padding:0,display:"flex"},children:e.jsx(Ve,{size:12})})]}),e.jsx("div",{style:{fontSize:12,lineHeight:1.5,color:T},children:Z.content})]}),k&&e.jsxs("div",{style:{padding:"6px 12px",borderBottom:`1px solid ${v}`,flexShrink:0,display:"flex",alignItems:"center",gap:8},children:[e.jsx(le,{size:12,style:{color:X,animation:"spin 1.5s linear infinite"}}),e.jsx("span",{style:{fontSize:11,color:E},children:"Analisando conversa..."})]}),f.length>0&&e.jsx("div",{style:{flexShrink:0,maxHeight:"45%",overflowY:"auto",borderBottom:`1px solid ${v}`},children:f.map((o,a)=>{const l=a===0,b=l?1:.55;return e.jsxs("div",{style:{opacity:b,borderBottom:a<f.length-1?`1px solid ${v}`:"none",animation:l?"slideIn 0.3s ease":"none"},children:[o.objection&&e.jsx("div",{style:{padding:"6px 12px",background:"rgba(239,68,68,0.08)",borderBottom:"1px solid rgba(239,68,68,0.3)"},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6},children:[e.jsx(qe,{size:11,style:{color:"#ef4444"}}),e.jsxs("span",{style:{fontSize:10,fontWeight:700,color:"#ef4444",textTransform:"uppercase"},children:["Objeção: ",o.objection]})]})}),o.suggestedResponse&&e.jsxs("div",{style:{padding:"8px 12px",background:l?"rgba(34,197,94,0.06)":"transparent"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6},children:[e.jsx(Ge,{size:11,style:{color:J}}),e.jsx("span",{style:{fontSize:10,fontWeight:700,color:J,textTransform:"uppercase"},children:"Diga Agora"})]}),l&&e.jsx(de,{text:o.suggestedResponse})]}),e.jsxs("div",{style:{fontSize:l?13:11,fontWeight:500,lineHeight:1.5,color:T},children:['"',o.suggestedResponse,'"']})]}),o.suggestedQuestion&&e.jsxs("div",{style:{padding:"6px 12px",background:l?"rgba(59,130,246,0.06)":"transparent"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6},children:[e.jsx(Le,{size:11,style:{color:Q}}),e.jsx("span",{style:{fontSize:10,fontWeight:700,color:Q,textTransform:"uppercase"},children:"Pergunte"})]}),l&&e.jsx(de,{text:o.suggestedQuestion})]}),e.jsxs("div",{style:{fontSize:l?12:11,fontWeight:500,lineHeight:1.4,color:T},children:['"',o.suggestedQuestion,'"']})]}),!o.suggestedResponse&&!o.suggestedQuestion&&!o.objection&&e.jsxs("div",{style:{padding:"6px 12px",background:l?V:"transparent"},children:[e.jsx("div",{style:{fontSize:10,fontWeight:600,marginBottom:3,color:X,textTransform:"uppercase"},children:"Dica"}),e.jsx("div",{style:{fontSize:11,lineHeight:1.4,color:C},children:o.tip.split(/(\*\*.*?\*\*)/).map((p,y)=>p.startsWith("**")&&p.endsWith("**")?e.jsx("strong",{style:{color:T,fontWeight:600},children:p.slice(2,-2)},y):p)})]})]},`cf-${o.timestamp}-${a}`)})}),e.jsxs("div",{style:{flex:"1 1 0",minHeight:0,overflowY:"auto",padding:"8px 12px",display:"flex",flexDirection:"column",gap:3,backgroundColor:Y},children:[e.jsx("div",{style:{fontSize:10,fontWeight:600,marginBottom:4,color:E,textTransform:"uppercase",letterSpacing:"0.05em",flexShrink:0},children:"Transcrição"}),i.length===0?e.jsxs("div",{style:{fontSize:12,color:E,display:"flex",alignItems:"center",gap:6},children:[e.jsx("span",{children:"Aguardando áudio"}),e.jsxs("span",{style:{display:"inline-flex",gap:3},children:[e.jsx("span",{style:{width:4,height:4,borderRadius:"50%",backgroundColor:E,animation:"aiPulse 1.4s infinite 0s"}}),e.jsx("span",{style:{width:4,height:4,borderRadius:"50%",backgroundColor:E,animation:"aiPulse 1.4s infinite 0.3s"}}),e.jsx("span",{style:{width:4,height:4,borderRadius:"50%",backgroundColor:E,animation:"aiPulse 1.4s infinite 0.6s"}})]})]}):i.map((o,a)=>{const l=a===i.length-1,b=!o.isFinal&&l,p=o.role==="lead",y=p?C:Te;return e.jsxs("div",{style:{fontSize:11,lineHeight:1.4,padding:"2px 0",opacity:o.isFinal?1:.65,transition:"opacity 0.3s ease"},children:[e.jsxs("span",{style:{fontWeight:600,color:y,fontSize:9,marginRight:4},children:[p?"CLIENTE":"VOCÊ",":"]}),e.jsx("span",{style:{color:T},children:e.jsx(Ke,{text:o.text,animate:b,cursorColor:y})})]},`${o.timestamp}-${a}`)}),e.jsx("div",{ref:ie})]}),e.jsx("div",{style:{padding:"6px 12px",borderTop:`1px solid ${v}`,flexShrink:0},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",backgroundColor:V,border:`1px solid ${v}`,borderRadius:H,fontSize:10,color:E},children:[e.jsx(le,{size:10,style:P?{animation:"spin 2s linear infinite",color:X}:{}}),P?k?"Analisando...":"Escutando ao vivo":"Aguardando gravação"]})}),e.jsx("style",{children:`
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
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `})]}):e.jsxs("div",{style:{...q,height:"100%",padding:24,justifyContent:"center",alignItems:"center",textAlign:"center"},children:[e.jsx("p",{style:{fontSize:13,color:C,marginBottom:8},children:"Este painel só funciona quando você está logado."}),e.jsx("p",{style:{fontSize:14,fontWeight:600,color:T},children:"Faça login no ícone da extensão na barra de ferramentas do navegador."})]})}const tt=[/microfone/i,/câmera/i,/camera/i,/desativar/i,/ativar/i,/ctrl\s*\+/i,/alt\s*\+/i,/devices?$/i,/configurações/i,/settings/i,/mute/i,/unmute/i,/turn\s+(on|off)/i,/apresentar/i,/present/i,/chat/i,/meet\.google/i,/participants/i,/participantes/i,/legendas/i,/captions/i,/mais\s+opções/i,/more\s+options/i,/sair/i,/leave/i,/^\d+$/,/^[a-z]$/i];function he(n){const t=n.trim();if(t.length<2||t.length>50)return!1;for(const r of tt)if(r.test(t))return!1;if(t.length>10){const r=Math.floor(t.length/2),s=t.substring(0,r).toLowerCase().trim(),i=t.substring(r).toLowerCase().trim();if(s===i)return!1}return!0}function Ee(n){let t=n.trim();t=t.replace(/devices$/i,"").trim();for(let r=Math.floor(t.length/2)-2;r<=Math.ceil(t.length/2)+2;r++)if(r>0&&r<t.length){const s=t.substring(0,r).trim(),i=t.substring(r).trim();if(s.toLowerCase()===i.toLowerCase())return s}return t}const nt=["[data-self-name]",".zWGUib",".adnwBd",".YTbUzc",".cS7aqe"];function Se(){let n="";const t=new Set;for(const s of nt)try{document.querySelectorAll(s).forEach(i=>{var h;let d="";const f=i;if(f.hasAttribute("data-self-name"))d=(f.getAttribute("data-self-name")||"").trim(),d&&(n=d);else{const k=Array.from(i.childNodes).filter(_=>_.nodeType===Node.TEXT_NODE);k.length>0?d=(k[0].textContent||"").trim():d=((h=(f.innerText||"").split(`
`)[0])==null?void 0:h.trim())||""}d&&he(d)&&t.add(d)})}catch{}const r=[];if(t.forEach(s=>{s!==n&&!r.includes(s)&&r.push(s)}),r.length===0){const i=document.title.replace(/\s*[-–]\s*Google Meet.*$/i,"").trim();i&&i!=="Meeting"&&he(i)&&r.push(i)}return{selfName:n,otherNames:r}}function ot(){const{selfName:n,otherNames:t}=Se(),r=t.filter(i=>i!==n).map(Ee).filter(i=>i.length>1),s=r[0]||null;(n||s||r.length>0)&&chrome.runtime.sendMessage({type:"PARTICIPANT_INFO",leadName:s||"Lead",selfName:n||"",allParticipants:r}).catch(()=>{})}let ge=null,me=null;function ye(n){const{selfName:t,otherNames:r}=Se(),s=r.filter(h=>h!==t).map(Ee).filter(h=>h.length>1),i=s[0]||null,d=i&&i!==n.leadName,f=t&&t!==n.selfName;(d||f)&&(d&&(n.leadName=i||""),f&&(n.selfName=t||""),chrome.runtime.sendMessage({type:"PARTICIPANT_INFO",leadName:i||"Lead",selfName:t||"",allParticipants:s}).catch(()=>{}))}function xe(){if(ge)return;const n={leadName:"",selfName:""};function t(){ye(n)}t(),ge=setInterval(t,2e3),me=new MutationObserver(()=>ye(n)),me.observe(document.body,{childList:!0,subtree:!0})}function it(){const n=['[jsname="RKGaOc"]','[jsname="EaZ7Me"]','div[role="region"]'];for(const s of n){const i=document.querySelector(s);if(i){const d=i.querySelector('[aria-label*="microphone" i], [aria-label*="microfone" i], [data-tooltip*="microphone" i], [data-tooltip*="microfone" i]');if(d)return K(d,`${s} > mic button`)}}const t=document.querySelector('button[jsname="BOHaEe"]')||document.querySelector('div[jsname="BOHaEe"]');if(t)return K(t,"jsname BOHaEe");const r=document.querySelectorAll('[aria-label*="microphone" i], [aria-label*="microfone" i]');for(const s of r)if(!(s.closest('[role="listitem"], [role="list"], [jsname="jrQDbd"], [data-participant-id]')||s.getAttribute("role")!=="button"&&s.tagName.toLowerCase()!=="button"))return K(s,"aria-label mic button");return console.log("🎤 [MIC DEBUG] No mic button found, assuming unmuted"),!1}function K(n,t){const r=n.getAttribute("data-is-muted");if(r==="true")return console.log(`🎤 [MIC DEBUG] MUTED via data-is-muted on ${t}`),!0;if(r==="false")return console.log(`🎤 [MIC DEBUG] UNMUTED via data-is-muted on ${t}`),!1;const s=n.getAttribute("aria-pressed");if(s==="true")return console.log(`🎤 [MIC DEBUG] MUTED via aria-pressed on ${t}`),!0;if(s==="false")return console.log(`🎤 [MIC DEBUG] UNMUTED via aria-pressed on ${t}`),!1;const i=(n.getAttribute("aria-label")||n.getAttribute("data-tooltip")||"").toLowerCase();return i.includes("ativar")||i.includes("turn on")||i.includes("unmute")||i.includes("ligar")?(console.log(`🎤 [MIC DEBUG] MUTED via label "${i}" on ${t}`),!0):i.includes("desativar")||i.includes("turn off")||i.includes("mute")||i.includes("desligar")?(console.log(`🎤 [MIC DEBUG] UNMUTED via label "${i}" on ${t}`),!1):(console.log(`🎤 [MIC DEBUG] Could not determine state for ${t}, assuming unmuted`),!1)}let be=null;function st(){if(be)return;let n=null;console.log("🎤 [MIC MONITOR] Started mic state monitoring"),be=setInterval(()=>{const t=it();t!==n&&(n=t,console.log(`🎤 [MIC MONITOR] State changed: ${t?"MUTED":"UNMUTED"}`),chrome.runtime.sendMessage({type:"MIC_STATE",muted:t}).catch(()=>{}))},1e3)}console.log("HelpSeller Content Script Loaded");if(window.location.hostname==="meet.google.com"){xe(),st(),document.readyState!=="complete"&&window.addEventListener("load",()=>xe());const n=()=>{chrome.runtime.sendMessage({type:"TRY_END_CALL"}).catch(()=>{})};window.addEventListener("beforeunload",n),window.addEventListener("pagehide",n)}const u=document.createElement("div");u.id="sales-copilot-root";u.style.cssText="position:fixed;width:0;height:0;z-index:2147483647;transition: width 0.2s ease, height 0.2s ease;border-radius:12px;overflow:hidden;visibility:hidden;pointer-events:none;";document.body.appendChild(u);function A(){u.style.width="0",u.style.height="0",u.style.visibility="hidden",u.style.pointerEvents="none",u.style.boxShadow="none",u.style.border="none"}function F(){u.style.width="360px",u.style.height="80vh",u.style.visibility="visible",u.style.pointerEvents="auto",u.style.boxShadow="0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,0,122,0.1)"}chrome.storage.local.get(["sidebarPosition","sidebarOpen"],n=>{const t=n.sidebarPosition,r=Math.max(0,window.innerWidth-360-16);if(u.style.left=((t==null?void 0:t.left)??r)+"px",u.style.top=((t==null?void 0:t.top)??16)+"px",!(n.sidebarOpen===!0)){A();return}chrome.runtime.sendMessage({type:"GET_SESSION"},i=>{if(!(i!=null&&i.session)){chrome.storage.local.set({sidebarOpen:!1}).catch(()=>{}),A();return}m=!0,F()})});chrome.storage.onChanged.addListener((n,t)=>{var r;t==="local"&&((r=n.sidebarOpen)==null?void 0:r.newValue)===!1&&(m=!1,A())});const ke=u.attachShadow({mode:"open"}),je=document.createElement("style");je.textContent=`
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
`;ke.appendChild(je);const rt=Re.createRoot(ke);let m=!1;function B(n){chrome.storage.local.set({sidebarOpen:n}).catch(()=>{})}chrome.runtime.onMessage.addListener((n,t,r)=>{if(console.log("Content script received message:",n.type),n.type==="TOGGLE_SIDEBAR_TRUSTED")m=!m,m?F():A(),B(m),console.log("Sidebar toggled (trusted):",m?"OPEN":"CLOSED");else if(n.type==="TOGGLE_SIDEBAR")m?(m=!1,A(),B(!1),console.log("Sidebar toggled: CLOSED")):chrome.runtime.sendMessage({type:"GET_SESSION"},s=>{s!=null&&s.session&&(m=!0,F(),B(!0),console.log("Sidebar toggled: OPEN"))});else if(n.type==="OPEN_SIDEBAR")chrome.runtime.sendMessage({type:"GET_SESSION"},s=>{s!=null&&s.session&&(m=!0,F(),B(!0),console.log("Sidebar opened"))});else if(n.type==="CLOSE_SIDEBAR")m=!1,A(),B(!1),console.log("Sidebar closed");else{if(n.type==="GET_SIDEBAR_OPEN")return r({open:m}),!0;n.type==="STATUS_UPDATE"&&n.status==="RECORDING"&&window.location.hostname==="meet.google.com"&&ot()}});console.log("Rendering Sidebar component...");rt.render(e.jsx(Ae.StrictMode,{children:e.jsx(et,{})}));console.log("Sidebar component rendered. Host element:",u);
