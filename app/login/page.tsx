"use client";
import {FormEvent,useState} from "react";

export default function Login(){
 const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
 async function submit(event:FormEvent){event.preventDefault();setLoading(true);setError("");const response=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});const result=await response.json();if(result.ok){const next=new URLSearchParams(window.location.search).get("next");window.location.assign(next&&next.startsWith("/")?next:"/")}else{setError(result.error||"Connexion impossible");setLoading(false)}}
 return <main className="login-page"><form className="login-card" onSubmit={submit}><div className="login-logo">MG</div><small>MER & GOLF · PORT ARGELÈS</small><h1>Tableau de bord maintenance</h1><p>Accès réservé au service technique.</p><label><span>Mot de passe</span><input type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} autoFocus required/></label>{error&&<div className="login-error">{error}</div>}<button disabled={loading}>{loading?"Connexion…":"Se connecter"}</button></form></main>
}
