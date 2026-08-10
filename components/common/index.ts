/**
 * The small components every feature page reuses (ADM-040).
 *
 * <p>A single import surface so a page pulls `PageHeader`, `EmptyState` and the rest from one
 * place rather than six. These are the vocabulary of a feature screen; the feature-specific
 * pieces live under `features/`.
 */
export { PageHeader } from "@/components/common/page-header";
export { EmptyState } from "@/components/common/empty-state";
export { ErrorState } from "@/components/common/error-state";
export { StatCard } from "@/components/common/stat-card";
export { StatusBadge } from "@/components/common/status-badge";
export { ConfirmDialog } from "@/components/common/confirm-dialog";
