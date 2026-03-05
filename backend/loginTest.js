import fetch from 'node-fetch';
(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ahmedphiri90s@gmail.com', password: 'password' })
    });
    console.log('status', res.status);
    console.log(await res.text());
  } catch (err) {
    console.error(err);
  }
})();
