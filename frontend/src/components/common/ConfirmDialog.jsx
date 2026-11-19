import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 mt-1">{message}</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={loading}
          type="button"
        >
          {cancelText}
        </Button>
        <Button
          variant={confirmVariant}
          onClick={onConfirm}
          loading={loading}
          type="button"
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
