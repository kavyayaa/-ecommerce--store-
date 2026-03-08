const productDetails = document.getElementById("productDetails");
const productId = new URLSearchParams(window.location.search).get("id");

const render = (product) => {
  productDetails.innerHTML = `
    <div class="panel" data-testid="product-image-panel">
      <div class="product-image-wrap" style="aspect-ratio: 4/5;">
        <img class="product-image" src="${product.image}" alt="${product.name}" data-testid="product-details-image" />
      </div>
    </div>
    <section class="panel" data-testid="product-info-panel">
      <p class="muted" data-testid="product-details-category">${product.category}</p>
      <h1 style="font-size: clamp(2rem, 3vw, 2.8rem); margin: 8px 0;" data-testid="product-details-name">${product.name}</h1>
      <p class="price" style="font-size:1.2rem;" data-testid="product-details-price">${money(product.price)}</p>
      <p data-testid="product-details-description">${product.description}</p>
      <p class="muted" data-testid="product-details-stock">Stock: ${product.stock}</p>
      <button class="btn btn-accent" id="addBtn" data-testid="product-details-add-to-cart-button">Add to cart</button>
    </section>
  `;

  document.getElementById("addBtn").addEventListener("click", async () => {
    if (!state.token) {
      window.location.href = "/auth.html";
      return;
    }
    try {
      await api("/api/cart/add", {
        method: "POST",
        body: JSON.stringify({ productId: product._id, quantity: 1 })
      });
      document.getElementById("addBtn").textContent = "Added";
    } catch (error) {
      alert(error.message);
    }
  });
};

const init = async () => {
  ensureAuthNav();
  if (!productId) {
    productDetails.innerHTML = '<p data-testid="product-details-missing-id">Missing product id.</p>';
    return;
  }

  const data = await api(`/api/products/${productId}`);
  render(data.product);
};

init().catch((error) => {
  productDetails.innerHTML = `<p data-testid="product-details-error">${error.message}</p>`;
});
