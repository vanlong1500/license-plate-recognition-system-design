// quanly.js
document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.querySelector("table tbody");
  try {
    const res = await fetch("http://localhost:5000/api/staff");
    const staffList = await res.json();

    tbody.innerHTML = staffList
      .map(
        (s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${s.name}</td>
        <td><img src="${s.avatar}" width="80"></td>
        <td>${s.rank}</td>
        <td>${s.position}</td>
        <td>${s.status}</td>
        <td>${s.licensePlate}</td>
        <td>
          <a href="/nhanvien/edit">Edit</a>
          <a href="/nhanvien/delete">Delete</a>
        </td>
      </tr>
    `
      )
      .join("");
  } catch (err) {
    console.error("Lỗi khi load staff:", err);
    tbody.innerHTML = `<tr><td colspan="8">Không thể load dữ liệu</td></tr>`;
  }
});
