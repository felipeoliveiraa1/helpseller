import{c as R,r as c,j as e,T as N,B as se,a as k,b as v,d as re,R as U,L as Pe,N as w,e as j,M as De,A as Oe,C as Be,f as $e,g as Ue}from"./theme-B5Qw5Qu-.js";import{a as G,d as Ge}from"./env-4L6rcpfm.js";/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const He=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]],We=R("circle-question-mark",He);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fe=[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]],Ye=R("copy",Fe);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qe=[["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M17 20v2",key:"1rnc9c"}],["path",{d:"M17 2v2",key:"11trls"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M2 17h2",key:"7oei6x"}],["path",{d:"M2 7h2",key:"asdhe0"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"M20 17h2",key:"1fpfkl"}],["path",{d:"M20 7h2",key:"1o8tra"}],["path",{d:"M7 20v2",key:"4gnj0m"}],["path",{d:"M7 2v2",key:"1i4yhu"}],["rect",{x:"4",y:"4",width:"16",height:"16",rx:"2",key:"1vbyd7"}],["rect",{x:"8",y:"8",width:"8",height:"8",rx:"1",key:"z9xiuo"}]],be=R("cpu",qe);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ve=[["circle",{cx:"9",cy:"12",r:"1",key:"1vctgf"}],["circle",{cx:"9",cy:"5",r:"1",key:"hp0tcf"}],["circle",{cx:"9",cy:"19",r:"1",key:"fkjjf6"}],["circle",{cx:"15",cy:"12",r:"1",key:"1tmaij"}],["circle",{cx:"15",cy:"5",r:"1",key:"19l28e"}],["circle",{cx:"15",cy:"19",r:"1",key:"f4zoj3"}]],Ee=R("grip-vertical",Ve);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xe=[["path",{d:"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",key:"1sd12s"}]],Qe=R("message-circle",Xe);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ke=[["path",{d:"M5 12h14",key:"1ays0h"}]],Je=R("minus",Ke);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ze=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],et=R("triangle-alert",Ze);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tt=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],nt=R("x",tt),ot=4,it=18,te="#22c55e",z="#3b82f6",Se={FREE:"Grátis",STARTER:"Starter",PRO:"Pro",TEAM:"Team",ENTERPRISE:"Enterprise"},I={FREE:"#6b7280",STARTER:"#f59e0b",PRO:"#8b5cf6",TEAM:"#3b82f6",ENTERPRISE:"#ec4899"};function st({text:n,animate:t,cursorColor:s}){const[i,a]=c.useState(t?0:n.length),d=c.useRef(n);c.useEffect(()=>{if(!t){a(n.length);return}const g=d.current;d.current=n,n.startsWith(g)?a(M=>Math.min(M,g.length)):a(0)},[n,t]),c.useEffect(()=>{if(!t||i>=n.length)return;const g=setTimeout(()=>a(M=>M+1),it);return()=>clearTimeout(g)},[i,n,t]);const h=t&&i<n.length;return e.jsxs(e.Fragment,{children:[e.jsx("span",{children:n.slice(0,i)}),h&&e.jsx("span",{style:{display:"inline-block",width:2,height:13,backgroundColor:s,marginLeft:1,verticalAlign:"text-bottom",animation:"cursorBlink 0.6s step-end infinite"}})]})}function ve({text:n}){const[t,s]=c.useState(!1),i=()=>{navigator.clipboard.writeText(n).then(()=>{s(!0),setTimeout(()=>s(!1),2e3)}).catch(()=>{})};return e.jsxs("button",{onClick:i,title:"Copiar",style:{padding:4,background:"transparent",border:"none",color:t?te:j,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontSize:10,flexShrink:0},children:[t?e.jsx(Be,{size:12}):e.jsx(Ye,{size:12}),t?"Copiado":"Copiar"]})}var Te;const je=typeof chrome<"u"&&((Te=chrome.runtime)!=null&&Te.getURL)?chrome.runtime.getURL("logo.svg"):"",ee=360,rt="80vh",Ce=48,ke=56;function at(n){const t=n.target.getRootNode();return t&&"host"in t?t.host:document.getElementById("sales-copilot-root")}function H(){return document.getElementById("sales-copilot-root")}function lt(){const[n,t]=c.useState(null),[s,i]=c.useState(!0),[a,d]=c.useState([]),[h,g]=c.useState([]),[M,D]=c.useState(!1),[oe,V]=c.useState(""),[de,ue]=c.useState(null),[X,pe]=c.useState(!1),[xt,fe]=c.useState(null),[Ae,ie]=c.useState(!1),[b,_e]=c.useState(null),[A,he]=c.useState(!1),_=c.useRef({startX:0,startY:0,startLeft:0,startTop:0,panelW:ee,panelH:300}),ge=c.useRef(null);c.useEffect(()=>{const o=H();o&&chrome.storage.local.get(["sidebarPosition","sidebarMinimized","sidebarOpen"],r=>{const l=r.sidebarPosition,E=Math.max(0,window.innerWidth-ee-16);o.style.left=((l==null?void 0:l.left)??E)+"px",o.style.top=((l==null?void 0:l.top)??16)+"px";const u=r.sidebarMinimized??!1,S=r.sidebarOpen===!0;he(u),S||(o.style.width="0",o.style.height="0",o.style.visibility="hidden",o.style.pointerEvents="none")})},[]),c.useEffect(()=>{const o=H();o&&(o.style.width=A?Ce+"px":ee+"px",o.style.height=A?ke+"px":rt,chrome.storage.local.set({sidebarMinimized:A}))},[A]),c.useEffect(()=>{if(s||n)return;chrome.storage.local.set({sidebarOpen:!1}).catch(()=>{});const o=H();o&&(o.style.width="0",o.style.height="0",o.style.visibility="hidden",o.style.pointerEvents="none")},[s,n]);const me=o=>{if(o.target.closest("button"))return;const r=at(o);if(!r)return;o.preventDefault();const l=A?Ce:ee,E=r.style.left||"",u=r.style.top||"",S=E?parseFloat(E):window.innerWidth-l-16,f=u?parseFloat(u):16,y=Number.isNaN(S)?0:Math.max(0,S),O=Number.isNaN(f)?0:Math.max(0,f);_.current={startX:o.clientX,startY:o.clientY,startLeft:y,startTop:O,panelW:l,panelH:A?ke:200};const K=m=>{const C=m.clientX-_.current.startX,B=m.clientY-_.current.startY,L=H();if(L){const T=window.innerWidth-_.current.panelW-8,$=window.innerHeight-_.current.panelH-8,Z=Math.max(0,Math.min(T,_.current.startLeft+C)),ze=Math.max(0,Math.min($,_.current.startTop+B));L.style.left=Z+"px",L.style.top=ze+"px"}},J=()=>{document.removeEventListener("mousemove",K),document.removeEventListener("mouseup",J);const m=H();m&&chrome.storage.local.set({sidebarPosition:{left:parseFloat(m.style.left||"0")||0,top:parseFloat(m.style.top||"0")||0}})};document.addEventListener("mousemove",K),document.addEventListener("mouseup",J)},ye=()=>he(o=>!o);c.useEffect(()=>{xe()},[]);const xe=async()=>{const o=await G.getSession();if(t(o),!o){i(!1);return}await G.restoreSessionInMemory(o);let r=await G.fetchOrganizationPlan();!r&&o.refresh_token&&(await new Promise(l=>setTimeout(l,1500)),r=await G.fetchOrganizationPlan()),r&&(_e(r.plan),r.plan==="FREE"&&ie(!0)),i(!1)},Le=async()=>{await G.logout(),t(null),pe(!1)};c.useEffect(()=>{const o=r=>{r.supabase_session&&xe()};return chrome.storage.local.onChanged.addListener(o),()=>chrome.storage.local.onChanged.removeListener(o)},[]),c.useEffect(()=>{var o;(o=ge.current)==null||o.scrollIntoView({behavior:"smooth"})},[a,h]),c.useEffect(()=>{const o=r=>{var l,E,u,S;if(r.type==="TRANSCRIPT_RESULT"){const{text:f,isFinal:y,timestamp:O,speaker:K,role:J}=r.data||{};if(!f)return;const m={text:f,speaker:K||"unknown",role:J||"unknown",isFinal:y??!0,timestamp:O||Date.now()};d(C=>{if(!y){const T=C.length-1,$=T>=0?C[T]:null;if($&&!$.isFinal&&$.role===m.role){const Z=[...C];return Z[T]=m,Z}return[...C,m]}const B=C.length-1,L=B>=0?C[B]:null;if(L&&!L.isFinal&&L.role===m.role){const T=[...C];return T[B]=m,T}return[...C,m]})}else if(r.type==="STATUS_UPDATE")pe(r.status==="RECORDING"),r.status==="RECORDING"&&typeof r.micAvailable=="boolean"&&fe(r.micAvailable),r.status!=="RECORDING"&&fe(null),r.status==="PERMISSION_REQUIRED"&&alert("Permissão necessária. Clique no ícone da extensão na barra do navegador para autorizar a captura da aba."),r.status==="PLAN_REQUIRED"&&ie(!0);else if(r.type==="MANAGER_WHISPER")ue({content:r.data.content,urgency:r.data.urgency,timestamp:r.data.timestamp});else if(r.type==="COACH_THINKING")D(!0),V("");else if(r.type==="COACH_TOKEN")V(f=>{var y;return f+(((y=r.data)==null?void 0:y.token)||"")});else if(r.type==="COACH_IDLE"||r.type==="COACH_DONE")D(!1),V("");else if(r.type==="COACHING_MESSAGE"){D(!1),V("");const f=r.data,y={phase:((l=f.metadata)==null?void 0:l.phase)||"S",tip:f.content||"",objection:((E=f.metadata)==null?void 0:E.objection)||null,suggestedResponse:((u=f.metadata)==null?void 0:u.suggested_response)||null,suggestedQuestion:((S=f.metadata)==null?void 0:S.suggested_question)||null,urgency:f.urgency||"medium",timestamp:Date.now()};g(O=>[y,...O].slice(0,ot))}else r.type==="PLAN_REQUIRED"&&ie(!0)};return chrome.runtime.onMessage.addListener(o),()=>chrome.runtime.onMessage.removeListener(o)},[]);const Q={width:"100%",minHeight:0,flex:1,display:"flex",flexDirection:"column",backgroundColor:se,fontFamily:"system-ui, -apple-system, sans-serif",color:N};if(s)return e.jsx("div",{style:{...Q,height:"100%",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx("span",{style:{color:k,fontSize:13},children:"Carregando..."})});if(!n)return e.jsxs("div",{style:{...Q,height:"100%",padding:24,justifyContent:"center",alignItems:"center",textAlign:"center"},children:[e.jsx("p",{style:{fontSize:13,color:k,marginBottom:8},children:"Este painel só funciona quando você está logado."}),e.jsx("p",{style:{fontSize:14,fontWeight:600,color:N},children:"Faça login no ícone da extensão na barra de ferramentas do navegador."})]});if(A)return e.jsx("div",{onMouseDown:me,style:{width:"100%",height:"100%",backgroundColor:se,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui, -apple-system, sans-serif",borderRight:`1px solid ${v}`,cursor:"move",userSelect:"none"},children:e.jsx("button",{onClick:ye,title:"Expandir",style:{width:32,height:32,borderRadius:U,border:`1px solid ${v}`,background:re,color:k,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(Ee,{size:16,style:{transform:"rotate(-90deg)"}})})});if(Ae){const o=b?Se[b]||b:"Grátis",r=b&&I[b]||I.FREE;return e.jsxs("div",{style:{...Q,height:"100%",padding:24,justifyContent:"center",alignItems:"center",textAlign:"center"},children:[e.jsx(Pe,{size:40,style:{color:w,marginBottom:16}}),e.jsx("p",{style:{fontSize:16,fontWeight:700,color:N,marginBottom:8},children:"Plano necessário"}),e.jsxs("div",{style:{marginBottom:16,display:"flex",alignItems:"center",justifyContent:"center",gap:8},children:[e.jsx("span",{style:{fontSize:12,color:k},children:"Seu plano atual:"}),e.jsx("span",{style:{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:6,backgroundColor:`${r}22`,color:r,border:`1px solid ${r}44`,textTransform:"uppercase"},children:o})]}),e.jsx("p",{style:{fontSize:13,color:k,marginBottom:20,lineHeight:1.5},children:"Para usar o coaching IA em tempo real, ative um plano. Comece com 7 dias grátis!"}),e.jsx("a",{href:`${Ge}/billing`,target:"_blank",rel:"noopener noreferrer",style:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px 24px",borderRadius:U,backgroundColor:w,color:"#fff",fontSize:13,fontWeight:700,textDecoration:"none",cursor:"pointer",border:"none"},children:"Escolher plano"})]})}return e.jsxs("div",{style:{...Q,height:"100%"},children:[e.jsxs("div",{onMouseDown:me,style:{padding:"8px 12px",borderBottom:`1px solid ${v}`,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"move",userSelect:"none",flexShrink:0},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[e.jsx(Ee,{size:14,style:{color:j}}),je?e.jsx("img",{src:je,alt:"HelpSeller",style:{height:18,width:"auto"}}):e.jsx(De,{size:14,style:{color:X?Oe:j}}),e.jsx("div",{style:{fontSize:10,fontWeight:600,color:k},children:X?"Ao Vivo":"Parado"}),b&&e.jsx("span",{style:{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,backgroundColor:`${I[b]||I.FREE}22`,color:I[b]||I.FREE,border:`1px solid ${I[b]||I.FREE}44`,textTransform:"uppercase",letterSpacing:"0.04em"},children:Se[b]||b})]}),e.jsxs("div",{style:{display:"flex",gap:4,alignItems:"center"},onClick:o=>o.stopPropagation(),children:[e.jsx("button",{onClick:ye,title:"Minimizar",style:{padding:4,background:"transparent",border:`1px solid ${v}`,borderRadius:U,color:k,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(Je,{size:12})}),e.jsx("button",{onClick:Le,style:{padding:4,fontSize:10,background:"transparent",border:`1px solid ${v}`,borderRadius:U,color:k,cursor:"pointer"},children:"Sair"})]})]}),de&&e.jsxs("div",{style:{padding:"8px 12px",background:"#1a1a2e",borderBottom:`1px solid ${v}`,flexShrink:0},children:[e.jsxs("div",{style:{fontSize:10,fontWeight:600,marginBottom:4,color:z,textTransform:"uppercase",display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsx("span",{children:"Gestor diz:"}),e.jsx("button",{onClick:()=>ue(null),style:{background:"none",border:"none",color:j,cursor:"pointer",padding:0,display:"flex"},children:e.jsx(nt,{size:12})})]}),e.jsx("div",{style:{fontSize:12,lineHeight:1.5,color:N},children:de.content})]}),M&&e.jsxs("div",{style:{padding:"8px 12px",borderBottom:`1px solid ${v}`,flexShrink:0,borderLeft:`3px solid ${w}`,background:"rgba(255,0,122,0.04)"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:oe?4:0},children:[e.jsx(be,{size:12,style:{color:w,animation:"spin 1.5s linear infinite"}}),e.jsx("span",{style:{fontSize:10,color:j,fontWeight:600},children:"Coach analisando..."})]}),oe&&(()=>{try{const o=JSON.parse(oe+'"}'),r=o.suggested_response||o.tip||"";if(r)return e.jsxs("div",{style:{fontSize:12,color:k,lineHeight:1.4,fontStyle:"italic"},children:['"',r,'"',e.jsx("span",{style:{display:"inline-block",width:2,height:12,backgroundColor:w,marginLeft:2,verticalAlign:"text-bottom",animation:"cursorBlink 0.6s step-end infinite"}})]})}catch{}return null})()]}),h.length>0&&e.jsx("div",{style:{flexShrink:0,maxHeight:"50%",overflowY:"auto",borderBottom:`1px solid ${v}`},children:h.map((o,r)=>{const l=r===0,E=l?1:.45;return e.jsxs("div",{style:{opacity:E,borderBottom:r<h.length-1?`1px solid ${v}`:"none",animation:l?"coachPop 0.4s ease":"none"},children:[o.objection&&e.jsx("div",{style:{padding:"8px 12px",background:"rgba(239,68,68,0.12)",borderBottom:"1px solid rgba(239,68,68,0.3)"},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6},children:[e.jsx(et,{size:12,style:{color:"#ef4444"}}),e.jsxs("span",{style:{fontSize:11,fontWeight:700,color:"#ef4444",textTransform:"uppercase"},children:["Objeção: ",o.objection]})]})}),o.suggestedResponse&&e.jsxs("div",{style:{padding:"10px 12px",background:l?"rgba(34,197,94,0.10)":"transparent",borderLeft:l?`3px solid ${te}`:"none"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6},children:[e.jsx(Qe,{size:13,style:{color:te,animation:l?"pulse 1.5s ease-in-out 3":"none"}}),e.jsx("span",{style:{fontSize:11,fontWeight:800,color:te,textTransform:"uppercase",letterSpacing:"0.04em"},children:"Diga Agora"})]}),l&&e.jsx(ve,{text:o.suggestedResponse})]}),e.jsxs("div",{style:{fontSize:l?14:11,fontWeight:600,lineHeight:1.5,color:N},children:['"',o.suggestedResponse,'"']})]}),o.suggestedQuestion&&e.jsxs("div",{style:{padding:"8px 12px",background:l?"rgba(59,130,246,0.08)":"transparent",borderLeft:l?`3px solid ${z}`:"none"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6},children:[e.jsx(We,{size:12,style:{color:z}}),e.jsx("span",{style:{fontSize:10,fontWeight:700,color:z,textTransform:"uppercase"},children:"Pergunte"})]}),l&&e.jsx(ve,{text:o.suggestedQuestion})]}),e.jsxs("div",{style:{fontSize:l?13:11,fontWeight:500,lineHeight:1.4,color:N},children:['"',o.suggestedQuestion,'"']})]}),!o.suggestedResponse&&!o.suggestedQuestion&&!o.objection&&e.jsxs("div",{style:{padding:"6px 12px",background:l?re:"transparent"},children:[e.jsx("div",{style:{fontSize:10,fontWeight:600,marginBottom:3,color:w,textTransform:"uppercase"},children:"Dica"}),e.jsx("div",{style:{fontSize:11,lineHeight:1.4,color:k},children:o.tip.split(/(\*\*.*?\*\*)/).map((u,S)=>u.startsWith("**")&&u.endsWith("**")?e.jsx("strong",{style:{color:N,fontWeight:600},children:u.slice(2,-2)},S):u)})]})]},`cf-${o.timestamp}-${r}`)})}),e.jsxs("div",{style:{flex:"1 1 0",minHeight:0,overflowY:"auto",padding:"8px 10px",display:"flex",flexDirection:"column",gap:6,backgroundColor:se},children:[e.jsxs("div",{style:{fontSize:10,fontWeight:600,marginBottom:2,color:j,textTransform:"uppercase",letterSpacing:"0.05em",flexShrink:0,display:"flex",justifyContent:"space-between"},children:[e.jsx("span",{style:{color:z},children:"Cliente"}),e.jsx("span",{children:"Transcrição"}),e.jsx("span",{style:{color:w},children:"Você"})]}),a.length===0?e.jsxs("div",{style:{fontSize:12,color:j,display:"flex",alignItems:"center",justifyContent:"center",gap:6,flex:1},children:[e.jsx("span",{children:"Aguardando áudio"}),e.jsxs("span",{style:{display:"inline-flex",gap:3},children:[e.jsx("span",{style:{width:4,height:4,borderRadius:"50%",backgroundColor:j,animation:"aiPulse 1.4s infinite 0s"}}),e.jsx("span",{style:{width:4,height:4,borderRadius:"50%",backgroundColor:j,animation:"aiPulse 1.4s infinite 0.3s"}}),e.jsx("span",{style:{width:4,height:4,borderRadius:"50%",backgroundColor:j,animation:"aiPulse 1.4s infinite 0.6s"}})]})]}):a.map((o,r)=>{const l=r===a.length-1,E=l,u=o.role==="lead",S=u?"rgba(59,130,246,0.12)":"rgba(255,0,122,0.10)",f=u?"rgba(59,130,246,0.25)":"rgba(255,0,122,0.25)",y=u?z:w;return e.jsx("div",{style:{display:"flex",justifyContent:u?"flex-start":"flex-end",animation:l&&o.isFinal?"slideIn 0.2s ease":"none"},children:e.jsxs("div",{style:{maxWidth:"85%",padding:"5px 10px",borderRadius:u?"10px 10px 10px 2px":"10px 10px 2px 10px",backgroundColor:S,border:`1px solid ${f}`,opacity:o.isFinal?1:.7,transition:"opacity 0.2s ease"},children:[e.jsx("div",{style:{fontSize:8,fontWeight:700,color:y,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:1},children:u?"CLIENTE":"VOCÊ"}),e.jsx("div",{style:{fontSize:11,lineHeight:1.45,color:N},children:e.jsx(st,{text:o.text,animate:E,cursorColor:y})})]})},`${o.timestamp}-${r}`)}),e.jsx("div",{ref:ge})]}),e.jsx("div",{style:{padding:"6px 12px",borderTop:`1px solid ${v}`,flexShrink:0},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",backgroundColor:re,border:`1px solid ${v}`,borderRadius:U,fontSize:10,color:j},children:[e.jsx(be,{size:10,style:X?{animation:"spin 2s linear infinite",color:w}:{}}),X?M?"Analisando...":"Escutando ao vivo":"Aguardando gravação"]})}),e.jsx("style",{children:`
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
            `})]})}const ct=[/microfone/i,/câmera/i,/camera/i,/desativar/i,/ativar/i,/ctrl\s*\+/i,/alt\s*\+/i,/devices?$/i,/configurações/i,/settings/i,/mute/i,/unmute/i,/turn\s+(on|off)/i,/apresentar/i,/present/i,/chat/i,/meet\.google/i,/participants/i,/participantes/i,/legendas/i,/captions/i,/mais\s+opções/i,/more\s+options/i,/sair/i,/leave/i,/^\d+$/,/^[a-z]$/i];function Me(n){const t=n.trim();if(t.length<2||t.length>50)return!1;for(const s of ct)if(s.test(t))return!1;if(t.length>10){const s=Math.floor(t.length/2),i=t.substring(0,s).toLowerCase().trim(),a=t.substring(s).toLowerCase().trim();if(i===a)return!1}return!0}function le(n){let t=n.trim();t=t.replace(/devices$/i,"").trim();for(let s=Math.floor(t.length/2)-2;s<=Math.ceil(t.length/2)+2;s++)if(s>0&&s<t.length){const i=t.substring(0,s).trim(),a=t.substring(s).trim();if(i.toLowerCase()===a.toLowerCase())return i}return t}const dt=["[data-self-name]",".zWGUib",".adnwBd",".YTbUzc",".cS7aqe"];function ce(){let n="";const t=new Set;for(const i of dt)try{document.querySelectorAll(i).forEach(a=>{var g;let d="";const h=a;if(h.hasAttribute("data-self-name"))d=(h.getAttribute("data-self-name")||"").trim(),d&&(n=d);else{const M=Array.from(a.childNodes).filter(D=>D.nodeType===Node.TEXT_NODE);M.length>0?d=(M[0].textContent||"").trim():d=((g=(h.innerText||"").split(`
`)[0])==null?void 0:g.trim())||""}d&&Me(d)&&t.add(d)})}catch{}const s=[];if(t.forEach(i=>{i!==n&&!s.includes(i)&&s.push(i)}),s.length===0){const a=document.title.replace(/\s*[-–]\s*Google Meet.*$/i,"").trim();a&&a!=="Meeting"&&Me(a)&&s.push(a)}return{selfName:n,otherNames:s}}function ut(){const{selfName:n,otherNames:t}=ce(),s=t.filter(i=>i!==n).map(le).filter(i=>i.length>1);return s.length===0?null:s.join(", ")}function pt(){const{selfName:n,otherNames:t}=ce(),s=t.filter(a=>a!==n).map(le).filter(a=>a.length>1),i=s.length>0?s.join(", "):null;(n||i||s.length>0)&&chrome.runtime.sendMessage({type:"PARTICIPANT_INFO",leadName:i||"Lead",selfName:n||"",allParticipants:s}).catch(()=>{})}let F=null,Y=null;function we(n){const{selfName:t,otherNames:s}=ce(),i=s.filter(g=>g!==t).map(le).filter(g=>g.length>1),a=i.length>0?i.join(", "):null,d=a&&a!==n.leadName,h=t&&t!==n.selfName;(d||h)&&(d&&(n.leadName=a||""),h&&(n.selfName=t||""),chrome.runtime.sendMessage({type:"PARTICIPANT_INFO",leadName:a||"Lead",selfName:t||"",allParticipants:i}).catch(()=>{}))}function Ie(){if(F)return;const n={leadName:"",selfName:""};function t(){we(n)}t(),F=setInterval(t,2e3);let s=null;Y=new MutationObserver(()=>{s||(s=setTimeout(()=>{s=null,we(n)},2e3))}),Y.observe(document.body,{childList:!0,subtree:!0})}function ft(){F&&(clearInterval(F),F=null),Y&&(Y.disconnect(),Y=null)}function ht(){const n=['[jsname="RKGaOc"]','[jsname="EaZ7Me"]','div[role="region"]'];for(const i of n){const a=document.querySelector(i);if(a){const d=a.querySelector('[aria-label*="microphone" i], [aria-label*="microfone" i], [data-tooltip*="microphone" i], [data-tooltip*="microfone" i]');if(d)return ae(d,`${i} > mic button`)}}const t=document.querySelector('button[jsname="BOHaEe"]')||document.querySelector('div[jsname="BOHaEe"]');if(t)return ae(t,"jsname BOHaEe");const s=document.querySelectorAll('[aria-label*="microphone" i], [aria-label*="microfone" i]');for(const i of s)if(!(i.closest('[role="listitem"], [role="list"], [jsname="jrQDbd"], [data-participant-id]')||i.getAttribute("role")!=="button"&&i.tagName.toLowerCase()!=="button"))return ae(i,"aria-label mic button");return console.log("🎤 [MIC DEBUG] No mic button found, assuming unmuted"),!1}function ae(n,t){const s=n.getAttribute("data-is-muted");if(s==="true")return console.log(`🎤 [MIC DEBUG] MUTED via data-is-muted on ${t}`),!0;if(s==="false")return console.log(`🎤 [MIC DEBUG] UNMUTED via data-is-muted on ${t}`),!1;const i=n.getAttribute("aria-pressed");if(i==="true")return console.log(`🎤 [MIC DEBUG] MUTED via aria-pressed on ${t}`),!0;if(i==="false")return console.log(`🎤 [MIC DEBUG] UNMUTED via aria-pressed on ${t}`),!1;const a=(n.getAttribute("aria-label")||n.getAttribute("data-tooltip")||"").toLowerCase();return a.includes("ativar")||a.includes("turn on")||a.includes("unmute")||a.includes("ligar")?(console.log(`🎤 [MIC DEBUG] MUTED via label "${a}" on ${t}`),!0):a.includes("desativar")||a.includes("turn off")||a.includes("mute")||a.includes("desligar")?(console.log(`🎤 [MIC DEBUG] UNMUTED via label "${a}" on ${t}`),!1):(console.log(`🎤 [MIC DEBUG] Could not determine state for ${t}, assuming unmuted`),!1)}let q=null;function gt(){if(q)return;let n=null;console.log("🎤 [MIC MONITOR] Started mic state monitoring"),q=setInterval(()=>{const t=ht();t!==n&&(n=t,console.log(`🎤 [MIC MONITOR] State changed: ${t?"MUTED":"UNMUTED"}`),chrome.runtime.sendMessage({type:"MIC_STATE",muted:t}).catch(()=>{}))},1e3)}function mt(){q&&(clearInterval(q),q=null)}if(window.location.hostname==="meet.google.com"){Ie(),gt(),document.readyState!=="complete"&&window.addEventListener("load",()=>Ie());const n=()=>{chrome.runtime.sendMessage({type:"TRY_END_CALL"}).catch(()=>{})};window.addEventListener("beforeunload",n),window.addEventListener("pagehide",n)}const p=document.createElement("div");p.id="sales-copilot-root";p.style.cssText="position:fixed;width:0;height:0;z-index:2147483647;transition: width 0.2s ease, height 0.2s ease;border-radius:12px;overflow:hidden;visibility:hidden;pointer-events:none;";document.body.appendChild(p);function P(){p.style.width="0",p.style.height="0",p.style.visibility="hidden",p.style.pointerEvents="none",p.style.boxShadow="none",p.style.border="none"}function ne(){p.style.width="360px",p.style.height="80vh",p.style.visibility="visible",p.style.pointerEvents="auto",p.style.boxShadow="0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,0,122,0.1)"}chrome.storage.local.get(["sidebarPosition","sidebarOpen"],n=>{const t=n.sidebarPosition,s=Math.max(0,window.innerWidth-360-16);if(p.style.left=((t==null?void 0:t.left)??s)+"px",p.style.top=((t==null?void 0:t.top)??16)+"px",!(n.sidebarOpen===!0)){P();return}chrome.runtime.sendMessage({type:"GET_SESSION"},a=>{if(!(a!=null&&a.session)){chrome.storage.local.set({sidebarOpen:!1}).catch(()=>{}),P();return}x=!0,ne()})});chrome.storage.onChanged.addListener((n,t)=>{var s;t==="local"&&((s=n.sidebarOpen)==null?void 0:s.newValue)===!1&&(x=!1,P())});const Ne=p.attachShadow({mode:"open"}),Re=document.createElement("style");Re.textContent=`
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
`;Ne.appendChild(Re);const yt=$e.createRoot(Ne);let x=!1;function W(n){chrome.storage.local.set({sidebarOpen:n}).catch(()=>{})}chrome.runtime.onMessage.addListener((n,t,s)=>{try{if(n.type==="TOGGLE_SIDEBAR_TRUSTED")x=!x,x?ne():P(),W(x);else if(n.type==="TOGGLE_SIDEBAR")x?(x=!1,P(),W(!1)):chrome.runtime.sendMessage({type:"GET_SESSION"},i=>{i!=null&&i.session&&(x=!0,ne(),W(!0))});else if(n.type==="OPEN_SIDEBAR")chrome.runtime.sendMessage({type:"GET_SESSION"},i=>{i!=null&&i.session&&(x=!0,ne(),W(!0))});else if(n.type==="CLOSE_SIDEBAR")x=!1,P(),W(!1);else{if(n.type==="GET_SIDEBAR_OPEN")return s({open:x}),!0;if(n.type==="GET_ACTIVE_SPEAKER"){const i=ut();return s({activeSpeaker:i}),!0}else n.type==="STATUS_UPDATE"&&window.location.hostname==="meet.google.com"&&(n.status==="RECORDING"?pt():(n.status==="PROGRAMMED"||n.status==="ERROR")&&(ft(),mt()))}}catch(i){console.error("Content script message handler error:",i)}});yt.render(e.jsx(Ue.StrictMode,{children:e.jsx(lt,{})}));
