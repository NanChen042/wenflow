import { ElMessage } from 'element-plus';

/**
 * Unified Modern Toast Notification Service
 * Replaces clunky multiple stacking toasts with sleek, deduplicated, beautifully styled toasts.
 */
export const toast = {
  success(message: string, duration = 2200) {
    ElMessage.closeAll(); // Close previous to prevent unsightly vertical stacking towers
    return ElMessage({
      message,
      type: 'success',
      duration,
      showClose: false,
      grouping: true,
      offset: 24,
      customClass: 'enterprise-modern-toast'
    });
  },

  error(message: string, duration = 3500) {
    ElMessage.closeAll();
    return ElMessage({
      message,
      type: 'error',
      duration,
      showClose: true,
      grouping: true,
      offset: 24,
      customClass: 'enterprise-modern-toast'
    });
  },

  warning(message: string, duration = 2800) {
    ElMessage.closeAll();
    return ElMessage({
      message,
      type: 'warning',
      duration,
      showClose: false,
      grouping: true,
      offset: 24,
      customClass: 'enterprise-modern-toast'
    });
  },

  info(message: string, duration = 2500) {
    ElMessage.closeAll();
    return ElMessage({
      message,
      type: 'info',
      duration,
      showClose: false,
      grouping: true,
      offset: 24,
      customClass: 'enterprise-modern-toast'
    });
  }
};

export default toast;
