/**
 * Name transformation utilities for converting Postgres naming conventions
 * to TypeScript/JavaScript conventions.
 */

/**
 * Converts a snake_case string to PascalCase.
 *
 * @param snakeCase - Input string in snake_case format
 * @returns PascalCase formatted string
 *
 * @example
 * toPascalCase('user_posts') // 'UserPosts'
 * toPascalCase('users') // 'Users'
 * toPascalCase('') // ''
 */
export function toPascalCase(snakeCase: string): string {
  if (!snakeCase) {
    return '';
  }

  return snakeCase
    .split('_')
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join('');
}

/**
 * Converts a snake_case string to camelCase.
 *
 * @param snakeCase - Input string in snake_case format
 * @returns camelCase formatted string
 *
 * @example
 * toCamelCase('created_at') // 'createdAt'
 * toCamelCase('id') // 'id'
 * toCamelCase('') // ''
 */
export function toCamelCase(snakeCase: string): string {
  if (!snakeCase) {
    return '';
  }

  const segments = snakeCase.split('_');

  return segments
    .map((segment, index) => {
      if (index === 0) {
        return segment.toLowerCase();
      }
      return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
    })
    .join('');
}

// Self-test when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // PascalCase tests
  console.assert(toPascalCase('user_posts') === 'UserPosts', 'user_posts -> UserPosts');
  console.assert(toPascalCase('users') === 'Users', 'users -> Users');
  console.assert(toPascalCase('') === '', 'empty -> empty');
  console.assert(toPascalCase('a') === 'A', 'a -> A');
  console.assert(toPascalCase('user_account_settings') === 'UserAccountSettings', 'user_account_settings -> UserAccountSettings');

  // camelCase tests
  console.assert(toCamelCase('created_at') === 'createdAt', 'created_at -> createdAt');
  console.assert(toCamelCase('id') === 'id', 'id -> id');
  console.assert(toCamelCase('') === '', 'empty -> empty');
  console.assert(toCamelCase('user_id') === 'userId', 'user_id -> userId');
  console.assert(toCamelCase('some_long_property_name') === 'someLongPropertyName', 'some_long_property_name -> someLongPropertyName');

  console.log('All name-utils tests passed!');
}
