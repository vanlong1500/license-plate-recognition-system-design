// add.js
document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("add-btn");
  const tbody = document.querySelector("table tbody");

  function createInputRow(existing = null) {
    // existing: nếu là object đã lưu (để hiển thị lại) - optional
    const tr = document.createElement("tr");

    // nếu existing có _id thì gắn data-id
    if (existing && existing._id) tr.dataset.id = existing._id;

    tr.innerHTML = `
      <td>#</td>
      <td><input name="name" type="text" class="form-control" value="${
        existing ? escapeHtml(existing.name || "") : ""
      }" /></td>
      <td>
        ${
          existing && existing.avatar
            ? `<img src="${existing.avatar}" width="80" style="display:block;margin-bottom:6px">`
            : ""
        }
        <input name="avatar" type="file" accept="image/*" />
      </td>
      <td><input name="rank" type="text" class="form-control" value="${
        existing ? escapeHtml(existing.rank || "") : ""
      }" /></td>
      <td><input name="position" type="text" class="form-control" value="${
        existing ? escapeHtml(existing.position || "") : ""
      }" /></td>
      <td><input name="licensePlate" type="text" class="form-control" value="${
        existing ? escapeHtml(existing.licensePlate || "") : ""
      }" /></td>
      <td>
        <a href="#" class="save-btn">Save</a>
        <a href="#" class="delete-btn">Delete</a>
      </td>
    `;
    return tr;
  }

  function escapeHtml(s = "") {
    return String(s).replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[m])
    );
  }

  addBtn.addEventListener("click", (e) => {
    e.preventDefault();
    // nếu đã có 1 row tạo mới đang tồn tại (chưa save) thì không tạo thêm
    const existingNew = tbody.querySelector("tr[data-new='true']");
    if (existingNew) {
      // existingNew.scrollIntoView({ behavior: "smooth", block: "center" });
      // return;
      // Toggle ẩn hiện
      if (existingNew.style.display === "none") {
        existingNew.style.display = ""; // hiện lại
        existingNew.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        existingNew.style.display = "none"; // ẩn đi
      }
      return;
    }

    const newRow = createInputRow();
    newRow.dataset.new = "true";
    // insert trên cùng
    tbody.prepend(newRow);
    newRow.scrollIntoView({ behavior: "smooth", block: "center" });

    attachRowHandlers(newRow);
  });

  function attachRowHandlers(tr) {
    const saveBtn = tr.querySelector(".save-btn");
    const delBtn = tr.querySelector(".del-btn");

    saveBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      // Lấy values và file
      const name = tr.querySelector('input[name="name"]').value.trim();
      const rank = tr.querySelector('input[name="rank"]').value.trim();
      const position = tr.querySelector('input[name="position"]').value.trim();
      const licensePlate = tr
        .querySelector('input[name="licensePlate"]')
        .value.trim();
      const fileInput = tr.querySelector('input[name="avatar"]');

      // Tạo FormData để gửi file
      const fd = new FormData();
      fd.append("name", name);
      fd.append("rank", rank);
      fd.append("position", position);
      fd.append("licensePlate", licensePlate);
      if (fileInput && fileInput.files && fileInput.files[0]) {
        fd.append("avatar", fileInput.files[0]);
      }

      try {
        const res = await fetch("/quanly/add", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          alert(data.message || "Lỗi khi thêm nhân viên");
          return;
        }

        // Thay hàng input bằng hàng hiển thị bình thường (dùng dữ liệu trả về)
        const saved = data.staff; // mong server trả về staff object vừa lưu
        const displayRow = document.createElement("tr");
        displayRow.dataset.id = saved._id;
        displayRow.innerHTML = `
          <td></td>
          <td>${escapeHtml(saved.name || "")}</td>
          <td><img src="${escapeHtml(saved.avatar || "")}" width="80"></td>
          <td>${escapeHtml(saved.rank || "")}</td>
          <td>${escapeHtml(saved.position || "")}</td>
          <td>${escapeHtml(saved.licensePlate || "")}</td>
          <td>
            <a href="#" class="edit-btn">Edit</a>
            <a href="#" class="delete-btn" data-id="${saved._id}">Delete</a>
          </td>
        `;
        // replace
        tr.replaceWith(displayRow);

        // nếu cần attach handlers giống quanly.js (edit/delete), gọi hàm xử lý từ quanly.js
        if (typeof window.attachQuanLyRowHandlers === "function") {
          window.attachQuanLyRowHandlers(displayRow);
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi mạng khi thêm nhân viên");
      }
    });

    delBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      // nếu hàng chưa save: chỉ remove
      if (tr.dataset.new === "true") {
        tr.remove();
        return;
      }
      // nếu đã save (có id) -> gọi API xóa
      const id = tr.dataset.id;
      if (!id) {
        tr.remove();
        return;
      }
      if (!confirm("Bạn có chắc muốn xóa nhân viên này không?")) return;
      try {
        const res = await fetch(`/quanly/delete/${id}`, { method: "GET" });
        const data = await res.json();
        if (data.success) {
          tr.remove();
        } else {
          alert(data.message || "Xóa thất bại");
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi khi xóa nhân viên");
      }
    });
  }

  // Nếu muốn, attach handler cho những hàng đã có sẵn (khi load page)
  // Expose function để quanly.js gọi lại khi cần
  window.attachQuanLyRowHandlers = (row) => {
    // Reuse quanly.js behavior for edit/delete if needed
    const editBtn = row.querySelector(".edit-btn");
    const deleteBtn = row.querySelector(".delete-btn");

    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        e.preventDefault();
        // Mô phỏng chức năng edit của quanly.js: chuyển thành input
        const tr = editBtn.closest("tr");
        const editColumns = { name: 1, rank: 3, position: 4, licensePlate: 5 };
        const isEditing = editBtn.textContent === "Save";
        if (!isEditing) {
          Object.entries(editColumns).forEach(([key, idx]) => {
            const td = tr.children[idx];
            td.innerHTML = `<input type="text" value="${escapeHtml(
              td.textContent.trim()
            )}" />`;
          });
          editBtn.textContent = "Save";
        } else {
          const updatedData = {};
          Object.entries(editColumns).forEach(([key, idx]) => {
            updatedData[key] = tr.children[idx]
              .querySelector("input")
              .value.trim();
            tr.children[idx].textContent = updatedData[key];
          });
          editBtn.textContent = "Edit";
          // gửi PUT
          fetch(`/quanly/edit/${tr.dataset.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData),
          })
            .then((r) => r.json())
            .then((d) => {
              if (!d.success) alert(d.message || "Cập nhật thất bại");
            })
            .catch((err) => {
              console.error(err);
              alert("Lỗi khi cập nhật");
            });
        }
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const id = deleteBtn.dataset.id;
        if (!confirm("Bạn có chắc muốn xóa nhân viên này không?")) return;
        try {
          const res = await fetch(`/quanly/delete/${id}`, { method: "GET" });
          const data = await res.json();
          if (data.success) deleteBtn.closest("tr").remove();
          else alert(data.message || "Xóa thất bại");
        } catch (err) {
          console.error(err);
          alert("Lỗi khi xóa");
        }
      });
    }
  };

  // Nếu bảng đã có sẵn rows khi load, attach handlers cho mỗi row (nếu muốn)
  document.querySelectorAll("table tbody tr").forEach((r) => {
    window.attachQuanLyRowHandlers(r);
  });
});
