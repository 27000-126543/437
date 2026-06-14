import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

const baseDarkTheme: EChartsOption = {
  backgroundColor: 'transparent',
  textStyle: {
    color: '#C8D1E0',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  tooltip: {
    backgroundColor: 'rgba(26, 39, 68, 0.95)',
    borderColor: 'rgba(0, 212, 255, 0.4)',
    borderWidth: 1,
    textStyle: { color: '#C8D1E0', fontSize: 12 },
    extraCssText: 'backdrop-filter: blur(8px); border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);',
  },
  grid: { left: 48, right: 20, top: 24, bottom: 32 },
};

interface TrendAreaChartProps {
  data: { date: string; completed: number; total: number; conv?: number }[];
  height?: number;
}

export function TrendAreaChart({ data, height = 280 }: TrendAreaChartProps) {
  const option: EChartsOption = {
    ...baseDarkTheme,
    legend: {
      right: 0,
      top: 0,
      textStyle: { color: '#6B7A99', fontSize: 11 },
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 3,
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date),
      axisLine: { lineStyle: { color: '#2A3A5C' } },
      axisLabel: { color: '#6B7A99', fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        name: '任务数',
        nameTextStyle: { color: '#6B7A99', fontSize: 10 },
        axisLine: { show: false },
        axisLabel: { color: '#6B7A99', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(42,58,92,0.6)', type: 'dashed' } },
      },
      {
        type: 'value',
        name: '收敛次数',
        nameTextStyle: { color: '#6B7A99', fontSize: 10 },
        axisLine: { show: false },
        axisLabel: { color: '#6B7A99', fontSize: 10 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '完成任务',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        showSymbol: false,
        data: data.map(d => d.completed),
        lineStyle: { color: '#00D4FF', width: 2 },
        itemStyle: { color: '#00D4FF' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 212, 255, 0.35)' },
              { offset: 1, color: 'rgba(0, 212, 255, 0)' },
            ],
          },
        },
      },
      {
        name: '新建任务',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        showSymbol: false,
        data: data.map(d => d.total),
        lineStyle: { color: '#00FF88', width: 2, type: 'dashed' },
        itemStyle: { color: '#00FF88' },
      },
      {
        name: '参数收敛',
        type: 'bar',
        yAxisIndex: 1,
        barWidth: 8,
        data: data.map(d => d.conv ?? 0),
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 107, 53, 0.8)' },
              { offset: 1, color: 'rgba(255, 107, 53, 0.2)' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };
  return <ReactECharts option={option} style={{ height }} opts={{ renderer: 'canvas' }} />;
}

interface HistogramChartProps {
  bins: { bin: number; count: number }[];
  meanD?: number;
  cv?: number;
  height?: number;
}

export function HistogramChart({ bins, meanD, cv, height = 260 }: HistogramChartProps) {
  const max = Math.max(...bins.map(b => b.count));
  const option: EChartsOption = {
    ...baseDarkTheme,
    title: meanD != null
      ? {
          text: `均值: ${meanD.toFixed(2)} μm    CV: ${cv != null ? cv.toFixed(2) + '%' : '-'}`,
          right: 0,
          top: 0,
          textStyle: { color: '#00D4FF', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 'normal' },
        }
      : undefined,
    xAxis: {
      type: 'category',
      data: bins.map(b => b.bin + ' μm'),
      name: '液滴直径',
      nameTextStyle: { color: '#6B7A99', fontSize: 10 },
      axisLine: { lineStyle: { color: '#2A3A5C' } },
      axisLabel: { color: '#6B7A99', fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: '频数',
      nameTextStyle: { color: '#6B7A99', fontSize: 10 },
      axisLine: { show: false },
      axisLabel: { color: '#6B7A99', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(42,58,92,0.6)', type: 'dashed' } },
    },
    series: [
      {
        type: 'bar',
        barWidth: '60%',
        data: bins.map((b, i) => {
          const ratio = b.count / max;
          return {
            value: b.count,
            itemStyle: {
              color: {
                type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: ratio > 0.6 ? 'rgba(0, 255, 136, 0.9)' : 'rgba(0, 212, 255, 0.85)' },
                  { offset: 1, color: ratio > 0.6 ? 'rgba(0, 255, 136, 0.15)' : 'rgba(0, 212, 255, 0.15)' },
                ],
              },
              borderRadius: [4, 4, 0, 0],
              borderColor: ratio > 0.6 ? 'rgba(0,255,136,0.5)' : 'rgba(0,212,255,0.5)',
              borderWidth: 1,
            },
            label: { show: i % 2 === 0, position: 'top', color: '#6B7A99', fontSize: 9, fontFamily: 'JetBrains Mono' },
          };
        }),
        markLine:
          meanD != null
            ? {
                symbol: 'none',
                data: [{ xAxis: bins.findIndex(b => b.bin >= meanD) + 0.5 }],
                lineStyle: { color: '#FF6B35', width: 2, type: 'dashed' },
                label: { formatter: '均值', color: '#FF6B35', fontSize: 10, position: 'end' },
              }
            : undefined,
      },
    ],
  };
  return <ReactECharts option={option} style={{ height }} opts={{ renderer: 'canvas' }} />;
}

interface TimeSeriesChartProps {
  series: { name: string; data: { time: number; value: number }[]; color: string; dashed?: boolean }[];
  yName?: string;
  threshold?: { value: number; label: string; color?: string };
  height?: number;
  smooth?: boolean;
}

export function TimeSeriesChart({
  series,
  yName = '值',
  threshold,
  height = 240,
  smooth = true,
}: TimeSeriesChartProps) {
  const baseData = series[0]?.data ?? [];
  const option: EChartsOption = {
    ...baseDarkTheme,
    legend: {
      data: series.map(s => s.name),
      right: 0,
      top: 0,
      textStyle: { color: '#6B7A99', fontSize: 11 },
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 3,
    },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: baseData.map(d => 'T+' + d.time + 's'),
      name: '时间 (仿真步)',
      nameTextStyle: { color: '#6B7A99', fontSize: 10 },
      axisLine: { lineStyle: { color: '#2A3A5C' } },
      axisLabel: { color: '#6B7A99', fontSize: 10, interval: Math.floor(baseData.length / 8) },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: yName,
      nameTextStyle: { color: '#6B7A99', fontSize: 10 },
      axisLine: { show: false },
      axisLabel: { color: '#6B7A99', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(42,58,92,0.6)', type: 'dashed' } },
    },
    series: [
      ...series.map(s => ({
        name: s.name,
        type: 'line',
        smooth,
        showSymbol: false,
        data: s.data.map(d => d.value),
        lineStyle: { color: s.color, width: 2, type: s.dashed ? 'dashed' : 'solid' },
        itemStyle: { color: s.color },
        areaStyle:
          !s.dashed
            ? {
                color: {
                  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: s.color + '33' },
                    { offset: 1, color: s.color + '00' },
                  ],
                },
              }
            : undefined,
      })),
      ...(threshold
        ? [
            ({
              type: 'line',
              markLine: {
                symbol: 'none',
                data: [{ yAxis: threshold.value, name: threshold.label }],
                lineStyle: { color: threshold.color ?? '#FF3B5C', width: 2, type: 'dashed' },
                label: {
                  formatter: threshold.label,
                  color: threshold.color ?? '#FF3B5C',
                  fontSize: 10,
                  position: 'end',
                },
              },
              data: [],
            } as any),
          ]
        : []),
    ],
  };
  return <ReactECharts option={option} style={{ height }} opts={{ renderer: 'canvas' }} />;
}

interface GaugeChartProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  threshold?: number;
  height?: number;
}

export function GaugeChart({ value, max, label, unit, threshold, height = 180 }: GaugeChartProps) {
  const pct = value / max;
  const isWarn = threshold != null && value > threshold;
  const color = isWarn ? (value / max > 0.85 ? '#FF3B5C' : '#FF6B35') : '#00FF88';
  const option: EChartsOption = {
    ...baseDarkTheme,
    series: [
      {
        type: 'gauge',
        radius: '85%',
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max,
        splitNumber: 5,
        progress: {
          show: true,
          width: 14,
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#00D4FF' },
                { offset: pct > 0.5 ? 0.5 : pct, color: '#00FF88' },
                { offset: 1, color },
              ],
            },
            borderRadius: 7,
          },
        },
        axisLine: { lineStyle: { width: 14, color: [[1, 'rgba(42,58,92,0.5)']] } as any },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { distance: -22, length: 8, lineStyle: { color: '#6B7A99', width: 1 } },
        axisLabel: { distance: -34, color: '#6B7A99', fontSize: 9 },
        anchor: { show: false },
        title: { offsetCenter: [0, '40%'], color: '#6B7A99', fontSize: 11 },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '5%'],
          fontSize: 28,
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 600,
          color,
          formatter: `{value} ${unit}`,
        },
        data: [{ value: Number(value.toFixed(2)), name: label }],
      },
    ],
  };
  return <ReactECharts option={option} style={{ height }} opts={{ renderer: 'canvas' }} />;
}

interface RadialHeatmapProps {
  rows: { label: string; values: number[] }[];
  columns: string[];
  height?: number;
}

export function HeatmapChart({ rows, columns, height = 320 }: RadialHeatmapProps) {
  const flatData: any[] = [];
  let min = Infinity;
  let max = -Infinity;
  rows.forEach((r, i) => {
    r.values.forEach((v, j) => {
      flatData.push([j, i, v]);
      min = Math.min(min, v);
      max = Math.max(max, v);
    });
  });
  const option: EChartsOption = {
    ...baseDarkTheme,
    tooltip: {
      position: 'top',
      formatter: (p: any) => {
        return `<b>${rows[p.value[1]].label}</b> × <b>${columns[p.value[0]]}</b><br/>CV=${p.value[2].toFixed(3)}%`;
      },
    },
    grid: { left: 100, right: 24, top: 36, bottom: 40 },
    xAxis: {
      type: 'category',
      data: columns,
      axisLabel: { color: '#6B7A99', fontSize: 10, rotate: 30 },
      splitArea: { show: true, areaStyle: { color: ['rgba(42,58,92,0.2)', 'rgba(42,58,92,0.05)'] } },
      axisLine: { lineStyle: { color: '#2A3A5C' } },
    },
    yAxis: {
      type: 'category',
      data: rows.map(r => r.label),
      axisLabel: { color: '#6B7A99', fontSize: 10 },
      splitArea: { show: true, areaStyle: { color: ['rgba(42,58,92,0.2)', 'rgba(42,58,92,0.05)'] } },
      axisLine: { lineStyle: { color: '#2A3A5C' } },
    },
    visualMap: {
      min,
      max,
      orient: 'horizontal',
      left: 'center',
      bottom: 4,
      textStyle: { color: '#6B7A99', fontSize: 10 },
      itemWidth: 12,
      itemHeight: 100,
      inRange: {
        color: ['#0B1E3F', '#0A3D6B', '#00D4FF', '#FFD166', '#FF6B35', '#FF3B5C'],
      },
      formatter: (v: any) => Number(v).toFixed(1) + '%',
    },
    series: [
      {
        type: 'heatmap',
        data: flatData,
        label: { show: true, color: '#fff', fontSize: 10, fontFamily: 'JetBrains Mono', formatter: (p: any) => Number(p.value[2]).toFixed(1) },
        itemStyle: { borderRadius: 2, borderColor: '#0B1E3F', borderWidth: 2 },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,212,255,0.6)' } },
      },
    ],
  };
  return <ReactECharts option={option} style={{ height }} opts={{ renderer: 'canvas' }} />;
}
