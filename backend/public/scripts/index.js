const productGrid = document.getElementById("productGrid");

const renderProducts = (products) => {
  productGrid.innerHTML = products
    .map(
      (product) => `
      <article class="product-card" data-testid="product-card-${product._id}">
        <a href="/product.html?id=${product._id}" data-testid="product-link-${product._id}">
          <div class="product-image-wrap">
            <img class="product-image" src="${product.image}" alt="${product.name}" data-testid="product-image-${product._id}" />
          </div>
        </a>
        <h3 data-testid="product-name-${product._id}">${product.name}</h3>
        <p class="muted" data-testid="product-category-${product._id}">${product.category}</p>
        <p class="price" data-testid="product-price-${product._id}">${money(product.price)}</p>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <a href="/product.html?id=${product._id}" class="btn" data-testid="view-product-button-${product._id}">View</a>
          <button class="btn btn-accent" data-product-id="${product._id}" data-testid="add-to-cart-button-${product._id}">Add to cart</button>
        </div>
      </article>
    `
    )
    .join("");

  productGrid.querySelectorAll("button[data-product-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.token) {
        window.location.href = "/auth.html";
        return;
      }
      try {
        await api("/api/cart/add", {
          method: "POST",
          body: JSON.stringify({ productId: button.dataset.productId, quantity: 1 })
        });
        button.textContent = "Added";
      } catch (error) {
        alert(error.message);
      }
    });
  });
};

const init = async () => {
  ensureAuthNav();
  const data = await api("/api/products");
  renderProducts(data.products);
};

init().catch((error) => {
  productGrid.innerHTML = `<p data-testid="product-load-error">${error.message}</p>`;
});
