import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import TaskCenter from "@/pages/TaskCenter";
import NewSimulation from "@/pages/NewSimulation";
import RealtimeMonitor from "@/pages/RealtimeMonitor";
import ReportDetail from "@/pages/ReportDetail";
import AlertCenter from "@/pages/AlertCenter";
import RecommendEngine from "@/pages/RecommendEngine";
import ApprovalWorkflow from "@/pages/ApprovalWorkflow";
import RiskManagement from "@/pages/RiskManagement";
import DataExport from "@/pages/DataExport";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<TaskCenter />} />
          <Route path="/tasks/new" element={<NewSimulation />} />
          <Route path="/tasks/:id/monitor" element={<RealtimeMonitor />} />
          <Route path="/tasks/:id/report" element={<ReportDetail />} />
          <Route path="/alerts" element={<AlertCenter />} />
          <Route path="/recommend" element={<RecommendEngine />} />
          <Route path="/approval" element={<ApprovalWorkflow />} />
          <Route path="/risk" element={<RiskManagement />} />
          <Route path="/export" element={<DataExport />} />
        </Route>
      </Routes>
    </Router>
  );
}
