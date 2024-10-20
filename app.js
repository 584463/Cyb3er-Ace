const express = require("express");
const path = require("path");
const axios = require("axios");
const app = express();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Serve the index.html file when accessing the root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const CLIENT_ID = "1272560974578319424";
const CLIENT_SECRET = "IK7vUMv2zwCjOjNjxEnMj2uaM4OjepLH";
const REDIRECT_URI = "http://localhost:3000/callback";

// Discord OAuth2 login route
app.get("/login", (req, res) => {
  const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=identify`;
  res.redirect(discordAuthUrl);
});

// Discord OAuth2 callback route
app.get("/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const userProfileResponse = await axios.get(
      "https://discord.com/api/users/@me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const user = userProfileResponse.data;
    res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Profile - ${user.username}</title>
                <link rel="stylesheet" type="text/css" href="styles.css">
            </head>
            <body class="profile-page">
                <div class="profile-container">
                    <div class="profile-card">
                        <div class="avatar">
                            <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" alt="Avatar">
                        </div>
                        <div class="profile-info">
                            <h2>${user.username}#${user.discriminator}</h2>
                            <p class="user-id">User ID: ${user.id}</p>
                            <div class="status-container">
                                <p>Status: Active</p>
                            </div>
                        </div>
                    </div>
                    <div class="social-icons">
                        <a href="#"><img src="/discord.png" alt="Discord"></a>
                        <a href="#"><img src="/twitter.png" alt="Twitter"></a>
                        <a href="#"><img src="/youtube.png" alt="YouTube"></a>
                    </div>
                </div>
            </body>
            </html>
        `);
  } catch (error) {
    res.send("Error fetching profile.");
    console.error(error);
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
