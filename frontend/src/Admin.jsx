import React, { useState } from 'react';

function tokenKey(){ return 'admin_token'; }
function saveToken(t){ localStorage.setItem(tokenKey(), t); }
function readToken(){ return localStorage.getItem(tokenKey()); }
function removeToken(){ localStorage.removeItem(tokenKey()); }

export default function Admin({ onAdded }) {
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');

  const token = readToken();

  async function login(e){
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch('http://localhost:4000/api/admin/login', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      saveToken(data.token);
      setMsg('Logged in');
    } catch (err) { setMsg('Error: ' + err.message); }
  }

  function logout(){ removeToken(); setMsg('Logged out'); }

  async function createProduct(e){
    e.preventDefault();
    setMsg('');
    try {
      const body = { title, category, price: Number(price||0), image, description: '' };
      const res = await fetch('http://localhost:4000/api/products', {
        method:'POST',
        headers: { 'Content-Type':'application/json', 'Authorization': 'Bearer ' + readToken() },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create failed');
      setMsg('Created');
      setTitle(''); setCategory(''); setPrice(''); setImage('');
      if (onAdded) onAdded(data);
    } catch (err) { setMsg('Error: ' + err.message); }
  }

  if (!token) {
    return (
      <form onSubmit={login} style={{padding:8, background:'#fff', borderRadius:8, marginBottom:8}}>
        <h4 style={{marginTop:0}}>Admin Login</h4>
        <input type="password" placeholder="Admin password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%', padding:8, marginBottom:8}} />
        <button type="submit" style={{padding:'8px 12px'}}>Log in</button>
        <div style={{marginTop:8, color: msg.startsWith('Error') ? 'crimson' : 'green'}}>{msg}</div>
      </form>
    );
  }

  return (
    <div style={{padding:8, background:'#fff', borderRadius:8, marginBottom:8}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h4 style={{margin:0}}>Admin</h4>
        <button onClick={logout}>Log out</button>
      </div>

      <form onSubmit={createProduct} style={{marginTop:8}}>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" style={{width:'100%',padding:8,marginBottom:8}} required />
        <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Category" style={{width:'100%',padding:8,marginBottom:8}} />
        <input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Price" type="number" style={{width:'100%',padding:8,marginBottom:8}} />
        <input value={image} onChange={e=>setImage(e.target.value)} placeholder="Image URL" style={{width:'100%',padding:8,marginBottom:8}} />
        <button type="submit" style={{padding:'8px 12px'}}>Create product</button>
      </form>
      <div style={{marginTop:8, color: msg.startsWith('Error') ? 'crimson' : 'green'}}>{msg}</div>
    </div>
  );
}
