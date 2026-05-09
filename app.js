const STAFF = {
  nethum: { id: "nethum", name: "Nethum", role: "Staff", pin: "1111" },
  sanka: { id: "sanka", name: "Sanka", role: "Staff", pin: "2222" },
  hasindu: { id: "hasindu", name: "Hasindu", role: "Staff", pin: "3333" }
};

const DEFAULT_PRODUCTS = [
  { id: cryptoId(), name: "Chai Tea", price: 140, category: "tea", icon: "🍵" },
  { id: cryptoId(), name: "Cinnamon Tea", price: 100, category: "tea", icon: "🌿" },
  { id: cryptoId(), name: "Ginger Tea", price: 80, category: "tea", icon: "🫚" },
  { id: cryptoId(), name: "Lemon Tea", price: 80, category: "tea", icon: "🍋" },
  { id: cryptoId(), name: "Black Tea", price: 60, category: "tea", icon: "☕" },

  { id: cryptoId(), name: "Hot Chocolate", price: 180, category: "coffee", icon: "🍫" },
  { id: cryptoId(), name: "Milk Coffee", price: 120, category: "coffee", icon: "☕" },
  { id: cryptoId(), name: "Regular Coffee", price: 70, category: "coffee", icon: "☕" },
  { id: cryptoId(), name: "Regular Milk Tea", price: 100, category: "coffee", icon: "🥛" },
  { id: cryptoId(), name: "Nestomalt", price: 100, category: "coffee", icon: "🥤" },

  { id: cryptoId(), name: "Pattis", price: 80, category: "snacks", icon: "🥐" },
  { id: cryptoId(), name: "Cookies", price: 20, category: "snacks", icon: "🍪" },

  { id: cryptoId(), name: "Fish Roll", price: 120, category: "food", icon: "🌯" },
  { id: cryptoId(), name: "Chicken Roll", price: 130, category: "food", icon: "🌯" },
  { id: cryptoId(), name: "Egg Sandwich Small", price: 120, category: "food", icon: "🥪" },
  { id: cryptoId(), name: "Egg Sandwich Medium", price: 220, category: "food", icon: "🥪" },
  { id: cryptoId(), name: "Sausage Sandwich Small", price: 150, category: "food", icon: "🌭" },
  { id: cryptoId(), name: "Sausage Sandwich Medium", price: 250, category: "food", icon: "🌭" }
];

let selectedStaffId = null;
let activeCategory = "all";
let activeOrderFilter = "all";
let cart = [];

let products = load("serendip_products", DEFAULT_PRODUCTS);
let orders = load("serendip_orders", []);
let expenses = load("serendip_expenses", []);
let recipes = load("serendip_recipes", []);
let attendance = load("serendip_attendance", []);
let productCategories = load("serendip_product_categories", ["tea", "coffee", "food", "snacks"]);
let expenseCategories = load("serendip_expense_categories", ["Ingredients", "Rent", "Salary", "Utilities", "Transport", "Other"]);
let recipeCategories = load("serendip_recipe_categories", ["Tea", "Coffee", "Food", "Snacks"]);
let sheetsUrl = load("serendip_sheets_url", "");

function cryptoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function money(value) {
  return "Rs. " + Number(value || 0).toLocaleString();
}

function todayString() {
  return new Date().toLocaleDateString();
}

function timeString() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getCurrentStaff() {
  return load("serendip_current_staff", null);
}

function setCurrentStaff(staff) {
  save("serendip_current_staff", staff);
}

function getShift() {
  return load("serendip_current_shift", null);
}

function setShift(shift) {
  save("serendip_current_shift", shift);
}

/* LOGIN */

function selectStaff(id) {
  selectedStaffId = id;
  document.getElementById("pinTitle").innerText = `Enter PIN for ${STAFF[id].name}`;
  document.getElementById("pinInput").value = "";
  document.getElementById("pinError").innerText = "";
  document.getElementById("pinModal").classList.remove("hidden");
  setTimeout(() => document.getElementById("pinInput").focus(), 100);
}

function closePin() {
  document.getElementById("pinModal").classList.add("hidden");
}

function verifyPin() {
  const pin = document.getElementById("pinInput").value.trim();
  const staff = STAFF[selectedStaffId];

  if (!staff || pin !== staff.pin) {
    document.getElementById("pinError").innerText = "Wrong PIN. Try again.";
    return;
  }

  setCurrentStaff(staff);
  document.getElementById("pinModal").classList.add("hidden");
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  renderAll();
}

function logout() {
  localStorage.removeItem("serendip_current_staff");
  location.reload();
}

/* SHIFT */

function toggleShift() {
  const staff = getCurrentStaff();
  if (!staff) return;

  const shift = getShift();

  if (!shift || !shift.active) {
    const newShift = {
      id: cryptoId(),
      staffId: staff.id,
      staffName: staff.name,
      start: new Date().toISOString(),
      startDisplay: timeString(),
      date: todayString(),
      active: true
    };

    setShift(newShift);

    attendance.unshift({
      id: cryptoId(),
      staffName: staff.name,
      action: "Shift Started",
      date: todayString(),
      time: timeString()
    });

    save("serendip_attendance", attendance);
  } else {
    shift.active = false;
    shift.end = new Date().toISOString();
    shift.endDisplay = timeString();

    setShift(shift);

    attendance.unshift({
      id: cryptoId(),
      staffName: staff.name,
      action: "Shift Ended",
      date: todayString(),
      time: timeString()
    });

    save("serendip_attendance", attendance);
  }

  renderHome();
}

/* TABS */

function showTab(tabName, navBtn = null) {
  document.querySelectorAll(".tab-page").forEach(page => {
    page.classList.remove("active");
  });

  const page = document.getElementById(tabName + "Tab");
  if (page) page.classList.add("active");

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.remove("active");
  });

  if (navBtn) {
    navBtn.classList.add("active");
  } else {
    const navItems = document.querySelectorAll(".nav-item");
    const map = ["home", "invoice", "orders", "revenue", "expenses", "more"];
    const index = map.indexOf(tabName);
    if (index >= 0 && navItems[index]) navItems[index].classList.add("active");
  }

  if (tabName === "invoice") renderProducts();
  if (tabName === "orders") renderOrders();
  if (tabName === "revenue") renderRevenue();
  if (tabName === "expenses") renderExpenses();
  if (tabName === "home") renderHome();

  closeDrawer();
}

/* HOME */

function getCompletedOrders() {
  return orders.filter(order => order.status === "completed");
}

function getTodayOrders() {
  return getCompletedOrders().filter(order => order.date === todayString());
}

function getTotalRevenue(orderList = getCompletedOrders()) {
  return orderList.reduce((sum, order) => sum + order.total, 0);
}

function getTotalExpenses() {
  return expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
}

function renderHome() {
  const staff = getCurrentStaff();
  const shift = getShift();

  const hour = new Date().getHours();
  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";

  document.getElementById("greetingText").innerText = greeting;

  if (staff) {
    document.getElementById("currentStaffName").innerText = staff.name;
    document.getElementById("drawerStaff").innerText = `${staff.name} • ${staff.role}`;
  }

  const shiftBtn = document.getElementById("shiftBtn");

  if (shift && shift.active) {
    document.getElementById("shiftStatusText").innerText = `Active since ${shift.startDisplay}`;
    shiftBtn.innerText = "End Shift";
    shiftBtn.classList.remove("ended");
  } else {
    document.getElementById("shiftStatusText").innerText = "Shift not started";
    shiftBtn.innerText = "Start Shift";
    shiftBtn.classList.add("ended");
  }

  const todayOrders = getTodayOrders();
  const todaySales = getTotalRevenue(todayOrders);
  const totalExpense = getTotalExpenses();
  const avg = todayOrders.length ? Math.round(todaySales / todayOrders.length) : 0;

  document.getElementById("homeTodaySales").innerText = money(todaySales);
  document.getElementById("homeOrders").innerText = todayOrders.length;
  document.getElementById("homeAvg").innerText = money(avg);
  document.getElementById("homeNet").innerText = money(todaySales - totalExpense);
}

/* PRODUCTS / INVOICE */

function setCategory(category, btn) {
  activeCategory = category;

  document.querySelectorAll("#invoiceTab .chip").forEach(chip => chip.classList.remove("active"));
  btn.classList.add("active");

  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById("productGrid");
  const search = document.getElementById("productSearch")?.value.toLowerCase() || "";

  let list = [...products];

  if (activeCategory !== "all") {
    list = list.filter(product => product.category === activeCategory);
  }

  if (search) {
    list = list.filter(product => product.name.toLowerCase().includes(search));
  }

  if (!list.length) {
    grid.innerHTML = `<p class="empty-text">No products found</p>`;
    return;
  }

  grid.innerHTML = list.map(product => `
    <div class="product-card">
      <div>
        <div class="product-icon">${product.icon || "☕"}</div>
        <h3>${product.name}</h3>
        <p>${money(product.price)}</p>
      </div>
      <button class="plus-btn" onclick="addToCart('${product.id}')">+ Add</button>
    </div>
  `).join("");
}

function addToCart(productId) {
  const product = products.find(item => item.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      icon: product.icon || "☕",
      qty: 1
    });
  }

  renderCart();
}

function increaseQty(productId) {
  const item = cart.find(i => i.id === productId);
  if (item) item.qty += 1;
  renderCart();
}

function decreaseQty(productId) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.qty -= 1;

  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== productId);
  }

  renderCart();
}

function removeCartItem(productId) {
  cart = cart.filter(item => item.id !== productId);
  renderCart();
}

function clearCart() {
  cart = [];
  renderCart();
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function renderCart() {
  const list = document.getElementById("cartList");
  const total = getCartTotal();

  document.getElementById("cartCount").innerText = `${cart.reduce((s, i) => s + i.qty, 0)} items`;
  document.getElementById("cartTotal").innerText = money(total);

  if (!cart.length) {
    list.innerHTML = `<p class="empty-text">No items added yet</p>`;
    return;
  }

  list.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div>
        <strong>${item.icon} ${item.name}</strong>
        <small>${money(item.price)} × ${item.qty} = ${money(item.price * item.qty)}</small>
      </div>

      <div class="qty">
        <button onclick="decreaseQty('${item.id}')">−</button>
        <span>${item.qty}</span>
        <button onclick="increaseQty('${item.id}')">+</button>
      </div>
    </div>
  `).join("");
}

function completeOrder() {
  const staff = getCurrentStaff();

  if (!staff) {
    alert("Please login first");
    return;
  }

  if (!cart.length) {
    alert("Invoice is empty");
    return;
  }

  const order = {
    id: "ORD-" + String(orders.length + 1).padStart(4, "0"),
    uid: cryptoId(),
    staffName: staff.name,
    items: [...cart],
    total: getCartTotal(),
    status: "completed",
    date: todayString(),
    time: timeString(),
    createdAt: new Date().toISOString()
  };

  orders.unshift(order);
  save("serendip_orders", orders);

  cart = [];
  renderCart();
  renderOrders();
  renderRevenue();
  renderHome();

  alert("Order completed successfully");
  showTab("orders");
}

/* ORDERS */

function setOrderFilter(filter, btn) {
  activeOrderFilter = filter;

  document.querySelectorAll("#ordersTab .chip").forEach(chip => chip.classList.remove("active"));
  btn.classList.add("active");

  renderOrders();
}

function renderOrders() {
  const list = document.getElementById("ordersList");
  const search = document.getElementById("orderSearch")?.value.toLowerCase() || "";

  let orderList = [...orders];

  if (activeOrderFilter !== "all") {
    orderList = orderList.filter(order => order.status === activeOrderFilter);
  }

  if (search) {
    orderList = orderList.filter(order =>
      order.id.toLowerCase().includes(search) ||
      order.staffName.toLowerCase().includes(search)
    );
  }

  if (!orderList.length) {
    list.innerHTML = `<p class="empty-text">No orders found</p>`;
    return;
  }

  list.innerHTML = orderList.map(order => `
    <div class="order-card">
      <div class="order-top">
        <div>
          <span class="order-id">${order.id}</span>
          <strong>${money(order.total)}</strong>
          <small>${order.time} • ${order.staffName}</small>
        </div>
        <span class="status ${order.status}">${order.status}</span>
      </div>

      <div class="order-items">
        ${order.items.map(item => `
          <div class="item-line">
            <small>${item.icon} ${item.name} × ${item.qty}</small>
            <small>${money(item.price * item.qty)}</small>
          </div>
        `).join("")}
      </div>

      <div class="order-actions">
        <button onclick="changeOrderStatus('${order.uid}', 'ready')">Ready</button>
        <button class="complete" onclick="changeOrderStatus('${order.uid}', 'completed')">Complete</button>
        <button class="delete" onclick="deleteOrder('${order.uid}')">Delete</button>
      </div>
    </div>
  `).join("");
}

function changeOrderStatus(uid, status) {
  const order = orders.find(item => item.uid === uid);
  if (!order) return;

  order.status = status;
  save("serendip_orders", orders);

  renderOrders();
  renderRevenue();
  renderHome();
}

function deleteOrder(uid) {
  if (!confirm("Delete this order?")) return;

  orders = orders.filter(order => order.uid !== uid);
  save("serendip_orders", orders);

  renderOrders();
  renderRevenue();
  renderHome();
}

function clearCompletedOrders() {
  if (!confirm("Remove completed orders from orders list? Revenue history will also be affected.")) return;

  orders = orders.filter(order => order.status !== "completed");
  save("serendip_orders", orders);

  renderOrders();
  renderRevenue();
  renderHome();
}

/* REVENUE */

function renderRevenue() {
  const completed = getCompletedOrders();
  const revenue = getTotalRevenue(completed);
  const month = new Date().getMonth();
  const monthOrders = completed.filter(order => new Date(order.createdAt).getMonth() === month);
  const todayOrders = getTodayOrders();
  const avg = completed.length ? Math.round(revenue / completed.length) : 0;
  const expensesTotal = getTotalExpenses();

  document.getElementById("revenueTotal").innerText = money(revenue);
  document.getElementById("revenueSub").innerText = `${completed.length} completed orders`;
  document.getElementById("revToday").innerText = money(getTotalRevenue(todayOrders));
  document.getElementById("revMonth").innerText = money(getTotalRevenue(monthOrders));
  document.getElementById("revAvg").innerText = money(avg);
  document.getElementById("revNet").innerText = money(revenue - expensesTotal);

  renderTopItems();
  renderRecentSales();
}

function renderTopItems() {
  const box = document.getElementById("topItemsList");
  const count = {};

  getCompletedOrders().forEach(order => {
    order.items.forEach(item => {
      count[item.name] = (count[item.name] || 0) + item.qty;
    });
  });

  const top = Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (!top.length) {
    box.innerHTML = `<p class="empty-text">No sales yet</p>`;
    return;
  }

  box.innerHTML = top.map(([name, qty], index) => `
    <div class="simple-row">
      <strong>#${index + 1} ${name}</strong>
      <small>${qty} sold</small>
    </div>
  `).join("");
}

function renderRecentSales() {
  const box = document.getElementById("recentSalesList");
  const recent = getCompletedOrders().slice(0, 6);

  if (!recent.length) {
    box.innerHTML = `<p class="empty-text">No recent sales</p>`;
    return;
  }

  box.innerHTML = recent.map(order => `
    <div class="simple-row">
      <strong>${order.id} • ${money(order.total)}</strong>
      <small>${order.time} • ${order.staffName}</small>
    </div>
  `).join("");
}

function exportCSV() {
  const completed = getCompletedOrders();

  let csv = "Order ID,Date,Time,Staff,Items,Total\n";

  completed.forEach(order => {
    const itemText = order.items.map(i => `${i.name} x ${i.qty}`).join(" | ");
    csv += `${order.id},${order.date},${order.time},${order.staffName},"${itemText}",${order.total}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "serendip-revenue-report.csv";
  link.click();

  URL.revokeObjectURL(url);
}

/* EXPENSES */

function openExpenseForm() {
  document.getElementById("expenseForm").classList.toggle("hidden");
}

function saveExpense() {
  const name = document.getElementById("expenseName").value.trim();
  const amount = Number(document.getElementById("expenseAmount").value);
  const category = document.getElementById("expenseCategory").value;

  if (!name || !amount) {
    alert("Please enter expense name and amount");
    return;
  }

  expenses.unshift({
    id: cryptoId(),
    name,
    amount,
    category,
    date: todayString(),
    time: timeString()
  });

  save("serendip_expenses", expenses);

  document.getElementById("expenseName").value = "";
  document.getElementById("expenseAmount").value = "";
  document.getElementById("expenseForm").classList.add("hidden");

  renderExpenses();
  renderRevenue();
  renderHome();
}

function renderExpenses() {
  const total = getTotalExpenses();

  document.getElementById("expenseTotal").innerText = money(total);
  document.getElementById("expenseSub").innerText = `${expenses.length} expense records`;

  const box = document.getElementById("expenseList");

  if (!expenses.length) {
    box.innerHTML = `<p class="empty-text">No expenses yet</p>`;
    return;
  }

  box.innerHTML = expenses.map(expense => `
    <div class="expense-item">
      <strong>${expense.name} • ${money(expense.amount)}</strong>
      <small>${expense.category} • ${expense.date} • ${expense.time}</small>
      <div class="row-actions">
        <button class="delete" onclick="deleteExpense('${expense.id}')">Delete</button>
      </div>
    </div>
  `).join("");
}

function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;

  expenses = expenses.filter(expense => expense.id !== id);
  save("serendip_expenses", expenses);

  renderExpenses();
  renderRevenue();
  renderHome();
}

/* DRAWER */

function openDrawer() {
  document.getElementById("drawer").classList.remove("hidden");
}

function closeDrawer() {
  document.getElementById("drawer").classList.add("hidden");
}

/* MANAGEMENT PANELS */

function openPanel(type) {
  const modal = document.getElementById("panelModal");
  const title = document.getElementById("panelTitle");
  const content = document.getElementById("panelContent");

  modal.classList.remove("hidden");

  if (type === "products") {
    title.innerText = "Products";
    content.innerHTML = productsPanel();
  }

  if (type === "recipes") {
    title.innerText = "Recipes";
    content.innerHTML = recipesPanel();
  }

  if (type === "attendance") {
    title.innerText = "Attendance";
    content.innerHTML = attendancePanel();
  }

  if (type === "productCategories") {
    title.innerText = "Product Categories";
    content.innerHTML = categoryPanel("product");
  }

  if (type === "expenseCategories") {
    title.innerText = "Expense Categories";
    content.innerHTML = categoryPanel("expense");
  }

  if (type === "recipeCategories") {
    title.innerText = "Recipe Categories";
    content.innerHTML = categoryPanel("recipe");
  }

  if (type === "sheets") {
    title.innerText = "Google Sheets Sync";
    content.innerHTML = sheetsPanel();
  }
}

function closePanel() {
  document.getElementById("panelModal").classList.add("hidden");
}

function productsPanel() {
  return `
    <div class="panel-form">
      <input id="newProductName" placeholder="Product name" />
      <input id="newProductPrice" type="number" placeholder="Price" />
      <input id="newProductIcon" placeholder="Icon / emoji" />
      <select id="newProductCategory">
        ${productCategories.map(c => `<option value="${c}">${c}</option>`).join("")}
      </select>
      <button class="primary-btn full" onclick="addProductFromPanel()">Add Product</button>
    </div>

    ${products.map(product => `
      <div class="simple-row">
        <strong>${product.icon || "☕"} ${product.name}</strong>
        <small>${money(product.price)} • ${product.category}</small>
        <div class="row-actions">
          <button class="delete" onclick="deleteProduct('${product.id}')">Delete</button>
        </div>
      </div>
    `).join("")}
  `;
}

function addProductFromPanel() {
  const name = document.getElementById("newProductName").value.trim();
  const price = Number(document.getElementById("newProductPrice").value);
  const icon = document.getElementById("newProductIcon").value.trim() || "☕";
  const category = document.getElementById("newProductCategory").value;

  if (!name || !price) {
    alert("Please enter name and price");
    return;
  }

  products.push({
    id: cryptoId(),
    name,
    price,
    icon,
    category
  });

  save("serendip_products", products);
  openPanel("products");
  renderProducts();
}

function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;

  products = products.filter(product => product.id !== id);
  save("serendip_products", products);

  openPanel("products");
  renderProducts();
}

function recipesPanel() {
  return `
    <div class="panel-form">
      <input id="recipeName" placeholder="Recipe name" />
      <select id="recipeCategory">
        ${recipeCategories.map(c => `<option value="${c}">${c}</option>`).join("")}
      </select>
      <textarea id="recipeIngredients" placeholder="Ingredients"></textarea>
      <textarea id="recipeSteps" placeholder="Instructions"></textarea>
      <button class="primary-btn full" onclick="addRecipe()">Add Recipe</button>
    </div>

    ${recipes.length ? recipes.map(recipe => `
      <div class="simple-row">
        <strong>${recipe.name}</strong>
        <small>${recipe.category}</small>
        <p>${recipe.ingredients}</p>
        <small>${recipe.steps}</small>
        <div class="row-actions">
          <button class="delete" onclick="deleteRecipe('${recipe.id}')">Delete</button>
        </div>
      </div>
    `).join("") : `<p class="empty-text">No recipes yet</p>`}
  `;
}

function addRecipe() {
  const name = document.getElementById("recipeName").value.trim();
  const category = document.getElementById("recipeCategory").value;
  const ingredients = document.getElementById("recipeIngredients").value.trim();
  const steps = document.getElementById("recipeSteps").value.trim();

  if (!name) {
    alert("Recipe name required");
    return;
  }

  recipes.unshift({
    id: cryptoId(),
    name,
    category,
    ingredients,
    steps
  });

  save("serendip_recipes", recipes);
  openPanel("recipes");
}

function deleteRecipe(id) {
  recipes = recipes.filter(recipe => recipe.id !== id);
  save("serendip_recipes", recipes);
  openPanel("recipes");
}

function attendancePanel() {
  if (!attendance.length) {
    return `<p class="empty-text">No attendance records yet</p>`;
  }

  return attendance.map(record => `
    <div class="simple-row">
      <strong>${record.staffName}</strong>
      <small>${record.action} • ${record.date} • ${record.time}</small>
    </div>
  `).join("");
}

function categoryPanel(type) {
  const map = {
    product: {
      list: productCategories,
      key: "serendip_product_categories",
      input: "newProductCategoryName",
      addFn: "addCategory('product')",
      deleteFn: "deleteCategory"
    },
    expense: {
      list: expenseCategories,
      key: "serendip_expense_categories",
      input: "newExpenseCategoryName",
      addFn: "addCategory('expense')",
      deleteFn: "deleteCategory"
    },
    recipe: {
      list: recipeCategories,
      key: "serendip_recipe_categories",
      input: "newRecipeCategoryName",
      addFn: "addCategory('recipe')",
      deleteFn: "deleteCategory"
    }
  };

  const data = map[type];

  return `
    <div class="panel-form">
      <input id="${data.input}" placeholder="New category name" />
      <button class="primary-btn full" onclick="${data.addFn}">Add Category</button>
    </div>

    ${data.list.map(category => `
      <div class="simple-row">
        <strong>${category}</strong>
        <div class="row-actions">
          <button class="delete" onclick="deleteCategory('${type}', '${category}')">Delete</button>
        </div>
      </div>
    `).join("")}
  `;
}

function addCategory(type) {
  let inputId = "";
  let list = [];
  let key = "";

  if (type === "product") {
    inputId = "newProductCategoryName";
    list = productCategories;
    key = "serendip_product_categories";
  }

  if (type === "expense") {
    inputId = "newExpenseCategoryName";
    list = expenseCategories;
    key = "serendip_expense_categories";
  }

  if (type === "recipe") {
    inputId = "newRecipeCategoryName";
    list = recipeCategories;
    key = "serendip_recipe_categories";
  }

  const value = document.getElementById(inputId).value.trim();

  if (!value) return;

  if (!list.includes(value)) list.push(value);

  save(key, list);

  if (type === "product") productCategories = list;
  if (type === "expense") expenseCategories = list;
  if (type === "recipe") recipeCategories = list;

  openPanel(type + "Categories");
}

function deleteCategory(type, category) {
  if (!confirm("Delete this category?")) return;

  if (type === "product") {
    productCategories = productCategories.filter(c => c !== category);
    save("serendip_product_categories", productCategories);
    openPanel("productCategories");
  }

  if (type === "expense") {
    expenseCategories = expenseCategories.filter(c => c !== category);
    save("serendip_expense_categories", expenseCategories);
    openPanel("expenseCategories");
  }

  if (type === "recipe") {
    recipeCategories = recipeCategories.filter(c => c !== category);
    save("serendip_recipe_categories", recipeCategories);
    openPanel("recipeCategories");
  }
}

function sheetsPanel() {
  return `
    <div class="panel-form">
      <input id="sheetsUrlInput" placeholder="Apps Script URL" value="${sheetsUrl || ""}" />
      <button class="primary-btn full" onclick="saveSheetsUrl()">Save URL</button>
    </div>
    <p class="empty-text">
      Google Sheets sync placeholder is ready. App works without sync for testing.
    </p>
  `;
}

function saveSheetsUrl() {
  sheetsUrl = document.getElementById("sheetsUrlInput").value.trim();
  save("serendip_sheets_url", sheetsUrl);
  alert("Google Sheets URL saved");
  closePanel();
}

/* RESET */

function factoryReset() {
  if (!confirm("This will delete all POS data. Continue?")) return;

  localStorage.clear();
  location.reload();
}

/* INIT */

function renderAll() {
  renderHome();
  renderProducts();
  renderCart();
  renderOrders();
  renderRevenue();
  renderExpenses();
}

function init() {
  const staff = getCurrentStaff();

  if (staff) {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    renderAll();
  }
}

init();
