// -------------------
// Config
// -------------------
const API_BASE = "https://produtos-jel-lacos.onrender.com";
let token = localStorage.getItem("jwt_token") || null;

// -------------------
// Form submit -> criar/editar via API
// -------------------
productForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!token) return alert("Faça login como administrador para salvar produtos.");

  const id = document.getElementById("productId").value;
  const title = document.getElementById("title").value.trim();
  const priceStr = document.getElementById("price").value
    .replace(/[R$\.\s]/g, "")
    .replace(",", ".");
  const price = parseFloat(priceStr);

  const category = document.getElementById("category").value;
  const desc = document.getElementById("desc").value;
  const imageFiles = document.getElementById("image").files;

  // converte imagens
  const imageUrls = [...selectedImages];
  for (let f of imageFiles) {
    const base64 = await toBase64(f);
    imageUrls.push(base64);
  }

  const payload = { title, price, category, desc, images: imageUrls };

  try {
    const url = id ? `${API_BASE}/api/produtos/${id}` : `${API_BASE}/api/produtos`;
    const method = id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ message: "Erro" }));
      throw new Error(errBody.message || "Falha ao salvar produto");
    }

    await loadProducts(); // recarrega lista
    productForm.reset();
    selectedImages = [];
    renderImagePreview();
    document.getElementById("productId").value = "";
    editingId = null;

  } catch (err) {
    alert(err.message || "Erro desconhecido");
  }
});

// -------------------
// Carregar produtos do servidor
// -------------------
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/produtos`);
    if (!res.ok) throw new Error("Falha ao carregar produtos");
    products = await res.json();
    renderProducts(products);
  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
    productsRoot.innerHTML = `<div class="empty">Erro ao carregar produtos.</div>`;
  }
}

// -------------------
// Remover produto (API)
 // -------------------
async function removeProduct(id) {
  if (!confirm("Deseja realmente remover este produto?")) return;
  try {
    const res = await fetch(`${API_BASE}/api/produtos/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const body = await res.json().catch(()=>({message:"Erro"}));
      throw new Error(body.message || "Falha ao remover");
    }
    await loadProducts();
  } catch (err) {
    alert(err.message || "Erro ao remover");
  }
}

// -------------------
// Login
// -------------------
loginSubmit.addEventListener("click", async () => {
  const username = loginUser.value.trim();
  const password = loginPass.value;
  if (!username || !password) {
    loginError.textContent = "Preencha usuário e senha";
    loginError.style.display = "block";
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const body = await res.json();
    if (!res.ok) {
      loginError.textContent = body.message || "Erro no login";
      loginError.style.display = "block";
      return;
    }
    token = body.token;
    localStorage.setItem("jwt_token", token);
    loginModal.style.display = "none";
    loginUser.value = "";
    loginPass.value = "";
    updateAuthUI();
    await loadProducts();
  } catch (err) {
    loginError.textContent = "Erro ao conectar";
    loginError.style.display = "block";
  }
});

// -------------------
// Logout
// -------------------
btnLogout.addEventListener("click", () => {
  token = null;
  localStorage.removeItem("jwt_token");
  updateAuthUI();
  loadProducts();
});

// -------------------
// Inicialização
// -------------------
loadProducts();
updateAuthUI();
