import { useEffect, useRef, useState } from 'react'
import type { PodInfo } from '../../../../shared/types'
import { isWebMode, k8sApi } from '../../api/provider'

interface PortForwardModalProps {
  pod: PodInfo | null
  contextId: string
  onClose: () => void
}

export const PortForwardModal = ({ pod, contextId, onClose }: PortForwardModalProps) => {
  const [targetPort, setTargetPort] = useState(8080)
  const [localPort, setLocalPort] = useState(8080)
  const [status, setStatus] = useState<string>('等待启动')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pod) {
      setTargetPort(8080)
      setLocalPort(8080)
      setStatus('等待启动')
      setError(null)
      setIsLoading(false)
      setIsRunning(false)
      return
    }

    const firstContainer = pod.containers?.[0]
    const inferredPort = firstContainer && /\:(\d+)(?:\/|$)/.exec(firstContainer.image) ? Number(/\:(\d+)(?:\/|$)/.exec(firstContainer.image)?.[1]) : 8080
    setTargetPort(inferredPort || 8080)
    setLocalPort(inferredPort || 8080)
    setStatus('等待启动')
    setError(null)
    setIsLoading(false)
    setIsRunning(false)
  }, [pod])

  useEffect(() => {
    return k8sApi.onPushEvent((event) => {
      if (event.type !== 'port-forward' || event.sessionId !== sessionIdRef.current) return
      setStatus(event.message || event.state)
      setLocalPort(event.localPort)
      setTargetPort(event.targetPort)
      setIsLoading(false)
      setIsRunning(event.state === 'running')
      if (event.state === 'error' && event.message) {
        setError(event.message)
      }
      if (event.state !== 'running') {
        sessionIdRef.current = null
      }
    })
  }, [])

  useEffect(() => {
    return () => {
      const currentSession = sessionIdRef.current
      if (currentSession) {
        void k8sApi.stopPortForward(currentSession)
      }
    }
  }, [])

  if (!pod) return null

  const handleStart = async () => {
    if (isWebMode) {
      setError('端口转发仅在桌面模式可用')
      return
    }
    if (!targetPort || targetPort < 1) {
      setError('请输入有效的目标端口')
      return
    }

    setError(null)
    setIsLoading(true)
    setStatus('正在启动端口转发...')

    try {
      const result = await k8sApi.startPortForward(contextId, {
        namespace: pod.namespace,
        podName: pod.name,
        targetPort,
        localPort,
      })
      sessionIdRef.current = result.sessionId
      setLocalPort(result.localPort)
      setStatus(result.message || `127.0.0.1:${result.localPort}`)
      setIsLoading(false)
      setIsRunning(true)
    } catch (err) {
      setIsLoading(false)
      setIsRunning(false)
      setError(err instanceof Error ? err.message : '启动端口转发失败')
    }
  }

  const handleStop = async () => {
    const currentSession = sessionIdRef.current
    if (!currentSession) return
    await k8sApi.stopPortForward(currentSession)
    sessionIdRef.current = null
    setIsRunning(false)
    setStatus('已停止')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content port-forward-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>端口转发 - {pod.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="exec-toolbar">
          <div className="exec-field">
            <label>目标端口</label>
            <input
              type="number"
              value={targetPort}
              onChange={(e) => setTargetPort(Number(e.target.value) || 0)}
              disabled={isLoading || isRunning}
            />
          </div>
          <div className="exec-field">
            <label>本地端口</label>
            <input
              type="number"
              value={localPort}
              onChange={(e) => setLocalPort(Number(e.target.value) || 0)}
              disabled={isLoading || isRunning}
            />
          </div>
          <div className="exec-actions">
            <button className="log-viewer-btn" onClick={handleStart} disabled={isLoading || isRunning}>
              {isLoading ? '启动中...' : '启动'}
            </button>
            <button className="log-viewer-btn delete-btn" onClick={handleStop} disabled={!isRunning}>
              停止
            </button>
          </div>
        </div>
        {error && <div className="detail-error exec-error">{error}</div>}
        <div className="port-forward-summary">
          <div className={`status-pill ${isRunning ? 'ready' : isLoading ? 'loading' : ''}`}>
            {isRunning ? '运行中' : isLoading ? '启动中' : '未启动'}
          </div>
          <div className="detail-value">
            访问地址: {`http://127.0.0.1:${localPort}`}
          </div>
          <div className="detail-value">
            状态: {status}
          </div>
        </div>
      </div>
    </div>
  )
}
