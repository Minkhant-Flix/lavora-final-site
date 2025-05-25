// admin.js
const API_URL = "https://script.google.com/macros/s/AKfycbweaRGbyHhZkvgpSl80opRnLnG9GeF93Uy4BFTzOtHgHNEC_4DHDrJ7643pSy__A2YFWA/exec";

function loginAdmin() {
  const email = document.getElementById("adminEmail").value.trim();
  const pass = document.getElementById("adminPassword").value.trim();

  fetch(API_URL + `?action=verifyUser&email=${encodeURIComponent(email)}&password=${encodeURIComponent(pass)}`)
    .then(res => res.json())
    .then(resp => {
      if (resp.valid) {
        document.getElementById("loginSection").classList.add("hidden");
        document.getElementById("dashboardSection").classList.remove("hidden");
        loadProducts();
        setInterval(loadProducts, 15000);
        loadOrders();
      } else {
        alert("Invalid login credentials");
      }
    })
    .catch(() => alert("Login error. Please try again later."));
}

function logout() {
  document.getElementById("loginSection").classList.remove("hidden");
  document.getElementById("dashboardSection").classList.add("hidden");
}

function uploadProduct() {
  const data = {
    action: "uploadProduct",
    imgURL: document.getElementById("imgURL").value,
    title: document.getElementById("title").value,
    code: document.getElementById("itemCode").value,
    size: document.getElementById("size").value,
    price: document.getElementById("price").value,
    stock: document.getElementById("stock").value
  };

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  }).then(res => res.json()).then(resp => {
    alert("Product Uploaded");
    clearForm();
    loadProducts();
  });
}

function clearForm() {
  ["imgURL", "title", "itemCode", "size", "price", "stock"].forEach(id => document.getElementById(id).value = "");
}

function loadProducts() {
  fetch(API_URL + "?action=getProducts")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("productTable");
      container.innerHTML = data.map((item, i) => `
        <div class="d-flex align-items-center border p-2 mb-2">
          <img src="${item.imgURL}" class="me-3" width="80" height="80">
          <div class="flex-grow-1">
            <div><b>${item.title}</b></div>
            <div>Code: ${item.code}</div>
            <div>
              Size: <input value="${item.size}" onchange="updateProduct(${i}, 'size', this.value)">
              Price: <input value="${item.price}" onchange="updateProduct(${i}, 'price', this.value)">
              Stock: <input value="${item.stock}" onchange="updateProduct(${i}, 'stock', this.value)">
            </div>
          </div>
          <button class="btn btn-danger ms-3" onclick="deleteProduct(${i})">Delete</button>
        </div>
      `).join('');
    });
}

function updateProduct(index, field, value) {
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ action: "updateProduct", index, field, value })
  });
}

function deleteProduct(index) {
  if (confirm("Are you sure to delete this product?")) {
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "deleteProduct", index })
    }).then(() => loadProducts());
  }
}

// Order Management Functions
let allOrders = []; // Store all orders for search/filter functionality

function loadOrders() {
  fetch(API_URL + "?action=getOrders")
    .then(res => res.json())
    .then(data => {
      allOrders = data; // Store all orders
      renderOrders(data);
    });
}

function renderOrders(orders) {
  const container = document.getElementById("ordersTable");
  container.innerHTML = orders.map((order, i) => `
    <div class="d-flex justify-content-between align-items-center border p-2 mb-2 order-row" 
         data-order-id="${order.id}" 
         data-customer-name="${order.name.toLowerCase()}" 
         data-email="${order.email.toLowerCase()}" 
         data-status="${order.status.toLowerCase()}">
      <ul>
        <li>Order ID: <b>${order.id}</b></li>
        <li>Name: ${order.name}</li>
        <li>Email: ${order.email}</li>
        <li>Total: ${order.netTotal} Ks</li>
        <li>Status: <span class="order-status">${order.status}</span></li>
      </ul>
      <div>
        <button class="btn btn-sm btn-info" onclick='viewOrder(${JSON.stringify(order)})'>View</button>
        <button class="btn btn-sm btn-danger" onclick="deleteOrder(${i})">Delete</button>
      </div>
    </div>
  `).join('');
}

function searchOrders() {
  const searchTerm = document.getElementById("orderSearchInput").value.toLowerCase();
  const statusFilter = document.getElementById("statusFilter").value.toLowerCase();
  
  const filteredOrders = allOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm) || 
                        order.name.toLowerCase().includes(searchTerm) || 
                        order.email.toLowerCase().includes(searchTerm) || 
                        order.status.toLowerCase().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  renderOrders(filteredOrders);
}

function filterOrdersByStatus() {
  searchOrders(); // Reuse the search function which includes status filtering
}

function clearOrderSearch() {
  document.getElementById("orderSearchInput").value = '';
  document.getElementById("statusFilter").value = 'all';
  renderOrders(allOrders); // Show all orders
}

function updateOrderStatus(index, newStatus) {
  const order = allOrders[index];
  if (order.status === newStatus) return;
  
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ 
      action: "updateOrderStatus", 
      orderId: order.id, 
      newStatus 
    })
  }).then(res => res.json())
    .then(response => {
      if (response.success) {
        order.status = newStatus;
        allOrders[index] = order;
        renderOrders(allOrders);
      } else {
        alert("Failed to update order status");
      }
    });
}

function viewOrder(order) {
  document.getElementById("orderDetailsBody").innerHTML = `
    <p>Order ID: ${order.id}</p>
    <p>Name: ${order.name}</p>
    <p>Phone: ${order.phone}</p>
    <p>Email: ${order.email}</p>
    <p>Item Code: ${order.code}</p>
    <p>Total: ${order.total} Ks</p>
    <p>Discount: ${order.discount} Ks</p>
    <p>Net Total: ${order.netTotal} Ks</p>
    <p>Order Status: ${order.status}</p>
  `;
  new bootstrap.Modal(document.getElementById("orderDetailsModal")).show();
}

function deleteOrder(index) {
  if (confirm("Are you sure to delete this order?")) {
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "deleteOrder", index })
    }).then(() => loadOrders());
  }
}

// Initialize orders loading
loadOrders();
setInterval(loadOrders, 15000);