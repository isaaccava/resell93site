// ===================================
// SUPABASE CONFIG
// ===================================

const SUPABASE_URL = "https://dnhfxyjxjjrllkbvzuaa.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuaGZ4eWp4ampybGxrYnZ6dWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNDI2MjYsImV4cCI6MjA5ODgxODYyNn0.nhMd3TQZ1bPWdPUndoDCwr2zS8TUd51NekkJfdb0T2U";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const dashboardSidebar = document.getElementById("dashboardSidebar");
const userMenu = document.getElementById("userMenu");
const userMenuTrigger = document.getElementById("user-menu-trigger");
const userMenuDropdown = document.querySelector(".user-menu-dropdown");
const dashboardViews = document.querySelectorAll(".dashboard-view");
const dashboardNavItems = document.querySelectorAll(".dashboard-nav-item");
const dashboardTitle = document.getElementById("dashboardTitle");
const dashboardSidebarOverlay = document.getElementById("dashboardSidebarOverlay");
const searchContainer = document.getElementById("searchContainer");
const searchInput = document.getElementById("searchInput");
const searchClose = document.getElementById("searchClose");
const mobileSearchBtn = document.getElementById("mobileSearchBtn");
const customersNavItem = document.getElementById("customersNavItem");
const showCustomersTabToggle = document.getElementById("showCustomersTabToggle");

// State
let sidebarCollapsed = false;
let currentView = "overview";

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener("DOMContentLoaded", async function () {
  initTheme();
  initSidebar();
  initUserMenu();
  initNavigation();
  initSearch();
  initSettings();
  await migrateLegacyLocalData();
  await initCustomers();
  await initTasks();
  await initHaul();
  await initBusinessExpenses();
  await initStock();
  initBackfill();
  initProductsPage();
  await initNotes();
  initCharts();
  await initInstagramFollowersCard();
  updateOverviewStats();
  subscribeToRealtimeUpdates();
});

// ===================================
// SIDEBAR FUNCTIONALITY
// ===================================

function initSidebar() {
  // Load saved sidebar state
  sidebarCollapsed = localStorage.getItem("dashboard-sidebar-collapsed") === "true";
  dashboardSidebar.classList.toggle("collapsed", sidebarCollapsed);

  // Sidebar toggle functionality
  document.querySelectorAll(".dashboard-sidebar-toggle").forEach((toggle) => {
    toggle.addEventListener("click", toggleSidebar);
  });

  // Sidebar overlay functionality
  dashboardSidebarOverlay?.addEventListener("click", closeSidebar);
}

function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  const isMobile = window.innerWidth <= 1024;

  if (isMobile) {
    // Mobile behavior - toggle sidebar and overlay together
    const isOpen = dashboardSidebar.classList.contains("collapsed");
    dashboardSidebar.classList.toggle("collapsed", !isOpen);
    dashboardSidebarOverlay?.classList.toggle("active", !isOpen);
  } else {
    // Desktop behavior
    dashboardSidebar.classList.toggle("collapsed", sidebarCollapsed);
  }

  localStorage.setItem("dashboard-sidebar-collapsed", sidebarCollapsed.toString());
}

function closeSidebar() {
  if (window.innerWidth <= 1024) {
    dashboardSidebar.classList.remove("collapsed");
    dashboardSidebarOverlay?.classList.remove("active");
  }
}

// ===================================
// USER MENU FUNCTIONALITY
// ===================================

function initUserMenu() {
  if (!userMenuTrigger || !userMenu) return;

  userMenuTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    userMenu.classList.toggle("active");
  });

  // Close menu when clicking outside or pressing escape
  document.addEventListener("click", (e) => {
    if (!userMenu.contains(e.target)) {
      userMenu.classList.remove("active");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && userMenu.classList.contains("active")) {
      userMenu.classList.remove("active");
    }
  });
}

// ===================================
// NAVIGATION FUNCTIONALITY
// ===================================

function initNavigation() {
  dashboardNavItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const viewId = item.getAttribute("data-view");
      if (viewId) switchView(viewId);
    });
  });
}

function switchView(viewId) {
  // Update active nav item
  dashboardNavItems.forEach((item) => {
    item.classList.toggle("active", item.getAttribute("data-view") === viewId);
  });

  // Hide all views and show selected one
  dashboardViews.forEach((view) => view.classList.remove("active"));

  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.add("active");
    currentView = viewId;
    updatePageTitle(viewId);
  }

  // Close sidebar on mobile after navigation
  if (window.innerWidth <= 1024) closeSidebar();
}

function updatePageTitle(viewId) {
  const titles = {
    overview: "Overview",
    customers: "Customers",
    tasks: "Tasks",
    haul: "Haul",
    finances: "Finances",
    stock: "Stock",
    products: "Products",
    notes: "Notes",
    settings: "Settings",
  };

  if (dashboardTitle) {
    dashboardTitle.textContent = titles[viewId] || "Dashboard";
  }
}

// ===================================
// THEME (locked to dark mode)
// ===================================

function initTheme() {
  document.documentElement.setAttribute("data-theme", "dark");
}

// ===================================
// SETTINGS
// ===================================

function initSettings() {
  const showCustomersTab = localStorage.getItem("dashboard-show-customers-tab") === "true";
  applyCustomersTabVisibility(showCustomersTab);

  if (showCustomersTabToggle) {
    showCustomersTabToggle.checked = showCustomersTab;
    showCustomersTabToggle.addEventListener("change", () => {
      const isVisible = showCustomersTabToggle.checked;
      localStorage.setItem("dashboard-show-customers-tab", isVisible.toString());
      applyCustomersTabVisibility(isVisible);
    });
  }
}

function applyCustomersTabVisibility(isVisible) {
  if (!customersNavItem) return;
  customersNavItem.classList.toggle("nav-item-hidden", !isVisible);

  // If the tab is hidden while it's the active view, fall back to Overview.
  if (!isVisible && currentView === "customers") {
    switchView("overview");
  }
}

// ===================================
// SEARCH FUNCTIONALITY
// ===================================

function initSearch() {
  mobileSearchBtn?.addEventListener("click", () => {
    searchContainer.classList.add("mobile-active");
    searchInput.focus();
  });

  searchClose?.addEventListener("click", () => {
    searchContainer.classList.remove("mobile-active");
    searchInput.value = "";
  });
}

// ===================================
// CHART INITIALIZATION
// ===================================

let progressChartInstance = null;
let categoryChartInstance = null;

function initCharts() {
  initProgressChart();
  initCategoryChart();
  initHaulProfitChart();
}

function getAvailableStockValue() {
  return products
    .filter((p) => p.destination === "stock" && p.status !== "sold")
    .reduce((sum, p) => sum + Number(p.quantity) * (p.price || 0), 0);
}

function getTotalSoldRevenue() {
  return products.filter((p) => p.status === "sold").reduce((sum, p) => sum + (p.salePrice || 0), 0);
}

// Revenue per haul, plus a light-opacity "potential" segment stacked on top
// of each bar for that haul's unsold items (not yet sold, so not counted in
// totalIncome) — same price*quantity valuation as Stock Value.
function getHaulRevenueChartData() {
  // `hauls` is loaded newest-first (for the Hauls table); reverse it here so
  // the chart reads left-to-right in the order hauls were created.
  const orderedHauls = [...hauls].reverse();
  const labels = orderedHauls.map((h) => h.name);
  const earned = orderedHauls.map((h) => computeHaulStats(h.id).totalIncome);
  const potential = orderedHauls.map((h) =>
    products
      .filter((p) => p.haulId === h.id && p.status !== "sold")
      .reduce((sum, p) => sum + Number(p.quantity) * (p.price || 0), 0)
  );
  return { labels, earned, potential };
}

function getTaskPriorityCounts() {
  const counts = { low: 0, medium: 0, high: 0 };
  tasks.forEach((t) => {
    if (counts[t.priority] !== undefined) counts[t.priority]++;
  });
  return counts;
}

function initProgressChart() {
  const ctx = document.getElementById("progressChart");
  if (!ctx) return;

  const { labels, earned, potential } = getHaulRevenueChartData();

  progressChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: earned,
          backgroundColor: "#8b5cf6",
          borderRadius: 4,
          stack: "revenue",
        },
        {
          label: "Potential (unsold items)",
          data: potential,
          backgroundColor: "rgba(139, 92, 246, 0.25)",
          borderRadius: 4,
          stack: "revenue",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { usePointStyle: true, padding: 16 } },
      },
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: { callback: (value) => "€" + value },
        },
      },
    },
  });
}

function updateProgressChart() {
  if (!progressChartInstance) return;
  const { labels, earned, potential } = getHaulRevenueChartData();
  progressChartInstance.data.labels = labels;
  progressChartInstance.data.datasets[0].data = earned;
  progressChartInstance.data.datasets[1].data = potential;
  progressChartInstance.update();
}

function initCategoryChart() {
  const ctx = document.getElementById("categoryChart");
  if (!ctx) return;

  const counts = getTaskPriorityCounts();

  categoryChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Low priority", "Medium priority", "High priority"],
      datasets: [
        {
          data: [counts.low, counts.medium, counts.high],
          backgroundColor: ["#3b82f6", "#f59e0b", "#ef4444"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            usePointStyle: true,
          },
        },
      },
    },
  });
}

function updateCategoryChart() {
  if (!categoryChartInstance) return;
  const counts = getTaskPriorityCounts();
  categoryChartInstance.data.datasets[0].data = [counts.low, counts.medium, counts.high];
  categoryChartInstance.update();
}

function updateAllCharts() {
  updateProgressChart();
  updateCategoryChart();
}

// ===================================
// CUSTOMERS FUNCTIONALITY
// ===================================

let customers = [];
let editingCustomerId = null;

// DOM Elements (customers)
const customersUnpaidTableBody = document.getElementById("customersUnpaidTableBody");
const customersPaidTableBody = document.getElementById("customersPaidTableBody");
const customersUnpaidEmptyState = document.getElementById("customersUnpaidEmptyState");
const customersPaidEmptyState = document.getElementById("customersPaidEmptyState");
const customersUnpaidCount = document.getElementById("customersUnpaidCount");
const customersPaidCount = document.getElementById("customersPaidCount");
const customersEmptyState = document.getElementById("customersEmptyState");
const customerCountValue = document.getElementById("customerCountValue");
const customerRevenueValue = document.getElementById("customerRevenueValue");
const customerOutstandingValue = document.getElementById("customerOutstandingValue");

const addCustomerBtn = document.getElementById("addCustomerBtn");
const customerModalOverlay = document.getElementById("customerModalOverlay");
const customerModalTitle = document.getElementById("customerModalTitle");
const customerModalClose = document.getElementById("customerModalClose");
const customerCancelBtn = document.getElementById("customerCancelBtn");
const customerForm = document.getElementById("customerForm");

const customerIdInput = document.getElementById("customerId");
const customerNameInput = document.getElementById("customerName");
const customerOrderInput = document.getElementById("customerOrder");
const customerAmountInput = document.getElementById("customerAmount");
const customerStatusInput = document.getElementById("customerStatus");
const customerDateInput = document.getElementById("customerDate");
const customerHaulInput = document.getElementById("customerHaul");
const customerNotesInput = document.getElementById("customerNotes");

async function initCustomers() {
  if (!customersUnpaidTableBody) return;

  await loadCustomers();
  await loadCustomerOrders();
  renderCustomers();

  addCustomerBtn?.addEventListener("click", () => openCustomerModal());
  customerModalClose?.addEventListener("click", () => {
    returnToHaulDetailId = null;
    closeCustomerModal();
  });
  customerCancelBtn?.addEventListener("click", () => {
    returnToHaulDetailId = null;
    closeCustomerModal();
  });

  customerModalOverlay?.addEventListener("click", (e) => {
    if (e.target === customerModalOverlay) {
      returnToHaulDetailId = null;
      closeCustomerModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && customerModalOverlay?.classList.contains("active")) {
      returnToHaulDetailId = null;
      closeCustomerModal();
    }
  });

  customerForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    saveCustomerFromForm();
  });
}

async function loadCustomers() {
  try {
    const { data, error } = await supabaseClient
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    customers = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      notes: row.notes || "",
    }));
  } catch (err) {
    console.error("Failed to load customers:", err);
    customers = [];
  }
}

// `customers` = one row per real person (id/name/notes). Orders live in
// `customer_orders` instead (one row per order: name/order/amount/status/
// date, plus a customer_id FK back to the real person). The Customers tab
// is really an orders table, so it reads/writes customerOrders — see
// resolveCustomerIdByName() for how new/edited orders keep customer_id
// populated.
let customerOrders = [];

async function loadCustomerOrders() {
  try {
    const { data, error } = await supabaseClient
      .from("customer_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    customerOrders = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      order: row.order,
      amount: Number(row.amount),
      status: row.status,
      date: row.date,
      notes: row.notes || "",
      haulId: row.haul_id || "",
      customerId: row.customer_id || "",
    }));
  } catch (err) {
    console.error("Failed to load customer orders:", err);
    customerOrders = [];
  }
}

// Finds the real person this order belongs to by trimmed/case-insensitive
// name match (mirroring the 2026-08-16 migration's own matching logic),
// creating a new `customers` row if no match exists, so customer_orders.
// customer_id stays populated for new/renamed orders going forward.
async function resolveCustomerIdByName(name) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const existing = customers.find((c) => c.name.trim().toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing.id;

  const { data, error } = await supabaseClient.from("customers").insert([{ name: trimmed }]).select().single();
  if (error) throw error;

  customers.push({ id: data.id, name: data.name, notes: data.notes || "" });
  return data.id;
}

let returnToHaulDetailId = null;

function openCustomerModal(customer = null, presetHaulId = null) {
  editingCustomerId = customer ? customer.id : null;
  customerModalTitle.textContent = customer ? "Edit Customer" : "Add Customer";

  populateCustomerHaulDropdown(customer ? customer.haulId : presetHaulId || "");

  customerIdInput.value = customer ? customer.id : "";
  customerNameInput.value = customer ? customer.name : "";
  customerOrderInput.value = customer ? customer.order : "";
  customerAmountInput.value = customer ? customer.amount : "";
  customerStatusInput.value = customer ? customer.status : "paid";
  customerDateInput.value = customer ? customer.date || "" : "";
  customerNotesInput.value = customer ? customer.notes || "" : "";

  customerModalOverlay.classList.add("active");
  setTimeout(() => customerNameInput.focus(), 50);
}

function populateCustomerHaulDropdown(selectedId) {
  if (!customerHaulInput) return;

  customerHaulInput.innerHTML = '<option value="">— None —</option>';

  hauls.forEach((h) => {
    const opt = document.createElement("option");
    opt.value = h.id;
    opt.textContent = h.name;
    if (h.id === selectedId) opt.selected = true;
    customerHaulInput.appendChild(opt);
  });
}

function closeCustomerModal() {
  customerModalOverlay.classList.remove("active");
  customerForm.reset();
  editingCustomerId = null;
}

async function saveCustomerFromForm() {
  const name = customerNameInput.value.trim();
  const order = customerOrderInput.value.trim();
  const amount = parseFloat(customerAmountInput.value) || 0;
  const status = customerStatusInput.value;
  const date = customerDateInput.value || null;
  const haul_id = customerHaulInput.value || null;
  const notes = customerNotesInput.value.trim();

  if (!name || !order) return;

  const saveBtn = document.getElementById("customerSaveBtn");
  if (saveBtn) saveBtn.disabled = true;

  try {
    const customer_id = await resolveCustomerIdByName(name);

    if (editingCustomerId) {
      const { error } = await supabaseClient
        .from("customer_orders")
        .update({ name, order, amount, status, date, notes, haul_id, customer_id })
        .eq("id", editingCustomerId);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient
        .from("customer_orders")
        .insert([{ name, order, amount, status, date, notes, haul_id, customer_id }]);
      if (error) throw error;
    }

    await loadCustomerOrders();
    renderCustomers();
    renderHauls();
    closeCustomerModal();

    if (returnToHaulDetailId) {
      const haulId = returnToHaulDetailId;
      returnToHaulDetailId = null;
      openHaulDetailModal(haulId);
    }
  } catch (err) {
    console.error("Failed to save customer:", err);
    alert("Couldn't save customer — check your internet connection and try again." + "\n\nError: " + err.message);
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

async function deleteCustomer(id) {
  if (!confirm("Remove this customer? This can't be undone.")) return;

  try {
    const { error } = await supabaseClient.from("customer_orders").delete().eq("id", id);
    if (error) throw error;

    await loadCustomerOrders();
    renderCustomers();
    renderHauls();
  } catch (err) {
    console.error("Failed to delete customer:", err);
    alert("Couldn't delete customer — check your internet connection and try again." + "\n\nError: " + err.message);
  }
}

function formatCurrency(value) {
  return "€" + Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function buildCustomerRow(customer, options = {}) {
  const { showActions = true } = options;
  const statusLabels = { paid: "Paid", pending: "Pending", partial: "Partial" };
  const row = document.createElement("tr");

  // customer.id here is the order's own id, not the linked person's — reserved
  // products link to the real person (products.customer_id), so match on
  // customer.customerId (the order's customer_id FK) instead.
  const reservedItems = products.filter((s) => s.customerId === customer.customerId && s.status === "reserved");

  row.innerHTML = `
    <td class="cell-primary">
      <div class="project-title-cell">
        <div class="project-icon">
          <span class="material-symbols-rounded">person</span>
        </div>
        <div class="project-info">
          <div class="project-title-text">${escapeHtml(customer.name)}</div>
          ${
            reservedItems.length > 0
              ? `<div class="project-meta-text">Reserved: ${reservedItems.map((s) => escapeHtml(s.item)).join(", ")}</div>`
              : ""
          }
          ${customer.notes ? `<div class="project-meta-text">${escapeHtml(customer.notes)}</div>` : ""}
        </div>
      </div>
    </td>
    <td data-label="Order">${escapeHtml(customer.order)}</td>
    <td data-label="Amount">${formatCurrency(customer.amount)}</td>
    <td data-label="Status"><span class="status-badge ${customer.status}">${statusLabels[customer.status] || customer.status}</span></td>
    <td data-label="Date">${formatDate(customer.date)}</td>
    ${
      showActions
        ? `<td class="cell-actions">
            <div class="row-actions">
              <button class="row-action-btn edit-customer-btn" data-id="${customer.id}" title="Edit">
                <span class="material-symbols-rounded">edit</span>
              </button>
              <button class="row-action-btn danger delete-customer-btn" data-id="${customer.id}" title="Delete">
                <span class="material-symbols-rounded">delete</span>
              </button>
            </div>
          </td>`
        : ""
    }
  `;

  return row;
}

function attachCustomerRowActions(tbody) {
  tbody.querySelectorAll(".edit-customer-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const customer = customerOrders.find((c) => c.id === btn.dataset.id);
      if (customer) openCustomerModal(customer);
    });
  });

  tbody.querySelectorAll(".delete-customer-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteCustomer(btn.dataset.id));
  });
}

function renderCustomers() {
  if (!customersUnpaidTableBody) return;

  customersUnpaidTableBody.innerHTML = "";
  customersPaidTableBody.innerHTML = "";

  if (customerOrders.length === 0) {
    customersEmptyState.style.display = "block";
    document.querySelectorAll(".customer-section").forEach((el) => (el.style.display = "none"));
  } else {
    customersEmptyState.style.display = "none";
    document.querySelectorAll(".customer-section").forEach((el) => (el.style.display = "block"));

    const unpaid = customerOrders.filter((c) => c.status !== "paid");
    const paid = customerOrders.filter((c) => c.status === "paid");

    customersUnpaidCount.textContent = `(${unpaid.length})`;
    customersPaidCount.textContent = `(${paid.length})`;

    if (unpaid.length === 0) {
      customersUnpaidEmptyState.style.display = "block";
    } else {
      customersUnpaidEmptyState.style.display = "none";
      unpaid.forEach((customer) => customersUnpaidTableBody.appendChild(buildCustomerRow(customer)));
      attachCustomerRowActions(customersUnpaidTableBody);
    }

    if (paid.length === 0) {
      customersPaidEmptyState.style.display = "block";
    } else {
      customersPaidEmptyState.style.display = "none";
      paid.forEach((customer) => customersPaidTableBody.appendChild(buildCustomerRow(customer)));
      attachCustomerRowActions(customersPaidTableBody);
    }
  }

  updateCustomerStats();
  populateExistingCustomerNamesDatalist();
}

function populateExistingCustomerNamesDatalist() {
  const datalist = document.getElementById("existingCustomerNames");
  if (!datalist) return;

  const uniqueNames = [...new Set(customers.map((c) => c.name))];
  datalist.innerHTML = uniqueNames.map((name) => `<option value="${escapeHtml(name)}"></option>`).join("");
}

function updateCustomerStats() {
  if (!customerCountValue) return;

  const total = customerOrders.length;
  // "Total Revenue" here matches Overview/Products: actual sold-item revenue,
  // not manually-logged order amounts (which drift out of sync — see
  // [[project_dashboard_customer_schema_migration]]). "Outstanding" stays
  // order-based since that's a distinct concept (money still owed) with no
  // equivalent on the products side.
  const revenue = getTotalSoldRevenue();
  const outstanding = customerOrders.reduce((sum, c) => sum + (c.status === "pending" ? Number(c.amount) : 0), 0);

  customerCountValue.textContent = total;
  customerRevenueValue.textContent = formatCurrency(revenue);
  customerOutstandingValue.textContent = formatCurrency(outstanding);

  updateOverviewStats();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ===================================
// TASKS FUNCTIONALITY
// ===================================

let tasks = [];
let editingTaskId = null;
let currentTaskFilter = "all";

// DOM Elements (tasks)
const taskList = document.getElementById("taskList");
const tasksEmptyState = document.getElementById("tasksEmptyState");
const taskCountValue = document.getElementById("taskCountValue");
const taskCompletedValue = document.getElementById("taskCompletedValue");
const taskOpenValue = document.getElementById("taskOpenValue");
const taskFilterGroup = document.getElementById("taskFilterGroup");

const addTaskBtn = document.getElementById("addTaskBtn");
const taskModalOverlay = document.getElementById("taskModalOverlay");
const taskModalTitle = document.getElementById("taskModalTitle");
const taskModalClose = document.getElementById("taskModalClose");
const taskCancelBtn = document.getElementById("taskCancelBtn");
const taskForm = document.getElementById("taskForm");

const taskIdInput = document.getElementById("taskId");
const taskTitleInput = document.getElementById("taskTitle");
const taskCustomerInput = document.getElementById("taskCustomer");
const taskPriorityInput = document.getElementById("taskPriority");
const taskDueDateInput = document.getElementById("taskDueDate");
const taskNotesInput = document.getElementById("taskNotes");

async function initTasks() {
  if (!taskList) return;

  await loadTasks();
  renderTasks();

  addTaskBtn?.addEventListener("click", () => openTaskModal());
  taskModalClose?.addEventListener("click", closeTaskModal);
  taskCancelBtn?.addEventListener("click", closeTaskModal);

  taskModalOverlay?.addEventListener("click", (e) => {
    if (e.target === taskModalOverlay) closeTaskModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && taskModalOverlay?.classList.contains("active")) {
      closeTaskModal();
    }
  });

  taskForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    saveTaskFromForm();
  });

  taskFilterGroup?.querySelectorAll(".task-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentTaskFilter = btn.dataset.filter;
      taskFilterGroup.querySelectorAll(".task-filter-btn").forEach((b) => b.classList.toggle("active", b === btn));
      renderTasks();
    });
  });
}

async function loadTasks() {
  try {
    const { data, error } = await supabaseClient
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    tasks = (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      customerId: row.customer_id,
      customerName: row.customer_name || "",
      priority: row.priority,
      dueDate: row.due_date,
      notes: row.notes || "",
      completed: row.completed,
    }));
  } catch (err) {
    console.error("Failed to load tasks:", err);
    tasks = [];
  }
}

function populateTaskCustomerDropdown(selectedId) {
  if (!taskCustomerInput) return;

  taskCustomerInput.innerHTML = '<option value="">— None —</option>';

  customers.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    if (c.id === selectedId) opt.selected = true;
    taskCustomerInput.appendChild(opt);
  });
}

function openTaskModal(task = null) {
  editingTaskId = task ? task.id : null;
  taskModalTitle.textContent = task ? "Edit Task" : "Add Task";

  populateTaskCustomerDropdown(task ? task.customerId : "");

  taskIdInput.value = task ? task.id : "";
  taskTitleInput.value = task ? task.title : "";
  taskPriorityInput.value = task ? task.priority : "medium";
  taskDueDateInput.value = task ? task.dueDate || "" : "";
  taskNotesInput.value = task ? task.notes || "" : "";

  taskModalOverlay.classList.add("active");
  setTimeout(() => taskTitleInput.focus(), 50);
}

function closeTaskModal() {
  taskModalOverlay.classList.remove("active");
  taskForm.reset();
  editingTaskId = null;
}

async function saveTaskFromForm() {
  const title = taskTitleInput.value.trim();
  const customerId = taskCustomerInput.value || null;
  const customerName = customerId ? customers.find((c) => c.id === customerId)?.name || "" : "";
  const priority = taskPriorityInput.value;
  const dueDate = taskDueDateInput.value || null;
  const notes = taskNotesInput.value.trim();

  if (!title) return;

  const saveBtn = document.getElementById("taskSaveBtn");
  if (saveBtn) saveBtn.disabled = true;

  const payload = {
    title,
    customer_id: customerId,
    customer_name: customerName,
    priority,
    due_date: dueDate,
    notes,
  };

  try {
    if (editingTaskId) {
      const { error } = await supabaseClient.from("tasks").update(payload).eq("id", editingTaskId);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient.from("tasks").insert([{ ...payload, completed: false }]);
      if (error) throw error;
    }

    await loadTasks();
    renderTasks();
    closeTaskModal();
  } catch (err) {
    console.error("Failed to save task:", err);
    alert("Couldn't save task — check your internet connection and try again." + "\n\nError: " + err.message);
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

async function toggleTaskCompleted(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const newCompleted = !task.completed;
  task.completed = newCompleted; // optimistic UI update
  renderTasks();

  try {
    const { error } = await supabaseClient.from("tasks").update({ completed: newCompleted }).eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.error("Failed to update task:", err);
    task.completed = !newCompleted; // revert on failure
    renderTasks();
    alert("Couldn't update task — check your internet connection and try again." + "\n\nError: " + err.message);
  }
}

async function deleteTask(id) {
  if (!confirm("Delete this task?")) return;

  try {
    const { error } = await supabaseClient.from("tasks").delete().eq("id", id);
    if (error) throw error;

    await loadTasks();
    renderTasks();
  } catch (err) {
    console.error("Failed to delete task:", err);
    alert("Couldn't delete task — check your internet connection and try again." + "\n\nError: " + err.message);
  }
}

function getFilteredTasks() {
  if (currentTaskFilter === "open") return tasks.filter((t) => !t.completed);
  if (currentTaskFilter === "completed") return tasks.filter((t) => t.completed);
  return tasks;
}

function renderTasks() {
  if (!taskList) return;

  const filtered = getFilteredTasks();
  taskList.innerHTML = "";

  if (filtered.length === 0) {
    tasksEmptyState.style.display = "block";
  } else {
    tasksEmptyState.style.display = "none";

    filtered.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-item" + (task.completed ? " completed" : "");

      const metaParts = [];
      metaParts.push(`<span class="priority-badge ${task.priority}">${task.priority}</span>`);
      if (task.customerName) {
        metaParts.push(`<span class="task-meta-item task-customer-tag"><span class="material-symbols-rounded">person</span>${escapeHtml(task.customerName)}</span>`);
      }
      if (task.dueDate) {
        metaParts.push(`<span class="task-meta-item"><span class="material-symbols-rounded">event</span>${formatDate(task.dueDate)}</span>`);
      }

      li.innerHTML = `
        <div class="task-checkbox ${task.completed ? "checked" : ""}" data-id="${task.id}">
          <span class="material-symbols-rounded">check</span>
        </div>
        <div class="task-body">
          <div class="task-title">${escapeHtml(task.title)}</div>
          <div class="task-meta">${metaParts.join("")}</div>
        </div>
        <div class="row-actions">
          <button class="row-action-btn edit-task-btn" data-id="${task.id}" title="Edit">
            <span class="material-symbols-rounded">edit</span>
          </button>
          <button class="row-action-btn danger delete-task-btn" data-id="${task.id}" title="Delete">
            <span class="material-symbols-rounded">delete</span>
          </button>
        </div>
      `;

      taskList.appendChild(li);
    });

    taskList.querySelectorAll(".task-checkbox").forEach((box) => {
      box.addEventListener("click", () => toggleTaskCompleted(box.dataset.id));
    });

    taskList.querySelectorAll(".edit-task-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const task = tasks.find((t) => t.id === btn.dataset.id);
        if (task) openTaskModal(task);
      });
    });

    taskList.querySelectorAll(".delete-task-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteTask(btn.dataset.id));
    });
  }

  updateTaskStats();
}

function updateTaskStats() {
  if (!taskCountValue) return;

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const open = total - completed;

  taskCountValue.textContent = total;
  taskCompletedValue.textContent = completed;
  taskOpenValue.textContent = open;

  updateOverviewStats();
}

// ===================================
// OVERVIEW STATS
// ===================================

const overviewCustomerCount = document.getElementById("overviewCustomerCount");
const overviewPendingTasks = document.getElementById("overviewPendingTasks");
const overviewTotalEarnings = document.getElementById("overviewTotalEarnings");
const overviewInstagramFollowers = document.getElementById("overviewInstagramFollowers");
const overviewInstagramUpdated = document.getElementById("overviewInstagramUpdated");
const editFollowersBtn = document.getElementById("editFollowersBtn");
const refreshFollowersBtn = document.getElementById("refreshFollowersBtn");
const overviewUnpaidTableBody = document.getElementById("overviewUnpaidTableBody");
const overviewUnpaidEmptyState = document.getElementById("overviewUnpaidEmptyState");
const overviewViewAllBtn = document.getElementById("overviewViewAllBtn");

overviewViewAllBtn?.addEventListener("click", () => switchView("customers"));

document.addEventListener("click", (e) => {
  const card = e.target.closest(".stat-card-link[data-target-view]");
  if (card) switchView(card.dataset.targetView);
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const card = e.target.closest(".stat-card-link[data-target-view]");
  if (card) {
    e.preventDefault();
    switchView(card.dataset.targetView);
  }
});

function updateOverviewStats() {
  if (overviewCustomerCount) {
    overviewCustomerCount.textContent = customerOrders.length;
  }

  if (overviewPendingTasks) {
    overviewPendingTasks.textContent = tasks.filter((t) => !t.completed).length;
  }

  if (overviewTotalEarnings) {
    overviewTotalEarnings.textContent = formatCurrency(getTotalSoldRevenue());
  }

  renderOverviewUnpaidCustomers();
  updateAllCharts();
}

function renderOverviewUnpaidCustomers() {
  if (!overviewUnpaidTableBody) return;

  const unpaid = customerOrders.filter((c) => c.status !== "paid");
  overviewUnpaidTableBody.innerHTML = "";

  if (unpaid.length === 0) {
    overviewUnpaidEmptyState.style.display = "block";
    return;
  }

  overviewUnpaidEmptyState.style.display = "none";

  unpaid.slice(0, 5).forEach((customer) => {
    overviewUnpaidTableBody.appendChild(buildCustomerRow(customer, { showActions: false }));
  });
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const then = new Date(dateStr).getTime();
  const diffMinutes = Math.round((Date.now() - then) / 60000);

  if (diffMinutes < 1) return "Updated just now";
  if (diffMinutes < 60) return `Updated ${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `Updated ${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `Updated ${diffDays}d ago`;
}

async function initInstagramFollowersCard() {
  if (!overviewInstagramFollowers) return;

  await loadInstagramFollowers();

  editFollowersBtn?.addEventListener("click", async () => {
    const current = overviewInstagramFollowers.textContent.replace(/[^0-9]/g, "");
    const input = prompt("Enter current follower count for @resell93luxury_:", current);
    if (input === null) return;

    const value = parseInt(input.replace(/[^0-9]/g, ""), 10);
    if (isNaN(value)) return;

    try {
      const { error } = await supabaseClient
        .from("stats")
        .upsert({ id: "instagram_followers", value, updated_at: new Date().toISOString() });
      if (error) throw error;
      await loadInstagramFollowers();
    } catch (err) {
      console.error("Failed to save follower count:", err);
      alert("Couldn't save that — check your internet connection and try again." + "\n\nError: " + err.message);
    }
  });

  refreshFollowersBtn?.addEventListener("click", refreshInstagramFollowersLive);
}

async function loadInstagramFollowers() {
  try {
    const { data, error } = await supabaseClient.from("stats").select("*").eq("id", "instagram_followers").single();
    if (error) throw error;

    overviewInstagramFollowers.textContent = data?.value != null ? Number(data.value).toLocaleString() : "—";
    if (overviewInstagramUpdated) {
      overviewInstagramUpdated.textContent = formatRelativeTime(data?.updated_at);
    }
  } catch (err) {
    console.error("Failed to load follower count:", err);
  }
}

async function refreshInstagramFollowersLive() {
  if (!refreshFollowersBtn) return;

  refreshFollowersBtn.disabled = true;
  const icon = refreshFollowersBtn.querySelector(".material-symbols-rounded");
  if (icon) icon.style.animation = "spin 1s linear infinite";

  try {
    const { data, error } = await supabaseClient.functions.invoke("refresh-instagram-followers");
    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    await loadInstagramFollowers();
  } catch (err) {
    console.error("Failed to refresh follower count live:", err);
    alert("Couldn't fetch a live count right now. You can still set it manually with the pencil icon.");
  } finally {
    refreshFollowersBtn.disabled = false;
    if (icon) icon.style.animation = "";
  }
}

// ===================================
// REALTIME SYNC (so you and your friend see each other's changes)
// ===================================

function subscribeToRealtimeUpdates() {
  try {
    supabaseClient
      .channel("customers-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, async () => {
        await loadCustomers();
        renderStock();
        renderProductsPage();
      })
      .subscribe();

    supabaseClient
      .channel("customer-orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "customer_orders" }, async () => {
        await loadCustomerOrders();
        renderCustomers();
        renderHauls();
        renderHaulDetail();
      })
      .subscribe();

    supabaseClient
      .channel("tasks-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, async () => {
        await loadTasks();
        renderTasks();
      })
      .subscribe();

    supabaseClient
      .channel("stats-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "stats" }, async () => {
        await loadInstagramFollowers();
      })
      .subscribe();

    supabaseClient
      .channel("hauls-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "hauls" }, async () => {
        await loadHauls();
        renderHauls();
        renderStock();
      })
      .subscribe();

    supabaseClient
      .channel("haul-expenses-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "haul_expenses" }, async () => {
        await loadHaulExpenses();
        renderHaulDetail();
        renderHauls();
      })
      .subscribe();

    supabaseClient
      .channel("haul-income-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "haul_income" }, async () => {
        await loadHaulIncome();
        renderHaulDetail();
        renderHauls();
      })
      .subscribe();

    supabaseClient
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, async () => {
        await loadProducts();
        renderStock();
        renderHaulDetail();
        renderCustomers();
        renderProductsPage();
      })
      .subscribe();

    supabaseClient
      .channel("business-expenses-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "business_expenses" }, async () => {
        await loadBusinessExpenses();
        renderBusinessExpenses();
        renderFinances();
      })
      .subscribe();

    supabaseClient
      .channel("notes-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, async () => {
        await loadNotes();
        renderNotes();
      })
      .subscribe();
  } catch (err) {
    // Realtime is a nice-to-have; the app still works without it (just needs a manual refresh)
    console.error("Realtime subscription failed:", err);
  }
}

// ===================================
// ONE-TIME MIGRATION: old localStorage data -> Supabase
// ===================================

async function migrateLegacyLocalData() {
  const LEGACY_CUSTOMERS_KEY = "resell-customers";
  const LEGACY_TASKS_KEY = "resell-tasks";

  let legacyCustomers = [];
  let legacyTasks = [];

  try {
    const stored = localStorage.getItem(LEGACY_CUSTOMERS_KEY);
    if (stored) legacyCustomers = JSON.parse(stored);
  } catch (err) {
    console.error("Failed to read legacy customers:", err);
  }

  try {
    const stored = localStorage.getItem(LEGACY_TASKS_KEY);
    if (stored) legacyTasks = JSON.parse(stored);
  } catch (err) {
    console.error("Failed to read legacy tasks:", err);
  }

  if (legacyCustomers.length === 0 && legacyTasks.length === 0) return;

  const proceed = confirm(
    `Found ${legacyCustomers.length} customer(s) and ${legacyTasks.length} task(s) saved locally from before the database switch. Import them into the shared database now?`
  );

  if (!proceed) {
    // Don't ask again on every load — they said no on purpose.
    localStorage.removeItem(LEGACY_CUSTOMERS_KEY);
    localStorage.removeItem(LEGACY_TASKS_KEY);
    return;
  }

  const idMap = {}; // old local id -> new Supabase id
  let importedCustomers = 0;
  let importedTasks = 0;

  for (const c of legacyCustomers) {
    try {
      const { data, error } = await supabaseClient
        .from("customers")
        .insert([
          {
            name: c.name,
            order: c.order,
            amount: c.amount,
            status: c.status,
            date: c.date || null,
            notes: c.notes || "",
          },
        ])
        .select()
        .single();

      if (error) throw error;
      idMap[c.id] = data.id;
      importedCustomers++;
    } catch (err) {
      console.error("Failed to import customer:", c, err);
    }
  }

  for (const t of legacyTasks) {
    try {
      const newCustomerId = t.customerId && idMap[t.customerId] ? idMap[t.customerId] : null;

      const { error } = await supabaseClient.from("tasks").insert([
        {
          title: t.title,
          customer_id: newCustomerId,
          customer_name: t.customerName || "",
          priority: t.priority,
          due_date: t.dueDate || null,
          notes: t.notes || "",
          completed: !!t.completed,
        },
      ]);

      if (error) throw error;
      importedTasks++;
    } catch (err) {
      console.error("Failed to import task:", t, err);
    }
  }

  localStorage.removeItem(LEGACY_CUSTOMERS_KEY);
  localStorage.removeItem(LEGACY_TASKS_KEY);

  alert(`Import complete: ${importedCustomers} customer(s) and ${importedTasks} task(s) added to the shared database.`);
}

// ===================================
// HAUL FUNCTIONALITY
// ===================================

let hauls = [];
let haulExpenses = [];
let haulIncome = [];
let editingHaulId = null;
let currentHaulDetailId = null;

// DOM Elements (haul list + add/edit modal)
const haulsTableBody = document.getElementById("haulsTableBody");
const haulsEmptyState = document.getElementById("haulsEmptyState");
const haulCountValue = document.getElementById("haulCountValue");
const haulIncomeValue = document.getElementById("haulIncomeValue");
const haulExpenseValue = document.getElementById("haulExpenseValue");
const haulProfitValue = document.getElementById("haulProfitValue");

const addHaulBtn = document.getElementById("addHaulBtn");
const haulModalOverlay = document.getElementById("haulModalOverlay");
const haulModalTitle = document.getElementById("haulModalTitle");
const haulModalClose = document.getElementById("haulModalClose");
const haulCancelBtn = document.getElementById("haulCancelBtn");
const haulForm = document.getElementById("haulForm");
const haulIdInput = document.getElementById("haulId");
const haulNameInput = document.getElementById("haulName");
const haulStatusInput = document.getElementById("haulStatus");
const haulExpectedRevenueGroup = document.getElementById("haulExpectedRevenueGroup");
const haulExpectedRevenueInput = document.getElementById("haulExpectedRevenue");
const haulDateInput = document.getElementById("haulDate");
const haulNotesInput = document.getElementById("haulNotes");

// DOM Elements (haul detail modal)
const haulDetailModalOverlay = document.getElementById("haulDetailModalOverlay");
const haulDetailTitle = document.getElementById("haulDetailTitle");
const haulDetailClose = document.getElementById("haulDetailClose");
const haulDetailSummary = document.getElementById("haulDetailSummary");
const haulDetailCustomers = document.getElementById("haulDetailCustomers");
const haulDetailCustomersEmpty = document.getElementById("haulDetailCustomersEmpty");
const haulDetailStock = document.getElementById("haulDetailStock");
const haulDetailStockEmpty = document.getElementById("haulDetailStockEmpty");
const haulDetailAddStockBtn = document.getElementById("haulDetailAddStockBtn");
const haulDetailIncome = document.getElementById("haulDetailIncome");
const haulDetailExpenses = document.getElementById("haulDetailExpenses");
const haulIncomeForm = document.getElementById("haulIncomeForm");
const haulIncomeDescription = document.getElementById("haulIncomeDescription");
const haulIncomeAmount = document.getElementById("haulIncomeAmount");
const haulExpenseForm = document.getElementById("haulExpenseForm");
const haulExpenseDescription = document.getElementById("haulExpenseDescription");
const haulExpenseAmount = document.getElementById("haulExpenseAmount");
const haulDetailDeleteBtn = document.getElementById("haulDetailDeleteBtn");
const haulDetailEditBtn = document.getElementById("haulDetailEditBtn");
const haulDetailAddCustomerBtn = document.getElementById("haulDetailAddCustomerBtn");
const haulDetailBackfillBtn = document.getElementById("haulDetailBackfillBtn");

async function initHaul() {
  if (!haulsTableBody) return;

  await loadHauls();
  await loadHaulExpenses();
  await loadHaulIncome();
  renderHauls();

  addHaulBtn?.addEventListener("click", () => openHaulModal());
  haulModalClose?.addEventListener("click", closeHaulModal);
  haulCancelBtn?.addEventListener("click", closeHaulModal);
  haulModalOverlay?.addEventListener("click", (e) => {
    if (e.target === haulModalOverlay) closeHaulModal();
  });
  haulForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    saveHaulFromForm();
  });
  haulStatusInput?.addEventListener("change", updateHaulExpectedRevenueVisibility);

  haulDetailClose?.addEventListener("click", closeHaulDetailModal);
  haulDetailModalOverlay?.addEventListener("click", (e) => {
    if (e.target === haulDetailModalOverlay) closeHaulDetailModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (haulModalOverlay?.classList.contains("active")) closeHaulModal();
    if (haulDetailModalOverlay?.classList.contains("active")) closeHaulDetailModal();
  });

  haulIncomeForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    addHaulIncomeEntry();
  });

  haulExpenseForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    addHaulExpenseEntry();
  });

  haulDetailDeleteBtn?.addEventListener("click", deleteHaulFromDetail);
  haulDetailEditBtn?.addEventListener("click", () => {
    const haul = hauls.find((h) => h.id === currentHaulDetailId);
    closeHaulDetailModal();
    if (haul) openHaulModal(haul);
  });

  haulDetailAddCustomerBtn?.addEventListener("click", () => {
    const haulId = currentHaulDetailId;
    closeHaulDetailModal();
    returnToHaulDetailId = haulId;
    openCustomerModal(null, haulId);
  });

  haulDetailAddStockBtn?.addEventListener("click", () => {
    const haulId = currentHaulDetailId;
    closeHaulDetailModal();
    returnToHaulDetailIdForStock = haulId;
    openStockModal(null, haulId);
  });

  haulDetailBackfillBtn?.addEventListener("click", () => {
    const haulId = currentHaulDetailId;
    closeHaulDetailModal();
    returnToHaulDetailIdForBackfill = haulId;
    openBackfillModal(haulId);
  });
}

async function loadHauls() {
  try {
    const { data, error } = await supabaseClient.from("hauls").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    hauls = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status || "planned",
      date: row.date,
      notes: row.notes || "",
      expectedRevenue: row.expected_revenue != null ? Number(row.expected_revenue) : null,
    }));
  } catch (err) {
    console.error("Failed to load hauls:", err);
    hauls = [];
  }
}

async function loadHaulExpenses() {
  try {
    const { data, error } = await supabaseClient
      .from("haul_expenses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    haulExpenses = (data || []).map((row) => ({
      id: row.id,
      haulId: row.haul_id,
      description: row.description,
      amount: Number(row.amount),
      date: row.date,
    }));
  } catch (err) {
    console.error("Failed to load haul expenses:", err);
    haulExpenses = [];
  }
}

async function loadHaulIncome() {
  try {
    const { data, error } = await supabaseClient
      .from("haul_income")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    haulIncome = (data || []).map((row) => ({
      id: row.id,
      haulId: row.haul_id,
      description: row.description,
      amount: Number(row.amount),
      date: row.date,
    }));
  } catch (err) {
    console.error("Failed to load haul income:", err);
    haulIncome = [];
  }
}

function formatHaulStatusLabel(status) {
  const labels = { draft: "Concept", planned: "Planned", underway: "Underway", arrived: "Arrived", completed: "Completed" };
  return labels[status] || "Planned";
}

function computeHaulStats(haulId) {
  const linkedCustomers = customerOrders.filter((c) => c.haulId === haulId);
  const customerRevenue = linkedCustomers.reduce((sum, c) => sum + (c.status !== "pending" ? Number(c.amount) : 0), 0);
  const manualIncome = haulIncome.filter((i) => i.haulId === haulId).reduce((sum, i) => sum + Number(i.amount), 0);
  const expenses = haulExpenses.filter((e) => e.haulId === haulId).reduce((sum, e) => sum + Number(e.amount), 0);
  const totalIncome = customerRevenue + manualIncome;
  const profit = totalIncome - expenses;

  return {
    customerCount: linkedCustomers.length,
    customerRevenue,
    manualIncome,
    totalIncome,
    expenses,
    profit,
  };
}

function openHaulModal(haul = null) {
  editingHaulId = haul ? haul.id : null;
  haulModalTitle.textContent = haul ? "Edit Haul" : "Add Haul";

  haulIdInput.value = haul ? haul.id : "";
  haulNameInput.value = haul ? haul.name : "";
  haulStatusInput.value = haul ? haul.status || "planned" : "planned";
  haulExpectedRevenueInput.value = haul && haul.expectedRevenue != null ? haul.expectedRevenue : "";
  haulDateInput.value = haul ? haul.date || "" : "";
  haulNotesInput.value = haul ? haul.notes || "" : "";
  updateHaulExpectedRevenueVisibility();

  haulModalOverlay.classList.add("active");
  setTimeout(() => haulNameInput.focus(), 50);
}

function updateHaulExpectedRevenueVisibility() {
  if (!haulExpectedRevenueGroup) return;
  haulExpectedRevenueGroup.style.display = haulStatusInput.value === "draft" ? "block" : "none";
}

function closeHaulModal() {
  haulModalOverlay.classList.remove("active");
  haulForm.reset();
  editingHaulId = null;
}

async function saveHaulFromForm() {
  const name = haulNameInput.value.trim();
  const status = haulStatusInput.value;
  const date = haulDateInput.value || null;
  const notes = haulNotesInput.value.trim();
  const expected_revenue = haulExpectedRevenueInput.value !== "" ? Number(haulExpectedRevenueInput.value) : null;

  if (!name) return;

  const saveBtn = document.getElementById("haulSaveBtn");
  if (saveBtn) saveBtn.disabled = true;

  try {
    if (editingHaulId) {
      const { error } = await supabaseClient
        .from("hauls")
        .update({ name, status, date, notes, expected_revenue })
        .eq("id", editingHaulId);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient.from("hauls").insert([{ name, status, date, notes, expected_revenue }]);
      if (error) throw error;
    }

    await loadHauls();
    renderHauls();
    closeHaulModal();
  } catch (err) {
    console.error("Failed to save haul:", err);
    alert("Couldn't save haul — check your internet connection and try again." + "\n\nError: " + err.message);
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

function renderHauls() {
  if (!haulsTableBody) return;

  haulsTableBody.innerHTML = "";

  if (hauls.length === 0) {
    haulsEmptyState.style.display = "block";
  } else {
    haulsEmptyState.style.display = "none";

    hauls.forEach((haul) => {
      const stats = computeHaulStats(haul.id);
      const row = document.createElement("tr");
      row.style.cursor = "pointer";

      row.innerHTML = `
        <td class="cell-primary">
          <div class="project-title-cell">
            <div class="project-icon">
              <span class="material-symbols-rounded">shopping_bag</span>
            </div>
            <div class="project-info">
              <div class="project-title-text">${escapeHtml(haul.name)}</div>
              ${haul.date ? `<div class="project-meta-text">${formatDate(haul.date)}</div>` : ""}
            </div>
          </div>
        </td>
        <td data-label="Status"><span class="status-badge ${haul.status || "planned"}">${formatHaulStatusLabel(haul.status)}</span></td>
        <td data-label="Customers">${stats.customerCount}</td>
        <td data-label="Income">${
          haul.status === "draft" && haul.expectedRevenue != null
            ? `<span class="project-meta-text">Expected: ${formatCurrency(haul.expectedRevenue)}</span>`
            : formatCurrency(stats.totalIncome)
        }</td>
        <td data-label="Expenses">${formatCurrency(stats.expenses)}</td>
        <td data-label="Profit" style="color: ${stats.profit >= 0 ? "var(--color-success)" : "var(--color-error)"}; font-weight: var(--weight-medium);">${formatCurrency(stats.profit)}</td>
        <td class="cell-actions">
          <div class="row-actions">
            <button class="row-action-btn view-haul-btn" data-id="${haul.id}" title="View">
              <span class="material-symbols-rounded">chevron_right</span>
            </button>
          </div>
        </td>
      `;

      row.addEventListener("click", (e) => {
        if (e.target.closest(".view-haul-btn") || !e.target.closest(".cell-actions")) {
          openHaulDetailModal(haul.id);
        }
      });

      haulsTableBody.appendChild(row);
    });
  }

  updateHaulTotals();
  renderFinances();
  updateOverviewStats();
}

function updateHaulTotals() {
  if (!haulCountValue) return;

  let totalIncome = 0;
  let totalExpenses = 0;

  hauls.forEach((haul) => {
    const stats = computeHaulStats(haul.id);
    totalIncome += stats.totalIncome;
    totalExpenses += stats.expenses;
  });

  haulCountValue.textContent = hauls.length;
  haulIncomeValue.textContent = formatCurrency(totalIncome);
  haulExpenseValue.textContent = formatCurrency(totalExpenses);
  haulProfitValue.textContent = formatCurrency(totalIncome - totalExpenses);
}

function openHaulDetailModal(haulId) {
  const haul = hauls.find((h) => h.id === haulId);
  if (!haul) return;

  currentHaulDetailId = haulId;
  haulDetailTitle.innerHTML = `${escapeHtml(haul.name)} <span class="status-badge ${haul.status || "planned"}" style="margin-left: var(--space-sm); vertical-align: middle;">${formatHaulStatusLabel(haul.status)}</span>`;

  renderHaulDetail();
  haulDetailModalOverlay.classList.add("active");
}

function closeHaulDetailModal() {
  haulDetailModalOverlay.classList.remove("active");
  currentHaulDetailId = null;
}

function renderHaulDetail() {
  if (!currentHaulDetailId) return;

  const stats = computeHaulStats(currentHaulDetailId);
  const haul = hauls.find((h) => h.id === currentHaulDetailId);

  haulDetailSummary.innerHTML = `
    <div class="haul-detail-summary-item">
      <div class="haul-detail-summary-label">Customers</div>
      <div class="haul-detail-summary-value">${stats.customerCount}</div>
    </div>
    <div class="haul-detail-summary-item">
      <div class="haul-detail-summary-label">Income</div>
      <div class="haul-detail-summary-value">${formatCurrency(stats.totalIncome)}</div>
    </div>
    <div class="haul-detail-summary-item">
      <div class="haul-detail-summary-label">Expenses</div>
      <div class="haul-detail-summary-value">${formatCurrency(stats.expenses)}</div>
    </div>
    <div class="haul-detail-summary-item">
      <div class="haul-detail-summary-label">Profit</div>
      <div class="haul-detail-summary-value" style="color: ${stats.profit >= 0 ? "var(--color-success)" : "var(--color-error)"};">${formatCurrency(stats.profit)}</div>
    </div>
    ${
      haul && haul.status === "draft" && haul.expectedRevenue != null
        ? `<div class="haul-detail-summary-item">
             <div class="haul-detail-summary-label">Expected Revenue</div>
             <div class="haul-detail-summary-value">${formatCurrency(haul.expectedRevenue)}</div>
           </div>`
        : ""
    }
  `;

  const linkedCustomers = customerOrders.filter((c) => c.haulId === currentHaulDetailId);
  haulDetailCustomers.innerHTML = "";

  if (linkedCustomers.length === 0) {
    haulDetailCustomersEmpty.style.display = "block";
  } else {
    haulDetailCustomersEmpty.style.display = "none";
    linkedCustomers.forEach((c) => {
      const li = document.createElement("li");
      li.className = "haul-mini-list-item";
      li.innerHTML = `
        <span>${escapeHtml(c.name)} — ${escapeHtml(c.order)}</span>
        <span class="haul-mini-list-item-amount">${formatCurrency(c.amount)}</span>
        <button class="row-action-btn unlink-customer-btn" data-id="${c.id}" title="Unlink from this haul">
          <span class="material-symbols-rounded">link_off</span>
        </button>
      `;
      haulDetailCustomers.appendChild(li);
    });

    haulDetailCustomers.querySelectorAll(".unlink-customer-btn").forEach((btn) => {
      btn.addEventListener("click", () => unlinkCustomerFromHaul(btn.dataset.id));
    });
  }

  const linkedProducts = products.filter((s) => s.haulId === currentHaulDetailId);
  haulDetailStock.innerHTML = "";

  if (linkedProducts.length === 0) {
    haulDetailStockEmpty.style.display = "block";
  } else {
    haulDetailStockEmpty.style.display = "none";
    linkedProducts.forEach((s) => {
      const linkedCustomer = s.customerId ? customers.find((c) => c.id === s.customerId) : null;
      const destinationLabel =
        s.destination === "customer" ? (linkedCustomer ? `For ${escapeHtml(linkedCustomer.name)}` : "For a customer") : "Stock";
      const statusBadge =
        s.status === "sold"
          ? `<span class="status-badge sold">Sold</span>`
          : s.status === "reserved"
            ? `<span class="status-badge reserved">Reserved</span>`
            : "";

      const li = document.createElement("li");
      li.className = "haul-mini-list-item";
      li.innerHTML = `
        <span>${escapeHtml(s.item)}${s.quantity > 1 ? ` (x${s.quantity})` : ""} — <span class="project-meta-text" style="display:inline;">${destinationLabel}</span> ${statusBadge}</span>
        <span class="haul-mini-list-item-amount">${s.status === "sold" && s.salePrice != null ? formatCurrency(s.salePrice) : s.price != null ? formatCurrency(s.price) : "—"}</span>
        <div class="row-actions" style="display:inline-flex;">
          <button class="row-action-btn edit-product-btn" data-id="${s.id}" title="Edit">
            <span class="material-symbols-rounded">edit</span>
          </button>
          ${
            s.status !== "sold"
              ? `<button class="row-action-btn danger sold-product-btn" data-id="${s.id}" title="Mark as sold"><span class="material-symbols-rounded">sell</span></button>`
              : ""
          }
          <button class="row-action-btn unlink-stock-btn" data-id="${s.id}" title="Unlink from this haul">
            <span class="material-symbols-rounded">link_off</span>
          </button>
        </div>
      `;
      haulDetailStock.appendChild(li);
    });

    haulDetailStock.querySelectorAll(".edit-product-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = products.find((p) => p.id === btn.dataset.id);
        if (item) openStockModal(item);
      });
    });

    haulDetailStock.querySelectorAll(".unlink-stock-btn").forEach((btn) => {
      btn.addEventListener("click", () => unlinkStockFromHaul(btn.dataset.id));
    });

    haulDetailStock.querySelectorAll(".sold-product-btn").forEach((btn) => {
      btn.addEventListener("click", () => openStockSoldModal(btn.dataset.id));
    });
  }

  const incomeEntries = haulIncome.filter((i) => i.haulId === currentHaulDetailId);
  haulDetailIncome.innerHTML = "";
  incomeEntries.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "haul-mini-list-item";
    li.innerHTML = `
      <span>${escapeHtml(entry.description)}</span>
      <span class="haul-mini-list-item-amount income">+${formatCurrency(entry.amount)}</span>
      <button class="row-action-btn danger delete-haul-income-btn" data-id="${entry.id}" title="Delete">
        <span class="material-symbols-rounded">delete</span>
      </button>
    `;
    haulDetailIncome.appendChild(li);
  });
  haulDetailIncome.querySelectorAll(".delete-haul-income-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteHaulIncomeEntry(btn.dataset.id));
  });

  const expenseEntries = haulExpenses.filter((e) => e.haulId === currentHaulDetailId);
  haulDetailExpenses.innerHTML = "";
  expenseEntries.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "haul-mini-list-item";
    li.innerHTML = `
      <span>${escapeHtml(entry.description)}</span>
      <span class="haul-mini-list-item-amount expense">-${formatCurrency(entry.amount)}</span>
      <button class="row-action-btn danger delete-haul-expense-btn" data-id="${entry.id}" title="Delete">
        <span class="material-symbols-rounded">delete</span>
      </button>
    `;
    haulDetailExpenses.appendChild(li);
  });
  haulDetailExpenses.querySelectorAll(".delete-haul-expense-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteHaulExpenseEntry(btn.dataset.id));
  });

  haulIncomeForm?.reset();
  haulExpenseForm?.reset();
}

async function addHaulIncomeEntry() {
  const description = haulIncomeDescription.value.trim();
  const amount = parseFloat(haulIncomeAmount.value) || 0;
  if (!description || !currentHaulDetailId) return;

  try {
    const { error } = await supabaseClient
      .from("haul_income")
      .insert([{ haul_id: currentHaulDetailId, description, amount, date: new Date().toISOString().split("T")[0] }]);
    if (error) throw error;

    await loadHaulIncome();
    renderHaulDetail();
    renderHauls();
  } catch (err) {
    console.error("Failed to add income:", err);
    alert("Couldn't add income — check your internet connection and try again." + "\n\nError: " + err.message);
  }
}

async function deleteHaulIncomeEntry(id) {
  if (!confirm("Delete this income entry?")) return;

  try {
    const { error } = await supabaseClient.from("haul_income").delete().eq("id", id);
    if (error) throw error;

    await loadHaulIncome();
    renderHaulDetail();
    renderHauls();
  } catch (err) {
    console.error("Failed to delete income:", err);
    alert("Couldn't delete income — check your internet connection and try again." + "\n\nError: " + err.message);
  }
}

async function addHaulExpenseEntry() {
  const description = haulExpenseDescription.value.trim();
  const amount = parseFloat(haulExpenseAmount.value) || 0;
  if (!description || !currentHaulDetailId) return;

  try {
    const { error } = await supabaseClient
      .from("haul_expenses")
      .insert([{ haul_id: currentHaulDetailId, description, amount, date: new Date().toISOString().split("T")[0] }]);
    if (error) throw error;

    await loadHaulExpenses();
    renderHaulDetail();
    renderHauls();
  } catch (err) {
    console.error("Failed to add expense:", err);
    alert("Couldn't add expense — check your internet connection and try again." + "\n\nError: " + err.message);
  }
}

async function deleteHaulExpenseEntry(id) {
  if (!confirm("Delete this expense entry?")) return;

  try {
    const { error } = await supabaseClient.from("haul_expenses").delete().eq("id", id);
    if (error) throw error;

    await loadHaulExpenses();
    renderHaulDetail();
    renderHauls();
  } catch (err) {
    console.error("Failed to delete expense:", err);
    alert("Couldn't delete expense — check your internet connection and try again." + "\n\nError: " + err.message);
  }
}

async function unlinkCustomerFromHaul(orderId) {
  try {
    const { error } = await supabaseClient.from("customer_orders").update({ haul_id: null }).eq("id", orderId);
    if (error) throw error;

    await loadCustomerOrders();
    renderCustomers();
    renderHaulDetail();
    renderHauls();
  } catch (err) {
    console.error("Failed to unlink customer:", err);
    alert("Couldn't unlink customer — check your internet connection and try again." + "\n\nError: " + err.message);
  }
}

async function unlinkStockFromHaul(stockId) {
  try {
    const { error } = await supabaseClient.from("products").update({ haul_id: null }).eq("id", stockId);
    if (error) throw error;

    await loadProducts();
    renderStock();
    renderHaulDetail();
    renderHauls();
  } catch (err) {
    console.error("Failed to unlink product:", err);
    alert("Couldn't unlink product — check your internet connection and try again." + "\n\nError: " + err.message);
  }
}

async function deleteHaulFromDetail() {
  if (!currentHaulDetailId) return;
  if (!confirm("Delete this haul? Its expenses and income entries will be deleted too. Linked customers and products will stay, just unlinked.")) return;

  try {
    const { error } = await supabaseClient.from("hauls").delete().eq("id", currentHaulDetailId);
    if (error) throw error;

    closeHaulDetailModal();
    await loadHauls();
    await loadHaulExpenses();
    await loadHaulIncome();
    await loadCustomerOrders();
    await loadProducts();
    renderHauls();
    renderCustomers();
    renderStock();
  } catch (err) {
    console.error("Failed to delete haul:", err);
    alert("Couldn't delete haul — check your internet connection and try again." + "\n\nError: " + err.message);
  }
}

// ===================================
// FINANCES
// ===================================

let haulProfitChartInstance = null;
let businessExpenses = [];

const financeTotalRevenue = document.getElementById("financeTotalRevenue");
const financeTotalExpenses = document.getElementById("financeTotalExpenses");
const financeNetProfit = document.getElementById("financeNetProfit");
const financeHaulTableBody = document.getElementById("financeHaulTableBody");
const financeHaulEmptyState = document.getElementById("financeHaulEmptyState");
const businessExpenseList = document.getElementById("businessExpenseList");
const businessExpenseForm = document.getElementById("businessExpenseForm");
const businessExpenseDescription = document.getElementById("businessExpenseDescription");
const businessExpenseAmount = document.getElementById("businessExpenseAmount");
const businessExpenseEmptyState = document.getElementById("businessExpenseEmptyState");

function getOverallFinanceTotals() {
  const allCustomerRevenue = customerOrders.reduce((sum, c) => sum + (c.status !== "pending" ? Number(c.amount) : 0), 0);
  const allManualIncome = haulIncome.reduce((sum, i) => sum + Number(i.amount), 0);
  const allHaulExpenses = haulExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const allBusinessExpenses = businessExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalRevenue = allCustomerRevenue + allManualIncome;
  const totalExpenses = allHaulExpenses + allBusinessExpenses;

  return {
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
  };
}

async function initBusinessExpenses() {
  if (!businessExpenseForm) return;

  await loadBusinessExpenses();
  renderBusinessExpenses();
  renderFinances();

  businessExpenseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addBusinessExpenseEntry();
  });
}

async function loadBusinessExpenses() {
  try {
    const { data, error } = await supabaseClient
      .from("business_expenses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    businessExpenses = (data || []).map((row) => ({
      id: row.id,
      description: row.description,
      amount: Number(row.amount),
      date: row.date,
    }));
  } catch (err) {
    console.error("Failed to load business expenses:", err);
    businessExpenses = [];
  }
}

async function addBusinessExpenseEntry() {
  const description = businessExpenseDescription.value.trim();
  const amount = parseFloat(businessExpenseAmount.value) || 0;
  if (!description) return;

  try {
    const { error } = await supabaseClient
      .from("business_expenses")
      .insert([{ description, amount, date: new Date().toISOString().split("T")[0] }]);
    if (error) throw error;

    businessExpenseForm.reset();
    await loadBusinessExpenses();
    renderBusinessExpenses();
    renderFinances();
  } catch (err) {
    console.error("Failed to add business expense:", err);
    alert("Couldn't add expense — check your internet connection and try again." + "\n\nError: " + err.message);
  }
}

async function deleteBusinessExpenseEntry(id) {
  if (!confirm("Delete this expense?")) return;

  try {
    const { error } = await supabaseClient.from("business_expenses").delete().eq("id", id);
    if (error) throw error;

    await loadBusinessExpenses();
    renderBusinessExpenses();
    renderFinances();
  } catch (err) {
    console.error("Failed to delete business expense:", err);
    alert("Couldn't delete expense — check your internet connection and try again." + "\n\nError: " + err.message);
  }
}

function renderBusinessExpenses() {
  if (!businessExpenseList) return;

  businessExpenseList.innerHTML = "";
  businessExpenses.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "haul-mini-list-item";
    li.innerHTML = `
      <span>${escapeHtml(entry.description)}</span>
      <span class="haul-mini-list-item-amount expense">-${formatCurrency(entry.amount)}</span>
      <button class="row-action-btn danger delete-business-expense-btn" data-id="${entry.id}" title="Delete">
        <span class="material-symbols-rounded">delete</span>
      </button>
    `;
    businessExpenseList.appendChild(li);
  });
  businessExpenseList.querySelectorAll(".delete-business-expense-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteBusinessExpenseEntry(btn.dataset.id));
  });

  if (businessExpenseEmptyState) {
    businessExpenseEmptyState.style.display = businessExpenses.length === 0 ? "block" : "none";
  }
}

function renderFinances() {
  if (!financeTotalRevenue) return;

  const totals = getOverallFinanceTotals();
  financeTotalRevenue.textContent = formatCurrency(totals.totalRevenue);
  financeTotalExpenses.textContent = formatCurrency(totals.totalExpenses);
  financeNetProfit.textContent = formatCurrency(totals.netProfit);
  financeNetProfit.style.color = totals.netProfit >= 0 ? "var(--color-success)" : "var(--color-error)";

  financeHaulTableBody.innerHTML = "";

  if (hauls.length === 0) {
    financeHaulEmptyState.style.display = "block";
  } else {
    financeHaulEmptyState.style.display = "none";

    hauls.forEach((haul) => {
      const stats = computeHaulStats(haul.id);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="cell-primary">${escapeHtml(haul.name)}</td>
        <td data-label="Income">${formatCurrency(stats.totalIncome)}</td>
        <td data-label="Expenses">${formatCurrency(stats.expenses)}</td>
        <td data-label="Profit" style="color: ${stats.profit >= 0 ? "var(--color-success)" : "var(--color-error)"}; font-weight: var(--weight-medium);">${formatCurrency(stats.profit)}</td>
      `;
      financeHaulTableBody.appendChild(row);
    });
  }

  updateHaulProfitChart();
}

function initHaulProfitChart() {
  const ctx = document.getElementById("haulProfitChart");
  if (!ctx) return;

  const { labels, data, colors } = getHaulProfitChartData();

  haulProfitChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Profit",
          data,
          backgroundColor: colors,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          ticks: { callback: (value) => "€" + value },
        },
      },
    },
  });
}

function getHaulProfitChartData() {
  const labels = hauls.map((h) => h.name);
  const data = hauls.map((h) => computeHaulStats(h.id).profit);
  const colors = data.map((v) => (v >= 0 ? "#10b981" : "#ef4444"));
  return { labels, data, colors };
}

function updateHaulProfitChart() {
  if (!haulProfitChartInstance) return;
  const { labels, data, colors } = getHaulProfitChartData();
  haulProfitChartInstance.data.labels = labels;
  haulProfitChartInstance.data.datasets[0].data = data;
  haulProfitChartInstance.data.datasets[0].backgroundColor = colors;
  haulProfitChartInstance.update();
}

// ===================================
// PRODUCTS (catalog) + STOCK TAB
// ===================================
// Every piece of clothing lives in the `products` table. `destination` says
// whether it was bought for general stock ("stock") or for a specific
// customer ("customer"). The Stock tab shows destination === "stock" items
// that haven't sold yet. Sold products stay in the table (with sale_price +
// sold_date) so we can build "best selling product" stats later — we just
// filter them out of the visible lists instead of deleting them.

let products = [];
let editingStockId = null;

const stockTableBody = document.getElementById("stockTableBody");
const stockEmptyState = document.getElementById("stockEmptyState");
const stockItemCountValue = document.getElementById("stockItemCountValue");
const stockQuantityValue = document.getElementById("stockQuantityValue");
const stockValueValue = document.getElementById("stockValueValue");
const reservedStockTableBody = document.getElementById("reservedStockTableBody");
const reservedStockEmptyState = document.getElementById("reservedStockEmptyState");
const reservedStockCount = document.getElementById("reservedStockCount");

const addStockBtn = document.getElementById("addStockBtn");
const stockModalOverlay = document.getElementById("stockModalOverlay");
const stockModalTitle = document.getElementById("stockModalTitle");
const stockModalClose = document.getElementById("stockModalClose");
const stockCancelBtn = document.getElementById("stockCancelBtn");
const stockForm = document.getElementById("stockForm");
const stockIdInput = document.getElementById("stockId");
const stockItemInput = document.getElementById("stockItem");
const stockCategoryInput = document.getElementById("stockCategory");
const stockQuantityInput = document.getElementById("stockQuantity");
const stockPriceInput = document.getElementById("stockPrice");
const stockDestinationInput = document.getElementById("stockDestination");
const stockCustomerGroup = document.getElementById("stockCustomerGroup");
const stockCustomerInput = document.getElementById("stockCustomer");
const stockHaulInput = document.getElementById("stockHaul");
const stockNotesInput = document.getElementById("stockNotes");
const existingProductCategoriesDatalist = document.getElementById("existingProductCategories");
const stockAlreadySoldInput = document.getElementById("stockAlreadySold");
const stockBackfillGroup = document.getElementById("stockBackfillGroup");
const stockSoldPriceBackfillInput = document.getElementById("stockSoldPriceBackfill");
const stockSoldDateBackfillInput = document.getElementById("stockSoldDateBackfill");
const stockLogIncomeGroup = document.getElementById("stockLogIncomeGroup");
const stockLogIncomeInput = document.getElementById("stockLogIncome");

const stockSoldModalOverlay = document.getElementById("stockSoldModalOverlay");
const stockSoldModalClose = document.getElementById("stockSoldModalClose");
const stockSoldCancelBtn = document.getElementById("stockSoldCancelBtn");
const stockSoldForm = document.getElementById("stockSoldForm");
const stockSoldIdInput = document.getElementById("stockSoldId");
const stockSoldItemName = document.getElementById("stockSoldItemName");
const stockSoldPriceInput = document.getElementById("stockSoldPrice");
const stockSoldCustomerInput = document.getElementById("stockSoldCustomer");
const stockSoldHaulNote = document.getElementById("stockSoldHaulNote");

let returnToHaulDetailIdForStock = null;

async function initStock() {
  if (!stockTableBody) return;

  await loadProducts();
  renderStock();
  renderCustomers();

  addStockBtn?.addEventListener("click", () => openStockModal(null, null, "stock"));
  stockModalClose?.addEventListener("click", () => {
    returnToHaulDetailIdForStock = null;
    closeStockModal();
  });
  stockCancelBtn?.addEventListener("click", () => {
    returnToHaulDetailIdForStock = null;
    closeStockModal();
  });
  stockModalOverlay?.addEventListener("click", (e) => {
    if (e.target === stockModalOverlay) {
      returnToHaulDetailIdForStock = null;
      closeStockModal();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && stockModalOverlay?.classList.contains("active")) {
      returnToHaulDetailIdForStock = null;
      closeStockModal();
    }
  });
  stockForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    saveStockFromForm();
  });
  stockDestinationInput?.addEventListener("change", updateStockCustomerGroupVisibility);
  stockAlreadySoldInput?.addEventListener("change", updateStockBackfillVisibility);
  stockHaulInput?.addEventListener("change", updateStockBackfillVisibility);

  stockSoldModalClose?.addEventListener("click", closeStockSoldModal);
  stockSoldCancelBtn?.addEventListener("click", closeStockSoldModal);
  stockSoldModalOverlay?.addEventListener("click", (e) => {
    if (e.target === stockSoldModalOverlay) closeStockSoldModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && stockSoldModalOverlay?.classList.contains("active")) closeStockSoldModal();
  });
  stockSoldForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    confirmStockSold();
  });
}

async function loadProducts() {
  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    products = (data || []).map((row) => ({
      id: row.id,
      item: row.name,
      category: row.category || "",
      quantity: Number(row.quantity),
      price: row.cost_price != null ? Number(row.cost_price) : null,
      salePrice: row.sale_price != null ? Number(row.sale_price) : null,
      notes: row.notes || "",
      haulId: row.haul_id || "",
      status: row.status || "available",
      destination: row.destination || "stock",
      customerId: row.customer_id || "",
      soldDate: row.sold_date || "",
    }));
  } catch (err) {
    console.error("Failed to load products:", err);
    products = [];
  }
}

function updateStockCustomerGroupVisibility() {
  if (!stockDestinationInput || !stockCustomerGroup) return;
  stockCustomerGroup.style.display = stockDestinationInput.value === "customer" ? "" : "none";
}

function updateStockBackfillVisibility() {
  if (!stockAlreadySoldInput || !stockBackfillGroup) return;
  const isBackfill = stockAlreadySoldInput.checked;
  stockBackfillGroup.style.display = isBackfill ? "" : "none";
  stockSoldPriceBackfillInput.required = isBackfill;
  if (stockLogIncomeGroup) {
    stockLogIncomeGroup.style.display = isBackfill && stockHaulInput.value ? "" : "none";
  }
}

function openStockModal(stockItem = null, presetHaulId = null, presetDestination = null) {
  editingStockId = stockItem ? stockItem.id : null;
  stockModalTitle.textContent = stockItem ? "Edit Product" : "Add Product";

  populateStockHaulDropdown(stockItem ? stockItem.haulId : presetHaulId || "");
  prefillStockCustomerName(stockItem ? stockItem.customerId : "");
  populateExistingProductCategoriesDatalist();

  stockIdInput.value = stockItem ? stockItem.id : "";
  stockItemInput.value = stockItem ? stockItem.item : "";
  stockCategoryInput.value = stockItem ? stockItem.category || "" : "";
  stockQuantityInput.value = stockItem ? stockItem.quantity : 1;
  stockPriceInput.value = stockItem && stockItem.price != null ? stockItem.price : "";
  stockDestinationInput.value = stockItem ? stockItem.destination || "stock" : presetDestination || "stock";
  stockNotesInput.value = stockItem ? stockItem.notes || "" : "";
  updateStockCustomerGroupVisibility();

  // Already-sold backfill fields: pre-check + prefill when editing a product
  // that's already sold, otherwise start unchecked so the fields stay hidden.
  const isAlreadySold = !!(stockItem && stockItem.status === "sold");
  stockAlreadySoldInput.checked = isAlreadySold;
  stockSoldPriceBackfillInput.value = isAlreadySold && stockItem.salePrice != null ? stockItem.salePrice : "";
  stockSoldDateBackfillInput.value = isAlreadySold && stockItem.soldDate ? stockItem.soldDate : "";
  // Default "also log income" off when editing an already-sold item (it's
  // presumably already logged) but on when this is a brand new sold entry.
  stockLogIncomeInput.checked = !isAlreadySold;
  updateStockBackfillVisibility();

  stockModalOverlay.classList.add("active");
  setTimeout(() => stockItemInput.focus(), 50);
}

// stockCustomerInput is a free-text field (with a datalist for autocomplete),
// not a real <select> — so "populating" it just means prefilling the linked
// person's name for editing. The typed name is resolved back to a real
// customer id on save, via resolveCustomerIdByName().
function prefillStockCustomerName(selectedId) {
  if (!stockCustomerInput) return;

  const linked = selectedId ? customers.find((c) => c.id === selectedId) : null;
  stockCustomerInput.value = linked ? linked.name : "";
}

function populateStockHaulDropdown(selectedId) {
  if (!stockHaulInput) return;

  stockHaulInput.innerHTML = '<option value="">— None —</option>';

  hauls.forEach((h) => {
    const opt = document.createElement("option");
    opt.value = h.id;
    opt.textContent = h.name;
    if (h.id === selectedId) opt.selected = true;
    stockHaulInput.appendChild(opt);
  });
}

function populateExistingProductCategoriesDatalist() {
  if (!existingProductCategoriesDatalist) return;

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
  existingProductCategoriesDatalist.innerHTML = categories.map((c) => `<option value="${escapeHtml(c)}"></option>`).join("");
}

function closeStockModal() {
  stockModalOverlay.classList.remove("active");
  stockForm.reset();
  editingStockId = null;
  if (stockBackfillGroup) stockBackfillGroup.style.display = "none";
}

async function saveStockFromForm() {
  const name = stockItemInput.value.trim();
  const category = stockCategoryInput.value.trim() || null;
  const quantity = parseFloat(stockQuantityInput.value) || 0;
  const cost_price = stockPriceInput.value !== "" ? parseFloat(stockPriceInput.value) : null;
  const destination = stockDestinationInput.value || "stock";
  const customerName = destination === "customer" ? stockCustomerInput.value.trim() : "";
  const haul_id = stockHaulInput.value || null;
  const notes = stockNotesInput.value.trim();

  const isBackfillSold = stockAlreadySoldInput.checked;
  const status = isBackfillSold ? "sold" : destination === "customer" ? "reserved" : "available";
  const sale_price = isBackfillSold ? parseFloat(stockSoldPriceBackfillInput.value) || 0 : null;
  const sold_date = isBackfillSold ? stockSoldDateBackfillInput.value || new Date().toISOString().split("T")[0] : null;

  if (!name) return;
  if (isBackfillSold && !stockSoldPriceBackfillInput.value) {
    alert("Enter the price it sold for.");
    return;
  }

  const saveBtn = document.getElementById("stockSaveBtn");
  if (saveBtn) saveBtn.disabled = true;

  try {
    const customer_id = customerName ? await resolveCustomerIdByName(customerName) : null;
    const payload = { name, category, quantity, cost_price, status, destination, customer_id, haul_id, notes, sale_price, sold_date };

    if (editingStockId) {
      const { error } = await supabaseClient.from("products").update(payload).eq("id", editingStockId);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient.from("products").insert([payload]);
      if (error) throw error;
    }

    // Optionally log this backfilled sale as haul income too, same as the
    // normal "Mark as Sold" flow does, so Finances/profit-per-haul catch up.
    const linkedCustomer = customer_id ? customers.find((c) => c.id === customer_id) : null;
    if (isBackfillSold && haul_id && stockLogIncomeInput.checked) {
      const { error: incomeError } = await supabaseClient.from("haul_income").insert([
        {
          haul_id,
          description: linkedCustomer ? `Sold: ${name} (to ${linkedCustomer.name})` : `Sold: ${name}`,
          amount: sale_price,
          date: sold_date,
        },
      ]);
      if (incomeError) throw incomeError;
      await loadHaulIncome();
    }

    // Same sync as the normal "Mark as Sold" flow: a paid Customer Order
    // matching this sale, so Total Revenue picks it up without a separate
    // manual entry.
    if (isBackfillSold && customer_id && stockLogIncomeInput.checked) {
      const { error: orderError } = await supabaseClient.from("customer_orders").insert([
        {
          name: linkedCustomer ? linkedCustomer.name : customerName,
          order: `${name}${quantity > 1 ? ` (x${quantity})` : ""}`,
          amount: sale_price,
          status: "paid",
          date: sold_date,
          notes: "",
          haul_id: haul_id || null,
          customer_id,
        },
      ]);
      if (orderError) throw orderError;
      await loadCustomerOrders();
    }

    await loadProducts();
    renderStock();
    renderHaulDetail();
    renderHauls();
    renderCustomers();
    closeStockModal();

    if (returnToHaulDetailIdForStock) {
      const haulId = returnToHaulDetailIdForStock;
      returnToHaulDetailIdForStock = null;
      openHaulDetailModal(haulId);
    }
  } catch (err) {
    console.error("Failed to save product:", err);
    alert("Couldn't save product — check your internet connection and try again." + "\n\nError: " + err.message);
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

function openStockSoldModal(id) {
  const item = products.find((s) => s.id === id);
  if (!item) return;

  stockSoldIdInput.value = item.id;
  stockSoldItemName.textContent = `${item.item}${item.quantity > 1 ? ` (x${item.quantity})` : ""}`;
  stockSoldPriceInput.value = item.price != null ? item.price : "";

  prefillStockSoldCustomerName(item.customerId);

  const linkedHaul = item.haulId ? hauls.find((h) => h.id === item.haulId) : null;
  stockSoldHaulNote.textContent = linkedHaul
    ? `This sale will be added as income to "${linkedHaul.name}".`
    : "This item isn't linked to a haul, so this sale won't be tracked in Finances. Link it to a haul first if you want it counted.";

  stockSoldModalOverlay.classList.add("active");
  setTimeout(() => stockSoldPriceInput.focus(), 50);
}

// Same free-text-field caveat as prefillStockCustomerName().
function prefillStockSoldCustomerName(selectedId) {
  if (!stockSoldCustomerInput) return;

  const linked = selectedId ? customers.find((c) => c.id === selectedId) : null;
  stockSoldCustomerInput.value = linked ? linked.name : "";
}

function closeStockSoldModal() {
  stockSoldModalOverlay.classList.remove("active");
  stockSoldForm.reset();
}

async function confirmStockSold() {
  const id = stockSoldIdInput.value;
  const soldPrice = parseFloat(stockSoldPriceInput.value) || 0;
  const customerName = stockSoldCustomerInput.value.trim();
  const item = products.find((s) => s.id === id);
  if (!id || !item) return;

  const saveBtn = document.getElementById("stockSoldSaveBtn");
  if (saveBtn) saveBtn.disabled = true;

  try {
    const customer_id = customerName ? await resolveCustomerIdByName(customerName) : null;
    const soldDate = new Date().toISOString().split("T")[0];
    const linkedCustomer = customer_id ? customers.find((c) => c.id === customer_id) : null;

    if (item.haulId) {
      const { error: incomeError } = await supabaseClient.from("haul_income").insert([
        {
          haul_id: item.haulId,
          description: linkedCustomer ? `Sold: ${item.item} (to ${linkedCustomer.name})` : `Sold: ${item.item}`,
          amount: soldPrice,
          date: soldDate,
        },
      ]);
      if (incomeError) throw incomeError;
      await loadHaulIncome();
    }

    // Also log a matching *paid* Customer Order so the Customers tab's Total
    // Revenue (and Finances) stay in sync with what Stock just marked sold,
    // instead of requiring a separate manual order entry that's easy to
    // forget (or leave stuck on "pending") — see [[project_dashboard_customer_schema_migration]].
    if (customer_id) {
      const { error: orderError } = await supabaseClient.from("customer_orders").insert([
        {
          name: linkedCustomer ? linkedCustomer.name : customerName,
          order: `${item.item}${item.quantity > 1 ? ` (x${item.quantity})` : ""}`,
          amount: soldPrice,
          status: "paid",
          date: soldDate,
          notes: "",
          haul_id: item.haulId || null,
          customer_id,
        },
      ]);
      if (orderError) throw orderError;
      await loadCustomerOrders();
    }

    // We keep the product row (status -> sold) instead of deleting it, so it
    // stays in the catalog for future best-seller / revenue stats. Linking a
    // customer here (even for a stock-destined item) lets "top customers"
    // stats pick it up too.
    const { error } = await supabaseClient
      .from("products")
      .update({ status: "sold", sale_price: soldPrice, sold_date: soldDate, customer_id })
      .eq("id", id);
    if (error) throw error;

    await loadProducts();
    renderStock();
    renderHaulDetail();
    renderHauls();
    renderCustomers();
    closeStockSoldModal();
  } catch (err) {
    console.error("Failed to mark item sold:", err);
    alert("Couldn't update stock — check your internet connection and try again." + "\n\nError: " + err.message);
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

function renderStock() {
  if (!stockTableBody) return;

  stockTableBody.innerHTML = "";

  // Stock tab only shows unsold, stock-destined products. Customer-destined
  // products live under their haul (and, once sold, in the product catalog).
  const visibleStock = products.filter((p) => p.destination === "stock" && p.status !== "sold");

  if (visibleStock.length === 0) {
    stockEmptyState.style.display = "block";
  } else {
    stockEmptyState.style.display = "none";

    visibleStock.forEach((s) => {
      const linkedHaul = s.haulId ? hauls.find((h) => h.id === s.haulId) : null;
      const isReserved = s.status === "reserved";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="cell-primary">
          <div class="project-title-cell">
            <div class="project-icon">
              <span class="material-symbols-rounded">inventory_2</span>
            </div>
            <div class="project-info">
              <div class="project-title-text">
                ${escapeHtml(s.item)}
                ${isReserved ? `<span class="status-badge reserved" style="margin-left: var(--space-xs); vertical-align: middle;">Reserved</span>` : ""}
              </div>
              ${s.notes ? `<div class="project-meta-text">${escapeHtml(s.notes)}</div>` : ""}
            </div>
          </div>
        </td>
        <td data-label="Category">${s.category ? escapeHtml(s.category) : "—"}</td>
        <td data-label="Quantity">${s.quantity}</td>
        <td data-label="Price">${s.price != null ? formatCurrency(s.price) : "—"}</td>
        <td data-label="Haul">${linkedHaul ? escapeHtml(linkedHaul.name) : "—"}</td>
        <td class="cell-actions">
          <div class="row-actions">
            <button class="row-action-btn toggle-reserved-btn" data-id="${s.id}" title="${isReserved ? "Mark as available" : "Mark as reserved"}">
              <span class="material-symbols-rounded">${isReserved ? "bookmark" : "bookmark_border"}</span>
            </button>
            <button class="row-action-btn edit-stock-btn" data-id="${s.id}" title="Edit">
              <span class="material-symbols-rounded">edit</span>
            </button>
            <button class="row-action-btn danger sold-stock-btn" data-id="${s.id}" title="Mark as sold">
              <span class="material-symbols-rounded">sell</span>
            </button>
          </div>
        </td>
      `;
      stockTableBody.appendChild(row);
    });

    stockTableBody.querySelectorAll(".edit-stock-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = products.find((s) => s.id === btn.dataset.id);
        if (item) openStockModal(item);
      });
    });

    stockTableBody.querySelectorAll(".toggle-reserved-btn").forEach((btn) => {
      btn.addEventListener("click", () => toggleStockReserved(btn.dataset.id));
    });

    stockTableBody.querySelectorAll(".sold-stock-btn").forEach((btn) => {
      btn.addEventListener("click", () => openStockSoldModal(btn.dataset.id));
    });
  }

  renderReservedStock();
  updateStockStats();
  renderProductsPage();
}

// Products bought "for a specific customer" (destination === "customer") skip
// the main Stock table above (they're not general inventory) and instead show
// here until they're marked sold, since they're still physical items on hand.
function renderReservedStock() {
  if (!reservedStockTableBody) return;

  reservedStockTableBody.innerHTML = "";

  const reservedItems = products.filter((p) => p.destination === "customer" && p.status !== "sold");

  reservedStockCount.textContent = reservedItems.length > 0 ? `(${reservedItems.length})` : "";

  if (reservedItems.length === 0) {
    reservedStockEmptyState.style.display = "block";
  } else {
    reservedStockEmptyState.style.display = "none";

    reservedItems.forEach((s) => {
      const linkedCustomer = s.customerId ? customers.find((c) => c.id === s.customerId) : null;
      const linkedHaul = s.haulId ? hauls.find((h) => h.id === s.haulId) : null;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="cell-primary">
          <div class="project-title-cell">
            <div class="project-icon">
              <span class="material-symbols-rounded">bookmark</span>
            </div>
            <div class="project-info">
              <div class="project-title-text">${escapeHtml(s.item)}</div>
              ${s.notes ? `<div class="project-meta-text">${escapeHtml(s.notes)}</div>` : ""}
            </div>
          </div>
        </td>
        <td data-label="Customer">${linkedCustomer ? escapeHtml(linkedCustomer.name) : "—"}</td>
        <td data-label="Haul">${linkedHaul ? escapeHtml(linkedHaul.name) : "—"}</td>
        <td data-label="Price">${s.price != null ? formatCurrency(s.price) : "—"}</td>
        <td class="cell-actions">
          <div class="row-actions">
            <button class="row-action-btn edit-stock-btn" data-id="${s.id}" title="Edit">
              <span class="material-symbols-rounded">edit</span>
            </button>
            <button class="row-action-btn danger sold-stock-btn" data-id="${s.id}" title="Mark as sold">
              <span class="material-symbols-rounded">sell</span>
            </button>
          </div>
        </td>
      `;
      reservedStockTableBody.appendChild(row);
    });

    reservedStockTableBody.querySelectorAll(".edit-stock-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = products.find((s) => s.id === btn.dataset.id);
        if (item) openStockModal(item);
      });
    });

    reservedStockTableBody.querySelectorAll(".sold-stock-btn").forEach((btn) => {
      btn.addEventListener("click", () => openStockSoldModal(btn.dataset.id));
    });
  }
}

async function toggleStockReserved(id) {
  const item = products.find((s) => s.id === id);
  if (!item || item.status === "sold") return;

  const newStatus = item.status === "reserved" ? "available" : "reserved";

  try {
    const { error } = await supabaseClient.from("products").update({ status: newStatus }).eq("id", id);
    if (error) throw error;

    await loadProducts();
    renderStock();
    renderHaulDetail();
  } catch (err) {
    console.error("Failed to update reservation status:", err);
    alert("Couldn't update item — check your internet connection and try again." + "\n\nError: " + err.message);
  }
}

function updateStockStats() {
  if (!stockItemCountValue) return;

  const visibleStock = products.filter((p) => p.destination === "stock" && p.status !== "sold");
  const totalItems = visibleStock.length;
  const totalQuantity = visibleStock.reduce((sum, s) => sum + Number(s.quantity), 0);
  const totalValue = getAvailableStockValue();

  stockItemCountValue.textContent = totalItems;
  stockQuantityValue.textContent = totalQuantity;
  stockValueValue.textContent = formatCurrency(totalValue);

  updateOverviewStats();
}

// ===================================
// BULK BACKFILL SOLD ITEMS
// ===================================
// Quick way to catalog several items that already sold in a past haul,
// instead of opening the single-item "Add Product" modal over and over.
// Every row gets inserted as a sold product (status "sold") with today's
// date, and — same as the normal sold flow — can optionally also be logged
// as haul income so Finances catches up too.

let backfillRowCount = 0;
let currentBackfillHaulId = null;
let returnToHaulDetailIdForBackfill = null;

const backfillModalOverlay = document.getElementById("backfillModalOverlay");
const backfillModalClose = document.getElementById("backfillModalClose");
const backfillCancelBtn = document.getElementById("backfillCancelBtn");
const backfillForm = document.getElementById("backfillForm");
const backfillRowsContainer = document.getElementById("backfillRows");
const backfillAddRowBtn = document.getElementById("backfillAddRowBtn");
const backfillLogIncomeInput = document.getElementById("backfillLogIncome");
const backfillHaulNote = document.getElementById("backfillHaulNote");

function initBackfill() {
  if (!backfillModalOverlay) return;

  backfillModalClose?.addEventListener("click", () => {
    returnToHaulDetailIdForBackfill = null;
    closeBackfillModal();
  });
  backfillCancelBtn?.addEventListener("click", () => {
    returnToHaulDetailIdForBackfill = null;
    closeBackfillModal();
  });
  backfillModalOverlay?.addEventListener("click", (e) => {
    if (e.target === backfillModalOverlay) {
      returnToHaulDetailIdForBackfill = null;
      closeBackfillModal();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && backfillModalOverlay?.classList.contains("active")) {
      returnToHaulDetailIdForBackfill = null;
      closeBackfillModal();
    }
  });
  backfillAddRowBtn?.addEventListener("click", () => addBackfillRow());
  backfillForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    saveBackfillFromForm();
  });
}

function openBackfillModal(haulId) {
  currentBackfillHaulId = haulId || null;
  const haul = haulId ? hauls.find((h) => h.id === haulId) : null;

  backfillHaulNote.textContent = haul
    ? `Adding sold items to "${haul.name}". Each row becomes its own product in your catalog.`
    : "Not linked to a haul — these sales won't show up in Finances unless you add a haul later.";

  backfillRowsContainer.innerHTML = "";
  backfillRowCount = 0;
  addBackfillRow();
  addBackfillRow();
  populateExistingProductCategoriesDatalist();
  if (backfillLogIncomeInput) backfillLogIncomeInput.checked = true;

  backfillModalOverlay.classList.add("active");
}

function customerOptionsHtml(selectedId = "") {
  let html = `<option value="">— None / general sale —</option>`;
  customers.forEach((c) => {
    html += `<option value="${c.id}"${c.id === selectedId ? " selected" : ""}>${escapeHtml(c.name)}</option>`;
  });
  return html;
}

function addBackfillRow() {
  backfillRowCount += 1;
  const rowId = `backfill-row-${backfillRowCount}`;

  const row = document.createElement("div");
  row.className = "backfill-row";
  row.dataset.rowId = rowId;
  row.innerHTML = `
    <button type="button" class="row-action-btn backfill-row-remove" title="Remove this item">
      <span class="material-symbols-rounded">close</span>
    </button>
    <div class="form-group">
      <label class="form-label">Item name</label>
      <input type="text" class="form-input backfill-item" placeholder="e.g. Nike Hoodie (M)" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Category (optional)</label>
        <input type="text" class="form-input backfill-category" list="existingProductCategories" placeholder="e.g. Hoodie" />
      </div>
      <div class="form-group">
        <label class="form-label">Cost price (optional)</label>
        <input type="number" class="form-input backfill-cost" min="0" step="0.01" placeholder="0.00" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Sold for</label>
        <input type="number" class="form-input backfill-sold-price" min="0" step="0.01" placeholder="0.00" />
      </div>
      <div class="form-group">
        <label class="form-label">Sold to (optional)</label>
        <select class="form-input backfill-customer">${customerOptionsHtml()}</select>
      </div>
    </div>
  `;

  row.querySelector(".backfill-row-remove").addEventListener("click", () => {
    if (backfillRowsContainer.children.length > 1) row.remove();
  });

  backfillRowsContainer.appendChild(row);
}

function closeBackfillModal() {
  backfillModalOverlay.classList.remove("active");
  backfillRowsContainer.innerHTML = "";
  backfillRowCount = 0;
  currentBackfillHaulId = null;
}

async function saveBackfillFromForm() {
  const rows = [...backfillRowsContainer.querySelectorAll(".backfill-row")];
  const soldDate = new Date().toISOString().split("T")[0];

  const items = rows
    .map((row) => ({
      name: row.querySelector(".backfill-item").value.trim(),
      category: row.querySelector(".backfill-category").value.trim() || null,
      cost_price: row.querySelector(".backfill-cost").value !== "" ? parseFloat(row.querySelector(".backfill-cost").value) : null,
      sale_price: parseFloat(row.querySelector(".backfill-sold-price").value) || 0,
      customer_id: row.querySelector(".backfill-customer").value || null,
    }))
    .filter((item) => item.name);

  if (items.length === 0) {
    alert("Add at least one item name.");
    return;
  }
  const missingPrice = items.find((item) => !item.sale_price);
  if (missingPrice) {
    alert(`Enter a sold price for "${missingPrice.name}".`);
    return;
  }

  const saveBtn = document.getElementById("backfillSaveBtn");
  if (saveBtn) saveBtn.disabled = true;

  try {
    const payload = items.map((item) => ({
      name: item.name,
      category: item.category,
      quantity: 1,
      cost_price: item.cost_price,
      sale_price: item.sale_price,
      status: "sold",
      destination: item.customer_id ? "customer" : "stock",
      customer_id: item.customer_id,
      haul_id: currentBackfillHaulId,
      notes: "",
      sold_date: soldDate,
    }));

    const { error } = await supabaseClient.from("products").insert(payload);
    if (error) throw error;

    if (backfillLogIncomeInput.checked && currentBackfillHaulId) {
      const incomeRows = items.map((item) => {
        const linkedCustomer = item.customer_id ? customers.find((c) => c.id === item.customer_id) : null;
        return {
          haul_id: currentBackfillHaulId,
          description: linkedCustomer ? `Sold: ${item.name} (to ${linkedCustomer.name})` : `Sold: ${item.name}`,
          amount: item.sale_price,
          date: soldDate,
        };
      });
      const { error: incomeError } = await supabaseClient.from("haul_income").insert(incomeRows);
      if (incomeError) throw incomeError;
      await loadHaulIncome();
    }

    // Same sync as the normal "Mark as Sold" flow: a paid Customer Order per
    // item that has a customer, so Total Revenue picks these up too.
    const itemsWithCustomer = items.filter((item) => item.customer_id);
    if (backfillLogIncomeInput.checked && itemsWithCustomer.length > 0) {
      const orderRows = itemsWithCustomer.map((item) => {
        const linkedCustomer = customers.find((c) => c.id === item.customer_id);
        return {
          name: linkedCustomer ? linkedCustomer.name : "",
          order: item.name,
          amount: item.sale_price,
          status: "paid",
          date: soldDate,
          notes: "",
          haul_id: currentBackfillHaulId || null,
          customer_id: item.customer_id,
        };
      });
      const { error: orderError } = await supabaseClient.from("customer_orders").insert(orderRows);
      if (orderError) throw orderError;
      await loadCustomerOrders();
    }

    await loadProducts();
    renderStock();
    renderHaulDetail();
    renderHauls();
    renderCustomers();
    closeBackfillModal();

    if (returnToHaulDetailIdForBackfill) {
      const haulId = returnToHaulDetailIdForBackfill;
      returnToHaulDetailIdForBackfill = null;
      openHaulDetailModal(haulId);
    }
  } catch (err) {
    console.error("Failed to backfill sold items:", err);
    alert("Couldn't save these items — check your internet connection and try again." + "\n\nError: " + err.message);
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

// ===================================
// PRODUCTS STATS PAGE
// ===================================
// Reads straight from the `products` catalog loaded above — no separate
// table needed. "Sold" products keep their sale_price/sold_date forever so
// these stats stay accurate over time.

let topProductsChartInstance = null;
let categoryRevenueChartInstance = null;

const productsTotalCount = document.getElementById("productsTotalCount");
const productsSoldCount = document.getElementById("productsSoldCount");
const productsSellThrough = document.getElementById("productsSellThrough");
const productsAvailableCount = document.getElementById("productsAvailableCount");
const productsTotalRevenue = document.getElementById("productsTotalRevenue");
const productsAvgSale = document.getElementById("productsAvgSale");
const topCustomersTableBody = document.getElementById("topCustomersTableBody");
const topCustomersEmptyState = document.getElementById("topCustomersEmptyState");
const productsCatalogTableBody = document.getElementById("productsCatalogTableBody");
const productsCatalogEmptyState = document.getElementById("productsCatalogEmptyState");
const productsFilterSelect = document.getElementById("productsFilterSelect");

function initProductsPage() {
  if (!productsTotalCount) return;

  initTopProductsChart();
  initCategoryRevenueChart();
  renderProductsPage();

  productsFilterSelect?.addEventListener("change", renderProductsCatalogTable);
}

function renderProductsPage() {
  if (!productsTotalCount) return;

  const sold = products.filter((p) => p.status === "sold");
  const available = products.filter((p) => p.status !== "sold");
  const totalRevenue = sold.reduce((sum, p) => sum + (p.salePrice || 0), 0);
  const sellThroughPct = products.length > 0 ? Math.round((sold.length / products.length) * 100) : 0;

  productsTotalCount.textContent = products.length;
  productsSoldCount.textContent = sold.length;
  productsSellThrough.textContent = `${sellThroughPct}% sell-through`;
  productsAvailableCount.textContent = available.length;
  productsTotalRevenue.textContent = formatCurrency(totalRevenue);
  productsAvgSale.textContent = `Avg ${formatCurrency(sold.length > 0 ? totalRevenue / sold.length : 0)} / sale`;

  updateTopProductsChart();
  updateCategoryRevenueChart();
  renderTopCustomersTable();
  renderProductsCatalogTable();
}

function getTopProductsData(limit = 8) {
  const sold = products.filter((p) => p.status === "sold");
  const byName = {};
  sold.forEach((p) => {
    const key = p.item.trim();
    byName[key] = (byName[key] || 0) + (p.salePrice || 0);
  });
  const sorted = Object.entries(byName)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  return { labels: sorted.map((e) => e[0]), data: sorted.map((e) => e[1]) };
}

function initTopProductsChart() {
  const ctx = document.getElementById("topProductsChart");
  if (!ctx) return;
  const { labels, data } = getTopProductsData();

  topProductsChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Revenue", data, backgroundColor: "#a855f7", borderRadius: 6 }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { callback: (value) => "€" + value } } },
    },
  });
}

function updateTopProductsChart() {
  if (!topProductsChartInstance) return;
  const { labels, data } = getTopProductsData();
  topProductsChartInstance.data.labels = labels;
  topProductsChartInstance.data.datasets[0].data = data;
  topProductsChartInstance.update();
}

function getCategoryRevenueData() {
  const sold = products.filter((p) => p.status === "sold");
  const byCategory = {};
  sold.forEach((p) => {
    const key = p.category && p.category.trim() ? p.category.trim() : "Uncategorized";
    byCategory[key] = (byCategory[key] || 0) + (p.salePrice || 0);
  });
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const palette = ["#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];
  return {
    labels: sorted.map((e) => e[0]),
    data: sorted.map((e) => e[1]),
    colors: sorted.map((_, i) => palette[i % palette.length]),
  };
}

function initCategoryRevenueChart() {
  const ctx = document.getElementById("categoryRevenueChart");
  if (!ctx) return;
  const { labels, data, colors } = getCategoryRevenueData();

  categoryRevenueChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 0 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { padding: 20, usePointStyle: true } } },
    },
  });
}

function updateCategoryRevenueChart() {
  if (!categoryRevenueChartInstance) return;
  const { labels, data, colors } = getCategoryRevenueData();
  categoryRevenueChartInstance.data.labels = labels;
  categoryRevenueChartInstance.data.datasets[0].data = data;
  categoryRevenueChartInstance.data.datasets[0].backgroundColor = colors;
  categoryRevenueChartInstance.update();
}

function getTopCustomersData(limit = 10) {
  const sold = products.filter((p) => p.status === "sold" && p.customerId);
  const byCustomer = {};
  sold.forEach((p) => {
    if (!byCustomer[p.customerId]) byCustomer[p.customerId] = { items: 0, total: 0 };
    byCustomer[p.customerId].items += 1;
    byCustomer[p.customerId].total += p.salePrice || 0;
  });
  return Object.entries(byCustomer)
    .map(([customerId, stats]) => {
      const customer = customers.find((c) => c.id === customerId);
      return { name: customer ? customer.name : "Unknown customer", items: stats.items, total: stats.total };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

function renderTopCustomersTable() {
  if (!topCustomersTableBody) return;

  const topCustomers = getTopCustomersData();
  topCustomersTableBody.innerHTML = "";

  if (topCustomers.length === 0) {
    topCustomersEmptyState.style.display = "block";
  } else {
    topCustomersEmptyState.style.display = "none";
    topCustomers.forEach((c) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="cell-primary">${escapeHtml(c.name)}</td>
        <td data-label="Items Bought">${c.items}</td>
        <td data-label="Total Spent">${formatCurrency(c.total)}</td>
      `;
      topCustomersTableBody.appendChild(row);
    });
  }
}

function renderProductsCatalogTable() {
  if (!productsCatalogTableBody) return;

  const filter = productsFilterSelect ? productsFilterSelect.value : "all";
  const filtered = products.filter((p) => (filter === "all" ? true : p.status === filter));

  productsCatalogTableBody.innerHTML = "";

  if (filtered.length === 0) {
    productsCatalogEmptyState.style.display = "block";
  } else {
    productsCatalogEmptyState.style.display = "none";

    filtered
      .slice()
      .sort((a, b) => (b.soldDate || "").localeCompare(a.soldDate || ""))
      .forEach((p) => {
        const linkedCustomer = p.customerId ? customers.find((c) => c.id === p.customerId) : null;
        const forLabel = p.destination === "customer" ? (linkedCustomer ? escapeHtml(linkedCustomer.name) : "Customer") : "Stock";
        const statusBadgeClass = p.status === "sold" ? "sold" : p.status === "reserved" ? "reserved" : "";
        const statusLabel = p.status === "sold" ? "Sold" : p.status === "reserved" ? "Reserved" : "Available";

        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="cell-primary">${escapeHtml(p.item)}${p.quantity > 1 ? ` (x${p.quantity})` : ""}</td>
          <td data-label="Category">${p.category ? escapeHtml(p.category) : "—"}</td>
          <td data-label="For">${forLabel}</td>
          <td data-label="Status">${statusBadgeClass ? `<span class="status-badge ${statusBadgeClass}">${statusLabel}</span>` : statusLabel}</td>
          <td data-label="Cost">${p.price != null ? formatCurrency(p.price) : "—"}</td>
          <td data-label="Sold For">${p.status === "sold" && p.salePrice != null ? formatCurrency(p.salePrice) : "—"}</td>
        `;
        productsCatalogTableBody.appendChild(row);
      });
  }
}

// ===================================
// NOTES
// ===================================

let notes = [];
let editingNoteId = null;

const notesGrid = document.getElementById("notesGrid");
const notesEmptyState = document.getElementById("notesEmptyState");

const addNoteBtn = document.getElementById("addNoteBtn");
const noteModalOverlay = document.getElementById("noteModalOverlay");
const noteModalTitle = document.getElementById("noteModalTitle");
const noteModalClose = document.getElementById("noteModalClose");
const noteCancelBtn = document.getElementById("noteCancelBtn");
const noteForm = document.getElementById("noteForm");
const noteIdInput = document.getElementById("noteId");
const noteTitleInput = document.getElementById("noteTitle");
const noteContentInput = document.getElementById("noteContent");

async function initNotes() {
  if (!notesGrid) return;

  await loadNotes();
  renderNotes();

  addNoteBtn?.addEventListener("click", () => openNoteModal());
  noteModalClose?.addEventListener("click", closeNoteModal);
  noteCancelBtn?.addEventListener("click", closeNoteModal);
  noteModalOverlay?.addEventListener("click", (e) => {
    if (e.target === noteModalOverlay) closeNoteModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && noteModalOverlay?.classList.contains("active")) closeNoteModal();
  });
  noteForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    saveNoteFromForm();
  });
}

async function loadNotes() {
  try {
    const { data, error } = await supabaseClient.from("notes").select("*").order("updated_at", { ascending: false });
    if (error) throw error;

    notes = (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content || "",
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.error("Failed to load notes:", err);
    notes = [];
  }
}

function openNoteModal(note = null) {
  editingNoteId = note ? note.id : null;
  noteModalTitle.textContent = note ? "Edit Note" : "Add Note";

  noteIdInput.value = note ? note.id : "";
  noteTitleInput.value = note ? note.title : "";
  noteContentInput.value = note ? note.content || "" : "";

  noteModalOverlay.classList.add("active");
  setTimeout(() => noteTitleInput.focus(), 50);
}

function closeNoteModal() {
  noteModalOverlay.classList.remove("active");
  noteForm.reset();
  editingNoteId = null;
}

async function saveNoteFromForm() {
  const title = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();

  if (!title) return;

  const saveBtn = document.getElementById("noteSaveBtn");
  if (saveBtn) saveBtn.disabled = true;

  try {
    if (editingNoteId) {
      const { error } = await supabaseClient
        .from("notes")
        .update({ title, content, updated_at: new Date().toISOString() })
        .eq("id", editingNoteId);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient.from("notes").insert([{ title, content }]);
      if (error) throw error;
    }

    await loadNotes();
    renderNotes();
    closeNoteModal();
  } catch (err) {
    console.error("Failed to save note:", err);
    alert("Couldn't save note — check your internet connection and try again." + "\n\nError: " + err.message);
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

async function deleteNote(id) {
  if (!confirm("Delete this note? This can't be undone.")) return;

  try {
    const { error } = await supabaseClient.from("notes").delete().eq("id", id);
    if (error) throw error;

    await loadNotes();
    renderNotes();
  } catch (err) {
    console.error("Failed to delete note:", err);
    alert("Couldn't delete note — check your internet connection and try again." + "\n\nError: " + err.message);
  }
}

function renderNotes() {
  if (!notesGrid) return;

  notesGrid.innerHTML = "";

  if (notes.length === 0) {
    notesEmptyState.style.display = "block";
    return;
  }

  notesEmptyState.style.display = "none";

  notes.forEach((note) => {
    const card = document.createElement("div");
    card.className = "note-card";
    card.innerHTML = `
      <div class="note-card-header">
        <div class="note-card-title">${escapeHtml(note.title)}</div>
        <div class="note-card-actions">
          <button class="row-action-btn edit-note-btn" data-id="${note.id}" title="Edit">
            <span class="material-symbols-rounded">edit</span>
          </button>
          <button class="row-action-btn danger delete-note-btn" data-id="${note.id}" title="Delete">
            <span class="material-symbols-rounded">delete</span>
          </button>
        </div>
      </div>
      <div class="note-card-content">${escapeHtml(note.content)}</div>
      <div class="note-card-meta">${formatRelativeTime(note.updatedAt)}</div>
    `;
    notesGrid.appendChild(card);
  });

  notesGrid.querySelectorAll(".edit-note-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const note = notes.find((n) => n.id === btn.dataset.id);
      if (note) openNoteModal(note);
    });
  });

  notesGrid.querySelectorAll(".delete-note-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteNote(btn.dataset.id));
  });
}