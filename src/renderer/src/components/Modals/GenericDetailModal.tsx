import React from 'react'
import type {
  APIServerHealthInfo,
  APIGroupInfo,
  APIResourceInfo,
  APIServiceInfo,
  AdmissionWebhookConfigurationInfo,
  CertificateSigningRequestInfo,
  ClusterTrustBundleInfo,
  ComponentStatusInfo,
  ConfigMapInfo,
  CronJobInfo,
  CSIDriverInfo,
  CSINodeInfo,
  CSIStorageCapacityInfo,
  DaemonSetInfo,
  DeploymentInfo,
  DeviceClassInfo,
  DeviceTaintRuleInfo,
  EventInfo,
  EndpointInfo,
  EndpointSliceInfo,
  FlowSchemaInfo,
  GatewayClassInfo,
  GatewayInfo,
  GRPCRouteInfo,
  HTTPRouteInfo,
  HPAInfo,
  IngressClassInfo,
  IngressInfo,
  IPAddressInfo,
  JobInfo,
  LeaseCandidateInfo,
  LeaseInfo,
  LimitRangeInfo,
  MutatingAdmissionPolicyBindingInfo,
  MutatingAdmissionPolicyInfo,
  NamespaceInfo,
  NetworkPolicyInfo,
  OpenIDConfigurationInfo,
  PodCertificateRequestInfo,
  PodDisruptionBudgetInfo,
  PriorityClassInfo,
  PriorityLevelConfigurationInfo,
  PersistentVolumeClaimInfo,
  PersistentVolumeInfo,
  ReferenceGrantInfo,
  ResourceClaimInfo,
  ResourceClaimTemplateInfo,
  ResourceQuotaInfo,
  ResourceSliceInfo,
  ClusterRoleBindingInfo,
  ClusterRoleInfo,
  ReplicaSetInfo,
  RoleBindingInfo,
  RoleInfo,
  RuntimeClassInfo,
  SecretInfo,
  SelfSubjectAccessReviewInfo,
  SelfSubjectReviewInfo,
  SelfSubjectRuleInfo,
  ServerVersionInfo,
  ServiceAccountInfo,
  ServiceCIDRInfo,
  ServiceInfo,
  StatefulSetInfo,
  StorageClassInfo,
  StorageVersionInfo,
  StorageVersionMigrationInfo,
  TCPRouteInfo,
  TLSRouteInfo,
  ValidatingAdmissionPolicyBindingInfo,
  ValidatingAdmissionPolicyInfo,
  UDPRouteInfo,
  VolumeAttachmentInfo,
  VolumeAttributesClassInfo,
  VolumeSnapshotClassInfo,
  VolumeSnapshotContentInfo,
  VolumeSnapshotInfo,
} from '../../../../shared/types'

interface GenericDetailModalProps<T> {
  resource: T | null
  loading: boolean
  onClose: () => void
  title: string
  renderDetails: (res: T) => React.ReactNode
}

type GenericDetailResource =
  | DeploymentInfo
  | EventInfo
  | ComponentStatusInfo
  | APIGroupInfo
  | APIResourceInfo
  | ServerVersionInfo
  | OpenIDConfigurationInfo
  | APIServerHealthInfo
  | DaemonSetInfo
  | StatefulSetInfo
  | ReplicaSetInfo
  | JobInfo
  | CronJobInfo
  | ServiceInfo
  | ConfigMapInfo
  | SecretInfo
  | EndpointInfo
  | IngressInfo
  | IngressClassInfo
  | NetworkPolicyInfo
  | IPAddressInfo
  | ServiceCIDRInfo
  | EndpointSliceInfo
  | APIServiceInfo
  | CertificateSigningRequestInfo
  | ClusterTrustBundleInfo
  | PodCertificateRequestInfo
  | StorageVersionInfo
  | StorageVersionMigrationInfo
  | AdmissionWebhookConfigurationInfo
  | MutatingAdmissionPolicyInfo
  | MutatingAdmissionPolicyBindingInfo
  | ValidatingAdmissionPolicyInfo
  | ValidatingAdmissionPolicyBindingInfo
  | FlowSchemaInfo
  | PriorityLevelConfigurationInfo
  | PodDisruptionBudgetInfo
  | ResourceQuotaInfo
  | LimitRangeInfo
  | HPAInfo
  | LeaseInfo
  | LeaseCandidateInfo
  | PriorityClassInfo
  | RuntimeClassInfo
  | NamespaceInfo
  | PersistentVolumeInfo
  | PersistentVolumeClaimInfo
  | StorageClassInfo
  | VolumeAttributesClassInfo
  | CSIDriverInfo
  | CSINodeInfo
  | VolumeAttachmentInfo
  | CSIStorageCapacityInfo
  | VolumeSnapshotClassInfo
  | VolumeSnapshotInfo
  | VolumeSnapshotContentInfo
  | GatewayClassInfo
  | GatewayInfo
  | HTTPRouteInfo
  | GRPCRouteInfo
  | TLSRouteInfo
  | TCPRouteInfo
  | UDPRouteInfo
  | ReferenceGrantInfo
  | DeviceClassInfo
  | ResourceClaimInfo
  | ResourceClaimTemplateInfo
  | ResourceSliceInfo
  | DeviceTaintRuleInfo
  | ServiceAccountInfo
  | RoleInfo
  | RoleBindingInfo
  | ClusterRoleInfo
  | ClusterRoleBindingInfo
  | SelfSubjectReviewInfo
  | SelfSubjectAccessReviewInfo
  | SelfSubjectRuleInfo

export const GenericDetailModal = <T extends GenericDetailResource>({
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
