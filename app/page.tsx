"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import raw from "./interventions-data.json";

type Row={id:string;apartment:string;date:string;category:string;description:string;author:string};
const fallbackData=raw as Row[];
const monthKey=(d:string)=>d.slice(0,7);
const monthFmt=new Intl.DateTimeFormat("fr-FR",{month:"long",year:"numeric",timeZone:"Europe/Paris"});
const dayFmt=new Intl.DateTimeFormat("fr-FR",{day:"2-digit",month:"short",year:"numeric",timeZone:"Europe/Paris"});
const labelMonth=(m:string)=>monthFmt.format(new Date(`${m}-15T12:00:00Z`));
const COLORS:Record<string,string>={"Nuisibles & hygiène":"red","Textile & rideaux":"green","Électroménager & TV":"violet","Plomberie":"blue","Électricité & clim":"amber","Menuiserie & accès":"cyan","Mobilier & literie":"rose","Équipement bébé":"mint","Autre technique":"slate"};

export default function Page(){
 const [data,setData]=useState<Row[]>(fallbackData); const [period,setPeriod]=useState("all"); const [query,setQuery]=useState(""); const [category,setCategory]=useState("all"); const [selected,setSelected]=useState<string|null>(null); const [syncing,setSyncing]=useState(false); const [live,setLive]=useState(false); const [syncedAt,setSyncedAt]=useState<string|null>(null); const [syncError,setSyncError]=useState("");
 const months=useMemo(()=>[...new Set(data.map(r=>monthKey(r.date)))].sort().reverse(),[data]);
 const categories=useMemo(()=>[...new Set(data.map(r=>r.category))].sort(),[data]);
 const sync=useCallback(async()=>{setSyncing(true);setSyncError("");try{const response=await fetch("/api/pumble",{cache:"no-store"});const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||"Erreur Pumble");if(Array.isArray(result.rows)&&result.rows.length){setData(result.rows);setLive(true);setSyncedAt(result.syncedAt);setPeriod("all")}else throw new Error("Aucune intervention reçue")}catch(error){setSyncError(error instanceof Error?error.message:"Erreur Pumble")}finally{setSyncing(false)}},[]);
 useEffect(()=>{sync()},[sync]);
 const rows=useMemo(()=>period==="all"?data:data.filter(r=>monthKey(r.date)===period),[period]);
 const apartments=useMemo(()=>{const map=new Map<string,Row[]>(); rows.forEach(r=>map.set(r.apartment,[...(map.get(r.apartment)||[]),r])); return [...map].map(([number,items])=>({number,items,total:items.length,categories:[...new Set(items.map(i=>i.category))],latest:items[0]})).filter(a=>(!query||a.number.includes(query))&&(category==="all"||a.categories.includes(category))).sort((a,b)=>b.total-a.total||a.number.localeCompare(b.number))},[rows,query,category]);
 const counts=useMemo(()=>categories.map(name=>({name,count:rows.filter(r=>r.category===name).length})).sort((a,b)=>b.count-a.count),[rows]);
 const trend=useMemo(()=>[...months].reverse().map(m=>({month:m,count:data.filter(r=>monthKey(r.date)===m).length,apartments:new Set(data.filter(r=>monthKey(r.date)===m).map(r=>r.apartment)).size})),[data,months]);
 const maxTrend=Math.max(...trend.map(t=>t.count),1); const top=apartments[0]; const recurring=apartments.filter(a=>a.total>=4).length; const periodLabel=period==="all"?"Saison entière":labelMonth(period); const selectedRows=selected?rows.filter(r=>r.apartment===selected):[];
 return <main>
  <header className="top no-print"><div className="brand"><b>MG</b><span><strong>Mer & Golf</strong><small>Port Argelès · Service technique</small></span></div><div className={`status ${live?"is-live":""}`}><i/> {live?`Pumble synchronisé${syncedAt?` à ${new Intl.DateTimeFormat("fr-FR",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Paris"}).format(new Date(syncedAt))}`:""}`:`Archive locale · ${dayFmt.format(new Date(data[0].date))}`}</div><button className="sync-button" disabled={syncing} onClick={sync}>{syncing?"Synchronisation…":"Actualiser Pumble"}</button><button onClick={()=>window.print()}>Imprimer le bilan</button></header>
  {syncError&&<div className="sync-warning no-print">{syncError} · Les données archivées restent affichées.</div>}
  <section className="hero"><div><p>TABLEAU DE BORD MAINTENANCE</p><h1>Vue d’ensemble des interventions</h1><span>260 appartements · Historique Pumble normalisé · Mars à août 2026</span></div><label className="period no-print"><span>Période analysée</span><select aria-label="Période" value={period} onChange={e=>setPeriod(e.target.value)}><option value="all">Saison entière · toutes périodes</option>{months.map(m=><option key={m} value={m}>{labelMonth(m)}</option>)}</select></label></section>
  <section className="season-strip"><div><small>PÉRIODE</small><strong>{periodLabel}</strong></div><p>{period==="all"?`${months.length} mois consolidés`:`Bilan mensuel`} · {rows.length} interventions analysées</p></section>
  <section className="kpis">
   <article><small>Interventions</small><strong>{rows.length}</strong><span>{period==="all"?"sur la saison":"sur le mois"}</span></article>
   <article><small>Appartements concernés</small><strong>{new Set(rows.map(r=>r.apartment)).size}<i>/260</i></strong><span>{Math.round(new Set(rows.map(r=>r.apartment)).size/260*100)} % du parc</span></article>
   <article><small>Plus sollicité</small><strong>N° {top?.number||"—"}</strong><span>{top?.total||0} interventions</span></article>
   <article><small>Appartements récurrents</small><strong>{recurring}</strong><span>4 interventions ou plus</span></article>
   <article><small>Type principal</small><strong className="word">{counts[0]?.name||"—"}</strong><span>{counts[0]?.count||0} interventions</span></article>
  </section>
  {period==="all"&&<section className="overview-grid">
   <article className="panel trend"><div className="panel-title"><div><h2>Activité par mois</h2><p>Volume d’interventions et appartements concernés</p></div></div><div className="bars">{trend.map(t=><div className="monthbar" key={t.month}><div className="barvalue">{t.count}</div><div className="bartrack"><i style={{height:`${Math.max(t.count/maxTrend*100,5)}%`}}/></div><strong>{labelMonth(t.month).split(" ")[0].slice(0,3)}</strong><small>{t.apartments} apt.</small></div>)}</div></article>
   <article className="panel alerts"><div className="panel-title"><div><h2>Points d’attention</h2><p>Appartements les plus sollicités sur la saison</p></div></div><div>{apartments.slice(0,6).map((a,i)=><button key={a.number} onClick={()=>setSelected(a.number)}><b>{i+1}</b><span><strong>Appartement {a.number}</strong><small>{a.categories.slice(0,2).join(" · ")}</small></span><em>{a.total}</em></button>)}</div></article>
  </section>}
  <section className="content-grid">
   <article className="panel apartments"><div className="panel-title list-title"><div><h2>Appartements concernés</h2><p>{apartments.length} résultat{apartments.length>1?"s":""} · classés par fréquence</p></div><div className="filters no-print"><input aria-label="Rechercher un appartement" placeholder="N° appartement" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Catégorie" value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Toutes les catégories</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></div></div><div className="apt-list">{apartments.map(a=><button className="apt" key={a.number} onClick={()=>setSelected(a.number)}><b>{a.number}</b><span><strong>Appartement {a.number}</strong><small>{a.latest.description}</small></span><span className="tags">{a.categories.slice(0,2).map(c=><i className={COLORS[c]} key={c}>{c}</i>)}</span><em>{a.total}<small> intervention{a.total>1?"s":""}</small></em><q>›</q></button>)}</div></article>
   <aside className="panel categories"><div className="panel-title"><div><h2>Répartition par type</h2><p>{rows.length} interventions classées</p></div></div><div className="cat-list">{counts.map(c=><div key={c.name}><span><i className={COLORS[c.name]}/>{c.name}<b>{c.count}</b></span><progress max={counts[0]?.count||1} value={c.count}/></div>)}</div><div className="note"><b>Qualité des données</b><p>Les messages sans numéro, statuts « OK » et doublons identiques sont exclus. Les catégories sont détectées automatiquement.</p></div></aside>
  </section>
  <section className="print-only"><h2>Détail — {periodLabel}</h2><table><thead><tr><th>Date</th><th>Appartement</th><th>Catégorie</th><th>Intervention</th><th>Signalé par</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{dayFmt.format(new Date(r.date))}</td><td>{r.apartment}</td><td>{r.category}</td><td>{r.description}</td><td>{r.author}</td></tr>)}</tbody></table></section>
  {selected&&<div className="overlay no-print" onMouseDown={()=>setSelected(null)}><aside className="drawer" onMouseDown={e=>e.stopPropagation()}><header><div><small>FICHE APPARTEMENT</small><h2>N° {selected}</h2><p>{selectedRows.length} intervention{selectedRows.length>1?"s":""} · {periodLabel}</p></div><button aria-label="Fermer" onClick={()=>setSelected(null)}>×</button></header><div className="history">{selectedRows.map(r=><article key={r.id}><i className={COLORS[r.category]}/><div><time>{dayFmt.format(new Date(r.date))}</time><b>{r.category}</b><p>{r.description}</p><small>Signalé par {r.author}</small></div></article>)}</div></aside></div>}
 </main>
}
