/**
 * returns the first value from an express payload field.
 *
 * @param value - single value or value array from params or query.
 * @returns the first string value.
 */
export function getFirst(value: string | string[]) {
    return typeof value === "string" ? value : value[0];
}