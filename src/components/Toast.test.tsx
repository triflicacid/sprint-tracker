import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "./Toast";

function Trigger({ message }: { message: string }): React.ReactElement {
    const { showError } = useToast();
    return <button onClick={() => showError(message)}>trigger</button>;
}

afterEach(() => {
    vi.useRealTimers();
});

describe("ToastProvider / useToast", () => {
    it("shows an error toast when showError is called", async () => {
        render(
            <ToastProvider>
                <Trigger message="failed to update subtask" />
            </ToastProvider>
        );
        await userEvent.click(screen.getByText("trigger"));
        expect(screen.getByText("failed to update subtask")).toBeInTheDocument();
    });

    it("auto-dismisses the toast after its duration", async () => {
        vi.useFakeTimers();
        render(
            <ToastProvider>
                <Trigger message="temporary error" />
            </ToastProvider>
        );
        await act(async () => {
            screen.getByText("trigger").click();
        });
        expect(screen.getByText("temporary error")).toBeInTheDocument();

        await act(async () => {
            vi.advanceTimersByTime(5000);
        });
        expect(screen.queryByText("temporary error")).not.toBeInTheDocument();
    });

    it("supports multiple simultaneous toasts", async () => {
        function TwoTriggers(): React.ReactElement {
            const { showError } = useToast();
            return (
                <button
                    onClick={() => {
                        showError("first");
                        showError("second");
                    }}
                >
                    trigger both
                </button>
            );
        }
        render(
            <ToastProvider>
                <TwoTriggers />
            </ToastProvider>
        );
        await userEvent.click(screen.getByText("trigger both"));
        expect(screen.getByText("first")).toBeInTheDocument();
        expect(screen.getByText("second")).toBeInTheDocument();
    });

    it("throws when useToast is used outside a ToastProvider", () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        function Broken(): React.ReactElement | null {
            useToast();
            return null;
        }
        expect(() => render(<Broken />)).toThrow(/must be used within a ToastProvider/);
        consoleError.mockRestore();
    });
});
