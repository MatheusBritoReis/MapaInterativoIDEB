# Mapa Educacional — MS

Versão ampliada do mapa interativo de escolas e indicadores educacionais de Mato Grosso do Sul.

## Funcionalidades implementadas

A versão inclui busca por escola ou município, filtros por desempenho em relação ao ponto de corte, filtro de disponibilidade do IDEB, painel-resumo com média, mediana, cobertura de dados e percentual acima do corte, comparação das escolas selecionadas com a média do grupo filtrado, perfil territorial aproximado no popup, explicações metodológicas, exportação da seleção filtrada em CSV e compartilhamento dos filtros por URL.

As camadas de Renda e PPI continuam carregadas sob demanda. Quando uma camada territorial é carregada, o popup de uma escola pode apresentar o setor censitário correspondente, com Renda e PPI disponíveis, acompanhado de aviso metodológico sobre a natureza aproximada do contexto.

## Como executar localmente

Por ser uma aplicação estática, basta abrir `index.html` em um servidor HTTP simples. No GitHub Pages, não é necessário instalar dependências: publique o conteúdo desta pasta como site estático.

## Publicação no GitHub Pages

Envie todos os arquivos e pastas desta pasta para o repositório, mantendo a estrutura relativa. Em seguida, no GitHub, acesse **Settings → Pages**, selecione a branch e a pasta de publicação e aguarde a geração do endereço público.

## Cuidados com a interpretação

Renda e PPI são indicadores territoriais aproximados. Eles não representam necessariamente todas as famílias atendidas por uma escola e não devem ser interpretados como causas diretas do desempenho. Valores ausentes são apresentados como “Sem informação” e não como zero.

Os indicadores devem ser lidos considerando etapa, rede, cobertura dos dados, trajetória e contexto. O painel-resumo é uma ferramenta descritiva para apoiar investigação pedagógica; não é um ranking de escolas.

## Arquivos principais

| Arquivo ou pasta | Função |
|---|---|
| `index.html` | Interface, mapa, filtros, painéis analíticos e lógica de interação |
| `layers/` | Dados GeoJSON/JavaScript das escolas, municípios e setores territoriais |
| `styles/` | Estilos cartográficos das camadas de escolas e municípios |
| `resources/` | Bibliotecas e recursos locais do mapa |
| `webfonts/` | Fonte usada pelos ícones da interface |
