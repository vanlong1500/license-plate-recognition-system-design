document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.querySelector("table tbody");

  try {
    const res = await fetch("/api/staff");
    const staffList = await res.json();

    tbody.innerHTML = staffList
      .map(
        (s, i) => `
      <tr data-id="${s._id}">
        <td>${i + 1}</td>
        <td>${s.name}</td>
        <td><img src="${s.avatar}" width="80"></td>
        <td>${s.rank}</td>
        <td>${s.position}</td>
        <td>${s.licensePlate}</td>
        <td>
          <a href="/nhanvien/edit/${s._id}">Edit</a>
          <a href="#" class="delete-btn" data-id="${s._id}">Delete</a>
        </td>
      </tr>
    `
      )
      .join("");

    tbody.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const id = btn.dataset.id;

        // if (!confirm("Bạn có chắc muốn xóa nhân viên này không?")) return;

        try {
          const res = await fetch(`/quanly/delete/${id}`, { method: "GET" });
          if (!res.ok) throw new Error("Server trả lỗi");
          const data = await res.json();

          if (data.success) {
            btn.closest("tr").remove();
            // alert(data.message);
          } else {
            // alert(data.message);
          }
        } catch (err) {
          console.error(err);
          alert("Lỗi khi xóa nhân viên");
        }
      });
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="8">Không thể load dữ liệu</td></tr>`;
  }
});
