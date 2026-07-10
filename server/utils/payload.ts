export function getFirst(value: string | string[]) {
    return typeof value === "string" ? value : value[0];
}