import { compositions } from '~/server/data/db';

export default defineEventHandler(async (event) => {
    return compositions;
});