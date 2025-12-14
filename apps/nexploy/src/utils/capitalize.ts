export function capitalizeFirstLetter(val: string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export function addSpaceBeforeUppercase(val: string) {
    return val.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/-/g, ' ');
}

export function capitalizeWords(val: string) {
    return String(val)
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function capitalizeOnlyFirst(val: string) {
    const lower = String(val).toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function toDisplayLabel(val: string) {
    return String(val)
        .split(/[_\-\s]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}
