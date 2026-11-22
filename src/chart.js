// Gráfico de linhas em <canvas>, desenhado do zero, com tooltip no hover.

const fmtShort = (v) => (v >= 1e6 ? `R$ ${(v / 1e6).toFixed(1).replace('.', ',')} mi` : v >= 1e3 ? `R$ ${Math.round(v / 1e3)} mil` : `R$ ${Math.round(v)}`)

export function createLineChart(canvas, tooltip) {
  const ctx = canvas.getContext('2d')
  let state = null
  let hoverIndex = null

  function size() {
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    return rect
  }

  function draw() {
    if (!state) return
    const { series, months, formatMoney } = state
    const { width: W, height: H } = size()
    const pad = { l: 64, r: 16, t: 14, b: 30 }
    const max = Math.max(...series.flatMap((s) => s.values)) * 1.05 || 1
    const x = (i) => pad.l + (i / months) * (W - pad.l - pad.r)
    const y = (v) => H - pad.b - (v / max) * (H - pad.t - pad.b)

    ctx.clearRect(0, 0, W, H)
    ctx.font = '11px Manrope, system-ui, sans-serif'

    // grade horizontal
    for (let g = 0; g <= 4; g++) {
      const v = (max / 4) * g
      ctx.strokeStyle = '#e8eaf3'
      ctx.beginPath()
      ctx.moveTo(pad.l, y(v))
      ctx.lineTo(W - pad.r, y(v))
      ctx.stroke()
      ctx.fillStyle = '#8a8fa8'
      ctx.textAlign = 'right'
      ctx.fillText(fmtShort(v), pad.l - 8, y(v) + 4)
    }
    // eixo x em anos
    const years = months / 12
    const step = Math.max(1, Math.ceil(years / 10))
    ctx.textAlign = 'center'
    for (let a = 0; a <= years; a += step) ctx.fillText(`${a}a`, x(a * 12), H - 10)

    // linhas
    for (const s of series) {
      ctx.strokeStyle = s.color
      ctx.lineWidth = s.dashed ? 2 : 2.6
      ctx.setLineDash(s.dashed ? [6, 5] : [])
      ctx.beginPath()
      s.values.forEach((v, i) => (i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))))
      ctx.stroke()
      if (!s.dashed) {
        // área suave sob a melhor linha
        if (s === series[0]) {
          const grad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b)
          grad.addColorStop(0, s.color + '33')
          grad.addColorStop(1, s.color + '00')
          ctx.lineTo(x(months), y(0))
          ctx.lineTo(x(0), y(0))
          ctx.fillStyle = grad
          ctx.fill()
        }
      }
    }
    ctx.setLineDash([])

    // marcador do hover
    if (hoverIndex !== null) {
      const hx = x(hoverIndex)
      ctx.strokeStyle = '#c7cae0'
      ctx.beginPath()
      ctx.moveTo(hx, pad.t)
      ctx.lineTo(hx, H - pad.b)
      ctx.stroke()
      for (const s of series) {
        ctx.fillStyle = '#fff'
        ctx.strokeStyle = s.color
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.arc(hx, y(s.values[hoverIndex]), 4.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      }
      const m = hoverIndex
      tooltip.innerHTML =
        `<strong>${Math.floor(m / 12)} ano(s) e ${m % 12} mês(es)</strong>` +
        series.map((s) => `<span><i style="background:${s.color}"></i>${s.name}: ${formatMoney(s.values[m])}</span>`).join('')
      tooltip.hidden = false
      const left = Math.min(hx + 14, W - tooltip.offsetWidth - 4)
      tooltip.style.left = `${hx > W * 0.6 ? hx - tooltip.offsetWidth - 14 : left}px`
      tooltip.style.top = '10px'
    } else tooltip.hidden = true
  }

  canvas.addEventListener('mousemove', (e) => {
    if (!state) return
    const rect = canvas.getBoundingClientRect()
    const rel = (e.clientX - rect.left - 64) / (rect.width - 80)
    hoverIndex = Math.max(0, Math.min(state.months, Math.round(rel * state.months)))
    draw()
  })
  canvas.addEventListener('mouseleave', () => {
    hoverIndex = null
    draw()
  })
  window.addEventListener('resize', draw)

  return {
    update(next) {
      state = next
      hoverIndex = null
      draw()
    },
  }
}
