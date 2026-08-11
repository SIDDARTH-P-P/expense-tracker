import { NextResponse } from 'next/server';

export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Google Authentication</title>
      </head>
      <body style="background:#12141C;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="text-align:center;">
          <h2>Authenticating with Google...</h2>
          <p>Please wait while we log you in.</p>
        </div>
        <script>
          try {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            if (accessToken) {
              fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: 'Bearer ' + accessToken }
              })
              .then(res => res.json())
              .then(profile => {
                return fetch('/api/auth/google', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: profile.email,
                    name: profile.name || profile.email.split('@')[0],
                    avatar: profile.picture
                  })
                });
              })
              .then(res => res.json())
              .then(data => {
                if (window.opener) {
                  window.opener.location.href = '/dashboard';
                  window.close();
                } else {
                  window.location.href = '/dashboard';
                }
              })
              .catch(err => {
                alert('Authentication failed: ' + err.message);
                window.close();
              });
            }
          } catch(e) {
            console.error(e);
          }
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
