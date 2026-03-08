const adminProducts = document.getElementById("adminProducts");
const productForm = document.getElementById("productForm");
const adminStatus = document.getElementById("adminStatus");

const ensureAdmin = async () => {
  if (!state.token) {
    window.location.href = "/auth.html";
    return false;
  }
  const profile = await api("/api/auth/me");
  if (profile.user.role !== "admin") {
    adminStatus.textContent = "Admin access required.";
    productForm.classList.add("hidden");
    return false;
  }
  return true;
};

const renderProducts = (products) => {
  adminProducts.innerHTML = products
    .map(
      (product) => `
      <article class="list-item" data-testid="admin-product-item-${product._id}">
        <div>
          <h3 data-testid="admin-product-name-${product._id}">${product.name}</h3>
          <p class="price" data-testid="admin-product-price-${product._id}">${money(product.price)}</p>
        </div>
        <button class="btn" data-delete-id="${product._id}" data-testid="admin-delete-product-button-${product._id}">Delete</button>
      </article>
    `
    )
    .join("");

  adminProducts.querySelectorAll("button[data-delete-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await api(`/api/products/${button.dataset.deleteId}`, { method: "DELETE" });
        adminStatus.textContent = "Product deleted.";
        await loadProducts();
      } catch (error) {
        adminStatus.textContent = error.message;
      }
    });
  });
};

const loadProducts = async () => {
  const data = await api("/api/products");
  renderProducts(data.products);
};

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  adminStatus.textContent = "Adding product...";
  try {
    await api("/api/products", {
      method: "POST",
      body: JSON.stringify({
        name: document.getElementById("name").value,
        description: document.getElementById("description").value,
        price: Number(document.getElementById("price").value),
        image: document.getElementById("image").value,
        category: document.getElementById("category").value,
        stock: Number(document.getElementById("stock").value)
      })
    });

    adminStatus.textContent = "Product added.";
    productForm.reset();
    await loadProducts();
  } catch (error) {
    adminStatus.textContent = error.message;
  }
});

const init = async () => {
  ensureAuthNav();
  const allowed = await ensureAdmin();
  if (!allowed) return;
  await loadProducts();
};

init().catch((error) => {
  adminStatus.textContent = error.message;
});
