import { useState } from 'react';
import '../styles/OwnerMenuAdmin.css';

const API_ROOT = (process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:4000/api')).replace(/\/$/, '');
const categories = ['Appetizers', 'Vegetarian', 'Mains', 'Dessert', 'Drinks'];
const emptyItem = { name: '', description: '', tag: '', ingredients: '', allergens: '', price: '', category: 'Appetizers', image: '' };

function fromRecord(record) {
  return { ...record, id: record.sourceId ?? record._id, image: record.imageUrl || '', ingredients: record.ingredients || [], allergens: record.allergens || [] };
}

function splitList(value) {
  return value.split(',').map((part) => part.trim()).filter(Boolean);
}

function readAndCompressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type.startsWith('image/')) return reject(new Error('Choose an image file.'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The image could not be read.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('The image could not be opened.'));
      image.onload = () => {
        const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputType, 0.82);
        if (dataUrl.length > 4_500_000) return reject(new Error('That image is too large. Choose a smaller file.'));
        resolve(dataUrl);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function OwnerMenuAdmin({ items, setItems }) {
  const [form, setForm] = useState(emptyItem);
  const [editId, setEditId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const image = await readAndCompressImage(file);
      setForm((current) => ({ ...current, image }));
    } catch (uploadError) {
      setError(uploadError.message);
    }
    event.target.value = '';
  }

  async function saveItem(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    const item = {
      name: form.name.trim(),
      description: form.description.trim(),
      tag: form.tag.trim(),
      ingredients: splitList(form.ingredients),
      allergens: splitList(form.allergens),
      price: Number(form.price),
      category: form.category,
      imageUrl: form.image,
    };
    try {
      const token = window.localStorage.getItem('savor-auth-token') || '';
      const response = await fetch(`${API_ROOT}/menu${editId ? `/${editId}` : ''}`, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(item),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'The menu item could not be saved.');
      const savedItem = fromRecord(result);
      setItems((current) => editId ? current.map((existing) => existing._id === savedItem._id ? savedItem : existing) : [savedItem, ...current]);
      setForm(emptyItem);
      setEditId('');
      setNotice(editId ? 'Menu item updated.' : 'Menu item added.');
    } catch (saveError) {
      setError(saveError.message || 'The menu item could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  function editItem(item) {
    setEditId(item._id);
    setForm({
      name: item.name,
      description: item.description || '',
      tag: item.tag || '',
      ingredients: (item.ingredients || []).join(', '),
      allergens: (item.allergens || []).join(', '),
      price: String(item.price),
      category: categories.includes(item.category) ? item.category : 'Appetizers',
      image: item.image || '',
    });
    setError('');
    setNotice('');
    document.querySelector('.owner-item-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function deleteItem(item) {
    setError('');
    try {
      const token = window.localStorage.getItem('savor-auth-token') || '';
      const response = await fetch(`${API_ROOT}/menu/${item._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'The menu item could not be removed.');
      }
      setItems((current) => current.filter((existing) => existing._id !== item._id));
      if (editId === item._id) { setEditId(''); setForm(emptyItem); }
      setNotice(`${item.name} removed from the menu.`);
    } catch (deleteError) {
      setError(deleteError.message || 'The menu item could not be removed.');
    }
  }

  function cancelEdit() {
    setEditId('');
    setForm(emptyItem);
    setError('');
    setNotice('');
  }

  return <div className="owner-menu-admin">
    <section className="page-heading compact"><div><p className="eyebrow">Owner workspace <span className="live-pill"><i /> Menu controls</span></p><h1>Manage the <em>menu.</em></h1><p className="heading-copy">Add, edit, or remove dishes, photos, ingredients, and allergen details.</p></div></section>
    <section className="owner-admin-layout">
      <form className="owner-item-form" onSubmit={saveItem}>
        <h2>{editId ? 'Edit menu item' : 'Add menu item'}</h2>
        <label>Name<input name="name" value={form.name} onChange={updateForm} placeholder="Dish name" required /></label>
        <label>Card label <small>(optional)</small><input name="tag" value={form.tag} onChange={updateForm} placeholder="Chef's pick, Vegetarian" /></label>
        <div className="owner-fields-row"><label>Price (EGP)<input name="price" type="number" min="0" step="0.01" value={form.price} onChange={updateForm} placeholder="0.00" required /></label><label>Category<select name="category" value={form.category} onChange={updateForm}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label></div>
        <label>Upload image<input className="owner-image-upload" type="file" accept="image/*" onChange={uploadImage} required={!editId && !form.image} /><small>Choose a photo from your device. No image links needed.</small></label>
        {form.image && <div className="owner-image-preview" style={{ backgroundImage: `url(${form.image})` }} role="img" aria-label="Selected menu item preview" />}
        <label>Description<textarea name="description" value={form.description} onChange={updateForm} placeholder="Short menu description" rows="3" required /></label>
        <label>Ingredients <small>(separate with commas)</small><textarea name="ingredients" value={form.ingredients} onChange={updateForm} placeholder="List every ingredient" rows="3" required /></label>
        <label>Allergens <small>(optional)</small><textarea name="allergens" value={form.allergens} onChange={updateForm} placeholder="Milk, wheat, eggs" rows="2" /></label>
        {error && <p className="owner-admin-error" role="alert">{error}</p>}{notice && <p className="owner-admin-notice" role="status">{notice}</p>}
        <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : editId ? 'Save changes' : 'Add to menu'} <span>→</span></button>
        {editId && <button className="owner-cancel-edit" type="button" onClick={cancelEdit}>Cancel editing</button>}
      </form>
      <div className="owner-items"><div className="owner-items-heading"><h2>Current menu</h2><span>{items.length} items</span></div>
        {items.length ? items.map((item) => <article className="owner-item" key={item._id || item.id}>
          <div className="owner-item-image" style={{ backgroundImage: `url(${item.image})` }} />
          <div className="owner-item-copy"><strong>{item.name}</strong><span>{item.category} · EGP {item.price}</span><p>{item.description}</p></div>
          <div className="owner-item-actions"><button className="owner-edit" type="button" onClick={() => editItem(item)}>Edit</button><button className="owner-delete" type="button" onClick={() => deleteItem(item)} aria-label={`Delete ${item.name}`}>×</button></div>
        </article>) : <p className="owner-menu-empty">No menu items to display.</p>}
      </div>
    </section>
  </div>;
}
