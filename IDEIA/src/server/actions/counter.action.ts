import { LiveAction } from "../live-action";

export class Counter extends LiveAction {
    public static override readonly name = 'counter';

    public count = 0;

    public increment() {
        this.count++;
    }

    public decrement() {
        this.count--;
    }
}

LiveAction.add(Counter);
