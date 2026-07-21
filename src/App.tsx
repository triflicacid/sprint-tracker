import React from "react";
import { Routes, Route } from "react-router-dom";
import { SprintListPage } from "./pages/SprintListPage";
import { SprintDetailPage } from "./pages/SprintDetailPage";
import { StoryDetailPage } from "./pages/StoryDetailPage";
import { SubtaskDetailPage } from "./pages/SubtaskDetailPage";
import { StatsPage } from "./pages/StatsPage";
import { TransitionsInfoPage } from "./pages/TransitionsInfoPage";
import { CategoriesInfoPage } from "./pages/CategoriesInfoPage";
import { ExportPage } from "./pages/ExportPage";
import { TimesheetPage } from "./pages/TimesheetPage";
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
                <Route path="/stats/:sprintId" element={<StatsPage />} />
                <Route path="/timesheet" element={<TimesheetPage />} />
                <Route path="/transitions" element={<TransitionsInfoPage />} />
                <Route path="/categories" element={<CategoriesInfoPage />} />
                <Route path="/export" element={<ExportPage />} />
            </Routes>
        </ToastProvider>
    );
}
