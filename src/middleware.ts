import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

// Create a custom middleware to log headers and fix domain issues
export function middleware(req: NextRequest) {
  // Log request headers for debugging
  console.log("Request URL:", req.url);
  console.log("Request Headers:", JSON.stringify(Object.fromEntries(req.headers), null, 2));
  
  // Create a modified request with corrected headers if needed
  const url = new URL(req.url);
  const isProduction = process.env.NODE_ENV === "production";
  
  // Check if we need to modify headers for Clerk domain restrictions
  if (isProduction && !req.headers.get("origin")?.includes("shuttlementor.com")) {
    // Clone the headers
    const headers = new Headers(req.headers);
    
    // Set the origin header to match the expected domain
    headers.set("origin", "https://shuttlementor.com");
    
    // Log the modified headers
    console.log("Modified Headers:", JSON.stringify(Object.fromEntries(headers), null, 2));
    
    // Return the response with modified headers
    const response = NextResponse.next();
    response.headers.set("origin", "https://shuttlementor.com");
    return response;
  }
  
  // If no modifications needed, continue with the request
  return NextResponse.next();
}

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
