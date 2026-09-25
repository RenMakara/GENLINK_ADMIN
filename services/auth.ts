import { useMutation } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

export interface RecoveryCodesResponse {
  recoveryCodes: string[];
}

/** ADM-112: replaces the current admin's recovery codes after server-side sudo verification. */
export function useRegenerateRecoveryCodes() {
  return useMutation<RecoveryCodesResponse, unknown, void>({
    mutationFn: () => api.post<RecoveryCodesResponse>(endpoints.auth.recoveryCodes),
  });
}
