import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // No caching

/**
 * Debug endpoint to log and return request headers
 */
export async function GET(req: NextRequest) {
  // Get all headers
  const headers = Object.fromEntries(req.headers);
  
  // Log headers for server-side debugging
  console.log("Debug Headers API - Request URL:", req.url);
  console.log("Debug Headers API - Headers:", JSON.stringify(headers, null, 2));
  
  // Return headers in response for client-side debugging
  return NextResponse.json({ 
    url: req.url,
    headers: headers,
    origin: headers.origin || "No origin header",
    host: headers.host || "No host header",
    referer: headers.referer || "No referer header"
  });
}
