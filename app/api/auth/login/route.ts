import {NextRequest,NextResponse} from "next/server";

const encoder=new TextEncoder();
async function signature(secret:string){
 const key=await crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const bytes=await crypto.subtle.sign("HMAC",key,encoder.encode("maintenance-hotel-session"));
 return Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,"0")).join("");
}

export async function POST(request:NextRequest){
 const password=process.env.DASHBOARD_PASSWORD;
 const secret=process.env.SESSION_SECRET;
 if(!password||!secret) return NextResponse.json({ok:false,error:"Configuration incomplète"},{status:503});
 const body=await request.json().catch(()=>null) as {password?:string}|null;
 if(body?.password!==password) return NextResponse.json({ok:false,error:"Mot de passe incorrect"},{status:401});
 const response=NextResponse.json({ok:true});
 response.cookies.set("hotel_session",await signature(secret),{httpOnly:true,secure:true,sameSite:"strict",path:"/",maxAge:60*60*12});
 return response;
}
