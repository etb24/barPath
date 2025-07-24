from dotenv import load_dotenv
import os
import firebase_admin
from firebase_admin import credentials, storage, firestore, auth

load_dotenv()

firebase_creds_path = os.getenv("FIREBASE_CREDENTIALS")
firebase_bucket_name = os.getenv("FIREBASE_STORAGE_BUCKET")


cred = credentials.Certificate(firebase_creds_path)

firebase_admin.initialize_app(cred, {
'storageBucket': firebase_bucket_name
})

bucket = storage.bucket()