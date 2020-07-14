import {Pool} from 'pg';
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: 'localhost',
    database: 'ts',
    password: process.env.DB_PASS,
    port: 5432
});

export default {
    query: (text: string, params: undefined | Array<string | number>) => pool.query(text, params)
}