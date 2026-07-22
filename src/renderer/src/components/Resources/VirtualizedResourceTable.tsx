import { useEffect, useMemo, useRef, useState, type CSSProperties, type Key, type ReactNode } from 'react'

type VirtualizedResourceTableProps<T> = {
  rows: T[]
  header: ReactNode
  emptyState: ReactNode
  renderRow: (row: T, index: number) => ReactNode
  getRowKey: (row: T, index: number) => Key
  resetKey?: string
  rowHeight?: number
  overscan?: number
}

export const VirtualizedResourceTable = <T,>({
  rows,
  header,
  emptyState,
  renderRow,
  getRowKey,
  resetKey,
  rowHeight = 38,
  overscan = 8,
}: VirtualizedResourceTableProps<T>) => {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const updateViewportHeight = () => setViewportHeight(viewport.clientHeight)
    updateViewportHeight()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateViewportHeight)
      return () => window.removeEventListener('resize', updateViewportHeight)
    }

    const observer = new ResizeObserver(updateViewportHeight)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    viewport.scrollTop = 0
    setScrollTop(0)
  }, [resetKey])

  const { endIndex, startIndex, totalHeight, visibleRows } = useMemo(() => {
    const totalHeight = rows.length * rowHeight
    const visibleCount = viewportHeight > 0
      ? Math.ceil(viewportHeight / rowHeight)
      : overscan * 2
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
    const endIndex = Math.min(rows.length, startIndex + visibleCount + overscan * 2)
    const visibleRows = rows.slice(startIndex, endIndex)

    return {
      endIndex,
      startIndex,
      totalHeight,
      visibleRows,
    }
  }, [overscan, rowHeight, rows, scrollTop, viewportHeight])

  const style = {
    '--virtualized-row-height': `${rowHeight}px`,
  } as CSSProperties

  return (
    <div className="table virtualized-table" style={style}>
      {header}
      {rows.length === 0 ? (
        emptyState
      ) : (
        <div
          className="virtualized-table-viewport"
          ref={viewportRef}
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        >
          <div className="virtualized-table-spacer" style={{ height: totalHeight }}>
            {visibleRows.map((row, offset) => {
              const index = startIndex + offset
              return (
                <div
                  className="virtualized-table-slot"
                  key={getRowKey(row, index)}
                  style={{ transform: `translateY(${index * rowHeight}px)` }}
                >
                  {renderRow(row, index)}
                </div>
              )
            })}
            {endIndex < rows.length && (
              <span className="virtualized-table-sentinel" aria-hidden="true" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
