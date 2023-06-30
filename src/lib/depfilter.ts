export class DepFilter {
    source: string;
    target: string;

    constructor(source: string, target: string) {
        this.source = source;
        this.target = target;
    }

    match(source: string, target: string): boolean {
        const sourceMatch = this.source === '*' || this.source === source;
        const targetMatch = this.target === '*' || this.target === target;
        return targetMatch && sourceMatch;
    }
}
