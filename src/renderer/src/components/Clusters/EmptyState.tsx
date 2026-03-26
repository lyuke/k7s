interface EmptyStateProps {
  onAdd: () => void
}

export const EmptyState = ({ onAdd }: EmptyStateProps) => (
  <div className="empty-state">
    <div className="empty-state-icon">☸️</div>
    <div className="empty-state-title">暂无集群配置</div>
    <div className="empty-state-desc">点击添加按钮导入 kubeconfig 文件开始使用</div>
    <button className="empty-state-btn" onClick={onAdd}>
      添加集群
    </button>
  </div>
)
