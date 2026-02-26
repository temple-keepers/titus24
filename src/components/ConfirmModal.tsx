import Modal from './Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {message}
        </p>
        <div className="flex gap-2">
          <button className="btn btn-secondary flex-1" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            className="btn flex-1"
            style={
              variant === 'danger'
                ? { background: 'rgba(244,63,94,0.15)', color: '#fb7185', border: '1.5px solid rgba(244,63,94,0.3)' }
                : { background: 'var(--color-brand)', color: '#fff' }
            }
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
