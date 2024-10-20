// Example of adding an animation when the page loads
document.addEventListener("DOMContentLoaded", function () {
  const profileCard = document.querySelector(".profile-card");
  profileCard.classList.add("animate");
});

// You can also add functionality for dynamic data updates
function updateProfile(username, avatarUrl) {
  document.querySelector(".username").textContent = username;
  document.querySelector(".profile-image img").src = avatarUrl;
}
