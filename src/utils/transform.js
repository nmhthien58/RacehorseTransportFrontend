import _ from 'lodash';

/**
 * @file transform.js
 * @description Bộ chuyển đổi dữ liệu hai chiều giữa PascalCase (DB schema / FE) và camelCase (BE API)
 */

/**
 * Chuyển một key chuỗi từ camelCase sang PascalCase khớp quy ước DB schema.
 * Các trường ID như userId -> UserID, horseId -> HorseID.
 * Các trường Url như photoUrl -> PhotoUrl.
 * @param {string} key
 * @returns {string}
 */
export function keyToPascalCase(key) {
  if (!key || typeof key !== 'string') return key;
  const pascal = _.upperFirst(key);
  // Thay thế đuôi Id thành ID (trừ khi là chính từ Id)
  return pascal.replace(/Id$/, 'ID');
}

/**
 * Chuyển một key chuỗi từ PascalCase sang camelCase theo chuẩn RESTful API của BE.
 * @param {string} key
 * @returns {string}
 */
export function keyToCamelCase(key) {
  if (!key || typeof key !== 'string') return key;
  return _.camelCase(key);
}

/**
 * Chuyển đổi đệ quy object/array từ camelCase sang PascalCase cho Frontend sử dụng.
 * Đồng thời giữ lại key gốc nếu khác để đảm bảo tương thích 100% với cả 2 cách truy xuất.
 * @param {any} data
 * @returns {any}
 */
export function toPascalCase(data) {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (data instanceof Date || data instanceof RegExp) return data;
  if (typeof FormData !== 'undefined' && data instanceof FormData) return data;
  if (typeof Blob !== 'undefined' && data instanceof Blob) return data;

  if (Array.isArray(data)) {
    return data.map(toPascalCase);
  }

  const result = {};
  for (const [key, value] of Object.entries(data)) {
    const pascalKey = keyToPascalCase(key);
    const transformedValue = toPascalCase(value);

    result[pascalKey] = transformedValue;
    if (pascalKey !== key) {
      result[key] = transformedValue;
    }
  }

  // Hỗ trợ envelope tiêu chuẩn của BE: { success, message, data, pagination, errors }
  if ('data' in result && !('Data' in result)) {
    result.Data = result.data;
  }
  if ('pagination' in result && !('Pagination' in result)) {
    result.Pagination = result.pagination;
  }
  if ('success' in result && !('Success' in result)) {
    result.Success = result.success;
  }
  if ('message' in result && !('Message' in result)) {
    result.Message = result.message;
  }

  return result;
}

/**
 * Chuyển đổi đệ quy object/array từ PascalCase sang camelCase trước khi gửi lên Backend.
 * Bỏ qua FormData, File, Blob và các kiểu nguyên thủy.
 * @param {any} data
 * @returns {any}
 */
export function toCamelCase(data) {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (data instanceof Date || data instanceof RegExp) return data;
  if (typeof FormData !== 'undefined' && data instanceof FormData) return data;
  if (typeof Blob !== 'undefined' && data instanceof Blob) return data;

  if (Array.isArray(data)) {
    return data.map(toCamelCase);
  }

  const result = {};
  for (const [key, value] of Object.entries(data)) {
    const camelKey = keyToCamelCase(key);
    result[camelKey] = toCamelCase(value);
  }
  return result;
}

export default {
  keyToPascalCase,
  keyToCamelCase,
  toPascalCase,
  toCamelCase,
};
