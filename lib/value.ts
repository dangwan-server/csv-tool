export function toFloat(value: string) {
    return isNaN(parseFloat(value)) ? 0 : parseFloat(value);
}

export function toInt(value: string): Number {
    return isNaN(parseInt(value)) ? 0 : parseInt(value);
}
