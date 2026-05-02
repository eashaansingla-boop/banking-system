from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

DB_FILE = "bank_data.json"
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
MONGO_URI = os.getenv("MONGO_URI")

class Bank:
    def __init__(self):
        self.use_mongodb = False
        if MONGO_URI:
            try:
                self.client = MongoClient(MONGO_URI)
                self.db = self.client['banking_system']
                self.collection = self.db['accounts']
                self.use_mongodb = True
                print("Connected to MongoDB")
            except Exception as e:
                print(f"Failed to connect to MongoDB: {e}. Falling back to JSON.")
        
        if not self.use_mongodb:
            if os.path.exists(DB_FILE):
                try:
                    with open(DB_FILE, "r") as f:
                        self.data = json.load(f)
                except (json.JSONDecodeError, IOError):
                    self.data = {}
            else:
                self.data = {}
                self._save()

    def _save(self):
        if not self.use_mongodb:
            with open(DB_FILE, "w") as f:
                json.dump(self.data, f, indent=4)

    def create_account(self, name, acc_id, password, initial_deposit):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        account_data = {
            "name": name,
            "password": password,
            "balance": initial_deposit,
            "transactions": [
                {
                    "type": "Account Created / Initial Deposit",
                    "amount": initial_deposit,
                    "timestamp": timestamp,
                }
            ],
        }

        if self.use_mongodb:
            if self.collection.find_one({"acc_id": acc_id}):
                return False, "Account ID already exists."
            account_data["acc_id"] = acc_id
            self.collection.insert_one(account_data)
        else:
            if acc_id in self.data:
                return False, "Account ID already exists."
            self.data[acc_id] = account_data
            self._save()
            
        return True, "Account created successfully."

    def login(self, acc_id, password):
        if self.use_mongodb:
            user = self.collection.find_one({"acc_id": acc_id})
            if user and user["password"] == password:
                user["_id"] = str(user["_id"]) # Convert ObjectId to string
                return user
        else:
            if acc_id in self.data and self.data[acc_id]["password"] == password:
                return self.data[acc_id]
        return None

    def deposit(self, acc_id, amount):
        if amount <= 0:
            return False, "Invalid amount."
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        txn = {"type": "Deposit", "amount": amount, "timestamp": timestamp}

        if self.use_mongodb:
            result = self.collection.update_one(
                {"acc_id": acc_id},
                {"$inc": {"balance": amount}, "$push": {"transactions": txn}}
            )
            if result.modified_count == 0:
                return False, "Account not found."
        else:
            if acc_id not in self.data:
                return False, "Account not found."
            self.data[acc_id]["balance"] += amount
            self.data[acc_id]["transactions"].append(txn)
            self._save()
            
        return True, "Deposit successful."

    def withdraw(self, acc_id, amount):
        if amount <= 0:
            return False, "Invalid amount."
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        txn = {"type": "Withdrawal", "amount": amount, "timestamp": timestamp}

        if self.use_mongodb:
            user = self.collection.find_one({"acc_id": acc_id})
            if not user:
                return False, "Account not found."
            if user["balance"] < amount:
                return False, "Insufficient funds."
            
            self.collection.update_one(
                {"acc_id": acc_id},
                {"$inc": {"balance": -amount}, "$push": {"transactions": txn}}
            )
        else:
            if acc_id not in self.data:
                return False, "Account not found."
            if self.data[acc_id]["balance"] < amount:
                return False, "Insufficient funds."
            self.data[acc_id]["balance"] -= amount
            self.data[acc_id]["transactions"].append(txn)
            self._save()
            
        return True, "Withdrawal successful."

    def get_all_accounts(self):
        if self.use_mongodb:
            accounts = list(self.collection.find({}, {"_id": 0}))
            return {acc["acc_id"]: acc for acc in accounts}
        return self.data

bank = Bank()

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    success, message = bank.create_account(
        data.get('name'), 
        data.get('acc_id'), 
        data.get('password'), 
        float(data.get('initial_deposit', 0))
    )
    return jsonify({"success": success, "message": message})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = bank.login(data.get('acc_id'), data.get('password'))
    if user:
        return jsonify({"success": True, "user": {
            "acc_id": data.get('acc_id'),
            "name": user['name'],
            "balance": user['balance'],
            "transactions": user['transactions']
        }})
    return jsonify({"success": False, "message": "Invalid credentials."})

@app.route('/api/account/<acc_id>', methods=['GET'])
def get_account(acc_id):
    if bank.use_mongodb:
        user = bank.collection.find_one({"acc_id": acc_id}, {"_id": 0})
        if user:
            return jsonify({"success": True, "user": user})
    else:
        if acc_id in bank.data:
            user = bank.data[acc_id]
            return jsonify({"success": True, "user": {
                "acc_id": acc_id,
                "name": user['name'],
                "balance": user['balance'],
                "transactions": user['transactions']
            }})
    return jsonify({"success": False, "message": "Account not found."})

@app.route('/api/deposit', methods=['POST'])
def deposit():
    data = request.json
    success, message = bank.deposit(data.get('acc_id'), float(data.get('amount')))
    return jsonify({"success": success, "message": message})

@app.route('/api/withdraw', methods=['POST'])
def withdraw():
    data = request.json
    success, message = bank.withdraw(data.get('acc_id'), float(data.get('amount')))
    return jsonify({"success": success, "message": message})

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    if data.get('username') == ADMIN_USERNAME and data.get('password') == ADMIN_PASSWORD:
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "Invalid admin credentials."})

@app.route('/api/admin/accounts', methods=['GET'])
def admin_accounts():
    return jsonify({"success": True, "accounts": bank.get_all_accounts()})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
