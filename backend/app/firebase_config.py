import firebase_admin
from firebase_admin import credentials, storage

from app.config import settings

cred = credentials.Certificate(settings.firebase_credentials)

firebase_admin.initialize_app(cred, {
    "storageBucket": settings.firebase_storage_bucket,
})

bucket = storage.bucket()