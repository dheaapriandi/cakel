// Chart Renderer for 6-Month Attendance Trend SVG
function renderAttendanceChart(svgElementId, dataPoints) {
  const svg = document.getElementById(svgElementId);
  if (!svg) return;

  // Default demo data matching screenshot: Feb26 0%, Mar26 0%, Apr26 0%, Mei26 0%, Jun26 0%, Jul26 100%
  const months = dataPoints || [
    { label: 'Feb26', value: 0 },
    { label: 'Mar26', value: 0 },
    { label: 'Apr26', value: 0 },
    { label: 'Mei26', value: 0 },
    { label: 'Jun26', value: 0 },
    { label: 'Jul26', value: 100 }
  ];

  const width = 320;
  const height = 160;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const yTicks = [100, 75, 50, 25, 0];

  let svgContent = '';

  // Draw Horizontal Grid Lines & Y-axis labels
  yTicks.forEach(tick => {
    const y = paddingTop + (1 - tick / 100) * chartHeight;
    svgContent += `
      <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="#f1f5f9" stroke-width="1.5" stroke-dasharray="${tick === 0 ? '0' : '4 4'}"/>
      <text x="${paddingLeft - 8}" y="${y + 4}" font-size="11" fill="#a1a1aa" text-anchor="end" font-family="Inter">${tick}%</text>
    `;
  });

  // Calculate coordinates for points
  const points = months.map((m, index) => {
    const x = paddingLeft + (index / (months.length - 1)) * chartWidth;
    const y = paddingTop + (1 - m.value / 100) * chartHeight;
    return { x, y, label: m.label, value: m.value };
  });

  // Build SVG Path Smooth Curve (Cubic Bezier)
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlX = (current.x + next.x) / 2;
    pathD += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  // Render Path Line
  svgContent += `<path d="${pathD}" fill="none" stroke="#a1a1aa" stroke-width="2.5" stroke-linecap="round"/>`;

  // Render X-axis Labels & Circles on points
  points.forEach(p => {
    // Label
    svgContent += `
      <text x="${p.x}" y="${height - 6}" font-size="11" fill="#a1a1aa" text-anchor="middle" font-family="Inter">${p.label}</text>
    `;
    // Dot
    const r = p.value > 0 ? 6 : 4.5;
    const fill = p.value > 0 ? '#18181b' : '#000000';
    svgContent += `
      <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}"/>
    `;
  });

  svg.innerHTML = svgContent;
}

window.renderAttendanceChart = renderAttendanceChart;
