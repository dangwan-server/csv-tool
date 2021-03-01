import { isComment } from "./func";

export class Heap {
    items: string[] = [];

    push(val: string) {
        this.items.push(val);
    }

    pop(): string {
        return this.items.pop() || "";
    }

    len() {
        return this.items.length;
    }

    isEmpty() {
        return this.len() == 0;
    }
}

export class VarHeapManage {
    varHeap: Heap;
    commentHeap: Heap;
    couter = 0;

    constructor() {
        this.varHeap = new Heap();
        this.commentHeap = new Heap();
    }

    push(val: string) {
        if (this.couter % 2 == 0) {
            //本来应该是注释的
            if (isComment(val)) {
                this.commentHeap.push(val);
            } else {
                this.commentHeap.push("");
                this.varHeap.push(val);
                this.couter++;
            }
        } else {
            this.varHeap.push(val);
        }

        this.couter++;
    }

    pop() {
        const varLine = this.varHeap.pop();
        const commentLine = this.commentHeap.pop();
        return {
            varLine,
            commentLine,
        };
    }

    isEmpty() {
        return this.varHeap.isEmpty();
    }
}
