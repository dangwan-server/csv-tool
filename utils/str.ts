export default class Str {
    static toSnake(str: string) {
        return str.replace(/_(\w)/g, (_all, letter) => letter.toUpperCase());
    }

    static toLine(str: string) {
        return (
            str.substring(0, 1).toLowerCase() +
            str.substring(1).replace(/([A-Z])/g, (_all, letter) => {
                return "_" + letter.toLowerCase();
            })
        );
    }

    static hasPrefix(str: string, preFix: string) {
        return str.substring(0, preFix.length) == preFix;
    }

    static hasSubfix(str: string, preFix: string) {
        return str.substring(str.length - preFix.length) == preFix;
    }

    static trimSubfix(str: string, subFix: string) {
        if (!Str.hasSubfix(str, subFix)) {
            return str;
        }

        return str.substring(0, str.length - subFix.length);
    }

    static trimPrefix(str: string, preFix: string) {
        if (!Str.hasPrefix(str, preFix)) {
            return str;
        }

        return str.substring(preFix.length);
    }

    static ucFirst(str: string) {
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    static lcFirst(str: string) {
        return str.substring(0, 1).toLowerCase() + str.substring(1);
    }
}
