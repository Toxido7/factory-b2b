import { motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EASE, DURATION } from '../../lib/motion.js';
import { formatDate } from '../../lib/format.js';

const WIDTH = 720;
const HEIGHT = 260;
const PADDING = { top: 18, right: 12, bottom: 42, left: 44 };

function shortDate(period) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(`${period}T00:00:00Z`));
}

export default function RequestsChart({ series, from, to }) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const maxCount = Math.max(...series.map((point) => point.count), 0);
  const max = Math.max(4, Math.ceil(maxCount / 4) * 4);
  const chartWidth = WIDTH - PADDING.left - PADDING.right;
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const points = useMemo(
    () =>
      series.map((point, index) => ({
        ...point,
        x: PADDING.left + (series.length === 1 ? chartWidth / 2 : (index * chartWidth) / (series.length - 1)),
        y: PADDING.top + chartHeight - (point.count / max) * chartHeight,
      })),
    [chartHeight, chartWidth, max, series],
  );
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const area = `${line} L ${points.at(-1)?.x ?? PADDING.left} ${PADDING.top + chartHeight} L ${points[0]?.x ?? PADDING.left} ${PADDING.top + chartHeight} Z`;
  const hoveredPoint = hoveredIndex === null ? null : points[hoveredIndex];

  function handlePointerMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const nearest = points.reduce(
      (best, point, index) =>
        Math.abs(point.x - x) < Math.abs(points[best].x - x) ? index : best,
      0,
    );
    setHoveredIndex(nearest);
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={t('adminDashboard.chartSummary', {
          total: series.reduce((sum, point) => sum + point.count, 0),
          from: formatDate(`${from}T00:00:00Z`),
          to: formatDate(`${to}T00:00:00Z`),
          max: maxCount,
        })}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoveredIndex(null)}
      >
        {[1, 2, 3, 4].map((step) => {
          const y = PADDING.top + chartHeight - (step / 4) * chartHeight;
          return (
            <g key={step}>
              <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} className="stroke-white/15" />
              <text x={PADDING.left - 8} y={y + 4} textAnchor="end" className="fill-white/60 text-[11px]">
                {Math.round((step / 4) * max)}
              </text>
            </g>
          );
        })}
        <text x={PADDING.left - 8} y={PADDING.top + chartHeight + 4} textAnchor="end" className="fill-white/60 text-[11px]">
          0
        </text>
        <motion.path
          d={area}
          className="fill-accent/15"
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          whileInView={reducedMotion ? undefined : { opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: DURATION, ease: EASE }}
        />
        <motion.path
          d={line}
          fill="none"
          className="stroke-accent"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
          whileInView={reducedMotion ? undefined : { pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: EASE }}
        />
        {[0, Math.floor((series.length - 1) / 2), series.length - 1]
          .filter((index, position, indexes) => indexes.indexOf(index) === position)
          .map((index) => (
            <text
              key={index}
              x={points[index].x}
              y={HEIGHT - 12}
              textAnchor={index === 0 ? 'start' : index === series.length - 1 ? 'end' : 'middle'}
              className="fill-white/60 text-[11px]"
            >
              {shortDate(points[index].period)}
            </text>
          ))}
        {hoveredPoint && (
          <>
            <line
              x1={hoveredPoint.x}
              x2={hoveredPoint.x}
              y1={PADDING.top}
              y2={PADDING.top + chartHeight}
              className="stroke-accent/50"
              strokeWidth="1"
            />
            <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="4" className="fill-accent" />
            <g transform={`translate(${Math.min(hoveredPoint.x + 8, WIDTH - 145)} ${Math.max(hoveredPoint.y - 42, 4)})`}>
              <rect width="137" height="34" rx="6" className="fill-white" />
              <text x="8" y="14" className="fill-ink text-[10px]">
                {t('adminDashboard.chartRequests', { count: hoveredPoint.count })}
              </text>
              <text x="8" y="27" className="fill-muted text-[9px]">
                {formatDate(`${hoveredPoint.period}T00:00:00Z`)}
              </text>
            </g>
          </>
        )}
      </svg>
      <table className="sr-only">
        <caption>{t('adminDashboard.chartTitle')}</caption>
        <thead>
          <tr>
            <th>{t('adminDashboard.chartTableDate')}</th>
            <th>{t('adminDashboard.chartTableCount')}</th>
          </tr>
        </thead>
        <tbody>
          {series.map((point) => (
            <tr key={point.period}>
              <td>{formatDate(`${point.period}T00:00:00Z`)}</td>
              <td>{point.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
