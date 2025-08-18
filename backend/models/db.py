from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client['your_database']
users_collection = db['users']
sessions_collection = db['sessions']
messages_collection = db['messages']
otp_collection = db['otps']
transcripts_collection = db['transcripts']
