import mongoSanitize from 'mongo-sanitize';
import xssClean from 'xss-clean';

console.log('mongoSanitize type:', typeof mongoSanitize);
console.log('xssClean type:', typeof xssClean);

try {
    const sanitizeResult = mongoSanitize({ $gt: '' });
    console.log('mongoSanitize call success:', sanitizeResult);
} catch (e) {
    console.error('mongoSanitize call failed:', e.message);
}

try {
    const xssResult = xssClean();
    console.log('xssClean call success:', typeof xssResult);
} catch (e) {
    console.error('xssClean call failed:', e.message);
}
