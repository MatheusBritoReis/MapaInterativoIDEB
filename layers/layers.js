/* ============================================================
   LAYERS.JS
   MAPA EDUCACIONAL - MATO GROSSO DO SUL

   CAMADAS CARREGADAS NA ABERTURA:
   1. Google Satellite
   2. Municípios
   3. Escolas

   CAMADAS SOB DEMANDA:
   4. Renda
   5. PPI

   IMPORTANTE:
   Renda e PPI NÃO são carregadas neste arquivo.
   ============================================================ */

var wms_layers = [];


/* ============================================================
   1. GOOGLE SATELLITE
   ============================================================ */

var lyr_GoogleSatellite_0 = new ol.layer.Tile({

    title: 'Google Satellite',

    opacity: 1,

    source: new ol.source.XYZ({

        attributions:
            '<a href="https://www.google.at/permissions/geoguidelines/attr-guide.html" target="_blank">Map data ©2015 Google</a>',

        url:
            'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'

    })

});


/* ============================================================
   2. MUNICÍPIOS
   ============================================================ */

var format_Municipios_MS_2025 =
    new ol.format.GeoJSON();


var features_Municipios_MS_2025 =
    format_Municipios_MS_2025.readFeatures(

        json_Municipios_MS_2025_otimizado,

        {
            dataProjection: 'EPSG:4326',

            featureProjection: 'EPSG:3857'

        }

    );


var jsonSource_Municipios_Mato_Grosso_do_Sul_2025_3 =
    new ol.source.Vector({

        attributions: ' '

    });


jsonSource_Municipios_Mato_Grosso_do_Sul_2025_3
    .addFeatures(
        features_Municipios_MS_2025
    );


var lyr_Municipios_Mato_Grosso_do_Sul_2025_3 =
    new ol.layer.Vector({

        source:
            jsonSource_Municipios_Mato_Grosso_do_Sul_2025_3,

        style:
            style_Municipios_Mato_Grosso_do_Sul_2025_3,

        popuplayertitle:
            'Municípios de Mato Grosso do Sul',

        interactive:
            true,

        title:
            'Municípios de Mato Grosso do Sul'

    });


/* ============================================================
   3. ESCOLAS
   ============================================================ */

/*
   Existe uma única base de escolas.

   Matemática e Português usam a mesma fonte.

   Isso evita carregar os mesmos pontos duas vezes.
*/


var format_Escolas_IDEB_2025 =
    new ol.format.GeoJSON();


var features_Escolas_IDEB_2025 =
    format_Escolas_IDEB_2025.readFeatures(

        json_Escolas_IDEB_2025,

        {
            dataProjection: 'EPSG:4326',

            featureProjection: 'EPSG:3857'

        }

    );


var jsonSource_Escolas_IDEB_2025 =
    new ol.source.Vector({

        attributions: ' '

    });


jsonSource_Escolas_IDEB_2025
    .addFeatures(
        features_Escolas_IDEB_2025
    );


/* ============================================================
   3.1 MATEMÁTICA
   ============================================================ */

var jsonSource_MetadeMatemtica_4 =
    jsonSource_Escolas_IDEB_2025;


var lyr_MetadeMatemtica_4 =
    new ol.layer.Vector({

        source:
            jsonSource_Escolas_IDEB_2025,

        style:
            style_MetadeMatemtica_4,

        popuplayertitle:
            'Desempenho de Matemática',

        interactive:
            true,

        title:
            'Desempenho de Matemática'

    });


/* ============================================================
   3.2 PORTUGUÊS
   ============================================================ */

var jsonSource_MetadePortugus_5 =
    jsonSource_Escolas_IDEB_2025;


var lyr_MetadePortugus_5 =
    new ol.layer.Vector({

        source:
            jsonSource_Escolas_IDEB_2025,

        style:
            style_MetadePortugus_5,

        popuplayertitle:
            'Desempenho de Português',

        interactive:
            true,

        title:
            'Desempenho de Português'

    });


/* ============================================================
   VISIBILIDADE INICIAL
   ============================================================ */


/*
   Satélite:
   VISÍVEL
*/

lyr_GoogleSatellite_0.setVisible(
    true
);


/*
   Municípios:
   VISÍVEL
*/

lyr_Municipios_Mato_Grosso_do_Sul_2025_3
    .setVisible(
        true
    );


/*
   Português:
   VISÍVEL
*/

lyr_MetadePortugus_5
    .setVisible(
        true
    );


/*
   Matemática:
   OCULTA

   O usuário poderá ativá-la pelo painel.
*/

lyr_MetadeMatemtica_4
    .setVisible(
        false
    );


/* ============================================================
   LISTA DE CAMADAS INICIAIS
   ============================================================ */

/*
   SOMENTE estas camadas entram no mapa inicialmente.

   Renda e PPI NÃO entram aqui.
*/

var layersList = [

    lyr_GoogleSatellite_0,

    lyr_Municipios_Mato_Grosso_do_Sul_2025_3,

    lyr_MetadeMatemtica_4,

    lyr_MetadePortugus_5

];


/* ============================================================
   ALIASES
   ============================================================ */

lyr_Municipios_Mato_Grosso_do_Sul_2025_3.set(
    'fieldAliases',
    {

        'CD_MUN':
            'Código do município',

        'NM_MUN':
            'Município',

        'CD_UF':
            'Código UF',

        'SIGLA_UF':
            'UF'

    }
);


lyr_MetadeMatemtica_4.set(
    'fieldAliases',
    {

        'ID_ESCOLA':
            'ID da escola',

        'NO_ESCOLA':
            'Nome da escola',

        'NO_MUNICIPIO':
            'Município',

        'ETAPA':
            'Etapa',

        'SG_UF':
            'UF',

        'CO_MUNICIPIO':
            'Código do município',

        'REDE':
            'Rede',

        'VL_INDICADOR_REND_2025':
            'Indicador de rendimento 2025',

        'VL_NOTA_MATEMATICA_2025':
            'Nota de Matemática 2025',

        'VL_NOTA_PORTUGUES_2025':
            'Nota de Português 2025',

        'VL_NOTA_MEDIA_2025':
            'Nota média 2025',

        'VL_OBSERVADO_2025':
            'IDEB observado 2025',

        'LATITUDE':
            'Latitude',

        'LONGITUDE':
            'Longitude',

        'META_MAT':
            'Desempenho adequado em Matemática',

        'META_PORT':
            'Desempenho adequado em Português'

    }
);


lyr_MetadePortugus_5.set(
    'fieldAliases',
    {

        'ID_ESCOLA':
            'ID da escola',

        'NO_ESCOLA':
            'Nome da escola',

        'NO_MUNICIPIO':
            'Município',

        'ETAPA':
            'Etapa',

        'SG_UF':
            'UF',

        'CO_MUNICIPIO':
            'Código do município',

        'REDE':
            'Rede',

        'VL_INDICADOR_REND_2025':
            'Indicador de rendimento 2025',

        'VL_NOTA_MATEMATICA_2025':
            'Nota de Matemática 2025',

        'VL_NOTA_PORTUGUES_2025':
            'Nota de Português 2025',

        'VL_NOTA_MEDIA_2025':
            'Nota média 2025',

        'VL_OBSERVADO_2025':
            'IDEB observado 2025',

        'LATITUDE':
            'Latitude',

        'LONGITUDE':
            'Longitude',

        'META_MAT':
            'Desempenho adequado em Matemática',

        'META_PORT':
            'Desempenho adequado em Português'

    }
);


/* ============================================================
   CONFIGURAÇÕES DE POPUP
   ============================================================ */

lyr_Municipios_Mato_Grosso_do_Sul_2025_3.set(
    'fieldImages',
    {

        'CD_MUN':
            'TextEdit',

        'NM_MUN':
            'TextEdit',

        'CD_UF':
            'TextEdit',

        'SIGLA_UF':
            'TextEdit'

    }
);


lyr_MetadeMatemtica_4.set(
    'fieldImages',
    {

        'ID_ESCOLA':
            'TextEdit',

        'NO_ESCOLA':
            'TextEdit',

        'NO_MUNICIPIO':
            'TextEdit',

        'ETAPA':
            'TextEdit',

        'SG_UF':
            'TextEdit',

        'CO_MUNICIPIO':
            'TextEdit',

        'REDE':
            'TextEdit',

        'VL_INDICADOR_REND_2025':
            'TextEdit',

        'VL_NOTA_MATEMATICA_2025':
            'TextEdit',

        'VL_NOTA_PORTUGUES_2025':
            'TextEdit',

        'VL_NOTA_MEDIA_2025':
            'TextEdit',

        'VL_OBSERVADO_2025':
            'TextEdit',

        'LATITUDE':
            'TextEdit',

        'LONGITUDE':
            'TextEdit',

        'META_MAT':
            'TextEdit',

        'META_PORT':
            'TextEdit'

    }
);


lyr_MetadePortugus_5.set(
    'fieldImages',
    {

        'ID_ESCOLA':
            'TextEdit',

        'NO_ESCOLA':
            'TextEdit',

        'NO_MUNICIPIO':
            'TextEdit',

        'ETAPA':
            'TextEdit',

        'SG_UF':
            'TextEdit',

        'CO_MUNICIPIO':
            'TextEdit',

        'REDE':
            'TextEdit',

        'VL_INDICADOR_REND_2025':
            'TextEdit',

        'VL_NOTA_MATEMATICA_2025':
            'TextEdit',

        'VL_NOTA_PORTUGUES_2025':
            'TextEdit',

        'VL_NOTA_MEDIA_2025':
            'TextEdit',

        'VL_OBSERVADO_2025':
            'TextEdit',

        'LATITUDE':
            'TextEdit',

        'LONGITUDE':
            'TextEdit',

        'META_MAT':
            'TextEdit',

        'META_PORT':
            'TextEdit'

    }
);


/* ============================================================
   FINALIZAÇÃO
   ============================================================ */

/*
   NÃO colocar Renda aqui.
   NÃO colocar PPI aqui.

   NÃO fazer:

   var format_Renda_1 = ...
   readFeatures(json_Renda_1)

   NÃO fazer:

   var format_PPI_2 = ...
   readFeatures(json_PPI_2)

   Essas camadas serão adicionadas posteriormente.
*/

console.log(
    'Mapa Educacional: camadas iniciais carregadas.'
);

console.log(
    'Renda e PPI: carregamento adiado.'
);
