import { useEffect, useMemo, useRef, useState } from 'react'
import type { PodInfo } from '../../../../shared/types'
import { k8sApi } from '../../api/provider'

interface LogViewerModalProps {
  pod: PodInfo | null
  contextId: string
  onClose: () => void
}

const safeLogFilePart = (value: string) => (
  value.trim().replace(/[^a-zA-Z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown'
)

export const LogViewerModal = ({ pod, contextId, onClose }: LogViewerModalProps) => {
  const [resolvedPod, setResolvedPod] = useState<PodInfo | null>(null)
  const [resolvingPod, setResolvingPod] = useState(false)
  const [logs, setLogs] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [podContextError, setPodContextError] = useState<string | null>(null)
  const [containerName, setContainerName] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const [follow, setFollow] = useState(true)
  const [tailLines, setTailLines] = useState(100)
  const [previous, setPrevious] = useState(false)
  const [timestamps, setTimestamps] = useState(false)
  const [logFilter, setLogFilter] = useState('')
  const logsEndRef = useRef<HTMLDivElement>(null)
  const logsContainerRef = useRef<HTMLPreElement>(null)
  const requestIdRef = useRef(0)
  const streamIdRef = useRef<string | null>(null)
  const displayPod = resolvedPod ?? pod
  const containers = displayPod?.containers || []
  const resolvedContainerName = containers.some((c) => c.name === containerName)
    ? containerName
    : (containers[0]?.name ?? '')
  const normalizedLogFilter = logFilter.trim().toLowerCase()
  const { visibleLogs, logMatchCount } = useMemo(() => {
    if (!normalizedLogFilter) {
      return { visibleLogs: logs, logMatchCount: null as number | null }
    }

    const filteredLogLines = logs
      .split(/\r?\n/)
      .filter((line) => line.toLowerCase().includes(normalizedLogFilter))

    return {
      visibleLogs: filteredLogLines.join('\n'),
      logMatchCount: filteredLogLines.length,
    }
  }, [logs, normalizedLogFilter])

  useEffect(() => {
    let cancelled = false

    if (!pod) {
      setResolvedPod(null)
      setResolvingPod(false)
      setContainerName('')
      setLogs('')
      setError(null)
      setPodContextError(null)
      setFollow(true)
      setPrevious(false)
      setTimestamps(false)
      setLogFilter('')
      return
    }

    setResolvedPod(null)
    setResolvingPod(true)
    setError(null)
    setPodContextError(null)
    setLogFilter('')

    k8sApi.getPodDetail(contextId, pod.namespace, pod.name)
      .then((detail) => {
        if (!cancelled) {
          setResolvedPod(detail)
        }
      })
      .catch((err) => {
        console.error('获取 Pod 日志上下文失败:', err)
        if (!cancelled) {
          setPodContextError(err instanceof Error ? err.message : '获取 Pod 详情失败')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setResolvingPod(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [pod, contextId])

  useEffect(() => {
    if (resolvedContainerName !== containerName) {
      setContainerName(resolvedContainerName)
    }
  }, [containerName, resolvedContainerName])

  useEffect(() => {
    if (resolvedPod && contextId && !resolvingPod && !podContextError && (!follow || previous)) {
      fetchLogs(resolvedContainerName)
    }
  }, [contextId, follow, podContextError, previous, resolvedContainerName, resolvedPod, resolvingPod, tailLines, timestamps])

  useEffect(() => {
    return k8sApi.onPushEvent((event) => {
      if (event.type === 'log:chunk' && event.streamId === streamIdRef.current) {
        setLogs((current) => current + event.chunk)
        setLoading(false)
      }

      if (event.type === 'log:end' && event.streamId === streamIdRef.current) {
        streamIdRef.current = null
        setLoading(false)
        if (event.error) {
          setError(event.error)
        }
      }
    })
  }, [])

  useEffect(() => {
    if (!resolvedPod || !contextId || resolvingPod || !follow || previous || podContextError) return

    let cancelled = false
    setLogs('')
    setLoading(true)
    setError(null)

    k8sApi.startPodLogStream(contextId, {
      namespace: resolvedPod.namespace,
      podName: resolvedPod.name,
      containerName: resolvedContainerName || undefined,
      tailLines,
      previous,
      timestamps,
    })
      .then((result) => {
        if (cancelled) {
          void k8sApi.stopPodLogStream(result.streamId)
          return
        }
        streamIdRef.current = result.streamId
        setLoading(false)
      })
      .catch((err) => {
        if (!cancelled) {
          setLoading(false)
          setError(err instanceof Error ? err.message : '启动实时日志失败')
        }
      })

    return () => {
      cancelled = true
      const currentStreamId = streamIdRef.current
      streamIdRef.current = null
      if (currentStreamId) {
        void k8sApi.stopPodLogStream(currentStreamId)
      }
    }
  }, [contextId, follow, podContextError, previous, resolvedContainerName, resolvedPod, resolvingPod, tailLines, timestamps])

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const fetchLogs = async (targetContainerName = resolvedContainerName) => {
    if (!resolvedPod) return
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)
    try {
      const logContent = await k8sApi.getPodLogs(
        contextId,
        resolvedPod.namespace,
        resolvedPod.name,
        targetContainerName || undefined,
        tailLines,
        previous,
        timestamps,
      )
      if (requestId === requestIdRef.current) {
        setLogs(logContent)
      }
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(err instanceof Error ? err.message : '获取日志失败')
        setLogs('')
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(visibleLogs).then(() => {
      // Could show a toast notification here
    })
  }

  const handleDownloadLogs = () => {
    if (!displayPod || !visibleLogs) return

    const downloadTimestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const containerPart = resolvedContainerName ? `-${safeLogFilePart(resolvedContainerName)}` : ''
    const sourcePart = previous ? '-previous' : ''
    const timestampPart = timestamps ? '-timestamps' : ''
    const fileName = [
      safeLogFilePart(displayPod.namespace),
      safeLogFilePart(displayPod.name),
    ].join('-')
    const blob = new Blob([visibleLogs], { type: 'text/plain;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `${fileName}${containerPart}${sourcePart}${timestampPart}-${downloadTimestamp}.log`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
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

  const handlePreviousChange = (checked: boolean) => {
    setPrevious(checked)
    if (checked) {
      setFollow(false)
    }
  }

  if (!displayPod) return null

  const showContainerSelect = containers.length > 1

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content log-viewer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Pod 日志 - {displayPod.name}</h2>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>
        <div className="log-viewer-toolbar">
          <div className="log-viewer-filters">
            {showContainerSelect && (
              <div className="log-viewer-select">
                <label>容器:</label>
                <select
                  value={resolvedContainerName}
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
            <div className="log-viewer-search">
              <label>搜索:</label>
              <input
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                placeholder="过滤日志"
                spellCheck={false}
              />
              {logFilter && (
                <button
                  className="log-viewer-clear"
                  onClick={() => setLogFilter('')}
                  title="清空日志搜索"
                >
                  清空
                </button>
              )}
            </div>
            <button className="log-viewer-btn" onClick={() => { void fetchLogs() }} disabled={loading || follow}>
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
            <label className="log-viewer-checkbox">
              <input
                type="checkbox"
                checked={follow}
                disabled={previous}
                onChange={(e) => setFollow(e.target.checked)}
              />
              实时追踪
            </label>
            <label className="log-viewer-checkbox">
              <input
                type="checkbox"
                checked={previous}
                onChange={(e) => handlePreviousChange(e.target.checked)}
              />
              上一轮日志
            </label>
            <label className="log-viewer-checkbox">
              <input
                type="checkbox"
                checked={timestamps}
                onChange={(e) => setTimestamps(e.target.checked)}
              />
              时间戳
            </label>
            <button className="log-viewer-btn" onClick={handleCopyLogs}>
              复制
            </button>
            <button className="log-viewer-btn" onClick={handleDownloadLogs} disabled={!visibleLogs}>
              下载
            </button>
          </div>
        </div>
        <div className="log-viewer-body">
          {loading || resolvingPod ? (
            <div className="log-viewer-loading">加载中...</div>
          ) : podContextError ? (
            <div className="log-viewer-error">{podContextError}</div>
          ) : error ? (
            <div className="log-viewer-error">{error}</div>
          ) : (
            <pre
              ref={logsContainerRef}
              className="log-viewer-content"
              onScroll={handleScroll}
            >
              {visibleLogs || (normalizedLogFilter ? '无匹配日志' : '无可用日志')}
              <div ref={logsEndRef} />
            </pre>
          )}
        </div>
        <div className="log-viewer-footer">
          <span className="log-viewer-info">
            {resolvedContainerName && `容器: ${resolvedContainerName}`}
            {resolvedContainerName && ' | '}
            {previous ? `显示上一轮最近 ${tailLines} 行` : follow ? `实时追踪最近 ${tailLines} 行` : `显示最近 ${tailLines} 行`}
            {timestamps && ' | 时间戳'}
            {logMatchCount !== null && ` | 匹配 ${logMatchCount} 行`}
          </span>
        </div>
      </div>
    </div>
  )
}
