import { test } from 'node:test'
import assert from 'node:assert/strict'
import { annualToMonthly, irRate, savingsAnnualRate, simulate, compareAll, monthsToGoal } from '../src/calc.js'

const close = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b}`)

test('taxa mensal equivalente: 12% a.a. ≈ 0,9489% a.m.', () => {
  close(annualToMonthly(0.12) * 100, 0.9489, 0.0001)
})

test('tabela regressiva do IR', () => {
  assert.equal(irRate(180), 0.225)
  assert.equal(irRate(181), 0.2)
  assert.equal(irRate(720), 0.175)
  assert.equal(irRate(721), 0.15)
})

test('poupança: 0,5% a.m. com Selic alta e 70% da Selic com Selic baixa', () => {
  close(savingsAnnualRate(0.12), 0.0617, 0.0001)
  close(savingsAnnualRate(0.06), 0.042, 0.0001)
})

test('juros compostos sem aporte batem com a fórmula M = C(1+i)^n', () => {
  const r = simulate({ initial: 1000, monthly: 0, months: 24, annualRate: 0.1, taxed: false })
  close(r.gross, 1000 * 1.1 ** 2)
})

test('IR de 15% sobre o lucro quando o prazo passa de 2 anos', () => {
  const r = simulate({ initial: 1000, monthly: 0, months: 36, annualRate: 0.1, taxed: true })
  close(r.tax, r.profit * 0.15)
})

test('aportes recentes pagam IR maior que o depósito inicial', () => {
  const r = simulate({ initial: 0, monthly: 100, months: 36, annualRate: 0.1, taxed: true })
  assert.ok(r.tax / r.profit > 0.15, 'alíquota média deve ser maior que 15%')
  assert.equal(r.invested, 3600)
})

test('valor real desconta a inflação', () => {
  const r = simulate({ initial: 1000, monthly: 0, months: 12, annualRate: 0.1, taxed: false, inflation: 0.1 })
  close(r.realNet, 1000)
})

test('compareAll devolve os 4 produtos ordenados pelo líquido', () => {
  const res = compareAll({ initial: 1000, monthly: 200, years: 2, selic: 0.12, cdbPercent: 1.1, lciPercent: 0.9, inflation: 0.04 })
  assert.equal(res.length, 4)
  for (let i = 1; i < res.length; i++) assert.ok(res[i - 1].net >= res[i].net)
})

test('monthsToGoal encontra o prazo e detecta caso impossível', () => {
  assert.equal(monthsToGoal({ initial: 0, monthly: 100, annualRate: 0, goal: 1000 }), 10)
  assert.equal(monthsToGoal({ initial: 0, monthly: 0, annualRate: 0.1, goal: 1000 }), null)
  assert.equal(monthsToGoal({ initial: 5000, monthly: 0, annualRate: 0.1, goal: 1000 }), 0)
})
