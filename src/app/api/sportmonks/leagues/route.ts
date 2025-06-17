import { fetchSportMonksData } from "@/lib/sportmonks";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetchSportMonksData<{ id: number; name: string; type: string }[]>("/leagues");
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error fetching leagues from SportMonks:", error);
    return NextResponse.json(
      { error: "Failed to fetch leagues", details: (error as Error).message },
      { status: 500 }
    );
  }
}
