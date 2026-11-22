// =====================================================================
//  Motor de cálculo do simulador — funções puras, sem DOM.
// =====================================================================

/** Converte taxa anual (ex.: 0.12) em taxa mensal equivalente (juros compostos) */
export const annualToMonthly = (annual) => Math.pow(1 + annual, 1 / 12) - 1

/** Converte taxa mensal em anual equivalente */
export const monthlyToAnnual = (monthly) => Math.pow(1 + monthly, 12) - 1

/**
 * Alíquota de IR da tabela regressiva da renda fixa, pelo tempo da aplicação em dias.
 * Até 180 dias: 22,5% · 181–360: 20% · 361–720: 17,5% · acima de 720: 15%
 */
export function irRate(days) {
  if (days <= 180) return 0.225
  if (days <= 360) return 0.2
  if (days <= 720) return 0.175
  return 0.15
}

/**
 * Rendimento anual da poupança (regra desde 2012, sem TR):
 * Selic > 8,5% a.a. → 0,5% ao mês; senão → 70% da Selic.
 */
export function savingsAnnualRate(selic) {
  return selic > 0.085 ? monthlyToAnnual(0.005) : 0.7 * selic
}

/** Produtos comparados. "rate" recebe as premissas e devolve a taxa anual bruta. */
export const PRODUCTS = [
  { id: 'poupanca', name: 'Poupança', color: '#f59e0b', taxed: false, rate: (p) => savingsAnnualRate(p.selic) },
  { id: 'tesouro', name: 'Tesouro Selic', color: '#10b981', taxed: true, rate: (p) => p.selic },
  { id: 'cdb', name: 'CDB', color: '#6366f1', taxed: true, rate: (p) => p.selic * p.cdbPercent },
  { id: 'lci', name: 'LCI / LCA', color: '#ec4899', taxed: false, rate: (p) => p.selic * p.lciPercent },
]

/**
 * Simula mês a mês. Cada depósito é tratado como um "lote" separado para aplicar
 * o IR regressivo corretamente (um aporte feito no último mês paga 22,5%, o
 * depósito inicial de 3 anos atrás paga 15%).
 *
 * @param {object} o
 * @param {number} o.initial  valor inicial
 * @param {number} o.monthly  aporte mensal (feito ao fim de cada mês)
 * @param {number} o.months   prazo em meses
 * @param {number} o.annualRate taxa anual bruta (0.12 = 12%)
 * @param {boolean} o.taxed   se incide IR
 * @param {number} [o.inflation] inflação anual para calcular o valor real
 */
export function simulate({ initial, monthly, months, annualRate, taxed, inflation = 0 }) {
  const r = annualToMonthly(annualRate)
  const lots = [] // { amount, month }
  if (initial > 0) lots.push({ amount: initial, month: 0 })

  const timeline = [{ month: 0, invested: initial, gross: initial }]
  let invested = initial
  let gross = initial

  for (let m = 1; m <= months; m++) {
    gross = gross * (1 + r) + monthly
    if (monthly > 0) {
      lots.push({ amount: monthly, month: m })
      invested += monthly
    }
    timeline.push({ month: m, invested: round2(invested), gross: round2(gross) })
  }

  // IR por lote, considerando o tempo que cada depósito ficou aplicado
  let tax = 0
  if (taxed) {
    for (const lot of lots) {
      const held = months - lot.month
      const value = lot.amount * Math.pow(1 + r, held)
      tax += (value - lot.amount) * irRate(held * 30)
    }
  }

  const profit = gross - invested
  const net = gross - tax
  const realNet = net / Math.pow(1 + inflation, months / 12)

  return {
    invested: round2(invested),
    gross: round2(gross),
    profit: round2(profit),
    tax: round2(tax),
    net: round2(net),
    netProfit: round2(net - invested),
    realNet: round2(realNet),
    effectiveAnnual: annualRate,
    timeline,
  }
}

/** Roda a simulação para todos os produtos e ordena do melhor para o pior (líquido) */
export function compareAll(params) {
  const months = Math.round(params.years * 12)
  return PRODUCTS.map((p) => {
    const annualRate = p.rate(params)
    const result = simulate({ initial: params.initial, monthly: params.monthly, months, annualRate, taxed: p.taxed, inflation: params.inflation })
    return { ...p, annualRate, ...result }
  }).sort((a, b) => b.net - a.net)
}

/**
 * Quantos meses para atingir um objetivo (valor bruto), com limite de 100 anos.
 * Retorna null se for impossível (sem aporte nem rendimento).
 */
export function monthsToGoal({ initial, monthly, annualRate, goal }) {
  if (initial >= goal) return 0
  const r = annualToMonthly(annualRate)
  if (monthly <= 0 && (r <= 0 || initial <= 0)) return null
  let v = initial
  for (let m = 1; m <= 1200; m++) {
    v = v * (1 + r) + monthly
    if (v >= goal) return m
  }
  return null
}

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
