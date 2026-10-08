import { useEffect, useState, createContext, useContext } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  ShoppingBag,
  Search,
  Star,
  Heart,
  ArrowRight,
  Minus,
  Plus,
  Trash2,
  Package,
  Users,
  Receipt,
} from "lucide-react";
import "./index.css";
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  }),
  C = createContext(),
  useStore = () => useContext(C),
  money = (n) => `$${Number(n).toFixed(2)}`,
  imageUrl = (src) =>
    src?.startsWith("/") ? `${new URL(api.defaults.baseURL).origin}${src}` : src;
function Store({ children }) {
  const [user, setUser] = useState(
      JSON.parse(localStorage.getItem("cc_user") || "null"),
    ),
    [cart, setCart] = useState(null);
  useEffect(() => {
    if (user) {
      api.defaults.headers.common.Authorization = "Bearer " + user.token;
      api
        .get("/cart")
        .then((r) => setCart(r.data.data))
        .catch(() => {});
    }
  }, [user]);
  const login = (d) => {
      localStorage.setItem("cc_user", JSON.stringify(d));
      setUser(d);
      api.defaults.headers.common.Authorization = "Bearer " + d.token;
    },
    logout = () => {
      localStorage.removeItem("cc_user");
      setUser(null);
      setCart(null);
    },
    refresh = () => api.get("/cart").then((r) => setCart(r.data.data));
  return (
    <C.Provider value={{ user, cart, login, logout, refresh }}>
      {children}
    </C.Provider>
  );
}
function Nav() {
  const { user, cart, logout } = useStore(),
    [q, setQ] = useState(""),
    nav = useNavigate(),
    count = cart?.items.reduce((s, i) => s + i.quantity, 0) || 0;
  return (
    <>
      <header>
        <Link className="brand" to="/">
          cloud<span>cart</span>
        </Link>
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            nav("/products?search=" + q);
          }}
        >
          <Search size={19} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for products, brands and more"
          />
        </form>
        <nav>
          <Link to="/products">Shop</Link>
          {user?.user.role === "ADMIN" && <Link to="/admin">Admin</Link>}
          {user ? (
            <button className="link" onClick={logout}>
              Sign out
            </button>
          ) : (
            <Link to="/login">Sign in</Link>
          )}
          <Link className="bag" to="/cart">
            <ShoppingBag size={20} />
            <b>{count}</b>
          </Link>
        </nav>
      </header>
      <div className="categories">
        {[
          "Electronics",
          "Fashion",
          "Shoes",
          "Accessories",
          "Home & Lifestyle",
        ].map((x) => (
          <Link
            key={x}
            to={
              "/products?category=" +
              x.toLowerCase().replace(/[^a-z0-9]+/g, "-")
            }
          >
            {x}
          </Link>
        ))}
      </div>
    </>
  );
}
function ProductCard({ p }) {
  const { user, refresh } = useStore(),
    nav = useNavigate();
  const add = async () => {
    if (!user) return nav("/login");
    try {
      await api.post("/cart", { productId: p.id });
      await refresh();
      toast.success("Added to your cart");
    } catch (e) {
      toast.error(e.response?.data?.message || "Unable to add");
    }
  };
  return (
    <article className="product-card">
      <Link to={"/products/" + p.id}>
        <div className="product-image">
          <img
          src={imageUrl(
              p.image ||
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
          )}
          />
          <button className="heart">
            <Heart size={18} />
          </button>
        </div>
        <p className="eyebrow">{p.category?.name}</p>
        <h3>{p.name}</h3>
        <div className="rating">
          <Star size={15} fill="currentColor" /> {p.rating}
        </div>
        <div>
          <b>{money(p.discountPrice || p.price)}</b>
          {p.discountPrice && <del>{money(p.price)}</del>}
        </div>
      </Link>
      <div className="card-actions">
        <button className="outline" onClick={add}>
          Add
        </button>
        <Link className="primary" to={"/products/" + p.id}>
          View
        </Link>
      </div>
    </article>
  );
}
function Home() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    api.get("/products?limit=8").then((r) => setProducts(r.data.data));
  }, []);
  return (
    <>
      <section className="hero">
        <div>
          <p className="label">THE NEW EVERYDAY</p>
          <h1>
            Find your next
            <br />
            <i>favourite thing.</i>
          </h1>
          <p>
            Thoughtfully chosen goods for work, home, and every moment in
            between.
          </p>
          <Link className="primary big" to="/products">
            Explore the collection <ArrowRight size={18} />
          </Link>
        </div>
        <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85" />
      </section>
      <section className="section">
        <div className="section-title">
          <div>
            <p className="label">CURATED FOR YOU</p>
            <h2>Shop by category</h2>
          </div>
          <Link to="/products">
            View all <ArrowRight size={16} />
          </Link>
        </div>
        <div className="category-grid">
          {[
            ["Electronics", "1505740420928-5e560c06d30e"],
            ["Fashion", "1441986300917-64674bd600d8"],
            ["Shoes", "1542291026-7eec264c27ff"],
            ["Home & Lifestyle", "1556228720-195a672e8a03"],
          ].map(([n, id]) => (
            <Link
              to={
                "/products?category=" +
                n.toLowerCase().replace(/[^a-z0-9]+/g, "-")
              }
              className="cat"
              key={n}
            >
              <img
                src={
                  "https://images.unsplash.com/photo-" +
                  id +
                  "?auto=format&fit=crop&w=600&q=80"
                }
              />
              <span>
                {n}
                <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="section">
        <div className="section-title">
          <div>
            <p className="label">JUST IN</p>
            <h2>Fresh arrivals</h2>
          </div>
          <Link to="/products">
            Shop new <ArrowRight size={16} />
          </Link>
        </div>
        <div className="products">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>
      <section className="value">
        <div>
          <b>01</b>
          <h3>Made to last</h3>
          <p>Considered choices that go the distance.</p>
        </div>
        <div>
          <b>02</b>
          <h3>Fast delivery</h3>
          <p>Free shipping on orders over $100.</p>
        </div>
        <div>
          <b>03</b>
          <h3>Easy returns</h3>
          <p>30 days to make sure it feels right.</p>
        </div>
      </section>
    </>
  );
}
function Products() {
  const [items, setItems] = useState([]),
    [sp, setSp] = useSearchParams();
  useEffect(() => {
    api.get("/products?" + sp).then((r) => setItems(r.data.data));
  }, [sp]);
  return (
    <section className="section">
      <div className="page-head">
        <div>
          <p className="label">THE COLLECTION</p>
          <h1>Everything, considered.</h1>
        </div>
        <select
          value={sp.get("sort") || ""}
          onChange={(e) => {
            e.target.value ? sp.set("sort", e.target.value) : sp.delete("sort");
            setSp(sp);
          }}
        >
          <option value="">Newest arrivals</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="rating">Highest rated</option>
        </select>
      </div>
      <div className="products">
        {items.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
      {!items.length && (
        <div className="empty">No products matched your search.</div>
      )}
    </section>
  );
}
function Detail() {
  const { id } = useParams(),
    [p, setP] = useState(null),
    { user, refresh } = useStore(),
    nav = useNavigate();
  useEffect(() => {
    api
      .get("/products/" + id)
      .then((r) => setP(r.data.data))
      .catch(() => nav("/products"));
  }, [id]);
  if (!p) return <div className="loading">Loading product...</div>;
  const add = async (buy = false) => {
    if (!user) return nav("/login");
    await api.post("/cart", { productId: p.id });
    await refresh();
    buy ? nav("/cart") : toast.success("Added to your cart");
  };
  return (
    <section className="detail section">
      <div className="detail-img">
        <img src={imageUrl(p.image)} />
      </div>
      <div>
        <p className="eyebrow">{p.category.name}</p>
        <h1>{p.name}</h1>
        <div className="rating">
          <Star size={16} fill="currentColor" /> {p.rating} · Customer favourite
        </div>
        <h2>
          {money(p.discountPrice || p.price)}{" "}
          {p.discountPrice && <del>{money(p.price)}</del>}
        </h2>
        <p className="description">{p.description}</p>
        <p className="stock">
          {p.stock > 0
            ? `${p.stock} in stock — ready to ship`
            : "Currently unavailable"}
        </p>
        <div className="detail-actions">
          <button className="outline" onClick={() => add()}>
            Add to cart
          </button>
          <button className="primary" onClick={() => add(true)}>
            Buy now
          </button>
        </div>
      </div>
    </section>
  );
}
function Auth({ register = false }) {
  const [f, setF] = useState({ name: "", email: "", password: "" }),
    { login } = useStore(),
    nav = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post("/auth/" + (register ? "register" : "login"), f);
      login(r.data.data);
      toast.success(register ? "Welcome to CloudCart!" : "Welcome back!");
      nav(r.data.data.user.role === "ADMIN" ? "/admin" : "/");
    } catch (e) {
      toast.error(e.response?.data?.message || "Unable to continue");
    }
  };
  return (
    <section className="auth">
      <form onSubmit={submit}>
        <Link className="brand" to="/">
          cloud<span>cart</span>
        </Link>
        <h1>{register ? "Create your account" : "Welcome back"}</h1>
        <p>
          {register
            ? "A better way to shop starts here."
            : "Sign in to pick up where you left off."}
        </p>
        {register && (
          <input
            placeholder="Full name"
            required
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
        )}
        <input
          type="email"
          placeholder="Email address"
          required
          onChange={(e) => setF({ ...f, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          minLength="6"
          required
          onChange={(e) => setF({ ...f, password: e.target.value })}
        />
        <button className="primary full">
          {register ? "Create account" : "Sign in"}
        </button>
        <p>
          {register ? "Already have an account?" : "New to CloudCart?"}{" "}
          <Link to={register ? "/login" : "/register"}>
            {register ? "Sign in" : "Create one"}
          </Link>
        </p>
      </form>
    </section>
  );
}
function Cart() {
  const { cart, refresh } = useStore(),
    nav = useNavigate();
  const items = cart?.items || [],
    total = items.reduce(
      (s, i) =>
        s + Number(i.product.discountPrice || i.product.price) * i.quantity,
      0,
    );
  const change = async (i, q) => {
    try {
      await api.patch("/cart/" + i.id, { quantity: q });
      refresh();
    } catch (e) {
      toast.error(e.response?.data?.message);
    }
  };
  const del = async (i) => {
    await api.delete("/cart/" + i.id);
    refresh();
  };
  if (!items.length)
    return (
      <section className="empty section">
        <ShoppingBag size={40} />
        <h2>Your cart is waiting.</h2>
        <p>Add something special and it will appear here.</p>
        <Link className="primary" to="/products">
          Explore products
        </Link>
      </section>
    );
  return (
    <section className="section cart">
      <div>
        <p className="label">YOUR BAG</p>
        <h1>
          {items.length} item{items.length !== 1 && "s"} selected
        </h1>
        {items.map((i) => (
          <div className="cart-row" key={i.id}>
              <img src={imageUrl(i.product.image)} />
            <div>
              <h3>{i.product.name}</h3>
              <p>{i.product.category.name}</p>
              <b>{money(i.product.discountPrice || i.product.price)}</b>
            </div>
            <div className="quantity">
              <button onClick={() => change(i, i.quantity - 1)}>
                <Minus size={15} />
              </button>
              {i.quantity}
              <button onClick={() => change(i, i.quantity + 1)}>
                <Plus size={15} />
              </button>
            </div>
            <button className="icon-btn" onClick={() => del(i)}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
      <aside className="summary">
        <h2>Order summary</h2>
        <p>
          <span>Subtotal</span>
          <b>{money(total)}</b>
        </p>
        <p>
          <span>Shipping</span>
          <b>{total >= 100 ? "Free" : money(9.99)}</b>
        </p>
        <hr />
        <p className="total">
          <span>Total</span>
          <b>{money(total + (total >= 100 ? 0 : 9.99))}</b>
        </p>
        <button className="primary full" onClick={() => nav("/checkout")}>
          Checkout securely <ArrowRight size={17} />
        </button>
        <small>Free shipping on orders over $100.</small>
      </aside>
    </section>
  );
}
function Checkout() {
  const { user, cart, refresh } = useStore(),
    nav = useNavigate(),
    [f, setF] = useState({
      fullName: user?.user.name || "",
      email: user?.user.email || "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
    });
  const submit = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post("/orders", f);
      await refresh();
      nav("/confirmation/" + r.data.data.id);
    } catch (e) {
      toast.error(e.response?.data?.message);
    }
  };
  if (!cart?.items.length) return <Cart />;
  return (
    <section className="section checkout">
      <form onSubmit={submit}>
        <p className="label">CHECKOUT</p>
        <h1>Where should we send it?</h1>
        <div className="form-grid">
          {[
            ["fullName", "Full name"],
            ["email", "Email address"],
            ["phone", "Phone number"],
            ["address", "Street address"],
            ["city", "City"],
            ["postalCode", "Postal code"],
          ].map(([k, l]) => (
            <label key={k}>
              {l}
              <input
                required
                type={k === "email" ? "email" : "text"}
                value={f[k]}
                onChange={(e) => setF({ ...f, [k]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <div className="cod">
          <b>Cash on Delivery</b>
          <span>Pay with cash when your order arrives.</span>
        </div>
        <button className="primary big">
          Place order <ArrowRight size={17} />
        </button>
      </form>
      <aside className="summary">
        <h2>Your order</h2>
        {cart.items.map((i) => (
          <p key={i.id}>
            <span>
              {i.product.name} × {i.quantity}
            </span>
            <b>
              {money(
                Number(i.product.discountPrice || i.product.price) * i.quantity,
              )}
            </b>
          </p>
        ))}
      </aside>
    </section>
  );
}
function Confirmation() {
  const { id } = useParams();
  return (
    <section className="empty section">
      <div className="success">✓</div>
      <p className="label">ORDER CONFIRMED</p>
      <h1>It’s on its way.</h1>
      <p>
        Thank you for choosing CloudCart. Your order #{id} is confirmed and
        we’ll keep you posted.
      </p>
      <Link className="primary" to="/orders">
        Track your order
      </Link>
    </section>
  );
}
function Orders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    api.get("/orders").then((r) => setOrders(r.data.data));
  }, []);
  return (
    <section className="section">
      <p className="label">YOUR ACCOUNT</p>
      <h1>Order history</h1>
      <div className="order-list">
        {orders.map((o) => (
          <div className="order" key={o.id}>
            <div>
              <b>Order #{o.id}</b>
              <p>
                {new Date(o.createdAt).toLocaleDateString()} · {o.items.length}{" "}
                item(s)
              </p>
            </div>
            <span className={"status " + o.status.toLowerCase()}>
              {o.status}
            </span>
            <b>{money(o.total)}</b>
          </div>
        ))}
        {!orders.length && <div className="empty">No orders yet.</div>}
      </div>
    </section>
  );
}
function AdminProducts() {
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    discountPrice: "",
    stock: "",
    categoryId: "",
    image: null,
  });

  useEffect(() => {
    api
      .get("/categories")
      .then((r) => setCategories(r.data.data))
      .catch(() => toast.error("Unable to load categories"));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== "") body.append(key, value);
      });
      await api.post("/products", body);
      toast.success("Product published and now available to customers");
      setForm({
        name: "",
        description: "",
        price: "",
        discountPrice: "",
        stock: "",
        categoryId: "",
        image: null,
      });
      e.target.reset();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to publish product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <p className="label">CATALOGUE</p>
      <h1>Add a product</h1>
      <form className="product-form" onSubmit={submit}>
        <label>
          Product name
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label>
          Category
          <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">Select a category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="product-form-wide">
          Description
          <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <label>
          Price
          <input required min="0" step="0.01" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </label>
        <label>
          Sale price <small>(optional)</small>
          <input min="0" step="0.01" type="number" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} />
        </label>
        <label>
          Stock quantity
          <input required min="0" step="1" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        </label>
        <label>
          Product image
          <input required accept="image/*" type="file" onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })} />
        </label>
        <button className="primary product-form-wide" disabled={saving}>{saving ? "Publishing…" : "Publish product"}</button>
      </form>
    </>
  );
}

function Admin() {
  const [d, setD] = useState(null),
    [tab, setTab] = useState("dashboard");
  useEffect(() => {
    if (tab === "products") {
      setD({});
      return;
    }
    let active = true;
    setD(null);
    const endpoint = tab === "dashboard" ? "/admin/dashboard" : `/admin/${tab}`;
    api
      .get(endpoint)
      .then((r) => {
        if (active) setD(tab === "dashboard" ? r.data.data : { list: r.data.data });
      })
      .catch((e) => {
        if (!active) return;
        toast.error(e.response?.data?.message || "Unable to load admin data");
        setD(
          tab === "dashboard"
            ? { products: 0, orders: 0, customers: 0, revenue: 0, recentOrders: [] }
            : { list: [] },
        );
      });
    return () => {
      active = false;
    };
  }, [tab]);
  if (
    !d ||
    (tab === "dashboard" && !Array.isArray(d.recentOrders)) ||
    ((tab === "orders" || tab === "customers") && !Array.isArray(d.list))
  )
    return <div className="loading">Loading {tab === "dashboard" ? "dashboard" : tab}...</div>;
  return (
    <section className="admin section">
      <aside>
        <h2>Admin</h2>
        {[
          ["dashboard", "Overview"],
          ["orders", "Orders"],
          ["customers", "Customers"],
          ["products", "Add product"],
        ].map(([a, b]) => (
          <button
            className={tab === a ? "active" : ""}
            onClick={() => setTab(a)}
            key={a}
          >
            {b}
          </button>
        ))}
      </aside>
      <main>
        {tab === "products" ? (
          <AdminProducts />
        ) : tab === "dashboard" ? (
          <>
            <p className="label">OVERVIEW</p>
            <h1>Good afternoon.</h1>
            <div className="stats">
              {[
                ["Products", d.products, Package],
                ["Orders", d.orders, Receipt],
                ["Customers", d.customers, Users],
                ["Revenue", money(d.revenue), ShoppingBag],
              ].map(([a, b, I]) => (
                <div>
                  <I size={20} />
                  <p>{a}</p>
                  <h2>{b}</h2>
                </div>
              ))}
            </div>
            <h2>Recent orders</h2>
            <div className="order-list">
              {d.recentOrders.map((o) => (
                <div className="order">
                  <div>
                    <b>
                      #{o.id} · {o.user.name}
                    </b>
                    <p>{o.items.length} item(s)</p>
                  </div>
                  <span className={"status " + o.status.toLowerCase()}>
                    {o.status}
                  </span>
                  <b>{money(o.total)}</b>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="label">MANAGE</p>
            <h1>{tab}</h1>
            <div className="order-list">
              {(d.list || []).map((x) => (
                <div className="order">
                  <div>
                    <b>
                      {tab === "orders" ? `#${x.id} · ${x.user?.name || "Unknown customer"}` : x.name}
                    </b>
                    <p>{tab === "orders" ? x.user?.email || "No email" : x.email}</p>
                  </div>
                  {tab === "orders" ? (
                    <span className={"status " + x.status.toLowerCase()}>
                      {x.status}
                    </span>
                  ) : (
                    <b>{x._count?.orders || 0} orders</b>
                  )}
                  {tab === "orders" && <b>{money(x.total)}</b>}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </section>
  );
}
function Shell() {
  return (
    <>
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<Detail />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/confirmation/:id" element={<Confirmation />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/admin" element={<Admin />} />
          <Route
            path="*"
            element={
              <div className="empty section">
                <h1>Page not found</h1>
                <Link className="primary" to="/">
                  Return home
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
      <footer>© 2026 CloudCart · Thoughtful goods, delivered.</footer>
    </>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <Store>
        <Shell />
        <Toaster position="bottom-right" />
      </Store>
    </BrowserRouter>
  );
}
