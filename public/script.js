// -------------------
// Seletores principais
// -------------------
const productForm = document.getElementById("productForm");
const productsRoot = document.getElementById("productsRoot");
const resetBtn = document.getElementById("resetBtn");
const searchInput = document.getElementById("search");
const filterCategory = document.getElementById("filterCategory");
const priceInput = document.getElementById("price");

const imageInput = document.getElementById("image");
const imagePreview = document.getElementById("imagePreview");

const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const userLabel = document.getElementById("userLabel");
const loginModal = document.getElementById("loginModal");
const loginSubmit = document.getElementById("loginSubmit");
const loginCancel = document.getElementById("loginCancel");
const loginUser = document.getElementById("loginUser");
const loginPass = document.getElementById("loginPass");
const loginError = document.getElementById("loginError");

// -------------------
// Config
// -------------------
const API_BASE = "https://produtos-jel-lacos.onrender.com";
let token = localStorage.getItem("jwt_token") || null;

// -------------------
// Estado local
// -------------------
let products = [];
let selectedImages = [];
let editingId = null;

// -------------------
// Atualiza UI de login
// -------------------
function updateAuthUI() {
  if (token) {
    userLabel.textContent = "Usuário: Administrador";
    btnLogin.style.display = "none";
    btnLogout.style.display = "inline-block";
  } else {
    userLabel.textContent = "Usuário: —";
    btnLogin.style.display = "inline-block";
    btnLogout.style.display = "none";
  }
}
updateAuthUI();

// -------------------
// Máscara de moeda R$
// -------------------
priceInput.addEventListener("input", () => {
  let value = priceInput.value.replace(/\D/g, "");
  if (!value) return priceInput.value = "";
  value = (Number(value) / 100).toFixed(2).replace(".", ",");
  value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  priceInput.value = `R$ ${value}`;
});

// -------------------
// Util: Base64
// -------------------
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}

// -------------------
// Formatação de moeda (exibição)
// -------------------
function formatarMoeda(valor) {
  if (valor == null || isNaN(valor)) return "R$ 0,00";
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// -------------------
// Renderizar produtos
// -------------------
function renderProducts(list = products) {
  productsRoot.innerHTML = "";
  if (!list.length) {
    productsRoot.innerHTML = `<div class="empty">Nenhum produto cadastrado ainda.</div>`;
    return;
  }

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    let imagesHtml = "";
    if (p.images && p.images.length > 0) {
      imagesHtml = `
        <div class="carousel" data-index="0">
          <button class="prev">&#10094;</button>
          <img src="${p.images[0]}" alt="${p.title}">
          <button class="next">&#10095;</button>
        </div>
      `;
    } else {
      imagesHtml = `<img src="https://via.placeholder.com/200x140?text=Produto" alt="sem imagem">`;
    }

    card.innerHTML = `
      ${imagesHtml}
      <h3>${p.title}</h3>
      <p>${p.desc || ""}</p>
      <span class="price">${formatarMoeda(p.price)}</span>
      <small>Categoria: ${p.category}</small>
      <div class="actions">
        <button class="edit">Editar</button>
        <button class="delete">Remover</button>
      </div>
    `;

    const editBtn = card.querySelector(".edit");
    const delBtn = card.querySelector(".delete");

    if (token) {
      editBtn.addEventListener("click", () => loadProductToForm(p));
      delBtn.addEventListener("click", () => removeProduct(p._id));
    } else {
      editBtn.disabled = true;
      delBtn.disabled = true;
      editBtn.title = delBtn.title = "Faça login para editar/remover";
    }

    // Carrossel
    if (p.images && p.images.length > 1) {
      const carousel = card.querySelector(".carousel");
      const img = carousel.querySelector("img");
      let current = 0;
      carousel.querySelector(".prev").addEventListener("click", () => {
        current = (current - 1 + p.images.length) % p.images.length;
        img.src = p.images[current];
      });
      carousel.querySelector(".next").addEventListener("click", () => {
        current = (current + 1) % p.images.length;
        img.src = p.images[current];
      });
    }

    productsRoot.appendChild(card);
  });
}

// -------------------
// Carregar produtos
// -------------------
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/produtos`);
    products = await res.json();
    renderProducts(products);
  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
    productsRoot.innerHTML = `<div class="empty">Erro ao carregar produtos.</div>`;
  }
}

// -------------------
// Criar / Editar produto
// -------------------
productForm.addEventListener("submit", async e => {
  e.preventDefault();
  if (!token) return alert("Faça login como administrador para salvar produtos.");

  const id = document.getElementById("productId").value;
  const title = document.getElementById("title").value.trim();
  const price = parseFloat(
    document.getElementById("price").value.replace(/[R$\.\s]/g, "").replace(",", ".")
  );
  const category = document.getElementById("category").value;
  const desc = document.getElementById("desc").value;
  const imageFiles = Array.from(imageInput.files);

  const imageUrls = [...selectedImages];
  for (let f of imageFiles) imageUrls.push(await toBase64(f));

  const payload = { title, price, category, desc, images: imageUrls };

  try {
    let url = `${API_BASE}/api/produtos`;
    let method = "POST";
    if (id) { url += `/${id}`; method = "PUT"; }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: "Erro" }));
      throw new Error(body.message || "Falha na operação");
    }

    productForm.reset();
    selectedImages = [];
    renderImagePreview();
    document.getElementById("productId").value = "";
    editingId = null;
    await loadProducts();
  } catch (err) {
    alert(err.message || "Erro desconhecido");
  }
});

// -------------------
// Resetar formulário
// -------------------
resetBtn.addEventListener("click", () => {
  productForm.reset();
  selectedImages = [];
  renderImagePreview();
  document.getElementById("productId").value = "";
  editingId = null;
});

// -------------------
// Remover produto
// -------------------
async function removeProduct(id) {
  if (!confirm("Deseja realmente remover este produto?")) return;
  try {
    const res = await fetch(`${API_BASE}/api/produtos/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: "Erro" }));
      throw new Error(body.message || "Falha ao remover");
    }
    await loadProducts();
  } catch (err) {
    alert(err.message || "Erro ao remover");
  }
}

// -------------------
// Carregar produto para edição
// -------------------
function loadProductToForm(p) {
  editingId = p._id;
  document.getElementById("productId").value = p._id;
  document.getElementById("title").value = p.title;
  document.getElementById("price").value = formatarMoeda(p.price);
  document.getElementById("category").value = p.category;
  document.getElementById("desc").value = p.desc || "";
  selectedImages = Array.isArray(p.images) ? [...p.images] : [];
  renderImagePreview();
}

// -------------------
// Preview de imagens
// -------------------
imageInput.addEventListener("change", async () => {
  const files = Array.from(imageInput.files);
  for (let f of files) selectedImages.push(await toBase64(f));
  renderImagePreview();
});

function renderImagePreview() {
  imagePreview.innerHTML = "";
  if (!selectedImages.length) {
    imagePreview.textContent = "Nenhuma imagem selecionada";
    return;
  }

  selectedImages.forEach((src, idx) => {
    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.display = "inline-block";
    container.style.margin = "5px";

    const img = document.createElement("img");
    img.src = src;
    img.alt = `img_${idx}`;
    img.style.width = "80px";
    img.style.height = "80px";
    img.style.objectFit = "cover";
    img.style.borderRadius = "6px";

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.style.position = "absolute";
    removeBtn.style.top = "0";
    removeBtn.style.right = "0";
    removeBtn.style.background = "rgba(255,0,0,0.8)";
    removeBtn.style.color = "white";
    removeBtn.style.border = "none";
    removeBtn.style.borderRadius = "50%";
    removeBtn.style.width = "20px";
    removeBtn.style.height = "20px";
    removeBtn.style.cursor = "pointer";
    removeBtn.style.fontSize = "14px";
    removeBtn.style.lineHeight = "20px";
    removeBtn.style.padding = "0";

    removeBtn.addEventListener("click", () => {
      selectedImages.splice(idx, 1);
      renderImagePreview();
    });

    container.appendChild(img);
    container.appendChild(removeBtn);
    imagePreview.appendChild(container);
  });
}

// -------------------
// Busca e filtro
// -------------------
searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();
  const filtered = products.filter(p => p.title.toLowerCase().includes(term));
  renderProducts(filtered);
});

filterCategory.addEventListener("change", () => {
  const cat = filterCategory.value;
  const filtered = cat ? products.filter(p => p.category === cat) : products;
  renderProducts(filtered);
});

// -------------------
// Login e Logout
// -------------------
btnLogin.addEventListener("click", () => {
  loginModal.style.display = "flex";
  loginError.style.display = "none";
});

loginCancel.addEventListener("click", () => {
  loginModal.style.display = "none";
  loginUser.value = "";
  loginPass.value = "";
});

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
      body: JSON.stringify({ username, password }),
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
