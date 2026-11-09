
const toast = document.getElementById("interfaceToast");
const dialog = document.getElementById("utilityDialog");
const dialogTitle = document.getElementById("dialogTitle");
const dialogText = document.getElementById("dialogText");

let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("visible");
  }, 2500);
}

function openPanel(title, message) {
  dialogTitle.textContent = title;
  dialogText.textContent = message;

  if (!dialog.open) dialog.showModal();
}

function focusChat() {
  const input = document.getElementById("question");
  input.focus();
  input.scrollIntoView({ behavior: "smooth", block: "center" });
}

document.getElementById("accountButton").addEventListener("click", () => {
  openPanel("YOUR ACCOUNT", "Your Protogen account and profile options will appear here.");
});

document.getElementById("settingsButton").addEventListener("click", () => {
  openPanel("SETTINGS", "Personalize your Protogen experience. More settings are coming soon.");
});

document.getElementById("dialogClose").addEventListener("click", () => {
  dialog.close();
});

document.getElementById("voiceButton").addEventListener("click", () => {
  // Voice recognition is handled by your original script.js.
});

document.querySelectorAll("[data-action]").forEach(button => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;

    if (action === "talk") {
      document.getElementById("voiceButton").click();
    }

    if (action === "chat") {
      focusChat();
    }

    if (action === "stop") {
      document.dispatchEvent(new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true
      }));
    }

    if (action === "explore") {
      document.getElementById("question").value =
        "Give me something interesting to explore today.";
      focusChat();
    }

    if (action === "settings") {
      openPanel("SETTINGS", "Personalize your Protogen experience. More settings are coming soon.");
    }

    if (action === "account") {
      openPanel("YOUR ACCOUNT", "Your Protogen account and profile options will appear here.");
    }

    if (action === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast("Welcome to Protogen AI.");
    }
  });
});

document.querySelectorAll(".recent-item").forEach(item => {
  item.addEventListener("click", () => {
    const prompt = item.dataset.prompt;
    const input = document.getElementById("question");

    input.value = prompt;
    input.focus();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

document.getElementById("clearRecent").addEventListener("click", () => {
  document.getElementById("recentList").innerHTML = "";
  showToast("Recent searches cleared.");
});

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");
  });
});

document.querySelector(".notification-button").addEventListener("click", () => {
  showToast("you're all caught up!");
});
