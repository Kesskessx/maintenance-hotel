import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"Bilan interventions appartements",description:"Tableau de bord maintenance de Mer & Golf Port Argelès"};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="fr"><body>{children}</body></html>}
