import { useEffect, useRef, useState } from 'react'
import type { PodInfo } from '../../../../shared/types'
import { isWebMode, k8sApi } from '../../api/provider'

interface PodExecModalProps {
  pod: PodInfo | null
  contextId: string
  onClose: () => void
}

export const PodExecModal = ({ pod, contextId, onClose }: PodExecModalProps) => {
  const [resolvedPod, setResolvedPod] = useState<PodInfo | null>(null)
  const [containerName, setContainerName] = useState('')
  const [command, setCommand] = useState('env | sort')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pod) {
      setResolvedPod(null)
      setContainerName('')
      setOutput('')
      setError(null)
      setIsLoading(false)
      setIsRunning(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)
    setOutput('')

    k8sApi.getPodDetail(contextId, pod.namespace, pod.name)
      .then((detail) => {
        if (cancelled) return
        setResolvedPod(detail)
        setContainerName(detail.containers?.[0]?.name ?? '')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '获取 Pod 详情失败')
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [contextId, pod])

  useEffect(() => {
    return k8sApi.onPushEvent((event) => {
      if (event.type === 'exec:chunk' && event.sessionId === sessionIdRef.current) {
        setOutput((current) => current + event.chunk)
        setIsLoading(false)
        setIsRunning(true)
      }
      if (event.type === 'exec:end' && event.sessionId === sessionIdRef.current) {
        setIsLoading(false)
        setIsRunning(false)
        if (event.error) {
          setError(event.error)
        }
        sessionIdRef.current = null
      }
    })
  }, [])

  useEffect(() => {
    return () => {
      const currentSession = sessionIdRef.current
      if (currentSession) {
        void k8sApi.stopPodExec(currentSession)
      }
    }
  }, [])

  if (!pod) return null

  const displayPod = resolvedPod ?? pod
  const containers = displayPod.containers ?? []

  const handleRun = async () => {
    if (isWebMode) {
      setError('Pod Exec 仅在桌面模式可用')
      return
    }
    if (!command.trim()) {
      setError('请输入要执行的命令')
      return
    }

    setError(null)
    setOutput('')
    setIsLoading(true)

    try {
      const result = await k8sApi.startPodExec(contextId, {
        namespace: displayPod.namespace,
        podName: displayPod.name,
        containerName: containerName || undefined,
        command,
      })
      sessionIdRef.current = result.sessionId
      setIsRunning(true)
    } catch (err) {
      setIsLoading(false)
      setIsRunning(false)
      setError(err instanceof Error ? err.message : '执行命令失败')
    }
  }

  const handleStop = async () => {
    const currentSession = sessionIdRef.current
    if (!currentSession) return
    await k8sApi.stopPodExec(currentSession)
    sessionIdRef.current = null
    setIsRunning(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content exec-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Pod Exec - {displayPod.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="exec-toolbar">
          <div className="exec-field">
            <label>容器</label>
            <select value={containerName} onChange={(e) => setContainerName(e.target.value)} disabled={isLoading || isRunning}>
              {containers.map((container) => (
                <option key={container.name} value={container.name}>{container.name}</option>
              ))}
            </select>
          </div>
          <div className="exec-field exec-command-field">
            <label>命令</label>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="env | sort"
              disabled={isLoading || isRunning}
            />
          </div>
          <div className="exec-actions">
            <button className="log-viewer-btn" onClick={handleRun} disabled={isLoading || isRunning}>
              {isLoading ? '执行中...' : '运行'}
            </button>
            <button className="log-viewer-btn delete-btn" onClick={handleStop} disabled={!isRunning}>
              停止
            </button>
          </div>
        </div>
        {error && <div className="detail-error exec-error">{error}</div>}
        <div className="exec-output">
          <pre>{output || (isLoading ? '正在执行命令...' : '等待命令输出')}</pre>
        </div>
      </div>
    </div>
  )
}
