type SortDirection = 'asc' | 'desc'

interface SortIconProps {
  direction?: SortDirection
}

export const SortIcon = ({ direction }: SortIconProps) => (
  <span className="sort-icon">
    {direction === 'asc' ? '↑' : direction === 'desc' ? '↓' : '↕'}
  </span>
)
