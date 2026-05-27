   import { normalizeProductImages, supabase } from './supabase.js';
import { createProductFilters } from './productFilters.js';
   
   const SUPABASE_URL = "https://etjeyblrvfvnftwgrtgl.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0amV5YmxydmZ2bmZ0d2dydGdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MDc3MDUsImV4cCI6MjA5NTI4MzcwNX0.0PTbZ038YQVuVbxjiFuivo9LN1k1Lbz2xHYiD17_0QE";

    const supabaseClient = supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

    async function hentData() {
      const container = document.getElementById("dataContainer");

      const { data, error } = await supabaseClient
        .from("users")
        .select("*");

      if (error) {
        container.innerHTML = `
          <div class="card">
            <p>Fejl: ${error.message}</p>
          </div>
        `;
        return;
      }

      container.innerHTML = "";

      data.forEach(user => {
        container.innerHTML += `
          <div class="card">
            <h3>${user.name}</h3>
            <p>Email: ${user.email}</p>
          </div>
        `;
      });
    }