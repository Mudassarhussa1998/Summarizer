from pymongo import MongoClient
from os import getenv

client = MongoClient(getenv('MONGO_URI'))
db = client['summarizer_db']
users_collection = db['users']
sessions_collection = db['sessions']
messages_collection = db['messages']
otp_collection = db['otps']
Url_transcripts_collection = db['transcripts']
Video_transcriptions_collection = db["video_transcriptions"]

# New collection for categorical video/URL data
video_data_collection = db['video_data']