import {NextResponse} from "next/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const API="https://pumble-api-keys.addons.marketplace.cake.com";
type PumbleChannel={id:string;name?:string;isArchived?:boolean;isMember?:boolean};
type PumbleMessage={id:string;channelId:string;author?:string;text?:string;timestamp?:string;timestampMilli?:number;deleted?:boolean};
type PumbleUser={id:string;name?:string};
const rules:[string,RegExp][]=[
 ["Plomberie",/fuite|douche|baignoire|lavabo|evier|évier|wc|toilette|chasse|robinet|eau |évacuation|evacuation|bouch[ée]|égout|egout|pommeau|siphon|joint/i],
 ["Électricité & clim",/clim|climat|chauffage|radiateur|électri|electri|lumière|lumiere|ampoule|prise|interrupteur|ventilateur|disjonct/i],
 ["Électroménager & TV",/frigo|réfrig|refrig|four|micro.?onde|plaque|lave.?vaisselle|télé|tele|tv|téléphone|telephone|cafeti|grille.?pain|bouilloire/i],
 ["Menuiserie & accès",/porte|fenêtre|fenetre|baie|serrure|poignée|poignee|store|volet|clé|cle |placard|charnière|charniere|vitre/i],
 ["Textile & rideaux",/rideau|tringle|drap|couette|oreiller|housse|serviette|matelas|textile/i],
 ["Mobilier & literie",/chaise|table|canapé|canape|lit |sommier|meuble|pied |poubelle|tancarville|tank?arville|étagère|etagere/i],
 ["Nuisibles & hygiène",/fourmi|cafard|insecte|nid |guêpe|guepe|pigeon|odeur|moisi|moisiss|sale|hygiène|hygiene/i],
 ["Équipement bébé",/bébé|bebe|lit parapluie|chaise haute/i],
];
const category=(text:string)=>rules.find(([,rule])=>rule.test(text))?.[0]||"Autre technique";
const apartment=(text:string)=>text.match(/(?:app(?:art(?:ement)?)?\s*(?:n[°ºo]\s*)?|\b)(\d{3})(?!\d)/i)?.[1]||null;
const useful=(text:string)=>text.trim().length>5&&!/^(ok|fait|réglé|regle|résolu|resolu|merci|1|1 réponse|\+1)[.!\s]*$/i.test(text.trim());

async function call<T>(path:string,key:string):Promise<T>{
 const response=await fetch(`${API}${path}`,{headers:{ApiKey:key},cache:"no-store"});
 if(!response.ok) throw new Error(`Pumble ${response.status}`);
 return response.json() as Promise<T>;
}

export async function GET(){
 const key=process.env.PUMBLE_API_KEY;
 if(!key) return NextResponse.json({ok:false,error:"PUMBLE_API_KEY absente"},{status:503});
 try{
  const [rawChannels,users]=await Promise.all([call<Array<{channel?:PumbleChannel}&PumbleChannel>>("/listChannels",key),call<PumbleUser[]>("/listUsers",key)]);
  const channels=rawChannels.map(item=>item.channel||item).filter(c=>!c.isArchived&&c.isMember!==false);
  const wanted=(process.env.PUMBLE_CHANNEL||"").trim().toLowerCase();
  const channel=channels.find(c=>c.id===wanted||c.name?.toLowerCase()===wanted)||channels.find(c=>/maintenance|intervention|technique/i.test(c.name||""));
  if(!channel) return NextResponse.json({ok:false,error:"Canal Pumble introuvable. Ajouter PUMBLE_CHANNEL dans Vercel."},{status:503});
  const messages=await call<PumbleMessage[]>(`/listMessages?channelId=${encodeURIComponent(channel.id)}&limit=1000`,key);
  const names=new Map(users.map(user=>[user.id,user.name||"Équipe"]));
  const rows=messages.filter(m=>!m.deleted&&useful(m.text||"")).map(m=>{
   const description=(m.text||"").trim(); const apt=apartment(description); if(!apt)return null;
   const date=m.timestamp||new Date(m.timestampMilli||0).toISOString();
   return {id:m.id,apartment:apt,date,category:category(description),description,author:names.get(m.author||"")||"Équipe Pumble"};
  }).filter((row):row is NonNullable<typeof row>=>Boolean(row)).sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime());
  return NextResponse.json({ok:true,channel:channel.name||channel.id,syncedAt:new Date().toISOString(),rows},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  console.error("Pumble sync failed",error instanceof Error?error.message:"unknown");
  return NextResponse.json({ok:false,error:"Synchronisation Pumble impossible"},{status:502});
 }
}
