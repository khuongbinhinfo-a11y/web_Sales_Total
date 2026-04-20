const portalData = document.getElementById("portalData");
const usageData = document.getElementById("usageData");

async function loadPortal(customerId) {
  const response = await fetch(`/api/portal/${customerId}`);
  if (response.status === 401) {
    window.location.href = "/portal/login";
    return;
  }
  const data = await response.json();
  portalData.textContent = JSON.stringify(data, null, 2);
}

async function consumeUsage() {
  const payload = {
    customerId: document.getElementById("usageCustomerId").value,
    appId: document.getElementById("usageAppId").value,
    featureKey: document.getElementById("usageFeatureKey").value,
    creditsToConsume: Number(document.getElementById("usageCredits").value),
    units: Number(document.getElementById("usageUnits").value),
    requestId: document.getElementById("usageRequestId").value,
    metadata: {
      source: "portal-page"
    }
  };

  const response = await fetch("/api/usage/consume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (response.status === 401) {
    window.location.href = "/portal/login";
    return;
  }

  const data = await response.json();
  usageData.textContent = JSON.stringify(data, null, 2);
  await loadPortal(payload.customerId);
}

document.getElementById("loadPortal").addEventListener("click", () => {
  const customerId = document.getElementById("customerId").value;
  loadPortal(customerId);
});

document.getElementById("consumeUsage").addEventListener("click", consumeUsage);

loadPortal("cus-demo");
