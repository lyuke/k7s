import { useEffect, useRef, useState } from 'react'
import { PodInfo } from '../../../../shared/types'
import { k8sApi } from '../../api/provider'

interface LogViewerModalProps {
  pod: PodInfo | null
  contextId: string
  onClose: () => void
}

export const LogViewerModal = ({ pod, contextId, onClose }: LogViewerModalProps) => {
  const [logs, setLogs] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [containerName, setContainerName] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const [tailLines, setTailLines] = useState(100)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const logsContainerRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (pod) {
      // Set default container
      if (pod.containers && pod.containers.length > 0 && !containerName) {
        setContainerName(pod.containers[0].name)
      }
    }
  }, [pod])

  useEffect(() => {
    if (pod && contextId) {
      fetchLogs()
    }
  }, [pod, contextId, containerName, tailLines])

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const fetchLogs = async () => {
    if (!pod) return
    setLoading(true)
    setError(null)
    try {
      const logContent = await k8sApi.getPodLogs(
        contextId,
        pod.namespace,
        pod.name,
        containerName || undefined,
        tailLines
      )
      setLogs(logContent)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取日志失败')
      setLogs('')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(logs).then(() => {
      // Could show a toast notification here
    })
  }

  const handleScroll = () => {
    if (logsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      if (!isAtBottom && autoScroll) {
        setAutoScroll(false)
      }
    }
  }

  if (!pod) return null

  const containers = pod.containers || []
  const showContainerSelect = containers.length > 1

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content log-viewer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Pod 日志 - {pod.name}</h2>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>
        <div className="log-viewer-toolbar">
          <div className="log-viewer-filters">
            {showContainerSelect && (
              <div className="log-viewer-select">
                <label>容器:</label>
                <select
                  value={containerName}
                  onChange={(e) => setContainerName(e.target.value)}
                >
                  {containers.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="log-viewer-select">
              <label>行数:</label>
              <select
                value={tailLines}
                onChange={(e) => setTailLines(Number(e.target.value))}
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
              </select>
            </div>
            <button className="log-viewer-btn" onClick={fetchLogs} disabled={loading}>
              刷新
            </button>
          </div>
          <div className="log-viewer-actions">
            <label className="log-viewer-checkbox">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              自动滚动
            </label>
            <button className="log-viewer-btn" onClick={handleCopyLogs}>
              复制
            </button>
          </div>
        </div>
        <div className="log-viewer-body">
          {loading ? (
            <div className="log-viewer-loading">加载中...</div>
          ) : error ? (
            <div className="log-viewer-error">{error}</div>
          ) : (
            <pre
              ref={logsContainerRef}
              className="log-viewer-content"
              onScroll={handleScroll}
            >
              {logs || '无可用日志'}
              <div ref={logsEndRef} />
            </pre>
          )}
        </div>
        <div className="log-viewer-footer">
          <span className="log-viewer-info">
            {containerName && `容器: ${containerName}`}
            {containerName && ' | '}
            显示最近 {tailLines} 行
          </span>
        </div>
      </div>
    </div>
  )
}
