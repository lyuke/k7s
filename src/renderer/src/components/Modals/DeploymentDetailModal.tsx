import type { DeploymentInfo } from '../../../../shared/types'

interface DeploymentDetailModalProps {
  deploy: DeploymentInfo | null
  loading: boolean
  onClose: () => void
}

export const DeploymentDetailModal = ({ deploy, loading, onClose }: DeploymentDetailModalProps) => {
  if (!deploy && !loading) return null

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
                  <span className="detail-label">存活时间</span>
                  <span className="detail-value">{deploy.age}</span>
                </div>
              </div>
            </div>

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
          </div>
        )}
      </div>
    </div>
  )
}
