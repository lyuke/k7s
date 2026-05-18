import type { PodInfo } from '../../../../shared/types'

interface PodDetailModalProps {
  pod: PodInfo | null
  loading: boolean
  error: string | null
  onViewLogs: (pod: PodInfo) => void
  onEnterShell?: (pod: PodInfo) => void
  onAttachPod?: (pod: PodInfo) => void
  onExecPod?: (pod: PodInfo) => void
  onPortForwardPod?: (pod: PodInfo) => void
  onDescribePod?: (pod: PodInfo) => void | Promise<void>
  onEditMetadata?: (pod: PodInfo) => void | Promise<void>
  onEditYaml?: (pod: PodInfo) => void
  onDeletePod?: (pod: PodInfo) => void | Promise<void>
  onEvictPod?: (pod: PodInfo) => void | Promise<void>
  onForceDeletePod?: (pod: PodInfo) => void | Promise<void>
  onClose: () => void
}

export const PodDetailModal = ({
  pod,
  loading,
  error,
  onViewLogs,
  onEnterShell,
  onAttachPod,
  onExecPod,
  onPortForwardPod,
  onDescribePod,
  onEditMetadata,
  onEditYaml,
  onDeletePod,
  onEvictPod,
  onForceDeletePod,
  onClose,
}: PodDetailModalProps) => {
  if (!pod && !loading) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Pod 详情</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {loading ? (
          <div className="modal-loading">加载中...</div>
        ) : pod && (
          <div className="modal-body">
            {error && (
              <div className="detail-error">
                {error}
              </div>
            )}
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">名称</span>
                  <span className="detail-value">{pod.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">命名空间</span>
                  <span className="detail-value">{pod.namespace}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">状态</span>
                  <span className={`detail-value status ${pod.status === 'Running' ? 'ok' : 'warn'}`}>{pod.status}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">节点</span>
                  <span className="detail-value">{pod.nodeName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Pod IP</span>
                  <span className="detail-value">{pod.podIP ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Host IP</span>
                  <span className="detail-value">{pod.hostIP ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">重启次数</span>
                  <span className="detail-value">{pod.restarts}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">CPU</span>
                  <span className="detail-value">{pod.cpu ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Memory</span>
                  <span className="detail-value">{pod.memory ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">存活时间</span>
                  <span className="detail-value">{pod.age}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">服务账户</span>
                  <span className="detail-value">{pod.serviceAccount ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">优先级</span>
                  <span className="detail-value">{pod.priority ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">QoS</span>
                  <span className="detail-value">{pod.qosClass ?? '-'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section pod-actions-section">
              <div className="detail-section-header">
                <div className="detail-section-title">Pod 操作</div>
                <div className="pod-action-bar">
                  <button className="action-btn logs-btn" onClick={() => onViewLogs(pod)} title="查看 Pod 日志">
                    Logs
                  </button>
                  {onEnterShell && (
                    <button className="action-btn shell-btn" onClick={() => onEnterShell(pod)} title="进入 Pod Shell">
                      Shell
                    </button>
                  )}
                  {onAttachPod && (
                    <button className="action-btn shell-btn" onClick={() => onAttachPod(pod)} title="Attach 到 Pod 主进程">
                      Attach
                    </button>
                  )}
                  {onExecPod && (
                    <button className="action-btn scale-btn" onClick={() => onExecPod(pod)} title="执行命令">
                      Exec
                    </button>
                  )}
                  {onPortForwardPod && (
                    <button className="action-btn scale-btn" onClick={() => onPortForwardPod(pod)} title="端口转发">
                      Port
                    </button>
                  )}
                  {onDescribePod && (
                    <button className="action-btn describe-btn" onClick={() => onDescribePod(pod)} title="查看 Describe 输出">
                      Describe
                    </button>
                  )}
                  {onEditMetadata && (
                    <button className="action-btn metadata-btn" onClick={() => onEditMetadata(pod)} title="更新标签或注解">
                      Meta
                    </button>
                  )}
                  {onEditYaml && (
                    <button className="action-btn yaml-btn" onClick={() => onEditYaml(pod)} title="编辑 YAML">
                      YAML
                    </button>
                  )}
                  {onEvictPod && (
                    <button className="action-btn delete-btn" onClick={() => onEvictPod(pod)} title="Evict Pod">
                      Evict
                    </button>
                  )}
                  {onDeletePod && (
                    <button className="action-btn delete-btn" onClick={() => onDeletePod(pod)} title="删除 Pod">
                      Delete
                    </button>
                  )}
                  {onForceDeletePod && (
                    <button className="action-btn delete-btn" onClick={() => onForceDeletePod(pod)} title="强制删除 Pod">
                      Force
                    </button>
                  )}
                </div>
              </div>
            </div>

            {pod.containers && pod.containers.length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">容器</div>
                <div className="conditions-table pod-containers-table">
                  <div className="conditions-row conditions-head pod-containers-row">
                    <div>名称</div>
                    <div>镜像</div>
                    <div>状态</div>
                    <div>重启</div>
                    <div>CPU</div>
                    <div>Memory</div>
                    <div>就绪</div>
                  </div>
                  {pod.containers.map((c, idx) => (
                    <div key={idx} className="conditions-row pod-containers-row">
                      <div>{c.name}</div>
                      <div className="detail-value-truncate" style={{maxWidth: '150px'}}>{c.image}</div>
                      <div className={`status ${c.ready ? 'ok' : 'warn'}`}>{c.state}</div>
                      <div>{c.restartCount}</div>
                      <div>{c.cpu ?? '-'}</div>
                      <div>{c.memory ?? '-'}</div>
                      <div>{c.ready ? '是' : '否'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pod.labels && Object.keys(pod.labels).length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">标签</div>
                <div className="labels-list">
                  {Object.entries(pod.labels).map(([key, value]) => (
                    <div key={key} className="label-item">
                      <span className="label-key">{key}</span>
                      <span className="label-eq">=</span>
                      <span className="label-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
