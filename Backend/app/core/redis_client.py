import redis
from config import REDIS_HOST, REDIS_PORT

redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    decode_responses=True,
    socket_connect_timeout=2,
    socket_timeout=2
)

# helper function instaed writing it in every router.
def set_cache(key, value, expire=60):
    try:
        redis_client.set(key, value, ex=expire)
    except redis.RedisError:
        pass


def get_cache(key):
    try:
        return redis_client.get(key)
    except redis.RedisError:
        return None


def delete_cache(key):
    try:
        redis_client.delete(key)
    except redis.RedisError:
        pass