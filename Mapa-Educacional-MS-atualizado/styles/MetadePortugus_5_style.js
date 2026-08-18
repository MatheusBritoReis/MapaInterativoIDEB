var style_MetadePortugus_5 = function(feature, resolution){
    var value = Number(feature.get('VL_NOTA_PORTUGUES_2025'));
    var etapa = String(feature.get('ETAPA') || '').trim();

    var corte = {
        'Anos Iniciais': 200,
        'Anos Finais': 275,
        'Ensino Médio': 300
    }[etapa];

    var color = 'rgba(148,163,184,0.95)'; // sem informação

    if (Number.isFinite(value) && Number.isFinite(corte)) {
        color = value > corte
            ? 'rgba(22,163,74,0.95)'
            : 'rgba(220,38,38,0.95)';
    }

    return [new ol.style.Style({
        image: new ol.style.Circle({
            radius: 8,
            displacement: [0,0],
            stroke: new ol.style.Stroke({
                color: 'rgba(255,255,255,0.95)',
                width: 1.5
            }),
            fill: new ol.style.Fill({color: color})
        })
    })];
};
