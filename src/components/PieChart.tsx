interface PieChartProps {
  data: {
    label: string;
    value: number;
    color: string;
  }[];
  size?: number;
  showLegend?: boolean;
}

export default function PieChart({ data, size = 200, showLegend = true }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="text-center text-gray-400">
          <p className="text-sm">No data</p>
        </div>
      </div>
    );
  }

  let currentAngle = -90; // Start from top
  const segments = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle: currentAngle,
    };
  });

  const createArc = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(radius, startAngle);
    const end = polarToCartesian(radius, endAngle);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${radius} ${radius} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
  };

  const polarToCartesian = (radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: radius + radius * Math.cos(angleInRadians),
      y: radius + radius * Math.sin(angleInRadians),
    };
  };

  const radius = size / 2;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((segment, index) => (
          <g key={index}>
            <path
              d={createArc(segment.startAngle, segment.endAngle, radius)}
              fill={segment.color}
              className="transition-opacity hover:opacity-80"
            />
          </g>
        ))}
        <circle
          cx={radius}
          cy={radius}
          r={radius * 0.5}
          fill="white"
          className="pointer-events-none"
        />
        <text
          x={radius}
          y={radius}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-2xl font-bold fill-gray-700"
        >
          {total}
        </text>
      </svg>

      {showLegend && (
        <div className="w-full space-y-2">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-gray-700">{segment.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{segment.value}</span>
                <span className="text-gray-500 text-xs">
                  ({segment.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
