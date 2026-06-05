/**
 * public/js/main.js
 * =================
 * Client-side JavaScript for the Employee Management System.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ── Sidebar Toggle (Mobile) ───────────────────────────
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');

  // Create overlay element
  const overlay = document.createElement('div');
  overlay.classList.add('sidebar-overlay');
  document.body.appendChild(overlay);

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  // ── Password Toggle (Login Page) ─────────────────────
  const passwordToggle = document.getElementById('passwordToggle');
  const passwordInput = document.getElementById('password');
  const passwordToggleIcon = document.getElementById('passwordToggleIcon');

  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      passwordToggleIcon.className = isPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill';
    });
  }

  // ── Login Form Loading State ──────────────────────────
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', () => {
      const btn = document.getElementById('loginBtn');
      if (btn) {
        btn.querySelector('.btn-text').classList.add('d-none');
        btn.querySelector('.btn-loading').classList.remove('d-none');
        btn.disabled = true;
      }
    });
  }

  // ── Add Employee Form Loading State ──────────────────
  const addEmployeeForm = document.getElementById('addEmployeeForm');
  if (addEmployeeForm) {
    addEmployeeForm.addEventListener('submit', (e) => {
      const btn = document.getElementById('submitBtn');
      if (btn) {
        // Basic client-side validation
        const required = addEmployeeForm.querySelectorAll('[required]');
        let valid = true;
        required.forEach(field => {
          if (!field.value.trim()) {
            valid = false;
            field.classList.add('is-invalid');
          } else {
            field.classList.remove('is-invalid');
          }
        });

        if (!valid) {
          e.preventDefault();
          return;
        }

        btn.querySelector('.btn-text').classList.add('d-none');
        btn.querySelector('.btn-loading').classList.remove('d-none');
        btn.disabled = true;
      }
    });

    // Remove invalid class on input
    addEmployeeForm.querySelectorAll('input, select').forEach(field => {
      field.addEventListener('input', () => field.classList.remove('is-invalid'));
    });
  }

  // ── Employee ID Auto-uppercase ────────────────────────
  const employeeIdInput = document.getElementById('employeeId');
  if (employeeIdInput) {
    employeeIdInput.addEventListener('input', (e) => {
      const pos = e.target.selectionStart;
      e.target.value = e.target.value.toUpperCase();
      e.target.setSelectionRange(pos, pos);
    });
  }

  // ── Photo Upload Preview ──────────────────────────────
  const photoInput = document.getElementById('photo');
  const photoPreview = document.getElementById('photoPreview');
  const photoPlaceholder = document.getElementById('photoPlaceholder');
  const photoUploadArea = document.getElementById('photoUploadArea');

  if (photoInput && photoPreview) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          photoPreview.src = event.target.result;
          photoPreview.classList.remove('d-none');
          if (photoPlaceholder) photoPlaceholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    });

    // Drag and drop
    if (photoUploadArea) {
      photoUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        photoUploadArea.classList.add('drag-over');
      });

      photoUploadArea.addEventListener('dragleave', () => {
        photoUploadArea.classList.remove('drag-over');
      });

      photoUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        photoUploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(files[0]);
          photoInput.files = dataTransfer.files;
          photoInput.dispatchEvent(new Event('change'));
        }
      });
    }
  }

  // ── Live Table Search ─────────────────────────────────
  const tableSearch = document.getElementById('tableSearch');
  if (tableSearch) {
    tableSearch.addEventListener('input', () => {
      const query = tableSearch.value.toLowerCase().trim();
      const rows = document.querySelectorAll('#employeeTable tbody tr');
      let visibleCount = 0;

      rows.forEach(row => {
        const searchData = row.getAttribute('data-search') || '';
        if (searchData.includes(query)) {
          row.style.display = '';
          visibleCount++;
        } else {
          row.style.display = 'none';
        }
      });
    });
  }

  // ── Auto-dismiss Alerts after 5 seconds ──────────────
  const alerts = document.querySelectorAll('.alert-dismissible');
  alerts.forEach(alert => {
    setTimeout(() => {
      const bsAlert = bootstrap.Alert.getInstance(alert);
      if (bsAlert) {
        bsAlert.close();
      } else {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.5s';
        setTimeout(() => alert.remove(), 500);
      }
    }, 5000);
  });

  // ── Salary formatter (input) ──────────────────────────
  const salaryInput = document.getElementById('salary');
  if (salaryInput) {
    salaryInput.addEventListener('blur', () => {
      const val = parseFloat(salaryInput.value);
      if (!isNaN(val) && val < 0) {
        salaryInput.value = 0;
      }
    });
  }

});
