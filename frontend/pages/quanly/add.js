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
    const delBtn = tr.querySelector(".delete-btn");

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
          <td class="avatar-cell">
            <div class="avatar-wrapper" style="position: relative; display: inline-block;">
              <img src="${escapeHtml(
                saved.avatar || ""
              )}" width="80" class="avatar-img" style="border-radius:8px; object-fit:cover;">
              <div class="change-overlay" 
                  style="position:absolute; top:0; left:0; width:100%; height:100%; 
                          display:flex; align-items:center; justify-content:center; 
                          background: rgba(0,0,0,0.6); color:white; font-size:12px; 
                          opacity:0; transition:0.3s; cursor:pointer;">
                +
              </div>
            </div>
          </td>
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
  // window.attachQuanLyRowHandlers = (row) => {
  //   // Reuse quanly.js behavior for edit/delete if needed
  //   const editBtn = row.querySelector(".edit-btn");
  //   const deleteBtn = row.querySelector(".delete-btn");

  //   if (editBtn) {
  //     editBtn.addEventListener("click", (e) => {
  //       e.preventDefault();
  //       // Mô phỏng chức năng edit của quanly.js: chuyển thành input
  //       const tr = editBtn.closest("tr");
  //       const editColumns = { name: 1, rank: 3, position: 4, licensePlate: 5 };
  //       const isEditing = editBtn.textContent === "Save";
  //       if (!isEditing) {
  //         Object.entries(editColumns).forEach(([key, idx]) => {
  //           const td = tr.children[idx];
  //           td.innerHTML = `<input type="text" value="${escapeHtml(
  //             td.textContent.trim()
  //           )}" />`;
  //         });
  //         editBtn.textContent = "Save";
  //       } else {
  //         const updatedData = {};
  //         Object.entries(editColumns).forEach(([key, idx]) => {
  //           updatedData[key] = tr.children[idx]
  //             .querySelector("input")
  //             .value.trim();
  //           tr.children[idx].textContent = updatedData[key];
  //         });
  //         editBtn.textContent = "Edit";
  //         // gửi PUT
  //         fetch(`/quanly/edit/${tr.dataset.id}`, {
  //           method: "PUT",
  //           headers: { "Content-Type": "application/json" },
  //           body: JSON.stringify(updatedData),
  //         })
  //           .then((r) => r.json())
  //           .then((d) => {
  //             if (!d.success) alert(d.message || "Cập nhật thất bại");
  //           })
  //           .catch((err) => {
  //             console.error(err);
  //             alert("Lỗi khi cập nhật");
  //           });
  //       }
  //     });
  //   }

  //   if (deleteBtn) {
  //     deleteBtn.addEventListener("click", async (e) => {
  //       e.preventDefault();
  //       const id = deleteBtn.dataset.id;
  //       if (!confirm("Bạn có chắc muốn xóa nhân viên này không?")) return;
  //       try {
  //         const res = await fetch(`/quanly/delete/${id}`, { method: "GET" });
  //         const data = await res.json();
  //         if (data.success) deleteBtn.closest("tr").remove();
  //         else alert(data.message || "Xóa thất bại");
  //       } catch (err) {
  //         console.error(err);
  //         alert("Lỗi khi xóa");
  //       }
  //     });
  //   }
  // };
  // Reusable handlers (replace the old window.attachQuanLyRowHandlers)
  window.attachQuanLyRowHandlers = (row) => {
    if (!row) return;
    const editBtn = row.querySelector(".edit-btn");
    const deleteBtn = row.querySelector(".delete-btn");

    // Helper escape (nếu chưa có)
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

    // EDIT handler (mimic quanly.js)
    if (editBtn) {
      editBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const tr = editBtn.closest("tr");
        const isEditing = editBtn.textContent === "Save";
        const editColumns = { name: 1, rank: 3, position: 4, licensePlate: 5 };

        // Ensure dataset.id exists (if not, can't PUT)
        const id = tr.dataset.id;

        if (!isEditing) {
          // Enter edit mode: save original values
          tr._originalData = {};
          Object.entries(editColumns).forEach(([key, idx]) => {
            const td = tr.children[idx];
            tr._originalData[key] = td.textContent.trim();
            td.innerHTML = `<input type="text" value="${escapeHtml(
              tr._originalData[key]
            )}" class="form-control" />`;
          });

          // Save original avatar src
          const wrap = tr.querySelector(".avatar-wrapper");
          const img = wrap ? wrap.querySelector(".avatar-img") : null;
          tr._originalAvatar = img ? img.src : "";

          // Add hover handlers for overlay
          const overlay = wrap ? wrap.querySelector(".change-overlay") : null;
          const enterHandler = () => (overlay.style.opacity = "1");
          const leaveHandler = () => (overlay.style.opacity = "0");
          if (wrap && overlay) {
            wrap.addEventListener("mouseenter", enterHandler);
            wrap.addEventListener("mouseleave", leaveHandler);
            tr._hoverHandlers = { enterHandler, leaveHandler };
          }

          // Create hidden file input for selecting new avatar
          const fileInput = document.createElement("input");
          fileInput.type = "file";
          fileInput.accept = "image/*";
          fileInput.style.display = "none";
          // pending file reference
          tr._pendingAvatarFile = null;

          // When overlay clicked, open file dialog
          if (overlay) {
            const onOverlayClick = () => fileInput.click();
            overlay.addEventListener("click", onOverlayClick);
            // keep ref to remove later
            tr._overlayClickHandler = onOverlayClick;
          }

          // When user selects a file -> preview immediately (dataURL)
          fileInput.addEventListener("change", (ev) => {
            const file = ev.target.files[0];
            if (!file) return;
            tr._pendingAvatarFile = file;
            if (img) {
              const reader = new FileReader();
              reader.onload = (event) => (img.src = event.target.result);
              reader.readAsDataURL(file);
            }
          });

          // Attach hidden file input to the row so it's GC'd with the row
          tr._fileInput = fileInput;
          tr.appendChild(fileInput);

          editBtn.textContent = "Save";
        } else {
          // Save mode
          const updatedData = {};
          Object.entries(editColumns).forEach(([key, idx]) => {
            const input = tr.children[idx].querySelector("input");
            updatedData[key] = input ? input.value.trim() : "";
          });

          // Restore uIs immediately in DOM (optimistic UI) but keep original in case of failure
          Object.entries(editColumns).forEach(([key, idx]) => {
            tr.children[idx].textContent = updatedData[key];
          });

          // Remove hover handlers & overlay click
          if (tr._hoverHandlers) {
            const { enterHandler, leaveHandler } = tr._hoverHandlers;
            const wrap = tr.querySelector(".avatar-wrapper");
            if (wrap) {
              wrap.removeEventListener("mouseenter", enterHandler);
              wrap.removeEventListener("mouseleave", leaveHandler);
            }
            tr._hoverHandlers = null;
          }
          if (tr._overlayClickHandler) {
            const overlay = tr.querySelector(".change-overlay");
            if (overlay)
              overlay.removeEventListener("click", tr._overlayClickHandler);
            tr._overlayClickHandler = null;
          }

          editBtn.textContent = "Edit";

          // Detect if anything changed (including avatar)
          const changedText = Object.entries(editColumns).some(
            ([k]) => tr._originalData && tr._originalData[k] !== updatedData[k]
          );
          const changedAvatar = !!tr._pendingAvatarFile;

          if (!changedText && !changedAvatar) {
            // nothing changed -> just cleanup file input and return
            if (tr._fileInput) tr._fileInput.remove();
            tr._pendingAvatarFile = null;
            return;
          }

          // Build FormData for partial update (server handles partial $set)
          try {
            const formData = new FormData();
            Object.entries(updatedData).forEach(([k, v]) => {
              formData.append(k, v);
            });
            if (changedAvatar && tr._pendingAvatarFile) {
              formData.append("avatar", tr._pendingAvatarFile);
            }

            // require id to send PUT
            if (!id) {
              console.warn(
                "No id for row, cannot PUT. Consider creating first."
              );
              // fallback: if no id, restore original DOM
              if (tr._fileInput) tr._fileInput.remove();
              tr._pendingAvatarFile = null;
              return;
            }

            const res = await fetch(`/quanly/edit/${id}`, {
              method: "PUT",
              body: formData,
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
              // On failure, revert UI to original values
              Object.entries(editColumns).forEach(([key, idx]) => {
                tr.children[idx].textContent = tr._originalData[key] || "";
              });
              // revert avatar preview
              const wrap = tr.querySelector(".avatar-wrapper");
              const img = wrap ? wrap.querySelector(".avatar-img") : null;
              if (img && tr._originalAvatar) img.src = tr._originalAvatar;
              alert(data.message || "Cập nhật thất bại");
              return;
            }

            // On success: if server returned new avatar path, update img src
            if (data.avatar) {
              const wrap = tr.querySelector(".avatar-wrapper");
              const img = wrap ? wrap.querySelector(".avatar-img") : null;
              if (img) img.src = data.avatar;
            }

            // cleanup
            if (tr._fileInput) tr._fileInput.remove();
            tr._pendingAvatarFile = null;
            tr._originalData = null;
            tr._originalAvatar = null;
          } catch (err) {
            console.error(err);
            alert("Lỗi khi cập nhật nhân viên");
            // revert UI
            Object.entries(editColumns).forEach(([key, idx]) => {
              tr.children[idx].textContent = tr._originalData[key] || "";
            });
            const wrap = tr.querySelector(".avatar-wrapper");
            const img = wrap ? wrap.querySelector(".avatar-img") : null;
            if (img && tr._originalAvatar) img.src = tr._originalAvatar;
          }
        }
      });
    }

    // DELETE handler (reuse behavior)
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const id = deleteBtn.dataset.id;
        if (!id) {
          // If no id (unsaved row), just remove DOM
          deleteBtn.closest("tr").remove();
          return;
        }
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
