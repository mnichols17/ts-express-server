module.exports = process.env.NODE_ENV ? {
    "type": "postgres",
    "host": "localhost", // DEVELOPMENT
    "port": 5432, // DEVELOPMENT
    "username": process.env.TYPEORM_USERNAME, // DEVELOPMENT
    "password": process.env.TYPEORM_PASSWORD, // DEVELOPMENT
    "database": "ts", // DEVELOPMENT
    "synchronize": false,
    "logging": false,
    "entities": [
        "src/entity/**/*.ts", // DEVELOPMENT
    ],
    "migrations": [
        "dist/migration/**/*.js"
    ],
    "subscribers": [
        "dist/subscriber/**/*.js"
    ]
} : {
    "type": "postgres",
    "url": process.env.DATABASE_URL, // PRODUCTION
    "synchronize": false,
    "logging": false,
    "entities": [
       "dist/src/entity/**/*.js", // PRODUCTION
    ],
    "migrations": [
        "dist/migration/**/*.js"
    ],
    "subscribers": [
        "dist/subscriber/**/*.js"
    ]
}