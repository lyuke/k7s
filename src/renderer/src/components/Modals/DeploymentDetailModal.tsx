import type { DeploymentInfo, EventInfo, PodInfo, ReplicaSetInfo } from '../../../../shared/types'

interface DeploymentDetailModalProps {
  deploy: DeploymentInfo | null
  loading: boolean
  pods?: PodInfo[]
  replicaSets?: ReplicaSetInfo[]
  events?: EventInfo[]
  onViewPod?: (pod: PodInfo) => void
  onViewPodLogs?: (pod: PodInfo) => void
  onScale?: (deploy: DeploymentInfo) => void | Promise<void>
  onRestart?: (deploy: DeploymentInfo) => void | Promise<void>
  onSetImage?: (deploy: DeploymentInfo) => void | Promise<void>
  onRolloutStatus?: (deploy: DeploymentInfo) => void | Promise<void>
  onRolloutHistory?: (deploy: DeploymentInfo) => void | Promise<void>
  onPauseResume?: (deploy: DeploymentInfo) => void | Promise<void>
  onRollback?: (deploy: DeploymentInfo) => void | Promise<void>
  onDescribe?: (deploy: DeploymentInfo) => void | Promise<void>
  onEditMetadata?: (deploy: DeploymentInfo) => void | Promise<void>
  onEditYaml?: (deploy: DeploymentInfo) => void
  onDelete?: (deploy: DeploymentInfo) => void | Promise<void>
  onClose: () => void
}

export const DeploymentDetailModal = ({
  deploy,
  loading,
  pods = [],
  replicaSets = [],
  events = [],
  onViewPod,
  onViewPodLogs,
  onScale,
  onRestart,
  onSetImage,
  onRolloutStatus,
  onRolloutHistory,
  onPauseResume,
  onRollback,
  onDescribe,
  onEditMetadata,
  onEditYaml,
  onDelete,
  onClose,
}: DeploymentDetailModalProps) => {
  if (!deploy && !loading) return null

  const hasActions = Boolean(
    onScale
    || onRestart
    || onSetImage
    || onRolloutStatus
    || onRolloutHistory
    || onPauseResume
    || onRollback
    || onDescribe
    || onEditMetadata
    || onEditYaml
    || onDelete,
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Deployment 详情</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {loading ? (
          <div className="modal-loading">加载中...</div>
        ) : deploy && (
          <div className="modal-body">
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">名称</span>
                  <span className="detail-value">{deploy.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">命名空间</span>
                  <span className="detail-value">{deploy.namespace}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">期望副本</span>
                  <span className="detail-value">{deploy.replicas}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">就绪副本</span>
                  <span className="detail-value">{deploy.readyReplicas}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">可用副本</span>
                  <span className="detail-value">{deploy.availableReplicas}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">更新副本</span>
                  <span className="detail-value">{deploy.updatedReplicas ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">不可用副本</span>
                  <span className="detail-value">{deploy.unavailableReplicas ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">策略</span>
                  <span className="detail-value">{deploy.strategy ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Rollout</span>
                  <span className="detail-value">{deploy.paused ? 'Paused' : 'Running'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">存活时间</span>
                  <span className="detail-value">{deploy.age}</span>
                </div>
              </div>
            </div>

            {hasActions && (
              <div className="detail-section workload-actions-section">
                <div className="detail-section-header">
                  <div className="detail-section-title">Deployment 操作</div>
                  <div className="workload-action-bar">
                    {onScale && (
                      <button className="action-btn scale-btn" onClick={() => onScale(deploy)}>
                        Scale
                      </button>
                    )}
                    {onRestart && (
                      <button className="action-btn logs-btn" onClick={() => onRestart(deploy)}>
                        Restart
                      </button>
                    )}
                    {onSetImage && (
                      <button className="action-btn scale-btn" onClick={() => onSetImage(deploy)}>
                        Image
                      </button>
                    )}
                    {onRolloutStatus && (
                      <button className="action-btn logs-btn" onClick={() => onRolloutStatus(deploy)}>
                        Status
                      </button>
                    )}
                    {onRolloutHistory && (
                      <button className="action-btn logs-btn" onClick={() => onRolloutHistory(deploy)}>
                        History
                      </button>
                    )}
                    {onPauseResume && (
                      <button className="action-btn logs-btn" onClick={() => onPauseResume(deploy)}>
                        {deploy.paused ? 'Resume' : 'Pause'}
                      </button>
                    )}
                    {onRollback && (
                      <button className="action-btn yaml-btn" onClick={() => onRollback(deploy)}>
                        Rollback
                      </button>
                    )}
                    {onDescribe && (
                      <button className="action-btn describe-btn" onClick={() => onDescribe(deploy)}>
                        Describe
                      </button>
                    )}
                    {onEditMetadata && (
                      <button className="action-btn metadata-btn" onClick={() => onEditMetadata(deploy)}>
                        Meta
                      </button>
                    )}
                    {onEditYaml && (
                      <button className="action-btn yaml-btn" onClick={() => onEditYaml(deploy)}>
                        YAML
                      </button>
                    )}
                    {onDelete && (
                      <button className="action-btn delete-btn" onClick={() => onDelete(deploy)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {deploy.labels && Object.keys(deploy.labels).length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">标签</div>
                <div className="labels-list">
                  {Object.entries(deploy.labels).map(([key, value]) => (
                    <div key={key} className="label-item">
                      <span className="label-key">{key}</span>
                      <span className="label-eq">=</span>
                      <span className="label-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {deploy.selector && Object.keys(deploy.selector).length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">选择器</div>
                <div className="labels-list">
                  {Object.entries(deploy.selector).map(([key, value]) => (
                    <div key={key} className="label-item">
                      <span className="label-key">{key}</span>
                      <span className="label-eq">=</span>
                      <span className="label-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {replicaSets.length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">关联 ReplicaSets</div>
                <div className="conditions-table deployment-replicasets-table">
                  <div className="conditions-row conditions-head">
                    <div>名称</div>
                    <div>副本</div>
                    <div>就绪</div>
                    <div>可用</div>
                    <div>Owner</div>
                    <div>存活</div>
                  </div>
                  {replicaSets.map((rs) => (
                    <div key={`${rs.namespace}-${rs.name}`} className="conditions-row">
                      <div>{rs.name}</div>
                      <div>{rs.replicas}</div>
                      <div>{rs.readyReplicas}</div>
                      <div>{rs.availableReplicas ?? '-'}</div>
                      <div>{rs.owner ?? '-'}</div>
                      <div>{rs.age}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pods.length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">关联 Pods</div>
                <div className="pods-table deployment-pods-table">
                  <div className="conditions-row conditions-head">
                    <div>名称</div>
                    <div>状态</div>
                    <div>CPU</div>
                    <div>Memory</div>
                    <div>重启</div>
                    <div>节点</div>
                  </div>
                  {pods.map((pod) => (
                    <div key={`${pod.namespace}-${pod.name}`} className="conditions-row">
                      <div>{pod.name}</div>
                      <div className={`status ${pod.status === 'Running' ? 'ok' : 'warn'}`}>{pod.status}</div>
                      <div>{pod.cpu ?? '-'}</div>
                      <div>{pod.memory ?? '-'}</div>
                      <div>{pod.restarts}</div>
                      <div>{pod.nodeName}</div>
                      {(onViewPod || onViewPodLogs) && (
                        <div className="table-row-actions">
                          {onViewPod && (
                            <button
                              className="action-btn yaml-btn"
                              onClick={(event) => {
                                event.stopPropagation()
                                onViewPod(pod)
                              }}
                            >
                              Open
                            </button>
                          )}
                          {onViewPodLogs && (
                            <button
                              className="action-btn logs-btn"
                              onClick={(event) => {
                                event.stopPropagation()
                                onViewPodLogs(pod)
                              }}
                            >
                              Logs
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {events.length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">关联 Events</div>
                <div className="conditions-table deployment-events-table">
                  <div className="conditions-row conditions-head">
                    <div>类型</div>
                    <div>原因</div>
                    <div>对象</div>
                    <div>消息</div>
                    <div>次数</div>
                    <div>时间</div>
                  </div>
                  {events.map((event) => (
                    <div key={`${event.namespace}-${event.name}`} className="conditions-row">
                      <div className={`status ${event.type === 'Warning' ? 'warn' : 'ok'}`}>{event.type}</div>
                      <div>{event.reason}</div>
                      <div>{event.object}</div>
                      <div className="detail-value-truncate">{event.message}</div>
                      <div>{event.count}</div>
                      <div>{event.age}</div>
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
