import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  Box,
  ClipboardList,
  ImagePlus,
  LogOut,
  PackagePlus,
  RefreshCw,
} from "lucide-react";
import {
  getAdminConsole,
  saveAdminMedia,
  saveAdminProduct,
  updateInquiryStatus,
} from "@/lib/admin.functions";
import { adminLogout } from "@/lib/admin-auth.functions";
import { whatsappUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });
type Product = {
  id: string;
  name: string;
  slug: string;
  category: "fresh-onions" | "dehydrated-onions" | "fresh-garlic" | "dehydrated-garlic";
  description: string;
  image_url: string;
  image_alt: string;
  status: "draft" | "published" | "archived";
  featured: boolean;
  display_order: number;
};
type Category = Product["category"];
const categories: { value: Category; label: string }[] = [
  { value: "fresh-onions", label: "Fresh onions" },
  { value: "dehydrated-onions", label: "Dehydrated onions" },
  { value: "fresh-garlic", label: "Fresh garlic" },
  { value: "dehydrated-garlic", label: "Dehydrated garlic" },
];
const emptyProduct = {
  name: "",
  slug: "",
  category: "fresh-onions" as Category,
  description: "",
  image_url: "",
  image_alt: "",
  status: "draft" as Product["status"],
  featured: false,
  display_order: 0,
};

function AdminDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [section, setSection] = useState<"products" | "enquiries">("products");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const query = useQuery({
    queryKey: ["admin-console"],
    queryFn: () => getAdminConsole(),
    retry: false,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-console"] });
  const save = useMutation({
    mutationFn: saveAdminProduct,
    onSuccess: async () => {
      setNotice("Product saved.");
      setEditing(null);
      setForm(emptyProduct);
      await refresh();
    },
    onError: (error) => setNotice(error.message),
  });
  const status = useMutation({
    mutationFn: updateInquiryStatus,
    onSuccess: refresh,
    onError: (error) => setNotice(error.message),
  });
  const data = query.data;

  function edit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      slug: product.slug,
      category: product.category,
      description: product.description,
      image_url: product.image_url,
      image_alt: product.image_alt,
      status: product.status,
      featured: product.featured,
      display_order: product.display_order,
    });
    setNotice("");
  }

  async function uploadImage(file?: File) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setNotice("Choose a JPG, PNG or WebP image smaller than 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let offset = 0; offset < bytes.length; offset += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
      }
      const contents = btoa(binary);
      const image = await saveAdminMedia({ data: { mimeType: file.type, contents } });
      setForm((current) => ({ ...current, image_url: image.url }));
      setNotice("Image uploaded. Save the product to publish the change.");
    } catch {
      setNotice("Image upload failed. Check the MySQL connection and admin permissions.");
    } finally {
      setUploading(false);
    }
  }

  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const order = Number(formData.get("display_order") || 0);
    save.mutate({
      data: { ...form, display_order: order, ...(editing ? { id: editing.id } : {}) },
    });
  }

  async function signOut() {
    await adminLogout();
    await navigate({ to: "/admin/login" });
  }

  if (query.isPending)
    return (
      <main className="admin-loading">
        <RefreshCw className="animate-spin" /> Loading secure workspace…
      </main>
    );
  if (query.isError || !data)
    return (
      <main className="admin-login-page">
        <section className="admin-login-card">
          <span className="admin-kicker">ADMIN ACCESS</span>
          <h1>Sign in required</h1>
          <p>Your account must be active in the admin access list to view this workspace.</p>
          <Link className="admin-solid-link" to="/admin/login">
            Go to admin sign in
          </Link>
          <Link className="admin-back-link" to="/">
            Return to website
          </Link>
        </section>
      </main>
    );

  const activeProducts = data.products.filter((product) => product.status === "published").length;
  const newEnquiries = data.enquiries.filter((inquiry) => inquiry.status === "new").length;
  const canEditProducts = ["owner", "manager", "editor"].includes(data.role);
  const canUpdateEnquiries = ["owner", "manager", "sales"].includes(data.role);
  const selectedSection = section === "products" && !data.canProducts ? "enquiries" : section;

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand">
          <span className="admin-brand-mark">OM</span>
          <span>
            <b>OM Food</b>
            <small>Administration</small>
          </span>
        </Link>
        <p className="admin-side-caption">WORKSPACE</p>
        {data.canProducts && (
          <button
            className={`admin-nav-item ${selectedSection === "products" ? "is-active" : ""}`}
            onClick={() => setSection("products")}
          >
            <Box size={18} /> Product catalogue
          </button>
        )}
        {data.canEnquiries && (
          <button
            className={`admin-nav-item ${selectedSection === "enquiries" ? "is-active" : ""}`}
            onClick={() => setSection("enquiries")}
          >
            <ClipboardList size={18} /> Enquiries{" "}
            <span className="admin-nav-count">{newEnquiries}</span>
          </button>
        )}
        <div className="admin-sidebar-bottom">
          <Link to="/" className="admin-nav-item">
            <ArrowUpRight size={17} /> View website
          </Link>
          <button onClick={signOut} className="admin-nav-item">
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-kicker">SECURE WORKSPACE</span>
            <h1>Good day</h1>
          </div>
          <div className="admin-user">
            <span className="admin-user-dot" /> {data.role.replace("_", " ")} access
          </div>
        </header>
        <div className="admin-content">
          <div className="admin-welcome">
            <div>
              <p className="admin-kicker">OM FOOD AND SPICES LLP</p>
              <h2>
                {selectedSection === "products" ? "Product catalogue" : "Enquiries and leads"}
              </h2>
              <p>Manage approved catalogue information and buyer requests.</p>
            </div>
            <span className="admin-welcome-icon">
              {selectedSection === "products" ? <Box /> : <ClipboardList />}
            </span>
          </div>
          <div className="admin-stats">
            {data.canProducts && (
              <Stat
                label="Products"
                value={data.products.length}
                detail={`${activeProducts} published`}
              />
            )}{" "}
            {data.canEnquiries && (
              <Stat
                label="Recent enquiries"
                value={data.enquiries.length}
                detail={`${newEnquiries} new`}
              />
            )}{" "}
            {data.canProducts &&
              categories.map((category) => (
                <Stat
                  key={category.value}
                  label={category.label}
                  value={data.products.filter((p) => p.category === category.value).length}
                  detail="catalogue entries"
                />
              ))}
          </div>
          {notice && (
            <p className="admin-notice" role="status">
              {notice}
            </p>
          )}
          {selectedSection === "products" && data.canProducts ? (
            <div className="admin-work-grid">
              <section className="admin-panel admin-product-list">
                <div className="admin-panel-heading">
                  <div>
                    <p className="admin-kicker">CATALOGUE</p>
                    <h3>Products</h3>
                  </div>
                  {canEditProducts && (
                    <button
                      className="admin-primary-button"
                      onClick={() => {
                        setEditing(null);
                        setForm(emptyProduct);
                        setNotice("");
                      }}
                    >
                      <PackagePlus size={17} /> Add product
                    </button>
                  )}
                </div>
                {data.products.length === 0 ? (
                  <div className="admin-empty">
                    <Box />
                    <h4>No products in the admin catalogue yet</h4>
                    <p>
                      Public pages continue to use the existing catalogue until you publish database
                      entries.
                    </p>
                  </div>
                ) : (
                  <div className="admin-products">
                    {data.products.map((product) => (
                      <article className="admin-product-row" key={product.id}>
                        <div className="admin-product-thumb">
                          {product.image_url ? <img src={product.image_url} alt="" /> : <Box />}
                        </div>
                        <div className="admin-product-info">
                          <strong>{product.name}</strong>
                          <span>{categories.find((c) => c.value === product.category)?.label}</span>
                        </div>
                        <span className={`admin-status status-${product.status}`}>
                          {product.status}
                        </span>
                        {canEditProducts && (
                          <button className="admin-small-button" onClick={() => edit(product)}>
                            Edit
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
              {canEditProducts && (
                <section className="admin-panel admin-product-editor">
                  <div className="admin-panel-heading">
                    <div>
                      <p className="admin-kicker">{editing ? "EDIT ENTRY" : "NEW ENTRY"}</p>
                      <h3>{editing ? "Product details" : "Add a product"}</h3>
                    </div>
                  </div>
                  <form className="admin-form" onSubmit={submitProduct}>
                    <label>
                      Product name
                      <input
                        required
                        maxLength={160}
                        value={form.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setForm((c) => ({ ...c, name, slug: c.slug || slugify(name) }));
                        }}
                      />
                    </label>
                    <label>
                      URL slug
                      <input
                        required
                        pattern="[a-z0-9]+(-[a-z0-9]+)*"
                        value={form.slug}
                        onChange={(e) => setForm((c) => ({ ...c, slug: e.target.value }))}
                      />
                    </label>
                    <label>
                      Category
                      <select
                        value={form.category}
                        onChange={(e) =>
                          setForm((c) => ({ ...c, category: e.target.value as Category }))
                        }
                      >
                        {categories.map((c) => (
                          <option value={c.value} key={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Description
                      <textarea
                        rows={4}
                        maxLength={3000}
                        value={form.description}
                        onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                      />
                    </label>
                    <label>
                      Main image URL
                      <input
                        value={form.image_url}
                        onChange={(e) => setForm((c) => ({ ...c, image_url: e.target.value }))}
                        placeholder="https://…"
                      />
                    </label>
                    <label>
                      Image alternative text
                      <input
                        maxLength={300}
                        value={form.image_alt}
                        onChange={(e) => setForm((c) => ({ ...c, image_alt: e.target.value }))}
                      />
                    </label>
                    <label className="admin-upload">
                      {uploading ? (
                        "Uploading…"
                      ) : (
                        <>
                          <ImagePlus size={17} /> Upload JPG, PNG or WebP (max 5 MB)
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploading}
                        onChange={(e) => void uploadImage(e.target.files?.[0])}
                      />
                    </label>
                    <label>
                      Display order
                      <input
                        name="display_order"
                        type="number"
                        min="0"
                        max="9999"
                        value={form.display_order}
                        onChange={(e) =>
                          setForm((c) => ({ ...c, display_order: Number(e.target.value) }))
                        }
                      />
                    </label>
                    <label>
                      Status
                      <select
                        value={form.status}
                        onChange={(e) =>
                          setForm((c) => ({ ...c, status: e.target.value as Product["status"] }))
                        }
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </label>
                    <label className="admin-check">
                      <input
                        type="checkbox"
                        checked={form.featured}
                        onChange={(e) => setForm((c) => ({ ...c, featured: e.target.checked }))}
                      />{" "}
                      Featured product
                    </label>
                    <div className="admin-form-actions">
                      <button
                        type="submit"
                        className="admin-primary-button"
                        disabled={save.isPending}
                      >
                        {save.isPending ? "Saving…" : editing ? "Save changes" : "Create product"}
                      </button>
                      {editing && (
                        <button
                          type="button"
                          className="admin-small-button"
                          onClick={() => {
                            setEditing(null);
                            setForm(emptyProduct);
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    <p className="admin-form-hint">
                      Public prices remain quote-only until the business confirms and approves a
                      price. Product formats and availability require company confirmation.
                    </p>
                  </form>
                </section>
              )}
            </div>
          ) : (
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <p className="admin-kicker">BUYER REQUESTS</p>
                  <h3>Recent enquiries</h3>
                </div>
                <span className="admin-count-chip">{newEnquiries} new</span>
              </div>
              {data.enquiries.length === 0 ? (
                <div className="admin-empty">
                  <ClipboardList />
                  <h4>No stored enquiries yet</h4>
                  <p>
                    Enquiries submitted through the website will appear here when database storage
                    is configured.
                  </p>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Buyer</th>
                        <th>Product</th>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th>Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.enquiries.map((inquiry) => (
                        <tr key={inquiry.id}>
                          <td>
                            <strong>{inquiry.full_name}</strong>
                            <small>
                              {inquiry.company_name} · {inquiry.country}
                            </small>
                            <small>{inquiry.business_email}</small>
                          </td>
                          <td>
                            {inquiry.product_interest}
                            <small>{inquiry.required_quantity || "Quantity not specified"}</small>
                          </td>
                          <td>{new Date(inquiry.created_at).toLocaleDateString()}</td>
                          <td>
                            {canUpdateEnquiries ? (
                              <select
                                className="admin-inline-select"
                                value={inquiry.status}
                                onChange={(e) =>
                                  status.mutate({
                                    data: {
                                      id: inquiry.id,
                                      status: e.target.value as
                                        "new" | "in_progress" | "quoted" | "closed",
                                    },
                                  })
                                }
                              >
                                <option value="new">New</option>
                                <option value="in_progress">In progress</option>
                                <option value="quoted">Quoted</option>
                                <option value="closed">Closed</option>
                              </select>
                            ) : (
                              <span className={`admin-status status-${inquiry.status}`}>
                                {inquiry.status.replace("_", " ")}
                              </span>
                            )}
                          </td>
                          <td>
                            <a
                              className="admin-contact-link"
                              href={whatsappUrl(
                                `Hello ${inquiry.full_name}, regarding your enquiry for ${inquiry.product_interest}.`,
                              )}
                              target="_blank"
                              rel="noreferrer"
                            >
                              WhatsApp <ArrowUpRight size={14} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
          {data.activity.length > 0 && (
            <section className="admin-panel admin-activity">
              <div className="admin-panel-heading">
                <div>
                  <p className="admin-kicker">AUDIT TRAIL</p>
                  <h3>Recent admin activity</h3>
                </div>
              </div>
              {data.activity.map((item) => (
                <p key={item.id}>
                  <span>{item.action.replaceAll(".", " ")}</span>
                  <small>{new Date(item.created_at).toLocaleString()}</small>
                </p>
              ))}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <article className="admin-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
