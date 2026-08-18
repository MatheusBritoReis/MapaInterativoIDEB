# Mapa Educacional — MS | Versão Analítica

Esta versão amplia o projeto original com quatro fases de análise:

1. **Minha escola** — perfil de desempenho, comparação com município, rede e estado, além do contexto territorial.
2. **Comparar** — escolas da mesma etapa com contexto territorial semelhante.
3. **Município** — panorama municipal com médias, quantidade de escolas e destaques de desempenho.
4. **Contexto × desempenho** — gráfico de dispersão, regressão exploratória usando Renda + PPI e cálculo de desempenho esperado.

## Como publicar no GitHub Pages

Substitua o conteúdo do repositório pelos arquivos desta pasta, mantendo as pastas `layers`, `resources`, `styles`, `webfonts` e os respectivos arquivos de dados.

O arquivo principal continua sendo `index.html`.

## Arquivos novos/modificados

- `index.html` — nova interface e estrutura dos quatro módulos.
- `app.js` — toda a lógica do mapa, filtros, contexto territorial, comparações e análise estatística.
- `README.md` — documentação desta versão.

Os grandes arquivos de dados originais foram preservados.

## Observação metodológica

A fase 4 é deliberadamente apresentada como **modelo exploratório**. O cálculo usa apenas Renda e PPI territoriais e não permite afirmar causalidade. O resultado de “acima/abaixo do esperado” deve ser usado como sinal para investigação e não como ranking ou avaliação da escola.

## Dados territoriais

`layers/setores_renda_ppi.geojson` é carregado sob demanda. Isso evita baixar aproximadamente 25 MB de dados territoriais na abertura do site e só solicita essa base quando o usuário ativa Renda/PPI ou abre uma análise que depende do contexto.
