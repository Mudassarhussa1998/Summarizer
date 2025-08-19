from bson import ObjectId

def serialize_user(user):
    user['_id'] = str(user['_id'])
    return user

def serialize_mongo_doc(doc):
    """Convert MongoDB document to JSON serializable format."""
    if doc is None:
        return None
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, dict):
                result[key] = serialize_mongo_doc(value)
            elif isinstance(value, list):
                result[key] = [serialize_mongo_doc(item) if isinstance(item, dict) else str(item) if isinstance(item, ObjectId) else item for item in value]
            else:
                result[key] = value
        return result
    return doc
