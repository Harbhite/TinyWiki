import fetch from 'node-fetch';

async function test() {
  const response = await fetch("http://localhost:3000/api/generate-wiki-topic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: "cats" }),
  });
  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Body:", text);
}

test();
