import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
    cleanup();
});

// jsdom has no ResizeObserver. recharts' ResponsiveContainer needs one to
// exist and won't render into the svg until it reports a size, so the stub
// fires once immediately with a fixed size instead of staying inert.
class ResizeObserverStub {
    private readonly callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
    }

    observe(target: Element): void {
        this.callback(
            [{ target, contentRect: { width: 600, height: 320 } } as ResizeObserverEntry],
            this as unknown as ResizeObserver
        );
    }
}

vi.stubGlobal("ResizeObserver", ResizeObserverStub);
