const loginForm = document.querySelector("#loginForm");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const authMessage = document.querySelector("#authMessage");
const emailError = document.querySelector("#emailError");
const passwordError = document.querySelector("#passwordError");
const loginButton = document.querySelector("#loginButton");

const showMessage = (message, type = "error") => {
  authMessage.textContent = message;
  authMessage.className = `auth-message show ${type}`;
};

const clearMessage = () => {
  authMessage.textContent = "";
  authMessage.className = "auth-message";
};

const setFieldError = (input, errorElement, message) => {
  errorElement.textContent = message;
  input.classList.toggle("input-error", Boolean(message));
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateForm = () => {
  let isValid = true;
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  setFieldError(emailInput, emailError, "");
  setFieldError(passwordInput, passwordError, "");
  clearMessage();

  if (!email) {
    setFieldError(emailInput, emailError, "Email is required.");
    isValid = false;
  } else if (!isValidEmail(email)) {
    setFieldError(emailInput, emailError, "Please enter a valid email address.");
    isValid = false;
  }

  if (!password) {
    setFieldError(passwordInput, passwordError, "Password is required.");
    isValid = false;
  } else if (password.length < 6) {
    setFieldError(passwordInput, passwordError, "Password must be at least 6 characters.");
    isValid = false;
  }

  if (!isValid) {
    showMessage("Login accepts any valid email format and any password with at least 6 characters.");
  }

  return isValid;
};

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    if (!validateForm()) return;

    loginButton.disabled = true;
    loginButton.textContent = "Checking...";
    loginButton.classList.add("is-loading");

    window.setTimeout(() => {
      sessionStorage.setItem("pricepilotLoggedIn", "true");
      sessionStorage.setItem("pricepilotUserEmail", emailInput.value.trim());
      showMessage("Login successful. Redirecting to dashboard...", "success");
      window.setTimeout(() => {
        window.location.replace(new URL("../index.html", window.location.href));
      }, 500);
    }, 600);
  } catch (error) {
    loginButton.disabled = false;
    loginButton.textContent = "Login";
    loginButton.classList.remove("is-loading");
    showMessage("Something went wrong during login. Please refresh and try again.");
  }
});

emailInput.addEventListener("input", () => setFieldError(emailInput, emailError, ""));
passwordInput.addEventListener("input", () => setFieldError(passwordInput, passwordError, ""));

document.querySelector("#forgotPassword").addEventListener("click", () => {
  const email = emailInput.value.trim();

  if (!email) {
    setFieldError(emailInput, emailError, "Enter your email first to reset password.");
    showMessage("Please enter your email address before requesting password reset.");
    return;
  }

  if (!isValidEmail(email)) {
    setFieldError(emailInput, emailError, "Please enter a valid email address.");
    showMessage("Use a valid email address for password reset.");
    return;
  }

  showMessage("Password reset link feature will be connected with backend soon.", "success");
});

document.querySelector("#createAccount").addEventListener("click", () => {
  showMessage("Account creation will be added with backend authentication soon.", "success");
});

document.querySelectorAll("[data-provider]").forEach((button) => {
  button.addEventListener("click", () => {
    showMessage(`${button.dataset.provider} login will be connected soon.`);
  });
});
