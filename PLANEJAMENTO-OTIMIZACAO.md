# Meu Caribe — Planejamento de Otimização

> **Regra que vale para todas as fases: o layout não muda.**
> Nenhuma cor, fonte, espaçamento, tamanho de elemento, animação ou texto é alterado.
> Toda mudança abaixo é invisível para o visitante — ele só percebe que o site ficou rápido.

Data da auditoria: 09/08/2026
Base: código local + produção (`meucaribemaragogi.com.br`) + PageSpeed Insights

---

## 1. Estado atual

| Métrica | Valor | Meta |
|---|---|---|
| Core Web Vitals (campo) | **Reprovado** | Aprovado |
| LCP (usuários reais) | 3,1 s | ≤ 2,5 s |
| INP (usuários reais) | 202 ms | ≤ 200 ms |
| CLS (usuários reais) | 0,09 ✅ | ≤ 0,1 |
| Nota Performance (lab) | 62 | ≥ 90 |
| Peso da home | 8,1 MB | < 1,5 MB |
| Acessibilidade / Práticas / SEO | 100 / 100 / 92 | manter |

**Repositório:** 133 arquivos, 54,9 MB (fora `.git` e `node_modules`).
Desses, **50,8 MB são imagens** — 92% do projeto.

---

## 1.1 Os dois placares do PageSpeed (importante)

A ferramenta mostra **duas avaliações independentes**, e só uma delas é a que "passa":

| | O que é | Como melhora |
|---|---|---|
| **Nota 62 (Desempenho)** | Simulação em laboratório, Moto G em 4G lento. Roda na hora | Reflete **imediatamente** após o deploy |
| **"Core Web Vitals: reprovado"** | Chrome UX Report — usuários reais, últimos 28 dias, percentil 75 | Só muda **~28 dias depois**, conforme o tráfego real renova a amostra |

Passar é sobre o segundo. E o percentil 75 significa que o alvo é o **quarto mais lento** dos seus visitantes — celular modesto, 4G ruim, em Maragogi.

Além disso o CrUX mede também no nível de **origem** (o botão "Origem" ao lado de "Este URL"), agregando todas as páginas. Otimizar só a home não faz o domínio passar.

### Peso real de cada página (medido em produção)

| Página | Imagens | Peso em imagens |
|---|---|---|
| `/` | 38 | **11,82 MB** |
| `/aventura-aquatica` | 20 | **9,01 MB** |
| `/passeios-lancha` | 22 | **8,35 MB** |
| `/sobre` | 7 | **4,44 MB** |
| `/contato` | 7 | 0,57 MB |
| `/tabua-mares` | 6 | 0,49 MB |

`/sobre` tem só 7 imagens e mesmo assim pesa 4,44 MB — porque **carrega a mesma foto duas vezes**: `lancha2.jpeg` (3.135 KB, banner via CSS) e `lancha2.webp` (1.240 KB, no HTML). Mesma imagem, dois arquivos, 4,3 MB.

### Onde estão os 38 pontos que faltam

A nota é composta por cinco métricas com pesos fixos:

| Métrica | Peso | Situação hoje | Pontos |
|---|---|---|---|
| Total Blocking Time | 30% | 30 ms | ✅ **30/30** |
| Cumulative Layout Shift | 25% | 0,042 | ✅ **25/25** |
| Largest Contentful Paint | 25% | 10,1 s | ❌ 0/25 |
| First Contentful Paint | 10% | 3,5 s | ❌ ~3/10 |
| Speed Index | 10% | 6,6 s | ❌ ~4/10 |

**55 dos 100 pontos já estão garantidos.** Todo o déficit é velocidade de carregamento — nada de JavaScript pesado, nada de instabilidade de layout.

As metas numéricas para chegar a 90+:

```
LCP  10,1 s  →  ≤ 2,5 s
FCP   3,5 s  →  ≤ 1,8 s
SI    6,6 s  →  ≤ 3,4 s
```

Atingindo esses três, a nota projetada é **~95**.

---

## 2. Análise de imagens

### 2.1 O achado mais importante: 5 arquivos JPG ainda em uso, com o WebP pronto ao lado

Houve uma conversão para WebP no passado (commit `d27f4c0`), mas o `style.css` **nunca foi atualizado**. Os banners principais de 5 páginas ainda carregam o JPG original, enquanto o WebP equivalente está no repositório sem ser usado por ninguém.

| Página | Banner carrega hoje | WebP disponível | Economia |
|---|---|---|---|
| `sobre` | `lancha2.jpeg` — **3.134 KB** | `lancha2.webp` — 1.240 KB | **1.894 KB** |
| `aventura-aquatica` | `jet8.jpg` — **2.494 KB** | `jet8.webp` — 723 KB | **1.771 KB** |
| `tabua-mares` | `imagem19.jpg` — 323 KB | `imagem19.webp` — 266 KB | 57 KB |
| `passeios-lancha` | `lancha37.jpg` — 168 KB | `lancha37.webp` — 120 KB | 48 KB |
| `contato` | `sobre.jpg` — 103 KB | `sobre.webp` — 61 KB | 42 KB |
| | | **Total** | **≈ 3,7 MB** |

São **9 linhas** no `style.css` (5 nos banners `#banner-*`, 4 nos fundos `#contato-final`). Os arquivos WebP já existem, já foram gerados, já estão versionados. É trocar a extensão na URL.

Cada um desses banners é o **elemento LCP** da sua página. A página `sobre` hoje baixa 3,1 MB só para pintar o cabeçalho.

### 2.2 Bandeiras do seletor de idioma: 263 KB em toda página

| Arquivo | Tamanho | Deveria ter |
|---|---|---|
| `flag-es.svg` | **155.900 bytes** | ~1 KB |
| `flag-br.svg` | **107.527 bytes** | ~1 KB |
| `flag-us.svg` | 823 bytes ✅ | — |

O `flag-us.svg` está correto — 823 bytes, feito à mão. Os outros dois são vetores traçados automaticamente a partir de imagem, com milhares de pontos de caminho (o do Brasil declara `3840x2688`). Uma bandeira do Brasil é um retângulo, um losango, um círculo e 27 estrelas: cabe em 1 KB.

Isso carrega em **todas as 6 páginas**, em toda visita. É mais peso que o `style.css` inteiro (109 KB).

### 2.3 Logo: 121 KB para exibir em 128×67

`logo.webp` tem 950×492 px e 121 KB, mas aparece no cabeçalho a 128×67 px. São 55× mais pixels do que a tela usa. O PageSpeed estima 120 KB de economia só nele.
`logo2.webp` (rodapé): 678×672, 51 KB — mesmo problema em escala menor.

### 2.4 Dimensões: o problema estrutural

Praticamente todas as fotos estão em **2250×4000 ou 4000×2250** — cerca de **9 megapixels**. São exibidas em caixas de 483×859 ou 658×1170, ou seja **~0,4 MP**.

```
Servido:  2250 × 4000  =  9,0 MP
Exibido:   483 ×  859  =  0,4 MP
Desperdício: 22× mais pixels do que a tela consegue mostrar
```

As 10 maiores em uso, todas na home ou nas páginas de passeio:

| Arquivo | KB | Dimensões | Onde |
|---|---|---|---|
| `lancha36.webp` | 1.982 | 2250×4000 | passeios-lancha |
| `lancha21.webp` | 1.519 | 4000×2250 | home (hero), passeios-lancha |
| `lancha2.webp` | 1.240 | 2250×4000 | sobre |
| `jet10.webp` | 1.152 | 1799×3898 | home |
| `jet13.webp` | 1.093 | 2250×4000 | aventura |
| `imagem10.webp` | 968 | 2250×4000 | home |
| `jet16.webp` | 941 | 2250×4000 | aventura |
| `jet6.webp` | 933 | 2250×4000 | home |
| `jet5.webp` | 925 | 2250×4000 | home |
| `colchão6.webp` | 847 | 2250×4000 | aventura, home |

Solução sem mexer no layout: gerar variantes (480w / 960w / 1440w) e declarar `srcset` + `sizes`. O CSS continua idêntico; o navegador é quem passa a escolher o arquivo certo para a tela. Num celular, baixa a versão de 480w em vez da de 2250w.

**Economia estimada pelo próprio PageSpeed: 5.273 KB.**

### 2.5 Imagens sem nenhuma referência: 26 arquivos, 25,5 MB

São, na quase totalidade, os JPG originais que já foram convertidos para WebP. Nenhum HTML, CSS ou JS aponta para eles.

```
lancha36.jpg  4.827 KB      lancha17.jpg    706 KB
jet13.jpg     2.946 KB      lancha15.jpg    662 KB
jet16.jpg     2.850 KB      logo.png        455 KB
jet14.jpg     2.560 KB      lancha29.jpg    411 KB
lancha21.jpg  1.775 KB      lancha32.jpg    353 KB
jet6.jpg      1.282 KB      lancha9.jpg     340 KB
jet5.jpg      1.266 KB      lancha19.jpg    284 KB
lancha4.jpg   1.205 KB      lancha10.jpg    273 KB
lancha33.jpg  1.092 KB      lancha20.jpg    262 KB
piscina.jpg   1.033 KB      lancha40.jpg    202 KB
jet8.webp       723 KB      logo2.png       189 KB
                            jet9.jpg        135 KB
                            lancha37.webp   120 KB
                            lancha5.jpg     110 KB
                            sobre.webp       61 KB
```

⚠️ Atenção: `jet8.webp`, `lancha37.webp` e `sobre.webp` estão nessa lista **porque o CSS ainda usa o JPG**. Depois da Fase 1 eles passam a ser usados e os JPG correspondentes é que ficam órfãos. A ordem importa.

As pastas `assets/img-optimized/` e `assets/img-archive/` estão **vazias** — uma otimização planejada e nunca concluída.

---

## 3. Arquivos órfãos (não-imagem)

| Arquivo | Tamanho | Situação |
|---|---|---|
| `api/tide.js` | 8 KB | **Morto.** `script.js:643` diz explicitamente que nunca é chamado. Além disso retorna dados de maré incorretos (6 eventos, duas altas seguidas) |
| `api/weather.js` | 2 KB | **Morto.** Idem — o navegador chama a Open-Meteo direto |
| `assets/data/mare-maragogi-2026.draft.json` | 103 KB | Rascunho de build. Está no `.gitignore` mas foi commitado antes. Vai para produção sem ser usado |
| `lang/mares-data.json` | 19 KB | **Órfão confirmado.** Zero referências no projeto |
| `tools/build-mare-2026.js` + `tools/mare-2026-user.txt` | 31 KB | Ferramenta de build. Correto manter no repo, errado publicar |
| `.vscode/settings.json` | — | Está no `.gitignore` mas continua rastreado pelo git |

**Total publicado sem uso: ~163 KB por deploy.**

Verificados e **legítimos, não mexer**: `googlea9fde443286aff89.html` (verificação do Search Console), `robots.txt`, `sitemap.xml`, `package.json`, todos os `tabelas/*.html` (carregados dinamicamente via `script.js`), os 3 `lang/*.json` (carregados por nome montado em runtime).

---

## 4. Outros pontos, sem impacto visual

| Item | Situação | Observação |
|---|---|---|
| **Font Awesome** | 228 KB (17 CSS + 112 + 100 de fontes), **98% do CSS não usado**, bloqueia render por 1.060 ms | Carregar de forma assíncrona mantém os ícones idênticos |
| **Preload dos heróis** | Só a home tem. As outras 5 páginas têm o LCP como `background-image` de CSS, descoberto tarde | 5 linhas no `<head>` |
| **`fetchpriority`** | Ausente no preload da home | 1 atributo |
| **`preconnect` Open-Meteo** | Ausente | PageSpeed estima 300 ms de LCP |
| **Links internos com `.html`** | 4 links `Saiba mais` apontam para `/passeios-lancha.html`, que redireciona 301 | Corrige o SEO 92→100 e remove um salto por clique |
| **`background-attachment: fixed`** | 3 ocorrências | Causa repaint contínuo no scroll — contribui para o INP |
| **Animações não compostas** | 6 elementos animando `box-shadow` e `background-position-x` | Mesmo efeito visual é possível com `transform`/`opacity`, que roda na GPU |
| **JSON de marés** | 97 KB baixados em toda página para mostrar 4 linhas | Servir só o dia atual |
| **Vídeos do YouTube** | 9 em `passeios-lancha`, 4 em `aventura` — **já estão com `loading="lazy"`** ✅ | Nada a fazer |
| **Cache de navegador** | ✅ **Já corrigido** no `vercel.json` (Lote 1) | Falta publicar |
| **Cabeçalhos de segurança** | ✅ **Já corrigidos** no `vercel.json` (Lote 1) | Falta publicar |

---

## 5. Plano por fases

Cada fase é independente e reversível. Sugiro publicar e conferir entre uma e outra.

### ✅ Fase 0 — Configuração (feita)
`vercel.json` com cache de navegador e cabeçalhos de segurança + `.gitattributes`.
**Pendente:** publicar e validar em produção.

---

### Fase 1 — Trocar JPG por WebP no CSS
**Ganho: ~3,7 MB** · **Risco: mínimo** · **Arquivos: `style.css` (9 linhas)**

Os WebP já existem. É a maior relação ganho/esforço do projeto inteiro. As páginas `sobre` e `aventura-aquatica` ficam ~2 MB mais leves cada.

*Verificação: abrir as 5 páginas e comparar com captura de antes.*

---

### Fase 2 — Bandeiras e logo
**Ganho: ~370 KB em toda página** · **Risco: baixo** · **Arquivos: 2 SVG + 2 WebP**

Refazer `flag-br.svg` e `flag-es.svg` como vetores limpos (mesmo desenho, mesmas cores, ~1 KB cada) e regerar o logo na resolução em que é exibido, com margem para telas retina.

*Verificação: comparar as bandeiras e o logo lado a lado, ampliados.*

---

### Fase 3 — Limpeza de arquivos
**Ganho: 25,5 MB no repositório, ~163 KB por deploy** · **Risco: baixo** · **Arquivos: exclusões + `.vercelignore`**

Apagar as 26 imagens órfãs (**depois da Fase 1**, para não remover o WebP errado), remover `api/`, `lang/mares-data.json`, o `.draft.json`, as pastas vazias, e criar `.vercelignore` para `tools/` não subir.

*Verificação: rodar a varredura de referências de novo e confirmar zero quebras.*

---

### Fase 4 — `<head>` e rede
**Ganho: ~740 ms de LCP** · **Risco: baixo** · **Arquivos: os 6 HTML**

`fetchpriority="high"` no preload da home, preload do herói nas outras 5 páginas, `preconnect` para a Open-Meteo, Font Awesome sem bloquear renderização, e correção dos 4 links internos com `.html`.

*Verificação: novo PageSpeed, comparar a cadeia de bloqueio.*

---

### Fase 4B — Caminho crítico de renderização
**Ganho: ~1.500 ms de FCP e Speed Index** · **Risco: baixo a médio** · **Arquivos: os 6 HTML + `style.css`**

Três itens que não estavam no plano original e são necessários para chegar a 90+:

**a) Hospedar as fontes no próprio domínio.**
Hoje a cadeia é: HTML → `fonts.googleapis.com` (CSS) → `fonts.gstatic.com` (4 arquivos woff2). São dois domínios externos em série, 1.115 ms de caminho crítico para 62 KB. Baixando os 4 `.woff2` para `assets/fonts/` e declarando `@font-face` local, elimina-se dois handshakes e uma requisição encadeada. As fontes renderizam exatamente iguais.

**b) CSS crítico embutido + resto assíncrono.**
`style.css` tem 109 KB (21 KB comprimido) e bloqueia a renderização por 460 ms — e 14 KB dele não são usados na home. Extrair o CSS do que aparece acima da dobra, embutir no `<head>`, e carregar o restante sem bloquear. É a maior alavanca isolada de FCP.

**c) Google Tag Manager depois do carregamento.**
145 KB, 56 KB de JS não usado, duas tarefas longas de 70 ms e 64 ms aos 4,2 s. Carregar o gtag após o `load` (ou na primeira interação) tira isso do caminho crítico.
⚠️ Como é rastreamento de conversão do Google Ads, avaliar com cuidado: atrasar demais pode perder eventos de quem sai rápido. Sugiro após o `load`, não na interação.

*Verificação: comparar a "Árvore de dependência da rede" do PageSpeed antes e depois.*

---

### Fase 5 — Imagens responsivas
**Ganho: ~5,3 MB** · **Risco: médio** · **Arquivos: geração de variantes + `srcset` nos HTML**

A maior economia, e o maior trabalho. Gerar 3 tamanhos por foto com o `sharp` (já está no `package.json`) e adicionar `srcset`/`sizes`. O CSS não muda; o navegador escolhe.

Faria em grupos: primeiro a galeria da home, depois os cards, depois as páginas internas.

*Verificação: conferir cada grupo em desktop e mobile antes de seguir.*

---

### Fase 6 — Refino de INP
**Ganho: INP de 202 ms para abaixo de 200 ms** · **Risco: médio** · **Arquivos: `style.css`, `script.js`**

Este é o **único problema que as fases 1–5 não resolvem**, e é o segundo motivo da reprovação. Repare na contradição: o TBT de laboratório é 30 ms (perfeito), mas o INP de campo é 202 ms (reprova). Isso significa que o problema **não é carregar — é interagir depois de carregado**.

Medi na página ao vivo: **6 elementos com animação infinita rodando permanentemente**, o tempo todo, em toda página:

| Animação | Elementos | Propriedade animada |
|---|---|---|
| `gradientShift` | 3 | `background-position-x` ❌ |
| `headerCtaPulse` | 1 | `box-shadow` ❌ |
| `whatsappBounce` | 1 | `box-shadow` ❌ |
| `float` | 1 | — |

`background-position` e `box-shadow` **não podem ser compostas pela GPU**. Cada quadro força o navegador a repintar na thread principal — 60 vezes por segundo, para sempre. Num Android modesto, quando o visitante toca em algo, o toque entra na fila atrás desse repaint. É daí que vêm os 202 ms.

Somam-se: `background-attachment: fixed` (repinta o fundo inteiro a cada scroll) e o reflow forçado do efeito de tilt (`script.js:356`, 35 ms), que lê `getBoundingClientRect()` a cada movimento do mouse.

O mesmo efeito visual é reproduzível com `transform` e `opacity`, que rodam na GPU sem tocar na thread principal. O pulso do botão de WhatsApp fica idêntico usando um pseudo-elemento com `transform: scale()` + `opacity` no lugar do `box-shadow`.

Esta é a única fase com risco real de diferença visual perceptível — faria com comparação lado a lado, uma animação por vez.

---

### Fase 7 — Opcionais
- Servir só o dia atual da tábua em vez dos 97 KB
- CSP completa com hash nos scripts inline
- HSTS com `includeSubDomains`
- Corrigir o trava-rolagem do modal e avaliar tirá-lo da página de contato
- Decidir o destino de `/api/tide` (apagar ou consertar o cálculo de maré)

---

## 6. Projeção

| | Hoje | Fases 1–4B | Fases 1–6 |
|---|---|---|---|
| Peso da home | 8,1 MB | ~4 MB | ~1,2 MB |
| Bloqueio de render | 3.010 ms | ~400 ms | ~400 ms |
| FCP (lab) | 3,5 s | ~1,8 s | ~1,7 s |
| Speed Index | 6,6 s | ~3,5 s | ~3,0 s |
| LCP (lab) | 10,1 s | ~3,5 s | ~2,3 s |
| **Nota Performance** | **62** | **~85** | **~95** |
| LCP (campo) | 3,1 s ❌ | — | ~1,8 s ✅ |
| INP (campo) | 202 ms ❌ | 202 ms ❌ | ~120 ms ✅ |
| CLS (campo) | 0,09 ✅ | ✅ | ✅ |

### O que é preciso para efetivamente PASSAR

Aprovar nas Core Web Vitals exige as **três** métricas dentro da meta, no percentil 75 de usuários reais:

1. **LCP ≤ 2,5 s** → resolvido pelas fases 1, 4, 4B e 5
2. **INP ≤ 200 ms** → resolvido **só** pela fase 6. Nenhuma outra fase mexe nisso
3. **CLS ≤ 0,1** → já aprovado, só não pode regredir

Ou seja: **dá para chegar a nota 95 no laboratório e continuar reprovado**, se a fase 6 ficar de fora. As duas coisas são independentes.

### Cronograma realista

| Momento | O que acontece |
|---|---|
| Dia 0 | Deploy das fases 1–6 |
| Dia 0 | Nota de laboratório sobe na hora — dá para conferir no mesmo dia |
| Dias 1–27 | O CrUX vai substituindo aos poucos a janela de 28 dias |
| ~Dia 28 | "Core Web Vitals: aprovado" |

Não há como acelerar — a janela de 28 dias é fixa. Para acompanhar antes disso, o Search Console mostra a evolução por grupo de URLs, e o painel de performance do Chrome DevTools mede o INP localmente na hora.

### Ao testar no PageSpeed

Teste as 6 URLs, não só a home — e clique em **"Origem"** além de "Este URL". É a avaliação de origem que define se o domínio passa.

---

## 7. Observações práticas

**Live Server (`127.0.0.1:5501`)** não aplica o `vercel.json`. Cache e cabeçalhos de segurança só existem em produção — testar lá.

**Cache de 30 dias nas imagens:** se trocar uma foto mantendo o mesmo nome, quem já visitou pode ver a antiga por até 30 dias. Troque o nome do arquivo junto.

**Antes da Fase 1**, vale commitar o que está pendente e rodar `git add --renormalize .` para resolver de vez os diffs falsos de CRLF.

**Ordem recomendada:** 1 → 2 → 3 → 4 → publicar e medir → 5 → 6.
As quatro primeiras somam ~4,1 MB e algumas centenas de milissegundos com risco quase nulo.
