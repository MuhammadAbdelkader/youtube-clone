const fs = require('fs');

async function run() {
  fs.writeFileSync('dummy.mp4', 'dummy content');
  
  const form = new FormData();
  form.append('title', 'Test Title');
  form.append('description', 'Test Description');
  form.append('category', 'Other');
  form.append('tags', 'test');
  
  // Create a dummy video file
  const fileBlob = new File([fs.readFileSync('dummy.mp4')], 'dummy.mp4', { type: 'video/mp4' });
  form.append('video', fileBlob);

  try {
    const res = await fetch('http://localhost:3000/api/videos/upload', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer DUMMY_TOKEN_FOR_TEST'
      },
      body: form
    });
    const data = await res.json();
    console.log("STATUS:", res.status);
    console.log("DATA:", data);
  } catch (err) {
    console.log("ERROR:", err);
  }
}
run();
