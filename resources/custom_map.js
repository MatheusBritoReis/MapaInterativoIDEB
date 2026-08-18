
(function(){
'use strict';

var map = new ol.Map({
    target: 'map',
    layers: [lyr_GoogleSatellite_0, lyr_Renda_1, lyr_PPI_2, lyr_Municipios_Mato_Grosso_do_Sul_2025_3, lyr_MetadeMatemtica_4, lyr_MetadePortugus_5],
    view: new ol.View({
        center: ol.proj.fromLonLat([-54.5, -20.5]),
        zoom: 6.2
    }),
    controls: ol.control.defaults({zoom:false, attribution:true, rotate:false}).extend([
        new ol.control.Zoom(),
        new ol.control.ScaleLine()
    ])
});

var state = {
    etapa: '',
    rede: '',
    municipio: '',
    escola: '',
    indicator: 'port',
    renda: true,
    ppi: true,
    municipios: true
};

var schoolFeatures = jsonSource_Escolas_IDEB_2025.getFeatures();
var munFeatures = jsonSource_Municipios_Mato_Grosso_do_Sul_2025_3.getFeatures();

function norm(v){ return v === null || v === undefined ? '' : String(v).trim(); }
function uniqueSorted(arr){
    return Array.from(new Set(arr.filter(Boolean))).sort(function(a,b){
        return a.localeCompare(b,'pt-BR');
    });
}
function optionHTML(items, placeholder){
    return '<option value="">' + placeholder + '</option>' +
        items.map(function(x){ return '<option value="' + esc(x) + '">' + esc(x) + '</option>'; }).join('');
}
function esc(v){
    return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function matchesSchool(f){
    var p=f.getProperties();
    if(state.etapa && norm(p.ETAPA)!==state.etapa) return false;
    if(state.rede && norm(p.REDE)!==state.rede) return false;
    if(state.municipio && norm(p.NO_MUNICIPIO)!==state.municipio) return false;
    if(state.escola && norm(p.ID_ESCOLA)!==state.escola) return false;
    return true;
}
function matchesSector(f){
    if(!state.municipio) return true;
    var p=f.getProperties();
    return norm(p.NM_MUN)===state.municipio || norm(p.NO_MUNICIPIO)===state.municipio;
}

function applyStyles(){
    lyr_Renda_1.setVisible(state.renda);
    lyr_PPI_2.setVisible(state.ppi);
    lyr_Municipios_Mato_Grosso_do_Sul_2025_3.setVisible(state.municipios);

    lyr_Renda_1.setStyle(function(feature,resolution){
        return matchesSector(feature) ? style_Renda_1(feature,resolution) : null;
    });
    lyr_PPI_2.setStyle(function(feature,resolution){
        return matchesSector(feature) ? style_PPI_2(feature,resolution) : null;
    });

    var activeStyle = state.indicator === 'mat' ? style_MetadeMatemtica_4 : style_MetadePortugus_5;
    var activeLayer = state.indicator === 'mat' ? lyr_MetadeMatemtica_4 : lyr_MetadePortugus_5;
    var inactiveLayer = state.indicator === 'mat' ? lyr_MetadePortugus_5 : lyr_MetadeMatemtica_4;
    inactiveLayer.setVisible(false);
    activeLayer.setVisible(true);
    activeLayer.setStyle(function(feature,resolution){
        return matchesSchool(feature) ? activeStyle(feature,resolution) : null;
    });

    lyr_Municipios_Mato_Grosso_do_Sul_2025_3.setStyle(function(feature){
        var p=feature.getProperties();
        var selected=state.municipio && norm(p.NM_MUN)===state.municipio;
        if(state.municipio && !selected) return null;
        return new ol.style.Style({
            stroke:new ol.style.Stroke({
                color:selected?'rgba(37,99,235,1)':'rgba(255,255,255,.9)',
                width:selected?4:1.5
            }),
            fill:new ol.style.Fill({color:selected?'rgba(37,99,235,.06)':'rgba(0,0,0,0)'})
        });
    });

    updateSchoolSelect();
    updateCount();
}

function updateSchoolSelect(){
    var sel=document.getElementById('school-select');
    var candidates=schoolFeatures.filter(function(f){
        var p=f.getProperties();
        if(state.etapa && norm(p.ETAPA)!==state.etapa) return false;
        if(state.rede && norm(p.REDE)!==state.rede) return false;
        if(state.municipio && norm(p.NO_MUNICIPIO)!==state.municipio) return false;
        return true;
    }).sort(function(a,b){
        return norm(a.get('NO_ESCOLA')).localeCompare(norm(b.get('NO_ESCOLA')),'pt-BR');
    });
    var seen={};
    var opts=[];
    candidates.forEach(function(f){
        var name=norm(f.get('NO_ESCOLA'));
        var id=norm(f.get('ID_ESCOLA'));
        if(name && !seen[id+'|'+name]){
            seen[id+'|'+name]=true;
            opts.push({name:name,id:id});
        }
    });
    sel.innerHTML='<option value="">Todas as escolas ('+opts.length+')</option>'+
        opts.map(function(o){return '<option value="'+esc(o.id)+'">'+esc(o.name)+'</option>';}).join('');
    if(state.escola){
        var found=opts.find(function(o){return o.id===state.escola;});
        sel.value=found?found.id:'';
        if(!found) state.escola='';
    }
}

function updateCount(){
    var visible=schoolFeatures.filter(matchesSchool);
    document.getElementById('school-count').textContent=visible.length+' escola'+(visible.length===1?'':'s');
}

function fillMunicipios(){
    var names=uniqueSorted(munFeatures.map(function(f){return norm(f.get('NM_MUN'));}));
    document.getElementById('municipio-select').innerHTML=optionHTML(names,'Todos os municípios');
}
function fillEtapas(){
    var names=uniqueSorted(schoolFeatures.map(function(f){return norm(f.get('ETAPA'));}));
    document.getElementById('etapa-select').innerHTML=optionHTML(names,'Todas as etapas');
}
function fillRedes(){
    var names=uniqueSorted(schoolFeatures.map(function(f){return norm(f.get('REDE'));}));
    document.getElementById('rede-select').innerHTML=optionHTML(names,'Todas as redes');
}

function selectMunicipio(name){
    state.municipio=name;
    state.escola='';
    document.getElementById('school-select').value='';
    if(name){
        var f=munFeatures.find(function(x){return norm(x.get('NM_MUN'))===name;});
        if(f){
            map.getView().fit(f.getGeometry().getExtent(),{padding:[90,390,90,40],maxZoom:11,duration:700});
        }
    }else{
        map.getView().fit(ol.extent.boundingExtent(munFeatures.map(function(f){return f.getGeometry().getExtent();})),{padding:[100,380,70,40],maxZoom:8,duration:700});
    }
    applyStyles();
}

function selectSchool(id){
    state.escola=id;
    var f=schoolFeatures.find(function(x){return norm(x.get('ID_ESCOLA'))===id;});
    if(f){
        map.getView().animate({center:f.getGeometry().getCoordinates(),zoom:15,duration:700});
        showPopup(f);
        highlightFeature(f);
    }
    applyStyles();
}
var selectedSource=new ol.source.Vector();
var selectedLayer=new ol.layer.Vector({
    source:selectedSource,
    zIndex:100,
    style:new ol.style.Style({
        image:new ol.style.Circle({
            radius:12,
            fill:new ol.style.Fill({color:'rgba(37,99,235,.18)'}),
            stroke:new ol.style.Stroke({color:'#fff',width:3})
        })
    })
});
map.addLayer(selectedLayer);

function highlightFeature(f){
    selectedSource.clear();
    selectedSource.addFeature(f.clone());
    selectedSource.getFeatures()[0].setGeometry(f.getGeometry().clone());
}

function fmt(v){
    if(v===null || v===undefined || v==='' || v==='-' || v==='ND') return '—';
    var n=Number(String(v).replace(',','.'));
    return Number.isFinite(n) ? n.toLocaleString('pt-BR',{maximumFractionDigits:2}) : esc(v);
}
function boolPill(v){
    var x=norm(v).toLowerCase();
    if(!x) return '<span class="pill missing">SN</span>';
    return x==='sim'?'<span class="pill yes">Sim</span>':'<span class="pill no">Não</span>';
}
function showPopup(f){
    var p=f.getProperties();
    var title=norm(p.NO_ESCOLA)||'Escola';
    document.getElementById('popup-body').innerHTML=
      '<div class="popup-type">ESCOLA</div>'+
      '<h3>'+esc(title)+'</h3>'+
      '<div class="popup-grid">'+
      '<div><b>Município</b><span>'+esc(norm(p.NO_MUNICIPIO))+'</span></div>'+
      '<div><b>Rede</b><span>'+esc(norm(p.REDE))+'</span></div>'+
      '<div><b>Etapa</b><span>'+esc(norm(p.ETAPA))+'</span></div>'+
      '<div><b>ID</b><span>'+esc(norm(p.ID_ESCOLA))+'</span></div>'+
      '<div><b>Meta de Português</b><span>'+boolPill(p.META_PORT)+'</span></div>'+
      '<div><b>Meta de Matemática</b><span>'+boolPill(p.META_MAT)+'</span></div>'+
      '<div><b>Nota de Português 2025</b><span>'+fmt(p.VL_NOTA_PORTUGUES_2025)+'</span></div>'+
      '<div><b>Nota de Matemática 2025</b><span>'+fmt(p.VL_NOTA_MATEMATICA_2025)+'</span></div>'+
      '<div><b>Indicador de rendimento 2025</b><span>'+fmt(p.VL_INDICADOR_REND_2025)+'</span></div>'+
      '<div><b>Ideb observado 2025</b><span>'+fmt(p.VL_OBSERVADO_2025)+'</span></div>'+
      '</div>'+
      '<div class="popup-foot">Os dados exibidos são os atributos disponíveis na base escolar utilizada no mapa.</div>';
    document.getElementById('custom-popup').classList.add('visible');
}
function showSectorPopup(f){
    var p=f.getProperties();
    var rendaFeature=null, ppiFeature=null;
    var coord=f.getGeometry().getInteriorPoint ? f.getGeometry().getInteriorPoint().getCoordinates() : null;
    document.getElementById('popup-body').innerHTML=
      '<div class="popup-type">SETOR CENSITÁRIO</div>'+
      '<h3>'+esc(norm(p.NM_MUN)||'Setor censitário')+'</h3>'+
      '<div class="popup-grid">'+
      '<div><b>Município</b><span>'+esc(norm(p.NM_MUN))+'</span></div>'+
      '<div><b>Código do setor</b><span>'+esc(norm(p.CD_SETOR))+'</span></div>'+
      '<div class="wide"><b>Indicador exibido</b><span>Selecione Renda ou PPI no painel para visualizar a distribuição por setor.</span></div>'+
      '</div>';
    document.getElementById('custom-popup').classList.add('visible');
}

map.on('singleclick',function(evt){
    var hit=false;
    map.forEachFeatureAtPixel(evt.pixel,function(feature,layer){
        if(hit) return;
        if(layer===selectedLayer) return;
        if(layer===lyr_MetadePortugus_5 || layer===lyr_MetadeMatemtica_4){
            showPopup(feature);
            highlightFeature(feature);
            state.escola=norm(feature.get('ID_ESCOLA'));
            document.getElementById('school-select').value=state.escola;
            hit=true;
        }else if(layer===lyr_Renda_1 || layer===lyr_PPI_2){
            showSectorPopup(feature);
            hit=true;
        }
    },{hitTolerance:5});
});

document.getElementById('etapa-select').addEventListener('change',function(){
    state.etapa=this.value; state.escola=''; selectedSource.clear(); applyStyles();
});
document.getElementById('rede-select').addEventListener('change',function(){
    state.rede=this.value; state.escola=''; selectedSource.clear(); applyStyles();
});
document.getElementById('municipio-select').addEventListener('change',function(){selectMunicipio(this.value);});
document.getElementById('school-select').addEventListener('change',function(){if(this.value) selectSchool(this.value); else {state.escola='';selectedSource.clear();applyStyles();}});
document.getElementById('indicator-port').addEventListener('click',function(){state.indicator='port';setIndicatorButtons();applyStyles();});
document.getElementById('indicator-mat').addEventListener('click',function(){state.indicator='mat';setIndicatorButtons();applyStyles();});
function setIndicatorButtons(){
    document.getElementById('indicator-port').classList.toggle('active',state.indicator==='port');
    document.getElementById('indicator-mat').classList.toggle('active',state.indicator==='mat');
}
document.getElementById('toggle-renda').addEventListener('click',function(){state.renda=!state.renda;this.classList.toggle('active',state.renda);lyr_Renda_1.setVisible(state.renda);});
document.getElementById('toggle-ppi').addEventListener('click',function(){state.ppi=!state.ppi;this.classList.toggle('active',state.ppi);lyr_PPI_2.setVisible(state.ppi);});
document.getElementById('toggle-municipios').addEventListener('click',function(){state.municipios=!state.municipios;this.classList.toggle('active',state.municipios);lyr_Municipios_Mato_Grosso_do_Sul_2025_3.setVisible(state.municipios);});
document.getElementById('reset-btn').addEventListener('click',function(){
    state={etapa:'',rede:'',municipio:'',escola:'',indicator:'port',renda:true,ppi:true,municipios:true};
    document.getElementById('etapa-select').value='';
    document.getElementById('rede-select').value='';
    document.getElementById('municipio-select').value='';
    document.getElementById('school-select').value='';
    document.getElementById('toggle-renda').classList.add('active');
    document.getElementById('toggle-ppi').classList.add('active');
    document.getElementById('toggle-municipios').classList.add('active');
    setIndicatorButtons(); selectedSource.clear();
    map.getView().fit(ol.extent.boundingExtent(munFeatures.map(function(f){return f.getGeometry().getExtent();})),{padding:[100,380,70,40],maxZoom:8,duration:700});
    applyStyles();
    document.getElementById('custom-popup').classList.remove('visible');
});
document.getElementById('popup-close').addEventListener('click',function(){document.getElementById('custom-popup').classList.remove('visible');selectedSource.clear();});

document.getElementById('close-panel').addEventListener('click',function(){document.getElementById('control-panel').classList.add('collapsed');document.getElementById('open-panel').classList.add('visible');});
document.getElementById('open-panel').addEventListener('click',function(){document.getElementById('control-panel').classList.remove('collapsed');this.classList.remove('visible');});

fillMunicipios(); fillEtapas(); fillRedes(); setIndicatorButtons();
document.getElementById('toggle-renda').classList.add('active');
document.getElementById('toggle-ppi').classList.add('active');
document.getElementById('toggle-municipios').classList.add('active');
applyStyles();

setTimeout(function(){
    map.getView().fit(ol.extent.boundingExtent(munFeatures.map(function(f){return f.getGeometry().getExtent();})),{padding:[100,380,70,40],maxZoom:8});
},50);

})();
