// ---- Backend API base ----
const API_BASE = "https://imeneee.pythonanywhere.com";

function apiUrl(path) {
    return path.startsWith("http") ? path : `${API_BASE}${path}`;
}

// ---- Headers based on JWT ----
function apiHeaders() {
    const token = sessionStorage.getItem("jwt");
    return token
        ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        : { "Content-Type": "application/json" };
}

// ---- Fetch wrapper ----
async function api(endpoint, options = {}) {
    const res = await fetch(apiUrl(endpoint), {
        ...options,
        headers: { ...apiHeaders(), ...(options.headers || {}) },
    });

    if (!res.ok) {
        if (res.status === 401) {
            handleLogout(false);
            alert("Session expired. Please log in again.");
            return;
        }
        throw new Error(await res.text());
    }

    return res.status === 204 ? {} : res.json();
}

// Short helper
const qs = (id) => document.getElementById(id);

// ---- DOM CACHE ----
const elements = {
    pages: {
        home: qs("homePage"),
        category: qs("categoryPage"),
        noteView: qs("notePage"),
        admin: qs("adminDashboard")
    },
    loginForm: qs("loginForm"),
    loginModal: qs("loginModal"),
    loginBtn: qs("loginBtn"),
    userBtn: document.querySelector(".user-btn"),
    userEmailDisplay: qs("userEmailDisplay"),

    subcategoriesContainer: qs("subcategoriesContainer"),
    notesContainer: qs("notesContainer"),

    noteTitle: qs("noteTitle"),
    noteBody: qs("noteBody"),

    categoryTitle: qs("categoryTitle"),

    // Admin
    publishedCount: qs("publishedCount"),
    totalViews: qs("totalViews"),
};

let currentUser = null;
let categoriesTree = [];
let flatCategories = [];
let currentCategoryId = null;

// ---------------- AUTH ----------------
async function handleLogin(e) {
    e.preventDefault();
    const email = qs("loginEmail").value;
    const password = qs("loginPassword").value;

    try {
        const data = await api("/api/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });

        sessionStorage.setItem("jwt", data.token);
        sessionStorage.setItem("user", JSON.stringify(data.user));
        currentUser = data.user;

        updateLoginUI();
        closeLogin();

        if (currentUser.role === "admin") {
            showAdminDashboard();
        }
    } catch (err) {
        alert("Login failed.");
    }
}

function updateLoginUI() {
    const user = sessionStorage.getItem("user");
    currentUser = user ? JSON.parse(user) : null;

    if (!currentUser) {
        elements.loginBtn.style.display = "block
