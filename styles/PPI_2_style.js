/* 
 * PPI — classificação por desvio padrão
 * Escala: branco → azul escuro.
 *
 * Classes:
 * < -2σ | -2σ a -1σ | -1σ a 0 | 0 a +1σ | +1σ a +2σ | > +2σ
 *
 * A média e o desvio padrão são calculados uma única vez
 * sobre os valores válidos da camada.
 */

var style_PPI_2_stats = null;

function get_style_PPI_2_stats() {
    if (style_PPI_2_stats) return style_PPI_2_stats;

    var features = (typeof setoresSource !== 'undefined' && setoresSource.getFeatures)
        ? setoresSource.getFeatures()
        : [];

    var values = features
        .map(function(f) { return Number(f.get('PPI')); })
        .filter(function(v) { return Number.isFinite(v); });

    if (!values.length) {
        style_PPI_2_stats = {mean: 0, sd: 0, n: 0};
        return style_PPI_2_stats;
    }

    var mean = values.reduce(function(a,b) { return a+b; }, 0) / values.length;

    var variance = values.reduce(function(sum, v) {
        return sum + Math.pow(v - mean, 2);
    }, 0) / values.length;

    style_PPI_2_stats = {
        mean: mean,
        sd: Math.sqrt(variance),
        n: values.length
    };

    return style_PPI_2_stats;
}

var style_PPI_2 = function(feature, resolution) {
    var context = {
        feature: feature,
        variables: {}
    };

    var labelText = "";
    var value = Number(feature.get("PPI"));

    if (!Number.isFinite(value)) return null;

    var labelFont = "10px, sans-serif";
    var labelFill = "#000000";
    var bufferColor = "";
    var bufferWidth = 0;
    var textAlign = 'left';
    var offsetX = 8;
    var offsetY = 3;
    var overflow = false;
    var repeat = 0;
    var placement = 'point';

    var stats = get_style_PPI_2_stats();
    var mean = stats.mean;
    var sd = stats.sd;

    /*
     * Se o desvio padrão for zero, todos os valores são iguais.
     * Nesse caso usamos azul médio para evitar divisão por zero.
     */
    var color = 'rgba(59,130,246,0.91)';

    if (sd > 0) {
        if (value < mean - 2 * sd) {
            color = 'rgba(239,246,255,0.91)';
        } else if (value < mean - sd) {
            color = 'rgba(191,219,254,0.91)';
        } else if (value < mean) {
            color = 'rgba(147,197,253,0.91)';
        } else if (value <= mean + sd) {
            color = 'rgba(96,165,250,0.91)';
        } else if (value <= mean + 2 * sd) {
            color = 'rgba(37,99,235,0.91)';
        } else {
            color = 'rgba(30,64,175,0.91)';
        }
    }

    return [new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(35,35,35,0.55)',
            lineDash: null,
            lineCap: 'butt',
            lineJoin: 'miter',
            width: 0.8
        }),
        fill: new ol.style.Fill({color: color}),
        text: createTextStyle(
            feature, resolution, labelText, labelFont,
            labelFill, placement, bufferColor,
            bufferWidth, textAlign, offsetX, offsetY,
            overflow, repeat
        )
    })];
};
