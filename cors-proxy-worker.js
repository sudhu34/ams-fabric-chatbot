// Cloudflare Worker for CORS Proxy
// Deploy this at: https://workers.cloudflare.com

export default {
  async fetch(request) {
    // Your backend API URL
    const API_URL = "https://vscode-relaxed-whale-wd.cfapps.us10-001.hana.ondemand.com/submit";
    
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Accept",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    
    // Forward POST request
    try {
      const response = await fetch(API_URL, {
        method: request.method,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: request.body,
      });
      
      const data = await response.text();
      
      return new Response(data, {
        status: response.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      });
    }
  },
};
