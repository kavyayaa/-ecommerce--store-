const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");

if (!state.token) {
  window.location.href = "/auth.html";
}

const render = (items, totalAmount) => {
  cartTotal.textContent = money(totalAmount);

  if (!items.length) {
    cartItems.innerHTML = '<p data-testid="empty-cart-message">Your cart is empty.</p>';
    return;
  }

  cartItems.innerHTML = items
    .map(
      (item) => `
      <article class="list-item" data-testid="cart-item-${item.productId}">
        <div class="item-info">
          <img class="item-thumb" src="${item.image}" alt="${item.name}" data-testid="cart-item-image-${item.productId}" />
          <div>
            <h3 data-testid="cart-item-name-${item.productId}">${item.name}</h3>
            <p class="price" data-testid="cart-item-subtotal-${item.productId}">${money(item.subtotal)}</p>
          </div>
        </div>
        <div class="qty-controls">
          <button class="btn" data-action="decrease" data-id="${item.productId}" data-testid="cart-decrease-button-${item.productId}">-</button>
          <span data-testid="cart-item-quantity-${item.productId}">${item.quantity}</span>
          <button class="btn" data-action="increase" data-id="${item.productId}" data-testid="cart-increase-button-${item.productId}">+</button>
          <button class="btn" data-action="remove" data-id="${item.productId}" data-testid="cart-remove-button-${item.productId}">Remove</button>
        </div>
      </article>
    `
    )
    .join("");

  cartItems.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const productId = button.dataset.id;
      const action = button.dataset.action;
      const current = items.find((entry) => String(entry.productId) === String(productId));

      try {
        if (action === "remove") {
          await api("/api/cart/remove", { method: "POST", body: JSON.stringify({ productId }) });
        } else {
          const nextQty = action === "increase" ? current.quantity + 1 : Math.max(1, current.quantity - 1);
          await api("/api/cart/update", {
            method: "PUT",
            body: JSON.stringify({ productId, quantity: nextQty })
          });
        }

        await loadCart();
      } catch (error) {
        alert(error.message);
      }
    });
  });
};

const loadCart = async () => {
  ensureAuthNav();
  const data = await api("/api/cart");
  render(data.items, data.totalAmount);
};

document.getElementById("clearCartBtn").addEventListener("click", async () => {
  await api("/api/cart/clear", { method: "DELETE" });
  await loadCart();
});

document.getElementById("checkoutBtn").addEventListener("click", async () => {
  try {
    const data = await api("/api/checkout/session", {
      method: "POST",
      body: JSON.stringify({ originUrl: window.location.origin })
    });

    window.location.href = data.url;
  } catch (error) {
    alert(error.message);
  }
});

loadCart().catch((error) => {
  cartItems.innerHTML = `<p data-testid="cart-load-error">${error.message}</p>`;
});
