const url = 'https://twsjrhcepwynqeuvhtkf.supabase.co/rest/v1';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3c2pyaGNlcHd5bnFldXZodGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTA3OTcsImV4cCI6MjA4OTQ2Njc5N30.YQ_GzblFWztCNwGiB45yh5ZFmzd020Ye6fIERXdpkDA';

async function check() {
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
  
  const res1 = await fetch(`${url}/raw_materials?select=*`, { headers });
  const mats = await res1.json();
  console.log("=== MATERIALS ===");
  console.log(JSON.stringify(mats, null, 2));

  const res2 = await fetch(`${url}/rm_logs?select=*&limit=10`, { headers });
  const rm = await res2.json();
  console.log("\n=== RM LOGS ===");
  console.log(JSON.stringify(rm, null, 2));
}
check();
