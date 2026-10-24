import SpaSite from "./spa-site";
import { readContent } from "@/lib/server";
import { cookies, headers } from "next/headers";
export const dynamic="force-dynamic";
export default async function Home({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const [{content},query,cookieStore,requestHeaders]=await Promise.all([readContent(),searchParams,cookies(),headers()]);
  const preference=query.lang??cookieStore.get("sirley-language")?.value;
  const initialLocale=preference==="es"||preference==="en"?preference:requestHeaders.get("accept-language")?.startsWith("es")?"es":"en";
  return <SpaSite initialContent={content} initialLocale={initialLocale}/>;
}
