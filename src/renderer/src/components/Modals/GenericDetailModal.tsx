import React from 'react'
import { DeploymentInfo, DaemonSetInfo, StatefulSetInfo, ReplicaSetInfo, JobInfo, CronJobInfo } from '../../../../shared/types'

interface GenericDetailModalProps<T> {
  resource: T | null
  loading: boolean
  onClose: () => void
  title: string
  renderDetails: (res: T) => React.ReactNode
}

export const GenericDetailModal = <T extends DeploymentInfo | DaemonSetInfo | StatefulSetInfo | ReplicaSetInfo | JobInfo | CronJobInfo>({
  resource,
  loading,
  onClose,
  title,
  renderDetails
}: GenericDetailModalProps<T>) => {
  if (!resource && !loading) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {loading ? (
          <div className="modal-loading">加载中...</div>
        ) : resource && renderDetails(resource)}
      </div>
    </div>
  )
}
