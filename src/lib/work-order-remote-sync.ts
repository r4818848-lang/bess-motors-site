import type { WorkOrder } from "./store";

/** Merge cloud signature / confirmation into local editor state without clobbering other edits */
export function mergeRemoteWorkOrderPatch(
  local: WorkOrder,
  remote: WorkOrder
): WorkOrder {
  if (remote.id !== local.id) return local;

  const remoteSigned =
    remote.confirmationStatus === "confirmed" &&
    local.confirmationStatus !== "confirmed";
  const remoteHasSig = Boolean(remote.signature?.dataUrl) && !local.signature?.dataUrl;

  if (!remoteSigned && !remoteHasSig && remote.updatedAt <= local.updatedAt) {
    return local;
  }

  if (remote.updatedAt > local.updatedAt || remoteSigned || remoteHasSig) {
    return {
      ...local,
      confirmationStatus: remote.confirmationStatus,
      documentStatus: remote.documentStatus ?? local.documentStatus,
      signature: remote.signature ?? local.signature,
      clientSignature: remote.clientSignature ?? local.clientSignature,
      updatedAt: remote.updatedAt,
      files: remote.files.length >= local.files.length ? remote.files : local.files,
    };
  }

  return local;
}
