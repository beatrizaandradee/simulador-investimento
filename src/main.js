import { compareAll, monthsToGoal } from './calc.js'
import { createLineChart } from './chart.js'

const $ = (id) => document.getElementById(id)
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const money = (n) => brl.format(n)
const pct = (n) => `${(n * 100).toFixed(2).replace('.', ',')}%`

/** Lê número no formato brasileiro: "1.234,56" → 1234.56 */
function parseBR(str) {
  const clean = String(str).trim().replace(/\s|R\$/g, '').replace(/\./g, '').replace(',', '.')
  return clean === '' ? NaN : Number(clean)
}
/** Formata número para o input: 1234.5 → "1.234,50" */
const toBR = (n, d = 2) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })

const FIELDS = ['initial', 'monthly', 'years', 'selic', 'inflation', 'cdbPercent', 'lciPercent']
const chart = createLineChart($('chart'), $('tooltip'))
let last = null

function readParams() {
  const v = Object.fromEntries(FIELDS.map((f) => [f, f === 'years' ? Number($(f).value) : parseBR($(f).value)]))
  const errors = []
  if (!(v.initial >= 0)) errors.push('valor inicial')
  if (!(v.monthly >= 0)) errors.push('aporte mensal')
  if (!(v.selic >= 0 && v.selic <= 100)) errors.push('Selic/CDI')
  if (!(v.inflation >= -10 && v.inflation <= 100)) errors.push('inflação')
  if (!(v.cdbPercent > 0 && v.cdbPercent <= 300)) errors.push('% do CDB')
  if (!(v.lciPercent > 0 && v.lciPercent <= 300)) errors.push('% da LCI/LCA')
  if (v.initial === 0 && v.monthly === 0) errors.push('valor inicial ou aporte (algum precisa ser maior que zero)')
  return {
    errors,
    params: { ...v, selic: v.selic / 100, inflation: v.inflation / 100, cdbPercent: v.cdbPercent / 100, lciPercent: v.lciPercent / 100 },
  }
}

function render() {
  const years = Number($('years').value)
  $('yearsOut').textContent = `${years} ${years === 1 ? 'ano' : 'anos'}`

  const { errors, params } = readParams()
  if (errors.length) {
    $('formError').textContent = `Confira: ${errors.join(', ')}.`
    return
  }
  $('formError').textContent = ''

  const results = compareAll(params)
  last = { params, results }
  const best = results[0]
  const worst = results[results.length - 1]

  // Destaque
  $('best').innerHTML = `
    <span class="best__label">🏆 Melhor opção para você</span>
    <h2 style="color:${best.color}">${best.name}</h2>
    <p class="best__value">${money(best.net)}</p>
    <p class="best__sub">líquido em ${years} ${years === 1 ? 'ano' : 'anos'}, investindo ${money(best.invested)}</p>
    <div class="best__stats">
      <div><span>Rendimento líquido</span><strong class="up">+ ${money(best.netProfit)}</strong></div>
      <div><span>Imposto de renda</span><strong>${best.tax ? money(best.tax) : 'Isento'}</strong></div>
      <div><span>Poder de compra real</span><strong>${money(best.realNet)}</strong></div>
      <div><span>A mais que ${worst.name}</span><strong class="up">+ ${money(best.net - worst.net)}</strong></div>
    </div>`

  // Cards comparativos
  $('cards').innerHTML = results
    .map(
      (r, i) => `
    <article class="card ${i === 0 ? 'is-best' : ''}" style="--c:${r.color}">
      <div class="card__top"><span class="dot"></span><strong>${r.name}</strong><span class="rank">#${i + 1}</span></div>
      <p class="card__net">${money(r.net)}</p>
      <dl>
        <dt>Taxa bruta</dt><dd>${pct(r.annualRate)} a.a.</dd>
        <dt>Rendimento bruto</dt><dd>${money(r.profit)}</dd>
        <dt>IR</dt><dd>${r.taxed ? '− ' + money(r.tax) : '<em>isento</em>'}</dd>
        <dt>Valor real (hoje)</dt><dd>${money(r.realNet)}</dd>
      </dl>
    </article>`
    )
    .join('')

  // Gráfico
  const series = results.map((r) => ({ name: r.name, color: r.color, values: r.timeline.map((t) => t.gross) }))
  series.push({ name: 'Total investido', color: '#94a3b8', dashed: true, values: best.timeline.map((t) => t.invested) })
  chart.update({ series, months: Math.round(params.years * 12), formatMoney: money })
  $('legend').innerHTML = series.map((s) => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('')

  // Select da tabela
  const sel = $('tableProduct')
  const prev = sel.value
  sel.innerHTML = results.map((r) => `<option value="${r.id}">${r.name}</option>`).join('')
  if (results.some((r) => r.id === prev)) sel.value = prev
  renderTable()
  renderGoal()
  syncURL()
}

function renderTable() {
  if (!last) return
  const r = last.results.find((x) => x.id === $('tableProduct').value) || last.results[0]
  const rows = []
  for (let m = 12; m < r.timeline.length; m += 12) {
    const t = r.timeline[m]
    rows.push(`<tr><td>${m / 12}º</td><td>${money(t.invested)}</td><td class="up">${money(t.gross - t.invested)}</td><td><strong>${money(t.gross)}</strong></td></tr>`)
  }
  $('tableBody').innerHTML = rows.join('')
}

function renderGoal() {
  if (!last) return
  const goal = parseBR($('goal').value)
  if (!(goal > 0)) {
    $('goalOut').textContent = 'Digite um objetivo maior que zero.'
    return
  }
  const { params, results } = last
  const items = results.map((r) => {
    const m = monthsToGoal({ initial: params.initial, monthly: params.monthly, annualRate: r.annualRate, goal })
    const txt = m === null ? 'não alcança' : m === 0 ? 'já alcançou' : `${Math.floor(m / 12) ? Math.floor(m / 12) + 'a ' : ''}${m % 12}m`
    return `<span style="--c:${r.color}"><b>${r.name}</b> ${txt}</span>`
  })
  $('goalOut').innerHTML = `Valor bruto, sem descontar IR: ${items.join('')}`
}

// Link compartilhável com os parâmetros na URL
function syncURL() {
  const q = new URLSearchParams(FIELDS.map((f) => [f, $(f).value]))
  history.replaceState(null, '', `?${q}`)
}
function loadURL() {
  const q = new URLSearchParams(location.search)
  FIELDS.forEach((f) => q.has(f) && ($(f).value = q.get(f)))
}

function toast(msg) {
  const t = $('toast')
  t.textContent = msg
  t.hidden = false
  clearTimeout(toast.id)
  toast.id = setTimeout(() => (t.hidden = true), 2200)
}

// Eventos
$('form').addEventListener('input', render)
$('form').addEventListener('submit', (e) => e.preventDefault())
document.querySelectorAll('.money input').forEach((el) =>
  el.addEventListener('blur', () => {
    const n = parseBR(el.value)
    if (Number.isFinite(n)) el.value = toBR(n)
  })
)
$('tableProduct').addEventListener('change', renderTable)
$('goal').addEventListener('input', renderGoal)
$('share').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(location.href)
    toast('Link copiado! ✓')
  } catch {
    toast('Copie o link da barra de endereço.')
  }
})

loadURL()
render()
