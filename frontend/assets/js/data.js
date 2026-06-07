export function formatCurrency(value = 0) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}đ`;
}
