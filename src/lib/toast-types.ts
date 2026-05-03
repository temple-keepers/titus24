export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id?: string;
  kind: ToastKind;
  title: string;
  body?: string;
  /** ms before auto-dismiss; default 4000 */
  duration?: number;
}
