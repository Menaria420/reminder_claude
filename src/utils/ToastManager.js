import { showToast as baseShowToast } from '../components/Toast';
import { showAlert as baseShowAlert } from '../components/CustomAlert';

/**
 * Show a success toast notification
 * @param {string} message - The message to display
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
export const showSuccessToast = (message, duration = 3000) => {
  baseShowToast(message, 'success', duration);
};

/**
 * Show an error toast notification
 * @param {string} message - The message to display
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
export const showErrorToast = (message, duration = 3000) => {
  baseShowToast(message, 'error', duration);
};

/**
 * Show a warning toast notification
 * @param {string} message - The message to display
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
export const showWarningToast = (message, duration = 3000) => {
  baseShowToast(message, 'warning', duration);
};

/**
 * Show an info toast notification
 * @param {string} message - The message to display
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
export const showInfoToast = (message, duration = 3000) => {
  baseShowToast(message, 'info', duration);
};

/**
 * Show a success alert dialog
 * @param {string} title - The title
 * @param {string} message - The message
 * @param {Array} buttons - Optional button array
 */
export const showSuccessAlert = (title, message, buttons = null) => {
  baseShowAlert(title, message, 'success', buttons);
};

/**
 * Show an error alert dialog
 * @param {string} title - The title
 * @param {string} message - The message
 * @param {Array} buttons - Optional button array
 */
export const showErrorAlert = (title, message, buttons = null) => {
  baseShowAlert(title, message, 'error', buttons);
};

/**
 * Show a warning alert dialog
 * @param {string} title - The title
 * @param {string} message - The message
 * @param {Array} buttons - Optional button array
 */
export const showWarningAlert = (title, message, buttons = null) => {
  baseShowAlert(title, message, 'warning', buttons);
};

/**
 * Show an info alert dialog
 * @param {string} title - The title
 * @param {string} message - The message
 * @param {Array} buttons - Optional button array
 */
export const showInfoAlert = (title, message, buttons = null) => {
  baseShowAlert(title, message, 'info', buttons);
};

/**
 * Show a confirmation alert dialog
 * @param {string} title - The title
 * @param {string} message - The message
 * @param {Function} onConfirm - Callback when confirmed
 * @param {Function} onCancel - Callback when cancelled
 */
export const showConfirmAlert = (title, message, onConfirm, onCancel) => {
  const buttons = [
    {
      text: 'Cancel',
      onPress: onCancel,
      style: 'secondary',
    },
    {
      text: 'Confirm',
      onPress: onConfirm,
      style: 'primary',
    },
  ];
  baseShowAlert(title, message, 'confirm', buttons);
};

/**
 * Show a delete confirmation alert
 * @param {string} itemName - Name of item being deleted
 * @param {Function} onConfirm - Callback when confirmed
 * @param {Function} onCancel - Callback when cancelled
 */
export const showDeleteConfirm = (itemName, onConfirm, onCancel) => {
  const buttons = [
    {
      text: 'Cancel',
      onPress: onCancel,
      style: 'secondary',
    },
    {
      text: 'Delete',
      onPress: onConfirm,
      style: 'primary',
    },
  ];
  baseShowAlert(
    'Delete Confirmation',
    `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
    'error',
    buttons
  );
};

export default {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showSuccessAlert,
  showErrorAlert,
  showWarningAlert,
  showInfoAlert,
  showConfirmAlert,
  showDeleteConfirm,
};
