const paymentStatus = document.getElementById("paymentStatus");

if (!state.token) {
  window.location.href = "/auth.html";
}

const sessionId = new URLSearchParams(window.location.search).get("session_id");

const pollStatus = async (attempt = 1) => {
  if (!sessionId) {
    paymentStatus.textContent = "Missing session id.";
    return;
  }

  if (attempt > 6) {
    paymentStatus.textContent = "Timed out while checking payment. Please refresh.";
    return;
  }

  const data = await api(`/api/checkout/status/${sessionId}`);
  paymentStatus.textContent = `status=${data.status} | payment=${data.payment_status}`;

  if (data.payment_status === "paid") {
    paymentStatus.textContent = "Payment successful. Order created.";
    return;
  }

  if (data.status === "expired") {
    paymentStatus.textContent = "Payment session expired.";
    return;
  }

  setTimeout(() => {
    pollStatus(attempt + 1).catch((error) => {
      paymentStatus.textContent = error.message;
    });
  }, 2000);
};

ensureAuthNav();
pollStatus().catch((error) => {
  paymentStatus.textContent = error.message;
});
