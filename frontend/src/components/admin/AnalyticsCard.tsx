import { Card, CardContent } from '@/components/ui'

interface AnalyticsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
}

export function AnalyticsCard({ title, value, subtitle, icon }: AnalyticsCardProps) {
  return (
    <Card variant="elevated">
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="text-[#0660B2]">{icon}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
