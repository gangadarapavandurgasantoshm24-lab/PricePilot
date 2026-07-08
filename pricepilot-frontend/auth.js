if (sessionStorage.getItem("pricepilotLoggedIn") !== "true") {
  window.location.replace("login/index.html");
}

const logoutButton = document.querySelector("#logoutBtn");

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    sessionStorage.removeItem("pricepilotLoggedIn");
    sessionStorage.removeItem("pricepilotUserEmail");
    window.location.href = "login/index.html";
  });
}
