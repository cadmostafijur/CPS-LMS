import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TOKEN_COOKIE } from "@/lib/config";

export async function POST(request: Request) {
  const jar = await cookies();
  if (!jar.get(TOKEN_COOKIE)?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { paths?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const paths = (body.paths || []).filter((p) => typeof p === "string" && p.startsWith("/"));
  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({ revalidated: paths });
}
