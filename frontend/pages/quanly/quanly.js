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
        <td class="avatar-cell">
          <div class="avatar-wrapper" style="position: relative; display: inline-block;">
            <img src="${
              s.avatar
            }" width="80" class="avatar-img" style="border-radius: 8px; object-fit: cover;">
            <div class="change-overlay" 
                style="position: absolute; top:0; left:0; width:100%; height:100%; 
                        display:flex; align-items:center; justify-content:center; 
                        background: rgba(0,0,0,0.6); color:white; font-size:12px; 
                        opacity:0; transition:0.3s; cursor:pointer;">
              +
            </div>
          </div>
        </td>
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
          // Thêm hiệu ứng cho ảnh
          // Chỉ bật hover cho ảnh của hàng đang edit
          const wrap = tr.querySelector(".avatar-wrapper");
          const overlay = wrap.querySelector(".change-overlay");
          // wrap.addEventListener(
          //   "mouseenter",
          //   () => (overlay.style.opacity = "1")
          // );
          // wrap.addEventListener(
          //   "mouseleave",
          //   () => (overlay.style.opacity = "0")
          // );
          // lưu handler để remove sau
          const enterHandler = () => (overlay.style.opacity = "1");
          const leaveHandler = () => (overlay.style.opacity = "0");
          wrap.addEventListener("mouseenter", enterHandler);
          wrap.addEventListener("mouseleave", leaveHandler);
          // lưu reference vào row để remove sau khi Save
          tr._hoverHandlers = { enterHandler, leaveHandler };
          //
          // 📸 Thêm chọn file khi click overlay
          const fileInput = document.createElement("input");
          fileInput.type = "file";
          fileInput.accept = "image/*";
          fileInput.style.display = "none"; // ẩn input
          // Lưu tạm vào hàng để xài khi Save
          tr._pendingAvatarFile = null;

          // Khi click overlay → mở hộp chọn ảnh
          overlay.addEventListener("click", () => {
            fileInput.click();
          });

          // Khi chọn file xong → hiển thị preview tạm
          fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return; // người dùng cancel chọn ảnh
            tr._pendingAvatarFile = file; // gắn file vào hàng

            const img = wrap.querySelector(".avatar-img");
            const reader = new FileReader();
            reader.onload = (event) => {
              img.src = event.target.result; // đổi preview tạm thời
            };
            reader.readAsDataURL(file);
          });
          // -------------
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
          // Xóa listener hover khi edit xong
          if (tr._hoverHandlers) {
            const { enterHandler, leaveHandler } = tr._hoverHandlers;
            const wrap = tr.querySelector(".avatar-wrapper");
            wrap.removeEventListener("mouseenter", enterHandler);
            wrap.removeEventListener("mouseleave", leaveHandler);
            tr._hoverHandlers = null;
          }
          //
          //
          if (unchanged) return; // không cần gửi request nếu ko đổi

          // Nếu có thay đổi, gửi request PUT
          // try {
          //   const res = await fetch(`/quanly/edit/${tr.dataset.id}`, {
          //     method: "PUT",
          //     headers: { "Content-Type": "application/json" },
          //     body: JSON.stringify(updatedData),
          //   });
          //   const data = await res.json();
          //   if (!data.success) {
          //     alert(data.message);
          //   }
          // } catch (err) {
          //   console.error(err);
          //   alert("Lỗi khi cập nhật nhân viên");
          // }
          try {
            const formData = new FormData();

            // Thêm các trường text
            Object.entries(updatedData).forEach(([key, value]) => {
              formData.append(key, value);
            });

            // Nếu có file ảnh mới thì thêm file
            if (tr._pendingAvatarFile) {
              formData.append("avatar", tr._pendingAvatarFile);
            }

            const res = await fetch(`/quanly/edit/${tr.dataset.id}`, {
              method: "PUT",
              body: formData, // không cần header JSON nữa
            });

            const data = await res.json();
            if (!data.success) {
              alert(data.message);
            } else {
              console.log("Cập nhật thành công");
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
