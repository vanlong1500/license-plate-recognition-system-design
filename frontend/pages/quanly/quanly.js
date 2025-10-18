document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.querySelector("table tbody");

  try {
    const res = await fetch("/api/staff");
    const staffList = await res.json();

    if (!staffList || staffList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">Không có dữ liệu</td></tr>`;
      return; // Nếu ko có data
    }

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
          <a href="#" class="edit-btn">Edit</a>
          <a href="#" class="delete-btn" data-id="${s._id}">Delete</a>
        </td>
      </tr>
    `
      )
      .join("");
    //
    //   NÚT DELETE
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

    // NÚT EDIT
    tbody.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const tr = btn.closest("tr");
        const isEditing = btn.textContent === "Save";
        // Định vị chính xác cột
        const editColumns = {
          name: 1,
          rank: 3,
          position: 4,
          licensePlate: 5,
        };
        if (!isEditing) {
          // Bật chế độ edit
          Object.entries(editColumns).forEach(([key, idx]) => {
            const td = tr.children[idx];
            td.innerHTML = `<input type="text" value="${td.textContent.trim()}" />`;
          });
          btn.textContent = "Save";
        } else {
          // Lấy dữ liệu từ input
          const updatedData = {};
          Object.entries(editColumns).forEach(([key, idx]) => {
            updatedData[key] = tr.children[idx]
              .querySelector("input")
              .value.trim();
          });

          // Kiểm tra nếu dữ liệu không thay đổi → chỉ reset row
          const unchanged = Object.entries(editColumns).every(([key, idx]) => {
            return tr.children[idx].textContent.trim() === updatedData[key];
          });

          Object.entries(editColumns).forEach(([key, idx]) => {
            tr.children[idx].textContent = updatedData[key];
          });
          btn.textContent = "Edit";

          if (unchanged) return; // không cần gửi request nếu ko đổi

          // Nếu có thay đổi, gửi request PUT
          try {
            const res = await fetch(`/quanly/edit/${tr.dataset.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedData),
            });
            const data = await res.json();
            if (!data.success) {
              alert(data.message);
            }
          } catch (err) {
            console.error(err);
            alert("Lỗi khi cập nhật nhân viên");
          }
        }
      });
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="8">Không thể load dữ liệu</td></tr>`;
  }
});
