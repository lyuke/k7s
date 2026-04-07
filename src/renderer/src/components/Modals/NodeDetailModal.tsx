import type { EventInfo, NodeInfo, NodeMetrics, PodInfo } from '../../../../shared/types'

interface NodeDetailModalProps {
  node: NodeInfo | null
  loading: boolean
  metrics: NodeMetrics | null
  metricsLoading: boolean
  pods: PodInfo[]
  events: EventInfo[]
  onClose: () => void
}

export const NodeDetailModal = ({ node, loading, metrics, metricsLoading, pods, events, onClose }: NodeDetailModalProps) => {
  if (!node && !loading) return null

  const getInternalIP = () => {
    return node?.addresses?.find(a => a.type === 'InternalIP')?.address ?? '-'
  }

  const getExternalIP = () => {
    return node?.addresses?.find(a => a.type === 'ExternalIP')?.address ?? '-'
  }

  const formatCPU = (cpu: string) => {
    if (!cpu) return '-'
    // CPU is usually in nanocores, convert to cores
    if (cpu.endsWith('n')) {
      const cores = parseInt(cpu) / 1000000000
      return cores.toFixed(2) + ' cores'
    }
    if (cpu.endsWith('m')) {
      return cpu + ' (millicores)'
    }
    return cpu
  }

  const formatMemory = (memory: string) => {
    if (!memory) return '-'
    // Memory is usually in bytes, convert to Mi or Gi
    const bytes = parseInt(memory)
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' Ki'
    }
    if (bytes < 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(2) + ' Mi'
    }
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' Gi'
  }

  const abnormalConditions = node?.conditions?.filter((cond) => {
    if (cond.type === 'Ready') return cond.status !== 'True'
    if (['MemoryPressure', 'DiskPressure', 'PIDPressure', 'NetworkUnavailable'].includes(cond.type)) {
      return cond.status !== 'False'
    }
    return cond.status === 'Unknown'
  }) ?? []

  const warningEvents = events.filter((event) => event.type === 'Warning')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content node-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>节点详情</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {loading ? (
          <div className="modal-loading">加载中...</div>
        ) : node && (
          <div className="modal-body">
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">名称</span>
                  <span className="detail-value">{node.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">状态</span>
                  <span className={`detail-value status ${node.status === 'Ready' ? 'ok' : 'warn'}`}>{node.status}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">角色</span>
                  <span className="detail-value">{node.roles}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">版本</span>
                  <span className="detail-value">{node.version}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">存活时间</span>
                  <span className="detail-value">{node.age}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">不可调度</span>
                  <span className="detail-value">{node.unschedulable ? '是' : '否'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">报错信息</div>
              {abnormalConditions.length === 0 && warningEvents.length === 0 ? (
                <div className="detail-item">
                  <span className="detail-value">当前未发现该节点相关报错</span>
                </div>
              ) : (
                <div className="issue-list">
                  {abnormalConditions.map((cond, idx) => (
                    <div key={`${cond.type}-${idx}`} className="issue-item">
                      <div className="issue-item-header">
                        <span className="issue-item-kind">Condition</span>
                        <span className="issue-item-title">{cond.type}</span>
                        <span className="issue-item-badge">{cond.status}</span>
                      </div>
                      <div className="issue-item-message">{cond.message || cond.reason || '节点条件异常'}</div>
                      <div className="issue-item-meta">
                        原因: {cond.reason ?? '-'}
                        {cond.lastTransitionTime ? ` | 变更时间: ${new Date(cond.lastTransitionTime).toLocaleString()}` : ''}
                      </div>
                    </div>
                  ))}
                  {warningEvents.map((event) => (
                    <div key={`${event.namespace}-${event.name}`} className="issue-item">
                      <div className="issue-item-header">
                        <span className="issue-item-kind">Event</span>
                        <span className="issue-item-title">{event.reason || 'Warning'}</span>
                        <span className="issue-item-badge">x{event.count}</span>
                      </div>
                      <div className="issue-item-message">{event.message || '无详细信息'}</div>
                      <div className="issue-item-meta">对象: {event.object || '-'} | 时间: {event.age}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="detail-section">
              <div className="detail-section-title">网络信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">内部IP</span>
                  <span className="detail-value">{getInternalIP()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">外部IP</span>
                  <span className="detail-value">{getExternalIP()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Pod CIDR</span>
                  <span className="detail-value">{node.podCIDR ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Provider ID</span>
                  <span className="detail-value detail-value-truncate">{node.providerID ?? '-'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">系统信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">操作系统</span>
                  <span className="detail-value">{node.os ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">架构</span>
                  <span className="detail-value">{node.architecture ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">内核版本</span>
                  <span className="detail-value">{node.kernelVersion ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">容器运行时</span>
                  <span className="detail-value">{node.containerRuntime ?? '-'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">资源容量</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">CPU</span>
                  <span className="detail-value">{node.capacity?.cpu ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">内存</span>
                  <span className="detail-value">{node.capacity?.memory ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Pod 数量</span>
                  <span className="detail-value">{node.capacity?.pods ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">临时存储</span>
                  <span className="detail-value">{node.capacity?.ephemeralStorage ?? '-'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">监控信息</div>
              {metricsLoading ? (
                <div className="modal-loading">加载监控数据...</div>
              ) : metrics ? (
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">CPU 使用</span>
                    <span className="detail-value">{formatCPU(metrics.cpu)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">内存使用</span>
                    <span className="detail-value">{formatMemory(metrics.memory)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">采集时间</span>
                    <span className="detail-value">{metrics.timestamp ? new Date(metrics.timestamp).toLocaleString() : '-'}</span>
                  </div>
                </div>
              ) : (
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">状态</span>
                    <span className="detail-value warn">无法获取监控数据（需要部署 metrics-server）</span>
                  </div>
                </div>
              )}
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Pods ({pods.length})</div>
              {pods.length > 0 ? (
                <div className="pods-table">
                  <div className="conditions-row conditions-head">
                    <div>名称</div>
                    <div>命名空间</div>
                    <div>状态</div>
                    <div>重启</div>
                    <div>存活时间</div>
                  </div>
                  {pods.map((pod) => (
                    <div key={`${pod.namespace}-${pod.name}`} className="conditions-row">
                      <div className="detail-value-truncate" style={{maxWidth: '150px'}}>{pod.name}</div>
                      <div>{pod.namespace}</div>
                      <div className={`status ${pod.status === 'Running' ? 'ok' : 'warn'}`}>{pod.status}</div>
                      <div>{pod.restarts}</div>
                      <div>{pod.age}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="detail-item">
                  <span className="detail-value">该节点上没有运行的 Pod</span>
                </div>
              )}
            </div>

            {node.taints && node.taints.length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">污点</div>
                <div className="taint-list">
                  {node.taints.map((taint, idx) => (
                    <div key={idx} className="taint-item">
                      <span className="taint-key">{taint.key}</span>
                      {taint.value && <span className="taint-value">={taint.value}</span>}
                      <span className="taint-effect">:{taint.effect}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {node.conditions && node.conditions.length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">条件状态</div>
                <div className="conditions-table">
                  <div className="conditions-row conditions-head">
                    <div>类型</div>
                    <div>状态</div>
                    <div>原因</div>
                  </div>
                  {node.conditions.map((cond, idx) => (
                    <div key={idx} className="conditions-row">
                      <div>{cond.type}</div>
                      <div className={cond.status === 'True' ? 'status ok' : 'status warn'}>{cond.status}</div>
                      <div>{cond.reason ?? '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {node.labels && Object.keys(node.labels).length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">标签</div>
                <div className="labels-list">
                  {Object.entries(node.labels).map(([key, value]) => (
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
