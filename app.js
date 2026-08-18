(function(){
'use strict';

/* ============================================================
   MAPA EDUCACIONAL — MS
   Fases 1 a 4:
   1. Perfil da escola
   2. Comparação e escolas semelhantes
   3. Panorama municipal
   4. Relação contexto x desempenho + desempenho esperado
   ============================================================ */

var schoolFeatures=jsonSource_Escolas_IDEB_2025.getFeatures();
var munFeatures=jsonSource_Municipios_Mato_Grosso_do_Sul_2025_3.getFeatures();
var setorSource=null, setorRendaLayer=null, setorPpiLayer=null, setoresPromise=null;
var selectedSchool=null;
var state={etapa:'',rede:'',municipio:'',indicator:'port',renda:false,ppi:false,municipios:true,tab:'1'};
var analysisCache={};

var CUTS={port:{'Anos Iniciais':200,'Anos Finais':275,'Ensino Médio':300},mat:{'Anos Iniciais':225,'Anos Finais':300,'Ensino Médio':350}};
var RENDA_CLASSES=[
 {max:1000,color:'#eff6ff',label:'Até R$ 1.000'},
 {max:1300,color:'#dbeafe',label:'R$ 1.001 – 1.300'},
 {max:1600,color:'#bfdbfe',label:'R$ 1.301 – 1.600'},
 {max:2000,color:'#93c5fd',label:'R$ 1.601 – 2.000'},
 {max:2500,color:'#60a5fa',label:'R$ 2.001 – 2.500'},
 {max:3500,color:'#3b82f6',label:'R$ 2.501 – 3.500'},
 {max:5000,color:'#2563eb',label:'R$ 3.501 – 5.000'},
 {max:7500,color:'#1d4ed8',label:'R$ 5.001 – 7.500'},
 {max:Infinity,color:'#1e3a8a',label:'Acima de R$ 7.500'}
];
var PPI_CLASSES=[
 {max:0,color:'#f1f5f9',label:'0 pessoas'},
 {max:25,color:'#eff6ff',label:'1 – 25 pessoas'},
 {max:50,color:'#dbeafe',label:'26 – 50 pessoas'},
 {max:100,color:'#bfdbfe',label:'51 – 100 pessoas'},
 {max:150,color:'#93c5fd',label:'101 – 150 pessoas'},
 {max:250,color:'#60a5fa',label:'151 – 250 pessoas'},
 {max:350,color:'#3b82f6',label:'251 – 350 pessoas'},
 {max:500,color:'#2563eb',label:'351 – 500 pessoas'},
 {max:750,color:'#1d4ed8',label:'501 – 750 pessoas'},
 {max:Infinity,color:'#1e3a8a',label:'Acima de 750 pessoas'}
];

function $(id){return document.getElementById(id)}
function norm(v){return v===null||v===undefined?'':String(v).trim()}
function esc(v){return norm(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function num(v){if(v===null||v===undefined||v===''||v==='-'||v==='ND')return null;var n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null}
function fmt(v,d){var n=num(v);return n===null?'—':n.toLocaleString('pt-BR',{minimumFractionDigits:d||0,maximumFractionDigits:d===undefined?2:d})}
function money(v){var n=num(v);return n===null?'—':n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})}
function people(v){var n=num(v);return n===null?'—':n.toLocaleString('pt-BR',{maximumFractionDigits:0})}
function mean(arr){var a=arr.filter(function(x){return Number.isFinite(x)});return a.length?a.reduce(function(s,x){return s+x},0)/a.length:null}
function median(arr){var a=arr.filter(function(x){return Number.isFinite(x)}).sort(function(a,b){return a-b});if(!a.length)return null;var m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2}
function sd(arr){var a=arr.filter(function(x){return Number.isFinite(x)});if(a.length<2)return 1;var m=mean(a);return Math.sqrt(a.reduce(function(s,x){return s+Math.pow(x-m,2)},0)/(a.length-1))||1}
function percentile(arr,p){var a=arr.filter(function(x){return Number.isFinite(x)}).sort(function(a,b){return a-b});if(!a.length)return null;var i=(a.length-1)*p;var lo=Math.floor(i),hi=Math.ceil(i);return lo===hi?a[lo]:a[lo]+(a[hi]-a[lo])*(i-lo)}
function badge(text,kind){return '<span class="badge '+(kind||'neutral')+'">'+esc(text)+'</span>'}
function dotColor(v,cut){return v===null?'#94a3b8':(v>cut?'#16a34a':'#dc2626')}
function schoolKey(f){return norm(f.get('ID_ESCOLA'))+'|'+norm(f.get('ETAPA'))}
function schoolName(f){return norm(f.get('NO_ESCOLA'))||'Escola sem identificação'}
function schoolScore(f,indicator){return num(f.get(indicator==='mat'?'VL_NOTA_MATEMATICA_2025':'VL_NOTA_PORTUGUES_2025'))}
function cutoff(indicator,etapa){return CUTS[indicator]&&CUTS[indicator][etapa]||null}
function visibleSchools(){return schoolFeatures.filter(function(f){var p=f.getProperties();return (!state.etapa||norm(p.ETAPA)===state.etapa)&&(!state.rede||norm(p.REDE)===state.rede)&&(!state.municipio||norm(p.NO_MUNICIPIO)===state.municipio)})}

/* ----------------------------- MAPA ----------------------------- */
var map=new ol.Map({target:'map',layers:[lyr_GoogleSatellite_0,lyr_Municipios_Mato_Grosso_do_Sul_2025_3,lyr_MetadeMatemtica_4,lyr_MetadePortugus_5],view:new ol.View({center:ol.proj.fromLonLat([-54.5,-20.5]),zoom:6.2}),controls:ol.control.defaults.defaults({zoom:false,attribution:true,rotate:false}).extend([new ol.control.Zoom(),new ol.control.ScaleLine()])});
lyr_GoogleSatellite_0.setZIndex(0);lyr_Municipios_Mato_Grosso_do_Sul_2025_3.setZIndex(20);lyr_MetadeMatemtica_4.setZIndex(30);lyr_MetadePortugus_5.setZIndex(30);
map.getView().fit(jsonSource_Municipios_Mato_Grosso_do_Sul_2025_3.getExtent(),{padding:[80,380,70,40],maxZoom:8,duration:0});

function showLoading(t){$('loading').textContent=t||'Carregando dados...';$('loading').classList.add('visible')}
function hideLoading(){$('loading').classList.remove('visible')}
function styleSchool(feature){
 var score=schoolScore(feature,state.indicator), cut=cutoff(state.indicator,norm(feature.get('ETAPA'))), color=score===null?'#94a3b8':(cut&&score>cut?'#16a34a':'#dc2626');
 var selected=selectedSchool&&schoolKey(selectedSchool)===schoolKey(feature);
 return new ol.style.Style({image:new ol.style.Circle({radius:selected?9:6,fill:new ol.style.Fill({color:color}),stroke:new ol.style.Stroke({color:selected?'#0f172a':'#fff',width:selected?3:1.5})})});
}
function updateMap(){
 var active=state.indicator==='mat'?lyr_MetadeMatemtica_4:lyr_MetadePortugus_5;
 var inactive=state.indicator==='mat'?lyr_MetadePortugus_5:lyr_MetadeMatemtica_4;
 active.setVisible(!!state.etapa);inactive.setVisible(false);
 active.setStyle(function(f){return visibleSchoolFeature(f)?styleSchool(f):null});
 lyr_Municipios_Mato_Grosso_do_Sul_2025_3.setVisible(state.municipios);
 lyr_Municipios_Mato_Grosso_do_Sul_2025_3.setStyle(function(f){var p=f.getProperties(),sel=state.municipio&&norm(p.NM_MUN)===state.municipio;return state.municipio&&!sel?null:new ol.style.Style({stroke:new ol.style.Stroke({color:sel?'#2563eb':'rgba(255,255,255,.9)',width:sel?3:1.3}),fill:new ol.style.Fill({color:sel?'rgba(37,99,235,.05)':'rgba(0,0,0,0)'})})});
 updateLegend();updateStage();fillSchoolSelect();
}
function visibleSchoolFeature(f){var p=f.getProperties();return !!state.etapa&&(!state.rede||norm(p.REDE)===state.rede)&&(!state.municipio||norm(p.NO_MUNICIPIO)===state.municipio)}
function updateStage(){var msg=$('stage-message');msg.classList.toggle('hidden',!!state.etapa);$('count').textContent=state.etapa?visibleSchools().length+' escolas encontradas':'Selecione uma etapa para exibir as escolas.'}
function updateLegend(){var cut=cutoff(state.indicator,state.etapa),name=state.indicator==='mat'?'Matemática':'Português';$('performance-legend').innerHTML=!cut?'Selecione uma etapa para ver o ponto de corte.':'<div><b>'+name+'</b> · '+esc(state.etapa)+'</div><div class="legend-row"><span class="dot green"></span> Acima do corte: <b>&gt; '+fmt(cut)+'</b></div><div class="legend-row"><span class="dot red"></span> No corte ou abaixo: <b>≤ '+fmt(cut)+'</b></div><div class="legend-row"><span class="dot gray"></span> Sem informação</div>'}
function fillSelect(id,values,placeholder){$(id).innerHTML='<option value="">'+esc(placeholder)+'</option>'+values.sort(function(a,b){return a.localeCompare(b,'pt-BR')}).map(function(v){return '<option value="'+esc(v)+'">'+esc(v)+'</option>'}).join('')}
function fillFilters(){fillSelect('municipio',Array.from(new Set(munFeatures.map(function(f){return norm(f.get('NM_MUN'))}).filter(Boolean))),'Todos os municípios');fillSelect('etapa',Array.from(new Set(schoolFeatures.map(function(f){return norm(f.get('ETAPA'))}).filter(Boolean))),'Todas as etapas');fillSelect('rede',Array.from(new Set(schoolFeatures.map(function(f){return norm(f.get('REDE'))}).filter(Boolean))),'Todas as redes');fillSchoolSelect()}
function fillSchoolSelect(){var el=$('escola'),list=visibleSchools().sort(function(a,b){return schoolName(a).localeCompare(schoolName(b),'pt-BR')});el.innerHTML='<option value="">Selecione uma escola</option>'+list.map(function(f){return '<option value="'+esc(schoolKey(f))+'">'+esc(schoolName(f))+'</option>'}).join('');if(selectedSchool){var key=schoolKey(selectedSchool);if(list.some(function(f){return schoolKey(f)===key}))el.value=key}}
function selectSchool(f,open){selectedSchool=f||null;updateMap();if(selectedSchool){$('escola').value=schoolKey(selectedSchool);map.getView().animate({center:selectedSchool.getGeometry().getCoordinates(),zoom:14,duration:500});if(open!==false){openAnalysis('1')}}else $('escola').value='';}

/* --------------------- SETORES / CONTEXTO --------------------- */
function sectorStyle(color){return new ol.style.Style({stroke:new ol.style.Stroke({color:'rgba(35,35,35,.45)',width:.7}),fill:new ol.style.Fill({color:color})})}
function classify(v,classes){if(!Number.isFinite(v))return null;for(var i=0;i<classes.length;i++)if(v<=classes[i].max)return classes[i];return classes[classes.length-1]}
function loadSetores(){
 if(setorSource)return Promise.resolve(setorSource);
 if(setoresPromise)return setoresPromise;
 setoresPromise=fetch('./layers/setores_renda_ppi.geojson').then(function(r){if(!r.ok)throw new Error('Não foi possível carregar a base territorial.');return r.json()}).then(function(data){var fs=new ol.format.GeoJSON().readFeatures(data,{dataProjection:'EPSG:4326',featureProjection:'EPSG:3857'});setorSource=new ol.source.Vector({features:fs});setorRendaLayer=new ol.layer.Vector({source:setorSource,visible:false,zIndex:5,style:function(f){var c=classify(num(f.get('Renda')),RENDA_CLASSES);return sectorStyle(c?c.color:'rgba(226,232,240,.45)')}});setorPpiLayer=new ol.layer.Vector({source:setorSource,visible:false,zIndex:5,style:function(f){var c=classify(num(f.get('PPI')),PPI_CLASSES);return sectorStyle(c?c.color:'rgba(226,232,240,.45)')}});map.addLayer(setorRendaLayer);map.addLayer(setorPpiLayer);return setorSource}).catch(function(e){setoresPromise=null;throw e});
}
function schoolContext(f){
 if(!setorSource||!f)return null;var c=f.getGeometry().getCoordinates(), extent=[c[0]-500,c[1]-500,c[0]+500,c[1]+500], candidates=setorSource.getFeaturesInExtent(extent);for(var i=0;i<candidates.length;i++){var g=candidates[i].getGeometry();if(g&&g.intersectsCoordinate(c)){var p=candidates[i].getProperties();return {feature:candidates[i],renda:num(p.Renda),ppi:num(p.PPI),municipio:norm(p.NM_MUN),codigo:norm(p.CD_SETOR)}}}return null
}
function ensureContext(f){return loadSetores().then(function(){var c=schoolContext(f);if(c)analysisCache[schoolKey(f)]=c;return c})}
function setTerritory(mode){if(mode==='renda'){state.renda=!state.renda;state.ppi=false}else if(mode==='ppi'){state.ppi=!state.ppi;state.renda=false}if(state.renda||state.ppi){showLoading('Carregando setores censitários...');loadSetores().then(function(){hideLoading();applySectorVisibility();updateMapLegend()}).catch(function(e){hideLoading();state.renda=false;state.ppi=false;applySectorVisibility();alert(e.message)})}else applySectorVisibility();updateMapLegend()}
function applySectorVisibility(){if(setorRendaLayer)setorRendaLayer.setVisible(state.renda);if(setorPpiLayer)setorPpiLayer.setVisible(state.ppi)}
function updateMapLegend(){var el=$('map-legend'),active=state.renda?'renda':state.ppi?'ppi':null;if(!active){el.classList.remove('visible');return}var classes=active==='renda'?RENDA_CLASSES:PPI_CLASSES;el.innerHTML='<div class="legend-title">'+(active==='renda'?'Renda média do setor':'População PPI do setor')+'</div><div class="legend-sub">Clique em um setor para consultar os valores exatos.</div>'+classes.map(function(c){return '<div class="legend-row"><span style="width:22px;height:12px;border-radius:3px;background:'+c.color+';display:inline-block;border:1px solid #cbd5e1"></span>'+esc(c.label)+'</div>'}).join('');el.classList.add('visible')}

/* --------------------- CÁLCULOS DE ANÁLISE --------------------- */
function statsFor(filters){var arr=schoolFeatures.filter(function(f){var p=f.getProperties();return (!filters.etapa||norm(p.ETAPA)===filters.etapa)&&(!filters.municipio||norm(p.NO_MUNICIPIO)===filters.municipio)&&(!filters.rede||norm(p.REDE)===filters.rede)});return arr}
function comparisonStats(f){var p=f.getProperties(),stage=norm(p.ETAPA),mun=norm(p.NO_MUNICIPIO),network=norm(p.REDE),score=schoolScore(f,state.indicator);var base=statsFor({etapa:stage});var m=mean(base.map(function(x){return schoolScore(x,state.indicator)}));var municipal=mean(statsFor({etapa:stage,municipio:mun}).map(function(x){return schoolScore(x,state.indicator)}));var networkMean=mean(statsFor({etapa:stage,rede:network}).map(function(x){return schoolScore(x,state.indicator)}));var rank=base.filter(function(x){var s=schoolScore(x,state.indicator);return score!==null&&s!==null&&s>score}).length+1;var n=base.filter(function(x){return schoolScore(x,state.indicator)!==null}).length;return {state:m,municipal:municipal,network:networkMean,rank:score===null?null:rank,n:n,score:score}}
function contextProfile(f){var c=analysisCache[schoolKey(f)];return c||null}
function similarSchools(f){var c=contextProfile(f),stage=norm(f.get('ETAPA')),score=schoolScore(f,state.indicator);var candidates=statsFor({etapa:stage}).filter(function(x){return x!==f&&schoolScore(x,state.indicator)!==null});if(!c)return candidates.filter(function(x){return norm(x.get('NO_MUNICIPIO'))===norm(f.get('NO_MUNICIPIO'))}).slice(0,6);var rs=sd(candidates.map(function(x){var cc=contextProfile(x);return cc?cc.renda:null})),ps=sd(candidates.map(function(x){var cc=contextProfile(x);return cc?cc.ppi:null}));return candidates.map(function(x){var cc=contextProfile(x);if(!cc)return {f:x,d:999999};return {f:x,d:Math.sqrt(Math.pow((cc.renda-c.renda)/rs,2)+Math.pow((cc.ppi-c.ppi)/ps,2))}}).filter(function(x){return x.d<999999}).sort(function(a,b){return a.d-b.d}).slice(0,6).map(function(x){return x.f})}
function municipalityStats(){var arr=statsFor({etapa:state.etapa,municipio:state.municipio});var port=arr.map(function(f){return schoolScore(f,'port')}),mat=arr.map(function(f){return schoolScore(f,'mat')}),ideb=arr.map(function(f){return num(f.get('VL_OBSERVADO_2025'))});return {arr:arr,count:arr.length,port:mean(port),mat:mean(mat),ideb:mean(ideb),portAdeq:port.filter(function(x){return x!==null&&cutoff('port',state.etapa)&&x>cutoff('port',state.etapa)}).length,matAdeq:mat.filter(function(x){return x!==null&&cutoff('mat',state.etapa)&&x>cutoff('mat',state.etapa)}).length}}
function findSchoolContextData(){return schoolFeatures.filter(function(f){var c=contextProfile(f);return c&&schoolScore(f,state.indicator)!==null}).map(function(f){return {f:f,c:contextProfile(f),y:schoolScore(f,state.indicator)}})}
function matrixSolve(A,b){var n=A.length,M=A.map(function(r,i){return r.slice().concat([b[i]])});for(var i=0;i<n;i++){var max=i;for(var k=i+1;k<n;k++)if(Math.abs(M[k][i])>Math.abs(M[max][i]))max=k;if(Math.abs(M[max][i])<1e-10)return null;var tmp=M[i];M[i]=M[max];M[max]=tmp;var piv=M[i][i];for(var j=i;j<=n;j++)M[i][j]/=piv;for(k=0;k<n;k++){if(k===i)continue;var factor=M[k][i];for(j=i;j<=n;j++)M[k][j]-=factor*M[i][j]}}return M.map(function(r){return r[n]})}
function regression(data){if(data.length<5)return null;var X=data.map(function(d){return [1,d.c.renda,d.c.ppi]});var y=data.map(function(d){return d.y});var A=[[0,0,0],[0,0,0],[0,0,0]],b=[0,0,0];for(var i=0;i<X.length;i++){for(var r=0;r<3;r++){b[r]+=X[i][r]*y[i];for(var c=0;c<3;c++)A[r][c]+=X[i][r]*X[i][c]}}var beta=matrixSolve(A,b);if(!beta)return null;var ybar=mean(y),ssTot=0,ssRes=0;data.forEach(function(d){var pred=beta[0]+beta[1]*d.c.renda+beta[2]*d.c.ppi;ssTot+=Math.pow(d.y-ybar,2);ssRes+=Math.pow(d.y-pred,2);d.pred=pred;d.residual=d.y-pred});return {beta:beta,r2:ssTot?1-ssRes/ssTot:null,n:data.length,data:data}}
function expectedFor(f,model){var c=contextProfile(f);return c&&model?model.beta[0]+model.beta[1]*c.renda+model.beta[2]*c.ppi:null}

/* --------------------- VISUALIZAÇÕES --------------------- */
function card(k,v,s){return '<div class="card"><div class="k">'+esc(k)+'</div><div class="v">'+v+'</div><div class="s">'+(s||'')+'</div></div>'}
function adequacy(v,cut){if(v===null||cut===null)return badge('Sem informação','neutral');return badge(v>cut?'Acima do adequado':'Abaixo ou no corte',v>cut?'good':'bad')}
function relationText(score,avg,label){if(score===null||avg===null)return 'Não há dados suficientes para comparar.';var d=score-avg;if(Math.abs(d)<1)return 'Resultado praticamente igual à '+label+'.';return (d>0?'<b>+'+fmt(d,1)+' pontos</b> acima':'<b>'+fmt(d,1)+' pontos</b> abaixo')+' da '+label+'.'}
function renderPhase1(){
 var c=selectedSchool;if(!c)return '<div class="empty-state"><b>Selecione uma escola</b><br><br>Escolha uma etapa e uma escola no painel ou clique em um ponto do mapa.</div>';
 var p=c.getProperties(),stage=norm(p.ETAPA),ind=state.indicator,score=schoolScore(c,ind),cut=cutoff(ind,stage),comp=comparisonStats(c),ctx=contextProfile(c),other=ind==='port'?schoolScore(c,'mat'):schoolScore(c,'port'),otherCut=cutoff(ind==='port'?'mat':'port',stage),name=ind==='port'?'Português':'Matemática';
 var html='<div class="hero"><div class="analysis-kicker">FASE 1 · MINHA ESCOLA</div><h3>'+esc(schoolName(c))+'</h3><div class="muted">'+esc(norm(p.NO_MUNICIPIO))+' · '+esc(norm(p.REDE))+' · '+esc(stage)+'</div></div>';
 html+='<div class="cards">'+card(name,fmt(score,1),adequacy(score,cut)) + card('IDEB observado',fmt(p.VL_OBSERVADO_2025,1),'Indicador disponível na base')+card('Rendimento',num(p.VL_INDICADOR_REND_2025)===null?'—':(num(p.VL_INDICADOR_REND_2025)*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%','Indicador de rendimento')+card(ind==='port'?'Matemática':'Português',fmt(other,1),adequacy(other,otherCut))+'</div>';
 html+='<div class="section-title">Como a escola se posiciona?</div><div class="callout">'+relationText(score,comp.municipal,'média municipal')+' '+relationText(score,comp.state,'média estadual')+'</div>';
 html+='<div class="section-title">Comparação de desempenho</div><div class="compare-row"><b>Escola</b><span>'+fmt(score,1)+'</span><span></span></div><div class="compare-row"><b>Município</b><span>'+fmt(comp.municipal,1)+'</span><span>'+((score!==null&&comp.municipal!==null)?fmt(score-comp.municipal,1)+' pts':'')+'</span></div><div class="compare-row"><b>Rede '+esc(norm(p.REDE))+'</b><span>'+fmt(comp.network,1)+'</span><span>'+((score!==null&&comp.network!==null)?fmt(score-comp.network,1)+' pts':'')+'</span></div><div class="compare-row"><b>Estado</b><span>'+fmt(comp.state,1)+'</span><span>'+((score!==null&&comp.state!==null)?fmt(score-comp.state,1)+' pts':'')+'</span></div>';
 if(ctx){html+='<div class="section-title">Perfil socioeconômico territorial</div><div class="cards">'+card('Renda média do setor',money(ctx.renda),'Setor censitário onde a escola está localizada')+card('PPI no setor',people(ctx.ppi),'População registrada na variável territorial')+'</div><div class="info">O contexto territorial descreve a área de localização da escola; não representa características individuais dos estudantes.</div>'}else html+='<div class="callout amber">O setor censitário ainda não pôde ser associado a esta escola.</div>';
 return html;
}
function renderPhase2(){
 if(!selectedSchool)return '<div class="empty-state">Selecione uma escola para encontrar escolas de contexto semelhante.</div>';
 var sims=similarSchools(selectedSchool),c=contextProfile(selectedSchool),stage=norm(selectedSchool.get('ETAPA')),score=schoolScore(selectedSchool,state.indicator),rows=sims.map(function(f){var cc=contextProfile(f),s=schoolScore(f,state.indicator),d=score===null||s===null?null:s-score;return '<div class="table-row"><div><strong>'+esc(schoolName(f))+'</strong><div class="rank">'+esc(norm(f.get('NO_MUNICIPIO')))+' · '+esc(norm(f.get('REDE')))+' </div></div><div>'+fmt(cc?cc.renda:null,0)+'</div><div>'+fmt(cc?cc.ppi:null,0)+'</div><div>'+fmt(s,1)+(d!==null?' <span class="rank">('+fmt(d,1)+')</span>':'')+'</div></div>'}).join('');
 var html='<div class="hero"><div class="analysis-kicker">FASE 2 · COMPARAR</div><h3>Escolas semelhantes a '+esc(schoolName(selectedSchool))+'</h3><div class="muted">Mesma etapa; proximidade de renda e PPI quando o contexto territorial está disponível.</div></div>';
 if(c)html+='<div class="cards">'+card('Renda da escola',money(c.renda),'Referência para a busca')+card('PPI da escola',people(c.ppi),'Referência para a busca')+'</div>';
 html+='<div class="section-title">Comparação com escolas de contexto semelhante</div><div class="table-like"><div class="table-head"><div>Escola</div><div>Renda</div><div>PPI</div><div>Nota</div></div>'+rows+'</div>';
 if(!rows)html+='<div class="callout amber">Não foram encontradas escolas comparáveis com os dados disponíveis.</div>';
 html+='<div class="callout green"><b>Como usar:</b> procure escolas que enfrentam condições territoriais próximas, mas apresentam resultados diferentes. Elas são bons pontos de partida para investigar práticas, organização e estratégias — sem assumir que os dados provem uma causa.</div>';
 return html;
}
function renderPhase3(){
 if(!state.municipio)return '<div class="empty-state"><b>Selecione um município</b><br><br>A fase 3 resume as escolas do município selecionado, respeitando a etapa escolhida.</div>';
 var s=municipalityStats(), html='<div class="hero"><div class="analysis-kicker">FASE 3 · MUNICÍPIO</div><h3>Panorama de '+esc(state.municipio)+'</h3><div class="muted">'+(state.etapa?esc(state.etapa):'Todas as etapas')+(state.rede?' · '+esc(state.rede):'')+'</div></div>';
 html+='<div class="cards">'+card('Escolas',fmt(s.count,0),'Registros no filtro atual')+card('IDEB médio',fmt(s.ideb,1),'Somente registros com IDEB disponível')+card('Português médio',fmt(s.port,1),s.portAdeq+' escolas acima do corte')+card('Matemática média',fmt(s.mat,1),s.matAdeq+' escolas acima do corte')+'</div>';
 var top=s.arr.filter(function(f){return schoolScore(f,state.indicator)!==null}).sort(function(a,b){return schoolScore(b,state.indicator)-schoolScore(a,state.indicator)}).slice(0,8);
 html+='<div class="section-title">Destaques de desempenho</div><div class="table-like"><div class="table-head" style="grid-template-columns:1.6fr .7fr .8fr"><div>Escola</div><div>Rede</div><div>Nota</div></div>'+top.map(function(f,i){return '<div class="table-row" style="grid-template-columns:1.6fr .7fr .8fr"><div><strong>'+esc(schoolName(f))+'</strong><div class="rank">#'+(i+1)+'</div></div><div>'+esc(norm(f.get('REDE')))+'</div><div>'+fmt(schoolScore(f,state.indicator),1)+'</div></div>'}).join('')+'</div>';
 html+='<div class="callout">Este panorama é descritivo. Uma média municipal pode esconder diferenças entre etapas, redes e contextos territoriais.</div>';
 return html;
}
function scatterSvg(data,selectedKey){
 var W=480,H=220,pad={l:42,r:15,t:15,b:34};var xs=data.map(function(d){return d.c.renda}),ys=data.map(function(d){return d.y});var xmin=Math.min.apply(null,xs),xmax=Math.max.apply(null,xs),ymin=Math.min.apply(null,ys),ymax=Math.max.apply(null,ys);if(xmin===xmax){xmin-=1;xmax+=1}if(ymin===ymax){ymin-=1;ymax+=1}function X(x){return pad.l+(x-xmin)/(xmax-xmin)*(W-pad.l-pad.r)}function Y(y){return H-pad.b-(y-ymin)/(ymax-ymin)*(H-pad.t-pad.b)}var html='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Renda por desempenho">';html+='<line x1="'+pad.l+'" y1="'+(H-pad.b)+'" x2="'+(W-pad.r)+'" y2="'+(H-pad.b)+'" stroke="#cbd5e1"/><line x1="'+pad.l+'" y1="'+pad.t+'" x2="'+pad.l+'" y2="'+(H-pad.b)+'" stroke="#cbd5e1"/><text x="'+(W/2)+'" y="'+(H-9)+'" text-anchor="middle" class="axis-label">Renda média do setor</text><text x="13" y="'+(H/2)+'" transform="rotate(-90 13 '+(H/2)+')" text-anchor="middle" class="axis-label">Desempenho</text>';
 data.slice(0,250).forEach(function(d){var key=schoolKey(d.f),sel=key===selectedKey;html+='<circle class="point" cx="'+X(d.c.renda)+'" cy="'+Y(d.y)+'" r="'+(sel?6:3.5)+'" fill="'+(sel?'#0f172a':'#2563eb')+'" opacity=".7"><title>'+esc(schoolName(d.f))+' · Renda '+money(d.c.renda)+' · Nota '+fmt(d.y,1)+'</title></circle>'});html+='</svg>';return html}
function renderPhase4(){
 if(!selectedSchool)return '<div class="empty-state">Selecione uma escola para analisar a relação entre contexto e desempenho.</div>';
 var data=findSchoolContextData(),model=regression(data),c=contextProfile(selectedSchool);if(!model||!c)return '<div class="callout amber">Não há dados territoriais suficientes para estimar o desempenho esperado. Ative Renda ou PPI e aguarde o carregamento.</div>';
 var expected=expectedFor(selectedSchool,model),obs=schoolScore(selectedSchool,state.indicator),res=obs-expected, name=state.indicator==='port'?'Português':'Matemática';
 var html='<div class="hero"><div class="analysis-kicker">FASE 4 · CONTEXTO × DESEMPENHO</div><h3>'+esc(name)+' e perfil territorial</h3><div class="muted">Modelo exploratório baseado em renda e PPI dos setores associados às escolas com dados disponíveis.</div></div>';
 html+='<div class="cards">'+card('Escolas no modelo',fmt(model.n,0),'Escolas com nota + setor associado')+card('R² do modelo',model.r2===null?'—':fmt(model.r2*100,1)+'%','Variação explicada pelo modelo simples')+card('Observado',fmt(obs,1),'Nota da escola')+card('Esperado',fmt(expected,1),(res>=0?'<span class="badge good">+'+fmt(res,1)+' acima</span>':'<span class="badge bad">'+fmt(res,1)+' abaixo</span>'))+'</div>';
 html+='<div class="section-title">Relação entre renda e desempenho</div>'+scatterSvg(data,schoolKey(selectedSchool));
 html+='<div class="section-title">Modelo exploratório</div><div class="formula">Nota esperada = '+fmt(model.beta[0],2)+' + ('+fmt(model.beta[1],5)+' × Renda) + ('+fmt(model.beta[2],5)+' × PPI)</div>';
 html+='<div class="callout amber"><b>Cuidado metodológico:</b> este modelo é exploratório e usa apenas duas variáveis territoriais. Ele não mede causalidade, não controla todas as características das escolas e não deve ser usado para ranquear unidades.</div>';
 html+='<div class="callout green"><b>O que investigar:</b> escolas com resíduo positivo podem ser interessantes para estudos de práticas e condições de funcionamento. O resultado é um sinal para investigação, não uma explicação pronta.</div>';
 return html;
}
function renderAnalysis(){var c=$('analysis-content');if(state.tab==='1')c.innerHTML=renderPhase1();if(state.tab==='2')c.innerHTML=renderPhase2();if(state.tab==='3')c.innerHTML=renderPhase3();if(state.tab==='4')c.innerHTML=renderPhase4()}
function openAnalysis(tab){state.tab=tab||state.tab;$('analysis-panel').classList.add('visible');document.querySelectorAll('.tab').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-tab')===state.tab)});$('analysis-title').textContent=state.tab==='1'?'Perfil da escola':state.tab==='2'?'Comparar escolas':state.tab==='3'?'Panorama municipal':'Contexto × desempenho';if((state.tab==='1'||state.tab==='2'||state.tab==='4')&&selectedSchool){showLoading('Preparando dados territoriais...');ensureContext(selectedSchool).then(function(){hideLoading();if(state.tab==='4'){return loadAllContexts().then(function(){renderAnalysis()})}renderAnalysis()}).catch(function(){hideLoading();renderAnalysis()})}else renderAnalysis()}
function loadAllContexts(){var arr=schoolFeatures.slice();var chain=Promise.resolve();arr.forEach(function(f){if(!analysisCache[schoolKey(f)])chain=chain.then(function(){var c=schoolContext(f);if(c)analysisCache[schoolKey(f)]=c});});return loadSetores().then(function(){return chain})}

/* --------------------- EVENTOS --------------------- */
$('municipio').addEventListener('change',function(){state.municipio=this.value;selectedSchool=null;if(state.municipio){var f=munFeatures.find(function(x){return norm(x.get('NM_MUN'))===state.municipio});if(f)map.getView().fit(f.getGeometry().getExtent(),{padding:[80,390,80,40],maxZoom:11,duration:500})}else map.getView().fit(jsonSource_Municipios_Mato_Grosso_do_Sul_2025_3.getExtent(),{padding:[80,380,70,40],maxZoom:8,duration:500});updateMap();renderAnalysis()});
$('etapa').addEventListener('change',function(){state.etapa=this.value;selectedSchool=null;updateMap();renderAnalysis()});
$('rede').addEventListener('change',function(){state.rede=this.value;selectedSchool=null;updateMap();renderAnalysis()});
$('port').addEventListener('click',function(){state.indicator='port';$('port').classList.add('active');$('mat').classList.remove('active');updateMap();if($('analysis-panel').classList.contains('visible'))renderAnalysis()});
$('mat').addEventListener('click',function(){state.indicator='mat';$('mat').classList.add('active');$('port').classList.remove('active');updateMap();if($('analysis-panel').classList.contains('visible'))renderAnalysis()});
$('escola').addEventListener('change',function(){var f=schoolFeatures.find(function(x){return schoolKey(x)===this.value},this);selectSchool(f,true)});
$('renda').addEventListener('click',function(){setTerritory('renda');$('renda').classList.toggle('active',state.renda);$('ppi').classList.toggle('active',state.ppi)});
$('ppi').addEventListener('click',function(){setTerritory('ppi');$('ppi').classList.toggle('active',state.ppi);$('renda').classList.toggle('active',state.renda)});
$('municipios').addEventListener('click',function(){state.municipios=!state.municipios;this.classList.toggle('active',state.municipios);updateMap()});
$('analise').addEventListener('click',function(){openAnalysis(state.tab)});$('close-analysis').addEventListener('click',function(){$('analysis-panel').classList.remove('visible')});$('close-panel').addEventListener('click',function(){$('control-panel').classList.add('collapsed');$('open-panel').classList.add('visible')});$('open-panel').addEventListener('click',function(){$('control-panel').classList.remove('collapsed');this.classList.remove('visible')});$('info-cut').addEventListener('click',function(){$('cutoff-info').style.display=$('cutoff-info').style.display==='block'?'none':'block'});$('reset').addEventListener('click',function(){state={etapa:'',rede:'',municipio:'',indicator:'port',renda:false,ppi:false,municipios:true,tab:'1'};selectedSchool=null;$('municipio').value='';$('etapa').value='';$('rede').value='';$('port').classList.add('active');$('mat').classList.remove('active');$('renda').classList.remove('active');$('ppi').classList.remove('active');$('municipios').classList.add('active');applySectorVisibility();updateMap();map.getView().fit(jsonSource_Municipios_Mato_Grosso_do_Sul_2025_3.getExtent(),{padding:[80,380,70,40],maxZoom:8,duration:600});if($('analysis-panel').classList.contains('visible'))renderAnalysis()});
document.querySelectorAll('.tab').forEach(function(b){b.addEventListener('click',function(){openAnalysis(this.getAttribute('data-tab'))})});
map.on('singleclick',function(evt){var hit=false;map.forEachFeatureAtPixel(evt.pixel,function(feature,layer){if(hit)return;if(layer===lyr_MetadePortugus_5||layer===lyr_MetadeMatemtica_4){if(visibleSchoolFeature(feature)){selectSchool(feature,true);hit=true}}else if(layer===setorRendaLayer||layer===setorPpiLayer){var p=feature.getProperties();$('analysis-title').textContent='Setor censitário';$('analysis-content').innerHTML='<div class="hero"><div class="analysis-kicker">CONTEXTO TERRITORIAL</div><h3>'+esc(norm(p.NM_MUN)||'Setor censitário')+'</h3><div class="muted">Código '+esc(norm(p.CD_SETOR))+'</div></div><div class="cards">'+card('Renda média',money(p.Renda),'Setor censitário')+card('PPI',people(p.PPI),'População na variável territorial')+'</div><div class="callout">O setor descreve o território de localização. Não representa, individualmente, todos os estudantes da escola.</div>';$('analysis-panel').classList.add('visible');document.querySelectorAll('.tab').forEach(function(b){b.classList.remove('active')});hit=true}}, {hitTolerance:6})});

fillFilters();updateMap();applySectorVisibility();
console.log('Mapa Educacional: aplicação analítica carregada. Escolas:',schoolFeatures.length,'Municípios:',munFeatures.length);
})();
