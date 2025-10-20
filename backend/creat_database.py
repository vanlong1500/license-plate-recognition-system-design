from pymongo import MongoClient
from datetime import datetime, timezone

# --- DỮ LIỆU MẪU (Sử dụng list of dictionaries để chèn nhiều bản ghi) ---

plates_out_samples = [
    {
        "plate": "29A-56789",
        "time_out": datetime(2025, 10, 15, 8, 30, 0, tzinfo=timezone.utc),
        "camera_id": "Cổng Ra 01",
        "ghi_chu": "Bình thường"
    },
    {
        "plate": "30F-11223",
        "time_out": datetime(2025, 10, 15, 14, 45, 0, tzinfo=timezone.utc),
        "camera_id": "Cổng Ra 02",
        "ghi_chu": "Xe tải"
    }
]

plates_enter_samples = [
    {
        "plate": "29A-56789",
        "time_enter": datetime(2025, 10, 15, 8, 0, 0, tzinfo=timezone.utc),
        "camera_id": "Cổng Vào 01",
        "loai_xe": "Ô tô con"
    },
    {
        "plate": "34B-00001",
        "time_enter": datetime(2025, 10, 15, 9, 15, 0, tzinfo=timezone.utc),
        "camera_id": "Cổng Vào 01",
        "loai_xe": "Xe máy"
    }
]

plates_samples = [
    {
        "plate": "29A-56789",
        "owner_name": "Nguyễn Văn An",
        "phone": "0901234567",
        "is_vip": True
    },
    {
        "plate": "34B-00001",
        "owner_name": "Trần Thị Bình",
        "phone": "0987654321",
        "is_vip": False
    }
]

employees_samples = [
    {
        "employee_id": "NV001",
        "name": "Lê Văn Cường",
        "chuc_vu": "Bảo vệ",
        "active": True
    },
    {
        "employee_id": "NV002",
        "name": "Phạm Thị Dung",
        "chuc_vu": "Quản lý",
        "active": True
    }
]

# --- KẾT NỐI VÀ CHÈN DỮ LIỆU ---

# Kết nối
uri = "mongodb://localhost:27017"
connection = MongoClient(uri)

# Chọn database
db = connection["plates"]

# 1. Chèn mẫu vào 'plates_out'
plates_out_col = db["plates_out"]
plates_out_col.insert_many(plates_out_samples)
print(f"Đã chèn {len(plates_out_samples)} bản ghi vào 'plates_out'.")

# 2. Chèn mẫu vào 'plates_enter'
plates_enter_col = db["plates_enter"]
plates_enter_col.insert_many(plates_enter_samples)
print(f"Đã chèn {len(plates_enter_samples)} bản ghi vào 'plates_enter'.")

# 3. Chèn mẫu vào 'plates'
plates_col = db["plates"]
plates_col.insert_many(plates_samples)
print(f"Đã chèn {len(plates_samples)} bản ghi vào 'plates'.")

# 4. Chèn mẫu vào 'employees'
employees_col = db["employees"]
employees_col.insert_many(employees_samples)
print(f"Đã chèn {len(employees_samples)} bản ghi vào 'employees'.")

# Ngắt kết nối (Tùy chọn, nên làm để giải phóng tài nguyên)
connection.close()

print("\nQuá trình tạo 4 collections và chèn dữ liệu mẫu đã hoàn tất.")