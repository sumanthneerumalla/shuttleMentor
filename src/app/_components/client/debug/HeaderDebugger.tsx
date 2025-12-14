"use client";

import { useState, useEffect } from "react";
import { Button } from "~/app/_components/shared/Button";

export function HeaderDebugger() {
  const [headers, setHeaders] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHeaders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Call our debug API endpoint
      const response = await fetch("/api/debug/headers");
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setHeaders(data);
      
      // Also log to console for easier inspection
      console.log("Debug Headers Client - Response:", data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      console.error("Debug Headers Client - Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Check headers on component mount
  useEffect(() => {
    checkHeaders();
  }, []);

  return (
    <div className="glass-card p-4 my-4 rounded-lg">
      <h3 className="text-lg font-medium mb-2">Header Debugger</h3>
      
      <div className="flex gap-2 mb-4">
        <Button 
          onClick={checkHeaders} 
          disabled={loading}
          size="sm"
        >
          {loading ? "Checking..." : "Check Headers"}
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded mb-4">
          {error}
        </div>
      )}
      
      {headers && (
        <div className="bg-gray-50 p-3 rounded overflow-auto max-h-96">
          <h4 className="font-medium mb-2">Request URL:</h4>
          <p className="mb-4 text-sm break-all">{headers.url}</p>
          
          <h4 className="font-medium mb-2">Key Headers:</h4>
          <ul className="text-sm mb-4">
            <li><strong>Origin:</strong> {headers.origin}</li>
            <li><strong>Host:</strong> {headers.host}</li>
            <li><strong>Referer:</strong> {headers.referer}</li>
          </ul>
          
          <h4 className="font-medium mb-2">All Headers:</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(headers.headers, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
