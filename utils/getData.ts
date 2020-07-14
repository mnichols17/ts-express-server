import db from './db';

export const getData = async(text: string, values?: (string|number)[]) => {
    const {rows} = await db.query(text, values)
    return rows;
}