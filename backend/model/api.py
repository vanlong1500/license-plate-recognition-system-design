from bson import ObjectId
from pymongo import MongoClient
import requests
from datetime import datetime, timedelta, timezone

# Kết nối MongoDB
uri = "mongodb://localhost:27017"
connection = MongoClient(uri)

# Chọn database và collection
db = connection["plates"]
plates = db["plates"]      # ← đổi tên rõ ràng
parking = db["parking"]
out = db["plates_out"]
employees = db["employees"]

# xoá plates
def delete_inf_pls(data_del):
    del_id = data_del.get("_id")
    query = {"_id": ObjectId(del_id)}
    plates.delete_one(query)
    return {"đã xoá :" ,del_id}

# lấy thông tin
def get_latest_10_data():
    """Lấy 10 bản ghi mới nhất trong bảng data"""
    # Sắp xếp theo thời gian giảm dần (mới nhất trước), giới hạn 10 bản ghi
    docs = list(plates.find().sort("time", -1).limit(10))

    # Chuyển ObjectId và datetime sang string để JSON hoá dễ dàng
    for doc in docs:
        doc["_id"] = str(doc["_id"])
        if "time" in doc:
            doc["time"] = doc["time"].isoformat()
    
    return docs
# sửa thông tin
def edit_home(new_data):
    try:
        new_data["plateNum"] =int(new_data.get("plateNum"))
        document_id = new_data.get("_id")
        if not document_id:
            return {"success": False, "message": "Thiếu ID"}

        query = {"_id": ObjectId(document_id)}
        new_value = new_data.copy()

        if new_data.get("no_data"):
            emp = employees.find_one({"name": new_data["no_data"],"plateNum": int(new_data.get("plateNum")),"position": new_data["position"],"rank": new_data["rank"]})
            new_value["name"]=new_data.get("no_data")
            new_value.pop("no_data", None)

        else:
            emp = employees.find_one({"name": new_data["name"],"plateNum": int(new_data.get("plateNum")),"position": new_data["position"],"rank": new_data["rank"]})
            new_value["name"]=new_data.get("name")
            new_value.pop("no_data", None)
            
        if emp:
            query_emp = {"_id":emp.get("_id")}
            new_value.pop("_id", None)
            new_value.pop("note", None)
            print("empsave",new_value)
            employees.update_one(query_emp,{"$set":new_value})
            new_data["name"]=emp.get("name")
            new_data["no_data"]=""
        else:
            if "no_data" not in new_data and new_data.get("name"):
                new_data["no_data"] = new_data.get("name")
                new_data["name"] = ""
            elif "no_data" in new_data:
               new_data["name"] = ""
        print("emp",emp)    
        new_data.pop("_id", None)
        print(new_data)
        plates.update_one(query,{"$set":new_data,"$currentDate": {"time": True}})
        return {"success": True, "message": "Cập nhật thành công", "updated": new_data}
    except Exception as e:
        print("❌ Lỗi khi cập nhật:", e)
        return {"success": False, "message": str(e)}

# lấy thông tin ra vào
def data_enter(sta,page,limit):
    print("🔍 Tìm kiếm dữ liệu vào...")
    now = datetime.now(timezone.utc)
    time_24h_ago = now - timedelta(hours=24)
    query = {}       
    query["status"] = sta
    query["time"] = {"$gte": time_24h_ago}
    try:
        page = max(1, int(page))
        limit = max(1, int(limit))
    except (ValueError, TypeError):
        page = 1
        limit = 2
    # tài liệu khớp
    skip_count = (page - 1) * limit
    total_docs = plates.count_documents(query)
    docs_cursor = plates.find(query) \
                        .sort("time", -1) \
                        .skip(skip_count) \
                        .limit(limit)
                        
    docs = list(docs_cursor)
    total_pages = (total_docs + limit - 1) // limit 
    
    for doc in docs:
        doc["_id"] = str(doc["_id"]) 
        if "time" in doc and isinstance(doc["time"], datetime):
            # Chuyển đổi datetime object sang chuỗi ISO để gửi về FE
            doc["time"] = doc["time"].isoformat() 

    print(f"✅ Tìm thấy {len(docs)} bản ghi trong tổng số {total_docs} trong 24h.")
    
    return {
        "data": docs,
        "pagination": {
            "total_records": total_docs,
            "total_pages": total_pages,
            "current_page": page,
            "page_size": limit
        }
    }

# auto complete
def find_all_emp():
    employees_cursor = employees.find({}, {"name": 1, "_id": 1}) # Giả sử bạn đang dùng hàm này
    employee_list = []
    for emp in employees_cursor:
        # Chuyển đổi ObjectId sang chuỗi trước khi thêm vào list
        emp['_id'] = str(emp['_id'])
        employee_list.append(emp)
    return employee_list

def find_plsNB(NB):
    number=NB.get("plateNum")
    query = {"plateNum":int(number)}

    docs = list(plates.find(query).sort("time", -1))

    # Chuyển ObjectId và datetime sang string để JSON hoá dễ dàng
    for doc in docs:
        doc["_id"] = str(doc["_id"])
        if "time" in doc:
            doc["time"] = doc["time"].isoformat()
    
    return docs

def find_data_plates(find):
    inf = find.get("name")
    Start_day = find.get("Start_day")
    End_day = find.get("End_day")
    status = find.get("status")

    try:
        if Start_day.endswith('Z'):
            start_day_dt = datetime.fromisoformat(Start_day.replace('Z', '+00:00'))
        else:
            start_day_dt = datetime.fromisoformat(Start_day)

        if End_day.endswith('Z'):
            end_day_dt = datetime.fromisoformat(End_day.replace('Z', '+00:00'))
        else:
            end_day_dt = datetime.fromisoformat(End_day)
    except ValueError as e:
        print(f"Lỗi định dạng thời gian: {e}")
        return {"error": "Định dạng thời gian không hợp lệ."}
    query = {
        "time": { # Thay thế bằng TÊN TRƯỜNG 
            "$gte": start_day_dt,
            "$lte": end_day_dt  
        }
    }
    if inf:
        emp_find= employees.find({"name":inf})
        if emp_find :
            query["name"]=inf
        else:
            query["no_data"]=inf
    if status:
        query["status"]=status
    find_inf_pls= plates.find(query)
    results = list(find_inf_pls)
    so_ban_ghi = len(results)
    print(f"Số bản ghi tìm thấy: {so_ban_ghi}") 
    data_rs = to_json_safe(results)
    return data_rs

def to_json_safe(data):
    """Đảm bảo các trường ObjectId và datetime được chuyển thành chuỗi."""
    if isinstance(data, dict):
        return {k: to_json_safe(v) for k, v in data.items()}
    if isinstance(data, list):
        return [to_json_safe(v) for v in data]
    if isinstance(data, ObjectId):
        return str(data)
    if isinstance(data, datetime):
        return data.isoformat()
    return data
