import SpaSite from "./spa-site";
import { readContent } from "@/lib/server";
export const dynamic="force-dynamic";
export default async function Home() { const {content}=await readContent();return <SpaSite initialContent={content}/>; }
