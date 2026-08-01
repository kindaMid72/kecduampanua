import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
       return NextResponse.json({ error: "Service role key tidak ada" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, record } = await request.json();

    if (type === "UPDATE" || type === "INSERT" || type === "DELETE") {
       // Untuk sekarang, karena masih MVP, revalidate semua path publik dan admin yang berkaitan
       revalidatePath("/", "layout");
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ error: "Error revalidating" }, { status: 500 });
  }
}
