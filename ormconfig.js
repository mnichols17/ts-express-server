module.exports = {
    "type": "postgres",
    "host": "localhost",
    "port": 5432,
    "username": process.env.TYPEORM_USERNAME,
    "password": process.env.TYPEORM_PASSWORD,
    "database": "ts",
    "synchronize": false,
    "logging": false,
    "entities": [
        "src/entity/**/*.ts"
    ],
    "migrations": [
        "src/migration/**/*.ts"
    ],
    "subscribers": [
        "src/subscriber/**/*.ts"
    ]
}