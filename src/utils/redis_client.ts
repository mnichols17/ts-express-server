import redis, { ClientOpts } from 'redis';

export const redis_client = process.env.NODE_ENV === 'production'? 
    redis.createClient(process.env.REDIS_URL as ClientOpts) : 
    redis.createClient();
