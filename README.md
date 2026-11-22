# 📈 Simulador de Investimentos — Renda Fixa

Compare quanto o seu dinheiro rende na **Poupança, Tesouro Selic, CDB e LCI/LCA**, com aportes mensais, **imposto de renda regressivo calculado por aporte** e efeito da **inflação**.

![Demonstração do simulador](docs/demo.gif)

🔗 **Demo online:** https://beatrizaandradee.github.io/simulador-investimentos ← _ative o GitHub Pages_

---

## ✨ Funcionalidades

- Simulação com valor inicial, aporte mensal e prazo de 1 a 30 anos
- **Comparação lado a lado** de 4 aplicações, ordenadas pelo valor líquido
- **IR regressivo por lote**: cada aporte paga a alíquota do tempo que ficou aplicado (22,5% → 20% → 17,5% → 15%)
- Regra oficial da **poupança** (0,5% a.m. quando a Selic passa de 8,5% a.a.; senão, 70% da Selic)
- **Valor real**: quanto o resultado vale em poder de compra de hoje, descontando a inflação
- **Gráfico de linhas em `<canvas>` feito do zero**, com tooltip ao passar o mouse
- Tabela ano a ano e calculadora de **"em quanto tempo chego no meu objetivo"**
- **Link compartilhável**: os parâmetros ficam na URL
- Campos no formato brasileiro (`1.234,56`) com validação
- Responsivo, sem frameworks e sem dependências

## 🧮 Como o cálculo funciona

| Conceito | Fórmula / regra |
|---|---|
| Taxa mensal equivalente | `i_m = (1 + i_a)^(1/12) − 1` |
| Saldo mês a mês | `saldo = saldo × (1 + i_m) + aporte` |
| IR de cada aporte | `(valor final do aporte − valor aportado) × alíquota(dias aplicados)` |
| Valor real | `líquido ÷ (1 + inflação)^anos` |
| CDB / LCI | `% do CDI × taxa CDI` |

> Simulação educativa: não considera TR, taxa de custódia, IOF nem mudança das taxas ao longo do tempo. As taxas padrão são exemplos e podem ser editadas.

## 🛠️ Tecnologias

- **HTML5** semântico e acessível (`aria-live`, labels, `role`)
- **CSS3**: Grid, Flexbox, variáveis, media queries
- **JavaScript (ES Modules)**: lógica separada da interface
- **Canvas API**: gráfico próprio
- **Node.js test runner**: testes automatizados da matemática financeira

## 📂 Estrutura

```
simulador-investimentos/
├── index.html
├── style.css
├── favicon.svg
├── src/
│   ├── calc.js      # Motor de cálculo (funções puras)
│   ├── chart.js     # Gráfico de linhas em canvas
│   └── main.js      # Interface, eventos e URL
├── tests/
│   └── calc.test.js # 9 testes da matemática financeira
└── docs/demo.gif
```

## 🚀 Como rodar

Sem instalação, porque o projeto não tem dependências:

```bash
git clone https://github.com/beatrizaandradee/simulador-investimentos.git
cd simulador-investimentos
npx serve .          # ou abra com a extensão Live Server do VS Code
npm test             # roda os testes (Node 18+)
```

> Os arquivos usam ES Modules, então precisam ser abertos por um servidor (não dá para abrir o `index.html` com duplo clique).

### Publicar no GitHub Pages
**Settings → Pages → Branch: `main` / root → Save.** Em 1 minuto o site fica em `https://beatrizaandradee.github.io/simulador-investimentos`.

---

Desenvolvido por **Beatriz Almeida Andrade**, estudante de Engenharia de Software na PUC Minas · [LinkedIn](https://www.linkedin.com/in/beatriz-almeida-975408325/) · [GitHub](https://github.com/beatrizaandradee)
