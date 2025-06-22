import { Group } from '@visx/group'
import { scaleTime } from '@visx/scale'

export interface EventItem {
  id: number
  title: string
  date: string
}

interface TimelineProps {
  events: EventItem[]
  selectedId: number | null
  onSelect: (id: number) => void
}

export default function Timeline({ events, selectedId, onSelect }: TimelineProps) {
  const width = 800
  const height = 80
  const margin = 40

  if (events.length === 0) {
    return (
      <div className="h-20 flex items-center justify-center text-gray-500">
        No events yet
      </div>
    )
  }

  const dates = events.map((e) => new Date(e.date))
  const min = Math.min(...dates.map((d) => d.getTime()))
  const max = Math.max(...dates.map((d) => d.getTime()))
  const domain =
    min === max
      ? [new Date(min - 86400000), new Date(max + 86400000)]
      : [new Date(min), new Date(max)]
  const xScale = scaleTime({ domain, range: [margin, width - margin] })

  return (
    <svg width={width} height={height} className="max-w-full">
      <Group top={height / 2}>
        <line x1={margin} x2={width - margin} y1={0} y2={0} stroke="#d1d5db" />
        {events.map((e) => {
          const x = xScale(new Date(e.date))
          const selected = e.id === selectedId
          return (
            <g
              key={e.id}
              onClick={() => onSelect(e.id)}
              className="cursor-pointer"
            >
              <circle
                cx={x}
                cy={0}
                r={selected ? 8 : 6}
                fill={selected ? '#2563eb' : '#fff'}
                stroke="#2563eb"
              />
              <text x={x} y={20} textAnchor="middle" fontSize={10}>
                {new Date(e.date).toLocaleDateString()}
              </text>
            </g>
          )
        })}
      </Group>
    </svg>
  )
}
