const express = require("express");
const path = require("path");
const axios = require("axios");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const USERS_FILE = path.join(__dirname, "users.json");

// Load user profiles from the JSON file
function loadUserProfiles() {
  if (fs.existsSync(USERS_FILE)) {
    const data = fs.readFileSync(USERS_FILE);
    return JSON.parse(data);
  }
  return {};
}

// Save user profiles to the JSON file
function saveUserProfiles(userProfiles) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(userProfiles, null, 2));
}

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

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

    // Debug logs to check the returned user profile
    console.log("User Profile Data:", user);
    console.log("User ID:", user.id);
    console.log("User Avatar:", user.avatar);
    console.log("User Banner:", user.banner);

    const userProfiles = loadUserProfiles();

    // Check if the user already has a custom URL
    if (userProfiles[user.id]) {
      return res.redirect(`/${userProfiles[user.id].customPath}`);
    }

    // If not, show the form to choose a custom URL
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Choose Your URL</title>
      </head>
      <body>
          <h1>Welcome, ${user.username}!</h1>
          <form action="/set-username" method="POST">
              <label for="customPath">Choose your custom URL:</label>
              <input type="text" id="customPath" name="customPath" required>
              <input type="hidden" name="userId" value="${user.id}">
              <input type="hidden" name="avatar" value="${user.avatar || ""}">
              <input type="hidden" name="banner" value="${user.banner || ""}">
              <input type="hidden" name="username" value="${user.username}">
              <input type="hidden" name="discriminator" value="${
                user.discriminator
              }">
              <button type="submit">Submit</button>
          </form>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.send("Error fetching profile.");
  }
});

// Route to handle setting the custom username
app.post("/set-username", (req, res) => {
  const { customPath, userId, username, discriminator, avatar, banner } =
    req.body;
  const userProfiles = loadUserProfiles();

  // Debugging the form data received
  console.log("Form Data:", req.body);

  // Check if the customPath is already taken
  if (
    Object.values(userProfiles).some(
      (profile) => profile.customPath === customPath
    )
  ) {
    return res.send("This custom URL is already taken. Please choose another.");
  }

  // Store user profile using customPath
  userProfiles[userId] = {
    customPath,
    username,
    discriminator,
    avatar: avatar || "", // Handle missing avatars
    banner: banner || "", // Handle missing banners
  };

  // Save updated user profiles to the JSON file
  saveUserProfiles(userProfiles);

  // Redirect the user to their custom URL
  res.redirect(`/${customPath}`);
});

app.get("/:customPath", (req, res) => {
  const customPath = req.params.customPath;
  const userProfiles = loadUserProfiles();

  // Find the user by customPath
  const user = Object.values(userProfiles).find(
    (profile) => profile.customPath === customPath
  );

  if (user) {
    // Log the user data for debugging purposes
    console.log("Loaded user profile:", user);

    // Use the correct userId from the JSON object (the key)
    const userId =
      Object.keys(userProfiles).find(
        (id) => userProfiles[id].customPath === customPath
      ) || "undefined";

    // Construct the avatar URL
    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.${
          user.avatar.startsWith("a_") ? "gif" : "png"
        }?size=128`
      : "https://cdn.discordapp.com/embed/avatars/0.png"; // Default avatar

    // Construct the banner URL
    const bannerUrl = user.banner
      ? `https://cdn.discordapp.com/banners/${userId}/${user.banner}.png?size=300`
      : ""; // No banner if undefined

    // Render the profile HTML
    res.send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Profile - ${user.username}</title>
              <link rel="stylesheet" href="https://unpkg.com/boxicons@latest/css/boxicons.min.css">
              <link rel="stylesheet" type="text/css" href="styles.css">
          </head>
          <body class="profile-page">
              <div class="profile-container">
                  <!-- Display banner if available -->
                  ${
                    bannerUrl
                      ? `<div class="banner"><img src="${bannerUrl}" alt="Banner" class="banner-img"></div>`
                      : ""
                  }
                  
                  <div class="profile-card">
                      <div class="avatar">
                          <img src="${avatarUrl}" alt="Avatar" onerror="this.onerror=null; this.src='https://cdn.discordapp.com/embed/avatars/0.png';">
                      </div>
                      <div class="profile-info">
                          <h2>${user.username}${
      user.discriminator !== "0" ? `#${user.discriminator}` : ""
    }</h2>
                          <p class="user-id">User ID: ${userId}</p> <!-- Display the user ID -->
                          <div class="status-container">
                              <p>Status: Active</p>
                          </div>
                      </div>
                  </div>
                  <div class="social-icons">
                      <a href="#"><i class='bx bxl-discord' title="Discord"></i></a>
                      <a href="#"><i class='bx bxl-twitter' title="Twitter"></i></a>
                      <a href="#"><i class='bx bxl-youtube' title="YouTube"></i></a>
                  </div>
              </div>
          </body>
          </html>
        `);
  } else {
    res.send("Profile not found.");
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
