export function capitalizeFirstLetter(val: string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export function addSpaceBeforeUppercase(val: string) {
    if (!val) return '';
    return val.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/-/g, ' ');
}

export function capitalizeWords(val: string) {
    return String(val)
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
