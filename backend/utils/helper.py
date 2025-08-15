def serialize_user(user):
    user['_id'] = str(user['_id'])
    return user
