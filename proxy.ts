import {NextRequest,NextResponse} from "next/server";

const encoder=new TextEncoder();
async function signature(secret:string){
 const key=await crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const bytes=await crypto.subtle.sign("HMAC",key,encoder.encode("maintenance-hotel-session"));
 return Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,"0")).join("");
}

export async function proxy(request:NextRequest){
 const {pathname}=request.nextUrl;
 if(pathname==="/login"||pathname==="/api/auth/login") return NextResponse.next();
 const secret=process.env.SESSION_SECRET||process.env.DASHBOARD_PASSWORD;
 if(!secret) return new NextResponse("DASHBOARD_PASSWORD absente du déploiement Production",{status:503});
 const expected=await signature(secret);
 const session=request.cookies.get("hotel_session")?.value;
 if(session===expected) return NextResponse.next();
 const login=new URL("/login",request.url);
 login.searchParams.set("next",pathname);
 return NextResponse.redirect(login);
}

export const config={matcher:["/((?!_next/static|_next/image|favicon.ico).*)"]};
