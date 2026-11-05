import { useState } from 'react';
import '../styles/OwnerMenuAdmin.css';

const emptyItem = { name: '', description: '', ingredients: '', allergens: '', price: '', category: 'Popular', image: '' };

export function OwnerMenuAdmin({ items, setItems }) {
  const [form, setForm] = useState(emptyItem);

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function addItem(event) {
    event.preventDefault();
    const ingredients = form.ingredients.split(',').map((value) => value.trim()).filter(Boolean);
    const allergens = form.allergens.split(',').map((value) => value.trim()).filter(Boolean);
    setItems((current) => [{ ...form, ingredients, allergens, id: Date.now(), price: Number(form.price) || 0, tag: form.category }, ...current]);
    setForm(emptyItem);
  }

  function deleteItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return <div className="owner-menu-admin"><section className="page-heading compact"><div><p className="eyebrow">Owner workspace <span className="live-pill"><i /> Menu controls</span></p><h1>Manage the <em>menu.</em></h1><p className="heading-copy">Add new dishes or remove items from the customer-facing menu.</p></div></section><section className="owner-admin-layout"><form className="owner-item-form" onSubmit={addItem}><h2>Add menu item</h2><label>Name<input name="name" value={form.name} onChange={updateForm} placeholder="Dish name" required /></label><div className="owner-fields-row"><label>Price<input name="price" type="number" min="0" step="0.01" value={form.price} onChange={updateForm} placeholder="0.00" required /></label><label>Category<select name="category" value={form.category} onChange={updateForm}><option>Popular</option><option>Vegetarian</option><option>Mains</option><option>Dessert</option><option>Drinks</option></select></label></div><label>Image URL<input name="image" value={form.image} onChange={updateForm} placeholder="https://..." /></label><label>Description<textarea name="description" value={form.description} onChange={updateForm} placeholder="Short menu description" rows="3" required /></label><label>Ingredients <small>(separate with commas)</small><textarea name="ingredients" value={form.ingredients} onChange={updateForm} placeholder="List every ingredient" rows="3" required /></label><label>Allergens <small>(or enter None listed)</small><textarea name="allergens" value={form.allergens} onChange={updateForm} placeholder="Milk, wheat, eggs" rows="2" required /></label><button className="primary-button" type="submit">Add to menu <span>→</span></button></form><div className="owner-items"><div className="owner-items-heading"><h2>Current menu</h2><span>{items.length} items</span></div>{items.map((item) => <article className="owner-item" key={item.id}><div className="owner-item-image" style={{ backgroundImage: `url(${item.image})` }} /><div><strong>{item.name}</strong><span>{item.category} · EGP {item.price}</span><p>{item.description}</p></div><button className="owner-delete" onClick={() => deleteItem(item.id)} aria-label={`Delete ${item.name}`}>×</button></article>)}</div></section></div>;
}
