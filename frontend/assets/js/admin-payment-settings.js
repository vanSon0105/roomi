import {
  apiFetch,
  escapeHtml,
  renderAdminError,
  renderAdminShell,
} from './admin-common.js?v=admin-sepay-1';

renderAdminShell('payment-settings');

const root = document.querySelector('#adminPaymentSettings');

const PROVIDER_LABELS = {
  SEPAY: 'SePay',
  PAYOS: 'PayOS',
  BANK_TRANSFER: 'VietQR',
};

function maskValue(value) {
  if (!value) return '';
  if (value.length <= 8) return '••••••••';
  return value.slice(0, 4) + '••••••••' + value.slice(-4);
}

function renderSettings(data) {
  const provider = data.transfer_provider || 'SEPAY';

  root.innerHTML = `
    <div class="admin-page-head">
      <div>
        <h1>Tài khoản nhận tiền</h1>
        <p>Chọn cơ chế thanh toán và điền thông tin tài khoản. Nút "Chuyển khoản" ngoài checkout sẽ dùng cơ chế được chọn.</p>
      </div>
    </div>

    <form class="admin-settings-form" data-settings-form>
      <section class="admin-panel">
        <h2>Cơ chế chuyển khoản</h2>
        <label>
          <span>Đang dùng</span>
          <select name="transfer_provider">
            ${Object.entries(PROVIDER_LABELS)
              .map(
                ([value, label]) =>
                  `<option value="${value}" ${value === provider ? 'selected' : ''}>${label}</option>`,
              )
              .join('')}
          </select>
        </label>
      </section>

      <section class="admin-panel">
        <h2>Tài khoản SePay</h2>
        <label>
          <span>Số tài khoản</span>
          <input name="sepay_account_no" value="${escapeHtml(data.sepay_account_no || '')}" placeholder="Nhập STK nhận tiền qua SePay">
        </label>
        <label>
          <span>Tên chủ tài khoản</span>
          <input name="sepay_account_name" value="${escapeHtml(data.sepay_account_name || '')}" placeholder="VD: NGUYEN VAN A">
        </label>
        <label>
          <span>Ngân hàng (tên SePay)</span>
          <input name="sepay_qr_bank_name" value="${escapeHtml(data.sepay_qr_bank_name || 'VietinBank')}" placeholder="VD: VietinBank, MBBank, Vietcombank">
          <small>Xem danh sách tại <a href="https://qr.sepay.vn/banks.json" target="_blank" rel="noopener">qr.sepay.vn/banks.json</a></small>
        </label>
      </section>

      <section class="admin-panel">
        <h2>Tài khoản PayOS</h2>
        <label>
          <span>Client ID</span>
          <input name="payos_client_id" value="${escapeHtml(data.payos_client_id || '')}" placeholder="Nhập PayOS Client ID">
        </label>
        <label>
          <span>API Key</span>
          <input name="payos_api_key" type="password" value="${escapeHtml(data.payos_api_key || '')}" placeholder="Nhập PayOS API Key">
        </label>
        <label>
          <span>Checksum Key</span>
          <input name="payos_checksum_key" type="password" value="${escapeHtml(data.payos_checksum_key || '')}" placeholder="Nhập PayOS Checksum Key">
        </label>
      </section>

      <button class="btn btn-maroon" type="submit">Lưu tất cả</button>
      <span class="admin-settings-feedback" data-settings-feedback></span>
    </form>
  `;
}

async function loadSettings() {
  if (!root) return;
  root.innerHTML = '<div class="admin-loading">Đang tải cài đặt...</div>';

  try {
    const response = await apiFetch('/admin/settings');
    renderSettings(response.data);
  } catch (error) {
    root.innerHTML = renderAdminError(error);
  }
}

root?.addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-settings-form]');
  if (!form) return;

  event.preventDefault();

  const formData = new FormData(form);
  const feedback = form.querySelector('[data-settings-feedback]');
  const submitButton = form.querySelector('[type="submit"]');

  submitButton.disabled = true;
  submitButton.textContent = 'Đang lưu...';
  if (feedback) feedback.textContent = '';

  try {
    const body = {
      transfer_provider: formData.get('transfer_provider'),
      payos_client_id: formData.get('payos_client_id')?.toString() || '',
      payos_api_key: formData.get('payos_api_key')?.toString() || '',
      payos_checksum_key: formData.get('payos_checksum_key')?.toString() || '',
      sepay_account_no: formData.get('sepay_account_no')?.toString() || '',
      sepay_account_name: formData.get('sepay_account_name')?.toString() || '',
      sepay_qr_bank_name: formData.get('sepay_qr_bank_name')?.toString() || '',
    };

    const response = await apiFetch('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    renderSettings(response.data);
    if (feedback) feedback.textContent = 'Đã lưu. Server đã cập nhật config, không cần restart.';
  } catch (error) {
    if (feedback) feedback.textContent = error.message || 'Không lưu được cài đặt.';
    submitButton.disabled = false;
    submitButton.textContent = 'Lưu tất cả';
  }
});

loadSettings();
