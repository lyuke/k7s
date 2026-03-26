import { PodInfo } from '../../../../shared/types'

interface PodDetailModalProps {
  pod: PodInfo | null
  loading: boolean
  onClose: () => void
}

export const PodDetailModal = ({ pod, loading, onClose }: PodDetailModalProps) => {
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

            {pod.containers && pod.containers.length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">容器</div>
                <div className="conditions-table">
                  <div className="conditions-row conditions-head">
                    <div>名称</div>
                    <div>镜像</div>
                    <div>状态</div>
                    <div>重启</div>
                    <div>就绪</div>
                  </div>
                  {pod.containers.map((c, idx) => (
                    <div key={idx} className="conditions-row">
                      <div>{c.name}</div>
                      <div className="detail-value-truncate" style={{maxWidth: '150px'}}>{c.image}</div>
                      <div className={`status ${c.ready ? 'ok' : 'warn'}`}>{c.state}</div>
                      <div>{c.restartCount}</div>
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
