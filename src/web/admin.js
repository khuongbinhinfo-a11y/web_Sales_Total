const adminData = document.getElementById("adminData");

async function loadAdmin() {
  const response = await fetch("/api/admin/dashboard");
  if (response.status === 401) {
    window.location.href = "/admin/login";
    return;
  }
  const data = await response.json();
  adminData.textContent = JSON.stringify(data, null, 2);
}

document.getElementById("loadAdmin").addEventListener("click", loadAdmin);

loadAdmin();
