const ordersContainer = document.getElementById("orders");

const loadOrders = async () => {
  try {

    const data = await api("/api/orders");

    if (!data.orders.length) {
      ordersContainer.innerHTML = "<p>No orders yet.</p>";
      return;
    }

    ordersContainer.innerHTML = data.orders.map(order => `

      <div class="order-card">

        <h3>Order ID: ${order._id}</h3>

        <p><strong>Status:</strong> ${order.status}</p>

        <div class="order-products">

          ${order.items.map(item => `

            <div class="product-row">

              <img src="${item.image}" class="product-img"/>

              <div class="product-info">
                <div class="product-name">${item.name}</div>
                <div class="product-qty">Qty: ${item.quantity}</div>
              </div>

              <div class="product-price">
                $${item.price}
              </div>

            </div>

          `).join("")}

        </div>

        <p class="order-total"><strong>Total: $${order.totalAmount}</strong></p>

      </div>

    `).join("");

  } catch (error) {
    ordersContainer.innerHTML = `<p>${error.message}</p>`;
  }
};

loadOrders();