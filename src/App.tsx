import React from "react";
import { Routes, Route } from "react-router-dom";
import { SprintListPage } from "./pages/SprintListPage";
import { SprintDetailPage } from "./pages/SprintDetailPage";
import { StoryDetailPage } from "./pages/StoryDetailPage";
import { SubtaskDetailPage } from "./pages/SubtaskDetailPage";
import { StatsPage } from "./pages/StatsPage";
import { CalendarPage } from "./pages/CalendarPage";
import { TransitionsInfoPage } from "./pages/TransitionsInfoPage";
import { ToastProvider } from "./components/Toast";

export function App(): React.ReactElement {
    return (
        <ToastProvider>
            <Routes>
                <Route path="/" element={<SprintListPage />} />
                <Route path="/sprints/:id" element={<SprintDetailPage />} />
                <Route path="/stories/:id" element={<StoryDetailPage />} />
                <Route path="/subtasks/:id" element={<SubtaskDetailPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/transitions" element={<TransitionsInfoPage />} />
            </Routes>
        </ToastProvider>
    );
}
