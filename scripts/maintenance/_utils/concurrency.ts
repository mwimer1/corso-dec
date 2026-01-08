import pLimit from 'p-limit';

export const limit = pLimit(process.env['CI'] ? 2 : 4);



