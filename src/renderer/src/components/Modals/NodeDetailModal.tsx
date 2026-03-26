import { NodeInfo } from '../../../../shared/types'

interface NodeDetailModalProps {
  node: NodeInfo | null
  loading: boolean
  onClose: () => void
}

export const NodeDetailModal = ({ node, loading, onClose }: NodeDetailModalProps) => {
  if (!node && !loading) return null

  const getInternalIP = () => {
    return node?.addresses?.find(a => a.type === 'InternalIP')?.address ?? '-'
  }

  const getExternalIP = () => {
    return node?.addresses?.find(a => a.type === 'ExternalIP')?.address ?? '-'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
