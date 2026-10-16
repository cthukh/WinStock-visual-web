(() => {
  const params = new URLSearchParams(window.location.search);
  const isOffline = params.get('offline') === '1';

  function preservePageContext() {
    const currentDirectory = window.location.pathname.slice(0, window.location.pathname.lastIndexOf('/') + 1);
    document.querySelectorAll('a[href]').forEach((link) => {
      let target;
      try {
        target = new URL(link.getAttribute('href'), window.location.href);
      } catch {
        return;
      }

      if (target.protocol !== window.location.protocol || !target.pathname.startsWith(currentDirectory)) {
        return;
      }

      const fileName = target.pathname.slice(currentDirectory.length);
      if (fileName !== 'index.html' && params.has('rol')) {
        target.searchParams.set('rol', params.get('rol'));
      }
      if (fileName !== 'index.html' && params.has('inv')) {
        target.searchParams.set('inv', params.get('inv'));
      }
      if (isOffline) {
        target.searchParams.set('offline', '1');
      }

      link.setAttribute('href', `${fileName}${target.search}${target.hash}`);
    });

    const loginForm = document.querySelector('.login-page form');
    if (loginForm && isOffline) {
      const action = new URL(loginForm.getAttribute('action'), window.location.href);
      action.searchParams.set('offline', '1');
      const actionFile = action.pathname.slice(currentDirectory.length);
      loginForm.setAttribute('action', `${actionFile}${action.search}`);
    }
  }

  function applyOfflineMode() {
    if (!isOffline) {
      return;
    }

    const notice = document.createElement('div');
    notice.className = 'offline-notice';
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    notice.textContent = 'Sin conexión. Estás viendo los últimos datos cargados. Registrar o modificar no está disponible.';
    document.body.prepend(notice);

    const writeAction = /^(registrar|crear|guardar|modificar|editar|deshabilitar)\b/i;
    document.querySelectorAll('button, a.button').forEach((control) => {
      if (control.matches('[role="tab"]')) {
        return;
      }

      const label = control.textContent.trim();
      const isConfirmation = /^(continuar)$/i.test(label);
      const isWriteAction = writeAction.test(label) || isConfirmation;
      if (!isWriteAction) {
        return;
      }

      control.classList.add('is-offline-disabled');
      if (control instanceof HTMLButtonElement) {
        control.disabled = true;
      } else {
        control.setAttribute('aria-disabled', 'true');
        control.tabIndex = -1;
        control.addEventListener('click', (event) => event.preventDefault());
      }
    });

    document.querySelectorAll('[data-ration-form], [data-stock-form]').forEach((form) => {
      form.addEventListener('submit', (event) => event.preventDefault());
    });
  }

  const loginError = document.querySelector('[data-login-error]');
  if (loginError) {
    loginError.hidden = params.get('error') !== '1';
  }

  document.querySelectorAll('[data-modal-open]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const modal = document.getElementById(trigger.dataset.modalOpen);
      if (modal?.id === 'stock-adjustment') {
        const isExample = trigger.dataset.example === 'insufficient';
        const stockMode = document.querySelector(`#stock-${isExample ? 'descontar' : 'sumar'}`);
        const unit = trigger.dataset.stockUnit || 'kg';
        modal.dataset.stock = trigger.dataset.stock;
        document.querySelector('[data-stock-food-name]').textContent = trigger.dataset.food;
        document.querySelector('[data-stock-current]').textContent = `${trigger.dataset.stock} ${unit}`;
        const quantityLabel = document.querySelector('[data-stock-quantity-label]');
        if (quantityLabel) {
          quantityLabel.textContent = `Cantidad (${unit})`;
        }
        document.getElementById('stock-quantity').value = isExample ? (trigger.dataset.quantity || '700') : '';
        stockMode.checked = true;
        updateStockReason();
      }
      modal?.showModal();
    });
  });

  document.querySelectorAll('[data-modal-close]').forEach((trigger) => {
    trigger.addEventListener('click', () => trigger.closest('dialog')?.close());
  });

  function updateStockReason() {
    const isDeduction = document.querySelector('[data-stock-mode]:checked')?.value === 'descontar';
    const reasonField = document.querySelector('[data-reason-field]');
    const reasonInput = document.getElementById('stock-reason');
    if (reasonField && reasonInput) {
      reasonField.hidden = !isDeduction;
      reasonInput.required = isDeduction;
    }
  }

  document.querySelectorAll('[data-stock-mode]').forEach((input) => {
    input.addEventListener('change', updateStockReason);
  });

  const disabledToggle = document.querySelector('[data-disabled-toggle]');
  if (disabledToggle) {
    disabledToggle.addEventListener('change', () => {
      document.querySelectorAll('[data-disabled-food]').forEach((row) => {
        row.hidden = !disabledToggle.checked;
      });
      disabledToggle.setAttribute('aria-checked', String(disabledToggle.checked));
    });
  }

  const stockForm = document.querySelector('[data-stock-form]');
  if (stockForm) {
    stockForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const isDeduction = document.querySelector('[data-stock-mode]:checked')?.value === 'descontar';
      const quantity = Number(document.getElementById('stock-quantity').value);
      const stockDialog = document.getElementById('stock-adjustment');
      const stock = Number(stockDialog.dataset.stock);

      if (isDeduction && quantity > stock) {
        stockDialog.close();
        document.getElementById('insufficient-stock').showModal();
        return;
      }

      stockDialog.close();
    });
  }

  document.querySelector('[data-stock-resume]')?.addEventListener('click', () => {
    document.getElementById('insufficient-stock').close();
    document.getElementById('stock-adjustment').showModal();
  });

  document.querySelectorAll('[data-ration-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-ration-tab]').forEach((item) => {
        const isActive = item === tab;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-selected', String(isActive));
        item.tabIndex = isActive ? 0 : -1;
      });
      document.querySelectorAll('[data-ration-panel]').forEach((panel) => {
        panel.hidden = panel.dataset.rationPanel !== tab.dataset.rationTab;
      });
    });
  });

  const rationRows = document.querySelector('[data-ration-rows]');
  const rationRowTemplate = rationRows?.querySelector('[data-ration-row]');
  const duplicateError = document.querySelector('[data-duplicate-error]');

  function updateRationFoodOptions() {
    if (!rationRows) {
      return;
    }

    const selectedFoods = Array.from(rationRows.querySelectorAll('[data-food-select]'))
      .map((select) => select.value)
      .filter(Boolean);

    const values = selectedFoods;
    const hasDuplicate = values.some((value, index) => values.indexOf(value) !== index);
    if (duplicateError) {
      duplicateError.hidden = !hasDuplicate;
    }
  }

  function configureRationRow(row, index) {
    const foodSelect = row.querySelector('[data-food-select]');
    const quantity = row.querySelector('[data-food-quantity]');
    const foodId = `ration-food-${index}`;
    const quantityId = `ration-quantity-${index}`;
    foodSelect.id = foodId;
    foodSelect.value = '';
    foodSelect.querySelector('option[value="heno"]').selected = false;
    row.querySelector('label[for^="ration-food-"]').htmlFor = foodId;
    quantity.id = quantityId;
    quantity.value = '';
    row.querySelector('label[for^="ration-quantity-"]').htmlFor = quantityId;
    row.querySelector('[data-remove-food]').hidden = false;
  }

  document.querySelector('[data-add-food]')?.addEventListener('click', () => {
    if (!rationRows || !rationRowTemplate) {
      return;
    }
    const newRow = rationRowTemplate.cloneNode(true);
    configureRationRow(newRow, rationRows.querySelectorAll('[data-ration-row]').length + 1);
    rationRows.append(newRow);
    newRow.querySelector('[data-food-select]').addEventListener('change', updateRationFoodOptions);
    newRow.querySelector('[data-remove-food]').addEventListener('click', () => {
      if (rationRows.querySelectorAll('[data-ration-row]').length > 1) {
        newRow.remove();
        updateRationFoodOptions();
      }
    });
    updateRationFoodOptions();
  });

  rationRows?.querySelectorAll('[data-ration-row]').forEach((row) => {
    row.querySelector('[data-food-select]').addEventListener('change', updateRationFoodOptions);
    row.querySelector('[data-remove-food]').addEventListener('click', () => {
      if (rationRows.querySelectorAll('[data-ration-row]').length > 1) {
        row.remove();
        updateRationFoodOptions();
      }
    });
  });

  const rationForm = document.querySelector('[data-ration-form]');
  if (rationForm) {
    rationForm.addEventListener('submit', (event) => {
      event.preventDefault();
      updateRationFoodOptions();

      const selectedFoods = Array.from(rationRows.querySelectorAll('[data-ration-row]'))
        .map((row) => ({
          select: row.querySelector('[data-food-select]'),
          quantity: Number(row.querySelector('[data-food-quantity]').value)
        }));
      const hasDuplicate = selectedFoods.some((item, index) => selectedFoods.findIndex((other) => other.select.value === item.select.value) !== index);
      if (hasDuplicate) {
        duplicateError.hidden = false;
        return;
      }

      const insufficientFoods = selectedFoods.filter((item) => {
        const selectedOption = item.select.selectedOptions[0];
        return selectedOption?.dataset.stock && item.quantity > Number(selectedOption.dataset.stock);
      });

      if (insufficientFoods.length) {
        const list = document.querySelector('[data-insufficient-list]');
        list.replaceChildren(...insufficientFoods.map((item) => {
          const selectedOption = item.select.selectedOptions[0];
          const line = document.createElement('li');
          line.textContent = `${selectedOption.textContent}: hay ${selectedOption.dataset.stock} kg, se registran ${item.quantity} kg`;
          return line;
        }));
        document.getElementById('ration-warning').showModal();
        return;
      }

      document.querySelector('[data-ration-success]').hidden = false;
    });
  }

  document.querySelector('[data-ration-continue]')?.addEventListener('click', () => {
    document.getElementById('ration-warning').close();
    document.querySelector('[data-ration-success]').hidden = false;
  });

  function filterHistory() {
    const lotFilter = document.querySelector('[data-history-filter="lot"]')?.value || '';
    const dateFilter = document.querySelector('[data-history-filter="date"]')?.value || '';
    document.querySelectorAll('[data-history-row]').forEach((row) => {
      row.hidden = Boolean((lotFilter && row.dataset.lot !== lotFilter) || (dateFilter && row.dataset.date !== dateFilter));
    });
  }

  document.querySelectorAll('[data-history-filter]').forEach((filter) => {
    filter.addEventListener('change', filterHistory);
  });

  document.querySelector('[data-lot-filter]')?.addEventListener('change', (event) => {
    document.querySelectorAll('[data-lot-row]').forEach((row) => {
      row.hidden = Boolean(event.target.value && row.dataset.category !== event.target.value);
    });
  });

  const formMode = params.get('modo') === 'editar' ? 'editar' : 'crear';
  document.querySelectorAll('[data-form-mode]').forEach((element) => {
    element.hidden = element.dataset.formMode !== formMode;
  });

  const root = document.getElementById('app');
  if (!root) {
    preservePageContext();
    applyOfflineMode();
    return;
  }

  const pageContent = root.querySelector('main');
  const section = document.body.dataset.section || '';
  const role = params.get('rol') === 'funcionario' ? 'funcionario' : 'admin';
  const assignedInventories = (params.get('inv') || 'alimentos,insumos')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  root.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar" aria-label="Navegación principal">
        <a class="brand" href="resumen.html" aria-label="WinStock, resumen">
          <span class="brand-name">WinStock</span>
          <span class="brand-subtitle">GESTIÓN DEL PREDIO</span>
        </a>
        <details class="sidebar-navigation" open>
          <summary class="menu-toggle" aria-label="Abrir menú de navegación">
            <span class="menu-toggle-icon" aria-hidden="true"><span></span><span></span><span></span></span>
            <span>Menú</span>
          </summary>
          <nav class="side-nav" aria-label="Secciones">
            <a class="nav-link" href="resumen.html" data-role="admin">Resumen</a>
            <a class="nav-link" href="raciones.html" data-role="admin">Raciones</a>
            <a class="nav-link" href="alimentos.html" data-inventory="alimentos">Alimentos</a>
            <a class="nav-link" href="insumos.html" data-inventory="insumos">Insumos</a>
            <a class="nav-link" href="lotes.html" data-role="admin">Lotes</a>
            <a class="nav-link" href="reportes.html" data-role="admin">Reportes</a>
            <a class="nav-link" href="cuentas.html" data-role="admin">Cuentas</a>
          </nav>
        </details>
      </aside>
      <div class="workspace">
        <header class="topbar">
          <p class="topbar-section">${section}</p>
          <details class="account-menu">
            <summary class="account-trigger">
              <span class="account-avatar" aria-hidden="true">U</span>
              <span>Mi cuenta</span>
              <span class="chevron" aria-hidden="true"></span>
            </summary>
            <div class="account-popover"><a href="index.html">Cerrar sesión</a></div>
          </details>
        </header>
      </div>
    </div>
  `;
  root.querySelector('.workspace').append(pageContent);

  if (window.matchMedia('(max-width: 600px)').matches) {
    root.querySelector('.sidebar-navigation').open = false;
  }

  document.documentElement.dataset.role = role;

  document.querySelectorAll('[data-role="admin"]').forEach((element) => {
    element.hidden = role !== 'admin';
  });

  const activeLink = Array.from(document.querySelectorAll('.nav-link'))
    .find((link) => link.textContent.trim() === section);
  if (activeLink) {
    activeLink.classList.add('is-active');
    activeLink.setAttribute('aria-current', 'page');
  }

  if (role === 'funcionario') {
    document.querySelectorAll('[data-inventory]').forEach((element) => {
      element.hidden = !assignedInventories.includes(element.dataset.inventory);
    });
  }

  preservePageContext();
  applyOfflineMode();
})();